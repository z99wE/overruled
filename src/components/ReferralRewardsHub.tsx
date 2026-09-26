import { useState } from 'react';

interface ReferralRewardsHubProps {
  onOpenRules: () => void;
  accountEmail: string | null;
  onOpenDesk?: () => void;
}

export function ReferralRewardsHub({
  onOpenRules,
  accountEmail,
  onOpenDesk,
}: ReferralRewardsHubProps) {
  const [activeTab, setActiveTab] = useState<'benefits' | 'invite'>('benefits');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?ref=${accountEmail ? encodeURIComponent(accountEmail.split('@')[0]) : 'counsel'}`;
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12" id="referrals">
      {/* ── Section Header ── */}
      <div className="text-center mb-8">
        <h2 className="flex items-center justify-center gap-2 font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">
          <span>🛡️</span>
          <span>Firm & Legal Team Collaboration</span>
          <span>⚖️</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 font-sans max-w-xl mx-auto">
          Equip your associates, co-counsel, and in-house teams with zero-leak contract risk intelligence and certified precedent sparring.
        </p>
      </div>

      {/* ── Main Dual Layout Container ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: You Get vs Friends Get & Step Flow (8 cols) ── */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
          
          {/* Top Switcher & Rules Link */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div className="flex items-center rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('benefits')}
                className={`rounded-full px-5 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'benefits'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Team Benefits
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className={`rounded-full px-5 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'invite'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Invite Co-Counsel
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenRules}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>Security Standards</span>
              <span>&gt;</span>
            </button>
          </div>

          {/* ── Side-by-Side: "Lead Counsel Gains" vs "Invited Team Gains" ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            
            {/* ── "Lead Counsel Gains" Card ── */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4">
              <h3 className="text-center font-sans text-base font-extrabold text-slate-900 mb-3">
                Lead Counsel Gains
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Sub-card 1: Zero-Leak Privacy Guard */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-blue-200 shadow-xs bg-white">
                  <div className="bg-sky-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">
                      Privilege Protection
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Eliminate Third-Party LLM Data Leaks
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 border border-blue-300 font-sans text-xs font-black text-blue-800 shadow-xs">
                      🔒
                    </div>
                  </div>
                  <div className="bg-blue-600 h-20 flex flex-col items-center justify-center p-2 text-center text-[10px] text-white font-medium">
                    100% In-Browser Local Execution
                  </div>
                </div>

                {/* Sub-card 2: Standardized Firm Redlines */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-200 shadow-xs bg-white">
                  <div className="bg-emerald-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">
                      Standardization
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Unified Firm Redline & Risk Thresholds
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 font-sans text-xs font-black text-emerald-800 shadow-xs">
                      📊
                    </div>
                  </div>
                  <div className="bg-emerald-600 h-20 flex flex-col items-center justify-center p-2 text-center text-[10px] text-white font-medium">
                    Consistent 0-100 Risk Scoring
                  </div>
                </div>

              </div>
            </div>

            {/* ── "Invited Associates & Colleagues Gain" Card ── */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4">
              <h3 className="text-center font-sans text-base font-extrabold text-slate-900 mb-3">
                Invited Associates Gain
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Sub-card 1: 59 Landmark Authorities */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-rose-200 shadow-xs bg-white">
                  <div className="bg-rose-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight">
                      Citation Corpus
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Instant Access to 59 Certified Rulings
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 border border-rose-300 font-sans text-xs font-black text-rose-800 shadow-xs">
                      📜
                    </div>
                  </div>
                  <div className="bg-slate-900 h-20 flex flex-col items-center justify-center p-2 text-center text-[10px] text-amber-300 font-medium">
                    US · UK · CA · AU · EU · IN
                  </div>
                </div>

                {/* Sub-card 2: Adversarial Trial Sparring */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-purple-200 shadow-xs bg-white">
                  <div className="bg-purple-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-tight">
                      Trial Sparring
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Adversarial Chamber Simulation
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 border border-purple-300 font-sans text-xs font-black text-purple-800 shadow-xs">
                      ⚖️
                    </div>
                  </div>
                  <div className="bg-purple-600 h-20 flex flex-col items-center justify-center p-2 text-center text-[10px] text-white font-medium">
                    Stress-Test Contract Defenses
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* ── 4-Step Pipeline Flow ── */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center text-center">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm mb-1.5 shadow-xs">
                  🔗
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">1. Generate Link</div>
                <div className="text-[10px] text-slate-500">Create Encrypted Workspace Invite</div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-sm mb-1.5 shadow-xs">
                  📢
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">2. Share with Team</div>
                <div className="text-[10px] text-slate-500">Email, Slack, or Secure Message</div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-sm mb-1.5 shadow-xs">
                  👤
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">3. Activate BYOK</div>
                <div className="text-[10px] text-slate-500">Client-Side Zero-Leak Privacy</div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-sm mb-1.5 shadow-xs">
                  ⚡
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">4. Audit & Spar</div>
                <div className="text-[10px] text-slate-500">Export Certified Redline Dockets</div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Right Column: Share Link & Legal Standards (4 cols) ── */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-sans text-base font-extrabold text-slate-900">
                Workspace Invite Link
              </h3>
              <button
                type="button"
                onClick={onOpenRules}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Security &gt;
              </button>
            </div>

            {/* Pain Point vs Solution Callout */}
            <div className="my-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
              <div className="flex items-center gap-1.5 font-sans text-xs font-bold text-amber-900">
                <span>⚠️</span>
                <span>The Cloud AI Risk:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Standard AI tools store and train on uploaded contracts. Overrool processes documents strictly in-browser with zero telemetry on your drafts.
              </p>
            </div>

            {/* Share Link Input */}
            <div className="space-y-2">
              <label className="font-sans text-xs font-bold text-slate-700">
                Your Firm Invite Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}?ref=${accountEmail ? encodeURIComponent(accountEmail.split('@')[0]) : 'counsel'}`}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenDesk}
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 px-4 font-sans text-xs font-bold text-white shadow-sm transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Legal Risk Desk</span>
              <span>⚡</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
