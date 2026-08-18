import json, os, time

p = '/opt/swarm/runs/current.json'
d = json.load(open(p))
now = int(time.time())
d['heartbeat'] = {
    'ts': now,
    'next_wakeup_at': now + 2700,
    'pid': 395891,
    'limp': d['heartbeat'].get('limp', False),
    'degraded_tiers': d['heartbeat'].get('degraded_tiers', []),
}
d['cycles_since_recycle'] = d.get('cycles_since_recycle', 0) + 1
open(p + '.tmp', 'w').write(json.dumps(d, indent=2, ensure_ascii=False))
os.replace(p + '.tmp', p)

stop = 1786879464
print('now', now)
print('cycles_since_recycle', d['cycles_since_recycle'])
print('stop_at - now =', stop - now, 'seconds =', round((stop - now) / 3600, 2), 'hours')
print('limp', d['heartbeat']['limp'])
