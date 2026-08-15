import json
import os
import subprocess

P = '/opt/targets/aphorism-cli/.swarm/state.json'
h = subprocess.check_output(
    ['git', '-C', '/opt/targets/aphorism-cli', 'rev-parse', '--short', 'HEAD'],
    text=True,
).strip()

with open(P) as f:
    st = json.load(f)
assert st['last_cycle']['commit'] == 'PENDING', st['last_cycle']['commit']
st['last_cycle']['commit'] = h

tmp = P + '.tmp'
with open(tmp, 'w') as f:
    json.dump(st, f, indent=2, ensure_ascii=False)
os.replace(tmp, P)

with open(P) as f:
    json.load(f)
print('state.json parse OK, last_cycle.commit =', h)
