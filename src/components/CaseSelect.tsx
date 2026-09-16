import { ArrowRight, KeyRound, Landmark, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import type { ScenarioBundle } from '../types/legal';
import { StatutoryNotice } from './StatutoryNotice';

interface CaseSelectProps {
  scenarios: ScenarioBundle[];
  hasKey: boolean;
  onSelect: (id: string) => void;
  onOpenKeys: () => void;
}

const DOMAIN_TAG: Record<string, string> = {
  Environmental: 'MAX',
  Constitutional: '⚖',
  Digital_Rights: 'NET',
  Labor: 'WORK',
  Tenancy: 'HOME',
};

export function CaseSelect({ scenarios, hasKey, onSelect, onOpenKeys }: CaseSelectProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-noir-800 bg-noir-950/90 px-5 py-5 backdrop-blur lg:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 font-serif text-2xl font-bold text-gold">
              §
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight text-cream">Overrool</h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-noir-500">Adversarial Legal Strategy Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasKey ? (
              <span className="hidden items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold sm:inline-flex">
                <ShieldCheck className="h-3 w-3" /> BYOK armed
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenKeys}
                className="inline-flex items-center gap-1.5 rounded-full border border-crimson/50 bg-crimson/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-crimson hover:bg-crimson/20"
              >
                <KeyRound className="h-3 w-3" /> Arm Key Vault
              </button>
            )}
            <button
              type="button"
              onClick={onOpenKeys}
              className="inline-flex items-center gap-1.5 rounded-lg border border-noir-700 px-3 py-1.5 text-[11px] font-semibold text-cream/70 hover:border-gold/40 hover:text-gold"
            >
              <KeyRound className="h-3.5 w-3.5" /> Key Vault
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 lg:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
            <Landmark className="h-4 w-4" /> The Public Record — four live matters
          </p>
          <h2 className="font-serif text-2xl font-bold leading-snug text-cream lg:text-3xl">
            Defend a real Indian dispute before a hostile Bench.
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-noir-500">
            Play verified Precedent Cards or run freeform motions. The Judge, the Opposing Advocate and your Co-Counsel are
            resolved in a single deterministic pass — then everything is exported as an Advocate Consultation Docket.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className="group relative overflow-hidden rounded-xl border border-noir-700 bg-noir-900/60 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_16px_40px_-16px_rgba(245,158,11,0.25)]"
            >
              <div className="border-b border-noir-800 px-5 pb-4 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-noir-500">Matter No. 0{i + 1}</span>
                  {s.availablePrecedents[0] && (
                    <span className="rounded border border-noir-700 bg-noir-800/60 px-2 py-0.5 font-mono text-[9px] text-gold">
                      {DOMAIN_TAG[s.availablePrecedents[0].domain] ?? s.availablePrecedents[0].domain.toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-bold leading-snug text-cream group-hover:text-gold">{s.title}</h3>
                <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-noir-500">{s.coreDispute}</p>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-noir-500">
                  <span className="flex items-center gap-1"><Scale className="h-3 w-3 text-gold/70" /> {s.maxTurns} turns</span>
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-gold/70" /> {s.availablePrecedents.length} precedents</span>
                  <span className="flex items-center gap-1">{s.opposingCounselPersona.style.replace(/_/g, ' ')}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gold opacity-0 transition-opacity group-hover:opacity-100">
                  Enter <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <StatutoryNotice />
      </main>

      <footer className="border-t border-noir-800 px-5 py-4 text-center text-[10px] text-noir-500 lg:px-10">
        Offline-first corpus · client-side citation verification · zero-knowledge BYOK · {scenarios.length} scenarios on record
      </footer>
    </div>
  );
}