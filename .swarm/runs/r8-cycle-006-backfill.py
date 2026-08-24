import json, os

# Backfill `updated_cycle` on run-8 done items so the dashboard burn-up series is derivable
# from a STRUCTURAL field instead of from prose. The mapping is taken from the run's own
# commit bodies (git log), not from journal prose:
#   dacd842 "cycle 2: W-1, W-3, W-4"                      -> W-1 W-3 W-4
#   3bc2edc "cycle 3: the detection floor, the 127-vs-129 verdict, an attribution ..." -> W-2 W-5 P-1
#   02f4668 "cycle 4: KI-R6-3 closed by consolidation, and one entry point ..."        -> W-7 W-9
#   4980f3a "cycle 4: the citation window closed in the same cycle it was opened"      -> W-11
#   11ee75c "cycle 5: the matrix can measure any tree, and two runs can share a root"  -> W-12 W-13
#   154d073 "cycle 6: the matrix speaks JSON at any rev, ..."                          -> W-14 P-2
# W-12/W-13 also appear in 4980f3a's body because that is where the cycle-4 gate FILED
# them; they were completed in cycle 5, which is what backlog.updated_cycle already says.
MAP = {'W-1': 2, 'W-3': 2, 'W-4': 2,
       'W-2': 3, 'W-5': 3, 'P-1': 3,
       'W-7': 4, 'W-9': 4, 'W-11': 4,
       'W-12': 5, 'W-13': 5,
       'W-14': 6, 'P-2': 6}

p = '/opt/targets/aphorism-cli/.swarm/backlog.json'
b = json.load(open(p))
done = [i for i in b['items'] if i.get('status') == 'done']
assert len(done) == len(MAP), f'done={len(done)} map={len(MAP)} — refusing to render a series I cannot account for'
filled = 0
for i in done:
    assert i['id'] in MAP, f'unmapped done item {i["id"]}'
    if i.get('updated_cycle') != MAP[i['id']]:
        if i.get('updated_cycle') is not None:
            raise SystemExit(f'CONFLICT: {i["id"]} says cycle {i["updated_cycle"]}, git says {MAP[i["id"]]}')
        i['updated_cycle'] = MAP[i['id']]
        filled += 1
with open(p + '.tmp', 'w') as f:
    json.dump(b, f, indent=2); f.write('\n')
os.replace(p + '.tmp', p)

series = {}
for i in done:
    series[i['updated_cycle']] = series.get(i['updated_cycle'], 0) + 1
print('backfilled', filled, 'items; per-cycle verified:', dict(sorted(series.items())))
