"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  getInvoices,
  getArtists,
  saveArtist,
  calcInvoiceTotal,
  FMT,
  type Invoice,
  type Artist,
} from "@/lib/storage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtFollowers(n: number | undefined) {
  if (typeof n !== "number") return "—";
  return fmtNum(n);
}

function fmtPop(n: number | undefined) {
  if (typeof n !== "number") return "—";
  return `${n}/100`;
}

type SpotifySyncPayload = {
  id: string;
  followers: number;
  popularity: number;
  avgTopTrackPopularity?: number;
  imageUrl: string;
  spotifyUrl: string;
  genres: string[];
  topTracks: { name: string }[];
};

export default function DashboardOverview() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncAllArtists = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    const current = getArtists();
    try {
      const res = await fetch("/api/spotify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          artists: current.map((a) => ({
            rosterId: a.id,
            stageName: a.stageName,
            spotifyId: a.spotifyId,
            spotify: a.spotify,
          })),
        }),
        cache: "no-store",
      });

      const raw = await res.text();
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        setSyncError(
          `Spotify API returned non-JSON (HTTP ${res.status}). If Vercel Deployment Protection is on, open Project → Settings → Deployment Protection and allow public access (or exclude /api) so the browser can reach /api/spotify/sync.`,
        );
        return;
      }

      const payload = JSON.parse(raw) as {
        results?: { rosterId: string; ok: boolean; data: SpotifySyncPayload | null }[];
        error?: string;
      };

      if (!res.ok) {
        setSyncError(payload.error || `HTTP ${res.status}`);
        return;
      }

      for (const row of payload.results || []) {
        if (!row.ok || !row.data?.id) continue;
        const artist = current.find((x) => x.id === row.rosterId);
        if (!artist) continue;
        const d = row.data;
        saveArtist({
          ...artist,
          followers: d.followers,
          popularity: d.popularity,
          avgTopTrackPopularity: d.avgTopTrackPopularity,
          spotifyImageUrl: d.imageUrl || artist.spotifyImageUrl,
          spotifyId: d.id,
          spotify: d.spotifyUrl || artist.spotify,
          genres: d.genres?.length ? d.genres : artist.genres,
          topTracks: d.topTracks?.length > 0
            ? d.topTracks.map((t) => t.name)
            : artist.topTracks,
        });
      }

      setArtists(getArtists());
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      setSyncError(String(e));
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    setInvoices(getInvoices());
    setArtists(getArtists());
    syncAllArtists();
  }, [syncAllArtists]);

  const openInvoices = invoices.filter((i) => i.status === "pending" || i.status === "draft");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const openTotal = openInvoices.reduce((s, i) => s + calcInvoiceTotal(i).total, 0);
  const paidTotal = paidInvoices.reduce((s, i) => s + calcInvoiceTotal(i).total, 0);
  const totalFollowers = artists.reduce((s, a) => s + (typeof a.followers === "number" ? a.followers : 0), 0);
  const withPop = artists.filter((a) => typeof a.popularity === "number");
  const avgPopularity =
    withPop.length > 0 ? Math.round(withPop.reduce((s, a) => s + (a.popularity ?? 0), 0) / withPop.length) : 0;
  const withMomentum = artists.filter((a) => typeof a.avgTopTrackPopularity === "number");
  const avgMomentum =
    withMomentum.length > 0
      ? Math.round(withMomentum.reduce((s, a) => s + (a.avgTopTrackPopularity ?? 0), 0) / withMomentum.length)
      : 0;
  const maxFollowers = Math.max(1, ...artists.map((a) => (typeof a.followers === "number" ? a.followers : 0)));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/nvc-logo.png" alt="New Video Company" width={48} height={48} className="rounded-xl opacity-95" />
          <div>
            <h1 className="text-xl font-medium text-white/90">Welcome back</h1>
            <p className="text-white/30 text-sm mt-1">New Video Company · NVC Portal</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
          {lastSync && <span className="text-white/15 text-[10px]">Synced {lastSync}</span>}
          <button onClick={syncAllArtists} disabled={syncing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/70 text-xs transition-colors cursor-pointer disabled:opacity-50">
            {syncing ? (
              <><span className="inline-block w-3 h-3 border border-emerald-400/30 border-t-emerald-400/80 rounded-full animate-spin" /> Syncing...</>
            ) : (
              <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Refresh</>
            )}
          </button>
          </div>
          {syncError && (
            <p className="text-red-400/90 text-[10px] max-w-md text-right leading-snug">{syncError}</p>
          )}
        </div>
      </motion.div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            label: "Total Followers",
            value: artists.some((a) => typeof a.followers === "number") ? fmtNum(totalFollowers) : "—",
            sub: `Across ${artists.length} artists`,
            color: "text-emerald-400/80",
          },
          {
            label: "Avg Popularity",
            value: withPop.length ? `${avgPopularity}/100` : "—",
            sub: "Artist index (Spotify)",
            color: "text-blue-400/80",
          },
          {
            label: "Catalog momentum",
            value: withMomentum.length ? `${avgMomentum}/100` : "—",
            sub: "Avg of top tracks’ popularity · not streams",
            color: "text-violet-400/80",
          },
          { label: "Open Invoices", value: String(openInvoices.length), sub: FMT.format(openTotal) + " outstanding", color: "text-amber-400/80" },
          { label: "Revenue Collected", value: FMT.format(paidTotal), sub: `${paidInvoices.length} paid invoices`, color: "text-white/80" },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible" className="glass rounded-2xl p-4">
            <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-2 ${stat.color}`}>{stat.value}</p>
            <p className="text-white/20 text-xs mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Artist Spotify Cards */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em]">Artist Roster — Spotify Data</h2>
          <Link href="/dashboard/roster" className="text-white/25 hover:text-white/50 text-[10px] uppercase tracking-[0.2em] transition-colors">View All</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {artists.map((a) => {
            const img = a.spotifyImageUrl || a.imageUrl;
            return (
              <Link key={a.id} href="/dashboard/roster" className="glass glass-hover rounded-2xl p-5 transition-all duration-500 group">
                <div className="flex items-center gap-3 mb-4">
                  {img ? (
                    <img src={img} alt={a.stageName} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                      <span className="text-white/40 font-bold">{a.stageName[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">{a.stageName}</p>
                    <p className="text-white/25 text-xs">{a.genre}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-white/[0.03] rounded-lg p-2.5 min-w-0">
                    <p className="text-white/20 text-[9px] uppercase tracking-wider">Followers</p>
                    <p className="text-white/80 text-sm font-semibold mt-0.5 truncate">{fmtFollowers(a.followers)}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5 min-w-0">
                    <p className="text-white/20 text-[9px] uppercase tracking-wider">Artist</p>
                    <p className="text-white/80 text-sm font-semibold mt-0.5">{fmtPop(a.popularity)}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5 min-w-0">
                    <p className="text-white/20 text-[9px] uppercase tracking-wider">Tracks</p>
                    <p className="text-white/80 text-sm font-semibold mt-0.5">
                      {typeof a.avgTopTrackPopularity === "number" ? `${a.avgTopTrackPopularity}/100` : "—"}
                    </p>
                  </div>
                </div>
                {typeof a.followers === "number" && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[9px] text-white/15 mb-1">
                      <span>Share of roster reach</span>
                      <span>{Math.round((a.followers / maxFollowers) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/80 transition-all duration-700"
                        style={{ width: `${Math.min(100, (a.followers / maxFollowers) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {a.topTracks && a.topTracks.length > 0 && (
                  <div>
                    <p className="text-white/15 text-[9px] uppercase tracking-wider mb-1.5">Top Tracks</p>
                    {a.topTracks.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className="text-white/10 text-[10px] font-mono w-3">{i + 1}</span>
                        <span className="text-white/40 text-xs truncate">{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(a.spotify || a.spotifyId) && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <span className="text-emerald-400/40 text-[10px] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      Connected
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { title: "New Invoice", href: "/dashboard/invoices/new", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg> },
            { title: "Stripe payments", href: "/dashboard/payments", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
            { title: "Artist Roster", href: "/dashboard/roster", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
            { title: "EPK Generator", href: "/dashboard/epk", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
            { title: "Transcripts", href: "/dashboard/transcripts", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> },
            {
              title: "Spotify for Artists",
              href: "https://artists.spotify.com",
              external: true,
              icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z" /></svg>,
            },
          ].map((a) =>
            "external" in a && a.external ? (
              <a
                key={a.title}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 group border border-emerald-500/10"
              >
                <span className="text-emerald-400/40 group-hover:text-emerald-400/70 transition-colors">{a.icon}</span>
                <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{a.title}</p>
                <p className="text-white/20 text-[10px]">Streams &amp; listeners</p>
              </a>
            ) : (
              <Link key={a.title} href={a.href} className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 group">
                <span className="text-white/30 group-hover:text-white/60 transition-colors">{a.icon}</span>
                <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{a.title}</p>
              </Link>
            ),
          )}
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em]">Recent Invoices</h2>
          <Link href="/dashboard/invoices" className="text-white/25 hover:text-white/50 text-[10px] uppercase tracking-[0.2em] transition-colors">View All</Link>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          {invoices.slice(0, 5).map((inv, i) => (
            <div key={inv.id} className={`flex items-center justify-between px-5 py-4 ${i < Math.min(invoices.length, 5) - 1 ? "border-b border-white/[0.04]" : ""}`}>
              <div><p className="text-white/70 text-sm font-medium">{inv.billToName}</p><p className="text-white/25 text-xs">#{inv.invoiceNumber} &middot; {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div>
              <div className="flex items-center gap-4">
                <span className="text-white/70 text-sm font-medium">{FMT.format(calcInvoiceTotal(inv).total)}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400/80" : inv.status === "pending" ? "bg-amber-500/10 text-amber-400/80" : "bg-white/[0.04] text-white/30"}`}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
