import { useState } from 'react';

interface MilestoneTrackProps {
  currentSubmissions?: number;
  onOpenRules: () => void;
  onClaimChestTier?: (tier: string) => void;
  onOpenDesk?: () => void;
}

interface AuditTier {
  id: number;
  name: string;
  category: string;
  painPoint: string;
  benefit: string;
  required: number;
  colorClass: string;
  badgeBg: string;
  imageSrc?: string;
  screenIcon: string;
  chestColor: string;
  trimColor: string;
}

const AUDIT_TIERS: AuditTier[] = [
  {
    id: 1,
    name: 'NDA & IP Secrecy',
    category: 'Confidentiality',
    painPoint: 'Broad disclosures & no remedy caps',
    benefit: 'Strict trade-secret carve-outs',
    required: 1,
    colorClass: 'chest-card-starter',
    badgeBg: 'bg-rose-100 text-rose-700',
    imageSrc: '/assets/starter_chest.jpg',
    screenIcon: '📜',
    chestColor: '#ef4444',
    trimColor: '#f59e0b',
  },
  {
    id: 2,
    name: 'MSA & Liability Caps',
    category: 'Commercial',
    painPoint: 'Uncapped consequential damages',
    benefit: '12-mo fee cap & mutual indemnity',
    required: 3,
    colorClass: 'chest-card-bronze',
    badgeBg: 'bg-amber-100 text-amber-800',
    screenIcon: '⚖️',
    chestColor: '#b45309',
    trimColor: '#fde047',
  },
  {
    id: 3,
    name: 'SaaS & Data Privacy',
    category: 'Compliance',
    painPoint: 'Cross-border data liability & leaks',
    benefit: 'GDPR / Schrems II safe harbors',
    required: 5,
    colorClass: 'chest-card-silver',
    badgeBg: 'bg-slate-200 text-slate-700',
    screenIcon: '🛡️',
    chestColor: '#94a3b8',
    trimColor: '#38bdf8',
  },
  {
    id: 4,
    name: 'M&A Asset Protection',
    category: 'Corporate',
    painPoint: 'Hidden reps & warranties traps',
    benefit: 'Forensic disclosure schedule audit',
    required: 10,
    colorClass: 'chest-card-gold',
    badgeBg: 'bg-sky-100 text-sky-800',
    imageSrc: '/assets/gold_chest.jpg',
    screenIcon: '👑',
    chestColor: '#eab308',
    trimColor: '#10b981',
  },
  {
    id: 5,
    name: 'Employment Restraints',
    category: 'Labor & IP',
    painPoint: 'Unenforceable non-compete overreach',
    benefit: 'Blue-pencil severability audit',
    required: 20,
    colorClass: 'chest-card-diamond',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    imageSrc: '/assets/diamond_chest.jpg',
    screenIcon: '💎',
    chestColor: '#0284c7',
    trimColor: '#38bdf8',
  },
  {
    id: 6,
    name: 'High Court Precedents',
    category: 'Appellate',
    painPoint: 'Hallucinated citations & weak ratios',
    benefit: '59+ Certified common law authorities',
    required: 50,
    colorClass: 'chest-card-master',
    badgeBg: 'bg-purple-100 text-purple-800',
    imageSrc: '/assets/master_chest.jpg',
    screenIcon: '⭐',
    chestColor: '#6d28d9',
    trimColor: '#facc15',
  },
];

export function MilestoneTrack({
  currentSubmissions = 1,
  onOpenRules,
  onClaimChestTier,
  onOpenDesk,
}: MilestoneTrackProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [claimedTiers, setClaimedTiers] = useState<number[]>([]);

  const handleTierClick = (tier: AuditTier) => {
    setSelectedTier(tier.id);
    if (currentSubmissions >= tier.required) {
      if (!claimedTiers.includes(tier.id)) {
        setClaimedTiers((prev) => [...prev, tier.id]);
        onClaimChestTier?.(tier.name);
      }
    } else if (onOpenDesk) {
      onOpenDesk();
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
              Contract Risk & Defense Mastery Track
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Solve critical contract pain points and unlock verified precedent defense levels.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span>Audit Standards</span>
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
              {AUDIT_TIERS.map((tier) => {
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

        {/* ── 6 Audit Tier Cards Grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 pt-6">
          {AUDIT_TIERS.map((tier) => {
            const isUnlocked = currentSubmissions >= tier.required;
            const isClaimed = claimedTiers.includes(tier.id);

            return (
              <div
                key={tier.id}
                onClick={() => handleTierClick(tier)}
                className={`relative flex flex-col items-center rounded-2xl p-3 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md ${
                  tier.colorClass
                } ${selectedTier === tier.id ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
              >
                {/* Top Right Status Pill */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                      isClaimed
                        ? 'bg-emerald-500 text-white'
                        : isUnlocked
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/90 backdrop-blur-xs text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isClaimed ? 'Active' : isUnlocked ? 'Ready' : 'Level ' + tier.id}
                  </span>
                </div>

                {/* 3D Visual Render */}
                <div className="my-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl">
                  {tier.imageSrc ? (
                    <img
                      src={tier.imageSrc}
                      alt={tier.name}
                      className="h-full w-full object-cover rounded-xl shadow-xs transition-transform hover:scale-105"
                    />
                  ) : (
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
                  )}
                </div>

                {/* Tier Title & Category */}
                <h4 className="font-sans text-xs sm:text-sm font-extrabold text-slate-900 mb-0.5 leading-snug">
                  {tier.name}
                </h4>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mb-1.5">
                  {tier.category}
                </div>

                {/* Pain Point Solved & Benefit */}
                <div className="w-full text-left bg-white/70 rounded-lg p-2 border border-slate-200/60 mb-2 space-y-1">
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <span className="font-bold text-slate-800">Pain:</span> {tier.painPoint}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium leading-tight">
                    <span className="font-bold">Benefit:</span> {tier.benefit}
                  </div>
                </div>

                {/* Requirement Tag */}
                <div className={`mt-auto w-full rounded-xl px-2 py-1 text-[10px] font-semibold leading-tight ${tier.badgeBg}`}>
                  {tier.required} {tier.required === 1 ? 'Audit' : 'Audits'} required
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
