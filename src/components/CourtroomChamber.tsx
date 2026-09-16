import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  Gavel,
  KeyRound,
  Landmark,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import type { ScenarioBundle } from '../types/legal';
import type { CitationIndex } from '../core/searchIndex';
import { useTrial } from '../core/useTrial';
import { FavorMeter } from './FavorMeter';
import { PrecedentCard } from './PrecedentCard';
import { DocketExportModal } from './DocketExportModal';
import { notifyTap, notifyVerdict } from '../core/haptics';
import type { TurnRecord } from '../types/legal';

interface CourtroomChamberProps {
  scenario: ScenarioBundle;
  index: CitationIndex;
  onExit: () => void;
  onOpenKeys: () => void;
}

const VERDICT_STYLE: Record<TurnRecord['resolution']['bench_verdict_tag'], { label: string; cls: string; flash: string }> = {
  SUSTAINED: { label: 'SUSTAINED', cls: 'border-gold/50 bg-gold/10 text-gold', flash: 'bg-gold/90 text-noir-950' },
  OVERRULED: { label: 'OVERRULED', cls: 'border-crimson/50 bg-crimson/10 text-crimson', flash: 'bg-crimson text-cream' },
  BENCH_WARNING: { label: 'BENCH WARNING', cls: 'border-gold/40 bg-gold/5 text-gold', flash: 'bg-gold/80 text-noir-950' },
  NOTED_FOR_RECORD: { label: 'NOTED FOR RECORD', cls: 'border-noir-500 bg-noir-800/60 text-cream/80', flash: 'bg-noir-700 text-cream' },
};

function VerdictFlash({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center animate-[fadeIn_0.15s_ease-out]">
      <div className={`flex flex-col items-center gap-2 rounded-lg border border-cream/10 px-10 py-6 shadow-2xl backdrop-blur ${style.flash}`}>
        <Gavel className="h-10 w-10" />
        <span className="font-serif text-4xl font-bold tracking-widest">{style.label}</span>
        <span className="text-sm opacity-80">
          {record.resolution.judicial_favor_delta > 0
            ? `Judicial favor +${record.resolution.judicial_favor_delta}`
            : record.resolution.judicial_favor_delta < 0
              ? `Judicial favor ${record.resolution.judicial_favor_delta}`
              : 'Favor held at parity'}
        </span>
      </div>
    </div>
  );
}

function JudgeMessage({ text, meta }: { text: string; meta?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-noir-700 bg-noir-800 text-gold">
        <Gavel className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gold">Presiding Judge</p>
        {meta && <p className="mb-0.5 font-serif text-[11px] italic text-noir-500">{meta}</p>}
        <p className="rounded-lg border border-noir-700 bg-noir-900/70 p-3 text-[13px] leading-relaxed text-cream/85">
          {text}
        </p>
      </div>
    </div>
  );
}

function OpponentMessage({ from, text, style, attack }: { from: string; text: string; style: string; attack?: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <p className="text-right text-[10px] font-semibold uppercase tracking-widest text-crimson">{from}</p>
      <div className="max-w-[88%] rounded-lg border border-crimson/25 bg-crimson/5 p-3">
        <p className="text-[13px] leading-relaxed text-cream/80">{text}</p>
      </div>
      {attack && (
        <p className="max-w-[88%] rounded border border-noir-700 bg-noir-900/60 px-3 py-1.5 font-serif text-[11px] italic text-noir-500">
          Attack theme: {attack}
        </p>
      )}
      <span className="pr-1 text-[9px] uppercase tracking-widest text-noir-500">Style · {style.replace(/_/g, ' ')}</span>
    </div>
  );
}

