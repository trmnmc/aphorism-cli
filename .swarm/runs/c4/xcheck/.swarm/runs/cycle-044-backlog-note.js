const fs = require('fs');
const p = '/opt/targets/aphorism-cli/.swarm/backlog.json';
const b = JSON.parse(fs.readFileSync(p, 'utf8'));
const by = Object.fromEntries(b.items.map(i => [i.id, i]));

const NOTE = ' || CYCLE 44 REACHABILITY AUDIT — read this before assuming a bigger window revives this item. ' +
  'It will not. This item is S-EFFORT, which gear 1 already admits, so the zero allowance is NOT what held it ' +
  'this run: a standing measured decision is. Cycles 41-43 recorded that all six remaining todos "need a builder ' +
  'because the allowance is 0"; that framing is true of the run and false of this item, and cycle 44 corrected it ' +
  '(gate S6/S8a/S8b/S8c with two-way discriminators, .swarm/runs/cycle-044-verify-reachability.txt). ' +
  'The unblocker is the M-effort T-024 umbrella landing, or a BOUNDARY argued against a measurement per SPEC I-2 ' +
  '— not more clock. See REPORT.md § Unfinished work.';

for (const id of ['T-024b', 'T-032', 'T-039']) {
  by[id].notes = (by[id].notes || '') + NOTE;
}

fs.writeFileSync(p + '.tmp', JSON.stringify(b, null, 2));
fs.renameSync(p + '.tmp', p);
console.log('annotated: T-024b, T-032, T-039');
const c = {};
for (const i of b.items) c[i.status] = (c[i.status] || 0) + 1;
console.log('backlog counts:', JSON.stringify(c));
