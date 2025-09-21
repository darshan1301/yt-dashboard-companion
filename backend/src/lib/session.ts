import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";

const { JWT_SECRET = "dev" } = process.env;

export function signSession(userId: string) {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("AUTHGUARD");
  const token = req.cookies?.sid;
  if (!token) return res.status(401).json({ error: "Unauthenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid: string };
    const user = await prisma.user.findUnique({ where: { id: payload.uid } });
    if (!user) return res.status(401).json({ error: "Invalid session" });
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}
