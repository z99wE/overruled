export interface NewsItem {
  id: string;
  date: string;
  tag: string;
  title: string;
  body: string;
}

/**
 * The in-app AI Briefing — the free "newsletter" delivery surface. Static
 * content bundled with the app (no external email service): opted-in accounts
 * see the full list on the matter gallery. Keep entries factual and dated.
 */
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'daily-credits-guardrails',
    date: '2026-09-22',
    tag: 'Access & safety',
    title: 'Fair access: daily credits, guarded AI',
    body: 'Everyone gets 100 credits per day (a trial costs 10, a Legal Desk analysis 2; the Local Bench stays free). The hosted AI path now runs behind a server-side daily cap, a burst limit, and a two-model allowlist — plus every model prompt is hardened against prompt-hijacking with an untrusted-data sandbox.',
  },
  {
    id: 'true-3d-flips',
    date: '2026-09-22',
    tag: 'Tablecraft',
    title: 'True 3D card flips on the case table',
    body: 'Cards now deal face-down and turn on a real 3D axis; spent cards flip to their back and the Bench reveals its counter-card at the verdict with a proper reveal, not a fake tilt.',
  },
  {
    id: 'landing-sells-itself',
    date: '2026-09-22',
    tag: 'Product',
    title: 'A landing page that states the case',
    body: 'The front page now walks your five document use cases (Simplify, Compare, Risks, Ask, For your lawyer), shows exactly where GenAI runs, and answers why it matters — no fluff, no jargon.',
  },
];
