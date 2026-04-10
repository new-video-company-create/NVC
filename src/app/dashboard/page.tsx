"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getInvoices, getArtists, calcInvoiceTotal, FMT, type Invoice, type Artist } from "@/lib/storage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const quickActions = [
  { title: "New Invoice", description: "Generate and send a client invoice", href: "/dashboard/invoices/new", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg> },
  { title: "Artist Roster", description: "Manage your artist lineup", href: "/dashboard/roster", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { title: "EPK Generator", description: "Create artist one-sheets & press kits", href: "/dashboard/epk", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
  { title: "Transcript Studio", description: "Transcribe Google Meet recordings", href: "/dashboard/transcripts", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> },
];

export default function DashboardOverview() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
    setArtists(getArtists());
  }, []);

  const openInvoices = invoices.filter((i) => i.status === "pending" || i.status === "draft");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const openTotal = openInvoices.reduce((s, i) => s + calcInvoiceTotal(i).total, 0);
  const paidTotal = paidInvoices.reduce((s, i) => s + calcInvoiceTotal(i).total, 0);

  const stats = [
    { label: "Open Invoices", value: String(openInvoices.length), sub: `${FMT.format(openTotal)} outstanding` },
    { label: "Paid This Month", value: FMT.format(paidTotal), sub: `${paidInvoices.length} invoices` },
    { label: "Active Artists", value: String(artists.filter((a) => a.status === "active").length), sub: `${artists.length} total` },
    { label: "Meetings This Week", value: "5", sub: "2 transcribed" },
  ];

  return (
    <div className="space-y-8">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-4">
        <Image src="/tru-logo.png" alt="Tru Management" width={48} height={48} className="rounded-xl" />
        <div>
          <h1 className="text-xl font-medium text-white/90">Welcome back, Joe</h1>
          <p className="text-white/30 text-sm mt-1">Here&apos;s what&apos;s happening with Tru Management</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible" className="glass rounded-2xl p-4">
            <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-white/90 text-2xl font-semibold mt-2">{stat.value}</p>
            <p className="text-white/20 text-xs mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link key={a.title} href={a.href} className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 group">
              <span className="text-white/30 group-hover:text-white/60 transition-colors">{a.icon}</span>
              <div><p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{a.title}</p><p className="text-white/20 text-xs mt-0.5">{a.description}</p></div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
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
