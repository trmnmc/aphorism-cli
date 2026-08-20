# SPEC — aphorism-cli

<!-- REWRITTEN 2026-08-20 for IMPROVEMENT RUN #5 (allocator auto-kickoff,
     source=allocator, mode=guest, dial=0.33, posture=trickle,
     brief: "TRICKLE POSTURE: housekeeping only — harden tests, fix playbook items,
     polish docs — no new features. Haiku-priced work types; no new features.").

     This is the FIFTH consecutive run under this exact brief. Runs #1-#4 each closed
     every must-have they set; their must-haves (I-*, J-*, K-*, M-*) are preserved in git
     history, REPORT.md, docs/report-history.md and RETRO.md, and are NOT restated here.
     The PRODUCT spec (Idea / Product must-haves / Domain rules / Taste notes /
     Undecided behaviours) is UNCHANGED and carried forward verbatim in substance.

     Stress-test verdict at this kickoff: RESHAPE (confidence 6). The attack that landed:
     four runs have already worked this brief, run #4 closed DONE at cycle 12 with ~18.5
     of 24 hours unspent and said so in its own report, all 7 remaining backlog items are
     BLOCKED on human rulings an agent must not make, and the CI matrix + REPORT.md
     surgery that justified run #4 are both already done. A fifth identical run is the
     churn three prior stress-tests named. The defence that held, and it is narrow but it
     is real and it is MEASURED: no run in this repo's recorded history has ever asked the
     RUNTIME which branches the suite reaches. Measured live at this kickoff —
     `node --test --experimental-test-coverage` returns 100.00% line / 100.00% funcs /
     98.44% branch, the sole gap being bin/aphorism.js at 85.71% branch — and
     "experimental-test-coverage" occurs ZERO times in a 1.49 MB journal. Four runs argued
     about whether the suite was "thin" using SPEC-clause mutation sweeps; none ever ran
     the instrument that answers it directly, and it is built into Node, so it adds no
     dependency. That converts "harden tests" from an unfalsifiable instruction into a
     bounded, falsifiable, closable one. Re-aimed accordingly.

     CYCLE-1 AMENDMENT, and it cuts against this run: the reshape above was sized on an
     UNMEASURED reading of that 85.71%. Measured properly at cycle 1 (lcov: BRF 7 / BRH 6),
     the gap is ONE branch, not twelve — the dead false-arm of a ternary whose condition is
     a module constant. P-1 therefore closes in a single cycle with ZERO tests added, and
     the honest headline is stronger than the one the kickoff wrote: this suite already
     executes every REACHABLE branch in the tree, and the four-run-old "is the suite thin?"
     argument is now closed by measurement rather than by assertion. But the stress-test's
     original attack lands harder for it — the new instrument did not open a night of work,
     it confirmed in one cycle that there was none. Weight moves to P-3 and P-4, and the
     expected shape below (early DONE is the honest outcome) becomes the LIKELY shape.

     Taste judge (fresh subagent, spec text only): use-twice 3 / product-not-demo 6 /
     scope-fits-night 9 / one-memorable-thing 5. Verdict: "Load-bearing axis is use-twice:
     as scoped this is a well-designed, honestly-bounded half-night of chores that leaves
     nothing a user or a future reader will return to, so it is worth running only if the
     operator declines to lift the brief — the specific change needed is upstream of this
     spec, not inside it."
     RECORDED AS DISSENT, NOT OVERRIDDEN — for the SECOND consecutive run. The judge is
     right and the conductor still cannot act on it: every high-value candidate it points
     at is a new user-visible feature, excluded by the allocator brief, and the brief is
     the operator's to change, not the swarm's. See "Expected shape of this run".
     (Contract note: the judge's block emitted a duplicate `scope-fits-night` axis entry,
     a deviation from the four-axis output contract. The four distinct scores above are
     taken from its first occurrence of each axis; the duplicate carried the same score.)
-->

## Idea

