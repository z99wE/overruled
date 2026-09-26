import { useEffect, useState } from 'react';
import { Check, Copy, Download, KeyRound, Landmark, Loader2, Save, Share2, X } from 'lucide-react';
import type { LLMConfig, LLMProvider } from '../types/legal';
import { PROVIDERS, HOSTED_ENTRY, createKeyManager } from '../core/storage';
import type { AskResult, CompareResult, DeskAnalysis, DeskOp, LawyerResult, RisksResult, SimplifyResult } from '../core/docEngine';
import { genDeskAnalysis, localDeskAnalysis } from '../core/docEngine';
import { DESK_SAMPLES } from '../core/deskSamples';
import { CREDIT_COSTS, creditsToday, spendCredits } from '../core/meter';
import type { Library, LibraryDoc } from '../core/library';
import { addDoc, createIdbStore, emptyLibrary, findDoc, libraryStats } from '../core/library';
import { DocumentIngest, DocChip } from './DocumentIngest';
import { DocumentLibraryPanel } from './DocumentLibraryPanel';

interface LegalDeskProps {
  onClose: () => void;
  onOpenKeys: () => void;
}

type SourceTab = 'paste' | 'upload' | 'library' | 'sample';

const SOURCES: { id: SourceTab; label: string }[] = [
  { id: 'paste', label: 'Paste' },
  { id: 'upload', label: 'Upload' },
  { id: 'library', label: 'My documents' },
  { id: 'sample', label: 'Samples' },
];

const OPS: { id: DeskOp; label: string }[] = [
  { id: 'simplify', label: 'Simplify' },
  { id: 'risks', label: 'Risks & obligations' },
  { id: 'compare', label: 'Compare' },
  { id: 'ask', label: 'Ask the text' },
  { id: 'lawyer', label: 'For your lawyer' },
];

