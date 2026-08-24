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
//
// Second attribution fix (the RULE_ANCHOR used to be a frozen literal copy of the selection
// rule's wording): a CONSISTENT reword of that clause -- same new words landing in BOTH
// README and HIST, so HIST still quotes README byte-identically -- used to fail anyway,
// because the frozen literal itself wasn't reworded and so no longer appeared in either
// file, and the failure blamed HIST unconditionally even though HIST did exactly the right
// thing. That was the same frozen-literal defect one layer up. The fix below derives the
// anchor from README's own LIVE section instead of hardcoding its wording (see
// extractRuleAnchor), so a consistent reword updates the anchor along with it. The one case
// that still can't be a plain "does not contain the live anchor" -> blame-HIST verdict is
// when HIST's fence IS a byte-identical substring of README's current section (nothing to
// attribute-by-git-HEAD -- both sides currently agree on those bytes) but that substring
// still isn't the rule (e.g. it's the results table): that is unambiguously HIST quoting the
// wrong part of a README it otherwise agrees is current, so it is blamed directly. Every
// other divergence -- including "only README's live section changed, HIST's fence is stale
// and no longer even contains README's new wording" -- runs through the same git-HEAD
// attribution machinery as any other substring mismatch, so README gets blamed when README
// is the side that actually moved.
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

// README renders the commit its cited matrix ran against as a backtick-quoted hash
// immediately followed by a parenthesized YYYY-MM-DD date and a comma -- e.g.
// "`02f4668` (2026-08-24),". That template is DATA, regenerated fresh every cycle by
// whoever re-cites a run; it is not prose anyone rewords for style, unlike the rule clause
// itself. The selection rule's own clause always sits immediately after that citation and
// runs up to the next backtick-quoted token (the opening backtick of the `src/`/`bin/`/
// `test/` pathspec that closes the clause). Whatever words currently occupy that span ARE
// the rule, however they're phrased on this run -- so this reads the anchor out of README
// structurally instead of freezing a copy of its current wording. Returns null (never a
// guess) when README's section doesn't carry exactly one such citation to anchor against --
// zero is a section that lost its citation shape, more than one is ambiguous, and picking
// one by position would silently anchor against the wrong citation.
const CITATION_PATTERN = /`[0-9a-fA-F]{6,40}`\s*\(\d{4}-\d{2}-\d{2}\),\s*/g;
function extractRuleAnchor(sectionText) {
  const citations = [...sectionText.matchAll(CITATION_PATTERN)];
  if (citations.length !== 1) return null;
  const after = sectionText.slice(citations[0].index + citations[0][0].length);
  const nextTick = after.indexOf('`');
  if (nextTick < 0) return null;
  const anchor = after.slice(0, nextTick).trim();
  return anchor.length > 0 ? anchor : null;
}

const quote = extractQuote(hist);
if (quote === null) die(HIST, `it carries no "${FENCE.trim()}" block quoting ${RM}`);

// RV-9: a bare `section.includes(quote)` test treats '' and any short
// fragment as a valid "quote" -- every string is a substring of every string
// it is short enough to fit inside, so an empty or near-empty fence body
// passed vacuously (a 0-byte and a 3-byte body both "verified"). 80 sits
// comfortably below the real quote's 257 bytes and comfortably above a stray
// word or sentence fragment.
const MIN_QUOTE_LEN = 80;
if (quote.length < MIN_QUOTE_LEN) {
  die(HIST, `its "${FENCE.trim()}" block (${quote.length} byte(s)) is shorter than the ` +
    `${MIN_QUOTE_LEN}-byte floor, so it cannot be a real quote rather than a vacuous or ` +
    `near-empty fence. Diverging quote:\n${quote}`);
}

const section = extractSection(readme);
if (section === null) die(RM, `it has no "### Node support" section for ${HIST} to quote`);

const ruleAnchor = extractRuleAnchor(section);
if (ruleAnchor === null) {
  die(RM, `its "### Node support" section does not name exactly one backtick-quoted commit ` +
    `hash followed by a parenthesized date (e.g. "\`02f4668\` (2026-08-24),") -- that citation ` +
    `is the structural marker this check anchors the selection rule's own clause against, and ` +
    `without it there is nothing to hold ${HIST}'s quote to.`);
}

// A RULE-IDENTITY ANCHOR closes the gap a bare length floor leaves open: a fence padded just
// past 80 bytes with something that isn't the rule (e.g. the results table) would otherwise
// pass. `ruleAnchor` is derived live from README above, so a CONSISTENT reword of the rule
// clause -- same new wording landing in both README and HIST -- moves the anchor right along
// with it instead of leaving a stale literal behind.
const hasAnchor = quote.includes(ruleAnchor);
const isSubstring = section.includes(quote);

if (isSubstring && !hasAnchor) {
  // Nothing to attribute by git HEAD here: HIST's fence is a byte-identical fragment of
  // README's CURRENT section, so both sides already agree on those exact bytes -- README
  // has not "moved" relative to this content. It just isn't the rule (e.g. it's the results
  // table). That is unambiguously HIST quoting the wrong part of a README it otherwise
  // agrees is current.
  die(HIST, `its "${FENCE.trim()}" block (${quote.length} byte(s)) is a byte-identical substring ` +
    `of ${RM}'s "### Node support" section, but does not contain the selection rule's own ` +
    `clause -- as currently worded in ${RM}, that clause is "${ruleAnchor}" -- so it quotes some ` +
    `other part of the section rather than the rule. Diverging quote:\n${quote}`);
}

if (!isSubstring) {
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
