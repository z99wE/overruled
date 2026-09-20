import { describe, expect, it } from 'vitest';
import { parseOpponentReply } from './llmOrchestrator';
import type { PrecedentCard } from '../types/legal';

const deck: PrecedentCard[] = [
  {
    id: 'miranda',
    citation: '384 U.S. 436',
    caseName: 'Miranda v. Arizona',
    year: 1966,
    court: 'Supreme Court of the United States',
    jurisdiction: 'US',
    ratioDecidendi: 'Custodial interrogation requires warnings; statements taken without them are presumptively inadmissible.',
    statutoryProvisions: ['U.S. Const. amend. V'],
    keyTags: ['interrogation'],
    domain: 'Criminal',
  },
  {
    id: 'gideon',
    citation: '372 U.S. 335',
    caseName: 'Gideon v. Wainwright',
    year: 1963,
    court: 'Supreme Court of the United States',
    jurisdiction: 'US',
    ratioDecidendi: 'Indigent defendants have a right to appointed counsel in felony trials.',
    statutoryProvisions: ['U.S. Const. amend. VI'],
    keyTags: ['counsel'],
    domain: 'Criminal',
  },
];

describe('parseOpponentReply', () => {
  it('accepts the agent\'s own card pick when it matches a real deck citation', () => {
    const raw = JSON.stringify({
      strike: 'The bench should read Gideon before weighing counsel questions here.',
      card_citation: '372 U.S. 335',
    });
    const out = parseOpponentReply(raw, deck);
    expect(out.opponentCard?.caseName).toBe('Gideon v. Wainwright');
    expect(out.opponentCard?.citation).toBe('372 U.S. 335');
    expect(out.strike).toContain('Gideon');
  });

  it('discards an invented citation and returns no card', () => {
    const raw = JSON.stringify({
      strike: 'Counsel misstates the standard.',
      card_citation: '999 F.3d 111 (Fake v. Pretend)',
    });
    const out = parseOpponentReply(raw, deck);
    expect(out.opponentCard).toBeNull();
    expect(out.strike).toContain('misstates');
  });

  it('handles a plain-prose reply (model ignored the JSON instruction)', () => {
    const out = parseOpponentReply('Our friend ignores that Miranda itself caps this argument.', deck);
    expect(out.opponentCard).toBeNull();
    expect(out.strike).toContain('Miranda');
  });

  it('matches citations even when punctuation is sloppy', () => {
    const raw = JSON.stringify({ strike: 's', card_citation: '384 US 436' });
    const out = parseOpponentReply(raw, deck);
    expect(out.opponentCard?.citation).toBe('384 U.S. 436');
  });

  it('strips markdown fences around the JSON', () => {
    const raw = '```json\n{"strike":"s","card_citation":"372 U.S. 335"}\n```';
    const out = parseOpponentReply(raw, deck);
    expect(out.opponentCard?.caseName).toBe('Gideon v. Wainwright');
  });
});
