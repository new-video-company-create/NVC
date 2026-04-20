"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { getArtists, type Artist } from "@/lib/storage";

function EPKContent() {
  const searchParams = useSearchParams();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selected, setSelected] = useState<Artist | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [headline, setHeadline] = useState("");
  const [pressQuote, setPressQuote] = useState("");
  const [achievements, setAchievements] = useState("");
  const [contactInfo, setContactInfo] = useState("NVC Studio Team | New Video Company\nhello@newvideocompany.com");

  useEffect(() => {
    const a = getArtists();
    setArtists(a);
    const preselect = searchParams.get("artist");
    if (preselect) {
      const found = a.find((x) => x.id === preselect);
      if (found) {
        setSelected(found);
        setHeadline(`${found.stageName} — ${found.genre}`);
      }
    }
  }, [searchParams]);

  const selectArtist = (a: Artist) => {
    setSelected(a);
    setHeadline(`${a.stageName} — ${a.genre}`);
    setShowPreview(false);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>EPK — ${selected?.stageName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #fff; padding: 48px; }
        .header { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .avatar { width: 80px; height: 80px; border-radius: 16px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: rgba(255,255,255,0.4); }
        h1 { font-size: 28px; color: rgba(255,255,255,0.9); }
        .subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-top: 4px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.25); margin-bottom: 8px; }
        .section-body { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.7; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .stat { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; }
        .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.25); }
        .stat-value { font-size: 20px; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 4px; }
        .tracks { list-style: none; }
        .tracks li { padding: 6px 0; color: rgba(255,255,255,0.5); font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: rgba(255,255,255,0.2); }
        .quote { font-style: italic; color: rgba(255,255,255,0.5); font-size: 16px; padding: 16px 0; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 16px; }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors";
  const labelClass = "text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2 block";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/nvc-logo.png" alt="NVC" width={32} height={32} className="rounded-lg" />
          <div>
            <h1 className="text-xl font-medium text-white/90">EPK Generator</h1>
            <p className="text-white/30 text-sm mt-1">Create electronic press kits &amp; artist one-sheets</p>
          </div>
        </div>
        {selected && (
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all cursor-pointer">
              {showPreview ? "Edit" : "Preview"}
            </button>
            {showPreview && (
              <button onClick={handlePrint} className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all cursor-pointer">
                Export / Print
              </button>
            )}
          </div>
        )}
      </div>

      {/* Artist Selector */}
      {!selected && (
        <div>
          <p className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-3">Select Artist</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {artists.map((a) => (
              <button key={a.id} onClick={() => selectArtist(a)} className="glass glass-hover rounded-2xl p-5 text-left transition-all duration-300 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3">
                  <span className="text-white/40 font-bold">{a.stageName[0]}</span>
                </div>
                <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{a.stageName}</p>
                <p className="text-white/25 text-xs mt-0.5">{a.genre}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && !showPreview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer">
              ← Change Artist
            </button>
            <span className="text-white/10">|</span>
            <span className="text-white/50 text-sm">{selected.stageName}</span>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">EPK Content</h3>
            <div><label className={labelClass}>Headline</label><input className={inputClass} value={headline} onChange={(e) => setHeadline(e.target.value)} /></div>
            <div><label className={labelClass}>Press Quote (optional)</label><input className={inputClass} placeholder='"One of the most exciting new artists..." — Rolling Stone' value={pressQuote} onChange={(e) => setPressQuote(e.target.value)} /></div>
            <div><label className={labelClass}>Key Achievements</label><textarea className={`${inputClass} min-h-[80px] resize-none`} placeholder="• 1M+ streams on Spotify&#10;• Featured on Spotify editorial playlists&#10;• Opened for [Artist] at [Venue]" value={achievements} onChange={(e) => setAchievements(e.target.value)} /></div>
            <div><label className={labelClass}>Contact / Booking</label><textarea className={`${inputClass} min-h-[60px] resize-none`} value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} /></div>
          </div>
        </motion.div>
      )}

      {/* EPK Preview */}
      {selected && showPreview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div ref={printRef} className="glass rounded-2xl p-8 space-y-6 max-w-2xl">
            <div className="header flex items-center gap-5 pb-5 border-b border-white/[0.06]">
              <div className="avatar w-20 h-20 rounded-2xl bg-white/[0.06] flex items-center justify-center shrink-0">
                <span className="text-white/40 text-3xl font-bold">{selected.stageName[0]}</span>
              </div>
              <div>
                <h1 className="text-white/90 text-2xl font-bold">{selected.stageName}</h1>
                <p className="subtitle text-white/40 text-sm mt-0.5">{headline}</p>
              </div>
            </div>

            {pressQuote && (
              <div className="quote border-l-2 border-white/10 pl-4 py-1">
                <p className="text-white/50 text-base italic">{pressQuote}</p>
              </div>
            )}

            <div className="section">
              <p className="section-title text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Bio</p>
              <p className="section-body text-white/60 text-sm leading-relaxed">{selected.bio}</p>
            </div>

            <div className="stats grid grid-cols-2 gap-3">
              <div className="stat bg-white/[0.03] rounded-xl p-4">
                <p className="stat-label text-white/25 text-[10px] uppercase tracking-[0.15em]">Followers</p>
                <p className="stat-value text-white/80 text-xl font-semibold mt-1">{selected.followers ? selected.followers.toLocaleString() : "—"}</p>
              </div>
              <div className="stat bg-white/[0.03] rounded-xl p-4">
                <p className="stat-label text-white/25 text-[10px] uppercase tracking-[0.15em]">Genre</p>
                <p className="stat-value text-white/80 text-xl font-semibold mt-1">{selected.genre}</p>
              </div>
            </div>

            {selected.topTracks && selected.topTracks.length > 0 && (
              <div className="section">
                <p className="section-title text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Discography</p>
                <ul className="tracks">
                  {selected.topTracks.map((t, i) => (
                    <li key={i} className="py-1.5 text-white/50 text-sm border-b border-white/[0.04] last:border-0">{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {achievements && (
              <div className="section">
                <p className="section-title text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Achievements</p>
                <p className="section-body text-white/60 text-sm whitespace-pre-line">{achievements}</p>
              </div>
            )}

            <div className="section">
              <p className="section-title text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Links</p>
              <div className="flex gap-3 text-sm text-white/50">
                {selected.instagram && <span>Instagram</span>}
                {selected.website && <span>Website</span>}
                {selected.spotify && <span>Spotify</span>}
              </div>
            </div>

            <div className="footer pt-4 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs whitespace-pre-line">{contactInfo}</p>
              <p className="text-white/15 text-[10px] mt-2">Produced by New Video Company</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function EPKPage() {
  return (
    <Suspense fallback={<div className="text-white/30 text-sm py-12 text-center">Loading...</div>}>
      <EPKContent />
    </Suspense>
  );
}
