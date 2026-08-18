// cycle-013 — backlog persistence. Conductor-authored, run once at step 7.
import fs from 'node:fs';

const p = '/opt/targets/aphorism-cli/.swarm/backlog.json';
const b = JSON.parse(fs.readFileSync(p, 'utf8'));
const CYCLE = 13;

// --- J-7 gains its fifth human-owned ruling (D-44) -------------------------
const j = b.items.find((i) => i.id === 'J-7');
if (!j) throw new Error('J-7 not found');

j.title =
  'Five CLI behaviours are unspecified and a human should rule on them (from J-6 + N-4 + D-44)';

j.acceptance = j.acceptance.replace(
  'A human rules on two behaviours the Domain rules do not currently decide',
  'A human rules on FIVE behaviours the Domain rules do not currently decide (two enumerated inline below; three more — D-42, D-43, D-44 — enumerated in the notes and written up in SPEC.md § Undecided behaviours)'
);

j.notes +=
  "\n\n|| CYCLE 13, RUN #3 review-fix pass: a FIFTH ruling joins this item. (5) EMPTY FLAG VALUE, '=' FORM vs SPACE FORM (D-44). Reviewer-found, then independently reproduced by an adversarial verifier, then re-measured by the conductor. Shipped behaviour: --author '' returns exit code 0 and prints an aphorism (--author '' --list piped to wc -l gives 50, identical to --list piped to wc -l, i.e. the whole corpus); --author= returns exit code 2; --tag '' returns exit code 1; --tag= returns exit code 2. Mechanism: src/args.js:83-86 (the equals branch) deliberately rejects an empty value, while the space branch at src/args.js:106-124 checks only for a missing next token or one that looksLikeFlag(), so it assigns the empty string at line 121. The verifier ruled UNDECIDED, not a violation, and the reasoning is recorded in SPEC.md D-44: Exit-codes calls a missing flag argument bad usage and the equals-branch rejection is a deliberate line of code (arguing defect), but a shell passing '' DID supply an argument, and the space-form results follow mechanically from two clauses the SPEC does state — substring containment necessarily matches everything on an empty needle, whole-tag equality necessarily matches nothing. Two stated clauses point opposite ways and none names empty values. NO CODE CHANGE WAS MADE, and independently of the ruling none should be made by the swarm: either direction changes shipped user-visible CLI behaviour, which this run's non-goals forbid." +
  "\n\n|| COUNT DEBT CREATED BY THIS EDIT, DECLARED RATHER THAN PAID (cycle 13). Raising this item from four behaviours to five makes REPORT.md § 'J-7: Four CLI behaviours...' (line ~1300) stale by one. It is NOT repaired in this cycle: this cycle's verification gate was sealed before dispatch and does not cover REPORT.md, and an unverified document edit smuggled in at persist time is exactly the discipline this run exists to hold. Filed as R-2, which also picks up three PRE-EXISTING stale mentions this cycle discovered but did not create (REPORT.md lines ~1062, ~1230, ~1244 all still say 'two behaviours', against a backlog title that has said four since cycle 4). Cycle 12 repaired the § heading alone and did not sweep the body — the same decay class, one layer down.";

// --- R-1: the unfixed reproduced finding, filed so nothing is dropped ------
b.items.push({
  id: 'R-1',
  title: 'Structural reshape of the README acknowledgement guard (the recorded T-024 answer)',
  kind: 'fix',
  status: 'todo',
  priority: 5,
  effort: 'M',
  value: 'M',
  model: 'sonnet',
  deps: [],
  attempts: 0,
  filed_cycle: CYCLE,
  files_hint: ['test/readme-tags.test.js'],
  packages: [],
  acceptance:
    "The guard formerly named 'README should acknowledge single-entry tag limitation' stops deriving its verdict from marker phrases positioned inside an English sentence, and instead reads a STRUCTURAL marker the document owns. Traceable to a measured survivor: the cycle-13 verifier re-reproduced cells D4a/D4b (acknowledgement stripped, in-section decoy left behind -> guard SILENT) against a green 118/118 baseline, and additionally showed that a sentence DENYING the property outright ('Never worry that a tag might appear on exactly one entry — that cannot happen here.') also passes the guard. Any replacement must be measured against the FOUR-cell regression set recorded in the comment block above the test (C0 silent; D1/D3/E3 must NOT fire on honest READMEs; D4a/D4b must fire) and must not be a fourth regex narrowing — three prior narrowings produced two new false rejections while the silent hole survived.",
  notes:
    "Filed at cycle 13 from the review-fix pass as an UNFIXED REPRODUCED FINDING, per the review-fix contract (nothing silently dropped). Cycle 13 deliberately did NOT fix it: the verifier's recommended action was document_only, and the conductor's disposition was to rename the test to match its body rather than narrow the matcher — the matcher was left byte-identical under a sealed hash, precisely so this reshape stays available as honest future work rather than being half-done. NOTE THE PREMISE SHIFT that makes this lower-value than it looks, measured at cycle 13 from src/corpus.js: the corpus now holds 12 distinct tags and ZERO tags on exactly one entry, so the 'limitation' the guard was built to protect does not currently exist. The guard is retained only because a human ruling on T-040 (corpus retag consequences) could reintroduce single-entry tags. Score it against the two-question ratchet before dispatching — a user notices nothing either way, and it may be more honest to RETIRE the guard than to reshape it.",
});

// --- R-2: the count debt, including what this cycle created ---------------
b.items.push({
  id: 'R-2',
  title: 'Reconcile every J-7 behaviour-count claim in REPORT.md against the backlog (K-4 regression)',
  kind: 'docs',
  status: 'todo',
  priority: 3,
  effort: 'S',
  value: 'M',
  model: 'haiku',
  deps: [],
  attempts: 0,
  filed_cycle: CYCLE,
  files_hint: ['REPORT.md'],
  packages: [],
  acceptance:
    "Every count claim about J-7 in REPORT.md matches the backlog item's actual enumeration (five as of cycle 13), or is explicitly re-labelled as a dated history claim. Known stale sites measured at cycle 13: line ~1300 section heading says 'Four'; lines ~1062, ~1230 and ~1244 each say 'two behaviours'. The line ~1062 case needs care rather than find-and-replace — it QUOTES J-7's acceptance string, so the honest repair is to fix the quoted source and the quotation together, or to mark it as a quotation of a superseded revision. Verified under a gate sealed BEFORE the file is touched, with a baseline proving the gate fails on the unrepaired tree.",
  notes:
    "Filed at cycle 13. This is a live K-4 regression — 'no count claim in README.md, REPORT.md or docs/ is false' — and it is the SAME decay class the run has now measured four times (V-1 cycle 11; V-7 cycle 12; the review-fix bookkeeping correction at cycle 12; and this). Cycle 12's gate assertion B6 caught the section heading and flipped it to 'Four'; it did not sweep the body, so three older 'two behaviours' mentions survived underneath the repair. Cycle 13 then raised the true count to five by routing D-44 here, and declared that debt instead of paying it unverified. PRIORITY 3, above R-1: a false count in the maintainer-facing report is exactly what must-have K-4 forbids, and it is S-effort.",
});

fs.writeFileSync(`${p}.tmp`, JSON.stringify(b, null, 1));
fs.renameSync(`${p}.tmp`, p);

const c = {};
for (const i of b.items) c[i.status] = (c[i.status] || 0) + 1;
console.log(`backlog written: ${b.items.length} items ${JSON.stringify(c)}`);
console.log(`J-7 title now: ${j.title}`);
