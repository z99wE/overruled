import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Jurisdiction, PrecedentCard } from '../types/legal';

interface LandingProps {
  cases: PrecedentCard[];
  onPlay: () => void;
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
    head: 'Paywalls everywhere',
    body: 'Consultations bill by the hour. Research subscriptions bill by the year. Understanding the law that governs you should not start with an invoice.',
  },
  {
    head: 'Weeks before you can argue',
    body: 'The traditional route: months of dense reading before you can hold your own in a legal argument. A trial here takes minutes, not semesters.',
  },
  {
    head: 'Judgments nobody opens',
    body: 'Most people never read a court’s reasoning in their lives. The language alone keeps them out — so the law stays a mystery that bills you when it matters.',
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

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  CA: 'Canada',
  AU: 'Australia',
  ZA: 'South Africa',
  IN: 'India',
};

export function Landing({ cases, onPlay }: LandingProps) {
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
    <div className="felt-bg min-h-full">
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
          <NavLink label="How it works" target="how" />
          <NavLink label="Why it matters" target="why" />
          <NavLink label="What it's worth" target="value" />
          <NavLink label="FAQ" target="faq" />
        </div>
        <button
          aria-label="Deal me in and start playing"
          type="button"
          onClick={onPlay}

          className="rounded-lg border-2 border-ink bg-poker-red px-4 py-2 font-display text-xs uppercase tracking-wide text-cream shadow-[0_3px_0_var(--color-ink)] transition active:translate-y-[2px] active:shadow-none"
        >
          Deal me in
        </button>
      </nav>

      <header id="top" className="mx-auto w-full max-w-5xl px-5 pb-16 pt-16 text-center sm:pt-24">
        <h1
          className="font-display text-5xl leading-[0.95] text-cream sm:text-7xl"
          style={{ textShadow: '0 4px 0 var(--color-poker-red-deep), 0 7px 0 var(--color-ink)' }}
        >
          REAL LAW.
          <br />
          PLAYED LIKE A GAME.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-cream/80">
          Take a live matter. Argue it with real judgments — <em>Kesavananda</em> to <em>Miranda</em>,{' '}
          <em>Donoghue</em> to <em>Makwanyane</em>. Every card cites a case you can actually read. Nothing in the
          deck is invented.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button
          aria-label="Deal me in, it is free"
            type="button"
            onClick={onPlay}

            className="rounded-xl border-2 border-ink bg-poker-red px-7 py-3.5 font-display text-base uppercase tracking-wide text-cream shadow-[0_5px_0_var(--color-ink)] transition active:translate-y-[3px] active:shadow-none"
          >
            Deal me in — it's free
          </button>
          <button
          aria-label="How it works"
            type="button"
            onClick={() => scrollTo('how')}

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

      <Section id="how" title="How it works">
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

      <Section id="value" title="What it's worth">
        <div className="grid gap-5 sm:grid-cols-2">
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
              learns how courts actually reason.
            </p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-felt-900/70 p-5">
            <p className="font-display text-xl text-cream">Built in India. Argued worldwide.</p>
            <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
              From <em>Kesavananda Bharati</em> and <em>Shreya Singhal</em> to <em>Donoghue</em> and{' '}
              <em>Miranda</em> — and a pass-and-play duel so two lawyers can fight it out on one device.
            </p>
          </div>
        </div>
      </Section>

      <Section id="faq" title="Straight answers">
        <div className="space-y-4">
          {[
            {
              q: 'Are the cases real?',
              a: 'Every one. Each card links to the published judgment. The parties and fact patterns are fiction — the law never is.',
            },
            {
              q: 'Do I need an API key?',
              a: 'No. The sparring bench plays instantly and free. Add your own key only for the LLM bench.',
            },
            {
              q: 'Is this legal advice?',
              a: 'No. It is a game that teaches. Nothing here is advice; verify citations against certified law reports before relying on them.',
            },
            {
              q: 'Where do the cases come from?',
              a: 'Free public law libraries worldwide — the same sources practitioners use. Nothing behind a paywall.',
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
          A game that teaches — not legal advice. Verify every citation against certified law reports.
        </p>
        <button
          aria-label="Deal me in"
          type="button"
          onClick={onPlay}

          className="mt-5 rounded-lg border-2 border-ink bg-felt-700 px-5 py-2 font-display text-xs uppercase text-cream shadow-[0_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-none"
        >
          Deal me in
        </button>
      </footer>
    </div>
  );
}
