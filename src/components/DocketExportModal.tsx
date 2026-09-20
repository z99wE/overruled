import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [questions, setQuestions] = useState<string[]>(summary.consultationQuestions);
  const viewRef = useRef<HTMLDivElement>(null);

  const exportSummary: SessionSummary = { ...summary, consultationQuestions: questions };

  const outcome =
    summary.finalFavor >= 70
      ? { label: 'Decisive judgment in your client\u2019s favour', tone: 'text-chip-gold' }
      : summary.finalFavor <= 30
        ? { label: 'Matter lost — bench reads against the record', tone: 'text-poker-red' }
        : { label: 'Adjourned — proceeding finely balanced', tone: 'text-cream/70' };

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
      if (!win) return;
      win.document.write(html());
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const share = async () => {
    const text = md();
    await shareText(`Overrool Docket — ${scenario.title}`, text);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-ink bg-felt-900 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-ink px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chip-gold/15 text-chip-gold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream">Advocate Consultation Docket</h2>
              <p className="text-[11px] text-cream/50">{scenario.title} · {scenario.bench}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink text-cream/50 hover:text-cream" aria-label="Close docket">
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div ref={viewRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink bg-ink/60 p-4">
            <div>
              <p className="font-display text-[15px] font-semibold text-cream">{scenario.clientName}</p>
              <p className={`mt-0.5 text-[12px] font-semibold uppercase tracking-wider ${outcome.tone}`}>{outcome.label}</p>
              <p className="mt-1 text-[11px] text-cream/50">Final judicial favor: {summary.finalFavor}/100 · {summary.turnRecords.length} submission{summary.turnRecords.length === 1 ? '' : 's'} on record</p>
            </div>
            <span className="rounded border border-ink bg-felt-800/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cream/50">
              Simulated proceedings
            </span>
          </div>

          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-chip-gold">
              <CheckCircle2 className="h-3.5 w-3.5" /> 1 · Executive summary of the record
            </h3>
            <div className="space-y-1.5 rounded-lg border border-ink bg-ink/40 p-3.5">
              {summary.turnRecords.map((r) => (
                <div key={r.turnNumber} className="flex gap-2 text-[12px] leading-relaxed">
                  <span className="shrink-0 font-mono text-[10px] text-cream/50">T{r.turnNumber}</span>
                  <span className="text-cream/70">{r.playerAction.rawText}</span>
                  <span className={`ml-auto shrink-0 font-mono text-[10px] ${
                    r.resolution.judicial_favor_delta > 0 ? 'text-chip-gold' : r.resolution.judicial_favor_delta < 0 ? 'text-poker-red' : 'text-cream/50'
                  }`}>
                    {r.resolution.bench_verdict_tag[0]} {r.resolution.judicial_favor_delta > 0 ? '+' : ''}{r.resolution.judicial_favor_delta}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-chip-gold">
              <Sparkles className="h-3.5 w-3.5" /> 2 · Admitted legal precedents
            </h3>
            {summary.admittedPrecedents.length === 0 ? (
              <p className="rounded-lg border border-ink bg-ink/40 p-3.5 text-[12px] italic text-cream/50">No authority survived opposing objections on this record.</p>
            ) : (
              <ul className="space-y-2">
                {summary.admittedPrecedents.map((p) => (
                  <li key={p.id} className="rounded-lg border border-chip-gold/20 bg-chip-gold/5 p-3">
                    <p className="font-display text-[13px] font-medium text-cream">{p.caseName}</p>
                    <p className="font-mono text-[10px] text-chip-gold">{p.citation} · {p.court}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-cream/60">{p.ratioDecidendi}</p>
                    {p.sourceUrl && (
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-block font-mono text-[10px] text-chip-gold/80 underline decoration-dotted hover:text-chip-gold"
                      >
                        Read the full judgment ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-poker-red">
              <AlertTriangle className="h-3.5 w-3.5" /> 3 · Identified exposure points
            </h3>
            {summary.exposurePoints.length === 0 ? (
              <p className="rounded-lg border border-ink bg-ink/40 p-3.5 text-[12px] italic text-cream/50">No exposure was flagged by opposing counsel — verify independently before any filing.</p>
            ) : (
              <ol className="list-decimal space-y-1.5 pl-5 text-[12px] leading-relaxed text-cream/70">
                {summary.exposurePoints.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ol>
            )}
          </section>

          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-chip-gold">
                <Send className="h-3.5 w-3.5" /> 4 · Actionable advocate consultation questions
              </h3>
              <div className="flex items-center gap-2">
                {enrichError && <span className="max-w-[200px] truncate text-[10px] text-poker-red">{enrichError}</span>}
                <button
          aria-label={copied ? 'Refine' : 'Refine questions with your key'}
                  type="button"
                  onClick={() => void enrich()}
                  disabled={enriching}

                  className="inline-flex items-center gap-1.5 rounded border border-chip-gold/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-chip-gold hover:bg-chip-gold/10 disabled:opacity-50"
                >
                  {enriching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {copied ? 'Refined' : 'Refine with your key'}
                </button>
              </div>
            </div>
            <ol className="list-decimal space-y-2 rounded-lg border border-ink bg-ink/40 p-3.5">
              {questions.length === 0 ? (
                <li className="text-[12px] italic text-cream/50">Run refinement, or download the docket to receive the deterministic question set.</li>
              ) : (
                questions.map((q, i) => (
                  <li key={i} className="font-display text-[13px] leading-relaxed text-cream/85">{q}</li>
                ))
              )}
            </ol>
          </section>

          <StatutoryNotice compact />
        </div>

        {/* Footer actions */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => doDownload('md')} aria-label="Download docket as markdown" className="inline-flex items-center gap-1.5 rounded-lg border border-chip-gold/40 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-chip-gold hover:bg-chip-gold/10">
              <Download className="h-3.5 w-3.5" /> .md
            </button>
            <button type="button" onClick={() => doDownload('html')} aria-label="Download docket as html" className="inline-flex items-center gap-1.5 rounded-lg border border-cream/30 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-cream/70 hover:border-cream/30">
              <FileText className="h-3.5 w-3.5" /> .html
            </button>
            <button type="button" onClick={() => doDownload('pdf')} aria-label="Print or save docket as pdf" className="inline-flex items-center gap-1.5 rounded-lg border border-cream/30 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-cream/70 hover:border-cream/30">
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <button type="button" onClick={() => void share()} aria-label="Share docket" className="inline-flex items-center gap-1.5 rounded-lg border border-cream/30 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-cream/70 hover:border-cream/30">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
          <button type="button" onClick={onRestart} aria-label="Retry proceedings" className="inline-flex items-center gap-1.5 rounded-lg bg-chip-gold px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink hover:brightness-110">
            <RefreshCw className="h-3.5 w-3.5" /> Retry proceedings
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