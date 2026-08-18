// cycle 41 verification gate for I-6 (refresh REPORT.md).
//
// I-6's acceptance: "REPORT.md states the actual verified outcome of every I-item, and
// every item that was not conductor-verified is labeled unverified rather than claimed done."
//
// The item is conductor-authored, so the usual "the builder never saw the check" protection
// does not apply -- I wrote both the document and this gate. The substitute, following this
// run's cycle-7/8 precedent (docs are falsifiable exactly like code): do NOT read the prose.
// Extract every falsifiable claim from the shipped REPORT.md as a literal and re-measure it
// against the repo. A gate that only asked "does it read well" is what a confabulated
// document also passes.
//
// ARM 1 (ACCEPTANCE): every extracted claim must hold against the live repo.
// ARM 2 (NEGATIVE CONTROL): the identical gate is run against the PREVIOUS REPORT.md, taken
// from git HEAD. It MUST fail. A gate the stale report also passes is measuring nothing --
// this is the L-029 failable-and-attributable standard applied to a docs item.
//
// Usage: node cycle-041-gate-I-6.js <path-to-report> <arm-label>

const fs = require('fs');
const cp = require('child_process');

const REPORT_PATH = process.argv[2];
const ARM = process.argv[3] || 'ACCEPTANCE';
const T = '/opt/targets/aphorism-cli';
const report = fs.readFileSync(REPORT_PATH, 'utf8');

const results = [];
function check(id, desc, fn) {
  let ok, detail;
  try { const r = fn(); ok = r.ok; detail = r.detail; }
  catch (e) { ok = false; detail = 'THREW: ' + e.message; }
  results.push({ id, ok, desc, detail });
}
// A claim is present only if the literal appears in the report.
const has = (s) => report.includes(s);
function claims(id, desc, literal, truth) {
  check(id, desc, () => ({
    ok: has(literal) && truth,
    detail: 'literal ' + JSON.stringify(literal) + ' present=' + has(literal) + ' truth=' + truth
  }));
}
const sh = (c) => cp.execSync(c, { cwd: T, encoding: 'utf8' }).trim();

