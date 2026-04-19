"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { NVC_COMPANY } from "@/lib/nvc-brand";

function SuccessBody() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const token = searchParams.get("t");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-400/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Image src="/nvc-logo.png" alt={NVC_COMPANY} width={48} height={48} className="mx-auto mb-6 opacity-90" />
        <h1 className="text-white/90 text-xl font-medium mb-2">Payment submitted</h1>
        <p className="text-white/40 text-sm mb-6">
          Stripe is processing this payment. You will receive a receipt from Stripe if email was provided at checkout.
        </p>
        {sessionId ? (
          <p className="text-white/20 text-[10px] font-mono break-all mb-8">Session {sessionId}</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {token ? (
            <Link
              href={`/i?t=${encodeURIComponent(token)}`}
              className="inline-flex justify-center py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white/80 text-sm transition-colors"
            >
              Back to invoice
            </Link>
          ) : null}
          <Link href="/" className="text-white/30 hover:text-white/55 text-xs uppercase tracking-[0.2em]">
            {NVC_COMPANY}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/30 text-sm">Loading…</div>}>
      <SuccessBody />
    </Suspense>
  );
}
