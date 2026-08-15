# aphorism

A tiny, zero-dependency CLI that prints one random programming aphorism.

`fortune(6)`, but curated for programmers. Quiet by default: one aphorism to stdout,
nothing else. Safe to drop in a `.bashrc` or an MOTD.

## Usage

No install step and no dependencies — Node 18+ and the repo is all you need.

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
node bin/aphorism.js --json | jq -r .author
node bin/aphorism.js --list --tag debugging
```

### `--list` behaviour

`--list` prints every aphorism in the filtered set in corpus order, one per line. Each
aphorism is printed in the form `<text> — <author>` (text, space, EM DASH, space, author).

`--list` accepts a valid `--seed` but ignores it — no random selection occurs. A seed that
fails to parse is still a usage error (exit 2), even with `--list`. When combined with
`--json`, `--list` emits one JSON object per line (newline-delimited JSON / NDJSON) for each
entry in the filtered set, in corpus order.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success — an aphorism (or the help text) was printed to stdout |
| `1` | No aphorism matched the given filters; message on stderr, stdout empty |
| `2` | Usage error — unknown flag, seed that `Number()` parses to NaN, or missing flag argument |

Errors always go to stderr, so `node bin/aphorism.js --tag nonexistent > out.txt`
leaves `out.txt` empty rather than writing a diagnostic into your pipeline.

## Attribution

The author printed with each aphorism is who the line is **commonly credited to**, not an
author checked against a primary source. Programming aphorisms are widely misattributed.
[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50
entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what
would settle each one. Nothing in that list has been resolved yet.

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
