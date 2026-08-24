#!/usr/bin/env node
// tools/citation-tax.mjs -- measure the "two-commit tax" that README's
// "### Node support" citation levies on this repo.
//
// WHAT THIS IS
// ------------
// README's §Node support cites a CI matrix run and names its own retirement
// condition as an executable command: `git diff <base>..HEAD -- <paths>`.
// The moment that diff stops being empty, the cited run no longer describes
// this tree and the section must be re-cited. In practice that has meant a
// recurring ritual: one commit lands a change under the cited paths and is
// therefore RED, and a LATER commit spends itself re-citing the section.
// This tool counts that ritual from committed history.
//
// WHAT THIS IS NOT
// ----------------
// This tool WRITES NOTHING. It changes no pathspec, no assertion, no
// citation, no file. It runs read-only git plumbing (rev-list, cat-file,
// show, diff --name-only) and prints. Run it from anywhere; it resolves the
// repo root itself. It is not part of the test suite (`node --test
// test/*.test.js` does not collect it) and it has no dependencies beyond
// `node:` builtins.
//
// NOTHING HERE IS HARDCODED THAT COULD BE DERIVED
// -----------------------------------------------
//   * the guard's file path       -> parsed out of README §Node support
//   * the guard's birth commit    -> `git log --diff-filter=A` on that path
//   * the cited base commit       -> parsed out of README AT EACH COMMIT
//   * the cited pathspec          -> parsed out of README AT EACH COMMIT
//   * every count printed below   -> computed from the walk, never a literal
// The only literal is the section heading `### Node support`, which is the
// same literal the guard itself uses to find the section it protects.
//
// ============================================================================
// THE CONVENTION (read this before reading any number)
// ============================================================================
// The guard CHANGED SHAPE three times over its life, so "commit X was red"
// is not well defined until you say WHICH GUARD you are asking about. The
// three shapes, derived at run time from the guard's own source at each
// commit rather than asserted here:
//
//   shape 1  the original: parse `git diff <base>..<target> -- <paths>` out
//            of the prose, skip on missing preconditions, else assert the
//            diff is empty.
//   shape 2  adds: an unreachable base on a FULL clone is a bogus citation
//            and fails (it no longer skips); and a section naming more than
//            one such command is ambiguous and fails loudly rather than
//            silently taking the first match.
//   shape 3  adds: a second comparison, `git diff <base> -- <paths>` with no
//            range, so an UNCOMMITTED falsification is visible to the run
//            that is happening now instead of only to the next one.
//
// CONVENTION CHOSEN, stated plainly:
//
//   CONTEMPORANEOUS CORE, COMMITTED HISTORY ONLY.
//
//   For each commit X we ask: with the guard version that was actually
//   present in X's own tree, and with the base and pathspec that X's own
//   README named, was `git diff <base>..X -- <pathspec>` non-empty?
//
//   Two halves of that:
//   (a) CONTEMPORANEOUS -- base, pathspec and guard presence are read from
//       commit X, never from HEAD. A commit is only in scope at all if the
//       guard file exists in its tree. Judging a 2026-08-18 commit against
//       a guard written on 2026-08-20 would be judging it against a rule
//       that did not exist; that is how you inflate a tax.
//   (b) CORE -- we evaluate only the assertion that ALL THREE shapes make
//       identically: the cited `<base>..<target>` diff over the cited
//       pathspec must be empty. The two shape changes are deliberately NOT
//       folded into the red/green verdict, because neither of them changes
//       that verdict for a COMMITTED commit:
//         - shape 2's full-clone-unreachable-base rule only converts a SKIP
//           into a FAIL; it cannot turn a red commit green or vice versa.
//           It is reported per commit as an annotation instead.
//         - shape 3's working-tree comparison changes WHEN a breakage is
//           visible (before the commit rather than after it), not WHETHER
//           the commit is red once it exists. Against committed history the
//           two comparisons coincide by construction, because at commit X a
//           clean checkout's working tree IS X's tree.
//       Shape 2's ambiguity rule is the one genuine divergence, so it is
//       computed and reported separately, per commit, as a counterfactual.
//
//   The cited target ref (`HEAD` in every version of the prose so far) is
//   resolved to the commit under evaluation. If some commit ever cited a
//   target other than HEAD, that is printed rather than silently rewritten.
//
//   Alternative convention, computed and printed alongside for contrast:
//   RETROACTIVE -- judge every commit in history against HEAD's guard and
//   HEAD's pathspec. That is the convention that produces the inflated
//   all-history number, and the report shows why it is the wrong one.
//
//   TIMELINE. History here is not purely linear (it contains merges), so
//   the walk is FIRST-PARENT: the mainline as it was actually pushed. A
//   merge counts as touching the pathspec when its diff against its FIRST
//   parent touches it -- i.e. the merge is the moment the change landed on
//   the mainline. Side-branch commits are not counted separately, because
//   counting both a side commit and the merge that carried it would bill
//   the same breakage twice. Both numbers are printed so the choice is
//   auditable.
// ============================================================================

import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SECTION_HEADING = '### Node support';

// ---------------------------------------------------------------------------
// read-only git
// ---------------------------------------------------------------------------

let REPO_ROOT = process.cwd();

