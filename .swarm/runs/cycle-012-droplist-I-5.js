#!/usr/bin/env node
// Computes, WITHOUT applying, the cull the playbook's documented overflow rule would
// produce if extrapolated from "drop one on append" to "shed 11 at once".
// Output feeds the human handoff note. Nothing here writes to the playbook.
const fs = require('fs');
const CAP = 20;
const live = fs.readFileSync('/opt/swarm/playbook/learnings.md', 'utf8');
const ledger = fs.readFileSync('/opt/swarm/playbook/applied.log', 'utf8');

const lessons = live.split('\n').filter((l) => l.startsWith('- L-')).map((l, i) => ({
  order: i,
  id: l.slice(2, 7),
  tag: /\[([a-z]+)\]/.exec(l)[1],
  conf: /\[confidence: ([a-z]+)\]/.exec(l)[1],
  src: /\[source: ([^\]]+)\]/.exec(l)[1],
  hasApply: l.includes('[apply: '),
}));

// how many past ledger lines applied each id (bare or source-suffixed)
const applyCount = (id) => ledger.split('\n').filter(Boolean)
  .filter((line) => new RegExp(`applied=[^|]*\\b${id}(-[a-z-]+)?\\b`).test(line)).length;

const survivors = lessons.slice();
const dropped = [];
while (survivors.length > CAP) {
  let idx = survivors.findIndex((l) => l.conf !== 'high');       // oldest non-high
  if (idx === -1) idx = 0;                                       // else oldest overall
  dropped.push(survivors.splice(idx, 1)[0]);
}

console.log(`lessons ${lessons.length} · cap ${CAP} · must shed ${lessons.length - CAP}\n`);
console.log('WOULD DROP (in rule order):');
for (const d of dropped) {
  const n = applyCount(d.id);
  console.log(`  ${d.id} [${d.tag}] conf=${d.conf} src=${d.src}` +
    `${d.hasApply ? '  <-- carries [apply:]' : ''}${n ? `  <-- applied by ${n} past run(s)` : ''}`);
}
const costly = dropped.filter((d) => d.hasApply);
console.log(`\n${dropped.length} dropped, of which ${costly.length} carry an [apply:] directive: ` +
  costly.map((d) => d.id).join(', '));
console.log('SURVIVORS: ' + survivors.map((s) => s.id).join(', '));
