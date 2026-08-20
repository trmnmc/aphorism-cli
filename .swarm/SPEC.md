# SPEC — aphorism-cli

<!-- REWRITTEN 2026-08-20T14:36Z for IMPROVEMENT RUN #6 (allocator auto-kickoff,
     source=allocator, mode=guest, dial=0.30, posture=trickle,
     brief: "TRICKLE POSTURE: housekeeping only — harden tests, fix playbook items,
     polish docs — no new features. Haiku-priced work types; no new features.").

     SIXTH consecutive run under this exact brief. Runs #1-#5 each closed every
     must-have they set; their must-haves (I-*, J-*, K-*, M-*, P-*) are preserved in git
     history, REPORT.md, docs/report-history.md and RETRO.md, and are NOT restated here.
     The PRODUCT spec (Idea / Product must-haves / Domain rules / Taste notes) is
     UNCHANGED and carried forward verbatim in substance.

     STRESS-TEST VERDICT: RESHAPE (confidence 7). Three of four attack lenses landed.
     This is the sixth lap; run #5 reached DONE at cycle 11 with ~19.4h of 24 unspent and
     said so in its own report; all 8 surviving backlog items are BLOCKED on human rulings
     an agent must not make; and L-045 — a lesson written FROM THIS REPO — says a satisfied
     spec behind a brief-locked backlog means DONE, not another housekeeping lap.

     The defence that held is narrow, measured, and it is NOT a manufactured chore: run #5's
     own RETRO filed two house-rules proposals about README bloat ("this run's README grew
     6.0 KB -> 16.6 KB in a night, and the growth is citation bookkeeping a first-time
     reader of a 50-aphorism CLI meets before they meet the tool"; "prose that restates one
     number three ways is a guard-satisfaction artifact, not writing"). NEITHER was actioned,
     because the run closed DONE the same cycle it wrote them. Repairing damage SWARM itself
     caused is not churn — it is precisely what "polish docs" names in the brief.

     And it converts the brief's other unfalsifiable heading into a measurement. The bloated
     prose is GUARD-SHAPED: it exists in that form because regex guards read it. So moving it
     does not merely tidy the README — it MEASURES whether each guard is anchored to a
     structural marker the document owns (L-043) or to the prose itself. A guard that breaks
     when honest prose is restored has just reported its own defect. That is "harden tests"
     with a falsifiable acceptance instead of a reading exercise.

     TASTE JUDGE (fresh subagent, spec text only): use-twice 4 / product-not-demo 8 /
     scope-fits-night 8 / one-memorable-thing 6. Verdict: "Worth the night as scoped — the
     work is honest, bounded, and hard-checked — but the load-bearing axis is use-twice:
     this is the sixth consecutive housekeeping run on a finished 50-entry toy, and the
     strongest reading of it is that the README stops lying about its own test count, not
     that anyone reaches for the CLI again."
     RECORDED AS DISSENT FOR THE THIRD CONSECUTIVE RUN, and the conductor still cannot act
     on it: every candidate that would move use-twice is a new user-visible feature, excluded
     by the allocator brief. The brief is the operator's to change, not the swarm's. Note the
     judge scored this run HIGHER than run #5's (product-not-demo 6 -> 8, scope 9 -> 8,
     verdict moved from "worth running only if the operator declines to lift the brief" to
     "worth the night as scoped") — the difference is that this run repairs a real regression
     instead of inventing a chore. See "Expected shape of this run". -->

## Idea

A tiny, zero-dependency Node CLI that prints one random attributed programming aphorism.
`fortune(6)`, but curated for programmers. 50 entries, 24 authors, 12 tags, 121-test suite,
green on Node 18/20/22/24. Shipped since run #1.

Improvement run #6 changes NOTHING a user of the CLI invokes. It repairs the documentation
and the guards around it.

## Audience

Two audiences, and run #5 optimized for the wrong one:

- **(a) A first-time reader** of a 50-aphorism CLI's README — wants to know what it prints
  and which flags exist, and meets ~95 lines of autonomous-build-run journal before they get
  there.
- **(b) A future SWARM run or auditor** verifying what earlier runs claimed — genuinely needs
  every one of those provenance paragraphs, and needs them checkable.

Both are real. The defect is that (b)'s apparatus was written into (a)'s document. Nothing
below deletes provenance; it moves it to where (b) will look and (a) will not trip over it.

## The measured problem this run exists to fix

Measured at kickoff, 2026-08-20T14:36Z, against HEAD `3a17cc5`:

