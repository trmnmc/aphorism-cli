#!/usr/bin/env node
// Asserts that docs/node-support-citation-history.md quotes README.md's citation-selection
// rule VERBATIM, and quotes it from README's own "### Node support" section.
// Not a test: deliberately outside test/ and outside the README citation's pathspec.
//   node tools/citation-rule-check.mjs     exit 0 = byte-identical, exit 1 = diverged
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const RM = 'README.md', HIST = 'docs/node-support-citation-history.md';
const FENCE = '```readme-quote\n';
const readme = readFileSync(new URL(RM, root), 'utf8');
const hist = readFileSync(new URL(HIST, root), 'utf8');
const die = (who, why) => { console.error(`FAIL: ${who} has diverged -- ${why}`); process.exit(1); };
const open = hist.indexOf(FENCE);
const close = open < 0 ? -1 : hist.indexOf('\n```', open + FENCE.length);
if (open < 0 || close < 0) die(HIST, `it carries no "${FENCE.trim()}" block quoting ${RM}`);
const quote = hist.slice(open + FENCE.length, close);
const head = readme.indexOf('\n### Node support\n');
if (head < 0) die(RM, `it has no "### Node support" section for ${HIST} to quote`);
const after = readme.slice(head + 1);
const end = after.indexOf('\n### ', 1);
const section = end < 0 ? after : after.slice(0, end);
if (!section.includes(quote)) {
  const where = readme.includes(quote)
    ? `${RM} does contain that text, but outside its "### Node support" section`
    : `no such text anywhere in ${RM}`;
  die(HIST, `its "${FENCE.trim()}" block is not a byte-identical substring of ${RM}'s ` +
    `"### Node support" section (${where}). Diverging quote:\n${quote}`);
}
console.log(`OK: ${HIST} quotes ${RM} "### Node support" verbatim (${quote.length} bytes).`);
