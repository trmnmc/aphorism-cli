# SPEC — aphorism-cli

<!-- Instantiated at kickoff (SKILL.md KICKOFF target-scaffolding step) into
     <target>/.swarm/SPEC.md.
     The conductor restates the digest every cycle and re-reads this file in full
     every 5th cycle (reference/cycle.md step 3). Frozen after user confirmation. -->

## Idea

A tiny, zero-dependency Node.js CLI that prints a random programming aphorism with its
attribution. `fortune(6)`, but curated for programmers. Quiet, pipeable, unix-clean.

## Audience

Developers who want a single memorable line of programming wisdom in their shell prompt,
MOTD, or `.bashrc` — and who will be annoyed by anything that prints more than it must.

## Must-haves

<!-- The PLAN gate (cycle.md step 4) holds until every box below is covered by a
     backlog item. Checked off only after conductor verification, never by claim. -->

- [ ] `node bin/aphorism.js` prints exactly one aphorism plus attribution to stdout, exit 0
- [ ] A curated corpus of >= 40 aphorisms as structured data (text, author, tags)
- [ ] Flags: `--author <name>` filter, `--tag <tag>` filter, `--seed <n>` deterministic pick, `--list`, `--json`, `--help`
- [ ] No-match behaviour: message on stderr, nothing on stdout, non-zero exit
- [ ] `node --test test/*.test.js` suite covering pick, filters, seeding, no-match, and output format

## Nice-to-haves

- `--width <n>` wrapping for long aphorisms
- No-repeat-until-exhausted rotation (state in `$XDG_STATE_HOME` or `/tmp`), so consecutive
  runs never repeat until the corpus is spent — the cheap half of the taste fix
- ANSI dim for the attribution line, respecting `NO_COLOR`

## Non-goals

- Any network access, remote corpus fetch, or LLM call
- A database, accounts, or long-term persistence beyond the rotation cursor file
- npm-registry publishing / global install packaging

## Taste notes

Unix-clean and quiet. One aphorism to stdout, nothing else — no banner, no emoji, no
box-drawing by default. Must survive `aphorism | cat` and `aphorism > file` unchanged.
Errors go to stderr, never stdout. `--help` fits on one screen. Attribution is dim, not
loud; the aphorism is the product.

## Domain rules

- Selection: with `--seed <n>`, the chosen index is deterministic — the same seed and the
  same filtered candidate set always yield the same aphorism. Without `--seed`, selection
  is uniform over the filtered candidate set.
- Filtering: `--author` matches case-insensitively against the aphorism's `author` field;
  `--tag` matches case-insensitively against membership in the aphorism's `tags` array.
  Supplying both narrows to the intersection (AND, not OR).
- Empty candidate set after filtering is an error, not an empty success: exit code 1,
  a human-readable message on stderr, and zero bytes on stdout.
- `--list` prints every aphorism in the filtered set, one per line, in corpus order.
- `--json` emits the selected aphorism as a single-line JSON object with at minimum the
  keys `text`, `author`, and `tags`; it composes with the filter and seed flags.
- Exit codes: 0 success, 1 no match, 2 bad usage (unknown flag or missing flag argument).

## Definition of done

`node bin/aphorism.js` prints a random attributed aphorism; all six flags behave per the
Domain rules above; `node --test test/*.test.js` passes with zero failures; the corpus holds >= 40
entries; a README documents install-free usage and every flag; the tree has zero runtime
dependencies.

## Commands

- run: `node bin/aphorism.js`
- test: `node --test test/*.test.js`

## Spec digest

<!-- 3-5 bullets. Kickoff copies these verbatim into state.json `spec_digest`;
     the conductor restates them at step 3 of every cycle. Keep each bullet one
     line: what it is, the must-have core, the non-goals, the taste. -->

- zero-dep Node CLI: prints one random programming aphorism + attribution to stdout
- must: >=40-entry corpus, flags --author/--tag/--seed/--list/--json/--help, node --test suite
- rules: seed is deterministic, filters AND together, empty match = exit 1 + stderr only
- non-goals: network, LLM, database, npm publishing
- taste: unix-quiet, pipeable, errors to stderr, aphorism is the product
