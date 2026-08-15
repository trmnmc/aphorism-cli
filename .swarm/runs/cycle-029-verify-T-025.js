// Cycle 29 -- conductor verification gate for T-025.
//
// Authored AFTER the builder returned and WITHOUT reference to its report's
// suggested checks. The builder never saw these commands.
//
// Controls first (cycle 19): a PRISTINE run must land the claimed 74/74 and
// every cell must parse, or NO verdict is read from any check.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
const README = 'README.md';

const newTest = fs.readFileSync(path.join(REPO, TESTFILE), 'utf8');
const readme = fs.readFileSync(path.join(REPO, README), 'utf8');
const headTest = execFileSync('git', ['-C', REPO, 'show', 'HEAD:' + TESTFILE], { encoding: 'utf8' });
const headReadme = execFileSync('git', ['-C', REPO, 'show', 'HEAD:' + README], { encoding: 'utf8' });

const results = [];
function check(id, desc, ok, detail) {
  results.push({ id, ok, desc, detail });
  console.log((ok ? 'PASS  ' : 'FAIL  ') + id.padEnd(16) + desc);
  if (detail) console.log('        ' + String(detail).replace(/\n/g, '\n        '));
}

// ---------------------------------------------------------------------------
// Scan-variant surgery for attribution
// ---------------------------------------------------------------------------
const NEW_SCAN = `    let headerIdx = -1;
    for (let idx = i + 1; idx < lines.length; idx++) {
      const trimmed = lines[idx].trim();
      if (trimmed === '') continue;
      if (headerRowPattern.test(trimmed)) {
        headerIdx = idx;
        break;
      }
      if (lineHasBandToken(lines[idx])) {
        break; // looks like another band heading -- stop, no table for this one
      }
      // else: ordinary prose line, keep scanning forward
    }
    if (headerIdx === -1) {
      continue;
    }`;

const OLD_SCAN = `    let headerIdx = i + 1;
    while (headerIdx < lines.length && lines[headerIdx].trim() === '') {
      headerIdx++;
    }`;

const canRevert = newTest.includes(NEW_SCAN);
const revertedTest = canRevert ? newTest.replace(NEW_SCAN, OLD_SCAN) : null;

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

function rep(text, from, to) {
  if (!text.includes(from)) throw new Error('anchor missing');
  return text.replace(from, to);
}

const V = {};
V.R0_pristine = { wrong: false, readme };
V.R1_t025_correct = { wrong: false, readme: rep(readme, H5 + '\n' + T5, H5 + '\n\nSee the table below.\n\n' + T5) };
V.R2_t025_row_deleted = { wrong: true, readme: rep(readme, H5 + '\n' + T5, H5 + '\n\nSee the table below.\n\n' + T5.replace('\n| `debugging` | 5 |', '')) };
V.R3_table_removed = { wrong: true, readme: rep(readme, H5 + '\n' + T5, H5 + '\n\nSee the table below.\n') };
V.R4_decoy_token_correct = { wrong: false, readme: rep(readme, H24 + '\n', 'Historically 2–4 times was the middle band.\n\nSee below.\n\n' + H24 + '\n') };
V.R5_orphan_adopts = { wrong: true, readme: rep(rep(readme, H5 + '\n' + T5, H5 + '\n\nSee the table below.\n'), H24 + '\n', '') };
// R6 -- the builder's OWN volunteered weakness: ordinary prose carrying a
// coincidental band-shaped token ("Node 18+") between a heading and its table.
// Every number in this README is still TRUE, so it is a CORRECT README.
V.R6_coincidental_token = { wrong: false, readme: rep(readme, H5 + '\n' + T5, H5 + '\n\nRequires Node 18+ to run.\n\n' + T5) };

