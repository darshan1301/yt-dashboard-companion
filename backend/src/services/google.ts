import { google } from "googleapis";
import { prisma } from "../db/prisma";
import { logEvent } from "../lib/logger";
import { OAuth2Client } from "google-auth-library";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
  process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error("Missing Google OAuth environment variables");
}

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "openid",
  "email",
  "profile",
  // include YouTube scopes now so you won't need to re-consent later
  // "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

export function getGoogleAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // get refresh token
    prompt: "consent", // force consent to ensure refresh token the first time
    scope: SCOPES,
  });
}

export async function exchangeCodeForUser(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2("v2");
  const me = await oauth2.userinfo.get({ auth: oauth2Client });
  const profile = me.data;

  if (!profile.id || !profile.email || !profile.name) {
    throw new Error("Incomplete Google profile");
  }

  // upsert user and store refresh token (if present)
  const user = await prisma.user.upsert({
    where: { googleId: profile.id },
    update: {
      email: profile.email,
      name: profile.name,
      picture: profile.picture ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
      accessToken: tokens.access_token,
    },
    create: {
      googleId: profile.id,
      email: profile.email!,
      name: profile.name!,
      picture: profile.picture ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
      accessToken: tokens.access_token,
    },
  });

  return { user, tokens };
}

export async function getAuthorizedClientForUser(
  userId: string,
  correlationId?: string
): Promise<OAuth2Client> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.refreshToken) {
    throw new Error("User not found or missing refresh token");
  }

  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  // Set only the refresh token; google-auth-library will handle access token refresh.
  client.setCredentials({ refresh_token: user.refreshToken });

  try {
    // Force a refresh/mint to ensure validity (optional but helpful to fail fast)
    await client.getAccessToken();

    await logEvent({
      event: "TOKEN_REFRESHED",
      actor: { userId, email: user.email },
      correlationId,
    });

    return client;
  } catch (err: any) {
    await logEvent({
      level: "error",
      event: "TOKEN_REFRESH_FAILED",
      actor: { userId, email: user.email },
      correlationId,
      response: { status: err?.code || 500, errorMessage: err?.message },
    });
    throw err;
  }
}
