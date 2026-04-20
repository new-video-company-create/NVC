import { NextRequest, NextResponse } from "next/server";
import { getArtistById, searchArtist } from "@/lib/spotify";
import { parseSpotifyArtistIdFromUrl } from "@/lib/spotifyIds";

export const dynamic = "force-dynamic";

type BodyArtist = {
  rosterId: string;
  stageName: string;
  spotifyId?: string;
  spotify?: string;
};

/**
 * POST /api/spotify/sync
 * One round-trip for the whole roster — avoids multiple client GETs and surfaces clearer errors.
 */
export async function POST(req: NextRequest) {
  let body: { artists?: BodyArtist[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const items = body?.artists;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Expected body: { artists: [{ rosterId, stageName, spotifyId?, spotify? }] }" }, { status: 400 });
  }

  const results = await Promise.all(
    items.map(async (a) => {
      const fromUrl = a.spotify ? parseSpotifyArtistIdFromUrl(a.spotify) : null;
      const sid = (a.spotifyId || fromUrl || "").trim() || null;
      const data = sid ? await getArtistById(sid) : await searchArtist(a.stageName);
      return {
        rosterId: a.rosterId,
        ok: data != null,
        data: data ?? null,
      };
    }),
  );

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
