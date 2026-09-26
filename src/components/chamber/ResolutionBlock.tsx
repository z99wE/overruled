import type { TurnRecord } from '../../types/legal';
import { isSparringBrief, SPARRING_MARKER } from '../../game/localJudge';
import { VERDICT_STYLE, JudgeMessage, OpponentMessage, CoCounselMessage } from './messages';

export function ResolutionBlock({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  const r = record.resolution;
  const sparring = isSparringBrief(record.opposingBrief);
  const judgeText = r.judge_dialogue.replace(SPARRING_MARKER, '').trim();

  return (
    <div className="space-y-3.5 border-l-2 border-amber-400/30 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 font-sans text-xs font-semibold ${style.cls}`}>
          {style.label}
        </span>
        <span
          className={`font-mono text-xs font-medium ${r.judicial_favor_delta > 0 ? 'text-emerald-300' : r.judicial_favor_delta < 0 ? 'text-rose-300' : 'text-slate-400'}`}
        >
          {r.judicial_favor_delta > 0 ? '+' : ''}{r.judicial_favor_delta} favor
        </span>
        {!r.citation_valid && (
          <span className="m3-chip m3-chip-rose text-[9px]">
            Unverified Citation Flagged
          </span>
        )}
        {sparring && (
          <span className="m3-chip m3-chip-cyan text-[9px]">
            ⚡ Local Sparring Bench
          </span>
        )}
      </div>

      {record.citedPrecedent?.sourceUrl && (
        <a
          href={record.citedPrecedent.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-slate-900/80 px-3 py-1 font-mono text-[10px] text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-colors"
        >
          Read Full Ruling ↗ {record.citedPrecedent.citation}
        </a>
      )}

      <JudgeMessage text={judgeText} />
      <OpponentMessage
        from={sparring ? 'Opposing Counsel · Local Bench' : record.opposingBrief ? 'Opposing Counsel · AI Bench' : 'Opposing Counsel'}
        text={record.opposingBrief?.strike ?? r.opposing_advocate_strike}
        style="adversarial"
      />
      <CoCounselMessage text={r.co_counsel_tactical_hint} />
    </div>
  );
}
