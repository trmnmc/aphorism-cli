# Node support citation history

**Moved out of `README.md` on 2026-08-20.** This file holds the five `Updated 2026-08-20
(cycle N)` entries that used to sit inside the `### Node support` section of
[`../README.md`](../README.md).

They were moved because they are a build journal, not documentation. Each entry narrates one
cycle of an autonomous run — which CI run id the section cited, why that citation was
retired, and what a review pass found while looking at the guard that watches it. Together
they ran to roughly 95 lines in the middle of the README, so a first-time reader met a
cycle-by-cycle history of this repo's own construction before reaching the flags, the exit
codes or the tag vocabulary. The provenance is real and worth keeping; it just belongs
somewhere an auditor would think to look, rather than in the user-facing docs.

**Nothing below has been altered.** Every blockquote is byte-identical to the text removed
from the README — same wording, same line wrapping, same indentation, same `> ` prefixes,
including any typo. These are historical records and their exact text is the point. Only the
prose *around* them (this header and the `## Cycle N` headings) is new.

Their internal references — "the paragraph above", "the table above", "this section",
"limits 1 and 2 above" — all point at the README's `### Node support` section as it stood
when each entry was written, not at anything in this file. They are left exactly as written
for the same reason the entries are kept at all.

## Order

In the README the five entries appeared as cycles **3, 10, 5, 6, 9** — the order they
happened to be appended, which is not the order they happened. Below they are in
chronological order by cycle number, so the citation chain reads forward:

