/** Extract Spotify artist id from open.spotify.com URLs (any locale path). */
export function parseSpotifyArtistIdFromUrl(url: string): string | null {
  if (!url) return null;
  const m = url.match(/\/artist\/([a-zA-Z0-9]+)/);
  return m?.[1] ?? null;
}
