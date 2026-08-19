#!/usr/bin/env node
// SWARM run #4, cycle 8 — sealed verification gate for Q-5 (README exit-3 row) and
// Q-7 (SPEC exit-code enumeration gap -> D-45 -> J-7).
//
// Held under SWARM/runs/ for the whole dispatch window (run #3 cycle-14 decision):
// hard rule 5 forbids passing SWARM paths to workflow agents, so a gate living here
// is STRUCTURALLY unreachable to a builder rather than merely forbidden to it.
//
// Every cell re-derives its expected value from the tree, the shipped binary, or
// backlog.json AT RUN TIME. No cell reads a journal note or a prior cycle's summary.
//
// Usage: node run4-c008-gate.mjs [--seal-domain-rule]
//   --seal-domain-rule : print the sha256 of the SPEC Domain-rules Exit-codes bullet
//                        and exit (used once, pre-dispatch, to mint B5's expected value).

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const T = '/opt/targets/aphorism-cli';
// Passed as `--seal <sha>` rather than as an env var: run #4 cycle 6 MEASURED that an
// env-var prefix defeats this harness's allowlist prefix match and is denied.
const SEAL_SHA = (() => { const i = process.argv.indexOf('--seal'); return i !== -1 ? (process.argv[i + 1] || '') : ''; })();
// Sealed pre-dispatch: sha256 of the Domain-rules "Exit codes:" bullet, whitespace-normalised.
const DOMAIN_RULE_SHA = '4545c0eb720e6e546082b0db9dc7070ed9f5e546825498a7aed21d3d63fc4434';

const rows = [];
const cell = (id, what, fn) => {
  let ok = false, detail = '';
  try { const r = fn(); ok = !!r.ok; detail = r.detail; }
  catch (e) { ok = false; detail = 'THREW: ' + e.message; }
  rows.push({ id, what, ok, detail });
  return ok;
};

const read = (rel) => readFileSync(`${T}/${rel}`, 'utf8');
const norm = (s) => s.replace(/\s+/g, ' ').trim();          // whitespace-normalise (cycle-5 C4 lesson)
const sha = (s) => createHash('sha256').update(s).digest('hex');

// ---- structural slicing helpers (cycle-4 A2/A4 lesson: slice by STRUCTURE, never by
// ---- "first occurrence of an id to the next id") ------------------------------------
function mdSection(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n');
}

// Split prose into sentences AFTER whitespace-normalising, so a claim that happens to
// wrap across two source lines is still one sentence (the exact defect that made the
// cycle-5 C4 control go silent).
function sentences(text) {
  return norm(text).split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}

// THE UNIT POOL. Found by this gate's own pre-seal baseline: whitespace-normalising a
// section that contains a markdown TABLE glues every row into one punctuation-free blob,
// and a bag-of-words cell then passes on tokens harvested from three different rows. That
// is the KI-12 / R-1 failure class this repo has already paid for. So a table row is its
// OWN unit and is never merged with its neighbours; prose is sentence-split separately.
function units(section) {
  const lines = (section || '').split('\n');
  const isTable = (l) => /^\s*\|/.test(l);
  const tableUnits = lines.filter((l) => isTable(l) && !/^\s*\|[\s|:-]*\|?\s*$/.test(l)).map(norm);
  const prose = lines.filter((l) => !isTable(l)).join('\n');
  return [...tableUnits, ...sentences(prose)];
}

