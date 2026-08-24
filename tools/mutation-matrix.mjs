#!/usr/bin/env node
// tools/mutation-matrix.mjs
//
// DETECTION-FLOOR INSTRUMENT (W-2). Measures whether the suite actually
// CATCHES falsifications of the machine-checked document claims that
// tools/guard-inventory.mjs (W-1) inventoried -- as opposed to merely
// containing N tests. Run from the repo root:
//
//     node tools/mutation-matrix.mjs                  # measure the W-2 baseline (20b7ede), print report
//     node tools/mutation-matrix.mjs --rev <rev>      # measure any rev resolvable in this repo (W-12)
//     node tools/mutation-matrix.mjs --write-baseline # also write tools/mutation-matrix-baseline.json
//                                                     # (default baseline rev only; refuses --rev)
//
// The ZERO-ARGUMENT invocation is a frozen contract: it measures the W-2
// baseline commit and must reproduce tools/mutation-matrix-baseline.json
// verdict-for-verdict; tools/run-all.mjs spawns this file with no CLI args
// and relies on exactly that. `--rev` (W-12) points the SAME mutation set at
// a different tree -- the mutations themselves are never re-derived; only
// the tree they are measured against changes. Every run states the resolved
// full sha of the tree it actually measured (asserted against the scratch
// clone's own HEAD, not merely echoed from the argument).
//
// This file is deliberately NOT a test: it lives in tools/, is not matched
// by the suite glob (`node --test test/*.test.js`), registers no node:test
// tests, and adds zero tests anywhere. In default mode it writes nothing
// outside its own scratch clone, and it deletes that scratch clone before
// exiting, so the working tree is left byte-identical. With
// --write-baseline it writes exactly one file: tools/mutation-matrix-baseline.json.
//
// ---------------------------------------------------------------------------
// GENERATION RULE (the whole rule; the mutation list below is its output)
// ---------------------------------------------------------------------------
// For every guard listed in section C (INCLUDED) of
// `node tools/guard-inventory.mjs` at the baseline commit -- the
// machine-checked document claims, 18 of them at 20b7ede, taken in inventory
// order [1]..[18] -- emit exactly ONE mutation: a minimal edit that makes
// that guard's document claim FALSE. The edit is applied to the claimed
// document itself (README.md / docs/) wherever the claim can be falsified by
// a document edit; for a claim that is VACUOUS at baseline with respect to
// its document (inventory [7], "README must list all single-entry tags": the
// corpus has ZERO single-entry tags, so no README edit can falsify a
// containment claim over an empty set), the falsifying edit is instead made
// to the claim's derivation source (src/corpus.js -- it adds a single-entry
// tag the README does not mention), and that mutation is labelled
// `editSite: "derivation-source"` rather than silently blended in. Plus
// exactly ONE identity (no-op) mutation, M00, as converse control: zero
// edits, suite must stay green. Hard cap: 30 mutations; this rule generates
// 18 + 1 = 19. No claim the rule produces is skipped by this harness
// (skippedClaims in the output is the machine-readable proof; if a future
// baseline makes a mutation inapplicable -- e.g. an anchor string no longer
// found -- that claim is recorded there with its reason, never dropped).
//
// The mutations are TRANSCRIBED from the W-1 inventory's 18 INCLUDED rows
// (not re-derived here); each names its inventory index, guard file:line and
// guard title. The harness cross-checks every transcribed guard title
// against the scratch copy's test files at run time. A title that is absent
// from the MEASURED tree does NOT abort the run (W-12 C): the CAUGHT/SILENT
// verdict is still computed and reported, but the mutation is explicitly
// marked UNATTRIBUTABLE in the report and in the JSON
// (guardTitleInMeasuredTree: false, caughtByTargetGuard: null) -- visible
// degradation, never a silent one and never a dead run. This is live at
// HEAD: a cycle-4 consolidation retired one transcribed title (M08's).
//
// ---------------------------------------------------------------------------
// GIT STRATEGY FOR THE SCRATCH COPY (decided, not defaulted)
// ---------------------------------------------------------------------------
// The suite is NOT run in this working tree. Each run makes a full local
// clone -- `git clone --no-hardlinks <repo-root> <scratch>/clone` -- and
// checks it out DETACHED at the measured rev (default: baseline 20b7ede).
//
// The scratch directory is PER-INVOCATION, not shared (W-13): it is created
// with mkdtemp as `.scratch-W-2.XXXXXX/` in the repo root, so two
// overlapping runs each own a private clone and can never delete each
// other's tree out from under a live git process. (The previous fixed
// `.scratch-W-2/` path did exactly that in cycle 4: a second invocation's
// setup rm'd the first's clone mid-run, which died with `spawnSync git
// ENOENT` inside resetClone -- and when the timing missed the deletion
// window, the two runs silently interleaved edits on ONE shared clone,
// corrupting verdicts, which is worse.) Each scratch dir is still deleted
// in the finally block, so no run leaves anything behind on exit. A local
// clone is a real git repository with a real work tree and the FULL commit
// history, which is exactly what test/node-support-citation.test.js needs:
// its two guards spawn `git`, require a work tree, require the README-cited
// base commit (7e50d6f, an ancestor of the baseline) to be reachable, and
// require the checkout to be non-shallow -- otherwise they SKIP for
// environmental reasons and the matrix would be silently corrupted. A full
// local clone satisfies all four preconditions, so those guards run for
// real. `git worktree add` was explicitly rejected: it mutates the shared
// .git/ directory of this repo, which other concurrent work must not see.
// Proof that the git-dependent guards ran is asserted, not assumed: the
// identity run must report 0 skipped tests and both citation-guard titles
// must appear as plain `ok` (no SKIP directive); the harness hard-fails
// otherwise, and records the evidence in the output
// (identity.gitDependentGuards).
//
// Mutations are applied to files in the clone only. Between mutations the
// clone is reset with `git checkout -- .` and verified clean via
// `git status --porcelain` before the next edit is applied. The entire
// per-invocation scratch directory is deleted in a finally block.
//
// The suite command is the CI command with the glob expanded by readdir
// (spawn without a shell): `node --test --test-reporter=tap test/<each>.test.js`.
// "Which NAMED guards fired" = the TAP `not ok` test titles, attributed to
// their test file by scanning the scratch copy's test sources for
// column-0 `test('<title>'` declarations.

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_REV = '20b7ede'; // the W-2 baseline; the zero-argument contract
const BASELINE_JSON = path.join(HERE, 'mutation-matrix-baseline.json');

