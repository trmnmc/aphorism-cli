#!/usr/bin/env node
// run4 cycle 4 — ADJUDICATION of sealed-gate cells A2 and A4.
// The sealed gate run4-cycle-004-gate.mjs is left BYTE-UNEDITED (standing precedent:
// run #3 cycles 4/12/14, run #4 cycles 1/2/3 — rewriting a gate after it has run destroys
// the evidence of what it measured). Instrument defects #17 and #18.
//
// BOTH FAILS SHARE ONE ROOT CAUSE: the sealed gate slices an item's "entry" from the FIRST
// occurrence of its id to the next id's occurrence. That heuristic is wrong at both ends.
//   - R-1's first mention is in the summary paragraph ("...and 1 declined (R-1)"), so its
//     slice began AFTER the word "declined" and ran forward over unrelated prose. A2 asked
//     whether R-1 is described as declined and read a slice that structurally could not
//     contain the answer.
//   - TS-3 is the LAST blocked id, so its slice ran to the end of the section — through the
//     "### Declined" heading and all of R-1's text, which legitimately says "ruled by this
//     run's own conductor". A4 attributed R-1's words to TS-3.
// A third, independent bluntness: A4's /this run/ alternative fired on T-006's
// "no one in this run can reach a primary source" — a clause that REINFORCES human
// ownership. A4's real question is who is named as ACTOR, not whether an agent noun occurs.
//
// Columns, because a repair that cannot distinguish its cases is not a repair.

import fs from 'node:fs';

const REPORT = '/opt/targets/aphorism-cli/REPORT.md';
const src = fs.readFileSync(REPORT, 'utf8');

const secStart = src.indexOf('## What is open');
const secEnd = src.indexOf('\n## ', secStart + 1);
const SECTION = src.slice(secStart, secEnd > -1 ? secEnd : src.length);

const BLOCKED = ['T-006', 'T-040', 'J-7', 'TS-1', 'TS-2', 'TS-3'];

// ---- REPAIRED EXTRACTOR --------------------------------------------------------------
// An item's DEFINING entry is its bullet: a list item whose first bolded token is the id.
// Anchored on document structure the section actually owns, not on raw id position.
// NOTE — this function had a bug on its first run, caught by its own column J and by
// columns F/I disagreeing: the terminator alternation ended with a bare `$` under the `m`
// flag, so every bullet was truncated at its FIRST LINE (~85 chars) and the actor field
// was never in scope. Line-walking is used instead of a multiline regex precisely because
// the regex's failure mode was silent truncation that still looked like a match.
function bullets(section) {
  const out = {};
  const lines = section.split('\n');
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^- \*\*([A-Z]+-\d+)\*\*/);
    if (m) { cur = m[1]; out[cur] = line; continue; }
    if (/^#{2,4} /.test(line)) { cur = null; continue; }          // a heading ends the bullet
    if (cur && (/^\s+\S/.test(line) || line.trim() === '')) { out[cur] += '\n' + line; continue; }
    cur = null;                                                    // any flush-left prose ends it
  }
  for (const k of Object.keys(out)) out[k] = out[k].trimEnd();
  return out;
}
const B = bullets(SECTION);

