-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('info', 'warn', 'error');

-- CreateEnum
CREATE TYPE "public"."LogSource" AS ENUM ('backend', 'frontend', 'youtube');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventLog" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "public"."LogLevel" NOT NULL DEFAULT 'info',
    "event" TEXT NOT NULL,
    "source" "public"."LogSource" NOT NULL DEFAULT 'backend',
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "sessionId" TEXT,
    "correlationId" TEXT,
    "videoId" TEXT,
    "commentId" TEXT,
    "noteId" TEXT,
    "requestMethod" TEXT,
    "requestPath" TEXT,
    "requestQuery" JSONB,
    "requestBody" JSONB,
    "requestHeaders" JSONB,
    "responseStatus" INTEGER,
    "responseDurationMs" INTEGER,
    "responseErrorCode" TEXT,
    "responseErrorMessage" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "appVersion" TEXT,
    "nodeVersion" TEXT,
    "metadata" JSONB,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "public"."Note"("userId");

-- CreateIndex
CREATE INDEX "Note_videoId_idx" ON "public"."Note"("videoId");

-- CreateIndex
CREATE INDEX "EventLog_event_idx" ON "public"."EventLog"("event");

-- CreateIndex
CREATE INDEX "EventLog_actorUserId_idx" ON "public"."EventLog"("actorUserId");

-- CreateIndex
CREATE INDEX "EventLog_videoId_idx" ON "public"."EventLog"("videoId");

-- CreateIndex
CREATE INDEX "EventLog_correlationId_idx" ON "public"."EventLog"("correlationId");

-- CreateIndex
CREATE INDEX "EventLog_ts_idx" ON "public"."EventLog"("ts");

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventLog" ADD CONSTRAINT "EventLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
