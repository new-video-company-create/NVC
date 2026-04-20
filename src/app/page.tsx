"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const clients = [
  {
    name: "NVC Client Portal",
    description: "Video production workspace",
    href: "/login",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/[0.015] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[600px] bg-white/[0.01] rounded-full blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between px-6 py-5 md:px-12"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/nvc-logo.png"
              alt="NVC"
              width={48}
              height={48}
              className="opacity-90"
            />
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-sm text-white/50 hover:text-white transition-colors duration-300 tracking-wider uppercase"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white transition-colors duration-300 tracking-wider uppercase"
            >
              Portal
            </Link>
          </div>
        </motion.nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="animate-float"
          >
            <Image
              src="/nvc-logo.png"
              alt="NVC — New Video Company"
              width={220}
              height={220}
              className="mx-auto mb-8 drop-shadow-[0_0_60px_rgba(255,255,255,0.08)]"
              priority
            />
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              NEW VIDEO
              <span className="block text-white/40">COMPANY</span>
            </h1>
          </motion.div>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="max-w-md text-white/30 text-lg md:text-xl mb-12 tracking-wide"
          >
            Video production, social content, and campaign execution
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 px-8 py-4 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white transition-all duration-500"
            >
              <span className="absolute inset-0 rounded-full border border-white/10 group-hover:border-white/30 transition-colors duration-500" />
              <span className="absolute inset-0 rounded-full animate-shimmer" />
              Enter Portal
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.2em] transition-colors duration-300"
            >
              Book a Call
            </Link>
          </motion.div>
        </main>

        {/* Clients strip */}
        <motion.section
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="px-6 pb-16 md:px-12"
        >
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 mb-6 text-center">
              Client Network
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {clients.map((client) => (
                <Link
                  key={client.name}
                  href={client.href}
                  className="glass glass-hover rounded-2xl px-8 py-5 flex flex-col items-center gap-1 transition-all duration-500 group min-w-[200px]"
                >
                  <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                    {client.name}
                  </span>
                  <span className="text-white/25 text-xs tracking-wider">
                    {client.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="px-6 py-8 md:px-12 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-[10px] tracking-[0.2em] text-white/15 uppercase">
              &copy; {new Date().getFullYear()} New Video Company
            </span>
            <span className="text-[10px] tracking-[0.2em] text-white/15 uppercase">
              All Rights Reserved
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
