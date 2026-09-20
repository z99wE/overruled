import { ArrowRight, CalendarDays, KeyRound, Scale, ShieldCheck, Sparkles, Wand2, Dices, Layers, Skull, ShoppingBag, Swords } from 'lucide-react';
import { useState } from 'react';
import type { Jurisdiction, ScenarioBundle } from '../types/legal';
import { StatutoryNotice } from './StatutoryNotice';
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

export function CaseSelect({ scenarios, hasKey, run, caseOfDayId, onRunChange, onOpenShop, onOpenDuel, onSelect, onOpenKeys, onOpenAccount, accountEmail, onGenerate, onOpenHowItWorks }: CaseSelectProps) {
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
    <div className="felt-bg flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-6 lg:px-10">
        <div className="flex items-baseline gap-2">
          <h1
            className="font-display text-4xl text-cream lg:text-5xl"
            style={{ textShadow: '0 4px 0 var(--color-poker-red-deep), 0 6px 0 var(--color-ink)' }}
          >
            OVERROOL
          </h1>
          <span className="anim-float hidden rounded-full border-2 border-ink bg-chip-gold px-2 py-0.5 font-display text-[10px] text-ink shadow-[0_3px_0_0_var(--color-ink)] sm:inline-block">
            ANTE · LAW
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={accountEmail ? `Account for ${accountEmail}` : 'Sign up or log in to sync your progress'}
            type="button"
            onClick={onOpenAccount}
            className="hidden items-center gap-1.5 rounded-lg border border-cream/25 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-cream/70 transition hover:border-chip-gold/50 hover:text-chip-gold sm:inline-flex"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> {accountEmail ? accountEmail : 'Sign up'}
          </button>
          <button
          aria-label="Open shop"
            type="button"
            onClick={onOpenShop}

            className="btn-3d inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-chip-gold px-3 py-2 font-display text-[11px] uppercase tracking-wider text-ink"
          >
            <ShoppingBag className="h-4 w-4" /> 🪙 {run.chips}
          </button>
          <button
          aria-label={hasKey ? 'Open key vault' : 'Open key vault to arm your key'}
            type="button"
            onClick={onOpenKeys}

            className={`btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink px-3 py-2 font-display text-[11px] uppercase tracking-wider ${
              hasKey ? 'bg-felt-600 text-cream' : 'bg-poker-red text-cream anim-float'
            }`}
          >
            {hasKey ? <ShieldCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            {hasKey ? 'Key Armed' : 'Arm Your Key'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-10 pt-4 lg:px-10">
        <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-cream/85">
          Real judgments. Seven legal systems. One hostile bench.
          Play verified precedent cards or file freeform motions — an opposing-counsel agent reads your
          deck and strikes back every turn, and the record ships out as a consultation docket.
        </p>

        <div className="mb-6">
          <RunPanel run={run} onChange={onRunChange} />
        </div>

        {!hasKey && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-poker-red-deep/40 p-4">
            <div>
              <p className="font-display text-sm uppercase tracking-wider text-cream">
                The bench is ready. Your key is not.
              </p>
              <p className="mt-0.5 text-[12px] text-cream/70">
                Overrool is BYOK: bring one API key (Gemini, OpenAI, Anthropic or Groq). It is kept
                on this device in browser storage — not encrypted — and is sent nowhere but the provider.
              </p>
            </div>
            <button
          aria-label="Open the key vault"
              type="button"
              onClick={onOpenKeys}

              className="btn-3d inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-ink bg-chip-gold px-4 py-2 font-display text-xs uppercase tracking-wider text-ink"
            >
              <KeyRound className="h-4 w-4" /> Open the Key Vault
            </button>
          </div>
        )}

        {onGenerate && (
          <section className="mb-8 rounded-2xl border-2 border-ink bg-felt-800 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-xl">
                <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-chip-gold">
                  <Wand2 className="h-5 w-5" /> Deal Me a Fresh Matter
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-cream/75">
                  Generate an endless supply of new cases: fictional parties, fresh fact patterns, but a
                  deck of <span className="text-cream">real, citable precedent cards only</span> — drawn from the
                  same verified corpus the bench enforces.
                </p>
              </div>
              <button
          aria-label="Generate a new case"
                type="button"
                onClick={handleGenerate}

                className="btn-3d inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-ink bg-poker-red px-5 py-3 font-display text-sm uppercase tracking-wider text-cream"
              >
                <Dices className="h-4 w-4" /> Generate Case
              </button>
            </div>
          </section>
        )}

        <section className="mb-8 rounded-2xl border-2 border-ink bg-poker-red-deep/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-chip-gold">
                <Swords className="h-5 w-5" /> Counsel Duel — pass &amp; play
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-cream/75">
                Two lawyers, one device. Pick real cases in secret, hand the phone over, and let the
                cards collide on the felt. Best of five — the bench explains every verdict.
              </p>
            </div>
            <button
          aria-label="Start a counsel duel"
              type="button"
              onClick={onOpenDuel}

              className="btn-3d inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-ink bg-poker-red px-5 py-3 font-display text-sm uppercase tracking-wider text-cream"
            >
              <Swords className="h-4 w-4" /> Start a Duel
            </button>
          </div>
        </section>

        {caseOfDayId && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border-2 border-ink bg-ink/30 px-4 py-2.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-chip-gold" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-cream/70">
              Case of the day — a fresh boss scalp pays +100 chips
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {scenarios.map((s, i) => {
            const isGenerated = s.id.startsWith('generated-');
            const isBoss = !isGenerated;
            const boss = isBoss ? bossForJurisdiction(s.jurisdiction) : null;
            const scalped = isBoss && run.bossesDefeated.includes(`static-${s.id}`);
            const isCaseOfDay = `static-${s.id}` === caseOfDayId;
            return (
              <button
          aria-label={`Play ${s.title}
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
`}
                className="card-3d group relative overflow-hidden rounded-2xl border-2 border-ink bg-felt-800 text-left"
              >
                {isGenerated && (
                  <div className="pointer-events-none absolute right-0 top-0 h-0 w-0 border-l-[46px] border-t-[46px] border-l-transparent border-t-chip-gold">
                    <Sparkles className="absolute -right-[44px] top-[6px] h-3.5 w-3.5 text-ink" />
                  </div>
                )}
                {isBoss && (
                  <div className="pointer-events-none absolute left-0 top-0 h-0 w-0 border-r-[46px] border-t-[46px] border-r-transparent border-t-poker-red">
                    <Skull className="absolute -left-[44px] top-[6px] h-3.5 w-3.5 text-cream" />
                  </div>
                )}
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded border-2 border-ink bg-poker-red px-2 py-0.5 font-display text-[10px] tracking-wider text-cream">
                      {JURISDICTION_LABEL[s.jurisdiction] ?? 'GLOBAL'}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-cream/40">
                      {isCaseOfDay && <span className="rounded bg-chip-gold px-1 py-0.5 font-display text-[8px] uppercase text-ink">Today</span>}
                      {scalped && <span className="rounded bg-felt-600 px-1 py-0.5 font-display text-[8px] uppercase text-cream">Scalped ✓</span>}
                      {isGenerated ? `seed ${s.id.replace('generated-', '')}` : `#${String(i + 1).padStart(2, '0')}`}
                    </span>
                  </div>
                  {boss && (
                    <p className="font-mono text-[10px] uppercase tracking-wider text-poker-red/90">
                      ☠ {boss.name} · {boss.target} chips · {boss.special}
                    </p>
                  )}
                  <h3
                    className="font-display text-xl leading-tight text-cream group-hover:text-chip-gold"
                    style={{ textShadow: '2px 2px 0 var(--color-ink)' }}
                  >
                    {s.title}
                  </h3>
                  <p className="line-clamp-3 text-[13px] leading-relaxed text-cream/70">{s.coreDispute}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-cream/60">
                      <span className="inline-flex items-center gap-1">
                        <Scale className="h-3 w-3 text-chip-gold" /> {s.maxTurns} turns
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3 text-chip-gold" /> {s.availablePrecedents.length} cards
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-display text-[11px] tracking-wider text-chip-gold opacity-0 transition-opacity group-hover:opacity-100">
                      PLAY <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <StatutoryNotice />
      </main>

      <footer className="px-5 pb-5 text-center font-mono text-[10px] text-cream/35 lg:px-10">
        <button type="button" onClick={() => onOpenHowItWorks?.()} aria-label="How it works" className="mb-2 font-mono text-[10px] uppercase tracking-widest text-cream/60 underline decoration-dotted transition hover:text-cream">
          How it works ↺
        </button>
        <br />
        offline corpus · client-side citation verification · keys never leave this device · {scenarios.length} matters on the table
      </footer>

      {genOpen && generated && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4">
          <div className="anim-slam w-full max-w-md rounded-2xl border-2 border-ink bg-felt-800 p-6 shadow-[0_10px_0_0_var(--color-ink)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50">
              Matter dealt · seed {generated.id.replace('generated-', '')}
            </p>
            <h3 className="mt-1 font-display text-2xl leading-tight text-cream" style={{ textShadow: '2px 2px 0 var(--color-ink)' }}>
              {generated.title}
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-cream/75">{generated.factualBackground}</p>
            <p className="mt-3 rounded-lg border-2 border-dashed border-cream/30 bg-ink/30 p-3 text-[12px] italic text-cream/70">
              {generated.opposingCounselPersona.name} opens for the other side: “{generated.opposingCounselPersona.initialOpeningStatement}”
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] text-cream/50">
                {generated.jurisdiction} · {generated.availablePrecedents.length} real precedent cards · {generated.maxTurns} turns
              </p>
              <div className="flex gap-2">
                <button
          aria-label="Keep generated case on the table"
                  type="button"
                  onClick={() => setGenOpen(false)}

                  className="btn-3d rounded-lg border-2 border-ink bg-felt-700 px-3 py-2 font-display text-[11px] uppercase text-cream"
                >
                  Keep on table
                </button>
                <button
          aria-label="Enter the chamber with this case"
                  type="button"
                  onClick={() => {
                    setGenOpen(false);
                    onSelect(generated.id);
                  }}

                  className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-chip-gold px-3 py-2 font-display text-[11px] uppercase text-ink"
                >
                  Enter the chamber <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