const AGENT_NOUN = /\b(builder|agent|swarm|conductor|next cycle|this run)\b/i;
const deCode = (s) => s.replace(/`[^`]*`/g, ' ');

// A4' — two questions, both about ROLE ASSIGNMENT rather than noun occurrence.
function actorField(b) {
  const m = b.match(/\*Next actor:\*([\s\S]*?)(?=\*Settles when:\*|$)/);
  return m ? m[1] : '';
}
function a4Violation(b) {
  const actor = deCode(actorField(b));
  if (!/\bhuman\b/i.test(actor)) return 'actor field does not name a human';
  // Test only the actor's HEAD CLAUSE — the text before any parenthetical or subordinate
  // aside. T-006 honestly reads "a human (no one in this run can reach a primary source)":
  // the agent noun sits in an explanation of WHY no agent can do it, which REINFORCES human
  // ownership. Scanning the whole field for an agent noun cannot tell that from an
  // assignment. The invitation test below still covers the whole bullet, so this narrowing
  // is not a hole — see control K.
  const head = actor.split(/[(;—]/)[0];
  if (AGENT_NOUN.test(head.replace(/\bhuman\b/gi, ' '))) return 'actor field names an agent';
  const inv = /\b(builder|agent|swarm|next cycle|this run|conductor|build wave|next wave)\b[^.]{0,60}?\b(could|can|should|will|may)\s+(pick|take|do|handle|fix|resolve|close|build)/i;
  if (inv.test(deCode(b))) return 'bullet invites an agent to pick it up';
  return null;
}

// ---- arms ----------------------------------------------------------------------------
function mutate(fn) { return fn(SECTION); }

const ARM_STALE_R1 = mutate((s) => s.replace(
  /- \*\*R-1\*\*[\s\S]*?(?=\n\nFuller background)/,
  '- **R-1** — README acknowledgement-guard reshape — todo, not yet done or explicitly declined'));
const ARM_NO_R1 = mutate((s) => s.replace(/- \*\*R-1\*\*[\s\S]*?(?=\n\nFuller background)/, ''));
const ARM_INVITE = mutate((s) => s.replace(
  '*Settles when:* corpus expansion is permitted and new entries',
  '*Settles when:* a builder can pick this up next cycle and new entries'));
const ARM_AGENT_ACTOR = mutate((s) => s.replace(
  '- **TS-1** — corpus depth', '- **TS-1** — corpus depth')
  .replace(/(\*\*TS-1\*\*[\s\S]*?)\*Next actor:\* a human, the repo\n  owner, at the next kickoff\./,
           '$1*Next actor:* the next build wave.'));

const r1Of = (s) => (bullets(s)['R-1'] || '');
const a2ok = (s) => /\bdeclin/i.test(r1Of(s)) && !/\bnot yet done\b/i.test(r1Of(s)) && r1Of(s).length >= 80;

// sealed-gate extractor, reproduced verbatim for column A
function sealedEntry(section, id, allIds) {
  const marks = allIds.map((x) => ({ id: x, at: section.indexOf(x) })).filter((m) => m.at !== -1)
    .sort((a, b) => a.at - b.at);
  const i = marks.findIndex((m) => m.id === id);
  const end = i + 1 < marks.length ? marks[i + 1].at : section.length;
  return section.slice(marks[i].at, end);
}
const ALL = [...BLOCKED, 'R-1'].sort();

const cols = [];
const add = (l, ok, d) => cols.push({ l, ok: !!ok, d: String(d) });

// --- A2 ---
const sealedR1 = sealedEntry(SECTION, 'R-1', ALL);
add('A  DEFECT REPRODUCED: sealed slice for R-1 starts at the SUMMARY mention and holds no decline language',
    !/\bdeclin/i.test(sealedR1) && sealedR1.startsWith('R-1'),
    `sealed_slice_head=${JSON.stringify(sealedR1.slice(0, 46))} has_declin=${/\bdeclin/i.test(sealedR1)}`);
add('B  REPAIR: R-1\'s BULLET does describe it as declined, with a reason',
    a2ok(SECTION), `bullet_len=${r1Of(SECTION).length} has_declin=${/\bdeclin/i.test(r1Of(SECTION))}`);
add('C  CONTROL: repaired A2 still REJECTS the old stale "not yet done" wording',
    !a2ok(ARM_STALE_R1), `verdict_on_stale_arm=${a2ok(ARM_STALE_R1)}`);
add('D  CONTROL: repaired A2 still REJECTS an R-1 bullet deleted outright',
    !a2ok(ARM_NO_R1), `verdict_on_deleted_arm=${a2ok(ARM_NO_R1)}`);

// --- A4 ---
const ts3Sealed = sealedEntry(SECTION, 'TS-3', ALL);
add('E  DEFECT REPRODUCED: TS-3\'s sealed slice bleeds past "### Declined" into R-1\'s text',
    ts3Sealed.includes('### Declined') && /conductor/i.test(ts3Sealed) && !/conductor/i.test(B['TS-3'] || ''),
    `bleeds_heading=${ts3Sealed.includes('### Declined')} conductor_in_sealed=${/conductor/i.test(ts3Sealed)} conductor_in_own_bullet=${/conductor/i.test(B['TS-3'] || '')}`);
const viol = BLOCKED.map((x) => [x, a4Violation(B[x] || '')]).filter(([, v]) => v);
add('F  REPAIR: no blocked item\'s OWN bullet assigns the work to an agent',
    viol.length === 0, `violations=${JSON.stringify(viol)}`);
add('G  CONTROL: repaired A4 FIRES when a bullet invites a builder to pick it up',
    !!a4Violation(bullets(ARM_INVITE)['TS-3'] || ''), `verdict=${a4Violation(bullets(ARM_INVITE)['TS-3'] || '')}`);
add('H  CONTROL: repaired A4 FIRES when a Next-actor field names an agent instead of a human',
    !!a4Violation(bullets(ARM_AGENT_ACTOR)['TS-1'] || ''), `verdict=${a4Violation(bullets(ARM_AGENT_ACTOR)['TS-1'] || '')}`);
add('I  CONTROL: T-006\'s "no one in this run can reach a primary source" is NOT a violation',
    !a4Violation(B['T-006'] || '') && /this run/i.test(B['T-006'] || ''),
    `phrase_present=${/this run/i.test(B['T-006'] || '')} violation=${a4Violation(B['T-006'] || '')}`);
// STRENGTHENED after the first run: a length threshold could not tell a whole bullet from
// a bullet truncated at its first line, which is exactly the defect that occurred. Each
// extracted bullet must instead carry the STRUCTURAL markers a complete entry owns.
add('J  CONTROL: extractor returns COMPLETE bullets (structural markers present, not just non-empty)',
    BLOCKED.every((x) => /\*Next actor:\*/.test(B[x] || '') && /\*Settles when:\*/.test(B[x] || ''))
      && /\*Re-opens if:\*/.test(B['R-1'] || ''),
    `blocked_complete=${BLOCKED.map((x) => `${x}:${/\*Next actor:\*/.test(B[x] || '') && /\*Settles when:\*/.test(B[x] || '')}`).join(' ')} r1_reopen=${/\*Re-opens if:\*/.test(B['R-1'] || '')} lens=${JSON.stringify(Object.fromEntries([...BLOCKED, 'R-1'].map((x) => [x, (B[x] || '').length])))}`);

// K guards the narrowing introduced for column I: restricting the agent-noun scan to the
// actor's head clause must NOT create a place to hide a real assignment.
const ARM_HIDDEN = mutate((s) => s.replace(
  '*Next actor:* a human (no one in this run can',
  '*Next actor:* a human (the next build wave will handle it, no one in this run can'));
add('K  CONTROL: an agent assignment hidden INSIDE the parenthetical still FIRES',
    !!a4Violation(bullets(ARM_HIDDEN)['T-006'] || ''),
    `verdict=${a4Violation(bullets(ARM_HIDDEN)['T-006'] || '')}`);

console.log('=== A2 / A4 ADJUDICATION (instrument defects #17, #18) ===\n');
let p = 0;
for (const c of cols) { console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.l}\n         ${c.d}`); if (c.ok) p++; }
console.log(`\n${p} PASS / ${cols.length - p} FAIL of ${cols.length}`);
process.exit(p === cols.length ? 0 : 1);
