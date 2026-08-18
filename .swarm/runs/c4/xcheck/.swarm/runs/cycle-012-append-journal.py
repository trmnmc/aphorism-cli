"""Append the cycle-12 journal block + a compact runfile-mirror to .swarm/journal.md.
The mirror is serialized FROM the live runfile, never hand-typed, so it cannot drift."""
import json

SW = '/opt/targets/aphorism-cli/.swarm/'
block = open(SW + 'runs/cycle-012-journal.md').read()
runfile = json.load(open('/opt/swarm/runs/current.json'))

mirror = 'runfile-mirror:\n```json\n' + json.dumps(runfile, separators=(',', ':'), ensure_ascii=False) + '\n```\n'

with open(SW + 'journal.md', 'a') as f:
    f.write(block)
    f.write(mirror)

print('journal.md appended:', len(block) + len(mirror), 'bytes')
print('mirror heartbeat:', runfile['heartbeat'])
