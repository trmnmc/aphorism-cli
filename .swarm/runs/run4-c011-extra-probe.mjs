// One discriminator the sealed gate did NOT carry and the builder did NOT claim:
// does the new guard fail LOUD when the claim is DELETED rather than made wrong?
// Deletion is a real decay path — someone rewords the sentence and drops the figure —
// and a guard that only catches a WRONG number would pass silently through it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const TARGET = '/opt/targets/aphorism-cli';
const PATHS = ['bin', 'src', 'test', 'README.md', 'docs/corpus-attribution-triage.md'];

function arm() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'c011-extra-'));
  for (const rel of PATHS) {
    const s = path.join(TARGET, rel);
    if (!fs.existsSync(s)) continue;
    const t = path.join(d, rel);
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.cpSync(s, t, { recursive: true });
  }
  return d;
}

function suite(d) {
  try {
    const out = execFileSync('bash', ['-c', 'node --test test/*.test.js'],
      { cwd: d, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}
const num = (out, w) => {
  const m = out.match(new RegExp(`^[\\u2139#]\\s*${w}\\s+(\\d+)`, 'm'));
  return m ? parseInt(m[1], 10) : -1;
};

const rows = [];

// P1 — DELETE the claim outright, keeping the sentence readable.
{
  const d = arm();
  const p = path.join(d, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const orig = "Of the corpus's 24 distinct authors, exactly one carries a non-ASCII\ncharacter";
  const gone = "Exactly one author in the corpus carries a non-ASCII\ncharacter";
  if (!before.includes(orig)) throw new Error('deletion anchor not found');
  fs.writeFileSync(p, before.replace(orig, gone));
  const r = suite(d);
  rows.push({
    id: 'P1',
    ok: r.code !== 0 && num(r.out, 'fail') >= 1,
    note: 'DELETING the claim makes the guard fail LOUD (not pass silently)',
    detail: `exit=${r.code} tests=${num(r.out, 'tests')} fail=${num(r.out, 'fail')}`,
  });
}

// P2 — CONTROL: the same arm untouched must be green, so P1's red is the deletion's doing.
{
  const d = arm();
  const r = suite(d);
  rows.push({
    id: 'P2',
    ok: r.code === 0 && num(r.out, 'fail') === 0,
    note: 'CONTROL: the unmutated arm is green, so P1 measured the deletion and not the arm',
    detail: `exit=${r.code} tests=${num(r.out, 'tests')} pass=${num(r.out, 'pass')} fail=${num(r.out, 'fail')}`,
  });
}

// P3 — the delivered test file contains no bare literal 24 on its assertion path.
{
  const txt = fs.readFileSync(path.join(TARGET, 'test/readme-tags.test.js'), 'utf8');
  const i = txt.indexOf("test('README `--author` matching section");
  const block = txt.slice(i, txt.indexOf('\n});', i));
  const codeOnly = block.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  rows.push({
    id: 'P3',
    ok: !/\b24\b/.test(codeOnly),
    note: 'the new test body carries no literal 24 (comments excluded, code only)',
    detail: /\b24\b/.test(codeOnly) ? 'LITERAL FOUND' : 'no literal in the executable lines',
  });
}

let pass = 0, fail = 0;
console.log('');
for (const r of rows) {
  r.ok ? pass++ : fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.note}`);
  console.log(`          ${r.detail}`);
}
console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
