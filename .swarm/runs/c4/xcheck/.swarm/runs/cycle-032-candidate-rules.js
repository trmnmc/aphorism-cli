#!/usr/bin/env node
// cycle-32 T-024a (attempt 2) -- candidate-rule measurement harness.
//
// Exercises FOUR candidate extraction rules against a table of one-clause and
// multi-clause HIGH-count strings, covering both natural word orders, true
// and false claims, and silent-hole shapes. Run BEFORE editing the test file
// (Method step 1). No file writes; this only measures functions defined
// inline below.
//
// Usage: node .swarm/runs/cycle-032-candidate-rules.js

// ---------------------------------------------------------------------------
// Candidate A: HEAD's rule -- split on dashes, in the clause containing the
// marker, return the LAST digit run preceding the marker.
// ---------------------------------------------------------------------------
function headRule(text) {
  const clauses = text.split(/[–—]/);
  for (const clause of clauses) {
    const idx = clause.search(/\bHIGH\b/);
    if (idx === -1) continue;
    const before = clause.slice(0, idx);
    const digits = before.match(/\d+/g);
    if (digits && digits.length) return parseInt(digits[digits.length - 1], 10);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Candidate B: ATTEMPT-1's rule (REJECTED) -- same clause-split, but return
// the FIRST digit run in the clause (regardless of position vs. marker).
// ---------------------------------------------------------------------------
function attempt1Rule(text) {
  const clauses = text.split(/[–—]/);
  for (const clause of clauses) {
    const idx = clause.search(/\bHIGH\b/);
    if (idx === -1) continue;
    const digits = clause.match(/\d+/g);
    if (digits && digits.length) return parseInt(digits[0], 10);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Candidate C: bare PRESENCE (hypothesis b, naive form) -- true count is
// supplied externally (8); rule just checks whether that digit run appears
// anywhere "near" HIGH (same clause). Included ONLY to demonstrate the
// silent-hole failure mode named in the brief; not a real extractor (it
// can't produce an error message naming a wrong number, since it never
// extracts anything -- it only answers yes/no).
// ---------------------------------------------------------------------------
function presenceRule(text, truth) {
  const clauses = text.split(/[–—;]/);
  for (const clause of clauses) {
    if (!/\bHIGH\b/.test(clause)) continue;
    const digits = clause.match(/\d+/g) || [];
    if (digits.includes(String(truth))) return 'PRESENT(silent pass)';
  }
  return 'ABSENT';
}

// ---------------------------------------------------------------------------
// Candidate D: ADOPTED -- structural predicate binding. Recognizes two
// closed grammatical templates for "the count that is rated HIGH": a direct
// form (<N> are/is rated HIGH) and a partitive form (<N> of the <M> <noun>
// are/is rated HIGH, where N -- not M -- is the count being rated). Neither
// template reads "nearest", "first", or "last"; each is a fixed grammatical
// shape independent of which side of the marker the bound number sits.
// ---------------------------------------------------------------------------
function boundRule(text) {
  const direct = text.match(/(\d+)\s+(?:are|is)\s+rated\s+HIGH\b/);
  if (direct) return parseInt(direct[1], 10);
  const partitive = text.match(/(\d+)\s+of\s+the\s+\d+\s+\w+\s+(?:are|is)\s+rated\s+HIGH\b/);
  if (partitive) return parseInt(partitive[1], 10);
  return null;
}

// ---------------------------------------------------------------------------
// Probe table. "want" is the number the sentence actually, truthfully
// states is rated HIGH (null where the sentence is a deliberate parse-miss
// or silent-hole adversarial shape and there is no correct single answer).
// ---------------------------------------------------------------------------
const CASES = [
  // The four one-clause probes from the brief, verbatim in spirit.
  { id: 'brief-1 subject-first, true',
    text: '8 of the 50 entries are rated HIGH', want: 8 },
  { id: 'brief-2 subject-last, true',
    text: 'Of the 50 entries, 8 are rated HIGH', want: 8 },
  { id: 'brief-3 subject-first, wrong claim (9)',
    text: '9 of the 50 entries are rated HIGH', want: 9 },
  { id: 'brief-4 subject-last, wrong claim (9)',
    text: 'Of the 50 entries, 9 are rated HIGH', want: 9 },

  // Shipped shape (dashed) and its wrong-count kill.
  { id: 'shipped dashed, true',
    text: 'wrong — 8 are rated HIGH — and says', want: 8 },
  { id: 'shipped dashed, wrong (9)',
    text: 'wrong — 9 are rated HIGH — and says', want: 9 },

  // Plain-prose reworded shape (dashes removed), both orders, both truth values.
  { id: 'reworded subject-first, true',
    text: 'wrong. 8 of the 50 entries are rated HIGH, and it says', want: 8 },
  { id: 'reworded subject-first, wrong (9)',
    text: 'wrong. 9 of the 50 entries are rated HIGH, and it says', want: 9 },
  { id: 'reworded subject-last, true',
    text: 'wrong. Of the 50 entries, 8 are rated HIGH, and it says', want: 8 },
  { id: 'reworded subject-last, wrong (9)',
    text: 'wrong. Of the 50 entries, 9 are rated HIGH, and it says', want: 9 },

  // Parenthetical aside instead of a dashed one, every number true.
  { id: 'parenthetical, true',
    text: 'wrong (8 are rated HIGH) and says', want: 8 },

  // Wrong corpus size (51) reworded; HIGH claim (8) still true -- checks the
  // partitive template correctly ignores the corpus-size decoy even when
  // that decoy itself is "wrong" elsewhere in the sentence.
  { id: 'reworded, wrong corpus-size decoy (51), HIGH still true (8)',
    text: 'ranks all 51 entries. 8 of the 51 entries are rated HIGH.', want: 8 },

  // Parse miss: marker absent entirely.
  { id: 'parse-miss: no HIGH marker at all',
    text: 'wrong, and says what would settle each one.', want: null },

  // SILENT-HOLE shape: a false claim (9) stated WITHOUT touching the "rated
  // HIGH" predicate, plus a true 8 sitting near the literal word HIGH but
  // bound to it only via a discursive construction ("is the number of rows
  // ... would call HIGH"), never via "rated HIGH".
  { id: 'silent-hole: false claim (9) elsewhere + true 8 loosely near HIGH',
    text: '9 entries carry the top rating; 8 is the number of rows this repo would call HIGH.',
    want: null /* neither template's predicate is present; must PARSE-MISS, not silently pick 8 or 9 */ },

  // Additional silent-hole stress: false claim AND the word HIGH share a
  // clause via a decoy verb ("HIGH-risk") -- must not be silently accepted
  // as satisfying "rated HIGH".
  { id: 'silent-hole: wrong count adjacent to a HIGH-risk mention, no "rated"',
    text: '9 entries are HIGH-risk and worth checking first.', want: null },
];

function fmt(v) { return v === null ? 'PARSE-MISS' : String(v); }

console.log('id'.padEnd(58), 'want'.padEnd(6), 'HEAD'.padEnd(10), 'ATTEMPT-1'.padEnd(10), 'PRESENCE(truth=want)'.padEnd(22), 'ADOPTED');
let headCorrect = 0, a1Correct = 0, adoptedCorrect = 0, total = 0;
for (const c of CASES) {
  total++;
  const h = headRule(c.text);
  const a = attempt1Rule(c.text);
  const p = c.want === null ? 'n/a' : presenceRule(c.text, c.want);
  const d = boundRule(c.text);
  const hOk = h === c.want; const aOk = a === c.want; const dOk = d === c.want;
  if (hOk) headCorrect++;
  if (aOk) a1Correct++;
  if (dOk) adoptedCorrect++;
  console.log(
    c.id.padEnd(58),
    fmt(c.want).padEnd(6),
    (fmt(h) + (hOk ? ' OK' : ' X')).padEnd(10),
    (fmt(a) + (aOk ? ' OK' : ' X')).padEnd(10),
    String(p).padEnd(22),
    fmt(d) + (dOk ? ' OK' : ' X')
  );
}
console.log('\nscore  HEAD=' + headCorrect + '/' + total, ' ATTEMPT-1=' + a1Correct + '/' + total, ' ADOPTED=' + adoptedCorrect + '/' + total);

// ---------------------------------------------------------------------------
// Extra: the SPECIFIC silent-hole shape the brief warns about for hypothesis
// (b) taken naively -- "the correct number is present SOMEWHERE in the
// section" -- checked against a whole multi-sentence section (not just the
// one clause containing the marker) where the WRONG HIGH count (9) is what
// the prose actually states, but the TRUE count (8) also happens to occur
// elsewhere in the section for an unrelated reason (here: as part of a
// footnote-style aside). A naive "is 8 present anywhere in this section"
// check goes SILENTLY GREEN on a README that is factually wrong. This is
// exactly why the adopted rule (D) does not do presence-checking: it binds
// a SPECIFIC number to the SPECIFIC predicate and compares that, so a
// bystander 8 elsewhere in the section cannot rescue a false 9 claim.
// ---------------------------------------------------------------------------
const adversarialSection =
  '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50\n' +
  'entries by how likely the attribution is to be wrong — 9 are rated HIGH — and says what\n' +
  'would settle each one. (Roughly 8 of those were flagged in an earlier pass.)';

function naivePresenceOverSection(section, truth) {
  const digits = section.match(/\d+/g) || [];
  return digits.includes(String(truth)) ? 'PRESENT(silent pass)' : 'ABSENT(correctly fails)';
}

console.log('\nsilent-hole probe (whole-section naive presence vs. adopted binder):');
console.log('  section states 9 are rated HIGH; true count is 8; a bystander "8" also');
console.log('  appears elsewhere in the section for an unrelated reason.');
console.log('  naive presence(8-anywhere-in-section):', naivePresenceOverSection(adversarialSection, 8));
console.log('  adopted boundRule(section):', fmt(boundRule(adversarialSection)),
  boundRule(adversarialSection) === 9 ? '(correctly reads the WRONG stated number, 9)' : '(unexpected)');

