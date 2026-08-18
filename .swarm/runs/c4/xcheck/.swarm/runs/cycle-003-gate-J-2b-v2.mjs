// GATE v2 for J-2b — re-authored at cycle 3 AFTER the builder returned, because the
// structural fix changed the document and made six v1 cells unapplicable by design.
//
// v1 (c066-gate-J-2b.mjs) stays on disk as the PRE-DISPATCH record: it is what I committed
// to before a builder existed, and it is what measured the A2b hole. v2 asks the SAME
// behavioural questions against the new shape. It does not soften one of them.
//
// What changed in the document: the two band lead-ins became real markdown headings
// (`#### Robust pool (5+ entries)`) and the prose "N tags" count was DELETED — the row
// count is now derived from the table's own rows. That is the J-2a precedent (change the
// document, delete the claim) and it is the right move. It also creates the J-2a follow-up
// obligation: deleting a claim is only safe if something stops the claim reappearing UNREAD.
// Cells N1/N2/N3 are that question.

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const args = process.argv.slice(2);
const repo = (() => { const i = args.indexOf('--repo'); return i >= 0 ? args[i + 1] : '/opt/targets/aphorism-cli'; })();

const rd = (s, needle) => {
  if (!s.includes(needle)) throw new Error('MUTATION PRECONDITION FAILED, needle absent: ' + needle);
  return s;
};
const replaceOnce = (needle, repl) => (s) => rd(s, needle).replace(needle, repl);

const H1 = '#### Robust pool (5+ entries)';
const H2 = '#### Appears 3–4 times';

const cells = [
  { id: 'P0', expect: 'GREEN', why: 'Pristine merged tree. Sound control; without it no cell means anything.', mutate: (s) => s },

  // ---- the three false rejections v1 measured OPEN. All must now be GREEN. ----
  {
    id: 'F1', expect: 'GREEN',
    why: 'v1/F1, re-aimed. A decoy "N tags" phrase — every number in it TRUE — sits in the ' +
         'band heading line itself. Under the old first-match count scan this was RED on a ' +
         'correct README (T-024b). With the count no longer parsed from prose it must be GREEN.',
    mutate: replaceOnce(H1, '#### Of 12 tags, 7 tags have a robust pool (5+ entries)')
  },
  {
    id: 'F2', expect: 'GREEN',
    why: 'v1/F2, unchanged in intent (T-039). An ordinary prose sentence carrying a ' +
         'coincidental band-shaped token between a heading and its table. Nothing false. ' +
         'Old code made it a phantom band that stole the real band\'s rows.',
    mutate: replaceOnce(H1 + '\n', H1 + '\nRequires Node 18+ to run.\n')
  },
  {
    id: 'A1', expect: 'GREEN',
    why: 'v1/A1 (found by the gate pre-dispatch, not previously on the board). A fenced ' +
         'example block inside the section carrying a heading-shaped line and a table. ' +
         'A fence is an example, not a claim, and must not false-reject a correct README.',
    mutate: replaceOnce('```sh\n', '```sh\n#### Tiny pool (1+ entries)\n| Tag | Count |\n|---|---|\n| `design` | 1 |\n')
  },

  // ---- true defects that must STILL be caught: no coverage may be dropped ----
  {
    id: 'T1', expect: 'RED',
    why: 'Band table row DELETED; the corpus still puts `performance` in the 5+ band (A7).',
    mutate: replaceOnce('| `performance` | 5 |\n', '')
  },
  {
    id: 'T2', expect: 'RED',
    why: 'BAND RELOCATION: `philosophy` (corpus count 3) moved into the 5+ table (A8).',
    mutate: (s) => rd(s, '| `philosophy` | 3 |\n').replace('| `philosophy` | 3 |\n', '')
                    .replace('| `performance` | 5 |', '| `performance` | 5 |\n| `philosophy` | 3 |')
  },
  {
    id: 'T3', expect: 'RED',
    why: 'A WHOLE band table deleted, heading and rows (T-019).',
    mutate: (s) => {
      const start = s.indexOf(H2);
      if (start < 0) throw new Error('MUTATION PRECONDITION FAILED, needle absent: ' + H2);
      const end = s.indexOf('\n\nThe smallest pool', start);
      if (end < 0) throw new Error('MUTATION PRECONDITION FAILED: band2 terminator absent');
      return s.slice(0, start) + s.slice(end + 2);
    }
  },
  {
    id: 'T5', expect: 'RED',
    why: 'The section opening sentence states a wrong multi-entry count (12 -> 11). Adjacent ' +
         'prose guard; a band-focused rewrite must not collaterally weaken it.',
    mutate: replaceOnce('12 tags appear on 2 or more entries', '11 tags appear on 2 or more entries')
  },
  {
    id: 'T6', expect: 'RED',
    why: 'A band table row whose COUNT is edited while the tag stays put (`design` 14 -> 4). ' +
         'The stated count must still be reconciled against the corpus even though the ' +
         'heading no longer states a total.',
    mutate: replaceOnce('| `design` | 14 |', '| `design` | 4 |')
  },

  // ---- THE DELETION-SAFETY QUESTION: is the removed claim stopped from reappearing unread? ----
  {
    id: 'N1', expect: 'RED',
    why: 'THE J-2a C7 ANALOGUE, and the cell that decides whether deleting the prose count ' +
         'was a coverage INCREASE or a blind spot. A maintainer re-adds the count as ordinary ' +
         'prose, and gets it WRONG ("9 tags have a robust pool"; the table has 7 rows). If ' +
         'nothing reads it, the README now carries a false statement that no guard can see — ' +
         'which is exactly the hole J-2a closed on the Attribution side with its ' +
         '"no digit runs outside the counts table" rule.',
    mutate: replaceOnce('\n' + H1, '\n9 tags have a robust pool (5+ entries):\n' + H1)
  },
  {
    id: 'N2', expect: 'RED',
    why: 'v1/A2b carried forward — the hole I MEASURED OPEN before dispatch (92/0 green). ' +
         'A second `| Tag | Count |` table stating a FALSE band membership (`design`, corpus ' +
         'count 14, parked under a "2 times" band), under a PROSE lead-in rather than a ' +
         '#### heading. Old code skipped it for lacking an N+/N-M token; new code skips it ' +
         'for lacking a ####. The skip reason changed, so the cell must be re-run: if this ' +
         'is still GREEN the structural fix did not close the unread-surface hole, it ' +
         'renamed it.',
    mutate: replaceOnce(
      '\nThe smallest pool holds three aphorisms',
      '\n2 tags appear exactly 2 times:\n| Tag | Count |\n|---|---|\n| `design` | 14 |\n| `humor` | 9 |\n\nThe smallest pool holds three aphorisms'
    )
  },
  {
    id: 'N3', expect: 'RED',
    why: 'The same false table, but under a REAL #### heading, so it is unambiguously a band ' +
         'table by the document\'s own new convention. This one the fix must catch. If N3 is ' +
         'RED and N2 GREEN, the fix works exactly as designed and N2 is a documented ' +
         'boundary rather than a regression — that distinction is why both cells exist.',
    mutate: replaceOnce(
      '\nThe smallest pool holds three aphorisms',
      '\n#### Appears exactly 2 times (2-2)\n| Tag | Count |\n|---|---|\n| `design` | 14 |\n| `humor` | 9 |\n\nThe smallest pool holds three aphorisms'
    )
  },
  {
    id: 'B1', expect: 'RED',
    why: 'SHAPE B, document order. The 5+ heading DUPLICATED, first copy keeping the correct ' +
         'table, second carrying a wrong one (`language`, corpus count 4, under a 5+ heading). ' +
         'A first-match or Map-keyed scan lets order hide the second table.',
    mutate: replaceOnce('\n' + H2, '\n' + H1 + '\n| Tag | Count |\n|---|---|\n| `language` | 4 |\n\n' + H2)
  }
];

