let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error(`Spotify token error ${res.status}: ${errorBody}`);
      return null;
    }
    const data = await res.json();
    cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
    return cachedToken.token;
  } catch (e) {
    console.error("Spotify token fetch failed:", e);
    return null;
  }
}

export interface SpotifyTrack {
  name: string;
  album: string;
  albumImageUrl: string;
  popularity: number;
  durationMs: number;
  previewUrl: string | null;
  spotifyUrl: string;
}

export interface SpotifyArtistData {
  name: string;
  id: string;
  followers: number;
  genres: string[];
  imageUrl: string;
  popularity: number;
  spotifyUrl: string;
  topTracks: SpotifyTrack[];
  /** Avg popularity of top 3 tracks — useful when comparing catalog heat (not stream counts). */
  avgTopTrackPopularity?: number;
}

type SpotifyApiArtist = {
  id: string;
  name: string;
  popularity?: number;
  followers?: { total?: number };
  genres?: string[];
  images?: { url: string }[];
  external_urls?: { spotify?: string };
};

async function fetchTopTracks(artistId: string, token: string): Promise<SpotifyTrack[]> {
  try {
    const tracksRes = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!tracksRes.ok) return [];
    const tracksData = await tracksRes.json();
    return (tracksData.tracks || []).slice(0, 10).map((t: Record<string, unknown>) => ({
      name: (t as { name: string }).name,
      album: ((t as { album: { name: string } }).album)?.name || "",
      albumImageUrl: ((t as { album: { images: { url: string }[] } }).album)?.images?.[0]?.url || "",
      popularity: (t as { popularity: number }).popularity || 0,
      durationMs: (t as { duration_ms: number }).duration_ms || 0,
      previewUrl: (t as { preview_url: string | null }).preview_url,
      spotifyUrl: ((t as { external_urls: { spotify: string } }).external_urls)?.spotify || "",
    }));
  } catch {
    return [];
  }
}

function buildArtistData(artist: SpotifyApiArtist, topTracks: SpotifyTrack[]): SpotifyArtistData {
  const top3 = topTracks.slice(0, 3);
  const avgTop =
    top3.length > 0 ? Math.round(top3.reduce((s, t) => s + t.popularity, 0) / top3.length) : undefined;
  return {
    name: artist.name,
    id: artist.id,
    followers: artist.followers?.total ?? 0,
    genres: artist.genres || [],
    imageUrl: artist.images?.[0]?.url || "",
    popularity: artist.popularity ?? 0,
    spotifyUrl: artist.external_urls?.spotify || "",
    topTracks,
    avgTopTrackPopularity: avgTop,
  };
}

/**
 * Full artist profile (followers, popularity, genres). Search-only results are simplified and omit these fields.
 */
export async function getArtistById(artistId: string): Promise<SpotifyArtistData | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const artist: SpotifyApiArtist = await res.json();
    const topTracks = await fetchTopTracks(artist.id, token);
    return buildArtistData(artist, topTracks);
  } catch {
    return null;
  }
}

export async function searchArtist(query: string): Promise<SpotifyArtistData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const hit = searchData.artists?.items?.[0];
    if (!hit?.id) return null;
    return getArtistById(hit.id);
  } catch {
    return null;
  }
}

export async function getMultipleArtists(queries: string[]): Promise<(SpotifyArtistData | null)[]> {
  return Promise.all(queries.map((q) => searchArtist(q)));
}

/** For /api/spotify/health — does not expose tokens. */
export async function getSpotifyConnectionStatus(): Promise<{
  configured: boolean;
  tokenOk: boolean;
  error?: string;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      configured: false,
      tokenOk: false,
      error: "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel Environment Variables.",
    };
  }
  const token = await getAccessToken();
  if (!token) {
    return {
      configured: true,
      tokenOk: false,
      error: "Credentials present but Spotify returned no token — verify Client ID/Secret in the Developer Dashboard.",
    };
  }
  return { configured: true, tokenOk: true };
}
