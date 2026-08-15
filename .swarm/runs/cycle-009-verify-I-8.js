#!/usr/bin/env node
'use strict';

// Cycle 9 verification harness for item I-8 — authored by the CONDUCTOR at verification
// time. The builder never saw this file (hard rule 2), so it cannot have coded to it.
//
// What needs proving, and why reading the diff proves none of it:
//   FAILABLE      — the new test must fail against mutant M16 specifically.
//   ATTRIBUTABLE  — with M16 applied AND the new test filtered out, the suite must return
//                   the exact pre-cycle baseline, so no pre-existing test is doing the work.
//   DENOMINATOR   — the skip pattern must remove EXACTLY the test added this cycle
//                   (cycle-6 rule: --test-skip-pattern FILTERS rather than marks skipped,
//                   so the count is the signal and '# skipped' stays 0).
//   SKIP-SANITY   — the same pattern must NOT disable the whole run (cycle-5 control).
//   MUTATION-APPLIED — every scratch mutation must be proven to have changed bytes. This
//                   is the control that matters most here: a mutation that silently failed
//                   to apply would make the ATTRIBUTABLE check pass VACUOUSLY, which is a
//                   pass-shaped false result, exactly the failure mode cycle 5 and 6 hit.
//   DISCRIMINATORS — mutations a WEAKER test would survive, so a degenerate assertion
//                   cannot earn a pass: compact (single-line) array, reversed order, and a
//                   dropped last entry.
//   SCOPE         — product tree byte-identical to HEAD; only test/cli.test.js moved.

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TARGET = '/opt/targets/aphorism-cli';
const NEW_TEST_NAME =
  '--list --json emits newline-delimited JSON, one object per line, in corpus order';
const SKIP_PATTERN = 'emits newline-delimited JSON';

let pass = 0;
let fail = 0;
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok, detail });
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

// --- suite runner -----------------------------------------------------------------

function runSuite(dir, skipPattern) {
  // Force the TAP reporter. Node 24 defaults to the `spec` reporter, whose summary lines
  // are prefixed `ℹ` and whose failures read `✖` — parsing those is brittle, and a parser
  // that silently matches nothing returns null counts that a careless harness could read
  // as "not a failure". TAP gives `# tests N` and `not ok N - <name>` deterministically.
  const args = ['--test', '--test-reporter=tap'];
  if (skipPattern) args.push(`--test-skip-pattern=${skipPattern}`);
  // test_cmd is `node --test test/*.test.js`; the glob is the shell's job, so expand it here.
  const files = fs
    .readdirSync(path.join(dir, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .sort()
    .map((f) => path.join('test', f));
  const r = spawnSync(process.execPath, [...args, ...files], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout}\n${r.stderr}`;
  const num = (label) => {
    const m = out.match(new RegExp(`^# ${label} (\\d+)$`, 'm'));
    return m ? Number(m[1]) : null;
  };
  const failedNames = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  // PARSER SANITY: a regex that matches nothing yields null counts, and null compares
  // falsely against every expectation — which would render as a FAIL, but for the wrong
  // reason, and a null `fail` count could just as easily have been read as "no failures".
  // Refuse to return an unparsed result at all.
  if (num('tests') === null) {
    throw new Error(
      `harness parser failed: no TAP summary in output from ${dir}. First 400 chars:\n${out.slice(0, 400)}`
    );
  }
  return {
    tests: num('tests'),
    pass: num('pass'),
    fail: num('fail'),
    skipped: num('skipped'),
    failedNames,
    raw: out,
  };
}

// --- scratch copies ---------------------------------------------------------------

const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-verify-9-'));
const scratches = [];

function scratch(label) {
  const dir = path.join(scratchRoot, label);
  fs.cpSync(TARGET, dir, {
    recursive: true,
    filter: (src) => !src.split(path.sep).includes('.git'),
  });
  scratches.push(dir);
  return dir;
}

// The `--list` branch of bin/aphorism.js exactly as it ships. Matching the literal text
// means a drifted source makes the mutation refuse to apply rather than silently no-op.
const LIST_BRANCH = `  if (opts.list) {
    const body = candidates
      .map((e) => (opts.json ? JSON.stringify(e) : \`\${e.text} — \${e.author}\`))
      .join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`;

function mutate(dir, replacement, label) {
  const file = path.join(dir, 'bin', 'aphorism.js');
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes(LIST_BRANCH)) {
    check(`MUTATION-APPLIED [${label}]`, false, 'anchor text not found in bin/aphorism.js — source drifted; mutation NOT applied');
    return false;
  }
  const after = before.replace(LIST_BRANCH, replacement);
  fs.writeFileSync(file, after);
  const applied = after !== before && fs.readFileSync(file, 'utf8') === after;
  check(
    `MUTATION-APPLIED [${label}]`,
    applied,
    `bin/aphorism.js ${before.length} -> ${after.length} chars (JS string length, not bytes — the file has multi-byte em dashes)`
  );
  return applied;
}

