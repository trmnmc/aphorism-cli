# SPEC — aphorism-cli

<!-- Instantiated at kickoff (SKILL.md KICKOFF target-scaffolding step) into
     <target>/.swarm/SPEC.md.
     The conductor restates the digest every cycle and re-reads this file in full
     every 5th cycle (reference/cycle.md step 3). Frozen after user confirmation.

     REWRITTEN 2026-08-15 for the IMPROVEMENT RUN (allocator auto-kickoff,
     source=allocator, brief: "harden tests, fix playbook items, polish docs —
     no new features"). The product spec below is UNCHANGED from the 2026-08-14
     build run; the "Improvement run" section is additive and scopes this run
     only. Product must-haves are all verified done — see Product must-haves. -->

## Idea

A tiny, zero-dependency Node.js CLI that prints a random programming aphorism with its
attribution. `fortune(6)`, but curated for programmers. Quiet, pipeable, unix-clean.

## Audience

Developers who want a single memorable line of programming wisdom in their shell prompt,
MOTD, or `.bashrc` — and who will be annoyed by anything that prints more than it must.

## Product must-haves (built + verified 2026-08-14, cycle 1)

<!-- Checked boxes below were verified by the conductor in the build run, not claimed
     by a builder. They are NOT this run's work; they are the floor this run must not
     break. Any regression here fails the cycle. -->

- [x] `node bin/aphorism.js` prints exactly one aphorism plus attribution to stdout, exit 0
- [x] A curated corpus of >= 40 aphorisms as structured data (text, author, tags) — 50 entries
- [x] Flags: `--author <name>` filter, `--tag <tag>` filter, `--seed <n>` deterministic pick, `--list`, `--json`, `--help`
- [x] No-match behaviour: message on stderr, nothing on stdout, non-zero exit
- [x] `node --test test/*.test.js` suite covering pick, filters, seeding, no-match, and output format

## Improvement run must-haves (2026-08-15)

<!-- The PLAN gate (cycle.md step 4) holds until every box below is covered by a
     backlog item. Checked off only after conductor verification, never by claim. -->

- [x] **I-1 Determinism hole closed.** `--seed Infinity` (and `-Infinity`) currently exits 0
      and picks a DIFFERENT aphorism every run — verified at kickoff, 6 distinct outputs in
      6 runs — silently violating the Domain rule that a seeded pick is deterministic.
      Resolved to ONE of: deterministic pick, or exit 2 as a usage error. Whichever is
      chosen is stated in Domain rules and README, and proven by a test that is both
      failable and attributable.
- [x] **I-2 Tests hardened where measurement — not reading — shows a hole.** Each documented
      behavior is mutated against the existing suite; a test is added ONLY for a mutant that
      survives. Every added test is proven twice: it fails against its specific mutation, and
      removing it lets that mutation survive. Survivors are first classified HOLE or
      BOUNDARY; a BOUNDARY survivor is documented, never "hardened".
- [x] **I-3 Three doc/behaviour divergences closed, identically in SPEC.md and README.md.**
      (a) `--author` is documented as a case-insensitive match but implemented as substring
      containment; (b) `--list` silently ignores `--seed` (KI-3); (c) `--list --json` emits
      one JSON object per line, a combination no rule describes.
      <!-- Closed cycle 7 as a SUPERSET of the three named above: six rulings landed —
           (a), (b), (c) plus the I-1 non-finite-seed resolution, the `--tag` whole-tag
           contrast, and the `--list` line format (`<text> — <author>`), which cycle 5
           found was pinned by a test while no rule described it. Every ruling was
           verified by executing the shipped binary, not by reading the prose:
           36/36 checks, .swarm/runs/cycle-007-verify-I-3.txt. -->

- [x] **I-4 Corpus attribution triage (KI-2).** A risk-ranked, reasoned list of the corpus
      entries most likely to be misattributed, written for a human to settle. The corpus is
      NEVER to be reported as "audited" — no check available to this run can establish that.
      <!-- Closed cycle 11, both clauses separately verified. Clause 1 (the ranked list)
           landed cycle 10 as docs/corpus-attribution-triage.md, gated 16/16 against a
           ranking SEALED to disk before dispatch. Clause 2 (no file overclaims) landed
           cycle 11 via a repo-wide sweep over all 9 product files, 19/19 with 3 negative
           controls. KI-2 itself stays OPEN at high severity and is NOT closed by this
           box: a triage is not an audit, and only a human can settle the 8 HIGH entries
           (backlog T-006). -->
- [x] **I-5 SWARM playbook file repaired or handed off losslessly.** `SWARM/playbook/learnings.md`
      holds 31 lessons against its documented cap of 20 and carries three duplicate IDs
      (L-023, L-025, L-026 each appear twice). Either brought within cap with unique IDs by
      the file's own documented overflow rule, or handed off with a lossless archive and a
      named reason. Nothing is deleted without an archive.
      <!-- Closed cycle 12 on the SECOND branch of this clause, not the first, and the
           box is ticked on that basis only. Duplicate IDs were repaired losslessly
           (31 lessons in, 31 out, bodies an identical multiset; 17/17 with 4 negative
           controls). The 20-cap breach was NOT culled and is handed to a human with a
           computed drop-list: the file's overflow rule sheds ONE lesson per append and
           extrapolating it to shed 11 at once would delete 5 [apply:]-bearing lessons.
           Archive: playbook/learnings.md.pre-I5-1786803951. Handoff:
           playbook/HANDOFF-cap-2026-08-15.md. Tracked as KI-5, still open. -->
      <!-- Ticked at cycle 30 hygiene, not at closure — a bookkeeping lag, not a late
           verification. Both items were conductor-verified at cycles 11 and 12; the
           boxes were simply never updated. Recorded so the tick is not read as new
           evidence. -->

- [x] **I-6 REPORT.md refreshed** to the verified state at wrap-up, with every unverified
      item named as unverified.
      <!-- Ticked at cycle 44 hygiene, not at closure — a bookkeeping lag of the same
           shape the I-5 box carried, and recorded the same way so the tick is not read
           as new evidence. The item was conductor-verified at cycle 41 (13/13 against a
           0/13 negative control) and has read done in backlog.json since. Cycle 44
           measured the divergence rather than noticing it in passing: gate check S4/S5,
           .swarm/runs/cycle-044-verify-reachability.txt. REPORT.md is refreshed again
           at WRAP_UP, so this box describes a standing obligation that is currently
           met, not a one-time event. -->

<!-- ALL SIX improvement must-haves are now closed and conductor-verified, which means
     this run's definition-of-done is MET (cycle-44 gate S3). That does NOT make the
     target DONE: cycle.md's churn breaker also requires that no remaining candidate
     pass the value ratchet, and T-008 does pass it on a measured user-visible defect
     (a user meets a corpus repeat by use ~9.6). The remaining board is discovered work,
     not unmet must-haves. See REPORT.md § Unfinished work. -->

## Nice-to-haves

<!-- DEFERRED for this run — every entry below is a new feature, excluded by the
     allocator brief ("no new features"). Recorded, not built. -->

- `--width <n>` wrapping for long aphorisms
- No-repeat-until-exhausted rotation (state in `$XDG_STATE_HOME` or `/tmp`), so consecutive
  runs never repeat until the corpus is spent — the cheap half of the taste fix. The taste
  judge scored use-twice 4/10 at this run's kickoff and named this deferral as the cause.
- ANSI dim for the attribution line, respecting `NO_COLOR`

## Non-goals

- Any network access, remote corpus fetch, or LLM call
- A database, accounts, or long-term persistence beyond the rotation cursor file
- npm-registry publishing / global install packaging
- **This run only:** any new user-visible feature, including every Nice-to-have above

## Taste notes

Unix-clean and quiet. One aphorism to stdout, nothing else — no banner, no emoji, no
box-drawing by default. Must survive `aphorism | cat` and `aphorism > file` unchanged.
Errors go to stderr, never stdout. `--help` fits on one screen. Attribution is dim, not
loud; the aphorism is the product.

## Domain rules

- Selection: with `--seed <n>`, the chosen index is deterministic — the same seed and the
  same filtered candidate set always yield the same aphorism. `--seed` accepts any value
  that `Number()` parses to a non-NaN number, including negative numbers, non-integers, and
  `Infinity` / `-Infinity`; all are deterministic. Without `--seed`, selection is uniform
  over the filtered candidate set.
- Filtering: `--author` matches by substring containment, case-insensitively, against the
  aphorism's `author` field (e.g., `--author dijk` matches "Edsger W. Dijkstra"); `--tag`
  matches a whole tag, case-insensitively, for membership in the aphorism's `tags` array
  (e.g., `--tag test` does not match a `testing` tag). Supplying both narrows to the
  intersection (AND, not OR).
- Empty candidate set after filtering is an error, not an empty success: exit code 1,
  a human-readable message on stderr, and zero bytes on stdout.
- `--list` prints every aphorism in the filtered set in corpus order, one per line, in the
  form `<text> — <author>` (text, space, EM DASH U+2014, space, author). It accepts a valid
  `--seed` but ignores it; no random selection occurs. Exit code 0. A seed that fails to
  parse is still a usage error under `--list` — see Exit codes.
- `--json` emits the selected aphorism as a single-line JSON object with at minimum the
  keys `text`, `author`, and `tags`; it composes with the filter and seed flags. When combined
  with `--list`, `--json` emits one JSON object per line (newline-delimited JSON) for each
  entry in the filtered set, in corpus order.
- Exit codes: 0 success, 1 no match, 2 bad usage (unknown flag, missing flag argument, or
  seed value that `Number()` parses to NaN).

## Definition of done

**Product (met 2026-08-14):** `node bin/aphorism.js` prints a random attributed aphorism;
all six flags behave per the Domain rules above; `node --test test/*.test.js` passes with
zero failures; the corpus holds >= 40 entries; a README documents install-free usage and
every flag; the tree has zero runtime dependencies.

**This improvement run:** I-1 closed and proven by a failable, attributable test; every
test added under I-2 traces to a measured mutation survivor; the I-3 divergences stated
identically in SPEC.md and README.md; the I-4 triage exists as a human-actionable list and
is never dressed up as an audit; I-5 within cap with unique IDs or archived and handed off
with a reason; `node --test test/*.test.js` passes with zero failures throughout; zero new
user-visible features.

## Commands

- run: `node bin/aphorism.js`
- test: `node --test test/*.test.js`

## Spec digest

<!-- 3-5 bullets. Kickoff copies these verbatim into state.json `spec_digest`;
     the conductor restates them at step 3 of every cycle. Keep each bullet one
     line: what it is, the must-have core, the non-goals, the taste. -->

- IMPROVEMENT RUN on a shipped zero-dep Node CLI: harden, document, repair — no new features
- must: close the --seed non-finite determinism hole; mutation-measured tests only; 3 doc divergences; corpus triage; playbook repair
- rules unchanged: seed deterministic, filters AND together, empty match = exit 1 + stderr only
- non-goals this run: rotation, --width, NO_COLOR dim, network, npm publishing — all features
- taste: unix-quiet, pipeable, errors to stderr, the aphorism is the product
