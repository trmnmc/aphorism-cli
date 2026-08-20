#!/usr/bin/env node
// Sealed verification gate — improvement run #6, cycle 2, item Q-4.
//
// Authored by the CONDUCTOR before dispatch and held under SWARM/runs/, which is
// outside every path the builder can reach (the target dir is the builder's only
// additionalDirectories entry), so this file is structurally unreachable rather
// than merely forbidden by a prompt line (L-042).
//
// Usage: node cycle-002-q4-gate.mjs <target-dir>
// Exit 0 iff every cell PASSes.
//
// Q-4's acceptance, restated by the conductor in its own words: the Tag
// vocabulary section's three counts (distinct tags / tags on 2+ entries / tags
// on exactly one entry) must be read from a structural marker the document
// owns, never from prose matched by regex (L-043); the honest prose that the
// old guards forced into a self-apologising double-restatement must be gone;
// and the re-shape must be priced on TRUE inputs against the unfixed baseline —
// every kill arm paired with a converse control that must stay GREEN (L-044).

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const target = process.argv[2];
if (!target) {
  console.error('usage: node cycle-002-q4-gate.mjs <target-dir>');
  process.exit(2);
}

const README = path.join(target, 'README.md');
const TAGTEST = path.join(target, 'test', 'readme-tags.test.js');

// Q-5 invariants, taken from state.json.baseline_2026_08_20_run6 at kickoff.
const CORPUS_SHA = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';
const HELP_SHA = 'd759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64';

const cells = [];
function cell(id, verdict, detail) {
  cells.push({ id, verdict, detail });
}

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// --- helpers ---------------------------------------------------------------

