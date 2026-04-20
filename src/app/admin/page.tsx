"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { getInvoices, FMT, type Invoice } from "@/lib/storage";
import { summarizeInvoices } from "@/lib/invoice-stats";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const managedClients = [
  {
    id: "nvc-portal",
    name: "NVC Portal",
    type: "Video production workspace",
    href: "/dashboard",
    logo: "/nvc-logo.png",
    initials: "NVC",
  },
];

export default function AdminPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const stats = useMemo(() => summarizeInvoices(invoices), [invoices]);
  const totalRevenueDisplay = stats.paidTotal > 0 ? FMT.format(stats.paidTotal) : "—";

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/nvc-logo.png" alt="NVC" width={28} height={28} className="opacity-70" />
            </Link>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div>
              <p className="text-white/80 text-xs font-medium">NVC Admin</p>
              <p className="text-white/25 text-[10px]">Operations console</p>
            </div>
          </div>
          <Link href="/logout" className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-[0.2em] transition-colors">
            Sign Out
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-xl font-medium text-white/90">Admin console</h1>
          <p className="text-white/30 text-sm mt-1">Invoices &amp; client workspaces (same data as the NVC portal)</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Invoices (all)", value: String(stats.totalCount), sub: "In this browser" },
            { label: "Open / pending", value: String(stats.openCount), sub: FMT.format(stats.openTotal) + " outstanding" },
            { label: "Paid (closed)", value: String(stats.paidCount), sub: totalRevenueDisplay + " collected" },
            {
              label: "Stripe & Apple Pay",
              value: "Pay hub",
              sub: "Test checkout · wallets",
              href: "/dashboard/payments",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i + 1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="glass rounded-2xl p-4"
            >
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">{stat.label}</p>
              {"href" in stat && stat.href ? (
                <Link href={stat.href} className="block mt-2 group">
                  <p className="text-white/90 text-2xl font-semibold group-hover:text-white transition-colors">{stat.value}</p>
                  <p className="text-white/35 text-xs mt-1">{stat.sub}</p>
                </Link>
              ) : (
                <>
                  <p className="text-white/90 text-2xl font-semibold mt-2">{stat.value}</p>
                  <p className="text-white/20 text-xs mt-1">{stat.sub}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white/85 text-xs uppercase tracking-[0.12em] transition-colors"
          >
            Open invoice hub
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs uppercase tracking-[0.12em] transition-colors"
          >
            New invoice
          </Link>
        </motion.div>

        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em]">Client portals</h2>
            <span className="text-white/15 text-[10px]">NVC billing + Stripe payments run in this client portal</span>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            {managedClients.map((client, i) => (
              <div
                key={client.id}
                className={`flex items-center justify-between px-5 py-5 ${i < managedClients.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                <div className="flex items-center gap-4">
                  {client.logo ? (
                    <Image src={client.logo} alt="" width={40} height={40} className="rounded-xl" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                      <span className="text-white/40 text-xs font-bold">{client.initials}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white/80 text-sm font-medium">{client.name}</p>
                    <p className="text-white/25 text-xs">{client.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-white/60 text-sm">{stats.totalCount} invoices</p>
                    <p className="text-white/20 text-xs">{FMT.format(stats.openTotal)} open</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400/80">active</span>
                  <Link href={client.href} className="text-white/30 hover:text-white/60 transition-colors" aria-label="Open portal">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
