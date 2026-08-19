// Cycle 7 (run #4) — VERIFICATION GATE for the QA live-look findings L-01 and L-02.
//
// Authored by the conductor AFTER the look agent returned. That ordering is correct for a
// QA look (the findings ARE the input); the seal-before-dispatch discipline exists for build
// waves, where an agent could otherwise code to the check.
//
// Agent returns are claims. Every row below re-runs the reproduction from scratch and reads
// the observable directly. Controls are included because this run has now shipped three
// checks that went silent: a gate with no must-stay-GREEN row is a snapshot test.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const T = '/opt/targets/aphorism-cli';
const sh = (cmd) => {
  const r = spawnSync('/bin/bash', ['-c', cmd], { cwd: T, encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
};

const rows = [];
const chk = (id, kind, desc, fn) => {
  let verdict, detail;
  try { [verdict, detail] = fn(); } catch (e) { verdict = false; detail = 'THREW ' + e.message; }
  rows.push({ id, kind, desc, verdict, detail });
};

// ---------------------------------------------------------------- L-01
chk('A1', 'finding', 'ASCII "Saint-Exupery" -> exit 1, stdout EMPTY', () => {
  const r = sh(`node bin/aphorism.js --author 'Saint-Exupery'`);
  return [r.code === 1 && r.out.length === 0,
    `exit=${r.code} stdout_bytes=${r.out.length} stderr=${JSON.stringify(r.err.trim().slice(0, 50))}`];
});

chk('A2', 'discriminator', 'NFC "Saint-Exupéry" -> exit 0 (the entry EXISTS)', () => {
  const r = sh(`node bin/aphorism.js --author 'Saint-Exupéry'`);
  return [r.code === 0 && r.out.length > 0, `exit=${r.code} stdout_bytes=${r.out.length}`];
});

chk('A3', 'severity', 'partial "saint" -> exit 0 (entry IS reachable; caps severity)', () => {
  const r = sh(`node bin/aphorism.js --author 'saint'`);
  return [r.code === 0 && r.out.length > 0, `exit=${r.code} stdout_bytes=${r.out.length}`];
});

chk('A4', 'structural', 'corpus has exactly ONE non-ASCII author (read from the module)', () => {
  const r = sh(`node -e "const c=require('./src/corpus.js');` +
    `const a=[...new Set((c.corpus||c).map(e=>e.author))];` +
    `const n=a.filter(x=>/[^\\x00-\\x7F]/.test(x));` +
    `console.log(JSON.stringify({total:a.length,nonascii:n}))"`);
  const j = JSON.parse(r.out.trim() || '{}');
  return [Array.isArray(j.nonascii) && j.nonascii.length === 1,
    `authors=${j.total} nonascii=${JSON.stringify(j.nonascii)}`];
});

// ---------------------------------------------------------------- L-02
chk('A5', 'finding', 'no-match with stderr->/dev/full: earned exit 1 DESTROYED, becomes 3', () => {
  const r = sh(`node bin/aphorism.js --tag nope-tag 2>/dev/full`);
  return [r.code === 3, `exit=${r.code} (earned 1) stdout_bytes=${r.out.length}`];
});

chk('A6', 'finding', 'usage error with stderr->/dev/full: earned exit 2 DESTROYED, becomes 3', () => {
  const r = sh(`node bin/aphorism.js --bogus 2>/dev/full`);
  return [r.code === 3, `exit=${r.code} (earned 2) stdout_bytes=${r.out.length}`];
});

chk('A7', 'finding', 'A5/A6 produce NO diagnostic on any readable channel', () => {
  const r = sh(`node bin/aphorism.js --tag nope-tag 2>/dev/full 3>&1`);
  return [r.out.length === 0, `stdout_bytes=${r.out.length}`];
});

chk('A8', 'contract', 'README-documented case: stdout->/dev/full -> exit 3 WITH an "aphorism:" stderr line', () => {
  const r = sh(`node bin/aphorism.js --seed 1 >/dev/full`);
  return [r.code === 3 && /^aphorism: /m.test(r.err),
    `exit=${r.code} stderr=${JSON.stringify(r.err.trim().slice(0, 60))}`];
});

chk('A9', 'structural', 'README exit-code table row 3 scopes exit 3 to STDOUT and promises a stderr line', () => {
  const md = readFileSync(T + '/README.md', 'utf8');
  // Read the table ROW the document owns (leading `| \`3\` |`), not loose prose.
  const row = md.split('\n').find((l) => /^\|\s*`3`\s*\|/.test(l));
  if (!row) return [false, 'no `| `3` |` table row found in README'];
  const scopesStdout = /stdout write failure/i.test(row);
  const promisesLine = /line on stderr/i.test(row);
  return [scopesStdout && promisesLine,
    `row=${JSON.stringify(row.trim().slice(0, 110))} scopes_stdout=${scopesStdout} promises_stderr_line=${promisesLine}`];
});

chk('A10', 'structural', 'SPEC "Exit codes" Domain rule does NOT enumerate 3', () => {
  const md = readFileSync(T + '/.swarm/SPEC.md', 'utf8');
  const m = md.match(/^- Exit codes:[\s\S]*?\n(?=- |\n## )/m);
  if (!m) return [false, 'Exit codes domain-rule bullet not found'];
  const clause = m[0].replace(/\s+/g, ' ').trim();
  const mentionsThree = /\b3\b/.test(clause);
  return [!mentionsThree, `clause=${JSON.stringify(clause.slice(0, 150))} mentions_3=${mentionsThree}`];
});

// ---------------------------------------------------------------- controls
chk('C1', 'control:must-stay-GREEN', 'success run, stderr->/dev/full but never written -> exit 0 (no spurious fire)', () => {
  const r = sh(`node bin/aphorism.js --seed 1 2>/dev/full`);
  return [r.code === 0 && r.out.length > 0, `exit=${r.code} stdout_bytes=${r.out.length}`];
});

chk('C2', 'control:must-stay-GREEN', 'stderr merely CLOSED (exec 2>&-) preserves earned 1 and 2', () => {
  const a = sh(`exec 2>&-; node bin/aphorism.js --tag nope-tag`);
  const b = sh(`exec 2>&-; node bin/aphorism.js --bogus`);
  return [a.code === 1 && b.code === 2, `closed-stderr no-match=${a.code} (want 1), usage=${b.code} (want 2)`];
});

chk('C3', 'control:must-stay-GREEN', 'EPIPE stays benign: --list | head -1 -> CLI exit 0, quiet stderr', () => {
  const r = sh(`node bin/aphorism.js --list 2>/tmp/c007-c3.err | head -1; exit \${PIPESTATUS[0]}`);
  let e = ''; try { e = readFileSync('/tmp/c007-c3.err', 'utf8'); } catch {}
  return [r.code === 0 && e.trim() === '', `cli_exit=${r.code} stderr=${JSON.stringify(e.trim().slice(0, 40))}`];
});

chk('C4', 'control:must-DIE', 'A5 discriminates: asserting the EARNED code (1) there must FAIL', () => {
  const r = sh(`node bin/aphorism.js --tag nope-tag 2>/dev/full`);
  // If this "control" passed, A5 would be measuring nothing.
  return [r.code !== 1, `exit=${r.code}; asserting ==1 would ${r.code === 1 ? 'PASS (A5 vacuous)' : 'FAIL (A5 discriminates)'}`];
});

chk('C5', 'control:must-DIE', 'A1 discriminates: a nonsense author must ALSO be exit 1, so A1 needs A2', () => {
  const r = sh(`node bin/aphorism.js --author 'zzz-no-such-author-zzz'`);
  return [r.code === 1, `exit=${r.code} — A1 alone cannot tell "absent" from "unmatchable"; A2 supplies that`];
});

// ---------------------------------------------------------------- report
let pass = 0, fail = 0;
console.log('id   kind                      verdict  description');
for (const r of rows) {
  r.verdict ? pass++ : fail++;
  console.log(`${r.id.padEnd(4)} ${r.kind.padEnd(25)} ${(r.verdict ? 'PASS' : 'FAIL').padEnd(8)} ${r.desc}`);
  console.log(`     ${r.detail}`);
}
console.log(`\n${pass} PASS / ${fail} FAIL`);
