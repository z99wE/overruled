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
          <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-6 shadow-sm overflow-hidden min-h-[360px] flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

            {/* Top Badge Rail */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="rounded-full bg-slate-900/90 backdrop-blur-md border border-amber-400/40 px-3.5 py-1 font-mono text-[11px] font-bold text-amber-300 shadow-sm">
                Active Precedent Vault: {activePrecedents} Certified Authorities
              </div>
              <div className="rounded-full bg-purple-100 border border-purple-200 px-3 py-1 font-sans text-xs font-bold text-purple-900 shadow-2xs">
                Common Law Codex
              </div>
            </div>

            {/* Central Tabletop Arena with 3D Legal Stickers Around the Chest */}
            <div className="relative z-10 flex items-center justify-center py-6 my-auto">
              <div className="relative w-full max-w-2xl flex items-center justify-center">

                {/* ── Sticker 1 (Top Left): 3D Scales of Justice / Weighing Balance ── */}
                <div
                  className="absolute -top-6 left-2 sm:left-6 z-20 anim-sticker-balance group/sticker"
                  title="Scales of Justice · Certified Precedent Balance"
                >
                  <div className="relative rounded-2xl bg-white/95 p-2 sm:p-2.5 shadow-xl border-2 border-amber-200/90 backdrop-blur-md hover:scale-115 hover:rotate-3 transition-transform duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                        <defs>
                          <linearGradient id="goldBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="40%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#b45309" />
                          </linearGradient>
                          <linearGradient id="brassPanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fde68a" />
                            <stop offset="50%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#78350f" />
                          </linearGradient>
                          <radialGradient id="goldGleam" cx="35%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#b45309" />
                          </radialGradient>
                        </defs>
                        {/* Central Pillar & Base */}
                        <ellipse cx="32" cy="56" rx="14" ry="4" fill="url(#brassPanGrad)" />
                        <ellipse cx="32" cy="54" rx="11" ry="3" fill="#fef08a" />
                        <path d="M30 18 L34 18 L33 54 L31 54 Z" fill="url(#goldBeamGrad)" />
                        <circle cx="32" cy="16" r="4.5" fill="url(#goldGleam)" stroke="#78350f" strokeWidth="0.8" />
                        
                        {/* Balance Crossbeam */}
                        <path d="M10 20 Q32 17 54 20" stroke="url(#goldBeamGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <circle cx="12" cy="20" r="2.5" fill="url(#goldGleam)" />
                        <circle cx="52" cy="20" r="2.5" fill="url(#goldGleam)" />
                        
                        {/* Left Pan & Chains */}
                        <line x1="12" y1="20" x2="6" y2="34" stroke="#d97706" strokeWidth="1" strokeDasharray="1.5 1" />
                        <line x1="12" y1="20" x2="18" y2="34" stroke="#d97706" strokeWidth="1" strokeDasharray="1.5 1" />
                        <path d="M5 34 Q12 43 19 34 Z" fill="url(#brassPanGrad)" stroke="#78350f" strokeWidth="0.8" />
                        <ellipse cx="12" cy="34" rx="7" ry="2.5" fill="#fef08a" opacity="0.7" />

                        {/* Right Pan & Chains */}
                        <line x1="52" y1="20" x2="46" y2="38" stroke="#d97706" strokeWidth="1" strokeDasharray="1.5 1" />
                        <line x1="52" y1="20" x2="58" y2="38" stroke="#d97706" strokeWidth="1" strokeDasharray="1.5 1" />
                        <path d="M45 38 Q52 47 59 38 Z" fill="url(#brassPanGrad)" stroke="#78350f" strokeWidth="0.8" />
                        <ellipse cx="52" cy="38" rx="7" ry="2.5" fill="#fef08a" opacity="0.7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── Sticker 2 (Bottom Left): 3D Stack of Law Books / Legal Codices ── */}
                <div
                  className="absolute -bottom-4 left-1 sm:left-8 z-20 anim-sticker-books group/sticker"
                  title="Jurisprudence Codices & Precedent Treatises"
                >
                  <div className="relative rounded-2xl bg-white/95 p-2 sm:p-2.5 shadow-xl border-2 border-indigo-200/90 backdrop-blur-md hover:scale-115 hover:-rotate-4 transition-transform duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                        <defs>
                          <linearGradient id="bookRed" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e11d48" />
                            <stop offset="100%" stopColor="#881337" />
                          </linearGradient>
                          <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1e3a8a" />
                          </linearGradient>
                          <linearGradient id="bookGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#92400e" />
                          </linearGradient>
                          <linearGradient id="pageGilt" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="50%" stopColor="#fffbeb" />
                            <stop offset="100%" stopColor="#fef3c7" />
                          </linearGradient>
                        </defs>
                        {/* Bottom Book (Navy) */}
                        <path d="M8 48 L48 48 L56 42 L16 42 Z" fill="#172554" />
                        <path d="M8 48 L8 56 L48 56 L48 48 Z" fill="url(#bookBlue)" rx="2" />
                        <path d="M48 48 L56 42 L56 50 L48 56 Z" fill="url(#pageGilt)" />
                        <line x1="12" y1="52" x2="22" y2="52" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />

                        {/* Middle Book (Crimson) */}
                        <path d="M12 36 L50 36 L56 31 L18 31 Z" fill="#4c0519" />
                        <path d="M12 36 L12 44 L50 44 L50 36 Z" fill="url(#bookRed)" rx="2" />
                        <path d="M50 36 L56 31 L56 39 L50 44 Z" fill="url(#pageGilt)" />
                        <line x1="16" y1="40" x2="28" y2="40" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />

                        {/* Top Book (Leather Gold & Open bookmark ribbon) */}
                        <path d="M14 24 L46 24 L52 19 L20 19 Z" fill="#78350f" />
                        <path d="M14 24 L14 32 L46 32 L46 24 Z" fill="url(#bookGold)" rx="2" />
                        <path d="M46 24 L52 19 L52 27 L46 32 Z" fill="url(#pageGilt)" />
                        {/* Silk Bookmark Ribbon */}
                        <path d="M34 24 L36 38 L39 34 L42 38 L40 24 Z" fill="#dc2626" />
                        {/* Gold Stamped Spine Emblem */}
                        <circle cx="20" cy="28" r="2.5" fill="#fef08a" stroke="#92400e" strokeWidth="0.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── Central Purple 3D Precedent Vault Chest ── */}
                <div className="relative flex flex-col items-center mx-4 sm:mx-12">
                  <div className="relative h-44 w-44 sm:h-56 sm:w-56 rounded-3xl overflow-hidden border-2 border-purple-300/80 shadow-2xl bg-purple-950/10 group-hover:scale-105 transition-transform duration-500">
                    <img
                      src="/assets/master_chest.jpg"
                      alt="3D Purple Precedent Vault Chest"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* ── Sticker 3 (Top Right): 3D Judge's Gavel & Baton with Sound Block ── */}
                <div
                  className="absolute -top-6 right-2 sm:right-6 z-20 anim-sticker-gavel group/sticker"
                  title="Magisterial Gavel & Baton · Judicial Authority"
                >
                  <div className="relative rounded-2xl bg-white/95 p-2 sm:p-2.5 shadow-xl border-2 border-amber-300/90 backdrop-blur-md hover:scale-115 hover:rotate-6 transition-transform duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                        <defs>
                          <linearGradient id="woodGavel" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#92400e" />
                            <stop offset="50%" stopColor="#78350f" />
                            <stop offset="100%" stopColor="#451a03" />
                          </linearGradient>
                          <linearGradient id="goldGavelRing" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                          <linearGradient id="soundBlockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#b45309" />
                            <stop offset="100%" stopColor="#451a03" />
                          </linearGradient>
                        </defs>
                        {/* Sound Block at bottom */}
                        <ellipse cx="44" cy="50" rx="14" ry="6" fill="#311202" />
                        <path d="M30 46 L58 46 L58 50 L30 50 Z" fill="url(#soundBlockGrad)" />
                        <ellipse cx="44" cy="46" rx="14" ry="5" fill="#92400e" stroke="#fbbf24" strokeWidth="0.8" />
                        
                        {/* Gavel Handle (angled 45 degrees) */}
                        <path d="M16 48 L36 28 L39 31 L19 51 Z" fill="url(#woodGavel)" rx="1.5" />
                        <circle cx="16" cy="50" r="3" fill="url(#goldGavelRing)" />

                        {/* Gavel Head / Mallet */}
                        <g transform="rotate(-40 38 24)">
                          {/* Barrel Head */}
                          <rect x="24" y="16" width="28" height="15" rx="3" fill="url(#woodGavel)" />
                          {/* Left End Ring */}
                          <ellipse cx="24" cy="23.5" rx="3" ry="7.5" fill="url(#goldGavelRing)" />
                          {/* Right End Ring */}
                          <ellipse cx="52" cy="23.5" rx="3" ry="7.5" fill="url(#goldGavelRing)" />
                          {/* Center Inlay Ring */}
                          <rect x="36" y="16" width="4" height="15" fill="url(#goldGavelRing)" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── Sticker 4 (Bottom Right): Red Wax Legal Seal with Silk Ribbons ── */}
                <div
                  className="absolute -bottom-4 right-1 sm:right-8 z-20 anim-sticker-seal group/sticker"
                  title="Certified Red Wax Seal of Authenticity"
                >
                  <div className="relative rounded-2xl bg-white/95 p-2 sm:p-2.5 shadow-xl border-2 border-rose-200/90 backdrop-blur-md hover:scale-115 hover:rotate-6 transition-transform duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                        <defs>
                          <radialGradient id="waxRed" cx="40%" cy="40%" r="60%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="50%" stopColor="#be123c" />
                            <stop offset="100%" stopColor="#881337" />
                          </radialGradient>
                          <linearGradient id="ribbonRed" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e11d48" />
                            <stop offset="100%" stopColor="#9f1239" />
                          </linearGradient>
                        </defs>
                        {/* Hanging Silk Ribbons with Gold V-notches */}
                        <path d="M22 34 L16 58 L24 53 L30 58 L28 34 Z" fill="url(#ribbonRed)" />
                        <path d="M36 34 L34 58 L42 53 L48 58 L42 34 Z" fill="url(#ribbonRed)" />
                        
                        {/* Organic Red Wax Seal Edge */}
                        <path
                          d="M32 6 C38 6 42 9 46 11 C51 13 55 17 56 22 C58 28 56 34 53 38 C50 43 45 47 40 49 C35 50 29 49 24 48 C19 46 14 43 11 38 C8 33 8 27 10 21 C12 16 16 12 21 9 C25 7 29 6 32 6 Z"
                          fill="url(#waxRed)"
                          filter="drop-shadow(0 2px 4px rgba(136, 19, 55, 0.4))"
                        />
                        
                        {/* Inner Stamped Rim */}
                        <circle cx="32" cy="27" r="14" fill="#9f1239" stroke="#f43f5e" strokeWidth="1" />
                        <circle cx="32" cy="27" r="11.5" fill="none" stroke="#fbcfe8" strokeWidth="0.8" strokeDasharray="2 1.5" />
                        
                        {/* Center Embossed Star & Scales Motif */}
                        <path d="M32 19 L34 23 L38 24 L35 27 L36 31 L32 29 L28 31 L29 27 L26 24 L30 23 Z" fill="#fef08a" opacity="0.9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── Sticker 5 (Floating Side Left): Rolled Parchment Scroll ── */}
                <div
                  className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 z-20 anim-sticker-scroll group/sticker"
                  title="Certified Judicial Decree Scroll"
                >
                  <div className="relative rounded-2xl bg-white/95 p-2 shadow-lg border-2 border-amber-100/90 backdrop-blur-md hover:scale-115 hover:-rotate-6 transition-transform duration-300">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-sm">
                        <defs>
                          <linearGradient id="parchmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fffbeb" />
                            <stop offset="60%" stopColor="#fef3c7" />
                            <stop offset="100%" stopColor="#fde68a" />
                          </linearGradient>
                        </defs>
                        {/* Rolled Scroll Body */}
                        <path d="M12 10 C16 8 32 8 36 10 L34 38 C30 40 14 40 10 38 Z" fill="url(#parchmentGrad)" stroke="#d97706" strokeWidth="0.8" />
                        <ellipse cx="24" cy="10" rx="12" ry="3" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
                        <ellipse cx="22" cy="38" rx="12" ry="3" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" />
                        {/* Text scribble lines */}
                        <line x1="16" y1="18" x2="30" y2="18" stroke="#92400e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                        <line x1="16" y1="23" x2="28" y2="23" stroke="#92400e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                        <line x1="16" y1="28" x2="26" y2="28" stroke="#92400e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                        {/* Red Seal on Scroll */}
                        <circle cx="28" cy="32" r="3.5" fill="#e11d48" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── Sticker 6 (Floating Side Right): Rotating Golden Law Medallion ── */}
                <div
                  className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-20 anim-sticker-float group/sticker"
                  title="Lex Aeterna · Certified Common Law Medal"
                >
                  <div className="relative rounded-2xl bg-white/95 p-2 shadow-lg border-2 border-amber-200/90 backdrop-blur-md hover:scale-115 hover:rotate-6 transition-transform duration-300">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-sm">
                        <defs>
                          <radialGradient id="goldMedal" cx="40%" cy="40%" r="60%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="60%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#b45309" />
                          </radialGradient>
                        </defs>
                        {/* Outer Rotating Sunburst Ring */}
                        <g className="anim-sticker-rotate origin-center">
                          <circle cx="24" cy="24" r="19" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 2" />
                        </g>
                        {/* Solid Gold Coin */}
                        <circle cx="24" cy="24" r="16" fill="url(#goldMedal)" stroke="#78350f" strokeWidth="0.8" />
                        <circle cx="24" cy="24" r="13" fill="none" stroke="#fef08a" strokeWidth="0.8" />
                        {/* Roman Pillar in center */}
                        <rect x="22" y="16" width="4" height="15" fill="#fef08a" rx="0.5" />
                        <rect x="19" y="14" width="10" height="2.5" fill="#ffffff" rx="0.5" />
                        <rect x="19" y="31" width="10" height="2.5" fill="#ffffff" rx="0.5" />
                      </svg>
                    </div>
                  </div>
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
