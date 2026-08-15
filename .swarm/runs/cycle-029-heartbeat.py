import json, os, time, sys

p = '/opt/swarm/runs/current.json'
r = json.load(open(p))
now = int(time.time())
nxt = int(sys.argv[1]) if len(sys.argv) > 1 else 2700
r['heartbeat'] = {
    'ts': now,
    'next_wakeup_at': now + nxt,
    'pid': 618667,
    'limp': False,
    'degraded_tiers': [],
}
tmp = p + '.tmp'
json.dump(r, open(tmp, 'w'), indent=2)
os.replace(tmp, p)
print('heartbeat ts=%d next_wakeup_at=%d (+%ds)' % (now, now + nxt, nxt))
