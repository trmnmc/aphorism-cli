// GATE for J-2b — authored at cycle 3, BEFORE dispatch, outside the target tree (KI-8 remedy 1).
// The builder never sees this file. Hard rule 2.
//
// Instrument (standing since cycle 50 of run #1): copy the whole repo to a throwaway dir,
// mutate ONE thing, run the project's own test_cmd, record the verdict. A cell declares the
// verdict it EXPECTS; the gate scores expected-vs-actual.
//
// The two failure shapes J-2a measured, which this gate exists to catch in the band code:
//   SHAPE A — a surface EXCLUDED from the scan hides a false claim (fenced blocks, a second
//             table, an unread row label).
//   SHAPE B — a FIRST-MATCH choice lets document ORDER decide the verdict.
//
// Usage: node c066-gate-J-2b.mjs [--repo /opt/targets/aphorism-cli]

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const args = process.argv.slice(2);
const repo = (() => {
  const i = args.indexOf('--repo');
  return i >= 0 ? args[i + 1] : '/opt/targets/aphorism-cli';
})();

const README = 'README.md';

// ---- helpers the cells use to mutate the README ---------------------------
const rd = (s, needle) => {
  if (!s.includes(needle)) throw new Error('MUTATION PRECONDITION FAILED, needle absent: ' + needle);
  return s;
};
const replaceOnce = (needle, repl) => (s) => rd(s, needle).replace(needle, repl);

// The two band lead-ins as they stand today. If a builder restructures them into real
// markdown headings, the needle-absent throw is a LOUD signal, not a silent skip — the
// cell reports MUTATION-UNAPPLICABLE and the conductor re-authors it against the new shape.
const BAND1 = '7 tags have a robust pool (5+ entries):';
const BAND2 = '5 tags appear 3–4 times:';

