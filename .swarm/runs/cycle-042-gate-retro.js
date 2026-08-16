// cycle 42 gate — RETRO.md.
// The conductor authored BOTH the document and this gate, so the usual protection
// (the builder never saw the check) is unavailable. Substitute, per cycle 41:
//   1. do not READ the prose — extract every falsifiable claim as a LITERAL and
//      re-measure it against the live repo / allocator / git;
//   2. run a NEGATIVE CONTROL arm: the PREVIOUS RETRO.md (the 2026-08-14 SMOKE
//      retro, from git HEAD) must FAIL these same checks. A gate only its own
//      subject can pass is not a gate.
'use strict';
const fs = require('fs');
const cp = require('child_process');
const T = '/opt/targets/aphorism-cli';
const sh = (c) => cp.execSync(c, { cwd: T, encoding: 'utf8', maxBuffer: 1 << 26 });

const backlog = JSON.parse(fs.readFileSync(T + '/.swarm/backlog.json', 'utf8')).items;
const state = JSON.parse(fs.readFileSync(T + '/.swarm/state.json', 'utf8'));
const runfile = JSON.parse(fs.readFileSync('/opt/swarm/runs/current.json', 'utf8'));
const alloc = JSON.parse(fs.readFileSync('/opt/swarm/runs/allocator.json', 'utf8'));
const STOP = 1786879464;

// ---- measurements (computed ONCE, independent of which document is under test) ----
let suite;
try { suite = sh('node --test test/*.test.js 2>&1'); } catch (e) { suite = String(e.stdout || ''); }
const mPass = /^. pass (\d+)$/m.exec(suite), mFail = /^. fail (\d+)$/m.exec(suite);
if (!mPass || !mFail) { console.log('UNPARSEABLE suite output — refusing to emit a verdict'); process.exit(3); }
const pass = +mPass[1], fail = +mFail[1];

const counts = {};
backlog.forEach(i => counts[i.status] = (counts[i.status] || 0) + 1);
const kinds = {};
backlog.filter(i => i.status === 'done').forEach(i => kinds[i.kind] = (kinds[i.kind] || 0) + 1);

const merges = sh('git log --merges --format="%h %p"').trim().split('\n').filter(Boolean);
const kiById = Object.fromEntries(state.known_issues.map(k => [k.id, k]));
const applied = runfile.playbook.applied;

// ---- checks: each is [name, predicate(text), evidence-string] ----
// `text` is the document under test. Every check re-measures ground truth itself and
// asks only whether the DOCUMENT states it.
const checks = [];
const has = (t, s) => t.includes(s);

checks.push(['C1  suite counts', t => has(t, '80 green') && has(t, '48 green') && fail === 0,
  `measured pass=${pass} fail=${fail}; doc must state 48 green (kickoff) and 80 green`]);

checks.push(['C2  board counts', t =>
  has(t, `**${counts.done} done**`) && has(t, `${counts.todo} todo`) &&
  has(t, `${counts.blocked} blocked`) && has(t, `${counts.dropped} dropped`) &&
  has(t, `${backlog.length} items`),
  `measured ${JSON.stringify(counts)} total=${backlog.length}`]);

checks.push(['C3  done-by-kind', t =>
  has(t, `test ${kinds.test}`) && has(t, `docs ${kinds.docs}`) && has(t, `fix ${kinds.fix}`) &&
  has(t, `qa ${kinds.qa}`) && has(t, `feature ${kinds.feature}`),
  `measured ${JSON.stringify(kinds)}`]);

const att = Object.fromEntries(backlog.filter(i => (i.attempts || 0) >= 1).map(i => [i.id, [i.attempts, i.status]]));
checks.push(['C4  attempt-capped items', t => {
  const a = att['T-024a'];
  return a && a[0] === 2 && a[1] === 'blocked' && has(t, 'T-024a') && has(t, 'blocked') &&
    att['T-021'] && att['T-021'][0] === 1 && att['T-021'][1] === 'done' && has(t, 'T-021');
}, `measured attempts>=1: ${JSON.stringify(att)}`]);

checks.push(['C5  merge hashes exist', t => {
  const hs = merges.map(m => m.split(' ')[0]);
  return hs.length === 3 && hs.every(h => has(t, h)) &&
    merges.every(m => m.split(' ').length === 3); // hash + 2 parents
}, `measured ${merges.length} merge commits: ${merges.map(m => m.split(' ')[0]).join(',')} (each 2 parents)`]);

checks.push(['C6  merge count bounded', t => merges.length === 3 && has(t, 'Cycles 15, 16 and 17'),
  `measured merge-commit total = ${merges.length}; doc must name exactly cycles 15/16/17`]);

checks.push(['C7  allocator literals', t =>
  has(t, `overall ${alloc.weekly_used_pct}%`) && has(t, `${alloc.opus_used_pct}%`) &&
  has(t, `${alloc.week_elapsed_pct}%`) && alloc.allow_overall_pct === 0 && alloc.allow_premium_pct === 0,
  `measured weekly=${alloc.weekly_used_pct} opus=${alloc.opus_used_pct} elapsed=${alloc.week_elapsed_pct} allow=${alloc.allow_overall_pct}/${alloc.allow_premium_pct}`]);