function runSuite(files) {
  try {
    const out = execFileSync(
      process.execPath,
      ['--test', '--test-reporter=tap', ...files],
      { cwd: target, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return { ok: true, out };
  } catch (err) {
    return { ok: false, out: String(err.stdout || '') + String(err.stderr || '') };
  }
}

function tap(out) {
  const g = (k) => {
    const m = out.match(new RegExp('^# ' + k + ' (\\d+)', 'm'));
    return m ? parseInt(m[1], 10) : null;
  };
  return { tests: g('tests'), pass: g('pass'), fail: g('fail'), skipped: g('skipped') };
}

// Names of failing tests, read from the TAP "not ok" lines.
function failingNames(out) {
  return out
    .split('\n')
    .filter((l) => /^not ok \d+ - /.test(l.trim()))
    .map((l) => l.trim().replace(/^not ok \d+ - /, ''));
}

// Run ONLY the tag-vocabulary guards against a mutated README, then restore.
// Isolation matters: the neighbouring citation guard fires on any dirty tree
// for its own unrelated reason and would mask every verdict here.
function withMutatedReadme(mutate, fn) {
  const pristine = fs.readFileSync(README, 'utf8');
  try {
    const mutated = mutate(pristine);
    if (mutated === pristine) return { noop: true };
    fs.writeFileSync(README, mutated);
    return fn();
  } finally {
    fs.writeFileSync(README, pristine);
    if (fs.readFileSync(README, 'utf8') !== pristine) {
      console.error('FATAL: README not restored');
      process.exit(3);
    }
  }
}

// A mutation arm: the tag-vocabulary suite MUST go red, and the failure must be
// attributable to a named guard rather than to collateral damage (L-029).
function killArm(id, mutate, note) {
  const r = withMutatedReadme(mutate, () => runSuite(['test/readme-tags.test.js']));
  if (r.noop) return cell(id, 'FAIL', 'mutation was a no-op — the shape it targets is not in the tree; ' + note);
  const t = tap(r.out);
  const names = failingNames(r.out);
  if (t.fail > 0) cell(id, 'PASS', 'fail=' + t.fail + ' — ' + (names[0] || '(unnamed)').slice(0, 90));
  else cell(id, 'FAIL', 'SILENT: suite stayed green under ' + note);
}

// A converse control: an HONEST edit that must leave the suite GREEN. Without
// this arm a kill proves only that something reacts, not that the guard reads
// meaning rather than a snapshot of the file (L-044).
function surviveArm(id, mutate, note) {
  const r = withMutatedReadme(mutate, () => runSuite(['test/readme-tags.test.js']));
  if (r.noop) return cell(id, 'FAIL', 'control mutation was a no-op — it did not exercise anything; ' + note);
  const t = tap(r.out);
  const names = failingNames(r.out);
  if (t.fail === 0) cell(id, 'PASS', 'green under ' + note);
  else cell(id, 'FAIL', 'FALSE REJECTION: fail=' + t.fail + ' on an honest edit — ' + (names[0] || '').slice(0, 90));
}

// Locate the Tag vocabulary section the way the document's own guards do.
function section(text) {
  const s = text.indexOf('## Tag vocabulary');
  if (s === -1) return null;
  const n = text.indexOf('\n## ', s + 1);
  return { start: s, end: n > -1 ? n : text.length };
}

// Rewrite one row of the `| Tag vocabulary | Count |` table, scoped to the
// section so a same-named row elsewhere in the document cannot be hit instead.
function setRow(label, value) {
  return (t) => {
    const b = section(t);
    if (!b) return t;
    const sec = t.slice(b.start, b.end);
    const re = new RegExp('^(\\|\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\|\\s*)(\\d+)(\\s*\\|)$', 'm');
    if (!re.test(sec)) return t;
    return t.slice(0, b.start) + sec.replace(re, '$1' + value + '$3') + t.slice(b.end);
  };
}

// --- CELL 1: the suite, as the repo actually runs it ------------------------
// Q-5 requires green at >= 121 tests. The ONE sanctioned exception is the
// node-support citation guard, whose subject is a git pathspec: it CANNOT be
// green on the commit that changes that pathspec, because the CI run that would
// refresh its citation cannot exist until after the push (L-043, standing limit
// 2 in the README's own Node support section). Any OTHER failure fails this gate.
{
  const files = fs
    .readdirSync(path.join(target, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => 'test/' + f);
  const r = runSuite(files);
  const t = tap(r.out);
  const names = failingNames(r.out);
  const offSpec = names.filter((n) => !/Node support citation/.test(n));
  if (t.tests === null) cell('S1-SUITE', 'FAIL', 'could not parse a TAP summary from the run');
  else if (offSpec.length === 0)
    cell('S1-SUITE', 'PASS', 'tests=' + t.tests + ' pass=' + t.pass + ' fail=' + t.fail +
      ' — failures confined to the citation guard: ' + (names.length ? names.map((n) => n.slice(0, 60)).join(' | ') : 'none'));
  else cell('S1-SUITE', 'FAIL', 'off-spec failures: ' + offSpec.map((n) => n.slice(0, 80)).join(' | '));

  if (t.tests === null) cell('S2-COUNT', 'FAIL', 'no TAP summary');
  else if (t.tests >= 121) cell('S2-COUNT', 'PASS', 'tests=' + t.tests + ' (>= 121, the Q-5 floor)');
  else cell('S2-COUNT', 'FAIL', 'tests=' + t.tests + ' < 121 — Q-5 floor breached (baseline was 121)');
}

// --- CELL 3/4: Q-5 byte invariants -----------------------------------------
{
  const got = sha(fs.readFileSync(path.join(target, 'src', 'corpus.js')));
  cell('S3-CORPUS', got === CORPUS_SHA ? 'PASS' : 'FAIL', 'sha256=' + got.slice(0, 12) + (got === CORPUS_SHA ? ' (unchanged)' : ' EXPECTED ' + CORPUS_SHA.slice(0, 12)));
}
{
  const out = execFileSync(process.execPath, ['bin/aphorism.js', '--help'], { cwd: target, encoding: 'utf8' });
  const got = sha(Buffer.from(out));
  cell('S4-HELP', got === HELP_SHA ? 'PASS' : 'FAIL', 'sha256=' + got.slice(0, 12) + (got === HELP_SHA ? ' (unchanged)' : ' EXPECTED ' + HELP_SHA.slice(0, 12)));
}

// --- CELL 5: no prose regex left reading these three counts ----------------
// The retired guards matched the SECTION TEXT with regexes. A structural read
// names the row it wants. This cell is the difference (L-043).
{
  const src = fs.readFileSync(TAGTEST, 'utf8');
  // Strip comments so a comment NARRATING the retired regex cannot fail this
  // cell — the file documents its own history at length, on purpose.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const retired = [
    { re: /\[\^\.;\\n\]\*\\bor more\\b/, what: 'the "<N> tags ... or more" prose reader' },
    { re: /\[\^\.;\\n\]\*\\bexactly one\\b/, what: 'the "<N> ... exactly one" prose reader' },
    { re: /\(\\d\+\)\\s\+distinct tags/, what: 'the "<N> distinct tags" prose reader' },
    { re: /\(\\d\+\)\\s\+tags\?? ?\\?s?\+?tags appear exactly once/, what: 'the "tags appear exactly once" prose reader' },
  ];
  const left = retired.filter((r) => r.re.test(code));
  cell('S5-NOPROSE', left.length === 0 ? 'PASS' : 'FAIL',
    left.length === 0 ? 'no retired prose-count regex survives in executable code' : 'still present: ' + left.map((l) => l.what).join('; '));

  // ...and each of the three counts must be read structurally by label.
  const labels = ['Distinct tags', 'Tags on 2 or more entries', 'Tags on exactly one entry'];
  const missing = labels.filter((l) => !new RegExp('readTagVocabCount\\([^)]*[\'"]' + l + '[\'"]').test(code));
  cell('S6-STRUCTURAL', missing.length === 0 ? 'PASS' : 'FAIL',
    missing.length === 0 ? 'all three counts read via readTagVocabCount(<label>)' : 'no structural read for: ' + missing.join(', '));
}

// --- CELLS 7-9: kill arms on the three counts (FIXED column) ---------------
killArm('K1-DISTINCT', setRow('Distinct tags', 99), 'a wrong "Distinct tags" row');
killArm('K2-MULTI', setRow('Tags on 2 or more entries', 99), 'a wrong "Tags on 2 or more entries" row');
killArm('K3-SINGLE', setRow('Tags on exactly one entry', 99), 'a wrong "Tags on exactly one entry" row');

// --- CELLS 10-12: well-formedness kill arms --------------------------------
killArm('K4-DUP', (t) => {
  const b = section(t);
  if (!b) return t;
  const sec = t.slice(b.start, b.end);
  const m = sec.match(/^\|\s*Distinct tags\s*\|\s*\d+\s*\|$/m);
  if (!m) return t;
  return t.slice(0, b.start) + sec.replace(m[0], m[0] + '\n| Distinct tags | 7 |') + t.slice(b.end);
}, 'the same row label stated twice with different values');

killArm('K5-UNRECOGNISED', (t) => {
  const b = section(t);
  if (!b) return t;
  const sec = t.slice(b.start, b.end);
  const m = sec.match(/^\|\s*Distinct tags\s*\|\s*\d+\s*\|$/m);
  if (!m) return t;
  return t.slice(0, b.start) + sec.replace(m[0], m[0] + '\n| Tags in the robust pool | 9 |') + t.slice(b.end);
}, 'a row under a label no guard reads');

killArm('K6-TABLEGONE', (t) => t.replace(/^\| Tag vocabulary \| Count \|\n\|[-\s|]+\|\n(?:\|.*\|\n)+/m, ''),
  'the counts table deleted outright');

// --- CELLS 13-14: converse controls (the price on TRUE inputs) -------------
// E3/D1 from the retired guard's own measured cell set: honest prose edits that
// leave every number true. These are the sentences Q-4 exists to make writable.
surviveArm('C1-REWORD', (t) => {
  const b = section(t);
  if (!b) return t;
  const sec = t.slice(b.start, b.end);
  // Reword the lead-in prose without touching the table.
  const lines = sec.split('\n');
  const out = lines.map((l) =>
    /^\|/.test(l) || /^#/.test(l) || l.trim() === ''
      ? l
      : l.replace(/\bdistribution\b/gi, 'spread').replace(/\buneven\b/gi, 'lopsided').replace(/\bpool\b/gi, 'bucket')
  );
  return t.slice(0, b.start) + out.join('\n') + t.slice(b.end);
}, 'an honest prose reword that leaves every number and the table untouched');

// THE discriminating cell, and the one the whole item is priced on. Deleting
// the section's lead-in prose paragraph is an HONEST edit: every number left in
// the document stays true, because the counts either live in the table (fixed
// tree) or are simply no longer stated (unfixed tree). Written structurally so
// it is measurable against BOTH trees — on the unfixed tree it is expected to
// FIRE (the old guards need that prose to exist, which is the false rejection
// this item removes), on the fixed tree it must stay GREEN. Reported as two
// columns, never as one verdict (L-043).
surviveArm('C2-PROSEGONE', (t) => {
  const b = section(t);
  if (!b) return t;
  const sec = t.slice(b.start, b.end);
  const paras = sec.split('\n\n');
  // The lead-in prose paragraph: the first block after the heading that is not
  // a heading, not a table, not an italic machine-checked note, and not blank.
  const idx = paras.findIndex((p, i) => {
    if (i === 0) return false; // paras[0] carries the "## Tag vocabulary" heading
    const s = p.trim();
    if (!s) return false;
    if (s.startsWith('#') || s.startsWith('|') || s.startsWith('*')) return false;
    return /\btags?\b/i.test(s);
  });
  if (idx === -1) return t;
  const kept = paras.slice(0, idx).concat(paras.slice(idx + 1));
  return t.slice(0, b.start) + kept.join('\n\n') + t.slice(b.end);
}, 'the lead-in prose paragraph removed entirely, every remaining number intact');

// --- report ----------------------------------------------------------------
const failed = cells.filter((c) => c.verdict !== 'PASS');
console.log('CELL RESULTS — Q-4 sealed gate (cycle 2, improvement run #6)');
console.log('target: ' + target);
for (const c of cells) console.log('  ' + c.id.padEnd(16) + c.verdict.padEnd(6) + c.detail);
console.log('');
console.log('VERDICT: ' + (cells.length - failed.length) + '/' + cells.length + ' cells PASS');
process.exit(failed.length === 0 ? 0 : 1);
