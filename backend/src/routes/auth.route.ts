import { Router, Request, Response } from "express";
import { getGoogleAuthUrl, exchangeCodeForUser } from "../services/google";
import { signSession, authGuard } from "../lib/session";

const router = Router();

// Step 1: redirect user to Google
router.get("/google", (_req, res) => {
  res.redirect(getGoogleAuthUrl());
});

// Step 2: Google redirects back with ?code=...
router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).send("Missing code");

  try {
    const { user } = await exchangeCodeForUser(code);
    const token = signSession(user.id);
    console.log("CLIENT", process.env.CLIENT_ORIGIN);

    res.cookie("sid", token, {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // send user back to your frontend
    const dest = new URL(
      "/dashboard",
      process.env.CLIENT_ORIGIN || "http://localhost:5173"
    );
    res.redirect(dest.toString());
  } catch (err) {
    res.status(500).send("Auth error");
  }
});

// Who am I (protected)
router.get("/me", authGuard, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

// Logout
router.post("/logout", (_req, res) => {
  res.clearCookie("sid", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ ok: true });
});

export default router;
