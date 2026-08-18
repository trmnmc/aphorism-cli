
## cycle 53 — 2026-08-16T10:30Z — T-045: the cycle-7 gate finally became a test

**Work:** T-045 (kind `test`, S-effort, conductor-inline, zero agents).
**Outcome:** VERIFIED. Gate 9/9. Suite 84 -> 85, green 3/3. Coverage 27/29 -> 28/29 protected.

### the item, and why it was the right pick

Cycle 52's full-spec sweep left exactly two measured holes, **L5** and **L7**, and its handoff
noted that both trace to the same source: item **I-3, closed at cycle 7**. Cycle 7 settled six
rulings about `--list`/`--seed` and verified them by EXECUTING the shipped binary in a conductor
gate — 36/36 checks, including `--list` byte-identical across unseeded / `--seed 1` /
`--seed 999999`. It then wrote them into SPEC Domain rules and README. **That is a gate, not a
test.** It proved the behaviour on the day and left nothing behind that would notice a change.
45 cycles later the permanent suite still did not protect either ruling.

T-045 is the higher-priority of the two (p4 vs p5) and closes the L5 half:

```
bin/aphorism.js:  if (opts.list)  ->  if (opts.list && opts.seed === undefined)
```

so `--list --seed 1` stops listing and does a single seeded pick. **84 tests stayed green.**
Every pre-existing `--list` test invokes `--list` without a seed, so none of them can see this
mutation at all.

The mutant text is **pre-registered**: copied verbatim from
`.swarm/runs/cycle-052-rule-coverage.mjs` cell L5, where it was measured as a survivor of the
whole 84-test suite *before* this cycle's test was conceived.

### the discriminator, and the one judgment call in the test's shape

The obvious assertion is a line count — under the mutant `--list --seed 1` prints one aphorism
instead of ~50, so counting lines kills it cleanly and would pass every acceptance-shaped check.
It was **not** the assertion chosen. A line-count test sits GREEN on a seed that REORDERS or
RESAMPLES the same number of lines, which the rule forbids just as much. What the Domain rule
actually promises is that the seed reaches nothing: *"it accepts a valid `--seed` but ignores
it; no random selection occurs."* So the test asserts **byte-identity** of `--list` stdout
against the unseeded baseline across five seeds (`0`, `1`, `42`, `-7`, `999999`), with exit 0
and empty stderr. No implementation that lets the seed reach selection can hold that across five
seeds. This is the cycle-21/22 method — prefer the assertion on which the two readings actually
disagree — applied to a test rather than to a guard.

**Scope widened past the item's acceptance, deliberately.** The same SPEC sentence governs
`--list --json` (NDJSON) and the filtered form, and both travel the same `if (opts.list)` branch,
so both arms were folded into the same test. That is the cycle-8 boundary for a principled
widening — same defect class, same file, same edit, no new machinery — rather than an artificial
one. Leaving them out would have meant filing two further "measured holes" against the very rule
this cycle was opened to close. Recorded as a decision, not taken silently.

### VERIFICATION EVIDENCE — gate 9/9 (`.swarm/runs/cycle-053-verify-T-045.txt`)

```
PASS  CTRL-PRISTINE   unmutated copy 85 pass / 0 fail (85 tests)
PASS  A     live tree test_cmd: 85 pass / 0 fail (85 tests)
PASS  A2    test count is 85, expected 85 (84 at cycle 52 + 1)
PASS  DENOM pristine + skip-pattern: 84 tests (85 - 1 expected), 0 fail
PASS  L5-KILL   --list --seed does a single seeded pick instead of listing -> 84p/1f
PASS  L5-NAMES  failing: --list accepts a valid --seed and IGNORES it: output is byte-identical across seeds
PASS  L5-ATTR   same mutant, new test removed -> 84p/0f (survives, so the kill is the new test's)
PASS  NEG-L7    --list swallows every usage error -> 85p/0f — still an OPEN hole (T-046)
PASS  H     pristine copy green on 3/3 consecutive runs
GATE 9/9
```

`test_cmd` run by the conductor on the live tree, not reported by an agent:

```
ℹ tests 85   ℹ pass 85   ℹ fail 0   ℹ duration_ms 3802.517298
```

The two arms that carry the result are the two whose outcome the author does not control:
**L5-ATTR** (mutant + new test filtered out must SURVIVE — if anything else already caught L5,
the kill is not this test's to claim) and **NEG-L7** (the other measured hole must still be
open — a new test that quietly swallowed L7 would mean the coverage map is wrong about what
remains). **DENOM** pins what the skip-pattern removed (85 -> 84, green), per cycle 6: node's
`--test-skip-pattern` FILTERS matched tests out of the run rather than marking them skipped, so
the count is the measurement and the `skipped` counter is not.

Instrument note: every mutation run forces `--test-reporter=tap`, and an unparseable run reports
UNPARSEABLE explicitly instead of falling through into a verdict. Cycles 19, 23 and 52 each lost
time to `node --test` defaulting to the SPEC reporter; cycle 52's handoff warned about it by
name and the harness was written against that warning rather than rediscovering it.

### disclosed weakness in this cycle's evidence

**The conductor wrote the test and the gate that judges it.** Hard rule 2's central protection —
the builder never saw the check — **does not apply**, because the allocator authorises zero agent
burn (`allow_overall_pct` 0) and there was no builder to keep blind. Fifteenth consecutive
zero-agent cycle; same disclosure as cycles 51 and 52, and it does not weaken with repetition.

What carries the result instead: the mutant is pre-registered from a harness written a cycle
earlier for a different purpose, and the L5-ATTR / NEG-L7 arms are measurements whose outcome
the author cannot choose. What that does NOT fix: a test written by the same reader who
enumerated the clause can only protect the clause as that reader understood it.

### board

- **T-045** — done. Coverage map now **28/29 protected**; **T-046** (L7) is the single remaining
  measured hole, still filed with its mutant quoted verbatim.
- Board: 47 done, 7 todo, 2 blocked, 4 dropped. Known issues unchanged at 18 total, 11 open.
- Wave autotune NOT applied (no wave dispatched — nothing was measured about code capacity);
  `k_current` 5, `wave_streak` 0.
- `cycles_since_recycle` left at 25 — tripped, deferred, NOT reset, twenty-eighth consecutive
  cycle. WRAP_UP is one cycle away and produces a strictly better artifact of the same kind;
  left visible as an unpaid debt rather than quietly discharged. Recorded as a decision.
- Collision-scan not applicable: Node CLI, no browser surface, no classic scripts.
- Budget probe: `bin/swarm-budget.sh` REFUSED for the **fifty-second** consecutive cycle (KI-5),
  attempted rather than skipped per the standing cycle-14 rule. Refused before the command
  started, so `probe_failures` stays 0. `bin/swarm-notify.sh poll` SUCCEEDED (seventh
  consecutive) from cwd=/opt/swarm; `control.json` `pending[]` empty and no `inject` array.
- Gear 1 / guest / dial 0.3, unchanged. Weekly governor ceiling 3 has never been the binding
  constraint this run — the allowance is.
