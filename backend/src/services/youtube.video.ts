// src/services/youtube.video.ts
import { google } from "googleapis";
import { getAuthorizedClientForUser } from "./google";
import { logEvent } from "../lib/logger";

export type VideoDetails = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
  status: {
    privacyStatus?: string;
    uploadStatus?: string;
    license?: string;
    embeddable?: boolean;
  };
  statistics: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
  contentDetails: {
    duration?: string; // ISO8601 e.g. PT4M20S
    definition?: string;
    caption?: string;
  };
  publishedAt?: string;
};

export async function fetchVideoDetails(
  userId: string,
  videoId: string,
  correlationId?: string
): Promise<VideoDetails | null> {
  const auth = await getAuthorizedClientForUser(userId, correlationId);
  const youtube = google.youtube({ version: "v3", auth });

  const started = Date.now();
  try {
    const res = await youtube.videos.list({
      id: [videoId],
      part: ["snippet", "contentDetails", "statistics", "status"],
    });

    await logEvent?.({
      event: "YOUTUBE_API_CALL",
      source: "youtube",
      correlationId,
      target: { videoId },
      metadata: { api: "videos.list", items: res.data.items?.length ?? 0 },
      response: { status: 200, durationMs: Date.now() - started },
    });

    const v = res.data.items?.[0];
    if (!v) return null;

    const out: VideoDetails = {
      id: v.id!,
      title: v.snippet?.title ?? "",
      description: v.snippet?.description ?? "",
      channelTitle: v.snippet?.channelTitle ?? "",
      thumbnails:
        (v.snippet?.thumbnails as Record<
          string,
          { url: string; width?: number; height?: number }
        >) ?? {},
      status: {
        privacyStatus: v.status?.privacyStatus as string | undefined,
        uploadStatus: v.status?.uploadStatus as string | undefined,
        license: v.status?.license as string | undefined,
        embeddable: v.status?.embeddable as boolean | undefined,
      },
      statistics: {
        viewCount: v.statistics?.viewCount
          ? Number(v.statistics.viewCount)
          : undefined,
        likeCount: v.statistics?.likeCount
          ? Number(v.statistics.likeCount)
          : undefined,
        commentCount: v.statistics?.commentCount
          ? Number(v.statistics.commentCount)
          : undefined,
      },
      contentDetails: {
        duration: v.contentDetails?.duration as string | undefined,
        definition: v.contentDetails?.definition as string | undefined,
        caption: v.contentDetails?.caption as string | undefined,
      },
      publishedAt: v.snippet?.publishedAt as string | undefined,
    };

    return out;
  } catch (err: any) {
    await logEvent?.({
      level: "error",
      event: "YOUTUBE_API_CALL",
      source: "youtube",
      correlationId,
      target: { videoId },
      metadata: { api: "videos.list" },
      response: { status: err?.code || 500, errorMessage: err?.message },
    });
    throw err;
  }
}

type UpdatePayload = { title?: string; description?: string };

/**
 * Updates a video's title/description.
 * We first fetch the current snippet to preserve required fields (e.g., categoryId),
 * then send a minimal videos.update.
 */
export async function updateVideoTitleDescription(
  userId: string,
  videoId: string,
  updates: UpdatePayload,
  correlationId?: string
) {
  if (!updates.title && !updates.description) {
    throw new Error("Nothing to update: provide title and/or description");
  }

  const auth = await getAuthorizedClientForUser(userId, correlationId);
  const youtube = google.youtube({ version: "v3", auth });

  // 1) Fetch existing snippet to retain categoryId and other fields we aren't changing.
  const startedFetch = Date.now();
  const listRes = await youtube.videos.list({
    id: [videoId],
    part: ["snippet"],
  });

  await logEvent?.({
    event: "YOUTUBE_API_CALL",
    source: "youtube",
    correlationId,
    target: { videoId },
    metadata: { api: "videos.list", items: listRes.data.items?.length ?? 0 },
    response: { status: 200, durationMs: Date.now() - startedFetch },
  });

  const current = listRes.data.items?.[0];
  if (!current || !current.snippet)
    throw new Error("Video not found or snippet missing");

  // Merge changes
  const newSnippet = {
    ...current.snippet,
    title: updates.title ?? current.snippet.title,
    description: updates.description ?? current.snippet.description,
    categoryId: current.snippet.categoryId, // keep existing to avoid API errors
  };

  // videos.update requires the full resource for the parts you update
  const startedUpdate = Date.now();
  const updateRes = await youtube.videos.update({
    part: ["snippet"],
    requestBody: {
      id: videoId,
      snippet: {
        categoryId: newSnippet.categoryId,
        title: newSnippet.title,
        description: newSnippet.description,
      },
    },
  });

  await logEvent?.({
    event: "YOUTUBE_API_CALL",
    source: "youtube",
    correlationId,
    target: { videoId },
    metadata: { api: "videos.update", part: "snippet" },
    response: { status: 200, durationMs: Date.now() - startedUpdate },
  });

  // Return the updated fields
  return {
    id: updateRes.data.id || videoId,
    title: updateRes.data.snippet?.title ?? newSnippet.title,
    description: updateRes.data.snippet?.description ?? newSnippet.description,
  };
}
