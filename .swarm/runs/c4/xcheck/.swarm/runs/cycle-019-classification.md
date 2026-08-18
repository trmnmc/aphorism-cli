# Cycle 19 — HOLE vs BOUNDARY classification of the T-013 survivors

Author: the conductor. This judgment was deliberately withheld from the sweep agent (its
dispatch forbade ranking or classifying anything) and is anchored to what the repo actually
promises, not to intuition about what "should" be tested.

Playbook L-033: a survivor at a genuinely indiscriminable point is the check being CORRECT.
Hardening it produces a test that false-rejects honest edits. A large survivor list is not a
large to-do list.

Evidence for every line below: `.swarm/runs/cycle-019-verify-T-013.txt` (37/37, conductor
harness, authored at verification time). Sealed prediction: `.swarm/runs/cycle-019-precommit.md`.

## The two classes are not the same finding

**Class A survivors are a guard that is present, passing, and blind in one direction.** This is
the T-012 failure class exactly — cycle 18 closed a guard that went quiet when a sentence was
reworded, and these are the same shape. They are the important result.

**Class B survivors are surfaces with no guard at all.** Unguarded is not automatically a
defect; three of them should stay unguarded.

## HOLE — worth closing

| id | Survivor | Why it is a HOLE, not a boundary |
|---|---|---|
| A7 | Deleting a whole table row from the tag tables is invisible | ATTRIBUTED, not merely observed: V1 (row deleted) survives while V1b (wrong count in the SAME table) kills. So `extractCountsFromReadme` is live on rows that are present and blind to rows that are absent — it walks README→corpus and nothing walks corpus→README. A tag can silently vanish from the documentation. |
| A8 | A row can sit in the wrong count band | ATTRIBUTED: V2 (performance moved under the "robust pool (5+ entries)" heading, count left at 4) survives while V2b (same row, wrong count) kills. The count check is live; band membership is unchecked, so the README can contradict itself on the same line and stay green. |
| V6 | The single-entry count is stated TWICE and guarded ONCE | CONDUCTOR-ORIGINAL — not in the agent's sweep. ATTRIBUTED: V6 (line 55, "the remaining 21 appear on exactly one entry") survives while V6b (line 81, "The remaining 21 tags appear exactly once") kills. Same number, same file, one guarded instance and one not. The guard's regex happens to match one phrasing. |
| A9 A10 A11 | "16 tags appear on 2 or more entries", "4 tags have a robust pool", "12 tags appear 2–4 times" | These are corpus-derived integers of exactly the same kind as the two that ARE guarded ("37 distinct tags", "21 appear exactly once"). Nothing distinguishes them except which sentences someone happened to write a regex for. T-007 (retagging, live on the backlog) would falsify all three at once. |
| C1 | "ranks all 50 entries" in the Attribution section | Corpus size is machine-known. A one-line assertion, no prose frozen. |
| C2 | "8 are rated HIGH" vs docs/corpus-attribution-triage.md | Cross-file numeric claim, both sides machine-readable. Lower value than the rest (the triage doc is stable and human-owned) but the check is honest and cheap. |
| C5 | "(text, space, EM DASH, space, author)" | Checkable WITHOUT freezing prose: the README also carries the format as a literal — `` `<text> — <author>` `` with an actual U+2014 — and the binary's real `--list` output can be measured against that literal. The assertion is literal-vs-behaviour, not English-vs-behaviour. |
| C6 | Layout block names `src/select.js` | Every path named in the Layout block either exists on disk or it does not. Nothing brittle about it, and a rename is a plausible real edit. |

## BOUNDARY — deliberately NOT to be hardened

| id | Survivor | Why hardening it would be the wrong move |
|---|---|---|
| C3 | Flags table can claim `--tag` is a substring match | This is the most USER-VISIBLE lie in the whole sweep, and it is still a boundary. Conductor-measured this cycle: `--tag test` exits 1 with empty stdout while `--tag testing` exits 0, so `--tag` is genuinely whole-tag and the mutated cell is flatly false. But the only available test is "this Effect cell must contain the string 'Whole tag'", which freezes one English phrasing and would false-reject an honest reword ("matches the whole tag, ignoring case"). Cycle 4 classified M22 BOUNDARY on precisely this reasoning — only the wording changes, and no rule fixes the wording. Recorded loudly rather than quietly, because a reader of this list will reasonably ask why the worst-looking survivor is being left alone. |
| C4 | Exit codes table can misdescribe code `1` | Same shape as C3: the codes themselves are mechanical, the Meaning cells are prose. |
| C7 | "Node 18+" can become "Node 24+" | The sharpest case, and the reason this classification step exists. There is NO honest machine check available: the suite runs on whatever Node is installed (24 here), so no test in this repo can confirm the floor is really 18. A test asserting the string "18" would be a check that LOOKS like verification while verifying nothing — the exact failure class this run was chartered to remove. Settling it needs a CI matrix, which is a human/infrastructure decision, not a test. |

## Consequences for the backlog

The ten HOLEs are NOT ten items. They collapse by the kind of check that closes them:

- **T-014** — bidirectional + band-aware table guard. Closes A7, A8. Highest value: it is the
  only Class A structural blindness, and T-007 would walk straight into it.
- **T-015** — guard every corpus-derived integer in the Tag vocabulary section, keyed to the
  numbers rather than to specific sentences. Closes A9, A10, A11, V6.
- **T-016** — guard the cross-file and on-disk claims. Closes C1, C2, C6.
- **T-017** — check the `--list` format literal against the binary's real output. Closes C5.

All four are S-effort and all four touch `test/readme-tags.test.js`, so they are sequential by
construction — which costs nothing at gear 1's wave cap of 1.

Standing rule inherited from I-2b/I-2c and unchanged here: each resulting test must be proven
TWICE (L-029) — failable against its specific mutation, and attributable, i.e. removing it lets
that mutation survive. The mutations are already written down in this document and in the
harness, so the follow-up items have their failability targets pre-specified.
