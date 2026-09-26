import { useState } from 'react';
import type { PrecedentCard } from '../types/legal';
import { FloatingNavRail } from './FloatingNavRail';
import { HeroCreationStage } from './HeroCreationStage';
import { MilestoneTrack } from './MilestoneTrack';
import { LeaderboardPodium } from './LeaderboardPodium';
import { ReferralRewardsHub } from './ReferralRewardsHub';
import { CommunitySection } from './CommunitySection';
import { RulesModal, RaffleModal, EarningsModal } from './ArcadeModals';

interface LandingProps {
  cases: PrecedentCard[];
  onPlay: () => void;
  onOpenDesk: () => void;
  accountEmail: string | null;
  onOpenAccount: () => void;
}

const TICKER_CASES = [
  { hold: "A crested macaque cannot hold a copyright in the selfie it took.", cite: "Naruto v. Slater, 888 F.3d 418 (9th Cir. 2018)", tag: "United States" },
  { hold: "Landlord cannot evict pavement dwellers without procedural fairness and alternative shelter considerations.", cite: "Olga Tellis v. BMC (1985) 3 SCC 545", tag: "India" },
  { hold: "A manufacturer owes a duty of care to the consumer when there is no reasonable possibility of intermediate examination.", cite: "Donoghue v. Stevenson [1932] AC 562", tag: "United Kingdom" },
  { hold: "Personal data transfers across borders must ensure an essentially equivalent level of fundamental rights protection.", cite: "Schrems II (Case C-311/18)", tag: "European Union" },
];

