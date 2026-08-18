#!/usr/bin/env node
// cycle-012-gate-V-7.mjs — conductor verification gate for backlog item V-7.
//
// V-7 acceptance: "Each falsifiable claim in the three document surfaces is either
// re-measured against the current tree and shown true, or corrected, or explicitly
// re-labelled as a dated history claim. Claims that cannot be measured are reported
// as not-run, never as passed."
//
// This file is AUTHORED AND SEALED (sha256 committed) BEFORE any document is edited,
// and is run against the UNFIXED tree first. Assertions that the repair is meant to
// flip must FAIL on that baseline; every other assertion must PASS on BOTH trees.
// A gate that is green on the broken tree proves nothing.
//
// Categories:
//   PASS    — measured against the tree and true
//   FAIL    — measured against the tree and false
//   NOTRUN  — cannot be measured from inside this run; never reported as passed
//
// Exit 0 iff zero FAIL. NOTRUN never fails the gate but is always printed.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync, execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const REPO = '/opt/targets/aphorism-cli';
const require = createRequire(import.meta.url);
const BIN = `${REPO}/bin/aphorism.js`;

const results = [];
const rec = (id, status, msg) => results.push({ id, status, msg });
const check = (id, cond, msg) => rec(id, cond ? 'PASS' : 'FAIL', msg);
const notrun = (id, msg) => rec(id, 'NOTRUN', msg);

// ---------- measured ground truth ----------
const corpus = require(`${REPO}/src/corpus.js`).corpus;
const tagCount = {};
for (const e of corpus) for (const t of e.tags) tagCount[t] = (tagCount[t] || 0) + 1;

const README = readFileSync(`${REPO}/README.md`, 'utf8');
const REPORT = readFileSync(`${REPO}/REPORT.md`, 'utf8');
const TRIAGE = readFileSync(`${REPO}/docs/corpus-attribution-triage.md`, 'utf8');
const backlog = JSON.parse(readFileSync(`${REPO}/.swarm/backlog.json`, 'utf8'));

