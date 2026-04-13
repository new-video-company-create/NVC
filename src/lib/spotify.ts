let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
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
}

export async function searchArtist(query: string): Promise<SpotifyArtistData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const artist = searchData.artists?.items?.[0];
    if (!artist) return null;

    let topTracks: SpotifyTrack[] = [];
    try {
      const tracksRes = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        topTracks = (tracksData.tracks || []).slice(0, 10).map((t: Record<string, unknown>) => ({
          name: (t as { name: string }).name,
          album: ((t as { album: { name: string } }).album)?.name || "",
          albumImageUrl: ((t as { album: { images: { url: string }[] } }).album)?.images?.[0]?.url || "",
          popularity: (t as { popularity: number }).popularity || 0,
          durationMs: (t as { duration_ms: number }).duration_ms || 0,
          previewUrl: (t as { preview_url: string | null }).preview_url,
          spotifyUrl: ((t as { external_urls: { spotify: string } }).external_urls)?.spotify || "",
        }));
      }
    } catch { /* top tracks may fail if no premium */ }

    return {
      name: artist.name,
      id: artist.id,
      followers: artist.followers?.total || 0,
      genres: artist.genres || [],
      imageUrl: artist.images?.[0]?.url || "",
      popularity: artist.popularity || 0,
      spotifyUrl: artist.external_urls?.spotify || "",
      topTracks,
    };
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
      error: "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (Vercel → Settings → Environment Variables).",
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
