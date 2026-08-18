import json, os, subprocess, time

SWARM = '/opt/swarm'
T = '/opt/targets/aphorism-cli'
RF = SWARM + '/runs/current.json'
JR = T + '/.swarm/journal.md'

now = int(time.time())
r = json.load(open(RF))

# step 0.4 increment, recorded here at persist time
r['cycles_since_recycle'] = 8

# step 9: base 90s after a VALUE cycle. gears never touch the delay.
wake = now + 90
stop_epoch = 1787111308
assert wake + 900 <= stop_epoch, 'hard rule 8 clamp violated'
r['heartbeat']['ts'] = now
r['heartbeat']['next_wakeup_at'] = wake
r['heartbeat']['wakeup_note'] = (
    "Cycle 9 CLOSED (TASTE gate, VALUE). Base 90s after a VALUE cycle (cycle.md step 9; gears "
    "never touch the delay). The VPS pacer (swarm-pacer.timer, every 5 min) is the firing "
    "mechanism here and reads this field, so no ScheduleWakeup call is made. Clamp holds: "
    + str(wake) + " + 900 = " + str(wake + 900) + " <= stop_at " + str(stop_epoch) + ". "
    "NEXT CYCLE PICK: POLISH. All three pre-POLISH gates are now complete (review-fix c5, "
    "QA full c6, TASTE c9), and TS-4 (help's tag-discovery snippet is not pasteable) is the "
    "only todo item in the backlog -- S-effort, in scope, no flag/dependency/corpus change. "
    "TS-1..TS-3 are blocked on a human scope decision and must NOT be picked: they are corpus "
    "expansion, a locked non-goal of run #3."
)

# --- journal block + runfile-mirror ---
block = open(T + '/.swarm/runs/cycle-009-journal.md').read()
mirror = 'runfile-mirror:\n```json\n' + json.dumps(r, separators=(',', ':')) + '\n```\n'
with open(JR, 'a') as f:
    f.write(block)
    f.write('\n' + mirror)

# --- runfile + bak (atomic) ---
json.dump(r, open(RF + '.tmp', 'w'), indent=2)
os.replace(RF + '.tmp', RF)
json.dump(r, open(SWARM + '/runs/current.json.bak.tmp', 'w'), indent=2)
os.replace(SWARM + '/runs/current.json.bak.tmp', SWARM + '/runs/current.json.bak')

print('now', now, 'next_wakeup_at', wake, 'cycles_since_recycle', r['cycles_since_recycle'])
print('journal bytes', os.path.getsize(JR))
