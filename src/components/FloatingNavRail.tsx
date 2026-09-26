interface FloatingNavRailProps {
  onOpenInvite: () => void;
  onOpenLeaderboard: () => void;
  onOpenRaffle: () => void;
  onOpenEarnings: () => void;
  onOpenRules: () => void;
}

export function FloatingNavRail({
  onOpenInvite,
  onOpenLeaderboard,
  onOpenRaffle,
  onOpenEarnings,
  onOpenRules,
}: FloatingNavRailProps) {
  return (
    <aside className="floating-nav-rail hidden xl:flex" aria-label="Quick Actions">
      <button
        type="button"
        onClick={onOpenInvite}
        className="floating-rail-pill hover:border-blue-400 group cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
          🛡️
        </span>
        <span className="group-hover:text-blue-600 transition-colors">Invite Legal Team</span>
      </button>

      <button
        type="button"
        onClick={onOpenLeaderboard}
        className="floating-rail-pill hover:border-amber-400 group cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-500 text-xs">
          ⚖️
        </span>
        <span className="group-hover:text-amber-600 transition-colors">Precedent Bench</span>
      </button>

      <button
        type="button"
        onClick={onOpenRaffle}
        className="floating-rail-pill hover:border-indigo-400 group cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 text-xs">
          🏛️
        </span>
        <span className="group-hover:text-indigo-600 transition-colors">Precedent Vault</span>
      </button>

      <button
        type="button"
        onClick={onOpenEarnings}
        className="floating-rail-pill border-slate-300 bg-white/90 hover:bg-slate-100 group cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs">
          💼
        </span>
        <span className="text-slate-900 font-bold">Counsel Dockets</span>
      </button>

      <button
        type="button"
        onClick={onOpenRules}
        className="floating-rail-pill border-slate-300 bg-white/90 hover:bg-slate-100 group cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs">
          📜
        </span>
        <span className="text-slate-900 font-bold">Audit Standards</span>
      </button>
    </aside>
  );
}
