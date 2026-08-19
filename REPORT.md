# aphorism-cli — report

A tiny, zero-dependency Node.js CLI that prints one attributed programming aphorism —
`fortune(6)` for programmers, quiet and pipeable. This page is the current status in one
screen. The complete forensic history behind it — four SWARM runs, 1578 lines, every
correction and every dated claim, moved verbatim rather than summarized — lives in
[`docs/report-history.md`](docs/report-history.md).

## What ships

- **Run it:** `node bin/aphorism.js` — no install step, no `package.json`, zero runtime
  dependencies. Node plus this repo is the whole requirement.
- **Corpus:** 50 curated aphorisms in `src/corpus.js` (text, author, tags) — 24 distinct
  authors, 12 tags, smallest pool 3 entries / largest 14.
- **Flags:** `--author <name>` (substring match, case-insensitive), `--tag <tag>`
  (whole-tag match, case-insensitive, AND with `--author`), `--seed <n>` (deterministic
  for any value `Number()` parses to non-NaN, including `Infinity`/negatives/fractions),
  `--list` (print the filtered set, one per line, corpus order), `--json` (single-line
  JSON; newline-delimited with `--list`), `--help`/`-h`.
- **Error contract:** no match on the active filters is exit 1, a message on stderr, and
  zero bytes on stdout — never a silent empty success. Unknown flag or an unparseable
  `--seed` is exit 2. A real stdout write failure is exit 3, distinct from "no match".
- **Source:** `src/args.js` (134 lines), `src/corpus.js` (269), `src/select.js` (91),
  `bin/aphorism.js` (100) — three pure modules plus a thin entry point. Full usage, the
  flag table and the tag vocabulary are documented in [README.md](README.md).

## What is machine-verified

- **Test suite:** `node --test test/*.test.js` — **118 tests, 118 pass, 0 fail**,
  re-run directly against the shipped tree while writing this report (2026-08-19).
  3496 lines of tests across 5 files (`args`, `cli`, `pipe`, `readme-tags`, `select`).
