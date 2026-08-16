// cycle 49 — atomic persist of backlog.json and state.json.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/opt/targets/aphorism-cli';
const SW = path.join(ROOT, '.swarm');
const CYCLE = 49;

const atomic = (file, obj) => {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(tmp, file);
};

// ------------------------------------------------------------- backlog
const bl = JSON.parse(fs.readFileSync(path.join(SW, 'backlog.json'), 'utf8'));

if (bl.items.some((i) => i.id === 'T-041')) throw new Error('T-041 already exists');

bl.items.push({
  id: 'T-041',
  title: 'End-to-end gate on the SHIPPED binary\'s --tag behaviour after the T-007 retag',
  status: 'done',
  priority: 3,
  effort: 'S',
  kind: 'qa',
  model: 'conductor-inline',
  deps: ['T-007'],
  attempts: 0,
  files_hint: ['.swarm/runs/cycle-049-gate.mjs', '.swarm/runs/cycle-049-negative-control.mjs'],
  value: 'M',
  acceptance:
    'Spawn the real bin/aphorism.js as a child process and measure, for every one of the 12 live tags and every one of the 26 names T-007 retired: exit code, stdout bytes, stderr content, and — the discriminating part — that the entry actually printed carries the requested tag, and that --tag X --list reproduces the exact membership, count, corpus ORDER and documented line format. The 26 retired names must take the SPEC no-match path exactly (exit 1, zero bytes on stdout, human-readable stderr). Whole-tag and AND rules checked on the binary, not on filter(). Gate must be accompanied by a mutation arm in which each planted defect reddens the cells that should detect IT, attributed per-cell.',
  notes:
    'FILED AND CLOSED IN THE SAME CYCLE, stated plainly rather than presented as a pre-existing board item: this is the candidate the cycle-48 wakeup note recommended, not something the board already carried. It belongs on the board because it is genuine product QA — T-007 (cycle 46) was the one user-facing BREAKING change this run shipped, and until this cycle every gate pointed at it read the corpus module, the README, or a test fixture. Nothing had ever asked the shipped binary what a user typing `--tag testing` actually gets.\n\nRESULT: no defect found. 135/135 cells green, first run. The retag landed cleanly at the user-facing surface — all 12 live tags select correctly and only from their own pool, all 26 retired names take the documented no-match path, and the --help discovery recipe still yields exactly the live vocabulary. Reported as a confirmation, not as a repair.\n\nThe evidence that the green is worth something is the mutation arm (14/14, .swarm/runs/cycle-049-negative-control-out.txt), not the green itself: an all-green instrument that has never been shown to fail is indistinguishable from one that cannot fail. Each mutation is required to redden the cells that should detect IT — a kill by an unrelated cell is scored a MISS.',
});

// T-040 already exists to carry retag consequences a human must ratify; the
// discoverability observation belongs there rather than in a new feature item
// (suggesting renames would be a FEATURE, which this run's non-goals forbid).
const t040 = bl.items.find((i) => i.id === 'T-040');
if (!t040) throw new Error('T-040 not found');
t040.notes = (t040.notes || '') +
  '\n\n|| CYCLE 49 — one further consequence for the human, MEASURED end-to-end rather than reasoned about. All 26 retired tag names now take the generic no-match path: exit 1 and the single line "aphorism: no aphorism matches those filters" on stderr. That is exactly what the SPEC Domain rule requires and the gate confirms it (arm B, 78/78 cells), so it is NOT a defect. But it is a usability consequence a human should rule on: a user whose `--tag testing` worked before cycle 46 is told only that nothing matched, never that the name became `debugging`. Cell C5 measured that a retired name and a never-existing name (`zzzznotatag`) are byte-identical in exit code, stdout and stderr — so the product genuinely cannot distinguish "you used the old name" from "you made that up". Emitting a "did you mean" hint would be a FEATURE and is fenced by this run\'s non-goals; it is recorded here as a decision for the owner, not taken. Evidence: .swarm/runs/cycle-049-gate-out.txt.';

atomic(path.join(SW, 'backlog.json'), bl);

// --------------------------------------------------------------- state
const st = JSON.parse(fs.readFileSync(path.join(SW, 'state.json'), 'utf8'));
st.cycle = CYCLE;

st.qa = st.qa || {};
st.qa.last_e2e_cli_gate_cycle = CYCLE;
st.qa.e2e_cli_gate_note =
  'Cycle 49 ran an END-TO-END gate on the shipped binary (135/135, 14/14 mutation arm). Deliberately NOT recorded as last_full_qa_cycle: that field means the qa-verify.js workflow (spec-author -> executor -> live-look), which was not run and cannot be, since the allocator authorises zero agent burn. Recording conductor-inline work in the workflow\'s field would misreport which instrument produced the evidence. last_full_qa_cycle stays 13.';

st.counters.autotune_note_cycle_49 =
  'NOT applied: zero agents dispatched, so the wave produced no evidence about code capacity. k_current 5, wave_streak 0, both unchanged. ELEVENTH consecutive zero-agent cycle.';
st.counters.churn_note_cycle_49 =
  'consecutive_no_value stays 0. SEVENTEENTH consecutive verified-value cycle — and unlike cycles 42-48, AN ITEM LANDED (T-041), with the caveat that the item was filed this same cycle rather than drawn from the standing board. That is disclosed in the item notes rather than smoothed over. What is different in kind from the last three cycles: this one measured the PRODUCT, not a document about the product. Cycles 46-48 refreshed REPORT.md and RETRO.md; this cycle spawned the shipped binary 200+ times and asked what a user actually gets. Nothing a CLI user can observe CHANGED — the finding is that nothing needed to change, which is a weaker headline than a repair and is stated as such.';

st.decisions.push({
  cycle: CYCLE,
  what:
    'Verify the T-007 retag at the SHIPPED-BINARY surface rather than starting a seventh README-guard narrowing or re-refreshing a current hand-off document.',
  why:
    'The cycle-48 note fenced both alternatives: T-024b/T-032/T-039 are held by the cycle-39 family decision, T-024 is not dispatchable, T-008/T-040 are gated on a human, and both hand-off documents were refreshed at cycles 47-48 so refreshing either again would be manufactured work. The remaining honest option was the one gap no gate had touched: T-007 retired 26 tag names that used to work, and every check pointed at that change so far read the corpus module, the README or a fixture. The user-facing question — what does a user typing a retired tag actually get — had never been asked of the process. It needed no agent, which matters at a measured zero allowance.',
});

atomic(path.join(SW, 'state.json'), st);

console.log('backlog items:', bl.items.length, '| T-041 status:', bl.items.find((i) => i.id === 'T-041').status);
console.log('state cycle:', st.cycle, '| decisions:', st.decisions.length);
const by = {};
for (const i of bl.items) by[i.status] = (by[i.status] || 0) + 1;
console.log('board:', JSON.stringify(by));
