"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Portal = "admin" | "client" | null;

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (portal === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden px-6">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-10"
        >
          <Link href="/">
            <Image src="/nvc-logo.png" alt="NVC" width={64} height={64} className="opacity-80 hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {!portal ? (
            <motion.div
              key="portal-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-center text-white/40 text-xs uppercase tracking-[0.3em] mb-8">
                Select Portal
              </h2>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setPortal("admin")}
                  className="glass glass-hover rounded-2xl p-6 text-left transition-all duration-500 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 font-medium text-sm">NVC Admin</p>
                      <p className="text-white/30 text-xs mt-1">Management Console</p>
                    </div>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => setPortal("client")}
                  className="glass glass-hover rounded-2xl p-6 text-left transition-all duration-500 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 font-medium text-sm">Tru Management</p>
                      <p className="text-white/30 text-xs mt-1">Client Dashboard</p>
                    </div>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => setPortal(null)}
                className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.2em] mb-8 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-white/90 text-lg font-medium mb-1">
                {portal === "admin" ? "NVC Admin" : "Tru Management"}
              </h2>
              <p className="text-white/30 text-xs mb-8">
                {portal === "admin" ? "Management Console" : "Client Portal"}
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="you@email.com"
                  />
                </div>

                <div>
                  <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2 block">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-sm uppercase tracking-[0.15em] transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
