import { useEffect, useRef, useState } from 'react';
import type { ScenarioBundle, SessionSummary } from '../types/legal';
import { createKeyManager } from '../core/storage';
import { enrichConsultationQuestions, serializeDocketMarkdown, downloadText, shareText } from '../core/docket';
import { StatutoryNotice } from './StatutoryNotice';

interface DocketExportModalProps {
  scenario: ScenarioBundle;
  summary: SessionSummary;
  onClose: () => void;
  onRestart: () => void;
}

export function DocketExportModal({ scenario, summary, onClose, onRestart }: DocketExportModalProps) {
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [printBlocked, setPrintBlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [questions, setQuestions] = useState<string[]>(summary.consultationQuestions);
  const viewRef = useRef<HTMLDivElement>(null);

  const exportSummary: SessionSummary = { ...summary, consultationQuestions: questions };

  const outcome =
    summary.finalFavor >= 70
      ? { label: 'Decisive Judgment in Client’s Favor', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' }
      : summary.finalFavor <= 30
        ? { label: 'Matter Lost — Bench Rules Against Record', badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300' }
        : { label: 'Proceedings Finely Balanced / Adjourned', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };

  useEffect(() => {
    viewRef.current?.scrollTo({ top: 0 });
  }, []);

  const enrich = async () => {
    setEnriching(true);
    setEnrichError(null);
    try {
      const km = createKeyManager();
      const config = await km.loadConfig();
      if (!config) throw new Error('No provider key configured — add one in the Key Vault first.');
      const enriched = await enrichConsultationQuestions(config, summary, scenario);
      setQuestions(enriched);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : String(err));
    } finally {
      setEnriching(false);
    }
  };

  const md = () => serializeDocketMarkdown(exportSummary);
  const html = () => buildPrintHtml(scenario, exportSummary);

  const doDownload = (kind: 'md' | 'html' | 'pdf') => {
    const base = `overrool-docket-${scenario.id}`;
    if (kind === 'md') {
      downloadText(`${base}.md`, md());
    } else if (kind === 'html') {
      downloadText(`${base}.html`, html(), 'text/html');
    } else {
      const win = window.open('', '_blank');
      if (!win) {
        setPrintBlocked(true);
        return;
      }
      win.document.write(html());
      win.document.close();
      win.focus();
      win.print();
      setPrintBlocked(false);
    }
  };

  const share = async () => {
    const text = md();
    const result = await shareText(`Overrool Docket — ${scenario.title}`, text);
    setCopied(result === 'shared' || result === 'copied');
    if (result === 'shared' || result === 'copied') setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/85 backdrop-blur-md sm:items-center sm:p-6 selection:bg-amber-400 selection:text-black">
      <div className="flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 font-serif font-bold text-sm">
              §
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white">
                Advocate Consultation Docket
              </h2>
              <p className="font-mono text-[10px] text-slate-400">
                {scenario.title} · {scenario.bench}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white font-serif text-sm"
            aria-label="Close docket"
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div ref={viewRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Outcome Banner */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold mb-1.5 ${outcome.badge}`}>
                {outcome.label}
              </span>
              <p className="font-display text-base text-white">Client: {scenario.clientName}</p>
              <p className="font-mono text-xs text-slate-400 mt-0.5">
                Final Favor: <span className="text-amber-300 font-bold">{summary.finalFavor}/100</span> · {summary.turnRecords.length} submissions on record
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] text-slate-400">
              Verified Record
            </span>
          </div>

          {/* 1. Executive Summary */}
          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-amber-300">
              1 · Record Summary &amp; Submissions
            </h3>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3.5">
              {summary.turnRecords.map((r) => (
                <div key={r.turnNumber} className="flex items-start gap-2.5 text-xs border-b border-white/5 pb-2 last:border-none last:pb-0">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-400 shrink-0">T{r.turnNumber}</span>
                  <span className="text-slate-200 flex-1">{r.playerAction.rawText}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] shrink-0 ${
                    r.resolution.judicial_favor_delta > 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : r.resolution.judicial_favor_delta < 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-white/10 bg-white/5 text-slate-400'
                  }`}>
                    {r.resolution.bench_verdict_tag} {r.resolution.judicial_favor_delta > 0 ? '+' : ''}{r.resolution.judicial_favor_delta}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Admitted Precedents */}
          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-emerald-300">
              2 · Admitted Legal Precedents
            </h3>
            {summary.admittedPrecedents.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 font-mono text-xs italic text-slate-400">
                No authority survived opposing objections on this record.
              </p>
            ) : (
              <div className="space-y-2.5">
                {summary.admittedPrecedents.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-emerald-500/20 bg-slate-950/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-bold text-white">{p.caseName}</p>
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] text-amber-300">{p.domain}</span>
                    </div>
                    <p className="font-mono text-[10px] text-amber-300/80 mt-0.5">{p.citation} · {p.court}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{p.ratioDecidendi}</p>
                    {p.sourceUrl && (
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block font-mono text-[10px] text-amber-300 underline decoration-dotted hover:text-white"
                      >
                        Read Official Law Report ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Exposure Points */}
          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-rose-300">
              3 · Identified Exposure Points
            </h3>
            {summary.exposurePoints.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 font-mono text-xs italic text-slate-400">
                No exposure was flagged by opposing counsel — verify independently before any filing.
              </p>
            ) : (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3.5 space-y-1.5">
                {summary.exposurePoints.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-rose-200">
                    <span className="font-mono text-rose-400 font-bold">•</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Actionable Questions */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-xs font-bold text-amber-300">
                4 · Counsel Consultation Questions
              </h3>
              <div className="flex items-center gap-2">
                {enrichError && <span className="font-mono text-[10px] text-rose-400 max-w-xs truncate">{enrichError}</span>}
                <button
                  aria-label={copied ? 'Refine' : 'Refine questions with your key'}
                  type="button"
                  onClick={() => void enrich()}
                  disabled={enriching}
                  className="m3-btn m3-btn-tonal text-[10px] px-2.5 py-1"
                >
                  {enriching ? 'Refining...' : copied ? 'Refined ✓' : 'Refine with Key ↺'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 space-y-2">
              {questions.length === 0 ? (
                <p className="font-mono text-xs italic text-slate-400">
                  Run refinement, or download the docket to receive the structured consultation question set.
                </p>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-200 border-b border-white/5 pb-2 last:border-none last:pb-0">
                    <span className="font-mono text-amber-300 font-bold">{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <StatutoryNotice compact />
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => doDownload('md')}
              aria-label="Download docket as markdown"
              className="m3-btn m3-btn-primary px-3 py-1.5 text-xs"
            >
              Download .MD
            </button>
            <button
              type="button"
              onClick={() => doDownload('html')}
              aria-label="Download docket as html"
              className="m3-btn m3-btn-tonal px-3 py-1.5 text-xs text-white"
            >
              Download .HTML
            </button>
            <button
              type="button"
              onClick={() => doDownload('pdf')}
              aria-label="Print or save docket as pdf"
              className="m3-btn m3-btn-tonal px-3 py-1.5 text-xs text-white"
            >
              Print / PDF
            </button>
            <button
              type="button"
              onClick={() => void share()}
              aria-label="Share docket"
              className="m3-btn m3-btn-tonal px-3 py-1.5 text-xs text-white"
            >
              Share
            </button>
            {printBlocked && (
              <span className="font-mono text-[10px] text-rose-400">
                Pop-up blocked — allow pop-ups to print.
              </span>
            )}
            {copied && (
              <span className="font-mono text-[10px] text-emerald-400">
                Copied to clipboard.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRestart}
            aria-label="Retry proceedings"
            className="m3-btn m3-btn-primary px-4 py-1.5 text-xs"
          >
            Retry Proceeding ↺
          </button>
        </footer>
      </div>
    </div>
  );
}

export function buildPrintHtml(scenario: ScenarioBundle, summary: SessionSummary): string {
  const qs = summary.consultationQuestions.length
    ? summary.consultationQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')
    : '<li>Run refinement to populate this section.</li>';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Overrool Docket — ${escapeHtml(scenario.title)}</title>
<style>
  body{font-family:Georgia,serif;color:#111;max-width:720px;margin:32px auto;padding:0 24px;line-height:1.5}
  h1{font-size:20px} h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;margin-top:24px;border-bottom:1px solid #999;padding-bottom:4px}
  .muted{color:#666;font-size:12px} .cite{font-family:monospace;font-size:11px;color:#7a5c00}
  blockquote{color:#555;border-left:3px solid #ccc;padding-left:12px;font-size:11px}
  ol li,ul li{margin-bottom:6px;font-size:13px}
  a{color:#7a5c00}
</style></head>
<body>
<h1>Advocate Consultation Docket</h1>
<p class="muted">${escapeHtml(scenario.title)} — Client: ${escapeHtml(scenario.clientName)}<br>
Bench: ${escapeHtml(scenario.bench)}<br>
Final judicial favor: ${summary.finalFavor}/100 · Completed: ${new Date(summary.completedAt).toLocaleString()}</p>
<blockquote>Overrool is an educational legal-strategy simulation built on real, published judgments from seven legal systems. It does not provide legal advice and cannot replace a qualified advocate, solicitor, or attorney admitted in your jurisdiction. Verify all citations against certified law reports.</blockquote>

<h2>1. Executive Summary</h2>
<ul>${summary.turnRecords.map((r) => `<li><b>Turn ${r.turnNumber}:</b> ${escapeHtml(r.playerAction.rawText)} <span class="muted">[${r.resolution.bench_verdict_tag} ${r.resolution.judicial_favor_delta > 0 ? '+' : ''}${r.resolution.judicial_favor_delta}]</span></li>`).join('')}</ul>

<h2>2. Admitted Legal Precedents</h2>
<ul>${summary.admittedPrecedents.length ? summary.admittedPrecedents.map((p) => `<li><b>${escapeHtml(p.caseName)}</b><br><span class="cite">${escapeHtml(p.citation)} — ${escapeHtml(p.court)}</span><br>${escapeHtml(p.ratioDecidendi)}${p.sourceUrl ? `<br><a href="${escapeHtml(p.sourceUrl)}">Read the full judgment</a>` : ''}</li>`).join('') : '<li>None survived scrutiny.</li>'}</ul>

<h2>3. Identified Exposure Points</h2>
<ol>${summary.exposurePoints.length ? summary.exposurePoints.map((e) => `<li>${escapeHtml(e)}</li>`).join('') : '<li>None flagged during simulation.</li>'}</ol>

<h2>4. Actionable Advocate Consultation Questions</h2>
<ol>${qs}</ol>
<p class="muted">Generated by Overrool — a BYOK offline-first legal simulation engine.</p>
</body></html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}