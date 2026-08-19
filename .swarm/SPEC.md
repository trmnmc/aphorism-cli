# SPEC — aphorism-cli

<!-- REWRITTEN 2026-08-19 for IMPROVEMENT RUN #4 (allocator auto-kickoff,
     source=allocator, mode=guest, dial=0.30, posture=trickle,
     brief: "TRICKLE POSTURE: housekeeping only — harden tests, fix playbook items,
     polish docs — no new features. Haiku-priced work types; no new features.").

     This is the FOURTH consecutive run under this exact brief. Runs #1-#3 each closed
     every must-have they set; their must-haves (I-*, J-*, K-*) are preserved in git
     history, REPORT.md and RETRO.md, and are NOT restated here. The PRODUCT spec
     (Idea / Product must-haves / Domain rules / Taste notes) is unchanged.

     Stress-test verdict at this kickoff: RESHAPE (confidence 7). The attack that landed:
     three prior runs with this brief already exhausted it — 7 backlog items are open and
     6 are BLOCKED on human rulings an agent must not make, so a fourth identical run is
     churn, the exact failure mode run #3's own non-goals named. The defence that held:
     those runs exhausted their FRAMING, not the space. Two things measured at THIS
     kickoff were available to none of them: (a) the repo is PUBLIC and this session's
     `gh` token carries the `workflow` scope, so a free Actions matrix can EXECUTE the
     Node-18 floor claim three runs called permanently unverifiable; (b) REPORT.md grew
     98 KB -> 127 KB during the run whose must-have was "readable in one screen", because
     "nothing deleted" was read as "nothing moved". Re-aimed accordingly.

     Taste judge (fresh subagent, spec text only): use-twice 3 / product-not-demo 8 /
     scope-fits-night 9 / one-memorable-thing 5. Verdict: "the most honestly-scoped spec
     of the four runs and it will close cleanly, but that's the trap: it hinges on
     use-twice, and a fourth consecutive run producing zero user-visible value on a repo
     whose top product improvement (no-repeat rotation) stays deferred suggests the right
     call is to fold M-1 through M-4 into a half-night and spend the rest shipping the
     rotation — or point the allocator at a different repo."
     RECORDED AS DISSENT, NOT OVERRIDDEN. The judge is right and the conductor cannot act
     on it: rotation is a new user-visible feature, excluded by the allocator brief, and
     the brief is the operator's to change, not the swarm's. See "Expected shape of this
     run" below for the honest consequence. -->

## Idea

A tiny, zero-dependency Node.js CLI that prints a random programming aphorism with its
attribution. `fortune(6)`, but curated for programmers. Quiet, pipeable, unix-clean.

It already ships. Conductor-verified at this kickoff: `node --test test/*.test.js` ->
tests 118, pass 118, fail 0, 4.75s. Source is 3 files under `src/` plus a 3.9 KB binary;
50-entry corpus; zero runtime dependencies.

This run builds NO product. Nothing it does is visible to the CLI's user. That is
deliberate and it is the main thing a reader should weigh when judging whether the night
was worth spending — the taste judge scored exactly that axis a 3.

## Audience

Three, and they are different people.

1. **The CLI's user** — a developer who wants one memorable line of programming wisdom in
   their shell prompt, MOTD, or `.bashrc`. Nothing this run does reaches them.
2. **The repo's maintainer** — currently asked to read a 127 KB / 1578-line REPORT.md to
   learn the state of a three-file CLI. That file GREW from 98 KB during the very run
   whose must-have was "REPORT.md readable in its first screen".
3. **The swarm operator** — whose cross-run playbook helper has now been denied by the
   harness allowlist 30 consecutive times, reproduced live twice at this kickoff
   (`swarm-playbook.sh parse`, and the `settings.json` write that would fix it).

## Product must-haves (built + verified 2026-08-14; re-verified at this kickoff)

<!-- The floor this run must not break. Any regression here fails the cycle. -->

