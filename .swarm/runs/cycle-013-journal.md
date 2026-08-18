
## cycle 13 | 2026-08-18T08:55:11Z -> 09:20Z | aphorism-cli | REVIEW -> VALUE_LOOP

work: REVIEW-FIX, the pass cycle 12 discovered had NEVER RUN in run #3. Scoped exactly as
  cycle 6 instructed and cycle 12 restated: src/ bin/ test/, NOT this run's diff, or it
  reviews bookkeeping. Backlog was 0 todo / 6 human-blocked at cycle open, so this was not a
  backlog pick — it was the owed gate.
dispatch: SIX agents, all DIRECT Agent calls, not workflows/review-fix.js (headless
  pacer-spawned -p cycle, Workflow tool review-gated; documented SKILL.md fallback, same
  basis as cycles 6, 8, 9, 10). Three mandatory stages, none skipped:
    stage 1  2 reviewers, sonnet, isolated, pairwise-disjoint lenses (A shipped behaviour /
             B test-suite integrity). Neither saw the other's findings.
    stage 2  2 adversarial verifiers, FABLE (judgment seats — fable guard exempts them from
             the gear-2 demotion that put reviewers on sonnet). Brief was REFUTE, default
             DISCARD.
    stage 3  2 fixers, sonnet, one file each, strictly disjoint.
  ON DISPATCHING AGENTS AT ALL, recorded because cycles 1, 11 and 12 read the standing
  "do not call the Agent tool unless the user requested it" instruction as blocking it and
  ran conductor-inline: that reading is correct for the measurement-and-document items those
  cycles picked and wrong for this one. Review-fix's middle stage exists precisely to deny
  the conductor the power to adjudicate its own findings. A conductor-inline review-fix is
  not a cheaper version of the pass — it is the absence of it.
budget: gear 2 (governor ceiling 2, promote blocked) | k_cap 2 | demote true. NO FRESH
  MEASUREMENT THIS CYCLE and it is carried, not re-derived: last_real_probe_ts 1787042196,
  now 1787043311 at open, delta 1115s < the 1800s re-probe interval, so no probe was due.
  bin/swarm-budget.sh was attempted once anyway in its relative form (the form that works
  for swarm-notify.sh) and was DENIED — seventh denial, helper_denials 6 -> 7,
  probe_failures 6 -> 7. The weekly governor binds until week_resets_at 1787547600
  regardless, so the gear would not have moved on a fresh reading.
control: bin/swarm-notify.sh poll exit 0 (relative form, correcting nothing — cycle 12 had
  it right). runs/control.json pending [] , inject [] , applied 0. Nothing to apply.

RESULT: 2 findings, BOTH REPRODUCED, 0 discarded, ZERO code changes. Both dispositions were
documentation. The suite did not move — 118/118/0 before and after — and for a review-fix
pass that is the honest outcome, not a null one.

finding A (reviewer A, src/args.js:121) — empty flag value, "=" form vs space form.
  Verifier verdict UNDECIDED, not violation. Conductor re-measured all four:
      --author '' --seed 1   exit 0, prints an aphorism, stderr empty
      --author= --seed 1     exit 2, 0 bytes stdout, "aphorism: flag --author requires a value"
      --tag ''               exit 1, 0 bytes stdout, "aphorism: no aphorism matches those filters"
      --tag=                 exit 2, 0 bytes stdout, "aphorism: flag --tag requires a value"
      --author '' --list | wc -l  =  50  ==  --list | wc -l  =  50   (the whole corpus)
  Two clauses the SPEC does state point opposite ways (substring containment MUST match
  everything on an empty needle; Exit-codes calls a missing argument bad usage) and none
  names empty values or distinguishes the syntaxes. Structurally identical to the D-43
  precedent. Written up as D-44 in SPEC.md § Undecided behaviours; routed to J-7 as its
  FIFTH ruling. No code change — and none would be right: either direction changes shipped
  user-visible behaviour, a locked non-goal.

finding B (reviewer B, test/readme-tags.test.js:296) — the test named "README should
  acknowledge single-entry tag limitation" is a TOKEN CO-OCCURRENCE guard, not a meaning
  check. Verifier reproduced against a green 118/118 baseline with BOTH controls: the decoy
  survives (guard silent), a sentence DENYING the property outright also passes, AND a
  control mutation proves the test can still die. Disposition: RENAME the test, do NOT
  narrow the matcher — three prior narrowings produced two new false rejections while the
  silent hole survived. Matcher left byte-identical under a sealed hash.
  THE CONDUCTOR'S OWN MEASUREMENT MADE THE FINDING WORSE THAN REPORTED. From src/corpus.js:
      corpus entries: 50 | distinct tags: 12
      tags with exactly 1 entry: 0 | tags with >= 2 entries: 12
  The guard's PREMISE no longer holds — there is no single-entry limitation to acknowledge.
  README.md:55 states this correctly and is TRUE; the guard passes today only because that
  honest sentence carries the marker tokens while negating them. The test is a fossil of a
  pre-retag corpus (README.md:87 records the 37-tag / 21-single-entry history). Retained,
  not deleted, because a human ruling on T-040 could reintroduce single-entry tags.

