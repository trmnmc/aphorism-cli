# aphorism

A tiny, zero-dependency CLI that prints one random programming aphorism.

`fortune(6)`, but curated for programmers. Quiet by default: one aphorism to stdout,
nothing else. Safe to drop in a `.bashrc` or an MOTD.

## Usage

No install step and no dependencies — Node 18+ and the repo is all you need.
The floor is [measured, not assumed](#node-support); see Tests.

```sh
node bin/aphorism.js
```

```
Simplicity is prerequisite for reliability.
    — Edsger W. Dijkstra
```

## Flags

| Flag | Effect |
|---|---|
| `--author <name>` | Substring match in author, case-insensitive |
| `--tag <tag>` | Whole tag match, case-insensitive |
| `--seed <n>` | Deterministic for any value `Number()` parses to non-NaN |
| `--list` | Print all aphorisms in filtered set, corpus order, one per line |
| `--json` | Single-line JSON object |
| `--help`, `-h` | Usage summary |

`--author` and `--tag` narrow together (AND, not OR). `--json` composes with the
filters and with `--seed`.

```sh
node bin/aphorism.js --author dijkstra
node bin/aphorism.js --tag simplicity --seed 42
node bin/aphorism.js --seed $(date +%Y%m%d)      # same aphorism all day; seed refreshes at local midnight
node bin/aphorism.js --json | jq -r .author
node bin/aphorism.js --list --tag debugging
```

### `--author` matching

The substring match is literal: no accent-folding, no Unicode normalization, no
transliteration. Of the corpus's 24 distinct authors, exactly one carries a non-ASCII
character — `Antoine de Saint-Exupéry` — and the plain-ASCII spelling of that name matches
nothing:

```sh
node bin/aphorism.js --author 'Saint-Exupery' --list   # exit 1, no match
node bin/aphorism.js --author 'Saint-Exupéry' --list   # exit 0, prints the entry
```

A partial that avoids the accented character still works, e.g. `--author saint` or
`--author antoine`.

### `--list` behaviour

`--list` prints every aphorism in the filtered set in corpus order, one per line. Each
aphorism is printed in the form `<text> — <author>` (text, space, EM DASH, space, author).

`--list` accepts a valid `--seed` but ignores it — no random selection occurs. A seed that
fails to parse is still a usage error (exit 2), even with `--list`. When combined with
`--json`, `--list` emits one JSON object per line (newline-delimited JSON / NDJSON) for each
entry in the filtered set, in corpus order.

## Tag vocabulary

The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.

#### Robust pool (5+ entries)
| Tag | Count |
|---|---|
| `design` | 14 |
| `simplicity` | 12 |
| `humor` | 9 |
| `debugging` | 7 |
| `teamwork` | 7 |
| `complexity` | 5 |
| `performance` | 5 |

#### Appears 3–4 times
| Tag | Count |
|---|---|
| `language` | 4 |
| `process` | 4 |
| `readability` | 4 |
| `reliability` | 4 |
| `philosophy` | 3 |

The smallest pool holds three aphorisms, so `--tag` always has something to choose between — with a `--seed` the choice is still deterministic, and without one it is a real draw rather than a foregone conclusion.

To find available tags at the command line, run:

```sh
node bin/aphorism.js --list --json | jq -r ".tags[]" | sort | uniq -c | sort -rn
```

## Tag vocabulary changes

The vocabulary above replaces an earlier 37-tag one in which 21 tags matched exactly one
aphorism, so `--tag` on any of them returned the same line every time. It was consolidated
by **retagging existing aphorisms only** — no aphorism text or author was changed, and no
entry was added or removed. Twenty-six low-count tag names were folded onto a surviving
neighbour and no longer match anything:

optimization, algorithms and caching to performance; naming and style to readability;
elegance, yagni and focus to simplicity; abstraction and humility to complexity;
architecture, dependencies and data to design; errors, robustness and interoperability to
reliability; history to language; innovation to philosophy; culture, management,
organization, psychology and opensource to teamwork; habits and pragmatism to process; and
testing to debugging.

If you scripted one of those names, `--tag <old-name>` now exits 1 with a message on
stderr rather than printing an aphorism. The fold map that produced this change is
`.swarm/runs/cycle-046-retag.mjs`.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success — an aphorism (or the help text) was printed to stdout |
| `1` | No aphorism matched the given filters; message on stderr, stdout empty |
| `2` | Usage error — unknown flag, seed that `Number()` parses to NaN, or missing flag argument |
| `3` | The output could not be delivered. A real stdout write failure (for example the device is full) exits `3` with one `aphorism: …` line on stderr. A real *stderr* write failure (same kind of device error, not a reader hanging up) also exits `3`, but with no diagnostic anywhere — on either stream — and it deliberately overwrites whatever exit code the run had already earned (`1` or `2`) |

Errors always go to stderr, so `node bin/aphorism.js --tag nonexistent > out.txt`
leaves `out.txt` empty rather than writing a diagnostic into your pipeline.

Exit `3` exists so that a failure to *deliver* the output is never confused with exit `1`,
which means the corpus had nothing to say. That holds whether the delivery failure is on
stdout or on stderr: if stderr itself can't be written to, the tool doesn't retry the write
(that risks recursing into its own failure handler) and doesn't reroute the diagnostic to
stdout (that would corrupt the data channel calling scripts parse), so exit `3` alone —
with no message anywhere — is deliberately left as the only signal, even when it means
discarding a `1` or `2` the run had already earned. A reader that hangs up without reading
is not an error at all: `node bin/aphorism.js --list | true` and `… | head -0` both break
the pipe, and the tool exits `0` with nothing on stderr, the way a well-behaved Unix filter
should.

## Attribution

The author printed with each aphorism is who the line is **commonly credited to**, not an
author checked against a primary source. Programming aphorisms are widely misattributed.
[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks every entry
by how likely the attribution is to be wrong and says what would settle each one. Nothing
in that list has been resolved yet.

| Attribution triage | Count |
|---|---|
| Entries ranked | 50 |
| Rated HIGH risk | 8 |

## Layout

```
bin/aphorism.js    entry point — argument dispatch and output formatting only
src/corpus.js      the aphorism corpus (text, author, tags)
src/select.js      pure filtering and (optionally seeded) selection
src/args.js        pure argv parser; returns a usage error, never throws
test/              node:test suites — pure-module tests plus end-to-end CLI tests
```

The logic lives in pure modules so it is testable without spawning a process; the
entry point stays thin.

## Tests

```sh
node --test test/*.test.js
```

Coverage of the selection and parsing rules (pure-module tests), plus end-to-end CLI tests
that spawn the real binary and assert on stdout, stderr, and exit codes.

### Node support

CI runs the whole suite on four Node majors on every push. As of commit `5f833ab`
(2026-08-20), the most recent full matrix run against a commit that actually changed
`src/`, `bin/`, `test/`, or the workflow itself was
[Actions run 32328776838](https://github.com/trmnmc/aphorism-cli/actions/runs/32328776838),
which reported:

| Node | Result |
|---|---|
| v18.20.8 | 120 tests, 119 pass, 0 fail, 1 skipped |
| v20.20.2 | 120 tests, 119 pass, 0 fail, 1 skipped |
| v22.23.2 | 120 tests, 119 pass, 0 fail, 1 skipped |
| v24.19.0 | 120 tests, 119 pass, 0 fail, 1 skipped |

The one skip is the same on all four and is expected: it is
`test/node-support-citation.test.js`, the guard on THIS section, standing down because
CI checks out shallow (see below).

Later CI runs re-test byte-identical code as of this writing (see
`git diff 5f833ab..HEAD -- src bin test .github`), so this citation stays the reference
matrix until that diff stops being empty. For the current state of CI — including any
runs since this citation — see the
[`test` workflow's run history](https://github.com/trmnmc/aphorism-cli/actions?query=workflow%3Atest).

> **Updated 2026-08-20 (cycle 3).** The paragraph above previously cited run
> `32267338333` at commit `44702fb` with a 118-test matrix, and it had gone stale: the
> `git diff` it names as its own retirement condition had stopped being empty (77 added
> lines across `test/readme-tags.test.js` and `.github/workflows/test.yml`, from commits
> `0230c23` and `0c2ed40`), while the citation stayed put. The old table was not false
> about run `32267338333` — that run really did report 118 — it was a true statement about
> a matrix that no longer described this tree. Recorded rather than quietly swapped,
> because the self-guard is the reason the decay was catchable at all: the doc names the
> exact command that falsifies it, so an audit can check the claim instead of believing it.

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

Read "Node 18+" as **verified-at-18**: 18 is the lowest version actually tested, and it
passes everything. It is **not proven minimal** — nothing here tests Node 16 or 17, so
whether the CLI runs on them is unknown rather than ruled out.

One incidental finding from that run, recorded because it bites anything that parses the
suite output: Node 18, 20 and 22 print the TAP summary (`# tests 120`), while Node 24
prints the spec-reporter summary (`ℹ tests 120`) — and that marker is U+2139
INFORMATION SOURCE, not an ASCII `i`. The count moved with the suite again (119 -> 120);
the split between the two reporters did not, and is re-confirmed in run `32328776838`.
