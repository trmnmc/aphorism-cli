#!/usr/bin/env node
// cycle 44 gate — per-item reachability audit of the remaining board, plus the two
// edits this cycle ships (SPEC I-6 checkbox repair, REPORT unfinished-work table).
//
// The claim under test is NOT "the board has six todos" (counted many times). It is the
// stronger, correction-bearing claim that the run has repeated since cycle 41:
//
//     "all six remaining todos need a builder [because the allowance is 0]"
//
// which conflates two DIFFERENT binding constraints. Three of the six are S-effort, and
// gear 1 explicitly admits S-effort builds — so the gear is not what holds them. A
// standing measured decision (cycle 39) is. That distinction changes what a human should
// do next, which is why it is worth a gate rather than a sentence.
//
// Negative controls are load-bearing here because the conductor authored both the
// artifact and the gate (DISTILL candidate L-038).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = '/opt/targets/aphorism-cli';
const p = (...a) => path.join(ROOT, ...a);

let pass = 0, fail = 0;
const line = [];
function check(id, ok, detail) {
  (ok ? pass++ : fail++);
  line.push(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(5)} ${detail}`);
  return ok;
}

const backlog = JSON.parse(fs.readFileSync(p('.swarm/backlog.json'), 'utf8'));
const state = JSON.parse(fs.readFileSync(p('.swarm/state.json'), 'utf8'));
const spec = fs.readFileSync(p('.swarm/SPEC.md'), 'utf8');
const report = fs.readFileSync(p('REPORT.md'), 'utf8');

const items = backlog.items;
const byId = Object.fromEntries(items.map(i => [i.id, i]));
const todos = items.filter(i => i.status === 'todo');
const blocked = items.filter(i => i.status === 'blocked');
const todoIds = todos.map(i => i.id).sort();
const blockedIds = blocked.map(i => i.id).sort();

// ---------------------------------------------------------------- board shape
check('S1', todos.length === 6, `todo count is 6 -> ${todos.length} [${todoIds}]`);
check('S2', blocked.length === 2, `blocked count is 2 -> ${blocked.length} [${blockedIds}]`);

// ------------------------------------------- definition-of-done for THIS run
// SPEC's improvement must-haves are I-1..I-6. I-2 and I-4 are umbrellas that were
// decomposed; the box is met when the umbrella item itself reads done.
const MUST = ['I-1', 'I-2a', 'I-2b', 'I-2c', 'I-3', 'I-4', 'I-5', 'I-6'];
const mustStatus = MUST.map(id => `${id}=${byId[id] ? byId[id].status : 'MISSING'}`);
check('S3', MUST.every(id => byId[id] && byId[id].status === 'done'),
  `every improvement must-have is done -> ${mustStatus.join(' ')}`);

// ------------------------------------------------- SPEC checkbox bookkeeping
const untickedI = [...spec.matchAll(/^- \[ \] \*\*(I-\d)/gm)].map(m => m[1]);
const tickedI = [...spec.matchAll(/^- \[x\] \*\*(I-\d)/gm)].map(m => m[1]);
const SPEC_FIXED = process.argv.includes('--post');
if (SPEC_FIXED) {
  check('S4', untickedI.length === 0,
    `POST: zero unticked I- boxes remain -> unticked=[${untickedI}] ticked=[${tickedI}]`);
} else {
  check('S4', untickedI.length === 1 && untickedI[0] === 'I-6',
    `PRE: exactly one unticked I- box and it is I-6 -> unticked=[${untickedI}]`);
}
// The divergence is only a DEFECT if the item is verified-done while its box is open.
check('S5', byId['I-6'].status === 'done',
  `I-6 backlog status is done (so an open box is a bookkeeping lag, not unmet work) -> ${byId['I-6'].status}`);

// ------------------------------------- THE CORRECTION: binding constraint per item
const S_EFFORT = todos.filter(i => i.effort === 'S').map(i => i.id).sort();
const NOT_S = todos.filter(i => i.effort !== 'S').map(i => `${i.id}:${i.effort}`).sort();
check('S6', S_EFFORT.length === 3,
  `exactly 3 of the 6 todos are S-effort (gear 1 ADMITS these) -> [${S_EFFORT}] ; others [${NOT_S}]`);

// gear 1 admits S-effort sonnet builds only -> for the non-S items the gear IS binding.
check('S7', NOT_S.length === 3 && todos.filter(i => ['M', 'L'].includes(i.effort)).length === 3,
  `the other 3 are M/L-effort, i.e. genuinely gear-blocked -> [${NOT_S}]`);

// ...so what holds the three S-effort ones?
//
// CORRECTION, recorded rather than smoothed over. This gate's first draft asserted that
// all three carry the cycle-39 family decision. It came back RED on T-039, and the honest
// response is to restate the claim to what is on the board, NOT to widen the regex until
// the original claim passes (cycle.md step 6.5 — never open a gate by weakening it).
// What is actually true is narrower in mechanism and identical in consequence: all three
// are bound to the M-effort T-024 umbrella, two by the cycle-39 standing decision and one
// by its own filing terms.
const FAMILY = 'CYCLE 39 FAMILY DECISION';
const textOf = id => `${byId[id].notes || ''} ${byId[id].acceptance || ''}`;

const sWithFamily = S_EFFORT.filter(id => textOf(id).includes(FAMILY));
check('S8a', sWithFamily.length === 2 && !sWithFamily.includes('T-039'),
  `T-024b + T-032 are held by the cycle-39 family decision (T-039 is NOT) -> [${sWithFamily}]`);

check('S8b', /MEMBER OF THE T-024 UMBRELLA/i.test(textOf('T-039')),
  `T-039 is held instead by its own filing terms as a T-024 member -> ${/MEMBER OF THE T-024 UMBRELLA/i.test(textOf('T-039'))}`);

// The consequence-bearing claim, which is what the human acts on.
const sNamingT024 = S_EFFORT.filter(id => /T-024\b/.test(textOf(id)));
check('S8c', sNamingT024.length === 3,
  `ALL 3 S-effort todos name the M-effort T-024 as their instrument -> [${sNamingT024}]`);

// DISCRIMINATOR / NEG CONTROL, in both directions. If these markers appeared in every
// note, S8a and S8c would be vacuous. T-007 and T-008 are todos that must carry neither.
const nonFamily = ['T-007', 'T-008'].filter(id => !textOf(id).includes(FAMILY));
check('N1a', nonFamily.length === 2,
  `NEG CONTROL — T-007/T-008 carry no family marker (S8a not vacuous) -> clean=[${nonFamily}]`);
const nonT024 = ['T-007', 'T-008'].filter(id => !/T-024\b/.test(textOf(id)));
check('N1b', nonT024.length === 2,
  `NEG CONTROL — T-007/T-008 do not name T-024 (S8c not vacuous) -> clean=[${nonT024}]`);

// ------------------------------------------- DONE / STALLED determinations
// cycle.md churn breaker: DONE needs def-of-done met AND no candidate passing the ratchet.
// T-008 passes the ratchet on a recorded measurement (user meets a repeat by use ~9.6).
const t008 = byId['T-008'];
check('S9', t008.status === 'todo' && /first repeat at use 9\.60/.test(t008.notes),
  `DONE determination FAILS: T-008 is live and carries a measured user-visible defect -> ${/first repeat at use 9\.60/.test(t008.notes)}`);

// STALLED needs consecutive_no_value >= 6 OR all items blocked/attempt-capped.
const cnv = state.counters.consecutive_no_value;
check('S10', cnv < 6 && todos.length > 0,
  `STALLED determination FAILS: consecutive_no_value=${cnv} (<6) and ${todos.length} items are todo, not blocked`);

// NEG CONTROL — the checker must be able to REJECT. Assert a knowingly false claim.
check('N2', !(byId['T-006'] && byId['T-006'].status === 'todo'),
  `NEG CONTROL — the false claim "T-006 is todo" is rejected (it is ${byId['T-006'].status})`);

// ---------------------------------------------------- REPORT table (post only)
if (SPEC_FIXED) {
  const m = report.match(/## Unfinished work[\s\S]*?(?=\n## )/);
  if (!m) {
    check('R1', false, 'POST: an "## Unfinished work" section exists -> NOT FOUND');
  } else {
    const sec = m[0];
    const rows = sec.split('\n').filter(l => /^\| \*\*T-/.test(l));
    check('R1', rows.length === 6, `POST: the table has one row per todo -> ${rows.length} rows`);
    const covered = todoIds.filter(id => new RegExp(`\\*\\*${id}\\*\\*`).test(sec));
    check('R2', covered.length === 6, `POST: every todo id appears -> [${covered}]`);
    // NEG CONTROL — the blocked items belong to the EXISTING blocked table. Duplicating
    // them here would be the sloppy failure, and it is the one a careless edit makes.
    const leaked = blockedIds.filter(id => new RegExp(`\\*\\*${id}\\*\\*`).test(sec));
    check('N3', leaked.length === 0,
      `POST NEG CONTROL — no blocked id leaked into the todo table -> leaked=[${leaked}]`);
    // The correction must actually be stated, not merely implied by the rows.
    check('R3', /S-effort/.test(sec) && /gear 1/.test(sec),
      `POST: the section states the S-effort/gear distinction explicitly`);
  }

  // Byte-scope: everything OUTSIDE the inserted section must be unchanged vs HEAD.
  // (cycle-8 precedent — a prose edit must prove nothing else moved.)
  //
  // R4's first draft stripped `...(?=\n## )`, which left the section's own trailing
  // newline behind and came back RED at exactly 1 byte. That was the INSTRUMENT being
  // wrong, not content having moved — so the strip is corrected to consume the inserted
  // region exactly. Because "I fixed my own regex until it passed" is precisely the
  // move this repo does not accept on faith, R5 below re-reaches the same conclusion by
  // a route that does not involve the regex at all.
  const head = execFileSync('git', ['-C', ROOT, 'show', 'HEAD:REPORT.md'], { encoding: 'utf8' });
  const stripped = report.replace(/## Unfinished work[\s\S]*?\n\n(?=## )/, '');
  check('R4', stripped === head,
    `POST: REPORT.md outside the new section is byte-identical to HEAD -> ${stripped.length} vs ${head.length} bytes`);

  // R5 — INDEPENDENT CORROBORATION of R4, via git rather than via string surgery.
  // A pure insertion deletes zero lines. If the edit had touched anything outside the
  // new section, numstat would report a non-zero deletion count.
  const numstat = execFileSync('git', ['-C', ROOT, 'diff', '--numstat', '--', 'REPORT.md'],
    { encoding: 'utf8' }).trim();
  const [added, deleted] = numstat.split(/\s+/);
  check('R5', deleted === '0',
    `POST: git says the REPORT.md change is a pure insertion -> +${added} -${deleted}`);
}

// ------------------------------------------------------------------- verdict
console.log(line.join('\n'));
console.log(`--- ${pass}/${pass + fail} checks passed ---`);
console.log(fail === 0 ? 'GATE GREEN' : 'GATE RED');
process.exit(fail === 0 ? 0 : 1);
