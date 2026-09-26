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
    <aside className="floating-nav-rail hidden xl:flex font-sans" aria-label="Quick Actions">
      <button
        type="button"
        onClick={onOpenInvite}
        className="floating-rail-pill hover:border-blue-400 group cursor-pointer"
      >
        <span className="group-hover:text-blue-600 transition-colors">Workbench</span>
      </button>

      <button
        type="button"
        onClick={onOpenLeaderboard}
        className="floating-rail-pill hover:border-amber-400 group cursor-pointer"
      >
        <span className="group-hover:text-amber-600 transition-colors">Precedent Bench</span>
      </button>

      <button
        type="button"
        onClick={onOpenRaffle}
        className="floating-rail-pill hover:border-indigo-400 group cursor-pointer"
      >
        <span className="group-hover:text-indigo-600 transition-colors">Precedent Vault</span>
      </button>

      <button
        type="button"
        onClick={onOpenEarnings}
        className="floating-rail-pill border-slate-200 bg-white/95 hover:bg-slate-50 group cursor-pointer"
      >
        <span className="text-slate-900 font-bold">Counsel Dockets</span>
      </button>

      <button
        type="button"
        onClick={onOpenRules}
        className="floating-rail-pill border-slate-200 bg-white/95 hover:bg-slate-50 group cursor-pointer"
      >
        <span className="text-slate-900 font-bold">Audit Standards</span>
      </button>
    </aside>
  );
}
