#!/usr/bin/env node
// tools/run-all.mjs
//
// ONE ENTRY POINT that re-runs every measurement executable this run (W-9's
// predecessor items) shipped under tools/, in a stated order, and prints
// each one's REAL, re-derived output under a labelled heading. Run it from
// the repo root:
//
//     node tools/run-all.mjs                       # default run (see below)
//     node tools/run-all.mjs --include-mutation-matrix   # also run W-2
//     node tools/run-all.mjs --help
//
// Running this file to completion is sufficient for a skeptical reader to
// re-derive every number this run publishes WITHOUT reading REPORT.md.
//
// ---------------------------------------------------------------------------
// WHAT THIS FILE IS -- AND, JUST AS LOAD-BEARING, WHAT IT IS NOT
// ---------------------------------------------------------------------------
// This is a DISPATCHER, not a report generator. It invokes each published
// tool as a real child process and relays its real output verbatim: the
// child's stdout is written straight through, and if the child ALSO wrote
// to stderr, that text is relayed too, under a labelled heading -- both
// onto THIS dispatcher's own stdout, so a plain
// `node tools/run-all.mjs > evidence.txt` capture never shows the heading
// with an empty body while the real content went to a stream that capture
// didn't redirect. (This dispatcher does not have a separate stderr output
// of its own -- everything it prints, including relayed child stderr, is on
// its stdout.) It does not parse, restate, summarise or
// interpret any tool's findings -- the judgement this file makes about a
// tool's run is mechanical, and it is TWO checks, not one:
//   (1) did the child process exit 0 ("ran clean") or non-zero ("reported a
//       problem"), using each tool's OWN documented exit contract (several
//       of these tools -- citation-rule-check.mjs, matrix-adjudication.mjs,
//       detection-floor.mjs -- use a non-zero exit code as their designed
//       way of reporting a real finding, e.g. STALE or DIVERGED; relaying
//       that code is not this file forming an opinion, it is this file not
//       hiding the tool's own opinion); and
//   (2) even on exit 0, did the child publish anything at all -- if it wrote
//       zero bytes to BOTH stdout and stderr, this file marks that tool
//       SILENT rather than clean, and the run does not exit 0. Silence is
//       a property of the dispatch, not of any tool's findings: a tool
//       that ran but produced no bytes did not re-derive anything for a
//       reader to check, and "clean" is a claim about content this file
//       never had, so it cannot make that claim on the tool's behalf. This
//       is still not content judgement -- it does not matter WHAT a tool
//       published, only THAT it published something.
//
// It writes nothing to the working tree. It imports nothing outside
// node: builtins (child_process, path, url -- grep this file yourself).
// It lives in tools/, is not named *.test.js, and registers no node:test
// tests, so `node --test test/*.test.js` does not collect it.
//
// ---------------------------------------------------------------------------
// ORDER (stated, and fixed regardless of flags)
// ---------------------------------------------------------------------------
//   [1] tools/guard-inventory.mjs     (W-1) the inventory of count-claim
//       guards that actually bind at HEAD.
//   [2] tools/test-line-delta.mjs     (W-10) the before/after test/ line
//       count between the run's baseline commit (20b7ede) and HEAD, with the
//       delta and the commit(s) responsible. guard-inventory.mjs (above)
//       only ever measures the checked-out working tree, so it cannot
//       answer a two-revision question; this is the tool that can.
//   [3] tools/mutation-matrix.mjs     (W-2) the detection floor for [1]'s
//       claims. DEFAULT EXCLUDED -- see "THE OPT-IN" below. When excluded,
//       its slot in the order still prints a labelled heading explaining
//       that it did not run and exactly how to run it, so the roll-up never
//       silently omits it.
//   [4] tools/citation-rule-check.mjs (W-3) checks that the citation-history
//       doc quotes README's own selection rule verbatim.
//   [5] tools/citation-tax.mjs        (W-4) the citation two-commit tax over
//       committed history.
//   [6] tools/matrix-adjudication.mjs (W-5) adjudicates the README Node
//       support matrix's pass/skip numbers (the tool's own header names the
//       historical 127-vs-129 dispute that motivated it -- this file does
//       not restate that pair, since README's own numbers have since moved).
//   [7] tools/detection-floor.mjs     (W-8) compares the committed W-2
//       baseline matrix record against the committed final-HEAD record
//       (tools/mutation-matrix-final.json) row by row and rules on whether
//       any baseline detection was lost. Its default path only reads the two
//       committed JSON records plus git metadata -- no suite runs -- so it is
//       fast and always runs here. Its exit code is its own designed verdict
//       (0 floor holds; 1 floor broken/untrustworthy; 3 the final record is
//       stale w.r.t. HEAD); relaying a non-zero here is not this file's
//       opinion, it is that tool's.
//
// ---------------------------------------------------------------------------
// THE OPT-IN (read this before assuming the default run is the whole story)
// ---------------------------------------------------------------------------
// tools/mutation-matrix.mjs runs the full suite ~19 times against a fresh
// local git clone (one per mutation, plus the identity control) -- it is by
// far the slowest tool here, and the only one that touches disk outside the
// working tree (its own scratch clone, which it deletes itself). Everything
// else below runs in low single-digit seconds.
//
// DEFAULT (`node tools/run-all.mjs`, no flags): the mutation matrix is
// EXCLUDED. Its slot in the order [3] still prints, and states plainly that
// it was skipped, why, and the flag that includes it. The roll-up line at
// the end marks it SKIPPED, never silently drops it.
//
// TO INCLUDE IT: `node tools/run-all.mjs --include-mutation-matrix`. This
// is the ONLY thing that flag changes -- every other tool always runs.
//
// Whichever way you invoke this file, the run is honest about what it did
// and did not run: nothing here is ever silently omitted from the output or
// from the final roll-up line. That honesty extends to a tool that DID run
// but published nothing: exit 0 with zero bytes on stdout and zero bytes on
// stderr is marked SILENT, not clean, and it is not folded into "ran clean"
// -- a roll-up line cannot claim a tool re-derived its numbers when the
// tool re-derived nothing this dispatcher could see.
//
// ---------------------------------------------------------------------------
// ZERO DEPENDENCIES
// ---------------------------------------------------------------------------
// The only imports in this file are node:child_process, node:path and
// node:url. Nothing else is imported, required, or fetched.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log([
    'usage: node tools/run-all.mjs [--include-mutation-matrix]',
    '',
    'Re-runs every measurement executable this run published under tools/, in',
    'a stated order, and prints each one\'s real output under a labelled',
    'heading, ending with a one-line roll-up of which ran clean, which',
    'reported a problem, and which ran but published nothing (SILENT).',
    '',
    '  --include-mutation-matrix   also run tools/mutation-matrix.mjs (W-2).',
    '                              Excluded by default because it runs the',
    '                              full suite ~19 times against a scratch',
    '                              clone; everything else runs in seconds.',
    '  --help, -h                  print this message and exit 0.',
  ].join('\n'));
  process.exit(0);
}
const INCLUDE_MUTATION_MATRIX = args.includes('--include-mutation-matrix');