// M16, as recorded in .swarm/runs/cycle-004-classification.md: --list --json emits ONE
// pretty-printed JSON array instead of newline-delimited JSON.
const M16 = `  if (opts.list) {
    if (opts.json) {
      process.stdout.write(\`\${JSON.stringify(candidates, null, 2)}\\n\`);
      return EXIT_OK;
    }
    const body = candidates.map((e) => \`\${e.text} — \${e.author}\`).join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`;

// Discriminator A: COMPACT array — one line, still valid JSON, still every entry in order.
// A test that only counted "output is not multi-line" or "output parses" would survive this.
const M16_COMPACT = `  if (opts.list) {
    if (opts.json) {
      process.stdout.write(\`\${JSON.stringify(candidates)}\\n\`);
      return EXIT_OK;
    }
    const body = candidates.map((e) => \`\${e.text} — \${e.author}\`).join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`;

// Discriminator B: correct NDJSON shape and count, REVERSED order. Kills a test that
// checks shape but never order.
const M16_REVERSED = `  if (opts.list) {
    const body = candidates
      .slice()
      .reverse()
      .map((e) => (opts.json ? JSON.stringify(e) : \`\${e.text} — \${e.author}\`))
      .join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`;

// Discriminator C: correct NDJSON shape and order, LAST ENTRY DROPPED. Kills a test whose
// count assertion is a floor rather than an equality.
const M16_TRUNCATED = `  if (opts.list) {
    const body = candidates
      .slice(0, -1)
      .map((e) => (opts.json ? JSON.stringify(e) : \`\${e.text} — \${e.author}\`))
      .join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`;

// SKIP-SANITY control: a mutation UNRELATED to the new test (the empty-match exit code).
// Under the same skip pattern it must still produce failures, proving the pattern does not
// silently disable the run.
const CONTROL_BREAK = `  if (opts.list) {
    const body = candidates
      .map((e) => (opts.json ? JSON.stringify(e) : \`\${e.text} -- \${e.author}\`))
      .join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`;

// --- checks -----------------------------------------------------------------------

console.log('=== I-8 verification — cycle 9 ===\n');

