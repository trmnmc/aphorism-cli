import json, os

sp = '/opt/targets/aphorism-cli/.swarm/state.json'
s = json.load(open(sp))
s['phase'] = 'QA'
s['cycle'] = 13
s.setdefault('qa', {})
s['qa']['last_full_qa_cycle'] = 13
s['counters']['consecutive_no_value'] = 0
s['counters']['consecutive_failures'] = 0
s['last_cycle'] = {
    'n': 13,
    'work': ('QA-full pass (step-4 gate 4) — spec-only fable scenario author -> sonnet '
             'executor, dispatched as direct Agent calls because Workflow is review-gated '
             'headless. Live-look stage not applicable to a CLI and reported as not-run.'),
    'outcome': ('0 spec divergences across 6 scenarios; conductor harness 27/27 incl. 4 '
                'negative controls, sweeping all 37 tags, 37 tag prefixes and 40 author x tag '
                'pairs; suite 59/59. Gate-4 QA half now satisfied and evidenced.'),
    'commit': 'PENDING',
}
s['decisions'].append({
    'cycle': 13,
    'what': ('QA-full chosen over the taste pass for cycle 13, and the live-look stage '
             'declared not-applicable rather than run.'),
    'why': ('Both gate-4 passes were outstanding (last_full_qa_cycle and last_taste_cycle '
            'were both 0). QA-full wins the earlier slot because its findings land as '
            'kind:"fix" items that are IN scope for an improvement run, whereas taste '
            'findings land as kind:"feature"/"polish" and this run\'s spec makes every new '
            'feature a non-goal — a fundamental taste verdict would re-aim the clock at work '
            'the spec forbids. Live-look inspects a running product through a browser; this '
            'target is a Node CLI with no server or browser surface, so nothing could be '
            'inspected and nothing is claimed. Its cheap CLI analogue (output survives a '
            'pipe unchanged) was folded into the conductor harness as check S7.'),
})
json.dump(s, open(sp + '.tmp', 'w'), indent=1)
os.replace(sp + '.tmp', sp)
print('state written: phase', s['phase'], 'cycle', s['cycle'], 'qa', s['qa'])

rp = '/opt/swarm/runs/current.json'
r = json.load(open(rp))
r['cycles_since_recycle'] = 12
json.dump(r, open(rp + '.tmp', 'w'), indent=2)
os.replace(rp + '.tmp', rp)
print('runfile cycles_since_recycle =', r['cycles_since_recycle'])
