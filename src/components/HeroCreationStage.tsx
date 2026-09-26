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

      {/* ── 3D Isometric Hero Asset Showcase ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <div
          onClick={handleChestClick}
          className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl cursor-pointer transition-all duration-300 ${
            chestOpened ? 'scale-102 ring-4 ring-amber-400' : 'hover:scale-101'
          }`}
        >
          <img
            src="/assets/hero_chest_stage.jpg"
            alt="3D Legal Intelligence Tabletop Showcase"
            className="w-full h-auto object-cover"
          />

          {/* Interactive Precedent Vault Pill Overlay */}
          <div className="absolute top-4 right-4 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-400/40 px-4 py-1.5 font-mono text-xs sm:text-sm font-bold text-amber-300 shadow-lg">
            Active Precedent Vault: {activePrecedents} Certified Rulings
          </div>

          {/* Privacy Badge Overlay */}
          <div className="absolute bottom-4 left-4 rounded-full bg-blue-950/85 backdrop-blur-md border border-sky-400/30 px-4 py-1.5 font-sans text-xs font-bold text-sky-200 shadow-md">
            100% In-Browser Privacy · Zero Third-Party Model Training
          </div>

          {/* Notification Banner */}
          {chestMessage && (
            <div className="absolute inset-x-0 bottom-6 mx-auto max-w-md rounded-full bg-emerald-500 px-6 py-2.5 font-sans text-sm font-black text-white shadow-2xl anim-pop">
              {chestMessage}
            </div>
          )}
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
