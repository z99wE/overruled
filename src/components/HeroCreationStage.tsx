import { useState } from 'react';

interface HeroCreationStageProps {
  onClaimChest: () => void;
  onOpenRules: () => void;
  onOpenDesk?: () => void;
}

export function HeroCreationStage({
  onClaimChest,
  onOpenRules,
  onOpenDesk,
}: HeroCreationStageProps) {
  const [activePrecedents] = useState(59);
  const [chestOpened, setChestOpened] = useState(false);
  const [chestMessage, setChestMessage] = useState<string | null>(null);

  const handleChestClick = () => {
    setChestOpened(true);
    setChestMessage(`Zero-Leak Engine Active: 59 Verified Precedents Loaded`);
    setTimeout(() => {
      if (onOpenDesk) {
        onOpenDesk();
      } else {
        onClaimChest();
      }
    }, 900);
  };

  return (
    <div className="relative w-full pt-12 pb-8 overflow-hidden text-center">
      {/* ── Subtitle and Rules Link ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mb-3 font-sans text-sm md:text-base font-medium text-slate-800">
        <span>Zero-Data-Leak Contract Analysis</span>
        <span className="text-slate-400">·</span>
        <button
          type="button"
          onClick={onOpenRules}
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
        >
          Instant Clause-by-Clause Risk Audit &amp; 59 Common Law Precedents
        </button>
      </div>

      {/* ── Massive Retro 3D Pixel Headline ── */}
      <h1 className="relative z-10 pixel-fund-text text-5xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 tracking-tight">
        ZERO LEAK
      </h1>

      {/* ── Primary Action CTA ── */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={handleChestClick}
          className="flex items-center gap-2.5 rounded-full bg-blue-600 px-8 py-3.5 text-sm md:text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <span>Ingest Contract for Instant Forensic Risk Audit</span>
        </button>
      </div>

      {/* ── 3D Isometric Legal Jurisprudence Showcase Stage ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <div
          onClick={handleChestClick}
          className={`group relative rounded-3xl overflow-hidden border border-slate-200 bg-white/80 shadow-2xl backdrop-blur-xl cursor-pointer transition-all duration-300 ${
            chestOpened ? 'scale-102 ring-4 ring-blue-500' : 'hover:scale-101 hover:shadow-3xl'
          }`}
        >
          {/* Tabletop Room Canvas with Courtroom Ambient Imagery */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
            <img
              src="/assets/courtroom-chamber.jpg"
              alt="3D Legal Jurisprudence Courtroom Showcase"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />

            {/* Floating 3D Jurisprudence Modules */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Top Badge Rail */}
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-sm">
                  Active Precedent Vault: {activePrecedents} Certified Rulings
                </div>
                <div className="hidden sm:inline-flex rounded-full bg-blue-600/90 backdrop-blur-md px-4 py-1.5 font-sans text-xs font-bold text-white shadow-sm">
                  7 Global Jurisdictions
                </div>
              </div>

              {/* Center Jurisprudence Podium Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-auto">
                <div className="rounded-2xl bg-white/90 backdrop-blur-md p-3.5 border border-slate-200/80 shadow-lg text-left transform -translate-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700">Forensic Audit</span>
                  <p className="font-display text-xs font-extrabold text-slate-900 mt-0.5">Contract Risk Engine</p>
                  <p className="text-[11px] text-slate-600 mt-1">Indemnity &amp; liability clause scans</p>
                </div>

                <div className="rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-amber-300 shadow-xl text-left transform -translate-y-3 ring-2 ring-amber-400/50">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">Common Law</span>
                  <p className="font-display text-xs font-extrabold text-slate-900 mt-0.5">59 Precedent Deck</p>
                  <p className="text-[11px] text-slate-600 mt-1">Certified ratios &amp; citations</p>
                </div>

                <div className="rounded-2xl bg-white/90 backdrop-blur-md p-3.5 border border-slate-200/80 shadow-lg text-left transform -translate-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">Adversarial Bench</span>
                  <p className="font-display text-xs font-extrabold text-slate-900 mt-0.5">Simulated Trial Sparring</p>
                  <p className="text-[11px] text-slate-600 mt-1">Interlocutory motion defense</p>
                </div>
              </div>

              {/* Bottom Privacy & Ingest Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="rounded-full bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-1.5 font-sans text-xs font-bold text-slate-800 shadow-sm">
                  100% In-Browser Privacy · Zero Third-Party Model Training
                </div>
                <span className="rounded-full bg-emerald-500 px-4 py-1.5 font-sans text-xs font-bold text-white shadow-sm">
                  Click to Launch Forensic Desk
                </span>
              </div>
            </div>

            {/* Notification Banner */}
            {chestMessage && (
              <div className="absolute inset-x-0 bottom-8 mx-auto max-w-md rounded-full bg-emerald-600 px-6 py-2.5 font-sans text-sm font-bold text-white shadow-2xl anim-pop text-center">
                {chestMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Title & Subtitle ── */}
      <div className="relative z-10 mt-14 max-w-2xl mx-auto px-4">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contract Defense &amp; Risk Audit Framework
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
          Audit contracts and test legal arguments against certified common law authorities. Identify hidden liability traps, one-sided indemnities, and enforceability risks in seconds.
        </p>
      </div>
    </div>
  );
}
