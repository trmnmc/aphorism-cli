'use strict';
// Cycle 20 conductor verification harness for T-014.
// Authored AT VERIFICATION TIME, after the builder returned, never shown to it.
// Deliberately uses mutations the builder did NOT run (it proved A7 on `testing`;
// I delete `debugging` from the OTHER table), plus probes it never considered.
//
// Inherited from the cycle-19 harness defect: node --test's default reporter is
// NOT machine-parseable. We force TAP, and an unparseable run reports UNPARSEABLE
// explicitly rather than falling through into a verdict.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO = '/opt/targets/aphorism-cli';
const WORK = path.join(REPO, '.swarm', 'scratch-verify-020');
const NEW_BLOCK_MARKER = '// Bidirectional, band-aware guard on the Tag vocabulary count tables.';

let pass = 0, fail = 0;
const lines = [];
function record(ok, id, msg) {
  if (ok) { pass++; } else { fail++; }
  const line = (ok ? 'PASS  ' : 'FAIL  ') + id.padEnd(16) + msg;
  lines.push(line);
  console.log(line);
}

// fs.cpSync refuses a destination inside the source tree even with a filter, so
// the copy is walked by hand. Scratch stays inside the target dir (KI-6) and the
// excluded top-level dirs make the recursion non-self-consuming.
const SKIP_TOP = new Set(['.git', '.swarm', 'node_modules']);
function copyTree(src, dest, depth) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (depth === 0 && SKIP_TOP.has(ent.name)) continue;
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyTree(s, d, depth + 1);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}

function freshCopy(name) {
  const dest = path.join(WORK, name);
  fs.rmSync(dest, { recursive: true, force: true });
  copyTree(REPO, dest, 0);
  return dest;
}

