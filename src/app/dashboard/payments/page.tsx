"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PaymentsGuide } from "./PaymentsGuide";

type StripeHealth = { ok: boolean; configured: boolean; mode?: string; hint?: string };
const PRESET_AMOUNTS = [5, 10, 15, 20, 35, 50, 75, 100];
const MONEY_FMT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function PaymentsHubPage() {
  const [testLoading, setTestLoading] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [health, setHealth] = useState<StripeHealth | null>(null);
  const [amountUsd, setAmountUsd] = useState(25);
  const [customerName, setCustomerName] = useState("");
  const [itemName, setItemName] = useState("NVC Merch");
  const [note, setNote] = useState("");

  const refreshHealth = useCallback(() => {
    fetch(`/api/stripe/health?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() =>
        setHealth({ ok: false, configured: false, hint: "Could not reach /api/stripe/health" }),
      );
  }, []);

  useEffect(() => {
    refreshHealth();
    const onFocus = () => refreshHealth();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshHealth]);

  const runTestCheckout = async () => {
    setError(null);
    setLastUrl(null);
    setTestLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: 500,
          invoiceNumber: "DEMO-001",
          customerName: "Wallet demo",
          itemName: "NVC Checkout Demo",
          note: "Quick wallet + card checkout test",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Request failed");
        return;
      }
      if (data.url) {
        setLastUrl(data.url);
        window.open(data.url as string, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setTestLoading(false);
    }
  };

  const runCustomCharge = async () => {
    setError(null);
    setLastUrl(null);
    const bounded = Math.max(5, Math.min(100, amountUsd));
    const amountCents = Math.round(bounded * 100);
    setChargeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          invoiceNumber: `POS-${new Date().toISOString().slice(0, 10)}`,
          customerName: customerName.trim() || "Walk-up customer",
          itemName: itemName.trim() || "NVC custom charge",
          note: note.trim() || "Created from dashboard quick charge",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Custom checkout failed");
        return;
      }
      if (data.url) {
        setLastUrl(data.url);
        window.open(data.url as string, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setChargeLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Image src="/nvc-logo.png" alt="NVC" width={40} height={40} className="rounded-lg opacity-90" />
        <div>
          <h1 className="text-xl font-medium text-white/90">Payments</h1>
          <p className="text-white/30 text-sm mt-1">Stripe Checkout · cards, Apple Pay, Google Pay</p>
        </div>
      </div>

      {health && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            health.configured && health.ok
              ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400/90"
              : "border-amber-500/25 bg-amber-500/5 text-amber-200/80"
          }`}
        >
          {health.configured && health.ok ? (
            <p>
              Secret key is loaded ({health.mode === "test" ? "test" : health.mode === "live" ? "live" : "unknown"} mode). You can open the demo checkout below — wallets show when the domain is registered in Stripe and the device supports them.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-white/80">Stripe is not configured on the server yet.</p>
              <p className="text-white/50 text-xs">Expand “Keep your Stripe secret key safe” below and follow the steps — paste the key only in Vercel or .env.local, never in chat.</p>
              {health.hint ? <p className="text-white/40 text-xs pt-1">{health.hint}</p> : null}
            </div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5 border border-emerald-500/20"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-white/90 text-base font-medium">Quick charge (POS)</h2>
            <p className="text-white/40 text-xs mt-1">
              Build a one-off Stripe checkout for merch / door / pop-up sales. Range is {MONEY_FMT.format(5)}–{MONEY_FMT.format(100)}.
            </p>
          </div>
          <span className="text-emerald-400/80 text-xs uppercase tracking-[0.18em]">{MONEY_FMT.format(Math.max(5, Math.min(100, amountUsd)))}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmountUsd(n)}
              className={`rounded-lg border px-2 py-2 text-xs transition-colors cursor-pointer ${
                amountUsd === n
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300/90"
                  : "border-white/[0.07] bg-white/[0.03] text-white/55 hover:text-white/75"
              }`}
            >
              {MONEY_FMT.format(n)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-white/35 text-[10px] uppercase tracking-[0.18em] mb-2 block">Amount (USD)</label>
            <input
              type="number"
              min={5}
              max={100}
              step={1}
              value={amountUsd}
              onChange={(e) => setAmountUsd(Math.round(Number(e.target.value) || 5))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-white/35 text-[10px] uppercase tracking-[0.18em] mb-2 block">Customer (optional)</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-up customer"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-white/35 text-[10px] uppercase tracking-[0.18em] mb-2 block">Item / reason</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="NVC Shirt"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-white/35 text-[10px] uppercase tracking-[0.18em] mb-2 block">Internal note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Concert merch table"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={runCustomCharge}
          disabled={chargeLoading}
          className="w-full py-3.5 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-black text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {chargeLoading ? "Creating custom checkout…" : `Charge ${MONEY_FMT.format(Math.max(5, Math.min(100, amountUsd)))}`}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5 border border-[#635BFF]/20"
      >
        <div className="flex items-center gap-2 text-[#a99ffb] text-xs uppercase tracking-[0.2em]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.564 6.8 7.297 2.731.988 3.814 1.988 3.814 3.169 0 1.04-.84 1.657-2.436 1.657-1.901 0-4.834-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
          </svg>
          Live demo checkout
        </div>
        <p className="text-white/50 text-sm leading-relaxed">
          Opens Stripe-hosted Checkout in a new tab for <span className="text-white/80">$5.00 USD</span>. On supported phones you may see{" "}
          <strong className="text-white/70">Apple Pay</strong> or <strong className="text-white/70">Google Pay</strong> above the card form after your domain is verified in Stripe.
        </p>
        <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4 space-y-2 text-sm text-white/45">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em]">Test card (always works)</p>
          <p>
            <span className="text-white/70 font-mono">4242 4242 4242 4242</span> · any future expiry · any CVC · any ZIP
          </p>
        </div>
        {error ? <p className="text-red-400/90 text-sm">{error}</p> : null}
        {lastUrl ? (
          <p className="text-white/35 text-xs break-all">
            Opened: <span className="text-emerald-400/80">{lastUrl}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={runTestCheckout}
          disabled={testLoading}
          className="w-full py-3.5 rounded-xl bg-[#635BFF] hover:bg-[#5851e6] text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {testLoading ? "Creating session…" : "Open $5 demo checkout (wallets if available)"}
        </button>
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-white/25 text-[10px] uppercase tracking-[0.3em] px-1">Guides</h2>
        <PaymentsGuide />
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <h2 className="text-white/40 text-[10px] uppercase tracking-[0.3em]">Invoice hub</h2>
        <p className="text-white/45 text-sm">
          Build invoices, copy a public pay link, and let clients pay in Stripe Checkout (card or wallet). PDF download is still available.
        </p>
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-emerald-400/70 hover:text-emerald-400 text-sm transition-colors">
          Go to invoices
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
