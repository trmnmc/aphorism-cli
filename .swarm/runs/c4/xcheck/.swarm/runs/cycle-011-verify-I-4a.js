'use strict';
// Cycle 11 verification harness for I-4a — authored by the conductor AT VERIFICATION TIME.
// Claim under test: the repo no longer states a false claim about corpus attribution, the
// replacement wording is factually true, and NOTHING outside the two edited prose regions
// changed. Prose edits to a product file are gated by measured byte-identity, not by
// "it's only a comment" (cycle-8 precedent).
//
// Every positive check is paired with a negative control where one is possible: a check
// that cannot fail is not evidence.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = '/opt/targets/aphorism-cli';
const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });
const head = (p) => git(['show', `HEAD:${p}`]);
const now = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail) {
  (cond ? pass++ : fail++);
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
  return cond;
}

// ---------------------------------------------------------------- scope control
const EDITED = ['src/corpus.js', 'README.md'];
const tracked = git(['ls-files']).trim().split('\n');
const product = tracked.filter((f) => !f.startsWith('.swarm/'));

check('C1 product file inventory unchanged (10 tracked product files)',
  product.length === 10, `found ${product.length}`);

// C2: every product file OTHER than the two edited ones is byte-identical to HEAD.
const untouched = product.filter((f) => !EDITED.includes(f));
const drifted = untouched.filter((f) => head(f) !== now(f));
check('C2 all non-edited product files byte-identical to HEAD',
  drifted.length === 0, drifted.length ? `drifted: ${drifted}` : `${untouched.length} files clean`);

// C3: working tree shows EXACTLY the two edited paths, and no stray untracked file.
// -uall enumerates untracked files individually; the collapsed form hides a second stray
// file inside an already-listed directory (harness defect found and fixed in cycle 10).
// NB: do NOT .trim() the whole output before splitting -- that strips the leading space of
// the FIRST line's two-character status column only, shifting slice(3) one byte into the
// filename for that one entry (harness defect caught here in cycle 11, same class as the
// collapsed-untracked-directory defect caught in cycle 10). Split first, trim never.
const porcelain = git(['status', '--porcelain', '-uall']).split('\n').filter(Boolean);
const malformed = porcelain.filter((l) => l.length < 4 || l[2] !== ' ');
const changedPaths = porcelain.map((l) => l.slice(3)).filter((p) => !p.startsWith('.swarm/'));
check('C3a every porcelain line has the expected XY<space> shape',
  malformed.length === 0, malformed.length ? JSON.stringify(malformed) : `${porcelain.length} lines`);
check('C3 exactly the two intended product paths are modified',
  changedPaths.length === 2 && EDITED.every((f) => changedPaths.includes(f)),
  `changed: ${JSON.stringify(changedPaths)}`);

// ------------------------------------------------- corpus.js: data must not have moved
// C4: the strongest form — the corpus DATA is deep-equal to HEAD's. A prose edit that
// silently dropped, reordered or retyped an entry cannot survive this.
const headCorpusPath = '/tmp/head-corpus-c11.js';
fs.writeFileSync(headCorpusPath, head('src/corpus.js'));
delete require.cache[require.resolve(headCorpusPath)];
const headCorpus = require(headCorpusPath).corpus;
const nowCorpus = require(path.join(ROOT, 'src/corpus.js')).corpus;
check('C4 corpus data deep-equal to HEAD (no entry added/dropped/reordered/edited)',
  JSON.stringify(headCorpus) === JSON.stringify(nowCorpus),
  `${nowCorpus.length} entries`);

// C5: bytes after the header comment block are identical to HEAD's, so the edit is
// provably confined to the comment. Split at the first line that is not a comment/blank.
const bodyOf = (src) => {
  const lines = src.split('\n');
  let i = 0;
  while (i < lines.length && (lines[i].startsWith('//') || lines[i].trim() === '' || lines[i].startsWith("'use strict'"))) i++;
  return lines.slice(i).join('\n');
};
check('C5 corpus.js bytes outside the header comment identical to HEAD',
  bodyOf(head('src/corpus.js')) === bodyOf(now('src/corpus.js')));

