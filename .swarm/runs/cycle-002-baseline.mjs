#!/usr/bin/env node
// cycle 2 PRE-DISPATCH BASELINE for J-2 (Attribution half: T-024a, T-032, KI-9, KI-10).
//
// Deliberately written OUTSIDE the target tree (/opt/swarm/runs/, not
// <target>/.swarm/runs/) because KI-8 records that a builder can read anything
// inside the target directory. The DECIDING discriminators are authored only
// after the builder returns; this file holds the already-published measurements
// re-measured live at HEAD, nothing more.
//
// Method is the repo's own standing instrument (cycle 50 onward): copy the whole
// tree to a throwaway dir, mutate ONE thing, run the project's own test_cmd.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SRC = '/opt/targets/aphorism-cli';
const TESTCMD = ['--test', 'test/readme-tags.test.js'];
const FULLCMD = ['--test', 'test/args.test.js', 'test/cli.test.js',
                 'test/readme-tags.test.js', 'test/select.test.js'];

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c2base-'));
  execFileSync('cp', ['-a', SRC + '/.', dir]);
  // drop the swarm bookkeeping so nothing here can be confused for target state
  fs.rmSync(path.join(dir, '.swarm'), { recursive: true, force: true });
  return dir;
}

function runTests(dir, cmd) {
  try {
    const out = execFileSync('node', cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// node --test writes the "spec" reporter when stdout is not a TTY in this Node
// build: summary lines are "ℹ tests 21" and failures are marked "✖".
// Both the spec and the TAP shapes are accepted so this harness does not become
// silently blind if the reporter default changes.
function tally(out) {
  const g = (k) => {
    const m = out.match(new RegExp('^(?:ℹ |# )' + k + ' (\\d+)', 'm'));
    return m ? +m[1] : null;
  };
  const names = [
    ...[...out.matchAll(/^✖ (.+?)(?: \([\d.]+ms\))?$/gm)].map((m) => m[1].trim()),
    ...[...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim()),
  ];
  return { tests: g('tests'), pass: g('pass'), fail: g('fail'), failed: names };
}

// ---------------------------------------------------------------------------
// The shipped Attribution section, verbatim, and the mutations to plant.
// ---------------------------------------------------------------------------
const README = path.join(SRC, 'README.md');
const shipped = fs.readFileSync(README, 'utf8');
const ATTR_START = shipped.indexOf('## Attribution');
const ATTR_END = shipped.indexOf('\n## ', ATTR_START + 1);
const shippedAttr = shipped.slice(ATTR_START, ATTR_END);

const PROSE_TRUE_SUBJECT_FIRST = `## Attribution

The author printed with each aphorism is who the line is **commonly credited to**, not an
author checked against a primary source. Programming aphorisms are widely misattributed.
[\`docs/corpus-attribution-triage.md\`](docs/corpus-attribution-triage.md) ranks the corpus
by how likely the attribution is to be wrong. 8 of the 50 entries are rated HIGH. Nothing
in that list has been resolved yet.
`;

const PROSE_TRUE_FEWER_HIGH = shippedAttr.replace(
  'Nothing in that list has been resolved yet.',
  'Nothing in that list has been resolved yet. Fewer than 9 are rated HIGH.'
);

const PROSE_TRUE_FEWER_ENTRIES = shippedAttr.replace(
  'Nothing in that list has been resolved yet.',
  'Nothing in that list has been resolved yet. Fewer than 51 entries are listed.'
);

const PROSE_FALSE_ACROSS_DASH = shippedAttr.replace(
  'Nothing in that list has been resolved yet.',
  'Nothing in that list has been resolved yet. A later audit note records 9 — HIGH entries — in total.'
);

const WRONG_HIGH = shippedAttr.replace('8 are rated HIGH', '9 are rated HIGH');
const WRONG_ENTRIES = shippedAttr.replace('ranks all 50\nentries', 'ranks all 51\nentries');

const CELLS = [
  ['P0  pristine, untouched                              ', null,                     'TRUE  (control: must be GREEN)'],
  ['FR1 TRUE prose, subject-first partitive               ', PROSE_TRUE_SUBJECT_FIRST, 'TRUE  (a correct README: GREEN is right)'],
  ['FR2 TRUE prose, "Fewer than 9 are rated HIGH."        ', PROSE_TRUE_FEWER_HIGH,    'TRUE  (8 < 9: GREEN is right)'],
  ['FR3 TRUE prose, "Fewer than 51 entries are listed."   ', PROSE_TRUE_FEWER_ENTRIES, 'TRUE  (50 < 51: GREEN is right)'],
  ['SH1 FALSE claim, digit across an em dash from marker  ', PROSE_FALSE_ACROSS_DASH,  'FALSE (a wrong README: RED is right)'],
  ['XH1 FALSE, shipped shape, HIGH count 8 -> 9           ', WRONG_HIGH,               'FALSE (a wrong README: RED is right)'],
  ['XE1 FALSE, shipped shape, entries 50 -> 51            ', WRONG_ENTRIES,            'FALSE (a wrong README: RED is right)'],
];

console.log('=== cycle 2 PRE-DISPATCH BASELINE at HEAD — J-2 Attribution half ===');
console.log('target : ' + SRC);
console.log('rev    : ' + execFileSync('git', ['-C', SRC, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
console.log('');

const dir0 = freshCopy();
const full = tally(runTests(dir0, FULLCMD).out);
console.log('FULL SUITE FLOOR (node --test test/*.test.js equivalent): tests=%d pass=%d fail=%d',
            full.tests, full.pass, full.fail);
fs.rmSync(dir0, { recursive: true, force: true });
console.log('');

const results = [];
for (const [label, attr, truth] of CELLS) {
  const dir = freshCopy();
  if (attr !== null) {
    const rp = path.join(dir, 'README.md');
    const cur = fs.readFileSync(rp, 'utf8');
    fs.writeFileSync(rp, cur.slice(0, ATTR_START) + attr.replace(/\n?$/, '\n') + cur.slice(ATTR_END + 1));
  }
  const r = runTests(dir, TESTCMD);
  const t = tally(r.out);
  if (t.fail === null) throw new Error('tally failed to parse the reporter — refusing to report a verdict:\n' + r.out.slice(-1500));
  const verdict = t.fail === 0 ? 'GREEN' : 'RED  ';
  console.log('%s %s  %d/%d/%d  | want: %s', label, verdict, t.tests, t.pass, t.fail, truth);
  for (const n of t.failed) console.log('        failing: ' + n);
  // pull the assertion message so we can see WHICH number the guard names
  const msg = r.out.match(/README Attribution section states[^\n]*/);
  if (msg) console.log('        names  : ' + msg[0].slice(0, 200));
  results.push({ label: label.trim(), verdict: verdict.trim(), ...t });
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('');
console.log('=== the two facts this baseline is here to fix in place at HEAD ===');
console.log('FALSE REJECTIONS (a correct README rejected): expect FR-cells RED at HEAD');
console.log('SILENT HOLE (a wrong README accepted):        expect SH1 GREEN at HEAD (KI-10)');
