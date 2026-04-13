import { NextResponse } from "next/server";
import { getSpotifyConnectionStatus } from "@/lib/spotify";

/**
 * GET /api/spotify/health
 * Verifies Developer app credentials (Client ID + Secret) work on this deploy.
 * Spotify for Artists admin role is not used here — only the Web API client-credentials app.
 */
export async function GET() {
  const status = await getSpotifyConnectionStatus();
  const ok = status.configured && status.tokenOk;
  return NextResponse.json(
    {
      ok,
      ...status,
      hint: ok
        ? "Try /api/spotify?q=ArtistName — dashboard sync uses the same credentials."
        : undefined,
    },
    { status: ok ? 200 : 503 }
  );
}
