"""Cycle 13 step-9 bookkeeping: record the commit hash in state.last_cycle, set the
heartbeat's next_wakeup_at (the VPS pacer reads this field and is the actual firing
mechanism -- cycle.md step 9), and patch the journal's PENDING placeholders."""
import json, os, subprocess, time

T = '/opt/targets/aphorism-cli'
SW = '/opt/swarm'
COMMIT = '327fe3c'

now = int(time.time())
nxt = now + 90                      # value cycle -> base 90s; no pacing multiplier

rp = f'{SW}/runs/current.json'
rf = json.load(open(rp))
stop_at = 1786879464
assert nxt + 900 <= stop_at, 'hard rule 8: wakeup must not run past stop_at'
rf['heartbeat']['next_wakeup_at'] = nxt
json.dump(rf, open(rp + '.tmp', 'w'), indent=2)
os.replace(rp + '.tmp', rp)
json.dump(rf, open(rp + '.bak.tmp', 'w'), indent=2)
os.replace(rp + '.bak.tmp', f'{SW}/runs/current.json.bak')

sp = f'{T}/.swarm/state.json'
st = json.load(open(sp))
st['last_cycle']['commit'] = COMMIT
json.dump(st, open(sp + '.tmp', 'w'), indent=1)
os.replace(sp + '.tmp', sp)

jp = f'{T}/.swarm/journal.md'
j = open(jp).read()
j = j.replace('\ncommit: PENDING\nnext wakeup: PENDING\n',
              f'\ncommit: {COMMIT} "cycle 13: QA-full pass -- spec-only author + executor, '
              f'conductor-swept [0 divergences, 27/27 harness checks incl. 4 negative '
              f'controls, 59 tests green]"\nnext wakeup: {nxt} (+90s)\n')
open(jp + '.tmp', 'w').write(j)
os.replace(jp + '.tmp', jp)

head = subprocess.run(['git', '-C', T, 'rev-parse', '--short', 'HEAD'],
                      capture_output=True, text=True).stdout.strip()
print('commit recorded:', COMMIT, '(HEAD is', head + ')')
print('next_wakeup_at:', nxt, '= now +', nxt - now, 's;', round((stop_at - nxt) / 3600.0, 2),
      'h of clock left after it')
print('journal placeholders patched:', 'PENDING' not in j.split('## cycle 13')[-1])
