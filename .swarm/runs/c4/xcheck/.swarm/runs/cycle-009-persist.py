"""Cycle 9 persist: backlog + state, each atomic, with a parse check of all three
state files as the LAST step (the cycle-8 defect: Edit reports a successful string
replacement, which is not the same as a valid JSON file)."""

import json
import os

TARGET = '/opt/targets/aphorism-cli/.swarm'
RUNFILE = '/opt/swarm/runs/current.json'

I8_NOTES_APPEND = (
    " || CLOSED cycle 9. One test added to test/cli.test.js: '--list --json emits "
    "newline-delimited JSON, one object per line, in corpus order'. It asserts three "
    "things a weaker test would not: line count EQUALS the filtered-set size (an equality, "
    "not the floor the pre-existing --list test used), every line parses STANDALONE as a "
    "JSON object with text/author/tags (no line of a multi-line array can), and the parsed "
    "texts match corpus order. Suite 58 -> 59. || VERIFIED cycle 9 by a conductor harness "
    "authored at verification time and never shown to the builder "
    "(.swarm/runs/cycle-009-verify-I-8.js, evidence .swarm/runs/cycle-009-verify-I-8.txt, "
    "24/24 pass). Proven twice per L-029: FAILABLE (M16 applied -> fail=1 and the ONLY "
    "failing test is the new one) and ATTRIBUTABLE in the strict form (M16 applied + the "
    "new test filtered -> tests 58 / pass 58 / fail 0, exactly the pre-cycle baseline the "
    "harness re-measured from HEAD rather than took from the builder). Controls: "
    "DENOMINATOR (pattern removes exactly 1 of 59 against pristine source, 58 green), "
    "SKIP-SANITY (an unrelated mutation still fails under the same pattern), and "
    "MUTATION-APPLIED on every scratch copy -- the last one matters most, because a "
    "mutation that silently failed to apply would make the ATTRIBUTABLE check pass "
    "VACUOUSLY, which is a pass-shaped false result. Three DISCRIMINATORS the new test also "
    "kills: a COMPACT single-line JSON array (still valid JSON, still every entry in order), "
    "REVERSED NDJSON order, and TRUNCATED NDJSON with the last entry dropped. The latter two "
    "also trip the pre-existing M12/M13 --list tests, which is the expected length/order "
    "overlap cycle 5 recorded, not a defect -- the claim is that the NEW test is among the "
    "failures, and it is. Product tree byte-identical to HEAD (bin/aphorism.js, src/args.js, "
    "src/select.js, src/corpus.js all compared against HEAD); git diff --name-only HEAD = "
    "test/cli.test.js alone. The I-2 hardening thread is now complete: every HOLE survivor "
    "from cycle 4's sweep is closed, and M22 remains BOUNDARY and unhardened as classified."
)

DECISIONS = [
    {
        "cycle": 9,
        "what": (
            "Wave autotune IS applied this cycle (wave_streak 0 -> 1) even though the item "
            "ran as a single direct Agent call rather than through the build-wave Workflow, "
            "reversing the reasoning cycle 8 used to skip it."
        ),
        "why": (
            "Cycle 8 declined to autotune on the ground that a direct Agent call is not a "
            "build-wave. That reasoning was really about the ITEM KIND -- cycle 8's item was "
            "docs, which is not a build-wave item under any dispatch mechanism. This cycle's "
            "item is kind 'test', i.e. build-class code, dispatched through the documented "
            "headless substitute for build-wave (Workflow is review-gated in a -p session, so "
            "direct Agent calls with strictly disjoint file scopes are the sanctioned "
            "fallback). Keying autotune on the dispatch MECHANISM rather than the work type "
            "would mean a headless run can never learn its wave size, which is not what the "
            "rule is for. Recorded rather than taken silently because it is a visible "
            "departure from last cycle's stated reasoning. INERT either way this run: "
            "effective wave size = min(k_current 5, gear cap 1) = 1, and gear 1 is "
            "structurally fixed because week_resets_at (1786942799) falls after stop_at "
            "(1786879464). The streak is being carried for a future run on a healthier window."
        ),
    },
    {
        "cycle": 9,
        "what": (
            "HARD RULE 5 DEVIATION BY A SUBAGENT, caught and cleaned: the builder created its "
            "mutation scratch copies under /opt/swarm/.scratch/ -- a SWARM path outside the "
            "runs/ and playbook/ write fence -- rather than under the system temp dir. It "
            "removed the copies itself; the conductor removed the leftover empty directory."
        ),
        "why": (
            "Worth recording because the prompt did NOT hand the agent a SWARM path: it was "
            "given target paths only, exactly as hard rule 5 requires. The agent reached a "
            "SWARM path anyway, almost certainly because the session cwd IS /opt/swarm, so a "
            "relative scratch path lands inside the fence by default. That makes it a "
            "STRUCTURAL hole rather than a prompt defect -- the fence is enforced by what "
            "agents are told, and cwd silently supplies what they were not told. No harm "
            "here (the writes were scratch copies of the target, nothing under bin/, "
            "reference/, workflows/ or templates/ was touched, and the tree is clean), but "
            "the same reflex on a different task could write into SWARM tooling mid-run. "
            "Candidate lesson for the wrap-up distillation: builder prompts should name an "
            "explicit scratch location outside the repo, since 'do not write to SWARM' is "
            "not something the agent can honor if it does not know where it is standing. "
            "The conductor's own harness used os.tmpdir() and left nothing behind."
        ),
    },
]


def load(p):
    with open(p) as f:
        return json.load(f)


def atomic(p, obj):
    tmp = p + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    os.replace(tmp, p)


# --- backlog -----------------------------------------------------------------
bl = load(f'{TARGET}/backlog.json')
found = False
for it in bl['items']:
    if it['id'] == 'I-8':
        assert it['status'] == 'todo', f"I-8 expected todo, found {it['status']}"
        it['status'] = 'done'
        it['notes'] = it['notes'] + I8_NOTES_APPEND
        found = True
assert found, 'I-8 not found in backlog'
atomic(f'{TARGET}/backlog.json', bl)

counts = {}
for it in bl['items']:
    counts[it['status']] = counts.get(it['status'], 0) + 1

# --- state -------------------------------------------------------------------
st = load(f'{TARGET}/state.json')
st['cycle'] = 9
st['phase'] = 'BUILD'
st['decisions'].extend(DECISIONS)
st['counters']['consecutive_no_value'] = 0
st['counters']['consecutive_failures'] = 0
st['counters']['wave_streak'] = 1
st['last_cycle'] = {
    'n': 9,
    'work': (
        'I-8 -- hardened --list --json against mutant M16 (direct Agent, sonnet, k=1, '
        'file scope test/cli.test.js only) + conductor mutation/attribution harness'
    ),
    'outcome': (
        '1 verified; 24/24 harness checks green including 3 discriminators and a '
        'MUTATION-APPLIED control on every scratch copy; suite 58 -> 59 green; product '
        'tree byte-identical to HEAD; I-2 hardening thread complete'
    ),
    'commit': 'PENDING',
}
atomic(f'{TARGET}/state.json', st)

# --- parse check: all three state files, as the LAST step (cycle-8 lesson) ----
for p in (f'{TARGET}/state.json', f'{TARGET}/backlog.json', RUNFILE):
    with open(p) as f:
        json.load(f)
    print(f'parse OK: {p}')

print('backlog counts:', counts)
print('I-8 status:', [i['status'] for i in bl['items'] if i['id'] == 'I-8'][0])
print('decisions:', len(st['decisions']))
print('wave_streak:', st['counters']['wave_streak'])
