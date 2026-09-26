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

      {/* ── 3D Tabletop Stage Showcase with Generated 3D Asset ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <div
          onClick={handleChestClick}
          className={`relative rounded-3xl overflow-hidden border-2 border-slate-200 shadow-xl cursor-pointer transition-all duration-300 ${
            chestOpened ? 'scale-102 ring-4 ring-amber-400' : 'hover:scale-101'
          }`}
        >
          <img
            src="/assets/hero_chest_stage.jpg"
            alt="3D Creation Chest Tabletop Showcase"
            className="w-full h-auto object-cover"
          />

          {/* Interactive Live Prize Pill Overlay */}
          <div className="absolute top-4 right-4 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/50 px-4 py-1.5 font-mono text-xs sm:text-sm font-black text-amber-300 shadow-lg">
            Live Pool: ${remainingPool.toLocaleString()}
          </div>

          {/* Reward Notification Banner */}
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
          Monthly Submission Milestones Rewards
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
          Complete eligible submissions each month to unlock reward chests. The more you submit, the higher the chest tier—and the bigger the rewards.
        </p>
      </div>
    </div>
  );
}
