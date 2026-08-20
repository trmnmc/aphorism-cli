#!/usr/bin/env node
// cycle-4 verification gate — item P-4 (playbook allowlist gap: reproduce, then prove closed
// by execution or hand off with the exact patch).
//
// Written by the CONDUCTOR at verification time. Nothing was dispatched to an agent this
// cycle, so there is no builder to fence out and no pre-dispatch seal: the whole value of
// this program is that every claim the handoff document makes is RE-DERIVED from the tree
// (settings.json, bin/, the systemd unit facts, applied.log, the target repo) instead of
// being read back out of the prose that asserts it.
//
// Usage:  node c004-gate-P-4.mjs [--mutate GN] [--json]
// --mutate GN corrupts exactly one input for cell GN, to prove that cell can go red.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SWARM = '/opt/swarm';
const TARGET = '/opt/targets/aphorism-cli';
const DOC = `${SWARM}/playbook/HANDOFF-allowlist-2026-08-17.md`;
const SETTINGS = `${SWARM}/.claude/settings.json`;
const LEDGER = `${SWARM}/playbook/applied.log`;
const RUNFILE = `${SWARM}/runs/current.json`;
const SYSTEMD_FACTS = `${SWARM}/runs/c004-systemd-facts.txt`;
const SECTION_RE = /^## UPDATE 2026-08-20/;
const CORPUS_BASE = '81b0958'; // this run's first commit

const args = process.argv.slice(2);
const MUTATE = (args.includes('--mutate') ? args[args.indexOf('--mutate') + 1] : null);
const results = [];
const pass = (id, msg) => results.push({ id, ok: true, msg });
const fail = (id, msg) => results.push({ id, ok: false, msg });
const note = (id, msg) => results.push({ id, ok: null, msg });

// ---------- inputs ----------------------------------------------------------------
const doc = readFileSync(DOC, 'utf8');
const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
let allow = settings.permissions.allow.slice();
const systemd = existsSync(SYSTEMD_FACTS) ? readFileSync(SYSTEMD_FACTS, 'utf8') : '';
const ledgerLines = readFileSync(LEDGER, 'utf8').trim().split('\n').filter(Boolean);
const runfile = JSON.parse(readFileSync(RUNFILE, 'utf8'));

if (MUTATE === 'G2' || MUTATE === 'G3' || MUTATE === 'G7') {
  allow = allow.concat(['Bash(/opt/swarm/bin/swarm-playbook.sh:*)']);
}

// The allowlist matcher, written from the shape the entries actually take:
// "Bash(X:*)" authorises a command that IS X or that starts with "X ".
const bashEntries = allow
  .filter((e) => e.startsWith('Bash(') && e.endsWith(':*)'))
  .map((e) => e.slice('Bash('.length, -':*)'.length));
const authorised = (cmd) => bashEntries.some((x) => cmd === x || cmd.startsWith(x + ' '));

// ---------- the run #5 section ----------------------------------------------------
const lines = doc.split('\n');
const start = lines.findIndex((l) => SECTION_RE.test(l));
let section = '';
if (start >= 0) {
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## UPDATE /.test(lines[i]) || /^---$/.test(lines[i])) { end = i; break; }
  }
  section = lines.slice(start, end).join('\n');
}