function run(readmeText, testText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c29-gate-'));
  try {
    execFileSync('cp', ['-a', REPO + '/.', dir], { stdio: 'ignore' });
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
    fs.writeFileSync(path.join(dir, README), readmeText);
    fs.writeFileSync(path.join(dir, TESTFILE), testText);
    let out = '';
    try {
      out = execFileSync('bash', ['-c', 'cd ' + JSON.stringify(dir) +
        ' && node --test --test-reporter=tap test/*.test.js 2>&1'],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
    const m = re => { const x = out.match(re); return x ? parseInt(x[1], 10) : null; };
    const tests = m(/^# tests (\d+)/m), pass = m(/^# pass (\d+)/m), fail = m(/^# fail (\d+)/m);
    const failing = [];
    for (const l of out.split('\n')) { const n = l.match(/^not ok \d+ - (.*)$/); if (n) failing.push(n[1].trim()); }
    return { parsed: tests !== null && pass !== null && fail !== null, tests, pass, fail, failing };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const sig = r => r.parsed ? r.tests + '/' + r.pass + '/' + r.fail : 'UNPARSEABLE';

console.log('=== CONTROLS ===');
const c0 = run(readme, newTest);
check('C1.PRISTINE', 'real tree must be 74/74/0 as claimed', c0.parsed && c0.tests === 74 && c0.fail === 0, sig(c0));
check('C2.REVERTIBLE', 'new scan block found verbatim (attribution is possible)', canRevert);

console.log('\n=== SCOPE ===');
check('S1.README', 'README.md byte-identical to HEAD (item forbids touching it)', readme === headReadme);
const changed = execFileSync('git', ['-C', REPO, 'diff', '--name-only'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
check('S2.FILES', 'only test/readme-tags.test.js modified', changed.length === 1 && changed[0] === TESTFILE, changed.join(', '));
check('S3.SCRATCH', '.swarm/scratch removed entirely (KI-7)', !fs.existsSync(path.join(REPO, '.swarm/scratch')));
const headCount = (headTest.match(/^test\(/gm) || []).length;
const newCount = (newTest.match(/^test\(/gm) || []).length;
check('S4.ONETEST', 'exactly one test added', newCount === headCount + 1, headCount + ' -> ' + newCount);

console.log('\n=== ACCEPTANCE: the false rejection is gone ===');
const r1 = run(V.R1_t025_correct.readme, newTest);
check('A1.FIXED', 'T-025 layout (correct README) is GREEN', r1.parsed && r1.fail === 0, sig(r1));
const r1head = run(V.R1_t025_correct.readme, headTest);
check('A1b.WAS_BROKEN', 'same README is RED at HEAD (the defect was real)', r1head.parsed && r1head.fail > 0, sig(r1head) + '  ' + r1head.failing.join(' | '));

console.log('\n=== ACCEPTANCE: still LOUD on a real defect ===');
const r2 = run(V.R2_t025_row_deleted.readme, newTest);
check('A2.LOUD', 'row deleted under the T-025 layout is RED', r2.parsed && r2.fail > 0, sig(r2) + '  ' + r2.failing.join(' | '));

console.log('\n=== DISCRIMINATOR: silent-hole hunt against the SHIPPED code ===');
let silent = 0;
for (const k of Object.keys(V)) {
  if (!V[k].wrong) continue;
  const rn = run(V[k].readme, newTest);
  const rh = run(V[k].readme, headTest);
  const bad = rh.fail > 0 && rn.fail === 0;
  if (bad) silent++;
  check('D.' + k, 'wrong README stays caught (HEAD ' + sig(rh) + ' -> new ' + sig(rn) + ')', !bad);
}
check('D0.NO_SILENT', 'no wrong README was traded from RED to GREEN', silent === 0);

console.log('\n=== DISCRIMINATOR: no NEW false rejection on a CORRECT README ===');
for (const k of ['R0_pristine', 'R4_decoy_token_correct']) {
  const rn = run(V[k].readme, newTest);
  const rh = run(V[k].readme, headTest);
  check('F.' + k, 'correct README green at HEAD must stay green (HEAD ' + sig(rh) + ' -> new ' + sig(rn) + ')',
    !(rh.fail === 0 && rn.fail > 0));
}

console.log('\n=== BUILDER-VOLUNTEERED WEAKNESS (R6): direction of harm ===');
const r6n = run(V.R6_coincidental_token.readme, newTest);
const r6h = run(V.R6_coincidental_token.readme, headTest);
console.log('        R6 "Requires Node 18+ to run." between heading and table');
console.log('        HEAD ' + sig(r6h) + '   NEW ' + sig(r6n));
if (r6n.failing.length) console.log('        NEW fails: ' + r6n.failing.join(' | '));
check('W1.NOT_SILENT', 'R6 must NOT be a silent pass on a mis-parsed README (loud is acceptable, silent is not)',
  r6n.parsed && (r6n.fail > 0 || r6h.fail === 0));

console.log('\n=== ATTRIBUTION (L-029): the new test must earn its place ===');
if (canRevert) {
  const attr = run(readme, revertedTest);
  const named = attr.failing.some(f => /T-025/.test(f));
  check('T1.FAILABLE', 'new test FAILS against the old conservative scan', attr.parsed && attr.fail > 0, sig(attr));
  check('T2.BY_NAME', 'and the failure is attributable to the T-025 test by name', named, attr.failing.join(' | '));
  check('T3.ONLY', 'no OTHER test fails under the revert (the kill is isolated)', attr.fail === 1, sig(attr));
  const den = run(readme, headTest);
  check('T4.DENOMINATOR', 'without the new test, the old scan is GREEN (defect survives)', den.parsed && den.fail === 0, sig(den));
} else {
  check('T1.FAILABLE', 'ATTRIBUTION NOT RUN -- scan block not found verbatim', false, 'reported as not-run, never as passed');
}

console.log('\n=== SUMMARY ===');
const failed = results.filter(r => !r.ok);
console.log(results.length - failed.length + '/' + results.length + ' checks passed');
if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log('  ' + f.id + '  ' + f.desc)); }
