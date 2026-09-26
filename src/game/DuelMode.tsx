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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 p-4 backdrop-blur-md selection:bg-blue-200 selection:text-slate-950 font-sans">
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm">
              O
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900">Counsel Duel Arena</h2>
              <span className="font-sans text-xs font-bold text-slate-500">
                Score: {state.scoreA} — {state.scoreB} · First to {majority} Wins
              </span>
            </div>
          </div>
          <button
            aria-label="Close duel"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
          {/* Table Canvas */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <CardTableCanvas
              dealKey={`${state.history.length}-${reveal?.aId ?? 'none'}-${reveal?.bId ?? 'none'}`}
              playerCard={playerCard ? toOpponentCard(playerCard) : null}
              opponentCard={opponentCard ? toOpponentCard(opponentCard) : null}
              winner={reveal ? (reveal.winner === 'A' ? 'player' : reveal.winner === 'B' ? 'opponent' : 'none') : 'none'}
            />
          </div>

          {phase === 'handoff' && (
            <div className="mt-6 space-y-4 text-center">
              <p className="font-mono text-xs font-bold text-slate-500">Round {state.round} · Pass the device to {NAMES.A}</p>
              <button
                aria-label={`${NAMES.A}: take the deck`}
                type="button"
                onClick={() => startPicking('A')}
                className="rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                {NAMES.A}: Take the Deck
              </button>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Select in secret, lock, then pass the screen. Precedents clash on the table and the Bench rules on ratio strength.
              </p>
            </div>
          )}

          {phase === 'pick' && (
            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-extrabold text-slate-900">
                  {NAMES[turn]} — Choose your Precedent Card
                </p>
                <button
                  aria-label={hidden ? 'Show cards' : 'Hide cards'}
                  type="button"
                  onClick={() => setHidden((h) => !h)}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {hidden ? 'Show Cards 👁' : 'Hide Cards ✕'}
                </button>
              </div>
              <p className="font-sans text-xs text-slate-500">
                {turn === 'B' && hidden ? 'Counsel B selecting — Counsel A, look away.' : 'Select the landmark precedent that cuts deepest into the legal dispute.'}
              </p>

              {!hidden && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
                  {remaining.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (turn === 'A') {
                          lockA(c.id);
                        } else {
                          setPick(c.id);
                          sfx.tap();
                        }
                      }}
                      className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                        pick === c.id
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-extrabold text-slate-900">{c.caseName}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                          {c.jurisdiction}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{c.ratioDecidendi}</p>
                    </button>
                  ))}
                </div>
              )}

              {turn === 'B' && pick && (
                <button
                  onClick={resolveBoth}
                  className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  Lock Precedent &amp; Clash Arguments ▸
                </button>
              )}
            </div>
          )}

          {phase === 'reveal' && reveal && (
            <div className="space-y-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
              <div className="font-display text-base font-extrabold text-slate-900">
                {reveal.winner === 'tie' ? 'Bench Split / Stalemate' : `${NAMES[reveal.winner]} Wins the Round!`}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                {reveal.reason}
              </p>
              <button
                onClick={nextRound}
                className="rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                {state.done ? 'View Final Verdict ▸' : 'Next Round ▸'}
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="space-y-4 text-center py-6">
              <div className="text-4xl">🏆</div>
              <h3 className="font-display text-xl font-extrabold text-slate-900">
                {state.scoreA > state.scoreB ? 'Counsel A Prevails on the Record!' : state.scoreB > state.scoreA ? 'Counsel B Prevails on the Record!' : 'Bench Deadlock!'}
              </h3>
              <p className="text-xs text-slate-500">
                Final Score: Counsel A ({state.scoreA}) — Counsel B ({state.scoreB})
              </p>
              <button
                onClick={onClose}
                className="rounded-full bg-slate-900 hover:bg-slate-800 px-8 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                Return to Chambers
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