A tiny, zero-dependency Node.js CLI that prints a random programming aphorism with its
attribution. `fortune(6)`, but curated for programmers. Quiet, pipeable, unix-clean.

It already ships. Conductor-verified at this kickoff: `node --test test/*.test.js` ->
tests 119, pass 119, fail 0, 5.14s. Source is 3 files under `src/` (494 lines) plus a
100-line binary; 50-entry corpus; zero runtime dependencies. A GitHub Actions matrix
(`.github/workflows/test.yml`, built by run #4) runs that suite on Node 18/20/22/24 on
every push and is green on HEAD.

This run builds NO product. Nothing it does is visible to the CLI's user. That is
deliberate and it is the main thing a reader should weigh when judging whether the night
was worth spending — the taste judge scored exactly that axis a 3, for the second run
running.

## Audience

Three, and they are different people.

1. **The CLI's user** — a developer who wants one memorable line of programming wisdom in
   their shell prompt, MOTD, or `.bashrc`. Nothing this run does reaches them.
2. **The repo's maintainer** — now well served on paper: REPORT.md is 199 lines, the
   forensic history lives in `docs/report-history.md`, and CI is green across four Node
   versions. What they still cannot answer without running it themselves: which branches
   of the binary the 119-test suite never executes.
3. **The swarm operator** — whose cross-run playbook helper has now been denied by the
   harness allowlist 31 consecutive times, reproduced live TWICE at this kickoff
   (`swarm-playbook.sh parse` DENIED, and the `settings.json` write that would fix it
   DENIED).

## Product must-haves (built + verified 2026-08-14; re-verified at this kickoff)

<!-- The floor this run must not break. Any regression here fails the cycle. -->

- [x] `node bin/aphorism.js` prints exactly one aphorism plus attribution to stdout, exit 0
- [x] A curated corpus of >= 40 aphorisms as structured data (text, author, tags) — 50 entries
- [x] Flags: `--author <name>`, `--tag <tag>`, `--seed <n>`, `--list`, `--json`, `--help`
- [x] No-match behaviour: message on stderr, nothing on stdout, non-zero exit
- [x] `node --test test/*.test.js` suite — 119 tests, 0 failures

## This run's must-haves (2026-08-20)

<!-- The PLAN gate (cycle.md step 4) holds until every box is covered by a backlog item.
     Checked off only after conductor verification, never by an agent's claim. -->

<!-- CORRECTED at cycle 1, before any work was planned on it. The kickoff draft of P-1
     said the gap was "12 of 14" branches. That number was INFERRED from the 85.71%
     percentage, never measured, and it is WRONG. The lcov reporter reports
     `BRF:7 / BRH:6` for bin/aphorism.js: SEVEN branches, SIX hit, exactly ONE missed.
     85.71% is 6/7, not 12/14. The correction shrinks P-1 from a night of work to a
     single ternary arm, and it is recorded here rather than quietly restated, because a
     conductor's own unmeasured number is exactly the class of claim this run exists to
     catch. See the cycle-1 journal block for the full measurement. -->

- [ ] **P-1 The branch-coverage gap is measured, classified, and closed or explicitly
      declined.** `bin/aphorism.js` sits at 85.71% branch — the only sub-100% cell in the
      tree, and measured as exactly ONE unexecuted branch of seven. Enumerate it by
      construction and not by guess. Classify it HOLE (a real behaviour nothing pins) vs BOUNDARY
      (unreachable in practice, or a distinction the SPEC does not decide — L-033), with
      the reasoning recorded per branch. Only a HOLE earns a test. Every added test must be
      proven FAILABLE and ATTRIBUTABLE (L-029: run the mutation twice, once with the test
      present and once with it removed, and require the second arm to survive) and paired
      with a CONVERSE control that must leave the suite GREEN (L-044). A BOUNDARY is
      recorded as a BOUNDARY and never quietly converted into a test to raise a number.
      **Closing evidence is the re-run coverage table pasted into the journal. If the
      enumeration cannot be made exact, this must-have closes as an explicit FAILURE with
      the reason stated — never as a pass, and never as a percentage nudged upward.**

- [ ] **P-2 Coverage becomes a standing instrument, not a one-off reading.** The measured
      baseline is written down where the next reader finds it, and the Actions matrix runs
      the coverage report so the number is observable per-push on all four Node versions —
      verified by a real run URL and real log output, never by "the YAML looks right".
      **No coverage THRESHOLD is enforced and none may be added.** A ratchet on a 3-file
      repo invites writing tests to feed the ratchet, which is the exact churn three prior
      stress-tests flagged. Report the number; never gate on it. If the flag's output
      proves unstable across the four Node versions, that finding IS the deliverable and
      the CI wiring is declined with the evidence.

- [ ] **P-3 Every documented claim is re-checked against measured behaviour, in both
      directions.** README, `--help` output, and `docs/` audited claim-by-claim against
      what the binary actually does — doc->code AND code->doc, enumerating every citation
      FORM including the bare `:N` sibling shorthand a path-anchored sweep silently misses
      (L-043). Any claim that is false, stale, or unreachable (L-046: implemented is not
      the same claim as reachable) is corrected or removed with the measurement pasted.
      Never bind an assertion to prose matched by regex; read a structural marker the
      document owns, or retire the check. **A clean audit is a valid, reportable outcome** —
      prior runs found real defects this way twice, and finding none this time is a result,
      not a failure to try.

- [ ] **P-4 The playbook allowlist gap: attempt, then prove or record.** Reproduced twice
      at this kickoff — `/opt/swarm/bin/swarm-playbook.sh parse` was DENIED by the harness,
      and the kickoff step-5 `/opt/swarm/.claude/settings.json` write that would fix it was
      DENIED. That is denial #31, and the second consecutive run measuring both halves in
      the same session. The gap is now precisely located: the allow list carries
      `Bash(/opt/swarm/bin/swarm-budget.sh:*)` and `Bash(/opt/swarm/bin/swarm-notify.sh:*)`
      but no `swarm-playbook.sh` entry in any form. If a later cycle finds the gap closed,
      proof is the REAL STDOUT of the previously-denied script pasted into the journal,
      plus this run's applied-ledger line written by `record-applied` for the first time
      since 2026-08-13 — never "it should work now." If it stays closed,
      `/opt/swarm/playbook/HANDOFF-allowlist-2026-08-17.md` is updated with denial #31 and
      the exact JSON lines to add, and this run's ledger line is written BY HAND and MARKED
      as such, never left to look script-written.
      **Honest limit, restated from runs #2-#4 because it has not changed:** the claim that
      `cmd_parse` exits 2 on any validator output was established by READING the script and
      has still never been EXECUTED. This run cannot execute it either.

- [ ] **P-5 No regression and no growth for its own sake.** `node --test test/*.test.js`
      green at >= 119 tests on every commit this run makes, and the Actions matrix green on
      the final HEAD. A test is added ONLY to pin a measured branch HOLE (P-1) or a claim
      this run makes true — never because the suite "looks thin". Zero new user-visible
      features, zero new runtime OR dev dependencies, `src/corpus.js` byte-identical at
      WRAP_UP.

## Expected shape of this run

<!-- Stated at kickoff so the morning report cannot be read as a surprise. -->

`stop_at` is ~24 hours out. P-1 through P-5 are bounded chores on a three-file repo and
they will not fill 24 hours — P-1 is 12 named branches on a 100-line file. When they close
and no VALUE_LOOP candidate clears the "would the target user notice?" ratchet, the correct
machine behaviour is for this target to go DONE rather than manufacture churn, and the
churn breaker will enforce that. **An early finish is the honest outcome here, not a
failure.**

For the SECOND consecutive run the report will escalate the same thing: the single
highest-value change available to this repo — no-repeat-until-exhausted rotation, named
independently by four taste judges now — is locked out by the brief. The lever is the
operator's, not the swarm's. If the operator wants this clock spent on product, the move is
to inject that scope change and the run will fold it in at the next PLAN checkpoint.

## Nice-to-haves

<!-- DEFERRED — every entry is a new user-visible feature, excluded by the brief.
     Recorded, not built. -->

- No-repeat-until-exhausted rotation (cursor in `$XDG_STATE_HOME` or `/tmp`). Still the
  single change that would most improve the product: the corpus repeats by roughly the
  ninth invocation, and every taste judge that has looked at this repo — four now — has
  named it.
- `--width <n>` wrapping for long aphorisms
- ANSI dim for the attribution line, respecting `NO_COLOR` (measured gap D-46: zero ANSI
  bytes ship on any path today, while Taste notes below claims the attribution is "dim")

## Non-goals

- Any network access, remote corpus fetch, or LLM call in the shipped CLI
- A database, accounts, or long-term persistence
- npm-registry publishing / global install packaging
- **This run only:** any new user-visible feature or flag, including every Nice-to-have above
- **Any enforced coverage threshold, ratchet, or CI gate on the coverage number.** Named as
  a non-goal rather than left to judgment, because P-1 and P-2 put a percentage on screen
  and the reflex to make it go up is exactly the churn this brief keeps producing.
- **Corpus expansion (backlog T-008, 50 -> 120 entries)** — named explicitly rather than
  silently defaulted, because it is the one open item a user WOULD notice. Excluded on two
  grounds: (1) the brief says no new features; (2) the highest-severity open issue (KI-2)
  is that the existing 50 attributions are UNAUDITED, and programming aphorisms are widely
  misattributed — doubling a corpus nobody can vouch for makes the worst open problem
  worse. Reversible on a word from the operator.
- **Any new runtime or dev dependency.** Re-scouted at this kickoff (3 searches, GitHub
  free-text + `--topic=mutation-testing`): the only live JS mutation tool is
  `stryker-mutator/stryker-js`, a dependency; static Node-engine verification off the shelf
  means `eslint-plugin-n`, a dependency. Both are scope changes, not housekeeping. Node's
  own `--experimental-test-coverage` is in-tree, ships with the runtime already required,
  and adds nothing to `require()` and nothing to install — which is precisely why this run
  can use it and not them. Stance: **build** (hand-rolled, as runs #1-#4 did).
- **Any test that does not trace to a measured branch HOLE or to a claim this run makes
  true.** A test added because the suite "looks thin" is churn, and on this repo it is the
  specific failure mode four stress-tests running have now flagged.
- **Deleting or rewriting any historical claim, cycle citation, or dated row.** Corrections
  under P-3 move or amend text with the measurement attached; they never drop it.

## Taste notes

Unix-clean and quiet. One aphorism to stdout, nothing else — no banner, no emoji, no
box-drawing by default. Must survive `aphorism | cat` and `aphorism > file` unchanged.
Errors go to stderr, never stdout. `--help` fits on one screen. Attribution is dim, not
loud; the aphorism is the product. (See D-46: the "dim" claim is aspirational, not shipped
— human-owned, and building it is a locked non-goal this run.)

## Domain rules

<!-- UNCHANGED. A regression against any clause below fails the cycle regardless of what
     else the cycle achieved. These 29 clauses are the coverage map runs #1-#3 measured
     at 29/29; this run does not re-measure it (that would be churn — run #3 closed it and
     re-derived the enumeration besides, and run #4 re-ran it 29 KILLED / 0 SURVIVED). It
     is the regression floor, not a work item. P-1 measures a DIFFERENT thing: not whether
     the SPEC's clauses are pinned, but which BRANCHES of the binary the suite executes. -->

- Selection: with `--seed <n>`, the chosen index is deterministic — the same seed and the
  same filtered candidate set always yield the same aphorism. `--seed` accepts any value
  that `Number()` parses to a non-NaN number, including negative numbers, non-integers, and
  `Infinity` / `-Infinity`; all are deterministic. Without `--seed`, selection is uniform
  over the filtered candidate set.
- Filtering: `--author` matches by substring containment, case-insensitively, against the
  aphorism's `author` field (e.g., `--author dijk` matches "Edsger W. Dijkstra"); `--tag`
  matches a whole tag, case-insensitively, for membership in the aphorism's `tags` array
  (e.g., `--tag desi` does not match a `design` tag). Supplying both narrows to the
  intersection (AND, not OR).
- Empty candidate set after filtering is an error, not an empty success: exit code 1,
  a human-readable message on stderr, and zero bytes on stdout.
- `--list` prints every aphorism in the filtered set in corpus order, one per line, in the
  form `<text> — <author>` (text, space, EM DASH U+2014, space, author). It accepts a valid
  `--seed` but ignores it; no random selection occurs. Exit code 0. A seed that fails to
  parse is still a usage error under `--list` — see Exit codes.
- `--json` emits the selected aphorism as a single-line JSON object with at minimum the
  keys `text`, `author`, and `tags`; it composes with the filter and seed flags. When
  combined with `--list`, `--json` emits one JSON object per line (newline-delimited JSON)
  for each entry in the filtered set, in corpus order.
- Exit codes: 0 success, 1 no match, 2 bad usage (unknown flag, missing flag argument, or
  seed value that `Number()` parses to NaN).

## Undecided behaviours

<!-- Records GAPS, not Domain rules. The 29-clause coverage map does NOT grow because of
     these entries. D-42 through D-46 carried forward verbatim from run #4. All remain
     human-owned (backlog J-7). Full text: docs/report-history.md and the run #4 SPEC in
     git history. Summarised here so this file stays readable; nothing is dropped. -->

- **D-42 — repeated `--tag` / `--author`.** Last-occurrence-wins ships; it is an artifact
  of assignment order in `parseArgs`, not a contract. No test pins it. Human-owned.
- **D-43 — empty or whitespace `--seed`.** Rejected with exit 2 today; the Selection clause
  and the Exit-codes clause point opposite ways. No test pins it. Human-owned.
- **D-44 — empty `--author` / `--tag` value, `=` form vs space form.** `--author ''` exits 0
  over the whole corpus; `--author=` exits 2; `--tag ''` exits 1; `--tag=` exits 2. No
  clause names an empty value or distinguishes the two forms. Human-owned.
- **D-45 — exit code 3 on write failure.** Ships on both streams and, on stderr, replaces
  the exit code the run had already earned. The Exit-codes clause enumerates 0/1/2 and
  never mentions 3; nothing says whether that enumeration is closed. The BEHAVIOUR is
  tested (test/pipe.test.js:86, :160, both via `/dev/full`); the SPEC/README gap is not.
  Human-owned.
- **D-46 — attribution is styled by punctuation only, not by a "dim" rendering.**
  `bin/aphorism.js:60` uses a four-space indent and an em dash; zero ANSI escape bytes ship
  on any path. Taste notes claims "dim"; Nice-to-haves carries ANSI dim as still-unbuilt —
  the SPEC contains both the claim and the admission it isn't built. Human-owned.

## Definition of done

**Product (met 2026-08-14, must not regress):** `node bin/aphorism.js` prints a random
attributed aphorism; all six flags behave per the Domain rules; `node --test test/*.test.js`
passes with zero failures; the corpus holds >= 40 entries; README documents install-free
usage and every flag; the tree has zero runtime dependencies.

**This run:** the `bin/aphorism.js` branch gap enumerated branch-by-branch, each one either
pinned by a test proven failable, attributable and converse-controlled, or recorded as a
BOUNDARY with its reasoning — and a not-run reported as not-run; the coverage baseline
written where the next reader finds it and observable per-push in CI without being gated
on, cited to a real run URL; every documented claim audited in both directions with
corrections measured and a clean audit reportable as clean; the allowlist gap either proven
closed by EXECUTING the previously-denied script or handed off with denial #31 and an exact
patch; `node --test test/*.test.js` green at >= 119 with zero failures throughout and the
Actions matrix green on final HEAD; zero new user-visible features; zero new dependencies;
`src/corpus.js` byte-identical.
