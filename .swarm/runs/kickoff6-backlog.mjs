import fs from "node:fs";

const P = "/opt/targets/aphorism-cli/.swarm/backlog.json";
const old = JSON.parse(fs.readFileSync(P, "utf8"));

const carried = (old.items || [])
  .filter((i) => i.status === "blocked" || i.status === "dropped")
  .map((i) => ({
    ...i,
    notes:
      (i.notes || "") +
      " | carried into improvement run #6 unchanged; the brief forbids the ruling this needs",
  }));

const nu = [
  {
    id: "Q-1",
    title: "Extract the five run-journal blockquotes out of README.md into docs/",
    kind: "docs",
    priority: 1,
    value: "H",
    effort: "M",
    status: "todo",
    deps: [],
    files_hint: ["README.md", "docs/"],
    acceptance:
      'README.md contains zero blockquotes headed "Updated 2026-08-20 (cycle N)"; every moved line is present byte-identically in a dated file under docs/, in chronological order; README.md is at least 5000 bytes smaller than 16609; the Node-support section still states the live citation and its two standing limits in plain prose',
    packages: [],
    model: "haiku",
    attempts: 0,
    notes:
      "README:205-299, ~95 lines, cycles 3/10/5/6/9 out of chronological order. Run #5's own retro filed this as a house-rules proposal and never actioned it.",
  },
  {
    id: "Q-2",
    title: "Classify and repair every guard that breaks under Q-1, at its anchor",
    kind: "test",
    priority: 1,
    value: "H",
    effort: "M",
    status: "todo",
    deps: ["Q-1"],
    files_hint: [
      "test/node-support-citation.test.js",
      "test/readme-tags.test.js",
      "test/citations.test.js",
    ],
    acceptance:
      "every guard that breaks under Q-1 is repaired by re-anchoring it to a structural marker the document owns, never by restoring prose to satisfy it; each break is classified guard-defect or real-claim-loss with both columns reported; guards that did NOT break are named as the control",
    packages: [],
    model: "haiku",
    attempts: 0,
    notes:
      "L-043. The prose is guard-shaped, so moving it MEASURES whether each guard reads structure or prose. A guard that breaks on honest prose has reported its own defect.",
  },
  {
    id: "Q-3",
    title: "Node-support section: fix the tests-120 vs 121 self-contradiction and guard it",
    kind: "test",
    priority: 1,
    value: "H",
    effort: "M",
    status: "todo",
    deps: [],
    files_hint: ["README.md", "test/node-support-citation.test.js"],
    acceptance:
      "every count claim in the Node-support section resolves to a measured value; a count claim in that section can no longer silently disagree with the matrix table it sits under; the new check is shown failable AND attributable, and is paired with a converse control that must stay green",
    packages: [],
    model: "haiku",
    attempts: 0,
    notes:
      'README:186-191 reports 121 tests on all four majors; README:306-308 claims "# tests 120" and "(119 -> 120)". Measured truth at kickoff: 121 tests / 121 pass / 0 fail / 0 skipped on a full clone.',
  },
  {
    id: "Q-4",
    title: "Re-anchor the tag-vocabulary guard to the table; restore one honest sentence",
    kind: "docs",
    priority: 2,
    value: "M",
    effort: "S",
    status: "todo",
    deps: [],
    files_hint: ["README.md", "test/readme-tags.test.js"],
    acceptance:
      "README:71 states the tag distribution once, in one sentence, and the restatement at README:93 is gone; the guard reads the tag table rather than the prose; fixed-vs-unfixed columns on true inputs are reported",
    packages: [],
    model: "haiku",
    attempts: 0,
    notes:
      'Run #5 retro: "prose that restates one number three ways is a guard-satisfaction artifact, not writing".',
  },
  {
    id: "Q-5",
    title: "Hold the invariants at every commit",
    kind: "qa",
    priority: 1,
    value: "H",
    effort: "S",
    status: "todo",
    deps: [],
    files_hint: ["src/corpus.js", "bin/aphorism.js"],
    acceptance:
      "at every commit of this run: node --test test/*.test.js reports >= 121 tests and 0 fail; src/corpus.js is byte-identical to 3a17cc5; --help output is byte-identical; no dependency is added",
    packages: [],
    model: "haiku",
    attempts: 0,
    notes: "Hard rule 4. Conductor-run, never delegated.",
  },
  {
    id: "Q-6",
    title: "Playbook allowlist item: escalate once, do not re-derive",
    kind: "docs",
    priority: 3,
    value: "M",
    effort: "S",
    status: "done",
    deps: [],
    files_hint: [],
    acceptance:
      "the handoff document's stated ask is confirmed unchanged against the live settings file in ONE read, and the run spends no further cycles on it",
    packages: [],
    model: "haiku",
    attempts: 1,
    notes:
      "CLOSED AT KICKOFF 2026-08-20T14:36Z by direct read of /opt/swarm/.claude/settings.json: swarm-playbook.sh carries no entry under any of the 11 swarm-* allow forms. parse denied this session (denial #34); the step-5 settings write denied (#35). HANDOFF-allowlist-2026-08-17.md's ask is unchanged and still correct. L-045: escalate once, never re-derive.",
  },
];

fs.writeFileSync(
  P,
  JSON.stringify({ items: [...nu, ...carried] }, null, 2) + "\n",
);
console.log("new", nu.length, "carried", carried.length, "total", nu.length + carried.length);
console.log("carried ids:", carried.map((c) => c.id).join(", "));