// ---------- G1: the section exists and is newest-first -----------------------------
{
  const prior = lines.findIndex((l) => /^## UPDATE 2026-08-19, run #4 cycle 2/.test(l));
  if (start < 0) fail('G1', 'no "## UPDATE 2026-08-20" section in the handoff');
  else if (prior >= 0 && start > prior) fail('G1', `run #5 section at line ${start + 1} sits BELOW the run #4 section at ${prior + 1} — newest-first broken`);
  else pass('G1', `run #5 section at line ${start + 1}, ${section.split('\n').length} lines, above the run #4 section at line ${prior + 1}`);
}

// ---------- G2: every probe row re-derived from settings.json ----------------------
{
  const rows = section.split('\n')
    .filter((l) => /^\| `/.test(l))
    .map((l) => {
      const cells = l.split('|').map((c) => c.trim());
      const cmd = (cells[1] || '').replace(/^`|`$/g, '').replace(/…/g, '');
      const verdictCell = cells[2] || '';
      const verdict = /DENIED/.test(verdictCell) ? 'DENIED' : (/RAN/.test(verdictCell) ? 'RAN' : '?');
      return { cmd, verdict, raw: l };
    })
    .filter((r) => r.verdict !== '?');
  const bad = rows.filter((r) => authorised(r.cmd) !== (r.verdict === 'RAN'));
  if (!rows.length) fail('G2', 'no probe rows parsed out of the run #5 section');
  else if (bad.length) fail('G2', `${bad.length}/${rows.length} rows disagree with allow[]: ` + bad.map((b) => `${b.cmd} claims ${b.verdict}`).join('; '));
  else pass('G2', `${rows.length} probe rows, every verdict re-derived from allow[] (${rows.filter((r) => r.verdict === 'RAN').length} RAN / ${rows.filter((r) => r.verdict === 'DENIED').length} DENIED)`);
}

// ---------- G3: the ask, and the completeness of the classification -----------------
{
  const binFiles = readdirSync(`${SWARM}/bin`).filter((f) => /\.(sh|mjs)$/.test(f)).sort();
  const askBlock = (section.match(/```json\n([\s\S]*?)```/) || [, ''])[1];
  const askPaths = [...askBlock.matchAll(/"Bash\(([^)]*?):\*\)"/g)].map((m) => m[1]);
  const askScripts = [...new Set(askPaths.map((p) => p.split('/').pop().split(' ').pop()))].sort();

  const clsBlock = (section.match(/```text\n([\s\S]*?)```/) || [, ''])[1];
  const clsRows = clsBlock.split('\n').map((l) => l.trim()).filter((l) => /^\S+\.(sh|mjs)\s+\S/.test(l))
    .map((l) => { const m = l.match(/^(\S+)\s+(.*)$/); return { file: m[1], why: m[2] }; });

  // every script in the ask must be absent from allow[] under EVERY form
  const leaked = askScripts.filter((s) => bashEntries.some((x) => x.includes(s)));
  // completeness: ask ∪ classified == bin/
  const covered = new Set([...askScripts, ...clsRows.map((r) => r.file)]);
  const missing = binFiles.filter((f) => !covered.has(f));
  const extra = [...covered].filter((f) => !binFiles.includes(f));

  // each "no line needed" justification is checked against its own evidence
  const badWhy = [];
  for (const r of clsRows) {
    const w = r.why;
    let ok = false;
    if (/systemd/i.test(w)) ok = systemd.includes(`/bin/${r.file}`);
    else if (/subprocess of (\S+)/.test(w)) {
      const parent = w.match(/subprocess of (\S+)/)[1];
      ok = existsSync(`${SWARM}/bin/${parent}`) && readFileSync(`${SWARM}/bin/${parent}`, 'utf8').includes(r.file);
    } else if (/allow\[\]/.test(w)) ok = bashEntries.some((x) => x.includes(r.file));
    else if (/node:\*/.test(w)) ok = r.file.endsWith('.mjs') && bashEntries.includes('node');
    else if (/JUDGMENT/.test(w)) ok = !systemd.includes(`/bin/${r.file}`) && !bashEntries.some((x) => x.includes(r.file));
    if (!ok) badWhy.push(`${r.file} (${w})`);
  }

  const problems = [];
  if (!askScripts.length) problems.push('no patch block parsed');
  if (leaked.length) problems.push(`asked for but ALREADY allowlisted: ${leaked.join(', ')}`);
  if (missing.length) problems.push(`bin/ scripts the doc never classifies: ${missing.join(', ')}`);
  if (extra.length) problems.push(`classified but not in bin/: ${extra.join(', ')}`);
  if (badWhy.length) problems.push(`unsupported justification: ${badWhy.join('; ')}`);
  if (problems.length) fail('G3', problems.join(' | '));
  else pass('G3', `ask = ${askScripts.join(', ')} (${askPaths.length} lines), all absent from allow[]; ${clsRows.length} other bin/ entries classified, every justification re-derived; ${binFiles.length}/${binFiles.length} of bin/ covered`);
}

// ---------- G4: the denial counter is single-booked ---------------------------------
{
  const counts = [...doc.matchAll(/\*\*Denial count: (\d+)/g)].map((m) => Number(m[1]));
  const ledgerNums = ledgerLines.map((l) => (l.match(/denial #(\d+)/) || [])[1]).filter(Boolean).map(Number);
  let docRun5 = (section.match(/\*\*Denial count: (\d+)/) || [])[1];
  if (MUTATE === 'G4') docRun5 = String(Number(docRun5) + 7);
  const ledgerNewest = ledgerNums[ledgerNums.length - 1];
  const dupes = counts.filter((c, i) => counts.indexOf(c) !== i);
  const problems = [];
  if (!docRun5) problems.push('run #5 section states no denial count');
  if (Number(docRun5) !== ledgerNewest) problems.push(`doc says ${docRun5}, newest applied.log line says ${ledgerNewest}`);
  if (dupes.length && !/double-book|collision|same number/i.test(section)) problems.push(`counts ${counts.join(',')} contain a repeat (${dupes.join(',')}) that no section explains`);
  if (problems.length) fail('G4', problems.join(' | '));
  else pass('G4', `run #5 = denial #${docRun5}, matching the newest applied.log line; doc counts [${counts.join(', ')}], the repeat is explained in-section`);
}

// ---------- G5: this run's ledger line ----------------------------------------------
{
  const last = ledgerLines[ledgerLines.length - 1];
  let applied = ((last.match(/applied=([^|]*)/) || [, ''])[1]).trim().split(',').filter(Boolean).sort();
  if (MUTATE === 'G5') applied = applied.slice(1); // drop one id from the ledger's own set
  const expected = runfile.playbook.applied.slice().sort();
  const marked = /HAND-WRITTEN/.test(last);
  const same = JSON.stringify(applied) === JSON.stringify(expected);
  if (!marked) fail('G5', 'newest ledger line is not marked HAND-WRITTEN');
  else if (!same) fail('G5', `ledger applied=[${applied}] != runfile.playbook.applied=[${expected}]`);
  else pass('G5', `newest ledger line marked HAND-WRITTEN, ${applied.length} ids identical to runfile.playbook.applied`);
}

// ---------- G6: the P-5 standing floor ----------------------------------------------
{
  let testFiles = readdirSync(`${TARGET}/test`).filter((f) => f.endsWith('.test.js')).map((f) => `test/${f}`);
  if (MUTATE === 'G6b') testFiles = testFiles.slice(0, 1); // shrink the input, not the floor
  let out = '';
  try {
    out = execFileSync('node', ['--test', ...testFiles], { cwd: TARGET, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  // node 18/20/22 emit "# pass N" (TAP), node 24 emits "ℹ pass N" (spec reporter). Accept
  // either marker rather than pinning the one this host happens to run — a summary the
  // parser cannot read must not be readable as zero failures (L-041: fail CLOSED).
  const num = (k) => Number((out.match(new RegExp(`^(?:#|\\u2139) ${k} (\\d+)$`, 'm')) || [, '-1'])[1]);
  const passed = num('pass'), failed = num('fail');
  const liveBytes = readFileSync(`${TARGET}/src/corpus.js`);
  const live = createHash('sha256')
    .update(MUTATE === 'G6a' ? Buffer.concat([liveBytes, Buffer.from('\n')]) : liveBytes)
    .digest('hex');
  const base = createHash('sha256')
    .update(execFileSync('git', ['show', `${CORPUS_BASE}:src/corpus.js`], { cwd: TARGET }))
    .digest('hex');
  const problems = [];
  if (passed < 119 || failed !== 0) problems.push(`suite pass=${passed} fail=${failed} (floor is >=119 / 0)`);
  if (live !== base) problems.push(`src/corpus.js differs from ${CORPUS_BASE}`);
  if (problems.length) fail('G6', problems.join(' | '));
  else pass('G6', `suite pass=${passed} fail=${failed}; src/corpus.js identical to ${CORPUS_BASE} (${live.slice(0, 8)})`);
}

// ---------- G7: the confirming command is still unreachable --------------------------
{
  const shBlocks = [...doc.matchAll(/```sh\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  const confirm = shBlocks[shBlocks.length - 1];
  if (!confirm) fail('G7', 'no ```sh confirming command block in the handoff');
  else if (!/swarm-playbook\.sh/.test(confirm)) fail('G7', `confirming command does not invoke swarm-playbook.sh: ${confirm}`);
  else if (authorised(confirm)) fail('G7', `the confirming command is ALREADY authorised by allow[] — the ask is stale: ${confirm}`);
  else pass('G7', `confirming command \`${confirm}\` invokes swarm-playbook.sh and is unauthorised by allow[] — the ask is still real`);
}

// ---------- report -------------------------------------------------------------------
const ok = results.filter((r) => r.ok === true).length;
const bad = results.filter((r) => r.ok === false).length;
console.log(`cycle-4 gate — item P-4 (playbook allowlist handoff)   ${ok} PASS / ${bad} FAIL${MUTATE ? `   [--mutate ${MUTATE}]` : ''}`);
for (const r of results) console.log(`  ${r.ok === null ? 'NOTE' : r.ok ? 'PASS' : 'FAIL'} ${r.id}  ${r.msg}`);
if (MUTATE) console.log(bad > 0 ? `FAILABILITY CONTROL: CONTROL PASSED (cell ${MUTATE} can fail)` : `FAILABILITY CONTROL: CONTROL FAILED (cell ${MUTATE} did NOT go red)`);
process.exit(bad ? 1 : 0);
