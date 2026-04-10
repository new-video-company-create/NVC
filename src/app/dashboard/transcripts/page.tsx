"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Transcript {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: string[];
  status: "transcribed" | "processing" | "pending";
  preview?: string;
}

const sampleTranscripts: Transcript[] = [
  {
    id: "1",
    title: "P!NK Campaign Strategy",
    date: "Apr 7, 2026",
    duration: "47 min",
    participants: ["Joe Meyer", "Sarah K.", "Create Music Group"],
    status: "transcribed",
    preview:
      "Joe: So for the P!NK campaign, we're looking at a two-pronged approach — TikTok influencers plus a heavy Spotify push. Sarah, can you walk us through the influencer list?\n\nSarah: Absolutely. We've identified 12 micro-influencers in the pop/rock space with combined reach of about 4.2 million...",
  },
  {
    id: "2",
    title: "Atlantic Records Q2 Planning",
    date: "Apr 3, 2026",
    duration: "32 min",
    participants: ["Joe Meyer", "Atlantic A&R Team"],
    status: "transcribed",
    preview: "Joe: Let's look at the Q2 pipeline. We've got three releases coming up that need marketing support...",
  },
  {
    id: "3",
    title: "Artist Onboarding — New Signing",
    date: "Apr 9, 2026",
    duration: "—",
    participants: ["Joe Meyer"],
    status: "pending",
  },
];

export default function TranscriptsPage() {
  const [selected, setSelected] = useState<Transcript | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white/90">Transcript Studio</h1>
          <p className="text-white/30 text-sm mt-1">
            Google Meet recordings &amp; AI-powered transcriptions
          </p>
        </div>
        <button
          onClick={() => setConnectModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.01 14.005c-.17.17-.376.3-.6.38-.225.08-.466.12-.71.12h-.7v2c0 .265-.105.52-.293.707A.997.997 0 0114 17.5h-4a.997.997 0 01-.707-.293A.997.997 0 019 16.5v-2H7.3a1.7 1.7 0 01-1.2-.5 1.7 1.7 0 01-.5-1.2V9.2c0-.265.053-.527.157-.772a1.99 1.99 0 01.442-.636L8.76 5.223A1.99 1.99 0 0110.2 4.5h3.6c.54 0 1.058.26 1.44.723l2.56 2.57c.198.19.355.42.46.67.105.25.16.517.16.79v3.55c0 .264-.053.525-.157.77-.105.245-.262.467-.46.636l.207-.204z"/>
          </svg>
          Connect Google Meet
        </button>
      </div>

      {/* Status bar */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse" />
          <span className="text-white/50 text-xs">Google Meet integration ready</span>
        </div>
        <div className="h-4 w-px bg-white/[0.08]" />
        <span className="text-white/30 text-xs">
          {sampleTranscripts.filter((t) => t.status === "transcribed").length} transcripts &middot;{" "}
          {sampleTranscripts.filter((t) => t.status === "pending").length} pending
        </span>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* List */}
        <div className="md:col-span-2 space-y-2">
          {sampleTranscripts.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(t)}
              className={`w-full text-left glass rounded-2xl p-4 transition-all duration-300 cursor-pointer ${
                selected?.id === t.id
                  ? "border-white/20 bg-white/[0.06]"
                  : "glass-hover"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/80 text-sm font-medium truncate">{t.title}</p>
                  <p className="text-white/25 text-xs mt-1">
                    {t.date} &middot; {t.duration}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    t.status === "transcribed"
                      ? "bg-emerald-500/10 text-emerald-400/70"
                      : t.status === "processing"
                        ? "bg-blue-500/10 text-blue-400/70"
                        : "bg-white/[0.04] text-white/25"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <div className="flex gap-1 mt-2.5 flex-wrap">
                {t.participants.map((p) => (
                  <span key={p} className="text-[10px] text-white/20 bg-white/[0.03] px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass rounded-2xl p-6 space-y-5"
              >
                <div>
                  <h2 className="text-white/90 text-lg font-medium">{selected.title}</h2>
                  <p className="text-white/30 text-xs mt-1">
                    {selected.date} &middot; {selected.duration} &middot;{" "}
                    {selected.participants.join(", ")}
                  </p>
                </div>

                {selected.status === "transcribed" && selected.preview ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Summary
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </button>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-5 font-mono text-sm text-white/60 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {selected.preview}
                    </div>
                  </div>
                ) : selected.status === "pending" ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-sm">Waiting for meeting to complete</p>
                    <p className="text-white/20 text-xs mt-1">
                      Transcript will be generated automatically after the call
                    </p>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm">Select a transcript to view</p>
                <p className="text-white/15 text-xs mt-1">
                  Or connect Google Meet to import new recordings
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
            onClick={() => setConnectModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-md w-full space-y-6"
            >
              <div>
                <h3 className="text-white/90 text-lg font-medium">Connect Google Meet</h3>
                <p className="text-white/30 text-sm mt-1">
                  Link your Google Workspace account to automatically import meeting recordings and generate transcripts.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Auto-import recordings</p>
                    <p className="text-white/25 text-xs">From Google Meet via Workspace API</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">AI-powered transcription</p>
                    <p className="text-white/25 text-xs">Speaker detection, summaries, action items</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-purple-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Searchable archive</p>
                    <p className="text-white/25 text-xs">Full-text search across all meetings</p>
                  </div>
                </div>
              </div>

              <button className="w-full py-3.5 rounded-xl bg-white/[0.10] hover:bg-white/[0.16] text-white/90 text-sm uppercase tracking-[0.12em] transition-all duration-300 cursor-pointer font-medium">
                Connect with Google
              </button>

              <p className="text-white/15 text-[10px] text-center">
                Requires Google Workspace admin approval
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
