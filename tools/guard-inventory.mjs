#!/usr/bin/env node
// tools/guard-inventory.mjs
//
// READ-AND-REPORT INVENTORY of every count-claim guard in test/ that actually
// binds at HEAD. Run from the repo root:
//
//     node tools/guard-inventory.mjs
//
// Everything this tool reports is RE-DERIVED from the repo at run time --
// test titles, line counts, test counts, per-guard classifications, and the
// suite-size-floor verdict all come from parsing test/, .github/ and the
// sources as they exist right now, never from numbers copied into this file.
// The only literals this file carries are (a) classifier RULES (regexes and
// name->description mappings for mechanisms that exist in the test files) and
// (b) rule constants like "a floor is a comparison against a >= 2 literal";
// no measurement of the repo is hardcoded here.
//
// It is deliberately NOT a test file: it lives in tools/, is not matched by
// the suite glob (`node --test test/*.test.js`), registers no node:test
// tests, and asserts nothing. It only reads files and spawns read-only
// subprocesses (`node --test --test-reporter=tap <file>` per test file, to
// cross-check the statically-derived test counts against the runner's own
// count). It writes nothing, so the working tree stays byte-identical.
//
// Section G's suite-size-floor verdict is BOUNDED, not categorical: it prints
// the exact probe table it ran (section F's probes, generated from the same
// array) and the classes of floor that table structurally cannot see. "ABSENT"
// here means "not detected by these probes", and says so in those words. See
// the probe-table comment above auditSuiteFloor().
//
// ---------------------------------------------------------------------------
// INCLUSION RULE (the classifier, stated for the skeptical reader)
// ---------------------------------------------------------------------------
// A test is an INCLUDED count-claim guard iff BOTH of:
//
//   (a) its body reads a real repo DOCUMENT at test time -- README.md or a
//       file under docs/ -- (evidence: a readFileSync of that path inside
//       the test block), AND
//   (b) at least one of its assertions is COUNT-SHAPED: it compares a number
//       parsed out of the document (a table cell, a digit captured by regex,
//       a .length of parsed rows/tables, arithmetic over parsed row fields)
//       against an expected value, OR it asserts set-containment/equality
//       between a document-claimed collection and an independently derived
//       collection (a structural count claim: exact set equality implies
//       equal cardinality; one-directional containment is a coverage floor).
//
// For each INCLUDED guard the report states where its EXPECTED value comes
// from, because that provenance is the point of the inventory:
//   - DERIVED from src/corpus.js at test time  -> self-updating, cannot go
//     stale when the corpus changes;
//   - DERIVED from another repo document at test time (docs/*.md)  -> stale
//     only if that document goes stale, never by drift between test and doc;
//   - INTERNAL consistency -> both sides parsed from the same document
//     (arithmetic, cross-row agreement, structure-vs-structure censuses);
//   - RULE CONSTANT (0 or 1) -> existence/uniqueness/hygiene floors ("at
//     least one row", "exactly one command", "zero stray digits"); these are
//     invariants, not measurements, and cannot go stale;
//   - STALE-ABLE LITERAL (>= 2) written into the test file -> flagged
//     loudly wherever found, because that is the one shape that rots.
//
// BORDERLINE (listed with reasoning, never silently dropped):
//   - machinery tests: they drive the count-claim EXTRACTORS on synthetic
//     in-file fixture documents (their literals describe the fixture, so
//     they cannot go stale against the repo);
//   - document guards whose claim is numeric but not a COUNT (run-id /
//     commit-hash identifier consistency), or whose count assertion lives in
//     a shared helper rather than being the test's subject (the citation
//     tests' "exactly one retirement command" uniqueness rule);
//   - non-document count floors: assertions comparing a repo-derived size
//     (corpus length, CLI output lines, HELP text lines) against a
//     stale-able literal -- count claims, but their subject is source data
//     or program output, not a document.
//
// EXCLUDED: everything else (behavioural tests with no document read and no
// count-shaped assertion). Every excluded test is still listed by title with
// its reason code, so nothing is silently dropped.
//
// The probes are heuristics over the test SOURCE (comments and string
// literals are stripped before identifier probes run, so a mention of
// "corpus" in an assertion message cannot masquerade as a derivation).
// Every verdict prints the evidence tokens that produced it, so a wrong
// classification is auditable, not hidden.

import { readFileSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// ---------------------------------------------------------------------------
// Source stripping: blank out comments (always) and string literals
// (optionally) while preserving the line structure, so probes run against
// code identifiers only and line numbers stay stable. Handles // and /* */
// comments, '...', "...", `...` strings, and backslash escapes (including in
// code position, which is what keeps an escaped backtick inside a regex
// literal from being mistaken for a template-string opener). Regex literals
// are not modelled; an unescaped quote-like character inside one can blank a
// short stretch of code, which at worst weakens a probe -- verdicts print
// their evidence, so such a miss is visible, not silent.
// ---------------------------------------------------------------------------
function stripSource(src, { keepStrings = false } = {}) {
  let out = '';
  let state = 'code';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = i + 1 < n ? src[i + 1] : '';
    if (state === 'code') {
      if (c === '/' && d === '/') { state = 'line'; out += '  '; i += 2; continue; }
      if (c === '/' && d === '*') { state = 'block'; out += '  '; i += 2; continue; }
      if (c === '\\') { out += '  '; i += 2; continue; }
      if (c === "'") { state = 'sq'; out += keepStrings ? c : ' '; i++; continue; }
      if (c === '"') { state = 'dq'; out += keepStrings ? c : ' '; i++; continue; }
      if (c === '`') { state = 'tpl'; out += keepStrings ? c : ' '; i++; continue; }
      out += c; i++; continue;
    }
    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += '\n'; } else { out += ' '; }
      i++; continue;
    }
    if (state === 'block') {
      if (c === '*' && d === '/') { state = 'code'; out += '  '; i += 2; continue; }
      out += c === '\n' ? '\n' : ' '; i++; continue;
    }
    // string states: sq / dq / tpl
    if (c === '\\') { out += keepStrings ? c + d : '  '; i += 2; continue; }
    if ((state === 'sq' && c === "'") || (state === 'dq' && c === '"') || (state === 'tpl' && c === '`')) {
      state = 'code'; out += keepStrings ? c : ' '; i++; continue;
    }
    if (c === '\n') {
      if (state !== 'tpl') state = 'code'; // unterminated ' / " cannot span lines
      out += '\n'; i++; continue;
    }
    out += keepStrings ? c : ' '; i++; continue;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Test-file parsing: top-level `test(` blocks and top-level helper functions.
