"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { saveArtist, type Artist } from "@/lib/storage";

const steps = ["Contact Info", "Schedule Call", "Proposal", "Process"];

export default function OnboardArtistPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [stageName, setStageName] = useState("");
  const [genre, setGenre] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [spotify, setSpotify] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [callDate, setCallDate] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors";
  const labelClass = "text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2 block";

  const canAdvance = () => {
    if (step === 0) return name.trim() && stageName.trim();
    return true;
  };

  const handleSave = () => {
    const onboardingSteps: Artist["onboardingStep"][] = ["contact", "call_scheduled", "proposal_sent", "signed"];
    const artist: Artist = {
      id: `artist-${Date.now()}`,
      name,
      stageName,
      genre,
      email,
      phone,
      instagram,
      spotify,
      website,
      bio,
      status: step >= 3 ? "active" : "onboarding",
      onboardingStep: onboardingSteps[step],
      createdAt: new Date().toISOString(),
    };
    saveArtist(artist);
    setSaved(true);
    setTimeout(() => router.push("/dashboard/roster"), 1200);
  };

  if (saved) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-white/90 text-lg font-medium">Artist Added</h2>
        <p className="text-white/30 text-sm mt-1">Redirecting to roster...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard/roster" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.15em] mb-3 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Roster
        </Link>
        <div className="flex items-center gap-3">
          <Image src="/nvc-logo.png" alt="NVC" width={32} height={32} className="rounded-lg" />
          <h1 className="text-xl font-medium text-white/90">Onboard New Artist</h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 text-xs transition-colors cursor-pointer ${i <= step ? "text-white/80" : "text-white/20"}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < step ? "bg-emerald-500/20 text-emerald-400" : i === step ? "bg-white/10 text-white/80" : "bg-white/[0.04] text-white/20"}`}>
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline tracking-wide">{s}</span>
            </button>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-emerald-500/20" : "bg-white/[0.06]"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 0 && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Full Name *</label><input className={inputClass} placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><label className={labelClass}>Stage Name *</label><input className={inputClass} placeholder="Stage Name" value={stageName} onChange={(e) => setStageName(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Email</label><input type="email" className={inputClass} placeholder="artist@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><label className={labelClass}>Phone</label><input className={inputClass} placeholder="555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              </div>
              <div><label className={labelClass}>Genre</label><input className={inputClass} placeholder="Hip-Hop / R&B / Electronic" value={genre} onChange={(e) => setGenre(e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>Instagram</label><input className={inputClass} placeholder="@handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
                <div><label className={labelClass}>Spotify</label><input className={inputClass} placeholder="Spotify URL" value={spotify} onChange={(e) => setSpotify(e.target.value)} /></div>
                <div><label className={labelClass}>Website</label><input className={inputClass} placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              </div>
              <div><label className={labelClass}>Bio</label><textarea className={`${inputClass} min-h-[80px] resize-none`} placeholder="Brief artist bio..." value={bio} onChange={(e) => setBio(e.target.value)} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Schedule Intro Call</h3>
              <p className="text-white/40 text-sm">Set up an initial meeting with {stageName || "the artist"} to discuss project goals, content direction, and next steps.</p>
              <div><label className={labelClass}>Proposed Date & Time</label><input type="datetime-local" className={inputClass} value={callDate} onChange={(e) => setCallDate(e.target.value)} /></div>
              <div><label className={labelClass}>Call Agenda / Notes</label><textarea className={`${inputClass} min-h-[100px] resize-none`} placeholder="Topics to cover: current deals, goals, distribution, social strategy..." value={callNotes} onChange={(e) => setCallNotes(e.target.value)} /></div>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Suggested Agenda</p>
                <ul className="text-white/40 text-xs space-y-1.5">
                  <li>• Current distribution & release schedule</li>
                  <li>• Social media presence & growth strategy</li>
                  <li>• Revenue streams & financial goals</li>
                  <li>• Production scope expectations & terms</li>
                  <li>• Branding & visual identity</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Production Proposal</h3>
              <p className="text-white/40 text-sm">Outline the production proposal for {stageName || "the artist"}.</p>
              <div><label className={labelClass}>Proposal Details</label><textarea className={`${inputClass} min-h-[120px] resize-none`} placeholder="Production scope, timeline, deliverables, and services included..." value={proposalNotes} onChange={(e) => setProposalNotes(e.target.value)} /></div>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">NVC Production Services</p>
                <ul className="text-white/40 text-xs space-y-1.5">
                  <li>• Artist branding & visual identity</li>
                  <li>• Social growth and channel strategy</li>
                  <li>• Marketing campaign execution</li>
                  <li>• Distribution & release strategy</li>
                  <li>• Booking & tour support</li>
                  <li>• Budget planning & invoicing</li>
                  <li>• Industry networking & A&R connections</li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Welcome to NVC Production</h3>
              <div className="flex items-center gap-4 bg-white/[0.03] rounded-xl p-5">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                  <span className="text-white/40 text-xl font-bold">{(stageName || "?")[0]}</span>
                </div>
                <div>
                  <p className="text-white/80 text-lg font-medium">{stageName || "New Artist"}</p>
                  <p className="text-white/30 text-sm">{genre || "Genre TBD"}</p>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-emerald-400/80 text-sm font-medium">Ready to finalize</p>
                <p className="text-emerald-400/40 text-xs mt-1">Click &quot;Add to Roster&quot; to complete onboarding and add this artist to the NVC roster.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 text-sm uppercase tracking-[0.15em] transition-all cursor-pointer">
            Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => canAdvance() && setStep(step + 1)} disabled={!canAdvance()} className="flex-1 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-sm uppercase tracking-[0.15em] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            Continue
          </button>
        ) : (
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-white/[0.10] hover:bg-white/[0.16] text-white/90 text-sm uppercase tracking-[0.15em] transition-all cursor-pointer font-medium">
            Add to Roster
          </button>
        )}
        {step < steps.length - 1 && (
          <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/30 text-sm uppercase tracking-[0.15em] transition-all cursor-pointer">
            Save Progress
          </button>
        )}
      </div>
    </div>
  );
}
