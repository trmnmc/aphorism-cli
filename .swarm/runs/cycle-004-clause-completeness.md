# N-4 — Clause-completeness audit of the inherited 29-clause coverage map (run #3, cycle 4)

**Charter:** classify every measured survivor as HOLE or BOUNDARY. Cycle 3 re-measured the
inherited map at 29 KILLED / 0 SURVIVED, so the literal answer is the empty set — and cycle 3's
own journal flagged that the *completeness* of the 29-clause enumeration was inherited from run
#1 cycle 52 and never re-derived. This artifact does the honest version: re-derive the clause
set independently from the SPEC/README text, mutation-measure everything the inherited 29 does
not cover, and classify any survivor.

**Pre-dispatch SHA:** `e6c53b1e114a377bed3c6c90b40955bd1d65d493` (all arms built from this
commit; the live tree was never copied and never modified).

**Machine-readable companion:** `cycle-004-clause-completeness.json` (same directory; the tally
there is computed from the rows, not hand-written).

## Headline

**43 clauses derived. 29 map onto the inherited enumeration (carried, KILLED at cycle 3).
14 are NEW — behaviours the inherited 29 never tested. Of those 14: 12 KILLED, 1 SURVIVED
(classified BOUNDARY), 1 NOT-PLANTED (a spec-internal contradiction), 0 INERT.**

The inherited enumeration is therefore *incomplete as an enumeration* — it omits at least 14
spec- or README-decided behaviours — but the suite itself turns out to protect 12 of the 14
anyway. The two that are not protected are both cases where the SPEC text does not decide the
behaviour, i.e. they belong on J-7's human-ruling list, not in the test suite.

## Controls (both mandatory, both GREEN)

| Control | Suite (TAP) | Meaning |
|---|---|---|
| `p0` — pristine archive, unmutated | tests 102 / pass 102 / fail 0 | instrument sound; verdicts meaningful |
| `inert` — comment-only edit to `src/select.js` | tests 102 / pass 102 / fail 0 | harness does not go red on arbitrary edits |

Suite command forced to TAP throughout: `node --test --test-reporter=tap test/args.test.js
test/cli.test.js test/readme-tags.test.js test/select.test.js`. Every parse extracted the
`# tests` / `# pass` / `# fail` trailer lines; any run missing them would have been recorded
UNPARSED (none was).

## Method — how the clause list was derived independently

1. Read `.swarm/SPEC.md` (§Domain rules, §Product must-haves, §Taste notes, §Exit codes) and
   `README.md` **before** opening the inherited map, and split every normative sentence into
   the smallest separately-falsifiable behaviours. This yielded 33 clauses from §Domain rules
   alone (the inherited map compresses these into 29 rows) plus 10 more from Product
   must-haves / Taste notes / README-documented behaviour.
2. Only then read `cycle-003-coverage-map.md` and diffed: each derived clause was marked
   `in_inherited_29: true` only where an inherited row mutates *that exact behaviour* (not
   merely a neighbouring line of the same function).
3. Carried rows keep their cycle-3 verdict and cycle-3 suite figures; they were **not**
   re-measured (cycle 3 did that against SHA `b627ed2`, an ancestor of this cycle's pin, and
   `src/`, `bin/`, `test/` are unchanged between the two — verified by
   `git diff --stat b627ed2..e6c53b1`, which touches only `.swarm/` artifacts: 11 files, all
   under `.swarm/`).
4. Each NEW clause got exactly one minimal single-site mutation, applied to a fresh copy of
   the pristine checkout, with a **pristine-vs-mutant CLI behaviour probe** run before the
   suite: a mutant whose probe output was byte-identical to pristine would have been INERT
   regardless of suite colour. All 13 planted mutants produced observably different CLI
   behaviour (recorded in the harness raw output).

## Per-clause table — the 14 NEW clauses

(The 29 carried rows are in the JSON with their inherited IDs S1–S5, F1–F5, E1–E3, L1–L7,
J1/J2/J3/J3b/J4, X0/X2a–c, all KILLED, source "carried from cycle 3".)

