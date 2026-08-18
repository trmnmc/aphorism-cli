# Cycle 19 — sealed pre-commitment for T-013 (README-claim mutation sweep)

Written by the conductor BEFORE the agent was dispatched. The agent has never seen this file.
Its purpose is the cycle-10 method: a survivor list I merely *agree with* is evidence about
prose, not about the suite. Sealing my own prediction first turns the agent's return into a
measurement of both the suite AND of me.

Basis: read of `test/readme-tags.test.js` (6 tests) at cycle 19. This is READING the suite for
gaps, which playbook L-031 explicitly says is NOT measurement — that is exactly why it is being
recorded as a hypothesis to be checked rather than banked as a finding.

Corpus facts measured by the conductor at cycle 19 (`node -e` over src/corpus.js):
entries 50 · distinct tags 37 · >=5 entries: design 13, simplicity 10, humor 9, debugging 5
(4 tags) · 2-4 entries: 12 tags · >=2 entries: 16 · exactly 1: 21.
**Every number the README currently states is TRUE today.** The sweep is not looking for a lie;
it is asking which lies the suite would fail to notice.

## Predicted KILLED (the tag-vocabulary guard should catch these)

| # | Mutation | Killed by (predicted) |
|---|---|---|
| K1 | Invent a tag name in the Tag vocabulary prose list (`zzzbogus`) | test 1 (tags must exist) |
| K2 | Change a table row count, e.g. `design` 13 -> 11 | test 2 (counts must match) |
| K3 | Change "37 distinct tags" -> another number | test 3 |
| K4 | Change "21 tags appear exactly once" -> another number | test 4 |
| K5 | Delete a single-entry tag from the prose list (`yagni`) | test 5 |
| K6 | Delete the `## Tag vocabulary` heading | test 1 (section assert) |
| K7 | Corpus: add a brand-new tag to one entry (37 -> 38 distinct) | test 3 |
| K8 | Corpus: raise a tabled tag's count (`performance` 4 -> 5) | test 2 |

## Predicted SURVIVORS (my hypothesis — the point of the sweep is to check it)

Two classes, and the distinction is the reason this item exists rather than being a generic
"add doc tests" chore.

**Class A — structural weakness in an EXISTING guard.** These are the T-012 failure class: a
guard that is present and passing but blind in one direction.

| # | Mutation | Why I predict it survives |
|---|---|---|
| S1 | Delete an entire table row (`\| \`debugging\` \| 5 \|`) from the robust-pool table | `extractCountsFromReadme` walks README -> corpus only. A row that is absent is never iterated, so a tag can silently vanish from the tables. No test walks corpus -> README for tabled tags. |
| S2 | Move `performance` (count 4) into the "robust pool (5+ entries)" table, leaving its stated count 4 | test 2 checks only that the stated count matches the corpus (4 == 4, passes). Nothing checks that a row's BAND matches its count, so the README can be internally self-contradictory and stay green. |

**Class B — surfaces with no guard at all.** Unguarded is not automatically a defect; some of
these should stay unguarded (L-033 BOUNDARY). Classification is mine at gate time, not the
agent's, and is deliberately withheld from the dispatch.

| # | Mutation | Why I predict it survives |
|---|---|---|
| S3 | "16 tags appear on 2 or more entries" -> wrong number | no test extracts this figure; test 3/test 4 regexes do not match this sentence |
| S4 | "4 tags have a robust pool" -> wrong number | same |
| S5 | "12 tags appear 2-4 times" -> wrong number | same |
| S6 | Attribution section: "all 50 entries" -> wrong number | no test relates README prose to corpus length |
| S7 | Attribution section: "8 are rated HIGH" -> wrong number | no test reads docs/corpus-attribution-triage.md |
| S8 | Flags table: rewrite `--tag` as "Substring match in tag" (a real lie about shipped behaviour) | no test reads the Flags table |
| S9 | Exit codes table: change the meaning of exit `1` | no test reads the Exit codes table |
| S10 | `--list` prose: "EM DASH" -> "HYPHEN" | no test relates the format prose to the CLI's actual output |
| S11 | Layout block: rename `src/select.js` -> `src/selection.js` | no test reads the layout block |
| S12 | "Node 18+" -> "Node 24+" | no test reads it |

## What would make me wrong, and I want to know if I am

- Any of S3-S12 being KILLED means a test in `cli.test.js` / `args.test.js` / `select.test.js`
  incidentally covers a README claim in a way I did not find by reading. That would be a
  genuine correction to this ranking, not a rounding error.
- Any of K1-K8 SURVIVING means the tag-vocabulary guard is weaker than its 6 tests imply, which
  would be the most important result the sweep could return and would outrank every survivor.

## Scope discipline (stated before the fact so it cannot be rationalised after)

The deliverable is a SURVIVOR LIST ONLY. No test is to be written this cycle. HOLE-vs-BOUNDARY
classification is the conductor's judgment (L-033) and hardening is a follow-up item, exactly as
I-2a fed I-2b/I-2c. I expect to classify several Class B survivors as BOUNDARY and leave them
unhardened — pinning "Node 18+" or the layout block in a test would produce brittle assertions
that false-reject honest edits. A large survivor count is NOT a large to-do list.