// A sentence "asserts" a property when it carries every required token AND is not a
// denial of it. Negation-blindness is the cycle-3 A3 defect (/proven minimal/ firing on
// "not proven minimal") — so denial is tested explicitly, not assumed away.
const DENIAL = /\b(never|not|no longer|cannot|does not|doesn't|isn't|won't)\s+(?:\w+\s+){0,3}(?:change|affect|replace|override|apply|happen|occur|exit)\b/i;
function assertingSentence(text, tokens, { denialGuard = true, pool = null } = {}) {
  return (pool || units(text)).find((s) => {
    if (!tokens.every((t) => t.test(s))) return false;
    if (denialGuard && DENIAL.test(s)) return false;
    return true;
  }) || null;
}

// The two substance claims Q-5 requires the document to make.
const NO_DIAGNOSTIC = [/stderr/i, /no (?:readable )?(?:diagnostic|message|output)|nothing (?:is )?(?:printed|written|emitted)|no .{0,20}(?:diagnostic|message) (?:is )?(?:printed|written|emitted)|silent|without (?:any )?(?:diagnostic|message)/i];
const REPLACED_CODE = [/replac|overrid|supersed|destroy|discard|instead of|in place of/i, /(^|[^\d])1([^\d]|$)|`1`/, /(^|[^\d])2([^\d]|$)|`2`/];

// ---- shipped-binary probes (behaviour cells: independent of every document) ---------
function run(argsStr, { stderrTo = 'null' } = {}) {
  const redir = stderrTo === 'full' ? '2>/dev/full'
    : stderrTo === 'closed' ? '2>&-'
    : '2>/dev/null';
  const r = spawnSync('bash', ['-c', `cd ${T} && node bin/aphorism.js ${argsStr} ${redir}`], {
    encoding: 'utf8', timeout: 20000,
  });
  return { code: r.status, stdout: r.stdout ?? '' };
}

// =====================================================================================
// Q-5 — README.md, "## Exit codes" section
// =====================================================================================
const readme = read('README.md');
const exitSection = mdSection(readme, '## Exit codes');
const row3 = (exitSection || '').split('\n').find((l) => /^\|\s*`3`\s*\|/.test(l)) || '';

cell('A0', 'README has a "## Exit codes" section with an exit-3 table row',
  () => ({ ok: !!exitSection && !!row3, detail: row3 ? `row3 present (${row3.length} chars)` : 'MISSING' }));

cell('A1', 'the exit-3 row still documents the STDOUT case (nothing deleted)',
  () => ({ ok: /stdout/i.test(row3), detail: norm(row3).slice(0, 140) }));

// A2 RESHAPED after the pre-seal baseline caught it passing vacuously. The old form was a
// bag-of-words over the whole section ("stderr" + "3" + "failure"), and the SHIPPED,
// UNFIXED exit-3 row already satisfies all three — it names stderr as the DIAGNOSTIC
// DESTINATION, not as a failing stream. Q-5's acceptance requires the ROW ITSELF to cover
// the stderr-side case, so A2 now demands SUBSTANCE inside that one row: it must mention
// stderr AND make at least one of the two claims that only the stderr case supports.
cell('A2', 'the exit-3 ROW itself covers the stderr-side case in substance (not merely naming stderr as where a diagnostic goes)',
  () => {
    const r = norm(row3);
    const hasStderr = /stderr/i.test(r);
    const noDiag = NO_DIAGNOSTIC.every((t) => t.test(r)) && !DENIAL.test(r);
    const replaced = REPLACED_CODE.every((t) => t.test(r)) && !DENIAL.test(r);
    return { ok: hasStderr && (noDiag || replaced), detail: `stderr=${hasStderr} no-diagnostic-claim=${noDiag} replaced-code-claim=${replaced} :: ${r.slice(0, 170)}` };
  });

cell('A3', 'the section asserts NO diagnostic is emitted in the stderr-failure case',
  () => {
    const s = assertingSentence(exitSection || '', NO_DIAGNOSTIC);
    return { ok: !!s, detail: s ? s.slice(0, 200) : 'no asserting unit found' };
  });

cell('A4', 'the section asserts the ALREADY-EARNED exit code (1 or 2) is replaced',
  () => {
    const s = assertingSentence(exitSection || '', REPLACED_CODE);
    return { ok: !!s, detail: s ? s.slice(0, 220) : 'no asserting unit found' };
  });

cell('A5', 'BEHAVIOUR: a failing stderr device gives exit 3 on a would-be exit-1 run',
  () => { const r = run('--tag zzznope', { stderrTo: 'full' }); return { ok: r.code === 3, detail: `exit=${r.code} (expected 3)` }; });

cell('A6', 'BEHAVIOUR: a failing stderr device gives exit 3 on a would-be exit-2 run',
  () => { const r = run('--bogus', { stderrTo: 'full' }); return { ok: r.code === 3, detail: `exit=${r.code} (expected 3)` }; });

cell('A7', 'BEHAVIOUR: nothing reaches stdout in the stderr-failure case',
  () => { const r = run('--tag zzznope', { stderrTo: 'full' }); return { ok: r.stdout === '', detail: `stdout=${JSON.stringify(r.stdout.slice(0, 60))}` }; });

cell('A8', 'CONTROL (must stay true): a WORKING stderr preserves the earned codes 1 and 2',
  () => {
    const a = run('--tag zzznope'), b = run('--bogus');
    return { ok: a.code === 1 && b.code === 2, detail: `--tag zzznope=${a.code} (exp 1), --bogus=${b.code} (exp 2)` };
  });

cell('A9', 'CONTROL (must stay true): a merely CLOSED stderr also preserves 1 and 2 — so exit 3 is specific to a FAILING device, not to an absent one',
  () => {
    const a = run('--tag zzznope', { stderrTo: 'closed' }), b = run('--bogus', { stderrTo: 'closed' });
    return { ok: a.code === 1 && b.code === 2, detail: `--tag zzznope=${a.code} (exp 1), --bogus=${b.code} (exp 2)` };
  });

// ---- Q-5 prose-cell controls: mutate the section IN MEMORY and re-run A3/A4 ----------
const proseCells = (section) => [
  !!assertingSentence(section, NO_DIAGNOSTIC),
  !!assertingSentence(section, REPLACED_CODE),
];

cell('C1', 'CONTROL must-die: strip every unit mentioning stderr from the section -> A3/A4 both FAIL',
  () => {
    const stripped = units(exitSection || '').filter((s) => !/stderr/i.test(s)).join('\n');
    const v = proseCells(stripped);
    return { ok: v.every((x) => x === false), detail: `A3/A4 = ${v.join('/')} (expected false/false)` };
  });

cell('C2', 'CONTROL must-stay-green: a benign REWRAP of the section leaves A3/A4 unchanged',
  () => {
    const rewrapped = (exitSection || '').replace(/([^\n|])\n(?![\n|])/g, '$1 ');   // join wrapped PROSE lines only
    const before = proseCells(exitSection || ''), after = proseCells(rewrapped);
    return { ok: before.join() === after.join(), detail: `before=${before.join('/')} after=${after.join('/')}` };
  });

cell('C3', 'CONTROL must-die: a section whose only stderr unit DENIES the property does NOT satisfy A3/A4',
  () => {
    const decoy = units(exitSection || '').filter((s) => !/stderr/i.test(s)).join('\n') +
      '\nA stderr write failure never changes the exit code, and a diagnostic is always printed to stderr, so exit 1 and exit 2 are not replaced.';
    const v = proseCells(decoy);
    return { ok: v.every((x) => x === false), detail: `A3/A4 = ${v.join('/')} (expected false/false)` };
  });

cell('C8', 'CONTROL must-die: the SHIPPED, UNFIXED exit-3 row does NOT satisfy A2 — the cell the baseline caught passing vacuously stays dead against the text it wrongly accepted',
  () => {
    const shipped = norm('| `3` | The output could not be written — a real stdout write failure (for example the device is full); one `aphorism: …` line on stderr |');
    const noDiag = NO_DIAGNOSTIC.every((t) => t.test(shipped)) && !DENIAL.test(shipped);
    const replaced = REPLACED_CODE.every((t) => t.test(shipped)) && !DENIAL.test(shipped);
    return { ok: !(noDiag || replaced), detail: `no-diagnostic=${noDiag} replaced=${replaced} (both must be false)` };
  });

// =====================================================================================
// Q-7 — .swarm/SPEC.md § Undecided behaviours, + REPORT.md J-7 reconciliation
// =====================================================================================
const spec = read('.swarm/SPEC.md');
const undecided = mdSection(spec, '## Undecided behaviours');
const ENTRY_RE = /^\*\*.*\(measured gap (D-\d+)\)\*\*\s*$/;

function undecidedEntries(section) {
  const lines = (section || '').split('\n');
  const idx = [];
  lines.forEach((l, i) => { const m = l.match(ENTRY_RE); if (m) idx.push({ i, id: m[1], heading: l.trim() }); });
  return idx.map((e, n) => ({
    ...e,
    body: lines.slice(e.i + 1, n + 1 < idx.length ? idx[n + 1].i : lines.length).join('\n'),
  }));
}
const entries = undecidedEntries(undecided);
const d45 = entries.find((e) => e.id === 'D-45');

cell('B1', 'SPEC § Undecided behaviours gained a FOURTH entry and it is D-45',
  () => ({ ok: entries.length === 4 && !!d45, detail: `entries=${entries.length} ids=[${entries.map((e) => e.id).join(',')}] (expected 4 incl D-45)` }));

cell('B2', 'the D-45 entry carries all three grammar bullets, like D-42/D-43/D-44',
  () => {
    if (!d45) return { ok: false, detail: 'D-45 absent' };
    const need = [/^- \*\*Shipped behaviour:\*\*/m, /^- \*\*Why the SPEC does not decide it:\*\*/m, /^- \*\*Status:\*\*/m];
    const hit = need.map((r) => r.test(d45.body));
    return { ok: hit.every(Boolean), detail: `shipped/why/status = ${hit.join('/')}` };
  });

cell('B3', 'the D-45 Status bullet routes the ruling to J-7',
  () => {
    if (!d45) return { ok: false, detail: 'D-45 absent' };
    const st = d45.body.split('\n').find((l) => /^- \*\*Status:\*\*/.test(l)) || '';
    return { ok: /J-7/.test(st), detail: norm(st).slice(0, 160) };
  });

cell('B4', 'the D-45 Shipped-behaviour bullet has SUBSTANCE: names exit 3 on BOTH streams (so the entry cannot be an empty placeholder)',
  () => {
    if (!d45) return { ok: false, detail: 'D-45 absent' };
    const sb = d45.body.split('\n').find((l) => /^- \*\*Shipped behaviour:\*\*/.test(l)) || '';
    const hit = [/stdout/i.test(sb), /stderr/i.test(sb), /(^|[^\d])3([^\d]|$)|`3`/.test(sb)];
    return { ok: hit.every(Boolean), detail: `stdout/stderr/3 = ${hit.join('/')} :: ${norm(sb).slice(0, 160)}` };
  });

// B5: the DOMAIN RULE must not move. This run may not amend the regression floor.
// PRE-SEAL BUG FOUND BY THIS GATE'S OWN BASELINE: the bullet WRAPS across two source
// lines, and taking only the line matching /^- Exit codes:/ sealed half of it — a
// mutation of the continuation clause ("seed value that Number() parses to NaN") would
// have been invisible. The bullet is now captured as a whole LOGICAL bullet.
const domainRule = (() => {
  const lines = (mdSection(spec, '## Domain rules') || spec).split('\n');
  const s = lines.findIndex((l) => /^-\s+Exit codes:/.test(l.trim()));
  if (s === -1) return '';
  let e = s + 1;
  while (e < lines.length && lines[e].trim() !== '' && !/^\s*[-*]\s/.test(lines[e]) && !/^#/.test(lines[e])) e++;
  return lines.slice(s, e).join('\n');
})();
cell('B5', 'MUST-NOT-MOVE: the Domain-rules "Exit codes:" bullet is byte-identical to its pre-dispatch seal',
  () => {
    const h = sha(norm(domainRule));
    return { ok: h === DOMAIN_RULE_SHA, detail: `sha=${h.slice(0, 16)} sealed=${DOMAIN_RULE_SHA.slice(0, 16)} :: ${norm(domainRule).slice(0, 120)}` };
  });

// B6/B7: REPORT.md's J-7 count is RE-DERIVED from backlog.json at run time, never hardcoded.
const backlog = JSON.parse(read('.swarm/backlog.json'));
const j7 = backlog.items.find((i) => i.id === 'J-7');
const truthWord = ((j7?.title || '').match(/^(\w+)\s+CLI behaviours/i) || [, ''])[1].toLowerCase();
const report = read('REPORT.md');
const j7Bullet = (() => {
  const lines = report.split('\n');
  const s = lines.findIndex((l) => /^- \*\*J-7\*\*/.test(l));
  if (s === -1) return '';
  let e = lines.length;
  for (let i = s + 1; i < lines.length; i++) if (/^- \*\*/.test(lines[i]) || /^#/.test(lines[i])) { e = i; break; }
  return lines.slice(s, e).join('\n');
})();

cell('B6', 'REPORT.md\'s J-7 bullet uses the SAME count word backlog.json\'s J-7 title states (derived at run time, not hardcoded)',
  () => {
    if (!truthWord) return { ok: false, detail: 'could not derive count word from backlog J-7 title' };
    if (!j7Bullet) return { ok: false, detail: 'REPORT.md J-7 bullet not found' };
    const stated = (norm(j7Bullet).match(/\*\*J-7\*\*\s*—\s*(\w+)\s+CLI behaviours/i) || [, ''])[1].toLowerCase();
    return { ok: stated === truthWord, detail: `REPORT says "${stated}", backlog says "${truthWord}"` };
  });

cell('B7', 'REPORT.md\'s J-7 bullet enumerates the SIXTH behaviour in substance (exit 3 / the exit-code enumeration)',
  () => {
    const n = norm(j7Bullet);
    const hit = [/exit/i.test(n), /(^|[^\d])3([^\d]|$)|`3`/.test(n)];
    return { ok: hit.every(Boolean), detail: `exit/3 = ${hit.join('/')}` };
  });

// ---- Q-7 controls -------------------------------------------------------------------
cell('C4', 'CONTROL must-die: deleting the D-45 heading from the section drops the entry count to 3 -> B1/B2/B3/B4 all FAIL',
  () => {
    const mutated = (undecided || '').split('\n').filter((l) => !(ENTRY_RE.test(l) && /D-45/.test(l))).join('\n');
    const e = undecidedEntries(mutated);
    const has45 = e.some((x) => x.id === 'D-45');
    return { ok: e.length === 3 && !has45, detail: `entries=${e.length} ids=[${e.map((x) => x.id).join(',')}] (expected 3, no D-45)` };
  });

cell('C5', 'CONTROL must-stay-green: a benign REWRAP of § Undecided behaviours leaves the entry parse unchanged',
  () => {
    const rewrapped = (undecided || '').replace(/([^\n])\n(?=[^\n\-*#])/g, '$1 ');
    const e = undecidedEntries(rewrapped);
    return { ok: e.length === entries.length && e.map((x) => x.id).join() === entries.map((x) => x.id).join(), detail: `before=[${entries.map((x) => x.id).join(',')}] after=[${e.map((x) => x.id).join(',')}]` };
  });

cell('C6', 'CONTROL must-die: mutating the Domain-rules Exit-codes bullet changes B5\'s hash',
  () => {
    const mutated = domainRule.replace('bad usage', 'bad usage, 3 write failure');
    const changed = mutated !== domainRule && sha(norm(mutated)) !== DOMAIN_RULE_SHA;
    return { ok: changed, detail: `mutation applied=${mutated !== domainRule}, hash differs=${sha(norm(mutated)) !== DOMAIN_RULE_SHA}` };
  });

cell('C7', 'CONTROL must-die: rewriting REPORT.md\'s J-7 count word to "seven" makes B6 FAIL (B6 is not satisfied by ANY number word)',
  () => {
    const mutated = j7Bullet.replace(/(\*\*J-7\*\*\s*—\s*)(\w+)(\s+CLI behaviours)/i, '$1seven$3');
    const stated = (norm(mutated).match(/\*\*J-7\*\*\s*—\s*(\w+)\s+CLI behaviours/i) || [, ''])[1].toLowerCase();
    return { ok: mutated !== j7Bullet && stated !== truthWord, detail: `mutated word="${stated}" truth="${truthWord}" (must differ)` };
  });

// =====================================================================================
// Global cells
// =====================================================================================
cell('G1', 'SCOPE: the working tree differs from the seal commit in EXACTLY the three permitted document files',
  () => {
    if (!SEAL_SHA) return { ok: false, detail: 'SEAL_SHA not provided — cell cannot report (a cell that cannot report is not a PASS)' };
    const r = spawnSync('git', ['-C', T, 'diff', '--name-only', SEAL_SHA], { encoding: 'utf8' });
    const changed = (r.stdout || '').split('\n').map((s) => s.trim()).filter(Boolean).sort();
    const allowed = ['.swarm/SPEC.md', 'README.md', 'REPORT.md'].sort();
    const extra = changed.filter((f) => !allowed.includes(f));
    return { ok: extra.length === 0 && changed.length > 0, detail: `changed=[${changed.join(', ')}] extra=[${extra.join(', ')}]` };
  });

cell('G2', 'SUITE: node --test reports >= 118 tests, 0 fail (parser handles BOTH the TAP and the U+2139 spec reporter)',
  () => {
    const r = spawnSync('bash', ['-c', `cd ${T} && node --test test/*.test.js 2>&1`], { encoding: 'utf8', timeout: 180000 });
    const out = r.stdout || '';
    const grab = (k) => { const m = out.match(new RegExp(`^[#\\u2139\\s]*\\s${k}\\s+(\\d+)\\s*$`, 'm')); return m ? Number(m[1]) : null; };
    const tests = grab('tests'), pass = grab('pass'), fail = grab('fail');
    if (tests === null || pass === null || fail === null) {
      return { ok: false, detail: `PARSER COULD NOT READ THE SUMMARY (fails CLOSED, cycle-1 C4 lesson): tests=${tests} pass=${pass} fail=${fail}` };
    }
    return { ok: tests >= 118 && fail === 0 && pass === tests, detail: `tests=${tests} pass=${pass} fail=${fail}` };
  });

// =====================================================================================
if (process.argv.includes('--seal-domain-rule')) {
  console.log('DOMAIN_RULE_NORM:', JSON.stringify(norm(domainRule)));
  console.log('DOMAIN_RULE_SHA :', sha(norm(domainRule)));
  process.exit(0);
}

let pass = 0, fail = 0;
for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.what}\n        ${r.detail}`);
  r.ok ? pass++ : fail++;
}
console.log(`\n=== ${pass} PASS / ${fail} FAIL of ${rows.length} cells ===`);
process.exit(fail === 0 ? 0 : 1);
