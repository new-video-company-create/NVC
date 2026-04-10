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

export interface SpotifyArtistData {
  name: string;
  id: string;
  monthlyListeners: number;
  followers: number;
  genres: string[];
  imageUrl: string;
  popularity: number;
  spotifyUrl: string;
  topTracks: {
    name: string;
    album: string;
    previewUrl: string | null;
    popularity: number;
    durationMs: number;
  }[];
}

export async function searchArtist(query: string): Promise<SpotifyArtistData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const artist = searchData.artists?.items?.[0];
  if (!artist) return null;

  const tracksRes = await fetch(
    `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const tracksData = tracksRes.ok ? await tracksRes.json() : { tracks: [] };

  return {
    name: artist.name,
    id: artist.id,
    monthlyListeners: artist.followers?.total || 0,
    followers: artist.followers?.total || 0,
    genres: artist.genres || [],
    imageUrl: artist.images?.[0]?.url || "",
    popularity: artist.popularity || 0,
    spotifyUrl: artist.external_urls?.spotify || "",
    topTracks: (tracksData.tracks || []).slice(0, 10).map((t: Record<string, unknown>) => ({
      name: (t as { name: string }).name,
      album: ((t as { album: { name: string } }).album)?.name || "",
      previewUrl: (t as { preview_url: string | null }).preview_url,
      popularity: (t as { popularity: number }).popularity,
      durationMs: (t as { duration_ms: number }).duration_ms,
    })),
  };
}
