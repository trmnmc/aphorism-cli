'use strict';
// cycle 39 conductor harness (scratch; not part of the suite).
// Re-measures the four residual cells that T-034/T-036/T-037/T-038 each recorded,
// against CURRENT HEAD, isolating the acknowledgement guard by name so that
// neighbouring count guards cannot supply or mask the verdict (the cycle-38
// confounder). Mutates README.md in place per cell and restores it from git
// after every cell, including on throw.

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const README = path.join(ROOT, 'README.md');
const TESTFILE = path.join(ROOT, 'test', 'readme-tags.test.js');
const ACK_NAME = 'README should acknowledge single-entry tag limitation';

const PRISTINE = fs.readFileSync(README, 'utf8');

// --- the pristine strings each cell edits -------------------------------------------
const DIST =
  'They are not evenly distributed: 16 tags appear on 2 or more entries; the remaining 21 appear on exactly one entry.';
const SINGLE =
  'Single-entry tags are real — they match real aphorisms in the corpus — but `--tag` on one of them returns the same line every time.';

function must(hay, needle, label) {
  if (!hay.includes(needle)) throw new Error('anchor missing for ' + label + ': ' + needle.slice(0, 60));
  return hay;
}

const CELLS = [
  {
    id: 'C0',
    item: '(baseline)',
    what: 'pristine README, untouched',
    expect: 'SILENT',
    mutate: (t) => t,
  },
  {
    id: 'D1',
    item: 'T-034',
    what: 'both acknowledgement sentences reworded outside the 9-phrase marker list; every number unchanged, limitation still plainly stated',
    expect: 'FIRES',
    mutate: (t) => {
      must(t, DIST, 'D1/dist');
      must(t, SINGLE, 'D1/single');
      return t
        .replace(
          DIST,
          'They are not evenly distributed: 16 tags appear on 2 or more entries; the remaining 21 are each backed by a lone aphorism.'
        )
        .replace(
          SINGLE,
          'Lone-aphorism tags are real — they match real aphorisms in the corpus — but `--tag` on one of them returns the same line every time.'
        );
    },
  },
  {
    id: 'D3',
    item: 'T-036',
    what: 'section heading renamed "## Tag vocabulary" -> "## Tags"; every claim in the document still true',
    expect: 'FIRES',
    mutate: (t) => must(t, '## Tag vocabulary', 'D3').replace('## Tag vocabulary', '## Tags'),
  },
  {
    id: 'D4a',
    item: 'T-037',
    what: 'genuine acknowledgement stripped; in-section decoy "Tags are listed in alphabetical order, one entry per line."',
    expect: 'SILENT',
    mutate: (t) => {
      must(t, DIST, 'D4a/dist');
      must(t, SINGLE, 'D4a/single');
      return t
        .replace(DIST, 'Tags are listed in alphabetical order, one entry per line.')
        .replace(SINGLE, 'The tag list is stable across releases.');
    },
  },
  {
    id: 'D4b',
    item: 'T-037',
    what: 'genuine acknowledgement stripped; in-section decoy "A tag name is a single-entry token with no spaces."',
    expect: 'SILENT',
    mutate: (t) => {
      must(t, DIST, 'D4b/dist');
      must(t, SINGLE, 'D4b/single');
      return t
        .replace(DIST, 'A tag name is a single-entry token with no spaces.')
        .replace(SINGLE, 'The tag list is stable across releases.');
    },
  },
  {
    id: 'E3',
    item: 'T-038',
    what: 'honest two-sentence split of the distribution facts, carrying the acknowledgement alone; every number unchanged',
    expect: 'FIRES',
    mutate: (t) => {
      must(t, DIST, 'E3/dist');
      must(t, SINGLE, 'E3/single');
      return t
        .replace(
          DIST,
          'They are not evenly distributed: 16 tags appear on 2 or more entries. The remaining 21 appear exactly once.'
        )
        .replace(SINGLE + '\n\n', '');
    },
  },
];

function restore() {
  execFileSync('git', ['-C', ROOT, 'checkout', '--', 'README.md']);
  const now = fs.readFileSync(README, 'utf8');
  if (now !== PRISTINE) throw new Error('RESTORE FAILED: README differs from the pristine bytes read at start');
}

// Run ONLY the acknowledgement test, by exact name, so neighbouring count
// guards cannot contribute to the verdict.
function ackVerdict() {
  const r = spawnSync(
    process.execPath,
    ['--test', '--test-name-pattern', ACK_NAME, TESTFILE],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = /^# pass (\d+)$/m.exec(out) || /^ℹ pass (\d+)$/m.exec(out);
  const fail = /^# fail (\d+)$/m.exec(out) || /^ℹ fail (\d+)$/m.exec(out);
  const named = out.includes(ACK_NAME);
  if (!pass || !fail) throw new Error('could not parse runner totals:\n' + out.slice(-800));
  return {
    pass: Number(pass[1]),
    fail: Number(fail[1]),
    named,
    verdict: Number(fail[1]) > 0 ? 'FIRES' : 'SILENT',
  };
}

const results = [];
try {
  for (const cell of CELLS) {
    fs.writeFileSync(README, cell.mutate(PRISTINE));
    const v = ackVerdict();
    restore();
    const ok = v.verdict === cell.expect;
    results.push({ ...cell, ...v, ok, mutate: undefined });
    console.log(
      [
        cell.id.padEnd(4),
        cell.item.padEnd(8),
        ('ack=' + v.verdict).padEnd(12),
        ('pass=' + v.pass + ' fail=' + v.fail).padEnd(16),
        ok ? 'AS RECORDED' : '*** DIVERGES from the recorded verdict (' + cell.expect + ') ***',
      ].join(' ')
    );
  }
} finally {
  restore();
}

const diverged = results.filter((r) => !r.ok);
console.log('');
console.log('cells run: ' + results.length + ' | as recorded: ' + (results.length - diverged.length) + ' | diverged: ' + diverged.length);
console.log('README restored byte-identical to the pristine read: yes');
process.exit(diverged.length === 0 ? 0 : 1);
