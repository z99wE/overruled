import { useState } from 'react';

interface ReferralRewardsHubProps {
  onOpenRules: () => void;
  accountEmail: string | null;
}

export function ReferralRewardsHub({
  onOpenRules,
  accountEmail,
}: ReferralRewardsHubProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'share'>('rules');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?ref=${accountEmail ? encodeURIComponent(accountEmail.split('@')[0]) : 'advocate'}`;
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12" id="referrals">
      {/* ── Section Header ── */}
      <div className="text-center mb-8">
        <h2 className="flex items-center justify-center gap-2 font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">
          <span>🎁</span>
          <span>Referral Rewards</span>
          <span>🪙</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 font-sans max-w-xl mx-auto">
          Invite a friend to sign up and complete their first eligible submission—you'll both earn rewards.
        </p>
      </div>

      {/* ── Main Dual Layout Container ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: You Get vs Friends Get & Step Flow (8 cols) ── */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
          
          {/* Top Switcher & Rules Link */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`rounded-full px-5 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Referral Rules
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('share')}
                className={`rounded-full px-5 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'share'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Share & Earn Rewards
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenRules}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>Rules</span>
              <span>&gt;</span>
            </button>
          </div>

          {/* ── Side-by-Side: "You Get" vs "Friends Get" ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            
            {/* ── "You Get" Card ── */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4">
              <h3 className="text-center font-sans text-base font-extrabold text-slate-900 mb-3">
                You Get
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Sub-card 1: Earn $1 per Referral */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-blue-200 shadow-xs bg-white">
                  <div className="bg-sky-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">
                      Event Period (First 5 only)
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Earn $1 per Referral
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 border border-amber-500 font-sans text-xs font-black text-slate-950 shadow-xs">
                      $1
                    </div>
                  </div>
                  <div className="bg-blue-600 h-20 flex items-center justify-center">
                    <div className="w-12 h-10 rounded-lg bg-sky-300 border-2 border-slate-900 p-1 flex items-center justify-center relative shadow-sm">
                      <div className="w-8 h-5 rounded-sm bg-white border border-slate-900 flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-card 2: Earn $3 for Friend's First Submission */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-200 shadow-xs bg-white">
                  <div className="bg-emerald-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">
                      Resets Monthly (10 referrals/mo)
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Earn $3 for a Friend's First Submission
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 border border-amber-500 font-sans text-xs font-black text-slate-950 shadow-xs">
                      $3
                    </div>
                  </div>
                  <div className="bg-emerald-500 h-20 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-8 rounded-full bg-emerald-200 border-2 border-slate-900 flex items-center justify-center shadow-sm">
                        <span className="font-black text-slate-900 text-sm">⬆</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── "Friends Get" Card ── */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4">
              <h3 className="text-center font-sans text-base font-extrabold text-slate-900 mb-3">
                Friends Get
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Sub-card 1: Sign Up for Points */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-rose-200 shadow-xs bg-white">
                  <div className="bg-rose-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight">
                      Welcome Bonus
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Sign Up for Points
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 border border-amber-500 font-sans text-xs font-black text-slate-950 shadow-xs">
                      ⭐
                    </div>
                  </div>
                  <div className="bg-rose-500 h-20 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-lg bg-amber-400 border-2 border-slate-900 p-1 flex items-center justify-center shadow-sm">
                      <span className="font-black text-rose-700 text-lg">?</span>
                    </div>
                  </div>
                </div>

                {/* Sub-card 2: Complete your first eligible submission */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-purple-200 shadow-xs bg-white">
                  <div className="bg-purple-50 p-2.5 text-center flex-1 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-tight">
                      Submission Reward
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900 my-1">
                      Complete your first eligible submission
                    </span>
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 border border-amber-500 font-sans text-xs font-black text-slate-950 shadow-xs">
                      $5
                    </div>
                  </div>
                  <div className="bg-purple-600 h-20 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-lg bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-sm">
                      <span className="font-black text-slate-950 text-base">✓</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* ── 4-Step Pipeline Flow Connector ── */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center text-center">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm mb-1.5 shadow-xs">
                  🔗
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">Copy Link</div>
                <div className="text-[10px] text-slate-500">Get Your Exclusive Invite Link</div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-sm mb-1.5 shadow-xs">
                  📢
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">Share with Friends</div>
                <div className="text-[10px] text-slate-500">Social Media / Email</div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-sm mb-1.5 shadow-xs">
                  👤
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">Friend Signs Up</div>
                <div className="text-[10px] text-slate-500">Both Get Rewards</div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-sm mb-1.5 shadow-xs">
                  ☁️
                </div>
                <div className="font-sans text-xs font-bold text-slate-900">Friend Uploads Model</div>
                <div className="text-[10px] text-slate-500">Both Get Bonus Rewards</div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Right Column: My Referrals & Milestones (4 cols) ── */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-sans text-base font-extrabold text-slate-900">
                My Referrals
              </h3>
              <button
                type="button"
                onClick={onOpenRules}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Details &gt;
              </button>
            </div>

            {/* 3 Metric Stats Row */}
            <div className="grid grid-cols-3 gap-2 py-5 text-center border-b border-slate-100">
              <div>
                <div className="font-sans text-xl font-black text-blue-600">0</div>
                <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                  Successfully Invited
                </div>
              </div>
              <div>
                <div className="font-sans text-xl font-black text-blue-600">$0</div>
                <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                  Cash Rewards
                </div>
              </div>
              <div>
                <div className="font-sans text-xl font-black text-blue-600">+0</div>
                <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                  Points Rewards
                </div>
              </div>
            </div>

            {/* Referral Milestone Rewards Vertical Timeline */}
            <div className="pt-5">
              <div className="font-sans text-xs font-bold text-slate-900 mb-3">
                Referral Milestone Rewards
              </div>

              <div className="space-y-3">
                {/* Milestone 1: 10 Friends */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                      ···
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-700 text-xs">
                      🪙
                    </div>
                    <div>
                      <div className="font-sans text-xs font-bold text-slate-800">
                        Get 10 Friends to Submit
                      </div>
                      <div className="text-[10px] text-slate-400">
                        10 More Friends to Unlock +$7
                      </div>
                    </div>
                  </div>
                  <div className="font-sans text-xs font-extrabold text-slate-900">
                    +$7
                  </div>
                </div>

                {/* Milestone 2: 5 Friends */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                      ···
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-700 text-xs">
                      🪙
                    </div>
                    <div>
                      <div className="font-sans text-xs font-bold text-slate-800">
                        Get 5 Friends to Submit
                      </div>
                      <div className="text-[10px] text-slate-400">
                        5 More Friends to Unlock +$5
                      </div>
                    </div>
                  </div>
                  <div className="font-sans text-xs font-extrabold text-slate-900">
                    +$5
                  </div>
                </div>

                {/* Milestone 3: 3 Friends */}
                <div className="flex items-center justify-between rounded-xl bg-amber-50/70 p-2.5 border border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      ···
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-200 text-amber-900 text-xs">
                      🪙
                    </div>
                    <div>
                      <div className="font-sans text-xs font-bold text-slate-900">
                        Get 3 Friends to Submit
                      </div>
                      <div className="text-[10px] text-amber-800">
                        3 More Friends to Unlock +$3
                      </div>
                    </div>
                  </div>
                  <div className="font-sans text-xs font-extrabold text-slate-950">
                    +$3
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Blue CTA Button */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-sans text-sm font-bold py-3 px-4 flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>✉</span>
              <span>{copied ? 'Link Copied to Clipboard!' : 'Invite Now'}</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
