import fs from "node:fs";

const BP = "/opt/targets/aphorism-cli/.swarm/backlog.json";
const SP = "/opt/targets/aphorism-cli/.swarm/state.json";

const b = JSON.parse(fs.readFileSync(BP, "utf8"));
const find = (id) => b.items.find((i) => i.id === id);

const q1 = find("Q-1");
q1.status = "done";
q1.attempts = 1;
q1.notes +=
  " | DONE cycle 1, sealed gate 7/7 (gate sha256 49b328d3, unchanged pre->post). README 16609 -> 11165 bytes (-5444, -33%); 309 -> 233 lines. All five blockquotes byte-identical in docs/node-support-citation-history.md, reordered 3,10,5,6,9 -> 3,5,6,9,10. Builder scope held exactly: only README.md + the new docs file (git status confirmed).";

const q2 = find("Q-2");
q2.status = "in_progress";
q2.attempts = 1;
q2.notes +=
  " | CYCLE 1 MEASUREMENT — the headline result is a NEGATIVE, and it is the run's most valuable finding so far: 114 README lines deleted and the whole Node-support section rewritten, and ZERO guards broke (121/121 green). The builder was explicitly forbidden from touching test/ so the measurement could not be contaminated. Liveness then proven for test/node-support-citation.test.js rather than assumed (L-029/L-044): mutating the retirement base 2b003ea -> c9dd7ff made it FAIL loudly with a correct, self-naming assertion; restoring README byte-exactly (sha ebb0d9c4 both sides) returned it to 2 pass / 0 fail. Kill + converse control both observed, attribution pinned by running that file alone. REMAINING: same liveness proof for readme-tags.test.js (folds into Q-4) and citations.test.js.";

const q3 = find("Q-3");
q3.notes +=
  " | doc->doc half CLOSED incidentally by Q-1: README:306's 'tests 120' / '(119 -> 120)' is gone, replaced by '# tests <n>' / 'ℹ tests <n>' plus 'The test count moves as the suite grows'. That is the right repair — the durable claim is the TAP-vs-spec-reporter split and the U+2139 marker, and the literal count was the part that rotted. REMAINING: the guard that stops a count claim in that section silently disagreeing with its own matrix table.";

fs.writeFileSync(BP, JSON.stringify(b, null, 2) + "\n");

const s = JSON.parse(fs.readFileSync(SP, "utf8"));
s.phase = "BUILD";
s.cycle = 1;
s.decisions.push({
  cycle: 1,
  what: "Forbade the Q-1 builder from touching test/, and treated the resulting pass/fail list as the deliverable",
  why: "Which guards break under honest prose IS the measurement this run exists to take. A builder that repairs a failing guard mid-edit destroys the result. Zero broke — so the guards are anchored to structure, not to the padded prose, and the run's premise was half wrong in the useful direction.",
});
s.counters.consecutive_no_value = 0;
s.last_cycle = {
  n: 1,
  work: "Q-1 extract five run-journal blockquotes README -> docs/ (1 builder, k=1); Q-2 guard-liveness measurement",
  outcome: "sealed gate 7/7 verified; README -33%; zero guards broke; citation guard proven live by kill + converse control",
  commit: null,
};
s.qa = { ...(s.qa || {}), last_full_qa_cycle: 1 };
fs.writeFileSync(SP, JSON.stringify(s, null, 2) + "\n");

console.log("backlog + state updated for cycle 1");
