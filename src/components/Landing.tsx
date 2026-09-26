import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Jurisdiction, PrecedentCard } from '../types/legal';

interface LandingProps {
  cases: PrecedentCard[];
  onPlay: () => void;
  onOpenDesk: () => void;
  accountEmail: string | null;
  onOpenAccount: () => void;
}

const TICKER_CASES = [
  { hold: "A crested macaque cannot hold a copyright in the selfie it took.", cite: "Naruto v. Slater, 888 F.3d 418 (9th Cir. 2018)", tag: "United States" },
  { hold: "Landlord cannot evict pavement dwellers without procedural fairness and alternative shelter considerations.", cite: "Olga Tellis v. BMC (1985) 3 SCC 545", tag: "India" },
  { hold: "A manufacturer owes a duty of care to the consumer when there is no reasonable possibility of intermediate examination.", cite: "Donoghue v. Stevenson [1932] AC 562", tag: "United Kingdom" },
  { hold: "Personal data transfers across borders must ensure an essentially equivalent level of fundamental rights protection.", cite: "Schrems II (Case C-311/18)", tag: "European Union" },
];

function Ticker() {
  return (
    <div className="overflow-hidden border-y border-white/10 bg-slate-950/80 py-3 backdrop-blur-md" aria-label="Selected Legal Precedents">
      <div className="flex whitespace-nowrap font-mono text-[11px] text-slate-300 animate-[ticker_35s_linear_infinite]">
        {TICKER_CASES.concat(TICKER_CASES).map((c, i) => (
          <div key={i} className="mx-6 inline-flex items-center gap-3">
            <span className="m3-chip m3-chip-primary text-[9px]">{c.tag}</span>
            <span className="text-white">{c.hold}</span>
            <span className="text-amber-300 font-medium">— {c.cite}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function NavLink({ label, target }: { label: string; target: string }) {
  return (
    <button
      aria-label={`Scroll to ${label}`}
      type="button"
      onClick={() => scrollTo(target)}
      className="font-sans text-xs font-medium text-slate-300 transition-colors hover:text-amber-300"
    >
      {label}
    </button>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 lg:px-8 border-t border-white/10">
      <div className="mb-10 max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl text-white tracking-tight font-bold">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-base text-slate-300 leading-relaxed font-sans">
            {subtitle}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

const PAINS = [
  {
    head: 'Fine print wins by default',
    body: 'A lease, an NDA, a policy — drafted to protect the other party in dense terminology. When you cannot decipher every clause, you sign away your leverage.',
  },
  {
    head: 'Paywalled consultations',
    body: 'Legal consultations bill by the hour, while database subscriptions cost thousands. Fundamental legal understanding should be accessible instantly.',
  },
  {
    head: 'Inaccessible judgments',
    body: 'Decades of supreme rulings sit in dense archives. We surface real binding precedents so you can test any legal position on firm ground.',
  },
];

const DESK_PILLARS = [
  {
    head: 'Translate Any Agreement',
    body: 'Upload any contract, NDA, lease, or terms. Receive a clear, structured translation in plain language, section by section.',
  },
  {
    head: 'Audit Hidden Liabilities',
    body: 'Unilateral amendments, indemnities, penalties, and termination traps flagged with precise severity ratings.',
  },
  {
    head: 'Redline Version Comparison',
    body: 'Compare two versions of an agreement side by side with clear explanations of who benefits from each modification.',
  },
  {
    head: 'Document-Grounded Q&A',
    body: 'Ask complex legal questions answered strictly from your uploaded document — never from hallucinated or assumed text.',
  },
  {
    head: 'Pre-Counsel Brief Pack',
    body: 'Generate a structured preparation dossier for your attorney: tactical questions, key vulnerabilities, and critical evidence checklist.',
  },
];

const STEPS = [
  {
    n: '01',
    head: 'Select or Generate a Matter',
    body: 'Explore high-stakes disputes across constitutional, commercial, privacy, and labor law, or input a custom dispute.',
  },
  {
    n: '02',
    head: 'Submit Grounded Precedents',
    body: 'Deploy real landmark cards from your hand. Every citation is verified against real law reports — fabricated citations are rejected.',
  },
  {
    n: '03',
    head: 'Bench Resolution & Scoring',
    body: 'Face adversarial opposition and bench rulings. Build streaks, earn judicial favor, and challenge specialized bench rules.',
  },
];

const AI_ROWS = [
  {
    where: 'Direct Bring Your Own Key (Gemini, OpenAI, Claude, Groq)',
    what: 'Legal Desk and multi-turn adversarial courtroom queries make direct HTTPS calls to your chosen provider with zero intermediary proxy.',
  },
  {
    where: 'Private Native Neural Engine',
    what: 'Instant document analysis without requiring any API key — client-side clause parsing and deep risk pattern extraction with zero cloud footprint.',
  },
  {
    where: 'Private Sparring Bench Intelligence',
    what: 'Instant bench rulings and scoring without an API key — on-device evaluation designed for rapid legal sparring.',
  },
  {
    where: 'Cloudflare Edge Worker Fallback',
    what: 'Optional hosted inference for rapid testing when configured on public instances.',
  },
];

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  CA: 'Canada',
  AU: 'Australia',
  ZA: 'South Africa',
  IN: 'India',
};

export function Landing({ cases, onPlay, onOpenDesk, accountEmail, onOpenAccount }: LandingProps) {
  const caseCount = cases.length;
  const { jurisdictionCounts, domainCounts } = useMemo(() => {
    const j = new Map<string, number>();
    const d = new Map<string, number>();
    for (const c of cases) {
      if (c.jurisdiction) j.set(c.jurisdiction, (j.get(c.jurisdiction) ?? 0) + 1);
      d.set(c.domain, (d.get(c.domain) ?? 0) + 1);
    }
    return {
      jurisdictionCounts: [...j.entries()].sort((a, b) => b[1] - a[1]),
      domainCounts: [...d.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [cases]);

  return (
    <div className="felt-bg ambient-mesh-glow min-h-full selection:bg-amber-400 selection:text-slate-950">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-6 py-3.5 shadow-lg backdrop-blur-xl lg:px-12">
        <button
          aria-label="Back to top"
          type="button"
          onClick={() => scrollTo('top')}
          className="group flex items-center gap-2.5 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-md font-serif text-lg font-bold transition-transform group-hover:scale-105">
            O
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Over<span className="text-amber-300">rool</span>
          </span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          <NavLink label="Legal Desk" target="desk" />
          <NavLink label="Courtroom Chamber" target="how" />
          <NavLink label="AI Architecture" target="ai" />
          <NavLink label="Core Principles" target="why" />
          <NavLink label="FAQ" target="faq" />
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label={accountEmail ? `Signed in as ${accountEmail}` : 'Sign in or sync account'}
            type="button"
            onClick={onOpenAccount}
            className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 font-mono text-xs text-slate-300 hover:border-amber-400/40 hover:text-white transition-colors"
          >
            {accountEmail ? accountEmail : 'Account Sync'}
          </button>
          <button
            aria-label="Open the Legal Desk and review a document"
            type="button"
            onClick={onOpenDesk}
            className="m3-btn m3-btn-primary px-5 py-2 text-xs"
          >
            Review Document
          </button>
        </div>
      </nav>

      {/* ── Hero Section with Impressionist Museum Painting Framing ──── */}
      <header id="top" className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 text-left space-y-6">
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Read the contract.
              <br />
              <span className="pastel-gradient-text">Master the risk.</span>
            </h1>

            <p className="max-w-2xl text-[16px] leading-relaxed text-slate-300 font-sans">
              Legal certainty shouldn't require a billable hour. Upload contracts, leases, or judgments to read them in plain language — uncover hidden liabilities, compare drafts, and get answers grounded strictly in your text. Test your position against <strong className="text-amber-200 font-semibold">59 verified landmark judgments</strong> with zero invented law.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                aria-label="Open the Legal Desk and analyze a document"
                type="button"
                onClick={onOpenDesk}
                className="m3-btn m3-btn-primary px-7 py-3.5 text-sm"
              >
                Launch Legal Desk — Free
              </button>
              <button
                aria-label="Enter the Courtroom Chamber"
                type="button"
                onClick={onPlay}
                className="m3-btn m3-btn-emerald px-7 py-3.5 text-sm"
              >
                Enter Courtroom Chamber
              </button>
              <button
                aria-label="Explore system capabilities"
                type="button"
                onClick={() => scrollTo('desk')}
                className="m3-btn m3-btn-outlined px-5 py-3.5 text-sm"
              >
                Explore System ↓
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <span className="font-semibold text-slate-300">Supported Formats:</span>
              {['PDF', 'DOCX', 'TXT', 'Raw Paste'].map((fmt) => (
                <span key={fmt} className="m3-chip text-[9px]">
                  {fmt}
                </span>
              ))}
              <span className="text-emerald-300 ml-2">
                100% Client-Side Private
              </span>
            </div>
          </div>

          {/* Right Column: Impressionist Fine Art Gallery Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl border border-amber-300/30 bg-gradient-to-b from-amber-200/10 via-slate-900/60 to-slate-950 p-3 shadow-2xl backdrop-blur-2xl">
              <div className="overflow-hidden rounded-2xl border border-white/10 aspect-square relative shadow-inner">
                <img
                  src="/assets/lady-justice.jpg"
                  alt="Fine art oil painting of Lady Justice Themis in Claude Monet impressionist style"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl border border-white/15 bg-slate-900/80 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-sm font-bold text-white">Themis · Pillar of Authority</p>
                      <p className="font-mono text-[10px] text-amber-300">59 Verified Supreme Precedents</p>
                    </div>
                    <span className="m3-chip m3-chip-emerald text-[9px]">Grounded Law</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Judgment Counter Strip */}
        <div className="mt-14 liquid-glass-elevated p-6 max-w-5xl mx-auto rounded-3xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="m3-chip m3-chip-primary text-[11px]">
              {caseCount} Landmark Judgments
            </span>
            <span className="m3-chip m3-chip-emerald text-[11px]">
              7 Legal Jurisdictions
            </span>
            <span className="m3-chip m3-chip-cyan text-[11px]">
              Zero Fabricated Law
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {jurisdictionCounts.map(([jurisdiction, count]) => (
              <span
                key={jurisdiction}
                className="rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1 font-mono text-[11px] text-slate-300"
              >
                {JURISDICTION_LABEL[jurisdiction as Jurisdiction] ?? jurisdiction} · <span className="text-amber-300 font-semibold">{count}</span>
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {domainCounts.map(([domain, count]) => (
              <span
                key={domain}
                className="rounded-full border border-white/5 bg-slate-950/50 px-3 py-0.5 font-mono text-[10px] text-slate-400"
              >
                {domain.replace('_', ' ')} · {count}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Live Ticker ────────────────────────────────────────────── */}
      <Ticker />

      {/* ── Legal Desk Feature Section ──────────────────────────────── */}
      <Section
        id="desk"
        title="Understand Your Documents in Plain Language."
        subtitle="Five instant analytical operations to deconstruct, audit, and compare legal documents without leaking private text."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DESK_PILLARS.map((p, i) => (
            <div key={p.head} className="m3-card-elevated p-6 flex flex-col justify-between group">
              <div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  {p.head}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-300">
                  {p.body}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Capability 0{i + 1}</span>
                <span className="text-amber-300 font-medium">Ready ▸</span>
              </div>
            </div>
          ))}

          {/* CTA Box */}
          <div className="m3-card-elevated border-amber-400/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-amber-200">
                Private. Grounded. Instant.
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-300 font-sans">
                Analyze consulting agreements, NDAs, leases, or terms of service instantly using our private on-device neural engine, or connect your personal BYOK for full multi-turn GenAI depth.
              </p>
            </div>
            <button
              aria-label="Open the Legal Desk"
              type="button"
              onClick={onOpenDesk}
              className="m3-btn m3-btn-primary mt-6 w-full py-3"
            >
              Open Workbench Now
            </button>
          </div>
        </div>
      </Section>

      {/* ── Courtroom Sparring Chamber with Impressionist Colosseum ──── */}
      <Section
        id="how"
        title="The Bench: Spar Against Real Landmark Law."
        subtitle="Multi-turn adversarial simulation where opposing counsel challenges your arguments and the bench rules strictly on primary precedent."
      >
        <div className="mb-8 rounded-3xl border border-white/15 overflow-hidden relative shadow-2xl">
          <img
            src="/assets/courtroom-chamber.jpg"
            alt="Impressionist oil painting of classical Roman amphitheater courtroom in Claude Monet and Edouard Manet style"
            className="w-full h-72 sm:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl border border-white/15 bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">The Roman Courtroom Chamber</h3>
              <p className="font-sans text-xs text-slate-300 mt-1">Multi-turn oral argument testing against primary jurisprudence.</p>
            </div>
            <button
              type="button"
              onClick={onPlay}
              className="m3-btn m3-btn-emerald px-6 py-2.5 text-xs"
            >
              Launch Chamber Session ▸
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="m3-card-elevated p-6">
              <span className="font-mono text-2xl font-bold text-amber-300 block mb-2">
                {s.n}
              </span>
              <h3 className="font-display text-lg font-bold text-white">
                {s.head}
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-300">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Architecture & AI Transparency ───────────────────────────── */}
      <Section
        id="ai"
        title="Where the AI Actually Runs."
        subtitle="Complete architectural transparency with zero cloud leaks and client-side execution options."
      >
        <div className="m3-card overflow-hidden">
          {AI_ROWS.map((row, i) => (
            <div
              key={row.where}
              className={`p-6 ${
                i > 0 ? 'border-t border-white/10' : ''
              } hover:bg-slate-800/40 transition-colors`}
            >
              <p className="font-display text-sm font-semibold text-white mb-1">{row.where}</p>
              <p className="text-[13px] leading-relaxed text-slate-300">{row.what}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
          Every model output is validated against strict JSON contracts. All API keys remain strictly in local browser memory (or encrypted device storage) and are never logged or stored on any central server.
        </p>
      </Section>

      {/* ── Why Access Matters ───────────────────────────────────────── */}
      <Section
        id="why"
        title="Legal Knowledge Should Not Be Locked Away."
        subtitle="The fundamental principles guiding why Overrool is open, grounded, and accessible to everyone."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {PAINS.map((p) => (
            <div key={p.head} className="m3-card-elevated p-6">
              <h3 className="font-display text-lg font-bold text-white mb-2">{p.head}</h3>
              <p className="text-[13px] leading-relaxed text-slate-300">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FAQ with Schema.org AEO / GEO Markup ─────────────────────── */}
      <Section
        id="faq"
        title="Frequently Asked Questions."
        subtitle="Everything you need to know about grounding, citation verification, privacy, and models."
      >
        <div className="grid gap-4 md:grid-cols-2" itemScope itemType="https://schema.org/FAQPage">
          {[
            {
              q: 'How does the AI operate?',
              a: 'The bench and Legal Desk run live model turns — opposing counsel arguments and rulings are generated dynamically. With no key, our private on-device neural engines take over with instant zero-cost analysis.',
            },
            {
              q: 'Are the cases real?',
              a: 'Every single one. Each precedent card directly links to official law reports (Indian Kanoon, SafLII, CanLII, AustLII, BAILII, EUR-Lex, Justia). The fact patterns are fiction; the law never is.',
            },
            {
              q: 'Can the AI invent citations?',
              a: 'It cannot. Any citation generated is checked against the verified corpus before being admitted to the record. Fabricated citations trigger an immediate bench rejection.',
            },
            {
              q: 'Does document analysis use only my text?',
              a: 'Yes. The desk answers strictly from the document you provide with an anchored glossary. It never fabricates clauses or facts outside the submitted text.',
            },
            {
              q: 'Do I need an API key?',
              a: 'No. The sparring bench and legal desk operate immediately and for free. Bring your own Gemini, OpenAI, Claude, or Groq key only if you want full GenAI multi-turn depth.',
            },
            {
              q: 'Is this legal advice?',
              a: 'No. Overrool is an educational legal intelligence and analysis engine. Always verify with certified law reports and consult qualified legal counsel.',
            },
          ].map((f) => (
            <div key={f.q} className="m3-card p-6" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <p className="font-display text-base font-semibold text-amber-200" itemProp="name">{f.q}</p>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="mt-2 text-[13px] leading-relaxed text-slate-300" itemProp="text">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-slate-950/90 px-6 py-12 text-center backdrop-blur-md">
        <div className="flex items-center justify-center gap-2">
          <span className="font-display text-2xl font-bold text-white">Over<span className="text-amber-300">rool</span></span>
        </div>
        <p className="mx-auto mt-3 max-w-xl font-sans text-xs text-slate-400">
          Grounded Legal Understanding &amp; Precedent Intelligence. Educational simulation; not legal advice.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            aria-label="Open the Legal Desk"
            type="button"
            onClick={onOpenDesk}
            className="m3-btn m3-btn-primary px-6 py-2.5 text-xs"
          >
            Review Document
          </button>
          <button
            aria-label="Enter the Room"
            type="button"
            onClick={onPlay}
            className="m3-btn m3-btn-emerald px-6 py-2.5 text-xs"
          >
            Enter Courtroom
          </button>
        </div>
      </footer>
    </div>
  );
}