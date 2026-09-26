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

      {/* ── 3D Isometric Legal Tabletop Showcase Stage ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <div
          onClick={handleChestClick}
          className={`group relative rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-b from-purple-50/50 via-slate-50/50 to-amber-50/40 p-4 sm:p-8 shadow-2xl backdrop-blur-xl cursor-pointer transition-all duration-300 ${
            chestOpened ? 'scale-102 ring-4 ring-purple-500' : 'hover:scale-101 hover:shadow-3xl'
          }`}
        >
          {/* Wood Table Grid Mat */}
          <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-6 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

            {/* Top Badge Rail */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-6">
              <div className="rounded-full bg-slate-900/90 backdrop-blur-md border border-amber-400/40 px-3.5 py-1 font-mono text-[11px] font-bold text-amber-300 shadow-sm">
                Active Precedent Vault: {activePrecedents} Certified Rulings
              </div>
              <div className="rounded-full bg-purple-100 border border-purple-200 px-3 py-1 font-sans text-xs font-bold text-purple-900 shadow-2xs">
                Common Law Codex
              </div>
            </div>

            {/* Central Tabletop Arena */}
            <div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-6">
              {/* Surrounding Floating Legal World Items */}
              <div className="relative w-full max-w-xl flex items-center justify-center">
                {/* Left Legal Item: Landmark Report */}
                <div className="hidden sm:flex absolute left-0 top-6 flex-col items-start gap-1 rounded-2xl bg-white/95 p-3 border border-slate-200 shadow-lg backdrop-blur-md max-w-[160px] text-left transform -rotate-3 hover:rotate-0 transition-transform">
                  <span className="font-mono text-[9px] font-bold text-blue-700 uppercase">[1932] AC 562</span>
                  <p className="font-sans text-xs font-bold text-slate-900">Donoghue v. Stevenson</p>
                  <p className="font-sans text-[10px] text-slate-500 leading-tight">Duty of care &amp; consumer safety</p>
                </div>

                {/* Top-Right Legal Item: Statutory Anchor */}
                <div className="hidden sm:flex absolute -top-4 right-4 items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1.5 font-mono text-xs font-bold text-amber-300 shadow-md border border-amber-400/30 transform rotate-2">
                  <span>(1992) 175 CLR 1</span>
                  <span className="text-slate-400 text-[10px]">· Mabo Title</span>
                </div>

                {/* Central Purple 3D Precedent Vault Chest */}
                <div className="relative flex flex-col items-center">
                  <div className="relative h-44 w-44 sm:h-56 sm:w-56 rounded-3xl overflow-hidden border-2 border-purple-300/80 shadow-2xl bg-purple-950/10 group-hover:scale-105 transition-transform duration-500">
                    <img
                      src="/assets/master_chest.jpg"
                      alt="3D Purple Precedent Vault Chest"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 font-mono text-[10px] font-bold text-purple-900 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping" />
                    <span>Level 99 Jurisprudence Vault</span>
                  </div>
                </div>

                {/* Right Legal Item: Procedural Rights */}
                <div className="hidden sm:flex absolute right-0 bottom-4 flex-col items-start gap-1 rounded-2xl bg-white/95 p-3 border border-slate-200 shadow-lg backdrop-blur-md max-w-[160px] text-left transform rotate-3 hover:rotate-0 transition-transform">
                  <span className="font-mono text-[9px] font-bold text-emerald-700 uppercase">384 U.S. 436</span>
                  <p className="font-sans text-xs font-bold text-slate-900">Miranda v. Arizona</p>
                  <p className="font-sans text-[10px] text-slate-500 leading-tight">Privileged custodial protections</p>
                </div>
              </div>
            </div>

            {/* Bottom Privacy & Ingest Bar */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-1.5 font-sans text-xs font-bold text-sky-300 shadow-sm">
                100% In-Browser Privacy · Zero Third-Party Model Training
              </div>
              <span className="rounded-full bg-blue-600 px-4 py-1.5 font-sans text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
                Ingest Contract for Instant Audit
              </span>
            </div>

            {/* Notification Banner */}
            {chestMessage && (
              <div className="absolute inset-x-0 bottom-6 mx-auto max-w-md rounded-full bg-emerald-600 px-6 py-2.5 font-sans text-sm font-bold text-white shadow-2xl anim-pop text-center">
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