const cells = [
  // ---- P0: sound control -------------------------------------------------
  {
    id: 'P0',
    expect: 'GREEN',
    why: 'Pristine repo. If this is not green the whole gate is meaningless.',
    mutate: (s) => s
  },

  // ---- FALSE REJECTIONS THAT MUST NOW BE CLOSED (the point of J-2b) ------
  {
    id: 'F1',
    expect: 'GREEN',
    why: 'T-024b measured false rejection. A band lead-in carrying a SECOND, TRUE "N tags" ' +
         'phrase before its own count. Every number stated is true (12 distinct tags, 7 in ' +
         'this band). Today a first-match scan reads 12 as the band count and the suite goes ' +
         'RED on a correct README. After a structural fix this must be GREEN.',
    mutate: replaceOnce(BAND1, 'Of 12 tags, 7 tags have a robust pool (5+ entries):')
  },
  {
    id: 'F2',
    expect: 'GREEN',
    why: 'T-039 measured relocation. An ordinary prose sentence carrying a coincidental ' +
         'band-shaped token ("Node 18+") sits between a band heading and its table. Nothing ' +
         'stated is false. Today lineHasBandToken treats it as another band heading, the real ' +
         'band vanishes and a phantom [18,inf) band owns its rows. Must be GREEN.',
    mutate: replaceOnce(BAND1 + '\n', BAND1 + '\nRequires Node 18+ to run.\n')
  },

  // ---- TRUE DEFECTS THAT MUST STAY CAUGHT (no coverage may be dropped) ---
  {
    id: 'T1',
    expect: 'RED',
    why: 'A band table row is DELETED. The corpus still places `performance` in the 5+ band. ' +
         'Pre-existing coverage (A7); a structural rewrite must not drop it.',
    mutate: replaceOnce('| `performance` | 5 |\n', '')
  },
  {
    id: 'T2',
    expect: 'RED',
    why: 'BAND RELOCATION: a tag row moved into a band its corpus count does not fit ' +
         '(`philosophy`, corpus count 3, moved into the 5+ table). Pre-existing coverage (A8).',
    mutate: (s) => rd(s, '| `philosophy` | 3 |\n').replace('| `philosophy` | 3 |\n', '')
                    .replace('| `performance` | 5 |', '| `performance` | 5 |\n| `philosophy` | 3 |')
  },
  {
    id: 'T3',
    expect: 'RED',
    why: 'A WHOLE band table deleted, heading and rows (T-019 coverage).',
    mutate: (s) => {
      const start = s.indexOf(BAND2);
      if (start < 0) throw new Error('MUTATION PRECONDITION FAILED, needle absent: ' + BAND2);
      const end = s.indexOf('\n\nThe smallest pool', start);
      if (end < 0) throw new Error('MUTATION PRECONDITION FAILED: band2 terminator absent');
      return s.slice(0, start) + s.slice(end + 2);
    }
  },
  {
    id: 'T4',
    expect: 'RED',
    why: 'THE CORE CLAIM OF T-024b. A band heading states a count that is FLATLY WRONG ' +
         '(7 -> 9) while its table rows are untouched. If a fix deletes the prose count from ' +
         'the document entirely this cell becomes MUTATION-UNAPPLICABLE, which is an ' +
         'acceptable J-2a-style outcome (the claim was removed, not silenced) and is scored ' +
         'separately — but a heading that still STATES a count and accepts a wrong one is a ' +
         'silent hole and fails the gate.',
    mutate: replaceOnce(BAND1, '9 tags have a robust pool (5+ entries):'),
    unapplicable_ok: true
  },
  {
    id: 'T5',
    expect: 'RED',
    why: 'The section opening sentence states a wrong multi-entry count (12 -> 11). Adjacent ' +
         'prose guard; must not be collaterally deleted by a band-focused rewrite.',
    mutate: replaceOnce('12 tags appear on 2 or more entries', '11 tags appear on 2 or more entries')
  },

  // ---- SHAPE A: excluded surfaces --------------------------------------
  {
    id: 'A1',
    expect: 'GREEN',
    why: 'FALSE REJECTION, third of the family, FOUND BY THIS GATE at cycle 3 before dispatch ' +
         'and not previously on the board. A fenced code block inside the Tag vocabulary ' +
         'section carries a commented-out example table. Nothing stated outside the fence is ' +
         'false. Measured attribution: the test that fires is "README tag counts must match ' +
         'corpus" — the tag-NAME census, not a band guard — so the defect is that the census ' +
         'reads fenced blocks as document content. A fence is an example, not a claim.',
    mutate: replaceOnce(
      '```sh\n',
      '```sh\n# 3 tags have a tiny pool (1+ entries):\n# | Tag | Count |\n# |---|---|\n# | `nope` | 1 |\n'
    )
  },
  // A2 (first draft) was WITHDRAWN as mis-attributed. It went RED, but the only test that
  // fired was the tag-NAME census reacting to a tag name (`nope`) my mutation invented —
  // every band guard passed. Scoring it OK would have recorded a false clearance. A2b/A2c
  // remove the side effect and measure the real question. Evidence: c066-probe-A2.mjs,
  // runs/a2probe-CZj4eP — both 92/0 GREEN today.
  {
    id: 'A2b',
    expect: 'RED',
    why: 'SHAPE A, the hole direction, MEASURED OPEN at cycle 3. A SECOND band table stating ' +
         'a FALSE band membership (`design`, corpus count 14, parked under a "2 times" band). ' +
         'Tag names and counts are all ones the README already carries, so no census reacts. ' +
         'GREEN today: lineHasBandToken only recognises a heading carrying an N+ or N-M token, ' +
         'so a band table under any other heading shape is never read and may claim anything. ' +
         'This is the band-side twin of the defect J-2a closed on the Attribution side.',
    mutate: replaceOnce(
      '\nThe smallest pool holds three aphorisms',
      '\n2 tags appear exactly 2 times:\n| Tag | Count |\n|---|---|\n| `design` | 14 |\n| `humor` | 9 |\n\nThe smallest pool holds three aphorisms'
    )
  },
  {
    id: 'A2c',
    expect: 'RED',
    why: 'Discriminator for A2b: the SAME unread table placed FIRST, ahead of the real ones. ' +
         'Both GREEN today, which proves A2b is an UNREAD-SURFACE hole and NOT a document- ' +
         'order artifact. Kept in the gate so a fix that only reorders the scan cannot pass.',
    mutate: replaceOnce(
      '\n' + BAND1,
      '\n2 tags appear exactly 2 times:\n| Tag | Count |\n|---|---|\n| `design` | 14 |\n| `humor` | 9 |\n\n' + BAND1
    )
  },

  // ---- SHAPE B: document order decides ---------------------------------
  {
    id: 'B1',
    expect: 'RED',
    why: 'SHAPE B. The 5+ band heading is DUPLICATED, the first copy keeping the correct ' +
         'table and the second carrying a wrong one (a row for `language`, corpus count 4, ' +
         'under a 5+ heading). If a Map keyed on the band, or a findIndex taking the first ' +
         'match, decides the verdict, document order silently hides the second table.',
    mutate: replaceOnce(
      '\n5 tags appear 3–4 times:',
      '\n' + BAND1 + '\n| Tag | Count |\n|---|---|\n| `language` | 4 |\n\n5 tags appear 3–4 times:'
    )
  }
];