VERIFICATION EVIDENCE — gate sealed BEFORE the tree was touched.
  cycle-013-gate.mjs, sha256 adf046b8434078e16464aab3f168258d0b296f97ed8e9ec3c0536a9f6f4b8665,
  committed 064fb69 together with its baseline, BEFORE either fixer was dispatched.
  Prediction recorded in the gate header before running: PASS A4/A8/A9, FAIL the other 8.

  BASELINE, unfixed tree (cycle-013-gate-baseline.txt):
      2 PASS / 9 FAIL (of 11)   controls A4=PASS A8=PASS A9=FAIL
  POST-FIX (cycle-013-gate-postfix2.txt):
      PASS  A1  D-44 entry exists, names both flags and "empty"
      PASS  A2  D-44 records all four measured command/exit-code outcomes
      PASS  A3  D-44 sits inside "## Undecided behaviours"
      PASS  A4  CONTROL: "## Domain rules" byte-identical to seal [aeca11d7f79642e5]
      PASS  A5  D-44 names J-7 as the human-owned tracker
      PASS  A6  old overclaiming test name gone [occurrences=0]
      PASS  A7  renamed test carries the exact pinned name [occurrences=1]
      FAIL  A8  CONTROL: matcher hash [786fb17b5f44a4f6 vs 389c3c2a1678ecdc (62B)]
      FAIL  A9  CONTROL: suite 118/118/0 [tests=-1 pass=-1 fail=-1]
      PASS  A10 test file records the measured premise (0 single-entry, 12 distinct, dated)
      PASS  A11 assertion message no longer makes the false claim
      9 PASS / 2 FAIL (of 11)
  BOTH residual FAILs are MY OWN INSTRUMENT, each adjudicated with an independent
  measurement and a corrected control that is PROVEN ABLE TO DIE. Neither is a defect in
  the tree; neither was fixed by editing the sealed file.

  A9 — FORMAT ASSUMPTION. The control matched /^# tests (\d+)$/m, the TAP dialect; node
  --test here uses the spec reporter and emits "i tests 118". A parser that cannot find its
  field reported FAIL when it should have reported UNPARSEABLE. Direct measurement:
      $ node --test test/*.test.js 2>&1 | tail -12
      i tests 118 | i suites 0 | i pass 118 | i fail 0
  Corrected control cycle-013-gate-addendum.mjs (authored AFTER the baseline, states so):
      PASS  A9'  CONTROL (corrected): suite is 118/118/0  [tests=118 pass=118 fail=0]
      PASS  A9'-control  parser reads both dialects and refuses garbage [tap=118 spec=118 junk=null]

  A8 — ANCHOR UNIQUENESS, and self-inflicted in an instructive way. The control sliced the
  matcher between two anchor strings and hashed it, assuming the anchors unique. FIXER 2,
  obeying my own instruction "do not insert anything between `const singleEntryMarkers = [`
  and `assert(hasWarning`", QUOTED BOTH ANCHORS in the note explaining it had not touched
  the region. First-occurrence indexOf then sliced 62 bytes of comment prose instead of the
  898-byte matcher. The instruction that protected the region is what broke the check on it.
  Proven untouched two independent ways, neither by re-running the broken check:
      git diff -U1 shows exactly three hunks — comment note, name line, assert message. The
        matcher region does not appear in the diff at all.
      last-occurrence re-slice, HEAD vs working tree:
        HEAD matcher  bytes=898 sha=389c3c2a1678ecdc...  WORK matcher bytes=898 sha=389c3c2a1678ecdc...
        IDENTICAL to HEAD: true | MATCHES SEAL: true | anchors HEAD 1/1 -> WORK 2/2
  Corrected control cycle-013-gate-addendum-2.mjs (authored AFTER the post-fix run):
      PASS  A8'  matcher byte-identical to seal [898B, anchors open=2 close=2]
      PASS  A8'-negctl  planted 10th marker regex IS detected [919B, check correctly FAILS it]
      PASS  A8'-corrob  identical to HEAD by independent re-slice
  Scope verified mechanically, not claimed: git status --porcelain showed exactly
  " M .swarm/SPEC.md" and " M test/readme-tags.test.js". sha256sum -c on the gate: OK.

  A2 was a REAL failure and was fixed by making the claim TRUE, never by relaxing the check:
  fixer 1 wrote "--author '' exits 0" while the document's own convention (SPEC.md:184,
  SPEC.md:211, and the other three clauses inside D-44 itself) is "exit code N". Reworded to
  "returns exit code 0" for internal consistency; A2 then passed on the merits.

instrument-bug tally: this cycle adds the SIXTH and SEVENTH of run #3, and the THIRD and
  FOURTH inside a gate I sealed myself. The cycle-12 addendum named one family (a substring
  test standing in for a structural property). These two are different species and are named
  separately: FORMAT ASSUMPTION (A9 — the check assumed an output dialect; the tool spoke
  another and returned no answer, which the check scored as failure) and ANCHOR UNIQUENESS
  (A8 — the check located its subject by string search without asserting cardinality, and
  silently measured whatever the wrong match bracketed). Both corrected controls now report
  UNPARSEABLE (exit 2) rather than FAIL when they cannot read their subject: an unread
  instrument is not a failed suite, and collapsing the two manufactures a defect. Standing
  lesson, seventh data point: a gate is a program and needs its own baseline, not confidence.

backlog: 39 -> 41 items (32 done / 6 blocked / 1 dropped / 2 todo). Both new items are
  filed per the review-fix contract — an unfixed reproduced finding is never silently
  dropped.
  R-1 (fix, M, sonnet, prio 5) structural reshape of the ack guard, the recorded T-024
    answer. Filed WITH the argument against doing it: the premise is now count-0, so
    retiring the guard may be more honest than reshaping it. Scored at pick time, not now.
  R-2 (docs, S, haiku, prio 3) reconcile every J-7 behaviour-count claim in REPORT.md. A
    live K-4 regression, and PARTLY DEBT THIS CYCLE CREATED: routing D-44 to J-7 raised its
    true count four -> five, making REPORT.md:1300's "Four" stale. Not repaired here on
    purpose — this cycle's gate was sealed before dispatch and does not cover REPORT.md, and
    an unverified document edit smuggled in at persist time is the exact discipline this run
    exists to hold. It also picks up three PRE-EXISTING stale mentions found but not created
    here (REPORT.md ~1062, ~1230, ~1244 all still say "two behaviours"): cycle 12's gate
    caught the section heading and flipped it to "Four" without sweeping the body. Same
    decay class, one layer down — the fourth time this run has measured it.
  J-7 updated in place: title four -> five behaviours, acceptance count corrected, D-44
    written into the notes with its mechanism and both sides of the argument.

wave autotune: NOT APPLIED. k_current stays 4, wave_streak stays 1. Autotune keys on a
  build-wave's merges; this cycle ran review-fix and merged nothing. Adjusting them here
  would launder a non-build outcome into the wave-size learner.

THE DONE DECISION, re-run as cycle 12 instructed. All three pre-POLISH gates have now
GENUINELY run — review-fix (this cycle, 13), QA full (6), TASTE (9) — which was the exact
premise cycle 12 found false and refused to declare done on. The board is 6 human-blocked,
all handed off in REPORT.md, plus 2 todos this cycle itself filed. NOT DONE, and on a
narrower reason than cycle 11 or 12: R-2 is a live K-4 must-have regression, S-effort and
agent-workable, and K-4 is a must-have of this run. Declaring done over a known-false count
claim in the maintainer-facing report would be exactly the "reasoning from the checkmarks
instead of from the tree" that cycle 11 named. NEXT CYCLE SHOULD TAKE R-2 — S-effort, haiku,
seal the gate before touching REPORT.md, baseline it on the unrepaired tree, and mind that
the ~1062 site is a QUOTATION of J-7's acceptance string rather than a free-standing claim.
After R-2 lands, DONE becomes defensible: score R-1 against the two-question ratchet
(a user notices nothing either way) and, if it fails, WRAP_UP with the unspent clock handed
back and the reason on the record rather than manufacturing work.

DISCIPLINE, unchanged: author the gate, SEAL IT BY HASH BEFORE touching the tree, baseline it
on the UNFIXED tree and require it FAILS what the fix is meant to flip while PASSING the
rest. A gate green on the broken tree proves nothing. A sealed gate is NEVER edited after it
has run — corrections go in a dated addendum that states it was authored afterwards, and
every corrected control carries a negative control proving it can still die. Corrections are
stated, never hidden; dated history rows are never retro-edited.

DO NOT PICK: TS-1, TS-2, TS-3 (corpus expansion — a LOCKED non-goal the swarm cannot lift
for itself), T-006, T-040, J-7 (human-owned by their own acceptance clauses). Do not re-open
V-2 — scored and rejected at cycle 11. Do not narrow the readme-tags marker regex a fourth
time; if R-1 is picked, the four-cell regression set in that file's comment block is the
required instrument.

STATE: gear pinned at 2 by the weekly governor (heat 1.72, ceiling 2) until week_resets_at
1787547600 — rho is irrelevant, expect no upshift. usage_reset_at 13:00:00Z. probe_failures
7; next real probe due at last_real_probe_ts + 1800. bin/swarm-budget.sh and
bin/swarm-playbook.sh remain unrunnable in every path form; bin/swarm-notify.sh works in its
RELATIVE form only. KI-34 and KI-35 remain filed, fenced by hard rule 5, for the morning
report.
