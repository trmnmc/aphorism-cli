#!/usr/bin/env node
// Cycle 30 CONDUCTOR VERIFICATION GATE — T-021 attempt 2.
//
// Authored at verification time. The builder has never seen this file.
//
// Every cell is run against BOTH arms so each verdict is attributable rather
// than merely observed (the cycle-27 A7==A8 method):
//   FIXED = the current working tree
//   HEAD  = the same tree with test/readme-tags.test.js reverted to HEAD
//
// Failure diagnostics are extracted ONLY from the TAP YAML block that follows a
// `not ok` line, never from a free-text scan of the whole output. Cycle 28
// recorded a harness whose reason classifier matched a substring that also
// appears in a PASSING test's name and therefore reported a reason on green
// runs; parsing the diagnostic block instead removes that failure mode rather
// than commenting on it.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const GUARD_FILE = 'test/readme-tags.test.js';

// ---------------------------------------------------------------------------
// harness
// ---------------------------------------------------------------------------

function copyRepo(label) {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'c030g-' + label + '-'));
  execFileSync('bash', ['-c', `cd ${TARGET} && tar --exclude=.git -cf - . | tar -xf - -C ${dest}`]);
  return dest;
}

const HEAD_GUARD = execFileSync('bash', ['-c', `cd ${TARGET} && git show HEAD:${GUARD_FILE}`],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });

