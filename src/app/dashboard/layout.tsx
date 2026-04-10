"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Invoices",
    href: "/dashboard/invoices",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Transcripts",
    href: "/dashboard/transcripts",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/nvc-logo.png" alt="NVC" width={28} height={28} className="opacity-70" />
            </Link>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div>
              <p className="text-white/80 text-xs font-medium">Tru Management</p>
              <p className="text-white/25 text-[10px]">Client Dashboard</p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-[0.2em] transition-colors"
          >
            Sign Out
          </Link>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 px-5 -mb-px">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                  isActive ? "text-white/90" : "text-white/30 hover:text-white/50"
                }`}
              >
                {item.icon}
                <span className="tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute bottom-0 left-0 right-0 h-px bg-white/40"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
