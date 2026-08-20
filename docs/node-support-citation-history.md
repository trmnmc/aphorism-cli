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

The cycle 3 entry records only the citation it retired; the run id it moved to is not stated
in the entry itself, and is not inferred here. The last row is the citation the README still
carries today.

The row above labelled "Q-7 (improvement run #6)" is a later move, appended after this file
was first written; unlike the five rows above it, it is not one of the five cycles this
file's intro paragraph describes, and its label follows that later run's own task-id
convention rather than this run's cycle numbering. It is now the citation the README carries;
see "Q-7 (improvement run #6)" below for the entry.

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
