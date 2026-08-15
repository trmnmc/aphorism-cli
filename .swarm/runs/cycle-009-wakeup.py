import json
import os
import shutil
import time

P = '/opt/swarm/runs/current.json'
STOP = 1786879464

with open(P) as f:
    rf = json.load(f)

now = int(time.time())
delay = 90  # base: this was a verified-value cycle, not a no-value one, and limp is false
wake = now + delay
# Hard rule 8: never schedule past stop_at — clamp so wake + 900 <= stop_at.
if wake + 900 > STOP:
    wake = STOP - 900
rf['heartbeat']['next_wakeup_at'] = wake
rf['heartbeat']['ts'] = now

tmp = P + '.tmp'
with open(tmp, 'w') as f:
    json.dump(rf, f, indent=2, ensure_ascii=False)
os.replace(tmp, P)
shutil.copyfile(P, P + '.bak')

with open(P) as f:
    json.load(f)
print('parse OK')
print('now', now, 'next_wakeup_at', wake, '(+%ds)' % (wake - now))
print('stop_at - wake =', STOP - wake, 'seconds')
