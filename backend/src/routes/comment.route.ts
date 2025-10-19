import { Router, Request, Response } from "express";
import {
  addTopLevelComment,
  replyToComment,
  deleteComment,
  getCommentsByVideoId,
} from "../services/youtube.comments";
import { error } from "node:console";

const router = Router();

/**
 * POST /api/comments
 * Body: { videoId: string, text: string }
 * Creates a top-level comment on the given video.
 */
router.post("/", async (req: Request, res: Response) => {
  const { videoId, text } = req.body || {};
  console.log(videoId, text);
  const user = (req as any).user as { id: string } | undefined;

  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });
  if (!videoId || !text)
    return res.status(400).json({ error: "videoId and text are required" });

  try {
    const result = await addTopLevelComment(
      user.id,
      videoId,
      text,
      (req as any).correlationId
    );
    return res.status(201).json(result);
  } catch (e: any) {
    console.error(e);

    return res
      .status(502)
      .json({ error: "Failed to create comment", detail: e?.message });
  }
});

/**
 * POST /api/comments/reply
 * Body: { parentCommentId: string, text: string }
 * Creates a reply to an existing top-level comment.
 */
router.post("/reply", async (req: Request, res: Response) => {
  const { parentCommentId, text } = req.body || {};
  const user = (req as any).user as { id: string } | undefined;

  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });
  if (!parentCommentId || !text)
    return res
      .status(400)
      .json({ error: "parentCommentId and text are required" });

  try {
    const result = await replyToComment(
      user.id,
      parentCommentId,
      text,
      (req as any).correlationId
    );
    return res.status(201).json(result);
  } catch (e: any) {
    return res
      .status(502)
      .json({ error: "Failed to create reply", detail: e?.message });
  }
});

/**
 * DELETE /api/comments/:commentId
 * Deletes a comment (must be your own comment or you must have permission).
 */
router.delete("/:commentId", async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = (req as any).user as { id: string } | undefined;

  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });
  if (!commentId)
    return res.status(400).json({ error: "commentId is required" });

  try {
    await deleteComment(user.id, commentId, (req as any).correlationId);
    return res.status(204).send();
  } catch (e: any) {
    return res
      .status(502)
      .json({ error: "Failed to delete comment", detail: e?.message });
  }
});

///GET COMMENTS
router.get("/:videoId", async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const user = (req as any).user as { id: string } | undefined;

  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });
  if (!videoId) return res.status(400).json({ error: "commentId is required" });

  try {
    const data = await getCommentsByVideoId(videoId, user.id);
    return res.status(200).json(data);
  } catch (e: any) {
    return res
      .status(502)
      .json({ error: "Failed to fetch comments ", detail: e?.message });
  }
});

export default router;
