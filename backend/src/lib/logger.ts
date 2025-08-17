import { prisma } from "../db/prisma";

type LogPartial = {
  level?: "info" | "warn" | "error";
  event: string;
  source?: "backend" | "frontend" | "youtube";
  actor?: { userId?: string; email?: string };
  sessionId?: string;
  correlationId?: string;
  target?: { videoId?: string; commentId?: string; noteId?: string };
  metadata?: Record<string, any>;
  request?: {
    method?: string;
    path?: string;
    query?: any;
    body?: any;
    headers?: any;
  };
  response?: {
    status?: number;
    durationMs?: number;
    errorCode?: string;
    errorMessage?: string;
  };
  userAgent?: string;
  ip?: string;
  env?: { version?: string; node?: string };
};

const redact = (obj: any) => {
  if (!obj || typeof obj !== "object") return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  const kill = [
    "authorization",
    "cookie",
    "access_token",
    "refresh_token",
    "id_token",
    "password",
  ];
  if (clone.headers)
    kill.forEach((k) =>
      clone.headers[k] ? (clone.headers[k] = "[REDACTED]") : null
    );
  if (clone.access_token) clone.access_token = "[REDACTED]";
  if (clone.refresh_token) clone.refresh_token = "[REDACTED]";
  return clone;
};

export async function logEvent(p: LogPartial) {
  try {
    await prisma.eventLog.create({
      data: {
        level: (p.level || "info") as any,
        event: p.event,
        source: (p.source || "backend") as any,
        actorUserId: p.actor?.userId,
        actorEmail: p.actor?.email,
        sessionId: p.sessionId,
        correlationId: p.correlationId,
        videoId: p.target?.videoId,
        commentId: p.target?.commentId,
        noteId: p.target?.noteId,
        requestMethod: p.request?.method,
        requestPath: p.request?.path,
        requestQuery: p.request?.query,
        requestBody: p.request?.body,
        requestHeaders: p.request?.headers
          ? redact({ headers: p.request.headers })
          : undefined,
        responseStatus: p.response?.status,
        responseDurationMs: p.response?.durationMs,
        responseErrorCode: p.response?.errorCode,
        responseErrorMessage: p.response?.errorMessage,
        userAgent: p.userAgent,
        ip: p.ip,
        appVersion: p.env?.version,
        nodeVersion: p.env?.node,
        metadata: p.metadata,
      },
    });
  } catch (e) {
    console.error("Failed to persist log", e);
  }
}
