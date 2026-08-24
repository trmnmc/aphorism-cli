# SPEC — aphorism-cli (improvement run #8)

<!-- Locked at cycle 0, improvement run #8, 2026-08-24T13:05:56Z (allocator auto-kickoff).
     Frozen after lock. The conductor restates the digest every cycle and re-reads this
     file in full every 5th cycle (reference/cycle.md step 3). -->

## Idea

A shipped, zero-dependency Node CLI that prints one random attributed programming aphorism
(594 lines of source, 50-entry corpus, 129 passing tests at HEAD). This is IMPROVEMENT
RUN #8 under a trickle brief: *harden tests, fix playbook items, polish docs — no new
features.*

**The run's content is not newly authored.** Run #7 stress-tested and taste-gated an
identical brief, reshaped it from "add more guards" into "REDUCE the guard layer and
publish the measurement that justifies each reduction," locked that spec — and then
delivered ZERO work cycles, because its whole 24-hour window sat inside an exhausted
weekly limit (382 spawned sessions, 381 dead on HTTP 429, median lifetime 415 ms). This
run ADOPTS that unbuilt spec, re-verified item by item against the repo before anything
is prioritized (L-045).

The measurement that motivates it, taken at cycle 0 of this run:

| | |
|---|---|
| `src/` + `bin/` | **594 lines** |
| `test/` | **4,587 lines** (7.7× the program) |
| largest single test file | `test/readme-tags.test.js`, **2,778 lines** |
| coverage (run #7 baseline) | 100% line / 100% func / 98.44% branch, single miss classified BOUNDARY |
| suite at HEAD `20b7ede` | **129 tests / 129 pass / 0 fail / 0 skipped** |

Roughly three quarters of the test lines guard **documents** — README tables, citation
lines, tag counts — not code. Adding a sixth layer of README guards is the toy version of
"harden tests," and it is what runs #2 through #6 built.

## Audience

Nominally: a terminal user who wants a programming aphorism. Actually, for this run: the
next maintainer who has to read 4,587 lines of test to change a 594-line program.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only
     after conductor verification, never by claim. -->

- [ ] **S-1 — MEASURE FIRST, then retire.** Publish a measured inventory of which
      count-claim guards actually exist and bind at HEAD. (Run #7's spec named a
      `>= 121 tests` count floor; cycle 0 of THIS run verified no such literal floor
      exists anywhere in `test/` — the inherited premise is itself unconfirmed, which is
      exactly why the inventory comes before the retirement.) Then, and only for guards
      the inventory shows exist, replace any COUNT floor with a DETECTION floor: a
      bounded, rule-generated mutation set (**≤ 30** mutations, one per machine-checked
      claim, generation rule stated in the file, plus **one identity control that must
      leave the suite GREEN**), shipped as a rerunnable `tools/mutation-matrix.mjs`. No
      mutation detected at baseline `20b7ede` may go undetected at final HEAD. **A
      test-count DROP is a PASS**, not a regression.
- [ ] **S-2 — Close KI-R6-3.** Consolidate the two guards that read the same
      "Tags on exactly one entry" README row, OR publish the specific mutation that
      distinguishes them and keep both. Either outcome closes it; "keep both because
      removing one feels risky" does not.
- [ ] **S-3 — Quote, do not paraphrase (closes Q-10 / KI-R6-5).**
      `docs/node-support-citation-history.md` must QUOTE README's citation-selection rule
      verbatim instead of restating it. The current paraphrase demonstrably selects a
      different CI run than the rule it paraphrases, agreeing with the committed citation
      only by accident. Any machine check added to hold this is **≤ 30 lines, failable,
      attributable, and converse-controlled**.
- [ ] **S-4 — Count the citation two-commit tax.** How many times in repo history has a
      guard whose subject is a git pathspec been knowingly committed RED and re-cited on a
      following commit? Publish the number and a recommendation. **Change no pathspec, no
      assertion, no citation.**
- [ ] **S-5 — Adjudicate the Node-support matrix numbers.** README's matrix reads
      `129 tests, 127 pass, 0 fail, 2 skipped` on all four Node versions, while the suite
      at HEAD measures `129 / 129 / 0 / 0`. Determine BY MEASUREMENT whether the citation
      rule still selects the cited run, and whether a reader is being shown a stale
      current-state claim. Publish the finding; repair **only if** the measurement says it
      is wrong. A finding of "correct as cited, and here is why the numbers differ" is a
      PASS.
- [ ] **S-6 — Every published finding ships as a RERUNNABLE TOOL, not as prose.**
      (Added at lock by the taste gate — see Taste notes.) S-1's inventory and matrix, S-4's
      tax count, and S-5's adjudication must each be produced by an executable checked into
      `tools/` that re-derives its number from the repo when run. A must-have discharged by
      a paragraph a reader cannot re-run is NOT done. `tools/` is new scaffolding for
      *measurement*, not a feature, and adds zero runtime dependencies.
- [ ] **S-7 — The escalation must be decision-ready.** REPORT.md carries a single
      paragraph escalating the three user-visible changes locked out by the trickle brief
      for the FOURTH consecutive run (corpus depth, no-repeat rotation within a session,
      `--tag` discoverability), written as **concrete brief text run #9 could be launched
      with verbatim** — not as a complaint. Stated once; never re-derived (L-045).
- [ ] **S-8 — Invariants.** Zero new features, zero new dependencies,
      `src/corpus.js` sha256 `77a4de5c…` and `--help` sha256 `d759d781…` byte-unmoved,
      suite green at every commit except a two-commit citation window predicted **in
      advance** and named in its own commit message.

## Nice-to-haves

None authored, deliberately. This run's characteristic failure mode is manufacturing
chores, so it gets no optional queue to fall into.

## Non-goals

- **No new CLI features.** Corpus depth (TS-1), no-repeat rotation within a session
  (TS-3), and `--tag` discoverability (TS-2/TS-6) are the three changes a real user would
  actually notice. All are locked out by the trickle brief for the fourth consecutive run.
  They are escalated ONCE under S-7 and never re-derived.
- **No new guard LAYERS.** A cycle that ends with `test/` larger than it started, without a
  published measurement justifying the growth, has failed its own premise.
- **No SWARM self-repair.** `bin/swarm-playbook.sh` is unallowlisted — confirmed at cycle 0
  by reading `.claude/settings.json` directly (12th consecutive confirmation, **zero tool
  denials burned**). Hard rule 5 fences `bin/`. Escalated once in the report, not
  re-derived. The same applies to the watchdog DONE-guard blind spot (KI-26 / L-037) and
  the pacer's fixed retry cadence (L-037) — both are SWARM tool gaps, reported, never
  edited from inside a run.
- **No human-owned work.** KI-2 (corpus attribution audit), T-006, T-040, J-7, P-7 and Q-9
  stay blocked and are surfaced with what would settle each.

## Taste notes

The aesthetic is **subtraction with receipts**. On a repo already at 100% line and function
coverage, the only honest way to "harden tests" is to prove that *detection survives
removal*. Every deletion must be paid for with a mutation that still dies.

The lock-step taste judge scored this spec **use-twice 4 / product-not-demo 6 /
scope-fits-night 7 / one-memorable-thing 6** and landed one structural catch, which changed
the spec rather than being annotated onto it: *"S-1/S-4/S-5 can all be discharged by
publishing a finding, so half the must-haves can land as prose and still pass."* That is
what **S-6** now forecloses. Its second condition — that the escalation actually unblock
something for run #9 rather than restate a grievance — is what **S-7** now requires.

The `use-twice 4` is recorded and NOT argued away: for the eighth consecutive run the CLI
itself gains nothing a user would notice. That is the honest cost of a trickle brief on a
finished 594-line program, and S-7 exists because the right response is to escalate it, not
to absorb it a fifth time.

## Domain rules

Deliberately NOT restated here. The corpus shape, `pick()` seeding semantics, and the
citation-selection rule are machine-checked in `test/` and stated in `README.md`; a
paraphrase of a machine-checked rule in a second document is precisely the defect S-3
exists to remove (L-043). QA agents needing ground truth read `README.md` and
`src/` directly.

## Definition of done

S-1 through S-8 each verified by a gate the conductor authors **at verification time**,
never visible to the builder, with real command output pasted into the journal as
evidence. REPORT.md states the measured before/after `test/` line count (baseline: 4,587)
and carries the S-7 escalation paragraph. Any must-have not verified is reported as
NOT-RUN with what would settle it — never as passed.

## Commands

- run: `node bin/aphorism.js`
- test: `node --test test/*.test.js`

## Spec digest

- IMPROVEMENT RUN #8 on a shipped zero-dep Node CLI — adopt run #7's stress-tested but
  entirely UNBUILT guard-reduction spec, re-verified item-by-item first; no new features,
  no new deps.
- must: measure which count-claim guards actually bind at HEAD BEFORE retiring any, then
  replace COUNT floors with a DETECTION floor — ≤30 rule-generated mutations + one GREEN
  identity control, shipped as rerunnable `tools/mutation-matrix.mjs`; a test-count DROP
  is a PASS (S-1).
- must: close KI-R6-3 by consolidating the two same-row guards or publishing the
  distinguishing mutation (S-2); make the citation-history doc QUOTE README's rule instead
  of paraphrasing it, guard ≤30 lines, failable, attributable, converse-controlled (S-3).
- must: COUNT the citation two-commit tax and adjudicate the README matrix's 127-vs-129
  numbers by measurement, changing nothing unless the measurement says it is wrong
  (S-4, S-5).
- must: every published finding ships as a rerunnable tool, not prose (S-6); the
  run's escalation of the three brief-locked user-visible changes is written as brief text
  run #9 could launch with (S-7); corpus sha 77a4de5c and --help sha d759d781 unmoved,
  green every commit bar one predicted citation window (S-8).
