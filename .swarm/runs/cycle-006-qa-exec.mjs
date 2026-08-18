// Conductor-run executor for the cycle-6 QA pass (aphorism-cli improvement run #3).
// Replaces qa-verify.js's executor agent: these scenarios are plain CLI invocations,
// so running them here yields conductor evidence rather than an agent claim.
import { spawnSync } from 'node:child_process';
import { writeFileSync, openSync, closeSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const run = (args, opts = {}) => {
  const r = spawnSync('node', ['bin/aphorism.js', ...args], {
    cwd: ROOT, encoding: 'utf8', ...opts
  });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '', signal: r.signal };
};
const show = (s, n = 200) => JSON.stringify(s.length > n ? s.slice(0, n) + `…(+${s.length - n}B)` : s);

console.log('=== S1: --list --author dijk, seed ignored, EM DASH format ===');
{
  const a = run(['--list', '--author', 'dijk', '--seed', '7']);
  const b = run(['--list', '--author', 'dijk', '--seed', '99']);
  console.log('exit1=' + a.code, 'exit2=' + b.code);
  console.log('stderr1=' + show(a.err), 'stderr2=' + show(b.err));
  console.log('byte-identical across seeds:', a.out === b.out);
  const lines = a.out.split('\n').filter(Boolean);
  console.log('lines=' + lines.length);
  const EM = '—';
  const sepOK = lines.every(l => l.split(' ' + EM + ' ').length === 2);
  console.log('every line has exactly one " \\u2014 " separator:', sepOK);
  console.log('every author segment contains "dijk" (ci):',
    lines.every(l => l.split(' ' + EM + ' ')[1].toLowerCase().includes('dijk')));
  console.log('hyphen-minus/en-dash used as separator anywhere:',
    lines.some(l => / - | – /.test(l)));
  console.log('sample:', show(lines[0], 120));
}

console.log('\n=== S2: --json --seed Infinity --tag design, deterministic single-line object ===');
{
  const a = run(['--json', '--seed', 'Infinity', '--tag', 'design']);
  const b = run(['--json', '--seed', 'Infinity', '--tag', 'design']);
  console.log('exit1=' + a.code, 'exit2=' + b.code);
  console.log('stderr1=' + show(a.err));
  console.log('byte-identical across identical runs:', a.out === b.out);
  const lines = a.out.split('\n').filter(Boolean);
  console.log('stdout lines=' + lines.length);
  let o = null, parsed = false;
  try { o = JSON.parse(lines[0]); parsed = true; } catch (e) { console.log('PARSE FAIL: ' + e.message); }
  if (parsed) {
    console.log('has text/author/tags:', ['text', 'author', 'tags'].every(k => k in o), '| tags isArray:', Array.isArray(o.tags));
    console.log('tags contains "design" (whole-tag, ci):', o.tags.some(t => String(t).toLowerCase() === 'design'));
    console.log('object:', show(lines[0], 160));
  }
  // discriminator: Infinity must not degrade to the random branch
  const c = run(['--json', '--seed', '-Infinity', '--tag', 'design']);
  console.log('-Infinity also exit 0:', c.code === 0, '| Infinity vs -Infinity differ:', a.out !== c.out);
}

console.log('\n=== S3 (negative): --json --tag desi must NOT substring-match design ===');
{
  const a = run(['--json', '--tag', 'desi']);
  console.log('exit=' + a.code, '(spec: exactly 1)');
  console.log('stdout bytes=' + Buffer.byteLength(a.out), '(spec: exactly 0)');
  console.log('stderr bytes=' + Buffer.byteLength(a.err), '(spec: non-empty)');
  console.log('stderr=' + show(a.err));
}

console.log('\n=== S4 (negative): --list --seed abc is still a usage error ===');
{
  const a = run(['--list', '--seed', 'abc']);
  console.log('exit=' + a.code, '(spec: exactly 2)');
  console.log('stdout bytes=' + Buffer.byteLength(a.out), '(must NOT contain the listing)');
  console.log('stderr bytes=' + Buffer.byteLength(a.err), '(spec: non-empty)');
  console.log('stderr=' + show(a.err));
  const clean = run(['--list']);
  console.log('control: bare --list exits ' + clean.code + ' with ' + clean.out.split('\n').filter(Boolean).length + ' lines');
}

console.log('\n=== LOOK-1 reproduction: EPIPE on early consumer close ===');
{
  const r = spawnSync('sh', ['-c', 'node bin/aphorism.js --list | true'], { cwd: ROOT, encoding: 'utf8' });
  console.log('pipeline exit=' + r.status);
  console.log('stderr bytes=' + Buffer.byteLength(r.stderr));
  console.log('stderr head=' + show(r.stderr, 320));
}

console.log('\n=== LOOK-2 reproduction: failed stdout write (/dev/full) ===');
{
  let fd;
  try {
    fd = openSync('/dev/full', 'w');
    const r = spawnSync('node', ['bin/aphorism.js', '--list'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', fd, 'pipe']
    });
    console.log('exit=' + r.status + '  (README defines exit 1 as "no aphorism matched")');
    console.log('stderr head=' + show(r.stderr, 300));
  } catch (e) {
    console.log('could not open /dev/full: ' + e.message);
  } finally { if (fd !== undefined) closeSync(fd); }
}

console.log('\n=== LOOK-3 reproduction: Saint-Exupery accent ===');
{
  const a = run(['--list']);
  const hit = a.out.split('\n').filter(l => /Exup/.test(l));
  for (const h of hit) {
    console.log('line:', show(h, 160));
    console.log('codepoints around "Exup":', [...h.slice(h.indexOf('Exup'), h.indexOf('Exup') + 8)]
      .map(c => c + '=U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '));
  }
  console.log('corpus contains any U+00E9 (é) at all:', /é/.test(a.out));
  console.log('corpus contains EM DASH U+2014:', /—/.test(a.out));
}

console.log('\n=== LOOK-4 reproduction: --seed "" vs Number("") === 0 ===');
{
  const empty = run(['--seed', '', '--json']);
  const zero = run(['--seed', '0', '--json']);
  const pad = run(['--seed', ' 5 ', '--json']);
  const five = run(['--seed', '5', '--json']);
  console.log('--seed "" exit=' + empty.code + ' stderr=' + show(empty.err, 90));
  console.log('--seed 0  exit=' + zero.code);
  console.log('Number("") =', Number(''), '-> non-NaN, so spec says it is a VALID seed');
  console.log('--seed " 5 " matches --seed 5:', pad.out === five.out, '| pad exit=' + pad.code);
  console.log('Number(" 5 ") =', Number(' 5 '));
}