// Per-invocation scratch (W-13): created by mkdtemp in setUpClone, so the
// path is unique to this process; assigned here so the finally block and the
// scratch helpers can see it.
let SCRATCH_ROOT = null;
let CLONE = null;

// ---------------------------------------------------------------------------
// CLI (W-12). Zero args == measure DEFAULT_REV; that path is frozen
// (tools/run-all.mjs spawns this file with no args). `--rev <rev>` measures
// any rev resolvable in this repo. Unknown arguments are fatal: a mistyped
// flag must not silently fall back to measuring the baseline, or the W-8
// "no detection lost at HEAD" comparison could pass vacuously.
// ---------------------------------------------------------------------------
function usageError(msg) {
  process.stderr.write(
    'error: ' + msg + '\n' +
    'usage: node tools/mutation-matrix.mjs [--rev <rev>] [--write-baseline]\n' +
    '  (no args)         measure the W-2 baseline rev ' + DEFAULT_REV + '\n' +
    '  --rev <rev>       measure <rev> instead (any rev resolvable in this repo)\n' +
    '  --write-baseline  also write tools/mutation-matrix-baseline.json;\n' +
    '                    only valid for the default baseline rev (no --rev)\n'
  );
  process.exit(2);
}

let WRITE_BASELINE = false;
let revArg = null;
{
  const argRest = process.argv.slice(2);
  for (let i = 0; i < argRest.length; i++) {
    const a = argRest[i];
    if (a === '--write-baseline') {
      WRITE_BASELINE = true;
    } else if (a === '--rev') {
      if (i + 1 >= argRest.length) usageError('--rev requires a value');
      revArg = argRest[++i];
    } else if (a.startsWith('--rev=')) {
      revArg = a.slice('--rev='.length);
    } else {
      usageError('unknown argument: ' + a);
    }
  }
  if (revArg !== null && revArg.trim() === '') usageError('--rev requires a non-empty value');
  if (WRITE_BASELINE && revArg !== null) {
    usageError('--write-baseline regenerates the committed baseline and is only valid for the default baseline rev (' + DEFAULT_REV + '); drop --rev');
  }
}
const TARGET_REV = revArg === null ? DEFAULT_REV : revArg;
const IS_DEFAULT_REV = revArg === null;

// The two guards that depend on git (they spawn `git` and skip when the
// environment cannot evaluate the citation). The identity run must show
// both as plain `ok`, or the whole matrix is invalid.
const GIT_DEPENDENT_GUARD_TITLES = [
  'README Node support citation: cited git diff must be empty (or the check must skip on a missing precondition)',
  'README Node support citation: base-to-working-tree diff must also be empty, so an uncommitted falsification is visible now (or the check must skip on a missing precondition)',
];

