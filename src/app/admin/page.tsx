"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const clients = [
  {
    name: "Tru Management",
    type: "Music Management",
    status: "active",
    invoices: 3,
    revenue: "$10,500",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/nvc-logo.png" alt="NVC" width={28} height={28} className="opacity-70" />
            </Link>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div>
              <p className="text-white/80 text-xs font-medium">NVC Admin</p>
              <p className="text-white/25 text-[10px]">Management Console</p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-[0.2em] transition-colors"
          >
            Sign Out
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-xl font-medium text-white/90">Admin Console</h1>
          <p className="text-white/30 text-sm mt-1">Manage all NVC client portals</p>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Clients", value: "1", sub: "1 active" },
            { label: "Total Revenue", value: "$10,500", sub: "This quarter" },
            { label: "Open Invoices", value: "3", sub: "Across all clients" },
            { label: "Active Projects", value: "2", sub: "In progress" },
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
              <p className="text-white/90 text-2xl font-semibold mt-2">{stat.value}</p>
              <p className="text-white/20 text-xs mt-1">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Client List */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em]">Client Portals</h2>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white/50 text-xs uppercase tracking-[0.12em] transition-all cursor-pointer">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Client
            </button>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            {clients.map((client, i) => (
              <div
                key={client.name}
                className={`flex items-center justify-between px-5 py-5 ${
                  i < clients.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <span className="text-white/40 text-xs font-bold">TM</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">{client.name}</p>
                    <p className="text-white/25 text-xs">{client.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-white/60 text-sm">{client.revenue}</p>
                    <p className="text-white/20 text-xs">{client.invoices} invoices</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400/80">
                    {client.status}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
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
