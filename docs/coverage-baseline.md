# Coverage baseline — an observation, not a contract

This document records what `node --test --experimental-test-coverage` reports for this repo,
where the one unreachable branch is, and why nothing in this repo enforces any of these
numbers. **There is no coverage threshold, ratchet or gate anywhere in this repo — not in
`.github/workflows/test.yml`, not in a script, not in `package.json` (there is no
`package.json`).** The CI coverage step exists to put the report in the log for a human to
read; it cannot fail a build no matter what number it prints. If a future change adds a
threshold flag (`--test-coverage-lines`, `--test-coverage-branches`, `--test-coverage-functions`)
or a script that inspects the report and exits non-zero, that is a new decision — this
document does not authorize it, and the "run to run" instability measured below (see
*Stability*) is a specific, measured reason not to make that decision lightly.

## The numbers

Measured 2026-08-20 at commit `b006098`, on Node v24.19.0, via:

```sh
node --test --experimental-test-coverage test/*.test.js
```

```
tests 119
pass 119
fail 0

file             | line % | branch % | funcs % | uncovered lines
-----------------------------------------------------------------
bin
 aphorism.js     | 100.00 |    85.71 |  100.00 |
src
 args.js         | 100.00 |   100.00 |  100.00 |
 corpus.js       | 100.00 |   100.00 |  100.00 |
 select.js       | 100.00 |   100.00 |  100.00 |
-----------------------------------------------------------------
all files        | 100.00 |    98.44 |  100.00 |
```

Line coverage: **100.00%**. Function coverage: **100.00%**. Branch coverage: **98.44%**
— which is **63 of 64** branch records executed. Per-file branch fraction (BRF = branches
found, BRH = branches hit, from the underlying lcov data): `bin/aphorism.js` 7 found / 6 hit,
`src/args.js` 36/36, `src/corpus.js` 1/1, `src/select.js` 20/20 → **64 found, 63 hit**.

> **Correction, conductor-measured 2026-08-20 (cycle 2).** An earlier draft of this file, and
> the cycle-1 journal entry it was written from, both stated this as "64 of 65 branches
> executed". That is wrong, and it is wrong in a way its own numbers disprove: the per-file
> lcov fractions above sum to 64 found and 63 hit, and 63/64 = 98.4375 → the 98.44% the
> table prints, whereas 64/65 = 98.46%. The fraction is **63/64**. Corrected here rather than
> silently restated, because an unmeasured arithmetic claim propagating from a journal into a
> reference doc is exactly the failure this document exists to make harder.

## The one unexecuted branch — BOUNDARY, not a HOLE

`bin/aphorism.js:72`:

```js
process.stdout.write(HELP.endsWith('\n') ? HELP : `${HELP}\n`);
```

The FALSE arm (the `${HELP}\n` side) never executes. `HELP` is a module-level constant
exported from `src/args.js` (defined as a template literal, `src/args.js:7-20`) whose literal
text ends in a newline — the source line immediately before the closing backtick is blank.
`HELP.endsWith('\n')` is therefore `true` for every possible program input; there is no CLI
argument, environment, or code path that can make it `false` without editing `src/args.js`
itself to change the constant. This is classified **BOUNDARY**: behaviour the spec does not
decide and code that is provably dead as written, not a gap in what the suite tests. Per this
project's established policy (see `docs/report-history.md`'s BOUNDARY classifications), no
test targets this arm and none should be added — a test that forced it would have to mutate
`HELP` itself, at which point it is testing the mutation, not the product.

## Stability — measured, and the reason nothing here gates

Before wiring the CI step, the command above was run **15 times in immediate succession** on
the same commit, same machine, same Node v24.19.0, with no code changes between runs. It did
not report the same branch percentage every time:

| Outcome | Runs | `select.js` branch % | `all files` branch % |
|---|---|---|---|
| A | 13 / 15 | 100.00 | 98.44 |
| B | 2 / 15 | 95.24 | 96.92 |