// ---- runner ---------------------------------------------------------------
// Scratch root lives under SWARM/runs, NOT /tmp: this session can only read inside its
// allowed dirs, and a gate whose transcripts I cannot read is not evidence.
const tmpRoot = fs.mkdtempSync(path.join('/opt/swarm/runs', 'j2b-gate-'));
const results = [];

for (const cell of cells) {
  const dir = path.join(tmpRoot, cell.id);
  execSync(`cp -a ${JSON.stringify(repo)} ${JSON.stringify(dir)}`);
  const rp = path.join(dir, README);
  let applied = true, note = '';
  try {
    const before = fs.readFileSync(rp, 'utf8');
    const after = cell.mutate(before);
    if (cell.id !== 'P0' && after === before) throw new Error('MUTATION WAS A NO-OP');
    fs.writeFileSync(rp, after);
  } catch (e) {
    applied = false;
    note = String(e.message);
  }

  let verdict = 'UNAPPLICABLE', pass = 0, fail = 0;
  if (applied) {
    // The project's own test_cmd, verbatim, through a shell so the glob expands.
    const r = spawnSync('node --test test/*.test.js', {
      cwd: dir, encoding: 'utf8', timeout: 300000, shell: true
    });
    const out = (r.stdout || '') + (r.stderr || '');
    pass = Number((out.match(/^ℹ pass (\d+)/m) || out.match(/^# pass (\d+)/m) || [0, -1])[1]);
    fail = Number((out.match(/^ℹ fail (\d+)/m) || out.match(/^# fail (\d+)/m) || [0, -1])[1]);
    verdict = (r.status === 0 && fail === 0) ? 'GREEN' : 'RED';
    fs.writeFileSync(path.join(tmpRoot, cell.id + '.out'), out);
  }

  const scored = verdict === cell.expect
    ? 'OK'
    : (verdict === 'UNAPPLICABLE' && cell.unapplicable_ok ? 'UNAPPLICABLE-OK' : 'GATE-FAIL');
  results.push({ id: cell.id, expect: cell.expect, verdict, pass, fail, scored, note, why: cell.why });
  console.log(
    `${cell.id.padEnd(3)} expect=${cell.expect.padEnd(6)} actual=${verdict.padEnd(13)} ` +
    `${String(pass)}/${String(fail)}  ${scored}${note ? '  :: ' + note : ''}`
  );
}

const bad = results.filter(r => r.scored === 'GATE-FAIL');
console.log('\n--- SCORE ---');
console.log(`${results.length - bad.length}/${results.length} cells as expected`);
for (const r of bad) console.log(`  GATE-FAIL ${r.id}: expected ${r.expect}, got ${r.verdict} — ${r.why}`);
console.log('transcripts: ' + tmpRoot);
fs.writeFileSync(path.join(tmpRoot, 'results.json'), JSON.stringify(results, null, 2));
process.exit(bad.length ? 1 : 0);