// ---------------------------------------------------------------------------
// THE MUTATIONS -- output of the generation rule above, one per W-1
// INCLUDED claim, in inventory order. `edits` are exact-string
// replacements against the baseline content; each `find` must occur exactly
// once in its file or the harness refuses to run the mutation (recorded in
// skippedClaims, never silently patched around).
// ---------------------------------------------------------------------------
const MUTATIONS = [
  {
    id: 'M00',
    inventoryIndex: 0,
    guard: null,
    guardTitle: '(identity control -- no claim, no edit)',
    kind: 'identity',
    editSite: 'none',
    note: 'Converse control: zero edits. The suite must stay fully green (129/129 at baseline, 0 fail, 0 skipped) on the untouched scratch clone, or every CAUGHT verdict below is meaningless.',
    edits: [],
  },
  {
    id: 'M01',
    inventoryIndex: 1,
    guard: 'test/readme-matrix-consistency.test.js:125',
    guardTitle: 'README Node support matrix: table must be present and non-empty',
    kind: 'falsify',
    editSite: 'document',
    note: 'Deletes all four parseable matrix rows, so the claim "the table is present and non-empty" is false.',
    edits: [{
      file: 'README.md',
      find: '| v18.20.8 | 129 tests, 127 pass, 0 fail, 2 skipped |\n'
          + '| v20.20.2 | 129 tests, 127 pass, 0 fail, 2 skipped |\n'
          + '| v22.23.2 | 129 tests, 127 pass, 0 fail, 2 skipped |\n'
          + '| v24.19.0 | 129 tests, 127 pass, 0 fail, 2 skipped |\n',
      replace: '',
    }],
  },
  {
    id: 'M02',
    inventoryIndex: 2,
    guard: 'test/readme-matrix-consistency.test.js:140',
    guardTitle: "README Node support matrix: each row's own arithmetic must hold (tests = pass + fail + skipped)",
    kind: 'falsify',
    editSite: 'document',
    note: 'Flips one row\'s pass count (127 -> 126) so that row\'s own arithmetic (126+0+2=128) contradicts its stated 129 tests.',
    edits: [{
      file: 'README.md',
      find: '| v18.20.8 | 129 tests, 127 pass, 0 fail, 2 skipped |',
      replace: '| v18.20.8 | 129 tests, 126 pass, 0 fail, 2 skipped |',
    }],
  },
  {
    id: 'M03',
    inventoryIndex: 3,
    guard: 'test/readme-matrix-consistency.test.js:159',
    guardTitle: 'README Node support matrix: all rows must agree with each other',
    kind: 'falsify',
    editSite: 'document',
    note: 'Rewrites the v24 row to 130/128/0/2 -- internally self-consistent (128+0+2=130) so per-row arithmetic stays true, but it now disagrees with the other three rows.',
    edits: [{
      file: 'README.md',
      find: '| v24.19.0 | 129 tests, 127 pass, 0 fail, 2 skipped |',
      replace: '| v24.19.0 | 130 tests, 128 pass, 0 fail, 2 skipped |',
    }],
  },
  {
    id: 'M04',
    inventoryIndex: 4,
    guard: 'test/readme-tags.test.js:53',
    guardTitle: 'README tags must exist in corpus',
    kind: 'falsify',
    editSite: 'document',
    note: 'Renames the `philosophy` band-table row to `metaphysics`, a backtick-quoted tag claim that does not exist in the corpus.',
    edits: [{
      file: 'README.md',
      find: '| `philosophy` | 3 |',
      replace: '| `metaphysics` | 3 |',
    }],
  },
  {
    id: 'M05',
    inventoryIndex: 5,
    guard: 'test/readme-tags.test.js:85',
    guardTitle: 'README tag counts must match corpus',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes `design`\'s stated count 14 -> 15. 15 still fits the 5+ band, so band membership stays true and only the count claim is false.',
    edits: [{
      file: 'README.md',
      find: '| `design` | 14 |',
      replace: '| `design` | 15 |',
    }],
  },
  {
    id: 'M06',
    inventoryIndex: 6,
    guard: 'test/readme-tags.test.js:102',
    guardTitle: 'README must state total unique tags correctly',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes the counts-table "Distinct tags" row 12 -> 13.',
    edits: [{
      file: 'README.md',
      find: '| Distinct tags | 12 |',
      replace: '| Distinct tags | 13 |',
    }],
  },
  {
    id: 'M07',
    inventoryIndex: 7,
    guard: 'test/readme-tags.test.js:165',
    guardTitle: 'README must list all single-entry tags',
    kind: 'falsify',
    editSite: 'derivation-source',
    note: 'VACUOUS AT BASELINE w.r.t. the document: the corpus has zero single-entry tags, so no README edit can falsify "every single-entry tag is listed". The falsifying edit therefore lands on the derivation source: src/corpus.js gains the tag `zzunlisted` on one entry, creating a single-entry tag the README does not mention. Expected side effects, recorded rather than hidden: the distinct/single-entry count guards also fire, and the citation guard\'s base-to-working-tree diff over src/ becomes non-empty -- which is that guard doing exactly the job its README section states.',
    edits: [{
      file: 'src/corpus.js',
      find: "    text: 'Premature optimization is the root of all evil.',\n"
          + "    author: 'Donald Knuth',\n"
          + "    tags: ['performance'],",
      replace: "    text: 'Premature optimization is the root of all evil.',\n"
          + "    author: 'Donald Knuth',\n"
          + "    tags: ['performance', 'zzunlisted'],",
    }],
  },
  {
    id: 'M08',
    inventoryIndex: 8,
    guard: 'test/readme-tags.test.js:434',
    guardTitle: 'README Tag vocabulary counts table "Tags on exactly one entry" row matches the corpus (structural replacement for the retired token co-occurrence guard, Q-4)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes the counts-table "Tags on exactly one entry" row 0 -> 1. Two guards read this row (recorded redundancy, see the Q-4 block in test/readme-tags.test.js); both are expected to fire.',
    edits: [{
      file: 'README.md',
      find: '| Tags on exactly one entry | 0 |',
      replace: '| Tags on exactly one entry | 1 |',
    }],
  },
  {
    id: 'M09',
    inventoryIndex: 9,
    guard: 'test/readme-tags.test.js:1341',
    guardTitle: 'every `| Tag | Count |` table in the real README Tag vocabulary section is a recognised band table (no table may hide under an unrecognised heading shape)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Inserts a structurally genuine `| Tag | Count |` table under a "### " heading (a shape band detection does not recognise) inside the Tag vocabulary section. Its one row restates a TRUE count (`humor` 9) so every other claim stays true -- only the census claim "every such table is a recognised band" is false.',
    edits: [{
      file: 'README.md',
      find: '\nTo find available tags at the command line, run:',
      replace: '\n### More tags\n\n| Tag | Count |\n|---|---|\n| `humor` | 9 |\n\nTo find available tags at the command line, run:',
    }],
  },
  {
    id: 'M10',
    inventoryIndex: 10,
    guard: 'test/readme-tags.test.js:1361',
    guardTitle: 'every band table in README Tag vocabulary contains exactly the corpus tags whose count fits that band',
    kind: 'falsify',
    editSite: 'document',
    note: 'Relocates the `philosophy` row (corpus count 3) out of the 3-4 band into the 5+ band. Its stated count is unchanged and still matches the corpus, so the pure count guard stays true; only band membership is false, in both directions at once.',
    edits: [
      {
        file: 'README.md',
        find: '| `reliability` | 4 |\n| `philosophy` | 3 |\n',
        replace: '| `reliability` | 4 |\n',
      },
      {
        file: 'README.md',
        find: '| `performance` | 5 |\n',
        replace: '| `performance` | 5 |\n| `philosophy` | 3 |\n',
      },
    ],
  },
  {
    id: 'M11',
    inventoryIndex: 11,
    guard: 'test/readme-tags.test.js:1433',
    guardTitle: 'every corpus tag appearing on 2+ entries must have a row in some band table (no band table may be deleted wholesale) (T-019)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Deletes the "#### Appears 3–4 times" band wholesale -- heading and all five rows -- stranding five multi-entry corpus tags with no band row anywhere. Every remaining stated fact is still true, which is exactly the falsification shape T-019 exists to catch.',
    edits: [{
      file: 'README.md',
      find: '#### Appears 3–4 times\n'
          + '| Tag | Count |\n'
          + '|---|---|\n'
          + '| `language` | 4 |\n'
          + '| `process` | 4 |\n'
          + '| `readability` | 4 |\n'
          + '| `reliability` | 4 |\n'
          + '| `philosophy` | 3 |\n'
          + '\n',
      replace: '',
    }],
  },
  {
    id: 'M12',
    inventoryIndex: 12,
    guard: 'test/readme-tags.test.js:1598',
    guardTitle: 'README must state correct multi-entry and single-entry tag counts',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes the counts-table "Tags on 2 or more entries" row 12 -> 11 (the row only this guard reads; the shared single-entry row is left alone so M08 and M12 stay independently attributable).',
    edits: [{
      file: 'README.md',
      find: '| Tags on 2 or more entries | 12 |',
      replace: '| Tags on 2 or more entries | 11 |',
    }],
  },
  {
    id: 'M13',
    inventoryIndex: 13,
    guard: 'test/readme-tags.test.js:1851',
    guardTitle: 'README Tag vocabulary section must contain no unrecognised count-claim digits (J-5)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Adds a prose sentence carrying a digit ("In total 12 tags are in use.") to the Tag vocabulary section. The figure is TRUE and checked by nothing -- the exact claim shape the digit-hygiene rule declares a violation.',
    edits: [{
      file: 'README.md',
      find: 'The distribution is uneven, but every tag is a real pool.',
      replace: 'The distribution is uneven, but every tag is a real pool. In total 12 tags are in use.',
    }],
  },
  {
    id: 'M14',
    inventoryIndex: 14,
    guard: 'test/readme-tags.test.js:2318',
    guardTitle: 'README Attribution table "Entries ranked" count must match corpus.length and the triage doc (C1)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes the Attribution counts-table "Entries ranked" row 50 -> 51, contradicting both corpus.length and the triage doc\'s row count.',
    edits: [{
      file: 'README.md',
      find: '| Entries ranked | 50 |',
      replace: '| Entries ranked | 51 |',
    }],
  },
  {
    id: 'M15',
    inventoryIndex: 15,
    guard: 'test/readme-tags.test.js:2350',
    guardTitle: 'README Attribution table "Rated HIGH risk" count must match the triage doc table (C2)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes the Attribution counts-table "Rated HIGH risk" row 8 -> 9, contradicting the triage doc\'s HIGH-row count.',
    edits: [{
      file: 'README.md',
      find: '| Rated HIGH risk | 8 |',
      replace: '| Rated HIGH risk | 9 |',
    }],
  },
  {
    id: 'M16',
    inventoryIndex: 16,
    guard: 'test/readme-tags.test.js:2384',
    guardTitle: 'README Attribution section must contain no digit runs outside the counts table (C7)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Adds a digit run to the Attribution section\'s prose, outside the counts table -- a number no guard verifies.',
    edits: [{
      file: 'README.md',
      find: 'Nothing\nin that list has been resolved yet.',
      replace: 'Nothing\nin that list has been resolved yet, and 3 entries remain unreviewed.',
    }],
  },
  {
    id: 'M17',
    inventoryIndex: 17,
    guard: 'test/readme-tags.test.js:2682',
    guardTitle: "README `--list` format literal matches the shipped binary's actual --list output (T-017)",
    kind: 'falsify',
    editSite: 'document',
    note: 'Swaps the `--list` format literal\'s EM DASH separator for an ASCII hyphen, so the documented per-line format no longer matches what the unchanged binary prints.',
    edits: [{
      file: 'README.md',
      find: '`<text> — <author>`',
      replace: '`<text> - <author>`',
    }],
  },
  {
    id: 'M18',
    inventoryIndex: 18,
    guard: 'test/readme-tags.test.js:2754',
    guardTitle: 'README `--author` matching section must state the correct count of distinct corpus authors (Q-8)',
    kind: 'falsify',
    editSite: 'document',
    note: 'Changes the "24 distinct authors" claim to 25; the corpus\'s true distinct-author count is unchanged.',
    edits: [{
      file: 'README.md',
      find: "Of the corpus's 24 distinct authors",
      replace: "Of the corpus's 25 distinct authors",
    }],
  },
];

