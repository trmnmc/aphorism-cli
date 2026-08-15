#!/usr/bin/env python3
"""Cycle 5 persistence: state.json + backlog.json atomic writes."""
import json
import os

SW = '/opt/targets/aphorism-cli/.swarm/'


def atomic(path, obj):
    with open(path + '.tmp', 'w') as fh:
        json.dump(obj, fh, indent=2, ensure_ascii=False)
        fh.write('\n')
    os.replace(path + '.tmp', path)


# ---- backlog ----
b = json.load(open(SW + 'backlog.json'))
for it in b['items']:
    if it['id'] == 'I-2b':
        it['status'] = 'done'
        it['notes'] += (' || VERIFIED cycle 5 by an independent conductor harness '
                        '(.swarm/runs/cycle-005-verify-I-2b.py, builder never saw it). '
                        'All four HOLEs proven twice: FAILABLE (mutation applied, suite '
                        'fails and the designated new test is named) and ATTRIBUTABLE in '
                        'the strict form (mutation applied + all four new tests skipped '
                        '-> 52 pass / 0 fail, exactly the pre-sweep baseline, so no '
                        'pre-existing test was doing the work). A skip-sanity control '
                        'confirms --test-skip-pattern does not disable the whole run. '
                        'Suite 52 -> 56 green. Recorded overlap: M12 is length-changing, '
                        'so it also trips the M13 order test; isolation of M12 alone '
                        'still leaves fail=1 by design, not by defect.')
    if it['id'] == 'I-3':
        it['notes'] += (' || NEW measured evidence (cycle 5): the --list LINE FORMAT '
                        '("<text> — <author>", em dash, single line) is now pinned by the '
                        'M13 order test but is stated by no Domain rule — the rules '
                        'describe order and completeness of --list, never its rendering. '
                        'Same shape of gap as M16: a test now enforces something the spec '
                        'does not promise. I-3 should either write the rule or loosen the '
                        'assertion to order-only. Do not silently leave the test as the '
                        'de-facto spec.')
atomic(SW + 'backlog.json', b)
print('backlog: I-2b -> done; I-3 notes appended')
counts = {}
for it in b['items']:
    counts[it['status']] = counts.get(it['status'], 0) + 1
print('backlog counts', counts)

# ---- state ----
s = json.load(open(SW + 'state.json'))
s['cycle'] = 5
s['phase'] = 'BUILD'
s['counters']['wave_streak'] = 1
s['counters']['consecutive_no_value'] = 0
s['counters']['consecutive_failures'] = 0
s['decisions'].append(dict(
    cycle=5,
    what=("Attribution at the gate is proven in the STRICT form — mutation applied with "
          "ALL FOUR new tests skipped must leave the suite green — rather than by removing "
          "one test at a time, and the harness carries a skip-sanity control."),
    why=("Per-test isolation is ambiguous when two tests observe the same mutation: M12 "
          "drops the last --list entry, which is length-changing, so it trips the M13 order "
          "test too, and isolating M12 alone still shows fail=1. That reads like a failed "
          "attribution when it is really an expected overlap. The strict form asks the "
          "question that actually matters — does the mutation survive everything that "
          "existed before this cycle? — and it landed on exactly 52 pass / 0 fail, the "
          "pre-sweep baseline, for all four. The skip-sanity control exists because "
          "ATTRIBUTABLE is a PASS-shaped result: if --test-skip-pattern had silently "
          "matched everything, all four would have 'passed' vacuously.")))
s['last_cycle'] = dict(
    n=5,
    work=("I-2b — four CLI-level HOLE tests (direct Agent, sonnet, k=1, scoped to "
          "test/cli.test.js) + independent conductor mutation harness at the gate"),
    outcome=("1 verified; suite 52 -> 56 green; M07/M12/M13/M14 each failable and "
             "strictly attributable; product files byte-identical"),
    commit='PENDING')
atomic(SW + 'state.json', s)
print('state: cycle 5, wave_streak 1, k_current', s['counters']['k_current'])
