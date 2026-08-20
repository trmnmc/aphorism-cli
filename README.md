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

The distribution is uneven, but every tag is a real pool. These counts are measured from
`src/corpus.js` by `test/readme-tags.test.js`, so they cannot drift from it silently:

| Tag vocabulary | Count |
|---|---|
| Distinct tags | 12 |
| Tags on 2 or more entries | 12 |
| Tags on exactly one entry | 0 |

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

*This section is machine-checked: `test/node-support-citation.test.js` parses the CI citation and the retirement condition out of the prose below and executes them, so the exact shape of those two claims is load-bearing rather than stylistic.*

CI runs the whole suite on four Node majors — 18, 20, 22 and 24 — on every push. The
reference matrix is [Actions run 32400996331](https://github.com/trmnmc/aphorism-cli/actions/runs/32400996331)
at commit `4b63e91` (2026-08-20), the most recent full matrix run against a commit that
actually changed `src/`, `bin/`, `test/`, or the workflow itself. It reported:

| Node | Result |
|---|---|
| v18.20.8 | 124 tests, 122 pass, 0 fail, 2 skipped |
| v20.20.2 | 124 tests, 122 pass, 0 fail, 2 skipped |
| v22.23.2 | 124 tests, 122 pass, 0 fail, 2 skipped |
| v24.19.0 | 124 tests, 122 pass, 0 fail, 2 skipped |

The two skips are the same on all four majors and are expected. Both are in
`test/node-support-citation.test.js`, the guard on this section, and both stand down because
CI checks out shallow — see the first standing limit below.

That citation is the reference matrix until `git diff 4b63e91..HEAD -- src bin test .github`
stops being empty. Once that diff is non-empty the cited run no longer describes this tree
and the section needs a new run id; that is the section's own falsification condition, and it
is stated here exactly once on purpose. For the current state of CI — including any runs
since this citation — see the
[`test` workflow's run history](https://github.com/trmnmc/aphorism-cli/actions?query=workflow%3Atest).

Two standing limits apply to that guard. Both were measured, not assumed:

1. **The guard is inert in CI, by design.** The workflow checks out at depth 1, so the cited
   base commit is not in CI's copy of the history and the guard skips — that is the
   `2 skipped` in all four rows above. The guard therefore protects a maintainer working from
   a full clone; it does not protect the matrix. Making it fail on a base commit it cannot
   reach would turn CI red for the wrong reason.
2. **Any commit touching `src/`, `bin/`, `test/` or `.github/` is transiently red on a full
   clone.** Such a commit falsifies the citation the instant it lands, and the CI run that
   would supply a replacement run id cannot exist until after the push. That window is
   intrinsic to a claim that names its own falsification condition rather than a defect in
   the guard, and it closes only when a later commit re-cites. Nothing enforces that the same
   commit does the repair.

Read "Node 18+" as **verified-at-18**: 18 is the lowest version actually tested, and it
passes everything. It is **not proven minimal** — nothing here tests Node 16 or 17, so
whether the CLI runs on them is unknown rather than ruled out.

One detail matters if you parse the suite output rather than read it: Node 18, 20 and 22
print the TAP summary (`# tests <n>`), while Node 24 prints the spec-reporter summary
(`ℹ tests <n>`) — and that marker is U+2139 INFORMATION SOURCE, not an ASCII `i`. The test
count moves as the suite grows; the split between the two reporters does not.

The cycle-by-cycle record of how this citation reached run `32400996331` — six entries
covering every move since run `32267338333`, what retired each one, and what a review pass
found in the guard itself — is recorded in
[`docs/node-support-citation-history.md`](docs/node-support-citation-history.md).