- **Node support floor:** README.md cites a real GitHub Actions matrix run —
  [run 32267338333](https://github.com/trmnmc/aphorism-cli/actions/runs/32267338333),
  commit `44702fb` — reporting 118 tests / 118 pass / 0 fail on Node v18.20.8, v20.20.2,
  v22.23.2 and v24.19.0. README frames this honestly as **verified-at-18**, not
  proven-minimal: nothing tests Node 16 or 17, so whether the CLI runs there is unknown,
  not ruled out.
- **Reported as not run, never as passed:** the SWARM playbook helper
  `bin/swarm-playbook.sh` has never been executed successfully against this repo, across
  four SWARM runs — its `cmd_parse` behaviour is read-only knowledge from reading the
  script, not an execution result (`.swarm/journal.md`). Corpus attribution accuracy is
  unaudited (see below) — no check available to this repo's tooling can confirm a quote's
  provenance.

## What is open

Per `.swarm/backlog.json` **as of the close of run #4 cycle 4**: 13 tracked items — 6 done
(N-1, N-2, N-3, N-5, N-6, N-7), nothing in flight, 6 blocked on a human ruling, and 1
declined (R-1). Any bare count on this page is a snapshot dated to this cycle and goes
stale the moment the run closes its next item — measured eight times now, including twice
across the run's last two cycles alone: once at cycle 4, when this paragraph was first
written mid-cycle and falsified by the very commit that shipped it, and once at cycle 3 in
the same way. The item names below stay true longer than the arithmetic; the counts are
re-derived from `backlog.json` at each cycle's verification gate rather than trusted.

### Blocked on a human ruling

The six items below are blocked because a person, not an agent, must decide. None is
re-described as work a builder could pick up.

- **T-006** — corpus attribution audit. *Next actor:* a human (no one in this run can
  reach a primary source; network access is a product non-goal). *Settles when:* all 50
  corpus attributions are checked against primary sources, starting with the 8 rows marked
  HIGH risk in [`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md)
  (8 HIGH / 16 MEDIUM / 26 LOW of 50).
- **T-040** — two judgment calls from the cycle-46 tag retag. *Next actor:* a human.
  *Settles when:* they ratify or reverse (a) the 26-name fold map — especially
  `testing → debugging`, the load-bearing one, since it dissolves the corpus's only tag for
  testing as a discipline — and (b) confirm the example rewrite in SPEC.md's Domain rules,
  where the illustration `` `--tag test` does not match a `testing` tag `` became
  `` `--tag desi` does not match a `design` tag `` because the retag removed the tag the old
  illustration named. (T-040's acceptance clause in `backlog.json` cites this as "line 144";
  that line number has since drifted and the example now sits at SPEC.md:206 — cite the rule,
  not the line.) Recorded for the same ruling: all 26 retired
  tag names now return the identical "no match" message as a tag name that never existed,
  so whether to add a "did you mean" hint is a further human call.
- **J-7** — five CLI behaviours the SPEC leaves undecided. *Next actor:* a human.
  *Settles when:* an explicit clause goes into `.swarm/SPEC.md` for each of: `--help` vs.
  usage-error precedence when both appear in argv; whether `--seed -0` and `--seed 0` pick
  the same aphorism (today they don't — different IEEE-754 bit patterns); repeated
  `--tag`/`--author` (last-occurrence wins today, unprotected by any test); empty or
  whitespace `--seed` (SPEC's Selection and Exit-codes clauses point opposite ways); empty
  `--author`/`--tag` via `=` form vs. space form (same kind of clash). SPEC.md's own
  "Undecided behaviours" section already documents the last three in full; the first two
  exist only in `backlog.json`'s J-7 notes, still to be written up once ruled.
- **TS-1** — corpus depth: under uniform draws over the 50-entry corpus, median first
  repeat lands at draw 9 and P(repeat by draw 12) = 76.2%. *Next actor:* a human, the repo
  owner, at the next kickoff. *Settles when:* the owner lifts SPEC.md's locked "corpus
  expansion" non-goal.
- **TS-2** — tag-pool depth: 5 of 12 tags hold <= 4 entries (`philosophy`=3;
  `readability`, `reliability`, `language`, `process`=4 each). *Next actor:* a human, the
  repo owner, at the next kickoff (same scope decision as TS-1). *Settles when:* corpus
  expansion is permitted; until then only README/help wording steering users toward larger
  pools is in scope.
- **TS-3** — voice concentration: Dijkstra 7 + Perlis 5 + Pike 5 = 17/50 = 34% of the
  corpus in three voices. *Next actor:* a human, the repo owner, at the next kickoff (same
  scope decision as TS-1). *Settles when:* corpus expansion is permitted and new entries
  diversify author and era rather than deepen the three already-dominant voices.

### Declined

- **R-1** — README acknowledgement-guard reshape. **Declined, not dropped:** `status:
  dropped` in `backlog.json`, ruled by this run's own conductor at run #4 cycle 4. The
  property the guard exists to protect is already covered, twice, by two sibling count
  guards that re-derive their expected value from `src/corpus.js` and fail CLOSED — the
  opposite of the direction the original guard was found to fail in (silent on a stripped
  acknowledgement). Reshaping would have added a third guard over an already-covered
  property. Stated rather than hidden: those two covering guards are prose regexes bound to
  a corpus-derived count, not the structural document marker R-1's acceptance asked for, and
  the original guard's separate false-rejection defect (an honest reword can make it fire)
  is untouched by this decline. *Re-opens if:* a human ruling on T-040 reintroduces
  single-entry tags, or README's phrasing moves away from the literal count phrase.

Fuller background, prior attempts and exact citations for every item above live in
`.swarm/backlog.json`'s own notes; items open before this run are also covered in
[`docs/report-history.md`](docs/report-history.md).

## Full history

Everything above this line is new, written 2026-08-19 to answer three questions in one
screen. Nothing from the previous 1578-line `REPORT.md` was deleted or paraphrased to make
room for it: the whole document — Build run, Improvement runs #1 through #3, every
inline correction, every known-issue table, every hand-off — was moved, byte for byte,
into [`docs/report-history.md`](docs/report-history.md).