function PlayerMessage({ text, verified, tag }: { text: string; verified: boolean; tag?: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%]">
        <p className="mb-1 text-right text-[10px] font-semibold uppercase tracking-widest text-gold">Counsel for {tag ?? 'your client'}</p>
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
          <p className="text-[13px] leading-relaxed text-cream/90">{text}</p>
          {verified && (
            <p className="mt-2 inline-flex items-center gap-1 rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold">
              <Landmark className="h-2.5 w-2.5" /> Citation verified in corpus
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CoCounselMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-noir-700 bg-noir-800 text-cream/60">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-cream/50">Co-Counsel · Tactical note</p>
        <p className="rounded-lg border border-noir-700 border-dashed bg-noir-900/40 p-3 text-[12px] italic leading-relaxed text-cream/60">
          {text}
        </p>
      </div>
    </div>
  );
}

function ResolutionBlock({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  const r = record.resolution;
  return (
    <div className="space-y-3 border-l-2 border-noir-700 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${style.cls}`}>
          {style.label}
        </span>
        <span className={`font-mono text-[10px] ${r.judicial_favor_delta > 0 ? 'text-gold' : r.judicial_favor_delta < 0 ? 'text-crimson' : 'text-noir-500'}`}>
          {r.judicial_favor_delta > 0 ? '+' : ''}{r.judicial_favor_delta} favor
        </span>
        {!r.citation_valid && (
          <span className="rounded border border-crimson/40 bg-crimson/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-crimson">
            Unverified citation flagged
          </span>
        )}
      </div>
      <JudgeMessage text={r.judge_dialogue} />
      <OpponentMessage from="Opposing Counsel" text={r.opposing_advocate_strike} style="adversarial" />
      <CoCounselMessage text={r.co_counsel_tactical_hint} />
    </div>
  );
}

export function CourtroomChamber({ scenario, index, onExit, onOpenKeys }: CourtroomChamberProps) {
  const { state, submitAction, advance, endTrial, restart, error, clearError } = useTrial(scenario, index);
  const [mode, setMode] = useState<'cards' | 'freeform'>('cards');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [motion, setMotion] = useState('');
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [fileOpen, setFileOpen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.phase === 'opening' && state.turn === 1 && state.history.length === 0) {
      setUsedCards(new Set());
      setSelectedCardId(null);
      setMotion('');
      setMode('cards');
    }
  }, [state.phase, state.turn, state.history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.last && state.phase === 'verdict') {
      void notifyVerdict(state.last.resolution.bench_verdict_tag, state.last.resolution.judicial_favor_delta);
    }
  }, [state.last?.rawModelOutput, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.history.length, state.phase, state.last?.rawModelOutput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.phase === 'verdict' && state.last) {
      const t = window.setTimeout(() => advance(), 2600);
      return () => window.clearTimeout(t);
    }
  }, [state.phase, state.last?.rawModelOutput, advance]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCard = useMemo(
    () => scenario.availablePrecedents.find((c) => c.id === selectedCardId),
    [scenario, selectedCardId],
  );

  const canSubmit = mode === 'cards'
    ? !!selectedCard && !usedCards.has(selectedCard.id)
    : motion.trim().length >= 12;

  const handleSubmittable = async () => {
    if (state.phase !== 'awaiting') return;
    const card = selectedCard;
    if (mode === 'cards' && card && usedCards.has(card.id)) return;
    let actionText: string;
    if (mode === 'cards' && card) {
      actionText = `Move: apply ${card.citation} — ${card.caseName}. ${card.ratioDecidendi} Ground: this client's facts fall directly within this ruling; statutory hooks ${card.statutoryProvisions.join(', ')}.`;
    } else {
      actionText = motion.trim();
    }
    const cardId = mode === 'cards' && card ? card.id : undefined;
    await submitAction({
      kind: cardId ? 'precedent_card' : 'freeform_motion',
      precedentCardId: cardId,
      freeformText: actionText,
      rawText: actionText,
    });
    if (cardId) setUsedCards((s) => new Set(s).add(cardId));
    setSelectedCardId(null);
    setMotion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSubmit) void handleSubmittable();
    }
  };

  const isFinalTurn = state.turn >= state.maxTurns;
  const verdictFlashVisible = state.phase === 'verdict' && !!state.last;

  return (
    <div className="flex h-full flex-col bg-noir-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-noir-800 bg-noir-950/95 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-noir-700 text-noir-500 transition-colors hover:border-cream/30 hover:text-cream"
              aria-label="Exit trial"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 shrink-0 text-gold" />
                <h1 className="truncate font-serif text-sm font-semibold text-cream/90">{scenario.title}</h1>
                <span className="hidden shrink-0 rounded border border-noir-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-noir-500 sm:inline">
                  Turn {state.turn}/{state.maxTurns}
                </span>
              </div>
              <p className="truncate text-[10px] text-noir-500">{scenario.bench}</p>
            </div>
          </div>
          <div className="w-40 shrink-0 sm:w-60 lg:w-72">
            <FavorMeter value={state.favor} delta={state.last?.resolution.judicial_favor_delta} compact />
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Facts + deck: desktop sidebar / mobile drawer */}
        <aside
          className={`${
            fileOpen ? 'block' : 'hidden'
          } min-h-0 flex-1 flex-col overflow-hidden border-r border-noir-800 bg-noir-900/40 lg:flex lg:w-[320px] lg:flex-none`}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-serif text-xs font-semibold uppercase tracking-widest text-gold">
                <FileText className="h-3.5 w-3.5" /> Case File
              </h2>
              <div className="space-y-3 text-[12px] leading-relaxed text-cream/75">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-noir-500">Client</p>
                  <p className="font-serif">{scenario.clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-noir-500">Facts</p>
                  <p>{scenario.factualBackground}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-noir-500">Core dispute</p>
                  <p className="font-serif">{scenario.coreDispute}</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-serif text-xs font-semibold uppercase tracking-widest text-gold">
                <BookOpen className="h-3.5 w-3.5" /> Your Precedent Deck
              </h2>
              <div className="grid gap-2">
                {scenario.availablePrecedents.map((c) => (
                  <PrecedentCard
                    key={c.id}
                    card={c}
                    selected={selectedCardId === c.id && mode === 'cards'}
                    exhausted={usedCards.has(c.id)}
                    disabled={state.phase !== 'awaiting' || usedCards.has(c.id)}
                    onSelect={() => {
                      void notifyTap();
                      setMode('cards');
                      setSelectedCardId((prev) => (prev === c.id ? null : c.id));
                    }}
                  />
                ))}
              </div>
            </section>

            {scenario.statuteReferences.length > 0 && (
              <section className="space-y-1.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-noir-500">Statutory anchors in this matter</h3>
                <ul className="space-y-1.5">
                  {scenario.statuteReferences.map((st) => (
                    <li key={st.id} className="rounded border border-noir-700 bg-noir-900/50 px-2.5 py-2">
                      <p className="font-serif text-[11px] font-medium text-cream/80">{st.citation}</p>
                      <p className="mt-1 font-mono text-[9px] text-gold/80">{st.sections.map((s) => s.section).join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>

        {/* Chamber transcript + input */}
        <section className="flex min-h-0 flex-1 flex-col">
          {error && (
            <div className="sticky top-0 z-30 mx-4 mt-3 flex items-start gap-3 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-crimson">
              <div className="flex-1 text-[12px] leading-relaxed">
                <strong>Argue failed:</strong> {error}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={onOpenKeys} className="inline-flex items-center gap-1 rounded border border-crimson/50 px-2 py-1 text-[10px] font-semibold hover:bg-crimson/15">
                  <KeyRound className="h-3 w-3" /> Key Vault
                </button>
                <button type="button" onClick={clearError} className="rounded border border-noir-600 px-2 py-1 text-[10px] hover:bg-noir-800">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => { void notifyTap(); setFileOpen((v) => !v); }}
            className="m-3 flex items-center justify-center gap-2 rounded-lg border border-noir-700 bg-noir-900 py-2 text-[11px] font-semibold uppercase tracking-wider text-gold lg:hidden"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${fileOpen ? 'rotate-180' : ''}`} />
            {fileOpen ? 'Close case file' : 'Open case file & precedent deck'}
          </button>

          <div ref={transcriptRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 lg:px-8">
            <OpponentMessage
              from={scenario.opposingCounselPersona.name ?? 'Opposing Senior Advocate'}
              text={scenario.opposingCounselPersona.initialOpeningStatement}
              style={scenario.opposingCounselPersona.style}
              attack={scenario.opposingCounselPersona.interlocutoryAttackTheme}
            />
            <JudgeMessage meta="Preliminary direction" text={`The Bench has taken up the matter. The record before us establishes standing; we shall hear ${scenario.clientName} on the core dispute. On the record so far, this Court is neutral as to the eventual disposition. Counsel, you have ${state.maxTurns} opportunities to move this Bench. Begin.`} />

            {state.history.map((rec) => (
              <PlayerMessage
                key={`p-${rec.turnNumber}`}
                text={rec.playerAction.rawText}
                verified={rec.resolution.citation_valid}
                tag={scenario.clientName}
              />
            ))}

            {state.phase !== 'verdict' ? (
              state.history.map((rec) => <ResolutionBlock key={`r-${rec.turnNumber}`} record={rec} />)
            ) : (
              state.last && (
                <div key={`r-live-${state.last.turnNumber}-${state.last.rawModelOutput.length}`} className="animate-[fadeIn_0.3s_ease-out]">
                  <ResolutionBlock record={state.last} />
                </div>
              )
            )}

            {state.phase === 'awaiting' && (
              <JudgeMessage
                meta={`Turn ${state.turn} of ${state.maxTurns}${isFinalTurn ? ' · final opportunity' : ''}`}
                text={`Counsel for ${scenario.clientName}, the Bench awaits your ${isFinalTurn ? 'final' : 'next'} submission. Cite your authority with precision, or file a motion on the record. What is your position?`}
              />
            )}

            {state.phase === 'resolving' && (
              <div className="flex items-center gap-3 py-6 text-gold">
                <Gavel className="h-5 w-5 animate-[pulse_1s_ease-in-out_infinite]" />
                <span className="font-serif text-sm italic text-cream/60">The Bench is deliberating…</span>
              </div>
            )}

            <div className="h-2" />
          </div>

          {/* Action bar */}
          <div className="sticky bottom-0 border-t border-noir-800 bg-noir-950/95 p-3 backdrop-blur lg:p-4">
            <div className="mx-auto max-w-3xl space-y-3">
              {state.phase === 'opening' || state.phase === 'awaiting' ? (
                <>
                  <div className="flex gap-1 rounded-lg border border-noir-700 bg-noir-900 p-1">
                    <button
                      type="button"
                      onClick={() => { void notifyTap(); setMode('cards'); }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                        mode === 'cards' ? 'bg-gold/15 text-gold' : 'text-noir-500 hover:text-cream'
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5" /> Precedent Card
                    </button>
                    <button
                      type="button"
                      onClick={() => { void notifyTap(); setMode('freeform'); }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                        mode === 'freeform' ? 'bg-gold/15 text-gold' : 'text-noir-500 hover:text-cream'
                      }`}
                    >
                      <MessageSquareQuote className="h-3.5 w-3.5" /> Freeform Motion
                    </button>
                  </div>

                  {mode === 'cards' ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {scenario.availablePrecedents.map((c) => (
                        <PrecedentCard
                          key={c.id}
                          card={c}
                          selected={selectedCardId === c.id}
                          exhausted={usedCards.has(c.id)}
                          disabled={usedCards.has(c.id)}
                          onSelect={() => {
                            void notifyTap();
                            setSelectedCardId((prev) => (prev === c.id ? null : c.id));
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={motion}
                      onChange={(e) => setMotion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Compose a motion for ${scenario.clientName}. Anchor it in statutes and case law already on record — e.g. "Section 4(1) FRA 2006 requires gram sabha consent..."`}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-noir-700 bg-noir-900 p-3 text-[13px] leading-relaxed text-cream/90 outline-none placeholder:text-noir-500 focus:border-gold/50"
                    />
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] text-noir-500">
                      {mode === 'freeform'
                        ? `${motion.trim().length} characters · cite a section or case precisely`
                        : 'Play one verified card per turn'}
                      {mode === 'freeform' && <span className="mx-1 text-noir-700">·</span>}
                      <kbd className="rounded border border-noir-700 bg-noir-900 px-1 py-0.5">⌘/Ctrl+Enter</kbd>
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSubmittable()}
                      disabled={!canSubmit}
                      className={[
                        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all',
                        canSubmit
                          ? 'bg-gold text-noir-950 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.5)] hover:brightness-110'
                          : 'cursor-not-allowed bg-noir-800 text-noir-500',
                      ].join(' ')}
                    >
                      {isFinalTurn ? 'Final Submission' : 'Address the Bench'} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : state.phase === 'verdict' && state.last ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-serif text-[12px] italic text-cream/60">
                    <Building2 className="h-4 w-4 text-gold" /> {state.turn >= state.maxTurns ? 'Final turn recorded.' : 'Advancing docket…'} The Court will promptly pass to the next submission.
                  </p>
                  <button
                    type="button"
                    onClick={advance}
                    className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/15"
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    type="button"
                    onClick={() => { void notifyTap(); restart(); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-noir-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream/70 hover:border-gold/40 hover:text-gold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry trial
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {verdictFlashVisible && state.last && <VerdictFlash record={state.last} />}
      {state.phase === 'docket' && state.summary && (
        <DocketExportModal
          scenario={scenario}
          onClose={endTrial}
          summary={state.summary}
          onRestart={restart}
        />
      )}
    </div>
  );
}