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
  fileOpen?: boolean;
  onToggleFile?: () => void;
}

/**
 * CARD TABLE — compact status bar in idle mode; crisp duel stage when resolving.
 */
export function CardTable({
  stage,
  playerCard,
  opponentCard,
  winner,
  record,
  clientName,
  replayKey,
  fileOpen,
  onToggleFile,
}: CardTableProps) {
  const hasPlayer = !!playerCard;
  const oppFlipped = stage === 'verdict';
  const playerWon = winner === 'player';
  const oppWon = winner === 'opponent';

  if (stage === 'idle') {
    return (
      <div className="relative w-full shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-xl px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Opposing Counsel Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-rose-700 bg-rose-50/90 px-2.5 py-1 rounded-full border border-rose-200/70 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span className="truncate max-w-[140px] sm:max-w-xs">{clientName ?? 'Opposition'}</span>
          </div>

          {/* Center Instruction / Status */}
          <div className="flex items-center gap-2 text-center flex-1 justify-center min-w-0">
            {hasPlayer ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 font-mono text-[11px] font-bold text-blue-800 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Precedent Ready · Click Submit Argument
              </span>
            ) : (
              <span className="font-sans text-xs font-semibold text-slate-600 truncate">
                Select a precedent card below to advance your submission
              </span>
            )}
          </div>

          {/* Right: Case File Toggle Button */}
          {onToggleFile && (
            <button
              type="button"
              onClick={onToggleFile}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                fileOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>{fileOpen ? '✕ Close Archive' : '📁 Case File & Archive'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-40 sm:h-44 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white/95 shadow-sm backdrop-blur-xl">
      {/* Seat rails */}
      <div className="absolute left-3 top-2 z-10 flex items-center gap-1.5 font-mono text-[10px] font-semibold text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded-full border border-rose-200/60">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        <span>Opposing Counsel</span>
      </div>
      <div className="absolute bottom-2 right-3 z-10 flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Counsel for the Defence</span>
      </div>

      <div key={replayKey} className="absolute inset-0 z-10">
        {/* Opponent Card Reveal */}
        {opponentCard && (
          <div className="tbl-deal-opp absolute left-1/2 top-2">
            <div className={`${oppWon ? 'tbl-opp-win' : oppFlipped ? 'tbl-opp-lose' : ''}`}>
              <div className="flex flex-col items-center">
                <GameCard card={opponentCard} size="sm" flipMode="toggled" faceDown={!oppFlipped} />
                {oppFlipped && !oppWon && (
                  <span className="block pt-0.5 text-center font-mono text-[8px] font-medium text-slate-500">
                    Counter-authority distinguished
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Center Verdict Badge */}
        {stage === 'verdict' && record && (
          <div className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 px-4 py-1.5 font-display text-xs font-bold shadow-2xl backdrop-blur-xl ${VERDICT_STYLE[record.resolution.bench_verdict_tag].flash} anim-slam`}>
            <div className="text-center">{VERDICT_STYLE[record.resolution.bench_verdict_tag].label}</div>
            <span className="block text-center font-mono text-[10px] font-normal opacity-90">
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
                <span className="block pt-0.5 text-center font-mono text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  Authority sustained
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div className="flex aspect-[5/7.2] w-[95px] sm:w-[110px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/80 font-mono text-[9px] text-slate-500">
              Oral Motion
            </div>
            <span className="pt-0.5 font-mono text-[8px] text-slate-400">Unanchored</span>
          </div>
        )}

        {/* Deliberation Status Pill */}
        {stage === 'resolving' && (
          <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 shadow-xl backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span className="font-sans text-xs font-semibold text-slate-800">The Bench is deliberating authority…</span>
          </div>
        )}
        {stage === 'dealing' && (
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200 bg-white/95 px-3 py-1.5 font-sans text-xs font-bold text-emerald-700 shadow-xl backdrop-blur">
            Submitting precedent to the record…
          </div>
        )}
      </div>
    </div>
  );
}