| Cycle | Citation moved from | Citation moved to |
|---|---|---|
| 3 | run `32267338333` at commit `44702fb` | (not named in the entry) |
| 5 | run `32324495153` at commit `0c2ed40` | run `32328776838` at commit `5f833ab` |
| 6 | run `32328776838` at commit `5f833ab` | run `32331910336` at commit `c08562b` |
| 9 | run `32331910336` at commit `c08562b` | run `32335038575` at commit `c9dd7ff` |
| 10 | run `32335038575` at commit `c9dd7ff` | run `32337875271` at commit `2b003ea` |
| Q-7 (improvement run #6) | run `32337875271` at commit `2b003ea` | run `32400996331` at commit `4b63e91` |
| Q-8 (improvement run #6) | run `32400996331` at commit `4b63e91` | run `32405521233` at commit `7e50d6f` |
| W-7 (improvement run #8) | run `32405521233` at commit `7e50d6f` | run `32742357417` at commit `02f4668` |

The cycle 3 entry records only the citation it retired; the run id it moved to is not stated
in the entry itself, and is not inferred here. The last row is the citation the README still
carries today.

The row above labelled "Q-7 (improvement run #6)" is a later move, appended after this file
was first written; unlike the five rows above it, it is not one of the five cycles this
file's intro paragraph describes, and its label follows that later run's own task-id
convention rather than this run's cycle numbering. It was, until the two moves below it, the
citation the README carried; see "Q-7 (improvement run #6)" below for the entry.

The row above that, labelled "Q-8 (improvement run #6)", is a second later move, appended for
the same reason as Q-7: it is not one of the five cycles this file's intro paragraph
describes, and its label follows that later run's own task-id convention. It was, until the
row below it, the citation the README carried; see "Q-8 (improvement run #6)" below for the
entry.

The row below that, labelled "W-7 (improvement run #8)", is a third later move, appended for
the same reason as Q-7 and Q-8: it is not one of the five cycles this file's intro paragraph
describes, and its label follows that later run's own task-id convention. It is now the
citation the README carries; see "W-7 (improvement run #8)" below for the entry.

## Cycle 3

> **Updated 2026-08-20 (cycle 3).** The paragraph above previously cited run
> `32267338333` at commit `44702fb` with a 118-test matrix, and it had gone stale: the
> `git diff` it names as its own retirement condition had stopped being empty (77 added
> lines across `test/readme-tags.test.js` and `.github/workflows/test.yml`, from commits
> `0230c23` and `0c2ed40`), while the citation stayed put. The old table was not false
> about run `32267338333` — that run really did report 118 — it was a true statement about
> a matrix that no longer described this tree. Recorded rather than quietly swapped,
> because the self-guard is the reason the decay was catchable at all: the doc names the
> exact command that falsifies it, so an audit can check the claim instead of believing it.

## Cycle 5

> **Updated 2026-08-20 (cycle 5).** The citation above moved from run `32324495153` at
> commit `0c2ed40` (a 119-test matrix) to run `32328776838` at commit `5f833ab`. Nothing
> was wrong with the old citation when it was written; it was retired by its own stated
> condition, and this time a test noticed rather than a person. `test/node-support-citation.test.js`
> now parses the `git diff` command out of the paragraph above and runs it, so the section
> is checked on every suite run instead of whenever someone happens to wonder.
>
> Two honest limits, recorded here because both were measured rather than assumed:
>
> 1. **The guard is inert in CI, by design.** `actions/checkout@v4` checks out at depth 1,
>    so the cited base commit is not in CI's copy of the history and the test skips — that
>    is the `1 skipped` in all four rows of the table above. It protects a maintainer with
>    a full clone; it does not protect the matrix. Making it fail on an unreachable base
>    would turn CI red for the wrong reason, which is worse.
> 2. **Any commit touching `src/`, `bin/`, `test/` or `.github/` is transiently red on a
>    full clone**, because it falsifies this citation the instant it lands and the CI run
>    that would refresh the citation cannot exist until after the push. Commit `5f833ab`
>    is exactly that: red locally, green in CI, and repaired by this commit. That window is
>    intrinsic to a self-falsifying citation, not a defect in the test — it is the cost of
>    the claim being checkable at all.

## Cycle 6

> **Updated 2026-08-20 (cycle 6).** The citation moved again, from run `32328776838` at
> commit `5f833ab` to run `32331910336` at commit `c08562b`, by the same stated condition
> as last time. What is worth recording is not the move but why it happened: a review pass
> went looking at the guard that watches this section and found the guard could be steered
> by the prose it reads.
>
> It located its citation by taking the FIRST `git diff` command in this section. This
> section is prose that grows — it already discusses two earlier citations — so the next
> person to mention an old command in passing, anywhere above the live paragraph, would
> have silently redirected the check at it. Measured, not theorised: with a decoy sentence
> added above, a genuinely stale citation reported green, and a correct citation reported
> `SKIP` on a full clone while blaming a shallow checkout that did not exist. The same
> decoy placed *below* the citation changed nothing, which is what pinned the cause to
> position rather than to the decoy's presence.
>
> Two changes followed. The guard now requires this section to name its retirement
> condition exactly **once** and fails loudly on ambiguity instead of resolving it by
> position — so if you are editing this section and the suite starts complaining about two
> commands, that is the guard doing its job, not a bug. And an unreachable base commit now
> skips only when the checkout is genuinely shallow (`git rev-parse
> --is-shallow-repository`); on a full clone, a cited commit that does not resolve is a
> bogus citation and fails. The CI skip in the table above is unchanged and still expected.
>
> The archived job logs for this run and the previous one now live in `.swarm/runs/`, so
> the table stays checkable after GitHub's log retention drops the originals.

## Cycle 9

> **Updated 2026-08-20 (cycle 9).** The citation moved from run `32331910336` at commit
> `c08562b` to run `32335038575` at commit `c9dd7ff`, by the same stated condition as the
> two moves above. `c9dd7ff` bumped `actions/checkout` and `actions/setup-node` from `@v4`
> to `@v7`, which touches `.github/` and so falsifies this citation on sight.
>
> What is worth recording this time is not the move but that **the repair was late**. Both
> earlier moves refreshed the citation in the same commit that falsified it. This one did
> not: `c9dd7ff` landed the bump and stopped, so the suite was red on a full clone for a
> whole cycle before anything looked. Limits 1 and 2 above each explain half of why nothing
> caught it, and the half that matters is what they add up to. The guard reads *committed*
> history, so a pre-commit suite run cannot see a falsification still sitting in the working
> tree — it reports green. CI would see it, but CI checks out shallow and skips. So no
> signal available to the commit that breaks this citation can observe the break; only the
> next full-clone run can. The transient-red window is intrinsic and was accepted knowingly
> in cycle 5, but "transient" is doing real work in that sentence: it is only transient if
> the same commit repairs it, and nothing enforces that.
>
> One honest note on scope, since it is visible in this move. The bump changed which
> *action versions* run, not which Node majors are tested — the matrix is still
> `[18, 20, 22, 24]`, byte-identical. So this citation was retired by a change that does not
> affect the claim it guards. That is the deliberate cost of a coarse pathspec: `.github`
> catches everything in the workflow rather than trying to decide which edits are
> claim-relevant, and a guard that guessed at relevance would be the easier thing to fool.

## Cycle 10

> **Updated 2026-08-20 (cycle 10).** Moved from run `32335038575` at commit `c9dd7ff` to
> run `32337875271` at commit `2b003ea`. Retired by its own stated condition, as designed —
> `2b003ea` changed `test/`, which is inside the cited pathspec. What is new is WHEN that
> became visible. Until this cycle the guard compared the cited base against `HEAD` only,
> and `HEAD` excludes uncommitted work, so the commit that falsified the citation always
> tested green and the breakage surfaced a cycle later on the next full clone — which is
> exactly what happened to `c9dd7ff` (cycle 8 bumped the workflow and left the citation
> behind; cycle 9 found main already red). `2b003ea` adds a second comparison against the
> WORKING TREE, so a falsification is now visible to the run that causes it. The cost is
> unchanged and still real: this commit was red on a full clone between the push and this
> re-citation, because the CI run that refreshes the citation cannot exist until after the
> push. That window is intrinsic to a self-falsifying claim, it is recorded rather than
> papered over, and the standing conflict it creates with "green at every commit" is
> human-owned (backlog P-7).

## Q-7 (improvement run #6)

**2026-08-20, filed as Q-7 of improvement run #6.** Moved from run `32337875271` at commit
`2b003ea` to run `32400996331` at commit `4b63e91`. This entry is written directly here
rather than moved out of the README: the per-cycle "Updated ... (cycle N)" blockquote that
used to live inside the README's `### Node support` section — the convention the five
entries above were extracted from — was itself retired earlier in this run (its own Q-1),
so there was no such blockquote in the README for this move to relocate. The voice above is
matched; the quoting convention is not, because nothing was moved.

Retired by commit `4b63e91` ("cycle 2: Q-4 — the tag counts leave the prose"), which rewrote
`test/readme-tags.test.js` (708 insertions, 186 deletions) — inside the cited pathspec. That
commit was pushed knowingly RED on the citation guard: the run's own cycle-2 decision log
records committing with both citation checks failing rather than narrowing the pathspec or
relaxing the assertion, exactly the walked exception standing limit 2 above describes. The
gap was not same-commit: `4b63e91` landed in cycle 2, a cycle-2 addendum measured and
recorded the resulting `fail 2` state rather than predicting it, and the re-citation itself
landed a cycle later — closer to cycle 9's "the repair was late" shape above than to cycle
10's same-cycle addendum.

As in cycle 10, the commit that retired the old citation is the one now cited: `4b63e91` is
both. Run `32400996331` (`conclusion: success`, `headSha: 4b63e91...`) reported, across all
four Node majors (v18.20.8, v20.20.2, v22.23.2, v24.19.0): 124 tests, 122 pass, 0 fail, 2
skipped — the test count rose from 121 to 124 because of the rewrite in `4b63e91` itself; the
skip count, the two skipped tests' identities, and the reason (`test/node-support-citation.test.js`
skipping on a shallow clone that cannot reach the cited base) are unchanged from the citation
this replaces.

## Q-8 (improvement run #6)

**2026-08-20, filed as Q-8 of improvement run #6.** Moved from run `32400996331` at commit
`4b63e91` to run `32405521233` at commit `7e50d6f`. Retired the same way `4b63e91` retired
its own predecessor: a later commit changed `test/` — here, `22fdeac` ("Q-3: guard the
Node-support matrix table's own numbers"), which added `test/readme-matrix-consistency.test.js`
— inside the cited pathspec, and the guard on this section went red on a full clone exactly as
standing limit 2 above predicts. `22fdeac` was merged into the mainline as `a302f71`.

This time the section's own selection rule, applied literally, selected nothing. That rule —
**HISTORY: superseded on 2026-08-20 by commit `180e9da`, and reproduced here only as the
wording that failed; it is not the rule the README states today** — read "the most recent full
matrix run against a commit that actually changed `src/`, `bin/`, `test/`, or the workflow
itself." `22fdeac` is that commit, but neither it nor its merge `a302f71` ever got a CI run of
its own: GitHub Actions runs once per push, not once per commit, and both landed in the same
push as `7e50d6f`, whose SHA is what the run actually executed against. Applying the old rule literally would have kept citing `4b63e91` forever —
no later commit that "actually changed" those paths would ever acquire its own run to replace
it with, because the one that did change them was never the head of a push. The rule was
satisfiable in principle and unsatisfiable in fact, given how this repo pushes; that is a
defect in the rule, not a missing run to go find.

The rule is rewritten rather than patched around. Rather than paraphrase the replacement, this
entry now QUOTES it, verbatim, from the `### Node support` section of
[`../README.md`](../README.md) — README is the rule's home, this file only records it. The
block below was byte-identical to that sentence, README's own line wrapping included, for as
long as `7e50d6f` was the citation README carried. `tools/citation-rule-check.mjs` matches only
the FIRST ` ```readme-quote ` fence in this file, so a live-checked quote and a superseded one
cannot coexist under the same fence name — this block has since been retagged
` ```readme-quote-superseded-q8 ` (content unchanged) so the checker skips it and matches the
current quote in the W-7 entry below instead.

```readme-quote-superseded-q8
The
reference matrix is [Actions run 32405521233](https://github.com/trmnmc/aphorism-cli/actions/runs/32405521233)
at commit `7e50d6f` (2026-08-20), the matrix run for the push that carried the last change to
`src/`, `bin/`, `test/`, or the workflow itself.
```

**Deriving the citation from that quoted rule, on this tree** (HEAD `71792ca` at the time of
writing):

1. *"the last change to `src/`, `bin/`, `test/`, or the workflow itself"* —
   `git log -1 --format=%h -- src bin test .github` gives `22fdeac` ("Q-3: guard the
   Node-support matrix table's own numbers"), which reached the mainline as `a302f71`. And
   `git log --oneline 7e50d6f..HEAD -- src bin test .github` prints nothing: of the 11 commits
   made since, none has touched those four paths, so `22fdeac` is still the *last* change.
2. *"the push that carried"* that change — `22fdeac` and `a302f71` both landed in the push
   headed by `7e50d6f`. Actions runs once per push, not once per commit, so neither of them
   has a run of its own; the run for that push executed against `7e50d6f`.
3. *"the matrix run for"* that push — run `32405521233` (`conclusion: success`,
   `headSha: 7e50d6f...`), the four rows of which are the matrix table in the README.

The quoted rule therefore selects run `32405521233` at commit `7e50d6f` — the citation the
README actually carries. Steps 1 and 2 are re-derivable from any full clone with the commands
shown; step 3's run id, conclusion and head SHA are as recorded against the GitHub Actions API
by commit `180e9da` and were NOT re-queried when this entry was rewritten.

**HISTORY: a third wording, which was never the README's.** Between `180e9da` and this
rewrite, the paragraph above did not quote the README at all; it paraphrased the new rule as
"the most recent run whose cited commit's `src/`, `bin/`, `test/`, and `.github` content is
byte-identical to this tree's, without requiring that the cited commit be the one that produced
the change." That paraphrase is superseded and is retained only as a record of the defect it
caused: it selects a *different* run from the sentence it claimed to restate. Every one of the
11 commits after `7e50d6f` is byte-identical to `7e50d6f` in those four paths, so all of them
satisfy the paraphrase, and "most recent" then lands on the newest of them that has a run —
not on `7e50d6f`. `180e9da`'s own commit message filed this as KI-R6-5 / Q-10 and named
`3a5d6e3` @ run `32405575919` as what the paraphrase selects; that run id came from the
Actions API and is NOT re-verified here. What IS re-derivable from this clone, and is what the
defect turns on, is that the paraphrase's candidate set contains 12 commits where the quoted
rule's contains exactly one.

Run `32405521233` (`conclusion: success`, `headSha: 7e50d6f...`) reported, across all four
Node majors (v18.20.8, v20.20.2, v22.23.2, v24.19.0): 129 tests, 127 pass, 0 fail, 2 skipped —
the test count rose from 124 to 129 because `22fdeac` added
`test/readme-matrix-consistency.test.js` (5 new tests); the skip count, the two skipped tests'
identities, and the reason (`test/node-support-citation.test.js` skipping on a shallow clone
that cannot reach the cited base) are unchanged from the citation this replaces. Locally, on a
full clone, before this re-citation landed the suite reported 129 tests, 127 pass, 2 fail, 0
skipped: the same two tests that skip in CI ran instead and failed, because the stale
citation's own diff was non-empty on this tree. Those 2 fails were Q-8's to close, and this
move closes them.

## W-7 (improvement run #8)

**2026-08-24, filed as W-7 of improvement run #8.** Moved from run `32405521233` at commit
`7e50d6f` to run `32742357417` at commit `02f4668`. Retired the same way `7e50d6f` retired its
own predecessor: a later commit changed `test/` — here, `02f4668` ("cycle 4: KI-R6-3 closed by
consolidation, and one entry point that re-runs every finding"), which deleted one of the two
redundant guards in `test/readme-tags.test.js` that both read README's
`| Tags on exactly one entry | 0 |` row — inside the cited pathspec, and the guard on this
section went red on a full clone exactly as standing limit 2 predicts. `02f4668`'s own commit
message states the window in advance: it names itself as the commit that opens the predicted
citation window and leaves closing it to "the very next commit," which is this move.

Quoting the same rule Q-8 quoted (the block below is unchanged in wording from Q-8's; only
what it now selects has moved):

```readme-quote
The
reference matrix is [Actions run 32742357417](https://github.com/trmnmc/aphorism-cli/actions/runs/32742357417)
at commit `02f4668` (2026-08-24), the matrix run for the push that carried the last change to
`src/`, `bin/`, `test/`, or the workflow itself.
```

**Deriving the citation from that quoted rule, on this tree** (HEAD `02f4668` at the time of
writing):

1. *"the last change to `src/`, `bin/`, `test/`, or the workflow itself"* —
   `git log -1 --format=%h -- src bin test .github` gives `02f4668` ("cycle 4: KI-R6-3 closed
   by consolidation, and one entry point that re-runs every finding"), and HEAD is `02f4668`
   itself, so trivially there is no later commit to check: `02f4668` is the last change to
   those paths.
2. *"the push that carried"* that change — unlike `22fdeac`/`a302f71` last time, `02f4668` was
   itself the head of its own push, so it did not need a separate SHA to stand in for it: the
   run for that push executed directly against `02f4668`.
3. *"the matrix run for"* that push — run `32742357417` (`conclusion: success`,
   `headSha: 02f4668b70658d9d06ee562034e47bcd9ade55c5`), the four rows of which are the matrix
   table in the README.

The quoted rule therefore selects run `32742357417` at commit `02f4668` — the citation the
README carries now. Steps 1 and 2 are re-derivable from any full clone with the commands
shown; step 3's run id, conclusion and head SHA are as measured for this move and were not
re-queried when this entry was written.

**A structural difference from the Q-8 move is worth stating plainly, since it is the opposite
shape.** Last time, the commit that changed the cited paths (`22fdeac`, merged as `a302f71`)
was NOT the head of its push, so the citation had to name a different SHA (`7e50d6f`) than the
commit that made the change. This time they are the SAME commit: `02f4668` both made the
change and was the head of the push, so it has a run of its own, and the citation names it
directly. The README's prose describing which run was selected was rewritten to say this
truthfully rather than carry the old, awkward two-SHA explanation forward.

Run `32742357417` (`conclusion: success`, `headSha: 02f4668b70658d9d06ee562034e47bcd9ade55c5`)
reported, across all four Node majors (v18.20.8, v20.20.2, v22.23.2, v24.19.0): 128 tests, 126
pass, 0 fail, 2 skipped — the test count fell from 129 to 128 because `02f4668` (item W-7)
removed one of the two redundant guards in `test/readme-tags.test.js` that both read README's
`| Tags on exactly one entry | 0 |` row. Nine candidate falsifications of that row were run
through a full suite on a scratch clone, and the removed guard's firing set turned out to be a
strict subset of the surviving guard's: no falsification of the row fired the removed guard
without also firing the survivor, so its coverage was redundant, not load-bearing. Detection
was re-measured after the removal and is preserved — the full cell-by-cell measurement lives
in `test/readme-tags.test.js` itself, in the block marked "W-7 (2026-08-24) --
CONSOLIDATED." The skip count, the two skipped tests' identities, and the reason
(`test/node-support-citation.test.js` skipping on a shallow clone that cannot reach the cited
base) are unchanged from the citation this replaces. Locally, on a full clone, before this
re-citation landed the suite reported 128 tests, 126 pass, 2 fail, 0 skipped: the same two
tests that skip in CI ran instead and failed, because the stale citation's own diff was
non-empty on this tree (this was the predicted, documented window `02f4668`'s own commit
message opened). Those 2 fails were W-7's to close, and this move closes them.
