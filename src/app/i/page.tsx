"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { decodeInvoiceToken, type PublicInvoiceSnapshot } from "@/lib/invoice-public";
import { calcInvoiceTotal, FMT, type Invoice } from "@/lib/storage";
import { NVC_COMPANY, NVC_EMAIL, NVC_TAGLINE } from "@/lib/nvc-brand";

function PublicInvoiceBody() {
  const searchParams = useSearchParams();
  const rawT = searchParams.get("t");
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const data = useMemo(() => {
    if (!rawT) return { error: "Missing invoice link.", snapshot: null as PublicInvoiceSnapshot | null };
    const snap = decodeInvoiceToken(rawT);
    if (!snap) return { error: "This invoice link is invalid or corrupted.", snapshot: null as PublicInvoiceSnapshot | null };
    return { error: null, snapshot: snap };
  }, [rawT]);

  const invoice: Invoice | null = data.snapshot
    ? {
        ...data.snapshot,
        status: "pending",
        createdAt: data.snapshot.date,
      }
    : null;

  const totals = invoice ? calcInvoiceTotal(invoice) : null;
  const accent = invoice?.brandColor || "#ffffff";

  const handlePay = async () => {
    if (!rawT || !totals) return;
    setPayError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceToken: rawT }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setPayError(typeof payload.error === "string" ? payload.error : "Checkout failed");
        return;
      }
      if (payload.url) {
        window.location.href = payload.url as string;
        return;
      }
      setPayError("No checkout URL returned");
    } catch (e) {
      setPayError(String(e));
    } finally {
      setPaying(false);
    }
  };

  if (data.error || !invoice || !totals) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <Image src="/nvc-logo.png" alt={NVC_COMPANY} width={56} height={56} className="opacity-80 mb-6" />
        <h1 className="text-white/80 text-lg font-medium mb-2">Invoice unavailable</h1>
        <p className="text-white/35 text-sm max-w-md mb-8">{data.error}</p>
        <Link href="/" className="text-white/40 hover:text-white/70 text-xs uppercase tracking-[0.2em]">
          New Video Company
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
          <Image src="/nvc-logo.png" alt={NVC_COMPANY} width={36} height={36} />
          <div className="text-left">
            <p className="text-xs font-medium tracking-wide text-white/80">{NVC_COMPANY}</p>
            <p className="text-[10px] text-white/30">{NVC_TAGLINE}</p>
          </div>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">Invoice</span>
      </header>

      <main className="max-w-3xl mx-auto w-full px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 space-y-8">
          <div className="flex items-start justify-between pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: accent }}>
                {NVC_COMPANY}
              </h1>
              <p className="text-white/40 text-sm mt-1">{NVC_EMAIL}</p>
            </div>
            <Image src="/nvc-logo.png" alt="" width={56} height={56} className="rounded-xl opacity-90" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Invoice</p>
              <p className="text-white/80 font-mono">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Date</p>
              <p className="text-white/80">
                {new Date(invoice.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Due</p>
              <p className="text-white/80">
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "Upon receipt"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Bill to</p>
            <p className="text-white/80">{invoice.billToName || "—"}</p>
            {invoice.billToAddress ? <p className="text-white/40 text-xs mt-1">{invoice.billToAddress}</p> : null}
          </div>

          {invoice.campaignScope ? (
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Scope</p>
              <p className="text-white/60 text-sm whitespace-pre-wrap">{invoice.campaignScope}</p>
            </div>
          ) : null}

          <div>
            <div className="grid grid-cols-12 gap-2 pb-2 border-b border-white/[0.06] mb-2 text-[10px] uppercase tracking-[0.15em] text-white/25">
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            {invoice.lineItems
              .filter((li) => li.description)
              .map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-white/[0.03] text-sm">
                  <span className="col-span-6 text-white/65">{li.description}</span>
                  <span className="col-span-2 text-white/40 text-center">{li.quantity}</span>
                  <span className="col-span-2 text-white/45 text-right">{FMT.format(parseFloat(li.rate) || 0)}</span>
                  <span className="col-span-2 text-white/85 font-medium text-right">{FMT.format(parseFloat(li.amount) || 0)}</span>
                </div>
              ))}
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/30">Subtotal</span>
                <span className="text-white/60">{FMT.format(totals.subtotal)}</span>
              </div>
              {invoice.discountEnabled && totals.discount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-white/30">Discount</span>
                  <span className="text-red-400/70">-{FMT.format(totals.discount)}</span>
                </div>
              ) : null}
              {invoice.taxEnabled ? (
                <div className="flex justify-between">
                  <span className="text-white/30">
                    {invoice.taxLabel} ({invoice.taxRate}%)
                  </span>
                  <span className="text-white/60">{FMT.format(totals.tax)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-white/[0.08] pt-3 mt-2">
                <span className="font-medium" style={{ color: accent }}>
                  Total due
                </span>
                <span className="text-white text-xl font-bold">{FMT.format(totals.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes ? (
            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Notes</p>
              <p className="text-white/50 text-xs whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3">
            <p className="text-white/50 text-xs">Pay securely with Stripe (cards, wallets). Test mode: use card 4242 4242 4242 4242.</p>
            {payError ? <p className="text-red-400/90 text-xs">{payError}</p> : null}
            <button
              type="button"
              onClick={handlePay}
              disabled={paying || totals.total < 0.5}
              className="w-full py-3.5 rounded-xl bg-[#635BFF] hover:bg-[#5851e6] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {paying ? "Opening checkout…" : `Pay ${FMT.format(totals.total)}`}
            </button>
            {totals.total < 0.5 ? (
              <p className="text-amber-400/80 text-[10px]">Total is below Stripe&apos;s minimum for this demo ($0.50).</p>
            ) : null}
          </div>
        </motion.div>

        <p className="text-center text-white/20 text-[10px] mt-8 pb-8">
          Encoded preview only — totals are verified again at checkout.
        </p>
      </main>
    </div>
  );
}

export default function PublicInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white/30 text-sm">Loading invoice…</div>
      }
    >
      <PublicInvoiceBody />
    </Suspense>
  );
}