checks.push(['C8  reset falls after stop_at', t =>
  alloc.week_resets_at > STOP && has(t, String(alloc.week_resets_at)) && has(t, String(STOP)),
  `measured week_resets_at=${alloc.week_resets_at} > stop_at=${STOP} by ${((alloc.week_resets_at - STOP) / 3600).toFixed(2)}h; doc must cite BOTH raw numbers`]);

// C9 v2. v1 required the document to contain the CURRENTLY-computed reserve as a frozen
// literal. That value is a function of the clock (it falls continuously as the week
// elapses: 24.01 at cycle 41, 23.6x during cycle 42), so v1 asked the document to match a
// moving target and would go red on a correct retro every few minutes. Same class as
// cycle 41's C7 and cycle 19's reporter bug: the instrument was measuring drift, not the
// claim. v2 demands STRICTLY MORE — it re-runs the arithmetic live and requires (a) allow
// == 0 at now, (b) allow == 0 at stop_at, (c) the transcription CONTROL to still reproduce
// the shipped allocator's own reported reserve, and (d) the document to quote only the
// stable figures. v1 checked none of (a)-(c); it only string-matched a snapshot.
const allocmath = sh('node /opt/swarm/runs/cycle-041-allocmath.js ' + Math.floor(Date.now() / 1000));
const mNow = /NOW.*reserve=([\d.]+) allow=([\d.]+)/.exec(allocmath);
const mStop = /STOP.*reserve=([\d.]+) allow=([\d.]+)/.exec(allocmath);
const mHl = /hours_left at stop_at = ([\d.]+)h/.exec(allocmath);
checks.push(['C9  floor-release arithmetic', t => {
  if (!mNow || !mStop || !mHl) return false;
  const allowNowZero = +mNow[2] === 0;
  const allowStopZero = +mStop[2] === 0;
  const transcriptionOK = Math.abs(+mNow[1] - alloc.reserve_overall_pct) < 0.15;
  const docStable = has(t, mHl[1] + 'h') && has(t, String(alloc.reserve_overall_pct)) &&
    has(t, '**' + mStop[1] + '**');
  return allowNowZero && allowStopZero && transcriptionOK && docStable;
}, `re-ran allocmath live: allow@now=${mNow && mNow[2]} allow@stop=${mStop && mStop[2]} ` +
   `reserve@now=${mNow && mNow[1]} vs reported ${alloc.reserve_overall_pct} ` +
   `(transcription control |d|<0.15) reserve@stop=${mStop && mStop[1]} hours_left@stop=${mHl && mHl[1]}h`]);

