import { useEffect, useState } from 'react';
import { Check, Copy, Download, KeyRound, Landmark, Loader2, Share2, X } from 'lucide-react';
import type { LLMConfig, LLMProvider } from '../types/legal';
import { PROVIDERS, HOSTED_ENTRY, createKeyManager } from '../core/storage';
import type { AskResult, CompareResult, DeskAnalysis, DeskOp, LawyerResult, RisksResult, SimplifyResult } from '../core/docEngine';
import { genDeskAnalysis, localDeskAnalysis } from '../core/docEngine';
import { DESK_SAMPLES } from '../core/deskSamples';
import { CREDIT_COSTS, creditsToday, spendCredits } from '../core/meter';

interface LegalDeskProps {
  onClose: () => void;
  onOpenKeys: () => void;
}

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

  const pickSample = (id: string) => {
    const s = DESK_SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setSampleId(id);
    setDoc(s.text);
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

            <div className="flex items-center gap-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream/50">Paste or load a sample</label>
              <select
                value={sampleId}
                onChange={(e) => pickSample(e.target.value)}
                className="rounded-lg border border-ink bg-felt-800 px-2 py-1 text-[13px] text-cream focus:border-dgold focus:outline-none"
              >
                {DESK_SAMPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              placeholder="Paste a contract, policy, lease, judgement excerpt, or terms page here…"
              className="min-h-[180px] flex-1 resize-none rounded-xl border border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream placeholder:text-cream/30 focus:border-dgold focus:outline-none"
            />

            {op === 'compare' && (
              <textarea
                value={docB}
                onChange={(e) => setDocB(e.target.value)}
                placeholder="Version B — paste the second document to compare…"
                className="min-h-[100px] resize-none rounded-xl border border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream placeholder:text-cream/30 focus:border-dgold focus:outline-none"
              />
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