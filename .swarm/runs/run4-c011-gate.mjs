#!/usr/bin/env node
// run #4 cycle 11 verification gate — Q-8 (pin the README "24 distinct authors" claim)
// and TS-5 (record D-46 in SPEC.md § Undecided behaviours, raise J-7 six -> seven).
//
// Held under SWARM/runs/ for the whole dispatch window: hard rule 5 gives workflow agents
// target paths only, so a gate living here is STRUCTURALLY unreachable to a builder rather
// than merely forbidden to it.
//
// Cell classes, declared so the baseline can be DISCRIMINATING rather than merely
// control-checked (run #4 cycle 8 lesson):
//   RED    — must be FAILING before the work exists and PASSING after
//   GREEN  — must be PASSING both before and after (scope guards, controls, attributions)
//
// Every git read avoids `git status --porcelain` column slicing (instrument defect #22):
// it uses `git diff --name-only HEAD` + `git ls-files --others --exclude-standard`, whose
// output carries no status columns at all.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const TARGET = '/opt/targets/aphorism-cli';
const results = [];
const EXPECT = {};   // cell -> 'RED' | 'GREEN' at baseline

function cell(id, expectAtBaseline, note, fn) {
  EXPECT[id] = expectAtBaseline;
  let ok, detail;
  try {
    const r = fn();
    ok = r.ok;
    detail = r.detail;
  } catch (e) {
    ok = false;
    detail = 'THREW: ' + String(e && e.message ? e.message : e).slice(0, 200);
  }
  results.push({ id, ok, note, detail, expect: expectAtBaseline });
}

function sh(cmd, cwd = TARGET, timeout = 240000) {
  return execFileSync('bash', ['-c', cmd], { cwd, encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 });
}
function shTry(cmd, cwd = TARGET, timeout = 240000) {
  try { return { code: 0, out: sh(cmd, cwd, timeout) }; }
  catch (e) { return { code: e.status === undefined ? -1 : e.status, out: String(e.stdout || '') + String(e.stderr || '') }; }
}

const read = (p) => fs.readFileSync(p, 'utf8');
const gitShow = (rel) => sh(`git show HEAD:${rel}`);

// ---------------------------------------------------------------------------
// Arm construction. Only the paths the suite actually reads are copied, so an arm
// costs kilobytes rather than the repo's 64 MB. The list was MEASURED, not guessed:
// grep over test/ for path.join(__dirname,'..',X) yields README.md, bin, docs
// (docs/corpus-attribution-triage.md only), plus the always-needed src and test.
// ---------------------------------------------------------------------------
const ARM_PATHS = ['bin', 'src', 'test', 'README.md', 'docs/corpus-attribution-triage.md'];

function makeArm(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `c011-${label}-`));
  for (const rel of ARM_PATHS) {
    const src = path.join(TARGET, rel);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
  }
  return dir;
}

// Substitute the PRE-work (sealed HEAD) version of a file into an arm. This is how
// attribution is measured: same mutation, same everything, only the test file's
// content differs. HEAD is the seal commit for the whole dispatch window (the
// conductor is the sole committer), and at baseline time HEAD is simply the clean tree.
function usePreVersion(dir, rel) {
  fs.writeFileSync(path.join(dir, rel), gitShow(rel));
}

