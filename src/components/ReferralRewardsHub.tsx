import { useState } from 'react';

interface ReferralRewardsHubProps {
  onOpenRules: () => void;
  accountEmail: string | null;
  onOpenDesk?: () => void;
}

interface DeskFeature {
  id: string;
  name: string;
  tag: string;
  desc: string;
  outputPreview: string;
  keyBenefit: string;
}

const DESK_FEATURES: DeskFeature[] = [
  {
    id: 'risks',
    name: 'Risk & Traps Audit',
    tag: 'Deterministic 0-100 Scoring',
    desc: 'Scans agreements for one-sided indemnities, unlimited consequential liabilities, non-solicit traps, and non-standard remedies.',
    outputPreview: 'High Risk: Section 8.2 imposes uncapped indemnification for indirect damages without reciprocal liability limitations.',
    keyBenefit: 'Flags predatory clauses before signature.',
  },
  {
    id: 'simplify',
    name: 'Plain Language Breakdown',
    tag: 'Executive Translation',
    desc: 'Translates dense legal terminology into clear commercial terms, obligations, glossaries, and affected parties.',
    outputPreview: 'Bottom Line: Contractor grants exclusive worldwide assignment of all inventions created during term with no royalty tail.',
    keyBenefit: 'Immediate clarity for non-legal stakeholders.',
  },
  {
    id: 'compare',
    name: 'Version Redline Diff',
    tag: 'Side-by-Side Exposure Diff',
    desc: 'Identifies substantive legal shifts between initial drafts and opposing markups, highlighting hidden risk transfers.',
    outputPreview: 'Difference: Payment terms extended from Net 30 to Net 90 with deletion of prompt payment interest penalty.',
    keyBenefit: 'Prevents silent margin erosion during contract redlines.',
  },
  {
    id: 'ask',
    name: 'Grounded Document Q&A',
    tag: 'Textual Proof Verification',
    desc: 'Answers specific legal inquiries with direct quote citations and verifiable evidence extracted strictly from the document text.',
    outputPreview: 'Question: Can either party terminate for convenience? Answer: Yes, Section 14.1 allows termination on 30 days written notice.',
    keyBenefit: 'Zero hallucinations with verifiable clause references.',
  },
  {
    id: 'lawyer',
    name: 'Counsel Prep Sheet',
    tag: 'Strategic Consultation Brief',
    desc: 'Prepares a structured pre-negotiation agenda with high-leverage questions, required evidence, and proposed fallback clauses.',
    outputPreview: 'Counsel Agenda: Clarify IP ownership of pre-existing background code; request reciprocal carve-outs in Section 4.3.',
    keyBenefit: 'Reduces legal billable hours and speeds up negotiations.',
  },
];

export function ReferralRewardsHub({
  onOpenRules,
  accountEmail: _accountEmail,
  onOpenDesk,
}: ReferralRewardsHubProps) {
  const [selectedFeature, setSelectedFeature] = useState<string>('risks');
  const current = DESK_FEATURES.find((f) => f.id === selectedFeature) ?? DESK_FEATURES[0];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 font-sans" id="referrals">
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-xs backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-slate-100">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Forensic Contract Intelligence Workbench
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-sans">
              Five specialized in-browser audit engines for comprehensive agreement review and risk mitigation
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

        {/* Feature Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-6 pb-6">
          {DESK_FEATURES.map((feat) => (
            <button
              key={feat.id}
              type="button"
              onClick={() => setSelectedFeature(feat.id)}
              className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                selectedFeature === feat.id
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white hover:border-blue-300'
              }`}
            >
              <span className="block font-mono text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                {feat.tag}
              </span>
              <span className="mt-1 block font-display text-sm font-extrabold text-slate-900">
                {feat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Feature Showcase Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
          {/* Left Description & Benefit (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-0.5 font-mono text-xs font-bold">
                {current.tag}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 mt-2.5">
                {current.name}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-sans">
                {current.desc}
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-200/80 pt-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Value Delivered</div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/90 p-3 text-xs sm:text-sm font-medium text-emerald-900">
                {current.keyBenefit}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenDesk}
                className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                Launch {current.name} in Legal Desk
              </button>
            </div>
          </div>

          {/* Right Live Extraction Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono text-[11px] font-bold text-slate-700">Forensic Output Preview</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                  Local Rule Engine
                </span>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 font-mono text-xs leading-relaxed text-slate-800">
                {current.outputPreview}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <span className="text-[11px] text-slate-400 font-sans">
                Exports to Markdown, Consultation Pack &amp; PDF
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