function Ticker() {
  return (
    <div className="overflow-hidden border-y border-slate-200 bg-white py-2.5 shadow-xs" aria-label="Selected Legal Precedents">
      <div className="flex whitespace-nowrap font-mono text-[11px] text-slate-600 animate-[ticker_35s_linear_infinite]">
        {TICKER_CASES.concat(TICKER_CASES).map((c, i) => (
          <div key={i} className="mx-6 inline-flex items-center gap-3">
            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-bold text-[9px]">{c.tag}</span>
            <span className="text-slate-900 font-medium">{c.hold}</span>
            <span className="text-amber-600 font-bold">— {c.cite}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Landing({ cases: _cases, onPlay, onOpenDesk, accountEmail, onOpenAccount }: LandingProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [raffleOpen, setRaffleOpen] = useState(false);
  const [earningsOpen, setEarningsOpen] = useState(false);
  const [submissionsCount, setSubmissionsCount] = useState(3);

  const handleClaimCreationChest = () => {
    setSubmissionsCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-full grid-graph-light text-slate-900 selection:bg-amber-300 selection:text-slate-950 font-sans">
      
      {/* ── Fixed Floating Right-Rail Navigation ── */}
      <FloatingNavRail
        onOpenInvite={() => scrollTo('referrals')}
        onOpenLeaderboard={() => scrollTo('leaderboard')}
        onOpenRaffle={() => setRaffleOpen(true)}
        onOpenEarnings={() => setEarningsOpen(true)}
        onOpenRules={() => setRulesOpen(true)}
      />

      {/* ── Top Navigation Bar ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200/90 bg-white/90 px-6 py-3.5 shadow-xs backdrop-blur-md lg:px-12">
        <button
          aria-label="Back to top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-2.5 text-left cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-sm font-sans text-lg font-black transition-transform group-hover:scale-105">
            O
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
            Over<span className="text-blue-600">rool</span>
          </span>
        </button>

        <div className="hidden items-center gap-7 md:flex text-xs font-bold text-slate-600">
          <button type="button" onClick={() => scrollTo('milestones')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Milestones & Chests
          </button>
          <button type="button" onClick={() => scrollTo('leaderboard')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Leaderboard
          </button>
          <button type="button" onClick={() => scrollTo('referrals')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Referral Rewards
          </button>
          <button type="button" onClick={() => scrollTo('community')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Community Hub
          </button>
          <button type="button" onClick={onOpenDesk} className="hover:text-blue-600 transition-colors cursor-pointer">
            Legal Desk
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label={accountEmail ? `Signed in as ${accountEmail}` : 'Sign in or sync account'}
            type="button"
            onClick={onOpenAccount}
            className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
          >
            {accountEmail ? accountEmail : 'Account Sync'}
          </button>
          
          <button
            aria-label="Enter the Courtroom Chamber"
            type="button"
            onClick={onPlay}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 font-sans text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            Enter Courtroom
          </button>

          <button
            aria-label="Open the Legal Desk and review a document"
            type="button"
            onClick={onOpenDesk}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2 font-sans text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            Review Document
          </button>
        </div>
      </nav>

      {/* ── Ticker Bar ── */}
      <Ticker />

      {/* ── Screenshot 1: Hero & Creator Fund Banner ($1,000,000 + 3D Table Stage) ── */}
      <HeroCreationStage
        onClaimChest={handleClaimCreationChest}
        onOpenRules={() => setRulesOpen(true)}
      />

      {/* ── Screenshot 2: Monthly Milestone Progress & 6 Chest Tiers ── */}
      <section id="milestones">
        <MilestoneTrack
          currentSubmissions={submissionsCount}
          onOpenRules={() => setRulesOpen(true)}
          onClaimChestTier={(tier) => {
            alert(`🎉 Congratulations! You unlocked the ${tier}!`);
          }}
        />
      </section>

      {/* ── Screenshot 3: Leaderboard Top 1 / Top 2 / Top 3 Podium ── */}
      <LeaderboardPodium
        onOpenRules={() => setRulesOpen(true)}
        onInspectEntry={(_rank) => {
          onPlay();
        }}
      />

      {/* ── Screenshot 4: Referral Rewards & Milestone Hub ── */}
      <ReferralRewardsHub
        onOpenRules={() => setRulesOpen(true)}
        accountEmail={accountEmail}
      />

      {/* ── Screenshot 5: 8-Bit Platformer Community Section ── */}
      <div id="community">
        <CommunitySection onOpenRules={() => setRulesOpen(true)} />
      </div>

      {/* ── Legal Desk & Deep Discovery Section ── */}
      <section id="desk-section" className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-[11px] font-bold text-blue-600">
                Ground-Truth Legal Document Engine
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Read any contract. Audit hidden risks in plain language.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upload contracts, leases, NDAs, or court transcripts. Our zero-cloud private analysis engine translates clauses, audits indemnities and termination traps, and answers questions grounded strictly in your document.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenDesk}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-3 font-sans text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  Launch Legal Desk — Free
                </button>
                <button
                  type="button"
                  onClick={onPlay}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-3 font-sans text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  Play Precedent Trial
                </button>
              </div>
            </div>

            <div className="md:col-span-5 rounded-2xl bg-slate-900 p-6 text-white border-2 border-slate-800 shadow-inner space-y-3">
              <div className="font-mono text-xs font-bold text-amber-300">
                ⚡ Real-time Audit Capabilities
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Unilateral amendment trap detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Penalty clause vs liquidated damages audit</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Multi-version redline comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>59 verified common law precedents</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-400 font-bold text-slate-950 text-xs">
              O
            </div>
            <span className="font-bold text-slate-800">Overrool Jurisprudence & Creator Fund</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <button type="button" onClick={() => setRulesOpen(true)} className="hover:text-blue-600 cursor-pointer">
              Event Rules
            </button>
            <button type="button" onClick={() => setEarningsOpen(true)} className="hover:text-blue-600 cursor-pointer">
              My Wallet
            </button>
            <button type="button" onClick={onOpenDesk} className="hover:text-blue-600 cursor-pointer">
              Legal Desk
            </button>
          </div>
        </div>
      </footer>

      {/* ── Interactive Modals ── */}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {raffleOpen && <RaffleModal onClose={() => setRaffleOpen(false)} />}
      {earningsOpen && <EarningsModal onClose={() => setEarningsOpen(false)} />}
    </div>
  );
}