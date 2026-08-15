'use strict';
// Cycle 11 persistence: backlog + state updates, written atomically (.tmp then rename).
const fs = require('fs');
const ROOT = '/opt/targets/aphorism-cli/.swarm';

const writeAtomic = (p, obj) => {
  fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(p + '.tmp', p);
};

// ---- backlog -------------------------------------------------------------
const bp = ROOT + '/backlog.json';
const b = JSON.parse(fs.readFileSync(bp, 'utf8'));
const get = (id) => b.items.find((i) => i.id === id);

const i4a = get('I-4a');
i4a.status = 'done';
i4a.notes += ' || DONE cycle 11, conductor-executed. Two edits, both prose: (1) src/corpus.js header — '
  + 'the claim "honest attribution" and the policy sentence "where the true author is uncertain ... the entry is '
  + 'attributed to Anonymous rather than guessing a famous name" were REMOVED, not softened, because I-4b measured '
  + 'them false (1 of 50 hedged to Anonymous vs 8 HIGH-risk entries all naming famous people: Knuth, Karlton, '
  + 'Dijkstra, Beck, Wheeler, Hopper, Stroustrup, Kay). Restating a policy the file does not follow, in weaker '
  + 'words, would still have been fiction. Replacement states attribution is UNVERIFIED and points at the triage. '
  + '(2) README.md gained an "## Attribution" section — this one is an ADDITION, not a correction: the README did '
  + 'not overclaim, it was simply silent, leaving the triage doc undiscoverable to the only reader who matters. '
  + 'Gated 19/19 incl. 3 negative controls; corpus data deep-equal to HEAD; suite 59/59.';

const i4 = get('I-4');
i4.status = 'done';
i4.notes += ' || UMBRELLA CLOSED cycle 11 — both acceptance clauses verified, each with its own evidence. '
  + 'Clause 1 (risk-ranked list with a stated reason each) closed by I-4b cycle 10. Clause 2 (no file describes the '
  + 'corpus as audited/verified/fact-checked) closed by I-4a cycle 11 and verified by a REPO-WIDE sweep over all 9 '
  + 'product files, not just the edited one. Method note worth keeping: the first sweep returned "0 hits" and was '
  + 'DISCARDED rather than banked, because its negative control did not fire — the detector could not even find the '
  + 'text I had just deleted ("honest // attribution" defeated \\s+ across the comment marker). The rewritten '
  + 'detector fires on the exact old header plus two synthetic overclaims, and only then was its 0-hit result '
  + 'admitted as evidence. A zero from a detector that has not been shown to be capable of a one is not a zero.';

writeAtomic(bp, b);

const tally = b.items.reduce((a, i) => ((a[i.status] = (a[i.status] || 0) + 1), a), {});
console.log('backlog:', JSON.stringify(tally));

// ---- state ---------------------------------------------------------------
const sp = ROOT + '/state.json';
const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
s.cycle = 11;
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
// Wave autotune NOT applied: no build-wave was dispatched this cycle (conductor-executed
// prose edit). Autotune keys on a wave completing; there was no wave. k_current/wave_streak
// unchanged, and inert anyway at gear 1 (k_cap 1).

const ki2 = s.known_issues.find((k) => k.id === 'KI-2');
ki2.note_cycle_11 = 'STILL OPEN, still high, and deliberately so. I-4a removed the repo\'s false CLAIM about '
  + 'attribution quality and pointed both src/corpus.js and README.md at the triage; it changed no attribution and '
  + 'confirmed no quote. What changed is that the product now tells the truth about what it does not know — a '
  + 'reader is no longer told the uncertain entries are hedged to Anonymous when 8 of them name famous people. '
  + 'KI-2 closes only when a human checks the 8 HIGH entries against primary sources (backlog T-006, owner: human).';

s.decisions.push({
  cycle: 11,
  what: 'removed the corpus.js attribution-policy claim outright rather than rewording it, and added a README '
    + 'Attribution section the item did not strictly require',
  why: 'Two judgment calls worth recording. (1) The header did not merely overstate — it described a hedging '
    + 'policy the file does not follow (1 of 50 hedged vs 8 HIGH-risk named attributions). A softened version '
    + '("we generally hedge...") would have preserved the false shape while sounding careful, which is the more '
    + 'dangerous failure: it reads as a considered disclosure. Deleting the policy claim and stating the actual '
    + 'epistemic status is the only honest option. (2) The README did NOT overclaim, so clause 1 of I-4a\'s '
    + 'acceptance did not oblige an edit there. I added the section anyway and am labelling it an addition rather '
    + 'than a correction: the triage document is the run\'s main deliverable to a human and was reachable only by '
    + 'reading source comments or the internal REPORT. A truthful corpus header that no user ever opens does not '
    + 'discharge the duty the item exists to serve.',
});

s.last_cycle = {
  n: 11,
  work: 'I-4a — repo-wide overclaim sweep and repair (conductor-executed, k=1, gear 1, prose-only edits to '
    + 'src/corpus.js and README.md); closes the I-4 umbrella',
  outcome: '2 items verified (I-4a + I-4 umbrella); 19/19 harness checks incl. 3 negative controls; repo-wide '
    + 'sweep 0 overclaims across 9 product files with a detector proven live by 3 negative controls; corpus data '
    + 'deep-equal to HEAD; suite 59/59 green',
  commit: 'pending',
};

writeAtomic(sp, s);
console.log('state: cycle', s.cycle, '| phase', s.phase, '| no_value', s.counters.consecutive_no_value);
console.log('decisions:', s.decisions.length, '| known_issues:', s.known_issues.length);
