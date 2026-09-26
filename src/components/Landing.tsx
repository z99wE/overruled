import { useState } from 'react';
import type { PrecedentCard } from '../types/legal';
import { FloatingNavRail } from './FloatingNavRail';
import { HeroCreationStage } from './HeroCreationStage';
import { MilestoneTrack } from './MilestoneTrack';
import { LeaderboardPodium } from './LeaderboardPodium';
import { ReferralRewardsHub } from './ReferralRewardsHub';
import { CommunitySection } from './CommunitySection';
import { RulesModal, RaffleModal, EarningsModal, PrivacyModal } from './ArcadeModals';

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
  { hold: "Remoteness of damage in contract is governed by contemplation of the parties at time of contract formation.", cite: "Hadley v. Baxendale (1854) 9 Exch 341", tag: "United Kingdom" },
];

function Ticker() {
  return (
    <div className="overflow-hidden border-y border-slate-200/90 bg-white/90 py-2.5 shadow-2xs backdrop-blur-md" aria-label="Selected Legal Precedents">
      <div className="flex whitespace-nowrap font-mono text-[11px] text-slate-600 animate-[ticker_35s_linear_infinite]">
        {TICKER_CASES.concat(TICKER_CASES).map((c, i) => (
          <div key={i} className="mx-6 inline-flex items-center gap-3">
            <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 font-bold text-[9px]">{c.tag}</span>
            <span className="text-slate-900 font-medium">{c.hold}</span>
            <span className="text-amber-700 font-bold">— {c.cite}</span>
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
  const [privacyOpen, setPrivacyOpen] = useState(false);
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

      {/* ── Transparent Liquid Glassmorphism Navbar ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/60 bg-white/75 px-6 py-3.5 shadow-xs backdrop-blur-xl lg:px-12">
        <button
          aria-label="Back to top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-2 text-left cursor-pointer"
        >
          <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 group-hover:opacity-90 transition-opacity">
            Over<span className="text-blue-600">rool</span>
          </span>
        </button>

        <div className="hidden items-center gap-7 md:flex text-xs font-bold text-slate-600">
          <button type="button" onClick={() => scrollTo('milestones')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Audit Track
          </button>
          <button type="button" onClick={() => scrollTo('leaderboard')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Precedent Bench
          </button>
          <button type="button" onClick={() => scrollTo('referrals')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Workbench
          </button>
          <button type="button" onClick={() => scrollTo('community')} className="hover:text-blue-600 transition-colors cursor-pointer">
            Privacy Architecture
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
            className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 font-mono text-xs text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
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

      {/* ── Hero Stage ── */}
      <HeroCreationStage
        onClaimChest={handleClaimCreationChest}
        onOpenRules={() => setRulesOpen(true)}
        onOpenDesk={onOpenDesk}
      />

      {/* ── Contract Defense & Risk Audit Framework (6 Tiers) ── */}
      <section id="milestones">
        <MilestoneTrack
          currentSubmissions={submissionsCount}
          onOpenRules={() => setRulesOpen(true)}
          onClaimChestTier={(_tier) => {
            if (onOpenDesk) onOpenDesk();
          }}
          onOpenDesk={onOpenDesk}
        />
      </section>

      {/* ── Landmark Precedent Bench & Top Rulings ── */}
      <LeaderboardPodium
        onOpenRules={() => setRulesOpen(true)}
        onInspectEntry={(_rank) => {
          onPlay();
        }}
        onOpenDesk={onOpenDesk}
      />

      {/* ── Forensic Contract Intelligence Workbench Section ── */}
      <ReferralRewardsHub
        onOpenRules={() => setRulesOpen(true)}
        accountEmail={accountEmail}
        onOpenDesk={onOpenDesk}
      />

      {/* ── Client-Side Privacy Architecture ── */}
      <div id="community">
        <CommunitySection
          onOpenRules={() => setRulesOpen(true)}
          onOpenDesk={onOpenDesk}
        />
      </div>

      {/* ── Legal Desk & Deep Discovery Section ── */}
      <section id="desk-section" className="mx-auto w-full max-w-6xl px-4 py-16 font-sans">
        <div className="rounded-3xl bg-white/90 border border-slate-200/90 p-8 shadow-xs backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-[11px] font-bold text-blue-700">
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
                  Launch Legal Desk
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

            <div className="md:col-span-5 rounded-3xl bg-slate-50/80 p-6 text-slate-900 border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="font-mono text-xs font-bold text-blue-700">
                Real-Time Audit Capabilities
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>Unilateral amendment trap detection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>Penalty clause vs liquidated damages audit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>Multi-version redline comparison</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>59 verified common law precedents</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/90 bg-white/90 py-12 px-6 text-center text-xs text-slate-500 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-400 font-black text-slate-950 text-xs">
              O
            </div>
            <span className="font-bold text-slate-800">Overrool Jurisprudence &amp; Contract Intelligence</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <button type="button" onClick={() => setRulesOpen(true)} className="hover:text-blue-600 cursor-pointer">
              Audit Standards
            </button>
            <button type="button" onClick={() => setEarningsOpen(true)} className="hover:text-blue-600 cursor-pointer">
              Counsel Dockets
            </button>
            <button type="button" onClick={() => setPrivacyOpen(true)} className="hover:text-blue-600 cursor-pointer">
              Privacy &amp; Legal
            </button>
            <button type="button" onClick={onOpenDesk} className="hover:text-blue-600 cursor-pointer">
              Legal Desk
            </button>
          </div>
        </div>
      </footer>

      {/* ── Pop-Up Modals ── */}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {raffleOpen && <RaffleModal onClose={() => setRaffleOpen(false)} />}
      {earningsOpen && <EarningsModal onClose={() => setEarningsOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}