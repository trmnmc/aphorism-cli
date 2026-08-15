#!/usr/bin/env python3
"""Conductor-authored verification harness for item I-2b (cycle 5).

Authored AT VERIFICATION TIME, independently of the builder. The builder never
saw this file. It re-derives the four cycle-4 mutations from the sweep record's
own diffs, applies them to pristine product files, and measures the suite.

For each mutation M it establishes, with real measurement:

  FAILABLE      mutation applied, all tests active  -> suite FAILS and the
                designated new test is among the failing test names.
  ATTRIBUTABLE  mutation applied, all FOUR new tests skipped -> suite PASSES.
                This is the strict form: it proves no PRE-EXISTING test catches
                the mutation, i.e. it really was a survivor and the kill is
                owed to work landed this cycle.
  ISOLATED      mutation applied, only the designated new test skipped.
                Expected PASS for a mutation only that test can see. M12 is
                expected to still FAIL here (dropping the last --list entry is
                length-changing, so it also trips the order test) -- that
                overlap is recorded, not hidden.

Plus two controls:
  PRISTINE      no mutation, all tests active -> suite green.
  SKIP-SANITY   an obviously-breaking mutation with all four new tests skipped
                -> suite must still FAIL. Proves --test-skip-pattern is not
                silently disabling the whole run, which would make every
                ATTRIBUTABLE result vacuous.

Product files are restored from `git show HEAD:<path>` after every step, and the
script asserts a clean src/bin tree before exiting.
"""

import re
import subprocess
import sys

TARGET = '/opt/targets/aphorism-cli'
SELECT = 'src/select.js'
BIN = 'bin/aphorism.js'

# --- the four mutations, re-derived from cycle-004-mutation-sweep.json diffs ---

M07_OLD = "      entry.tags.some((t) => t.toLowerCase() === needle)"
M07_NEW = "      entry.tags.some((t) => t.toLowerCase().includes(needle))"

LIST_ANCHOR = "    const body = candidates\n"
M12_NEW = LIST_ANCHOR + "      .slice(0, -1)\n"
M13_NEW = LIST_ANCHOR + "      .slice()\n      .reverse()\n"

M14_OLD = "JSON.stringify(chosen)"
M14_NEW = "JSON.stringify(chosen, null, 2)"

# control: bare invocation returns the wrong exit code -- pre-existing tests
# must catch this even with all four new tests skipped
CTRL_OLD = "  const chosen = pick(candidates, opts.seed);"
CTRL_NEW = "  const chosen = pick(candidates, opts.seed);\n  if (!opts.json) return 3;"

# --- the four new test names, as they appear in test/cli.test.js ---

NEW_TESTS = {
    'M07': '--tag matches membership, not substring containment',
    'M12': '--list prints exactly one line per matching entry, no drops',
    'M13': '--list preserves corpus order (first and last line match)',
    'M14': '--json output is exactly one line, never pretty-printed',
}

MUTATIONS = {
    'M07': (SELECT, M07_OLD, M07_NEW),
    'M12': (BIN, LIST_ANCHOR, M12_NEW),
    'M13': (BIN, LIST_ANCHOR, M13_NEW),
    'M14': (BIN, M14_OLD, M14_NEW),
    'CTRL': (BIN, CTRL_OLD, CTRL_NEW),
}


def sh(cmd):
    return subprocess.run(cmd, cwd=TARGET, capture_output=True, text=True)


def pristine(path):
    r = sh(['git', 'show', 'HEAD:' + path])
    assert r.returncode == 0, 'git show failed for ' + path
    return r.stdout


def write(path, text):
    with open(TARGET + '/' + path, 'w') as fh:
        fh.write(text)


def restore(path):
    write(path, pristine(path))


def apply_mutation(key):
    path, old, new = MUTATIONS[key]
    src = pristine(path)
    n = src.count(old)
    assert n == 1, 'anchor for %s matched %d times in %s (want exactly 1)' % (key, n, path)
    write(path, src.replace(old, new))
    return path


