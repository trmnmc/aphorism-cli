"""Cycle 12 state/backlog writer. Kept as a cycle artifact so the edit is auditable.
Atomic: writes .tmp then os.replace. Re-parsed by the caller as the gate."""
import json, os

SW = '/opt/targets/aphorism-cli/.swarm/'

# ---- state.json -------------------------------------------------------------
P = SW + 'state.json'
s = json.load(open(P))
s['cycle'] = 12

for k in s['known_issues']:
    if k['id'] == 'KI-5':
        k['desc'] = (
            "SWARM playbook (SWARM/playbook/learnings.md) is over its documented cap: 31 lessons "
            "against a cap of 20. The three duplicate IDs are FIXED as of cycle 12 (moon's "
            "L-023/L-025/L-026 renumbered to L-034/L-035/L-036; repo-atlas keeps the originals). "
            "Root cause of the residual: bin/swarm-playbook.sh is not on the Bash allowlist, so "
            "validate/parse/append/record-applied/stats all refuse in a headless session. "
            "Scoped to item I-5; the cap half is now a human handoff, not a swarm task."
        )
        k['note_cycle_12'] = (
            "PARTIALLY REPAIRED, and the remainder is deliberately a handoff. Dedupe landed and is "
            "lossless: 31 lessons in, 31 out, bodies an identical multiset, the only changed bytes "
            "being 3 ID tokens + the next_id header (17/17 harness checks, 4 negative controls). "
            "The cap breach was NOT culled, for a reason worth recording: the README overflow rule "
            "is written for dropping ONE lesson on append, and extrapolating it to shed 11 at once "
            "would delete 5 of the file's [apply:]-bearing lessons including L-008, applied by 4 of "
            "the 4 runs in the ledger. Deleting cross-run memory on an extrapolated rule with no "
            "validator available is not a call the conductor should make unsupervised. "
            "NEW FINDING this cycle, and the most important one: the cap breach makes the playbook "
            "INERT, not merely untidy -- cmd_parse exits 2 on any validate output, so every future "
            "kickoff falls back to defaults and applies ZERO lessons until the count reaches 20. "
            "Established by READING bin/swarm-playbook.sh lines 125 and 140-142; the script was "
            "never executed -- that is the allowlist gap itself. Handoff note: "
            "playbook/HANDOFF-cap-2026-08-15.md, archive: playbook/learnings.md.pre-I5-1786803951."
        )

s.setdefault('decisions', []).append({
    "cycle": 12,
    "what": ("I-5 satisfied via acceptance clause 2 (lossless archive + named reason for handoff), "
             "not clause 1 (full repair). The duplicate IDs were repaired outright; the 20-lesson "
             "cap breach was left open and handed to a human with a computed drop-list."),
    "why": ("Clause 1 requires 'following the file's own documented overflow rule'. That rule drops "
            "ONE lesson per append invocation; there is no documented rule for shedding 11 at once, "
            "so claiming to have followed it would have been an overclaim of exactly the kind cycle 11 "
            "spent its budget removing from this repo. The extrapolation was computed anyway and "
            "measured: it drops L-003, L-006, L-007, L-008 and L-011 -- 5 of the file's [apply:]-bearing "
            "lessons, including the two most-applied lines in the ledger. A rule designed to shed one "
            "lesson produces a bad outcome at eleven. Deciding which 11 of 31 cross-run lessons to "
            "retire is a judgment about SWARM's own operating memory, made without a runnable validator; "
            "hard rule 5's fence exists for precisely this. Renumbering is reversible from the archive, "
            "deletion is not, so the reversible half was done and the irreversible half was handed off.")
})

tmp = P + '.tmp'
json.dump(s, open(tmp, 'w'), indent=1, ensure_ascii=False)
os.replace(tmp, P)

# ---- backlog.json -----------------------------------------------------------
B = SW + 'backlog.json'
b = json.load(open(B))
for it in b['items']:
    if it['id'] == 'I-5':
        it['status'] = 'done'
        it['notes'] += (
            " | CYCLE 12 OUTCOME: closed under acceptance clause 2, not clause 1. Duplicate IDs "
            "repaired losslessly (moon L-023/L-025/L-026 -> L-034/L-035/L-036, next_id 34 -> 37); "
            "byte-exact archive at playbook/learnings.md.pre-I5-1786803951; handoff at "
            "playbook/HANDOFF-cap-2026-08-15.md. The 20-cap breach is NOT fixed and is now owned by "
            "a human: the documented overflow rule covers one drop per append, not a bulk cull of 11, "
            "and the extrapolated cull would delete 5 [apply:]-bearing lessons. Verified 17/17 with "
            "4 negative controls (cycle-012-verify-I-5.txt)."
        )
b['items'] = b['items']
tmp = B + '.tmp'
json.dump(b, open(tmp, 'w'), indent=1, ensure_ascii=False)
os.replace(tmp, B)

print('state cycle', s['cycle'], '| decisions', len(s['decisions']))
from collections import Counter
print('backlog', Counter(i['status'] for i in b['items']))