| ID | Behaviour (spec basis) | Mutation (single site) | Verdict | Suite | Killed by |
|---|---|---|---|---|---|
| D-03 | negative seeds accepted & deterministic (§Domain rules: "including negative numbers") | `args.js` looksLikeFlag → `token.startsWith('-')` so `--seed -5` is misread as a flag | KILLED | 97p/5f | "--seed <n> accepts a negative number" +4 |
| D-04 | non-integer seeds accepted (§Domain rules: "non-integers") | parseSeedValue also rejects finite non-integers | KILLED | 101p/1f | "--json composes with --seed ..." (single killer) |
| D-10 | `--author` matches the **author field** (spec names the field) | filter reads `entry.text` instead of `entry.author` | KILLED | 98p/4f | "author filter is case-insensitive and narrows the list" +3 |
| D-13 | `--tag` is membership **anywhere in the tags array** | `.some` over `tags.slice(0, 1)` — only first tag consulted | KILLED | 99p/3f | "--list prints exactly one line per matching entry" +2 |
| D-34 | default output includes the attribution (§Must-haves: "one aphorism plus attribution") | format() drops the attribution line | KILLED | 100p/2f | "bare invocation prints one attributed aphorism" +1 |
| D-35 | default attribution uses EM DASH + 4-space indent (README example) | em dash → ASCII hyphen in format() | KILLED | 100p/2f | "plain single-pick output is TWO lines ..." +1 |
| D-36 | `--help` prints usage to **stdout**, exit 0 | help branch writes to stderr | KILLED | 101p/1f | "--help prints usage to stdout and exits 0" (single killer) |
| D-37 | `-h` is an alias for `--help` (README flag table) | BOOL_FLAGS key `-h` → `-x` | KILLED | 100p/2f | "-h sets help: true" +1 |
| D-38 | usage-error diagnostic goes to stderr, stdout clean (§Taste: "Errors go to stderr, never stdout") | error branch writes to stdout | KILLED | 94p/8f | 8 tests |
| D-39 | corpus holds >= 40 entries (§Must-haves) | export truncated to `corpus.slice(0, 39)` | KILLED | 96p/6f | "corpus has at least 40 entries" +5 |
| D-40 | pipe-safe: no ANSI escapes by default (§Taste) | format() wraps attribution in `\x1b[2m…\x1b[22m` | KILLED | 100p/2f | "output is pipe-safe — no ANSI escapes when not a TTY" +1 |
| D-41 | bare positional argument rejected, exit 2 (**spec does NOT enumerate this** in §Exit codes; impl does it) | `unexpected argument` branch → `continue` | KILLED | 101p/1f | "a bare positional argument (not a flag) is a usage error" (single killer) |
| D-42 | repeated `--author`/`--tag`: **last occurrence wins** (spec silent) | space-form assignment becomes first-wins | **SURVIVED** | 102p/0f | — |
| D-43 | `--seed ""` / whitespace-only seed (spec self-contradictory) | none plantable | **NOT-PLANTED** | — | — |

## The survivor: D-42 → BOUNDARY

`--tag humor --tag design --list` on the pristine tree prints the 14-entry `design` list
(last occurrence wins); the first-wins mutant prints the 9-entry `humor` list. The suite stays
102/0 on both — a real, observable behavioural change it cannot see.

**Classification: BOUNDARY, not HOLE.** The SPEC's Filtering clause spells both flags in the
singular ("`--author` matches by substring containment … `--tag` matches a whole tag") and
never mentions repetition; README's flag table is likewise singular. Nothing in the spec
decides whether a repeated value flag should mean last-wins, first-wins, the intersection of
both values, or a usage error — last-wins is an artifact of assignment order in `parseArgs`.
Writing a test would freeze an undecided behaviour by fiat. The right response is
documentation: this is a **third entry for J-7's human-ruling list**, alongside the two already
recorded there (`--help` vs usage-error precedence; `--seed -0` vs `--seed 0`).

## The unplantable row: D-43 (spec-internal contradiction, flagged for J-7)

`Number("")` and `Number("   ")` are both `0` — non-NaN — so §Domain rules' "accepts any value
that `Number()` parses to a non-NaN number" *literally* admits an empty or whitespace-only seed
value. The implementation rejects both with exit 2 (verified live against the pristine tree:
`aphorism: flag --seed requires a numeric value`), and existing tests (`--list --seed=`,
whitespace-only) assert that rejection — which the §Exit codes clause ("2 bad usage (…missing
flag argument…)") arguably supports. The two spec clauses point in opposite directions, so
there is no agreed meaning to plant a defect against: any mutation here measures which side of
an ambiguity the suite enforces, not whether a decided behaviour is protected. Recorded as
NOT-PLANTED and handed to J-7 rather than laundered into a verdict.

## Incidental finding on D-41

The suite contains a test ("a bare positional argument (not a flag) is a usage error") for a
behaviour the SPEC's §Exit codes list does not enumerate — the suite is *stricter than the
spec* here. Nothing to fix, but if a human ever rules that positionals should be, e.g., an
implicit author filter, that test is the one asserting the current stricter behaviour.

## What this does NOT establish

- **N=1 mutation per clause is a lower bound, not an upper bound.** Each KILLED row proves the
  suite catches *that one defect*, not every defect violating the clause. A different mutation
  of the same clause, or two simultaneous defects, could still slip through. D-04 and D-36 and
  D-41 each hang on a **single** killing test — thin protection, one deletion away from a gap.
- **My derivation is one more fallible enumeration.** It found 14 behaviours the inherited 29
  missed; a third pass by someone else could find behaviours both lists miss. "43 clauses" is
  a floor established by two independent readings, not a proven ceiling.
- **Carried rows were not re-run.** Their KILLED verdicts are cycle 3's measurements against
  `b627ed2`; the source and test trees are byte-identical at this cycle's pin (checked by
  `git diff --stat`), but the runs themselves are ~1 day old.
- **Uniformity clauses (S3/S4) remain statistical**, and nothing here touches performance,
  concurrency, signal handling, or encoding of stdout beyond what the probes invoked.
- **BOUNDARY ≠ safe.** D-42's last-wins behaviour is real and users can observe it; it is
  merely *undecided*. Until a human rules (J-7), any refactor of `parseArgs` may silently flip
  it and no test will object.

## Scratch hygiene

All arms were built and mutated under `/opt/swarm/.n4-scratch/` (the sandbox blocks `/tmp`;
the task's `git archive | tar -x` recipe was replaced by `git clone --no-checkout` + detached
checkout of the same SHA — content-identical for `src/`, `bin/`, `test/`, `README.md`).
No tracked file in `/opt/targets/aphorism-cli` was modified; this file and its JSON twin are
the only writes to the repo. The scratch dir is deleted after this report.
