"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type StripeHealth = { ok: boolean; configured: boolean; mode?: string; hint?: string };

export default function PaymentsHubPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [health, setHealth] = useState<StripeHealth | null>(null);

  useEffect(() => {
    fetch("/api/stripe/health", { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, configured: false, hint: "Could not reach /api/stripe/health" }));
  }, []);

  const runTestCheckout = async () => {
    setError(null);
    setLastUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: 500,
          invoiceNumber: "TEST-001",
          customerName: "Stripe test",
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Image src="/nvc-logo.png" alt="NVC" width={40} height={40} className="rounded-lg opacity-90" />
        <div>
          <h1 className="text-xl font-medium text-white/90">Payments</h1>
          <p className="text-white/30 text-sm mt-1">Stripe checkout — test mode</p>
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
              Stripe secret key is set ({health.mode === "test" ? "test" : health.mode === "live" ? "live" : "unknown"} mode). You can run the test checkout below.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-white/80">Stripe is not configured on the server yet.</p>
              <ol className="list-decimal list-inside space-y-1 text-white/55 text-xs leading-relaxed">
                <li>Open Stripe Dashboard → Developers → API keys.</li>
                <li>Copy the Secret key (starts with sk_test_ for testing).</li>
                <li>
                  Local: add to <code className="text-white/70">.env.local</code> as{" "}
                  <code className="text-white/70">STRIPE_SECRET_KEY=sk_test_…</code>
                </li>
                <li>
                  Vercel: Project → Settings → Environment Variables → add <code className="text-white/70">STRIPE_SECRET_KEY</code> → Redeploy.
                </li>
                <li>Optional: set <code className="text-white/70">NEXT_PUBLIC_APP_URL=https://your-domain.com</code> for redirect URLs.</li>
              </ol>
              {health.hint ? <p className="text-white/40 text-xs pt-1">{health.hint}</p> : null}
            </div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5 border border-[#635BFF]/20"
      >
        <div className="flex items-center gap-2 text-[#a99ffb] text-xs uppercase tracking-[0.2em]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.564 6.8 7.297 2.731.988 3.814 1.988 3.814 3.169 0 1.04-.84 1.657-2.436 1.657-1.901 0-4.834-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
          </svg>
          Stripe
        </div>
        <p className="text-white/50 text-sm leading-relaxed">
          Use this tab to confirm your <code className="text-white/70">STRIPE_SECRET_KEY</code> is wired on the server. A test checkout opens in a new tab for{" "}
          <span className="text-white/80">$5.00 USD</span>.
        </p>
        <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4 space-y-2 text-sm text-white/45">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em]">Test card</p>
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
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#635BFF] hover:bg-[#5851e6] text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Creating session…" : "Run $5 test checkout"}
        </button>
        <p className="text-white/25 text-[10px] leading-relaxed">
          Add your secret key from the Stripe Dashboard to Vercel (or <code className="text-white/40">.env.local</code>). Never commit keys to git.
        </p>
      </motion.div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <h2 className="text-white/40 text-[10px] uppercase tracking-[0.3em]">Invoices</h2>
        <p className="text-white/45 text-sm">Create an invoice, copy the public link, and use Pay on that page to run a real-amount checkout.</p>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-emerald-400/70 hover:text-emerald-400 text-sm transition-colors"
        >
          Go to invoices
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