1. **README.md is 16,609 bytes / 309 lines** for a tool whose whole product surface is one
   command and six flags. It was **6,022 bytes** before run #5 — a 2.76x growth in one night.
2. **README.md lines 205-299 hold FIVE stacked blockquotes** headed
   `> **Updated 2026-08-20 (cycle 3)**`, `(cycle 10)`, `(cycle 5)`, `(cycle 6)`, `(cycle 9)` —
   ~95 lines, **out of chronological order**, each narrating an individual build cycle of an
   autonomous run. This is a run journal that leaked into a user-facing README.
3. **The Node-support section contradicts itself.** Its matrix table (README:186-191) reports
   `121 tests` on all four Node majors. Its closing paragraph (README:306-308) claims the
   suite prints `# tests 120` and that "The count moved with the suite again (119 -> 120)".
   Locally measured truth at kickoff: **121 tests, 121 pass, 0 fail, 0 skipped** (full clone).
   Two claims about one number, 115 lines apart, in one section, disagreeing.
4. **README:71 and README:93 restate one number three ways** — "12 tags appear on 2 or more
   entries. On the other side of that count, 0 tags appear exactly once, which is to say 0
   tags sit on exactly one entry" — diagnosed by run #5's own retro as prose padded to satisfy
   a regex guard rather than written for a reader.

## Must-haves

<!-- The PLAN gate (cycle.md step 4) holds until every box below is covered by a backlog
     item. Checked off only after conductor verification, never by claim. -->

- [ ] **Q-1 EXTRACT.** The five `Updated 2026-08-20 (cycle N)` blockquotes move **verbatim and
      byte-complete** out of `README.md` into a dated file under `docs/`, in chronological
      order, with a one-line README pointer to it. README's Node-support section keeps the
      LIVE citation and its two standing limits, rewritten as plain prose rather than as a
      changelog. Acceptance, all four: zero occurrences of that blockquote form in
      `README.md`; every moved line present byte-identically in `docs/`; `README.md` at least
      5,000 bytes smaller; suite green with **zero tests weakened**.
- [ ] **Q-2 THE GUARDS ARE THE EXPERIMENT.** Every guard that breaks under Q-1 is repaired
      **at its anchor** — never by restoring prose to feed a regex, which is opening a gate by
      weakening it (hard rule 2). Each break is classified **guard-defect** (bound to prose ->
      re-anchor to a structural marker the document owns, per L-043) or **real-claim-loss**
      (the moved text carried a claim the README must keep -> keep the claim). Report BOTH
      columns, and also name the guards that did NOT break — a guard that survives honest
      prose is evidence about that guard, and it is the control (L-044).
