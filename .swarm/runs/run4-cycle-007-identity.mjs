// Cycle 7 (run #4) — MEASUREMENT A, instrument v2.
//
// v1 used `git archive | sha256sum`. That is WRONG for this question: git archive stamps
// every tar member's mtime from the COMMIT DATE, so two commits with byte-identical
// content produce different digests. v1 reported all five anchors as DIFFERS, which is an
// artefact of commit dates, not a content finding.
//
// v2 reads git's own content-addressed TREE OBJECT id for each product path
// (`git rev-parse <ref>:<path>`). Identical content => identical tree id, by construction,
// with no timestamp in the input.
//
// CONTROLS (the run #4 rule: a check that cannot be shown to discriminate is not evidence):
//   C1 must-DIFFER  — a ref whose product content genuinely changed must report DIFFERS.
//   C2 must-MATCH   — a ref reachable by a docs-only commit must report IDENTICAL to its
//                     parent, proving the instrument is blind to doc churn and to dates.
import { execSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const g = (c) => execSync(c, { cwd: T, encoding: 'utf8' }).trim();

const PRODUCT = ['bin', 'src', 'test'];
const treeId = (ref) => PRODUCT.map((p) => {
  try { return g(`git rev-parse ${ref}:${p}`); } catch { return 'MISSING'; }
}).join('-');

const head = treeId('HEAD');
const rows = [];
for (const arg of process.argv.slice(2)) {
  const [ref, label] = arg.split('=');
  let sha = '', subj = '';
  try { sha = g(`git rev-parse --short ${ref}`); subj = g(`git log -1 --format=%s ${ref}`); }
  catch (e) { rows.push([ref, label || '', 'ERROR', e.message.split('\n')[0]]); continue; }
  const t = treeId(ref);
  rows.push([sha, label || '', t === head ? 'IDENTICAL' : 'DIFFERS', subj.slice(0, 62)]);
}

console.log('=== product tree-object identity vs HEAD (bin/ src/ test/) ===');
console.log(`HEAD product tree ids: ${head}`);
console.log('');
for (const [sha, label, verdict, subj] of rows) {
  console.log(`${verdict.padEnd(10)} ${sha.padEnd(9)} ${label.padEnd(18)} ${subj}`);
}

// ---- controls ----
console.log('\n=== controls ===');
// C2 must-MATCH: HEAD is `cycle 6: Q-4 ...`, a documents/bookkeeping cycle. Its parent must
// carry identical product trees, or the instrument is reacting to something other than code.
const parent = treeId('HEAD~1');
console.log(`C2 must-MATCH   HEAD~1 vs HEAD -> ${parent === head ? 'IDENTICAL (PASS)' : 'DIFFERS (FAIL — instrument reacts to non-product change)'}`);

// C1 must-DIFFER: the very first commit of the repo cannot share HEAD's product trees.
const root = g('git rev-list --max-parents=0 HEAD');
const rootTree = treeId(root);
console.log(`C1 must-DIFFER  root ${root.slice(0, 7)} vs HEAD -> ${rootTree !== head ? 'DIFFERS (PASS)' : 'IDENTICAL (FAIL — instrument cannot discriminate)'}`);
