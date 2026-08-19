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

- **Test suite:** `node --test test/*.test.js` — **119 tests, 119 pass, 0 fail**,
  re-run by the conductor against the shipped tree at the run's closing gate
  (2026-08-19, run #4 cycle 12). 3557 lines of tests across 5 files (`args`, `cli`,
  `pipe`, `readme-tags`, `select`).
- **Node support floor:** README.md cites a real GitHub Actions matrix run —
  [run 32267338333](https://github.com/trmnmc/aphorism-cli/actions/runs/32267338333),
  commit `44702fb` — reporting 118 tests / 118 pass / 0 fail on Node v18.20.8, v20.20.2,
  v22.23.2 and v24.19.0. The 118 there is correct for that commit; the suite has since
  grown to 119, and the matrix has stayed 4/4 green on every commit after it (checked at
  the closing gate against
  [run 32293231112](https://github.com/trmnmc/aphorism-cli/actions/runs/32293231112)).
  README frames the floor honestly as **verified-at-18**, not
  proven-minimal: nothing tests Node 16 or 17, so whether the CLI runs there is unknown,
  not ruled out.
- **Reported as not run, never as passed:** the SWARM playbook helper
  `bin/swarm-playbook.sh` has never been executed successfully against this repo, across
  four SWARM runs — its `cmd_parse` behaviour is read-only knowledge from reading the
  script, not an execution result (`.swarm/journal.md`). Corpus attribution accuracy is
  unaudited (see below) — no check available to this repo's tooling can confirm a quote's
  provenance.

## What is open

Per `.swarm/backlog.json` **at the close of run #4** (cycle 12, the run's last): 19 tracked
items — 11 done, **nothing in flight**, 7 blocked on a human ruling, and 1 declined (R-1).
This is the final count for the run, not a mid-cycle snapshot: the run ended because the
todo column reached zero, so there is no next item to falsify it. That distinction is worth
stating, because the count in this paragraph was falsified twice while the run was live —
at cycle 3 and again at cycle 4, when it was written mid-cycle and invalidated by the very
commit that shipped it. The item names below stay true longer than the arithmetic either
way; every count here was re-derived from `backlog.json` by the closing gate rather than
carried forward.

### Blocked on a human ruling

The seven items below are blocked because a person, not an agent, must decide. None is
re-described as work a builder could pick up. **No agent action can unblock any of them** —
which is why the run ended here rather than continuing: four of the seven (TS-1, TS-2,
TS-3, TS-6) are blocked on the owner lifting a SPEC-locked non-goal, and that lock can only
be lifted at a kickoff, by a human.

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
- **J-7** — seven CLI behaviours the SPEC leaves undecided. *Next actor:* a human.
  *Settles when:* an explicit clause goes into `.swarm/SPEC.md` for each of: `--help` vs.
  usage-error precedence when both appear in argv; whether `--seed -0` and `--seed 0` pick
  the same aphorism (today they don't — different IEEE-754 bit patterns); repeated
  `--tag`/`--author` (last-occurrence wins today, unprotected by any test); empty or
  whitespace `--seed` (SPEC's Selection and Exit-codes clauses point opposite ways); empty
  `--author`/`--tag` via `=` form vs. space form (same kind of clash); exit code 3 on a
  write failure, on either stream, which the Exit-codes Domain rule's "0 success, 1 no
  match, 2 bad usage" enumeration never mentions; and whether Taste notes' "attribution is
  dim, not loud" already ships or is aspirational, since the shipped attribution line is
  distinguished from the aphorism only by a four-space indent and an em dash — zero ANSI on
  any path. SPEC.md's own "Undecided behaviours" section already documents the last five in
  full; the first two exist only in `backlog.json`'s J-7 notes, still to be written up once
  ruled.
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
- **TS-6** — the `--tag` vocabulary is undiscoverable without `jq`, and an unknown tag is
  indistinguishable from an empty result. *Next actor:* a human, the repo owner, at the next
  kickoff (adding a `--tags` flag is a new flag, this run's locked non-goal). *Settles when:*
  the owner rules on whether discovery belongs in `--help` output or behind a new flag.
  Conductor-measured at cycle 9, not asserted: `--tags` exits 2 and `--help` never mentions
  it; `--help` delegates discovery to the pipeline
  `node bin/aphorism.js --list --json | jq -r '.tags[]' | sort -u`; and an unknown tag
  produces byte-identical stderr and exit status to a genuinely empty intersection of two
  *valid* filters. Filed **minor**, not a bug: the message is generic across the whole
  no-match class rather than misleading about tags specifically, which is defensible unix
  behaviour.

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

## How run #4 ended, and what only a human can finish

**Run #4 closed at cycle 12 of a clock that had ~18.5 hours left.** That is deliberate and
it is the honest outcome, not a crash: the todo column reached zero at cycle 11, all five of
the run's must-haves closed, and no remaining candidate passed the value ratchet — *would
the target user notice, and would they still care ten minutes later?* Everything that clears
that bar (corpus expansion, no-repeat rotation, a `--tags` flag) is a non-goal this run's own
brief locked; everything permitted is more documentation about documentation, which is the
precise churn must-have M-2 spent the run undoing. The clock was handed back with the reason
recorded rather than spent.

The closing gate re-derived the definition of done from the tree — 12 cells, **12 PASS / 0
FAIL**, including two must-die controls proving the audit can report failure
(`.swarm/runs/run4-cycle-012-donegate.mjs`, output alongside it). It did not read prior
cycles' claims.

**Machine-checked** (re-run by the conductor at close, not taken from an agent): the 119-test
suite green; the 4-version Actions matrix green; `src/corpus.js` byte-identical since the run
began; `bin/` and `src/` untouched for the entire run — the run's whole footprint is
`.github/workflows/test.yml`, `README.md`, `REPORT.md`, `docs/report-history.md` and
`test/readme-tags.test.js`; zero runtime dependencies; every line of the pre-move 1578-line
REPORT.md still present after the move to the appendix.

**Reported as not-run, never as passed:** the SWARM playbook helper `bin/swarm-playbook.sh`
was re-executed at cycle 12 and **denied again** by the harness. The cause is now structural
rather than suspected — `/opt/swarm/.claude/settings.json` was read directly this cycle and
carries no entry for that script in any form. The ledger stays at **denial #31** (a second
reproduction inside the same run does not advance the count) and the exact patch a human
would apply is in `SWARM/playbook/HANDOFF-allowlist-2026-08-17.md`.

**Only a human can finish:** every one of the seven open items above. Three need a ruling
(T-006 corpus attributions, T-040 retag consequences, J-7's seven undecided CLI behaviours);
four need a locked non-goal lifted at a kickoff (TS-1, TS-2, TS-3, TS-6). No machine check
substitutes for any of them — corpus attribution in particular needs primary sources this
CLI is designed never to reach, and it remains the repo's highest-severity open issue.

**Standing finding for whoever schedules the next run:** this was the fourth consecutive run
under a brief forbidding the only changes the product's own taste instrument — three separate
taste judges now — says would matter. It ran out of permitted work with most of its clock
unspent. The lever is the brief, not the machinery: permit the no-repeat rotation, or permit
corpus expansion paired with the attribution audit, and there is real work here again.

## Full history

Everything above this line is new, written 2026-08-19 to answer three questions in one
screen. Nothing from the previous 1578-line `REPORT.md` was deleted or paraphrased to make
room for it: the whole document — Build run, Improvement runs #1 through #3, every
inline correction, every known-issue table, every hand-off — was moved, byte for byte,
into [`docs/report-history.md`](docs/report-history.md).
