import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Copy, Download, KeyRound, Landmark, Loader2, Save, Share2, Sparkles, X, FileText, ShieldAlert, GitCompare, FileSearch, Gavel } from 'lucide-react';
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
  { id: 'sample', label: 'Samples' },
];

const OPS: { id: DeskOp; label: string; icon: typeof FileText }[] = [
  { id: 'simplify', label: 'Plain Language', icon: FileText },
  { id: 'risks', label: 'Risk & Traps', icon: ShieldAlert },
  { id: 'compare', label: 'Version Diff', icon: GitCompare },
  { id: 'ask', label: 'Ask Document', icon: FileSearch },
  { id: 'lawyer', label: 'Counsel Prep', icon: Gavel },
];

const KIND_LABEL: Record<string, { label: string; badge: string }> = {
  obligation: { label: 'Obligation', badge: 'm3-chip-cyan' },
  risk: { label: 'High Risk', badge: 'm3-chip-rose' },
  inconsistency: { label: 'Inconsistency', badge: 'm3-chip-primary' },
  opportunity: { label: 'Opportunity', badge: 'm3-chip-emerald' },
  unclear: { label: 'Ambiguous', badge: 'm3-chip-lavender' },
};

const providerLabel = (p: LLMProvider): string => PROVIDERS.find((x) => x.id === p)?.label ?? HOSTED_ENTRY.label;

function deskToMarkdown(a: DeskAnalysis): string {
  const h = (t: string) => `## ${t}\n`;
  switch (a.op) {
    case 'simplify': {
      const r = a.result as SimplifyResult;
      return `${h('Bottom line')}${r.bottomLine}\n\n${h('What this means')}${r.overview.map((o) => `- ${o}`).join('\n')}\n\n${h('Who it affects')}${r.whoAffects}\n\n${h('Plain-language glossary')}${r.glossary.map((g) => `- ${g.term}: ${g.means}`).join('\n')}\n`;
    }
    case 'risks': {
      const r = a.result as RisksResult;
      return `${h('Read of the document')}${r.bottomLine}\n\n${h('Findings')}${r.findings.map((f) => `- [${KIND_LABEL[f.kind]?.label ?? f.kind} · severity ${f.severity}/5] "${f.sentence}" — ${f.note}`).join('\n')}\n`;
    }
    case 'compare': {
      const r = a.result as CompareResult;
      return `${h('Which version wins')}${r.bottomLine}\n\n${h('Material differences')}${r.differences.map((d) => `- ${d.area}\n  - A: ${d.sideA}\n  - B: ${d.sideB}\n  - Note: ${d.note}`).join('\n')}\n`;
    }
    case 'ask': {
      const r = a.result as AskResult;
      return `${h('Answer')}${r.answer}\n${r.evidence ? `\n${h('On the record')}"${r.evidence}"\n` : ''}\n${h('Confidence')}${r.confidence}\n\n${h('Next steps')}${r.nextSteps.map((s) => `- ${s}`).join('\n')}\n`;
    }
    case 'lawyer': {
      const r = a.result as LawyerResult;
      return `${h('Why this matters')}${r.whyThisMatters}\n\n${h('Questions for your lawyer')}${r.questions.map((q) => `- ${q.question}\n  *${q.why}*`).join('\n')}\n\n${h('Bring along')}${r.bringDocuments.map((b) => `- ${b}`).join('\n')}\n`;
    }
  }
}