// Run the suite in `dir`. Returns {ok:true, tests, pass, fail} or {ok:false, reason, raw}.
function runSuite(dir) {
  const testDir = path.join(dir, 'test');
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js')).map(f => path.join('test', f));
  let raw;
  try {
    raw = execFileSync('node', ['--test', '--test-reporter=tap', ...files],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    raw = (e.stdout || '') + (e.stderr || '');
  }
  const t = raw.match(/^# tests (\d+)$/m);
  const p = raw.match(/^# pass (\d+)$/m);
  const f = raw.match(/^# fail (\d+)$/m);
  if (!t || !p || !f) return { ok: false, reason: 'UNPARSEABLE TAP', raw };
  return { ok: true, tests: +t[1], pass: +p[1], fail: +f[1], raw };
}

function readme(dir) { return path.join(dir, 'README.md'); }
function mutate(dir, fn) {
  const p = readme(dir);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) return false;         // mutation NOT APPLIED — never silently pass
  fs.writeFileSync(p, after);
  return true;
}

// Strip the builder's appended block (marker comment through EOF) so a mutation
// can be re-measured against a tree that has everything EXCEPT the new assertion.
function stripNewTest(dir) {
  const p = path.join(dir, 'test', 'readme-tags.test.js');
  const src = fs.readFileSync(p, 'utf8');
  const idx = src.indexOf(NEW_BLOCK_MARKER);
  if (idx === -1) return false;
  const cut = src.lastIndexOf('\n// ---', idx);   // start of the banner comment
  fs.writeFileSync(p, src.slice(0, cut === -1 ? idx : cut) + '\n');
  return true;
}

// ---- the mutations (all mine; the two acceptance ones differ from the builder's) ----
const MUT = {
  // A7 direction: delete a whole row from the 5+ table. Builder proved A7 on the
  // `testing` row of the 2-4 table; this is the row my sealed precommit named.
  delDebugging: (s) => s.replace(/\| `debugging` \| 5 \|\n/, ''),

  // A8 direction: move the count-4 `performance` row into the 5+ table, count
  // untouched, so the README contradicts itself on one line.
  moveperformance: (s) => s
    .replace(/\| `performance` \| 4 \|\n/, '')
    .replace(/\| `debugging` \| 5 \|\n/, '| `debugging` | 5 |\n| `performance` | 4 |\n'),

  // Spurious row: a count-13 tag added to the 2-4 table. Nothing stated becomes
  // false (design's real count is still stated correctly in the 5+ table), so the
  // OLD count guard cannot see it.
  spuriousRow: (s) => s.replace(/\| `language` \| 3 \|\n/, '| `language` | 3 |\n| `design` | 13 |\n'),

  // Negative control: reword both band headings, digits/dashes untouched.
  rewordHeadings: (s) => s
    .replace('4 tags have a robust pool (5+ entries):', '4 tags carry a deep bench (5+ entries):')
    .replace('12 tags appear 2–4 times:', '12 tags crop up 2–4 times:'),

  // Probe: standard markdown formatting -- a blank line between the heading and
  // its table. Not a lie, just a reformat. Combined below with a row deletion.
  blankLineBeforeTables: (s) => s
    .replace('(5+ entries):\n| Tag | Count |', '(5+ entries):\n\n| Tag | Count |')
    .replace('2–4 times:\n| Tag | Count |', '2–4 times:\n\n| Tag | Count |'),
};

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

// ---------------------------------------------------------------- CTRL-PRISTINE
{
  const d = freshCopy('pristine');
  const r = runSuite(d);
  if (!r.ok) record(false, 'CTRL-PRISTINE', 'UNPARSEABLE — ' + r.reason);
  else record(r.fail === 0 && r.tests === 66,
    'CTRL-PRISTINE', 'unmutated copy: tests ' + r.tests + ' pass ' + r.pass + ' fail ' + r.fail + ' (expect 66/66/0)');
}

// ------------------------------------------------- A7: failable + attributable
{
  const d = freshCopy('a7');
  const applied = mutate(d, MUT.delDebugging);
  record(applied, 'A7.APPLIED', 'mutation applied to README (delete `debugging` row from the 5+ table)');
  const r = runSuite(d);
  if (!r.ok) record(false, 'A7.FAILABLE', 'UNPARSEABLE — ' + r.reason);
  else record(r.fail > 0, 'A7.FAILABLE',
    'expected KILLED, measured ' + (r.fail > 0 ? 'KILLED' : 'SURVIVED') + ' (fail ' + r.fail + '/' + r.tests + ')');

  const d2 = freshCopy('a7-attr');
  mutate(d2, MUT.delDebugging);
  const stripped = stripNewTest(d2);
  record(stripped, 'A7.STRIPPED', 'new assertion block removed from the attribution copy');
  const r2 = runSuite(d2);
  if (!r2.ok) record(false, 'A7.ATTRIB', 'UNPARSEABLE — ' + r2.reason);
  else record(r2.fail === 0 && r2.tests === 65, 'A7.ATTRIB',
    'without the new test the SAME mutation must SURVIVE: tests ' + r2.tests + ' fail ' + r2.fail + ' (expect 65/0)');
}

// ------------------------------------------------- A8: failable + attributable
{
  const d = freshCopy('a8');
  const applied = mutate(d, MUT.moveperformance);
  record(applied, 'A8.APPLIED', 'mutation applied (move count-4 `performance` row into the 5+ table)');
  const r = runSuite(d);
  if (!r.ok) record(false, 'A8.FAILABLE', 'UNPARSEABLE — ' + r.reason);
  else record(r.fail > 0, 'A8.FAILABLE',
    'expected KILLED, measured ' + (r.fail > 0 ? 'KILLED' : 'SURVIVED') + ' (fail ' + r.fail + '/' + r.tests + ')');

  const d2 = freshCopy('a8-attr');
  mutate(d2, MUT.moveperformance);
  stripNewTest(d2);
  const r2 = runSuite(d2);
  if (!r2.ok) record(false, 'A8.ATTRIB', 'UNPARSEABLE — ' + r2.reason);
  else record(r2.fail === 0 && r2.tests === 65, 'A8.ATTRIB',
    'without the new test the SAME mutation must SURVIVE: tests ' + r2.tests + ' fail ' + r2.fail + ' (expect 65/0)');
}

// ----------------------------------------------------- spurious row (extra kill)
{
  const d = freshCopy('spurious');
  const applied = mutate(d, MUT.spuriousRow);
  record(applied, 'SPUR.APPLIED', 'mutation applied (count-13 `design` row added to the 2–4 table)');
  const r = runSuite(d);
  if (!r.ok) record(false, 'SPUR.FAILABLE', 'UNPARSEABLE — ' + r.reason);
  else record(r.fail > 0, 'SPUR.FAILABLE',
    'expected KILLED, measured ' + (r.fail > 0 ? 'KILLED' : 'SURVIVED') + ' (fail ' + r.fail + '/' + r.tests + ')');

  const d2 = freshCopy('spurious-attr');
  mutate(d2, MUT.spuriousRow);
  stripNewTest(d2);
  const r2 = runSuite(d2);
  if (!r2.ok) record(false, 'SPUR.ATTRIB', 'UNPARSEABLE — ' + r2.reason);
  else record(r2.fail === 0, 'SPUR.ATTRIB',
    'without the new test it must SURVIVE: tests ' + r2.tests + ' fail ' + r2.fail + ' (expect 65/0)');
}

// -------------------------------------------- N1 negative control: prose reword
{
  const d = freshCopy('reword');
  const applied = mutate(d, MUT.rewordHeadings);
  record(applied, 'N1.APPLIED', 'both band headings reworded, digits and dashes untouched');
  const r = runSuite(d);
  if (!r.ok) record(false, 'N1.NOFALSEREJECT', 'UNPARSEABLE — ' + r.reason);
  else record(r.fail === 0, 'N1.NOFALSEREJECT',
    'honest reword must NOT be rejected: tests ' + r.tests + ' fail ' + r.fail + ' (expect 0 fail)');
}

// ------ N3 probe (conductor-original): is the guard keyed to markdown LAYOUT? --
// A blank line between a heading and its table is standard markdown. If that
// silences the band parse, the guard has T-012's shape in a new coordinate.
{
  const d = freshCopy('blankline');
  const applied = mutate(d, MUT.blankLineBeforeTables);
  record(applied, 'N3.APPLIED', 'blank line inserted between each band heading and its table');
  const r = runSuite(d);
  const reformatAlonePasses = r.ok && r.fail === 0;
  record(r.ok, 'N3.PARSE', 'reformat-only run parsed: ' + (r.ok ? ('fail ' + r.fail) : r.reason));

  // Now reformat AND delete a row. If this SURVIVES, the reformat disarmed the guard.
  const d2 = freshCopy('blankline-del');
  mutate(d2, MUT.blankLineBeforeTables);
  mutate(d2, MUT.delDebugging);
  const r2 = runSuite(d2);
  const stillGuarded = r2.ok && r2.fail > 0;
  record(true, 'N3.RESULT',
    'DIAGNOSTIC (not a gate): reformat alone ' + (reformatAlonePasses ? 'passes' : 'FAILS') +
    '; reformat + row deletion ' + (r2.ok ? (stillGuarded ? 'still KILLED (guard survives reformat)' : 'SURVIVED — guard disarmed by the reformat') : 'UNPARSEABLE'));
}

// ----------------------------------------------------------------- tree hygiene
{
  const real = fs.existsSync(path.join(REPO, '.swarm', 'scratch'));
  record(!real, 'CTRL-SCRATCH', 'builder scratch dir .swarm/scratch removed: ' + (!real));
}

fs.rmSync(WORK, { recursive: true, force: true });
console.log('=== ' + pass + ' pass / ' + fail + ' fail ===');
process.exit(fail === 0 ? 0 : 1);