const tmpRoot = fs.mkdtempSync(path.join('/opt/swarm/runs', 'j2b-gate-v2-'));
const results = [];

for (const cell of cells) {
  const dir = path.join(tmpRoot, cell.id);
  execSync(`cp -a ${JSON.stringify(repo)} ${JSON.stringify(dir)}`);
  const rp = path.join(dir, 'README.md');
  let applied = true, note = '';
  try {
    const before = fs.readFileSync(rp, 'utf8');
    const after = cell.mutate(before);
    if (cell.id !== 'P0' && after === before) throw new Error('MUTATION WAS A NO-OP');
    fs.writeFileSync(rp, after);
  } catch (e) { applied = false; note = String(e.message); }

  let verdict = 'UNAPPLICABLE', pass = -1, fail = -1, fired = [];
  if (applied) {
    const r = spawnSync('node --test test/*.test.js', { cwd: dir, encoding: 'utf8', timeout: 300000, shell: true });
    const out = (r.stdout || '') + (r.stderr || '');
    pass = Number((out.match(/^ℹ pass (\d+)/m) || [0, -1])[1]);
    fail = Number((out.match(/^ℹ fail (\d+)/m) || [0, -1])[1]);
    verdict = (r.status === 0 && fail === 0) ? 'GREEN' : 'RED';
    fired = [...new Set(out.split('\n').filter(l => /^✖/.test(l))
      .map(l => l.replace(/\s*\([\d.]+ms\)\s*$/, '').replace(/^✖\s*/, '')))]
      .filter(t => t !== 'failing tests:');
    fs.writeFileSync(path.join(tmpRoot, cell.id + '.out'), out);
  }

  const scored = verdict === cell.expect ? 'OK' : 'GATE-FAIL';
  results.push({ id: cell.id, expect: cell.expect, verdict, pass, fail, scored, note, fired, why: cell.why });
  console.log(`${cell.id.padEnd(3)} expect=${cell.expect.padEnd(6)} actual=${verdict.padEnd(13)} ${pass}/${fail}  ${scored}${note ? '  :: ' + note : ''}`);
  // Attribution matters as much as the verdict: a cell that goes RED via an unrelated guard
  // is a false clearance. v1/A2 taught this the hard way.
  for (const f of fired) console.log('       fired: ' + f.slice(0, 104));
}

const bad = results.filter(r => r.scored === 'GATE-FAIL');
console.log('\n--- SCORE --- ' + (results.length - bad.length) + '/' + results.length + ' cells as expected');
for (const r of bad) console.log('  GATE-FAIL ' + r.id + ': expected ' + r.expect + ', got ' + r.verdict);
console.log('transcripts: ' + tmpRoot);
fs.writeFileSync(path.join(tmpRoot, 'results.json'), JSON.stringify(results, null, 2));
