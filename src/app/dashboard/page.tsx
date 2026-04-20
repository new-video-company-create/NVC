"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  getInvoices,
  getArtists,
  saveArtist,
  calcInvoiceTotal,
  FMT,
  type Invoice,
  type Artist,
} from "@/lib/storage";
import { getLeads, getVideoProjects } from "@/lib/studio-storage";
import { NVC_TAGLINE } from "@/lib/nvc-brand";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
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

/** Days from today to date-only ISO string (local). */
function daysFromToday(iso: string) {
  const t = new Date(iso + "T12:00:00").getTime();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((t - start.getTime()) / 86400000);
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

type StripeHealth = {
  ok: boolean;
  configured: boolean;
  mode?: string;
  hint?: string;
};

export default function DashboardOverview() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [stripeHealth, setStripeHealth] = useState<StripeHealth | null>(null);
  const [pulse, setPulse] = useState({ activeJobs: 0, dueWeek: 0, leads: 0 });

  const refreshLocalPulse = useCallback(() => {
    const projects = getVideoProjects();
    const activeJobs = projects.filter((p) => p.status !== "delivered").length;
    const dueWeek = projects.filter((p) => {
      if (p.status === "delivered") return false;
      const d = daysFromToday(p.dueDate);
      return d >= 0 && d <= 7;
    }).length;
    setPulse({ activeJobs, dueWeek, leads: getLeads().length });
  }, []);

  const refreshStripe = useCallback(() => {
    fetch(`/api/stripe/health?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setStripeHealth)
      .catch(() =>
        setStripeHealth({
          ok: false,
          configured: false,
          hint: "Could not reach Stripe health",
        }),
      );
  }, []);

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
          `Spotify API returned non-JSON (HTTP ${res.status}). If Vercel Deployment Protection is on, allow public access to /api routes.`,
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
          topTracks:
            d.topTracks?.length > 0
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
    refreshLocalPulse();
    refreshStripe();
  }, [refreshLocalPulse, refreshStripe]);

  useEffect(() => {
    const onFocus = () => {
      refreshLocalPulse();
      refreshStripe();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshLocalPulse, refreshStripe]);

  const openInvoices = invoices.filter((i) => i.status === "pending" || i.status === "draft");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const openTotal = openInvoices.reduce((s, i) => s + calcInvoiceTotal(i).total, 0);
  const paidTotal = paidInvoices.reduce((s, i) => s + calcInvoiceTotal(i).total, 0);
  const totalFollowers = artists.reduce(
    (s, a) => s + (typeof a.followers === "number" ? a.followers : 0),
    0,
  );
  const withPop = artists.filter((a) => typeof a.popularity === "number");
  const avgPopularity =
    withPop.length > 0
      ? Math.round(withPop.reduce((s, a) => s + (a.popularity ?? 0), 0) / withPop.length)
      : 0;
  const withMomentum = artists.filter((a) => typeof a.avgTopTrackPopularity === "number");
  const avgMomentum =
    withMomentum.length > 0
      ? Math.round(
          withMomentum.reduce((s, a) => s + (a.avgTopTrackPopularity ?? 0), 0) /
            withMomentum.length,
        )
      : 0;
  const maxFollowers = Math.max(
    1,
    ...artists.map((a) => (typeof a.followers === "number" ? a.followers : 0)),
  );

  const stripeLabel =
    stripeHealth?.configured && stripeHealth.mode
      ? `Stripe · ${stripeHealth.mode}`
      : stripeHealth?.configured
        ? "Stripe · on"
        : "Stripe · not configured";

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.section
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c0a10] via-[#161022] to-[#0f0c12] p-8 md:p-10 shadow-2xl"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#f97316]/18 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-violet-600/12 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <Image
              src="/nvc-logo.png"
              alt="New Video Company"
              width={56}
              height={56}
              className="rounded-2xl opacity-95 ring-1 ring-white/10"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f97316]">
                Production desk
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Run shoots, edits &amp; launches from one hub
              </h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">{NVC_TAGLINE}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {lastSync ? (
                <span className="text-[10px] text-white/25">Spotify synced {lastSync}</span>
              ) : null}
              <button
                type="button"
                onClick={syncAllArtists}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/70" />
                    Syncing roster…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh Spotify data
                  </>
                )}
              </button>
            </div>
            {syncError ? (
              <p className="max-w-md text-right text-[10px] leading-snug text-red-400/90 md:text-right">
                {syncError}
              </p>
            ) : null}
          </div>
        </div>
      </motion.section>

      {/* Pulse stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: "Active productions",
            value: String(pulse.activeJobs),
            sub: "Not delivered yet",
            color: "text-[#f97316]",
          },
          {
            label: "Due in 7 days",
            value: String(pulse.dueWeek),
            sub: "Milestones on deck",
            color: "text-amber-200/90",
          },
          {
            label: "Pipeline leads",
            value: String(pulse.leads),
            sub: "Studio CRM (local)",
            color: "text-violet-300/90",
          },
          {
            label: "Open invoices",
            value: String(openInvoices.length),
            sub: `${FMT.format(openTotal)} outstanding`,
            color: "text-amber-400/90",
          },
          {
            label: "Collected",
            value: FMT.format(paidTotal),
            sub: `${paidInvoices.length} paid`,
            color: "text-emerald-300/90",
          },
          {
            label: "Payments",
            value: stripeHealth?.configured ? "Ready" : "Setup",
            sub: stripeLabel,
            color: stripeHealth?.configured ? "text-emerald-300/90" : "text-zinc-500",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i + 1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
              {stat.label}
            </p>
            <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-white/30">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="mb-4 text-[10px] font-medium uppercase tracking-[0.28em] text-white/25">
          Jump in
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Link
            href="/dashboard/studio"
            className="group relative overflow-hidden rounded-2xl border border-[#f97316]/35 bg-gradient-to-br from-[#f97316]/12 to-transparent p-5 transition hover:border-[#f97316]/55"
          >
            <span className="text-[#f97316]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </span>
            <p className="mt-3 text-sm font-semibold text-white group-hover:text-white">
              Studio board
            </p>
            <p className="mt-1 text-[11px] text-white/35">Jobs, shot-day list, leads</p>
          </Link>

          {[
            {
              title: "New invoice",
              href: "/dashboard/invoices/new",
              blurb: "Quote & bill clients",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              ),
            },
            {
              title: "Payments & POS",
              href: "/dashboard/payments",
              blurb: "Stripe checkout & wallets",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              ),
            },
            {
              title: "Talent roster",
              href: "/dashboard/roster",
              blurb: "Subjects & Spotify IDs",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ),
            },
            {
              title: "EPK / one-sheet",
              href: "/dashboard/epk",
              blurb: "Press-ready PDFs",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              ),
            },
            {
              title: "Transcripts",
              href: "/dashboard/transcripts",
              blurb: "Interview & VO pulls",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              ),
            },
            {
              title: "Frame.io",
              href: "https://frame.io",
              external: true,
              blurb: "Review & versions",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              ),
            },
            {
              title: "Vimeo",
              href: "https://vimeo.com",
              external: true,
              blurb: "Hosting & showcases",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
          ].map((a) =>
            "external" in a && a.external ? (
              <a
                key={a.title}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-violet-500/25 hover:bg-white/[0.04]"
              >
                <span className="text-violet-300/70">{a.icon}</span>
                <p className="mt-3 text-sm font-medium text-white/85">{a.title}</p>
                <p className="mt-1 text-[11px] text-white/30">{a.blurb}</p>
              </a>
            ) : (
              <Link
                key={a.title}
                href={a.href}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <span className="text-white/35">{a.icon}</span>
                <p className="mt-3 text-sm font-medium text-white/85">{a.title}</p>
                <p className="mt-1 text-[11px] text-white/30">{a.blurb}</p>
              </Link>
            ),
          )}
        </div>
      </motion.div>

      {/* Spotify talent — compact */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/25">
              Talent signals
            </h2>
            <p className="mt-1 text-xs text-white/35">
              Spotify reach for music-video clients — not the whole business, just context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/25">
            <span>
              Roster reach{" "}
              <strong className="text-white/50">
                {artists.some((a) => typeof a.followers === "number")
                  ? fmtNum(totalFollowers)
                  : "—"}
              </strong>
            </span>
            <span>
              Avg artist index{" "}
              <strong className="text-white/50">
                {withPop.length ? `${avgPopularity}/100` : "—"}
              </strong>
            </span>
            <span>
              Track heat{" "}
              <strong className="text-white/50">
                {withMomentum.length ? `${avgMomentum}/100` : "—"}
              </strong>
            </span>
            <Link
              href="/dashboard/roster"
              className="uppercase tracking-[0.2em] text-white/40 hover:text-white/60"
            >
              Open roster
            </Link>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {artists.slice(0, 4).map((a) => {
            const img = a.spotifyImageUrl || a.imageUrl;
            return (
              <Link
                key={a.id}
                href="/dashboard/roster"
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/12"
              >
                <div className="flex items-center gap-3">
                  {img ? (
                    <img
                      src={img}
                      alt={a.stageName}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.06]">
                      <span className="text-sm font-bold text-white/40">{a.stageName[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                      {a.stageName}
                    </p>
                    <p className="truncate text-xs text-white/25">{a.genre}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-black/30 py-2">
                    <p className="text-[9px] uppercase tracking-wider text-white/20">Followers</p>
                    <p className="text-xs font-semibold text-white/75">
                      {fmtFollowers(a.followers)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/30 py-2">
                    <p className="text-[9px] uppercase tracking-wider text-white/20">Artist</p>
                    <p className="text-xs font-semibold text-white/75">{fmtPop(a.popularity)}</p>
                  </div>
                  <div className="rounded-lg bg-black/30 py-2">
                    <p className="text-[9px] uppercase tracking-wider text-white/20">Tracks</p>
                    <p className="text-xs font-semibold text-white/75">
                      {typeof a.avgTopTrackPopularity === "number"
                        ? `${a.avgTopTrackPopularity}/100`
                        : "—"}
                    </p>
                  </div>
                </div>
                {typeof a.followers === "number" ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[9px] text-white/15">
                      <span>Share of roster</span>
                      <span>{Math.round((a.followers / maxFollowers) * 100)}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500/50 to-amber-400/80 transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (a.followers / maxFollowers) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent invoices */}
      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/25">
            Recent invoices
          </h2>
          <Link
            href="/dashboard/invoices"
            className="text-[10px] uppercase tracking-[0.2em] text-white/25 hover:text-white/45"
          >
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {invoices.slice(0, 5).map((inv, i) => (
            <div
              key={inv.id}
              className={`flex items-center justify-between px-5 py-4 ${
                i < Math.min(invoices.length, 5) - 1 ? "border-b border-white/[0.04]" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white/75">{inv.billToName}</p>
                <p className="text-xs text-white/25">
                  #{inv.invoiceNumber} ·{" "}
                  {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white/75">
                  {FMT.format(calcInvoiceTotal(inv).total)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                    inv.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400/85"
                      : inv.status === "pending"
                        ? "bg-amber-500/10 text-amber-400/85"
                        : "bg-white/[0.04] text-white/30"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
