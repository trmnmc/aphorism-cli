// Cycle 29 -- T-025 pre-dispatch baseline + decisive discriminator.
//
// Question the item asks: is a band heading separated from its table by an
// ordinary sentence a HOLE (harden it) or a BOUNDARY (document it)?
//
// The item's own note argues BOUNDARY on the ground that the fix -- scanning
// PAST non-blank content looking for a table -- reintroduces the
// mis-attachment hazard cycle 27's gate check A11 confirmed the conservative
// scan does not have. That hazard was ARGUED, never MEASURED. Cycle 28 proved
// (T-021) that an argued-safe fix can still be rejected only by probing, and
// that the dangerous direction is a WRONG README going green.
//
// So this harness runs a matrix: {README variant} x {scan variant}. It is
// hunting for a SILENT-HOLE cell -- a README that is genuinely WRONG, which
// the conservative scan catches (RED) and a widened scan misses (GREEN).
// Finding one confirms BOUNDARY by measurement. Finding none is evidence
// toward HOLE and must be reported as such rather than argued away.
//
// Controls (cycle 19 precedent): PRISTINE+conservative must land 73/73/0 or
// the harness is broken and NO verdict may be read from any cell. An
// unparseable run reports UNPARSEABLE explicitly and never falls through
// into a verdict.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
const README = 'README.md';

const origTest = fs.readFileSync(path.join(REPO, TESTFILE), 'utf8');
const origReadme = fs.readFileSync(path.join(REPO, README), 'utf8');

// ---------------------------------------------------------------------------
// Scan variants -- patch the blank-line-skip loop in extractBandTablesFromReadme
// ---------------------------------------------------------------------------
const CONSERVATIVE_SRC = `    let headerIdx = i + 1;
    while (headerIdx < lines.length && lines[headerIdx].trim() === '') {
      headerIdx++;
    }`;

// W1 maximal: skip ANY content until the next `| Tag | Count |` header row.
const W1_SRC = `    let headerIdx = i + 1;
    while (headerIdx < lines.length && !/^\\|\\s*Tag\\s*\\|\\s*Count\\s*\\|\\s*$/.test(lines[headerIdx].trim())) {
      headerIdx++;
    }`;

// W2 moderate: skip blanks and ordinary prose, but STOP at another line that
// carries a band token (i.e. the next band heading) so a heading cannot reach
// past a sibling heading to steal its table. This is what a careful
// implementer would write, so it is the fairer test of the item's premise.
const W2_SRC = `    let headerIdx = i + 1;
    while (headerIdx < lines.length) {
      const cand = lines[headerIdx];
      if (/^\\|\\s*Tag\\s*\\|\\s*Count\\s*\\|\\s*$/.test(cand.trim())) break;
      if (headerIdx !== i + 1 && (/(\\d+)\\s*\\+/.test(cand) || /(\\d+)\\s*[-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015]\\s*(\\d+)/.test(cand))) break;
      headerIdx++;
    }`;

if (!origTest.includes(CONSERVATIVE_SRC)) {
  console.error('FATAL: conservative scan source not found verbatim -- harness cannot patch. No verdict.');
  process.exit(9);
}

const SCANS = {
  conservative: origTest,
  widened_W1: origTest.replace(CONSERVATIVE_SRC, W1_SRC),
  widened_W2: origTest.replace(CONSERVATIVE_SRC, W2_SRC),
};

// ---------------------------------------------------------------------------
// README variants
// ---------------------------------------------------------------------------
const H5 = '4 tags have a robust pool (5+ entries):';
const T5 = `| Tag | Count |
|---|---|
| \`design\` | 13 |
| \`simplicity\` | 10 |
| \`humor\` | 9 |
| \`debugging\` | 5 |`;
const H24 = '12 tags appear 2–4 times:';

function mustReplace(text, from, to, label) {
  if (!text.includes(from)) throw new Error('variant ' + label + ': anchor not found');
  return text.replace(from, to);
}

const VARIANTS = {};

// R0 -- pristine. Correct README.
VARIANTS.R0_pristine = { wrong: false, readme: origReadme };

// R1 -- the T-025 layout, every number still TRUE. Heading, blank, an
// ordinary sentence, blank, then the real table. This is the honest edit the
// item wants to stop being falsely rejected.
VARIANTS.R1_t025_layout_correct = {
  wrong: false,
  readme: mustReplace(origReadme, H5 + '\n' + T5,
    H5 + '\n\nSee the table below.\n\n' + T5, 'R1'),
};

// R2 -- the T-025 layout WITH a real defect: the `debugging` row deleted.
// Must stay RED under any scan, or the fix has disarmed the guard.
VARIANTS.R2_t025_layout_row_deleted = {
  wrong: true,
  readme: mustReplace(origReadme, H5 + '\n' + T5,
    H5 + '\n\nSee the table below.\n\n' + T5.replace('\n| `debugging` | 5 |', ''), 'R2'),
};

// R3 -- DECOY THEFT. A wrong README: the 5+ table's rows are deleted
// wholesale (its heading and an intervening sentence remain), so the section
// silently stops claiming design/simplicity/humor/debugging. A widened scan
// lets the orphaned 5+ heading reach forward and adopt the 2-4 table.
VARIANTS.R3_decoy_theft = {
  wrong: true,
  readme: mustReplace(origReadme, H5 + '\n' + T5,
    H5 + '\n\nSee the table below.\n', 'R3'),
};

