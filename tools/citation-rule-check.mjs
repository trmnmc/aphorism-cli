#!/usr/bin/env node
// Asserts that docs/node-support-citation-history.md quotes README.md's citation-selection
// rule VERBATIM, and quotes it from README's own "### Node support" section.
// Not a test: deliberately outside test/ and outside the README citation's pathspec.
//   node tools/citation-rule-check.mjs     exit 0 = byte-identical, exit 1 = diverged
//
// Attribution note (why this file shells out to git):
// A plain substring check of "does HIST's quote appear in README's section" cannot tell
// you, from the two working-tree files alone, WHICH side moved when it fails -- README
// could have been reworded, or HIST's quote could have been reworded, and both produce the
// exact same observable ("not a substring anymore"). Blaming HIST unconditionally (as this
// file used to) is wrong whenever README is the side that actually changed.
//
// To recover direction we use a third anchor: the committed blob of each file at git HEAD.
// We re-run the same extraction against `git show HEAD:<path>` and compare it to the
// working-tree extraction. Whichever extracted piece differs from its own HEAD version is
// the side that moved since the last commit. This only works when `git` is present, HEAD
// resolves, and the same extraction succeeds against the HEAD blob -- if any of that isn't
// true, we do NOT guess a side to blame. We say plainly that direction could not be
// determined. An honest "don't know" is worth more than a confident wrong attribution.
import { readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rootDir = fileURLToPath(root);

// Git walks UP the directory tree looking for a `.git`, so `git show HEAD:<path>` run from a
// directory that is NOT itself a repo -- but happens to sit nested inside an unrelated one --
// silently resolves against that ANCESTOR repo's HEAD instead of failing. Before trusting any
// HEAD blob we confirm the git toplevel git resolves from here really IS this checkout's own
// root; if it isn't (or git/toplevel resolution fails for any reason), we treat git as
// unavailable rather than asserting whose HEAD we used.
function resolvedToplevelIsOwnRoot() {
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return realpathSync(top) === realpathSync(rootDir);
  } catch {
    return false;
  }
}
const ownToplevel = resolvedToplevelIsOwnRoot();
const RM = 'README.md', HIST = 'docs/node-support-citation-history.md';
const FENCE = '```readme-quote\n';

const readme = readFileSync(new URL(RM, root), 'utf8');
const hist = readFileSync(new URL(HIST, root), 'utf8');

const die = (who, why) => { console.error(`FAIL: ${who} has diverged -- ${why}`); process.exit(1); };
const failPair = (msg) => { console.error(`FAIL: ${msg}`); process.exit(1); };

// Same two extractions the original check performed, factored out so they can be run
// against both the working tree and a HEAD blob.
function extractSection(readmeText) {
  const head = readmeText.indexOf('\n### Node support\n');
  if (head < 0) return null;
  const after = readmeText.slice(head + 1);
  const end = after.indexOf('\n### ', 1);
  return end < 0 ? after : after.slice(0, end);
}
function extractQuote(histText) {
  const open = histText.indexOf(FENCE);
  if (open < 0) return null;
  const close = open < 0 ? -1 : histText.indexOf('\n```', open + FENCE.length);
  if (close < 0) return null;
  return histText.slice(open + FENCE.length, close);
}
function readHeadBlob(relPath) {
  if (!ownToplevel) return null; // git anchor here doesn't belong to this checkout -- unknown
  try {
    return execFileSync('git', ['show', `HEAD:${relPath}`], {
      cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null; // not a git repo, no HEAD, git missing, or path not in HEAD -- all "unknown"
  }
}

const quote = extractQuote(hist);
if (quote === null) die(HIST, `it carries no "${FENCE.trim()}" block quoting ${RM}`);

// RV-9: a bare `section.includes(quote)` test treats '' and any short
// fragment as a valid "quote" -- every string is a substring of every string
// it is short enough to fit inside, so an empty or near-empty fence body
// passed vacuously (a 0-byte and a 3-byte body both "verified"). Two floors
// close that gap, checked on the quote ALONE before it is ever compared
// against README: a MINIMUM LENGTH (rules out vacuous/near-empty bodies) and
// a RULE-IDENTITY ANCHOR naming the clause that actually selects the cited
// run (rules out a fence padded just past the floor with something that
// isn't the rule). 80 sits comfortably below the real quote's 257 bytes and
// comfortably above a stray word or sentence fragment.
const MIN_QUOTE_LEN = 80;
const RULE_ANCHOR = 'the matrix run for the push that carried the last change to';
if (quote.length < MIN_QUOTE_LEN || !quote.includes(RULE_ANCHOR)) {
  die(HIST, `its "${FENCE.trim()}" block (${quote.length} byte(s)) is too short or does not name ` +
    `the selection rule's own clause ("${RULE_ANCHOR}") to be a real quote rather than a paraphrase ` +
    `or a vacuous fence. Diverging quote:\n${quote}`);
}

const section = extractSection(readme);
if (section === null) die(RM, `it has no "### Node support" section for ${HIST} to quote`);

if (!section.includes(quote)) {
  const where = readme.includes(quote)
    ? `${RM} does contain that text, but outside its "### Node support" section`
    : `no such text anywhere in ${RM}`;
  const detail = `its "${FENCE.trim()}" block is not a byte-identical substring of ${RM}'s ` +
    `"### Node support" section (${where}). Diverging quote:\n${quote}`;

  // Third anchor: compare each side's extraction against its own HEAD blob to see which
  // side actually moved since the last commit.
  const readmeHead = readHeadBlob(RM);
  const histHead = readHeadBlob(HIST);
  const readmeHeadSection = readmeHead === null ? null : extractSection(readmeHead);
  const histHeadQuote = histHead === null ? null : extractQuote(histHead);

  const readmeChanged = readmeHeadSection === null ? null : readmeHeadSection !== section;
  const histChanged = histHeadQuote === null ? null : histHeadQuote !== quote;

  if (readmeChanged !== null && histChanged !== null) {
    if (readmeChanged && !histChanged) {
      die(RM, `${RM}'s "### Node support" section no longer matches its own git HEAD version, ` +
        `while ${HIST}'s "${FENCE.trim()}" block is unchanged since HEAD -- README moved. ${detail}`);
    }
    if (histChanged && !readmeChanged) {
      die(HIST, detail);
    }
    if (readmeChanged && histChanged) {
      failPair(`${RM} and ${HIST} have both changed since git HEAD, and no longer agree -- ${detail}`);
    }
    // Neither side changed relative to HEAD yet they still disagree now (e.g. HEAD itself
    // was already broken). Direction genuinely isn't visible from this anchor.
  }

  failPair(`${RM} and ${HIST} disagree, and which one moved could not be determined ` +
    `(git HEAD comparison unavailable or inconclusive for at least one file) -- ${detail}`);
}

console.log(`OK: ${HIST} quotes ${RM} "### Node support" verbatim (${quote.length} bytes).`);
