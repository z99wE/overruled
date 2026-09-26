import { useEffect, useState } from 'react';
import type { LLMConfig, LLMProvider } from '../types/legal';
import { PROVIDERS, HOSTED_ENTRY, createKeyManager } from '../core/storage';
import type { AskResult, CompareResult, DeskAnalysis, DeskOp, DeskResult, LawyerResult, RisksResult, SimplifyResult } from '../core/docEngine';
import { genDeskAnalysis, localDeskAnalysis } from '../core/docEngine';
import { DESK_SAMPLES } from '../core/deskSamples';
import { CREDIT_COSTS, creditsToday, spendCredits } from '../core/meter';
import type { Library, LibraryDoc } from '../core/library';
import { addDoc, createIdbStore, emptyLibrary, findDoc, libraryStats } from '../core/library';
import { DocumentIngest, DocChip } from './DocumentIngest';
import { DocumentLibraryPanel } from './DocumentLibraryPanel';
import { Docketling } from './Docketling';
import { docKey, loadReadingLog, recordUnderstood, saveReadingLog } from '../core/readership';

interface LegalDeskProps {
  onClose: () => void;
  onOpenKeys: () => void;
  page?: boolean;
}

type SourceTab = 'paste' | 'upload' | 'library' | 'sample';

const SOURCES: { id: SourceTab; label: string }[] = [
  { id: 'paste', label: 'Paste Text' },
  { id: 'upload', label: 'Upload File' },
  { id: 'library', label: 'Saved Vault' },
  { id: 'sample', label: 'Sample Contracts' },
];

const OPS: { id: DeskOp; label: string; desc: string }[] = [
  { id: 'simplify', label: 'Plain Language', desc: 'Translate legalese into executive summary' },
  { id: 'risks', label: 'Risk & Traps', desc: 'Audit one-sided indemnities & uncapped liability' },
  { id: 'compare', label: 'Version Diff', desc: 'Side-by-side redline & exposure comparison' },
  { id: 'ask', label: 'Ask Document', desc: 'Grounded question answering with textual proof' },
  { id: 'lawyer', label: 'Counsel Prep', desc: 'Pre-negotiation brief & strategic questions' },
];