// ---------------------------------------------------------------------------
// The stated order. `run: false` means "do not spawn it this invocation";
// its heading and roll-up entry still print, with `skipReason` shown
// verbatim in both places.
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    id: 'guard-inventory',
    label: 'tools/guard-inventory.mjs  (W-1 -- count-claim guard inventory)',
    file: 'tools/guard-inventory.mjs',
    cliArgs: [],
    run: true,
  },
  {
    id: 'test-line-delta',
    label: 'tools/test-line-delta.mjs  (W-10 -- test/ line count, baseline 20b7ede vs HEAD)',
    file: 'tools/test-line-delta.mjs',
    cliArgs: [],
    run: true,
  },
  {
    id: 'mutation-matrix',
    label: 'tools/mutation-matrix.mjs  (W-2 -- detection floor for W-1\'s claims)',
    file: 'tools/mutation-matrix.mjs',
    cliArgs: [], // deliberately never --write-baseline: this dispatcher must
                 // leave the tree byte-identical, and baseline-writing is a
                 // separate, explicit, human-invoked action.
    run: INCLUDE_MUTATION_MATRIX,
    skipReason: INCLUDE_MUTATION_MATRIX ? null : (
      'SKIPPED BY DEFAULT: this tool runs the full suite ~19 times against a\n' +
      'fresh scratch git clone (one run per rule-generated mutation, plus the\n' +
      'identity control) and is far slower than everything else in this file.\n' +
      'To include it, re-run: node tools/run-all.mjs --include-mutation-matrix'
    ),
  },
  {
    id: 'citation-rule-check',
    label: 'tools/citation-rule-check.mjs  (W-3 -- citation-history doc quotes README verbatim)',
    file: 'tools/citation-rule-check.mjs',
    cliArgs: [],
    run: true,
  },
  {
    id: 'citation-tax',
    label: 'tools/citation-tax.mjs  (W-4 -- the citation two-commit tax over history)',
    file: 'tools/citation-tax.mjs',
    cliArgs: [],
    run: true,
  },
  {
    id: 'matrix-adjudication',
    label: 'tools/matrix-adjudication.mjs  (W-5 -- adjudicates the README Node support matrix\'s pass/skip numbers; the tool\'s own header names the historical 127-vs-129 dispute that motivated it)',
    file: 'tools/matrix-adjudication.mjs',
    cliArgs: [],
    run: true,
  },
  {
    id: 'detection-floor',
    label: 'tools/detection-floor.mjs  (W-8 -- no baseline detection lost at final HEAD)',
    file: 'tools/detection-floor.mjs',
    cliArgs: [], // deliberately never --remeasure: the default path compares the
                 // two COMMITTED records (fast, no suite runs). --remeasure is a
                 // separate, explicit, human-invoked action for proving the
                 // committed final record reproduces live.
    run: true,
  },
];