// 1. SCOPE: only test/cli.test.js moved, and the product tree is byte-identical to HEAD.
const changed = execFileSync('git', ['-C', TARGET, 'diff', '--name-only', 'HEAD'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);
check(
  'SCOPE: exactly one tracked file changed, and it is test/cli.test.js',
  changed.length === 1 && changed[0] === 'test/cli.test.js',
  `git diff --name-only HEAD -> ${JSON.stringify(changed)}`
);

const productFiles = ['bin/aphorism.js', 'src/args.js', 'src/select.js', 'src/corpus.js'];
for (const f of productFiles) {
  const head = execFileSync('git', ['-C', TARGET, 'show', `HEAD:${f}`], {
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
  });
  const work = fs.readFileSync(path.join(TARGET, f));
  check(
    `SCOPE: ${f} byte-identical to HEAD`,
    Buffer.compare(head, work) === 0,
    `${head.length} B HEAD vs ${work.length} B worktree`
  );
}

// 2. PRE-CYCLE BASELINE, measured by me from HEAD rather than taken from the builder.
const baseDir = scratch('baseline-head');
fs.writeFileSync(
  path.join(baseDir, 'test', 'cli.test.js'),
  execFileSync('git', ['-C', TARGET, 'show', 'HEAD:test/cli.test.js'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
);
const base = runSuite(baseDir, null);
check(
  'BASELINE: HEAD (pre-cycle) suite is 58 tests / 58 pass / 0 fail',
  base.tests === 58 && base.pass === 58 && base.fail === 0,
  `tests ${base.tests} pass ${base.pass} fail ${base.fail} skipped ${base.skipped}`
);

// 3. CURRENT: the working tree is green and grew by exactly one test.
const cur = runSuite(TARGET, null);
check(
  'CURRENT: working tree suite is 59 tests / 59 pass / 0 fail',
  cur.tests === 59 && cur.pass === 59 && cur.fail === 0,
  `tests ${cur.tests} pass ${cur.pass} fail ${cur.fail} skipped ${cur.skipped}`
);
check(
  'CURRENT: suite grew by exactly 1 test over the pre-cycle baseline',
  cur.tests - base.tests === 1,
  `${base.tests} -> ${cur.tests}`
);

// 4. DENOMINATOR control: against PRISTINE product source, the skip pattern must remove
//    exactly the one test added this cycle — 59 -> 58, all green.
const denomDir = scratch('denominator');
const denom = runSuite(denomDir, SKIP_PATTERN);
check(
  'DENOMINATOR: skip pattern removes exactly 1 test (59 -> 58), suite still green',
  denom.tests === 58 && denom.pass === 58 && denom.fail === 0,
  `tests ${denom.tests} pass ${denom.pass} fail ${denom.fail} skipped ${denom.skipped} (pattern "${SKIP_PATTERN}")`
);

// 5. FAILABLE: M16 applied -> the suite fails, and the ONLY failure is the new test.
const failDir = scratch('failable-m16');
if (mutate(failDir, M16, 'M16 pretty-printed array')) {
  const f = runSuite(failDir, null);
  check(
    'FAILABLE: M16 makes the suite fail',
    f.fail > 0,
    `tests ${f.tests} pass ${f.pass} fail ${f.fail}`
  );
  check(
    'FAILABLE: the ONLY failing test is the one added this cycle',
    f.failedNames.length === 1 && f.failedNames[0] === NEW_TEST_NAME,
    `failing: ${JSON.stringify(f.failedNames)}`
  );
}

// 6. ATTRIBUTABLE (strict): M16 applied AND the new test filtered out must return the
//    EXACT pre-cycle baseline. This is the check that proves the new test, not some
//    pre-existing test, is carrying the detection.
const attrDir = scratch('attributable-m16');
if (mutate(attrDir, M16, 'M16 for attribution')) {
  const a = runSuite(attrDir, SKIP_PATTERN);
  check(
    'ATTRIBUTABLE (strict): M16 + new test filtered -> 58 tests / 58 pass / 0 fail',
    a.tests === 58 && a.pass === 58 && a.fail === 0,
    `tests ${a.tests} pass ${a.pass} fail ${a.fail} — pre-cycle baseline was ${base.tests}/${base.pass}/${base.fail}`
  );
}

// 7. SKIP-SANITY: an unrelated breaking mutation under the SAME pattern must still fail,
//    proving the pattern is not silently emptying the run.
const sanityDir = scratch('skip-sanity');
if (mutate(sanityDir, CONTROL_BREAK, 'control: em dash -> double hyphen')) {
  const s = runSuite(sanityDir, SKIP_PATTERN);
  check(
    'SKIP-SANITY: an unrelated mutation still fails under the same skip pattern',
    s.fail > 0 && s.tests === 58,
    `tests ${s.tests} pass ${s.pass} fail ${s.fail}; failing: ${JSON.stringify(s.failedNames.slice(0, 3))}`
  );
}

// 8. DISCRIMINATORS: shapes a weaker assertion would let through.
const discriminators = [
  ['COMPACT single-line JSON array', M16_COMPACT],
  ['REVERSED NDJSON order', M16_REVERSED],
  ['TRUNCATED NDJSON (last entry dropped)', M16_TRUNCATED],
];
for (const [label, mutation] of discriminators) {
  const d = scratch(`disc-${label.split(' ')[0].toLowerCase()}`);
  if (mutate(d, mutation, label)) {
    const r = runSuite(d, null);
    const caught = r.failedNames.includes(NEW_TEST_NAME);
    check(
      `DISCRIMINATOR: new test also kills ${label}`,
      caught,
      `fail ${r.fail}; failing: ${JSON.stringify(r.failedNames)}`
    );
  }
}

// 9. END-TO-END: the shipped binary really does emit NDJSON, so the test is pinning live
//    behaviour rather than a fixture. Checked by execution, not by reading the source.
const corpusMod = require(path.join(TARGET, 'src', 'corpus.js'));
const design = corpusMod.corpus.filter((e) => e.tags.includes('design'));
const e2e = spawnSync(
  process.execPath,
  ['bin/aphorism.js', '--tag', 'design', '--list', '--json'],
  { cwd: TARGET, encoding: 'utf8' }
);
const e2eLines = e2e.stdout.trim().split('\n');
let e2eOk = e2e.status === 0 && e2eLines.length === design.length;
let e2eDetail = `exit ${e2e.status}, ${e2eLines.length} lines, ${design.length} design entries`;
if (e2eOk) {
  try {
    const objs = e2eLines.map((l) => JSON.parse(l));
    e2eOk =
      objs.every((o) => typeof o.text === 'string' && Array.isArray(o.tags)) &&
      objs[0].text === design[0].text &&
      objs[objs.length - 1].text === design[design.length - 1].text;
    e2eDetail += `; every line a standalone object, first/last match corpus order`;
  } catch (err) {
    e2eOk = false;
    e2eDetail += `; a line failed standalone JSON.parse: ${err.message}`;
  }
}
check('END-TO-END: shipped binary emits one standalone JSON object per line, in corpus order', e2eOk, e2eDetail);

// --- teardown ---------------------------------------------------------------------

fs.rmSync(scratchRoot, { recursive: true, force: true });
check('TEARDOWN: scratch copies removed', !fs.existsSync(scratchRoot), scratchRoot);

console.log(`\n=== ${pass} pass / ${fail} fail ===`);
process.exitCode = fail === 0 ? 0 : 1;