The swing is real. Independently re-measured by the conductor at cycle 2 — same tree, same
Node v24.19.0, 20 fresh runs — it reproduces with the same two outcomes and the same two
percentages: **18/20 runs** reported `select.js` 100.00 / all files 98.44, **2/20 runs**
reported `select.js` 95.24 / all files 96.92. All 20 runs passed 119/119 tests.

### What actually varies — and it is not what it looks like

> **Correction, conductor-measured 2026-08-20 (cycle 2).** An earlier draft of this section
> attributed the swing to `src/select.js:83` being *"exercised probabilistically"* by
> unseeded draws in `test/select.test.js`. The line citation is right; the mechanism is
> wrong, and it is wrong in two independently checkable ways. First, structurally: line 83's
> clamp sits **inside the seeded branch** (`src/select.js:80` tests `typeof seed === 'number'
> && !Number.isNaN(seed)`, line 81 builds the `mulberry32` rng, line 82 draws, line 83
> clamps). The unseeded `Math.random()` path is the `else` arm at `src/select.js:85` and has
> no clamp at all — an unseeded draw can never reach line 83, so unseeded draws cannot
> explain the swing. Second, by measurement, below.

Forty runs were taken with the lcov reporter and their `BRDA` (branch-data) records compared.
The number of branch records **hit was 63 in every single one of the 40 runs**. What moved
was the *denominator*:

| Outcome | branch records reported | records hit | never-taken records | branch % |
|---|---|---|---|---|
| A (majority) | 64 | 63 | `bin/aphorism.js:72` | 98.44 |
| B (~10%) | 65 | 63 | `bin/aphorism.js:72`, `src/select.js:83` | 96.92 |

Differencing the two record sets by `file:line` yields exactly one difference:

```
per-line record-count differences (64-record run -> 65-record run):
  select.js:83: 0 -> 1

NEVER-TAKEN records, 64-record run: ["aphorism.js:72"]
NEVER-TAKEN records, 65-record run: ["aphorism.js:72","select.js:83"]
```

So `src/select.js:83` is **never executed in either outcome**. What is nondeterministic is
whether V8 emits a branch record for it *at all*. On the majority of runs the line is not
enumerated as a branch and does not appear in the denominator; on a minority of runs it is
enumerated, is (correctly) reported as never taken, and drags the percentage down. This is an
artifact of how V8's block-coverage enumeration interacts with the optimizing compiler under
a suite that runs thousands of `pick()` calls — it is not the suite reaching a line sometimes
and missing it other times. (A related symptom, worth knowing before anyone tries to diff
coverage output mechanically: V8 also **renumbers the `BRDA` block indices between runs**, so
comparing lcov records by block index reports dozens of spurious differences. Compare by
`file:line`.)

The practical consequence is stronger than the original wording implied. It is not that one
branch is flaky — it is that **the denominator of the coverage ratio is itself
nondeterministic**, so "the" branch percentage for this repo is not a single number. Both
98.44% and 96.92% are honest readings of an unchanged tree.

