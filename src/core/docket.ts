import type {
  LLMConfig,
  PrecedentCard,
  SessionSummary,
  ScenarioBundle,
  TurnRecord,
} from '../types/legal';
import { requestChat } from './providerCall';

export interface DocketDraft {
  summary: SessionSummary;
  scenario: ScenarioBundle;
}

export function buildSessionSummary(args: {
  scenario: ScenarioBundle;
  turnRecords: TurnRecord[];
  finalFavor: number;
}): SessionSummary {
  const { scenario, turnRecords, finalFavor } = args;

  const admitted: PrecedentCard[] = [];
  const exposure: string[] = [];
  const seen = new Set<string>();

  for (const rec of turnRecords) {
    if (rec.citedPrecedent) {
      const yes = rec.resolution.citation_valid && rec.resolution.bench_verdict_tag !== 'OVERRULED';
      if (yes) {
        if (!seen.has(rec.citedPrecedent.id)) {
          seen.add(rec.citedPrecedent.id);
          admitted.push(rec.citedPrecedent);
        }
      } else {
        exposure.push(`${rec.citedPrecedent.caseName} (${rec.citedPrecedent.citation}) was cited ${rec.resolution.bench_verdict_tag === 'OVERRULED' ? 'ineffectively / distinguished on the record' : 'without surviving scrutiny'}.`);
      }
    }
    if (!rec.resolution.citation_valid) {
      exposure.push(`Turn ${rec.turnNumber}: the citation offered was unverified against the Indian case/statute corpus (risk of fabricated authority).`);
    }
    if (rec.resolution.bench_verdict_tag === 'BENCH_WARNING') {
      exposure.push(`Turn ${rec.turnNumber}: Bench warning — ${rec.resolution.judge_dialogue}`);
    }
    const strike = rec.resolution.opposing_advocate_strike.trim();
    if (strike) exposure.push(`Opposing exposure flagged (Turn ${rec.turnNumber}): ${strike}`);
  }

  const dedupe = (arr: string[]) => Array.from(new Set(arr)).slice(0, 12);

  return {
    caseTitle: scenario.title,
    clientName: scenario.clientName,
    bench: scenario.bench,
    turnRecords,
    finalFavor,
    admittedPrecedents: admitted,
    exposurePoints: dedupe(exposure),
    consultationQuestions: [],
    completedAt: new Date().toISOString(),
  };
}

const Q_TEMPLATES = [
  'What is the limitation period and the correct forum (writ vs. civil / NGT) for this claim, given the facts on record?',
  'Which statutory authority is the primary duty-bearer here, and what is the strongest enforcement order obtainable against it?',
  'Is an interim injunction / stay preferable to final relief on the timeline the Bench is signalling?',
  'What documentary evidence must be secured immediately (possession records, ID documents, survey maps, deactivation logs) before it is destroyed?',
  'What is the realistic range of ancillary relief — compensation, rehabilitation, damages — the Court may award under the precedents admitted on record?',
];

export function fallbackConsultationQuestions(summary: SessionSummary): string[] {
  return Q_TEMPLATES.map((q, i) => {
    if (i === 3) {
      const riskArea = summary.exposurePoints[0];
      return riskArea ? `What documentary evidence must be secured immediately to counter: "${riskArea}"?` : q;
    }
    return q;
  });
}