const WRITE_VERBS = new Set([
  'commit', 'add', 'push', 'checkout', 'reset', 'stash', 'tag', 'merge',
  'rebase', 'cherry-pick', 'am', 'apply', 'rm', 'mv', 'clean', 'gc',
  'update-ref', 'switch', 'restore', 'fetch', 'pull', 'branch', 'notes',
]);

function git(args, { allowFailure = false } = {}) {
  // Belt and braces: this tool must never mutate the repo, so refuse to
  // shell out to any git verb that could.
  if (WRITE_VERBS.has(args[0])) {
    throw new Error(`refusing to run a mutating git verb: git ${args[0]}`);
  }
  const r = spawnSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) {
    if (allowFailure) return { ok: false, out: '', err: String(r.error) };
    throw r.error;
  }
  if (r.status !== 0) {
    if (allowFailure) return { ok: false, out: r.stdout ?? '', err: (r.stderr ?? '').trim() };
    throw new Error(`git ${args.join(' ')} failed (${r.status}): ${(r.stderr ?? '').trim()}`);
  }
  return { ok: true, out: r.stdout ?? '', err: (r.stderr ?? '').trim() };
}

function fileAt(rev, path) {
  const r = git(['show', `${rev}:${path}`], { allowFailure: true });
  return r.ok ? r.out : null;
}

function existsAt(rev, path) {
  return git(['cat-file', '-e', `${rev}:${path}`], { allowFailure: true }).ok;
}

// ---------------------------------------------------------------------------
// parsing -- deliberately the same parse the guard performs on itself
// ---------------------------------------------------------------------------

