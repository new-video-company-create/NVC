import { NextRequest, NextResponse } from "next/server";
import { searchArtist } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const data = await searchArtist(query);
  if (!data) {
    return NextResponse.json({ error: "Artist not found or Spotify not configured" }, { status: 404 });
  }

  return NextResponse.json(data);
}