export async function enrichConsultationQuestions(
  config: LLMConfig,
  summary: SessionSummary,
  scenario: ScenarioBundle,
): Promise<string[]> {
  const system = [
    'You are a senior Indian litigator preparing an Advocate Consultation Docket.',
    'Based on the simulation transcript below, produce EXACTLY 5 precise, technical, high-leverage questions a junior counsel should put to a practicing advocate.',
    'Questions must be specific to the case posture, cite the likely governing law, and avoid generalities.',
    'Respond with a single JSON object: {"questions": ["...", "...", "...", "...", "..."]}',
  ].join('\n');

  const user = [
    `CASE: ${scenario.title}`,
    `CLIENT: ${scenario.clientName}`,
    `FINAL JUDICIAL FAVOR: ${summary.finalFavor}/100`,
    '',
    'ADMITTED PRECEDENTS:',
    ...summary.admittedPrecedents.map((p) => `- ${p.citation} — ${p.caseName}`),
    '',
    'EXPOSURE POINTS:',
    ...summary.exposurePoints.map((e) => `- ${e}`),
    '',
    'TURN TRANSCRIPT:',
    ...summary.turnRecords.map((r) => `Turn ${r.turnNumber}: ${r.playerAction.rawText} => [${r.resolution.bench_verdict_tag} ${r.resolution.judicial_favor_delta > 0 ? '+' : ''}${r.resolution.judicial_favor_delta}] ${r.resolution.judge_dialogue}`),
    '',
    'Render the JSON now.',
  ].join('\n');

  try {
    const raw = await requestChat({ config, system, user, temperature: 0.4, maxTokens: 1024, jsonSchema: true });
    const obj = JSON.parse(raw) as { questions?: unknown };
    if (Array.isArray(obj.questions)) {
      const qs = obj.questions.filter((x): x is string => typeof x === 'string' && x.length > 8);
      if (qs.length >= 5) return qs.slice(0, 5);
    }
  } catch {
    /* deterministic fallback below */
  }
  return fallbackConsultationQuestions(summary);
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|');
}

export function serializeDocketMarkdown(summary: SessionSummary): string {
  const lines: string[] = [];
  lines.push(`# Advocate Consultation Docket — ${summary.caseTitle}`);
  lines.push('');
  lines.push(`**Client:** ${mdEscape(summary.clientName)}`);
  lines.push(`**Bench:** ${mdEscape(summary.bench)}`);
  lines.push(`**Final Judicial Favor:** ${summary.finalFavor}/100`);
  lines.push(`**Completed:** ${new Date(summary.completedAt).toLocaleString()}`);
  lines.push('');
  lines.push('> Overrool is an educational legal literacy and strategic simulation tool under the Information Technology Act, 2000. It does not provide legal advice and cannot replace a certified advocate registered under the Advocates Act, 1961.');
  lines.push('');

  lines.push('## 1. Executive Summary');
  lines.push('');
  for (const rec of summary.turnRecords) {
    lines.push(`- **Turn ${rec.turnNumber}:** ${mdEscape(rec.playerAction.rawText)} — Bench: *${rec.resolution.bench_verdict_tag}* (${rec.resolution.judicial_favor_delta > 0 ? '+' : ''}${rec.resolution.judicial_favor_delta})`);
  }
  lines.push('');

  lines.push('## 2. Admitted Legal Precedents');
  lines.push('');
  if (!summary.admittedPrecedents.length) {
    lines.push('*No precedent survived adversarial scrutiny on the record.*');
  } else {
    for (const p of summary.admittedPrecedents) {
      lines.push(`- **${p.citation}** — ${mdEscape(p.caseName)} (${p.court})`);
      lines.push(`  - ${mdEscape(p.ratioDecidendi)}`);
    }
  }
  lines.push('');

  lines.push('## 3. Identified Exposure Points');
  lines.push('');
  if (!summary.exposurePoints.length) {
    lines.push('*No exposure flagged during the simulation — verify independently before filing.*');
  } else {
    summary.exposurePoints.forEach((e, i) => lines.push(`${i + 1}. ${mdEscape(e)}`));
  }
  lines.push('');

  lines.push('## 4. Actionable Advocate Consultation Questions');
  lines.push('');
  if (!summary.consultationQuestions.length) {
    lines.push('1. (Questions pending — enrich the docket with a configured key provider.)');
  } else {
    summary.consultationQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  }
  lines.push('');

  lines.push('---');
  lines.push('Generated by Overrool — a BYOK offline-first legal simulation engine. Verify every citation against certified law reports before reliance.');

  return lines.join('\n');
}

export function downloadText(filename: string, content: string, mime = 'text/markdown'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareText(title: string, text: string): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text });
      return;
    }
  } catch {
    /* fall through to clipboard + no-op on unsupported */
  }
  await navigator.clipboard?.writeText(text).catch(() => undefined);
}