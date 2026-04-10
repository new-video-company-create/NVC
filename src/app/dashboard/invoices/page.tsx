"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const invoices = [
  { id: "2026-003", client: "Create Music Group", scope: "P!NK Marketing Campaign", amount: "$3,500.00", status: "pending", date: "Apr 7, 2026" },
  { id: "2026-002", client: "Atlantic Records", scope: "Social Media Campaign Q1", amount: "$4,200.00", status: "paid", date: "Mar 28, 2026" },
  { id: "2026-001", client: "Sony Music", scope: "Spotify Playlist Promotion", amount: "$2,800.00", status: "paid", date: "Mar 15, 2026" },
];

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white/90">Invoices</h1>
          <p className="text-white/30 text-sm mt-1">Create and manage client invoices</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all duration-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.04]">
          <span className="col-span-2 text-white/20 text-[10px] uppercase tracking-[0.2em]">Invoice</span>
          <span className="col-span-3 text-white/20 text-[10px] uppercase tracking-[0.2em]">Client</span>
          <span className="col-span-3 text-white/20 text-[10px] uppercase tracking-[0.2em] hidden md:block">Scope</span>
          <span className="col-span-2 text-white/20 text-[10px] uppercase tracking-[0.2em] text-right">Amount</span>
          <span className="col-span-2 text-white/20 text-[10px] uppercase tracking-[0.2em] text-right">Status</span>
        </div>

        {invoices.map((inv, i) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={`grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
              i < invoices.length - 1 ? "border-b border-white/[0.04]" : ""
            }`}
          >
            <div className="col-span-2">
              <p className="text-white/60 text-sm font-mono">#{inv.id}</p>
              <p className="text-white/25 text-xs">{inv.date}</p>
            </div>
            <div className="col-span-3">
              <p className="text-white/70 text-sm">{inv.client}</p>
            </div>
            <div className="col-span-3 hidden md:block">
              <p className="text-white/40 text-sm truncate">{inv.scope}</p>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-white/80 text-sm font-medium">{inv.amount}</p>
            </div>
            <div className="col-span-2 text-right">
              <span
                className={`inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  inv.status === "paid"
                    ? "bg-emerald-500/10 text-emerald-400/80"
                    : "bg-amber-500/10 text-amber-400/80"
                }`}
              >
                {inv.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
