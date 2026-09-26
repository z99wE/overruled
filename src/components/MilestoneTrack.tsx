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
  imageSrc: string;
}

const AUDIT_TIERS: AuditTier[] = [
  {
    id: 1,
    name: 'NDA & IP Secrecy',
    category: 'Confidentiality',
    painPoint: 'Broad disclosures & no remedy caps',
    benefit: 'Strict trade-secret carve-outs',
    required: 1,
    imageSrc: '/assets/starter_chest.jpg',
  },
  {
    id: 2,
    name: 'MSA & Liability Caps',
    category: 'Commercial',
    painPoint: 'Uncapped consequential damages',
    benefit: '12-month fee cap & mutual indemnity',
    required: 3,
    imageSrc: '/assets/gold_chest.jpg',
  },
  {
    id: 3,
    name: 'SaaS & Data Privacy',
    category: 'Compliance',
    painPoint: 'Cross-border data liability & leaks',
    benefit: 'GDPR & Schrems II safe harbors',
    required: 5,
    imageSrc: '/assets/diamond_chest.jpg',
  },
  {
    id: 4,
    name: 'M&A Asset Protection',
    category: 'Corporate',
    painPoint: 'Hidden reps & warranties traps',
    benefit: 'Forensic disclosure schedule audit',
    required: 10,
    imageSrc: '/assets/gold_chest.jpg',
  },
  {
    id: 5,
    name: 'Employment Restraints',
    category: 'Labor & IP',
    painPoint: 'Unenforceable non-compete overreach',
    benefit: 'Blue-pencil severability audit',
    required: 20,
    imageSrc: '/assets/diamond_chest.jpg',
  },
  {
    id: 6,
    name: 'High Court Precedents',
    category: 'Appellate',
    painPoint: 'Hallucinated citations & weak ratios',
    benefit: '59 Certified common law authorities',
    required: 50,
    imageSrc: '/assets/master_chest.jpg',
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 font-sans">
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-xs backdrop-blur-md">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
              Contract Risk &amp; Defense Mastery Track
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Solve critical contract pain points and unlock verified precedent defense levels.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Audit Standards
          </button>
        </div>

        {/* 6 Audit Tier Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          {AUDIT_TIERS.map((tier) => {
            const isUnlocked = currentSubmissions >= tier.required;
            const isClaimed = claimedTiers.includes(tier.id);
            const isSelected = selectedTier === tier.id;

            return (
              <div
                key={tier.id}
                onClick={() => handleTierClick(tier)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                      Tier 0{tier.id} · {tier.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {isClaimed ? 'Active' : isUnlocked ? 'Ready' : `${tier.required} Audits`}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    <img
                      src={tier.imageSrc}
                      alt={tier.name}
                      className="h-16 w-16 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h4 className="font-display text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {tier.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {isUnlocked ? 'Unlocked & Active' : 'Pre-requisite for certification'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-3 text-xs">
                    <div className="rounded-lg bg-rose-50/80 border border-rose-200/70 p-2 text-rose-900">
                      <span className="font-bold">Pain Solved: </span>
                      <span>{tier.painPoint}</span>
                    </div>
                    <div className="rounded-lg bg-emerald-50/80 border border-emerald-200/70 p-2 text-emerald-900">
                      <span className="font-bold">Benefit: </span>
                      <span>{tier.benefit}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">
                    {isUnlocked ? 'Ready for Docket Export' : `Requires ${tier.required} Verified Audits`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenDesk) onOpenDesk();
                    }}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 px-3.5 py-1 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                  >
                    Run Audit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