// Verified structural fact of this suite (re-checked at run time below): every
// top-level test block opens with `test(` at column 0 and closes with `});`
// at column 0, and helpers open with `function name(` at column 0 and close
// with `}` at column 0.
// ---------------------------------------------------------------------------
function extractTestBlocks(fileSrc) {
  const lines = fileSrc.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^test\(/.test(lines[i])) continue;
    const m = lines[i].match(/^test\(\s*(['"])((?:\\.|(?!\1).)*)\1/);
    let j = i + 1;
    while (j < lines.length && lines[j] !== '});') j++;
    blocks.push({
      startLine: i + 1,
      endLine: j + 1,
      title: m ? m[2].replace(/\\'/g, "'").replace(/\\"/g, '"') : '(title not parsed)',
      raw: lines.slice(i, j + 1).join('\n'),
      terminated: j < lines.length,
    });
    i = j;
  }
  return blocks;
}

function extractTopLevelFunctions(fileSrc) {
  const lines = fileSrc.split('\n');
  const fns = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^function\s+(\w+)\s*\(/);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && lines[j] !== '}') j++;
    fns.set(m[1], lines.slice(i, j + 1).join('\n'));
    i = j;
  }
  return fns;
}

// For each get*Section-style helper, derive which heading it anchors to from
// the helper's own source (the literal it indexOf's) -- not from a mapping
// hardcoded here. Helpers that locate their section structurally (no heading
// literal) are reported as such.
function deriveSectionMarkers(fns) {
  const markers = new Map();
  for (const [name, src] of fns) {
    if (!/^get\w*Section$/.test(name)) continue;
    const m = src.match(/'((?:###|##)\s[^']*)'/);
    markers.set(name, m ? m[1] : '(structurally located by ' + name + ' -- no literal heading marker in that helper)');
  }
  return markers;
}

// Transitive closure of top-level helpers a block calls (depth-limited).
function helperClosure(strippedBlock, fns, strippedFns) {
  const used = new Set();
  let frontier = strippedBlock;
  for (let depth = 0; depth < 4; depth++) {
    let added = false;
    for (const name of fns.keys()) {
      if (used.has(name)) continue;
      if (new RegExp('\\b' + name + '\\s*\\(').test(frontier)) {
        used.add(name);
        frontier += '\n' + strippedFns.get(name);
        added = true;
      }
    }
    if (!added) break;
  }
  return { used, combined: frontier };
}

// ---------------------------------------------------------------------------
// Evidence probes. Each fires against either the RAW block (for string-borne
// facts like which file is read) or the STRIPPED block+helper closure (for
// identifier-borne facts). Descriptions feed the "claim read" column.
// ---------------------------------------------------------------------------
const MECHANISM_DESCRIPTIONS = new Map([
  ['extractCountsFromReadme', 'per-tag count rows (`| `<tag>` | <N> |`) parsed from the README'],
  ['countTagsInCorpus', 'true per-tag counts derived from src/corpus.js'],
  ['parseTagVocabCountsTable', 'the `| Tag vocabulary | Count |` counts table, located structurally'],
  ['readTagVocabCount', 'a labelled row of the Tag vocabulary counts table'],
  ['assertTagVocabCountsTableWellFormed', 'counts-table well-formedness (one header, no duplicate/unread row labels)'],
  ['parseAttributionCountsTable', 'the `| Attribution triage | Count |` counts table, located structurally'],
  ['readAttributionCount', 'a labelled row of the Attribution counts table'],
  ['assertAttributionCountsTableWellFormed', 'Attribution counts-table well-formedness'],
  ['extractBandTablesFromReadme', 'band tables (`#### <heading with N+ / N-M token>` + `| Tag | Count |` rows)'],
  ['findAllTagCountTableHeaders', 'structural census of every `| Tag | Count |` table (heading-independent)'],
  ['findUnrecognisedTagCountDigits', 'digit-hygiene sweep of Tag vocabulary prose (every digit outside table/heading structure)'],
  ['attributionTextOutsideTable', 'digit-hygiene sweep of the Attribution section outside its counts table'],
  ['parseTriageRiskRows', 'risk rows of the docs/corpus-attribution-triage.md table'],
  ['parseMatrixRows', 'Node support matrix rows (`| vX.Y.Z | N tests, N pass, N fail, N skipped |`)'],
  ['getNodeSupportSection', 'the README "### Node support" section'],
  ['parseCitedDiffCommand', 'the backtick-quoted `git diff <base>..<target> -- <paths>` retirement-condition command'],
  ['extractTagsFromReadme', 'backtick-quoted tag tokens claimed by the README'],
  ['extractListFormatSeparator', 'the `<text>...<author>` --list format literal\'s separator'],
  ['extractLayoutPaths', 'paths named in the Layout section\'s fenced block'],
]);

