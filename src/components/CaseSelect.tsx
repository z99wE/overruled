import { useState } from 'react';
import type { Jurisdiction, ScenarioBundle } from '../types/legal';
import { StatutoryNotice } from './StatutoryNotice';
import { NewsFeed } from './NewsFeed';
import { RunPanel } from '../game/RunPanel';
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
    <div className="min-h-full grid-graph-light flex flex-col selection:bg-amber-300 selection:text-slate-950 font-sans text-slate-900">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 bg-white/95 px-6 py-3.5 shadow-xs backdrop-blur-md lg:px-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-bold text-lg shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            O
          </button>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900">
              Courtroom <span className="text-blue-600">Chambers</span>
            </h1>
            <p className="font-sans text-[11px] text-slate-500">
              Active Common Law Dockets · 59 Verified Precedents
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenHowItWorks && (
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 font-sans text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ← Overview
            </button>
          )}

          <button
            aria-label={accountEmail ? `Account for ${accountEmail}` : 'Sign up or log in to sync your progress'}
            type="button"
            onClick={onOpenAccount}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-mono text-xs text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
          >
            {accountEmail ? accountEmail : 'Account Sync'}
          </button>

          <button
            aria-label="Open shop"
            type="button"
            onClick={onOpenShop}
            className="rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            🪙 {run.chips} chips
          </button>

          <button
            aria-label="Open the Legal Desk to understand any legal document"
            type="button"
            onClick={onOpenDesk}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            Legal Desk
          </button>

          <button
            aria-label={hasKey ? 'Open key vault' : 'Open key vault to see key options'}
            type="button"
            onClick={onOpenKeys}
            className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-xs cursor-pointer transition-all ${
              hasKey
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {hasKey ? 'Key Active' : 'Keyless (Local)'}
          </button>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-6 lg:px-12">
        
        {/* Core Value Banner */}
        <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 font-bold text-[10px]">
                Adversarial AI Courtroom
              </span>
              <span className="text-xs text-slate-500">Zero Hallucinations Guarantee</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              Test your arguments against opposing counsel and strict judicial benches. Every citation in your hand is certified against official law reports across 7 jurisdictions.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenDuel}
              className="rounded-full bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              ⚔️ Pass & Play Duel
            </button>
            {onGenerate && (
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                + New Matter
              </button>
            )}
          </div>
        </div>

        {/* Run / Score Stats Panel */}
        <div className="mb-6">
          <RunPanel run={run} onChange={onRunChange} onOpenShop={onOpenShop} />
        </div>

        {/* Global News Feed */}
        <div className="mb-6">
          <NewsFeed onNeedAccount={onOpenAccount} />
        </div>

        {/* Case of the day notification */}
        {caseOfDayId && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-950">
              <span className="text-base">⭐</span>
              <span>Case of the Day — Overcoming today's featured Bench awards <strong className="text-amber-800">+100 bonus chips</strong></span>
            </div>
            <button
              type="button"
              onClick={() => onSelect(caseOfDayId)}
              className="rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-1 text-xs shadow-xs transition-all cursor-pointer"
            >
              Enter Trial →
            </button>
          </div>
        )}

        {/* ── Matter Cards Grid ──────────────────────────────────── */}
        <div className="grid gap-6 sm:grid-cols-2">
          {scenarios.map((s) => {
            const isGenerated = s.id.startsWith('generated-');
            const isBoss = !isGenerated;
            const scalped = isBoss && run.bossesDefeated.includes(`static-${s.id}`);
            const isCaseOfDay = `static-${s.id}` === caseOfDayId;

            return (
              <button
                aria-label={`Play ${s.title}`}
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-xs transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-md focus-visible:outline-none cursor-pointer"
              >
                {/* Playing-card corner tags */}
                <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 font-bold text-[9px] border border-slate-200">
                    {s.jurisdiction}
                  </span>
                  <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 font-bold text-[9px]">
                    {s.bench.slice(0, 14)}
                  </span>
                </div>

                {isGenerated && (
                  <div className="pointer-events-none absolute left-0 top-0 rounded-br-xl bg-amber-400 px-3 py-0.5 font-sans text-[9px] font-black text-slate-950">
                    Custom Matter
                  </div>
                )}
                {isBoss && (
                  <div className="pointer-events-none absolute left-0 top-0 rounded-br-xl bg-indigo-600 px-3 py-0.5 font-sans text-[9px] font-black text-white">
                    Landmark Matter
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {s.title}
                    </h3>
                    <p className="font-sans text-xs text-slate-500 font-medium">
                      {JURISDICTION_LABEL[s.jurisdiction] ?? s.jurisdiction} · {s.bench}
                    </p>
                  </div>

                  <p className="line-clamp-2 font-sans text-xs text-slate-600 leading-relaxed">
                    {s.coreDispute}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Target Favor:</span>
                      <span className="font-mono font-bold text-slate-900">70 Chips</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {scalped ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold text-[10px]">
                          ✓ Sustained
                        </span>
                      ) : isCaseOfDay ? (
                        <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 font-bold text-[10px]">
                          ⭐ +100 Chips
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 font-bold text-[10px]">
                          Enter Docket →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Generated Matter Modal */}
      {genOpen && generated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="rounded-full bg-amber-400 px-3 py-1 font-sans text-xs font-black text-slate-950">
                Fresh Matter Generated
              </span>
              <button
                type="button"
                onClick={() => setGenOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <h3 className="font-display text-xl font-extrabold text-slate-900">{generated.title}</h3>
              <p className="text-xs text-slate-500 font-bold">{JURISDICTION_LABEL[generated.jurisdiction]} · {generated.bench}</p>
              <p className="text-xs text-slate-700 leading-relaxed">{generated.coreDispute}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGenOpen(false)}
                className="rounded-full border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenOpen(false);
                  onSelect(generated.id);
                }}
                className="rounded-full bg-blue-600 px-6 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                Open Docket &amp; Spar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Notice */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <StatutoryNotice />
      </footer>
    </div>
  );
}