const KIND_LABEL: Record<string, string> = {
  obligation: 'Obligation',
  risk: 'Risk',
  inconsistency: 'Inconsistency',
  opportunity: 'Opportunity',
  unclear: 'Unclear',
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
      return `${h('Read of the document')}${r.bottomLine}\n\n${h('Findings')}${r.findings.map((f) => `- [${KIND_LABEL[f.kind] ?? f.kind} · severity ${f.severity}/5] "${f.sentence}" — ${f.note}`).join('\n')}\n`;
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

export function LegalDesk({ onClose, onOpenKeys }: LegalDeskProps) {
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
    const name = existing?.name ?? (source === 'upload' ? 'Uploaded document' : 'Pasted document');
    if (existing) {
      // already in the library — just make sure it is linked to the chosen case file
      if (!library.files.find((f) => f.id === target)?.docIds.includes(existing.id)) {
        persistLibrary(addDoc(target, { name, kind: existing.kind, text: doc.trim(), bytes: existing.bytes }, library));
      }
    } else {
      persistLibrary(addDoc(target, { name, kind: 'text', text: doc.trim(), bytes: doc.trim().length }, library));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const pickSample = (id: string) => {
    const s = DESK_SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setSampleId(id);
    setDoc(s.text);
    setDocAId(null);
  };

  const run = async () => {
    if (!doc.trim()) {
      setError('Paste a legal document to analyse.');
      return;
    }
    if (op === 'compare' && !docB.trim()) {
      setError('Paste the second document to compare against.');
      return;
    }
    if (op === 'ask' && !question.trim()) {
      setError('Type your question.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (cfg) {
        const spend = spendCredits(CREDIT_COSTS.deskOp);
        if (!spend.ok) {
          setError(`Daily credit limit reached (${spend.used}/${spend.cap} used). The Local Rules Analyst still runs free — or try again tomorrow.`);
          return;
        }
        const result = await genDeskAnalysis(cfg, op, doc.trim(), op === 'compare' ? { docB: docB.trim() } : op === 'ask' ? { question: question.trim() } : undefined);
        setAnalysis({ op, origin: 'genai', provider: providerLabel(cfg.provider), result });
      } else {
        setAnalysis({ op, origin: 'local', result: localDeskAnalysis(op, doc.trim(), op === 'compare' ? { docB: docB.trim() } : op === 'ask' ? { question: question.trim() } : undefined) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const exportMd = async (mode: 'copy' | 'download' | 'share') => {
    if (!analysis) return;
    const md = `# Legal Desk — ${analysis.op}\n\n*Analysed ${analysis.origin === 'genai' ? `by ${analysis.provider ?? 'your model'}` : 'by the Local Rules Analyst (keyless)'}. Educational assistance, not legal advice.*\n\n${deskToMarkdown(analysis)}`;
    if (mode === 'copy') {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      return;
    }
    if (mode === 'share' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Legal Desk analysis', text: md });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-desk-${analysis.op}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const r = analysis?.result;
  const met = creditsToday();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="flex h-[min(88vh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-ink bg-felt-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink bg-felt-800 px-5 py-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-dgold" />
            <div>
              <h2 className="font-display text-lg font-bold tracking-wide text-cream">The Legal Desk</h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50">Simplify · risks · compare · ask · prepare for your lawyer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenKeys}
              className="flex items-center gap-1.5 rounded-lg border border-ink bg-felt-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cream/80 transition hover:bg-felt-600"
            >
              <KeyRound className="h-3.5 w-3.5 text-dgold" />
              {cfg ? providerLabel(cfg.provider) : 'No key'}
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-cream/60 transition hover:bg-felt-700 hover:text-cream" aria-label="Close legal desk">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {OPS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOp(o.id)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                    op === o.id ? 'btn-gold text-ink' : 'border border-ink bg-felt-800 text-cream/75 hover:bg-felt-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                    source === s.id ? 'bg-dgold/20 text-dgold ring-1 ring-dgold/40' : 'text-cream/45 hover:text-cream'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="ml-auto self-center font-mono text-[10px] text-cream/30">
                {libraryStats(library).docs} saved
              </span>
            </div>

            {source === 'paste' && (
              <textarea
                value={doc}
                onChange={(e) => {
                  setDoc(e.target.value);
                  setDocAId(null);
                }}
                placeholder="Paste a contract, policy, lease, judgement excerpt, or terms page here…"
                className="min-h-[180px] flex-1 resize-none rounded-xl border border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream placeholder:text-cream/30 focus:border-dgold focus:outline-none"
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
                {docAId && <p className="mt-2 text-[12px] text-cream/50">Loaded from your library.</p>}
              </div>
            )}

            {source === 'library' && (
              <div className="flex-1">
                <DocumentLibraryPanel library={library} persist={persistLibrary} onPick={(d) => loadInto('A', d)} pickedId={docAId} />
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-cream/35">
                  Stored on this device only — in your browser, never uploaded. Clearing site data removes it.
                </p>
              </div>
            )}

            {source === 'sample' && (
              <div className="flex-1 space-y-2">
                <select
                  value={sampleId}
                  onChange={(e) => pickSample(e.target.value)}
                  className="w-full rounded-lg border border-ink bg-felt-800 px-2 py-1.5 text-[13px] text-cream focus:border-dgold focus:outline-none"
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
                  className="min-h-[140px] w-full resize-none rounded-xl border border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream/80 focus:border-dgold focus:outline-none"
                />
              </div>
            )}

            {library.files.length > 0 && source !== 'library' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-cream/40">Save to</span>
                <select
                  value={saveTo}
                  onChange={(e) => setSaveTo(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-ink bg-felt-800 px-2 py-1 text-[12px] text-cream focus:border-dgold focus:outline-none"
                >
                  {library.files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveIntoLibrary}
                  className="flex items-center gap-1 rounded-lg border border-ink bg-felt-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cream/70 transition hover:bg-felt-700 hover:text-cream"
                >
                  {saved ? <Check className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            )}

            {op === 'compare' && (
              <div className="space-y-2 rounded-xl border border-ink/60 bg-ink/20 p-2">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cream/40">Version B</span>
                  {(['paste', 'upload', 'library'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBSource(t)}
                      className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider transition ${
                        bSource === t ? 'bg-dgold/20 text-dgold' : 'text-cream/40 hover:text-cream'
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
                    placeholder="Paste the second document to compare…"
                    className="min-h-[100px] w-full resize-none rounded-xl border border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream placeholder:text-cream/30 focus:border-dgold focus:outline-none"
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

            {op === 'ask' && (
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void run()}
                placeholder="Your question about this document…"
                className="rounded-xl border border-ink bg-felt-800 px-3 py-2.5 text-[13px] text-cream placeholder:text-cream/30 focus:border-dgold focus:outline-none"
              />
            )}

            <button onClick={() => void run()} disabled={busy} className="btn-gold flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-ink disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
              {busy ? `Analysing${cfg ? '' : ' with Local Rules'}…` : `Analyse with ${cfg ? providerLabel(cfg.provider) : 'Local Rules Analyst'}`}
            </button>

            <p className="font-mono text-[10px] leading-relaxed text-cream/40">
              Daily credits: <span className="text-cream/70">{met.used} / {met.cap} used</span> · model analysis costs {CREDIT_COSTS.deskOp} credits · resets at midnight UTC · Local Rules runs free
            </p>

            {error && (
              <p className="rounded-lg border border-poker-red/40 bg-poker-red-deep/30 px-3 py-2 text-[13px] text-poker-red">{error}</p>
            )}

            <p className="font-mono text-[10px] leading-relaxed text-cream/40">
              Your text is read in-browser. With a key, it goes direct to your chosen model provider (or Overrool's hosted
              bench for admins) — never into a product datastore. No key: the deterministic Local Rules Analyst stands in,
              clearly labeled.
            </p>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            {analysis && r && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                      analysis.origin === 'genai' ? 'bg-dgold/15 text-dgold ring-1 ring-dgold/40' : 'bg-cream/10 text-cream/60 ring-1 ring-cream/20'
                    }`}
                  >
                    {analysis.origin === 'genai' ? `GenAI · ${analysis.provider ?? 'model'}` : 'Local Rules Analyst · no key'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => void exportMd('copy')} aria-label="Copy analysis as markdown" className="rounded-lg border border-ink bg-felt-800 p-2 text-cream/70 transition hover:bg-felt-700 hover:text-cream" title="Copy as markdown">
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button onClick={() => void exportMd('share')} aria-label="Share analysis" className="rounded-lg border border-ink bg-felt-800 p-2 text-cream/70 transition hover:bg-felt-700 hover:text-cream" title="Share">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => void exportMd('download')} aria-label="Download analysis as markdown" className="rounded-lg border border-ink bg-felt-800 p-2 text-cream/70 transition hover:bg-felt-700 hover:text-cream" title="Download markdown">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="min-h-[240px] flex-1 overflow-y-auto rounded-xl border border-ink bg-felt-800 p-4">
              {!analysis && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-cream/40">
                  <Landmark className="h-8 w-8 text-cream/20" />
                  <p className="max-w-xs text-[13px]">
                    Run any operation on a legal document in plain language. Findings export as markdown you can hand to a
                    lawyer.
                  </p>
                </div>
              )}

              {analysis?.op === 'simplify' && r && (
                <div className="space-y-3">
                  <p className="rounded-xl bg-ink/40 p-3 text-[14px] font-medium leading-relaxed text-cream">{(r as SimplifyResult).bottomLine}</p>
                  <div>
                    <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">What this means</h4>
                    <ul className="space-y-1 text-[13px] leading-relaxed text-cream/85">
                      {(r as SimplifyResult).overview.map((o, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-dgold">•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">Who it affects</h4>
                    <p className="text-[13px] text-cream/85">{(r as SimplifyResult).whoAffects}</p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">Plain-language glossary</h4>
                    <div className="space-y-1">
                      {(r as SimplifyResult).glossary.map((g, i) => (
                        <p key={i} className="text-[13px] text-cream/85">
                          <span className="font-semibold text-cream">{g.term}</span> — {g.means}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {analysis?.op === 'risks' && r && (
                <div className="space-y-3">
                  <p className="rounded-xl bg-ink/40 p-3 text-[14px] font-medium leading-relaxed text-cream">{(r as RisksResult).bottomLine}</p>
                  <p className="text-[13px] text-cream/75">{(r as RisksResult).summary}</p>
                  <div className="space-y-2">
                    {(r as RisksResult).findings.map((f, i) => (
                      <div key={i} className={`rounded-xl border p-3 ${f.severity >= 4 ? 'border-poker-red/50 bg-poker-red-deep/20' : 'border-ink bg-ink/30'}`}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cream/70">{KIND_LABEL[f.kind] ?? f.kind}</span>
                          <span className="font-mono text-[10px] text-cream/50">severity {f.severity}/5</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-cream/90">“{f.sentence}”</p>
                        <p className="mt-1 text-[12px] text-cream/60">{f.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis?.op === 'compare' && r && (
                <div className="space-y-2">
                  <p className="rounded-xl bg-ink/40 p-3 text-[14px] font-medium leading-relaxed text-cream">{(r as CompareResult).bottomLine}</p>
                  {(r as CompareResult).differences.map((d, i) => (
                    <div key={i} className="rounded-xl border border-ink bg-ink/30 p-3">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">{d.area}</p>
                      <p className="text-[13px] text-cream/90">
                        <span className="font-semibold text-cream">A:</span> {d.sideA}
                      </p>
                      <p className="text-[13px] text-cream/90">
                        <span className="font-semibold text-cream">B:</span> {d.sideB}
                      </p>
                      <p className="mt-1 text-[12px] text-cream/60">{d.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {analysis?.op === 'ask' && r && (
                <div className="space-y-3">
                  <p className="text-[14px] leading-relaxed text-cream">{(r as AskResult).answer}</p>
                  {(r as AskResult).evidence && (
                    <p className="rounded-xl border border-ink bg-ink/30 p-3 text-[13px] italic text-cream/80">“{(r as AskResult).evidence}”</p>
                  )}
                  <p className="font-mono text-[10px] uppercase tracking-widest text-dgold">
                    Confidence — {(r as AskResult).confidence}
                  </p>
                  <div>
                    <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">Next steps</h4>
                    <ul className="space-y-1 text-[13px] text-cream/85">
                      {(r as AskResult).nextSteps.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-dgold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {analysis?.op === 'lawyer' && r && (
                <div className="space-y-3">
                  <p className="rounded-xl bg-ink/40 p-3 text-[14px] leading-relaxed text-cream">{(r as LawyerResult).whyThisMatters}</p>
                  <div>
                    <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">Questions to put to your lawyer</h4>
                    <div className="space-y-2">
                      {(r as LawyerResult).questions.map((q, i) => (
                        <div key={i} className="rounded-xl border border-ink bg-ink/30 p-3">
                          <p className="text-[13px] font-medium text-cream">{q.question}</p>
                          <p className="mt-0.5 text-[12px] text-cream/60">Why: {q.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dgold">Bring along</h4>
                    <ul className="space-y-1 text-[13px] text-cream/85">
                      {(r as LawyerResult).bringDocuments.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-dgold">•</span>
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