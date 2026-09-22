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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function NavLink({ label, target }: { label: string; target: string }) {
  return (
    <button
      aria-label={`Scroll to ${label}`}
      type="button"
      onClick={() => scrollTo(target)}
      className="font-mono text-[11px] uppercase tracking-widest text-cream/70 transition hover:text-cream"
    >
      {label}
    </button>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl scroll-mt-16 px-5 py-14 lg:px-8">
      <h2 className="font-display text-3xl text-cream sm:text-4xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

const PAINS = [
  {
    head: 'Fine print wins by default',
    body: 'A lease, an NDA, a policy — someone wrote it to move fast with big words and small fonts. When the contract speaks legalese, most people just sign it.',
  },
  {
    head: 'Paywalls everywhere',
    body: 'Consultations bill by the hour. Research subscriptions bill by the year. The law that governs you should not start with an invoice.',
  },
  {
    head: 'Judgments nobody opens',
    body: 'Most people never read a court’s reasoning in their lives. The language alone keeps them out — so the law stays a mystery that bills you when it matters.',
  },
];

const DESK_PILLARS = [
  {
    head: 'Translate any document',
    body: 'Paste a lease, an NDA, a privacy policy or a service agreement. It comes back in plain language, section by section.',
  },
  {
    head: 'Find what traps you',
    body: 'Obligations, deadlines, auto-renewal, penalty and unilateral-amendment clauses — flagged with severity before you sign.',
  },
  {
    head: 'Compare before you sign',
    body: 'Two versions of an agreement side by side. It names who each clause favours and exactly where the real changes are.',
  },
  {
    head: 'Ask this exact text',
    body: 'Questions are answered strictly from the document you provided — never from a vague memory of the law at large.',
  },
  {
    head: 'Walk in ready',
    body: 'A prep pack for a real legal professional: questions to ask, lines to challenge, documents to bring.',
  },
];

const STEPS = [
  {
    n: '01',
    head: 'Take a matter',
    body: 'Demolitions, privacy raids, frozen transfers, thirty-month trials — real fact patterns across seven jurisdictions, with boss benches that play by their own house rules.',
  },
  {
    n: '02',
    head: 'Play real cards',
    body: 'You are dealt precedent cards drawn from the actual corpus. Cite them properly and the bench notices; type an invented citation and you get caught on the record.',
  },
  {
    n: '03',
    head: 'The bench rules',
    body: 'The free sparring bench rules instantly, or bring your own API key for the full LLM circuit. Score chips × mult, ride streaks, fight boss benches, buy jokers.',
  },
];

const AI_ROWS = [
  {
    where: 'Your own key (Gemini / OpenAI / Anthropic / Groq)',
    what: 'Legal Desk analyses and full LLM bench rulings',
  },
  {
    where: 'Keyless Local Rules Analyst',
    what: 'Instant desk analysis with no key at all — deterministic clause extraction, never dressed up as a model',
  },
  {
    where: 'Keyless Local Judge',
    what: 'Instant bench rulings with no key at all — deterministic scoring, always labelled as the local bench',
  },
  {
    where: 'Admin cloud router (Workers AI)',
    what: 'Hosted fallback for desk analyses on the public instance',
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
    <div className="felt-bg felt-noise min-h-full">
      <nav className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b-2 border-ink bg-felt-950/90 px-5 py-3 backdrop-blur lg:px-10">
        <button
          aria-label="Back to top"
          type="button"
          onClick={() => scrollTo('top')}

          className="font-display text-xl text-cream"
          style={{ textShadow: '0 2px 0 var(--color-poker-red-deep)' }}
        >
          OVERROOL
        </button>
        <div className="hidden items-center gap-6 sm:flex">
          <NavLink label="Your documents" target="desk" />
          <NavLink label="The bench" target="how" />
          <NavLink label="The engine" target="ai" />
          <NavLink label="Why it matters" target="why" />
          <NavLink label="FAQ" target="faq" />
        </div>
        <button
          aria-label={accountEmail ? `Signed in as ${accountEmail}` : 'Sign in or create an account'}
          type="button"
          onClick={onOpenAccount}
          className="hidden rounded-lg border border-cream/25 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-cream/70 transition hover:border-chip-gold/50 hover:text-chip-gold sm:block"
        >
          {accountEmail ? accountEmail : 'Sign up · free'}
        </button>
        <button
          aria-label="Deal me in and start playing"
          type="button"
          onClick={onPlay}

          className="rounded-lg border-2 border-ink bg-poker-red px-4 py-2 font-display text-xs uppercase tracking-wide text-cream shadow-[0_3px_0_var(--color-ink)] transition active:translate-y-[2px] active:shadow-none"
        >
          Deal me in
        </button>
      </nav>

      <header id="top" className="mx-auto w-full max-w-5xl px-5 pb-14 pt-14 text-center sm:pt-20">
        <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
          {[
            { c: 'bg-chip-gold', d: '0s' },
            { c: 'bg-poker-red', d: '0.35s' },
            { c: 'bg-poker-blue', d: '0.7s' },
          ].map((chip, i) => (
            <span
              key={i}
              className={`anim-float inline-block h-9 w-9 rounded-full border-2 border-ink ${chip.c}`}
              style={{ boxShadow: 'inset 0 0 0 2px rgba(253,246,227,0.4), 0 4px 0 0 var(--color-ink)', animationDelay: chip.d }}
            />
          ))}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-chip-gold">
          AI for legal assistance &amp; access
        </p>
        <h1
          className="mt-3 font-display text-5xl leading-[0.95] text-cream sm:text-7xl"
          style={{ textShadow: '0 4px 0 var(--color-poker-red-deep), 0 7px 0 var(--color-ink)' }}
        >
          REAL LAW.
          <br />
          SIMPLIFIED.
          <br />
          COMPARED. ARGUED.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-cream/80">
          Legal help shouldn’t start with a billable hour. Paste any contract and read it in plain language, find the
          clauses that trap you, compare two versions, and ask questions grounded in the exact text you provided. When
          you’re ready to stand on it — argue it at the bench with real judgments,{' '}
          <em>Kesavananda</em> to <em>Miranda</em>, <em>Donoghue</em> to <em>Makwanyane</em>. Nothing in the deck is
          invented.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button
            aria-label="Deal me in, it is free"
            type="button"
            onClick={onPlay}
            className="btn-gold-glow rounded-xl border-2 border-ink bg-poker-red px-7 py-3.5 font-display text-base uppercase tracking-wide text-cream"
          >
            Deal me in — it's free
          </button>
          <button
            aria-label="Open the Legal Desk and read a document"
            type="button"
            onClick={onOpenDesk}
            className="rounded-xl border-2 border-cream/25 px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-cream/80 transition hover:border-chip-gold/50 hover:text-chip-gold"
          >
            Read a document
          </button>
          <button
            aria-label="Your documents"
            type="button"
            onClick={() => scrollTo('desk')}
            className="rounded-xl border-2 border-cream/25 px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-cream/80 transition hover:border-cream/50 hover:text-cream"
          >
            How it works ↓
          </button>
        </div>
        <p className="mt-10 font-mono text-[11px] uppercase tracking-widest text-cream/50">
          {caseCount} real judgments · 7 jurisdictions · 0 invented cases
        </p>
        <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {jurisdictionCounts.map(([jurisdiction, count]) => (
            <span
              key={jurisdiction}
              className="rounded-full border border-cream/20 bg-felt-900/60 px-2.5 py-1 font-mono text-[10px] text-cream/70"
            >
              {JURISDICTION_LABEL[jurisdiction as Jurisdiction] ?? jurisdiction} · {count}
            </span>
          ))}
        </div>
        <div className="mx-auto mt-2 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {domainCounts.map(([domain, count]) => (
            <span
              key={domain}
              className="rounded-full border border-cream/10 bg-felt-800/50 px-2.5 py-1 font-mono text-[10px] text-cream/50"
            >
              {domain.replace('_', ' ')} · {count}
            </span>
          ))}
        </div>
      </header>

      <Section id="desk" title="Your documents, in plain language.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DESK_PILLARS.map((p, i) => (
            <div key={p.head} className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
              <p className="font-mono text-2xl text-cream/35">0{i + 1}</p>
              <p className="mt-1 font-display text-lg text-cream">{p.head}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/70">{p.body}</p>
            </div>
          ))}
          <div className="flex flex-col justify-between gap-4 rounded-xl border-2 border-chip-gold/40 bg-felt-900/70 p-5">
            <div>
              <p className="font-display text-lg text-chip-gold">All of it, for free.</p>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
                The Legal Desk runs instantly on three bundled samples — a consulting agreement, a privacy policy, a
                lease — or on your own text. Every analysis is plainly labelled: GenAI when it runs on your key, Local
                Rules Analyst when it runs on none.
              </p>
            </div>
            <button
              aria-label="Open the Legal Desk"
              type="button"
              onClick={onOpenDesk}
              className="w-fit rounded-lg border-2 border-ink bg-chip-gold px-4 py-2 font-display text-xs uppercase tracking-wide text-ink shadow-[0_3px_0_var(--color-ink)] transition active:translate-y-[2px] active:shadow-none"
            >
              Open the Legal Desk
            </button>
          </div>
        </div>
      </Section>

      <Section id="how" title="The bench: take a matter.">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border-2 border-ink bg-felt-800/70 p-5">
              <p className="font-mono text-2xl text-cream/35">{s.n}</p>
              <p className="mt-1 font-display text-lg text-cream">{s.head}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/70">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-xl border-2 border-ink bg-felt-950/80 px-5 py-4 text-center font-mono text-[11px] uppercase tracking-widest text-cream/70">
          No invented law. No fake parties. Every citation verified against the deck before it hits the felt.
        </p>
      </Section>

      <Section id="ai" title="Where the AI actually runs.">
        <div className="overflow-hidden rounded-xl border-2 border-ink bg-felt-950/80">
          {AI_ROWS.map((row, i) => (
            <div
              key={row.where}
              className={`grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6 ${
                i > 0 ? 'border-t-2 border-ink/60' : ''
              }`}
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-chip-gold">{row.where}</p>
              <p className="text-[13px] leading-relaxed text-cream/75">{row.what}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-cream/60">
          Every model output is parsed from a strict structured-JSON contract, and any citation it offers is verified
          against the corpus before it appears on screen. The free benches and the free desk analysis are deterministic
          local engines — honest about being local, never dressed up as a model.
        </p>
      </Section>

      <Section id="why" title="Legal knowledge is locked away.">
        <div className="grid gap-5 md:grid-cols-3">
          {PAINS.map((p) => (
            <div key={p.head} className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
              <p className="font-display text-lg text-poker-red">{p.head}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/70">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="value" title="What it's worth">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
            <p className="font-display text-xl text-cream">Bundled samples. Your text. No key needed.</p>
            <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
              Try the Legal Desk before you sign anything — consult a contract, a policy or a lease in plain language
              without creating an account. Add an LLM key only if you want the full GenAI circuit.
            </p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
            <p className="font-display text-xl text-cream">₹0 to play. $0 to spar.</p>
            <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
              The sparring bench is free forever. Bring your own LLM key and a full trial costs pennies — no
              subscription, no seat license, no billable hour.
            </p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
            <p className="font-display text-xl text-cream">Minutes, not weeks.</p>
            <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
              A full trial fits in a coffee break. Every holding links straight to the published judgment — Indian
              Kanoon, SafLII, CanLII, AustLII, BAILII, EUR-Lex or Justia — one tap away.
            </p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
            <p className="font-display text-xl text-cream">Moot court without the moot court.</p>
            <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
              Law students drill citation discipline under a bench that catches fabrication. Everyone else finally
              learns how courts actually reason — and leaves each session with next steps, not a vague sense of dread.
            </p>
          </div>
        </div>
      </Section>

      <Section id="faq" title="Straight answers">
        <div className="space-y-4">
          {[
            {
              q: 'How is this actually AI?',
              a: 'The bench and the Legal Desk run live model turns — opposing counsel briefs and rulings are generated, not scripted. With no key, deterministic local engines take over and are always labelled as such.',
            },
            {
              q: 'Are the cases real?',
              a: 'Every one. Each card links to the published judgment. The parties and fact patterns are fiction — the law never is.',
            },
            {
              q: 'Can the AI invent citations?',
              a: 'It can try. It is caught. Any citation offered by a model is verified against the corpus before display, and the bench is instructed to rule against invented law.',
            },
            {
              q: 'Does the document analysis use only my text?',
              a: 'The desk answers from the document you gave it, with a fixed legal glossary for definitions. It does not guess facts about your situation from thin air.',
            },
            {
              q: 'Do I need an API key?',
              a: 'No. The sparring bench and the legal desk play instantly and free. Add your own key only for the full LLM circuit.',
            },
            {
              q: 'Is this legal advice?',
              a: 'No. It is a game that teaches, and a desk that helps you understand. Nothing here is advice; verify everything against certified law reports and a real legal professional.',
            },
          ].map((f) => (
            <div key={f.q} className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
              <p className="font-display text-base text-cream">{f.q}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-cream/70">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <footer className="border-t-2 border-ink px-5 py-10 text-center">
        <p className="font-display text-lg text-cream">OVERROOL</p>
        <p className="mx-auto mt-2 max-w-xl font-mono text-[10px] uppercase tracking-widest text-cream/40">
          AI for legal assistance &amp; access — a game that teaches, not legal advice. Verify every citation against
          certified law reports.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            aria-label="Deal me in"
            type="button"
            onClick={onPlay}

            className="rounded-lg border-2 border-ink bg-felt-700 px-5 py-2 font-display text-xs uppercase text-cream shadow-[0_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-none"
          >
            Deal me in
          </button>
          <button
            aria-label="Open the Legal Desk"
            type="button"
            onClick={onOpenDesk}

            className="rounded-lg border-2 border-ink bg-chip-gold px-5 py-2 font-display text-xs uppercase text-ink shadow-[0_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-none"
          >
            Legal Desk
          </button>
        </div>
      </footer>
    </div>
  );
}