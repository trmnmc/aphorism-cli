// ===========================================================================
// TS-4 VERIFICATION GATE — authored by the CONDUCTOR at cycle 10, BEFORE any
// agent was dispatched. Lives OUTSIDE the target repo so a builder working in
// /opt/targets/aphorism-cli cannot read it. sha256 sealed and journaled
// pre-dispatch (cycle.md step 6.1, hard rule 2).
//
// Acceptance being proven (backlog TS-4):
//   "The --help line that tells a user how to discover tags prints a COMPLETE,
//    copy-pasteable command line (it names the binary as a user invokes it)
//    and, as printed, actually produces a deduped tag list when pasted into a
//    shell that has jq. No new flag, no new dependency, corpus untouched."
//
// THE DISCRIMINATOR (A4-A6): this gate does not grep for a nice-looking
// string. It EXTRACTS the command text out of the live --help output and
// EXECUTES it in bash, then compares its stdout against the tag vocabulary
// derived INDEPENDENTLY by require()ing src/corpus.js. A hardcoded or faked
// list would have to reproduce the corpus exactly; a pipeline that emits
// duplicates (the shipped defect) fails A5 no matter how it is worded.
//
// Exit 0 = PASS, 1 = FAIL. Never edit this file to open the gate.
// ===========================================================================
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const T = '/opt/targets/aphorism-cli';
const BASE = process.env.GATE_BASE || '852da64';
const require = createRequire(T + '/');

let FAIL = 0;
const pass = (m) => console.log('PASS  ' + m);
const fail = (m) => { console.log('FAIL  ' + m); FAIL = 1; };
const info = (m) => console.log('      ' + m);
const sh = (cmd) => execSync(cmd, { cwd: T, shell: '/bin/bash', encoding: 'utf8' });
const shTry = (cmd) => {
  try { return { rc: 0, out: sh(cmd) }; }
  catch (e) { return { rc: e.status ?? 1, out: e.stdout || '', err: (e.stderr || '').trim() }; }
};

console.log('=== TS-4 gate @ ' + sh('git rev-parse --short HEAD').trim() + ' ===');

const HELP = shTry('node bin/aphorism.js --help 2>&1').out;

// --- A1: a tag-discovery line exists and mentions jq -----------------------
const LINE = HELP.split('\n').find((l) => l.includes('jq')) || '';
if (LINE) { pass('A1 help has a jq tag-discovery line'); info('line: ' + LINE); }
else fail('A1 no jq tag-discovery line in --help');

// --- A2: the line names the binary as a user actually invokes it -----------
// README documents "No install step" + `node bin/aphorism.js`; there is no
// installed `aphorism` on PATH, so a bare `aphorism ...` is NOT pasteable.
if (/node\s+bin\/aphorism\.js/.test(LINE)) pass('A2 line names the invocation (node bin/aphorism.js)');
else fail('A2 line does not name the binary as a user invokes it');

// --- extract the pasteable command: first `node ` token to end of line -----
const m = LINE.match(/node\s+bin\/aphorism\.js.*$/);
const CMD = m ? m[0] : '';
info('extracted: [' + CMD + ']');

// --- A3: as printed — no trailing sentence period, which would break paste --
if (!CMD) fail('A3 no command could be extracted from the line');
else if (/\.$/.test(CMD)) fail("A3 extracted command ends in '.' — not pasteable as printed");
else pass('A3 command is pasteable as printed (no trailing period)');

// --- A4: the command, AS PRINTED, runs clean -------------------------------
const r = CMD ? shTry(CMD) : { rc: 1, out: '', err: 'no command' };
if (r.rc === 0) pass('A4 printed command exits 0');
else { fail('A4 printed command exited ' + r.rc); info('stderr: ' + (r.err || '').split('\n')[0]); }

// --- A5: output is non-empty and DEDUPED -----------------------------------
const lines = r.out.split('\n').filter((s) => s.trim() !== '');
const uniq = [...new Set(lines)];
if (lines.length > 0 && lines.length === uniq.length)
  pass(`A5 output deduped (${lines.length} lines, ${uniq.length} unique)`);
else fail(`A5 output not a deduped list (${lines.length} lines, ${uniq.length} unique)`);