// ---- C1: the headline test claim, re-run rather than remembered ------------------------
check('C1', 'REPORT claims 80 pass / 0 fail; re-run the suite and compare', () => {
  let out;
  try { out = cp.execSync('node --test test/*.test.js', { cwd: T, encoding: 'utf8', shell: '/bin/bash' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const pass = /^. pass (\d+)$/m.exec(out), fail = /^. fail (\d+)$/m.exec(out);
  if (!pass || !fail) return { ok: false, detail: 'UNPARSEABLE test output -- no verdict' };
  const p = Number(pass[1]), f = Number(fail[1]);
  return {
    ok: has('**80 pass / 0 fail**') && p === 80 && f === 0,
    detail: 'measured pass=' + p + ' fail=' + f + '; report claims 80/0 present=' + has('**80 pass / 0 fail**')
  };
});

// ---- C2: corpus numbers, recomputed from src/corpus.js --------------------------------
check('C2', 'corpus figures recomputed from source', () => {
  const c = require(T + '/src/corpus.js');
  const arr = Array.isArray(c) ? c : (c.corpus || c.entries || c.default);
  const tags = arr.flatMap(e => e.tags);
  const m = {}; for (const t of tags) m[t] = (m[t] || 0) + 1;
  const ks = Object.keys(m);
  const f = {
    entries: arr.length,
    authors: new Set(arr.map(e => e.author)).size,
    tags: ks.length,
    singles: ks.filter(k => m[k] === 1).length,
    ge5: ks.filter(k => m[k] >= 5).length,
    band: ks.filter(k => m[k] >= 2 && m[k] <= 4).length
  };
  const lit = '**50** entries, **24** authors, **37** distinct tags (21 singletons, 4 tags ≥5 uses, 12 tags in the 2–4 band)';
  return {
    ok: has(lit) && f.entries === 50 && f.authors === 24 && f.tags === 37 &&
        f.singles === 21 && f.ge5 === 4 && f.band === 12,
    detail: JSON.stringify(f) + ' literal present=' + has(lit)
  };
});

// ---- C3: source sizes -----------------------------------------------------------------
check('C3', 'shipped vs test line counts', () => {
  const n = (g) => Number(sh('cat ' + g + ' | wc -l'));
  const src = n('src/*.js bin/*.js'), tst = n('test/*.js');
  const guard = n('test/readme-tags.test.js');
  return {
    ok: src === 549 && tst === 2051 && guard === 1511 &&
        has('549 lines shipped') && has('2051 lines of tests') && has('1511 of the repo'),
    detail: 'src+bin=' + src + ' test=' + tst + ' readme-tags=' + guard +
            ' literals: 549=' + has('549 lines shipped') + ' 2051=' + has('2051 lines of tests') +
            ' 1511=' + has('1511 of the repo')
  };
});

// ---- C4: git facts --------------------------------------------------------------------
check('C4', 'commit counts and remote sync', () => {
  const total = Number(sh('git rev-list --count HEAD'));
  const since = Number(sh('git log --oneline --since=2026-08-15T00:00:00Z | wc -l'));
  const sb = sh('git status -sb | head -1');
  const synced = /master\.\.\.origin\/master\s*$/.test(sb);
  return {
    ok: has('**95 total**, 91 of them this improvement run') && total === 95 && since === 91 &&
        has('in sync with `origin/master`') && synced,
    detail: 'total=' + total + ' since=' + since + ' status=' + JSON.stringify(sb) + ' synced=' + synced
  };
});

// ---- C5: the tag residual -- report claims it is LOCAL-ONLY ---------------------------
check('C5', 'v0.1-overnight exists locally and is absent from origin', () => {
  const local = sh('git tag').split('\n').includes('v0.1-overnight');
  const remote = sh('git ls-remote --tags origin || true');
  return {
    ok: has('the tag `v0.1-overnight` is local-only') && local && remote === '',
    detail: 'local=' + local + ' remote_tags=' + JSON.stringify(remote.slice(0, 60))
  };
});

// ---- C6: backlog counts. I-6 is counted as done -- this gate is what makes it so ------
check('C6', 'backlog counts (with I-6 transitioned to done)', () => {
  const b = JSON.parse(fs.readFileSync(T + '/.swarm/backlog.json', 'utf8'));
  const c = {};
  for (const i of b.items) {
    const st = (i.id === 'I-6') ? 'done' : i.status;
    c[st] = (c[st] || 0) + 1;
  }
  return {
    ok: has('53 items — **41 done**, 4 dropped, 2 blocked, 6 todo') &&
        b.items.length === 53 && c.done === 41 && c.dropped === 4 && c.blocked === 2 && c.todo === 6,
    detail: 'total=' + b.items.length + ' ' + JSON.stringify(c)
  };
});

// ---- C7: state.json bookkeeping -------------------------------------------------------
// C7 v2. v1 asserted a raw `ls | wc -l` of 197 and FAILED at 198, because this cycle's own
// gate artifacts land in the same directory while the gate runs -- the number is not stable
// during its own measurement. v2 counts only cycles 1-40 artifacts, which is a fixed
// quantity, and additionally REQUIRES the report to disclose the exclusion. That is a
// stricter check than v1, not a relaxed one: v1 demanded a number, v2 demands the same
// number plus an honest statement of what it excludes. (Same repair pattern as cycles 6,
// 19 and 23: the instrument was measuring its own footprint, not the claim.)
check('C7', 'decisions count and stable (cycles 1-40) .swarm/runs artifact count', () => {
  const s = JSON.parse(fs.readFileSync(T + '/.swarm/state.json', 'utf8'));
  const n = fs.readdirSync(T + '/.swarm/runs').filter(f => !/^cycle-041-/.test(f)).length;
  return {
    ok: has('| Decisions recorded | 79 |') && s.decisions.length === 79 &&
        has('196 files in `.swarm/runs/` from cycles 1–40') && n === 196 &&
        has("cycle 41's own artifacts excluded"),
    detail: 'decisions=' + s.decisions.length + ' runs_files_excl_c41=' + n +
            ' exclusion_disclosed=' + has("cycle 41's own artifacts excluded")
  };
});

// ---- C8: THE ACCEPTANCE CLAUSE, clause 1 -- every I-item is stated with its outcome ---
check('C8', 'every I-item in the backlog appears in REPORT with its verified cycle', () => {
  const b = JSON.parse(fs.readFileSync(T + '/.swarm/backlog.json', 'utf8'));
  const ids = b.items.filter(i => /^I-/.test(i.id)).map(i => i.id);
  const missing = ids.filter(id => !report.includes('**' + id + '**'));
  return { ok: missing.length === 0, detail: 'I-items=' + ids.join(',') + ' missing_from_report=' + (missing.join(',') || 'none') };
});

// ---- C9: THE ACCEPTANCE CLAUSE, clause 2 -- nothing is claimed done without evidence --
// Every I-item the report marks with a verified cycle must have that cycle's evidence file
// on disk. I-5 must NOT be marked plain-done: it closed on its hand-off clause.
check('C9', 'each claimed I-item cycle has its evidence artifact; I-5 flagged as partial', () => {
  const want = { 'I-1': 3, 'I-2a': 4, 'I-2b': 5, 'I-2c': 6, 'I-3': 7, 'I-7': 8, 'I-8': 9, 'I-4b': 10, 'I-4a': 11, 'I-5': 12 };
  const bad = [];
  for (const [id, cyc] of Object.entries(want)) {
    const pad = String(cyc).padStart(3, '0');
    const f = T + '/.swarm/runs/cycle-' + pad + '-verify-' + id + '.txt';
    if (!fs.existsSync(f)) bad.push(id + ':no-artifact');
    if (!report.includes('done, cycle ' + cyc) && id !== 'I-5') bad.push(id + ':cycle-not-stated');
  }
  const i5partial = report.includes('**done by clause 2** (hand-off), cycle 12') &&
                    report.includes('cap breach was NOT fixed');
  return { ok: bad.length === 0 && i5partial, detail: 'problems=' + (bad.join(' ') || 'none') + ' I5_labelled_partial=' + i5partial };
});

// ---- C10: known issues -- every KI the report names must exist with that severity -----
// C10 v2. v1 flagged KI-1 as a severity mismatch (report says medium, state.json says
// undefined). That was a TRUE finding, not a bug in the check: state.json's known_issues
// start at KI-2 -- KI-1 was resolved in the 2026-08-14 run and never carried forward, so the
// report was asserting a severity the current state file cannot support. v2 does NOT drop
// KI-1 from scrutiny; it demands MORE. Every KI that exists in state.json must match it
// exactly, and KI-1, which does not, must carry an explicit provenance label saying where
// its severity comes from. v1 would accept an unlabelled KI-1 if its severity happened to
// match; v2 rejects that.
check('C10', 'KI ids/severities match state.json; any KI absent from state.json is labelled', () => {
  const s = JSON.parse(fs.readFileSync(T + '/.swarm/state.json', 'utf8'));
  const m = Object.fromEntries(s.known_issues.map(k => [k.id, k.severity]));
  const named = [...report.matchAll(/\*\*(KI-\d+) \((high|medium|low)[ ,)—]/g)].map(x => [x[1], x[2]]);
  const inState = named.filter(([id]) => id in m);
  const notInState = named.filter(([id]) => !(id in m));
  const bad = inState.filter(([id, sev]) => m[id] !== sev).map(([id, sev]) => id + ':report=' + sev + ' state=' + m[id]);
  // Anything the report grades but state.json does not know must disclose its source.
  const unlabelled = notInState.filter(([id]) =>
    !new RegExp('\\*\\*' + id + ' \\((high|medium|low) — provenance note:').test(report)).map(x => x[0]);
  const unmentioned = s.known_issues.filter(k => !report.includes(k.id)).map(k => k.id);
  return {
    ok: named.length >= 10 && bad.length === 0 && unlabelled.length === 0 && unmentioned.length === 0,
    detail: 'named=' + named.length + ' in_state=' + inState.length + ' not_in_state=' +
            (notInState.map(x => x[0]).join(',') || 'none') +
            ' severity_mismatch=' + (bad.join(' ') || 'none') +
            ' unlabelled_provenance=' + (unlabelled.join(',') || 'none') +
            ' state_KIs_unmentioned=' + (unmentioned.join(',') || 'none')
  };
});

// ---- C11: the allocator numbers quoted in the report ----------------------------------
check('C11', 'quoted allocator figures match runs/allocator.json', () => {
  const a = JSON.parse(fs.readFileSync('/opt/swarm/runs/allocator.json', 'utf8'));
  return {
    ok: has('weekly_used_pct = 93') && a.weekly_used_pct === 93 &&
        has('opus_used_pct = 97') && a.opus_used_pct === 97 &&
        has('allow_overall_pct = 0') && a.allow_overall_pct === 0 &&
        has('human_used_pct = 0') && a.human_used_pct === 0,
    detail: 'allocator weekly=' + a.weekly_used_pct + ' opus=' + a.opus_used_pct +
            ' allow=' + a.allow_overall_pct + ' human=' + a.human_used_pct
  };
});

// ---- C12: the not-run claims are true --------------------------------------------------
check('C12', 'review-fix declined at cycle 14; QA/taste cycles match state.json', () => {
  const s = JSON.parse(fs.readFileSync(T + '/.swarm/state.json', 'utf8'));
  const j = fs.readFileSync(T + '/.swarm/journal.md', 'utf8');
  const declined = /review-fix judged and declined/.test(j);
  return {
    ok: has('review-fix never ran this improvement run') && declined &&
        s.qa.last_full_qa_cycle === 13 && s.qa.last_taste_cycle === 14 && s.qa.last_look_cycle === 0,
    detail: 'journal_records_decline=' + declined + ' qa=' + JSON.stringify(s.qa)
  };
});

// ---- C13: DISCRIMINATOR -- the report must describe THIS run, not the previous one ----
// A stale or lazily-copied report passes every "is the prose nice" test. These four
// literals are true only of a document written after cycle 40.
check('C13', 'discriminator: report is about the improvement run, not the SMOKE run', () => {
  const musts = ['**Cycles completed: 40**', 'cycle 41 in flight', '1511 of the repo', 'KI-14'];
  const stale = ['**Cycles completed:** 1', '48 pass / 0 fail', '| Tests | 48 pass / 0 fail |'];
  const missing = musts.filter(x => !has(x));
  const leftover = stale.filter(x => has(x));
  return { ok: missing.length === 0 && leftover.length === 0,
           detail: 'missing_current=' + (missing.join(' | ') || 'none') + ' stale_present=' + (leftover.join(' | ') || 'none') };
});

// ---- report ----------------------------------------------------------------------------
const pass = results.filter(r => r.ok).length;
console.log('=== I-6 GATE, ARM: ' + ARM + ' -- report under test: ' + REPORT_PATH + ' ===');
for (const r of results) {
  console.log((r.ok ? 'PASS ' : 'FAIL ') + r.id.padEnd(4) + ' ' + r.desc);
  console.log('        ' + r.detail);
}
console.log('--- ' + pass + '/' + results.length + ' checks passed ---');
if (ARM === 'ACCEPTANCE') {
  console.log(pass === results.length ? 'VERDICT: ACCEPTANCE ARM GREEN' : 'VERDICT: ACCEPTANCE ARM RED');
} else {
  console.log(pass < results.length
    ? 'VERDICT: NEGATIVE CONTROL BEHAVED -- the stale report FAILS this gate (' + (results.length - pass) + ' checks)'
    : 'VERDICT: NEGATIVE CONTROL BROKEN -- the stale report also passes, so the gate measures nothing');
}
