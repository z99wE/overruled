import { useState } from 'react';
import type { Jurisdiction, ScenarioBundle } from '../types/legal';
import { StatutoryNotice } from './StatutoryNotice';
import { NewsFeed } from './NewsFeed';
import { RunPanel } from '../game/RunPanel';
import { bossForJurisdiction } from '../game/bosses';
import type { RunState } from '../game/runStore';

interface CaseSelectProps {
  scenarios: ScenarioBundle[];
  hasKey: boolean;
  run: RunState;
  caseOfDayId: string;
  onRunChange: (next: RunState) => void;
  onOpenShop: () => void;
  onOpenDuel: () => void;
  onOpenDesk: () => void;
  onSelect: (id: string) => void;
  onOpenKeys: () => void;
  onOpenAccount: () => void;
  accountEmail: string | null;
  onGenerate?: () => string | null;
  onOpenHowItWorks?: () => void;
}

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  CA: 'Canada',
  AU: 'Australia',
  ZA: 'South Africa',
  IN: 'India',
};

export function CaseSelect({
  scenarios,
  hasKey,
  run,
  caseOfDayId,
  onRunChange,
  onOpenShop,
  onOpenDuel,
  onOpenDesk,
  onSelect,
  onOpenKeys,
  onOpenAccount,
  accountEmail,
  onGenerate,
  onOpenHowItWorks,
}: CaseSelectProps) {
  const [genOpen, setGenOpen] = useState(false);
  const [generated, setGenerated] = useState<ScenarioBundle | null>(null);

  const handleGenerate = () => {
    const id = onGenerate?.();
    if (!id) return;
    const fresh = scenarios.find((s) => s.id === id) ?? null;
    setGenerated(fresh);
    setGenOpen(true);
  };

  return (
    <div className="felt-bg min-h-full flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-6 py-3.5 shadow-lg backdrop-blur-xl lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300 font-serif font-bold text-lg shadow-md">
            O
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white">
              Over<span className="text-amber-300">rool</span>
            </h1>
            <p className="font-sans text-[11px] text-slate-400">
              Courtroom Chambers · Active Dockets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            aria-label={accountEmail ? `Account for ${accountEmail}` : 'Sign up or log in to sync your progress'}
            type="button"
            onClick={onOpenAccount}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-3.5 py-1.5 font-mono text-xs text-slate-300 hover:border-amber-400/40 hover:text-white transition-colors"
          >
            {accountEmail ? accountEmail : 'Account Sync'}
          </button>

          <button
            aria-label="Open shop"
            type="button"
            onClick={onOpenShop}
            className="m3-btn m3-btn-primary px-4 py-1.5 text-xs font-semibold"
          >
            🪙 {run.chips} chips
          </button>

          <button
            aria-label="Open the Legal Desk to understand any legal document"
            type="button"
            onClick={onOpenDesk}
            className="m3-btn m3-btn-tonal px-4 py-1.5 text-xs text-slate-200"
          >
            Legal Desk
          </button>

          <button
            aria-label={hasKey ? 'Open key vault' : 'Open key vault to see key options'}
            type="button"
            onClick={onOpenKeys}
            className={`m3-btn px-4 py-1.5 text-xs ${
              hasKey ? 'm3-btn-emerald' : 'm3-btn-outlined text-slate-300'
            }`}
          >
            {hasKey ? 'Key Active' : 'Keyless (Local)'}
          </button>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-12 pt-6 lg:px-12">
        {/* Run / Score Stats Panel */}
        <div className="mb-6">
          <RunPanel run={run} onChange={onRunChange} onOpenShop={onOpenShop} />
        </div>

        {/* Global News Feed */}
        <div className="mb-6">
          <NewsFeed onNeedAccount={onOpenAccount} />
        </div>

        {/* Local Bench info banner */}
        {!hasKey && (
          <div className="mb-6 m3-card p-5 border-amber-400/30 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="m3-chip m3-chip-primary text-[8px]">Active Mode</span>
                <p className="font-display text-sm font-bold text-white">
                  Private Native Bench (Zero Key Required)
                </p>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                100% private and on-device: turns resolve instantly with verified precedent rules. Connect your personal Gemini, OpenAI, Claude, or Groq key for full multi-turn adversarial AI briefs.
              </p>
            </div>
            <button
              aria-label="Open the key vault"
              type="button"
              onClick={onOpenKeys}
              className="m3-btn m3-btn-primary shrink-0 px-4 py-2 text-xs"
            >
              Configure BYOK Vault
            </button>
          </div>
        )}

        {/* Matter Generator Panel */}
        {onGenerate && (
          <section className="mb-6 m3-card-elevated p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-amber-950/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="font-display text-base font-bold text-amber-200">
                    Procedural Matter Generator
                  </h2>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Generate unlimited dispute scenarios with novel fact patterns while testing against a verified deck of <strong className="text-white">real, certified precedent cards only</strong>.
                </p>
              </div>
              <button
                aria-label="Generate a new case"
                type="button"
                onClick={handleGenerate}
                className="m3-btn m3-btn-primary shrink-0 px-5 py-2.5 text-xs"
              >
                Generate New Matter
              </button>
            </div>
          </section>
        )}

        {/* Counsel Duel Section */}
        <section className="mb-8 m3-card-elevated p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-rose-950/25 border-rose-500/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="font-display text-base font-bold text-rose-200">
                  Counsel Duel — Pass &amp; Play Arena
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Two advocates, one device. Select real precedent cards in secret, pass the screen, and clash arguments in a best-of-five showdown.
              </p>
            </div>
            <button
              aria-label="Start a counsel duel"
              type="button"
              onClick={onOpenDuel}
              className="m3-btn m3-btn-tonal border-rose-400/30 text-rose-200 shrink-0 px-5 py-2.5 text-xs hover:border-rose-400"
            >
              Launch Duel Arena
            </button>
          </div>
        </section>

        {/* Case of the day notification */}
        {caseOfDayId && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-amber-400/30 bg-slate-950/80 px-4 py-2.5 backdrop-blur">
            <p className="font-sans text-xs text-amber-200">
              Case of the Day — Overcoming today's featured Bench grants <span className="font-semibold">+100 bonus chips</span>
            </p>
          </div>
        )}

        {/* ── Matter Cards Grid ──────────────────────────────────── */}
        <div className="grid gap-6 sm:grid-cols-2">
          {scenarios.map((s) => {
            const isGenerated = s.id.startsWith('generated-');
            const isBoss = !isGenerated;
            const boss = isBoss ? bossForJurisdiction(s.jurisdiction) : null;
            const scalped = isBoss && run.bossesDefeated.includes(`static-${s.id}`);
            const isCaseOfDay = `static-${s.id}` === caseOfDayId;

            return (
              <button
                aria-label={`Play ${s.title}`}
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className="m3-card-elevated group relative overflow-hidden p-6 text-left transition-all focus-visible:outline-none"
              >
                {/* Playing-card corner tags */}
                <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5">
                  <span className="m3-chip text-[9px]">
                    {s.jurisdiction}
                  </span>
                  <span className="m3-chip m3-chip-primary text-[9px]">
                    {s.bench.slice(0, 12)}
                  </span>
                </div>

                {isGenerated && (
                  <div className="pointer-events-none absolute left-0 top-0 rounded-br-xl border-b border-r border-amber-400/30 bg-amber-400/20 px-3 py-1 font-mono text-[9px] font-semibold text-amber-200">
                    Custom Matter
                  </div>
                )}
                {isBoss && (
                  <div className="pointer-events-none absolute left-0 top-0 rounded-br-xl border-b border-r border-rose-500/30 bg-rose-950/60 px-3 py-1 font-mono text-[9px] font-semibold text-rose-200">
                    Boss Bench
                  </div>
                )}

                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="m3-chip m3-chip-emerald text-[9px]">
                      {JURISDICTION_LABEL[s.jurisdiction] ?? 'Global'}
                    </span>
                    {isCaseOfDay && (
                      <span className="m3-chip m3-chip-primary text-[9px]">Daily Special</span>
                    )}
                    {scalped && (
                      <span className="m3-chip text-[9px] text-emerald-300">Victory ✓</span>
                    )}
                  </div>

                  {boss && (
                    <p className="font-mono text-[11px] text-rose-300">
                      Bench Justice: {boss.name} · Target {boss.target} pts · {boss.special}
                    </p>
                  )}

                  <h3 className="font-display text-xl font-bold leading-snug text-white group-hover:text-amber-200 transition-colors">
                    {s.title}
                  </h3>

                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
                    {s.coreDispute}
                  </p>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
                      <span>§ {s.maxTurns} turns</span>
                      <span>•</span>
                      <span>{s.availablePrecedents.length} precedents</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-amber-300 transition-transform group-hover:translate-x-1">
                      Enter Chamber ▸
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <StatutoryNotice />
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-8 text-center font-sans text-xs text-slate-400 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onOpenHowItWorks?.()}
          aria-label="How it works"
          className="mb-2 text-amber-300 underline decoration-dotted hover:text-white transition-colors"
        >
          View System Architecture ↺
        </button>
        <br />
        Offline Verified Corpus · Zero-Leak Local Privacy · {scenarios.length} Live Matters on Docket
      </footer>

      {/* ── Generated Case Modal ─────────────────────────────────── */}
      {genOpen && generated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="anim-slam w-full max-w-lg m3-card-elevated p-6 border-amber-400/40">
            <span className="m3-chip m3-chip-primary text-[9px]">
              Matter Seed: {generated.id.replace('generated-', '')}
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold text-white">
              {generated.title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              {generated.factualBackground}
            </p>
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/80 p-3.5 text-xs italic text-amber-200">
              <strong className="text-white not-italic">{generated.opposingCounselPersona.name} (Opposing Counsel):</strong> “{generated.opposingCounselPersona.initialOpeningStatement}”
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="font-mono text-[10px] text-slate-400">
                {generated.jurisdiction} · {generated.availablePrecedents.length} precedents · {generated.maxTurns} turns
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGenOpen(false)}
                  className="m3-btn m3-btn-outlined px-4 py-2 text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenOpen(false);
                    onSelect(generated.id);
                  }}
                  className="m3-btn m3-btn-primary px-5 py-2 text-xs"
                >
                  Enter Chamber ▸
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
