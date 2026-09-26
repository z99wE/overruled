import { useState } from 'react';
import { Shuffle } from './Shuffle';

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

      {/* ── Massive Gigantic Shuffle Headline ── */}
      <div className="relative z-10 my-4 flex items-center justify-center">
        <Shuffle
          text="OVERROOL"
          tag="h1"
          className="pixel-fund-text !text-6xl sm:!text-8xl md:!text-9xl lg:!text-[9.5rem] xl:!text-[11.5rem] !font-black !tracking-tighter !leading-none cursor-default drop-shadow-sm select-none"
          shuffleDirection="right"
          duration={0.4}
          animationMode="evenodd"
          shuffleTimes={2}
          ease="power3.out"
          stagger={0.04}
          threshold={0.1}
          triggerOnce={false}
          triggerOnHover={true}
          respectReducedMotion={true}
        />
      </div>

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
          className={`group relative rounded-3xl overflow-hidden border border-white/60 bg-gradient-to-br from-violet-200/50 via-sky-100/60 to-amber-100/50 p-4 sm:p-8 shadow-2xl backdrop-blur-2xl cursor-pointer transition-all duration-300 ring-1 ring-slate-900/5 ${
            chestOpened ? 'scale-102 ring-4 ring-purple-500' : 'hover:scale-101 hover:shadow-3xl'
          }`}
        >
          {/* Ambient Glows Inside the Stage Card */}
          <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-purple-400/35 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-sky-400/35 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl pointer-events-none" />

          {/* Table Grid Mat */}
          <div className="relative rounded-2xl border border-white/80 bg-white/85 p-6 sm:p-12 shadow-sm overflow-hidden min-h-[380px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

            {/* Central Tabletop Arena with ONLY the 3D Purple Precedent Vault Chest */}
            <div className="relative z-10 flex items-center justify-center py-6 my-auto w-full">
              <div className="relative flex flex-col items-center">
                <div className="relative h-52 w-52 sm:h-72 sm:w-72 rounded-3xl overflow-hidden border-2 border-purple-300/80 shadow-2xl bg-purple-950/10 group-hover:scale-105 transition-transform duration-500">
                  <img
                    src="/assets/master_chest.jpg"
                    alt="3D Purple Precedent Vault Chest"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/25 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
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