function analyzeBlock(block, fns, strippedFns, sectionMarkers) {
  const raw = block.raw;
  const stripped = stripSource(raw);
  const { used, combined } = helperClosure(stripped, fns, strippedFns);

  const ev = []; // human-readable evidence strings
  const flag = (cond, label) => { if (cond) { ev.push(label); return true; } return false; };

  // --- what does it read? (raw: paths live in string literals)
  const readsReadme = flag(/readFileSync/.test(raw) && /README\.md|readmePath/.test(raw),
    'reads README.md via fs.readFileSync');
  const readsTriage = flag(/corpus-attribution-triage\.md|triagePath/.test(raw),
    'reads docs/corpus-attribution-triage.md');
  const readsDoc = readsReadme || readsTriage;
  const syntheticDoc = flag(!readsDoc && /\.join\('\\n'\)|\.join\("\\n"\)/.test(raw.replace(/\\n/g, '\\n')) === false
    ? false
    : !readsDoc && /\.join\(/.test(raw) && /(####\s|\|\s*Tag|## Tag vocabulary|<text>|behaviou?r)/.test(raw),
    'builds a synthetic in-file fixture document');

  const spawnsBinary = flag(/execFileSync|spawnSync/.test(stripped) && /aphorism\.js|binPath|BIN/.test(raw),
    'spawns bin/aphorism.js and reads its output');
  const spawnsGit = flag(/spawnSync/.test(stripped) && /'git'/.test(raw), 'spawns git (read-only diff/rev-parse)');
  const checksDisk = flag(/existsSync/.test(combined), 'checks on-disk existence (fs.existsSync)');

  // --- mechanisms used (identifier probes on stripped code + closure)
  const mechanisms = [];
  for (const name of used) {
    if (MECHANISM_DESCRIPTIONS.has(name)) mechanisms.push(name);
  }
  // in-block regex digit extraction (a (\d+) capture in code position)
  const digitExtraction = flag(/\(\\d\+\)/.test(raw) || /\(\\d\+\)/.test(stripped),
    'captures digits from the document with a (\\d+) regex');
  const hexExtraction = flag(/\[0-9a-fA-F\]\+/.test(raw), 'captures a hex identifier (commit hash) by regex');

  // --- assertion statements (stripped, so message-string digits are gone)
  const assertStmts = stripped.match(/\bassert(?:\.\w+)?\s*\([^;]*\)/g) || [];
  const assertText = assertStmts.join('\n');

  // digit-hygiene mechanisms ARE count claims: they assert that zero digit
  // runs exist outside the structures other guards verify.
  const hygieneMechanism = used.has('attributionTextOutsideTable') || used.has('findUnrecognisedTagCountDigits');

  const numericAssert =
    flag(/\.length\s*(===|==|!==|>=|<=|>|<|,)/.test(assertText), 'asserts on a .length (cardinality) value') |
    flag(/\b\w*[Cc]ount\w*\b/.test(assertText), 'asserts on a *Count-named quantity') |
    flag(/\breadTagVocabCount\b|\breadAttributionCount\b/.test(stripped), 'reads a labelled counts-table row as an integer') |
    flag(/\.(tests|pass|fail|skipped)\b/.test(assertText), 'asserts arithmetic over parsed matrix row fields') |
    flag(/\.size\b/.test(assertText) && /assert/.test(assertText), 'asserts on a Set .size') |
    flag(hygieneMechanism, 'digit-hygiene mechanism: asserts ZERO unaccounted digit runs in the section');

  const setAssert = flag(/\.includes\(|\.has\(|\bin\s+tagsInCorpus\b/.test(assertText),
    'asserts set containment (.includes/.has) between doc-claimed and derived collections');

  // --- expected-value provenance
  const corpusDerived = flag(/\bcorpus\b/.test(combined) || used.has('countTagsInCorpus'),
    'expectation derived from src/corpus.js identifiers at test time');
  const triageDerived = readsTriage || used.has('parseTriageRiskRows');

  // numeric literals in assertion positions: comparison operands or second
  // arg of assert.equal/strictEqual. 0/1 are rule constants; >= 2 can rot.
  const literals = new Set();
  for (const m of assertText.matchAll(/(?:>=|<=|>|<|===|==)\s*(\d+)/g)) literals.add(Number(m[1]));
  for (const m of assertText.matchAll(/assert\.(?:equal|strictEqual|notEqual)\(\s*[\w$.\[\]]+(?:\([^()]*\))?\s*,\s*(\d+)\s*[,)]/g)) {
    literals.add(Number(m[1]));
  }
  const ruleConstants = [...literals].filter((v) => v <= 1).sort();
  const staleableLiterals = [...literals].filter((v) => v >= 2).sort((a, b) => a - b);
  if (ruleConstants.length) ev.push('rule-constant comparison(s): ' + ruleConstants.join(', '));
  if (staleableLiterals.length) ev.push('numeric literal(s) >= 2 in assertion position: ' + staleableLiterals.join(', '));

  // labelled counts-table rows actually read (from raw, labels are strings)
  const labels = [];
  for (const m of raw.matchAll(/read(?:TagVocab|Attribution)Count\(\s*\w+\s*,\s*'([^']+)'/g)) labels.push(m[1]);

  // sections touched
  const sections = [];
  for (const name of used) if (sectionMarkers.has(name)) sections.push(sectionMarkers.get(name));

  // helper-embedded count assertions (e.g. parseCitedDiffCommand's
  // "exactly one retirement command" uniqueness rule). Probed against the
  // RAW helper source: the string-stripper can be perturbed by regex
  // literals containing unescaped backticks (as parseCitedDiffCommand's is),
  // and this probe's shape is code-only anyway.
  let helperCountNote = '';
  for (const name of used) {
    const h = (fns.get(name) || '').replace(/\s+/g, ' ');
    const m = h.match(/assert\.equal\( ?(\w+)\.length, ?1\b/);
    if (m) {
      helperCountNote = 'helper ' + name + '() itself asserts a structural uniqueness count about the document (its `' + m[1] + '.length` must equal 1)';
      ev.push(helperCountNote);
    }
  }

  return {
    block, readsReadme, readsTriage, readsDoc, syntheticDoc, spawnsBinary, spawnsGit, checksDisk,
    mechanisms, digitExtraction, hexExtraction,
    numericAssert: Boolean(numericAssert), setAssert, corpusDerived, triageDerived,
    ruleConstants, staleableLiterals, labels, sections, helperCountNote, evidence: ev,
  };
}

function classify(a) {
  const countShaped = a.numericAssert || a.setAssert;
  if (a.readsDoc && countShaped && a.checksDisk && !a.corpusDerived && !a.triageDerived
    && a.staleableLiterals.length === 0 && !a.setAssert) {
    // e.g. the Layout-paths guard: its document claims are on-disk EXISTENCE
    // (membership); the only count-shaped assertion is a parse-sanity floor
    // ("at least one path parsed", a rule constant). Subject: existence, not
    // a count -- listed borderline rather than silently included or dropped.
    return {
      category: 'BORDERLINE', subtype: 'DOC-NON-COUNT',
      reason: 'document claims are checked for on-disk existence (membership); the only count-shaped assertion is a parse-sanity floor (>= 1 parsed item, rule constant), so the subject is existence, not a count',
    };
  }
  if (a.readsDoc && countShaped) {
    return { category: 'INCLUDED', subtype: a.numericAssert && a.setAssert ? 'NUMERIC+SET' : a.numericAssert ? 'NUMERIC' : 'SET' };
  }
  if (a.readsDoc && !countShaped) {
    let reason;
    if (a.helperCountNote) {
      reason = 'subject is not a count (citation freshness via git diff emptiness), but a shared helper it calls asserts a structural uniqueness count about the document: ' + a.helperCountNote;
    } else if (a.hexExtraction || a.digitExtraction) {
      reason = 'reads numeric/identifier claims from the document (run id / commit hash) and asserts consistency between two renderings -- numeric, but an identifier, not a count';
    } else if (a.checksDisk) {
      reason = 'document claims checked for on-disk existence (membership, not cardinality)';
    } else {
      reason = 'reads the document but asserts membership/content, not a count';
    }
    return { category: 'BORDERLINE', subtype: 'DOC-NON-COUNT', reason };
  }
  if (!a.readsDoc && countShaped && a.mechanisms.length > 0) {
    return {
      category: 'BORDERLINE', subtype: 'MACHINERY',
      reason: 'exercises the count-claim extraction machinery on a synthetic in-file fixture; its numeric literals describe the fixture, so they cannot go stale against the repo',
    };
  }
  if (!a.readsDoc && a.staleableLiterals.length > 0 && countShaped) {
    return {
      category: 'BORDERLINE', subtype: 'NON-DOC-LITERAL-FLOOR',
      reason: 'count assertion against a stale-able literal (' + a.staleableLiterals.join(', ') + ') whose subject is source data or program output, not a document',
    };
  }
  return { category: 'EXCLUDED', subtype: '', reason: 'no document read and no count-shaped assertion about a document (behavioural test)' };
}

function provenanceLine(a) {
  const parts = [];
  if (a.corpusDerived) parts.push('DERIVED from src/corpus.js at test time (self-updating, cannot go stale)');
  if (a.triageDerived) parts.push('DERIVED from docs/corpus-attribution-triage.md at test time');
  if (a.spawnsBinary) parts.push('compared against live bin/aphorism.js output at test time');
  if (a.staleableLiterals.length) parts.push('STALE-ABLE LITERAL(S) written into the test file: ' + a.staleableLiterals.join(', '));
  if (parts.length === 0) {
    if (a.ruleConstants.length) {
      parts.push('INTERNAL / RULE-CONSTANT: document self-consistency and/or existence-uniqueness-hygiene floors (constants ' + a.ruleConstants.join(', ') + ' only -- invariants, not measurements)');
    } else {
      parts.push('INTERNAL: both sides of every comparison are parsed from the document(s) at test time');
    }
  } else if (a.ruleConstants.length) {
    parts.push('plus rule-constant floor(s) (' + a.ruleConstants.join(', ') + ')');
  }
  return parts.join('; ');
}

function claimLine(a) {
  const bits = [];
  if (a.sections.length) bits.push('section(s): ' + [...new Set(a.sections)].map((s) => JSON.stringify(s)).join(', '));
  if (a.labels.length) bits.push('counts-table row(s) read: ' + a.labels.map((l) => JSON.stringify(l)).join(', '));
  const mechDescs = a.mechanisms
    .filter((m) => MECHANISM_DESCRIPTIONS.has(m))
    .map((m) => MECHANISM_DESCRIPTIONS.get(m));
  if (mechDescs.length) bits.push('reads: ' + [...new Set(mechDescs)].join(' | '));
  if (a.digitExtraction && !mechDescs.length) bits.push('reads digits captured by in-test regex');
  return bits.length ? bits.join('\n      ') : '(claim mechanism not identified by probes -- inspect the test body)';
}

// ---------------------------------------------------------------------------
// Suite-size floor audit.
//
// THE PROBE TABLE IS THE SEARCH SURFACE. Every floor probe below is both RUN
// (section F) and PRINTED (section G) from this one table, so the tool's
// statement of "what was searched" cannot drift from what it actually
// searched. Section G's verdict is bounded by this table by construction: it
// reports what these probes did and did not find, never a categorical
// "no floor exists anywhere".
//
// Deliberate breadth choices, and why:
//   - comparisons are matched in BOTH operand orders (`n > 120` and
//     `120 < n`); an earlier version matched only literal-on-the-right, which
//     made a genuinely failing floor invisible purely by operand order;
//   - a bound named by a same-file `const/let/var NAME = <3+-digit literal>`
//     is resolved and matched too, so `const FLOOR = 120; assert(n > FLOOR)`
//     is caught;
//   - directory enumeration is matched by CALLEE ONLY, with the argument
//     never inspected, so `readdirSync(SUITE_DIR)` counts exactly as much as
//     `readdirSync('test')` does. An earlier version required the token
//     "test" to appear inside the call parentheses, which any census that
//     resolves its own directory evades without trying.
// The honest limit -- restated in section G's output, not just here -- is
// that this is a static, textual search: a bound that is computed rather
// than written, a 1-2 digit bound, or a call reached through a computed
// property or an alias will not appear.
// ---------------------------------------------------------------------------

// A suite-size floor needs a bound big enough to be a test count. 3+ digits
// is the rule constant; see FLOOR_PROBE_LIMITS for what that excludes.
const FLOOR_MIN_DIGITS = 3;
const FLOOR_LITERAL_SRC = '\\d{' + FLOOR_MIN_DIGITS + ',}';
// Comparison operators, longest-first so `>=` is not matched as bare `>`.
const CMP_SRC = '(?:>=|<=|===|!==|==|!=|>|<)';
const DIR_ENUM_SRC = '\\b(?:readdirSync|readdir|opendirSync|opendir|globSync|glob)\\s*\\(';

const FLOOR_PROBES = [
  {
    id: 'F.i.a', group: 'i', on: 'code',
    re: new RegExp(CMP_SRC + '\\s*' + FLOOR_LITERAL_SRC + '\\b'),
    label: 'comparison against a ' + FLOOR_MIN_DIGITS + '+-digit literal, literal on the RIGHT  (`n > 120`)',
  },
  {
    id: 'F.i.b', group: 'i', on: 'code',
    re: new RegExp('\\b' + FLOOR_LITERAL_SRC + '\\s*' + CMP_SRC),
    label: 'comparison against a ' + FLOOR_MIN_DIGITS + '+-digit literal, literal on the LEFT   (`120 < n`)',
  },
  {
    id: 'F.i.c', group: 'i', on: 'code', re: null, // resolved per file, below
    label: 'comparison against a same-file `const/let/var NAME = <' + FLOOR_MIN_DIGITS
      + '+-digit literal>` bound, either operand order  (`const FLOOR = 120; n > FLOOR`)',
  },
  {
    id: 'F.ii.a', group: 'ii', on: 'code+strings',
    re: /--test\b/,
    label: 'spawns the Node test runner: the token `--test` in code or string position',
  },
  {
    id: 'F.ii.b', group: 'ii', on: 'code',
    re: new RegExp(DIR_ENUM_SRC),
    label: 'enumerates a directory: a call to readdirSync/readdir/opendirSync/opendir/globSync/glob '
      + 'with ANY argument -- the argument is never inspected, so a census of `__dirname` or of a '
      + 'named constant counts exactly as much as a census of the literal path `test`',
  },
];

// What the probe table structurally cannot see. Unlike FLOOR_PROBES (run in F
// and printed in G from the very same array, so it cannot drift), this list
// is hand-authored prose -- so each entry is TIED to the probe id(s) it
// qualifies, and that tie is checked (see the loop below) rather than
// asserted in a comment. Widening a probe (e.g. FLOOR_MIN_DIGITS) flows
// through automatically because the text below interpolates the same
// constant the probe uses; removing or renaming a probe this list still
// references is not "automatic drift" -- it throws at load time, so a stale
// tie fails loudly instead of quietly overstating what section G still
// searches for. Entries that qualify the SCAN'S SCOPE rather than any one
// probe's mechanism live in SCAN_SCOPE_LIMITS below instead of being forced
// into a fake tie.
const FLOOR_PROBE_LIMITS = [
  {
    probeIds: ['F.i.a', 'F.i.b', 'F.i.c'],
    text: 'a bound that is COMPUTED rather than written as a literal (read from a file or env var, '
      + 'derived by arithmetic, imported from another module);',
  },
  {
    probeIds: ['F.i.a', 'F.i.b', 'F.i.c'],
    text: 'a bound of fewer than ' + FLOOR_MIN_DIGITS + ' digits (a floor written `n > 99`);',
  },
  {
    probeIds: ['F.ii.a', 'F.ii.b'],
    text: 'a runner spawn or directory census reached through a computed property (`fs[\'readdirSync\'](d)`), '
      + 'a re-exported alias, or a helper defined in a file this scan does not read;',
  },
];

// Load-time proof that the tie above still holds: every probeId a limit
// names must exist in FLOOR_PROBES right now. A probe removed or renamed
// without moving the limit text that qualifies it fails loudly here instead
// of section G silently printing a limit for a probe that no longer runs.
for (const { probeIds, text } of FLOOR_PROBE_LIMITS) {
  for (const id of probeIds) {
    if (!FLOOR_PROBES.some((p) => p.id === id)) {
      throw new Error(
        'FLOOR_PROBE_LIMITS is stale: it ties the limit "' + text + '" to probe id "' + id
        + '", but no such probe exists in FLOOR_PROBES anymore. Move this limit onto the probe '
        + 'that now covers that gap, or delete it -- do not leave it printing against a probe '
        + 'that no longer runs.'
      );
    }
  }
}

// Limits that bound the SCAN AS A WHOLE (its file-set, its jurisdiction),
// not any single probe's matching logic. These are deliberately NOT printed
// as if mechanism-derived the way FLOOR_PROBE_LIMITS above is: there is no
// probe id to tie them to, so section G labels and formats them differently
// rather than implying a tie that does not exist.
const SCAN_SCOPE_LIMITS = [
  'anything outside the scanned set (test/, src/, bin/, package.json, .github/) -- notably tools/, '
    + 'which is excluded on purpose because this report necessarily names the premise itself;',
  'a floor enforced outside the repository entirely (a branch-protection rule, a required external check).',
];

function auditSuiteFloor(testFiles) {
  const findings = { occurrences121: [], codeFloors: [], selfSpawns: [], workflowComments: [], workflowCodeHits: [], workflowGlobGate: null };

  const scanFiles = [];
  for (const f of testFiles) scanFiles.push({ file: 'test/' + f, kind: 'js' });
  for (const dir of ['src', 'bin']) {
    for (const f of readdirSync(path.join(ROOT, dir))) scanFiles.push({ file: dir + '/' + f, kind: 'js' });
  }
  scanFiles.push({ file: 'package.json', kind: 'json' });
  let workflowFiles = [];
  try {
    workflowFiles = readdirSync(path.join(ROOT, '.github', 'workflows')).map((f) => '.github/workflows/' + f);
  } catch { /* no workflows dir */ }
  for (const f of workflowFiles) scanFiles.push({ file: f, kind: 'yml' });
  // tools/ is deliberately OUT of scope: this file necessarily names "121"
  // in its own prose and would pollute its own evidence.

  for (const { file, kind } of scanFiles) {
    let src;
    try {
      src = readFileSync(path.join(ROOT, file), 'utf8');
    } catch {
      continue; // e.g. package.json does not exist in this zero-dep repo
    }
    const lines = src.split('\n');
    let codeLines = lines;
    if (kind === 'js') codeLines = stripSource(src, { keepStrings: true }).split('\n');
    if (kind === 'yml') codeLines = lines.map((l) => l.split('#')[0]);
    lines.forEach((line, idx) => {
      if (!line.includes('121')) return;
      const inCode = codeLines[idx] && codeLines[idx].includes('121');
      findings.occurrences121.push({ file, line: idx + 1, where: inCode ? 'CODE/STRING' : 'COMMENT', text: line.trim() });
    });
  }

  // Floor-shaped assertions in test code, driven by FLOOR_PROBES above: any
  // comparison against a test-count-sized bound (a suite of >100 tests would
  // need one) in EITHER operand order, whether the bound is written inline or
  // named by a same-file const; and any spawn of the test runner or
  // enumeration of a directory from inside a test (a self-measuring
  // suite-size check needs one or the other), with the enumerated path never
  // inspected.
  for (const f of testFiles) {
    const src = readFileSync(path.join(ROOT, 'test', f), 'utf8');
    const rawLines = src.split('\n');
    const code = stripSource(src).split('\n');                        // comments AND strings stripped
    const codeStr = stripSource(src, { keepStrings: true }).split('\n'); // comments stripped, strings kept
    const pick = (on) => (on === 'code' ? code : codeStr);

    // F.i.c: resolve same-file names bound to a floor-sized literal, so a
    // comparison written against the NAME is caught as well as one written
    // against the digits. Whole-file scan (declaration may follow use).
    const namedBounds = new Map();
    {
      const declRe = new RegExp('\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(' + FLOOR_LITERAL_SRC + ')\\b', 'g');
      for (const m of stripSource(src).matchAll(declRe)) namedBounds.set(m[1], m[2]);
    }
    const namedBoundProbes = [...namedBounds].map(([name, lit]) => ({
      name, lit,
      re: new RegExp('(?:' + CMP_SRC + '\\s*\\b' + name + '\\b|\\b' + name + '\\b\\s*' + CMP_SRC + ')'),
    }));

    for (const probe of FLOOR_PROBES) {
      const lines = pick(probe.on);
      const bucket = probe.group === 'i' ? findings.codeFloors : findings.selfSpawns;
      if (probe.id === 'F.i.c') {
        lines.forEach((line, idx) => {
          for (const nb of namedBoundProbes) {
            if (!nb.re.test(line)) continue;
            bucket.push({
              file: 'test/' + f, line: idx + 1, text: rawLines[idx].trim(),
              probe: probe.id, note: 'via `' + nb.name + '` = ' + nb.lit,
            });
            break;
          }
        });
        continue;
      }
      lines.forEach((line, idx) => {
        if (!probe.re.test(line)) return;
        bucket.push({ file: 'test/' + f, line: idx + 1, text: rawLines[idx].trim(), probe: probe.id, note: '' });
      });
    }
  }
  // Stable, de-duplicated ordering: a line matched by two probes is reported
  // once per probe, but the file:line ordering stays readable.
  const byPlace = (a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1);
  findings.codeFloors.sort(byPlace);
  findings.selfSpawns.sort(byPlace);

  for (const wf of workflowFiles) {
    const src = readFileSync(path.join(ROOT, wf), 'utf8');
    src.split('\n').forEach((line, idx) => {
      const hashAt = line.indexOf('#');
      const code = hashAt >= 0 ? line.slice(0, hashAt) : line;
      const comment = hashAt >= 0 ? line.slice(hashAt) : '';
      if (/count assertion|floor|at least \d+ test/i.test(comment)) {
        findings.workflowComments.push({ file: wf, line: idx + 1, text: line.trim() });
      }
      if (/\b\d{3,}\b/.test(code) && /test/i.test(code)) {
        findings.workflowCodeHits.push({ file: wf, line: idx + 1, text: line.trim() });
      }
      if (/ls\s+test\/\*\.test\.js/.test(code)) {
        findings.workflowGlobGate = { file: wf, line: idx + 1, text: line.trim() };
      }
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dynamic cross-check: the runner's own per-file test count.
// ---------------------------------------------------------------------------
async function runnerCounts(testFiles) {
  const results = new Map();
  await Promise.all(testFiles.map(async (f) => {
    let stdout = '';
    try {
      ({ stdout } = await execFileP(process.execPath, ['--test', '--test-reporter=tap', 'test/' + f], {
        cwd: ROOT, maxBuffer: 32 * 1024 * 1024,
      }));
    } catch (e) {
      stdout = (e && e.stdout) || '';
    }
    const pick = (k) => {
      const m = stdout.match(new RegExp('^# ' + k + ' (\\d+)$', 'm'));
      return m ? Number(m[1]) : null;
    };
    results.set(f, { tests: pick('tests'), pass: pick('pass'), fail: pick('fail'), skipped: pick('skipped') });
  }));
  return results;
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------
const testFiles = readdirSync(path.join(ROOT, 'test')).filter((f) => f.endsWith('.test.js')).sort();
const dynamic = await runnerCounts(testFiles);

const out = [];
const P = (s = '') => out.push(s);

P('GUARD INVENTORY -- count-claim guards binding at HEAD');
P('repo root: ' + ROOT);
P('node: ' + process.version + '   (all numbers below are re-derived from the tree at run time)');
P('');

// -------- Section A: census --------
P('== A. TEST-FILE CENSUS (lines and test counts, re-derived) ==');
P('');
let totalLines = 0, totalStatic = 0, totalDynamic = 0, unparseableCount = 0;
const perFile = [];
for (const f of testFiles) {
  const src = readFileSync(path.join(ROOT, 'test', f), 'utf8');
  const lineCount = src.split('\n').length - (src.endsWith('\n') ? 1 : 0);
  const blocks = extractTestBlocks(src);
  const unterminated = blocks.filter((b) => !b.terminated).length;
  const dyn = dynamic.get(f);
  perFile.push({ f, src, lineCount, blocks });
  totalLines += lineCount;
  totalStatic += blocks.length;
  if (dyn.tests != null) totalDynamic += dyn.tests;
  else unparseableCount++;
  const agree = dyn.tests === blocks.length ? 'agree' : 'DISAGREE (static ' + blocks.length + ' vs runner ' + dyn.tests + ')';
  P('  test/' + f.padEnd(38) + String(lineCount).padStart(5) + ' lines   '
    + String(blocks.length).padStart(3) + ' test() blocks   runner: '
    + (dyn.tests == null ? 'UNPARSEABLE' : dyn.tests + ' tests (' + dyn.pass + ' pass, ' + dyn.fail + ' fail, ' + dyn.skipped + ' skipped)')
    + '   ' + agree
    + (unterminated ? '   [WARNING: ' + unterminated + ' block(s) not terminated by a column-0 "});" -- static parse suspect]' : ''));
}
// Whether the statically-parsed test() count matches the runner-measured
// count, TOTAL across the whole suite. A test file that registers cases
// through a loop (or any indirection the textual test()-block scan cannot
// see) makes totalDynamic exceed totalStatic; the per-file 'agree'/'DISAGREE'
// column above already shows which file(s). Sections B and G below read this
// flag so their prose cannot assert agreement the numbers do not back.
const totalsAgree = totalDynamic === totalStatic;
// Whether the runner's cross-check covers the WHOLE suite. A file whose TAP
// output never carried a `# tests N` line (UNPARSEABLE, per-file column
// above) contributes 0 to totalDynamic while its test() blocks still land in
// totalStatic -- silently, unless disclosed here. partialCoverage gates that
// disclosure in B and G so a numeric totalsAgree (true OR false) can never be
// read as a statement about files the runner could not measure at all.
const partialCoverage = unparseableCount > 0;
const parseableCount = testFiles.length - unparseableCount;
P('  ' + 'TOTAL'.padEnd(43) + String(totalLines).padStart(5) + ' lines   ' + String(totalStatic).padStart(3) + ' test() blocks   runner total: ' + totalDynamic + ' tests');
if (partialCoverage) {
  P('  UNPARSEABLE: ' + unparseableCount + ' of ' + testFiles.length + ' file(s) above produced no runner `# tests N` line');
  P('  (see the per-file UNPARSEABLE cell(s)); their test() blocks are counted in the ' + totalStatic
    + ' static TOTAL');
  P('  above but are NOT reflected in the ' + totalDynamic + ' runner TOTAL. The static-vs-runner');
  P('  comparison below (and in section G) therefore covers only the ' + parseableCount
    + ' parseable file(s), not the whole suite.');
}
{
  let srcBin = 0;
  for (const dir of ['src', 'bin']) {
    for (const f of readdirSync(path.join(ROOT, dir))) {
      const s = readFileSync(path.join(ROOT, dir, f), 'utf8');
      srcBin += s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
    }
  }
  P('  (for scale: src/ + bin/ = ' + srcBin + ' lines)');
}
P('');

// -------- classify everything --------
const rows = [];
for (const { f, src, blocks } of perFile) {
  const fns = extractTopLevelFunctions(src);
  const strippedFns = new Map([...fns].map(([k, v]) => [k, stripSource(v)]));
  const sectionMarkers = deriveSectionMarkers(fns);
  for (const b of blocks) {
    const a = analyzeBlock(b, fns, strippedFns, sectionMarkers);
    const c = classify(a);
    rows.push({ file: 'test/' + f, a, c });
  }
}

const included = rows.filter((r) => r.c.category === 'INCLUDED');
const borderline = rows.filter((r) => r.c.category === 'BORDERLINE');
const excluded = rows.filter((r) => r.c.category === 'EXCLUDED');

P('== B. INCLUSION RULE ==');
P('');
P('  INCLUDED = the test (a) reads a real repo document (README.md / docs/*.md)');
P('  at test time AND (b) asserts a count-shaped claim about it: a number parsed');
P('  from the document compared to an expectation, or set containment/equality');
P('  between a document-claimed collection and a derived one. BORDERLINE items');
P('  are listed one by one with reasons; EXCLUDED items are listed by title with');
if (!partialCoverage && totalsAgree) {
  P('  a reason code. Nothing is silently dropped. (Full rule: header of this file.)');
} else if (!partialCoverage) {
  P('  a reason code. Nothing the static parser SAW is silently dropped from C/D/E --');
  P('  but the static test() parse (' + totalStatic + ') and the runner-measured count');
  P('  (' + totalDynamic + ') DISAGREE for this tree (see A\'s per-file "agree"/"DISAGREE"');
  P('  column): ' + Math.abs(totalDynamic - totalStatic) + ' test(s) the runner counted are not textually visible as');
  P('  test() blocks and so cannot appear as rows in C/D/E. That claim is withdrawn');
  P('  for this tree until the counts agree. (Full rule: header of this file.)');
} else {
  // partialCoverage: at least one file is UNPARSEABLE by the runner. Whether
  // totalDynamic and totalStatic happen to be numerically equal or not, that
  // comparison is over the parseable subset only -- say so explicitly rather
  // than let a coincidental match read as whole-suite agreement.
  P('  a reason code. Nothing the static parser SAW is silently dropped from C/D/E --');
  P('  but ' + unparseableCount + ' of ' + testFiles.length + ' file(s) produced no runner `# tests N` line');
  P('  (UNPARSEABLE; see A) and are excluded from the ' + totalDynamic + ' runner TOTAL, so the');
  P('  static-vs-runner comparison covers only the ' + parseableCount + ' parseable file(s), not the whole');
  P('  suite. The static (' + totalStatic + ') and runner (' + totalDynamic + ') totals '
    + (totalsAgree ? 'are numerically equal,' : 'DISAGREE even on that subset,'));
  P('  ' + (totalsAgree
    ? 'but that equality is NOT evidence of whole-suite agreement while unparseable file(s) remain unmeasured.'
    : 'and ' + Math.abs(totalDynamic - totalStatic) + ' test(s) are unaccounted for within the measured subset.'));
  P('  That claim is withdrawn for this tree until every file parses. (Full rule: header of this file.)');
}
P('');

P('== C. INCLUDED COUNT-CLAIM GUARDS (' + included.length + ') ==');
P('');
let i = 0;
for (const r of included) {
  i++;
  P('  [' + i + '] ' + r.file + ':' + r.a.block.startLine + '  (' + r.c.subtype + ')');
  P('      title: ' + r.a.block.title);
  P('      claim: ' + claimLine(r.a));
  P('      expected value: ' + provenanceLine(r.a));
  P('      evidence: ' + r.a.evidence.join('; '));
  P('');
}

P('== D. BORDERLINE (' + borderline.length + ') -- listed, with reasoning, not dropped ==');
P('');
i = 0;
for (const r of borderline) {
  i++;
  P('  [B' + i + '] ' + r.file + ':' + r.a.block.startLine + '  (' + r.c.subtype + ')');
  P('      title: ' + r.a.block.title);
  P('      why borderline: ' + r.c.reason);
  if (r.a.staleableLiterals.length) {
    P('      ' + (r.c.subtype === 'MACHINERY'
      ? 'fixture literal(s) (describe the inline fixture; cannot go stale against the repo): '
      : 'stale-able literal(s): ') + r.a.staleableLiterals.join(', '));
  }
  P('      evidence: ' + (r.a.evidence.join('; ') || '(none fired)'));
  P('');
}

P('== E. EXCLUDED (' + excluded.length + ') -- behavioural tests, no document count claim ==');
P('');
for (const r of excluded) {
  P('  - ' + r.file + ':' + r.a.block.startLine + '  ' + r.a.block.title);
}
P('');

// -------- Section F: suite-size floor audit --------
const audit = auditSuiteFloor(testFiles);
P('== F. SUITE-SIZE FLOOR AUDIT ==');
P('');
P('  Question 1: does any guard assert a floor on the size of the suite itself?');
P('  A suite-size floor would need either (i) a comparison against a hardcoded');
P('  test-count bound, (ii) a test that spawns `node --test` / enumerates a');
P('  directory and counts, or (iii) a CI step that counts tests. The exact');
P('  probes run for (i) and (ii) are listed with the verdict in G. Results:');
P('');
const hitLine = (h) => '        ' + h.file + ':' + h.line + '  [' + (h.probe || '?') + ']'
  + (h.note ? ' ' + h.note : '') + '  ' + h.text;
P('  (i) comparisons against a ' + FLOOR_MIN_DIGITS + '+-digit bound in test code, EITHER operand order,');
P('      inline literal or same-file named const (comments/strings stripped): '
  + (audit.codeFloors.length === 0 ? 'NONE' : ''));
for (const h of audit.codeFloors) P(hitLine(h));
P('  (ii) tests spawning the test runner or enumerating a directory');
P('      (callee-only match; the enumerated path is never inspected): '
  + (audit.selfSpawns.length === 0 ? 'NONE' : ''));
for (const h of audit.selfSpawns) P(hitLine(h));
P('  (iii) workflow code lines pairing a 3+-digit number with "test": '
  + (audit.workflowCodeHits.length === 0 ? 'NONE' : ''));
for (const h of audit.workflowCodeHits) P('        ' + h.file + ':' + h.line + '  ' + h.text);
if (audit.workflowGlobGate) {
  P('  Note: the workflow DOES gate on the glob matching at least one FILE (a floor');
  P('  of >= 1 test file, not a test-count floor):');
  P('        ' + audit.workflowGlobGate.file + ':' + audit.workflowGlobGate.line + '  ' + audit.workflowGlobGate.text);
}
P('');
P('  Question 2: every occurrence of the literal "121" in test/, src/, bin/,');
P('  package.json and .github/ (tools/ excluded -- this report necessarily');
P('  names the premise itself):');
if (audit.occurrences121.length === 0) P('        NONE');
for (const h of audit.occurrences121) P('        ' + h.file + ':' + h.line + '  [' + h.where + ']  ' + h.text);
P('');
P('  Workflow comment(s) addressing count assertions:');
if (audit.workflowComments.length === 0) P('        NONE FOUND');
for (const h of audit.workflowComments) P('        ' + h.file + ':' + h.line + '  ' + h.text);
P('');

// -------- Section G: verdict --------
const floorEvidence = [];
const probesFired = [...new Set([...audit.codeFloors, ...audit.selfSpawns].map((h) => h.probe).filter(Boolean))].sort();
if (audit.codeFloors.length) floorEvidence.push(audit.codeFloors.length + ' floor-shaped comparison(s) in test code');
if (audit.selfSpawns.length) floorEvidence.push(audit.selfSpawns.length + ' test(s) spawning the runner / enumerating a directory');
if (audit.workflowCodeHits.length) floorEvidence.push('workflow code counting tests');
if (audit.occurrences121.some((o) => o.where === 'CODE/STRING')) floorEvidence.push('"121" in code/string position');

P('== G. VERDICT ON THE INHERITED ">= 121 TESTS" FLOOR PREMISE ==');
P('');
if (floorEvidence.length === 0) {
  P('  VERDICT: ABSENT -- BOUNDED BY THE SEARCH BELOW, not a categorical claim.');
  P('  None of the probes this tool actually ran found any assertion of a floor on');
  P('  the number of tests in the suite, in test/, src/, bin/, package.json or');
  P('  .github/. That is a statement about this search, not about all possible code.');
  P('');
  P('  WHAT WAS SEARCHED (printed from the same probe table that produced F, so');
  P('  this list cannot drift from what actually ran):');
  for (const probe of FLOOR_PROBES) {
    P('    - ' + probe.id + '  [' + (probe.on === 'code' ? 'comments+strings stripped' : 'comments stripped, strings kept') + ']');
    P('        ' + probe.label);
  }
  P('    - F.iii  [.github/workflows/*, comments split off]');
  P('        a workflow code line pairing a ' + FLOOR_MIN_DIGITS + '+-digit number with the token "test"');
  P('    - F.Q2  [test/, src/, bin/, package.json, .github/]');
  P('        every occurrence of the literal "121", code and comment position alike');
  P('');
  P('  WHAT THIS SEARCH WOULD NOT CATCH (so the verdict above does not claim it):');
  P('  Each line below is TIED to the probe id(s) above it qualifies -- named in');
  P('  brackets and checked at load time (see FLOOR_PROBE_LIMITS): remove or rename');
  P('  that probe without moving this text and the tool refuses to run.');
  for (const lim of FLOOR_PROBE_LIMITS) {
    P('    - [' + lim.probeIds.join(', ') + '] ' + lim.text);
  }
  P('  SCAN-SCOPE LIMITS (bound the search as a whole; no single probe id to tie');
  P('  them to, so they are not printed as mechanism-derived the way the lines');
  P('  above are):');
  for (const lim of SCAN_SCOPE_LIMITS) P('    - ' + lim);
  P('    Read the verdict as: no floor is DETECTED by the probes listed above. A');
  P('    floor written specifically to evade a static textual scan would not appear');
  P('    here, and no static scan can close that gap.');
  P('');
  P('  Evidence behind the reading, all re-derived above:');
  P('    - the runner-measured suite currently holds ' + totalDynamic + ' tests across '
    + testFiles.length + ' files' + (partialCoverage
      ? (' (' + unparseableCount + ' of these file(s) are UNPARSEABLE by the runner -- no `# tests N` line --'
        + ' so this total and the static/runner comparison cover only the ' + parseableCount
        + ' parseable file(s), not the whole suite; static parse (' + totalStatic + ') '
        + (totalsAgree
          ? 'is numerically equal but that is not evidence of whole-suite agreement);'
          : 'DISAGREES with the runner even on that subset);'))
      : (totalsAgree
        ? ' (static parse agrees: ' + totalStatic + ');'
        : ' (static parse DISAGREES: ' + totalStatic + ' parsed statically vs ' + totalDynamic
          + ' measured by the runner -- see A\'s per-file "agree"/"DISAGREE" column);')));
  P('    - zero comparisons against a ' + FLOOR_MIN_DIGITS + '+-digit bound, in either operand order,');
  P('      inline or via a same-file named const, exist in test code (F.i);');
  P('    - no test spawns the test runner or enumerates any directory (F.ii);');
  P('    - "121" occurs in this tree only at the ' + audit.occurrences121.length + ' location(s) listed in F, '
    + (audit.occurrences121.every((o) => o.where === 'COMMENT') ? 'ALL in comment/prose position' : 'see positions above') + ';');
  P('    - CI carries a written refusal to add a count assertion (workflow comment');
  P('      quoted in F) and gates only on the glob matching >= 1 file.');
  P('');
  P('  No ">= 121 tests" floor is detected in this tree; none is manufactured here.');
} else {
  P('  VERDICT: PRESENT (or indeterminate). The following floor-shaped evidence was');
  P('  found and must be examined at the cited file:line before treating the floor');
  P('  premise as absent: ' + floorEvidence.join('; ') + '.');
  if (probesFired.length) {
    P('  Probe(s) that fired: ' + probesFired.map((id) => {
      const p = FLOOR_PROBES.find((q) => q.id === id);
      return id + (p ? ' (' + p.label + ')' : '');
    }).join('\n                      '));
  }
  P('  See section F above for exact locations.');
}
P('');
P('== H. NON-DOCUMENT COUNT FLOORS THAT DO EXIST (for completeness) ==');
P('');
P('  These are the only stale-able numeric floors/ceilings the suite carries;');
P('  none of them is about the suite\'s own size (each is listed in D above):');
const nonDocFloors = borderline.filter((r) => r.c.subtype === 'NON-DOC-LITERAL-FLOOR');
if (nonDocFloors.length === 0) P('        NONE DETECTED');
for (const r of nonDocFloors) {
  P('        ' + r.file + ':' + r.a.block.startLine + '  literal(s) ' + r.a.staleableLiterals.join(', ') + '  -- ' + r.a.block.title);
}
P('');
P('Totals: ' + included.length + ' included, ' + borderline.length + ' borderline, ' + excluded.length + ' excluded, of '
  + rows.length + ' tests parsed statically (' + totalDynamic + ' measured by the runner)'
  + (partialCoverage
    ? ' -- ' + unparseableCount + ' file(s) UNPARSEABLE and excluded from that runner figure; comparison covers only '
      + parseableCount + ' of ' + testFiles.length + ' file(s)'
    : '') + '.');

console.log(out.join('\n'));