- [x] `node bin/aphorism.js` prints exactly one aphorism plus attribution to stdout, exit 0
- [x] A curated corpus of >= 40 aphorisms as structured data (text, author, tags) — 50 entries
- [x] Flags: `--author <name>`, `--tag <tag>`, `--seed <n>`, `--list`, `--json`, `--help`
- [x] No-match behaviour: message on stderr, nothing on stdout, non-zero exit
- [x] `node --test test/*.test.js` suite — 118 tests, 0 failures

## This run's must-haves (2026-08-19)

<!-- The PLAN gate (cycle.md step 4) holds until every box is covered by a backlog item.
     Checked off only after conductor verification, never by an agent's claim. -->

- [ ] **M-1 The Node support floor is settled by EXECUTION.** `README.md:10` claims a
      "Node 18+" floor that nothing in this repo has ever verified — no `engines` field, no
      CI matrix, no runtime assertion, and every suite run in this repo's recorded history
      was under Node 24 (KI-27, open since run #1 cycle 3). Three runs recorded it as
      permanently unverifiable because the VPS holds exactly one Node runtime and no
      container tooling; the sandbox confirms both again today. **It is not unverifiable.**
      The repo is PUBLIC on GitHub and this session's `gh` token carries the `workflow`
      scope, so a free Actions matrix can run the EXISTING suite on Node 18/20/22/24.
      Add `.github/workflows/test.yml`, push it, observe the real run with
      `gh run view --log`, and paste the actual per-version output into the journal.
      Whatever those runs say becomes the README's truth: the floor verified and cited to
      a run URL, or the floor corrected to the lowest version that actually passes.
      A workflow file is not a runtime dependency and is not a user-visible feature.
      **If Actions cannot be reached or the run cannot be observed, this must-have closes
      as an explicit FAILURE with the reason stated — never as a pass.**

- [ ] **M-2 REPORT.md answers its three questions in its first screen, measured in bytes.**
      What shipped / what is machine-verified / what is open, inside the first ~200 lines.
      The forensic history MOVES to an appendix under `docs/` — moved, not deleted.
      Verified mechanically by the conductor, not by claim: every non-whitespace line of
      the current REPORT.md must still be present in the concatenation of the new
      REPORT.md and the appendix, and every internal cross-reference must resolve. The
      audit output is pasted into the journal. Prior runs read "nothing deleted" as
      "nothing moved", which is why the file only ever grew; moving is not deletion.

- [ ] **M-3 The playbook allowlist gap: attempt, then prove or record.** Reproduced twice
      at this kickoff — `/opt/swarm/bin/swarm-playbook.sh parse` was DENIED by the
      harness, and the kickoff step-5 `SWARM/.claude/settings.json` write that would fix
      it was DENIED. That is denial #30, and the first time both halves were measured in
      the same session. If a later cycle finds the gap closed, proof is the REAL STDOUT of
      the previously-denied script pasted into the journal, plus this run's applied-ledger
      line written by `record-applied` for the first time since 2026-08-09 — never "it
      should work now." If it stays closed, `SWARM/playbook/HANDOFF-allowlist-2026-08-17.md`
      is updated with denial #30, the exact JSON lines to add, and the single command a
      human runs to confirm the fix.
      **Honest limit, restated from runs #2 and #3 because it has not changed:** the claim
      that `cmd_parse` exits 2 on any validator output was established by READING the
      script and has still never been EXECUTED. This run cannot execute it either.

- [ ] **M-4 Every open item has a named actor or a decision this run can honestly make.**
      Seven backlog items are open; six are BLOCKED on human rulings an agent must not
      make — T-006 (corpus attribution audit), T-040 (corpus retag consequences), J-7
      (five unspecified CLI behaviours), TS-1/TS-2/TS-3 (corpus depth, tag-pool depth,
      voice concentration). Each is either settled by a ruling this run is permitted to
      make, or restated in REPORT.md's hand-off with its next actor and the exact evidence
      that would settle it. The one unblocked item — R-1, the README acknowledgement-guard
      reshape — is either done and conductor-verified, or explicitly declined with a stated
      reason. KI-35 (per-run `cycle-NNN-*` artifact filenames collide across runs in
      `.swarm/runs/`) is a real housekeeping defect this run can fix without touching the
      product. None is silently dropped; none is re-opened as agent work an agent cannot
      honestly finish.

- [ ] **M-5 No regression and no growth for its own sake.** `node --test test/*.test.js`
      green at >= 118 tests on every commit this run makes. A test is added ONLY to pin a
      claim this run makes true, or for a measured mutation survivor classified HOLE or
      BOUNDARY (L-033) — never because the suite "looks thin". Every added test is proven
      FAILABLE and ATTRIBUTABLE (L-029) and paired with a CONVERSE control that must leave
      the suite GREEN (L-044). Zero new user-visible features, zero runtime dependencies,
      `src/corpus.js` byte-identical at WRAP_UP.

## Expected shape of this run

<!-- Stated at kickoff so the morning report cannot be read as a surprise. -->

`stop_at` is ~24 hours out. M-1 through M-5 are four bounded chores and a standing guard
on a three-file repo; they will not fill 24 hours. When they close and no VALUE_LOOP
candidate clears the "would the target user notice?" ratchet, the correct machine
behaviour is for this target to go DONE (or stall) rather than manufacture churn — and
the churn breaker will enforce that. **An early finish is the honest outcome here, not a
failure.** If the operator wants the clock spent instead, the lever is the brief: inject a
scope change (the no-repeat rotation the taste judge named is the single highest-value
one) and the run will fold it in at the next PLAN checkpoint.

## Nice-to-haves

<!-- DEFERRED — every entry is a new user-visible feature, excluded by the brief.
     Recorded, not built. -->

- No-repeat-until-exhausted rotation (cursor in `$XDG_STATE_HOME` or `/tmp`). Still the
  single change that would most improve the product: the corpus repeats by roughly the
  ninth invocation, and every taste judge that has looked at this repo — three now — has
  named it.
- `--width <n>` wrapping for long aphorisms
- ANSI dim for the attribution line, respecting `NO_COLOR`

## Non-goals

- Any network access, remote corpus fetch, or LLM call in the shipped CLI
- A database, accounts, or long-term persistence
- npm-registry publishing / global install packaging
- **This run only:** any new user-visible feature or flag, including every Nice-to-have above
- **Corpus expansion (backlog T-008, 50 -> 120 entries)** — named explicitly rather than
  silently defaulted, because it is the one open item a user WOULD notice. Excluded on two
  grounds: (1) the brief says no new features; (2) the highest-severity open issue (KI-2)
  is that the existing 50 attributions are UNAUDITED, and programming aphorisms are widely
  misattributed — doubling a corpus nobody can vouch for makes the worst open problem
  worse. Reversible on a word from the operator.
- **Any new runtime or dev dependency.** Re-scouted at this kickoff (2 searches): static
  Node-engine verification off the shelf means `eslint-plugin-n`, a dependency; mutation
  testing means Stryker, a dependency. Both are scope changes, not housekeeping. A GitHub
  Actions workflow file is neither — it adds nothing to `require()` and nothing to install.
- **Any test that does not trace to a measured mutation survivor or to a claim this run
  makes true.** A test added because the suite "looks thin" is churn, and on this repo it
  is the specific failure mode three stress-tests running have now flagged.
- **Deleting or rewriting any historical claim, cycle citation, or dated row.** M-2 moves
  text; it never drops it.

## Taste notes

Unix-clean and quiet. One aphorism to stdout, nothing else — no banner, no emoji, no
box-drawing by default. Must survive `aphorism | cat` and `aphorism > file` unchanged.
Errors go to stderr, never stdout. `--help` fits on one screen. Attribution is dim, not
loud; the aphorism is the product.

## Domain rules

<!-- UNCHANGED. A regression against any clause below fails the cycle regardless of what
     else the cycle achieved. These 29 clauses are the coverage map runs #1-#3 measured
     at 29/29; this run does not re-measure it (that would be churn — run #3 closed it and
     re-derived the enumeration besides). It is the regression floor, not a work item. -->

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
     these entries. Carried forward verbatim from run #3; all remain human-owned (J-7). -->

**Repeated `--tag` / `--author` (measured gap D-42)**

- **Shipped behaviour:** `--tag humor --tag design --list` prints the 14-entry design list; a first-occurrence mutation prints the 9-entry humor list; the suite stays green on both, so the behaviour is unprotected.
- **Why the SPEC does not decide it:** Selection and Filtering spell every filter flag in the singular and never mention repetition, so last-occurrence-wins is an artifact of assignment order in `parseArgs`, not a contract.
- **Status:** No test pins this. Human-owned, tracked as backlog item J-7.

**Empty or whitespace `--seed` (measured gap D-43)**

- **Shipped behaviour:** The implementation rejects an empty or whitespace-only seed with exit code 2.
- **Why the SPEC does not decide it:** Selection says `--seed` accepts any value `Number()` parses to non-NaN, and `Number("") === 0` is non-NaN, suggesting ACCEPT. Exit codes makes a missing flag argument bad usage, suggesting REJECT. The two clauses point opposite ways.
- **Status:** No test pins this. Human-owned, tracked as backlog item J-7.

**Empty `--author` / `--tag` value, `=` form vs space form (measured gap D-44)**

- **Shipped behaviour:** `--author ''` exits 0 and prints an aphorism (`--author '' --list | wc -l` is 50, the whole corpus). `--author=` exits 2 with `aphorism: flag --author requires a value`. `--tag ''` exits 1 with `aphorism: no aphorism matches those filters`. `--tag=` exits 2 with `aphorism: flag --tag requires a value`.
- **Why the SPEC does not decide it:** Exit codes makes a missing flag argument a usage error and the `=` branch's rejection of an empty value is a deliberate line of code, so empty could be read as missing. Against that: a shell passing `''` DID supply an argument, and the space-form results follow mechanically from Filtering's substring and whole-tag clauses. No clause names an empty value or distinguishes the two forms.
- **Status:** No test pins this. Human-owned, tracked as backlog item J-7.

## Definition of done

**Product (met 2026-08-14, must not regress):** `node bin/aphorism.js` prints a random
attributed aphorism; all six flags behave per the Domain rules; `node --test test/*.test.js`
passes with zero failures; the corpus holds >= 40 entries; README documents install-free
usage and every flag; the tree has zero runtime dependencies.

**This run:** the Node support floor either verified by real multi-version CI output cited
to a run URL, or corrected in README to what the runs actually show — and a not-run
reported as not-run; REPORT.md's first screen answering shipped / machine-verified / open
within ~200 lines, with the mechanical nothing-lost audit pasted into the journal; the
allowlist gap either proven closed by EXECUTING the previously-denied script, or handed
off with denial #30 and an exact patch; every open item carrying a named next actor and
the evidence that would settle it; `node --test test/*.test.js` green with zero failures
throughout; zero new user-visible features; zero dependencies; `src/corpus.js`
byte-identical.

## Commands

- run: `node bin/aphorism.js`
- test: `node --test test/*.test.js`

## Spec digest

- IMPROVEMENT RUN #4 on a shipped zero-dep Node CLI — settle two unsupported claims; no new features
- must: Node floor settled by REAL Actions matrix output or corrected in README; not-run reported as not-run (M-1)
- must: REPORT.md first screen answers shipped/verified/open, history MOVED not deleted, nothing-lost audit pasted (M-2)
- must: allowlist gap proven closed by executing the denied script, else denial #30 + exact patch handed off (M-3)
- must: every open item gets a named actor + settling evidence; KI-35 fixed (M-4); suite green >= 118, no test without a measured cause (M-5)
- non-goals: corpus expansion, rotation, --width, NO_COLOR, any new flag, any dependency, any unmeasured test, any deleted citation
- rules unchanged: seed deterministic incl. non-finite, filters AND, empty match = exit 1 + stderr only
- taste: unix-quiet, pipeable, errors to stderr, the aphorism is the product
