import { useState } from 'react';

interface HeroCreationStageProps {
  onClaimChest: () => void;
  onOpenRules: () => void;
}

export function HeroCreationStage({
  onClaimChest,
  onOpenRules,
}: HeroCreationStageProps) {
  const [remainingPool] = useState(35031);
  const [chestOpened, setChestOpened] = useState(false);
  const [chestMessage, setChestMessage] = useState<string | null>(null);

  const handleChestClick = () => {
    setChestOpened(true);
    const reward = Math.floor(Math.random() * 25) + 10;
    setChestMessage(`🎉 You claimed +${reward} Chips from the Landmark Chest!`);
    setTimeout(() => {
      onClaimChest();
    }, 1200);
  };

  return (
    <div className="relative w-full pt-10 pb-8 overflow-hidden text-center">
      {/* ── Floating Arcade Sticker Decorations ── */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {/* Extruder / Gavel Sticker (Top Left) */}
        <div className="arcade-sticker absolute top-8 left-[8%] md:left-[12%]">
          <svg className="w-12 h-12 text-slate-800" viewBox="0 0 24 24" fill="none">
            <rect x="7" y="2" width="10" height="7" rx="2" fill="#334155" />
            <path d="M12 9v6M9 15h6l-3 4-3-4z" fill="#0f172a" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="5.5" r="1.5" fill="#f8fafc" />
          </svg>
        </div>

        {/* Double Coin Bubble (Left) */}
        <div className="arcade-sticker absolute top-20 left-[18%] md:left-[22%] anim-float" style={{ animationDelay: '0.5s' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-sky-400 bg-sky-100 text-sky-600 font-mono font-black text-sm shadow-md">
            $$
          </div>
        </div>

        {/* Sparkly Star with Eyes (Mid Left) */}
        <div className="arcade-sticker absolute top-36 left-[10%] md:left-[15%]">
          <svg className="w-12 h-12 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7-6.2-3.6-6.2 3.6 1.6-7L2 9.2l7.2-.6L12 2z" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
            <ellipse cx="9.5" cy="11.5" rx="1" ry="1.8" fill="#0f172a" />
            <ellipse cx="14.5" cy="11.5" rx="1" ry="1.8" fill="#0f172a" />
          </svg>
        </div>

        {/* Green Thumbs Up (Top Right) */}
        <div className="arcade-sticker absolute top-12 right-[18%] md:right-[22%]">
          <svg className="w-12 h-12 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 10h4v10H2V10zm20 2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 3 7.59 8.59C7.22 8.95 7 9.45 7 10v8c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Blue Lightning Bolt (Mid Right) */}
        <div className="arcade-sticker absolute top-28 right-[12%] md:right-[15%] anim-float" style={{ animationDelay: '1.2s' }}>
          <svg className="w-12 h-12 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Red Pixel Heart (Bottom Right) */}
        <div className="arcade-sticker absolute top-40 right-[8%] md:right-[10%]">
          <svg className="w-10 h-10 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Top Fund Announcement Header ── */}
      <div className="relative z-10 flex items-center justify-center gap-2 mb-2 font-sans text-sm md:text-base font-medium text-slate-800">
        <span>Creator Fund ·</span>
        <button
          type="button"
          onClick={onOpenRules}
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
        >
          Earn up to $100 per Original Model!
        </button>
      </div>

      {/* ── Massive Retro 3D Pixel Prize Pool Header ── */}
      <h1 className="relative z-10 pixel-fund-text text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 tracking-tight">
        $1,000,000
      </h1>

      {/* ── Primary Blue Upload / Play Pill Button ── */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={handleChestClick}
          className="flex items-center gap-2.5 rounded-full bg-blue-600 px-7 py-3 text-sm md:text-base font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-xs">
            🎁
          </span>
          <span>Upload & Claim a Creation Chest</span>
        </button>
        {/* Blue down caret pointer */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600"></div>
      </div>

      {/* ── 3D Tabletop Stage Showcase ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Stage Container */}
        <div className="relative flex flex-col items-center">
          {/* Tabletop Surface with 3D Voxel Models */}
          <div className="relative w-full flex items-end justify-center gap-3 sm:gap-6 md:gap-8 pb-3 pt-6">
            
            {/* Left Model: Yellow Voxel Dog */}
            <div className="hidden sm:flex flex-col items-center transition-transform hover:-translate-y-2 cursor-pointer">
              <div className="relative w-20 h-24 flex items-center justify-center">
                <svg className="w-16 h-16 drop-shadow-md" viewBox="0 0 64 64" fill="none">
                  <rect x="20" y="16" width="24" height="20" rx="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
                  <rect x="16" y="22" width="6" height="12" rx="2" fill="#d97706" stroke="#0f172a" strokeWidth="1.5" />
                  <rect x="22" y="36" width="20" height="18" rx="3" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
                  <rect x="26" y="22" width="4" height="4" fill="#0f172a" />
                  <rect x="36" y="22" width="4" height="4" fill="#0f172a" />
                  <rect x="30" y="28" width="6" height="3" rx="1" fill="#be123c" />
                  <rect x="20" y="34" width="24" height="4" fill="#ef4444" />
                </svg>
              </div>
            </div>

            {/* Left Model 2: Green Tugboat */}
            <div className="hidden md:flex flex-col items-center transition-transform hover:-translate-y-2 cursor-pointer">
              <svg className="w-18 h-18 drop-shadow-md" viewBox="0 0 64 64" fill="none">
                <path d="M12 36l6 14h28l6-14H12z" fill="#059669" stroke="#0f172a" strokeWidth="2" />
                <rect x="26" y="20" width="12" height="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
                <rect x="30" y="12" width="4" height="8" fill="#d97706" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="32" cy="26" r="2.5" fill="#0284c7" />
              </svg>
            </div>

            {/* Centerpiece: The Big Red Digital Creation Chest */}
            <div
              onClick={handleChestClick}
              className={`relative z-20 flex flex-col items-center cursor-pointer transition-all duration-300 ${
                chestOpened ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              {/* 3D Red Chest Case */}
              <div className="relative w-64 sm:w-72 md:w-80 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 p-3.5 border-3 border-amber-400 shadow-2xl shadow-red-500/20">
                {/* Yellow Corner Bumpers */}
                <div className="absolute top-0 left-0 w-5 h-5 bg-amber-400 rounded-tl-xl border-b-2 border-r-2 border-amber-500"></div>
                <div className="absolute top-0 right-0 w-5 h-5 bg-amber-400 rounded-tr-xl border-b-2 border-l-2 border-amber-500"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 bg-amber-400 rounded-bl-xl border-t-2 border-r-2 border-amber-500"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-amber-400 rounded-br-xl border-t-2 border-l-2 border-amber-500"></div>

                {/* Right Side Rotary Dial & Green Button */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 shadow-inner flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  </div>
                  <div className="w-4 h-6 rounded bg-emerald-500 border border-slate-900 shadow"></div>
                </div>

                {/* LCD Digital Display */}
                <div className="rounded-xl bg-slate-900 border-2 border-slate-800 p-4 text-center shadow-inner">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-800 pb-1">
                    Remaining Prize Pool
                  </div>
                  <div className="font-mono text-3xl sm:text-4xl font-black tracking-wider text-white">
                    ${remainingPool.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Reward Notification Banner */}
              {chestMessage && (
                <div className="mt-3 rounded-full bg-emerald-500 px-4 py-1.5 font-sans text-xs font-bold text-white shadow-lg anim-pop">
                  {chestMessage}
                </div>
              )}
            </div>

            {/* Right Model 1: Yellow Chick */}
            <div className="hidden sm:flex flex-col items-center transition-transform hover:-translate-y-2 cursor-pointer">
              <svg className="w-14 h-14 drop-shadow-md" viewBox="0 0 64 64" fill="none">
                <rect x="18" y="20" width="28" height="28" rx="6" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
                <rect x="24" y="28" width="4" height="4" fill="#0f172a" />
                <rect x="36" y="28" width="4" height="4" fill="#0f172a" />
                <polygon points="32,34 26,40 38,40" fill="#f97316" stroke="#0f172a" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Right Model 2: Purple Voxel Cat */}
            <div className="hidden md:flex flex-col items-center transition-transform hover:-translate-y-2 cursor-pointer">
              <svg className="w-20 h-20 drop-shadow-md" viewBox="0 0 64 64" fill="none">
                <polygon points="18,16 26,24 16,24" fill="#8b5cf6" stroke="#0f172a" strokeWidth="1.5" />
                <polygon points="46,16 48,24 38,24" fill="#8b5cf6" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="16" y="22" width="32" height="26" rx="4" fill="#7c3aed" stroke="#0f172a" strokeWidth="2" />
                <rect x="22" y="30" width="6" height="6" fill="#34d399" />
                <rect x="36" y="30" width="6" height="6" fill="#34d399" />
                <rect x="30" y="38" width="4" height="3" rx="1" fill="#f43f5e" />
              </svg>
            </div>

            {/* Right Model 3: Blue Mini Robot */}
            <div className="hidden lg:flex flex-col items-center transition-transform hover:-translate-y-2 cursor-pointer">
              <svg className="w-14 h-18 drop-shadow-md" viewBox="0 0 64 64" fill="none">
                <line x1="32" y1="12" x2="32" y2="18" stroke="#0f172a" strokeWidth="2" />
                <circle cx="32" cy="10" r="3" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="22" y="18" width="20" height="16" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                <circle cx="27" cy="24" r="2" fill="#f8fafc" />
                <circle cx="37" cy="24" r="2" fill="#f8fafc" />
                <rect x="20" y="36" width="24" height="18" rx="2" fill="#0284c7" stroke="#0f172a" strokeWidth="2" />
                <path d="M30 42l2 2 2-2-2-2-2 2z" fill="#f43f5e" />
              </svg>
            </div>
          </div>

          {/* Wooden Table Shelf Underneath */}
          <div className="w-full h-7 rounded-t-lg bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 border-t-2 border-x-2 border-amber-300 shadow-md"></div>
          <div className="w-[98%] h-4 rounded-b-lg bg-amber-300/80 border-b-2 border-amber-400"></div>
        </div>
      </div>

      {/* ── Section Title & Subtitle ── */}
      <div className="relative z-10 mt-14 max-w-2xl mx-auto px-4">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Monthly Submission Milestones Rewards
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
          Complete eligible submissions each month to unlock reward chests. The more you submit, the higher the chest tier—and the bigger the rewards.
        </p>
      </div>
    </div>
  );
}
