/** Bundled entry for the live provider check. Keeps the secret in memory only. */
import { genDeskAnalysis } from '../src/core/docEngine';
import { defaultModel } from '../src/core/storage';
import { LLMOrchestratorError } from '../src/core/providerCall';
import type { DeskResult, LLMConfig, LLMProvider } from '../src/types/legal';

function pass(label: string, detail = ''): void {
  console.log(`  PASS  ${label}${detail ? `  ${detail}` : ''}`);
}
function fail(label: string, detail = ''): void {
  console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ''}`);
}

/** Verbatim fragments from the test document. A finding that quotes the document
 *  must contain one of these — this is what separates analysis from confabulation. */
const DOC_SNIPPETS = [
  '14 days written notice',
  '12-month fixed term',
  'GBP 1,150',
  'No inventory was signed',
  'damp on the bedroom ceiling',
];

/** Statute numbers that do not exist. Inventing one is the failure we hunt. */
const FABRICATED = /\b(s\s*\d{1,3}\s*\(?\d{4}\)?|section\s+\d+[A-Z]?\s+of\s+the\s+\d{4}\s+act)/gi;

export async function runLiveCheck(args: { provider: string; apiKey: string; doc: string; model?: string | null }): Promise<number> {
  const provider = args.provider as LLMProvider;
  const model = args.model ?? defaultModel(provider);
  const config: LLMConfig = { provider, apiKey: args.apiKey, model };

  console.log(`\n── Live ${provider} call (${model}) — key held in memory only ───`);

  let result: DeskResult;
  const started = Date.now();
  try {
    result = await genDeskAnalysis(config, 'risks', args.doc);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (err instanceof LLMOrchestratorError) {
      fail('live call reached the provider', `${err.code ?? 'error'}: ${msg.slice(0, 120)}`);
      console.log('\n  The network path is exercised; the key or model is the problem.');
    } else {
      fail('live call reached the provider', msg.slice(0, 160));
    }
    return 1;
  }
  const ms = Date.now() - started;
  pass('live call reached the provider and parsed', `${ms}ms`);

  // Shape checks against the REAL RiskFinding contract:
  //   sentence: string, kind: enum, severity: 1-5 number, note: string
  const findings = Array.isArray(result.findings) ? result.findings : [];
  if (findings.length === 0) {
    fail('desk op returned findings', 'zero findings');
    return 1;
  }
  pass('desk op returned findings', `${findings.length} findings`);

  const KINDS = new Set(['obligation', 'risk', 'inconsistency', 'opportunity', 'unclear']);
  const wellFormed = findings.every(
    (f) =>
      typeof f.sentence === 'string' &&
      f.sentence.length > 0 &&
      KINDS.has(f.kind) &&
      typeof f.severity === 'number' &&
      f.severity >= 1 &&
      f.severity <= 5 &&
      typeof f.note === 'string' &&
      f.note.length > 0,
  );
  if (wellFormed) pass('every finding matches the RiskFinding contract', `${findings.length}/${findings.length} well-formed`);
  else {
    const bad = findings.find(
      (f) => typeof f.sentence !== 'string' || !KINDS.has(f.kind) || typeof f.severity !== 'number',
    );
    fail('every finding matches the RiskFinding contract', `got keys [${Object.keys(bad ?? {}).join(', ')}]`);
    return 1;
  }

  const grounded = findings.every((f) => DOC_SNIPPETS.some((s) => f.sentence.includes(s)));
  if (grounded) pass('every finding quotes the document', `${findings.length}/${findings.length} grounded`);
  else {
    const ungrounded = findings.filter((f) => !DOC_SNIPPETS.some((s) => f.sentence.includes(s)));
    fail('every finding quotes the document', `${ungrounded.length} invented: "${String(ungrounded[0]?.sentence).slice(0, 70)}…"`);
    return 1;
  }

  // The honesty check. A UK tenancy question should never produce a US-style
  // statute cite out of nowhere; if it does, the model is confabulating.
  const allText = findings.map((f) => `${f.sentence} ${f.note}`).join(' ');
  const invented = allText.match(FABRICATED) ?? [];
  if (invented.length > 0) {
    fail('no invented statute references', `model produced: ${[...new Set(invented)].join(', ')}`);
    return 1;
  }
  pass('no invented statute references', 'clean');

  console.log('\n  findings, verbatim from the model:');
  for (const f of findings.slice(0, 3)) {
    console.log(`    [${f.severity}/5 ${f.kind}] "${f.sentence.slice(0, 96)}…"`);
    console.log(`      ${f.note.slice(0, 130)}…`);
  }

  console.log(`\n  Live BYOK path verified: allowlist -> request -> response -> parse -> DeskResult.\n`);
  return 0;
}
