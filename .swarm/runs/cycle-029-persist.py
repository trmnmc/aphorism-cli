import json, os

TGT = '/opt/targets/aphorism-cli/.swarm/'


def atomic(path, obj):
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


# ---------------------------------------------------------------- backlog
b = json.load(open(TGT + 'backlog.json'))
for it in b['items']:
    if it['id'] == 'T-025':
        it['status'] = 'done'
        it['notes'] = (
            'CYCLE 29: CLASSIFIED **HOLE**, hardened, and the item\'s own filed premise was '
            'REFUTED BY MEASUREMENT. T-025 was filed at cycle 27 as PROBABLY A BOUNDARY on the '
            'argument that widening the scan "trades a loud false rejection for a possible silent '
            'mis-parse". That argument had never been measured. Conductor probe '
            '.swarm/runs/cycle-029-probe-T025.txt ran 6 README variants x 3 scan variants (18 cells, '
            'PRISTINE control 73/73/0, all parsed) and found NO silent hole under either widening; '
            'where the widened scans differ from the conservative one they are LOUDER, not quieter '
            '(row-deleted 73/72/1 -> 73/71/2). The measurement also split the fix space: a MAXIMAL '
            'widening (skip anything to the next header row) fixes this item but introduces a NEW '
            'false rejection on a correct README carrying a decoy band token, while a MODERATE '
            'widening that STOPS at the next line carrying its own band token fixes it with no new '
            'rejection. The builder independently reached the same classification and the same '
            'moderate shape. Shipped: extractBandTablesFromReadme now tolerates blank lines AND '
            'ordinary prose between a heading and its table, aborting the search for that heading on '
            'a line carrying its own N+/N-M token. One test added (74 total). Gate 20/20 '
            '(.swarm/runs/cycle-029-verify-T-025.txt) + conductor probe N1 '
            '(.swarm/runs/cycle-029-probe-N1.txt) closing the one shape the gate missed -- an ORPHAN '
            'table under a heading with no band token, which the stop rule cannot see. Both orphan '
            'variants are caught LOUD (74/72/2 vs HEAD 73/72/1). Mis-attachment is self-defeating '
            'here because the two consumer tests assert EXACT set equality against corpus-derived '
            'expectations, so a stolen table\'s rows essentially cannot coincide with the victim '
            'heading\'s expected set -- the builder documented this as a second line of defence '
            'rather than relying on it silently.'
        )

b['items'].append({
    'id': 'T-026',
    'title': "Decide the heading-to-table scan's digit-shape stop rule: prose carrying a coincidental band token still aborts the scan",
    'kind': 'test',
    'priority': 4,
    'value': 'L',
    'effort': 'S',
    'status': 'todo',
    'deps': ['T-025'],
    'files_hint': ['test/readme-tags.test.js'],
    'packages': [],
    'model': 'sonnet',
    'attempts': 0,
    'acceptance': (
        'FIRST classify, then act (SPEC I-2 allows a BOUNDARY survivor to be documented rather than '
        'hardened), and note that the bar here is HIGHER than for T-025: the stop rule being '
        'questioned is the very thing measured at cycle 29 to keep mis-attachment out, so any '
        'narrowing of it must re-run the cycle-29 orphan and sibling-theft probes and show them '
        'still RED. If HOLE: a band heading separated from its table by prose carrying a '
        'coincidental band-shaped token -- e.g. "Requires Node 18+ to run." -- leaves the suite '
        'GREEN, while a row deletion under that same layout still FAILS, proven twice, AND '
        '.swarm/runs/cycle-029-probe-N1.js still reports no silent hole. If BOUNDARY: the limit is '
        'stated in a comment at the extraction site naming the exact prose shape that is out of '
        'scope and why loosening the digit-shape heuristic is the more dangerous trade.'
    ),
    'notes': (
        'Source: the BUILDER\'S OWN volunteered uncertainty note at cycle 29, confirmed by conductor '
        'gate check W1/R6. FIFTH cycle running (cf. T-020 c22, T-021 c23, T-018 c27, T-021 c28) that '
        'an honest "things I was unsure about" note converted directly into a measured item. '
        'MEASURED: with "Requires Node 18+ to run." between the 5+ heading and its table -- every '
        'number in the README still TRUE -- the suite is RED at 74/72/2, because the "18+" reads as '
        'a band token and aborts the scan for that heading. '
        'CRITICALLY, THIS IS NOT A REGRESSION AND THAT IS WHY IT IS ONLY PRIORITY 4: the same README '
        'is ALSO red at HEAD (73/71/2), because HEAD tolerates no prose at all. T-025 therefore '
        'strictly WIDENED what the scan accepts and narrowed nothing -- plain prose now passes, '
        'band-token prose fails exactly as it always did. This is a case the fix did not reach, not '
        'one it broke. It also fails LOUD, the safe direction, same classification as T-018 (c20), '
        'T-020 (c22), T-023 (c25). '
        'It is a genuine member of the prose-anchor family T-024 exists to re-shape: the stop rule '
        'approximates "is this another heading?" with a digit-shape heuristic rather than real '
        'markdown structure. Prefer folding it into T-024 over another narrowing -- cycle 25\'s '
        'standing finding is that each narrowing raises the odds a maintainer deletes the whole '
        'family at once.'
    ),
})
atomic(TGT + 'backlog.json', b)

