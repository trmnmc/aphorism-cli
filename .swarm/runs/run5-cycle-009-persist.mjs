// Cycle 9 step 7: persist state.json + backlog.json atomically (.tmp then rename).
import fs from 'node:fs';

const D = '/opt/targets/aphorism-cli/.swarm/';
const NOW_ISO = '2026-08-20T05:39Z';

const write = (name, obj) => {
  fs.writeFileSync(D + name + '.tmp', JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(D + name + '.tmp', D + name);
};

// ---------------- backlog ----------------
const b = JSON.parse(fs.readFileSync(D + 'backlog.json', 'utf8'));
const get = (id) => {
  const i = b.items.find((x) => x.id === id);
  if (!i) throw new Error('missing item ' + id);
  return i;
};

// Three taste findings, three ALREADY-FILED items. Zero ids minted: an independent
// instrument re-deriving a known gap is corroboration, not new work (the cycle-6 dedupe
// rule these items already cite). Labels say "run #5 cycle 9" in full because run #4's
// taste pass ALSO landed at its cycle 9 -- the exact ordinal ambiguity KI-36 records.
get('TS-1').notes += ' || THIRD INDEPENDENT RE-DERIVATION, run #5 cycle 9, by a fresh taste '
  + 'agent told not to read the journal, backlog or REPORT.md. Corroborated again; still not '
  + 'filed as new work. The agent felt the first repeat at use 12 (run #4\'s agent: also 12). '
  + 'CONDUCTOR-MEASURED INDEPENDENTLY at gate cells A2/A3/A4 and the draw is WORSE than either '
  + 'agent felt: in a fresh 40-draw sample the first repeat landed at use 3, with 24/40 distinct '
  + 'against a with-replacement expectation of 27.7; a 30-draw sample gave 22/30 against an '
  + 'expectation of 22.7 and reproduced the agent\'s reported 22/30 EXACTLY. Cell A4 is the '
  + 'must-live control: the same counter reports 40/40 on a deliberately repeat-free sequence, '
  + 'so the repeat counts are a property of the draw and not of the instrument -- a rotation '
  + 'implementation could not have produced any of these numbers. The agent independently '
  + 'reached run #4\'s recency-guard remedy ("at minimum never repeat the immediately previous '
  + 'draw"), from scratch. Three passes across three runs now agree, which is why this is the '
  + 'standing operator lever and not an open question.';

get('TS-3').notes += ' || THIRD INDEPENDENT RE-DERIVATION, run #5 cycle 9; corroborated, not '
  + 'filed. Conductor gate cell D1 re-measured from the shipped corpus module at run time: '
  + 'Dijkstra 7 + Perlis 5 + Pike 5 = 17/50 = 34% in three voices, 24 distinct authors over 50 '
  + 'entries -- the same figures as run #3, re-derived rather than copied. The agent reached it '
  + 'from a THIRD direction again (neither --author --list nor --list --json, but by noticing it '
  + 'could predict the attribution before the line printed, and that uses 8-10 were three Rob '
  + 'Pike lines in a row). It restates run #4\'s curation point in sharper terms: the pleasure '
  + 'is recognition, not discovery, because every line is one a working programmer already knows '
  + 'by heart -- so the surprise that makes fortune(6) fun is near zero.';

get('TS-6').notes += ' || RE-DERIVED at run #5 cycle 9; corroborated, not filed. Conductor gate '
  + 'cells B1/B2/C1 re-measured: `--tag testing` exits 1 with byte-exact stderr "aphorism: no '
  + 'aphorism matches those filters", the corpus has no "testing" tag but does have "debugging", '
  + 'and the message names neither the fold target nor the vocabulary; control cell B2 proves '
  + '--tag itself works (`--tag debugging` exits 0), so B1\'s exit 1 is about the vocabulary and '
  + 'not a broken flag; C1 confirms --help still offers only a jq pipeline and no direct '
  + 'tag-listing flag. What this pass adds is the WORST-CASE instance: "testing" is the single '
  + 'most natural tag a first-timer types, it was DELIBERATELY folded into "debugging" by an '
  + 'earlier decision, and the tool knows the fold and says nothing.';

// RF-5: a real, implementable narrowing of the window that left main red for a cycle.
// Filed todo (not blocked): this is engineering, not the P-7 scope ruling.
b.items.push({
  id: 'RF-5',
  title: 'The citation guard cannot fire on the commit that breaks it, so main is red for a whole cycle',
  kind: 'fix',
  status: 'todo',
  priority: 6,
  value: 'restores "green at every commit" (P-5) to something a pre-commit run can actually check',
  effort: 'S',
  model: 'sonnet',
  deps: [],
  files_hint: ['test/node-support-citation.test.js'],
  packages: [],
  attempts: 0,
  acceptance: 'The Node-support citation guard evaluates its cited diff against the WORKING TREE, '
    + 'not only against committed history, so a falsification still sitting unstaged is visible to '
    + 'the pre-commit suite run. Concretely: the guard today runs the README\'s cited `git diff '
    + '<base>..HEAD -- <paths>`, and HEAD by definition excludes uncommitted work, so the commit '
    + 'that breaks the citation always tests green and the NEXT full-clone run pays for it. Adding '
    + 'the base-to-worktree comparison (the same pathspec, no ..HEAD) closes that. Both arms must '
    + 'be proven: a must-die control where an uncommitted edit to a pathspec file is caught '
    + 'pre-commit, and a must-live control where an uncommitted edit OUTSIDE the pathspec (e.g. '
    + 'README.md itself) does not trip it. The existing skip-on-shallow behaviour must be '
    + 'unchanged -- verify CI still reports the guard as skipped, not failed.',
  notes: 'Filed run #5 cycle 9, from the red main this cycle repaired. NOT a new discovery of the '
    + 'MECHANISM -- README §Node support limit 2 (cycle 5) already records the transient-red '
    + 'window as intrinsic and knowingly accepted, and this cycle initially mis-framed it as a new '
    + 'instrument defect before reading that note. What IS new is the consequence nobody wrote '
    + 'down: "transient" only holds if the SAME commit repairs the citation, and nothing enforces '
    + 'that. Cycles 5 and 6 repaired in-commit by hand; cycle 8 bumped the CI actions and did not, '
    + 'so c9dd7ff sat red on a full clone for an entire cycle. Measured, not inferred: `git diff '
    + 'c08562b..057d00c -- src bin test .github` (cycle 8\'s PRE-commit HEAD) is EMPTY, which is '
    + 'why cycle 8\'s suite run reported 120/120/0 green, while the same diff against c9dd7ff '
    + 'carries the 2-line action bump. CI could not catch it either: it checks out shallow and the '
    + 'guard skips (the "1 skipped" in all four rows of run 32335038575). So no signal available '
    + 'to the breaking commit can observe the break. This item removes the hand-discipline '
    + 'dependency rather than relying on the next conductor remembering.',
  covers: ['KI-38']
});

write('backlog.json', b);

// ---------------- state ----------------
const s = JSON.parse(fs.readFileSync(D + 'state.json', 'utf8'));
s.cycle = 9;
s.phase = 'BUILD';

s.qa.last_taste_cycle = 9;
s.qa.taste_note_run5_cycle9 = 'TASTE pass RUN AT RUN #5 CYCLE 9 (fable judgment seat, dispatched '
  + 'as a direct Agent call per the headless workflow fallback). Verdict "wears-thin", 3 boredom '
  + 'findings, ZERO of severity "fundamental" -- so no decision entry re-aiming the clock at depth '
  + 'items was owed, and none was written. ORDINAL WARNING, per KI-36: run #4\'s taste pass also '
  + 'landed at ITS cycle 9, and the TS-1/TS-3/TS-6 notes already contain a "cycle-9 TASTE pass" '
  + 'label meaning run #4. Every label this run writes says "run #5 cycle 9" in full. THE RESULT '
  + 'THAT MATTERS: all three findings mapped onto already-filed blocked items (TS-1 repeat depth, '
  + 'TS-3 voice concentration, TS-6 tag discoverability). Zero backlog ids minted from the taste '
  + 'pass. A third independent pass across three runs re-deriving the same three gaps and finding '
  + 'no fourth is itself the evidence that the taste backlog is complete, not thin.';

s.counters.consecutive_no_value = 0;
s.counters.wave_autotune_note_cycle9 = 'Wave autotune NOT APPLIED. cycle.md scopes it to "after a '
  + 'build-wave\'s merges + verification complete"; this cycle\'s work type was qa-verify taste '
  + 'plus a conductor-authored doc repair, and no builder branch was merged. Same call and same '
  + 'reason as cycles 6 and 7. k_current stays 3, wave_streak stays 0. (Gear 1 pins k_cap at 1 '
  + 'regardless, so the credit would buy nothing but a wrong number -- the argument cycle 6 set.)';

s.known_issues.push({
  id: 'KI-38',
  severity: 'medium',
  status: 'open — RF-5 filed to close it',
  title: 'Nothing enforces that a commit falsifying the README citation also repairs it, so the '
    + '"transient" red window can last a full cycle. The guard reads base..HEAD and cannot see '
    + 'uncommitted work (so the breaking commit tests green), and CI skips the guard on its '
    + 'shallow checkout (so CI cannot see it either). Cycle 8 landed c9dd7ff touching .github and '
    + 'did not re-cite; main was red on a full clone until run #5 cycle 9 repaired it. The '
    + 'mechanism was already documented as knowingly accepted (README §Node support, limit 2, '
    + 'cycle 5); the unenforced same-commit-repair assumption underneath it was not.'
});

write('state.json', s);

console.log('backlog: ' + b.items.length + ' items; todo=' + b.items.filter((i) => i.status === 'todo').length
  + ' blocked=' + b.items.filter((i) => i.status === 'blocked').length
  + ' done=' + b.items.filter((i) => i.status === 'done').length);
console.log('state: cycle ' + s.cycle + ', last_taste_cycle ' + s.qa.last_taste_cycle
  + ', known_issues ' + s.known_issues.length + ', consecutive_no_value ' + s.counters.consecutive_no_value);
