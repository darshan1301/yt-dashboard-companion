import { google } from "googleapis";
import { getAuthorizedClientForUser } from "./google";
import { logEvent } from "../lib/logger";

export async function addTopLevelComment(
  userId: string,
  videoId: string,
  text: string,
  correlationId?: string
) {
  const auth = await getAuthorizedClientForUser(userId, correlationId);
  const youtube = google.youtube({ version: "v3", auth });

  const started = Date.now();
  try {
    // Top-level comments are created via commentThreads.insert
    const res = await youtube.commentThreads.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: { textOriginal: text },
          },
        },
      },
    });

    Promise.resolve().then(() =>
      logEvent?.({
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { videoId },
        metadata: { api: "commentThreads.insert" },
        response: { status: 200, durationMs: Date.now() - started },
      })
    );

    const thread = res.data;
    const commentId = thread?.snippet?.topLevelComment?.id || thread?.id;
    return { threadId: thread?.id, comment: thread.snippet?.topLevelComment };
  } catch (err: any) {
    Promise.resolve().then(() =>
      logEvent?.({
        level: "error",
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { videoId },
        metadata: { api: "commentThreads.insert" },
        response: { status: err?.code || 500, errorMessage: err?.message },
      })
    );
    throw err;
  }
}

export async function replyToComment(
  userId: string,
  parentCommentId: string, // parent = top-level comment id
  text: string,
  correlationId?: string
) {
  const auth = await getAuthorizedClientForUser(userId, correlationId);
  const youtube = google.youtube({ version: "v3", auth });

  const started = Date.now();
  try {
    // Replies are created via comments.insert with parentId
    const res = await youtube.comments.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          parentId: parentCommentId,
          textOriginal: text,
        },
      },
    });

    Promise.resolve().then(() => {
      logEvent?.({
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { commentId: parentCommentId },
        metadata: { api: "comments.insert" },
        response: { status: 200, durationMs: Date.now() - started },
      });
    });

    return { reply: res.data };
  } catch (err: any) {
    Promise.resolve().then(() => {
      logEvent?.({
        level: "error",
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { commentId: parentCommentId },
        metadata: { api: "comments.insert" },
        response: { status: err?.code || 500, errorMessage: err?.message },
      });
    });
    throw err;
  }
}

export async function deleteComment(
  userId: string,
  commentId: string,
  correlationId?: string
) {
  const auth = await getAuthorizedClientForUser(userId, correlationId);
  const youtube = google.youtube({ version: "v3", auth });

  const started = Date.now();
  try {
    await youtube.comments.delete({ id: commentId });
    Promise.resolve().then(() => {
      logEvent?.({
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { commentId },
        metadata: { api: "comments.delete" },
        response: { status: 204, durationMs: Date.now() - started },
      });
    });

    return { ok: true };
  } catch (err: any) {
    Promise.resolve().then(() => {
      logEvent?.({
        level: "error",
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { commentId },
        metadata: { api: "comments.delete" },
        response: { status: err?.code || 500, errorMessage: err?.message },
      });
    });
    throw err;
  }
}

export async function getCommentsByVideoId(
  videoId: string,
  userId?: string,
  correlationId?: string
) {
  // If a userId is provided we use their authorized client (may increase quota/privileges),
  // otherwise use an unauthenticated client for public data.
  const auth = userId
    ? await getAuthorizedClientForUser(userId, correlationId)
    : undefined;
  const youtube = google.youtube({ version: "v3", auth });

  const started = Date.now();
  try {
    const items: any[] = [];
    let nextPageToken: string | undefined = undefined;

    // paginate through commentThreads.list to collect all top-level comments (and optional replies)
    const res = await youtube.commentThreads.list({
      part: ["snippet", "replies"],
      videoId,
      maxResults: 100,
      pageToken: nextPageToken,
    } as any);

    if (res.data?.items) {
      items.push(...res.data.items);
    }
    nextPageToken = res.data?.nextPageToken as string | undefined;
    Promise.resolve().then(() => {
      logEvent?.({
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { videoId },
        metadata: { api: "commentThreads.list" },
        response: { status: 200, durationMs: Date.now() - started },
      });
    });

    return { items, count: items.length };
  } catch (err: any) {
    Promise.resolve().then(() => {
      logEvent?.({
        level: "error",
        event: "YOUTUBE_API_CALL",
        source: "youtube",
        correlationId,
        target: { videoId },
        metadata: { api: "commentThreads.list" },
        response: { status: err?.code || 500, errorMessage: err?.message },
      });
    });
    throw err;
  }
}
