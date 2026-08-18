// Cycle 6 correction: the live-look's empty-seed finding duplicates measured gap D-43
// (SPEC.md "Undecided behaviours", filed cycle 5, already routed to J-7). Retract the
// duplicate item and known_issue; keep the ONE fact D-43 does not already record.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
const SW = '/opt/targets/aphorism-cli/.swarm';
const atomic = (p, o) => { writeFileSync(p + '.tmp', JSON.stringify(o, null, 2)); renameSync(p + '.tmp', p); };

const bl = JSON.parse(readFileSync(`${SW}/backlog.json`, 'utf8'));
bl.items = bl.items.filter(i => i.id !== 'Q-3');

const j7 = bl.items.find(i => i.id === 'J-7');
j7.notes = (j7.notes ? j7.notes + ' ' : '') +
  'CYCLE 6 CORROBORATION + one new fact. The cycle-6 QA live-look, an instrument with no knowledge of D-43, independently re-derived the empty-seed gap from the shipped binary and reached the same two-clauses-point-opposite-ways reading. Independent re-derivation raises confidence that this gap is real and human-owned, and it cost nothing to learn because the agent was not told the answer. NEW FACT for whoever rules, which D-43 does NOT record: the refusal is specific to EMPTY and WHITESPACE-ONLY values. Whitespace-PADDED values are ACCEPTED today — `node bin/aphorism.js --seed " 5 " --json` is byte-identical to `--seed 5` and exits 0 (conductor-measured, cycle 6, .swarm/runs/cycle-006-qa-verify.txt). So the implementation is not uniformly "trim then reject"; src/args.js:55 rejects only when the trimmed value is empty, then hands the UNTRIMMED string to Number(), which itself tolerates padding. A ruling of "accept per Number()" is therefore a smaller change than it looks: it deletes one guard clause rather than reworking seed parsing.';

atomic(`${SW}/backlog.json`, bl);

const st = JSON.parse(readFileSync(`${SW}/state.json`, 'utf8'));
st.known_issues = st.known_issues.filter(k => k.id !== 'KI-32');
st.qa.full_qa_note_cycle_006 += ' DEDUPE CORRECTION applied within the same cycle: the look agent\'s 4th finding (empty --seed contradicts the Selection clause) turned out to duplicate measured gap D-43, which cycle 5 had already written into SPEC.md "Undecided behaviours" and routed to J-7. Q-3 and KI-32 were filed, then RETRACTED before commit; the one fact D-43 lacks (whitespace-PADDED seeds are accepted, so the refusal is specific to empty/whitespace-only) was folded into J-7\'s notes instead. Recorded because the near-miss is the lesson: an independent instrument re-deriving a known gap is corroboration, not new backlog, and filing it as new work would have inflated this cycle\'s apparent output with bookkeeping the run already owned.';
atomic(`${SW}/state.json`, st);

// keep the QA artifact's adjudication honest about where the finding actually routes
const qa = JSON.parse(readFileSync(`${SW}/runs/cycle-006-qa.json`, 'utf8'));
const f = qa.look.findings.find(x => /parseSeedValue/.test(x.where));
f.adjudication = 'RULING QUESTION, and a DUPLICATE of measured gap D-43 (SPEC.md "Undecided behaviours", filed cycle 5, human-owned via J-7). Not filed as new work. Value retained: (a) an instrument with no knowledge of D-43 independently re-derived it from the binary, which corroborates the gap; (b) one fact D-43 does not record — whitespace-PADDED seeds ARE accepted (`--seed " 5 "` === `--seed 5`), so the refusal is specific to empty/whitespace-only — was folded into J-7.';
atomic(`${SW}/runs/cycle-006-qa.json`, qa);

console.log('retracted Q-3 + KI-32; folded the new fact into J-7');
const c = bl.items.reduce((a, i) => (a[i.status] = (a[i.status] || 0) + 1, a), {});
console.log('backlog counts:', JSON.stringify(c), '| known_issues:', st.known_issues.length);
