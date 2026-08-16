#!/usr/bin/env node
// cycle-048 gate — RETRO.md refresh.
//
// Method (cycle 41/47 lineage): the conductor authored BOTH the document and this gate, so
// builder-blindness is gone. The substitute is a negative-control arm — the sealed cycle-42
// version at .swarm/runs/cycle-048-retro-baseline.md must score 0 on every REFRESH-specific
// cell. Cells tagged `invariant` were already true at cycle 42 and are NOT counted against
// the control; they are here because a refresh must not BREAK them.
//
// Every measurement below is re-derived from the live repo / live allocator. No number is
// read back out of the document it is checking.
//
// usage: node cycle-048-gate.mjs [path-to-retro.md]

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const TARGET = '/opt/targets/aphorism-cli';
const doc = readFileSync(process.argv[2] || `${TARGET}/.swarm/RETRO.md`, 'utf8');

// INSTRUMENT FIX (cycle 48). The first run of this gate went red on four cells, ALL of the
// same class: regexes over-fitted to where markdown happened to wrap a line, or to a `> `
// blockquote marker. Cycle 47's gate failed the same way (its C16 expected bold where the
// prose was plain). Line-wrap position is not part of any claim this gate checks, so every
// prose match runs against a whitespace-flattened copy. This is an instrument correction,
// NOT a loosened gate: the mutation arm re-proves each cell still reddens on a false claim.
const flat = doc.replace(/\n\s*>?\s*/g, ' ').replace(/\s+/g, ' ');

// ---------- measurements (live, independent of the document) ----------
const backlog = JSON.parse(readFileSync(`${TARGET}/.swarm/backlog.json`, 'utf8')).items;
const state = JSON.parse(readFileSync(`${TARGET}/.swarm/state.json`, 'utf8'));
const alloc = JSON.parse(readFileSync('/opt/swarm/runs/allocator.json', 'utf8'));

const by = (s) => backlog.filter((i) => i.status === s).length;
const M = {
  total: backlog.length,
  done: by('done'),
  todo: by('todo'),
  blocked: by('blocked'),
  dropped: by('dropped'),
  cycle: state.cycle,
  kinds: {},
  mustHaves: backlog.filter((i) => /^I-/.test(i.id)).length,
  mustHavesDone: backlog.filter((i) => /^I-/.test(i.id) && i.status === 'done').length,
  ki: state.known_issues.length,
  // INSTRUMENT FIX (cycle 48): strict === 'open' scored 7 and reddened a TRUE claim of 8.
  // KI-10's status is the free-text "open by decision, not by neglect" — it IS open, and a
  // gate that reads it as closed is measuring the label's formatting, not the issue's state.
  kiOpen: state.known_issues.filter((k) => /^open\b/.test((k.status || '').trim())).length,
  t040live: backlog.some((i) => i.id === 'T-040' && i.status === 'todo'),
};
for (const i of backlog) if (i.status === 'done') M.kinds[i.kind] = (M.kinds[i.kind] || 0) + 1;

// corpus, measured by loading the shipped module
const corpusMod = await import(`${TARGET}/src/corpus.js`);
const entries = (() => {
  const c = corpusMod.default ?? corpusMod;
  if (Array.isArray(c)) return c;
  for (const v of Object.values(c)) if (Array.isArray(v)) return v;
  throw new Error('corpus shape not recognised');
})();
const tagCount = {};
for (const e of entries) for (const t of e.tags || []) tagCount[t] = (tagCount[t] || 0) + 1;
const pools = Object.values(tagCount).sort((a, b) => a - b);
M.tags = Object.keys(tagCount).length;
M.singletons = pools.filter((v) => v === 1).length;
M.thinnest = pools[0];