// C10 v2. TWO changes, and they go in OPPOSITE directions — recorded plainly rather than
// framed as a uniform strengthening:
//   (a) STRICTER. v1 hardcoded three ids and checked only those three severities. v2
//       extracts EVERY "**KI-n** (sev)" grade the document makes and requires each to
//       match state.json. A wrong grade on any other issue passed v1 and fails v2.
//   (b) A RELAXATION, with its reason. v1 failed on any KI absent from state.json. That
//       forbids a TRUE historical statement: KI-1 was resolved in the 2026-08-14 run and
//       never carried forward, and cycle 41 found the previous REPORT had graded it from a
//       file it does not cite — a finding this retro should be able to state. v2 admits an
//       absent id only when the document carries an explicit provenance label naming its
//       source run within the same sentence. This is a carve-out, not a strengthening, and
//       it is the same resolution cycle 41 reached for the identical collision.
checks.push(['C10 known-issue grades', t => {
  const named = [...new Set([...t.matchAll(/KI-(\d+)/g)].map(m => 'KI-' + m[1]))];
  if (!named.length) return false;
  // (a) every grade the doc asserts must match state.json — all of them, not a fixed three
  const grades = [...t.matchAll(/\*\*(KI-\d+)\*\* \((high|medium|low)\)/g)];
  if (!grades.length) return false;
  const badGrade = grades.filter(g => !kiById[g[1]] || kiById[g[1]].severity !== g[2]);
  // (b) an id absent from state.json needs an explicit source-run provenance label
  const unknown = named.filter(k => !kiById[k]);
  const unlabelled = unknown.filter(k => {
    const i = t.indexOf(k);
    const window = t.slice(Math.max(0, i - 200), i + 300);
    return !(/not in this run's `state\.json`/.test(window) && /2026-08-14/.test(window));
  });
  return badGrade.length === 0 && unlabelled.length === 0;
}, `state.json carries ${Object.keys(kiById).length} issues (${Object.keys(kiById).join(',')}); ` +
   `EVERY graded severity must match, and any id absent from state.json needs a source-run label`]);

checks.push(['C11 applied-lessons coverage', t => {
  const sec = t.split('## Applied lessons check')[1];
  if (!sec) return false;
  const named = [...new Set([...sec.matchAll(/L-\d+/g)].map(m => m[0]))].sort();
  const want = [...applied].sort();
  return named.length === want.length && named.every((l, i) => l === want[i]);
}, `runfile.playbook.applied has ${applied.length}: ${[...applied].sort().join(',')}; the section must name exactly these — no more, no fewer`]);

// C12 v2. v1 only checked that the stated tally SUMS to applied.length. That is vacuous:
// this cycle's first draft stated "6 re-observed, 1 contradicted, 8 not-exercised" — which
// sums to 15 and passed v1 — while the true split was 5/1/9. v1 passed a wrong tally.
// v2 COUNTS the verdict labels actually written in the section and requires the stated
// tally to match them term by term. Strictly more than v1 in every case.
checks.push(['C12 applied-lessons tally', t => {
  const sec = t.split('## Applied lessons check')[1];
  if (!sec) return false;
  const m = /(\d+) re-observed, (\d+) contradicted, (\d+) not-exercised/.exec(sec);
  if (!m) return false;
  // count lessons per verdict from the bullets themselves
  // Parse BULLETS, not lines: a bullet wraps across lines, so the ids and the verdict
  // routinely sit on different lines and a per-line loop silently counts neither.
  // (Same class as cycle 19's reporter bug — the parser was measuring layout, not the claim.)
  const tally = { 're-observed': 0, 'contradicted': 0, 'not-exercised': 0 };
  const bullets = sec.split(/\n- /).slice(1);
  for (const b of bullets) {
    const body = b.split(/\n\n/)[0];
    const ids = [...body.matchAll(/\*\*(L-\d+)\*\*/g)].map(x => x[1]);
    if (!ids.length) continue;
    const v = /\*\*contradicted/.test(body) ? 'contradicted'
      : /\*\*not-exercised\*\*/.test(body) ? 'not-exercised'
      : /\*\*re-observed/.test(body) ? 're-observed' : null;
    if (v) tally[v] += ids.length;
  }
  const summed = tally['re-observed'] + tally['contradicted'] + tally['not-exercised'];
  return summed === applied.length &&
    +m[1] === tally['re-observed'] && +m[2] === tally['contradicted'] && +m[3] === tally['not-exercised'];
}, `the stated tally must MATCH the verdicts written in the section (not merely sum to ${applied.length})`]);

checks.push(['C13 this-run provenance', t =>
  has(t, '2026-08-15') && has(t, 'cycle 42') && !/SMOKE run, 2026-08-14, 1 cycle/.test(t),
  `doc must describe the 2026-08-15 improvement run, not the 2026-08-14 SMOKE run`]);

checks.push(['C14 must-haves closed', t => {
  const iItems = backlog.filter(i => /^I-/.test(i.id));
  const open = iItems.filter(i => i.status !== 'done');
  return open.length === 0 && has(t, `${iItems.length} chartered improvement must-haves`);
}, `measured ${backlog.filter(i => /^I-/.test(i.id)).length} I-items, ${backlog.filter(i => /^I-/.test(i.id) && i.status !== 'done').length} not done`]);

checks.push(['C15 no unverified "passed"', t =>
  has(t, 'NOT OBSERVABLE') && has(t, 'not-observable') && has(t, 'did NOT fire'),
  `signals not run must be reported as not-run: weekly-reset utilization and the floor release both fall outside the run`]);

// ---- run both arms ----
function arm(label, text) {
  console.log(`\n=== RETRO GATE, ARM: ${label} ===`);
  let ok = 0;
  for (const [name, pred, ev] of checks) {
    let r;
    try { r = !!pred(text); } catch (e) { r = false; }
    if (r) ok++;
    console.log(`${r ? 'PASS' : 'FAIL'} ${name}  ${ev}`);
  }
  console.log(`--- ${ok}/${checks.length} checks passed ---`);
  return ok;
}

const now = fs.readFileSync(T + '/.swarm/RETRO.md', 'utf8');
let prev = '';
try { prev = sh('git show HEAD:.swarm/RETRO.md'); } catch (e) { prev = '<<RETRO.md not tracked at HEAD>>'; }

const okNow = arm('ACCEPTANCE — RETRO.md as written this cycle', now);
const okPrev = arm('NEGATIVE CONTROL — the 2026-08-14 SMOKE retro from git HEAD', prev);

console.log('\n================ VERDICT ================');
console.log(`acceptance ${okNow}/${checks.length}   negative control ${okPrev}/${checks.length}`);
console.log(okNow === checks.length ? 'ACCEPTANCE ARM GREEN' : 'ACCEPTANCE ARM RED — item does NOT pass');
console.log(okPrev === 0 ? 'NEGATIVE CONTROL BEHAVED — the stale retro fails every check'
  : `NEGATIVE CONTROL LEAKED — the stale retro passed ${okPrev}; those checks do not discriminate`);