function runSuite(dir) {
  const r = shTry('node --test test/*.test.js', dir);
  const grab = (word) => {
    // node --test speaks two summary dialects; read both (instrument defect #14).
    const m = r.out.match(new RegExp(`^[\\u2139#]\\s*${word}\\s+(\\d+)`, 'm'));
    return m ? parseInt(m[1], 10) : -1;
  };
  const tests = grab('tests'), pass = grab('pass'), fail = grab('fail');
  return { code: r.code, tests, pass, fail, green: r.code === 0 && fail === 0 && tests > 0, out: r.out };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
const README_CLAIM = /(\d+)\s+distinct authors/;

function mutateReadmeNumber(dir) {
  const p = path.join(dir, 'README.md');
  const before = read(p);
  const m = before.match(README_CLAIM);
  if (!m) throw new Error('README has no "<n> distinct authors" claim to mutate');
  const n = parseInt(m[1], 10);
  const after = before.replace(README_CLAIM, `${n - 1} distinct authors`);
  fs.writeFileSync(p, after);
  return { changed: after !== before, from: n, to: n - 1 };
}

// Retarget ONE entry's author to a name used nowhere else, so the distinct-author
// count rises by one while every other corpus property (entry count, tags, text)
// is untouched. Chosen over deleting or merging an author because those also move
// the attribution and tag-band figures the suite already guards.
const NOVEL_AUTHOR = 'Q. Novel Author';
function mutateCorpusAuthorCount(dir) {
  const p = path.join(dir, 'src', 'corpus.js');
  const before = read(p);
  const m = before.match(/author:\s*'([^']+)'/);
  if (!m) throw new Error('corpus.js has no single-quoted author field to mutate');
  const after = before.replace(m[0], `author: '${NOVEL_AUTHOR}'`);
  fs.writeFileSync(p, after);
  return { changed: after !== before, replaced: m[1] };
}

function distinctAuthorsIn(dir) {
  const out = sh(
    `node -e "const {corpus}=require('./src/corpus.js');console.log(new Set(corpus.map(e=>e.author)).size)"`,
    dir,
  );
  return parseInt(out.trim(), 10);
}

// A benign reword that PRESERVES the number. A test that snapshots the sentence
// rather than deriving the figure would trip on this; a correct one must not.
function mutateReadmeBenign(dir) {
  const p = path.join(dir, 'README.md');
  const before = read(p);
  const orig = "Of the corpus's 24 distinct authors, exactly one carries a non-ASCII\ncharacter";
  const reword = "The corpus lists 24 distinct authors, and exactly one of them carries a non-ASCII\ncharacter";
  if (!before.includes(orig)) throw new Error('benign-reword anchor not found verbatim in README');
  const after = before.replace(orig, reword);
  fs.writeFileSync(p, after);
  return { changed: after !== before };
}

// ---------------------------------------------------------------------------
// Document readers
// ---------------------------------------------------------------------------
function specText() { return read(path.join(TARGET, '.swarm', 'SPEC.md')); }
function reportText() { return read(path.join(TARGET, 'REPORT.md')); }

// The § Undecided behaviours section: from its heading to the next `## ` heading.
function undecidedSection(txt) {
  const start = txt.indexOf('## Undecided behaviours');
  if (start < 0) return null;
  const rest = txt.slice(start + 3);
  const nextIdx = rest.indexOf('\n## ');
  return nextIdx < 0 ? txt.slice(start) : txt.slice(start, start + 3 + nextIdx);
}

// One entry's block: from its bold header line naming the id to the next bold header
// line (a line that both starts and ends with **) or the section end.
function entryBlock(sectionTxt, id) {
  if (!sectionTxt) return null;
  const lines = sectionTxt.split('\n');
  const isHeader = (l) => /^\*\*.+\*\*\s*$/.test(l);
  let i = lines.findIndex((l) => isHeader(l) && l.includes(id));
  if (i < 0) return null;
  let j = i + 1;
  while (j < lines.length && !isHeader(lines[j])) j++;
  return lines.slice(i, j).join('\n');
}

// The REPORT.md J-7 bullet: from the `- **J-7**` line through the lines indented
// under it (a continuation line starts with whitespace); stops at the next `- **`.
function reportJ7Bullet(txt) {
  const lines = txt.split('\n');
  const i = lines.findIndex((l) => /^-\s+\*\*J-7\*\*/.test(l));
  if (i < 0) return null;
  let j = i + 1;
  while (j < lines.length && !/^-\s+\*\*/.test(lines[j])) j++;
  return lines.slice(i, j).join('\n');
}

// A section of SPEC.md by `## ` heading, for byte-identity comparison.
function specSection(txt, heading) {
  const start = txt.indexOf(heading);
  if (start < 0) return null;
  const rest = txt.slice(start + 3);
  const nextIdx = rest.indexOf('\n## ');
  return nextIdx < 0 ? txt.slice(start) : txt.slice(start, start + 3 + nextIdx);
}

