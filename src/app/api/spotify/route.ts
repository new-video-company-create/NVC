import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getMultipleArtists, getArtistById } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const spotifyId = req.nextUrl.searchParams.get("id");
  const batch = req.nextUrl.searchParams.get("batch");

  const jsonHeaders = { "Cache-Control": "no-store, max-age=0" as const };

  if (batch) {
    const names = batch.split(",").map((n) => n.trim()).filter(Boolean);
    const results = await getMultipleArtists(names);
    return NextResponse.json({ artists: results }, { headers: jsonHeaders });
  }

  if (spotifyId) {
    const data = await getArtistById(spotifyId);
    if (!data) {
      return NextResponse.json({ error: "Artist not found or API unavailable" }, { status: 404, headers: jsonHeaders });
    }
    return NextResponse.json(data, { headers: jsonHeaders });
  }

  if (!query) {
    return NextResponse.json({ error: "Missing q, id, or batch parameter" }, { status: 400, headers: jsonHeaders });
  }

  const data = await searchArtist(query);
  if (!data) {
    return NextResponse.json({ error: "Not found or API unavailable" }, { status: 404, headers: jsonHeaders });
  }

  return NextResponse.json(data, { headers: jsonHeaders });
}