const KIND_LABEL: Record<string, { label: string; badge: string }> = {
  obligation: { label: 'Obligation', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  risk: { label: 'High Risk Trap', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  inconsistency: { label: 'Inconsistency', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  opportunity: { label: 'Safe Harbor', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  unclear: { label: 'Ambiguous Clause', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
};

const providerLabel = (p: LLMProvider): string => PROVIDERS.find((x) => x.id === p)?.label ?? HOSTED_ENTRY.label;

function deskToMarkdown(a: DeskAnalysis): string {
  const h = (t: string) => `## ${t}\n`;
  switch (a.op) {
    case 'simplify': {
      const r = a.result as SimplifyResult;
      return `${h('Executive Bottom Line')}${r.bottomLine}\n\n${h('Core Implications')}${r.overview.map((o) => `- ${o}`).join('\n')}\n\n${h('Parties Affected')}${r.whoAffects}\n\n${h('Plain-Language Glossary')}${r.glossary.map((g) => `- ${g.term}: ${g.means}`).join('\n')}\n`;
    }
    case 'risks': {
      const r = a.result as RisksResult;
      return `${h('Risk Assessment')}${r.bottomLine}\n\n${h('Forensic Findings')}${r.findings.map((f) => `- [${KIND_LABEL[f.kind]?.label ?? f.kind} · Severity ${f.severity}/5] "${f.sentence}" — ${f.note}`).join('\n')}\n`;
    }
    case 'compare': {
      const r = a.result as CompareResult;
      return `${h('Comparative Analysis')}${r.bottomLine}\n\n${h('Material Differences')}${r.differences.map((d) => `- ${d.area}\n  - Version A: ${d.sideA}\n  - Version B: ${d.sideB}\n  - Note: ${d.note}`).join('\n')}\n`;
    }
    case 'ask': {
      const r = a.result as AskResult;
      return `${h('Grounded Answer')}${r.answer}\n${r.evidence ? `\n${h('Contract Evidence')}"${r.evidence}"\n` : ''}\n${h('Confidence')}${r.confidence}\n\n${h('Recommended Next Steps')}${r.nextSteps.map((s) => `- ${s}`).join('\n')}\n`;
    }
    case 'lawyer': {
      const r = a.result as LawyerResult;
      return `${h('Strategic Value')}${r.whyThisMatters}\n\n${h('Questions for Legal Counsel')}${r.questions.map((q) => `- ${q.question}\n  *${q.why}*`).join('\n')}\n\n${h('Required Evidence to Bring')}${r.bringDocuments.map((b) => `- ${b}`).join('\n')}\n`;
    }
  }
}

export function LegalDesk({ onClose, onOpenKeys, page = false }: LegalDeskProps) {
  const km = createKeyManager();
  const [cfg, setCfg] = useState<LLMConfig | null>(null);
  const [op, setOp] = useState<DeskOp>('risks');
  const [sampleId, setSampleId] = useState('consulting');
  const [doc, setDoc] = useState(DESK_SAMPLES[0].text);
  const [docB, setDocB] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DeskAnalysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState<SourceTab>('sample');
  const [bSource, setBSource] = useState<SourceTab>('paste');
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [docAId, setDocAId] = useState<string | null>(null);
  const [docBId, setDocBId] = useState<string | null>(null);
  const [saveTo, setSaveTo] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [reading, setReading] = useState<string[]>(() => loadReadingLog());
  const readCount = reading.length;

  useEffect(() => {
    let active = true;
    void (async () => {
      const c = await km.loadConfig();
      if (active) setCfg(c);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const lib = await createIdbStore().read();
      if (!active || !lib) return;
      setLibrary(lib);
      setSaveTo(lib.files[0]?.id ?? '');
    })();
    return () => {
      active = false;
    };
  }, []);

  const persistLibrary = (next: Library) => {
    setLibrary(next);
    void createIdbStore().write(next);
  };

  const loadInto = (target: 'A' | 'B', d: LibraryDoc) => {
    if (target === 'A') {
      setDoc(d.text);
      setDocAId(d.id);
    } else {
      setDocB(d.text);
      setDocBId(d.id);
    }
    setSaved(false);
  };

  const saveIntoLibrary = () => {
    const target = saveTo || library.files[0]?.id;
    if (!target || !doc.trim()) return;
    const existing = docAId ? findDoc(docAId, library) : null;
    const name = existing?.name ?? (doc.slice(0, 32).trim() || 'Audited Contract');
    const updated = addDoc(target, { name, text: doc, kind: 'text', bytes: new Blob([doc]).size }, library);
    persistLibrary(updated);
    setSaved(true);
  };

  const pickSample = (id: string) => {
    setSampleId(id);
    const s = DESK_SAMPLES.find((x) => x.id === id);
    if (s) {
      setDoc(s.text);
      setDocAId(null);
      setSaved(false);
    }
  };

  const run = async () => {
    if (!doc.trim()) {
      setError('Please provide text or upload a document to analyze.');
      return;
    }
    if (op === 'compare' && !docB.trim()) {
      setError('Version B is required for a comparative diff.');
      return;
    }
    if (op === 'ask' && !question.trim()) {
      setError('Please type a question about this document.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      let analysisResult: DeskResult;
      let origin: 'genai' | 'local' = 'local';
      if (cfg && cfg.apiKey) {
        spendCredits(CREDIT_COSTS.deskOp);
        analysisResult = await genDeskAnalysis(cfg, op, doc, {
          docB: op === 'compare' ? docB : undefined,
          question: op === 'ask' ? question : undefined,
        });
        origin = 'genai';
      } else {
        analysisResult = localDeskAnalysis(op, doc, {
          docB: op === 'compare' ? docB : undefined,
          question: op === 'ask' ? question : undefined,
        });
      }
      const fullAnalysis: DeskAnalysis = {
        op,
        origin,
        provider: cfg?.provider,
        result: analysisResult,
      };
      setAnalysis(fullAnalysis);
      const k = docKey(doc);
      if (k) {
        const next = recordUnderstood(reading, k);
        if (next !== reading) {
          setReading(next);
          saveReadingLog(next);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Document analysis failed.');
    } finally {
      setBusy(false);
    }
  };

  const exportMd = async (mode: 'copy' | 'share' | 'download') => {
    if (!analysis) return;
    const md = deskToMarkdown(analysis);
    if (mode === 'copy') {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (mode === 'download') {
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overrool-${analysis.op}-audit.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (mode === 'share' && navigator.share) {
      try {
        await navigator.share({
          title: `Overrool — ${analysis.op} Risk Audit`,
          text: md,
        });
      } catch {
        // User aborted share sheet
      }
    }
  };

  const met = creditsToday();
  const r = analysis?.result;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-950/60 p-3 sm:p-5 backdrop-blur-md selection:bg-blue-200 selection:text-slate-950 font-sans ${page ? 'relative p-0' : ''}`}>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl">
        {/* ── Top Header Strip ────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-serif font-bold text-lg shadow-sm">
              §
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900">
                Overrool Legal Risk Workbench
              </h2>
              <p className="font-sans text-xs text-slate-500">
                Plain language translation · Hidden risk audit · Version diff · Grounded precedent Q&amp;A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenKeys}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
            >
              {cfg ? providerLabel(cfg.provider) : 'Keyless (Local Private Engine)'}
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-900 hover:bg-slate-800 px-4 py-1.5 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
              aria-label={page ? 'Back' : 'Close legal desk'}
            >
              {page ? '← Back' : 'Close ✕'}
            </button>
          </div>
        </header>

        {/* ── Main Workbench Grid ────────────────────────────────── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
          {/* Left Column: Input & Options */}
          <div className="flex min-h-0 flex-col gap-4">
            <Docketling documentsUnderstood={readCount} />

            {/* Operation Tabs with Clear Benefit Descriptions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OPS.map((o) => {
                const active = op === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOp(o.id)}
                    className={`rounded-2xl p-2.5 text-left transition-all cursor-pointer border flex flex-col justify-between ${
                      active
                        ? 'border-blue-600 bg-blue-50/90 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-sans text-xs font-extrabold ${active ? 'text-blue-950' : 'text-slate-900'}`}>
                      {o.label}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {o.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Source Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex gap-1.5">
                {SOURCES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    className={`rounded-full px-3 py-1 font-sans text-xs font-bold transition-all cursor-pointer ${
                      source === s.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {libraryStats(library).docs} docs in local vault
              </span>
            </div>

            {/* Source Editor Panels */}
            {source === 'paste' && (
              <textarea
                value={doc}
                onChange={(e) => {
                  setDoc(e.target.value);
                  setDocAId(null);
                }}
                placeholder="Paste contract, NDA, lease clause, SaaS terms, or legal excerpt here…"
                className="min-h-[190px] flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            )}

            {source === 'upload' && (
              <div className="flex-1">
                <DocumentIngest
                  onLoaded={(d) => {
                    setDoc(d.text);
                    setDocAId(null);
                    setSource('paste');
                  }}
                />
                {docAId && <p className="mt-2 font-mono text-[11px] text-slate-500">Loaded from local encrypted library.</p>}
              </div>
            )}

            {source === 'library' && (
              <div className="flex-1">
                <DocumentLibraryPanel library={library} persist={persistLibrary} onPick={(d) => loadInto('A', d)} pickedId={docAId} />
                <p className="mt-2 font-mono text-[10px] text-slate-400">
                  Client-side encrypted local vault. Never transmitted to third-party cloud servers.
                </p>
              </div>
            )}

            {source === 'sample' && (
              <div className="flex-1 space-y-2">
                <select
                  value={sampleId}
                  onChange={(e) => pickSample(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-sans text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {DESK_SAMPLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={doc}
                  readOnly
                  className="min-h-[150px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-700"
                />
              </div>
            )}

            {/* Save to library row */}
            {library.files.length > 0 && source !== 'library' && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-sans text-xs font-bold text-slate-600">Vault Target:</span>
                <select
                  value={saveTo}
                  onChange={(e) => setSaveTo(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans text-xs text-slate-800 focus:outline-none"
                >
                  {library.files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveIntoLibrary}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  {saved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
            )}

            {/* Compare doc B panel */}
            {op === 'compare' && (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">Version B</span>
                  {(['paste', 'upload', 'library'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBSource(t)}
                      className={`rounded-full px-2.5 py-0.5 font-sans text-[10px] font-bold ${
                        bSource === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {docBId && (
                    <button onClick={() => setBSource('library')} className="ml-auto">
                      <DocChip name={findDoc(docBId, library)?.name ?? 'document'} kind={findDoc(docBId, library)?.kind ?? 'text'} />
                    </button>
                  )}
                </div>
                {bSource === 'paste' && (
                  <textarea
                    value={docB}
                    onChange={(e) => {
                      setDocB(e.target.value);
                      setDocBId(null);
                    }}
                    placeholder="Paste the revised or counterparty Version B to compare…"
                    className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-900"
                  />
                )}
                {bSource === 'upload' && (
                  <DocumentIngest
                    label="Upload Version B"
                    onLoaded={(d) => {
                      setDocB(d.text);
                      setDocBId(null);
                      setBSource('paste');
                    }}
                  />
                )}
                {bSource === 'library' && (
                  <DocumentLibraryPanel
                    library={library}
                    persist={persistLibrary}
                    onPick={(d) => {
                      loadInto('B', d);
                      setBSource('paste');
                    }}
                    target="B"
                    pickedId={docBId}
                  />
                )}
              </div>
            )}

            {/* Ask text question */}
            {op === 'ask' && (
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void run()}
                placeholder="Ask any specific question (e.g. Is there an uncapped indemnity or auto-renewal?)…"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-sans text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            )}

            {/* Run Action Button */}
            <button
              onClick={() => void run()}
              disabled={busy}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 py-3.5 px-6 font-sans text-sm font-bold text-white shadow-md hover:scale-101 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {busy
                ? `Executing Forensic Audit${cfg ? '' : ' (Local Private Engine)'}…`
                : `Run Forensic Audit with ${cfg ? providerLabel(cfg.provider) : 'Local Rules Analyst'}`}
            </button>

            <p className="font-mono text-[11px] leading-relaxed text-slate-500 text-center">
              Daily Credits: <span className="text-slate-900 font-bold">{met.used} / {met.cap}</span> · 100% In-Browser Privacy
            </p>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Analysis Output & Hand-Off */}
          <div className="flex min-h-0 flex-col gap-4">
            {analysis && r && (
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-sans text-xs font-bold">
                  {analysis.origin === 'genai' ? `Cloud Neural · ${analysis.provider ?? 'Model'}` : 'Private Native Intelligence · 100% On-Device'}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => void exportMd('copy')}
                    aria-label="Copy analysis as markdown"
                    className="rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1 font-sans text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                  <button
                    onClick={() => void exportMd('download')}
                    aria-label="Download analysis as markdown"
                    className="rounded-full bg-slate-900 hover:bg-slate-800 px-3.5 py-1 font-sans text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Download .md
                  </button>
                </div>
              </div>
            )}

            <div className="min-h-[280px] flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50/50 p-5">
              {!analysis && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400 py-16">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-serif font-bold text-2xl shadow-sm">
                    §
                  </div>
                  <div>
                    <p className="font-display text-base font-extrabold text-slate-800">Workbench Standing By</p>
                    <p className="max-w-xs text-xs text-slate-500 mt-1">
                      Choose an operation and run analysis. Findings can be copied or downloaded as a court-ready consultation pack.
                    </p>
                  </div>
                </div>
              )}

              {/* Simplify View */}
              {analysis?.op === 'simplify' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                    <span className="inline-block rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold mb-2">Executive Summary</span>
                    <p className="text-xs sm:text-sm font-bold text-blue-950 leading-relaxed">
                      {(r as SimplifyResult).bottomLine}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-sans text-xs font-bold text-slate-900">
                      Core Implications
                    </h4>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-slate-700">
                      {(r as SimplifyResult).overview.map((o, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-1 font-sans text-xs font-bold text-slate-900">
                      Who It Affects
                    </h4>
                    <p className="text-xs text-slate-600">{(r as SimplifyResult).whoAffects}</p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-sans text-xs font-bold text-slate-900">
                      Plain-Language Legal Glossary
                    </h4>
                    <div className="space-y-2">
                      {(r as SimplifyResult).glossary.map((g, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-2xs">
                          <span className="font-bold text-blue-700">{g.term}</span> — {g.means}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Risks View */}
              {analysis?.op === 'risks' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                    <span className="inline-block rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-[10px] font-bold mb-2">Risk Assessment</span>
                    <p className="text-xs sm:text-sm font-bold text-rose-950 leading-relaxed">
                      {(r as RisksResult).bottomLine}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {(r as RisksResult).findings.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl border p-4 bg-white shadow-2xs ${
                          f.severity >= 4 ? 'border-rose-300 ring-1 ring-rose-300/40' : 'border-slate-200'
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${KIND_LABEL[f.kind]?.badge ?? 'bg-slate-100 text-slate-700'}`}>
                            {KIND_LABEL[f.kind]?.label ?? f.kind}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            Severity {f.severity}/5
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">“{f.sentence}”</p>
                        <p className="mt-1 text-xs text-slate-600">{f.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compare View */}
              {analysis?.op === 'compare' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                    <span className="inline-block rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold mb-2">Comparison Summary</span>
                    <p className="text-xs sm:text-sm font-bold text-blue-950 leading-relaxed">
                      {(r as CompareResult).bottomLine}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(r as CompareResult).differences.map((d, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <span className="inline-block rounded-full bg-slate-100 text-slate-800 px-2.5 py-0.5 text-[10px] font-bold mb-2">{d.area}</span>
                        <div className="grid gap-2 text-xs">
                          <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-200">
                            <span className="font-bold text-emerald-800">Version A: </span>
                            <span className="text-slate-800">{d.sideA}</span>
                          </div>
                          <div className="rounded-xl bg-rose-50 p-2.5 border border-rose-200">
                            <span className="font-bold text-rose-800">Version B: </span>
                            <span className="text-slate-800">{d.sideB}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 italic">{d.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask View */}
              {analysis?.op === 'ask' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <span className="inline-block rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold mb-2">Grounded Answer</span>
                    <p className="text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed">
                      {(r as AskResult).answer}
                    </p>
                  </div>
                  {(r as AskResult).evidence && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5">
                      <span className="font-mono text-[10px] font-bold text-amber-800 block mb-1">Textual Proof:</span>
                      <p className="text-xs italic text-amber-950">“{(r as AskResult).evidence}”</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-bold text-slate-500">Confidence:</span>
                    <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">{(r as AskResult).confidence}</span>
                  </div>
                  <div>
                    <h4 className="mb-1.5 font-sans text-xs font-bold text-slate-900">
                      Recommended Next Steps
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(r as AskResult).nextSteps.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Lawyer View */}
              {analysis?.op === 'lawyer' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                    <span className="inline-block rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold mb-2">Strategic Context</span>
                    <p className="text-xs sm:text-sm font-bold text-blue-950 leading-relaxed">
                      {(r as LawyerResult).whyThisMatters}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-sans text-xs font-bold text-slate-900">
                      Questions for Legal Counsel
                    </h4>
                    <div className="space-y-2.5">
                      {(r as LawyerResult).questions.map((q, i) => (
                        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <p className="text-xs font-bold text-slate-900">{q.question}</p>
                          <p className="mt-1 text-xs text-slate-600"><span className="text-blue-600 font-bold">Why:</span> {q.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1.5 font-sans text-xs font-bold text-slate-900">
                      Documents &amp; Evidence to Bring
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(r as LawyerResult).bringDocuments.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}