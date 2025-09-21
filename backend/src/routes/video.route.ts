import { Router, Request, Response } from "express";
import {
  fetchUploadedVideos,
  fetchVideoDetails,
  updateVideoTitleDescription,
} from "../services/youtube.video";

const router = Router();

/**
 * GET /api/video/:id
 * Returns normalized details for a single YouTube video.
 * Requires auth cookie (sid) set by your Google OAuth flow.
 */
router.get("/:id", async (req: Request, res: Response) => {
  const videoId = req.params.id;
  if (!videoId) return res.status(400).json({ error: "Missing video id" });

  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });

  try {
    const details = await fetchVideoDetails(
      user.id,
      videoId,
      (req as any).correlationId
    );
    if (!details) return res.status(404).json({ error: "Video not found" });
    res.json({ video: details });
  } catch (e: any) {
    res.status(502).json({ error: "YouTube fetch failed", detail: e?.message });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const { title, description } = req.body || {};
  const user = (req as any).user as { id: string } | undefined;

  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });
  if (!videoId) return res.status(400).json({ error: "Missing video id" });
  if (!title && !description)
    return res.status(400).json({ error: "Provide title and/or description" });

  try {
    const updated = await updateVideoTitleDescription(
      user.id,
      videoId,
      { title, description },
      (req as any).correlationId
    );
    res.status(200).json({ video: updated });
  } catch (e: any) {
    res
      .status(502)
      .json({ error: "YouTube update failed", detail: e?.message });
  }
});

router.get("/", async (req, res) => {
  try {
    // assuming you have userId available on req.user
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing userId" });
    }

    const videos = await fetchUploadedVideos(userId);
    res.json(videos);
  } catch (err: any) {
    console.error("Error fetching uploaded videos:", err);
    res.status(500).json({ error: err.message || "Failed to fetch videos" });
  }
});

export default router;
