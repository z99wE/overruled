import { Gavel, Loader2 } from 'lucide-react';
import type { OpponentPlayedCard, PrecedentCard } from '../types/legal';
import { GameCard } from './GameCard';
import { VERDICT_STYLE } from '../components/chamber/messages';
import type { TurnRecord } from '../types/legal';

export type TableStage = 'idle' | 'dealing' | 'resolving' | 'verdict';

interface CardTableProps {
  stage: TableStage;
  playerCard: PrecedentCard | OpponentPlayedCard | null;
  opponentCard: OpponentPlayedCard | null;
  winner: 'player' | 'opponent' | 'none';
  record: TurnRecord | null;
  clientName: string;
  replayKey: string;
}

/**
 * CARD TABLE — the felt pit where each hand is actually played: the player's
 * card deals up from the counsel rail, the opponent's counter-card drops in
 * face-down, the Bench reveals, the winner glows and the loser is burned off
 * the table. Presentation only — the trial logic lives in the reducer.
 */
export function CardTable({ stage, playerCard, opponentCard, winner, record, clientName, replayKey }: CardTableProps) {
  const hasPlayer = !!playerCard;
  const oppFlipped = stage === 'verdict';
  const playerWon = winner === 'player';
  const oppWon = winner === 'opponent';

  return (
    <div className="rail-panel relative h-44 w-full shrink-0 overflow-hidden sm:h-48">
      <div className="absolute inset-2.5 rounded-[1.35rem] border-2 border-ink/60 bg-gradient-to-b from-felt-500/80 via-felt-800 to-felt-950" />

      {/* Seat rails */}
      <p className="absolute left-4 top-2 z-10 font-mono text-[9px] uppercase tracking-widest text-poker-red">
        Opposing Counsel · {clientName ?? ''}
      </p>
      <p className="absolute bottom-2 right-4 z-10 font-mono text-[9px] uppercase tracking-widest text-felt-200">
        Counsel for the defence
      </p>

      {/* Court mark */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[5rem] text-cream/[0.04]" aria-hidden>
        {playerCard?.jurisdiction ?? 'LAW'}
      </span>

      {stage === 'idle' ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
          <Gavel className="h-5 w-5 animate-bounce text-chip-gold/70" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
            Play a precedent from your hand to open the record
          </p>
        </div>
      ) : (
        <div key={replayKey} className="absolute inset-0 z-10">
          {/* OPPONENT'S counter-card: drops in face-down, flips over at verdict */}
          {opponentCard && (
            <div className="tbl-deal-opp absolute left-1/2 top-1">
              <div className={`${oppWon ? 'tbl-opp-win' : oppFlipped ? 'tbl-opp-lose' : ''}`}>
                <div className="flex flex-col items-center">
                  <GameCard card={opponentCard} size="sm" flipMode="toggled" faceDown={!oppFlipped} />
                  {oppFlipped && !oppWon && (
                    <span className="block pt-1 text-center font-mono text-[8px] uppercase tracking-widest text-cream/35">
                      Counter-authority dismissed
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CENTER chip at verdict */}
          {stage === 'verdict' && record && (
            <div className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink px-3 py-1.5 font-display text-[11px] uppercase tracking-widest ${VERDICT_STYLE[record.resolution.bench_verdict_tag].flash} anim-slam`}>
              {VERDICT_STYLE[record.resolution.bench_verdict_tag].label}
              <span className="block text-center text-[10px]">
                {record.resolution.judicial_favor_delta > 0
                  ? `+${record.resolution.judicial_favor_delta} favor`
                  : record.resolution.judicial_favor_delta < 0
                    ? `${record.resolution.judicial_favor_delta} favor`
                    : 'favor holds'}
              </span>
            </div>
          )}

          {/* PLAYER'S card: deals up from the defence rail */}
          {hasPlayer ? (
            <div className={`tbl-deal-self absolute bottom-1 left-1/2 ${playerWon ? 'tbl-player-win' : stage === 'verdict' ? 'tbl-player-lose' : ''}`}>
              <div className="flex flex-col items-center">
                <GameCard card={playerCard!} size="sm" flipMode="both" flipDelay={260} />
                {playerWon && (
                  <span className="block pt-1 text-center font-mono text-[8px] uppercase tracking-widest text-chip-gold">
                    Authority carried the point
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 flex-col items-center">
              <div className="flex aspect-[5/7] w-[72px] items-center justify-center rounded-lg border-2 border-dashed border-cream/30 bg-paper/10 font-mono text-[8px] uppercase tracking-widest text-cream/50">
                Oral motion
              </div>
              <span className="pt-1 font-mono text-[8px] uppercase tracking-widest text-cream/40">No card</span>
            </div>
          )}

          {/* Bench deliberation caption */}
          {stage === 'resolving' && (
            <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 border-ink bg-felt-950/90 px-3 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-chip-gold" />
              <span className="font-display text-[10px] uppercase tracking-widest text-cream/70">The Bench is deliberating…</span>
            </div>
          )}
          {stage === 'dealing' && (
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-felt-950/90 px-3 py-1.5 font-display text-[10px] uppercase tracking-widest text-felt-200">
              Authority on the record…
            </div>
          )}
        </div>
      )}
    </div>
  );
}