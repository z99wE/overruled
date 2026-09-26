import { useState } from 'react';

interface MilestoneTrackProps {
  currentSubmissions?: number;
  onOpenRules: () => void;
  onClaimChestTier?: (tier: string) => void;
}

interface ChestTier {
  id: number;
  name: string;
  required: number;
  colorClass: string;
  badgeBg: string;
  textColor: string;
  accentColor: string;
  screenIcon: string;
  chestColor: string;
  trimColor: string;
}

const CHEST_TIERS: ChestTier[] = [
  {
    id: 1,
    name: 'Starter Chest',
    required: 1,
    colorClass: 'chest-card-starter',
    badgeBg: 'bg-rose-100 text-rose-700',
    textColor: 'text-rose-950',
    accentColor: '#f43f5e',
    screenIcon: '⛵',
    chestColor: '#ef4444',
    trimColor: '#f59e0b',
  },
  {
    id: 2,
    name: 'Bronze Chest',
    required: 3,
    colorClass: 'chest-card-bronze',
    badgeBg: 'bg-amber-100 text-amber-800',
    textColor: 'text-amber-950',
    accentColor: '#d97706',
    screenIcon: '⛏️',
    chestColor: '#b45309',
    trimColor: '#fde047',
  },
  {
    id: 3,
    name: 'Silver Chest',
    required: 5,
    colorClass: 'chest-card-silver',
    badgeBg: 'bg-slate-200 text-slate-700',
    textColor: 'text-slate-900',
    accentColor: '#64748b',
    screenIcon: '⚙️',
    chestColor: '#94a3b8',
    trimColor: '#38bdf8',
  },
  {
    id: 4,
    name: 'Gold Chest',
    required: 10,
    colorClass: 'chest-card-gold',
    badgeBg: 'bg-sky-100 text-sky-800',
    textColor: 'text-amber-950',
    accentColor: '#eab308',
    screenIcon: '👑',
    chestColor: '#eab308',
    trimColor: '#10b981',
  },
  {
    id: 5,
    name: 'Diamond Chest',
    required: 20,
    colorClass: 'chest-card-diamond',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    textColor: 'text-blue-950',
    accentColor: '#0ea5e9',
    screenIcon: '💎',
    chestColor: '#0284c7',
    trimColor: '#38bdf8',
  },
  {
    id: 6,
    name: 'Master Chest',
    required: 50,
    colorClass: 'chest-card-master',
    badgeBg: 'bg-purple-100 text-purple-800',
    textColor: 'text-purple-950',
    accentColor: '#7c3aed',
    screenIcon: '⭐',
    chestColor: '#6d28d9',
    trimColor: '#facc15',
  },
];

export function MilestoneTrack({
  currentSubmissions = 1,
  onOpenRules,
  onClaimChestTier,
}: MilestoneTrackProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [claimedTiers, setClaimedTiers] = useState<number[]>([]);

  const handleChestClick = (tier: ChestTier) => {
    setSelectedTier(tier.id);
    if (currentSubmissions >= tier.required) {
      if (!claimedTiers.includes(tier.id)) {
        setClaimedTiers((prev) => [...prev, tier.id]);
        onClaimChestTier?.(tier.name);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6">
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
            Monthly Milestone Progress
          </h3>
          <button
            type="button"
            onClick={onOpenRules}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span>Rules</span>
            <span>&gt;</span>
          </button>
        </div>

        {/* ── Milestone Track Bar with Walking Pixel Character ── */}
        <div className="relative my-8 px-4 sm:px-8">
          {/* Main Dark Track Bar */}
          <div className="relative h-4 w-full rounded-full bg-slate-900 border-2 border-indigo-950">
            {/* Active Progress Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (currentSubmissions / 50) * 100)}%` }}
            />

            {/* Pixel Character Avatar walking on the track */}
            <div
              className="absolute -top-7 -translate-x-1/2 transition-all duration-500 z-20 flex flex-col items-center"
              style={{
                left: `${Math.max(4, Math.min(96, (currentSubmissions / 50) * 100))}%`,
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-slate-900 shadow-md">
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                  <rect x="8" y="4" width="16" height="8" rx="2" fill="#78350f" />
                  <rect x="6" y="8" width="6" height="6" fill="#78350f" />
                  <rect x="20" y="8" width="6" height="6" fill="#78350f" />
                  <rect x="8" y="10" width="16" height="10" fill="#fde047" />
                  <rect x="11" y="13" width="2" height="3" fill="#1e293b" />
                  <rect x="19" y="13" width="2" height="3" fill="#1e293b" />
                  <rect x="14" y="17" width="4" height="1" fill="#ef4444" />
                  <rect x="9" y="20" width="14" height="8" fill="#475569" />
                  <rect x="12" y="20" width="8" height="8" fill="#f8fafc" />
                </svg>
              </div>
            </div>

            {/* 6 Step Nodes */}
            <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-6 pointer-events-none">
              {CHEST_TIERS.map((tier) => {
                const isUnlocked = currentSubmissions >= tier.required;
                return (
                  <div
                    key={tier.id}
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-sans text-xs sm:text-sm font-black border-2 border-slate-900 shadow-sm transition-transform ${
                      isUnlocked
                        ? 'bg-amber-400 text-slate-950 scale-110'
                        : tier.id >= 4
                        ? 'bg-purple-400 text-white'
                        : 'bg-amber-300 text-slate-900'
                    }`}
                  >
                    {tier.id}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 6 Chest Cards Grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 pt-6">
          {CHEST_TIERS.map((tier) => {
            const isUnlocked = currentSubmissions >= tier.required;
            const isClaimed = claimedTiers.includes(tier.id);

            return (
              <div
                key={tier.id}
                onClick={() => handleChestClick(tier)}
                className={`relative flex flex-col items-center rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md ${
                  tier.colorClass
                } ${selectedTier === tier.id ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
              >
                {/* Top Right Locked / Unlocked Pill */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                      isClaimed
                        ? 'bg-emerald-500 text-white'
                        : isUnlocked
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isClaimed ? 'Claimed' : isUnlocked ? 'Ready' : 'Locked'}
                  </span>
                </div>

                {/* 3D Chest Visual Graphic */}
                <div className="my-3 flex h-24 w-full items-center justify-center">
                  <div
                    className="relative w-22 h-20 rounded-xl p-2 border-2 border-slate-900 shadow-md flex flex-col items-center justify-between"
                    style={{ backgroundColor: tier.chestColor }}
                  >
                    <div
                      className="w-full h-2 rounded-t-sm border-b border-slate-900"
                      style={{ backgroundColor: tier.trimColor }}
                    />
                    
                    <div className="w-16 h-10 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shadow-inner">
                      <span>{tier.screenIcon}</span>
                    </div>

                    <div
                      className="w-4 h-2 rounded-sm border border-slate-900 shadow-xs"
                      style={{ backgroundColor: tier.trimColor }}
                    />
                  </div>
                </div>

                {/* Chest Title */}
                <h4 className="font-sans text-sm font-extrabold text-slate-900 mb-2">
                  {tier.name}
                </h4>

                {/* Requirement Tag */}
                <div className={`mt-auto w-full rounded-xl px-2 py-1.5 text-[11px] font-medium leading-tight ${tier.badgeBg}`}>
                  Complete {tier.required} eligible {tier.required === 1 ? 'submission' : 'submissions'} this month to unlock
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
