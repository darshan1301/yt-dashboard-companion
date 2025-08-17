import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import videoRoute from "./routes/video.route";
import commentRoute from "./routes/comment.route";
import videoNotesRouter from "./routes/note.route";
import { authGuard } from "./lib/session";
import { requestLogger } from "./middleware/requestLogger";

const {
  PORT = "8080",
  CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173",
  NODE_ENV = "development",
} = process.env;

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: CLIENT_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health
app.get("/healthz", (_req, res) =>
  res.json({ ok: true, env: NODE_ENV, message: "Server is healthy" })
);
// Auth only
app.use("/api/auth", authRouter);

app.use(requestLogger());

app.use("/api/video", authGuard, videoRoute);

app.use("/api/comments", authGuard, commentRoute);

app.use("/api/videos/:videoId/notes", authGuard, videoNotesRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(Number(PORT), () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
