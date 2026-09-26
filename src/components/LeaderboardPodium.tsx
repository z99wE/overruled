interface LeaderboardPodiumProps {
  onOpenRules: () => void;
  onInspectEntry?: (rank: number) => void;
  onOpenDesk?: () => void;
}

export function LeaderboardPodium({
  onOpenRules,
  onInspectEntry,
  onOpenDesk,
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
            判例
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

        {/* Anime Judge Face Sticker (Mid Right) */}
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
            <div className="flex h-12 w-52 items-center justify-center rounded-b-xl bg-gradient-to-b from-amber-300 to-amber-500 border-x-2 border-b-2 border-slate-900 shadow-lg">
              <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-950 uppercase tracking-widest">
                ⚖️ Landmark Precedent Bench
              </div>
            </div>
            <div className="w-4 h-3 bg-amber-600 border-x border-b border-slate-900"></div>
          </div>
        </div>

        {/* ── Period Info & Rules Button ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
          <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 font-sans text-xs sm:text-sm font-bold text-amber-300">
            <span>🏛️ 59 Certified Authorities Across 7 Common Law Jurisdictions</span>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="rounded-full border border-amber-400/40 bg-slate-900/80 px-4 py-1.5 font-sans text-xs font-bold text-amber-300 hover:border-amber-300 hover:text-white transition-colors cursor-pointer"
          >
            Court Standards &gt;
          </button>
        </div>

        {/* ── 3-Column Podium Cards Grid ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-end pt-4">
          
          {/* ── TOP 2 (Left, Coral Card) ── */}
          <div
            onClick={() => onInspectEntry ? onInspectEntry(2) : onOpenDesk?.()}
            className="podium-card-top2 rounded-3xl p-4.5 text-slate-950 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 cursor-pointer md:h-[460px]"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between font-sans font-black text-lg sm:text-xl text-white mb-3">
                <div className="flex items-center gap-1.5 text-sm font-mono">
                  <span>UK House of Lords</span>
                </div>
                <div className="font-extrabold text-2xl tracking-tight">RANK 2</div>
              </div>

              {/* Inset Thumbnail Frame */}
              <div className="w-full h-44 rounded-2xl bg-slate-900 border-2 border-red-900 overflow-hidden relative flex flex-col items-center justify-center p-4 text-center shadow-inner">
                <div className="text-3xl mb-2">📜</div>
                <div className="font-serif text-sm font-bold text-amber-200">Donoghue v. Stevenson</div>
                <div className="text-[11px] text-slate-300 mt-1">[1932] AC 562 · Duty of Care</div>
              </div>

              {/* Title & Doctrinal Ratio */}
              <h3 className="mt-3.5 text-center font-sans text-base font-black text-white truncate">
                Consumer Duty of Care Doctrine
              </h3>
              <div className="text-center font-sans text-xs text-white/90 my-1 bg-red-950/40 rounded-lg p-1.5 border border-red-800/40">
                <span className="font-bold">Pain Solved:</span> Limits indefinite tort exposure via the Neighbor Principle.
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="mt-3">
              <button
                type="button"
                className="w-full rounded-full bg-amber-300 hover:bg-amber-200 border-2 border-slate-900 py-2.5 px-3 font-sans text-xs font-black text-slate-900 flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Audit Duty of Care Clause</span>
                <span>⚖️</span>
              </button>
            </div>
          </div>

          {/* ── TOP 1 (Center, Elevated Tall Gold Card) ── */}
          <div
            onClick={() => onInspectEntry ? onInspectEntry(1) : onOpenDesk?.()}
            className="podium-card-top1 rounded-3xl p-5 text-slate-950 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 cursor-pointer md:h-[500px] z-20"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between font-sans font-black text-xl sm:text-2xl text-slate-950 mb-3">
                <div className="flex items-center gap-1.5 text-sm font-mono text-slate-900">
                  <span>AU High Court</span>
                </div>
                <div className="font-extrabold text-3xl tracking-tight text-slate-950">RANK 1</div>
              </div>

              {/* Inset Thumbnail Frame */}
              <div className="w-full h-52 rounded-2xl bg-amber-950/20 border-2 border-amber-600 overflow-hidden relative flex flex-col items-center justify-center p-4 text-center shadow-inner">
                <div className="text-4xl mb-2">🏛️</div>
                <div className="font-serif text-base font-extrabold text-amber-950">Mabo v. Queensland (No 2)</div>
                <div className="text-xs text-slate-800 font-semibold mt-1">(1992) 175 CLR 1 · Native Title</div>
              </div>

              {/* Title & Doctrinal Ratio */}
              <h3 className="mt-3.5 text-center font-sans text-lg font-black text-slate-950 truncate">
                Native Title & Terra Nullius Doctrine
              </h3>
              <div className="text-center font-sans text-xs text-slate-900 font-semibold my-1 bg-amber-400/40 rounded-lg p-2 border border-amber-600/40">
                <span className="font-bold">Pain Solved:</span> Defends proprietary title against unlawful expropriation without plain legislative intent.
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="mt-3">
              <button
                type="button"
                className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 border-2 border-slate-900 py-3 px-3 font-sans text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <span>Audit Property & Title Clauses</span>
                <span>🏛️</span>
              </button>
            </div>
          </div>

          {/* ── TOP 3 (Right, Electric Blue Card) ── */}
          <div
            onClick={() => onInspectEntry ? onInspectEntry(3) : onOpenDesk?.()}
            className="podium-card-top3 rounded-3xl p-4.5 text-slate-950 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 cursor-pointer md:h-[460px]"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between font-sans font-black text-lg sm:text-xl text-white mb-3">
                <div className="flex items-center gap-1.5 text-sm font-mono">
                  <span>US Supreme Court</span>
                </div>
                <div className="font-extrabold text-2xl tracking-tight">RANK 3</div>
              </div>

              {/* Inset Thumbnail Frame */}
              <div className="w-full h-44 rounded-2xl bg-slate-900 border-2 border-sky-900 overflow-hidden relative flex flex-col items-center justify-center p-4 text-center shadow-inner">
                <div className="text-3xl mb-2">⚖️</div>
                <div className="font-serif text-sm font-bold text-sky-200">Miranda v. Arizona</div>
                <div className="text-[11px] text-slate-300 mt-1">384 U.S. 436 · 5th Amendment</div>
              </div>

              {/* Title & Doctrinal Ratio */}
              <h3 className="mt-3.5 text-center font-sans text-base font-black text-white truncate">
                Custodial Procedural Safeguards
              </h3>
              <div className="text-center font-sans text-xs text-white/90 my-1 bg-sky-950/40 rounded-lg p-1.5 border border-sky-800/40">
                <span className="font-bold">Pain Solved:</span> Prevents involuntary waivers and unadvised custodial acknowledgments.
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="mt-3">
              <button
                type="button"
                className="w-full rounded-full bg-sky-200 hover:bg-sky-100 border-2 border-slate-900 py-2.5 px-3 font-sans text-xs font-black text-slate-900 flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Audit Procedural Safeguards</span>
                <span>🛡️</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Precedent Doctrine Breakdown Row ── */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="text-center font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Certified Jurisprudential Modules
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Constitutional / Property */}
            <div className="flex flex-col justify-between rounded-xl border border-amber-400/40 bg-slate-950/80 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-black text-amber-400 text-sm">
                  Title & Sovereignty
                </div>
                <span className="text-xs">🏛️</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Real property ownership, crown acquisition, and statutory extinguishment.
              </p>
              <div className="rounded-md bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                High Court of Australia
              </div>
            </div>

            {/* Commercial Contract */}
            <div className="flex flex-col justify-between rounded-xl border border-sky-400/40 bg-slate-950/80 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-black text-sky-400 text-sm">
                  Contract & Damages
                </div>
                <span className="text-xs">📜</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Liquidated damages, remoteness of loss (Hadley), and mutual good faith.
              </p>
              <div className="rounded-md bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                UK & Commonwealth Bench
              </div>
            </div>

            {/* Privacy & Data Sovereignty */}
            <div className="flex flex-col justify-between rounded-xl border border-emerald-400/40 bg-slate-950/80 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-black text-emerald-400 text-sm">
                  Cross-Border Privacy
                </div>
                <span className="text-xs">🔒</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Data transfers, standard contractual clauses (SCCs), and Schrems II compliance.
              </p>
              <div className="rounded-md bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                European Court of Justice
              </div>
            </div>

            {/* Constitutional Rights */}
            <div className="flex flex-col justify-between rounded-xl border border-purple-400/40 bg-slate-950/80 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-black text-purple-400 text-sm">
                  Fundamental Rights
                </div>
                <span className="text-xs">⚖️</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Due process, non-derogable civil liberties, and basic structure doctrine.
              </p>
              <div className="rounded-md bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                Supreme Court of India & US
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
