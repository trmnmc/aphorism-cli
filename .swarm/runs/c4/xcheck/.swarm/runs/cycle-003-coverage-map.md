# N-3 — SPEC Domain-rule coverage map, re-measured (run #3)

**Instrument:** `.swarm/runs/cycle-003-rule-coverage.mjs` (a copy of run #1's
`cycle-052-rule-coverage.mjs`, with `copyTree()` changed to build every arm from
`git archive b627ed2eb547d8f06e73a8ac52cccb4031e3ba6c` instead of `fs.cpSync` off the
live directory — the pre-dispatch commit is pinned so the arms cannot move under a
concurrent agent's edits to README.md/REPORT.md/docs/. `.swarm/` is excluded from the
archive extraction, matching the old copyTree's skip-list). Raw output:
`.swarm/runs/cycle-003-rule-coverage-out.txt`.

**Note on the pin:** at the time this ran, `HEAD` of `/opt/targets/aphorism-cli` was
itself `b627ed2eb547d8f06e73a8ac52cccb4031e3ba6c` with a clean working tree (verified
via `git rev-parse HEAD` and `git status --porcelain` before starting). So this
measurement is of the exact current live tree, archived at a fixed point so it stays
fixed regardless of what lands in the repo while this instrument runs.

**P0 (pristine control):** suite 102 pass / 0 fail; all 29 witnesses hold on the
unmutated tree. P0 OK — the verdicts below are meaningful.

## Per-clause table (all 29 clauses)

Every mutation below is **byte-identical to the cycle-52 text** — no anchor had
drifted in the current tree (confirmed both by the instrument's own NOT-PLANTED check,
which fired zero times, and independently by hand via `grep -F` against
`src/select.js`, `bin/aphorism.js`, `src/args.js` before running the sweep). **No
repairs were needed.**

| Clause | Domain-rule clause (short) | Exact mutation applied today | Verdict | Evidence |
|---|---|---|---|---|
| S1 | seeded pick is deterministic | `src/select.js`: `const rng = mulberry32(toUint32Seed(seed));` → `const rng = Math.random;` | KILLED | suite 94p/8f. Killed by: "--seed is deterministic across separate processes" \| "--json composes with --seed: the seeded JSON pick is reproducible AND is the same entry as the plain-text pick" \| "plain single-pick output is TWO lines..." \| "--seed Infinity and --seed -Infinity (typed as CLI strings) are accepted and deterministic" (+4 more) |
| S2 | Infinity/-Infinity accepted AND deterministic | `src/select.js`: inserts `if (!Number.isFinite(seed)) return (Math.random() * 4294967296) >>> 0;` before `const buf = new ArrayBuffer(8);` in `toUint32Seed` | KILLED | suite 99p/3f. Killed by: "--seed Infinity and --seed -Infinity (typed as CLI strings) are accepted and deterministic" \| "pick: Infinity seed is deterministic and returns a valid member" \| "pick: -Infinity seed is deterministic and returns a valid member" |
| S3 | unseeded selection is uniform (every candidate reachable) | `src/select.js`: `index = Math.floor(Math.random() * candidates.length);` → `... * (candidates.length - 1));` | KILLED | suite 100p/2f. Killed by: "pick: every candidate is REACHABLE by an unseeded draw" \| "pick: unseeded draws split the interval EQUALLY across candidates (uniform)" |
| S4 | unseeded selection is uniform (no bias) | `src/select.js`: `index = Math.floor(Math.random() * candidates.length);` → `... Math.random() ** 2 * candidates.length);` | KILLED | suite 101p/1f. Killed by: "pick: unseeded draws split the interval EQUALLY across candidates (uniform)" |
| S5 | same seed+set → same aphorism (seeds not collapsed to one state) | `src/select.js`: `return (ints[0] ^ ints[1]) >>> 0;` → `return 0;` (in `toUint32Seed`) | KILLED | suite 100p/2f. Killed by: "different seeds do not all collapse to one aphorism" \| "pick: different seeds generally produce different results" |
| F1 | `--author` matches case-insensitively | `src/select.js`: `const needle = String(author).toLowerCase();` → `const needle = String(author);` | KILLED | suite 101p/1f. Killed by: "filter: author match is case-insensitive" |
| F2 | `--author` matches by substring containment | `src/select.js`: `entry.author.toLowerCase().includes(needle)` → `entry.author.toLowerCase() === needle` | KILLED | suite 98p/4f. Killed by: "author filter is case-insensitive and narrows the list" \| "--json composes with the filter flags: ..." \| "filter: author match is case-insensitive" \| "filter: author and tag together narrow to the intersection (AND)" |
| F3 | `--tag` matches a WHOLE tag, not substring | `src/select.js`: `entry.tags.some((t) => t.toLowerCase() === needle)` → `... .toLowerCase().includes(needle))` | KILLED | suite 100p/2f. Killed by: "--tag matches membership, not substring containment" \| `--tag "" (bare empty-string value) matches nothing...` |
| F4 | `--tag` matches case-insensitively | `src/select.js`: `const needle = String(tag).toLowerCase();` → `const needle = String(tag);` | KILLED | suite 101p/1f. Killed by: "filter: tag match is case-insensitive" |
| F5 | both filters narrow to intersection (AND, not OR) | `src/select.js`: rewrites the tag-filter block to union `result` and a fresh `corpus`-filtered `tagged` set instead of chaining `.filter` | KILLED | suite 94p/8f. Killed by: "--tag matches membership, not substring containment" \| "--list prints exactly one line per matching entry, no drops" \| "--list preserves corpus order..." \| "--list --json emits newline-delimited JSON..." (+4 more) |
| E1 | empty set after filtering exits 1, not 0 | `bin/aphorism.js`: `return EXIT_NO_MATCH;` → `return EXIT_OK;` | KILLED | suite 98p/4f. Killed by: "no match exits 1 with stderr only and zero bytes on stdout" \| "--tag matches membership, not substring containment" \| "--list with a filter that matches nothing is STILL exit 1..." \| `--tag "" ...` |
| E2 | empty set writes a human-readable stderr message | `bin/aphorism.js`: `process.stderr.write('aphorism: no aphorism matches those filters\n');` → `;` | KILLED | suite 99p/3f. Killed by: "no match exits 1 with stderr only and zero bytes on stdout" \| "--list with a filter that matches nothing is STILL exit 1..." \| `--tag "" ...` |
| E3 | empty set writes zero bytes on stdout | `bin/aphorism.js`: same anchor as E2, appends a `process.stdout.write(...)` of the same message after the stderr write | KILLED | suite 98p/4f. Killed by: "no match exits 1 with stderr only and zero bytes on stdout" \| "--tag matches membership, not substring containment" \| "--list with a filter that matches nothing is STILL exit 1..." \| `--tag "" ...` |
| L1 | `--list` prints EVERY aphorism in the filtered set | `bin/aphorism.js`: `const body = candidates` → `const body = candidates.slice(0, 5)` | KILLED | suite 95p/7f. Killed by: "--list prints every entry in the filtered set" \| "author filter is case-insensitive and narrows the list" \| "--list prints exactly one line per matching entry, no drops" \| "--list preserves corpus order..." (+3 more) |
| L2 | `--list` prints in corpus order | `bin/aphorism.js`: `const body = candidates` → `const body = candidates.slice().reverse()` | KILLED | suite 99p/3f. Killed by: "--list preserves corpus order (first and last line match)" \| "--list --json emits newline-delimited JSON, one object per line, in corpus order" \| "README `--list` format literal matches..." |
| L3 | `--list` prints one per line | `bin/aphorism.js`: `.join('\n');` → `.join('  ');` | KILLED | suite 95p/7f. Killed by: "--list prints every entry in the filtered set" \| "author filter is case-insensitive and narrows the list" \| "--list prints exactly one line per matching entry, no drops" \| "--list preserves corpus order..." (+3 more) |
| L4 | `--list` line form is `<text> SPACE EM-DASH SPACE <author>` | `bin/aphorism.js`: `` `${e.text} — ${e.author}` `` → `` `${e.text} - ${e.author}` `` | KILLED | suite 100p/2f. Killed by: "--list preserves corpus order (first and last line match)" \| "README `--list` format literal matches the shipped binary's actual --list output (T-017)" |
| L5 | `--list` accepts a valid `--seed` and IGNORES it | `bin/aphorism.js`: `if (opts.list) {` → `if (opts.list && opts.seed === undefined) {` | **KILLED** | suite 101p/1f. Killed by: "--list accepts a valid --seed and IGNORES it: output is byte-identical across seeds" |
| L6 | `--list` exits 0 | `bin/aphorism.js`: appends `return EXIT_OK;` → `return 3;` after the `--list` stdout write | KILLED | suite 95p/7f. Killed by: "--list prints every entry in the filtered set" \| "author filter is case-insensitive and narrows the list" \| "--list prints exactly one line per matching entry, no drops" \| "--list preserves corpus order..." (+3 more) |
| L7 | a seed that fails to parse is STILL a usage error under `--list` | `bin/aphorism.js`: `if (opts.error) {` → `if (opts.error && !argv.includes('--list')) {` | **KILLED** | suite 96p/6f. Killed by: "--list --seed abc is a usage error, exit 2, stdout empty, stderr carries the diagnostic" \| "--seed abc --list (erroring flag BEFORE --list) is still a usage error..." \| `--list --seed= (empty seed value) is a usage error...` \| `--list --seed "   " (whitespace-only seed value)...` (+2 more) |
| J1 | `--json` emits a single-line JSON object | `bin/aphorism.js`: `JSON.stringify(chosen)` → `JSON.stringify(chosen, null, 2)` | KILLED | suite 101p/1f. Killed by: "--json output is exactly one line, never pretty-printed" |
| J2 | `--json` carries at minimum `text`, `author`, `tags` | `bin/aphorism.js`: `JSON.stringify(chosen)` → `JSON.stringify({ text: chosen.text, author: chosen.author })` | KILLED | suite 101p/1f. Killed by: "--json emits a single-line JSON object with text/author/tags" |
| J3 | `--json` composes with `--seed` | `bin/aphorism.js`: `const chosen = pick(candidates, opts.seed);` → `... pick(candidates, opts.json ? undefined : opts.seed);` | KILLED | suite 101p/1f. Killed by: "--json composes with --seed: the seeded JSON pick is reproducible AND is the same entry as the plain-text pick" |
| J3b | `--json` composes with the filter flags | `bin/aphorism.js`: `const chosen = pick(candidates, opts.seed);` → `... pick(opts.json ? corpus : candidates, opts.seed);` | KILLED | suite 101p/1f. Killed by: "--json composes with the filter flags: the JSON pick is always a member of the FILTERED set" |
| J4 | `--list --json` emits one JSON OBJECT per line (NDJSON) | `bin/aphorism.js`: `opts.json ? JSON.stringify(e)` → `opts.json ? JSON.stringify([e])` | KILLED | suite 101p/1f. Killed by: "--list --json emits newline-delimited JSON, one object per line, in corpus order" |
| X0 | exit code 0 on success | `bin/aphorism.js`: appends `return EXIT_OK;` → `return 5;` after the main stdout write | KILLED | suite 93p/9f. Killed by: "bare invocation prints one attributed aphorism and exits 0" \| "--seed is deterministic across separate processes" \| "--json emits a single-line JSON object with text/author/tags" \| "output is pipe-safe — no ANSI escapes when not a TTY" (+5 more) |
| X2a | exit code 2 on an unknown flag | `src/args.js`: `` result.error = `unknown flag: ${arg}`; return result; `` → `continue;` | KILLED | suite 97p/5f. Killed by: "unknown flag is a usage error" \| "unknown short flag is a usage error" \| "unknown flag is a usage error, exit 2, stdout clean" \| "--list --nosuchflag (unknown flag) is a usage error..." (+1 more) |
| X2b | exit code 2 on a missing flag argument | `src/args.js`: `` result.error = `flag ${arg} requires a value`; return result; `` → `continue;` | KILLED | suite 99p/3f. Killed by: "--author missing value at end of argv is a usage error" \| "--tag missing value because next token is another flag is a usage error" \| "--seed missing value at end of argv is a usage error" |
| X2c | exit code 2 on a seed that `Number()` parses to `NaN` | `src/args.js`: `if (Number.isNaN(n)) return { ok: false };` → `if (false) return { ok: false };` | KILLED | suite 97p/5f. Killed by: "non-numeric --seed is a usage error" \| "non-numeric --seed= equals form is a usage error" \| "non-numeric seed is a usage error, exit 2" \| "--list --seed abc is a usage error, exit 2, stdout empty..." (+1 more) |

## Headline

**29 KILLED / 0 SURVIVED / 0 INERT / 0 NOT-PLANTED out of 29.**

All 29 witnesses held on the pristine (P0) control, all 29 mutants broke their
witness on the mutated tree (zero INERT — every mutant was a real, observable
behavioural defect, not a no-op), and all 29 then failed the suite (zero SURVIVED —
the suite noticed every one). No mutant's anchor string was missing from the current
tree (zero NOT-PLANTED), so no repair was required and all 29 clauses were actually
measured.

## MOVED

**No rows moved.** The carried-forward baseline from run #1 cycle 54
(`.swarm/runs/cycle-054-verify-T-046.txt`, `GATE 10/10`) closed the map at 29/29,
with L5 and L7 as the two clauses whose closure was specifically verified that cycle
(`POS-L5`, `L7-KILL`/`L7-ATTR` arms). Today's independent re-sweep against the
pinned pre-dispatch commit reproduces 29/29 KILLED, including L5 and L7 — the two
rows that were SURVIVED at cycle 52 and closed at cycle 54 are still KILLED today.

Arithmetic: 29 clauses swept, 29 rows verdict KILLED, 0 rows verdict SURVIVED,
0 + 0 = 0 unaccounted rows. 29 − 29 = 0 survivors.

No mutation text needed repair (every anchor string from the cycle-52 `M` array was
found exactly once in the pinned tree — verified both by the instrument's own
NOT-PLANTED path, which did not fire, and by an independent manual `grep -F -o` pass
over `src/select.js`, `bin/aphorism.js`, and `src/args.js` before the sweep ran), so
there is nothing to call out as a repair.

One incidental fact worth naming even though it isn't a "moved row": the *specific*
tests that do the killing are not all the same ones as at cycle 52 — the suite has
grown from 84 tests (P0 at cycle 52) to 102 tests (P0 today), and several kills now
cite additional/renamed tests (e.g. L7 is now killed by six named tests including
`--list --seed= (empty seed value) is a usage error...`, none of which existed at
cycle 52). This is suite growth, not coverage drift: the clause-level verdict for
every row is unchanged.

## What this measurement does NOT establish

- It does not establish that the SPEC's 29 Domain-rule clauses are the **complete**
  set of behavioral requirements for this CLI — only that these 29, as previously
  enumerated by the run #1 instrument, are each covered by at least one killing test
  today.
- It does not establish anything about README.md, REPORT.md, or docs/ — those were
  deliberately not read or touched, per this task's own constraint, and a concurrent
  agent was editing them during this run (evidenced by an unrelated file,
  `.swarm/runs/cycle-003-count-audit.md`, appearing under `.swarm/runs/` mid-task —
  not authored by this measurement and left untouched).
- It does not establish that the suite would catch a *different* mutation of the same
  clause, a combination of two simultaneous defects, or a defect outside the 29
  pre-registered mutation sites — mutation testing at N=1 mutant per clause is a lower
  bound on protection, not an upper bound.
- It does not establish anything about performance, concurrency, or any property not
  exercised by the specific CLI invocations each witness/suite run performs (all runs
  are single-process, synchronous `spawnSync` calls against `bin/aphorism.js`).
- It does not establish that the pinned commit `b627ed2eb547d8f06e73a8ac52cccb4031e3ba6c`
  will still equal `HEAD` by the time this report is read — it was HEAD, with a clean
  working tree, at the moment this instrument ran (`git rev-parse HEAD` confirmed it
  immediately beforehand), but the repo is under active, concurrent edit by another
  agent in this same run.
