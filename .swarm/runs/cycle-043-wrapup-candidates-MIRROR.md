# WRAP_UP DISTILL candidates — improvement-aphorism-cli-2026-08-15

PRE-DRAFTED AT CYCLE 43, not at WRAP_UP. Reason: `bin/swarm-playbook.sh append` is
confirmed refused in this session (cycle 43 gate, check S8 — see the ROOT CAUSE section
below), so the documented manual fallback is required, and a manual fallback drafted under
the WRAP_UP clock is a fallback drafted badly. Cycle 44+ may revise; WRAP_UP consumes.

Source: `<target>/.swarm/RETRO.md` § Config recommendations (drafted cycle 42, gated 15/15
against a 0/15 negative control). Deduped semantically against all 31 lessons currently in
`playbook/learnings.md` — the script only catches exact re-learns, so this pass is the
conductor's judgment and is shown rather than asserted.

Run: 2026-08-15 aphorism-cli (improvement run). Targets: aphorism-cli.
Ids assigned from the file's `next_id: 37`.

---

## RECOMMENDATION TO THE HUMAN: do not append these yet

`playbook/learnings.md` holds **31 lessons against a stated cap of 20**. That breach is
pre-existing and was already handed to a human by the previous run (commit a49bafd,
"hand cap breach to a human"). Appending this run's 5 would make it 36.

The documented manual fallback says to apply the cap by dropping the oldest
non-high-confidence pre-existing lessons. Applied literally here that means **hand-deleting
16 lessons** from a shared file whose overflow policy a human has already been asked to
adjudicate. The conductor is not taking that action: it is destructive, it is not reversible
from this run's artifacts, and the cap question is explicitly already someone else's call.

So: the lessons below are **drafted and preserved**, and the append is **deferred to the
human** along with the cap decision. No lesson is lost either way — that is the actual
requirement the fallback exists to satisfy.

---

## The five candidates

- L-037 [qa] Documentation guards must extract from STRUCTURE — tables, rows, delimited tokens — and anchor to English prose only where the prose token itself carries mathematical meaning; five consecutive narrowings each bought one attributed kill and left a smaller false-rejection hole, and a maintainer's cheapest escape from a false rejection is deleting the guard [apply: prompt qa "Extract documentation-guard values from structure (tables, rows, delimited tokens), never by position in English prose; if the value is only expressible in prose, classify it BOUNDARY instead of narrowing the anchor."] [confidence: high] [source: 2026-08-15 aphorism-cli]

  DEDUPE NOTE: adjacent to L-033 (classify survivors HOLE vs BOUNDARY) and shares its tail
  clause. Kept separate because the head is new and is the part that acts: L-033 says *when
  to stop hardening*, L-037 says *where a guard should have anchored in the first place*.
  Evidence: cycles 20, 22, 25, 27, 33, 35, 37, 38, 39; KI-9, KI-10, KI-12.

- L-038 [process] When the conductor authors BOTH an artifact and its verification gate, the builder-never-saw-the-check protection is gone; substitute an explicit NEGATIVE-CONTROL arm requiring the artifact's previous version to score 0 on the same checks [apply: prompt all "When you author both the artifact and its gate, add a negative-control arm: the previous version of the artifact must FAIL the same checks. A gate only its own subject can pass is not a gate."] [confidence: high] [source: 2026-08-15 aphorism-cli]

  DEDUPE NOTE: distinct from L-012 (a probe must not wrap the assertion under test in
  try/catch). L-012 is about a probe hiding its own failure; L-038 is about the missing
  independence between author and gate. The strongest lesson of this run — it found real
  document defects twice in two cycles, in artifacts the conductor was confident in.
  Evidence: cycle 41 (13/13 vs 0/13, 2 genuine defects), cycle 42 (15/15 vs 0/15, 4 genuine
  document defects + 1 instrument defect + 1 vacuous pass).