function heading(n, total, label) {
  const bar = '='.repeat(80);
  console.log('');
  console.log(bar);
  console.log(`[${n}/${total}] ${label}`);
  console.log(bar);
}

const rollup = [];
const total = TOOLS.length;

for (let i = 0; i < TOOLS.length; i++) {
  const tool = TOOLS[i];
  const n = i + 1;
  heading(n, total, tool.label);

  if (!tool.run) {
    console.log(tool.skipReason);
    rollup.push({ id: tool.id, status: 'SKIPPED' });
    continue;
  }

  const command = `node ${tool.file}${tool.cliArgs.length ? ' ' + tool.cliArgs.join(' ') : ''}`;
  console.log(`$ ${command}`);
  console.log('');

  const startedAt = Date.now();
  const result = spawnSync(process.execPath, [tool.file, ...tool.cliArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  const elapsedMs = Date.now() - startedAt;

  if (result.error) {
    console.log(`[run-all] FAILED TO SPAWN: ${result.error.message}`);
    rollup.push({ id: tool.id, status: 'PROBLEM', detail: 'spawn error' });
    continue;
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr && result.stderr.trim() !== '') {
    console.log('');
    console.log('-- stderr (relayed verbatim) --');
    process.stdout.write(result.stderr);
  }

  const exitCode = result.status; // null if killed by signal
  const publishedNothing = exitCode === 0 &&
    (!result.stdout || result.stdout.length === 0) &&
    (!result.stderr || result.stderr.length === 0);
  console.log('');
  if (result.signal) {
    console.log(`[run-all] ${tool.file} was terminated by signal ${result.signal} (${elapsedMs}ms elapsed)`);
    rollup.push({ id: tool.id, status: 'PROBLEM', detail: `signal ${result.signal}` });
  } else {
    console.log(`[run-all] ${tool.file} exited ${exitCode} (${elapsedMs}ms elapsed)`);
    if (publishedNothing) {
      console.log(
        `[run-all] SILENT: zero bytes on both stdout and stderr, despite exit 0. This ` +
        `dispatcher relays what a tool re-derived; a tool that produced nothing re-derived ` +
        `nothing, so it is not "clean" -- it is silent, and this run will not exit 0.`
      );
    }
    rollup.push({
      id: tool.id,
      status: exitCode === 0 ? (publishedNothing ? 'SILENT' : 'CLEAN') : 'PROBLEM',
      detail: publishedNothing ? `exit ${exitCode}, published nothing` : `exit ${exitCode}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Roll-up. One line per tool, ending in a single summary line. This section
// relays exit-code facts only -- it does not restate, count, or characterise
// any tool's findings.
// ---------------------------------------------------------------------------
console.log('');
console.log('='.repeat(80));
console.log('ROLL-UP');
console.log('='.repeat(80));
for (const r of rollup) {
  const tag = r.status === 'CLEAN' ? 'clean'
    : r.status === 'SKIPPED' ? 'SKIPPED'
    : r.status === 'SILENT' ? 'SILENT (published nothing)'
    : 'PROBLEM';
  console.log(`  ${r.id.padEnd(22)} ${tag}${r.detail ? '  (' + r.detail + ')' : ''}`);
}
const clean = rollup.filter((r) => r.status === 'CLEAN');
const problems = rollup.filter((r) => r.status === 'PROBLEM');
const silent = rollup.filter((r) => r.status === 'SILENT');
const skipped = rollup.filter((r) => r.status === 'SKIPPED');
console.log('');
console.log(
  `ROLL-UP: ${clean.length}/${rollup.length} ran clean` +
  (problems.length ? `; PROBLEM: ${problems.map((r) => r.id).join(', ')}` : '') +
  (silent.length ? `; SILENT (published nothing): ${silent.map((r) => r.id).join(', ')}` : '') +
  (skipped.length ? `; SKIPPED: ${skipped.map((r) => r.id).join(', ')}` : '') +
  '.'
);

process.exitCode = (problems.length > 0 || silent.length > 0) ? 1 : 0;