// --- A6: DISCRIMINATOR — set equals the corpus tag vocabulary --------------
const { corpus } = require('./src/corpus.js');
const trueTags = [...new Set(corpus.flatMap((a) => a.tags))].sort();
const gotTags = [...uniq].map((s) => s.trim()).sort();
if (JSON.stringify(trueTags) === JSON.stringify(gotTags))
  pass(`A6 output == corpus tag vocabulary (${trueTags.length} tags)`);
else {
  fail('A6 output != independently derived tag vocabulary');
  info('expected: ' + trueTags.join(' '));
  info('got:      ' + gotTags.join(' '));
}

// --- A7: corpus untouched this cycle ---------------------------------------
const changed = shTry(`git diff --name-only ${BASE}..HEAD; git status --porcelain`).out;
if (/src\/corpus\.js/.test(changed))
  fail('A7 src/corpus.js was modified — corpus expansion is a locked non-goal');
else pass('A7 corpus untouched');

// --- A8: zero new dependencies ---------------------------------------------
const depHits = shTry(
  `find . -path ./.git -prune -o \\( -name package.json -o -name package-lock.json ` +
  `-o -name node_modules -o -name yarn.lock -o -name pnpm-lock.yaml \\) -print`
).out.trim();
if (!depHits) pass('A8 still zero-dependency (no manifest/lockfile/node_modules)');
else fail('A8 dependency artifacts appeared: ' + depHits.replace(/\n/g, ' '));

// --- A9: no new flag -------------------------------------------------------
const flags = [...new Set(
  HELP.split('\n')
    .filter((l) => /^\s+(-[a-zA-Z], )?--[a-z]/.test(l))
    .flatMap((l) => (l.match(/(^|\s)(--?[a-zA-Z-]+)/g) || []).map((s) => s.trim()))
)].sort();
// The shipped six-flag set, read off the live --help at cycle 10 baseline.
const expect = ['--author', '--help', '--json', '--list', '--seed', '--tag', '-h'];
if (JSON.stringify(flags) === JSON.stringify(expect)) pass('A9 flag set unchanged: ' + flags.join(' '));
else { fail('A9 flag set changed'); info('expected [' + expect.join(' ') + '] got [' + flags.join(' ') + ']'); }
const urc = shTry('node bin/aphorism.js --definitelynotaflag >/dev/null 2>&1').rc;
if (urc === 2) pass('A9b unknown flag still exits 2');
else fail('A9b unknown flag exited ' + urc + ', expected 2');

// --- A10: full test_cmd green ----------------------------------------------
const t = shTry('node --test test/*.test.js 2>&1');
// node --test's spec reporter prints "ℹ pass N"; the TAP reporter prints "# pass N".
// Accept either marker, but REQUIRE that one of them was actually found — a summary
// we could not parse is a FAIL, never a silent pass.
const tp = (t.out.match(/^[#ℹ] pass (\d+)$/m) || [])[1];
const tf = (t.out.match(/^[#ℹ] fail (\d+)$/m) || [])[1];
if (t.rc === 0 && tp !== undefined && tf === '0') pass(`A10 test_cmd green (pass ${tp}, fail ${tf})`);
else fail(`A10 test_cmd NOT green (rc=${t.rc}, pass=${tp}, fail=${tf})`);

// --- A11: README's own tag-discovery command still runs clean --------------
const readme = existsSync(T + '/README.md') ? readFileSync(T + '/README.md', 'utf8') : '';
const rline = readme.split('\n').find((l) => l.includes('.tags[]') && l.includes('aphorism'));
if (rline) {
  const rm = rline.match(/node\s+bin\/aphorism\.js.*$/);
  const rcmd = rm ? rm[0].replace(/\s*#.*$/, '') : '';
  const rr = rcmd ? shTry(rcmd) : { rc: 1 };
  if (rr.rc === 0) { pass('A11 README tag command runs clean'); info('readme: ' + rcmd); }
  else fail('A11 README tag command fails: ' + rcmd);
} else info('A11 skipped — README has no aphorism/.tags[] command line');

console.log('=== TS-4 gate: ' + (FAIL === 0 ? 'PASS' : 'FAIL') + ' ===');
process.exit(FAIL);
