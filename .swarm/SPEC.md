# SPEC — aphorism-cli

<!-- REWRITTEN 2026-08-17 for IMPROVEMENT RUN #2 (allocator auto-kickoff,
     source=allocator, mode=guest, dial=0.33, posture=trickle,
     brief: "harden tests, fix playbook items, polish docs — no new features").

     The PRODUCT spec (Idea / Audience / Product must-haves / Taste notes /
     Domain rules) is UNCHANGED from the 2026-08-14 build run and the 2026-08-15
     improvement run. The "This run's must-haves" section is additive and scopes
     THIS run only. The previous run's I-1..I-6 must-haves all closed and were
     conductor-verified; they are preserved in git history, not restated here.

     Stress-test verdict at this kickoff: RESHAPE (confidence 8). The brief's
     "harden tests" was aimed at the wrong file — see J-2. Taste judge:
     use-twice 7 / product-not-demo 8 / scope-fits-night 8 / one-memorable 6. -->

## Idea

A tiny, zero-dependency Node.js CLI that prints a random programming aphorism with its
attribution. `fortune(6)`, but curated for programmers. Quiet, pipeable, unix-clean.

It already ships and passes 91 tests. This run does NOT build product. It is a
housekeeping run on the repo and on the swarm's own cross-run memory.

## Audience

Two, and they are different people.

1. **The CLI's user** — a developer who wants one memorable line of programming wisdom in
   their shell prompt, MOTD, or `.bashrc`, and who will be annoyed by anything that prints
   more than it must. Nothing this run does is visible to them. That is deliberate.
2. **The repo's maintainer** — who has to trust what README.md and REPORT.md claim, and who
   is currently getting ZERO playbook lessons applied to every swarm run because of a defect
   this run exists to fix.

## Product must-haves (built + verified 2026-08-14, cycle 1)

<!-- The floor this run must not break. Any regression here fails the cycle. -->

- [x] `node bin/aphorism.js` prints exactly one aphorism plus attribution to stdout, exit 0
- [x] A curated corpus of >= 40 aphorisms as structured data (text, author, tags) — 50 entries
- [x] Flags: `--author <name>`, `--tag <tag>`, `--seed <n>`, `--list`, `--json`, `--help`
- [x] No-match behaviour: message on stderr, nothing on stdout, non-zero exit
- [x] `node --test test/*.test.js` suite — 91 tests, 0 failures

## This run's must-haves (2026-08-17)

<!-- The PLAN gate (cycle.md step 4) holds until every box below is covered by a
     backlog item. Checked off only after conductor verification, never by claim. -->

- [ ] **J-1a Playbook cap breach repaired losslessly.** `SWARM/playbook/learnings.md` holds
      35 lessons against its documented cap of 20. Brought within cap by the file's own
      documented overflow rule (drop the oldest non-high-confidence PRE-EXISTING lesson
      first), with a byte-exact archive of the pre-repair file and a written, arguable
      drop-list rationale naming every lesson dropped and why. Nothing is deleted without an
      archive. `next_id` is left strictly monotonic so no dropped lesson's ID is ever
      re-minted.

- [ ] **J-1b The allowlist gap that made the playbook inert is HANDED OFF with an exact
      patch — it cannot be closed from inside a run.** Root cause, reproduced live at this
      kickoff: `bin/swarm-playbook.sh` appears in `SWARM/.claude/settings.json` under no
      path form that a headless session resolves, so `validate`/`parse`/`append`/
      `record-applied` are all denied. The conductor attempted the settings fix at kickoff
      step 5 and the write was DENIED — a `-p` session cannot write settings.json. This box
      closes on a handoff document carrying the exact JSON lines to add and the one command
      a human runs to confirm, NOT on the gap being closed.

      **Honest limit, stated up front:** the prior run's central claim — that `cmd_parse`
      exits 2 on any validator output, so every run applies zero lessons — was established
      by READING the script and has never been EXECUTED. This run cannot execute it either.
      J-1a makes the claim moot by removing the condition; it does not verify the claim. Any
      report that says otherwise is wrong.

- [ ] **J-2 The five README-prose test items are RESOLVED in one direction and stop
      generating work.** T-024, T-024a, T-024b, T-032 and T-039 all live in one 74 KB test
      file (`test/readme-tags.test.js`) that parses README prose to assert counts. T-024a is
      already blocked at attempts 2, and KI-9/KI-10 record a MEASURED finding that a count
      cannot be bound to its marker without false-rejecting some honest, entirely-true
      README. Each of the five is either closed by a structural re-shape that is
      mutation-proved, or formally RETIRED as a documented BOUNDARY with the measurement
      that justifies retirement recorded in the item. None may be left in a state a later
      run silently re-opens. Retiring a check that cannot be made correct is test hardening,
      not a concession — it removes a false-confidence surface.

- [ ] **J-3 Every test added this run traces to a MEASURED mutation survivor in `src/` or
      the shipped binary — never to reading the suite for gaps.** Each added test is proven
      twice (it fails against its specific mutation, and removing it lets that mutation
      survive), and each survivor is classified HOLE or BOUNDARY before anything is
      hardened. A BOUNDARY survivor is documented, never "hardened".

- [ ] **J-4 Docs match the verified state.** README.md, REPORT.md and
      `docs/corpus-attribution-triage.md` carry no count claim that is false, describe
      nothing unverified as verified, and never describe the corpus attributions as
      audited. Every claim removed or corrected is listed, so the diff is reviewable.

