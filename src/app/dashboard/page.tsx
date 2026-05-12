"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { getInvoices, calcInvoiceTotal, FMT, type Invoice } from "@/lib/storage";
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

/** Days from today to date-only ISO string (local). */
function daysFromToday(iso: string) {
  const t = new Date(iso + "T12:00:00").getTime();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((t - start.getTime()) / 86400000);
}

type StripeHealth = {
  ok: boolean;
  configured: boolean;
  mode?: string;
  hint?: string;
};

export default function DashboardOverview() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

  useEffect(() => {
    setInvoices(getInvoices());
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
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-2 rounded-lg border border-[#f97316]/35 bg-[#f97316]/10 px-4 py-2 text-sm font-medium text-[#f97316] transition hover:bg-[#f97316]/15"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Open studio board
            </Link>
            <p className="max-w-xs text-right text-[10px] leading-snug text-white/25 md:text-right">
              Jobs, shot-day checklist, and new-business leads (saved in this browser).
            </p>
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
              title: "Payment tracker",
              href: "/dashboard/tracker",
              blurb: "Weekly balances & late fees",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-6m3 6V7m3 10v-4m5 4H4m16 0a2 2 0 002-2V7a2 2 0 00-2-2M4 17a2 2 0 01-2-2V7a2 2 0 012-2"
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

      {/* Recent invoices */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
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
