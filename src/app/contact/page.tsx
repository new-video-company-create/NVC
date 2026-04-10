"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const services = [
  { id: "mgmt", label: "Artist Management" },
  { id: "marketing", label: "Music Marketing" },
  { id: "creative", label: "Creative / Video" },
  { id: "consulting", label: "Consulting Call" },
  { id: "other", label: "Other" },
];

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

function getNext14Days(): { date: Date; label: string; dayName: string; dayNum: number }[] {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    days.push({
      date: d,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
    });
  }
  return days;
}

export default function ContactPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "",
    service: "", message: "",
    date: "", time: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const days = getNext14Days();

  const canProceed = () => {
    if (step === 0) return form.name && form.email;
    if (step === 1) return form.service;
    if (step === 2) return form.date && form.time;
    return true;
  };

  const handleSubmit = () => {
    const existing = JSON.parse(localStorage.getItem("nvc_contact_submissions") || "[]");
    existing.unshift({ ...form, submittedAt: new Date().toISOString(), id: `contact-${Date.now()}` });
    localStorage.setItem("nvc_contact_submissions", JSON.stringify(existing));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/nvc-logo.png" alt="NVC" width={40} height={40} className="opacity-90" />
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-semibold text-white/90 mb-3">You&apos;re booked.</h1>
            <p className="text-white/40 text-sm mb-2">
              {form.date} at {form.time}
            </p>
            <p className="text-white/25 text-sm mb-8">
              We&apos;ll send a confirmation to <span className="text-white/50">{form.email}</span> with meeting details.
            </p>
            <Link href="/" className="text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.2em] transition-colors">
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.015] rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/nvc-logo.png" alt="NVC" width={40} height={40} className="opacity-90" />
        </Link>
        <Link href="/login" className="text-sm text-white/30 hover:text-white/60 transition-colors duration-300 tracking-wider uppercase text-xs">
          Portal
        </Link>
      </motion.nav>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">Get in Touch</h1>
            <p className="text-white/30 text-sm">Book a call or send us a message — we&apos;ll get back fast.</p>
          </motion.div>

          {/* Progress */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-center gap-2 mb-8">
            {["Info", "Service", "Schedule", "Confirm"].map((label, i) => (
              <button key={label} onClick={() => { if (i < step) setStep(i); }} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${i < step ? "bg-emerald-500/20 text-emerald-400/80" : i === step ? "bg-white/10 text-white/80 ring-1 ring-white/20" : "bg-white/[0.04] text-white/20"}`}>
                  {i < step ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : i + 1}
                </div>
                {i < 3 && <div className={`w-8 h-px transition-colors duration-300 ${i < step ? "bg-emerald-500/30" : "bg-white/[0.06]"}`} />}
              </button>
            ))}
          </motion.div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-5">
                <div>
                  <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] block mb-2">Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                </div>
                <div>
                  <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] block mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] block mb-2">Company</label>
                    <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Optional" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                  </div>
                  <div>
                    <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] block mb-2">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-5">
                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">What are you looking for?</p>
                <div className="grid grid-cols-1 gap-2">
                  {services.map((s) => (
                    <button key={s.id} onClick={() => setForm({ ...form, service: s.id })} className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-3 ${form.service === s.id ? "bg-white/[0.06] border-white/20 text-white/90" : "bg-white/[0.02] border-white/[0.04] text-white/40 hover:bg-white/[0.04] hover:text-white/60"}`}>
                      <span className="text-sm">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-white/25 text-[10px] uppercase tracking-[0.2em] block mb-2">Tell us more</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Any details that help us prepare..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors resize-none" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-5">
                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">Pick a Date</p>
                <div className="grid grid-cols-5 gap-2">
                  {days.map((d) => (
                    <button key={d.label} onClick={() => setForm({ ...form, date: d.label })} className={`flex flex-col items-center py-3 rounded-xl border transition-all duration-300 cursor-pointer ${form.date === d.label ? "bg-white/[0.08] border-white/20" : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"}`}>
                      <span className={`text-[10px] uppercase tracking-wider ${form.date === d.label ? "text-white/60" : "text-white/20"}`}>{d.dayName}</span>
                      <span className={`text-lg font-semibold mt-0.5 ${form.date === d.label ? "text-white/90" : "text-white/40"}`}>{d.dayNum}</span>
                    </button>
                  ))}
                </div>

                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mt-4">Pick a Time (EST)</p>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, time: t })} className={`py-2.5 rounded-xl border text-sm transition-all duration-300 cursor-pointer ${form.time === t ? "bg-white/[0.08] border-white/20 text-white/90" : "bg-white/[0.02] border-white/[0.04] text-white/30 hover:bg-white/[0.04] hover:text-white/50"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-4">
                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Confirm Your Booking</p>

                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  {[
                    { label: "Name", value: form.name },
                    { label: "Email", value: form.email },
                    ...(form.company ? [{ label: "Company", value: form.company }] : []),
                    ...(form.phone ? [{ label: "Phone", value: form.phone }] : []),
                    { label: "Service", value: services.find(s => s.id === form.service)?.label || form.service },
                    { label: "Date", value: form.date },
                    { label: "Time", value: `${form.time} EST` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-white/25 text-xs">{row.label}</span>
                      <span className="text-white/70 text-sm">{row.value}</span>
                    </div>
                  ))}
                  {form.message && (
                    <div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-white/25 text-xs mb-1">Message</p>
                      <p className="text-white/50 text-sm">{form.message}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer">
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} className="px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium transition-all duration-300 cursor-pointer">
                Confirm Booking
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-white/[0.04]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-[10px] tracking-[0.2em] text-white/15 uppercase">&copy; {new Date().getFullYear()} New Video Company</span>
          <Link href="/" className="text-[10px] tracking-[0.2em] text-white/15 hover:text-white/30 uppercase transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
