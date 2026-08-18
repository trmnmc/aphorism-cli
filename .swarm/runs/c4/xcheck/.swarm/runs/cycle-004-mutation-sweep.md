# Mutation sweep — cycle 004

**Baseline:** `node --test test/*.test.js` → 52 pass / 0 fail, exit 0. (node v24.19.0)

Every mutation was applied to its own fresh whole-repo scratch copy under
`.swarm/mutation-scratch/<id>/` (copied from the real repo, `.git` and `.swarm`
excluded), proven observably different from the pristine binary, then run
through the full suite. All scratch copies were removed after the sweep; the
real repo's `src/`, `test/`, and `bin/` were never modified.

26 mutants total (M01–M26), plus one documented equivalent-mutation attempt
(M06-EQUIV) that was discarded and replaced by M06 per the required protocol.

## Mutant table

| id | behavior | file | verdict |
|----|----------|------|---------|
| M01 | seed determinism, ordinary finite seeds | src/select.js | KILLED |
| M02 | seed determinism, non-finite seeds (±Infinity) | src/select.js | KILLED |
| M03 | unseeded (random) selection path | src/select.js | KILLED |
| M04 | --author case-insensitivity | src/select.js | KILLED |
| M05 | --author substring vs exact-equality | src/select.js | KILLED |
| M06-EQUIV | --tag case-insensitivity (1st attempt) | src/select.js | EQUIVALENT |
| M06 | --tag case-insensitivity (2nd attempt) | src/select.js | KILLED |
| M07 | --tag membership-equality vs substring | src/select.js | **SURVIVED** |
| M08 | --author + --tag AND vs OR | src/select.js | KILLED |
| M09 | empty-match contract: exit code 1 | bin/aphorism.js | KILLED |
| M10 | empty-match contract: message on stderr | bin/aphorism.js | KILLED |
| M11 | empty-match contract: zero bytes on stdout | bin/aphorism.js | KILLED |
| M12 | --list completeness | bin/aphorism.js | **SURVIVED** |
| M13 | --list corpus order | bin/aphorism.js | **SURVIVED** |
| M14 | --json shape: single line | bin/aphorism.js | **SURVIVED** |
| M15 | --json shape: field set | bin/aphorism.js | KILLED |
| M16 | --list --json shape | bin/aphorism.js | **SURVIVED** |
| M17 | exit code 0 (success) | bin/aphorism.js | KILLED |
| M18 | exit code 2 (usage error) | bin/aphorism.js | KILLED |
| M19 | HELP text content | src/args.js | KILLED |
| M20 | seed parsing: --seed=N equals-form | src/args.js | KILLED |
| M21 | seed parsing: negative seed values | src/args.js | **SURVIVED** |
| M22 | seed parsing: missing value after --seed | src/args.js | **SURVIVED** |
| M23 | seed parsing: non-numeric seed | src/args.js | KILLED |
| M24 | unknown-flag handling | src/args.js | KILLED |
| M25 | unexpected-positional-argument handling | src/args.js | KILLED |
| M26 | pipe-safety (no ANSI on non-TTY) | bin/aphorism.js | KILLED |

**Totals (26 mutants):** 19 KILLED, 7 SURVIVED, 0 EQUIVALENT among the final
set (1 additional equivalent attempt was found and replaced, see M06-EQUIV
below).

## Survivors

### M07 — --tag membership-equality vs substring (src/select.js)
Mutation: swapped the tag comparison from exact equality (`t.toLowerCase() === needle`)
to substring containment (`t.toLowerCase().includes(needle)`).

Observable difference — `node bin/aphorism.js --tag desig --list`:
- pristine: `aphorism: no aphorism matches those filters` (exit 1)
- mutant: 13-line listing of every "design"-tagged entry (partial tag "desig" now matches via substring)

Suite: 52 pass / 0 fail, exit 0.

### M12 — --list completeness (bin/aphorism.js)
Mutation: added `.slice(0, -1)` before mapping the `--list` candidates, dropping the last matching entry.

Observable difference — `node bin/aphorism.js --tag design --list | wc -l`:
- pristine: 13
- mutant: 12

Suite: 52 pass / 0 fail, exit 0.

### M13 — --list corpus order (bin/aphorism.js)
Mutation: added `.slice().reverse()` before mapping the `--list` candidates.

Observable difference — `node bin/aphorism.js --tag design --list | head -1`:
- pristine: "Any fool can write code that a computer can understand..." — Martin Fowler
- mutant: "Simple things should be simple, complex things should be possible." — Alan Kay

Suite: 52 pass / 0 fail, exit 0.

### M14 — --json shape: single line (bin/aphorism.js)
Mutation: `JSON.stringify(chosen)` changed to `JSON.stringify(chosen, null, 2)` for the single selected aphorism.

Observable difference — `node bin/aphorism.js --json --seed=1`:
- pristine: one compact single line of JSON
- mutant: 8-line pretty-printed JSON object

Suite: 52 pass / 0 fail, exit 0.

### M16 — --list --json shape (bin/aphorism.js)
Mutation: when `--list --json` are combined, output changed from newline-delimited
single-line JSON objects to one pretty-printed JSON array (`JSON.stringify(candidates, null, 2)`).

Observable difference — `node bin/aphorism.js --list --json --tag humor`:
- pristine: 9 lines, each one compact JSON object (NDJSON)
- mutant: one multi-line pretty-printed JSON array wrapping all 9 objects

Suite: 52 pass / 0 fail, exit 0.

### M21 — seed parsing: negative seed values (src/args.js)
Mutation: `parseSeedValue` now rejects any `n < 0`, turning negative seeds into a usage error.

Observable difference — `node bin/aphorism.js --seed=-5 --json`:
- pristine: prints a selected aphorism as JSON, exit 0
- mutant: `aphorism: flag --seed requires a numeric value` (exit 2)

Suite: 52 pass / 0 fail, exit 0.

### M22 — seed parsing: missing value after --seed (src/args.js)
Mutation: for `--seed` specifically, the lookahead guard no longer treats a
following flag-looking token as "missing value" — only `next === undefined`
is checked for `--seed` (author/tag unaffected), so `--seed --list` treats
`--list` as an attempted (invalid) seed value instead of reporting a
missing-value error.

Observable difference — `node bin/aphorism.js --seed --list`:
- pristine: `aphorism: flag --seed requires a value` (exit 2)
- mutant: `aphorism: flag --seed requires a numeric value` (exit 2 — different stderr text, and the `--list` token is consumed as the bogus seed value rather than parsed separately)

Suite: 52 pass / 0 fail, exit 0.
