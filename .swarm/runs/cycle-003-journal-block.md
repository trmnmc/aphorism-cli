
---

## Cycle 3 — 2026-08-20T18:10Z–18:30Z — Q-7, the second half of the two-commit round trip

**Gear 2** (guest mode, dial 0.3, ρ=0.55, k_cap 2, demote on, promote blocked by the weekly
governor at 100% used / 50.7% elapsed, heat 1.97). Probe OK, `source: probe`. Wave of 1 —
`k_current` was 1, and Q-3 was the only other live candidate but shares `README.md` with Q-7,
so the disjoint-`files_hint` rule forbids pairing them anyway. One builder, **sonnet**: Q-7 is
`kind: "fix"`, and the gear-2 demotion never drops build/fix below sonnet.

**Gate sealed BEFORE dispatch**, sha256 `5ed845eb4b5415188e0d4061afa3e297df6f3031d8336c5bdcea913b59661cae`,
re-hashed after the builder returned: **identical**. 17 cells.

### The finding: green was available two ways, and the cheap one was wrong

`test/node-support-citation.test.js` was RED by design after cycle 2 — that commit touched
`test/`, which is inside the pathspec the README cites as its own falsification condition. The
repair is a re-citation to a CI run that describes the current tree.

The newest green run on the branch is `32401050374` at `2014bb9`. Citing it would have turned
the suite green: `2014bb9` touched only `.swarm/`, so the cited diff would be empty and both
guards would pass. **It would also have been wrong.** The section states its own selection
rule — *"the most recent full matrix run against a commit that actually changed `src/`,
`bin/`, `test/`, or the workflow itself"* — and `2014bb9` changed none of them. That path is
green bought by satisfying the machine check while contradicting the prose the check exists to
serve, which is the failure mode this run keeps finding in its own guards. The correct citation
is run `32400996331` at `4b63e91`. The builder derived this independently and rejected
`2014bb9` for the same reason, having been given the rule and not the answer.

### Withholding the numbers so the check was a check

The conductor read the four Node majors' real results out of the CI log **before** dispatch and
deliberately kept them out of the builder's prompt, telling it only to derive them from
`gh run view --log` itself. Gate cell B5 is therefore independent agreement, not an echo of a
number the conductor handed over. The two derivations match byte-for-byte, patch versions
included: `v18.20.8` / `v20.20.2` / `v22.23.2` / `v24.19.0`, each **124 tests, 122 pass, 0 fail,
2 skipped**.

### VERIFICATION EVIDENCE (17 cells; full file `.swarm/runs/cycle-003-verify-Q-7.txt`)

```
B1  $ node --test test/*.test.js
    ℹ tests 124   ℹ pass 124   ℹ fail 0   ℹ skipped 0
B2  $ node --test test/node-support-citation.test.js
    ✔ cited git diff must be empty ...            ✔ base-to-working-tree diff ...
    ℹ tests 2  ℹ pass 2  ℹ fail 0  ℹ skipped 0     <- 0 skipped: a SKIP would be a false green
A4  $ git diff 4b63e91..HEAD --stat -- src bin test .github   -> (empty)
    $ git diff 4b63e91       --stat -- src bin test .github   -> (empty)
A5  test/node-support-citation.test.js  worktree b3d9d6f5... == blob@4b63e91 b3d9d6f5...
```

A4 and A5 together are the anti-cheat pair: the RED closed by re-citing, with the guard itself
byte-identical to the commit that broke it. The pathspec was not narrowed and no assertion was
relaxed, stated as bytes rather than as a promise.

### Controls — all four in a throwaway worktree, removed after

Because `src/ bin/ test/ .github/` are identical across every arm, each verdict is attributable
to the README swap alone.

| arm | change | result |
|---|---|---|
| C2 | worktree at HEAD, pre-repair README (cites `2b003ea`) | **FIRES** 0 pass / 2 fail — the cycle-2 RED reproduces |
| — | same worktree, ONLY README replaced by the repaired one | **GREEN** 2 pass / 0 fail |
| C1 | cited base rewritten to `23eaf9b` — real, *reachable*, wrong | **FIRES** 0 pass / 2 fail |
| C3 | benign reword of unrelated prose in the same section | **GREEN** 124/124 — no false rejection |

C1 matters more than C2: a wrong-but-reachable base proves the guard is testing whether the
citation is *correct*, not merely whether it *resolves*.

### C4 — the hole that is still open, measured rather than described

Q-3's remaining half was, until now, a sentence. Two control arms turned it into a number:

```
C4a  v20 row "122 pass" -> "121 pass"  (contradicts its own row)
     ℹ tests 124  ℹ pass 124  ℹ fail 0   -> SILENT
C4b  v20 row -> "999 tests, 998 pass"   (contradicts the other three rows AND the suite)
     ℹ tests 124  ℹ pass 124  ℹ fail 0   -> SILENT
```

The section can today claim a Node major ran 999 tests while the suite runs 124, and nothing
anywhere fires. The citation is guarded; the numbers inside it are not. This is not a Q-7
failure — Q-7 never claimed that ground — and it is recorded as an unfixed column rather than
left implied.

It also constrains Q-3's shape, which is the part worth carrying forward: the four rows report
a **remote** run's counts, not this checkout's, and CI legitimately reports `2 skipped` where a
full clone reports `0`. So the guard cannot assert the table against a local `node --test`. The
honest anchor is internal consistency plus provenance — the four rows agreeing with each other
and with the cited run — not equality with the local suite.

### Judgment calls on the builder's two disclosed departures

Both were disclosed unprompted, and both are **kept**:

1. It labelled the new history entry `Q-7 (improvement run #6)` rather than `cycle 3`, saying
   it could not verify a cycle number. The conductor can: it is cycle 3. The departure still
   stands — but for a **better reason than the builder gave**. The file already carries a
   `## Cycle 3` section from an earlier run, so a bare `cycle 3` label would collide and make
   the chronological table ambiguous. Right call, weaker stated reason.
2. It changed *"is preserved verbatim in"* to *"is recorded in"*, beyond the literal ask. Five
   of the six entries are byte-identical relocations of README blockquotes; the sixth was
   authored directly, because Q-1 retired the convention it would have been moved from.
   "Verbatim" was true at five entries and false at six. Accepted.

It also disclosed that its **first** edit to the history file reworded an existing sentence,
violating the append-only rule, and that it caught and reverted this before reporting. The
conductor did not take that on trust: `git diff --numstat` reports `35 0` — thirty-five
insertions, zero deletions. The archive of what was believed when is intact.

### One conductor error, recorded

Gate cell A3 asserted `package.json` declares no dependencies and is byte-identical to HEAD.
There **is** no `package.json` in this repo. The cell was inapplicable as authored; the fact it
was meant to protect holds in a stronger form (with no manifest, no dependency can be added).
Recorded as an authoring error, not laundered into a pass.

**Not done, stated plainly**

- Q-2 remains `in_progress`: `citations.test.js` still has not had the kill/converse treatment.
- Q-3 untouched as work this cycle, but now holds a measured specification instead of a description.
- KI-R6-3 (two guards reading the same table row) unchanged.

**Wave autotune:** clean wave — 0 reverts, 0 failed verifies. `wave_streak` 1 → 2 → `k_current`
1 → **2**, streak reset to 0.

**Next:** cycle 4 — Q-3, aimed by C4a/C4b.
