#!/usr/bin/env node
// cycle 43 gate — the pre-drafted WRAP_UP DISTILL candidate set.
//
// These bullets are destined to be pasted into playbook/learnings.md by a human. The
// failure mode that matters is therefore NOT "is the advice good" (unfalsifiable here) but
// "will these parse, and will they collide". Both are mechanically checkable against the
// live playbook, so they are checked against it rather than against my memory of it.
//
// NEGATIVE CONTROL: the same parser is run against deliberately malformed bullets. A
// grammar check that accepts anything is not a check — the control must go red.

const fs = require('fs');

const PLAYBOOK = '/opt/swarm/playbook/learnings.md';
const CANDIDATES = '/opt/swarm/runs/wrapup-candidates.md';

const pb = fs.readFileSync(PLAYBOOK, 'utf8');
const cand = fs.readFileSync(CANDIDATES, 'utf8');

// --- grammar, derived FROM the existing file, not from memory ---------------------------
// A lesson bullet: "- L-NNN [tag] text [apply: ...]? [confidence: x] [source: date name]"
const LESSON_RE =
  /^- (L-\d{3}) \[([a-z]+)\] (.+?)(?: \[apply: (.+?)\])? \[confidence: (high|med|low)\] \[source: (\d{4}-\d{2}-\d{2} [^\]]+)\]$/;

function parseBullets(text) {
  return text
    .split('\n')
    .filter((l) => /^- L-\d{3} /.test(l))
    .map((l) => ({ line: l, m: LESSON_RE.exec(l) }));
}

const existing = parseBullets(pb);
const drafted = parseBullets(cand);

const checks = [];
const ck = (label, ok, detail) => checks.push([label, ok, detail]);

// --- claims about the live playbook -----------------------------------------------------
const nextId = /^next_id: (\d+)$/m.exec(pb);
ck('P1 playbook exposes a next_id header', !!nextId, nextId && nextId[1]);
ck('P2 every existing bullet parses under the derived grammar',
  existing.every((b) => b.m),
  `${existing.filter((b) => b.m).length}/${existing.length} parse`);
ck('P3 playbook lesson count is 31 (over the stated cap of 20)',
  existing.length === 31, `${existing.length} lessons`);

const existingIds = new Set(existing.map((b) => b.m && b.m[1]));
ck('P4 existing ids are unique (the cycle-a49bafd repair held)',
  existingIds.size === existing.length,
  `${existingIds.size} unique / ${existing.length} total`);

// --- claims about the drafted candidates ------------------------------------------------
ck('C1 exactly 5 candidates drafted (WRAP_UP cap)', drafted.length === 5, `${drafted.length}`);
ck('C2 every candidate parses under the SAME grammar as the live file',
  drafted.every((b) => b.m),
  `${drafted.filter((b) => b.m).length}/${drafted.length} parse`);

const draftedIds = drafted.map((b) => b.m && b.m[1]);
ck('C3 candidate ids start at next_id and run consecutively',
  nextId && JSON.stringify(draftedIds) ===
    JSON.stringify([0, 1, 2, 3, 4].map((i) => 'L-' + String(+nextId[1] + i).padStart(3, '0'))),
  JSON.stringify(draftedIds));

ck('C4 NO candidate id collides with an existing lesson',
  draftedIds.every((id) => !existingIds.has(id)),
  draftedIds.filter((id) => existingIds.has(id)).join(',') || 'no collisions');

ck('C5 every candidate is sourced to THIS run',
  drafted.every((b) => b.m && b.m[6] === '2026-08-15 aphorism-cli'),
  [...new Set(drafted.map((b) => b.m && b.m[6]))].join(' | '));

ck('C6 every candidate carries a tag the playbook already uses',
  drafted.every((b) => b.m && new Set(existing.map((e) => e.m && e.m[2])).has(b.m[2])),
  [...new Set(drafted.map((b) => b.m && b.m[2]))].join(','));

// Each candidate must carry a DEDUPE NOTE — the semantic dedupe is the conductor's
// judgment and the requirement is that it be SHOWN, not that it be asserted.
const dedupeNotes = (cand.match(/DEDUPE NOTE:/g) || []).length;
ck('C7 every candidate shows its dedupe reasoning', dedupeNotes === 5, `${dedupeNotes} notes`);

// --- NEGATIVE CONTROL: the grammar must REJECT malformed bullets ------------------------
const BAD = [
  '- L-042 missing the tag [confidence: high] [source: 2026-08-15 aphorism-cli]',
  '- L-043 [qa] no confidence field [source: 2026-08-15 aphorism-cli]',
  '- L-044 [qa] bad confidence [confidence: maybe] [source: 2026-08-15 aphorism-cli]',
  '- L-045 [qa] no source field [confidence: high]',
  '- LX-046 [qa] malformed id [confidence: high] [source: 2026-08-15 aphorism-cli]',
];
const badAccepted = BAD.filter((l) => LESSON_RE.test(l));
ck('N1 NEG CONTROL — grammar rejects all 5 malformed bullets',
  badAccepted.length === 0,
  badAccepted.length ? `WRONGLY ACCEPTED: ${badAccepted.length}` : 'all 5 rejected');

// A control that the grammar accepts a REAL bullet, so N1 isn't passing by rejecting all.
ck('N2 NEG CONTROL — grammar still accepts a real existing bullet',
  existing.length > 0 && !!existing[0].m, existing[0] && existing[0].m && existing[0].m[1]);

// --- report -----------------------------------------------------------------------------
let pass = 0;
console.log('=== CANDIDATE-SET GATE ===\n');
for (const [label, ok, detail] of checks) {
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (detail) console.log(`       ${detail}`);
}
console.log(`\n--- ${pass}/${checks.length} checks passed ---`);
console.log(pass === checks.length ? '\nGATE GREEN' : '\nGATE RED');
process.exit(pass === checks.length ? 0 : 1);