- [ ] **Q-3 THE STALE COUNT.** Audit the Node-support section in BOTH directions — doc->code
      and doc->doc (L-043's enumerate-every-direction clause). Every count claim in it
      resolves to a measured value. Then add or extend a check so that a count claim in that
      section **cannot silently disagree with the matrix table it sits under**. The check must
      be shown failable AND attributable (L-029) and paired with a converse control that must
      stay green (L-044).
- [ ] **Q-4 THE PADDED SENTENCE.** Re-anchor the tag-vocabulary guard to the structural marker
      it should have read (the table), then restore ONE honest sentence at README:71 and
      remove the restatement at README:93. Price the fix on TRUE inputs against an unfixed
      baseline column and report both (L-043) — a fix that closes holes while false-rejecting
      honest sentences is a trade to argue, not a win.
- [ ] **Q-5 INVARIANTS, every commit.** Suite green at **>= 121 tests**; zero features; zero
      new dependencies; `src/corpus.js` byte-identical to `3a17cc5`; `--help` output
      byte-identical. Any commit that cannot hold these is reverted before the cycle commits
      (hard rule 4).
- [ ] **Q-6 THE PLAYBOOK ITEM, EXACTLY ONCE.** Do **not** re-derive the allowlist escalation.
      L-045 was written from this repo and says: escalate the locked lever ONCE, do not spend
      the clock re-deriving it. Already discharged at this kickoff, in one read:
      `swarm-playbook.sh` carries no entry under ANY of the 11 `swarm-*` allow forms in the
      live `/opt/swarm/.claude/settings.json`; `parse` was denied this session (#34) and the
      step-5 settings write was denied (#35); `HANDOFF-allowlist-2026-08-17.md`'s stated ask
      is unchanged and still correct. **This must-have is closed by that paragraph.** The only
      remaining work is the ledger line and one report line — no further investigation.

## Nice-to-haves

- `README.md` back under ~9,000 bytes without losing a single checkable claim.
- The extracted provenance file cross-links to `docs/report-history.md` (142 KB) so the two
  audit trails are reachable from each other.
- A one-line "what this section is for" opener on any README section that exists primarily to
  satisfy a guard — run #5's own house-rules proposal, unactioned.

## Non-goals

- No new flags, features, output formats, or dependencies. The CLI's behaviour is frozen.
- No corpus text, author, or tag edits — `src/corpus.js` is byte-identical or the commit is
  reverted.
- No weakening of any test, guard, assertion, or claim to open a gate. The only honest path to
  green is making the claim true.
- No edits to SWARM's own `settings.json`, `bin/`, `reference/`, `workflows/` or `templates/`
  (hard rule 5) — including the allowlist gap this run re-confirmed.
- No ruling on the 8 blocked backlog items (T-006, T-040, TS-1, TS-2, TS-3, TS-6, J-7, P-7).
  Every one needs a human decision; an agent inventing one is the failure mode.

## Domain rules

Unchanged from run #1 and restated here only as the invariants Q-5 binds:

- Exit `0` success, `1` no match, `2` usage error, `3` output could not be delivered.
- `--author` is a case-insensitive literal substring match on the author field: no
  accent-folding, no Unicode normalization. `--tag` is a whole-tag case-insensitive match.
- `--author` and `--tag` narrow together (AND, not OR).
- `--seed <n>` is deterministic for any value `Number()` parses to non-NaN.
- `--list` prints the filtered set in corpus order as `<text><space><EM DASH><space><author>`,
  one per line; with `--json` it emits NDJSON, one object per line.
- A reader hanging up (broken pipe) is not an error: exit `0`, nothing on stderr.

## Definition of done

Q-1 through Q-6 each verified by the conductor running the check itself, with real command
output pasted into the journal — never by an agent's claim (hard rule 2). Suite green at
>= 121 on the final HEAD, Actions matrix green on the final HEAD, `README.md` measurably
smaller with every checkable claim preserved and every count claim measured, and both columns
of the Q-2 guard classification published in `REPORT.md`.

**Then stop.** When Q-1..Q-6 close and the only survivors are the 8 human-blocked items, the
target is DONE — go DONE in that cycle rather than manufacturing a seventh lap (L-045).

## Expected shape of this run

SHORT, and that is the honest outcome rather than a failure. Q-6 closed at kickoff. Q-1
through Q-4 are bounded edits with hard acceptance; Q-2's guard cascade is the only genuinely
unbounded edge, and it is bounded in practice by the number of guards that read README prose
(`test/readme-tags.test.js`, `test/node-support-citation.test.js`, `test/citations.test.js`).
Estimate 3-5 cycles against a 24-hour clock at gear 2 / k_cap 2.

The escalation, stated ONCE and not to be re-derived (L-045): **the highest-value change
available to this repo is corpus depth and no-repeat rotation (TS-1/TS-2/TS-3), and it is
locked out by the allocator brief's "no new features".** Four independent taste judges across
runs #3-#6 have now named the same thing. This is an operator lever, not a swarm one.

## Commands

- run: `node bin/aphorism.js`
- test: `node --test test/*.test.js`

## Spec digest

- IMPROVEMENT RUN #6 on a shipped zero-dep Node CLI — repair the README regression run #5
  caused and measure the guards that shaped it; no new features, no new deps
- must: the five `Updated 2026-08-20 (cycle N)` run-journal blockquotes (README:205-299, ~95
  lines, out of order) move verbatim to `docs/`; README >= 5,000 bytes smaller; zero tests
  weakened (Q-1)
- must: every guard that breaks is repaired AT ITS ANCHOR, never by restoring prose; each
  classified guard-defect vs real-claim-loss, both columns reported, survivors named as the
  control (Q-2)
- must: Node-support section audited doc->code AND doc->doc; the `tests 120` vs `121` internal
  contradiction fixed to a measured value; a count claim there can no longer silently disagree
  with its own matrix table, failable + attributable + converse-controlled (Q-3)
- must: tag-vocabulary guard re-anchored to the table, one honest sentence restored, fixed-vs-
  unfixed columns on true inputs reported (Q-4)
- must: suite green >= 121 every commit, zero features, zero new deps, `src/corpus.js` and
  `--help` byte-identical (Q-5)
- must: the playbook allowlist item is CLOSED at kickoff by one read — escalate once, never
  re-derive (Q-6, L-045)
- expected shape: 3-5 cycles; early DONE is the honest outcome, not a failure
- escalation (3rd consecutive run, 4th independent taste judge): corpus depth / no-repeat
  rotation is the highest-value change and is locked out by the brief — operator lever
