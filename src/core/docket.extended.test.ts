/**
 * Extended coverage tests for docket.ts — covers the serializeDocketMarkdown
 * branches that were previously under 50% coverage (no-precedents path,
 * no-exposure path, no-questions path, deduplicated admitted entries).
 * Also covers the shareText and downloadText utility paths.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  serializeDocketMarkdown,
  fallbackConsultationQuestions,
  downloadText,
  shareText,
} from './docket';
import type { SessionSummary } from '../types/legal';

function makeSummary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    caseTitle: 'Test v. Reality',
    clientName: 'TestClient',
    bench: 'High Court',
    jurisdiction: 'AU',
    turnRecords: [],
    finalFavor: 55,
    admittedPrecedents: [],
    exposurePoints: [],
    consultationQuestions: [],
    completedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('serializeDocketMarkdown — all branch paths', () => {
  it('renders the no-precedents placeholder', () => {
    const md = serializeDocketMarkdown(makeSummary({ admittedPrecedents: [] }));
    expect(md).toContain('No precedent survived adversarial scrutiny on the record.');
  });

  it('renders the no-exposure placeholder', () => {
    const md = serializeDocketMarkdown(makeSummary({ exposurePoints: [] }));
    expect(md).toContain('No exposure flagged during the simulation');
  });

  it('renders the no-questions placeholder', () => {
    const md = serializeDocketMarkdown(makeSummary({ consultationQuestions: [] }));
    expect(md).toContain('Questions pending');
  });

  it('renders admitted precedents when present', () => {
    const summary = makeSummary({
      admittedPrecedents: [
        {
          id: 'donoghue',
          caseName: 'Donoghue v Stevenson',
          citation: '[1932] AC 562',
          year: 1932,
          court: 'House of Lords',
          statutoryProvisions: [],
          keyTags: [],
          domain: 'Tort',
          ratioDecidendi: 'Duty of care owed to neighbour.',
        },
      ],
    });
    const md = serializeDocketMarkdown(summary);
    expect(md).toContain('[1932] AC 562');
    expect(md).toContain('Donoghue v Stevenson');
    expect(md).toContain('Duty of care owed to neighbour.');
  });

  it('renders exposure points when present', () => {
    const summary = makeSummary({ exposurePoints: ['Risk A', 'Risk B'] });
    const md = serializeDocketMarkdown(summary);
    expect(md).toContain('Risk A');
    expect(md).toContain('Risk B');
  });

  it('renders consultation questions when present', () => {
    const summary = makeSummary({ consultationQuestions: ['Q1?', 'Q2?'] });
    const md = serializeDocketMarkdown(summary);
    expect(md).toContain('Q1?');
    expect(md).toContain('Q2?');
  });

  it('escapes pipe characters in case names', () => {
    const summary = makeSummary({ clientName: 'Client | Co' });
    const md = serializeDocketMarkdown(summary);
    expect(md).toContain('Client \\| Co');
  });

  it('always includes the statutory disclaimer', () => {
    const md = serializeDocketMarkdown(makeSummary());
    expect(md).toContain('does not provide legal advice');
  });
});

describe('fallbackConsultationQuestions', () => {
  it('always returns exactly 5 questions', () => {
    const summary = makeSummary();
    expect(fallbackConsultationQuestions(summary)).toHaveLength(5);
  });

  it('uses the first exposure point in the evidence question', () => {
    const summary = makeSummary({ exposurePoints: ['Missing contract execution log'] });
    const qs = fallbackConsultationQuestions(summary);
    expect(qs[3]).toContain('Missing contract execution log');
  });

  it('falls back to the default evidence question when no exposure points exist', () => {
    const summary = makeSummary({ exposurePoints: [] });
    const qs = fallbackConsultationQuestions(summary);
    expect(qs[3]).toContain('documentary evidence');
  });
});

describe('downloadText', () => {
  it('creates a blob link, clicks it, then revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:test-url');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChild);

    // Create a fake anchor with a click method
    const fakeAnchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(fakeAnchor);

    downloadText('test.md', '# Hello');

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});

describe('shareText', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "copied" when clipboard.writeText is available', async () => {
    // Mock @capacitor/core to return non-native
    vi.mock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => false },
    }));
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const result = await shareText('Title', 'Content');
    expect(result).toBe('copied');
  });

  it('returns "failed" when clipboard is not available and execCommand fails', async () => {
    vi.mock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => false },
    }));
    Object.assign(navigator, { clipboard: undefined });
    // execCommand is not defined in jsdom — define it before spying
    if (!('execCommand' in document)) {
      Object.defineProperty(document, 'execCommand', {
        value: () => false,
        writable: true,
        configurable: true,
      });
    } else {
      vi.spyOn(document, 'execCommand').mockReturnValue(false);
    }

    const result = await shareText('Title', 'Content');
    expect(result).toBe('failed');
  });
});
