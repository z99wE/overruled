import type { TurnRecord } from '../../types/legal';
import { isSparringBrief, SPARRING_MARKER } from '../../game/localJudge';
import { VERDICT_STYLE, JudgeMessage, OpponentMessage, CoCounselMessage } from './messages';

export function ResolutionBlock({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  const r = record.resolution;
  const sparring = isSparringBrief(record.opposingBrief);
  const judgeText = r.judge_dialogue.replace(SPARRING_MARKER, '').trim();

  return (
    <div className="space-y-3.5 border-l-2 border-amber-400/50 pl-4 my-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 font-sans text-xs font-bold ${style.cls}`}>
          {style.label}
        </span>
        <span
          className={`font-mono text-xs font-bold ${r.judicial_favor_delta > 0 ? 'text-emerald-700' : r.judicial_favor_delta < 0 ? 'text-rose-700' : 'text-slate-500'}`}
        >
          {r.judicial_favor_delta > 0 ? '+' : ''}{r.judicial_favor_delta} favor
        </span>
        {!r.citation_valid && (
          <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 font-mono text-[10px] font-bold">
            Unverified Citation
          </span>
        )}
        {sparring && (
          <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 font-mono text-[10px] font-bold">
            Local Sparring Bench
          </span>
        )}
      </div>

      {record.citedPrecedent?.sourceUrl && (
        <a
          href={record.citedPrecedent.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] text-blue-600 hover:text-blue-800 hover:border-blue-300 transition-colors shadow-2xs"
        >
          Read Full Ruling: {record.citedPrecedent.citation}
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
