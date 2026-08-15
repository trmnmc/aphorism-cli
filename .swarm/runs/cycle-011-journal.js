'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = '/opt/targets/aphorism-cli';
const ts = execFileSync('date', ['-u', '+%Y-%m-%dT%H:%M:%S+00:00'], { encoding: 'utf8' }).trim();

const block = `
## cycle 11 | ${ts} | aphorism-cli | BUILD
work: I-4a, the repo-wide overclaim sweep and repair -- the other half of I-4's acceptance and
  the item cycle 10's handoff named. Why: gates 1 and 2 remain satisfied, must-have items remain
  todo, so step 4 gate 3 selects BUILD. Conductor-executed rather than dispatched: it is a prose
  edit to a product file whose correctness depends entirely on evidence produced by I-4b last
  cycle, and an agent handed "make the comment honest" without that measurement would have
  written a plausible hedge instead of a true statement.
gear: 1 (crawl), k_cap 1, demote true, promote blocked -- re-derived from runs/allocator.json,
  refreshed since cycle 10 (source=probe): posture trickle, allow_premium_pct 0,
  allow_overall_pct 0, weekly_used_pct 82.0, opus_used_pct 96, week_elapsed_pct 76.9, dial 0.3.
  weekly_heat 82.0/76.9 = 1.0663 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.9 =
  1.2484 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1.
probe: bin/swarm-budget.sh invoked and REFUSED by the permission layer -- TENTH consecutive
  cycle, KI-5 unchanged. probe_failures stays 0 on the standing reasoning: a command the harness
  never let start is not a probe that failed, and inflating the counter would trip the 3-strike
  back-off on evidence that does not exist.
control: bin/swarm-notify.sh poll REFUSED identically. Fell back to file-sourced state:
  runs/control.json has pending[] and applied[] both empty and no inject[] array. Nothing to
  apply, nothing to triage. Same honest limitation as every cycle this run: a command sent to
  the ntfy topic since cursor 1786793064 would not have been seen.
orient: tree clean at open. Backlog at open: 12 done / 5 todo / 1 blocked.
re-anchor: cycle 11 is not a %5 cycle, so no full SPEC re-read. Digest restated: improvement run
  on a shipped zero-dep Node CLI -- harden, document, repair, no new features. Corpus triage is
  the must-have in flight.
scope measurement (before touching anything): swept all 10 tracked product files for claim
  vocabulary. Exactly ONE real overclaim, and it is in a product file, not paperwork --
  src/corpus.js's header claimed "honest attribution" and asserted a policy: entries whose true
  author is uncertain "are attributed to Anonymous rather than guessing a famous name".
  REPORT.md was already honest (it names the attributions unaudited at lines 70-72 and 127-129);
  README.md did not overclaim, it was simply silent.
the claim is measurably FALSE, which is the finding: the corpus holds 50 entries across 24 named
  authors, and exactly ONE is hedged to Anonymous ("It's not a bug, it's an undocumented
  feature"). Meanwhile I-4b's triage rates 8 entries HIGH risk -- idx 0 Knuth, 3 Karlton, 10
  Dijkstra, 27 Beck, 38 Wheeler, 39 Hopper, 45 Stroustrup, 48 Kay -- every one of them a famous
  name attached to a disputed line. The file promised the exact behaviour it does not exhibit.
decision, recorded: the policy sentence was DELETED, not softened. A weakened version ("we
  generally hedge where attribution is unclear") would have preserved the false shape while
  sounding more careful, which is the worse outcome -- it reads as considered disclosure rather
  than as the unexamined boilerplate it actually was. The replacement states the epistemic status
  plainly (ATTRIBUTION IS UNVERIFIED; read every author field as "commonly attributed to") and
  points at docs/corpus-attribution-triage.md.
second edit, labelled honestly as an ADDITION not a correction: README.md gained an
  "## Attribution" section. I-4a's acceptance clause 1 did not oblige this -- the README never
  overclaimed. But the triage document is this run's main deliverable to a human and was
  reachable only by opening source comments or the internal REPORT.md. A truthful header no user
  ever reads does not discharge what the item exists to do.
VERIFICATION EVIDENCE -- harness .swarm/runs/cycle-011-verify-I-4a.js, full output in
  .swarm/runs/cycle-011-verify-I-4a.txt:
\`\`\`
PASS  C2 all non-edited product files byte-identical to HEAD  :: 8 files clean
PASS  C3 exactly the two intended product paths are modified  :: ["README.md","src/corpus.js"]
PASS  C4 corpus data deep-equal to HEAD (no entry added/dropped/reordered/edited)  :: 50 entries
PASS  C5 corpus.js bytes outside the header comment identical to HEAD
PASS  C6 README bytes outside the inserted section identical to HEAD
PASS  C7 the three false attribution claims are absent from corpus.js  :: hits: 0
PASS  N1 [negative control] C7 check fires on the OLD HEAD text  :: hits on HEAD: 3
PASS  C8 asserted "8 HIGH risk" matches the triage doc  :: measured 8
PASS  C10 every HIGH-risk entry names a real person  :: 1 of 50 hedged to Anonymous
PASS  C11 the removed claim is measurably false  :: 8 HIGH named, 1 anonymous
PASS  C15 CLI still runs; --seed 42 deterministic  :: "Bad programmers worry about the code..."
19/19 checks passed
\`\`\`
VERIFICATION EVIDENCE -- full test_cmd run directly by the conductor, not by any agent:
\`\`\`
$ node --test test/*.test.js
ℹ tests 59   ℹ pass 59   ℹ fail 0   ℹ cancelled 0   ℹ skipped 0   ℹ todo 0
\`\`\`
  59/59, identical to the pre-edit baseline -- expected, since both edits are prose and C4/C5
  prove the data and the executable bytes did not move.
harness defect caught and fixed BEFORE the gate was read, third cycle running: the first run
  reported 17/18, and the failure was MINE. C3 printed a changed path of "EADME.md". Cause:
  I called .trim() on the WHOLE porcelain output before splitting, which strips the leading space
  of the two-character status column on the FIRST LINE ONLY, shifting slice(3) one byte into that
  one filename. src/corpus.js was line 2 and came through clean, which is exactly what makes this
  class of bug dangerous -- it corrupts one entry and leaves its neighbours looking fine. Fixed by
  making the check STRICTLY MORE PRECISE, never looser: split before trimming, plus a new C3a
  asserting every porcelain line actually has the XY<space> shape the parse assumes. Had I read
  the FAIL as the deliverable's, I would have "fixed" a file that was never wrong.
the sweep result I THREW AWAY, and why it matters more than the one I kept: the first repo-wide
  I-4 clause-2 sweep returned "0 overclaiming sentences found" across 9 product files -- the
  answer I wanted. Its negative control did not fire. The detector could not find the overclaim I
  had just deleted, because the old text reads "honest // attribution" and the comment marker
  defeated \\s+ between the two words. So the zero meant only that the regex matched nothing,
  anywhere, ever. Discarded rather than banked; rewrote the detector to normalise comment markers
  first and proved it live against three controls (the exact old header, plus two synthetic
  overclaims) BEFORE re-reading its verdict. Second run: 0 hits, now admissible. A zero from a
  detector not shown capable of a one is not a zero -- and this one would have passed unnoticed,
  since a vacuous check and a genuine clean bill look identical in the output.
gate: I-4a PASS -> done. Also closes the I-4 umbrella -> done: clause 1 (risk-ranked list, reason
  each) landed cycle 10; clause 2 (no file describes the corpus as audited/verified/fact-checked)
  verified this cycle repo-wide over all 9 product files, not merely over the file I edited.
collision-scan: NOT RUN, and not applicable -- the standing gate covers browser targets built
  from classic non-module scripts. aphorism-cli is a Node CLI with no browser surface. Reported
  as not-run rather than as passed.
autotune: NOT applied, and for a different reason than cycle 10's. No build-wave was dispatched
  at all this cycle -- the work was conductor-executed -- and autotune keys on a wave completing.
  There was no wave to learn from. k_current stays 5, wave_streak stays 1; inert either way at
  gear 1's k_cap of 1.
KI-2: STILL OPEN, still high. Nothing was audited and no attribution changed. What changed is
  that the product stops asserting a confidence it never had: a reader is no longer told
  uncertain entries are hedged to Anonymous while 8 of them name famous people. KI-2 closes only
  when a human checks those 8 against primary sources (T-006, owner: human).
counters: consecutive_no_value 0 (verified value this cycle). backlog: 14 done / 3 todo /
  1 blocked, 18 live. known_issues unchanged in count (KI-2 high, KI-5 medium open).
outcome: 2 items verified. The run's original corpus-triage scope is now fully closed, honestly
  labelled, and discoverable by a human who never opens the source.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 12 picks I-5, the playbook repair (31 lessons against a documented cap of 20, three
  duplicate IDs). It is the last substantive item: T-005 is a FEATURE and this run's spec names
  rotation an explicit non-goal, T-006 is human-owned by construction, and I-6 is the report
  refresh that runs at WRAP_UP by design. I-5 is a hand edit against playbook/README.md's
  documented rules, since bin/swarm-playbook.sh stays un-invokable (KI-5) -- archive first,
  delete nothing without it, and expect to hand the file to a human rather than to fully repair
  it, since the duplicate IDs mean the file's own overflow rule cannot be applied unambiguously.
`;

fs.appendFileSync(ROOT + '/.swarm/journal.md', block);
console.log('journal block appended,', block.split('\n').length, 'lines');
