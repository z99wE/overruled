import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Hand, RotateCcw, Swords, X } from 'lucide-react';
import type { PrecedentCard } from '../types/legal';
import { newDuel, remainingCards, resolveDuelRound, toOpponentCard, type DuelState, type DuelSide } from './duel';
import { CardTableCanvas } from './CardTableCanvas';
import { sfx } from './sfx';

type Phase = 'handoff' | 'pick' | 'reveal' | 'done';

/**
 * PASS-AND-PLAY DUEL — two lawyers, one device.
 *
 * Phase flow per round:
 *   handoff → the phone is handed to player X ("pass the device")
 *   pick    → X secretly picks a card, then taps "Lock & Pass"
 *   reveal  → both cards hit the felt; the pure judge explains the outcome
 *   done    → majority reached; rematch or exit
 */

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
    // Both locked — the cards collide on the felt.
    sfx.gavel();
    resolveBoth();
  };

  // A's pick rides in state between handoffs via a ref-like slot.
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
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/80 p-3 backdrop-blur-sm">
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-2xl border-2 border-ink bg-felt-900 shadow-[0_8px_0_0_var(--color-ink)]">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-chip-gold" />
            <h2 className="font-display text-sm uppercase tracking-widest text-chip-gold">Counsel Duel</h2>
            <span className="font-mono text-[10px] text-cream/50">
              {state.scoreA} — {state.scoreB} · first to {majority}
            </span>
          </div>
          <button
          aria-label="Close duel"
            type="button"
            onClick={onClose}
            className="btn-3d flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-felt-800 text-cream"

          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {/* Felt table */}
          <CardTableCanvas
            dealKey={`${state.history.length}-${reveal?.aId ?? 'none'}-${reveal?.bId ?? 'none'}`}
            playerCard={playerCard ? toOpponentCard(playerCard) : null}
            opponentCard={opponentCard ? toOpponentCard(opponentCard) : null}
            winner={reveal ? (reveal.winner === 'A' ? 'player' : reveal.winner === 'B' ? 'opponent' : 'none') : 'none'}
          />

          {phase === 'handoff' && (
            <div className="mt-4 space-y-3 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50">Round {state.round} · pass the device</p>
              <button
                aria-label={`${NAMES.A}: take the deck`}
                type="button"
                onClick={() => startPicking('A')}
                className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-chip-gold px-5 py-3 font-display text-sm uppercase tracking-wider text-ink"
              >
                <Hand className="h-4 w-4" /> {NAMES.A}: take the deck
              </button>
              <p className="text-[12px] text-cream/60">
                Pick in secret, lock, then hand over. Cards collide on the felt; the bench explains who cut deeper.
              </p>
            </div>
          )}

          {phase === 'pick' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm uppercase tracking-wider text-cream">
                  {NAMES[turn]} — choose your authority
                </p>
                <button
                  aria-label={hidden ? 'Show cards' : 'Hide cards'}
                  type="button"
                  onClick={() => setHidden((h) => !h)}
                  className="btn-3d inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-felt-800 px-3 py-1.5 font-display text-[10px] uppercase text-cream"
                >
                  {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {hidden ? 'Hidden' : 'Visible'}
                </button>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream/45">
                {turn === 'B' && hidden ? 'Counsel B picking — A, look away.' : 'Pick the case that cuts the deepest.'}
              </p>
              <div className={`grid gap-2 sm:grid-cols-2 ${hidden ? 'blur-sm select-none' : ''}`}>
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
                    className={`card-3d rounded-xl border-2 border-ink bg-felt-800 p-3 text-left ${
                      pick === c.id ? 'ring-2 ring-chip-gold' : ''
                    }`}
                  >
                    <p className="font-mono text-[9px] text-cream/50">{c.citation} · {c.year}</p>
                    <p className="truncate font-display text-[12px] text-cream">{c.caseName}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-cream/60">{c.ratioDecidendi}</p>
                  </button>
                ))}
              </div>
              {turn === 'B' && pick && (
                <button
          aria-label="Lock selection and pass"
                  type="button"
                  onClick={lockAndPass}

                  className="btn-3d w-full rounded-lg border-2 border-ink bg-poker-red px-4 py-3 font-display text-sm uppercase tracking-wider text-cream"
                >
                  Lock &amp; collide <ArrowRight className="inline h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {phase === 'reveal' && reveal && (
            <div className="mt-4 space-y-3 text-center">
              <p
                className={`font-display text-2xl uppercase ${reveal.winner === 'A' ? 'text-chip-gold' : reveal.winner === 'B' ? 'text-poker-red' : 'text-cream/70'}`}
              >
                {reveal.winner === 'tie' ? 'Bench splits' : `${NAMES[reveal.winner]} takes the round`}
              </p>
              <p className="mx-auto max-w-md text-[13px] leading-relaxed text-cream/80">{reveal.reason}</p>
              <button
          aria-label={state.done ? 'See duel result' : 'Next round'}
                type="button"
                onClick={nextRound}

                className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-chip-gold px-5 py-3 font-display text-sm uppercase tracking-wider text-ink"
              >
                {state.done ? 'See result' : 'Next round'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-6 space-y-4 text-center">
              <p className="font-display text-3xl uppercase text-chip-gold" style={{ textShadow: '2px 2px 0 var(--color-ink)' }}>
                {state.scoreA === state.scoreB ? 'Dead heat' : state.scoreA > state.scoreB ? 'Counsel A wins' : 'Counsel B wins'}
              </p>
              <p className="font-mono text-sm text-cream/70">
                Final score {state.scoreA} — {state.scoreB} over {state.history.length} rounds
              </p>
              <div className="flex justify-center gap-2">
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

                  className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-felt-700 px-4 py-2.5 font-display text-[12px] uppercase text-cream"
                >
                  <RotateCcw className="h-4 w-4" /> Rematch
                </button>
                <button
          aria-label="Back to the table"
                  type="button"
                  onClick={onClose}

                  className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-chip-gold px-4 py-2.5 font-display text-[12px] uppercase text-ink"
                >
                  Back to the table
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
