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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-md sm:items-center sm:p-6 font-sans">
      <div className="flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] text-slate-900">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-sans font-bold text-sm">
              D
            </div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">
                Advocate Consultation Docket
              </h2>
              <p className="font-mono text-[10px] text-slate-500">
                {scenario.title} · {scenario.bench}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-sans text-xs font-bold cursor-pointer"
            aria-label="Close docket"
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div ref={viewRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Outcome Banner */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold mb-1.5 ${outcome.badge}`}>
                {outcome.label}
              </span>
              <p className="font-display text-base text-slate-900 font-bold">Client: {scenario.clientName}</p>
              <p className="font-mono text-xs text-slate-600 mt-0.5">
                Final Favor: <span className="text-blue-700 font-bold">{summary.finalFavor}/100</span> · {summary.turnRecords.length} submissions on record
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[9px] text-slate-600 shadow-2xs">
              Verified Record
            </span>
          </div>

          {/* 1. Executive Summary */}
          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-slate-800">
              1 · Record Summary &amp; Submissions
            </h3>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              {summary.turnRecords.map((r) => (
                <div key={r.turnNumber} className="flex items-start gap-2.5 text-xs border-b border-slate-100 pb-2 last:border-none last:pb-0">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[9px] text-slate-600 shrink-0">T{r.turnNumber}</span>
                  <span className="text-slate-800 flex-1">{r.playerAction.rawText}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] shrink-0 ${
                    r.resolution.judicial_favor_delta > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-bold' : r.resolution.judicial_favor_delta < 0 ? 'border-rose-200 bg-rose-50 text-rose-800 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    {r.resolution.bench_verdict_tag} {r.resolution.judicial_favor_delta > 0 ? '+' : ''}{r.resolution.judicial_favor_delta}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Admitted Precedents */}
          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-emerald-800">
              2 · Admitted Legal Precedents
            </h3>
            {summary.admittedPrecedents.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs italic text-slate-500">
                No authority survived opposing objections on this record.
              </p>
            ) : (
              <div className="space-y-2.5">
                {summary.admittedPrecedents.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-bold text-slate-900">{p.caseName}</p>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-700">{p.domain}</span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-600 mt-0.5">{p.citation} · {p.court}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{p.ratioDecidendi}</p>
                    {p.sourceUrl && (
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block font-mono text-[10px] text-blue-700 underline decoration-dotted hover:text-blue-900 font-semibold"
                      >
                        Read Official Law Report
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Exposure Points */}
          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-rose-800">
              3 · Identified Exposure Points
            </h3>
            {summary.exposurePoints.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs italic text-slate-500">
                No exposure was flagged by opposing counsel — verify independently before any filing.
              </p>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 space-y-1.5">
                {summary.exposurePoints.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-rose-900">
                    <span className="font-mono text-rose-600 font-bold">•</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Actionable Questions */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-xs font-bold text-slate-800">
                4 · Counsel Consultation Questions
              </h3>
              <div className="flex items-center gap-2">
                {enrichError && <span className="font-mono text-[10px] text-rose-600 max-w-xs truncate">{enrichError}</span>}
                <button
                  aria-label={copied ? 'Refine' : 'Refine questions with your key'}
                  type="button"
                  onClick={() => void enrich()}
                  disabled={enriching}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  {enriching ? 'Refining...' : copied ? 'Refined' : 'Refine with Key'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              {questions.length === 0 ? (
                <p className="font-mono text-xs italic text-slate-500">
                  Run refinement, or download the docket to receive the structured consultation question set.
                </p>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-800 border-b border-slate-100 pb-2 last:border-none last:pb-0">
                    <span className="font-mono text-blue-700 font-bold">{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <StatutoryNotice compact />
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => doDownload('md')}
              aria-label="Download docket as markdown"
              className="rounded-full bg-blue-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              Download .MD
            </button>
            <button
              type="button"
              onClick={() => doDownload('html')}
              aria-label="Download docket as html"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              Download .HTML
            </button>
            <button
              type="button"
              onClick={() => doDownload('pdf')}
              aria-label="Print or save docket as pdf"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              Print / PDF
            </button>
            <button
              type="button"
              onClick={() => void share()}
              aria-label="Share docket"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              Share
            </button>
            {printBlocked && (
              <span className="font-mono text-[10px] text-rose-600">
                Pop-up blocked — allow pop-ups to print.
              </span>
            )}
            {copied && (
              <span className="font-mono text-[10px] text-emerald-700 font-bold">
                Copied to clipboard.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRestart}
            aria-label="Retry proceedings"
            className="rounded-full bg-slate-900 px-5 py-2 font-sans text-xs font-bold text-white hover:bg-black shadow-xs cursor-pointer"
          >
            Retry Proceeding
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