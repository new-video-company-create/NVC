"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { getArtists, saveArtist, type Artist } from "@/lib/storage";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400/80",
  prospect: "bg-blue-500/10 text-blue-400/80",
  onboarding: "bg-amber-500/10 text-amber-400/80",
};

const stepLabels: Record<string, string> = {
  contact: "First Contact", call_scheduled: "Call Scheduled", proposal_sent: "Proposal Sent", signed: "Signed",
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function RosterPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selected, setSelected] = useState<Artist | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const a = getArtists();
    setArtists(a);
    if (a.length > 0) setSelected(a[0]);
  }, []);

  const syncSpotify = useCallback(async (artist: Artist) => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/spotify?q=${encodeURIComponent(artist.stageName)}`);
      if (res.ok) {
        const data = await res.json();
        const updated: Artist = {
          ...artist,
          monthlyListeners: formatNumber(data.followers),
          followers: data.followers,
          popularity: data.popularity,
          spotifyImageUrl: data.imageUrl,
          spotifyId: data.id,
          spotify: data.spotifyUrl,
          topTracks: data.topTracks?.map((t: { name: string }) => t.name) || artist.topTracks,
        };
        saveArtist(updated);
        setArtists(getArtists());
        setSelected(updated);
      }
    } catch { /* silent */ }
    setSyncing(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/tru-logo.png" alt="Tru" width={32} height={32} className="rounded-lg" />
          <div>
            <h1 className="text-xl font-medium text-white/90">Artist Roster</h1>
            <p className="text-white/30 text-sm mt-1">{artists.length} artists managed by Tru Management</p>
          </div>
        </div>
        <Link href="/dashboard/roster/onboard" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all duration-300">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Onboard Artist
        </Link>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-2 space-y-2">
          {artists.map((artist, i) => (
            <motion.button key={artist.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(artist)}
              className={`w-full text-left glass rounded-2xl p-4 transition-all duration-300 cursor-pointer ${selected?.id === artist.id ? "border-white/20 bg-white/[0.06]" : "glass-hover"}`}
            >
              <div className="flex items-center gap-3">
                {artist.spotifyImageUrl ? (
                  <img src={artist.spotifyImageUrl} alt={artist.stageName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-white/50 text-sm font-bold">{artist.stageName[0]}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white/80 text-sm font-medium truncate">{artist.stageName}</p>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[artist.status] || "bg-white/[0.04] text-white/25"}`}>{artist.status}</span>
                  </div>
                  <p className="text-white/25 text-xs mt-0.5">{artist.genre}</p>
                  {artist.followers && <p className="text-white/15 text-[10px] mt-0.5">{formatNumber(artist.followers)} followers</p>}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="md:col-span-3">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {selected.spotifyImageUrl ? (
                    <img src={selected.spotifyImageUrl} alt={selected.stageName} className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                      <span className="text-white/40 text-2xl font-bold">{selected.stageName[0]}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-white/90 text-xl font-medium">{selected.stageName}</h2>
                    <p className="text-white/30 text-sm">{selected.genre}</p>
                    {selected.onboardingStep && <p className="text-amber-400/60 text-xs mt-1">{stepLabels[selected.onboardingStep]}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => syncSpotify(selected)} disabled={syncing} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/80 text-xs transition-colors cursor-pointer disabled:opacity-50">
                    {syncing ? "Syncing..." : "Sync Spotify"}
                  </button>
                  <Link href={`/dashboard/epk?artist=${selected.id}`} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors">
                    Generate EPK
                  </Link>
                </div>
              </div>

              <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Bio</p><p className="text-white/60 text-sm leading-relaxed">{selected.bio}</p></div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">Followers</p>
                  <p className="text-white/80 text-lg font-semibold mt-1">{selected.followers ? formatNumber(selected.followers) : "—"}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">Popularity</p>
                  <p className="text-white/80 text-lg font-semibold mt-1">{selected.popularity ?? "—"}<span className="text-white/20 text-xs">/100</span></p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">Status</p>
                  <p className="text-white/80 text-lg font-semibold mt-1 capitalize">{selected.status}</p>
                </div>
              </div>

              {selected.topTracks && selected.topTracks.length > 0 && (
                <div>
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-3">Top Tracks</p>
                  <div className="space-y-1">
                    {selected.topTracks.map((track, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                        <span className="text-white/15 text-xs font-mono w-5">{i + 1}</span>
                        <span className="text-white/60 text-sm">{track}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-3">Links</p>
                <div className="flex flex-wrap gap-2">
                  {selected.instagram && <a href={selected.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs transition-colors">Instagram</a>}
                  {selected.website && <a href={selected.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs transition-colors">Website</a>}
                  {selected.spotify && <a href={selected.spotify} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/70 text-xs transition-colors">Spotify</a>}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <p className="text-white/30 text-sm">Select an artist to view profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
