import { NextResponse } from "next/server";
import { getSpotifyConnectionStatus } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getSpotifyConnectionStatus();
  const ok = status.configured && status.tokenOk;
  return NextResponse.json(
    {
      ok,
      ...status,
      hint: ok ? "Try /api/spotify?q=ArtistName" : undefined,
    },
    { status: ok ? 200 : 503 },
  );
}