// ===========================================================================
// Q-8 CELLS
// ===========================================================================

const suiteLive = runSuite(TARGET);

cell('G1', 'GREEN', 'SUITE green, tests >= 118, fail 0 (conductor-run, not agent-reported)', () => ({
  ok: suiteLive.green && suiteLive.tests >= 118 && suiteLive.fail === 0,
  detail: `tests=${suiteLive.tests} pass=${suiteLive.pass} fail=${suiteLive.fail} exit=${suiteLive.code}`,
}));

cell('G2', 'GREEN', 'DEFAULT RUN still works', () => {
  const r = shTry('node bin/aphorism.js');
  return { ok: r.code === 0 && r.out.trim().length > 0, detail: `exit=${r.code} bytes=${r.out.length}` };
});

let armQ1, mutQ1;
cell('Q1', 'RED', 'MUTATING the README number kills the suite (the claim is guarded at all)', () => {
  armQ1 = makeArm('q1');
  mutQ1 = mutateReadmeNumber(armQ1);
  const s = runSuite(armQ1);
  return { ok: !s.green, detail: `README ${mutQ1.from}->${mutQ1.to}; tests=${s.tests} pass=${s.pass} fail=${s.fail}` };
});

let armQ2, mutQ2, q2Distinct;
cell('Q2', 'RED', 'MUTATING the corpus kills the suite (the figure is RE-DERIVED, not a literal)', () => {
  armQ2 = makeArm('q2');
  mutQ2 = mutateCorpusAuthorCount(armQ2);
  q2Distinct = distinctAuthorsIn(armQ2);
  const s = runSuite(armQ2);
  return {
    ok: !s.green,
    detail: `authors ${q2Distinct} vs README 24 (replaced "${mutQ2.replaced}"); tests=${s.tests} fail=${s.fail}`,
  };
});

cell('Q3a', 'GREEN', 'ATTRIBUTION: with the PRE-work test file, the README mutation SURVIVES', () => {
  const arm = makeArm('q3a');
  mutateReadmeNumber(arm);
  usePreVersion(arm, 'test/readme-tags.test.js');
  const s = runSuite(arm);
  return { ok: s.green, detail: `tests=${s.tests} pass=${s.pass} fail=${s.fail} exit=${s.code}` };
});

cell('Q3b', 'GREEN', 'ATTRIBUTION: with the PRE-work test file, the corpus mutation SURVIVES', () => {
  const arm = makeArm('q3b');
  mutateCorpusAuthorCount(arm);
  usePreVersion(arm, 'test/readme-tags.test.js');
  const s = runSuite(arm);
  return { ok: s.green, detail: `tests=${s.tests} pass=${s.pass} fail=${s.fail} exit=${s.code}` };
});

cell('Q4', 'GREEN', 'CONVERSE CONTROL: a benign reword keeping the number must NOT trip the suite', () => {
  const arm = makeArm('q4');
  mutateReadmeBenign(arm);
  const s = runSuite(arm);
  return { ok: s.green, detail: `tests=${s.tests} pass=${s.pass} fail=${s.fail} exit=${s.code}` };
});