- L-039 [process] Every dispatch prompt must name an EXPLICIT scratch path inside the target; agents receive target paths only, but the session cwd is the SWARM root, so a relative scratch path silently lands inside the hard-rule-5 write fence [apply: prompt all "Write all scratch files to <target>/.swarm/scratch/ and remove them before returning. Never use a relative scratch path — your cwd is not your workspace."] [confidence: high] [source: 2026-08-15 aphorism-cli]

  DEDUPE NOTE: no near-neighbor on file. SWARM-mechanism-specific and directly actionable.
  Evidence: cycles 9, 19, 21, 24 (KI-7) — four occurrences, zero after the prompt named a path.

- L-040 [process] A sealed pre-dispatch baseline must live OUTSIDE the target directory, or be sealed by commit-reveal — publish the hash before dispatch, the plaintext after the agent returns; `<target>/.swarm/runs/` is inside the directory every builder can read [apply: prompt all "Seal pre-dispatch baselines by publishing only their hash; reveal the plaintext after the agent returns."] [confidence: high] [source: 2026-08-15 aphorism-cli]

  DEDUPE NOTE: no near-neighbor on file. Evidence: KI-8 found cycle 30; commit-reveal
  applied cycles 36, 37, 38.

- L-041 [process] A conductor harness must report UNPARSEABLE rather than fall through to a verdict, and must force `--test-reporter=tap` whenever it parses test output — a null parse that evaluates to "killed" manufactures a clean sheet for every mutant including the control [apply: prompt all "Parse test output only under an explicitly forced reporter, and make an unparseable run report UNPARSEABLE — never let a failed parse fall through into a pass/fail verdict."] [confidence: high] [source: 2026-08-15 aphorism-cli]

  DEDUPE NOTE: SAME FAMILY as L-010 (never capture verify exit codes through a pipe — a
  pipe ate a real failure). Both are "the instrument silently converted a failure into a
  pass". Kept as its own bullet rather than merged because the actionable mechanism is
  different and specific (forced reporter + explicit UNPARSEABLE state), but the text names
  the family so a human reading the file sees them as one class rather than two accidents.
  If the human prefers a merge at cap-resolution time, merging L-041 into L-010 loses the
  `--test-reporter=tap` specific and that is the cost to weigh.
  Evidence: cycles 19, 23, 24, 41 — four instrument failures, one of them silent.

---

## Not a new lesson — an edit to an existing one

**L-033 `confidence: med` → `high`.** L-033 (classify each mutation survivor HOLE or
BOUNDARY before hardening anything) was written on the 2026-08-15 moon run. This run is a
strong second independent observation, including the exact case it was written for: cycle 39
stopped a five-deep narrowing treadmill by classifying rather than hardening.

Recorded here rather than in the applied-lessons ledger because L-033 was **not** staged in
this run's `runfile.playbook.applied` — cycle 42's gate (check C11) caught the draft RETRO
claiming it was, and that inflation was corrected. Promotion is the human's call at
cap-resolution time.

---

## ROOT CAUSE of the refusal that forces this manual path (KI-5, measured cycle 43)

Carried for 42 cycles as a black-box observation. The permission source of truth was read
directly this cycle. `/opt/swarm/.claude/settings.json` `permissions.allow` contains exactly
two SWARM-script entries:

    Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)   <- macOS path, absent on this host
    Bash(bin/swarm-notify.sh:*)                                <- relative form, the one that works

There is **no entry for `swarm-budget.sh` or `swarm-playbook.sh` in any path form**, and no
entry for the VPS absolute prefix `/opt/swarm/bin`. The settings file was never migrated
from macOS to the VPS. This predicted 7/7 measured cells including two negative controls and
two cells no prior cycle had measured (gate: `<target>/.swarm/runs/cycle-043-gate-ki5.js`,
output: `cycle-043-verify-ki5.txt`).

Two consequences, both derived from the allowlist rather than executed:

- **S8** — `bin/swarm-playbook.sh append ...` at WRAP_UP will be REFUSED. This document is
  the response.
- **S9** — `bin/swarm-notify.sh send wrap-up ...` (relative, cwd `/opt/swarm`) will be
  PERMITTED. The wrap-up push can go out; previously this was unknown and assumed dead.

NOT FIXED, deliberately: hard rule 5 makes `settings.json` read-only until WRAP_UP
completes. The one-line repair (add `Bash(bin/swarm-budget.sh:*)` and
`Bash(bin/swarm-playbook.sh:*)`) is a human's to apply between runs.
