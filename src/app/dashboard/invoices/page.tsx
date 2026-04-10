"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getInvoices, getInvoiceById, calcInvoiceTotal, FMT, type Invoice } from "@/lib/storage";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";

function InvoicesList() {
  const searchParams = useSearchParams();
  const viewId = searchParams.get("view");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [viewing, setViewing] = useState<Invoice | null>(null);

  useEffect(() => {
    const all = getInvoices();
    setInvoices(all);
    if (viewId) {
      const found = getInvoiceById(viewId);
      if (found) setViewing(found);
    }
  }, [viewId]);

  const handleDownload = (inv: Invoice) => downloadInvoicePDF(inv);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/tru-logo.png" alt="Tru" width={32} height={32} className="rounded-lg" />
          <div>
            <h1 className="text-xl font-medium text-white/90">Invoices</h1>
            <p className="text-white/30 text-sm mt-1">{invoices.length} invoices</p>
          </div>
        </div>
        <Link href="/dashboard/invoices/new" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all duration-300">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Invoice
        </Link>
      </div>

      {/* Invoice viewing modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={() => setViewing(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-8 max-w-2xl w-full space-y-6">
              <div className="flex items-start justify-between pb-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: viewing.brandColor || "#fff" }}>Tru Management</h2>
                  <p className="text-white/40 text-sm mt-1">Joe Meyer | 508-864-7360 | Joe@trumgmt.org</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(viewing)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors cursor-pointer">Download PDF</button>
                  <Link href={`/dashboard/invoices/new?clone=${viewing.id}`} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors">Clone</Link>
                  <button onClick={() => setViewing(null)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/40 text-xs transition-colors cursor-pointer">Close</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Invoice</p><p className="text-white/80 font-mono">{viewing.invoiceNumber}</p></div>
                <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Date</p><p className="text-white/80">{new Date(viewing.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
                <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Bill To</p><p className="text-white/80">{viewing.billToName}</p></div>
              </div>
              {viewing.lineItems.filter(li => li.description).map((li, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/[0.03]">
                  <span className="text-white/60">{li.description} {li.quantity > 1 ? `×${li.quantity}` : ""}</span>
                  <span className="text-white/80 font-medium">{FMT.format(parseFloat(li.amount) || 0)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-white/60 font-medium">Total</span>
                <span className="text-white text-lg font-bold">{FMT.format(calcInvoiceTotal(viewing).total)}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-2xl overflow-hidden">
        {invoices.map((inv, i) => {
          const totals = calcInvoiceTotal(inv);
          return (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors ${i < invoices.length - 1 ? "border-b border-white/[0.04]" : ""}`}
            >
              <button onClick={() => setViewing(inv)} className="flex-1 flex items-center gap-4 text-left cursor-pointer">
                <div className="min-w-0">
                  <p className="text-white/70 text-sm font-medium">{inv.billToName || "Untitled"}</p>
                  <p className="text-white/25 text-xs">#{inv.invoiceNumber} &middot; {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </button>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-white/70 text-sm font-medium">{FMT.format(totals.total)}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400/80" : inv.status === "pending" ? "bg-amber-500/10 text-amber-400/80" : "bg-white/[0.04] text-white/30"}`}>{inv.status}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleDownload(inv)} className="p-1.5 text-white/15 hover:text-white/50 transition-colors cursor-pointer" title="Download PDF">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                  <Link href={`/dashboard/invoices/new?clone=${inv.id}`} className="p-1.5 text-white/15 hover:text-white/50 transition-colors" title="Clone">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
        {invoices.length === 0 && <div className="px-5 py-12 text-center text-white/20 text-sm">No invoices yet</div>}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return <Suspense fallback={<div className="text-white/30 py-12 text-center text-sm">Loading...</div>}><InvoicesList /></Suspense>;
}