function runSuite(dir) {
  const r = spawnSync('bash', ['-c',
    `cd ${dir} && node --test --test-reporter=tap test/*.test.js 2>&1`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };

  // Failing tests + the diagnostic block that belongs to each.
  const lines = out.split('\n');
  const failures = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^not ok \d+ - (.*)$/.exec(lines[i]);
    if (!m) continue;
    const diag = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*\.\.\.\s*$/.test(lines[j])) break;
      if (/^(not )?ok \d+ - /.test(lines[j])) break;
      diag.push(lines[j]);
    }
    failures.push({ name: m[1].trim(), diag: diag.join('\n') });
  }

  const tests = num(/^# tests (\d+)/m);
  const pass = num(/^# pass (\d+)/m);
  const fail = num(/^# fail (\d+)/m);
  const parseable = tests !== null && pass !== null && fail !== null;

  return {
    tests, pass, fail, failures, parseable,
    sig: parseable ? `${tests}/${pass}/${fail}` : 'UNPARSEABLE',
    reasons: failures.map((f) => classify(f.diag)),
  };
}

// Classify a FAILING test's diagnostic text. Only ever called on a `not ok`
// block, so a green run has no reasons at all by construction.
function classify(diag) {
  const d = diag.toLowerCase();
  // ORDER AND SPECIFICITY ARE LOAD-BEARING. Repaired mid-verification, cycle 30.
  //
  // v1 tested /format literal/ for LITERAL-PARSE *before* the separator branch.
  // The separator-mismatch assertion's own message quotes the literal it was
  // comparing against ("does not match the README's `--list` format literal
  // `<text> - <author>`"), so it matched the LITERAL-PARSE branch and returned
  // early — rendering three substantively-correct cells (A2, A3, P3) as FAIL.
  //
  // The repair makes LITERAL-PARSE STRICTER, not looser: it now requires the
  // could-not-find phrasing that only the real parse-miss assertion carries, so
  // it can no longer absorb a separator mismatch. The gate as repaired asks for
  // MORE than v1 did — a separator failure must now name itself as one, where v1
  // would have accepted the ambiguous match either way. This is the cycle-23
  // rule: repairing an instrument that cannot distinguish two outcomes is not
  // the same as relaxing a check that can.
  if (/more than one|multiple|ambiguous|two or more|candidates/.test(d)) return 'AMBIGUITY';
  if (/must have a|could not find a section|no section|none found/.test(d) && /behaviou?r/.test(d)) return 'HEADING-PARSE';
  // NB: the span between these two phrases is the placeholder
  // `<text>...<author>`, which contains dots — a [^.] character class here
  // silently fails to match the real message. (Caught on the re-run; second
  // defect in this one classifier.) The load-bearing part is the "could not
  // find a" prefix, which the separator-mismatch message does not carry, so
  // widening the span costs nothing.
  if (/could not find a[\s\S]{0,60}format literal/.test(d)) return 'LITERAL-PARSE';
  if (/does not match the readme|output lines \(one per corpus entry/.test(d)) return 'SEPARATOR-MISMATCH';
  if (/format literal/.test(d)) return 'LITERAL-PARSE-UNSPECIFIC';
  return 'OTHER';
}

// ---------------------------------------------------------------------------
// README mutations
// ---------------------------------------------------------------------------

const REAL_HEADING = '### `--list` behaviour';
const GOOD_LITERAL = '`<text> — <author>`';
const BAD_LITERAL = '`<text> - <author>`';

const id = (s) => s;
const dropBackticks = (s) => s.replace(REAL_HEADING, '### --list behaviour');
const mutateLiteral = (s) => s.replace(GOOD_LITERAL, BAD_LITERAL);
const dropHeading = (s) => s.replace(REAL_HEADING + '\n', '');
const dropLiteral = (s) => s.replace(GOOD_LITERAL, 'the documented form');

// Decoy `### ` heading carrying BOTH tokens and a correct-looking literal.
// Composition order matters: mutateLiteral must run FIRST so it lands on the
// REAL section, then the decoy is inserted carrying a good literal.
const decoyBefore = (s) =>
  s.replace(REAL_HEADING,
    '### Notes on `--list` behaviour\n\n' +
    'Historically `--list` printed each entry as ' + GOOD_LITERAL + '.\n\n' +
    REAL_HEADING);

const decoyAfter = (s) =>
  s.replace('## Tag vocabulary',
    '### More `--list` behaviour\n\n' +
    'For reference, entries are shown as ' + GOOD_LITERAL + '.\n\n' +
    '## Tag vocabulary');

// A heading naming a DIFFERENT flag whose name merely starts with --list.
const decoyPrefixFlag = (s) =>
  s.replace(REAL_HEADING,
    '### `--list-only` behaviour\n\n' +
    'The `--list-only` mode would print ' + GOOD_LITERAL + '.\n\n' +
    REAL_HEADING);

// Structural rewordings of the REAL heading — both tokens present, different
// wording/order/punctuation. These separate "reads structure" from "widened the
// literal to allow optional backticks".
const headingWordOrder = (s) => s.replace(REAL_HEADING, '### behaviour of `--list`');
const headingPunctuation = (s) => s.replace(REAL_HEADING, '### `--list` behaviour:');
const headingAmerican = (s) => s.replace(REAL_HEADING, '### `--list` behavior');

// ---------------------------------------------------------------------------
// cells
// ---------------------------------------------------------------------------
//
// expect: 'GREEN' | 'RED' | null (informational — recorded, not asserted)
// reason: required reason on the RED arm, or null
// arms:   which arm the expectation applies to

const CELLS = [
  // --- scope / control ---
  ['A0', 'PRISTINE control', id, 'GREEN', null, true],

  // --- acceptance clause 1: the honest reformat goes green ---
  ['A1', 'heading backticks dropped (the item\'s false rejection)', dropBackticks, 'GREEN', null, true],

  // --- acceptance clause 2, AS AMENDED: red for the RIGHT reason ---
  ['A2', 'backticks dropped + real literal mutated', (s) => mutateLiteral(dropBackticks(s)),
    'RED', 'SEPARATOR-MISMATCH', true],
  ['A3', 'real literal mutated only (detection must not regress)', mutateLiteral,
    'RED', 'SEPARATOR-MISMATCH', true],

  // --- the cycle-28 rejection: first-match theft must stay caught ---
  ['P1', 'decoy heading BEFORE real, decoy holds a good literal, real literal mutated',
    (s) => decoyBefore(mutateLiteral(s)), 'RED', null, true],
  ['P2', 'decoy heading AFTER real, decoy holds a good literal, real literal mutated',
    (s) => decoyAfter(mutateLiteral(s)), 'RED', null, true],
  ['P3', 'decoy naming a DIFFERENT flag (--list-only), real literal mutated',
    (s) => decoyPrefixFlag(mutateLiteral(s)), 'RED', 'SEPARATOR-MISMATCH', true],

  // --- loudness: a genuine parse miss must never go quiet ---
  ['L1', 'section heading removed entirely', dropHeading, 'RED', null, true],
  ['L2', 'format literal removed from the section', dropLiteral, 'RED', 'LITERAL-PARSE', true],

  // --- discriminators the builder was NOT told about ---------------------
  // These separate a STRUCTURAL re-shape (T-024's aim) from a merely widened
  // literal. They are INFORMATIONAL: T-021's acceptance does not require them,
  // so a red here is recorded and reported, never used to fail the item.
  ['D1', 'heading reworded to "behaviour of `--list`" (both tokens, new order)',
    headingWordOrder, null, null, true],
  ['D2', 'heading with trailing punctuation', headingPunctuation, null, null, true],
  ['D3', 'American spelling "behavior"', headingAmerican, null, null, true],

  // --- ambiguity on an otherwise-correct README (informational) ---------
  ['N1', 'decoy heading present, README otherwise CORRECT',
    decoyBefore, null, null, true],
];

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

const lines = [];
const log = (s) => { lines.push(s); console.log(s); };

let passed = 0;
let failed = 0;
const rows = [];

log('CYCLE 30 VERIFICATION GATE — T-021 attempt 2');
log('arms: FIXED = working tree, HEAD = ' + GUARD_FILE + ' reverted to HEAD');
log('');

for (const [cid, desc, mutate, expect, reason] of CELLS) {
  const arms = {};
  for (const arm of ['FIXED', 'HEAD']) {
    const dir = copyRepo(cid + '-' + arm);
    if (arm === 'HEAD') fs.writeFileSync(path.join(dir, GUARD_FILE), HEAD_GUARD);
    const p = path.join(dir, 'README.md');
    const before = fs.readFileSync(p, 'utf8');
    const after = mutate(before);
    if (cid !== 'A0' && after === before) {
      log(`${cid}  MUTATION DID NOT APPLY on ${arm} — vacuous cell, aborting`);
      process.exit(3);
    }
    fs.writeFileSync(p, after);
    arms[arm] = runSuite(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const f = arms.FIXED;
  const h = arms.HEAD;
  let verdict = 'INFO';
  if (expect) {
    const isGreen = f.parseable && f.fail === 0;
    const isRed = f.parseable && f.fail > 0;
    let ok = expect === 'GREEN' ? isGreen : isRed;
    if (ok && reason) ok = f.reasons.includes(reason);
    verdict = ok ? 'PASS' : 'FAIL';
    if (ok) passed++; else failed++;
  }

  rows.push({ cid, desc, verdict, fixed: f.sig, head: h.sig });
  log(`${cid}  ${desc}`);
  log(`    expect     ${expect || '(informational)'}${reason ? ' / ' + reason : ''}`);
  log(`    FIXED      ${f.sig}   reasons: ${f.reasons.join(', ') || '(none)'}`);
  log(`    HEAD       ${h.sig}   reasons: ${h.reasons.join(', ') || '(none)'}`);
  if (f.failures.length) {
    log(`    FIXED diag ${JSON.stringify(f.failures[0].diag.slice(0, 400))}`);
  }
  log(`    ==> ${verdict}`);
  log('');
}

log('--- summary ----------------------------------------------------------');
for (const r of rows) log(`  ${r.verdict.padEnd(4)}  ${r.cid.padEnd(3)}  FIXED ${r.fixed.padEnd(10)} HEAD ${r.head.padEnd(10)}  ${r.desc}`);
log('');
log(`asserted checks: ${passed} pass / ${failed} fail`);

fs.writeFileSync(path.join(TARGET, '.swarm/runs/cycle-030-verify-T-021.txt'), lines.join('\n') + '\n');
process.exit(failed === 0 ? 0 : 1);
