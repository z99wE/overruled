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
    <section className="mx-auto w-full max-w-6xl px-4 py-12 font-sans" id="leaderboard">
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-xs backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-slate-100">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Landmark Precedent Bench
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-sans">
              59 Certified Authorities across 7 Common Law Jurisdictions
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Court Standards
          </button>
        </div>

        {/* 3-Column Podium Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-end pt-8">
          
          {/* ── TOP 2 (Left Card) ── */}
          <div
            onClick={() => onInspectEntry ? onInspectEntry(2) : onOpenDesk?.()}
            className="group rounded-3xl border border-slate-200 bg-slate-50/80 p-5 flex flex-col justify-between transition-all hover:bg-white hover:border-blue-400 hover:shadow-md cursor-pointer md:min-h-[440px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-slate-200/90 px-3 py-0.5 font-mono text-xs font-bold text-slate-700">
                  UK House of Lords
                </span>
                <span className="font-display text-lg font-black text-slate-900">Rank 02</span>
              </div>

              <div className="w-full h-40 rounded-2xl overflow-hidden relative border border-slate-200 shadow-2xs mb-4">
                <img
                  src="/assets/starter_chest.jpg"
                  alt="Donoghue v. Stevenson Precedent"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                  [1932] AC 562
                </div>
              </div>

              <h3 className="font-display text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Donoghue v. Stevenson
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5 mb-2">
                Consumer Duty of Care &amp; Neighbor Principle
              </p>

              <div className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-200/80 space-y-1">
                <div><strong className="text-slate-900">Ratio:</strong> Manufacturer owes duty of care without intermediate examination.</div>
                <div className="text-emerald-700 font-medium"><strong className="text-emerald-800">Application:</strong> Limits indefinite tort exposure in product agreements.</div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-full bg-slate-900 hover:bg-blue-600 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Inspect Judicial Ratio
            </button>
          </div>

          {/* ── TOP 1 (Center Elevated Card) ── */}
          <div
            onClick={() => onInspectEntry ? onInspectEntry(1) : onOpenDesk?.()}
            className="group rounded-3xl border-2 border-amber-400 bg-amber-50/40 p-6 flex flex-col justify-between transition-all hover:bg-white hover:shadow-xl cursor-pointer md:min-h-[480px] shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-amber-400 text-slate-950 px-3 py-0.5 font-mono text-xs font-black">
                  High Court of Australia
                </span>
                <span className="font-display text-xl font-black text-amber-600">Rank 01</span>
              </div>

              <div className="w-full h-48 rounded-2xl overflow-hidden relative border border-amber-300 shadow-xs mb-4">
                <img
                  src="/assets/gold_chest.jpg"
                  alt="Mabo v. Queensland Precedent"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 rounded-lg bg-slate-950/85 px-3 py-1 text-xs font-bold text-amber-300">
                  (1992) 175 CLR 1
                </div>
              </div>

              <h3 className="font-display text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Mabo v. Queensland (No 2)
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5 mb-2">
                Native Title &amp; Rejection of Terra Nullius
              </p>

              <div className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-amber-200 space-y-1">
                <div><strong className="text-slate-900">Ratio:</strong> Common law recognizes indigenous property rights unless clearly extinguished.</div>
                <div className="text-emerald-700 font-medium"><strong className="text-emerald-800">Application:</strong> Gold-standard authority for property, sovereignty, and sovereign rights.</div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-full bg-amber-400 hover:bg-amber-300 py-3 text-xs font-black text-slate-950 shadow-xs transition-colors cursor-pointer"
            >
              Enter Benchmark Trial
            </button>
          </div>

          {/* ── TOP 3 (Right Card) ── */}
          <div
            onClick={() => onInspectEntry ? onInspectEntry(3) : onOpenDesk?.()}
            className="group rounded-3xl border border-slate-200 bg-slate-50/80 p-5 flex flex-col justify-between transition-all hover:bg-white hover:border-blue-400 hover:shadow-md cursor-pointer md:min-h-[440px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-slate-200/90 px-3 py-0.5 font-mono text-xs font-bold text-slate-700">
                  US Supreme Court
                </span>
                <span className="font-display text-lg font-black text-slate-900">Rank 03</span>
              </div>

              <div className="w-full h-40 rounded-2xl overflow-hidden relative border border-slate-200 shadow-2xs mb-4">
                <img
                  src="/assets/diamond_chest.jpg"
                  alt="Miranda v. Arizona Precedent"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                  384 U.S. 436 (1966)
                </div>
              </div>

              <h3 className="font-display text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Miranda v. Arizona
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5 mb-2">
                Fifth Amendment Privilege &amp; Procedural Safeguards
              </p>

              <div className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-200/80 space-y-1">
                <div><strong className="text-slate-900">Ratio:</strong> Custodial interrogation statements inadmissible without procedural warnings.</div>
                <div className="text-emerald-700 font-medium"><strong className="text-emerald-800">Application:</strong> Inadmissibility defense against procedural overreach.</div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-full bg-slate-900 hover:bg-blue-600 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Inspect Judicial Ratio
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