## Nice-to-haves

<!-- DEFERRED — every entry is a new user-visible feature, excluded by the brief.
     Recorded, not built. -->

- No-repeat-until-exhausted rotation (cursor in `$XDG_STATE_HOME` or `/tmp`). This is the
  cheap half of the taste fix and the single thing that would make use #9 stop feeling
  samey; the taste judge named its absence as the cause of a 4/10 use-twice score at the
  previous kickoff.
- `--width <n>` wrapping for long aphorisms
- ANSI dim for the attribution line, respecting `NO_COLOR`

## Non-goals

- Any network access, remote corpus fetch, or LLM call
- A database, accounts, or long-term persistence
- npm-registry publishing / global install packaging
- **This run only:** any new user-visible feature or flag, including every Nice-to-have above
- **Corpus expansion (backlog T-008, 50 → 120 entries)** — named explicitly rather than
  silently defaulted, because it is the one open item a user WOULD notice: a corpus repeat
  is met by roughly the ninth invocation. Excluded on two grounds, both stated so they can
  be argued with: (1) the brief says no new features; (2) the highest-severity open issue
  (KI-2) is that the existing 50 attributions are UNAUDITED, and programming aphorisms are
  widely misattributed — more than doubling a corpus nobody can vouch for makes the worst
  open problem worse. Reversible on a word from the user.
- Adding a mutation-testing dependency (Stryker or kin) to a zero-dependency repo. Named
  at the prior-art scout as the honest off-the-shelf alternative to hand-rolled mutation
  arms (Apache-2.0, 3.0k stars, actively pushed); a toolchain addition is a scope change,
  not housekeeping.

## Taste notes

Unix-clean and quiet. One aphorism to stdout, nothing else — no banner, no emoji, no
box-drawing by default. Must survive `aphorism | cat` and `aphorism > file` unchanged.
Errors go to stderr, never stdout. `--help` fits on one screen. Attribution is dim, not
loud; the aphorism is the product.

## Domain rules

<!-- UNCHANGED from the previous run. A regression against any clause below fails the
     cycle regardless of what else the cycle achieved. -->

- Selection: with `--seed <n>`, the chosen index is deterministic — the same seed and the
  same filtered candidate set always yield the same aphorism. `--seed` accepts any value
  that `Number()` parses to a non-NaN number, including negative numbers, non-integers, and
  `Infinity` / `-Infinity`; all are deterministic. Without `--seed`, selection is uniform
  over the filtered candidate set.
- Filtering: `--author` matches by substring containment, case-insensitively, against the
  aphorism's `author` field (e.g., `--author dijk` matches "Edsger W. Dijkstra"); `--tag`
  matches a whole tag, case-insensitively, for membership in the aphorism's `tags` array
  (e.g., `--tag desi` does not match a `design` tag). Supplying both narrows to the
  intersection (AND, not OR).
- Empty candidate set after filtering is an error, not an empty success: exit code 1,
  a human-readable message on stderr, and zero bytes on stdout.
- `--list` prints every aphorism in the filtered set in corpus order, one per line, in the
  form `<text> — <author>` (text, space, EM DASH U+2014, space, author). It accepts a valid
  `--seed` but ignores it; no random selection occurs. Exit code 0. A seed that fails to
  parse is still a usage error under `--list` — see Exit codes.
- `--json` emits the selected aphorism as a single-line JSON object with at minimum the
  keys `text`, `author`, and `tags`; it composes with the filter and seed flags. When
  combined with `--list`, `--json` emits one JSON object per line (newline-delimited JSON)
  for each entry in the filtered set, in corpus order.
- Exit codes: 0 success, 1 no match, 2 bad usage (unknown flag, missing flag argument, or
  seed value that `Number()` parses to NaN).

## Definition of done

**Product (met 2026-08-14, must not regress):** `node bin/aphorism.js` prints a random
attributed aphorism; all six flags behave per the Domain rules; `node --test test/*.test.js`
passes with zero failures; the corpus holds >= 40 entries; README documents install-free
usage and every flag; the tree has zero runtime dependencies.

**This run:** learnings.md within its documented cap with a byte-exact archive and an
arguable drop rationale; the allowlist gap handed off with an exact patch and its
never-executed status stated plainly; all five README-prose items closed or formally
retired with the measurement behind the call recorded in the item; every test added this
run traceable to a measured mutation survivor and proven failable AND attributable; docs
carrying no false claim; `node --test test/*.test.js` green with zero failures throughout;
zero new user-visible features.

## Commands

- run: `node bin/aphorism.js`
- test: `node --test test/*.test.js`

## Spec digest

- IMPROVEMENT RUN #2 on a shipped zero-dep Node CLI — harden, repair, document; no new features
- must: playbook within cap losslessly (J-1a) + allowlist gap handed off with an exact patch (J-1b)
- must: the five README-prose test items closed OR formally retired as measured boundaries (J-2)
- must: new tests only from measured mutation survivors, proven failable + attributable (J-3); docs carry no false claim (J-4)
- non-goals: corpus expansion, rotation, --width, NO_COLOR, any new flag, any new dependency
- rules unchanged: seed deterministic incl. non-finite, filters AND, empty match = exit 1 + stderr only
- taste: unix-quiet, pipeable, errors to stderr, the aphorism is the product
