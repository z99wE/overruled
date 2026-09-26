interface LeaderboardPodiumProps {
  onOpenRules: () => void;
  onInspectEntry?: (rank: number) => void;
}

export function LeaderboardPodium({
  onOpenRules,
  onInspectEntry,
}: LeaderboardPodiumProps) {
  return (
    <section className="relative w-full grid-graph-dark py-16 px-4 text-white overflow-hidden" id="leaderboard">
      {/* ── Floating Pixel Stickers on Dark Canvas ── */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {/* Heart Sticker (Left) */}
        <div className="arcade-sticker absolute top-20 left-[6%]">
          <svg className="w-10 h-10 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Japanese text / Arcade badge (Mid Left) */}
        <div className="arcade-sticker absolute top-48 left-[4%]">
          <div className="rounded-lg bg-pink-500/20 border-2 border-pink-400 p-2 font-mono text-xs font-black text-pink-300">
            解吃
          </div>
        </div>

        {/* Blue Airplane Sticker (Mid Left) */}
        <div className="arcade-sticker absolute top-72 left-[8%] anim-float">
          <svg className="w-9 h-9 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Star Sticker (Bottom Left) */}
        <div className="arcade-sticker absolute bottom-24 left-[5%]">
          <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7-6.2-3.6-6.2 3.6 1.6-7L2 9.2l7.2-.6L12 2z" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Star Sticker (Top Right) */}
        <div className="arcade-sticker absolute top-24 right-[7%]">
          <svg className="w-10 h-10 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.8 6.6 7.2.6-5.4 4.8 1.6 7-6.2-3.6-6.2 3.6 1.6-7L2 9.2l7.2-.6L12 2z" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Cute Anime Boy Face Sticker (Mid Right) */}
        <div className="arcade-sticker absolute top-60 right-[4%]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 border-2 border-slate-900 shadow-md">
            <span className="text-xl">🧑‍⚖️</span>
          </div>
        </div>

        {/* Blue Cursor Pointer (Bottom Right) */}
        <div className="arcade-sticker absolute bottom-28 right-[8%]">
          <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.43z" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* ── Top Gavel / Trophy Emblem Hanging Center ── */}
        <div className="flex justify-center -mt-8 mb-4">
          <div className="flex flex-col items-center">
            {/* Pixel Extruder / Gavel Trophy */}
            <div className="flex h-12 w-32 items-center justify-center rounded-b-xl bg-gradient-to-b from-amber-300 to-amber-500 border-x-2 border-b-2 border-slate-900 shadow-lg">
              <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-950 uppercase tracking-widest">
                🏆 Top Rankings
              </div>
            </div>
            <div className="w-4 h-3 bg-amber-600 border-x border-b border-slate-900"></div>
          </div>
        </div>

        {/* ── Period Info & Rules Button ── */}
        <div className="flex items-center justify-between pb-8">
          <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 font-sans text-xs sm:text-sm font-bold text-amber-300">
            <span>📅 September 2026 | 4 days left in this ranking period</span>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="rounded-full border border-amber-400/40 bg-slate-900/80 px-4 py-1.5 font-sans text-xs font-bold text-amber-300 hover:border-amber-300 hover:text-white transition-colors cursor-pointer"
          >
            Rules &gt;
          </button>
        </div>

        {/* ── 3-Column Podium Cards Grid ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-end pt-4">
          
          {/* ── TOP 2 (Left, Coral Red Card) ── */}
          <div
            onClick={() => onInspectEntry?.(2)}
            className="podium-card-top2 rounded-3xl p-4.5 text-slate-950 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 cursor-pointer md:h-[430px]"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between font-sans font-black text-lg sm:text-xl text-white mb-3">
                <div className="flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>502.239</span>
                </div>
                <div className="font-extrabold text-2xl tracking-tight">TOP 2</div>
              </div>

              {/* Inset Thumbnail Frame */}
              <div className="w-full h-44 rounded-2xl bg-slate-900 border-2 border-red-900 overflow-hidden relative flex items-center justify-center shadow-inner">
                <div className="flex items-center justify-center gap-2 scale-110">
                  <div className="w-14 h-14 rounded-full bg-orange-500 border-4 border-slate-950 flex items-center justify-center shadow-md">
                    <div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-slate-950"></div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-orange-500 border-4 border-slate-950 flex items-center justify-center shadow-md">
                    <div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-slate-950"></div>
                  </div>
                </div>
              </div>

              {/* Title & Author */}
              <h3 className="mt-3.5 text-center font-sans text-lg font-black text-white truncate">
                3 gear fidget ROLLER
              </h3>
              <div className="text-center font-mono text-[11px] text-white/80 my-1">
                ·············· BondFire ··············
              </div>
            </div>

            {/* Bottom Reward Button */}
            <div className="mt-4">
              <button
                type="button"
                className="w-full rounded-full bg-amber-300 hover:bg-amber-200 border-2 border-slate-900 py-2.5 px-3 font-sans text-xs font-black text-slate-900 flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Rewards will be issued after...</span>
                <span>🎁</span>
              </button>
            </div>
          </div>

          {/* ── TOP 1 (Center, Elevated Tall Gold Card) ── */}
          <div
            onClick={() => onInspectEntry?.(1)}
            className="podium-card-top1 rounded-3xl p-5 text-slate-950 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 cursor-pointer md:h-[480px] z-20"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between font-sans font-black text-xl sm:text-2xl text-slate-950 mb-3">
                <div className="flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>686.415</span>
                </div>
                <div className="font-extrabold text-3xl tracking-tight text-slate-950">TOP 1</div>
              </div>

              {/* Inset Thumbnail Frame */}
              <div className="w-full h-52 rounded-2xl bg-amber-950/20 border-2 border-amber-600 overflow-hidden relative flex items-center justify-center shadow-inner">
                <div className="w-36 h-36 rounded-xl bg-gradient-to-b from-amber-700 to-amber-900 border-3 border-slate-900 p-2 shadow-lg flex flex-col justify-between">
                  <div className="w-full h-8 rounded bg-amber-100/90 border border-slate-900 flex items-center justify-center font-mono text-[10px] font-bold text-slate-900">
                    LATTICE 01
                  </div>
                  <div className="w-full h-8 rounded bg-amber-100/90 border border-slate-900 flex items-center justify-center font-mono text-[10px] font-bold text-slate-900">
                    LATTICE 02
                  </div>
                  <div className="w-full h-8 rounded bg-amber-100/90 border border-slate-900 flex items-center justify-center font-mono text-[10px] font-bold text-slate-900">
                    LATTICE 03
                  </div>
                </div>
              </div>

              {/* Title & Author */}
              <h3 className="mt-4 text-center font-sans text-xl font-black text-slate-950 truncate">
                镂空抽屉收纳盒
              </h3>
              <div className="text-center font-mono text-xs text-slate-800 font-bold my-1">
                ·············· U0006850... ··············
              </div>
            </div>

            {/* Bottom Reward Button */}
            <div className="mt-4">
              <button
                type="button"
                className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 border-2 border-slate-900 py-3 px-3 font-sans text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <span>Rewards will be issued after...</span>
                <span>🎁</span>
              </button>
            </div>
          </div>

          {/* ── TOP 3 (Right, Electric Blue Card) ── */}
          <div
            onClick={() => onInspectEntry?.(3)}
            className="podium-card-top3 rounded-3xl p-4.5 text-slate-950 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 cursor-pointer md:h-[430px]"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between font-sans font-black text-lg sm:text-xl text-white mb-3">
                <div className="flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>353.865</span>
                </div>
                <div className="font-extrabold text-2xl tracking-tight">TOP 3</div>
              </div>

              {/* Inset Thumbnail Frame */}
              <div className="w-full h-44 rounded-2xl bg-slate-900 border-2 border-sky-900 overflow-hidden relative flex items-center justify-center shadow-inner">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-600 border-3 border-slate-950 flex items-center justify-center shadow-md relative">
                    <div className="w-3 h-5 bg-white rounded-full rotate-12 -translate-x-2"></div>
                    <div className="w-3 h-5 bg-white rounded-full -rotate-12 translate-x-2"></div>
                  </div>
                  <div className="w-10 h-8 rounded-b-lg bg-blue-700 border-2 border-slate-950"></div>
                </div>
              </div>

              {/* Title & Author */}
              <h3 className="mt-3.5 text-center font-sans text-base sm:text-lg font-black text-white truncate">
                Q 版蜘蛛侠 (Spider-Man)
              </h3>
              <div className="text-center font-mono text-[11px] text-white/80 my-1">
                ·············· renke233 ··············
              </div>
            </div>

            {/* Bottom Reward Button */}
            <div className="mt-4">
              <button
                type="button"
                className="w-full rounded-full bg-sky-200 hover:bg-sky-100 border-2 border-slate-900 py-2.5 px-3 font-sans text-xs font-black text-slate-900 flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Rewards will be issued after...</span>
                <span>🎁</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Leaderboard Chest Reward Breakdown Row ── */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="text-center font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Leaderboard Chest
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Top 1 Tier */}
            <div className="flex items-center justify-between rounded-xl border border-amber-400/40 bg-slate-950/80 p-3">
              <div className="font-display font-black text-amber-400 text-base">
                TOP 1
              </div>
              <div className="flex flex-col gap-1">
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  🔥 "Trending" Badge
                </div>
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  🎁 Champion Chest
                </div>
              </div>
            </div>

            {/* Top 2-3 Tier */}
            <div className="flex items-center justify-between rounded-xl border border-sky-400/40 bg-slate-950/80 p-3">
              <div className="font-display font-black text-sky-400 text-base">
                TOP 2-3
              </div>
              <div className="flex flex-col gap-1">
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  🔥 "Trending" Badge
                </div>
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  🎁 Star Chest
                </div>
              </div>
            </div>

            {/* 4th-5th Place */}
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/80 p-3">
              <div className="flex flex-col">
                <span className="text-sm">🔥</span>
                <span className="font-sans text-[11px] font-bold text-slate-300">4th–5th Place</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                  🔥 "Trending" Badge
                </div>
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                  🎁 Trending Chest
                </div>
              </div>
            </div>

            {/* 6th-20th Place */}
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/80 p-3">
              <div className="flex flex-col">
                <span className="text-sm">🔥</span>
                <span className="font-sans text-[11px] font-bold text-slate-300">6th–20th Place</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                  🔥 "Trending" Badge
                </div>
                <div className="rounded-md bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  💎 50 Points/Person
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