# ---------------------------------------------------------------- state
s = json.load(open(TGT + 'state.json'))
s['cycle'] = 29
s['decisions'].extend([
    {
        'cycle': 29,
        'what': "T-025 was classified HOLE and hardened, REFUTING the BOUNDARY premise it was filed with. The deciding evidence is a probe of the item's own central factual claim, which no acceptance clause asked for.",
        'why': "The item was filed at cycle 27 asserting that widening the scan 'trades a loud false rejection for a possible silent mis-parse'. That is a factual claim about what a widened scan does, and it had never been run -- it was inherited reasoning from T-018's constraint set. Cycle 28 is the precedent that makes this the load-bearing step: there a fix passed 22/22 and was rejected only because a probe went looking for the silent case, so the same standard has to cut BOTH ways -- a probe that can reject a passing item must also be allowed to rescue a mis-filed one. 18 cells (6 README variants x 3 scan variants, PRISTINE control 73/73/0) found no silent hole under either widening, and the widened scans were LOUDER on every wrong README (73/72/1 -> 73/71/2). Had I taken the filed classification on trust, the honest-looking outcome would have been a BOUNDARY comment restating an argument the measurement contradicts -- a documented non-fix that reads as diligence.",
    },
    {
        'cycle': 29,
        'what': "The conductor sealed its own classification AND its own preferred fix shape to disk before dispatch (.swarm/runs/cycle-029-precommit.md); the builder independently reached both. A labelling error in the conductor's harness is recorded rather than back-edited.",
        'why': "Cycle 10 established that a judgment deliverable cannot be gated by reading it and agreeing -- that is exactly what a confabulated document also survives. The pre-commitment converts agreement into a measurement: the builder could not see the file, so its arrival at HOLE *and* at the moderate stop-at-band-token shape (rather than the maximal widening) is evidence about the conclusion rather than about the prose. The seal also named in advance what would make BOUNDARY acceptable -- a measured one -- so the pre-commitment could not function as a rubber stamp for the answer I preferred. Recorded honestly: the seal names an error in my own probe, where R4 was labelled `wrong: true` when every number in it is true. It could not have corrupted the verdict (a silent hole requires conservative RED and R4 is conservative GREEN) but the label is wrong in the source and stands uncorrected there, per the cycle-21/24/27 precedent on failed or imprecise controls.",
    },
    {
        'cycle': 29,
        'what': "The gate's 20/20 was NOT treated as sufficient: probe N1 was run afterwards against the one wrong-README shape every gate variant shared a blind spot for -- an ORPHAN table whose preceding heading carries no band token.",
        'why': "Every wrong-README variant in the gate had a band-token heading, so the shipped stop rule could always see the boundary it was being tested on. That is a gate measuring the cases it was designed around. The orphan shape is the one the stop rule structurally CANNOT see, so it is where a silent hole would live if one existed. Both orphan variants -- one with unrelated rows, one with plausible-but-incomplete 5+ rows chosen to look like a successful theft -- are caught LOUD at 74/72/2 against HEAD's 73/72/1. The reason is structural and was documented by the builder rather than leaned on silently: both consumer tests assert EXACT set equality between a band's corpus-derived expected tags and its table's actual rows, so a mis-attached table carries rows derived from a different heading's range and cannot coincide. Cycle 28's lesson stated generally: the decisive probe is the one the acceptance never asked for.",
    },
])
s['counters']['consecutive_no_value'] = 0
s['counters']['wave_streak'] = 1
s['qa'] = s.get('qa', {})
s['last_cycle'] = {
    'n': 29,
    'work': (
        'T-025 -- decide the band heading separated from its table by prose: harden or document as '
        'BOUNDARY. Pre-dispatch conductor probe (18 cells) + sealed pre-commitment, then ONE sonnet '
        'builder (k_cap 1), direct Agent call into the target tree, file scope '
        'test/readme-tags.test.js alone.'
    ),
    'outcome': (
        'VERIFIED DONE, and the item\'s filed BOUNDARY premise was refuted by measurement. '
        'Classified HOLE; extractBandTablesFromReadme now tolerates ordinary prose between a heading '
        'and its table, stopping at any line carrying its own band token. Gate 20/20 '
        '(.swarm/runs/cycle-029-verify-T-025.txt): scope clean, one test added (73 -> 74), the false '
        'rejection removed (RED 73/72/1 at HEAD -> GREEN 74/74/0), still loud on a real defect '
        '(74/72/2), no wrong README traded RED->GREEN, no new false rejection on a correct README, '
        'and attribution proven both ways (new test fails alone at 74/73/1 against the old scan; '
        'without it the old scan is 73/73/0). Conductor probe N1 then closed the gate\'s own blind '
        'spot -- orphan tables under band-token-less headings -- both caught LOUD. T-026 filed from '
        'the builder\'s volunteered uncertainty. counters.consecutive_no_value 1 -> 0.'
    ),
    'commit': 'PENDING',
}
atomic(TGT + 'state.json', s)

print('backlog: T-025 done, T-026 filed, total', len(b['items']))
print('state: cycle 29, decisions', len(s['decisions']), 'no_value', s['counters']['consecutive_no_value'], 'streak', s['counters']['wave_streak'])