// R4 -- decoy PROSE line carrying a band token above the real 2-4 table,
// with that band's own table absent. Under a widened scan the decoy can
// steal the 2-4 table; the stolen rows satisfy the decoy's own [2,4] bounds,
// which is the shape most likely to pass silently.
VARIANTS.R4_decoy_band_token_prose = {
  wrong: true,
  readme: mustReplace(origReadme, H24 + '\n',
    'Historically 2–4 times was the middle band.\n\nSee below.\n\n' + H24 + '\n', 'R4'),
};

// R5 -- 5+ heading orphaned by prose AND the 2-4 heading deleted (its table
// left in place). A widened scan lets the 5+ heading adopt the 2-4 table.
VARIANTS.R5_orphan_adopts_sibling_table = {
  wrong: true,
  readme: mustReplace(
    mustReplace(origReadme, H5 + '\n' + T5, H5 + '\n\nSee the table below.\n', 'R5a'),
    H24 + '\n', '', 'R5b'),
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function runCell(readmeText, testText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c29-t025-'));
  try {
    execFileSync('cp', ['-a', REPO + '/.', dir], { stdio: 'ignore' });
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
    fs.writeFileSync(path.join(dir, README), readmeText);
    fs.writeFileSync(path.join(dir, TESTFILE), testText);

    let out = '';
    try {
      out = execFileSync('bash', ['-c',
        'cd ' + JSON.stringify(dir) + ' && node --test --test-reporter=tap test/*.test.js 2>&1'],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
    }

    const m = (re) => { const x = out.match(re); return x ? parseInt(x[1], 10) : null; };
    const tests = m(/^# tests (\d+)/m);
    const pass = m(/^# pass (\d+)/m);
    const fail = m(/^# fail (\d+)/m);
    if (tests === null || pass === null || fail === null) {
      return { parsed: false, tests, pass, fail, failing: [], raw: out.slice(-800) };
    }
    const failing = [];
    for (const line of out.split('\n')) {
      const nm = line.match(/^not ok \d+ - (.*)$/);
      if (nm) failing.push(nm[1].trim());
    }
    return { parsed: true, tests, pass, fail, failing };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const results = {};
for (const vName of Object.keys(VARIANTS)) {
  for (const sName of Object.keys(SCANS)) {
    const key = vName + ' | ' + sName;
    const r = runCell(VARIANTS[vName].readme, SCANS[sName]);
    results[key] = r;
    const sig = r.parsed ? (r.tests + '/' + r.pass + '/' + r.fail) : 'UNPARSEABLE';
    const col = r.parsed ? (r.fail === 0 ? 'GREEN' : 'RED  ') : 'BROKEN';
    console.log(col + '  ' + sig.padEnd(12) + '  ' + key);
    if (r.parsed && r.failing.length) {
      for (const f of r.failing.slice(0, 3)) console.log('          -> ' + f.slice(0, 105));
    }
    if (!r.parsed) console.log('          RAW TAIL: ' + (r.raw || '').replace(/\n/g, ' | ').slice(0, 300));
  }
}

// ---------------------------------------------------------------------------
// Controls + verdict
// ---------------------------------------------------------------------------
console.log('\n=== CONTROLS ===');
const ctrl = results['R0_pristine | conservative'];
const ctrlOk = ctrl.parsed && ctrl.tests === 73 && ctrl.fail === 0;
console.log((ctrlOk ? 'PASS' : 'FAIL') + '  PRISTINE control: expect 73/73/0, got ' +
  (ctrl.parsed ? ctrl.tests + '/' + ctrl.pass + '/' + ctrl.fail : 'UNPARSEABLE'));

const anyUnparseable = Object.values(results).some(r => !r.parsed);
console.log((anyUnparseable ? 'FAIL' : 'PASS') + '  every cell parsed');

if (!ctrlOk || anyUnparseable) {
  console.log('\nHARNESS BROKEN -- no verdict may be read from any cell above.');
  process.exit(2);
}

console.log('\n=== DISCRIMINATOR: silent-hole hunt ===');
console.log('A silent hole = README is WRONG, conservative RED, widened GREEN.');
let silent = 0;
for (const vName of Object.keys(VARIANTS)) {
  if (!VARIANTS[vName].wrong) continue;
  const c = results[vName + ' | conservative'];
  for (const w of ['widened_W1', 'widened_W2']) {
    const r = results[vName + ' | ' + w];
    if (c.fail > 0 && r.fail === 0) {
      console.log('SILENT HOLE  ' + vName + ' under ' + w +
        ' (conservative ' + c.tests + '/' + c.pass + '/' + c.fail + ' RED -> widened GREEN)');
      silent++;
    }
  }
}
if (silent === 0) console.log('none found across the wrong-README variants tested');

console.log('\n=== FALSE REJECTION the item wants removed ===');
const r1c = results['R1_t025_layout_correct | conservative'];
const r1w1 = results['R1_t025_layout_correct | widened_W1'];
const r1w2 = results['R1_t025_layout_correct | widened_W2'];
console.log('R1 correct README: conservative ' + (r1c.fail > 0 ? 'RED (false rejection reproduced)' : 'GREEN (NOT reproduced!)') +
  ', W1 ' + (r1w1.fail === 0 ? 'GREEN' : 'RED') + ', W2 ' + (r1w2.fail === 0 ? 'GREEN' : 'RED'));

console.log('\n=== LOUDNESS retained on a real defect under the T-025 layout ===');
const r2 = ['conservative', 'widened_W1', 'widened_W2']
  .map(s => s + '=' + (results['R2_t025_layout_row_deleted | ' + s].fail > 0 ? 'RED' : 'GREEN(!)')).join('  ');
console.log('R2 row-deleted: ' + r2);