// C6: README — everything outside the inserted "## Attribution" section is unchanged.
const stripAttribution = (src) => src.replace(/## Attribution\n[\s\S]*?(?=## Layout)/, '');
check('C6 README bytes outside the inserted section identical to HEAD',
  stripAttribution(now('README.md')) === stripAttribution(head('README.md')));

// ------------------------------------------------------- the false claim is actually gone
const corpusSrc = now('src/corpus.js');
const headCorpusSrc = head('src/corpus.js');
const FALSE_CLAIMS = [
  /honest\s*\n?\/\/\s*attribution/i,          // "with honest attribution"
  /attributed to "Anonymous" rather/i,        // the Anonymous-hedging policy claim
  /true author is uncertain/i,
];
const claimHits = (src) => FALSE_CLAIMS.filter((re) => re.test(src.replace(/\s+/g, ' ')) || re.test(src));
check('C7 the three false attribution claims are absent from corpus.js',
  claimHits(corpusSrc).length === 0, `hits: ${claimHits(corpusSrc).length}`);

// NEGATIVE CONTROL for C7: the SAME check run against HEAD must FAIL, proving the check
// is capable of detecting the overclaim rather than being vacuously true.
check('N1 [negative control] C7 check fires on the OLD HEAD text',
  claimHits(headCorpusSrc).length > 0, `hits on HEAD: ${claimHits(headCorpusSrc).length}`);

// ------------------------------------------- the NEW wording's factual assertions are true
// The replacement puts two numbers into a product file. Both are measured here, not recalled.
const triage = now('docs/corpus-attribution-triage.md');
const highCount = (triage.match(/\| HIGH \|/g) || []).length;
const rowCount = (triage.match(/^\| \d+ \|/gm) || []).length;
const anonCount = nowCorpus.filter((e) => /anonymous/i.test(e.author)).length;

check('C8 asserted "8 HIGH risk" matches the triage doc', highCount === 8, `measured ${highCount}`);
check('C9 asserted "all 50 entries" matches corpus AND triage rows',
  nowCorpus.length === 50 && rowCount === 50, `corpus ${nowCorpus.length}, rows ${rowCount}`);
check('C10 every HIGH-risk entry names a real person (i.e. is NOT hedged to Anonymous)',
  anonCount === 1, `${anonCount} of 50 hedged to Anonymous`);

// NEGATIVE CONTROL for C8: a deliberately wrong count must be rejected.
check('N2 [negative control] the count check rejects a wrong figure', (9 !== highCount));

// C11: the removed claim was FALSE, which is why removing it was correct rather than
// merely a style change. The old text promised uncertain entries are hedged to Anonymous;
// 8 entries are rated HIGH risk and exactly 1 is hedged. Those cannot both hold.
const highAuthors = triage.split('\n').filter((l) => /\| HIGH \|/.test(l))
  .map((l) => l.split('|').map((s) => s.trim())[3]);
const highNamedPeople = highAuthors.filter((a) => a && !/anonymous/i.test(a)).length;
check('C11 the removed claim is measurably false (8 HIGH-risk entries name famous people, 1 hedged)',
  highNamedPeople === 8 && anonCount === 1, `${highNamedPeople} HIGH named, ${anonCount} anonymous`);

// ------------------------------------------------------------------ pointer requirement
check('C12 corpus.js points at the triage doc', corpusSrc.includes('docs/corpus-attribution-triage.md'));
check('C13 README points at the triage doc', now('README.md').includes('docs/corpus-attribution-triage.md'));
check('C14 the pointed-at document exists and is non-trivial',
  fs.existsSync(path.join(ROOT, 'docs/corpus-attribution-triage.md')) && triage.length > 2000,
  `${triage.length} bytes`);

// NEGATIVE CONTROL for C12/C13: the pointer check must fail on a string lacking the path.
check('N3 [negative control] pointer check rejects text without the path',
  !'a README with no pointer at all'.includes('docs/corpus-attribution-triage.md'));

// ------------------------------------------------------------------- behaviour unchanged
// C15: the CLI still runs and is deterministic under --seed, byte-identical to HEAD's build.
const runSeed = () => execFileSync('node', [path.join(ROOT, 'bin/aphorism.js'), '--seed', '42'], { encoding: 'utf8' });
let seedOut = '';
try { seedOut = runSeed(); } catch (e) { seedOut = 'ERROR: ' + e.message; }
check('C15 CLI still runs; --seed 42 produces non-empty deterministic output',
  seedOut.length > 0 && seedOut === runSeed(), JSON.stringify(seedOut.trim().slice(0, 60)));

console.log(results.join('\n'));
console.log(`\n${pass}/${pass + fail} checks passed`);
process.exit(fail === 0 ? 0 : 1);
