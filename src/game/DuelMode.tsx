import { useState } from 'react';
import type { PrecedentCard } from '../types/legal';
import { newDuel, remainingCards, resolveDuelRound, toOpponentCard, type DuelState, type DuelSide } from './duel';
import { CardTableCanvas } from './CardTableCanvas';
import { sfx } from './sfx';

type Phase = 'handoff' | 'pick' | 'reveal' | 'done';

const NAMES: Record<DuelSide, string> = { A: 'Counsel A', B: 'Counsel B' };

export function DuelMode({
  deck,
  onClose,
}: {
  deck: PrecedentCard[];
  onClose: () => void;
}) {
  const [state, setState] = useState<DuelState>(() => newDuel(deck, 5));
  const [phase, setPhase] = useState<Phase>('handoff');
  const [turn, setTurn] = useState<DuelSide>('A');
  const [pick, setPick] = useState<string | null>(null);
  const [hidden, setHidden] = useState(true);
  const [reveal, setReveal] = useState<{ winner: 'A' | 'B' | 'tie'; reason: string; aId: string; bId: string } | null>(null);

  const remaining = remainingCards(state);
  const majority = Math.floor(state.bestOf / 2) + 1;

  const startPicking = (side: DuelSide) => {
    setTurn(side);
    setPick(null);
    setHidden(true);
    setPhase('pick');
    sfx.deal();
  };

  const lockAndPass = () => {
    if (!pick) return;
    sfx.gavel();
    resolveBoth();
  };

  const [aPick, setAPick] = useState<string | null>(null);

  const lockA = (id: string) => {
    setAPick(id);
    setPick(id);
    sfx.tap();
    startPicking('B');
  };

  const resolveBoth = () => {
    if (!aPick || !pick) return;
    const { state: next, round } = resolveDuelRound(state, aPick, pick);
    setState(next);
    setReveal({ winner: round.winner, reason: round.reason, aId: aPick, bId: pick });
    setPhase('reveal');
    if (round.winner !== 'tie') sfx.chips();
  };

  const nextRound = () => {
    setReveal(null);
    setPick(null);
    setAPick(null);
    if (state.done || remaining.length < 2) setPhase('done');
    else setPhase('handoff');
  };

  const playerCard = reveal ? state.deck.find((c) => c.id === reveal.aId) ?? null : null;
  const opponentCard = reveal ? state.deck.find((c) => c.id === reveal.bId) ?? null : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300 font-serif text-sm font-bold">
              ⚔
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">Counsel Duel Arena</h2>
              <span className="font-mono text-xs text-slate-400">
                Score: {state.scoreA} — {state.scoreB} · First to {majority}
              </span>
            </div>
          </div>
          <button
            aria-label="Close duel"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white font-serif text-sm"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
          {/* Felt table */}
          <CardTableCanvas
            dealKey={`${state.history.length}-${reveal?.aId ?? 'none'}-${reveal?.bId ?? 'none'}`}
            playerCard={playerCard ? toOpponentCard(playerCard) : null}
            opponentCard={opponentCard ? toOpponentCard(opponentCard) : null}
            winner={reveal ? (reveal.winner === 'A' ? 'player' : reveal.winner === 'B' ? 'opponent' : 'none') : 'none'}
          />

          {phase === 'handoff' && (
            <div className="mt-6 space-y-4 text-center">
              <p className="font-mono text-xs text-slate-400">Round {state.round} · Pass the device</p>
              <button
                aria-label={`${NAMES.A}: take the deck`}
                type="button"
                onClick={() => startPicking('A')}
                className="m3-btn m3-btn-primary px-7 py-3 text-sm font-semibold"
              >
                {NAMES.A}: Take the Deck ▸
              </button>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Select in secret, lock, then pass the screen. Precedents clash on the table and the Bench rules on authority.
              </p>
            </div>
          )}

          {phase === 'pick' && (
            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-amber-200">
                  {NAMES[turn]} — Choose your Authority
                </p>
                <button
                  aria-label={hidden ? 'Show cards' : 'Hide cards'}
                  type="button"
                  onClick={() => setHidden((h) => !h)}
                  className="m3-btn m3-btn-tonal px-3 py-1 text-xs"
                >
                  {hidden ? 'Show 👁' : 'Hide ✕'}
                </button>
              </div>
              <p className="font-sans text-xs text-slate-400">
                {turn === 'B' && hidden ? 'Counsel B selecting — Counsel A, look away.' : 'Select the precedent that cuts deepest into the legal dispute.'}
              </p>
              <div className={`grid gap-3 sm:grid-cols-2 ${hidden ? 'blur-sm select-none' : ''}`}>
                {remaining.map((c) => (
                  <button
                    aria-label={`Pick ${c.caseName} for ${NAMES[turn]}`}
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (turn === 'A') lockA(c.id);
                      else {
                        setPick(c.id);
                        sfx.tap();
                      }
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      pick === c.id ? 'border-amber-400 bg-slate-850 ring-2 ring-amber-400/40' : 'border-white/10 bg-slate-950/70 hover:border-amber-400/40'
                    }`}
                  >
                    <p className="font-mono text-[10px] text-amber-300/80">{c.citation} · {c.year}</p>
                    <p className="truncate font-display text-sm font-bold text-white mt-0.5">{c.caseName}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">{c.ratioDecidendi}</p>
                  </button>
                ))}
              </div>
              {turn === 'B' && pick && (
                <button
                  aria-label="Lock selection and pass"
                  type="button"
                  onClick={lockAndPass}
                  className="m3-btn m3-btn-primary w-full py-3 text-sm font-bold"
                >
                  Lock &amp; Clash Arguments ▸
                </button>
              )}
            </div>
          )}

          {phase === 'reveal' && reveal && (
            <div className="mt-4 space-y-4 text-center">
              <p
                className={`font-display text-2xl font-bold ${reveal.winner === 'A' ? 'text-amber-300' : reveal.winner === 'B' ? 'text-rose-300' : 'text-slate-300'}`}
              >
                {reveal.winner === 'tie' ? 'Bench Splits Evenly' : `${NAMES[reveal.winner]} Takes the Round`}
              </p>
              <p className="mx-auto max-w-lg text-xs leading-relaxed text-slate-200">{reveal.reason}</p>
              <button
                aria-label={state.done ? 'See duel result' : 'Next round'}
                type="button"
                onClick={nextRound}
                className="m3-btn m3-btn-primary px-7 py-3 text-sm"
              >
                {state.done ? 'Review Result ▸' : 'Next Round ▸'}
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-6 space-y-4 text-center">
              <p className="font-display text-3xl font-bold text-amber-300">
                {state.scoreA === state.scoreB ? 'Dead Heat' : state.scoreA > state.scoreB ? 'Counsel A Victorious' : 'Counsel B Victorious'}
              </p>
              <p className="font-mono text-xs text-slate-400">
                Final Score {state.scoreA} — {state.scoreB} across {state.history.length} rounds
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  aria-label="Rematch"
                  type="button"
                  onClick={() => {
                    setState(newDuel(deck, 5));
                    setReveal(null);
                    setPick(null);
                    setAPick(null);
                    setPhase('handoff');
                    sfx.deal();
                  }}
                  className="m3-btn m3-btn-tonal px-5 py-2.5 text-xs text-white"
                >
                  Rematch ↺
                </button>
                <button
                  aria-label="Back to the table"
                  type="button"
                  onClick={onClose}
                  className="m3-btn m3-btn-primary px-5 py-2.5 text-xs"
                >
                  Return to Docket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
