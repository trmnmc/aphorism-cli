#!/usr/bin/env python3
"""Conductor-authored verification harness for item I-2c (cycle 6).

Authored at verification time, independently of the builder's own checks.
The builder never saw this file.

Four questions, in order:

  FAILABLE      -- with M21 applied, does the suite fail, and are the FAILING test
                   names the ones this cycle added?
  ATTRIBUTABLE  -- strict form (cycle 5 precedent): apply M21 AND skip every test
                   added this cycle. The suite must be green at exactly the
                   pre-cycle baseline (56 pass / 0 fail), proving the mutation
                   survives everything that existed before this cycle and the kill
                   is owed to today's work.
  SKIP-SANITY   -- ATTRIBUTABLE is a PASS-shaped result. If --test-skip-pattern had
                   silently matched more than the new names, ATTRIBUTABLE would read
                   PASS vacuously. Apply an obviously-breaking mutation under the
                   same skip pattern; the suite MUST still fail, caught by
                   pre-existing tests.
  PRISTINE      -- source restored byte-exact, full suite green.

src/args.js is restored from git after every mutation, and the harness asserts a
clean product tree before it exits.
"""

import subprocess, sys, re, os

REPO = '/opt/targets/aphorism-cli'
SRC = os.path.join(REPO, 'src/args.js')
SKIP = 'accepts a negative number'

# M21, verbatim from .swarm/runs/cycle-004-mutation-sweep.json
M21_FROM = "  const n = Number(raw);\n  if (Number.isNaN(n)) return { ok: false };\n  return { ok: true, value: n };"
M21_TO = "  const n = Number(raw);\n  if (Number.isNaN(n)) return { ok: false };\n  if (n < 0) return { ok: false };\n  return { ok: true, value: n };"

# Skip-sanity control: parseSeedValue rejects EVERYTHING. Breaks pre-existing
# tests ('--seed <n> parses as a number', '--seed=<n> equals form ...') that are
# not matched by the skip pattern.
CTRL_TO = "  const n = Number(raw);\n  if (Number.isNaN(n)) return { ok: false };\n  return { ok: false };"


def restore():
    subprocess.run(['git', '-C', REPO, 'checkout', '--', 'src/args.js'], check=True)


def mutate(to_text):
    original = open(SRC).read()
    assert original.count(M21_FROM) == 1, 'anchor not found exactly once in src/args.js'
    open(SRC, 'w').write(original.replace(M21_FROM, to_text))


def run_suite(skip=None):
    # TAP reporter forced so the parsing below is deterministic regardless of TTY.
    cmd = ['node', '--test', '--test-reporter=tap']
    if skip:
        cmd += ['--test-skip-pattern', skip]
    cmd += ['test/args.test.js', 'test/cli.test.js', 'test/select.test.js']
    r = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
    out = r.stdout + r.stderr

    def num(field):
        m = re.search(r'^# ' + field + r' (\d+)$', out, re.M) or re.search(r'^ℹ ' + field + r' (\d+)$', out, re.M)
        return int(m.group(1)) if m else -1

    failing = re.findall(r'^not ok \d+ - (.+)$', out, re.M)
    return {
        'pass': num('pass'), 'fail': num('fail'), 'skipped': num('skipped'),
        'tests': num('tests'), 'exit': r.returncode, 'failing': failing,
    }


results = {}

# Guard: the new tests must actually exist and the skip pattern must match only them.
src_test = open(os.path.join(REPO, 'test/args.test.js')).read()
names = re.findall(r"^test\('(.+?)'", src_test, re.M)
matched = [n for n in names if SKIP in n]
print('TEST NAMES IN args.test.js MATCHING SKIP PATTERN %r: %d' % (SKIP, len(matched)))
for n in matched:
    print('   ', n)
assert len(matched) >= 1, 'skip pattern matches no test -- nothing was added'

restore()

print('\n--- FAILABLE: M21 applied, new tests active ---')
mutate(M21_TO)
r = run_suite()
restore()
results['failable'] = r
print('pass=%(pass)d fail=%(fail)d exit=%(exit)d' % r)
for f in r['failing']:
    print('  FAILING:', f)
failable_ok = r['fail'] > 0 and all(SKIP in f for f in r['failing']) and len(r['failing']) == len(matched)
print('FAILABLE:', 'PASS' if failable_ok else 'FAIL')

print('\n--- DENOMINATOR: pristine, new tests filtered out by the skip pattern ---')
# Establishes what --test-skip-pattern actually did. Node FILTERS matched tests out of
# the run rather than marking them skipped (# skipped stays 0), so the honest check is
# on the test COUNT: 58 collected minus exactly the tests added this cycle.
r = run_suite(skip=SKIP)
results['denominator'] = r
print('tests=%(tests)d pass=%(pass)d fail=%(fail)d skipped=%(skipped)d' % r)
denominator_ok = r['tests'] == 58 - len(matched) and r['pass'] == r['tests'] and r['fail'] == 0
print('DENOMINATOR:', 'PASS' if denominator_ok else 'FAIL',
      '(pattern must remove exactly the %d tests added this cycle, leaving the 56-test baseline green)' % len(matched))

print('\n--- ATTRIBUTABLE (strict): M21 applied, new tests filtered out ---')
mutate(M21_TO)
r = run_suite(skip=SKIP)
restore()
results['attributable'] = r
print('tests=%(tests)d pass=%(pass)d fail=%(fail)d exit=%(exit)d' % r)
attributable_ok = r['fail'] == 0 and r['tests'] == 56 and r['pass'] == 56
print('ATTRIBUTABLE:', 'PASS' if attributable_ok else 'FAIL', '(expect tests=56 pass=56 fail=0)')

print('\n--- SKIP-SANITY: breaking control mutation, same skip pattern ---')
mutate(CTRL_TO)
r = run_suite(skip=SKIP)
restore()
results['skip_sanity'] = r
print('pass=%(pass)d fail=%(fail)d skipped=%(skipped)d exit=%(exit)d' % r)
for f in r['failing']:
    print('  FAILING:', f)
sanity_ok = r['fail'] > 0 and all(SKIP not in f for f in r['failing'])
print('SKIP-SANITY:', 'PASS' if sanity_ok else 'FAIL', '(pre-existing tests must catch it)')

print('\n--- PRISTINE: source restored, full suite ---')
r = run_suite()
results['pristine'] = r
print('pass=%(pass)d fail=%(fail)d exit=%(exit)d' % r)
pristine_ok = r['fail'] == 0 and r['exit'] == 0

tree = subprocess.run(['git', '-C', REPO, 'status', '--porcelain'], capture_output=True, text=True).stdout
print('\nTREE AFTER HARNESS:')
print(tree.rstrip() or '(clean)')
tree_ok = all(('test/args.test.js' in ln) for ln in tree.strip().splitlines() if ln.strip() and '.swarm/' not in ln)

gate = failable_ok and denominator_ok and attributable_ok and sanity_ok and pristine_ok and tree_ok
print('\nGATE:', 'PASS' if gate else 'FAIL')
sys.exit(0 if gate else 1)
