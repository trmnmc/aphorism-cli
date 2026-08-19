// run #4, cycle 1 — PLAN: write backlog items N-1..N-7 covering must-haves M-1..M-5.
// Conductor-authored. Filename is run-scoped (run4-cycle-001-*) deliberately: KI-35 says
// cycle-NNN-* names collide across runs, and adopting the convention here is what makes
// backlog item N-3 true rather than merely documented.
import fs from "fs";

const p = "/opt/targets/aphorism-cli/.swarm/backlog.json";
const b = JSON.parse(fs.readFileSync(p, "utf8"));

const N = [
  {
    id: "N-6",
    title: "M-3: record denial #31 with a sibling-script discriminator and hand off the exact patch",
    kind: "docs", covers: ["M-3"], status: "todo", priority: 9, effort: "S", value: "S",
    model: "conductor", owner: "conductor", deps: [], attempts: 0, filed_cycle: 1,
    files_hint: [".swarm/journal.md"], packages: [],
    acceptance: "The current reachability of the swarm playbook helper is settled by an ACTUAL invocation this run made, not by inference from a prior run - and whichever way it came out is recorded with the evidence that distinguishes an allowlist omission from a directory-level guard or a harness quirk. If it is still unreachable, the standing hand-off document carries this run's denial count and the exact configuration lines a human would add, so the next person has a patch rather than a complaint.",
    notes: "CONDUCTOR-OWNED, not dispatchable - the plan agent flagged this correctly and the reason is structural: every action M-3 needs touches /opt/swarm, which hard rule 5 forbids passing to any workflow agent. ALREADY PROBED AT CYCLE 1: `/opt/swarm/bin/swarm-playbook.sh parse`, bare, no pipe, no env prefix -> \"This command requires approval\". Denial #31. The discriminator that makes this an omission rather than a guard: /opt/swarm/bin/swarm-budget.sh and /opt/swarm/bin/swarm-notify.sh, same directory, same invocation shape, BOTH RAN in this same session and returned real output. So the deny is per-entry, not per-directory. What remains is updating SWARM/playbook/HANDOFF-allowlist-2026-08-17.md with denial #31 plus that discriminator. Honest limit unchanged from runs #2/#3: the claim that cmd_parse exits 2 on validator output is still READ, never EXECUTED, and this run cannot execute it either."
  },
  {
    id: "N-1",
    title: "Add a Node 18/20/22/24 Actions matrix that runs the existing suite",
    kind: "fix", covers: ["M-1"], status: "todo", priority: 10, effort: "S", value: "M",
    model: "sonnet", owner: "builder", deps: [], attempts: 0, filed_cycle: 1,
    files_hint: [".github/workflows/test.yml"], packages: [],
    acceptance: "A version-controlled CI workflow exists that runs this repo's EXISTING test command unmodified against each of Node 18, 20, 22 and 24, on push and on manual dispatch, using no dependency and no install step beyond checkout and the Node setup action. Each version reports its own pass/fail independently, so one failing version does not mask the others. The workflow adds nothing to require() and nothing to install.",
    notes: "Builder scope is the workflow file ONLY. It must NOT edit README.md's Node-18 floor claim: the true floor is unknown until the conductor pushes this, triggers a real run and reads real per-version output, and writing a plausible correction without that output is exactly the unverified-claim failure M-1 exists to kill. Default branch is `master` (not main) - the trigger must name it correctly or the push produces no run. Set fail-fast off, or a Node-18 failure cancels the other three and destroys the very evidence M-1 wants."
  },
  {
    id: "N-7",
    title: "M-1 conductor half: push the matrix, observe the REAL run, settle the README floor from what it says",
    kind: "qa", covers: ["M-1"], status: "todo", priority: 10, effort: "M", value: "M",
    model: "conductor", owner: "conductor", deps: ["N-1"], attempts: 0, filed_cycle: 1,
    files_hint: ["README.md"], packages: [],
    acceptance: "The Node support floor README.md states is backed by the observed result of a real multi-version CI run on this repo - the floor either confirmed and cited to that run, or corrected to the lowest version the run actually shows passing. The per-version output is pasted as evidence. If the run cannot be reached or observed, the must-have closes as an explicit FAILURE naming the reason, and the README claim is marked unverified rather than left implying it was checked.",
    notes: "CONDUCTOR-OWNED by construction: only this session holds the gh token (scopes confirmed at cycle 1: gist, read:org, repo, workflow) and only the conductor commits and pushes (hard rule 1). Repo is PUBLIC, so Actions minutes are free. Three prior runs recorded this floor as PERMANENTLY UNVERIFIABLE because the VPS holds one Node runtime and no containers - that reasoning was about the wrong machine and is what this item overturns. FAILURE MODES TO REPORT HONESTLY, not route around: Actions disabled on the repo; the workflow scope insufficient in practice despite being listed; the run queued past this run's stop_at. Any of those closes M-1 as a stated FAILURE, never as a pass."
  },
  {
    id: "N-2",
    title: "REPORT.md: first screen answers shipped / verified / open; history MOVED to an appendix",
    kind: "docs", covers: ["M-2"], status: "todo", priority: 11, effort: "L", value: "L",
    model: "sonnet", owner: "builder", deps: [], attempts: 0, filed_cycle: 1,
    files_hint: ["REPORT.md", "docs/report-history.md"], packages: [],
    acceptance: "A reader opening REPORT.md learns what the CLI ships, what is machine-verified, and what is open, from the first ~200 lines alone, without scrolling into forensic detail to find any of the three. The forensic history that made the file 1578 lines is still present in full - MOVED verbatim into a linked appendix, not summarized, not paraphrased, not dropped - and every cross-reference between the two documents resolves to something that exists.",
    notes: "HIGHEST-RISK ITEM OF THE RUN. M-2's own rule is mechanical: every non-whitespace line of today's REPORT.md must still appear in the concatenation of the new REPORT.md and the appendix. Move sections BYTE-FOR-BYTE; write only the new first-screen summary fresh. Any paraphrase, any reflowed dated row, any tidied cycle citation fails that audit - and the run's non-goals forbid deleting or rewriting a historical claim regardless. ROUTING NOTE, a conductor judgment recorded because it overrides a mechanical rule: gear-2 demotion would send this docs item to haiku, and this repo has already MEASURED that failure - run #3 cycle 4 (record N-6) and cycle 14 both caught a haiku agent writing false provenance into REPORT.md, the second time inside the very paragraph whose job was dating claims correctly. Demotion is REFUSED here; hold at sonnet or above."
  },
  {
    id: "N-5",
    title: "Hand-off: every open item carries a named next actor and the evidence that would settle it",
    kind: "docs", covers: ["M-4"], status: "todo", priority: 12, effort: "M", value: "M",
    model: "sonnet", owner: "builder", deps: ["N-2"], attempts: 0, filed_cycle: 1,
    files_hint: ["REPORT.md"], packages: [],
    acceptance: "Every open backlog item - the six blocked on a human ruling (T-006, T-040, J-7, TS-1, TS-2, TS-3) and R-1 - appears in REPORT.md's hand-off with a NAMED next actor and the SPECIFIC evidence that would settle it, reachable from the first screen. A reader never has to open backlog.json to learn who owns an open item or what would close it. Nothing is dropped and nothing blocked is re-described as work an agent could pick up.",
    notes: "Sequenced after N-2 because both edit REPORT.md and no two dispatched items may share a file. The underlying facts already exist in backlog.json notes - this is synthesis, not investigation, and inventing an actor or a piece of settling evidence that backlog.json and SPEC.md do not already support is the failure mode to avoid. The six blocked items are blocked because an agent must not make those rulings; restating them must not soften that."
  },
  {
    id: "N-3",
    title: "KI-35: run-scoped artifact naming so cycle-NNN files stop colliding across runs",
    kind: "polish", covers: ["M-4"], status: "todo", priority: 13, effort: "S", value: "S",
    model: "haiku", owner: "builder", deps: [], attempts: 0, filed_cycle: 1,
    files_hint: [".swarm/runs/NAMING.md"], packages: [],
    acceptance: "A future run writing its own cycle artifacts under .swarm/runs/ cannot overwrite or shadow a same-numbered artifact from an earlier run, because a written-down naming convention makes each run's artifacts distinguishable by name - and that convention sits where the next conductor will meet it before naming its first artifact. Not one of the existing ~400 files is renamed, moved or edited.",
    notes: "MEASURED at cycle 1: .swarm/runs/ holds 404 files named cycle-NNN-*, numbered from four runs whose cycle counters each restart at 1. Run #4's cycle-001-* would land on run #1's. Renaming the existing files is FORBIDDEN and that is not conservatism - README.md, REPORT.md and backlog.json notes cite several of them by exact path, and a rename silently breaks a historical citation, which this run's non-goals prohibit. So the fix is forward-only. HONEST LIMIT: a builder cannot make the conductor obey the convention - that logic is outside this repo. The convention closes this item; the conductor following it for run #4's own artifacts is what makes it true, and is verified as such."
  }
];

const existing = b.items;
const r1 = existing.find((i) => i.id === "R-1");
r1.covers = ["M-4", "M-5"];
r1.priority = 14;
r1.notes +=
  " || RUN #4, cycle 1: M-4 names this item explicitly and permits exactly two outcomes - done and conductor-verified, or explicitly DECLINED with a stated reason. Run #3 cycle 14 already scored it against the two-question ratchet and it FAILED question one (a user in a terminal notices nothing either way), and recorded that both dispositions are human-owned: retiring the guard deletes a claim, and a human ruling on T-040 could reintroduce the single-entry tags whose absence is the whole reason it looks vacuous. Carried into run #4 unchanged so the decline, if that is where it lands, is made on this run's own record rather than inherited.";
for (const it of existing) {
  if (!it.covers) it.covers = ["M-4"];
}

b.items = [...N, ...existing];
b.items.sort((a, c) => a.priority - c.priority);
fs.writeFileSync(p + ".tmp", JSON.stringify(b, null, 2));
fs.renameSync(p + ".tmp", p);

console.log("wrote " + b.items.length + " items");
for (const i of b.items) {
  console.log([i.id, i.status, "p" + i.priority, i.kind, i.effort, i.model, (i.covers || []).join("/")].join(" | "));
}