export function LegalDesk({ onClose, onOpenKeys, page = false }: LegalDeskProps) {
  const km = createKeyManager();
  const [cfg, setCfg] = useState<LLMConfig | null>(null);
  const [op, setOp] = useState<DeskOp>('simplify');
  const [sampleId, setSampleId] = useState('consulting');
  const [doc, setDoc] = useState(DESK_SAMPLES[0].text);
  const [docB, setDocB] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DeskAnalysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState<SourceTab>('paste');
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
    const name = existing?.name ?? (doc.slice(0, 32).trim() || 'Untitled Note');
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
      a.download = `overrool-${analysis.op}-analysis.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (mode === 'share' && navigator.share) {
      try {
        await navigator.share({
          title: `Overrool — ${analysis.op} Analysis`,
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
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-950/85 p-3 backdrop-blur-md ${page ? 'relative p-0' : ''}`}>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl">
        {/* ── Top Header Strip ────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-md">
              <Landmark className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Overrool Legal Workbench
              </h2>
              <p className="font-sans text-xs text-slate-400">
                Plain language · Risk audit · Redline diff · Grounded Q&amp;A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenKeys}
              className="m3-btn m3-btn-tonal px-3.5 py-1.5 text-xs text-slate-300"
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
              {cfg ? providerLabel(cfg.provider) : 'Keyless (Local Engine)'}
            </button>
            <button
              onClick={onClose}
              className="m3-btn m3-btn-tonal h-9 w-9 p-0 text-slate-300 hover:text-white"
              aria-label={page ? 'Back' : 'Close legal desk'}
            >
              {page ? <ChevronLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* ── Main Workbench Grid ────────────────────────────────── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
          {/* Left Column: Input & Options */}
          <div className="flex min-h-0 flex-col gap-4">
            <Docketling documentsUnderstood={readCount} />

            {/* Operation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OPS.map((o) => {
                const Icon = o.icon;
                const active = op === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOp(o.id)}
                    className={`m3-btn py-2 px-3 text-xs gap-1.5 justify-start ${
                      active ? 'm3-btn-primary' : 'm3-btn-tonal text-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{o.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Source Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex gap-1.5">
                {SOURCES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    className={`rounded-full border px-3 py-1 font-mono text-[10px] font-medium transition-all ${
                      source === s.id
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                        : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                {libraryStats(library).docs} items in vault
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
                placeholder="Paste contract, NDA, lease clause, privacy policy, or legal excerpt here…"
                className="m3-input min-h-[190px] flex-1 resize-none font-mono text-xs leading-relaxed"
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
                {docAId && <p className="mt-2 font-mono text-[11px] text-slate-400">Loaded from local library.</p>}
              </div>
            )}

            {source === 'library' && (
              <div className="flex-1">
                <DocumentLibraryPanel library={library} persist={persistLibrary} onPick={(d) => loadInto('A', d)} pickedId={docAId} />
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  Client-side encrypted local vault. Never transmitted to Overrool servers.
                </p>
              </div>
            )}

            {source === 'sample' && (
              <div className="flex-1 space-y-2">
                <select
                  value={sampleId}
                  onChange={(e) => pickSample(e.target.value)}
                  className="m3-input font-mono text-xs"
                >
                  {DESK_SAMPLES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={doc}
                  readOnly
                  className="m3-input min-h-[150px] w-full resize-none font-mono text-xs text-slate-300"
                />
              </div>
            )}

            {/* Save to library row */}
            {library.files.length > 0 && source !== 'library' && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-3">
                <span className="font-mono text-[10px] text-slate-400">Vault Target:</span>
                <select
                  value={saveTo}
                  onChange={(e) => setSaveTo(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-1 font-mono text-xs text-white"
                >
                  {library.files.map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveIntoLibrary}
                  className="m3-btn m3-btn-emerald px-3.5 py-1 text-xs"
                >
                  {saved ? <Check className="mr-1 h-3 w-3" /> : <Save className="mr-1 h-3 w-3" />}
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            )}

            {/* Compare doc B panel */}
            {op === 'compare' && (
              <div className="space-y-2 m3-card p-4">
                <div className="flex items-center gap-2">
                  <span className="m3-chip m3-chip-primary text-[8px]">Version B</span>
                  {(['paste', 'upload', 'library'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBSource(t)}
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] ${
                        bSource === t ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white'
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
                    placeholder="Paste the revised/opposing version B to compare…"
                    className="m3-input min-h-[100px] font-mono text-xs"
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
                placeholder="Ask any specific question about this document (e.g. Can I terminate early?)…"
                className="m3-input text-xs font-mono"
              />
            )}

            {/* Run Action Button */}
            <button
              onClick={() => void run()}
              disabled={busy}
              className="m3-btn m3-btn-primary w-full py-3.5 text-sm font-semibold"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {busy
                ? `Executing Analysis${cfg ? '' : ' (Local Engine)'}…`
                : `Run Analysis with ${cfg ? providerLabel(cfg.provider) : 'Local Rules Analyst'}`}
            </button>

            <p className="font-mono text-[10px] leading-relaxed text-slate-400">
              Daily Credits: <span className="text-amber-300 font-semibold">{met.used} / {met.cap}</span> · Model analysis costs {CREDIT_COSTS.deskOp} credits · Local Rules run free
            </p>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/70 p-3.5 text-xs text-rose-200">
                <p className="font-semibold">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Analysis Output & Hand-Off */}
          <div className="flex min-h-0 flex-col gap-4">
            {analysis && r && (
              <div className="flex items-center justify-between gap-2">
                <span className={`m3-chip ${analysis.origin === 'genai' ? 'm3-chip-primary' : 'm3-chip-emerald'} text-[10px]`}>
                  {analysis.origin === 'genai' ? `Cloud Neural · ${analysis.provider ?? 'Model'}` : 'Private Native Intelligence · On-Device'}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => void exportMd('copy')}
                    aria-label="Copy analysis as markdown"
                    className="m3-btn m3-btn-tonal h-8 w-8 p-0"
                    title="Copy Markdown"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => void exportMd('share')}
                    aria-label="Share analysis"
                    className="m3-btn m3-btn-tonal h-8 w-8 p-0"
                    title="Share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void exportMd('download')}
                    aria-label="Download analysis as markdown"
                    className="m3-btn m3-btn-tonal h-8 w-8 p-0"
                    title="Download Markdown"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="min-h-[260px] flex-1 overflow-y-auto m3-card p-5">
              {!analysis && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400 py-12">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-md">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-white">Workbench Standing By</p>
                    <p className="max-w-xs text-xs text-slate-400 mt-1">
                      Choose an operation and run analysis. Findings can be copied or downloaded as a consultation pack.
                    </p>
                  </div>
                </div>
              )}

              {/* Simplify View */}
              {analysis?.op === 'simplify' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <span className="m3-chip m3-chip-primary text-[8px] mb-2">Bottom Line</span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {(r as SimplifyResult).bottomLine}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-sans text-xs font-semibold text-amber-200">
                      Core Implications
                    </h4>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-slate-200">
                      {(r as SimplifyResult).overview.map((o, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-300 font-bold">•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-1 font-sans text-xs font-semibold text-amber-200">
                      Who It Affects
                    </h4>
                    <p className="text-xs text-slate-300">{(r as SimplifyResult).whoAffects}</p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-sans text-xs font-semibold text-amber-200">
                      Plain-Language Legal Glossary
                    </h4>
                    <div className="space-y-2">
                      {(r as SimplifyResult).glossary.map((g, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200">
                          <span className="font-bold text-amber-300">{g.term}</span> — {g.means}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Risks View */}
              {analysis?.op === 'risks' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4">
                    <span className="m3-chip m3-chip-rose text-[8px] mb-2">Assessment</span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {(r as RisksResult).bottomLine}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {(r as RisksResult).findings.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl border p-3.5 ${
                          f.severity >= 4 ? 'bg-rose-950/30 border-rose-500/40' : 'bg-slate-950/60 border-white/10'
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className={`m3-chip ${KIND_LABEL[f.kind]?.badge ?? 'm3-chip'} text-[8px]`}>
                            {KIND_LABEL[f.kind]?.label ?? f.kind}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Severity {f.severity}/5
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white">“{f.sentence}”</p>
                        <p className="mt-1 text-xs text-slate-300">{f.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compare View */}
              {analysis?.op === 'compare' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-sky-400/30 bg-sky-950/30 p-4">
                    <span className="m3-chip m3-chip-cyan text-[8px] mb-2">Comparison Summary</span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {(r as CompareResult).bottomLine}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(r as CompareResult).differences.map((d, i) => (
                      <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5">
                        <span className="m3-chip m3-chip-primary text-[8px] mb-2">{d.area}</span>
                        <div className="grid gap-2 text-xs">
                          <div className="rounded-xl bg-slate-900/80 p-2.5 border border-white/5">
                            <span className="font-bold text-emerald-300">Version A: </span>
                            <span className="text-slate-200">{d.sideA}</span>
                          </div>
                          <div className="rounded-xl bg-slate-900/80 p-2.5 border border-white/5">
                            <span className="font-bold text-rose-300">Version B: </span>
                            <span className="text-slate-200">{d.sideB}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-400 italic">{d.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask View */}
              {analysis?.op === 'ask' && r && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4">
                    <span className="m3-chip m3-chip-emerald text-[8px] mb-2">Grounded Answer</span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {(r as AskResult).answer}
                    </p>
                  </div>
                  {(r as AskResult).evidence && (
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-3.5">
                      <span className="font-mono text-[9px] font-semibold text-amber-300 block mb-1">Textual Proof:</span>
                      <p className="text-xs italic text-amber-100">“{(r as AskResult).evidence}”</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">Confidence:</span>
                    <span className="m3-chip m3-chip-primary text-[8px]">{(r as AskResult).confidence}</span>
                  </div>
                  <div>
                    <h4 className="mb-1.5 font-sans text-xs font-semibold text-amber-200">
                      Recommended Next Steps
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {(r as AskResult).nextSteps.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-300 font-bold">•</span>
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
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <span className="m3-chip m3-chip-primary text-[8px] mb-2">Strategic Context</span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {(r as LawyerResult).whyThisMatters}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-sans text-xs font-semibold text-amber-200">
                      Questions for Legal Counsel
                    </h4>
                    <div className="space-y-2.5">
                      {(r as LawyerResult).questions.map((q, i) => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5">
                          <p className="text-xs font-bold text-white">{q.question}</p>
                          <p className="mt-1 text-xs text-slate-300"><span className="text-amber-300 font-semibold">Why:</span> {q.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1.5 font-sans text-xs font-semibold text-amber-200">
                      Documents &amp; Evidence to Bring
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {(r as LawyerResult).bringDocuments.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-300 font-bold">•</span>
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