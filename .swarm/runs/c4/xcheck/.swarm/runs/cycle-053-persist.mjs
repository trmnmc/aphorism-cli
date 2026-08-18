// cycle 53 persistence: atomic (.tmp then rename) writes of state.json and backlog.json.
import fs from 'node:fs';

const SW = '/opt/targets/aphorism-cli/.swarm';
const CYCLE = 53;

function atomic(file, obj) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`);
  fs.renameSync(tmp, file);
  console.log(`wrote ${file}`);
}

// --- backlog: T-045 done -----------------------------------------------------
const bl = JSON.parse(fs.readFileSync(`${SW}/backlog.json`, 'utf8'));
const t45 = bl.items.find((i) => i.id === 'T-045');
if (!t45) throw new Error('T-045 not found');
t45.status = 'done';
t45.done_cycle = CYCLE;
t45.notes = `${t45.notes}\n\nCLOSED cycle 53, conductor-inline (zero agents — the allocator's measured allowance is 0). One test added to test/cli.test.js asserting BYTE-IDENTITY of --list output across five seeds, plus the --list --json (NDJSON) and --tag-filtered forms of the same rule. Gate 9/9 (.swarm/runs/cycle-053-verify-T-045.txt): the pre-registered L5 mutant fails the suite by name (84p/1f), and with the new test filtered out the SAME mutant survives at 84p/0f, so the kill is attributable. NEG-L7 confirms T-046's hole is still open at 85p/0f. Suite 84 -> 85.`;

const counts = {};
for (const i of bl.items) counts[i.status] = (counts[i.status] || 0) + 1;
atomic(`${SW}/backlog.json`, bl);
console.log('board', JSON.stringify(counts));

// --- state -------------------------------------------------------------------
const st = JSON.parse(fs.readFileSync(`${SW}/state.json`, 'utf8'));
st.cycle = CYCLE;
st.phase = 'POLISH';
st.counters.consecutive_no_value = 0;
st.counters.consecutive_failures = 0;
st.counters.autotune_note_cycle_53 =
  'NOT applied. Fifteenth consecutive zero-agent cycle: no wave was dispatched, so nothing was measured about code capacity. Same reading as cycle 52. k_current stays 5, wave_streak stays 0. INERT this run regardless — effective wave size = min(k_current 5, gear cap 1) = 1.';

st.decisions.push({
  cycle: 53,
  what:
    "T-045's test asserts BYTE-IDENTITY of `--list` output across five seeds rather than a line count, and the same test was widened to cover the NDJSON and filtered forms of the rule that the item's acceptance did not name.",
  why:
    "Two calls. (1) The discriminator. A line-count assertion kills the pre-registered L5 mutant perfectly well (one pick vs ~50 lines), so it would have passed every acceptance-shaped check. It also sits GREEN on a seed that reorders or resamples the same number of lines — a mutation the rule forbids and the item exists to protect against. Identity is what the Domain rule actually promises (\"it accepts a valid --seed but ignores it; no random selection occurs\"), and no implementation that lets the seed reach selection can hold it across five seeds. Same reasoning as the cycle-21/22 consistent-change method: prefer the assertion the two readings disagree on. (2) The widening. `--list --json` and `--tag X --list` travel the same `if (opts.list)` branch and are governed by the same SPEC sentence, so they sit in the same edit at zero additional machinery — the cycle-8 boundary test for a principled widening (same defect class, same file, same edit) rather than an artificial one (needs a new mechanism). Leaving them out would have filed two more 'measured holes' against a rule this cycle was opened to close.",
});
st.decisions.push({
  cycle: 53,
  what:
    'cycles_since_recycle left at 25 for the twenty-eighth consecutive cycle — tripped, deferred, deliberately NOT reset.',
  why:
    "The RECYCLE cycle exists so a long run can hand off to a fresh session with clean context. WRAP_UP is one cycle away (threshold 1786878564, ~41 min from this cycle's start) and produces a strictly better artifact of the same kind — RETRO.md plus REPORT.md plus the distilled candidate lessons. Spending the run's last work cycle writing a handoff note for a session that will not exist would cost the only remaining opportunity to close a measured product hole. Left at 25 rather than reset so the outstanding recycle stays visible to the morning reader as an unpaid debt, not as something quietly discharged.",
});

st.qa = st.qa || {};
atomic(`${SW}/state.json`, st);
console.log('cycle', st.cycle, 'phase', st.phase, 'decisions', st.decisions.length);