cell('Q5', 'RED', 'test/readme-tags.test.js declares at least one test name absent from the sealed version', () => {
  const names = (txt) => {
    const out = new Set();
    const re = /^\s*test\(\s*(['"`])([\s\S]*?)\1\s*,/gm;
    let m;
    while ((m = re.exec(txt))) out.add(m[2]);
    return out;
  };
  const pre = names(gitShow('test/readme-tags.test.js'));
  const post = names(read(path.join(TARGET, 'test/readme-tags.test.js')));
  const added = [...post].filter((n) => !pre.has(n));
  return { ok: added.length >= 1, detail: `pre=${pre.size} post=${post.size} added=${added.length}${added.length ? ' :: ' + added[0].slice(0, 90) : ''}` };
});

cell('Q6', 'GREEN', 'SCOPE: README.md byte-identical to the seal (Q-8 is a guard, not a correction)', () => {
  const same = read(path.join(TARGET, 'README.md')) === gitShow('README.md');
  return { ok: same, detail: same ? 'identical' : 'README.md CHANGED' };
});

cell('Q7', 'GREEN', 'SCOPE: src/corpus.js byte-identical to the seal', () => {
  const same = read(path.join(TARGET, 'src/corpus.js')) === gitShow('src/corpus.js');
  return { ok: same, detail: same ? 'identical' : 'src/corpus.js CHANGED' };
});

// ===========================================================================
// TS-5 CELLS
// ===========================================================================

cell('T1', 'RED', 'SPEC § Undecided behaviours gains an entry headed D-46', () => {
  const sec = undecidedSection(specText());
  const blk = entryBlock(sec, 'D-46');
  return { ok: !!blk, detail: blk ? `header=${blk.split('\n')[0].slice(0, 100)}` : 'no D-46 entry' };
});

cell('T2', 'RED', 'D-46 uses the established three-bullet grammar', () => {
  const blk = entryBlock(undecidedSection(specText()), 'D-46') || '';
  const b1 = blk.includes('**Shipped behaviour:**');
  const b2 = blk.includes('**Why the SPEC does not decide it:**');
  const b3 = blk.includes('**Status:**');
  return { ok: b1 && b2 && b3, detail: `shipped=${b1} why=${b2} status=${b3}` };
});

cell('T3', 'RED', 'D-46 states BOTH halves of the discrepancy (the taste note AND the shipped mechanism)', () => {
  const blk = entryBlock(undecidedSection(specText()), 'D-46') || '';
  const quote = blk.includes('dim, not loud');
  // The mechanism: zero styling, plus the two things that DO distinguish the line.
  const noColour = /ANSI|escape|colour|color|styl/i.test(blk);
  const indent = /four[- ]space|4[- ]space|indent/i.test(blk);
  const dash = /em[- ]dash|—/.test(blk);
  return { ok: quote && noColour && indent && dash, detail: `quote=${quote} noColour=${noColour} indent=${indent} dash=${dash}` };
});

cell('T4', 'RED', 'D-46 routes the ruling to J-7 in its Status bullet', () => {
  const blk = entryBlock(undecidedSection(specText()), 'D-46') || '';
  const statusLine = blk.split('\n').find((l) => l.includes('**Status:**')) || '';
  return { ok: statusLine.includes('J-7'), detail: statusLine.slice(0, 140) || 'no Status bullet' };
});

cell('T5', 'RED', "REPORT.md's J-7 bullet counts SEVEN behaviours, not six", () => {
  const blk = reportJ7Bullet(reportText());
  if (!blk) return { ok: false, detail: 'no J-7 bullet in REPORT.md' };
  const head = blk.split('\n')[0];
  const seven = /\bseven\b/i.test(head);
  const six = /\bsix\b/i.test(head);
  return { ok: seven && !six, detail: `seven=${seven} six=${six} :: ${head.slice(0, 110)}` };
});

cell('T6', 'RED', "REPORT.md's J-7 enumeration gained the seventh behaviour (the attribution discrepancy)", () => {
  const blk = reportJ7Bullet(reportText()) || '';
  const hit = /dim|attribution/i.test(blk);
  return { ok: hit, detail: hit ? 'seventh behaviour named in the bullet' : 'enumeration not extended' };
});

cell('T7', 'RED', 'The section comment no longer claims every entry is carried forward verbatim from run #3', () => {
  const sec = undecidedSection(specText()) || '';
  const stillClaims = sec.includes('Carried forward verbatim from run #3');
  const commentKept = sec.includes('Records GAPS, not Domain rules');
  return { ok: !stillClaims && commentKept, detail: `staleClaim=${stillClaims} commentKept=${commentKept}` };
});

cell('T8', 'GREEN', 'SCOPE: SPEC § Taste notes byte-identical (the run may not rewrite it)', () => {
  const a = specSection(specText(), '## Taste notes');
  const b = specSection(gitShow('.swarm/SPEC.md'), '## Taste notes');
  return { ok: a !== null && a === b, detail: a === b ? 'identical' : 'Taste notes CHANGED' };
});

cell('T9', 'GREEN', 'SCOPE: SPEC § Domain rules byte-identical (the regression floor)', () => {
  const a = specSection(specText(), '## Domain rules');
  const b = specSection(gitShow('.swarm/SPEC.md'), '## Domain rules');
  return { ok: a !== null && a === b, detail: a === b ? 'identical' : 'Domain rules CHANGED' };
});

cell('T10', 'GREEN', 'SCOPE: entries D-42..D-45 byte-identical (only an ADDITION is in scope)', () => {
  const now = undecidedSection(specText());
  const pre = undecidedSection(gitShow('.swarm/SPEC.md'));
  const diffs = ['D-42', 'D-43', 'D-44', 'D-45'].filter((id) => entryBlock(now, id) !== entryBlock(pre, id));
  return { ok: diffs.length === 0, detail: diffs.length ? 'CHANGED: ' + diffs.join(',') : 'all four identical' };
});

// ===========================================================================
// SCOPE CELLS (global)
// ===========================================================================

const ALLOWED = new Set(['test/readme-tags.test.js', '.swarm/SPEC.md', 'REPORT.md']);

function changedPaths() {
  // No porcelain, no column slicing (instrument defect #22).
  const tracked = sh('git diff --name-only HEAD').split('\n').map((s) => s.trim()).filter(Boolean);
  const untracked = sh('git ls-files --others --exclude-standard').split('\n').map((s) => s.trim()).filter(Boolean);
  return [...new Set([...tracked, ...untracked])];
}

cell('S1', 'GREEN', 'SCOPE: every changed path is one of the three the wave was given', () => {
  const changed = changedPaths().filter((p) => !p.startsWith('.swarm/runs/'));
  const stray = changed.filter((p) => !ALLOWED.has(p));
  return { ok: stray.length === 0, detail: stray.length ? 'STRAY: ' + stray.join(', ') : `changed=[${changed.join(', ')}]` };
});

cell('S2', 'GREEN', 'SCOPE: nothing under src/ bin/ .github/ changed', () => {
  const bad = changedPaths().filter((p) => /^(src|bin|\.github)\//.test(p));
  return { ok: bad.length === 0, detail: bad.length ? 'CHANGED: ' + bad.join(', ') : 'none' };
});

cell('S3', 'GREEN', 'SCOPE: docs/report-history.md byte-identical — an archive is not rewritten', () => {
  const same = read(path.join(TARGET, 'docs/report-history.md')) === gitShow('docs/report-history.md');
  return { ok: same, detail: same ? 'identical' : 'ARCHIVE REWRITTEN' };
});

// ===========================================================================
// INSTRUMENT CONTROLS — the gate is a program, and a program needs its own baseline
// ===========================================================================

cell('C1', 'GREEN', 'MUST-DIE: the D-46 reader does not fire on a SPEC that lacks D-46', () => {
  const synthetic = '## Undecided behaviours\n\n**Something else (measured gap D-42)**\n\n- **Status:** x\n\n## Next\n';
  return { ok: entryBlock(undecidedSection(synthetic), 'D-46') === null, detail: 'reader stayed dead' };
});

cell('C2', 'GREEN', 'MUST-STAY-GREEN: the D-46 reader DOES fire on a SPEC that has it', () => {
  const synthetic = '## Undecided behaviours\n\n**Dim attribution (measured gap D-46)**\n\n- **Status:** J-7\n\n## Next\n';
  const blk = entryBlock(undecidedSection(synthetic), 'D-46');
  return { ok: !!blk && blk.includes('J-7'), detail: blk ? 'fired' : 'FAILED TO FIRE' };
});

cell('C3', 'GREEN', 'MUST-DIE: the suite parser is not a rubber stamp (a planted failure is seen)', () => {
  const arm = makeArm('c3');
  fs.writeFileSync(path.join(arm, 'test', 'zz-planted.test.js'),
    "const test=require('node:test');const assert=require('node:assert');\ntest('planted failure',()=>{assert.equal(1,2);});\n");
  const s = runSuite(arm);
  return { ok: !s.green && s.fail >= 1, detail: `tests=${s.tests} fail=${s.fail} exit=${s.code}` };
});

cell('C4', 'GREEN', 'MUST-DIE: the README mutation applier really changes the file', () => {
  const arm = makeArm('c4');
  const before = read(path.join(arm, 'README.md'));
  const m = mutateReadmeNumber(arm);
  const after = read(path.join(arm, 'README.md'));
  return { ok: m.changed && before !== after, detail: `${m.from}->${m.to}` };
});

cell('C5', 'GREEN', 'MUST-DIE: the corpus mutation really moves the distinct-author count', () => {
  const arm = makeArm('c5');
  const before = distinctAuthorsIn(arm);
  mutateCorpusAuthorCount(arm);
  const after = distinctAuthorsIn(arm);
  return { ok: before !== after, detail: `${before} -> ${after}` };
});

cell('C6', 'GREEN', "MUST-NOT-OVERREACH: T5's reader is scoped to the J-7 bullet, not the whole REPORT", () => {
  const synthetic = [
    '- **T-040** — six things a human should confirm.',
    '- **J-7** — seven CLI behaviours the SPEC leaves undecided.',
    '  *Settles when:* the attribution is ruled dim or not.',
    '- **TS-1** — six more.',
  ].join('\n');
  const blk = reportJ7Bullet(synthetic);
  const head = blk ? blk.split('\n')[0] : '';
  const ok = !!blk && /\bseven\b/i.test(head) && !/\bsix\b/i.test(head) && blk.includes('Settles when');
  return { ok, detail: ok ? 'scoped correctly (neighbouring "six" ignored, continuation captured)' : `blk=${JSON.stringify((blk || '').slice(0, 90))}` };
});

cell('C7', 'GREEN', 'MUST-STAY-GREEN: every byte-identity reader can read its subject at all', () => {
  const n = ['README.md', 'src/corpus.js', '.swarm/SPEC.md', 'docs/report-history.md', 'REPORT.md']
    .map((r) => gitShow(r).length);
  return { ok: n.every((x) => x > 0), detail: 'sealed sizes=' + n.join(',') };
});

cell('C8', 'GREEN', 'MUST-DIE: the changed-path reader is not blind (it sees a planted untracked file)', () => {
  const probe = path.join(TARGET, '.c011-gate-probe.tmp');
  fs.writeFileSync(probe, 'x');
  let seen;
  try { seen = changedPaths().includes('.c011-gate-probe.tmp'); }
  finally { fs.rmSync(probe, { force: true }); }
  const goneAgain = !changedPaths().includes('.c011-gate-probe.tmp');
  return { ok: seen && goneAgain, detail: `saw=${seen} cleanedUp=${goneAgain}` };
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
let pass = 0, fail = 0, mism = 0;
const mode = process.env.GATE_MODE || 'verify';   // 'baseline' also checks RED/GREEN expectations
console.log('');
for (const r of results) {
  r.ok ? pass++ : fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${pad(r.id, 5)} ${pad(r.expect, 5)} ${r.note}`);
  console.log(`                  ${r.detail}`);
}
console.log('');
console.log(`=== ${pass} PASS / ${fail} FAIL of ${results.length} cells ===`);

if (mode === 'baseline') {
  console.log('\n--- BASELINE DISCRIMINATION CHECK (a baseline that only checks its controls ships a false PASS) ---');
  for (const r of results) {
    const want = r.expect === 'GREEN';
    if (r.ok !== want) {
      mism++;
      console.log(`  MISMATCH ${r.id}: expected ${r.expect} at baseline, observed ${r.ok ? 'PASS' : 'FAIL'}`);
    }
  }
  console.log(mism === 0
    ? '  BASELINE SOUND — every RED cell is red and every GREEN cell is green.'
    : `  BASELINE UNSOUND — ${mism} cell(s) disagree. Repair the gate BEFORE sealing.`);
  process.exit(mism === 0 ? 0 : 1);
}

process.exit(fail === 0 ? 0 : 1);
