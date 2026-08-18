// cycle 46 / T-007 — consolidate the tag taxonomy by a MECHANICAL fold map.
//
// The transform is a pure rename-and-dedupe over the tags arrays. No aphorism
// text is touched, no author is touched, no entry is added or removed. Every
// mapping below is a rename of a low-count tag onto an existing neighbour that
// the same entry's subject matter already sits under; tags not named here keep
// their own name. Written as a table so the edit is auditable line by line
// rather than resting on the conductor's taste per entry.
//
// Usage:  node cycle-046-retag.mjs --check   (report only, writes nothing)
//         node cycle-046-retag.mjs --apply   (rewrite src/corpus.js in place)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const CORPUS = path.join(ROOT, 'src', 'corpus.js');

export const FOLD = {
  // performance family: what makes code fast, and when not to care
  optimization: 'performance',
  algorithms: 'performance',
  caching: 'performance',
  // readability family: what makes code legible to a human
  naming: 'readability',
  style: 'readability',
  // simplicity family: doing less on purpose
  elegance: 'simplicity',
  yagni: 'simplicity',
  focus: 'simplicity',
  // complexity family: the cost of what you cannot hold in your head
  abstraction: 'complexity',
  humility: 'complexity',
  // design family: how the pieces are arranged
  architecture: 'design',
  dependencies: 'design',
  data: 'design',
  // reliability family: behaving correctly at the edges and across systems
  errors: 'reliability',
  robustness: 'reliability',
  interoperability: 'reliability',
  // language family: the medium itself, including its historical mistakes
  history: 'language',
  // philosophy family: what the discipline is about
  innovation: 'philosophy',
  // teamwork family: people, organisations, and how they shape software
  culture: 'teamwork',
  management: 'teamwork',
  organization: 'teamwork',
  psychology: 'teamwork',
  opensource: 'teamwork',
  // process family: how work is sequenced and habits are formed
  habits: 'process',
  pragmatism: 'process',
  // debugging family: finding out that it is wrong
  testing: 'debugging',
};

export function foldTags(tags) {
  const out = [];
  for (const t of tags) {
    const mapped = Object.prototype.hasOwnProperty.call(FOLD, t) ? FOLD[t] : t;
    if (!out.includes(mapped)) out.push(mapped); // dedupe, first-appearance order
  }
  return out;
}

const TAGS_LINE = /^(\s*)tags: \[([^\]]*)\],\s*$/;

function parseLiteralList(inner) {
  return inner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^'([^']*)'$/) || s.match(/^"([^"]*)"$/);
      if (!m) throw new Error('unparsable tag literal: ' + s);
      return m[1];
    });
}

export function rewrite(source) {
  const lines = source.split('\n');
  let touched = 0;
  const before = [];
  const after = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(TAGS_LINE);
    if (!m) continue;
    const olds = parseLiteralList(m[2]);
    const news = foldTags(olds);
    before.push(olds);
    after.push(news);
    lines[i] = `${m[1]}tags: [${news.map((t) => `'${t}'`).join(', ')}],`;
    touched++;
  }
  return { text: lines.join('\n'), touched, before, after };
}

const mode = process.argv[2] || '--check';
const src = fs.readFileSync(CORPUS, 'utf8');
const r = rewrite(src);

const counts = {};
for (const tags of r.after) for (const t of tags) counts[t] = (counts[t] || 0) + 1;
const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));

console.log(`entries with a tags line: ${r.touched}`);
console.log(`resulting vocabulary: ${sorted.length} tags`);
console.log(sorted.map((t) => `${t}:${counts[t]}`).join('  '));
const thin = sorted.filter((t) => counts[t] < 3);
console.log(`tags below 3 entries: ${thin.length} ${JSON.stringify(thin)}`);
const tagless = r.after.filter((t) => t.length === 0).length;
console.log(`entries left with zero tags: ${tagless}`);

if (mode === '--apply') {
  fs.writeFileSync(CORPUS, r.text);
  console.log('APPLIED to ' + CORPUS);
} else {
  console.log('check only — nothing written');
}
