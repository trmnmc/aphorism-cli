#!/usr/bin/env node
// Cycle 28 PROBE B4 -- the decisive follow-up to gate check B4.
//
// B4 measured that an EARLIER "### " heading carrying both the `--list`
// token and the word "behaviour" is picked instead of the real section,
// because the fix takes the FIRST match. B4b proved HEAD is green on the
// same input, so the surface is INTRODUCED by this fix.
//
// A loud false rejection is the safe direction and is what this whole item
// family has been. A SILENT wrong answer is not. The question this probe
// settles: when the decoy section ALSO contains a plausible format literal,
// does the guard read the WRONG literal and go GREEN on a README whose real
// format claim is false?
//
// If P3 is GREEN, the fix has traded a loud false rejection for a silent
// hole, which is the wrong direction on this repo's own stated standard,
// and the item cannot be accepted as-is.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TARGET = '/opt/targets/aphorism-cli';

function copyRepo(l) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `c28p-${l}-`));
  execFileSync('rsync', ['-a', '--exclude', '.git', `${TARGET}/`, `${d}/`]);
  return d;
}
function runSuite(dir) {
  let out;
  try {
    out = execFileSync(process.execPath,
      ['--test', '--test-reporter=tap', 'test/readme-tags.test.js', 'test/cli.test.js',
       'test/args.test.js', 'test/select.test.js', 'test/corpus.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const t = /^# tests (\d+)$/m.exec(out), p = /^# pass (\d+)$/m.exec(out), f = /^# fail (\d+)$/m.exec(out);
  let reason = 'NONE';
  if (/must have a "### " heading|behaviour" section/.test(out)) reason = 'HEADING-PARSE';
  else if (/could not find a `<text>\.\.\.<author>` format literal/.test(out)) reason = 'LITERAL-PARSE';
  else if (/strictly equal|--list output/.test(out)) reason = 'SEPARATOR-MISMATCH';
  return { sig: t ? `${t[1]}/${p[1]}/${f[1]}` : 'UNPARSEABLE', reason };
}
function patch(d, fn) {
  const p = path.join(d, 'README.md');
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
}
function say(id, desc, r, verdict) {
  console.log(`\n[${id}] ${desc}\n   -> ${r.sig}  reason=${r.reason}\n   ${verdict}`);
}

const REAL = '### `--list` behaviour';

// P1: decoy heading with NO literal in its section (the B4 shape), reason captured.
{
  const d = copyRepo('p1');
  patch(d, (s) => s.replace(REAL,
    '### --list-only mode behaviour\n\nUnrelated prose about a mode that does not exist.\n\n' + REAL));
  say('P1', 'decoy heading, decoy section has NO format literal', runSuite(d),
    'LITERAL-PARSE => loud and named. HEADING-PARSE => also loud. Either is the safe direction.');
}

// P2: decoy section carries a literal that MATCHES the binary; real section untouched.
{
  const d = copyRepo('p2');
  patch(d, (s) => s.replace(REAL,
    '### --list-only mode behaviour\n\nPrints `<text> — <author>` per line.\n\n' + REAL));
  say('P2', 'decoy section carries a CORRECT literal', runSuite(d),
    'GREEN here is benign-looking but means the guard is reading the DECOY section.');
}

// P3: THE DECISIVE ONE. Decoy section carries a CORRECT literal; the REAL
// section's literal is mutated to something false. A guard reading the real
// section must FAIL. A guard reading the decoy will pass a WRONG README.
{
  const d = copyRepo('p3');
  patch(d, (s) => s
    .replace(REAL, '### --list-only mode behaviour\n\nPrints `<text> — <author>` per line.\n\n' + REAL)
    .replace('aphorism is printed in the form `<text> — <author>`',
             'aphorism is printed in the form `<text> | <author>`'));
  const r = runSuite(d);
  say('P3', 'decoy has the CORRECT literal, the REAL section literal is FALSE', r,
    r.sig === '73/73/0'
      ? '*** SILENT HOLE: a README whose real format claim is FALSE passes. ***'
      : 'guard still catches the false real-section claim -- no silent hole.');
}

// P4: same input as P3, but against HEAD's test file -- attribution.
{
  const d = copyRepo('p4');
  patch(d, (s) => s
    .replace(REAL, '### --list-only mode behaviour\n\nPrints `<text> — <author>` per line.\n\n' + REAL)
    .replace('aphorism is printed in the form `<text> — <author>`',
             'aphorism is printed in the form `<text> | <author>`'));
  fs.writeFileSync(path.join(d, 'test/readme-tags.test.js'),
    execFileSync('git', ['-C', TARGET, 'show', 'HEAD:test/readme-tags.test.js'], { encoding: 'utf8' }));
  say('P4', 'the SAME input against HEAD test file', runSuite(d),
    'establishes whether HEAD caught what the fix may miss');
}

// P5: how likely is the decoy shape? Does a heading need BOTH tokens?
{
  const d = copyRepo('p5');
  patch(d, (s) => s.replace(REAL, '### --list-only mode\n\nProse.\n\n' + REAL));
  say('P5', 'earlier heading with the --list token but WITHOUT "behaviour"', runSuite(d),
    'GREEN => both tokens are required, so the decoy shape is narrow.');
}
