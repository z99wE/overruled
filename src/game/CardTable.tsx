import { Loader2 } from 'lucide-react';
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
 * CARD TABLE — the 2.5D liquid glass rostrum where submissions are tested.
 */
export function CardTable({ stage, playerCard, opponentCard, winner, record, clientName, replayKey }: CardTableProps) {
  const hasPlayer = !!playerCard;
  const oppFlipped = stage === 'verdict';
  const playerWon = winner === 'player';
  const oppWon = winner === 'opponent';

  return (
    <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-2xl">
      {/* 2.5D Monet Roman Amphitheater Ambient Underlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen"
        style={{ backgroundImage: 'url(/assets/courtroom-chamber.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/40 to-slate-950/90" />

      {/* Seat rails */}
      <div className="absolute left-5 top-3.5 z-10 flex items-center gap-2 font-mono text-[11px] text-rose-300">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span>Opposing Counsel · {clientName ?? 'Opposition'}</span>
      </div>
      <div className="absolute bottom-3.5 right-5 z-10 flex items-center gap-2 font-mono text-[11px] text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span>Counsel for the Defence</span>
      </div>

      {stage === 'idle' ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          {hasPlayer ? (
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 font-mono text-[11px] font-semibold text-amber-300">
                Selected Precedent Prepared for Oral Argument
              </span>
              <p className="font-sans text-xs text-slate-300">
                Press <strong className="text-white">Submit Argument</strong> below to move the Bench
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="font-sans text-xs font-medium text-slate-300">
                Select a precedent card below to advance your submission
              </p>
            </div>
          )}
        </div>
      ) : (
        <div key={replayKey} className="absolute inset-0 z-10">
          {/* Opponent Card Reveal */}
          {opponentCard && (
            <div className="tbl-deal-opp absolute left-1/2 top-2">
              <div className={`${oppWon ? 'tbl-opp-win' : oppFlipped ? 'tbl-opp-lose' : ''}`}>
                <div className="flex flex-col items-center">
                  <GameCard card={opponentCard} size="sm" flipMode="toggled" faceDown={!oppFlipped} />
                  {oppFlipped && !oppWon && (
                    <span className="block pt-1 text-center font-mono text-[9px] text-slate-400">
                      Counter-authority distinguished
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Center Verdict Badge */}
          {stage === 'verdict' && record && (
            <div className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 px-5 py-2 font-display text-sm font-bold shadow-2xl backdrop-blur-xl ${VERDICT_STYLE[record.resolution.bench_verdict_tag].flash} anim-slam`}>
              <div className="text-center">{VERDICT_STYLE[record.resolution.bench_verdict_tag].label}</div>
              <span className="block text-center font-mono text-[11px] font-normal opacity-90">
                {record.resolution.judicial_favor_delta > 0
                  ? `+${record.resolution.judicial_favor_delta} favor`
                  : record.resolution.judicial_favor_delta < 0
                    ? `${record.resolution.judicial_favor_delta} favor`
                    : 'favor holds'}
              </span>
            </div>
          )}

          {/* Player's Card */}
          {hasPlayer ? (
            <div className={`tbl-deal-self absolute bottom-2 left-1/2 ${playerWon ? 'tbl-player-win' : stage === 'verdict' ? 'tbl-player-lose' : ''}`}>
              <div className="flex flex-col items-center">
                <GameCard card={playerCard!} size="sm" flipMode="both" flipDelay={260} />
                {playerWon && (
                  <span className="block pt-1 text-center font-mono text-[9px] font-semibold text-amber-300">
                    Authority sustained by the Bench
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center">
              <div className="flex aspect-[5/7.2] w-[115px] sm:w-[135px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900/60 font-mono text-[10px] text-slate-400">
                Oral Motion
              </div>
              <span className="pt-1 font-mono text-[9px] text-slate-500">Unanchored</span>
            </div>
          )}

          {/* Deliberation Status Pill */}
          {stage === 'resolving' && (
            <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-amber-400/30 bg-slate-950/90 px-4 py-2 shadow-xl backdrop-blur">
              <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              <span className="font-sans text-xs font-medium text-slate-200">The Bench is deliberating authority…</span>
            </div>
          )}
          {stage === 'dealing' && (
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/30 bg-slate-950/90 px-4 py-2 font-sans text-xs font-medium text-emerald-300 shadow-xl backdrop-blur">
              Submitting precedent to the record…
            </div>
          )}
        </div>
      )}
    </div>
  );
}