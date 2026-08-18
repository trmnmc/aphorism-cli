const fs = require('fs');
const p = '/opt/targets/aphorism-cli/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(p, 'utf8'));

s.decisions.push({
  cycle: 44,
  what: 'The run is measured as NEITHER done NOR stalled, and the distinction is recorded rather than left implicit: definition-of-done IS met (all six improvement must-haves closed and conductor-verified, gate S3) while the target is NOT done, because T-008 still passes the value ratchet on a measured user-visible defect.',
  why: 'cycle.md churn breaker makes DONE a two-part test -- definition-of-done met AND no remaining candidate passing the ratchet -- and it would have been easy, and wrong, to read the first half as the whole test and declare the target done six hours early. Declaring DONE would have routed this run to an early WRAP_UP, disarmed the pacer, and told the human the product was finished when a corpus of 50 gives a repeat by use ~9.6. The opposite error was equally available: reading twelve item-less cycles as a stall. Neither holds (S9, S10), so the run continues to the clock. Recorded because both errors are attractive at 05:00 with an empty allowance, and both are visible only if the two-part test is applied literally.'
});

s.decisions.push({
  cycle: 44,
  what: 'CORRECTION to a claim this run repeated at cycles 41, 42 and 43 -- that all six remaining todos need a builder because the allowance is 0. Measured per item: three of the six are S-effort, which gear 1 explicitly admits. The gear is not their binding constraint; the cycle-39 family decision (T-024b, T-032) and T-039 own filing terms are.',
  why: 'The two constraints imply DIFFERENT human actions, and the conflated version implies the wrong one. "The allowance is 0" invites the inference that a healthier window restarts the whole board; for the three S-effort items it does not -- they are fenced by a measured decision that a seventh narrowing of the prose-anchored README guards costs more than it buys, and they unfence only when the M-effort T-024 umbrella lands or a BOUNDARY is argued. The old framing was true of the RUN and false of the ITEMS. Caught by gating the claim rather than by restating it, which is the point of gating claims the conductor itself authored.'
});

s.decisions.push({
  cycle: 44,
  what: 'The gate REFUTED the conductor first draft of its own central claim, and the claim was restated to the measurement rather than the regex being widened to fit the claim. A second instrument defect was caught the same way.',
  why: 'Draft S8 asserted all three S-effort todos carry the cycle-39 family decision marker. It came back RED: T-039 does not carry it. The cheap repair was to loosen the pattern until three matched, which would have manufactured a uniformity the board does not have. Instead the claim was split to what is actually there -- two held by the standing decision (S8a), one by its own filing terms as a T-024 member (S8b) -- with the consequence-bearing claim they DO share stated separately (S8c: all three name T-024 as the instrument) and armed with a two-way discriminator (N1a/N1b: neither M/L todo carries either marker, so neither check can pass vacuously). Then R4 read RED at exactly one byte because the strip regex left the inserted section trailing newline behind. Rather than accept a self-repaired regex on faith, R5 re-reaches the same conclusion via git numstat, a route that does not involve the regex at all. Two instrument defects in one cycle, both found by controls rather than by reading.'
});

fs.writeFileSync(p + '.tmp', JSON.stringify(s, null, 2));
fs.renameSync(p + '.tmp', p);
console.log('decisions now: ' + s.decisions.length + ' (cycle-44 entries: 3)');