def escape(name):
    return re.escape(name)


def run_suite(skip=None):
    """Run test_cmd under the TAP reporter. Returns (passed, failed, failing_names)."""
    cmd = ['node', '--test', '--test-reporter=tap']
    if skip:
        cmd.append('--test-skip-pattern=' + skip)
    cmd += ['test/cli.test.js', 'test/args.test.js', 'test/select.test.js']
    r = sh(cmd)
    out = r.stdout
    failing = re.findall(r'^not ok \d+ - (.+?)\s*$', out, re.M)
    passed = re.search(r'^# pass (\d+)', out, re.M)
    failed = re.search(r'^# fail (\d+)', out, re.M)
    return (int(passed.group(1)) if passed else -1,
            int(failed.group(1)) if failed else -1,
            failing)


ALL_NEW = '|'.join(escape(n) for n in NEW_TESTS.values())

results = []
ok = True


def emit(line):
    print(line)
    results.append(line)


# --- control 1: pristine ---
for p in (SELECT, BIN):
    restore(p)
p_, f_, names = run_suite()
emit('PRISTINE          pass=%d fail=%d  -> %s' % (p_, f_, 'GREEN' if f_ == 0 else 'RED'))
if f_ != 0:
    ok = False

# --- control 2: skip-sanity ---
apply_mutation('CTRL')
p_, f_, names = run_suite(skip=ALL_NEW)
sane = f_ > 0
emit('SKIP-SANITY       ctrl mutation + all 4 new tests skipped: pass=%d fail=%d -> %s'
     % (p_, f_, 'OK (pre-existing tests still run)' if sane else 'BROKEN (skip disabled everything)'))
emit('                  caught by: %s' % ', '.join(names[:3]))
if not sane:
    ok = False
restore(BIN)

# --- the four mutations ---
for key in ('M07', 'M12', 'M13', 'M14'):
    target_name = NEW_TESTS[key]
    for p in (SELECT, BIN):
        restore(p)
    path = apply_mutation(key)

    p1, f1, names1 = run_suite()
    failable = f1 > 0 and target_name in names1

    p2, f2, _ = run_suite(skip=ALL_NEW)
    attributable = f2 == 0

    p3, f3, names3 = run_suite(skip=escape(target_name))
    isolated = f3 == 0

    emit('')
    emit('%s  (%s)' % (key, path))
    emit('  FAILABLE      all active            pass=%d fail=%d  named=%s  -> %s'
         % (p1, f1, target_name in names1, 'PASS' if failable else 'FAIL'))
    emit('                failing: %s' % ('; '.join(names1) if names1 else '(none)'))
    emit('  ATTRIBUTABLE  4 new tests skipped   pass=%d fail=%d  -> %s'
         % (p2, f2, 'PASS (mutation survives without this cycle\'s tests)'
            if attributable else 'FAIL (a pre-existing test also catches it)'))
    emit('  ISOLATED      only %s skipped   pass=%d fail=%d  -> %s'
         % (key, p3, f3, 'clean' if isolated else 'still caught by: ' + '; '.join(names3)))
    if not (failable and attributable):
        ok = False

for p in (SELECT, BIN):
    restore(p)

# --- final tree assertion ---
r = sh(['git', 'status', '--porcelain'])
emit('')
emit('TREE AFTER HARNESS (product files must be unmodified):')
for line in r.stdout.strip().split('\n'):
    emit('  ' + line)
dirty_product = [l for l in r.stdout.strip().split('\n')
                 if l[3:].startswith('src/') or l[3:].startswith('bin/')]
if dirty_product:
    emit('  !! product file left modified')
    ok = False

p_, f_, _ = run_suite()
emit('')
emit('FINAL test_cmd (node --test test/*.test.js): pass=%d fail=%d' % (p_, f_))
if f_ != 0:
    ok = False

emit('')
emit('GATE: ' + ('PASS' if ok else 'FAIL'))
sys.exit(0 if ok else 1)
