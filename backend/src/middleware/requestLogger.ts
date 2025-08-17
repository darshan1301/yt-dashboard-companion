import { Request, Response, NextFunction } from "express";
import { logEvent } from "../lib/logger";
import { randomUUID } from "node:crypto"; // ← built-in, no ESM issues

export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    const correlationId =
      (req.headers["x-correlation-id"] as string) || randomUUID(); // ← replaced
    (req as any).correlationId = correlationId;
    res.setHeader("X-Correlation-Id", correlationId);

    const sessionId = (req.headers["x-session-id"] as string) || undefined;
    const actor = (req as any).user
      ? { userId: (req as any).user.id, email: (req as any).user.email }
      : undefined;

    res.on("finish", () => {
      logEvent({
        event: "HTTP_REQUEST",
        actor,
        sessionId,
        correlationId,
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body,
          headers: {
            authorization: req.headers.authorization,
            cookie: req.headers.cookie,
          },
        },
        response: { status: res.statusCode, durationMs: Date.now() - start },
        userAgent: req.headers["user-agent"] as string,
        ip: req.ip,
        env: { version: (req as any).appVersion, node: process.version },
      });
    });

    next();
  };
}