**This is the concrete, measured reason nothing in this repo gates on coverage.** A rule of
"98.44% branch, don't regress" would have failed 4 of the 35 runs measured here (2 of 15 in
the first sample, 2 of 20 in the conductor's independent re-measurement) — roughly 1 build in
9 going red with zero code changes, on a suite that passed 119/119 every time. The report is
safe to observe and unsafe to enforce.

## Across the matrix: the "all files" line is NOT comparable between Node versions

Everything above was measured on Node v24.19.0. What 18, 20 and 22 do was, at the time the CI
step was written, **inferred and not measured** — so it was checked against a real run rather
than left as an expectation.

**Real run:** <https://github.com/trmnmc/aphorism-cli/actions/runs/32324495153> — commit
`0c2ed40`, all four jobs green, full log archived in this repo at
`.swarm/runs/cycle-002-ci-32324495153.log`. The flag ran on every version; the `|| echo
"NOTE: …"` fallback did not fire on any of them. Real log output, `all files` row:

```
test (18)  # all files | 99.11 | 92.57 | 98.61 |
test (20)  # all files |  99.11 |    92.57 |   98.61 |
test (22)  # all files |  99.11 |    92.57 |   98.61 |
test (24)  ℹ all files | 100.00 |    98.44 |  100.00 |
```

Same commit, same suite, a **six-point** spread in the headline branch number. The cause is
visible one row up in the same logs: **Node 18, 20 and 22 include the `test/*.test.js` files
themselves in the coverage report; Node 24 reports only `bin/` and `src/`.** The 18-job table
lists six extra rows (`test/args.test.js`, `test/cli.test.js`, `test/pipe.test.js`,
`test/readme-tags.test.js`, `test/select.test.js` …), and it is the test files' own
self-coverage — e.g. `test/pipe.test.js` at 83.33% branch, `test/readme-tags.test.js` at
86.81% — that drags the aggregate down. Node 24 also renders a directory-grouped table with
box rules, where 18/20/22 render a flat one.

**The per-source-file numbers, by contrast, agree exactly on all four versions:**

| file | line % | branch % | funcs % | 18 | 20 | 22 | 24 |
|---|---|---|---|---|---|---|---|
| `bin/aphorism.js` | 100.00 | 85.71 | 100.00 | ✓ | ✓ | ✓ | ✓ |
| `src/args.js` | 100.00 | 100.00 | 100.00 | ✓ | ✓ | ✓ | ✓ |
| `src/corpus.js` | 100.00 | 100.00 | 100.00 | ✓ | ✓ | ✓ | ✓ |
| `src/select.js` | 100.00 | 100.00 | 100.00 | ✓ | ✓ | ✓ | ✓ |

So the instrument is *consistent about the product* and *inconsistent about what it counts*.
Two rules follow, and they are the practical takeaway of this whole document:

1. **Read the per-file rows for `bin/` and `src/`. Never compare the `all files` row across
   Node versions** — it answers a different question on 18/20/22 than it does on 24.
2. The baseline in "The numbers" above is a **Node 24** reading. Quoting it next to an 18/20/22
   log will look like a regression that did not happen.

The CI step was already built so that a wrong per-version inference would cost nothing, and
that design stands unchanged now that the inference has been partly falsified:

- The step is separate from the real test-gate step (`node --test test/*.test.js`), which is
  completely unchanged and remains the only thing that can fail a job.
- The coverage step sets `continue-on-error: true` at the GitHub Actions level, so even a hard
  startup failure of the flag on some version cannot turn the job red.
- The step's own shell also self-succeeds: `node --test --experimental-test-coverage ... ||
  echo "NOTE: ... exited non-zero on Node ${{ matrix.node-version }} ..."`, so the log always
  ends with either the coverage table or an explicit, readable note naming the exact matrix
  version that failed and pointing at the real error output directly above it. A reader
  scanning the Actions log for a given Node version can tell, without opening this document,
  whether that version produced a report or not.

If a future run's real log shows the flag failing outright on some version, that is new,
measured information — record it here rather than treating the run above as settled for all
time. Node's coverage reporter has already changed what it counts once between 22 and 24; it
can change again.

## Reproduce

```sh
cd aphorism-cli
node --test --experimental-test-coverage test/*.test.js
```

No install step, no dependency, no config file — this flag is built into Node's own test
runner, and this repo has zero runtime and zero dev dependencies of any kind.

Two things to expect when you run it, both measured above rather than guessed: on **Node 24**
you will see the baseline table, and about **1 run in 9** it will read 96.92% instead of
98.44% (see *Stability*). On **Node 18/20/22** the `all files` row will read ~92.57% branch
because your test files are counted too (see *Across the matrix*). Neither is a regression.
Compare the `bin/` and `src/` rows, not the total.
