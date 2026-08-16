// cycle 55 gate — the refreshed WRAP_UP candidate set.
// Authored by the conductor AFTER the artifact was written, per hard rule 2, and gated
// against a NEGATIVE CONTROL (the sealed cycle-43 draft) per this run's own L-038:
// when you author both the artifact and its gate, add an arm whose outcome you cannot choose.
// Usage: node cycle-055-gate-candidates.mjs <new.md> <control.md>
import { readFileSync } from 'node:fs';

const [newPath, ctlPath] = process.argv.slice(2);
if (!newPath || !ctlPath) { console.error('need <new> <control>'); process.exit(3); }

// Candidate bullets only: top-level "- L-0NN [" lines.
const bullets = (t) => t.split('\n').filter((l) => /^- L-0\d\d \[/.test(l));

const CHECKS = [
  // --- cap / grammar: BOTH versions must pass. These bound the append, they do not discriminate.
  ['A  cap',        'exactly 5 candidate bullets',
    (t) => { const n = bullets(t).length; return [n === 5, `${n} bullets`]; }],
  ['B  ids',        'ids are exactly L-037..L-041, unique, from next_id 37',
    (t) => { const ids = bullets(t).map((l) => l.slice(2, 7)); const u = [...new Set(ids)].sort();
             return [u.length === 5 && u.join(',') === 'L-037,L-038,L-039,L-040,L-041', u.join(',')]; }],
  ['C  grammar',    'every bullet carries [confidence:] and [source:]',
    (t) => { const bad = bullets(t).filter((l) => !/\[confidence: /.test(l) || !/\[source: /.test(l));
             return [bad.length === 0, `${bad.length} malformed`]; }],
  ['D  roles',      'every [apply: prompt <role>] uses a real role',
    (t) => { const roles = [...t.matchAll(/\[apply: prompt (\w+)/g)].map((m) => m[1]);
             const bad = roles.filter((r) => !['all', 'builder', 'reviewer', 'qa'].includes(r));
             return [roles.length > 0 && bad.length === 0, `${roles.length} apply lines, bad=[${bad}]`]; }],
  ['H  cap-note',   'the 31-vs-20 cap breach and the 36 arithmetic are preserved',
    (t) => [/31 lessons against a stated cap of 20/.test(t) && /would make it 36/.test(t), 'cap paragraph'],
  ],
  ['I  ki5',        'KI-5 root cause names both missing scripts',
    (t) => [/swarm-budget\.sh/.test(t) && /swarm-playbook\.sh/.test(t), 'both named']],

  // --- DISCRIMINATING: only a set refreshed past cycle 50 can pass these.
  ['E* recency',    'candidates cite cycles 52, 53 AND 54',
    (t) => { const c = t.split('## The five candidates')[1] || '';
             const hit = ['52', '53', '54'].filter((n) => new RegExp(`cycle[s]? [^.\\n]*\\b${n}\\b`).test(c));
             return [hit.length === 3, `cycles cited: ${hit.join('/') || 'none'}`]; }],
  ['F* themes',     'the four cycle-52/54 themes are present by name',
    (t) => { const want = { 'coverage map': /coverage map/i, 'attribution-by-subtraction': /attribution.by.subtraction/i,
                            'witness arm': /WITNESS/, 'gate!=test': /not interchangeable evidence/i };
             const miss = Object.keys(want).filter((k) => !want[k].test(t));
             return [miss.length === 0, miss.length ? `missing: ${miss.join(', ')}` : 'all four']; }],
  ['G* lossless',   'every cycle-43 id has an explicit disposition (KEPT/MERGED/REWRITTEN/EXTENDED)',
    (t) => { const sec = (t.split('losslessness ledger')[1] || '').split('## The five candidates')[0];
             const miss = ['L-037', 'L-038', 'L-039', 'L-040', 'L-041']
               .filter((id) => !new RegExp(`\\| ${id}[^|]*\\|[^|]*(KEPT|MERGED|REWRITTEN|EXTENDED)`).test(sec));
             return [miss.length === 0, miss.length ? `no disposition: ${miss.join(',')}` : '5/5 disposed']; }],
  ['J* repair',     'the settings repair is stated with ABSOLUTE /opt/swarm/bin entries',
    (t) => [/Bash\(\/opt\/swarm\/bin\/swarm-budget\.sh:\*\)/.test(t)
         && /Bash\(\/opt\/swarm\/bin\/swarm-playbook\.sh:\*\)/.test(t), 'absolute entries']],
];

const run = (label, path) => {
  const t = readFileSync(path, 'utf8');
  let pass = 0, disc = 0;
  console.log(`\n--- ${label}: ${path}`);
  for (const [id, desc, fn] of CHECKS) {
    let ok, note;
    try { [ok, note] = fn(t); } catch (e) { ok = false; note = `THREW ${e.message}`; }
    if (ok) { pass++; if (id.includes('*')) disc++; }
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(12)} ${desc} :: ${note}`);
  }
  console.log(`${label} score ${pass}/${CHECKS.length} (discriminating ${disc}/4)`);
  return { pass, disc };
};

const n = run('NEW      ', newPath);
const c = run('CONTROL  ', ctlPath);

console.log('\n=== VERDICT ===');
const allPass = n.pass === CHECKS.length;
const controlFails = c.disc === 0;
console.log(`NEW passes every check      : ${allPass ? 'YES' : 'NO'} (${n.pass}/${CHECKS.length})`);
console.log(`CONTROL fails every disc arm: ${controlFails ? 'YES' : 'NO'} (${c.disc}/4 discriminating passed)`);
console.log(`GATE ${allPass && controlFails ? 'PASS' : 'FAIL'}  — ${n.pass}/${CHECKS.length} new, ${c.pass}/${CHECKS.length} control`);
process.exit(allPass && controlFails ? 0 : 1);
