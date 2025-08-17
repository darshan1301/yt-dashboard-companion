import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma";

const router = Router({ mergeParams: true });

/**
 * All routes expect :videoId in the path and are user-scoped.
 * Optional query:
 *   search  - case-insensitive contains on text
 *   tags    - comma-separated list, e.g. "hook,thumbnail"
 *   match   - "any" (default) | "all" for tag matching
 *   take    - page size (default 20, max 100)
 *   cursor  - note id for pagination
 */

/** GET /api/videos/:videoId/notes */
router.get("/", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const videoId = req.params.videoId;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  const {
    search,
    tags: tagsCsv,
    match = "any",
    take: takeRaw,
    cursor,
  } = req.query as Record<string, string | undefined>;

  const take = Math.min(
    Math.max(parseInt(String(takeRaw ?? "20"), 10) || 20, 1),
    100
  );
  const tags = (tagsCsv || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const where: any = { userId: user.id, videoId };
  if (search) where.text = { contains: search, mode: "insensitive" };
  if (tags.length)
    where.tags = match === "all" ? { hasEvery: tags } : { hasSome: tags };

  const notes = await prisma.note.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  let nextCursor: string | undefined;
  if (notes.length > take) {
    nextCursor = notes[take].id;
    notes.pop();
  }

  res.json({ notes, nextCursor });
});

/** POST /api/videos/:videoId/notes  Body: { text: string, tags?: string[] } */
router.post("/", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const videoId = req.params.videoId;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  const { text, tags } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ error: "tags must be an array of strings" });
  }

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      videoId,
      text,
      tags: Array.isArray(tags)
        ? tags
            .filter((t: any) => typeof t === "string" && t.trim())
            .map((t: string) => t.trim())
        : [],
    },
  });

  res.status(201).json({ note });
});

/** PATCH /api/videos/:videoId/notes/:id  Body: { text?: string, tags?: string[] } */
router.patch("/:id", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const videoId = req.params.videoId;
  const id = req.params.id;

  const existing = await prisma.note.findUnique({ where: { id } });
  if (
    !existing ||
    existing.userId !== user.id ||
    existing.videoId !== videoId
  ) {
    return res.status(404).json({ error: "Note not found for this video" });
  }

  const { text, tags } = req.body || {};
  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ error: "tags must be an array of strings" });
  }

  const data: any = {};
  if (typeof text === "string") data.text = text;
  if (Array.isArray(tags)) {
    data.tags = tags
      .filter((t: any) => typeof t === "string" && t.trim())
      .map((t: string) => t.trim());
  }
  if (!Object.keys(data).length) {
    return res.status(400).json({ error: "Provide text and/or tags" });
  }

  const note = await prisma.note.update({ where: { id }, data });
  res.json({ note });
});

/** DELETE /api/videos/:videoId/notes/:id */
router.delete("/:id", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const videoId = req.params.videoId;
  const id = req.params.id;

  const existing = await prisma.note.findUnique({ where: { id } });
  if (
    !existing ||
    existing.userId !== user.id ||
    existing.videoId !== videoId
  ) {
    return res.status(404).json({ error: "Note not found for this video" });
  }

  await prisma.note.delete({ where: { id } });
  res.status(204).send();
});

/** GET /api/videos/:videoId/notes/tags — de-duplicated tags + counts for this video */
router.get("/tags/list", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const videoId = req.params.videoId;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  const rows = await prisma.note.findMany({
    where: { userId: user.id, videoId },
    select: { tags: true },
  });

  const counts = new Map<string, number>();
  for (const n of rows) {
    for (const t of n.tags || []) {
      const k = t.trim();
      if (!k) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }

  const tags = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  res.json({ tags });
});

export default router;
