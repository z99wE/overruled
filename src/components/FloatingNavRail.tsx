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
        className="floating-rail-pill hover:border-amber-400 group"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs">
          🎁
        </span>
        <span className="group-hover:text-amber-600 transition-colors">Invite Friends & Get Rewards</span>
      </button>

      <button
        type="button"
        onClick={onOpenLeaderboard}
        className="floating-rail-pill hover:border-amber-400 group"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-500 text-xs">
          🏆
        </span>
        <span className="group-hover:text-amber-600 transition-colors">Monthly Leaderboard</span>
      </button>

      <button
        type="button"
        onClick={onOpenRaffle}
        className="floating-rail-pill hover:border-indigo-400 group"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 text-xs">
          🎮
        </span>
        <span className="group-hover:text-indigo-600 transition-colors">Community Raffle</span>
      </button>

      <button
        type="button"
        onClick={onOpenEarnings}
        className="floating-rail-pill border-amber-300 bg-amber-50/90 hover:bg-amber-100 group"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs">
          💼
        </span>
        <span className="text-amber-950 font-bold">My Earnings</span>
      </button>

      <button
        type="button"
        onClick={onOpenRules}
        className="floating-rail-pill border-amber-300 bg-amber-50/90 hover:bg-amber-100 group"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs">
          📖
        </span>
        <span className="text-amber-950 font-bold">Event Rules</span>
      </button>
    </aside>
  );
}