if (MUTATIONS.length > 30) {
  throw new Error('generation rule cap violated: ' + MUTATIONS.length + ' mutations > 30');
}
if (MUTATIONS.filter((m) => m.kind === 'identity').length !== 1) {
  throw new Error('exactly one identity mutation is required');
}

// ---------------------------------------------------------------------------
// git helpers
// ---------------------------------------------------------------------------
function git(cwd, args, opts = {}) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw res.error;
  if (!opts.allowFail && res.status !== 0) {
    throw new Error('git ' + args.join(' ') + ' failed (exit ' + res.status + '): ' + res.stderr);
  }
  return res;
}

// ---------------------------------------------------------------------------
// suite runner + TAP parsing. Flat TAP: every test() is a column-0
// `ok N - title` / `not ok N - title` point; skips carry a `# SKIP`
// directive; the summary is `# tests/pass/fail/skipped N`.
// ---------------------------------------------------------------------------
function runSuite(cwd) {
  const testFiles = readdirSync(path.join(cwd, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .sort()
    .map((f) => 'test/' + f);
  const res = spawnSync(
    process.execPath,
    ['--test', '--test-reporter=tap', ...testFiles],
    { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  if (res.error) throw res.error;
  const tap = (res.stdout || '') + '\n' + (res.stderr || '');

  const pick = (k) => {
    const m = tap.match(new RegExp('^# ' + k + ' (\\d+)$', 'm'));
    return m ? Number(m[1]) : null;
  };
  const failed = [];
  const skipped = [];
  const passedTitles = new Set();
  for (const line of tap.split('\n')) {
    let m = line.match(/^not ok \d+ - (.*?)(?:\s+# (?:SKIP|TODO).*)?$/);
    if (m) { failed.push(m[1]); continue; }
    m = line.match(/^ok \d+ - (.*?)\s+# SKIP.*$/);
    if (m) { skipped.push(m[1]); continue; }
    m = line.match(/^ok \d+ - (.*)$/);
    if (m) passedTitles.add(m[1]);
  }
  return {
    totals: { tests: pick('tests'), pass: pick('pass'), fail: pick('fail'), skipped: pick('skipped') },
    failed,
    skipped,
    passedTitles,
  };
}

// Map test titles -> test file, from column-0 `test('...')` declarations in
// the scratch copy's own sources (so attribution follows the baseline, not
// this working tree).
function buildTitleMap(cwd) {
  const map = new Map();
  for (const f of readdirSync(path.join(cwd, 'test')).filter((x) => x.endsWith('.test.js'))) {
    const src = readFileSync(path.join(cwd, 'test', f), 'utf8');
    for (const line of src.split('\n')) {
      const m = line.match(/^test\(\s*(['"])((?:\\.|(?!\1).)*)\1/);
      if (m) map.set(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'), 'test/' + f);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// scratch lifecycle
// ---------------------------------------------------------------------------
function setUpClone() {
  // W-13: a fresh, process-unique scratch dir per invocation. mkdtemp
  // guarantees the name is not shared with any concurrent run, so no
  // invocation can ever delete or re-clone another's tree. Never pre-delete
  // sibling `.scratch-W-2.*` dirs here: sweeping them would reintroduce
  // exactly the cross-run destruction this scheme removes.
  SCRATCH_ROOT = mkdtempSync(path.join(ROOT, '.scratch-W-2.'));
  CLONE = path.join(SCRATCH_ROOT, 'clone');

  // W-12: the measured rev must resolve to a commit here before we clone at
  // all. `--verify --end-of-options` makes a flag-shaped --rev value fail
  // loudly instead of being read as a git option.
  const fullSha = git(ROOT, ['rev-parse', '--verify', '--end-of-options', TARGET_REV + '^{commit}']).stdout.trim();

  git(ROOT, ['clone', '--quiet', '--no-hardlinks', ROOT, CLONE]);
  git(CLONE, ['checkout', '--quiet', '--detach', fullSha]);

  // The sha we report as "measured" is asserted against the clone's own
  // HEAD -- what the suite actually ran against -- not echoed from the CLI.
  const head = git(CLONE, ['rev-parse', 'HEAD']).stdout.trim();
  if (head !== fullSha) {
    throw new Error('scratch clone HEAD ' + head + ' is not the requested rev ' + fullSha);
  }
  const shallow = git(CLONE, ['rev-parse', '--is-shallow-repository']).stdout.trim();
  if (shallow !== 'false') {
    throw new Error('scratch clone is shallow -- the git-dependent guards would skip and corrupt the matrix');
  }
  return fullSha;
}

function resetClone() {
  git(CLONE, ['checkout', '--quiet', '--', '.']);
  git(CLONE, ['clean', '--quiet', '-fd']);
  const status = git(CLONE, ['status', '--porcelain']).stdout.trim();
  if (status !== '') {
    throw new Error('scratch clone not clean after reset:\n' + status);
  }
}

function applyEdits(mutation) {
  for (const edit of mutation.edits) {
    const p = path.join(CLONE, edit.file);
    const before = readFileSync(p, 'utf8');
    const occurrences = before.split(edit.find).length - 1;
    if (occurrences !== 1) {
      throw Object.assign(
        new Error(mutation.id + ': anchor occurs ' + occurrences + ' times (need exactly 1) in ' + edit.file),
        { skippable: true }
      );
    }
    writeFileSync(p, before.replace(edit.find, edit.replace));
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const report = [];
const P = (s = '') => { report.push(s); console.log(s); };

let measuredSha;
const results = [];
const skippedClaims = [];
let identityResult = null;

try {
  measuredSha = setUpClone();
  const titleMap = buildTitleMap(CLONE);

  // Cross-check the transcribed inventory against the suite of the MEASURED
  // tree. A missing title must NOT abort the run (W-12 C): titles were
  // transcribed at the default baseline, and a later tree may have renamed
  // or consolidated a guard (live at HEAD since a cycle-4 consolidation).
  // The CAUGHT/SILENT verdict -- the thing the detection floor turns on --
  // is still computed for every mutation; only per-guard ATTRIBUTION
  // degrades, and it degrades visibly: the mutation is flagged
  // UNATTRIBUTABLE in the printed report, and carries
  // guardTitleInMeasuredTree: false / caughtByTargetGuard: null in the JSON.
  const missingGuardTitles = new Set();
  for (const m of MUTATIONS) {
    if (m.kind === 'identity') continue;
    if (!titleMap.has(m.guardTitle)) {
      missingGuardTitles.add(m.id);
      process.stderr.write(m.id + ' NOTE: transcribed guard title not found in the measured tree'
        + ' -- verdict will still be computed, attribution degrades to UNATTRIBUTABLE: '
        + m.guardTitle + '\n');
    }
  }

  for (const m of MUTATIONS) {
    resetClone();
    try {
      applyEdits(m);
    } catch (e) {
      if (e.skippable) {
        skippedClaims.push({ id: m.id, inventoryIndex: m.inventoryIndex, guard: m.guard, guardTitle: m.guardTitle, reason: e.message });
        process.stderr.write(m.id + ' SKIPPED: ' + e.message + '\n');
        continue;
      }
      throw e;
    }

    if (m.kind === 'identity') {
      const status = git(CLONE, ['status', '--porcelain']).stdout.trim();
      if (status !== '') throw new Error('identity control has a dirty tree: ' + status);
    }

    process.stderr.write('running ' + m.id + ' (' + (m.guard || 'identity') + ') ... ');
    const run = runSuite(CLONE);
    process.stderr.write('tests=' + run.totals.tests + ' fail=' + run.totals.fail + ' skipped=' + run.totals.skipped + '\n');

    const firedGuards = run.failed.map((title) => ({ file: titleMap.get(title) || null, title }));
    const entry = {
      id: m.id,
      inventoryIndex: m.inventoryIndex,
      guard: m.guard,
      guardTitle: m.guardTitle,
      editSite: m.editSite,
      note: m.note,
      edits: m.edits.map((e) => ({ file: e.file, find: e.find, replace: e.replace })),
      suite: run.totals,
      firedGuards,
      skippedGuards: run.skipped,
      environmentalSkipWarning: run.skipped.some((t) => GIT_DEPENDENT_GUARD_TITLES.includes(t))
        ? 'a git-dependent guard SKIPPED during this run -- its verdict for this mutation is environmental, not evidential'
        : null,
    };

    if (m.kind === 'identity') {
      const gitGuardsRan = GIT_DEPENDENT_GUARD_TITLES.every((t) => run.passedTitles.has(t));
      entry.verdict = run.totals.fail === 0 && run.totals.skipped === 0 && gitGuardsRan ? 'GREEN' : 'NOT-GREEN';
      entry.gitDependentGuards = {
        ran: gitGuardsRan,
        titles: GIT_DEPENDENT_GUARD_TITLES,
        evidence: gitGuardsRan
          ? 'both citation guards reported plain `ok` with no SKIP directive in the identity run, and the run reports 0 skipped overall'
          : 'MISSING -- at least one citation guard did not pass un-skipped in the identity run',
      };
      identityResult = entry;
      if (entry.verdict !== 'GREEN') {
        throw new Error('IDENTITY CONTROL IS NOT GREEN (fail=' + run.totals.fail + ', skipped=' + run.totals.skipped + ', gitGuardsRan=' + gitGuardsRan + ') -- matrix invalid. Failed: ' + run.failed.join(' | '));
      }
    } else {
      entry.verdict = run.totals.fail > 0 ? 'CAUGHT' : 'SILENT';
      entry.guardTitleInMeasuredTree = !missingGuardTitles.has(m.id);
      // Attribution to the named guard is only meaningful when that guard
      // exists in the measured tree; otherwise it is explicitly null, and
      // the printed report marks the row UNATTRIBUTABLE.
      entry.caughtByTargetGuard = entry.guardTitleInMeasuredTree
        ? firedGuards.some((g) => g.title === m.guardTitle)
        : null;
      results.push(entry);
    }
  }

  resetClone();
} finally {
  if (SCRATCH_ROOT !== null) rmSync(SCRATCH_ROOT, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// report + baseline JSON
// ---------------------------------------------------------------------------
P('MUTATION MATRIX -- detection floor for the W-1 machine-checked document claims');
P('measured rev: ' + TARGET_REV + ' -> resolved full sha ' + measuredSha
  + (IS_DEFAULT_REV
      ? ' (default W-2 baseline; zero-argument contract, comparable to tools/mutation-matrix-baseline.json)'
      : ' (named via --rev; NOT the default baseline)')
  + '   node: ' + process.version);
P('mutations run: ' + (results.length + (identityResult ? 1 : 0)) + ' of ' + MUTATIONS.length + ' generated (' + results.length + ' falsifying + 1 identity); skipped: ' + skippedClaims.length);
P('');
P('identity control M00: ' + identityResult.verdict + ' (' + identityResult.suite.tests + ' tests, ' + identityResult.suite.fail + ' fail, ' + identityResult.suite.skipped + ' skipped; git-dependent guards ran: ' + identityResult.gitDependentGuards.ran + ')');
P('');
for (const r of results) {
  P(r.id + '  [inventory ' + r.inventoryIndex + ']  ' + r.guard);
  P('     claim: ' + r.guardTitle);
  let verdictLine = '     verdict: ' + r.verdict;
  if (r.verdict === 'CAUGHT') {
    verdictLine += ' by ' + r.firedGuards.length + ' guard(s)';
    if (r.guardTitleInMeasuredTree) {
      verdictLine += r.caughtByTargetGuard ? ' incl. the targeted guard' : ' -- NOT incl. the targeted guard';
    }
  } else {
    verdictLine += ' -- no guard fired; this claim\'s falsification is undetected';
  }
  if (!r.guardTitleInMeasuredTree) {
    verdictLine += '  [UNATTRIBUTABLE: the transcribed guard title does not exist in the measured tree, so attribution to the named guard is impossible]';
  }
  P(verdictLine);
  for (const g of r.firedGuards) P('       - ' + (g.file || '(unattributed)') + '  ' + g.title);
  if (r.skippedGuards.length) P('     skipped guards this run: ' + r.skippedGuards.join(' | '));
  if (r.environmentalSkipWarning) P('     WARNING: ' + r.environmentalSkipWarning);
  P('');
}
if (skippedClaims.length) {
  P('claims produced by the rule but skipped by the harness:');
  for (const s of skippedClaims) P('  ' + s.id + '  ' + s.guard + '  reason: ' + s.reason);
} else {
  P('claims produced by the rule but skipped by the harness: NONE');
}
const silent = results.filter((r) => r.verdict === 'SILENT');
const unattributableResults = results.filter((r) => !r.guardTitleInMeasuredTree);
P('');
P('summary: ' + results.filter((r) => r.verdict === 'CAUGHT').length + ' CAUGHT, ' + silent.length + ' SILENT'
  + (silent.length ? ' (' + silent.map((r) => r.id).join(', ') + ')' : ''));
P('unattributable mutations (transcribed guard title absent from the measured tree): '
  + (unattributableResults.length ? unattributableResults.map((r) => r.id).join(', ') : 'NONE'));

const baseline = {
  meta: {
    tool: 'tools/mutation-matrix.mjs',
    measuredRev: TARGET_REV,
    measuredCommit: measuredSha,
    baselineCommit: measuredSha,
    baselineCommitShort: DEFAULT_REV,
    node: process.version,
    suiteCommand: 'node --test --test-reporter=tap <test/*.test.js, glob expanded by readdir>',
    scratchStrategy: 'full local git clone (git clone --no-hardlinks) of the repo into a per-invocation mkdtemp dir .scratch-W-2.XXXXXX/clone (W-13: never a fixed shared path), detached checkout at the measured rev; deleted after the run',
    generationRule: 'one falsifying mutation per INCLUDED claim of tools/guard-inventory.mjs at the baseline (18 claims, inventory order; document-side edit wherever the claim is document-falsifiable, derivation-source edit for the one claim vacuous at baseline) plus exactly one identity control; cap 30',
  },
  identity: identityResult,
  results,
  skippedClaims,
};

if (WRITE_BASELINE) {
  writeFileSync(BASELINE_JSON, JSON.stringify(baseline, null, 2) + '\n');
  P('');
  P('baseline written to tools/mutation-matrix-baseline.json');
}
