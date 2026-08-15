'use strict';
const fs = require('fs');
const p = '/opt/targets/aphorism-cli/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(p, 'utf8'));

s.cycle = 22;

s.decisions.push({
  cycle: 22,
  what: 'All three of T-016\'s claims were guarded; C2 was NOT dropped, even though the item explicitly authorised dropping it honestly.',
  why: 'The item\'s permission was conditional -- "may honestly be dropped if it proves fiddly to parse; say so rather than forcing it" -- and the condition did not hold. I checked before dispatch rather than after: docs/corpus-attribution-triage.md parses structurally into 50 rows with ids 0-49 distinct and risk bands HIGH 8 / MEDIUM 16 / LOW 26, keyed on the first cell being a bare integer, which excludes the header and separator rows without depending on any wording. A conditional escape hatch that is taken without testing its condition is just a dropped requirement with a citation attached. Recorded because the opposite call -- dropping C2 and citing the item\'s own words -- would have looked equally authorised in the journal.',
});

s.decisions.push({
  cycle: 22,
  what: 'The R2 consistent-change check, invented at cycle 21 against the corpus, was generalised this cycle to THREE different kinds of ground truth: a source module (corpus.length), another document in the repo (the triage doc\'s HIGH count), and the filesystem itself (Layout paths).',
  why: 'Cycle 21 established that every other check asks whether a WRONG README is caught, and a guard hardcoding today\'s numbers passes all of them -- only changing the real artifact and the README TOGETHER, and requiring green, separates the two. T-016 is the first item where that question has three different answers, because its three claims are checked against three unrelated sources, and a guard could plausibly be derived for one and hardcoded for another. So the pair was run three times rather than once: corpus 50->51 with the README updated stays green (stale half fails naming C1); a triage row flipped MEDIUM->HIGH with the README updated stays green (stale half fails naming C2); a real new file plus its Layout line stays green (a Layout line for a file never created fails naming C6). All six halves landed as required. This matters concretely because T-007 (retagging) and any future corpus growth would walk a hardcoded guard straight into a false rejection on a CORRECT README, which a maintainer resolves by deleting the guard.',
});

s.decisions.push({
  cycle: 22,
  what: 'Conductor probe N1 found a false-rejection case and it was FILED as T-020 rather than fixed in-cycle; the probe existed only because the builder volunteered the weakness in its own report.',
  why: 'Two things worth recording. (1) The classification: rewording the Attribution aside to "8 of the 50 entries carry a rating of HIGH" -- every number still true -- fails the suite at 71/70/1 because the extraction takes the digit nearest BEFORE the marker and, with the em dashes gone, 50 sits nearer to HIGH than 8 does. That is a false REJECTION of an honest edit, not a silent hole: it fails loud and names the C2 test, so a maintainer who trips it is told what happened. Same direction, and therefore the same LOW classification, as T-018 at cycle 20. (2) The provenance: the builder\'s report named this exact edge case under "things I was unsure about" instead of omitting it, and that is the only reason I probed the dash-free word order at all. An honest uncertainty note converted directly into a measured backlog item, which is the behaviour the dispatch prompt asked for and got.',
});

const ki7 = s.known_issues.find(k => k.id === 'KI-7');
ki7.note_cycle_22 = 'NO occurrence this cycle, and that is evidence rather than luck. The cycle-21 remedy refinement was applied verbatim in the dispatch prompt -- it named the in-target scratch path AND required removing the scratch DIRECTORY itself, not merely its contents, calling out that an empty directory counts as debris and is checked. The builder honoured both: the standing SCOPE.SCRATCH control passed for the first time since the refinement was written (.swarm/runs/cycle-022-verify-T-016.txt), and the SWARM root carried no debris at orient either. The issue stays OPEN because one clean cycle does not close a structural hole -- the fence is still enforced by what the prompt says, and a prompt that forgot the line would reproduce it -- but the remedy is now measured to work, which is what the wrap-up distillation needs.';

s.counters.k_current = 5;
s.counters.wave_streak = 0;

s.last_cycle = {
  n: 22,
  work: 'test triage (one item, k_cap 1 at gear 1) -- T-016, guarding the three README claims that live outside the Tag vocabulary section and were checked by nothing: the corpus-size figure in Attribution (C1), the HIGH-risk count in Attribution (C2), and every path named in the Layout block (C6).',
  outcome: 'VERIFIED done. 23/23 conductor gate checks, zero failures (.swarm/runs/cycle-022-verify-T-016.txt). Suite 68 -> 71, pure insertion (186 added, 0 removed, every pre-existing byte an unmodified prefix); test_cmd on the real tree 71/71/0, run by me. Blindness MEASURED before dispatch (.swarm/runs/cycle-022-baseline.txt): all three claims survived at 68/68/0 while the paired control C0 killed, so the suite was provably live and provably blind to exactly these three. All three proven twice per L-029 with conductor mutations the builder never saw, in the opposite direction or on a different target (50->51 UP, 8->7 DOWN, bin/aphorism.js and the test/ entry). The decisive checks were the three R2 TRACKS/STALE pairs no acceptance clause asked for: the guard provably tracks corpus.length, the triage document, and the filesystem, rather than hardcoding 50 / 8 / a path list. R1 clean both directions, R5 confirms parse misses fail loud. C2 was kept in scope rather than taken up on the item\'s own permission to drop it. Residual filed as T-020 (false rejection, loud, T-018 class).',
  commit: 'PENDING',
};

fs.writeFileSync(p + '.tmp', JSON.stringify(s, null, 2));
fs.renameSync(p + '.tmp', p);
console.log('state.json written: cycle', s.cycle, 'decisions', s.decisions.length, 'k_current', s.counters.k_current, 'streak', s.counters.wave_streak);