function run(args, opts = {}) {
  try {
    const stdout = execFileSync('node', [BIN, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts,
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

// ================= README =================

// A1 — zero dependency
{
  const noManifest = !existsSync(`${REPO}/package.json`) && !existsSync(`${REPO}/node_modules`);
  const srcFiles = [...readdirSync(`${REPO}/src`).map((f) => `src/${f}`), 'bin/aphorism.js'];
  const builtin = new Set(['node:fs', 'node:path', 'node:process', 'fs', 'path', 'process', 'node:util']);
  let allLocal = true;
  for (const f of srcFiles) {
    const txt = readFileSync(`${REPO}/${f}`, 'utf8');
    for (const m of txt.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const spec = m[1];
      if (!spec.startsWith('.') && !builtin.has(spec)) allLocal = false;
    }
  }
  check('A1', noManifest && allLocal, 'README "zero-dependency": no package.json/node_modules and every require() is relative or a Node builtin');
}

// A2 — the flag table lists exactly the options the binary accepts
{
  const rows = [...README.matchAll(/^\|\s*`(--[a-z]+)[^`]*`(?:,\s*`(-h)`)?\s*\|/gm)].map((m) => m[1]);
  const documented = new Set(rows);
  const expected = new Set(['--author', '--tag', '--seed', '--list', '--json', '--help']);
  const same = documented.size === expected.size && [...expected].every((f) => documented.has(f));
  const unknownRejected = run(['--nosuchflag']).code === 2;
  check('A2', same && unknownRejected, `README flag table documents exactly ${[...expected].join(' ')} and an undocumented flag exits 2`);
}

// A3 — every per-tag count in the README tables equals the measured corpus count
{
  const rows = [...README.matchAll(/^\|\s*`([a-z]+)`\s*\|\s*(\d+)\s*\|/gm)];
  const documented = Object.fromEntries(rows.map((m) => [m[1], Number(m[2])]));
  const keysMatch = Object.keys(documented).length === Object.keys(tagCount).length
    && Object.keys(tagCount).every((t) => documented[t] === tagCount[t]);
  check('A3', keysMatch, `README tag tables list all ${Object.keys(tagCount).length} tags with counts equal to the measured corpus`);
}

// A4 — the prose counts around those tables
{
  const distinct = Object.keys(tagCount).length;
  const atLeastTwo = Object.values(tagCount).filter((n) => n >= 2).length;
  const exactlyOne = Object.values(tagCount).filter((n) => n === 1).length;
  const min = Math.min(...Object.values(tagCount));
  const words = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
  const ok = README.includes(`The corpus contains ${distinct} distinct tags`)
    && README.includes(`${atLeastTwo} tags appear on 2 or more entries`)
    && README.includes(`${exactlyOne} tags appear exactly once`)
    && README.includes(`The smallest pool holds ${words[min]} aphorisms`);
  check('A4', ok, `README prose: ${distinct} distinct tags, ${atLeastTwo} with >=2 entries, ${exactlyOne} singletons, smallest pool ${min}`);
}

// A5 — the documented tag-discovery snippet actually runs and reproduces the table
{
  const m = README.match(/```sh\n(node bin\/aphorism\.js --list --json \| jq[^\n]*)\n```/);
  let ok = false, detail = 'snippet not found in README';
  if (m) {
    try {
      const out = execSync(m[1], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      const got = {};
      for (const line of out.trim().split('\n')) {
        const mm = line.trim().match(/^(\d+)\s+(\S+)$/);
        if (mm) got[mm[2]] = Number(mm[1]);
      }
      ok = Object.keys(got).length === Object.keys(tagCount).length
        && Object.keys(tagCount).every((t) => got[t] === tagCount[t]);
      detail = `snippet emitted ${Object.keys(got).length} tags`;
    } catch (err) {
      detail = `snippet failed: ${String(err.message).slice(0, 80)}`;
    }
  }
  check('A5', ok, `README tag-discovery snippet is pasteable and reproduces the table (${detail})`);
}

// A6 — all retired tag names take the no-match path, and the stated count matches the list
{
  const para = README.match(/optimization, algorithms[\s\S]*?and\n?testing to debugging\./);
  const names = para ? [...para[0].matchAll(/\b([a-z]+)\b(?=,| and | to )/g)].map((x) => x[1]) : [];
  const folded = [...new Set(names)].filter((n) => !['to', 'and'].includes(n) && !(n in tagCount));
  const countWordOk = README.includes(`Twenty-six low-count tag names`) && folded.length === 26;
  let allNoMatch = true;
  for (const n of folded) {
    const r = run(['--tag', n]);
    if (r.code !== 1 || r.stdout !== '' || r.stderr.trim() === '') allNoMatch = false;
  }
  check('A6', countWordOk && allNoMatch, `README: ${folded.length} retired tag names, each exits 1 with stdout empty and a stderr message`);
}

// A7 — the fold map named by the README exists
check('A7', existsSync(`${REPO}/.swarm/runs/cycle-046-retag.mjs`), 'README names .swarm/runs/cycle-046-retag.mjs as the fold map and that file exists');

// A8 — documented exit codes 0/1/2
{
  const ok0 = run([]).code === 0 && run([]).stdout.trim() !== '';
  const noMatch = run(['--tag', 'nonexistent']);
  const ok1 = noMatch.code === 1 && noMatch.stdout === '' && noMatch.stderr.trim() !== '';
  const ok2a = run(['--bogus']).code === 2;
  const ok2b = run(['--seed', 'abc']).code === 2;
  const ok2c = run(['--tag']).code === 2;
  check('A8', ok0 && ok1 && ok2a && ok2b && ok2c, 'README exit codes: 0 success, 1 no-match (stderr only, stdout empty), 2 unknown flag / NaN seed / missing arg');
}

// A9 — a reader hanging up is not an error
{
  let ok = false;
  try {
    const out = execSync(`node bin/aphorism.js --list | head -0; echo "rc=\${PIPESTATUS[0]}"`,
      { cwd: REPO, shell: '/bin/bash', encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    ok = /rc=0/.test(out);
  } catch { ok = false; }
  check('A9', ok, 'README: breaking the pipe (--list | head -0) exits 0, the way a well-behaved Unix filter should');
}

// A10 — README attribution counts equal the triage document
{
  const rows = (TRIAGE.match(/^\| \d+ /gm) || []).length;
  const high = (TRIAGE.match(/\| HIGH \|/g) || []).length;
  const ok = README.includes(`| Entries ranked | ${rows} |`) && README.includes(`| Rated HIGH risk | ${high} |`);
  check('A10', ok, `README attribution table: ${rows} entries ranked, ${high} HIGH — equal to the triage document`);
}

// A11 — the layout block names files that exist
{
  const names = ['bin/aphorism.js', 'src/corpus.js', 'src/select.js', 'src/args.js'];
  const ok = names.every((n) => README.includes(n) && existsSync(`${REPO}/${n}`)) && existsSync(`${REPO}/test`);
  check('A11', ok, 'README Layout block: every named path exists in the tree');
}

// A12 — --list output shape and ordering
{
  const r = run(['--list']);
  const lines = r.stdout.trim().split('\n');
  const shapeOk = lines.length === corpus.length
    && lines.every((l, i) => l === `${corpus[i].text} — ${corpus[i].author}`);
  check('A12', r.code === 0 && shapeOk, 'README: --list prints every entry in corpus order as `<text> — <author>` (EM DASH)');
}

// A13 — --list --json is NDJSON, one object per filtered entry
{
  const r = run(['--list', '--json']);
  const lines = r.stdout.trim().split('\n');
  let ok = r.code === 0 && lines.length === corpus.length;
  if (ok) {
    for (let i = 0; i < lines.length; i++) {
      try {
        const o = JSON.parse(lines[i]);
        if (o.text !== corpus[i].text || o.author !== corpus[i].author) ok = false;
      } catch { ok = false; }
    }
  }
  check('A13', ok, 'README: --list --json emits one JSON object per line (NDJSON) in corpus order');
}

// A14 — --author and --tag narrow together (AND, not OR)
{
  const both = run(['--list', '--author', 'dijkstra', '--tag', 'simplicity']).stdout.trim().split('\n').filter(Boolean);
  const expected = corpus.filter((e) => e.author.toLowerCase().includes('dijkstra') && e.tags.includes('simplicity'));
  const authorOnly = corpus.filter((e) => e.author.toLowerCase().includes('dijkstra'));
  const ok = both.length === expected.length && expected.length > 0 && expected.length < authorOnly.length;
  check('A14', ok, `README: --author + --tag intersect (AND) — ${expected.length} entries, strictly fewer than --author alone (${authorOnly.length})`);
}

// A15 — --list accepts a valid seed but ignores it; an unparseable seed is still exit 2
{
  const a = run(['--list', '--seed', '1']);
  const b = run(['--list', '--seed', '999']);
  const bad = run(['--list', '--seed', 'zzz']);
  check('A15', a.code === 0 && b.code === 0 && a.stdout === b.stdout && bad.code === 2,
    'README: --list ignores a valid --seed (identical output) and still rejects an unparseable one with exit 2');
}

// A16 — the Node 18+ floor
notrun('A16', 'README "Node 18+": no engines field, no CI matrix, no Node 18/20 runtime available to this run — reported as not-run, never as passed (REPORT.md already flags it; KI-27)');

// ================= REPORT.md =================

// B1 — the executive summary suite figure equals a live run
{
  let tests = -1, pass = -1, fail = -1;
  try {
    execSync('node --test test/*.test.js', { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .split('\n').forEach((l) => {
        let m;
        if ((m = l.match(/^ℹ tests (\d+)/))) tests = Number(m[1]);
        if ((m = l.match(/^ℹ pass (\d+)/))) pass = Number(m[1]);
        if ((m = l.match(/^ℹ fail (\d+)/))) fail = Number(m[1]);
      });
  } catch { /* a red suite leaves the counts at -1 and the check fails */ }
  const ok = fail === 0 && REPORT.includes(`Test suite: ${tests} tests pass, 0 fail`);
  check('B1', ok, `REPORT exec summary suite figure equals a live run (measured tests ${tests}, pass ${pass}, fail ${fail})`);
}

// B2 — the executive summary file inventory
{
  const src = readdirSync(`${REPO}/src`).filter((f) => f.endsWith('.js')).length;
  const bin = readdirSync(`${REPO}/bin`).filter((f) => f.endsWith('.js')).length;
  const tests = readdirSync(`${REPO}/test`).filter((f) => f.endsWith('.test.js')).length;
  const docs = readdirSync(`${REPO}/docs`).filter((f) => f.endsWith('.md')).length;
  const ok = REPORT.includes(`${src} files in \`src/\`, ${bin} in \`bin/\`, ${tests} test files in \`test/\`, ${docs} document in \`docs/\``);
  check('B2', ok, `REPORT exec summary inventory: ${src} src, ${bin} bin, ${tests} test files, ${docs} docs`);
}

// B3 — the executive summary option count
{
  const flags = new Set(['--author', '--tag', '--seed', '--list', '--json', '--help']);
  check('B3', REPORT.includes(`Command-line interface: ${flags.size} options`), `REPORT exec summary claims ${flags.size} options`);
}

// B4 — the executive summary corpus size
check('B4', REPORT.includes(`Corpus: ${corpus.length} entries`) && REPORT.includes(`${corpus.length}-entry curated corpus`),
  `REPORT exec summary: corpus is ${corpus.length} entries`);

// B5 — the run #3 hand-off section covers EVERY human-owned (blocked) backlog item
{
  const blocked = backlog.items.filter((i) => i.status === 'blocked').map((i) => i.id);
  const start = REPORT.indexOf('# Improvement run #3 — human-owned items, hand-off');
  const section = start === -1 ? '' : REPORT.slice(start);
  const headed = blocked.filter((id) => new RegExp(`^## ${id}:`, 'm').test(section));
  const missing = blocked.filter((id) => !headed.includes(id));
  check('B5', start !== -1 && missing.length === 0,
    `REPORT run #3 hand-off names every blocked item with a next actor — ${headed.length}/${blocked.length} covered${missing.length ? `, MISSING ${missing.join(', ')}` : ''}`);
}

// B6 — the J-7 heading's number word matches the behaviours its own body enumerates
{
  const start = REPORT.indexOf('## J-7:');
  const section = start === -1 ? '' : REPORT.slice(start, REPORT.indexOf('\n---', start) + 1 || undefined);
  const enumerated = new Set([...section.matchAll(/^- \(([1-4])\)|\(([1-4])\)\s\*\*/gm)].flatMap((m) => [m[1], m[2]]).filter(Boolean));
  const words = { 2: 'Two', 3: 'Three', 4: 'Four' };
  const heading = (REPORT.match(/^## J-7: (\w+) CLI behaviours?/m) || [])[1];
  const n = enumerated.size;
  const backlogTitle = (backlog.items.find((i) => i.id === 'J-7') || {}).title || '';
  const backlogWord = (backlogTitle.match(/^(\w+) CLI behaviours/) || [])[1];
  check('B6', heading === words[n] && backlogWord && backlogWord.toLowerCase() === words[n].toLowerCase(),
    `REPORT J-7 heading number word matches the ${n} behaviours the section enumerates and the backlog title (heading "${heading}", backlog "${backlogWord}")`);
}

// B7 — the exec summary's "unspecified behaviours" count agrees with J-7
{
  const m = REPORT.match(/- (\w+) CLI behaviors are unspecified and require human ruling/);
  const start = REPORT.indexOf('## J-7:');
  const section = start === -1 ? '' : REPORT.slice(start);
  const enumerated = new Set([...section.matchAll(/^- \(([1-4])\)|\(([1-4])\)\s\*\*/gm)].flatMap((x) => [x[1], x[2]]).filter(Boolean));
  const words = { 2: 'Two', 3: 'Three', 4: 'Four' };
  check('B7', m && m[1] === words[enumerated.size],
    `REPORT exec summary "unspecified behaviours" count matches J-7's ${enumerated.size} (summary says "${m ? m[1] : 'ABSENT'}")`);
}

// B8 — the exec summary's runs #1-#2 hand-off count
{
  const fromEarlierRuns = ['T-006', 'T-040', 'J-7'].filter((id) =>
    backlog.items.some((i) => i.id === id && i.status === 'blocked'));
  const words = { 2: 'Two', 3: 'Three', 4: 'Four' };
  check('B8', REPORT.includes(`${words[fromEarlierRuns.length]} open items from runs #1–#2 are explicitly handed off`),
    `REPORT exec summary: ${fromEarlierRuns.length} blocked items carried in from runs #1-#2`);
}

// B9 — the derivation table is pinned to a commit and still verifies AT that commit
{
  const pinned = 'dbc1939';
  let ok = false, detail = '';
  try {
    const corpusAt = execSync(`git show ${pinned}:src/corpus.js > /tmp/.v7corpus.cjs && node -e "console.log(require('/tmp/.v7corpus.cjs').corpus.length)"`,
      { cwd: REPO, shell: '/bin/bash', encoding: 'utf8' }).trim();
    const rowsAt = execSync(`git show ${pinned}:docs/corpus-attribution-triage.md | grep -c '^| [0-9]'`,
      { cwd: REPO, shell: '/bin/bash', encoding: 'utf8' }).trim();
    const highAt = execSync(`git show ${pinned}:docs/corpus-attribution-triage.md | grep -c '| HIGH |'`,
      { cwd: REPO, shell: '/bin/bash', encoding: 'utf8' }).trim();
    ok = corpusAt === '50' && rowsAt === '50' && highAt === '8'
      && REPORT.includes(`**Everything below is measured at commit \`${pinned}\`**`);
    detail = `at ${pinned}: corpus ${corpusAt}, triage rows ${rowsAt}, HIGH ${highAt}`;
  } catch (err) { detail = `git show failed: ${String(err.message).slice(0, 60)}`; }
  check('B9', ok, `REPORT derivation table is anchored to a commit and its static rows still verify there (${detail})`);
}

// B10 — dated history rows are NOT retro-edited: run #1's frozen figures still read as written
{
  const ok = REPORT.includes('**80 pass / 0 fail**') && REPORT.includes('48 tests')
    && REPORT.includes('**101 pass / 0 fail** (tests 101, fail 0)');
  check('B10', ok, 'REPORT dated history rows (48 tests, 80 pass/0 fail, 101 pass/0 fail at dbc1939) are left as written, not retro-edited to today');
}

// ================= docs/ =================

// C1 — triage bands
{
  const rows = (TRIAGE.match(/^\| \d+ /gm) || []).length;
  const bands = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const m of TRIAGE.matchAll(/\| (HIGH|MEDIUM|LOW) \|/g)) bands[m[1]]++;
  const sum = bands.HIGH + bands.MEDIUM + bands.LOW;
  check('C1', rows === corpus.length && sum === rows,
    `triage: ${rows} rows for ${corpus.length} corpus entries, bands sum to the row count (H${bands.HIGH}/M${bands.MEDIUM}/L${bands.LOW})`);
}

// C2 — every triage row indexes a real corpus entry and names ITS author (discriminator:
// a doc that drifted from the corpus, or rows copied out of order, cannot pass this)
{
  const rows = [...TRIAGE.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (HIGH|MEDIUM|LOW) \|/gm)];
  let ok = rows.length === corpus.length;
  const bad = [];
  for (const m of rows) {
    const idx = Number(m[1]);
    const author = m[3].trim();
    if (!corpus[idx] || corpus[idx].author !== author) { ok = false; bad.push(idx); }
  }
  const ids = new Set(rows.map((m) => Number(m[1])));
  ok = ok && ids.size === corpus.length;
  check('C2', ok, `every triage row index maps to a real corpus entry with the same author${bad.length ? ` — MISMATCH at ${bad.slice(0, 5).join(',')}` : ''}`);
}

// C3 — the triage's first-40-chars column still matches the corpus text it claims to quote
{
  const rows = [...TRIAGE.matchAll(/^\| (\d+) \| (.+?) \| /gm)];
  let ok = rows.length > 0;
  const bad = [];
  for (const m of rows) {
    const idx = Number(m[1]);
    const shown = m[2].replace(/…$/, '').trim();
    if (!corpus[idx] || !corpus[idx].text.startsWith(shown.slice(0, 20))) { ok = false; bad.push(idx); }
  }
  check('C3', ok, `every triage row's quoted prefix still matches its corpus entry's text${bad.length ? ` — MISMATCH at ${bad.slice(0, 5).join(',')}` : ''}`);
}

// C4 — the triage's own method claim
notrun('C4', 'triage "produced with no network access": a negative claim about how a past agent worked; not measurable from the tree — reported as not-run');

// ================= report =================
const fails = results.filter((r) => r.status === 'FAIL');
for (const r of results) console.log(`${r.status.padEnd(6)} ${r.id}: ${r.msg}`);
console.log(`\n${results.filter((r) => r.status === 'PASS').length} PASS / ${fails.length} FAIL / ${results.filter((r) => r.status === 'NOTRUN').length} NOTRUN`);
process.exit(fails.length ? 1 : 0);