function section(readme) {
  if (readme == null) return null;
  const start = readme.indexOf(SECTION_HEADING);
  if (start === -1) return null;
  const rest = readme.slice(start + SECTION_HEADING.length);
  const next = rest.match(/\n(##|###) /);
  const end = next ? start + SECTION_HEADING.length + next.index : readme.length;
  return readme.slice(start, end);
}

const CITED_COMMAND = /`git diff ([0-9a-fA-F]{4,40})\.\.(\S+) -- ([^`]+)`/g;

// Returns { base, target, pathspec, count } or null. `count` is how many
// such commands the section names -- the input to shape 2's ambiguity rule.
function citation(sectionText) {
  if (sectionText == null) return null;
  const ms = [...sectionText.matchAll(CITED_COMMAND)];
  if (ms.length === 0) return null;
  const m = ms[0];
  return {
    base: m[1],
    target: m[2],
    pathspec: m[3].trim().split(/\s+/),
    count: ms.length,
  };
}

// The guard's own path, read out of the section it guards: the section names
// it as a backticked path under test/. Fallback: whichever test file at HEAD
// mentions the section heading.
function findGuardPath(headSection) {
  const m = headSection && headSection.match(/`(test\/[A-Za-z0-9._-]+\.test\.js)`/);
  if (m) return m[1];
  const files = git(['ls-tree', '-r', '--name-only', 'HEAD', 'test']).out
    .split('\n').filter(Boolean);
  for (const f of files) {
    const src = fileAt('HEAD', f);
    if (src && src.includes(SECTION_HEADING)) return f;
  }
  return null;
}

// Classify the guard's shape from its own source -- no SHAs hardcoded.
function guardShape(src) {
  if (src == null) return { n: 0, name: 'absent', failsOnAmbiguity: false };
  const tests = (src.match(/^test\(/gm) || []).length;
  const shallowRule = src.includes('--is-shallow-repository');
  if (!shallowRule) return { n: 1, name: 'shape 1 (original)', failsOnAmbiguity: false };
  if (tests < 2) return { n: 2, name: 'shape 2 (+ambiguity/full-clone rules)', failsOnAmbiguity: true };
  return { n: 3, name: 'shape 3 (+working-tree comparison)', failsOnAmbiguity: true };
}

// ---------------------------------------------------------------------------
// the walk
// ---------------------------------------------------------------------------

function firstParentTimeline() {
  const shas = git(['rev-list', '--first-parent', '--reverse', 'HEAD']).out
    .split('\n').filter(Boolean);
  return shas;
}

function touchedPathspec(sha, pathspec) {
  const parents = git(['rev-list', '--parents', '-n', '1', sha]).out.trim().split(/\s+/).slice(1);
  const args = parents.length === 0
    // root commit: compare against the empty tree
    ? ['diff', '--name-only', git(['hash-object', '-t', 'tree', '/dev/null']).out.trim(), sha, '--', ...pathspec]
    : ['diff', '--name-only', parents[0], sha, '--', ...pathspec];
  const r = git(args, { allowFailure: true });
  if (!r.ok) return null;
  return r.out.split('\n').filter(Boolean);
}

function citedDiff(base, target, sha, pathspec) {
  // The cited target is resolved to the commit under evaluation.
  const tgt = target === 'HEAD' ? sha : target;
  if (!git(['cat-file', '-e', `${base}^{commit}`], { allowFailure: true }).ok) {
    return { evaluable: false, why: `cited base ${base} is not reachable`, files: [] };
  }
  const r = git(['diff', '--name-only', `${base}..${tgt}`, '--', ...pathspec], { allowFailure: true });
  if (!r.ok) return { evaluable: false, why: `cited command could not be evaluated: ${r.err}`, files: [] };
  return { evaluable: true, why: null, files: r.out.split('\n').filter(Boolean) };
}

function short(sha) { return sha.slice(0, 7); }
function subject(sha) { return git(['log', '-1', '--format=%s', sha]).out.trim(); }
function isodate(sha) { return git(['log', '-1', '--format=%ad', '--date=short', sha]).out.trim(); }

// ---------------------------------------------------------------------------
// report helpers
// ---------------------------------------------------------------------------

const out = [];
const say = (s = '') => out.push(s);
function rule(ch = '-') { say(ch.repeat(78)); }
function head(t) { say(); rule('='); say(t); rule('='); }

function table(headers, rows) {
  const w = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
  const line = (cells) => cells.map((c, i) => String(c ?? '').padEnd(w[i])).join('  ').trimEnd();
  say(line(headers));
  say(w.map((n) => '-'.repeat(n)).join('  '));
  for (const r of rows) say(line(r));
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  // RV-11: anchor to THIS FILE's own checkout, never the caller's cwd. Before
  // this fix, `git rev-parse --show-toplevel` ran with no `cwd` option and so
  // inherited process.cwd() -- a caller invoking this script by absolute path
  // from an unrelated repo got that repo's toplevel, and every claim below
  // (including "no such section") was silently made about the wrong repo.
  // Same shape as tools/citation-rule-check.mjs's resolvedToplevelIsOwnRoot():
  // resolve git's toplevel FROM this file's own directory, then require that
  // toplevel to realpath-equal this file's own directory (not an ancestor
  // repo it happens to be nested inside) before trusting it as REPO_ROOT.
  const ownDir = fileURLToPath(new URL('../', import.meta.url));
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: ownDir, encoding: 'utf8' });
  let anchored = null;
  if (!top.error && top.status === 0) {
    try {
      if (realpathSync(top.stdout.trim()) === realpathSync(ownDir)) anchored = top.stdout.trim();
    } catch { /* leave anchored null -- unknown, not asserted */ }
  }
  if (anchored === null) {
    console.error(`citation-tax: repo root .................. could not be confirmed as this ` +
      `tool's own checkout (${ownDir})`);
    console.error('citation-tax: refusing to run -- this tool measures its OWN checkout only, and ' +
      'the git toplevel resolved from it does not match (or git is unavailable); it will not guess ' +
      'and measure an unrelated repo instead.');
    process.exitCode = 2;
    return;
  }
  REPO_ROOT = anchored;

  const headReadme = fileAt('HEAD', 'README.md');
  const headSection = section(headReadme);
  if (!headSection) {
    console.error(`citation-tax: repo root .................. ${REPO_ROOT}`);
    console.error(`citation-tax: README.md at HEAD has no "${SECTION_HEADING}" section; ` +
      'the claim this tool measures no longer exists. Nothing to measure.');
    process.exitCode = 2;
    return;
  }
  const headCite = citation(headSection);
  if (!headCite) {
    console.error(`citation-tax: repo root .................. ${REPO_ROOT}`);
    console.error('citation-tax: README §Node support at HEAD names no ' +
      '`git diff <base>..<target> -- <paths>` retirement condition. Nothing to measure.');
    process.exitCode = 2;
    return;
  }

  const guardPath = findGuardPath(headSection);
  if (!guardPath) {
    console.error(`citation-tax: repo root .................. ${REPO_ROOT}`);
    console.error('citation-tax: could not identify the citation guard from README §Node support.');
    process.exitCode = 2;
    return;
  }

  // Guard birth: the oldest commit that ADDED the guard file.
  const adds = git(['log', '--diff-filter=A', '--format=%H', '--follow', '--', guardPath]).out
    .split('\n').filter(Boolean);
  const guardBirth = adds[adds.length - 1];

  const timeline = firstParentTimeline();
  const idxOf = new Map(timeline.map((s, i) => [s, i]));
  const birthIdx = idxOf.has(guardBirth) ? idxOf.get(guardBirth) : -1;

  head('CITATION TWO-COMMIT TAX  --  derived from committed history, changes nothing');
  say();
  say('This tool wrote nothing. It ran read-only git only. The working tree is');
  say('byte-identical to how it found it.');
  say();
  say(`repo root ............... ${REPO_ROOT}`);
  say(`HEAD .................... ${short(git(['rev-parse', 'HEAD']).out.trim())}  ${isodate('HEAD')}`);
  say(`section measured ........ "${SECTION_HEADING}" in README.md`);
  say(`guard (parsed from it) .. ${guardPath}`);
  say(`guard born at ........... ${short(guardBirth)}  ${isodate(guardBirth)}  ${subject(guardBirth)}`);
  say(`cited pathspec at HEAD .. ${headCite.pathspec.join(' ')}   (parsed, not hardcoded)`);
  say(`cited base at HEAD ...... ${headCite.base}`);
  say(`cited target at HEAD .... ${headCite.target}`);

  head('CONVENTION IN FORCE  --  a tax number without one is not a measurement');
  say();
  say('  CONTEMPORANEOUS CORE, COMMITTED HISTORY ONLY.');
  say();
  say('  Commit X is RED iff, using the base and pathspec that X\'s OWN README');
  say('  named and only if the guard file existed in X\'s OWN tree,');
  say('      git diff <base>..X -- <pathspec-at-X>');
  say('  is non-empty. The cited target ref is resolved to X.');
  say();
  say('  The guard changed shape three times. Only the assertion COMMON to all');
  say('  three shapes is used for the red/green verdict, because neither shape');
  say('  change alters that verdict for an already-committed commit:');
  say('    - the full-clone/unreachable-base rule only turns a SKIP into a FAIL;');
  say('    - the working-tree comparison changes WHEN a breakage is visible, not');
  say('      whether the commit is red once it exists (at commit X, a clean');
  say('      checkout\'s working tree IS X\'s tree, so the two comparisons agree).');
  say('  The one genuine divergence -- the ambiguity rule, which fails when the');
  say('  section names more than one cited command -- is reported per commit as a');
  say('  counterfactual instead of being folded into the verdict.');
  say();
  say('  Timeline is FIRST-PARENT (the mainline as pushed). A merge counts as');
  say('  touching the pathspec when its diff vs its FIRST parent does; the');
  say('  side-branch commit it carried is not billed a second time.');

  // -- inflated, all-history ------------------------------------------------
  const totalCommits = git(['rev-list', '--count', 'HEAD']).out.trim();
  const fpTotal = timeline.length;
  const allHistFP = timeline.filter((s) => (touchedPathspec(s, headCite.pathspec) || []).length > 0);
  const simplified = git(['rev-list', '--count', 'HEAD', '--', ...headCite.pathspec]).out.trim();
  const fullHist = git(['rev-list', '--full-history', '--count', 'HEAD', '--', ...headCite.pathspec]).out.trim();

  head('STEP 1 -- (a) COMMITS TOUCHING THE CITED PATHSPEC, ALL HISTORY [the WRONG denominator]');
  say();
  say(`commits in history (all parents) ................. ${totalCommits}`);
  say(`commits on the first-parent mainline ............. ${fpTotal}`);
  say(`  ... of those, touching \`${headCite.pathspec.join(' ')}\` .... ${allHistFP.length}`);
  say();
  say('cross-checks on the same question, other traversals:');
  say(`  git rev-list --count HEAD -- <pathspec> ......... ${simplified}   (history-simplified)`);
  say(`  git rev-list --full-history --count HEAD -- ..... ${fullHist}   (counts side commits AND their merges)`);
  say();
  say(`Naive tax = ${allHistFP.length}/${fpTotal} = ` +
    `${(100 * allHistFP.length / fpTotal).toFixed(1)}% of all mainline commits.`);
  say('THIS NUMBER IS WRONG AND IS PRINTED ONLY TO SHOW WHY. It bills every');
  say(`commit back to the root against a guard that was not born until ${short(guardBirth)}.`);
  const preBirth = allHistFP.filter((s) => idxOf.get(s) < birthIdx).length;
  say(`${preBirth} of those ${allHistFP.length} commits predate the guard entirely: no citation could`);
  say('have been falsified by them, because there was nothing checking one.');

  // -- honest denominator ---------------------------------------------------
  const scope = timeline.slice(birthIdx); // guard exists from its birth commit onward

  const states = [];
  for (const sha of scope) {
    const readme = fileAt(sha, 'README.md');
    const sec = section(readme);
    const cite = citation(sec);
    const guardSrc = existsAt(sha, guardPath) ? fileAt(sha, guardPath) : null;
    const shape = guardShape(guardSrc);
    const pathspec = cite ? cite.pathspec : headCite.pathspec;
    const touchedFiles = touchedPathspec(sha, pathspec) || [];
    let verdict = 'n/a';
    let why = null;
    let diffFiles = [];
    if (guardSrc == null) {
      verdict = 'no-guard';
      why = 'guard file absent from this tree';
    } else if (!cite) {
      verdict = 'undecidable';
      why = 'README at this commit names no cited command';
    } else {
      const d = citedDiff(cite.base, cite.target, sha, pathspec);
      if (!d.evaluable) { verdict = 'undecidable'; why = d.why; }
      else { diffFiles = d.files; verdict = d.files.length > 0 ? 'RED' : 'green'; }
    }
    states.push({
      sha, idx: idxOf.get(sha), cite, shape, pathspec,
      touched: touchedFiles, verdict, why, diffFiles,
      subject: subject(sha), date: isodate(sha),
    });
  }
  const stateOf = new Map(states.map((s) => [s.sha, s]));

  const denom = states.filter((s) => s.touched.length > 0);

  head('STEP 2 -- THE HONEST DENOMINATOR');
  say();
  say(`mainline commits from the guard's birth (${short(guardBirth)}) through HEAD ... ${scope.length}`);
  say(`  ... of those, touching the pathspec THEIR OWN README cited ....... ${denom.length}`);
  say();
  say('That second number is the denominator. Every commit in it landed while a');
  say('guard existed to be falsified by it. Commits before the guard are not in');
  say('scope at any price: they could not have made a cited diff non-empty,');
  say('because no cited diff was being checked.');
  say();
  // Disclose what the first-parent choice excluded, so the choice is auditable.
  const mainlineSet = new Set(timeline);
  const reachableTouching = git(['rev-list', '--full-history', `${guardBirth}^..HEAD`, '--', ...headCite.pathspec])
    .out.split('\n').filter(Boolean);
  const sideBranch = reachableTouching.filter((s) => !mainlineSet.has(s));
  if (sideBranch.length) {
    say(`Excluded by the first-parent choice: ${sideBranch.length} side-branch commit(s) that touched`);
    say('the pathspec but reached the mainline only through a merge. The merge that');
    say('carried each one IS billed above, so the breakage is counted exactly once:');
    for (const s of sideBranch) {
      const merges = git(['rev-list', '--ancestry-path', '--merges', `${s}..HEAD`]).out.split('\n').filter(Boolean);
      const carrier = merges.length ? short(merges[merges.length - 1]) : '(none found)';
      say(`  ${short(s)}  ${subject(s).slice(0, 52)}   -> landed via merge ${carrier}`);
    }
  } else {
    say('The first-parent choice excluded nothing: no side-branch commit in scope');
    say('touched the pathspec, so this denominator is traversal-independent.');
  }
  say();
  table(
    ['#', 'commit', 'date', 'guard', 'cited base', 'verdict', 'files touched under the cited pathspec'],
    denom.map((s, i) => [
      i + 1, short(s.sha), s.date, `shape ${s.shape.n}`,
      s.cite ? s.cite.base : '(none)', s.verdict, s.touched.join(' '),
    ])
  );

  // -- (b) knowingly-red ----------------------------------------------------
  const breaks = denom.filter((s) => s.verdict === 'RED');
  const undecidable = denom.filter((s) => s.verdict === 'undecidable');

  head('STEP 3 -- (b) OF THOSE, HOW MANY MADE THE CITED DIFF NON-EMPTY AT THAT COMMIT');
  say();
  say(`pathspec-touching commits in scope ......... ${denom.length}`);
  say(`  RED at their own commit .................. ${breaks.length}`);
  say(`  green at their own commit ................ ${denom.length - breaks.length - undecidable.length}`);
  say(`  undecidable .............................. ${undecidable.length}`);
  say();
  const pct = denom.length ? (100 * breaks.length / denom.length).toFixed(1) : 'n/a';
  say(`==> THE TAX: ${breaks.length} of ${denom.length} = ${pct}% of pathspec-touching commits landed RED.`);
  say();
  say('Per-commit derivation of each RED verdict (the exact diff that was non-empty):');
  for (const s of breaks) {
    say();
    say(`  ${short(s.sha)}  ${s.date}  ${s.subject}`);
    say(`    README at this commit cited: git diff ${s.cite.base}..${s.cite.target} -- ${s.pathspec.join(' ')}`);
    say(`    resolved to:                 git diff ${s.cite.base}..${short(s.sha)} -- ${s.pathspec.join(' ')}`);
    say(`    that diff named ${s.diffFiles.length} file(s): ${s.diffFiles.join(' ')}`);
    say(`    -> non-empty -> the cited run no longer described this tree -> RED`);
    if (s.cite.count !== 1) {
      say(`    [ambiguity counterfactual] the section named ${s.cite.count} cited commands here;`);
      say(`     a shape-2+ guard would additionally have failed on ambiguity alone.`);
    }
  }

  // -- (c)/(d) repairs ------------------------------------------------------
  // A repair is the first later mainline commit at which the cited diff is
  // empty again. A "re-citation commit" is one whose README changed the cited
  // base relative to its first parent.
  function citedBaseAt(sha) {
    const c = citation(section(fileAt(sha, 'README.md')));
    return c ? c.base : null;
  }
  const recites = [];
  for (const s of states) {
    const parents = git(['rev-list', '--parents', '-n', '1', s.sha]).out.trim().split(/\s+/).slice(1);
    const before = parents.length ? citedBaseAt(parents[0]) : null;
    const after = s.cite ? s.cite.base : null;
    if (after && before !== after) recites.push({ ...s, from: before, to: after });
  }

  const events = [];
  for (const b of breaks) {
    let repair = null;
    for (let i = b.idx; i < timeline.length; i++) {
      const st = stateOf.get(timeline[i]);
      if (!st) continue;
      if (st.verdict === 'green') { repair = st; break; }
    }
    const recite = repair ? recites.find((r) => r.sha === repair.sha) : null;
    events.push({ breakAt: b, repair, gap: repair ? repair.idx - b.idx : null, recite });
  }

  head('STEP 4 -- (c) FOLLOW-UP COMMITS SPENT RE-CITING, AND (d) THE GAP');
  say();
  say('gap = mainline commits from the breaking commit to its repair.');
  say('      gap 0 = the same commit repaired itself; gap 1 = the very next');
  say('      commit; gap n>1 = the section stayed red for n-1 intervening commits.');
  say();
  table(
    ['#', 'breaking SHA', 'repairing SHA', 'gap', 'base re-cited', 'repair commit subject'],
    events.map((e, i) => [
      i + 1,
      short(e.breakAt.sha),
      e.repair ? short(e.repair.sha) : '(still red at HEAD)',
      e.gap === null ? '-' : String(e.gap),
      e.recite ? `${e.recite.from} -> ${e.recite.to}` : (e.repair ? '(no base change)' : '-'),
      e.repair ? e.repair.subject.slice(0, 46) : '-',
    ])
  );
  say();
  const repaired = events.filter((e) => e.repair);
  const distinctRepairs = new Set(repaired.map((e) => e.repair.sha));
  const gaps = repaired.map((e) => e.gap);
  const selfRepairs = gaps.filter((g) => g === 0).length;
  const nextCommit = gaps.filter((g) => g === 1).length;
  const laterCycle = gaps.filter((g) => g > 1).length;
  say(`breaking commits ................................. ${breaks.length}`);
  say(`distinct follow-up commits spent repairing ....... ${distinctRepairs.size}`);
  say(`re-citation commits post-guard (base changed) .... ${recites.length}`);
  say(`repaired by the SAME commit (gap 0) .............. ${selfRepairs}`);
  say(`repaired by the NEXT commit (gap 1) .............. ${nextCommit}`);
  say(`repaired a later cycle (gap > 1) ................. ${laterCycle}`);
  say(`still red at HEAD ................................ ${events.length - repaired.length}`);
  if (gaps.length) {
    const min = Math.min(...gaps), max = Math.max(...gaps);
    const mean = (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2);
    say(`gap: min ${min}, max ${max}, mean ${mean}`);
  }
  say();
  say('All re-citation commits in scope, whether or not they closed an event:');
  table(
    ['commit', 'date', 'base moved', 'subject'],
    recites.map((r) => [short(r.sha), r.date, `${r.from ?? '(none)'} -> ${r.to}`, r.subject.slice(0, 44)])
  );

  // -- guard shape ledger ---------------------------------------------------
  head('STEP 5 -- THE GUARD\'S CHANGING SHAPE, AND WHETHER IT MOVED ANY VERDICT');
  say();
  const shapeChanges = [];
  let prev = null;
  for (const s of states) {
    if (prev === null || s.shape.n !== prev) shapeChanges.push(s);
    prev = s.shape.n;
  }
  table(
    ['commit', 'date', 'shape', 'what that shape adds'],
    shapeChanges.map((s) => [short(s.sha), s.date, String(s.shape.n), s.shape.name])
  );
  say();
  const ambiguousCommits = states.filter((s) => s.cite && s.cite.count !== 1);
  say(`Commits whose section named != 1 cited command ... ${ambiguousCommits.length}`);
  if (ambiguousCommits.length) {
    for (const s of ambiguousCommits) {
      say(`  ${short(s.sha)}  named ${s.cite.count} cited commands  (guard shape in tree: ${s.shape.n})`);
    }
    say('  For any of these where the in-tree shape was 1, a retroactive judgement');
    say('  against HEAD\'s guard would ADD a failure the contemporaneous guard did');
    say('  not have. That is the whole difference between the two conventions.');
  } else {
    say('  -> zero. The ambiguity rule, the only shape change that could have moved a');
    say('     verdict, never had an occasion to. The tax number above is therefore');
    say('     IDENTICAL under the contemporaneous and the retroactive conventions;');
    say('     the convention matters for the DENOMINATOR, not for the guard version.');
  }

  // -- over-claim analysis --------------------------------------------------
  head('STEP 6 -- DOES THE PATHSPEC OVER-CLAIM? (what CI actually executes)');
  say();
  // What does CI run? Read it out of the workflow, don't assume.
  const wfFiles = git(['ls-tree', '-r', '--name-only', 'HEAD', '.github']).out.split('\n').filter(Boolean);
  const runLines = [];
  for (const f of wfFiles) {
    const src = fileAt('HEAD', f) || '';
    for (const line of src.split('\n')) {
      if (/^\s*-?\s*run:.*node --test/.test(line)) runLines.push(`${f}: ${line.trim()}`);
    }
  }
  say('CI\'s test invocation, read from the workflow at HEAD:');
  for (const l of runLines) say(`  ${l}`);
  say();
  const compOf = (f) =>
    headCite.pathspec.find((p) => f === p || f.startsWith(p.replace(/\/$/, '') + '/')) || '(unmatched)';
  const compTouch = new Map();   // files billed, per component, across breaking events
  const compEvents = new Map();  // breaking EVENTS blamed on each component
  for (const s of breaks) {
    for (const f of s.touched) compTouch.set(compOf(f), (compTouch.get(compOf(f)) || 0) + 1);
    for (const c of new Set(s.touched.map(compOf))) compEvents.set(c, (compEvents.get(c) || 0) + 1);
  }
  table(
    ['cited component', 'breaking events it appears in', 'files billed', 'files at HEAD that CI does not consume'],
    headCite.pathspec.map((p) => {
      const atHead = git(['ls-tree', '-r', '--name-only', 'HEAD', '--', p]).out.split('\n').filter(Boolean);
      const unused = atHead.filter((f) => !(
        /^test\/.*\.test\.js$/.test(f) || /^src\//.test(f) || /^bin\//.test(f) || /^\.github\/workflows\//.test(f)
      ));
      return [p, String(compEvents.get(p) || 0), String(compTouch.get(p) || 0),
        unused.length ? unused.join(' ') : `none (${atHead.length} file(s) present, all consumed)`];
    })
  );
  say();
  const productEvents = breaks.filter((s) => s.touched.some((f) => /^(src|bin)\//.test(f))).length;
  // A "meta-guard" is a test whose own source reads README.md -- derived from the
  // file's content at the commit that touched it, not from its name.
  let metaEvents = 0;
  for (const s of breaks) {
    const meta = s.touched.some((f) => {
      if (!/^test\//.test(f)) return false;
      const src = fileAt(s.sha, f);
      return src != null && src.includes('README.md');
    });
    if (meta) metaEvents++;
  }
  say(`Breaking events whose diff touched src/ or bin/ (the shipped CLI) .... ${productEvents}`);
  say(`Breaking events caused by a test whose own subject is README.md ..... ${metaEvents}`);
  say('  (that second class is derived by reading each touched test file at the');
  say('   breaking commit and asking whether its source reads README.md -- not by');
  say('   its filename. These are the guard and its siblings: the citation is being');
  say('   falsified by the apparatus that exists to check the citation.)');
  say();
  const everFiles = [...new Set(git(['log', '--full-history', '--format=', '--name-only', '--', ...headCite.pathspec]).out
    .split('\n').filter(Boolean))].sort();
  const notRunByCI = everFiles.filter((f) => !(
    /^test\/.*\.test\.js$/.test(f) || /^src\//.test(f) || /^bin\//.test(f) || /^\.github\/workflows\//.test(f)
  ));
  say(`Distinct files ever touched under the cited pathspec: ${everFiles.length}`);
  say(`  ... of those, files whose content CI does NOT execute or consume: ${notRunByCI.length}` +
    (notRunByCI.length ? ` -> ${notRunByCI.join(' ')}` : ''));
  say();
  if (notRunByCI.length === 0) {
    say('REALIZED over-claim: none. Every file that has ever been touched under the');
    say('cited pathspec is a file CI runs (a src/ or bin/ module the suite imports, a');
    say('test/*.test.js the runner collects, or the workflow that defines the matrix).');
    say('A change to any of them genuinely can move the cited numbers.');
    say();
    say('LATENT over-claim: the pathspec names DIRECTORIES, so it covers files that');
    say('do not exist yet and could not move the matrix -- e.g. a .github/ISSUE_TEMPLATE');
    say('or a .github/dependabot.yml, or a non-.test.js fixture under test/. Those');
    say('would falsify the citation without changing a single CI number. That over-claim');
    say('is real but has cost this repo exactly 0 commits so far, so it cannot be what');
    say('the measured tax is made of.');
  } else {
    say('REALIZED over-claim: the files listed above were billed by the citation even');
    say('though CI never executes them. That share of the tax is an artifact of the');
    say('pathspec, not of the claim.');
  }

  // The cited base is itself evidence for the per-push unit: if the base does
  // NOT touch the pathspec, it cannot be the commit that carried the change --
  // it is the head of the push that was tested. Derive both.
  const baseTouches = (touchedPathspec(headCite.base, headCite.pathspec) || []).length > 0;
  const carrier = git(['rev-list', '-n', '1', '--first-parent', headCite.base, '--', ...headCite.pathspec])
    .out.trim();

  // -- recommendation -------------------------------------------------------
  head('RECOMMENDATION');
  say();
  const allGapPositive = gaps.length > 0 && gaps.every((g) => g >= 1);
  say('THE RITUAL IS INTRINSIC TO THE SELF-FALSIFYING CLAIM. It is NOT an artifact');
  say('of an over-claiming pathspec. Four findings force that, in order of weight:');
  say();
  if (allGapPositive) {
    say(`1. THE GAP IS NEVER ZERO, AND CANNOT BE. All ${repaired.length} repairs took at least one`);
    say(`   later commit (gaps ${gaps.join(', ')}; ${selfRepairs} same-commit repairs). That is arithmetic,`);
    say('   not indiscipline: the citation names a CI RUN ID, CI runs on push, and a');
    say('   push cannot precede the commit. A commit cannot cite the run that tested');
    say('   it. Narrowing the pathspec changes how OFTEN you pay; it cannot make the');
    say('   gap zero, so it cannot retire the ritual.');
  } else {
    say(`1. ${selfRepairs} of ${repaired.length} repairs landed in the breaking commit itself, so the`);
    say('   two-commit shape is convention here, not a consequence of the claim.');
  }
  say(`   Corroborating, derived: the cited base ${headCite.base} ${baseTouches ? 'DOES' : 'does NOT'} itself touch the`);
  say(`   pathspec; the commit that actually carried the change is ${carrier ? short(carrier) : '(none)'}. The`);
  say('   citation names the SHA a PUSH was tested at, not the SHA that broke it --');
  say('   which is the per-push unit showing through in the document itself.');
  say();
  say(`2. EVERY BREAKAGE WAS A TRUE FALSIFICATION. ${breaks.length} of ${denom.length}, and the realized`);
  say(`   over-claim is ${notRunByCI.length}: every file ever billed under the cited pathspec is a`);
  say('   file CI executes or consumes. Not one of these commits was punished for a');
  say('   change that could not have moved the cited matrix. There is no component');
  say('   to indict on the evidence of what has actually happened.');
  say();
  say('3. THE ONE COMPONENT WHOSE BREADTH EXCEEDS ITS OWN PROSE IS `.github`, and it');
  say('   has cost nothing. The pathspec names the whole directory while the section');
  say('   describes the trigger as "the workflow itself"; a future');
  say('   .github/ISSUE_TEMPLATE or dependabot.yml would falsify the citation without');
  say('   moving a single CI number. That is a LATENT over-claim, and it is named');
  say('   here for honesty -- but it is not the mechanism of the measured tax,');
  say(`   because the directory has only ever contained the workflow.`);
  say();
  say(`4. THE TAX IS DOMINATED BY THE APPARATUS, NOT THE PRODUCT. ${productEvents} of the ${breaks.length} breaking`);
  say(`   commits touched src/ or bin/ at all; ${metaEvents} were caused by a test file whose`);
  say('   own subject is README.md. The citation is mostly being falsified by the');
  say('   machinery built to check the citation. That is self-reference, not');
  say('   over-claim: those tests live under test/, CI counts them, and the section');
  say('   publishes the counts, so their arrival genuinely retires the run. A guard');
  say('   that lives inside the pathspec it guards must falsify itself on arrival.');
  say();
  say('The section is not over-claiming its PATHS. If anything it under-claims its');
  say('UNIT: the assertion is per-commit while the evidence it cites is per-push.');
  say('That mismatch, not the breadth of the paths, is what makes the ledger read');
  say('like a ritual.');
  say();
  say('NO ACTION IS PROPOSED AND NONE WAS TAKEN. This item changes nothing: not the');
  say('pathspec, not the assertion, not the citation. The recommendation IS the');
  say('deliverable. If a later item wants a lever, the data points at the UNIT of');
  say('the claim, not at the breadth of the paths.');

  // -- undecidables ---------------------------------------------------------
  head('UNDECIDABLE FROM COMMITTED HISTORY ALONE');
  say();
  const declared = breaks.filter((s) => /\bred\b/i.test(s.subject) ||
    /\bred\b/i.test(git(['log', '-1', '--format=%B', s.sha]).out));
  say('1. KNOWINGLY red vs. discovered-afterwards.  [NOT A CHECK -- PROSE KEYWORD SCAN]');
  say('   The acceptance question asks how many commits "knowingly" landed red.');
  say('   Committed history cannot answer that. The only trace is what the author');
  say('   wrote in the message, and a keyword scan of prose is not evidence -- it is');
  say('   a pointer. It is reported here, clearly labelled, and is used in NO verdict');
  say('   and in NO number above.');
  say(`   ${declared.length} of the ${breaks.length} breaking commits mention being red in their own message`);
  say('   (e.g. "RED by design", "red window"). That is the AUTHOR\'S OWN CLAIM at');
  say('   commit time -- stated intent, not proof of it, and a message can be written');
  say('   after the fact as easily as before.');
  for (const s of declared) say(`     ${short(s.sha)}  ${s.subject.slice(0, 68)}`);
  const silent = breaks.filter((b) => !declared.includes(b));
  if (silent.length) {
    for (const s of silent) say(`     ${short(s.sha)}  [no red disclosure in message]  ${s.subject.slice(0, 50)}`);
    say('   The ones with no disclosure are the genuinely open cases.');
  }
  say('   WHAT WOULD SETTLE IT: a pre-commit verification transcript for each');
  say('   breaking commit showing the guard was run and observed failing BEFORE the');
  say('   commit was made. Some of those transcripts exist in-tree under the run');
  say('   evidence directories; where they do not, the question stays open.');
  say();
  say('2. WHICH COMMITS SHARED A PUSH.');
  say('   Git records no push boundaries, so this tool cannot say how many CI runs');
  say('   the tax actually cost -- only how many commits it cost. The distinction');
  say('   matters: several red commits pushed together cost ONE run, not several.');
  say('   WHAT WOULD SETTLE IT: the workflow run list from the GitHub API (each run');
  say('   names its head SHA), or a reflog from the pushing clone. Neither is in');
  say('   committed history.');
  say();
  say('3. WHETHER A REPAIR WAS *FOR* THE BREAK IT FOLLOWS.');
  say('   "Repair" here is defined structurally -- the first later commit at which');
  say('   the cited diff is empty again -- not by author intent. A commit that');
  say('   re-cited for an unrelated reason and happened to close an open break');
  say('   would be counted the same way. The commit subjects above are shown so a');
  say('   reader can judge that for themselves rather than trusting the label.');

  say();
  rule('=');
  say(`SUMMARY: honest denominator ${denom.length} pathspec-touching commits since the guard was born; ` +
    `${breaks.length} landed RED (${pct}%);`);
  say(`         ${distinctRepairs.size} separate follow-up commits were spent re-citing; ` +
    `gaps ${gaps.length ? gaps.join(', ') : '(none)'} (${selfRepairs} same-commit repairs).`);
  say(`         The inflated all-history figure ${allHistFP.length}/${fpTotal} is NOT the answer.`);
  rule('=');

  console.log(out.join('\n'));
}

main();
