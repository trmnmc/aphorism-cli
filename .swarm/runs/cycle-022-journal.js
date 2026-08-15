'use strict';
const fs = require('fs');
const mirror = fs.readFileSync('/opt/targets/aphorism-cli/.swarm/runs/cycle-022-mirror.json', 'utf8').trim();

const block = `
## cycle 22 — 2026-08-15T18:20Z — aphorism-cli — POLISH

clock: now 1786817094 at open, stop_at 1786879464 (17h19m remaining). No WRAP_UP trigger, no
  limp. Fresh pacer-spawned -p session, conductor pid 534995 (previous 523048).
budget: bin/swarm-budget.sh REFUSED by the permission layer again — TWENTY-FIRST consecutive
  cycle (KI-5). Attempted rather than skipped on precedent, per the standing cycle-14 rule that
  the sanctioned path is tried every cycle and the gate is never assumed from history; it
  refused before the command started, so probe_failures stays 0 on the standing reasoning.
  bin/swarm-notify.sh poll likewise refused, so the control poll was file-only: runs/control.json
  read directly — pending[] and applied[] both empty, no inject[] array. Nothing to apply,
  nothing to triage. Gear re-derived by hand from runs/allocator.json (source=probe), which
  moved slightly since cycle 21: posture trickle, allow_premium_pct 0, allow_overall_pct 0,
  weekly_used_pct 85.0, opus_used_pct 97, week_elapsed_pct 79.21 (was 78.97).
  weekly_heat 1.0731 < 1.1 → governor disengaged, ceiling 5. opus_heat 1.2246 > 1.2 → promote
  blocked. trickle + guest 1-3 clamp → gear 1, k_cap 1, demote true. Week resets 1786942799,
  after stop_at, so gear 1 stands for the rest of the run.
orient: target tree CLEAN at open. SWARM root carried no scratch debris. Craft pack loaded
  clean; its ui/review/docs packs are not applicable to a test-guard item on a Node CLI and
  were not spliced.
re-anchor: cycle 22, 22 % 5 != 0 → spec_digest only, no full SPEC re-read (cycle 20 did one).
  Item sits under improvement must-have I-2 (tests hardened only where MEASUREMENT shows a
  hole) and touches no product surface.

work: T-016 — guard the three README claims that live OUTSIDE the Tag vocabulary section and
  were checked by nothing: C1, the corpus-size figure in the Attribution section
  (\`ranks all 50 entries\`) against corpus.length; C2, the HIGH-risk count (\`8 are rated HIGH\`)
  against docs/corpus-attribution-triage.md; C6, every path named in the Layout fenced block
  against the filesystem. Picked per the cycle-21 handoff and on the VALUE_LOOP score: C6 is
  the cheapest real protection left on the board — a file rename currently makes the Layout
  block lie with nothing noticing — and all three check against something REAL rather than
  against prose, which is what makes them HOLE where the Flags/Exit-code survivors are BOUNDARY.

PRE-DISPATCH BASELINE (.swarm/runs/cycle-022-baseline.js/.txt) — the blindness was MEASURED,
not inherited from cycle 19's survivor list. PRISTINE control fired first at 68/68/0:

    C1    SURVIVED  tests=68 pass=68 fail=0  :: "ranks all 50 entries" -> 49
    C2    SURVIVED  tests=68 pass=68 fail=0  :: "8 are rated HIGH" -> 9
    C6    SURVIVED  tests=68 pass=68 fail=0  :: Layout renamed to src/selektor.js (nonexistent)
    C0    KILLED    tests=68 pass=67 fail=1  :: CONTROL "37 distinct tags" -> 38

  C0 is what makes the three survivals ATTRIBUTED rather than merely observed: the mutation
  pipeline and the suite are provably live, and provably blind to exactly these three.
  Also derived independently before dispatch: corpus.length = 50, and the triage table holds
  50 rows with ids 0..49 distinct, rated HIGH 8 / MEDIUM 16 / LOW 26. So the README is CORRECT
  today — this item makes a correct README checkable, it does not fix a wrong one.
  Sealed pre-commitment written BEFORE dispatch: .swarm/runs/cycle-022-precommit.md, naming
  five risks (R1 prose-keying, R2 hardcoded expectations, R3 tautological extraction,
  R4 collateral edits, R5 vacuous pass on parse failure) and committing the gate to different
  mutations than the builder's.
dispatch: ONE sonnet Agent, direct call — headless -p makes Workflow review-gated, and k_cap 1
  at gear 1 means a wave of one either way. Model sonnet: gear-1 demotion drops sonnet→haiku
  for docs/polish only, and a test item is neither. Prompt scoped to ONE file, handed over the
  measured baseline, required derivation from corpus.length / the triage doc / the filesystem
  rather than hardcoding, forbade prose-keyed assertions (T-012 hazard) and tautological
  extraction (the T-009/F5 failure), required fail-loud on parse miss, and required proof TWICE
  per L-029. Per KI-7's cycle-21 refinement the prompt named the in-target scratch path AND
  required removing the scratch DIRECTORY, not just its contents. Playbook builder prompt_lines
  appended verbatim, including the three React/env lines that are inert here — staged faithfully
  and labelled inert in the prompt itself, not silently dropped (hard rule 5).
agent return (CLAIM, not fact): three tests added, 71/71, all three failable and attributable.
  It also volunteered an edge case it was unsure about, which is what produced probe N1 below.

VERIFICATION EVIDENCE — conductor harness .swarm/runs/cycle-022-verify-T-016.js, authored AT
verification time and never shown to the builder. My mutations run in the OPPOSITE direction or
against a DIFFERENT target from the builder's:

    PASS  CTRL-PRISTINE    unmutated copy: tests=71 pass=71 fail=0
    PASS  CTRL-DENOM       skip-pattern removes exactly the 3 new tests: 68/68/0
    PASS  CTRL-SKIPSANE    unrelated mutation still fails under the same pattern: fail=1
    PASS  C1.FAILABLE      50 -> 51 (UP; builder used 49 DOWN) KILLED, new test named
    PASS  C1.ATTRIB        same mutation, new tests filtered -> 68/68/0
    PASS  C2.FAILABLE      8 -> 7 (DOWN; builder used 9 UP) KILLED, new test named
    PASS  C2.ATTRIB        -> 68/68/0
    PASS  C6.FAILABLE      bin/aphorism.js -> bin/aphorisms.js KILLED, new test named
    PASS  C6.ATTRIB        -> 68/68/0
    PASS  C6b.FAILABLE     test/ -> tests/ (directory-entry shape) KILLED
    PASS  R2a.C1.TRACKS    corpus 50->51 + README updated consistently -> GREEN 71/71
    PASS  R2a.C1.STALE     same corpus change, README stale -> fail=1 naming C1
    PASS  R2b.C2.TRACKS    triage row MEDIUM->HIGH + README updated -> GREEN 71/71
    PASS  R2b.C2.STALE     same triage change, README stale -> fail=1 naming C2
    PASS  R2c.C6.TRACKS    real new file + matching Layout line -> GREEN 71/71
    PASS  R2c.C6.STALE     Layout line for a file never created -> fail=1 naming C6
    PASS  R1.NOFALSEREJECT prose reworded, digits and paths intact -> GREEN 71/71
    PASS  R1.STILLKILLS    reworded prose + wrong number -> fail=1 naming C1
    PASS  R5.NOSECTION     whole Attribution section deleted -> fail=2, C1 and C2 by name
    PASS  R5.NOFENCE       Layout fence replaced by prose -> fail=1 naming C6
    PASS  SCOPE.PREFIX     HEAD file is an unmodified prefix (18823 B -> 27189 B)
    PASS  SCOPE.ONEFILE    tracked files changed: ["test/readme-tags.test.js"]
    PASS  SCOPE.SCRATCH    builder scratch DIRECTORY removed: true
    === 23 pass / 0 fail ===

  Full output: .swarm/runs/cycle-022-verify-T-016.txt. All five sealed risks were REFUTED by
  measurement: R1 by the reword pair, R2 by the three TRACKS/STALE pairs, R3 by every FAILABLE
  check (a tautology cannot fail), R4 by SCOPE.PREFIX and SCOPE.ONEFILE, R5 by the two
  section-removal checks.

The R2 pairs are the checks that mattered and no acceptance clause asked for them. Every other
  check asks whether a WRONG README is caught, and a guard hardcoding 50 / 8 / a literal path
  list passes all of them today. Only the consistent-change form separates the two, and T-016
  is the first item where that question has THREE different answers, because its three claims
  are checked against three unrelated sources and a guard could plausibly be derived for one
  and hardcoded for another. So the pair was run three times: a 51st corpus entry (design
  13->14) with the README updated stays green; a triage row flipped MEDIUM->HIGH with the
  README updated stays green; a real new file with its Layout line stays green — and each
  stale half fails naming its own test. All six halves landed as required.

C2 was NOT dropped, though the item explicitly authorised dropping it. The permission was
  conditional — "may honestly be dropped if it proves fiddly to parse" — and I tested the
  condition before dispatch instead of after: the triage table parses structurally on "first
  cell is a bare integer", which excludes header and separator rows without depending on any
  wording. A conditional escape hatch taken without testing its condition is a dropped
  requirement with a citation attached.

RESIDUAL, conductor probe N1, filed as T-020 (S, LOW value, priority 7): rewriting the
  Attribution aside as "8 of the 50 entries carry a rating of HIGH" — every number still TRUE —
  fails the suite at 71/70/1, naming the C2 test. The extraction splits on em/en dashes and
  takes the digit nearest BEFORE the marker; with the dashes gone the paragraph is one clause
  and 50 sits nearer to HIGH than 8 does. This is a false REJECTION of an honest edit, the safe
  direction — it fails LOUD and names the claim rather than going quiet — so it gets the same
  LOW classification T-018 got at cycle 20, not the T-012 treatment. Worth recording that the
  probe exists only because the builder listed this edge case under "things I was unsure about"
  rather than omitting it: an honest uncertainty note converted straight into a measured item.

test_cmd on the real tree: 71 tests / 71 pass / 0 fail, run by me, not reported by the agent.
  Baseline was 68/68 at open; the delta is exactly the three added tests.
post-merge checks: no merge occurred — a direct Agent dispatch edits the working tree, there is
  no branch to merge and none was created. collision-scan and the qa-verify look pass remain
  not-applicable to a Node CLI with no browser surface, and the changed file is a test file, so
  the user-visible heuristic does not fire either. Skipped with reason, not silently.
autotune: APPLIED. Clean wave — zero reverts, zero failed verifies — so wave_streak 1 → 2, which
  triggers k_current = min(5, k_current + 1) and resets the streak to 0. k_current was already
  at the hard max 5, so it stays 5. Inert at gear cap 1 either way.
known issues: KI-2 high UNCHANGED (corpus attribution — human hand-off, never claimed audited).
  KI-3 low UNCHANGED. KI-4 high UNCHANGED. KI-5 medium UNCHANGED, twenty-one cycles of evidence.
  KI-6 low UNCHANGED. KI-7 low UNCHANGED but NOTED as measured-clean: the cycle-21 remedy
  refinement (remove the DIRECTORY, not just its contents) was applied verbatim in the prompt
  and the builder honoured it — SCOPE.SCRATCH passed for the first time since the refinement was
  written. Stays open: one clean cycle does not close a structural hole whose fence is a prompt
  line. No new known issue: T-020 is a backlog item, not a KI — a bounded false-rejection in a
  test guard, not a product risk.
phase: POLISH, unchanged. No phase change, so no phase-change notification was owed — had one
  been, it could not have been sent under KI-5.
outcome: 1 item verified done (T-016), 1 item filed (T-020). No item blocked, no revert, no
  attempt escalation, no product code touched. consecutive_no_value stays 0.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped — the tool is absent
  in a -p session, which is not a publish failure and does not increment publish_failures.
next: T-017 is the pick — check the README's \`--list\` format literal (\`<text> — <author>\`,
  U+2014) against what the shipped binary actually prints (T-013 survivor C5). It is the last
  HOLE from cycle 19's sweep that is not yet closed, and it is the cleanest kind of check in
  this repo: a literal-vs-behaviour comparison that freezes no wording, because the README states
  the format BOTH as English prose and as a backtick literal and only the literal is asserted
  against. Do NOT write the check against the English sentence — that is the C3/C4/C7 boundary
  mistake cycle 19 classified explicitly. Then T-019 (whole-band-table deletion), T-018 and
  T-020 (both loud false-rejections, lowest value). Carry all three standing hazards into the
  prompt as this cycle did: never key assertions to lead-in prose (T-012), derive expectations
  from the real artifact rather than hardcoding (R2), and name the scratch DIRECTORY for removal
  (KI-7). T-007/T-008 and KI-2 remain the honest human hand-off, unchanged.

runfile-mirror:
\`\`\`json
${mirror}
\`\`\`
`;

fs.appendFileSync('/opt/targets/aphorism-cli/.swarm/journal.md', block);
console.log('journal appended, block bytes', block.length);
