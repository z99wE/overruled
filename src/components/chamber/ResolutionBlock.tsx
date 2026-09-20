import type { TurnRecord } from '../../types/legal';
import { isSparringBrief } from '../../game/localJudge';
import { CardTableCanvas } from '../../game/CardTableCanvas';
import { VERDICT_STYLE, JudgeMessage, OpponentMessage, CoCounselMessage } from './messages';

export function ResolutionBlock({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  const r = record.resolution;
  const sparring = isSparringBrief(record.opposingBrief);
  const oppCard = record.opposingBrief?.opponentCard ?? null;
  const winner: 'player' | 'opponent' | 'none' =
    r.bench_verdict_tag === 'SUSTAINED' || (r.judicial_favor_delta > 0 && r.citation_valid)
      ? 'player'
      : r.judicial_favor_delta < 0 && oppCard
        ? 'opponent'
        : 'none';
  return (
    <div className="space-y-3 border-l-4 border-ink/70 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-sm border-2 border-ink px-2 py-0.5 font-display text-[10px] tracking-wider ${style.cls}`}>
          {style.label}
        </span>
        <span
          className={`font-display text-[11px] ${r.judicial_favor_delta > 0 ? 'text-felt-200' : r.judicial_favor_delta < 0 ? 'text-poker-red' : 'text-cream/40'}`}
        >
          {r.judicial_favor_delta > 0 ? '+' : ''}{r.judicial_favor_delta} favor
        </span>
        {!r.citation_valid && (
          <span className="rounded-sm border-2 border-ink bg-poker-red px-2 py-0.5 font-display text-[8px] uppercase tracking-wider text-cream">
            Unverified citation flagged
          </span>
        )}
        {sparring && (
          <span className="rounded-sm border-2 border-ink bg-poker-blue-deep px-2 py-0.5 font-display text-[8px] uppercase tracking-wider text-cream">
            ⚡ Local sparring bench
          </span>
        )}
      </div>
      <CardTableCanvas
        dealKey={`${record.turnNumber}-${record.rawModelOutput.length}`}
        playerCard={record.citedPrecedent ?? null}
        opponentCard={oppCard}
        winner={winner}
      />
      {record.citedPrecedent?.sourceUrl && (
        <a
          href={record.citedPrecedent.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-ink bg-paper px-2.5 py-1 font-display text-[9px] tracking-wider text-ink transition-colors hover:bg-chip-gold"
        >
          READ THE JUDGMENT ↗ {record.citedPrecedent.citation}
        </a>
      )}
      <JudgeMessage text={r.judge_dialogue} />
      <OpponentMessage
        from={record.opposingBrief ? 'Opposing Counsel · live agent' : 'Opposing Counsel'}
        text={record.opposingBrief?.strike ?? r.opposing_advocate_strike}
        style="adversarial"
      />
      <CoCounselMessage text={r.co_counsel_tactical_hint} />
    </div>
  );
}