// suite, run for real
const suite = (() => {
  try {
    const out = execSync('node --test test/*.test.js 2>&1', { cwd: TARGET, encoding: 'utf8' });
    return out;
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
})();
const grab = (re) => { const m = suite.match(re); return m ? Number(m[1]) : null; };
M.tests = grab(/^ℹ tests (\d+)$/m);
M.pass = grab(/^ℹ pass (\d+)$/m);
M.fail = grab(/^ℹ fail (\d+)$/m);

// allocator (live) + derived heat
M.allow = alloc.allow_overall_pct;
M.reserve = alloc.reserve_overall_pct;
M.weekly = alloc.weekly_used_pct;
M.opus = alloc.opus_used_pct;
M.elapsed = alloc.week_elapsed_pct;
M.probeOk = alloc.ok === true && alloc.source === 'probe';
M.heat = +(M.weekly / M.elapsed).toFixed(4);
M.opusHeat = +(M.opus / M.elapsed).toFixed(4);

// the gated DISTILL set, counted from the staged file
const cand = readFileSync('/opt/swarm/runs/wrapup-candidates.md', 'utf8');
M.gatedLessons = (cand.match(/^- L-0\d\d \[/gm) || []).length;

// ---------- cells ----------
const cells = [];
const cell = (id, kind, desc, fn) => {
  let ok = false, note = '';
  try { const r = fn(); ok = r === true; note = r === true ? '' : String(r); }
  catch (e) { ok = false; note = 'THREW ' + e.message; }
  cells.push({ id, kind, desc, ok, note });
};
const has = (re) => re.test(flat);
const eq = (claimRe, measured, label) => {
  const m = flat.match(claimRe);
  if (!m) return `claim not found in document (${label})`;
  const claimed = Number(m[1]);
  return claimed === measured ? true : `claimed=${claimed} measured=${measured}`;
};

// --- board / suite currency ---
cell('C1', 'refresh', 'cycles run states 47 complete', () =>
  eq(/cycles run: \*\*(\d+) complete and counting\*\*/, 47, 'cycles'));
cell('C2', 'refresh', 'board total items', () =>
  eq(/\*\*Board at cycle 48:\*\* (\d+) items/, M.total, 'total'));
cell('C3', 'refresh', 'board done count', () =>
  eq(/\*\*Board at cycle 48:\*\* \d+ items — \*\*(\d+) done\*\*/, M.done, 'done'));
// RECLASSIFIED after the control run: todo/blocked/dropped are 6/2/4 at BOTH cycle 42 and
// cycle 48, so this cell cannot discriminate a stale document from a fresh one. It is an
// invariant guard (a refresh must not break it), not evidence of refresh. Counting it as a
// refresh cell would have inflated the control's discrimination by one.
cell('C4', 'invariant', 'board todo/blocked/dropped', () => {
  const m = flat.match(/\*\*\d+ done\*\*, (\d+) todo, (\d+) blocked, (\d+) dropped/);
  if (!m) return 'claim not found';
  const [t, b, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return (t === M.todo && b === M.blocked && d === M.dropped)
    ? true : `claimed=${t}/${b}/${d} measured=${M.todo}/${M.blocked}/${M.dropped}`;
});
cell('C5', 'refresh', 'done-by-kind line matches measured kinds', () => {
  const m = doc.match(/^Done by kind: (.+)$/m);
  if (!m) return 'claim not found';
  const claimed = {};
  for (const part of m[1].replace(/\.$/, '').split(',')) {
    const [k, v] = part.trim().split(/\s+/);
    claimed[k] = Number(v);
  }
  const keys = new Set([...Object.keys(claimed), ...Object.keys(M.kinds)]);
  for (const k of keys) if ((claimed[k] || 0) !== (M.kinds[k] || 0))
    return `${k}: claimed=${claimed[k] || 0} measured=${M.kinds[k] || 0}`;
  return true;
});
cell('C6', 'refresh', 'suite claim cites cycle 48 and the real count', () => {
  if (!has(/80 green at cycle 48/)) return 'does not cite 80 green at cycle 48';
  return (M.tests === 80 && M.pass === 80 && M.fail === 0)
    ? true : `measured tests=${M.tests} pass=${M.pass} fail=${M.fail}`;
});
cell('C7', 'invariant', 'chartered must-haves = 12 and all done', () => {
  if (!has(/All \*\*12 chartered improvement must-haves are closed\*\*/)) return 'header does not claim 12';
  return (M.mustHaves === 12 && M.mustHavesDone === 12)
    ? true : `measured ${M.mustHavesDone}/${M.mustHaves}`;
});
cell('C8', 'refresh', 'hand-off no longer asserts "11 chartered" as a live claim', () =>
  has(/all \*\*12\*\* chartered improvement must-haves closed/) && !has(/all 11 chartered improvement/)
    ? true : 'hand-off still carries the 11 figure as a live claim');
cell('C9', 'refresh', 'the 11-vs-12 contradiction is retracted in place, not silently fixed', () =>
  has(/Retracted in place, not deleted/) && has(/said "\*\*11\*\* chartered must-haves"/)
    ? true : 'no in-place retraction');
cell('C10', 'refresh', 'hand-off done-item count matches board', () =>
  eq(/every one of the \*\*(\d+)\*\* done items passed a conductor-authored gate/, M.done, 'handoff done'));

// --- KI-5 root cause (cycle 43) ---
cell('C11', 'refresh', 'KI-5 root cause: settings never migrated from macOS', () =>
  has(/never migrated from macOS to the VPS/) ? true : 'root cause absent');
cell('C12', 'refresh', 'KI-5 names the exactly-two allowlist entries', () =>
  has(/exactly \*\*two\*\* SWARM-script entries/) && has(/Users\/truman\/Projects\/SWARM\/bin\/swarm-notify\.sh/)
    ? true : 'the two-entry structural claim is absent');
cell('C13', 'refresh', 'KI-5 carries the cell-3-vs-cell-4 discriminator', () =>
  has(/cell 3\s*\n?\s*against cell 4|cell 3 against cell 4/) && has(/varying only the\s*\n?\s*path form/)
    ? true : 'discriminator absent');
cell('C14', 'refresh', 'KI-5 second failure mode (cwd-relative, exit 127) recorded', () =>
  has(/exit 127/) && has(/absolute entries close both/i) ? true : 'second failure mode absent');
cell('C15', 'refresh', 'KI-5 refusal count updated off 42', () =>
  has(/refused on all 47 cycles/) && !has(/refused on all 42 cycles/)
    ? true : 'still claims 42 cycles of refusal');

// --- T-007 product change (cycle 46) ---
cell('C16', 'refresh', 'T-007 retag 37->12 is in the document', () =>
  has(/37\s*→\s*12/) ? true : 'retag not described');
cell('C17', 'refresh', 'retag figures match the live corpus', () => {
  if (!has(/\*\*0 singleton tags\*\*/)) return 'singleton claim absent';
  const m = flat.match(/thinnest pool of \*\*(\d+)\*\*/);
  if (!m) return 'thinnest-pool claim absent';
  return (M.tags === 12 && M.singletons === 0 && Number(m[1]) === M.thinnest)
    ? true : `measured tags=${M.tags} singletons=${M.singletons} thinnest=${M.thinnest} claimed thinnest=${m[1]}`;
});
cell('C18', 'refresh', 'the retag is flagged as a breaking change needing a human (T-040)', () =>
  has(/breaking\s*\n?\s*change to `--tag`/) && has(/T-040/) && M.t040live
    ? true : `breaking-change flag or live T-040 missing (t040live=${M.t040live})`);
// STRENGTHENED after mutation M18. The first version keyed on the entry's TITLE, which also
// appears in a cross-reference in the pacing section — so deleting the finding itself left
// the cell green, satisfied by a pointer to the thing that was no longer there. A cell must
// bind to the claim's SUBSTANCE, not to a phrase that can survive elsewhere in the document.
cell('C19', 'refresh', '"zero agents is not zero product work" correction is recorded', () =>
  has(/Cycle 46 refuted it by doing it/) && has(/agent or only a worker/)
    ? true : 'the self-correction is absent');

// --- pacing / KI-16 ---
cell('C20', 'refresh', 'zero-agent stretch stated as 39 through 47 (nine)', () =>
  has(/cycle 39 through cycle 47 — nine consecutive cycles/) ? true : 'stretch not updated');
cell('C21', 'refresh', 'KI-16 recorded with the week_resets_at discriminator', () =>
  has(/KI-16/) && has(/`week_resets_at` was \*\*0\*\*/) ? true : 'KI-16 or its discriminator absent');
cell('C22', 'refresh', 'KI-16 cites the conservative default the no-data path skips', () =>
  has(/jq-missing (fallback|path)/) ? true : 'the fail-open argument is unsupported');
cell('C23', 'refresh', 'cycle-48 probe corroboration: allowance measured 0', () => {
  if (!has(/next real probe .*reads `allow_overall_pct` \*\*0\*\*/s)) return 'corroboration claim absent';
  return (M.probeOk && M.allow === 0) ? true : `live allocator ok=${M.probeOk} allow=${M.allow}`;
});
cell('C24', 'refresh', 'reserve figure matches live allocator', () =>
  eq(/\*\*(\d+\.\d+) \(c48\)\*\*/, M.reserve, 'reserve'));
cell('C25', 'refresh', 'weekly/opus/elapsed match live allocator', () => {
  const m = flat.match(/overall (\d+\.\d+)%, premium\/opus (\d+)%\*\*, week elapsed \*\*(\d+\.\d+)%\*\*/);
  if (!m) return 'telemetry claim not found';
  return (Number(m[1]) === M.weekly && Number(m[2]) === M.opus && Number(m[3]) === M.elapsed)
    ? true : `claimed ${m[1]}/${m[2]}/${m[3]} measured ${M.weekly}/${M.opus}/${M.elapsed}`;
});
cell('C26', 'refresh', 'weekly_heat arithmetic is correct, not asserted', () => {
  const m = flat.match(/\*\*1\.(\d+) \(c48\*\*, (\d+\.\d+)\/(\d+\.\d+)\)/);
  if (!m) return 'heat claim not found';
  const claimed = Number('1.' + m[1]);
  return Math.abs(claimed - M.heat) < 0.0002
    ? true : `claimed=${claimed} recomputed=${M.heat}`;
});
cell('C27', 'refresh', 'opus_heat arithmetic is correct', () => {
  const m = flat.match(/`opus_heat` \*\*(\d+\.\d+)\*\* at cycle 48/);
  if (!m) return 'opus_heat claim not found';
  return Math.abs(Number(m[1]) - M.opusHeat) < 0.0002
    ? true : `claimed=${m[1]} recomputed=${M.opusHeat}`;
});
cell('C28', 'refresh', 'cycle-47 blind read is EXCLUDED, not plotted as a reading', () =>
  has(/a default is not a\s*\n?\s*(measurement|reading)/) ? true : 'blind read not excluded');

// --- known issues + DISTILL cap ---
cell('C29', 'refresh', 'known-issue counts match state.json', () => {
  const m = flat.match(/\*\*(\d+) known issues\*\* are on file at cycle 48 \((\d+) open/);
  if (!m) return 'KI count claim not found';
  return (Number(m[1]) === M.ki && Number(m[2]) === M.kiOpen)
    ? true : `claimed ${m[1]}/${m[2]} open, measured ${M.ki}/${M.kiOpen} open`;
});
cell('C30', 'refresh', 'below-the-line candidates are marked NOT in the gated set', () =>
  has(/Below the line — two candidates the cap cannot carry/) && has(/Neither is in the gated set/)
    ? true : 'surplus candidates not fenced off');
// RECLASSIFIED after the control run: this measures wrapup-candidates.md, a file OUTSIDE the
// document under test, so it is document-independent and can never discriminate. It stays
// because the below-the-line claim (C30) is only honest if the gated set really is 5.
cell('C31', 'invariant', 'the gated DISTILL set really is exactly 5', () =>
  M.gatedLessons === 5 ? true : `wrapup-candidates.md holds ${M.gatedLessons} lessons`);
cell('C32', 'refresh', 'stale cycle-42 board figures are gone', () =>
  !has(/53 items — \*\*41 done\*\*/) && !has(/Board at drafting/)
    ? true : 'cycle-42 board line still present');
cell('C33', 'refresh', 'the hand-off-staleness finding is recorded with all four occurrences', () =>
  has(/Hand-off documents decay silently/) && has(/occurrence \(4\)/) ? true : 'staleness finding absent');

// ---------- report ----------
const red = cells.filter((c) => !c.ok);
const refreshCells = cells.filter((c) => c.kind === 'refresh');
const refreshGreen = refreshCells.filter((c) => c.ok).length;
for (const c of cells) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.id.padEnd(4)} ${c.kind.padEnd(9)} ${c.desc}${c.ok ? '' : '  <<< ' + c.note}`);
}
console.log('---');
console.log(`${cells.length - red.length}/${cells.length} cells green  (refresh-specific: ${refreshGreen}/${refreshCells.length})`);
console.log(`measured: board ${M.done}/${M.total} done, suite ${M.pass}/${M.tests} pass ${M.fail} fail, tags ${M.tags}, KI ${M.ki} (${M.kiOpen} open), allow ${M.allow}%, reserve ${M.reserve}, heat ${M.heat}`);
process.exit(red.length === 0 ? 0 : 1);
