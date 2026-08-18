#!/usr/bin/env node
// cycle-012 verification harness for I-5 (shared playbook dedupe).
// Authored by the CONDUCTOR at verification time, after the edit, per hard rule 2.
//
// Claim under test: the edit renumbered exactly three colliding lesson IDs and the
// next_id header, changed NOTHING else, lost NO lesson, and left the file free of
// duplicate IDs -- while the 20-lesson cap violation REMAINS open by design.
//
// The real validator (bin/swarm-playbook.sh validate) could not be executed: the
// script is not on the Bash allowlist in this headless session (KI-5). The grammar
// regex below is TRANSCRIBED from that script's RE_LESSON and is therefore an
// assumption, not an authority -- which is why every detector here carries a
// negative control proving it can fire.

const fs = require('fs');
const cp = require('child_process');

const LIVE = '/opt/swarm/playbook/learnings.md';
const ARCH = '/opt/swarm/playbook/learnings.md.pre-I5-1786803951';

const live = fs.readFileSync(LIVE, 'utf8');
const arch = fs.readFileSync(ARCH, 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`PASS  ${name}  :: ${detail}`); }
  else { fail++; console.log(`FAIL  ${name}  :: ${detail}`); }
};

// --- transcribed from bin/swarm-playbook.sh (TAGS/CONF/RE_LESSON) -------------
const TAGS = 'routing|wave|qa|prompt|process';
const CONF = 'low|med|high';
const RE_LESSON = new RegExp(
  `^- L-[0-9]{3} \\[(${TAGS})\\] [^\\[\\]]+( \\[apply: [^\\[\\]]+\\])? ` +
  `\\[confidence: (${CONF})\\]( \\[observed: [1-9][0-9]*\\])? \\[source: [^\\[\\]]+\\]$`
);

const lessons = (s) => s.split('\n').filter((l) => l.startsWith('- L-'));
const idOf = (l) => l.slice(2, 7);
const bodyOf = (l) => l.slice(7); // everything after "- L-NNN"
const dupes = (arr) => {
  const seen = new Map();
  arr.forEach((id) => seen.set(id, (seen.get(id) || 0) + 1));
  return [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id}x${n}`);
};

const liveL = lessons(live), archL = lessons(arch);

// C1 -- the archive is the true pre-edit state: byte-identical to git HEAD.
const head = cp.execFileSync('git', ['-C', '/opt/swarm', 'show', 'HEAD:playbook/learnings.md'],
  { encoding: 'utf8' });
ok('C1 archive is byte-identical to git HEAD version', head === arch,
  `HEAD ${head.length}B vs archive ${arch.length}B`);

// C2 -- exactly four lines differ, and they are the four intended ones.
const lv = live.split('\n'), av = arch.split('\n');
ok('C2a line COUNT unchanged', lv.length === av.length, `${av.length} -> ${lv.length}`);
const diffIdx = av.map((_, i) => i).filter((i) => av[i] !== lv[i]);
ok('C2b exactly 4 lines differ', diffIdx.length === 4, `changed line numbers: ${diffIdx.map((i) => i + 1)}`);
// Tokenised, not prefix-sliced: extract the id AND the tag so this pins WHICH of each
// colliding pair moved. (v1 of this check compared 12-char prefixes and mis-failed on a
// literal I typed one byte short -- fixed by making it exact, never by loosening it.)
const tok = (l) => {
  const m = /^- (L-[0-9]{3}) \[([a-z]+)\]/.exec(l);
  return m ? `${m[1]}/${m[2]}` : l; // non-lesson lines (the header) compare whole
};
const changed = diffIdx.map((i) => [tok(av[i]), tok(lv[i])]);
ok('C2c the 4 changes are next_id + the 3 intended id/tag pairs',
  JSON.stringify(changed) === JSON.stringify([
    ['next_id: 34', 'next_id: 37'],
    ['L-023/qa', 'L-034/qa'],           // moon's [qa] REFUTE lesson moved
    ['L-025/process', 'L-035/process'], // moon's [process] numeric-bound lesson moved
    ['L-026/process', 'L-036/process'], // moon's [process] captured-output lesson moved
  ]), JSON.stringify(changed));
// C2d -- the repo-atlas half of each collision KEPT its id, with its original tag.
const keptTags = ['L-023/process', 'L-025/qa', 'L-026/routing'];
const liveToks = liveL.map(tok);
ok('C2d repo-atlas half of each collision kept its id and tag',
  keptTags.every((t) => liveToks.includes(t)), keptTags.join(', '));

// C3 -- ID-token surgery only: substituting the old ID back reproduces the archive byte-for-byte.
const remap = { 'L-034': 'L-023', 'L-035': 'L-025', 'L-036': 'L-026' };
let restored = live.replace('next_id: 37', 'next_id: 34');
for (const [nu, old] of Object.entries(remap)) restored = restored.replace(`- ${nu} `, `- ${old} `);
ok('C3 reverting only the ID tokens reproduces the archive EXACTLY', restored === arch,
  restored === arch ? 'byte-identical' : 'DIVERGES -- non-ID bytes were touched');

// C4 -- no duplicate IDs remain.
const liveDupes = dupes(liveL.map(idOf));
ok('C4 zero duplicate ids in the edited file', liveDupes.length === 0,
  liveDupes.length ? liveDupes.join(',') : 'all ids unique');

// C5 -- NEGATIVE CONTROL: the same detector must fire on the archive.
const archDupes = dupes(archL.map(idOf));
ok('C5 [negative control] dup detector fires on the pre-edit archive',
  archDupes.length === 3, archDupes.join(',') || 'NONE -- detector is blind');

// C6 -- nothing lost.
ok('C6 lesson count unchanged', liveL.length === archL.length,
  `${archL.length} -> ${liveL.length}`);

// C7 -- LOSSLESS: the multiset of lesson BODIES (tag/text/apply/confidence/source)
// is identical; only ID tokens moved. A dropped, reworded or re-tagged lesson fails here.
const sortedBodies = (arr) => arr.map(bodyOf).sort();
ok('C7 lesson bodies are an identical multiset (only ids moved)',
  JSON.stringify(sortedBodies(liveL)) === JSON.stringify(sortedBodies(archL)),
  `${liveL.length} bodies compared`);

// C8 -- the three new IDs never existed before: no ID was re-minted.
const archIds = new Set(archL.map(idOf));
const reminted = Object.keys(remap).filter((id) => archIds.has(id));
ok('C8 new ids were never used before (no re-mint)', reminted.length === 0,
  reminted.length ? `RE-MINTED: ${reminted}` : 'L-034/035/036 absent from archive');

// C9 -- next_id header stays above every ID present.
const nid = parseInt(/^next_id: ([0-9]+)$/m.exec(live)[1], 10);
const maxId = Math.max(...liveL.map((l) => parseInt(idOf(l).slice(2), 10)));
ok('C9 next_id exceeds max id present', nid > maxId, `next_id ${nid} > max L-${maxId}`);

// C10 -- grammar: every lesson line matches the transcribed validator regex.
const bad = liveL.filter((l) => !RE_LESSON.test(l)).map(idOf);
ok('C10 every lesson matches the transcribed grammar', bad.length === 0,
  bad.length ? `malformed: ${bad}` : `${liveL.length}/${liveL.length} well-formed`);

// C11 -- NEGATIVE CONTROL: the grammar detector must reject a known-bad line.
const bogus = [
  '- L-999 [nosuchtag] text [confidence: high] [source: 2026-01-01 x]',
  '- L-99 [qa] short id [confidence: high] [source: 2026-01-01 x]',
  '- L-999 [qa] missing confidence [source: 2026-01-01 x]',
];
const rejected = bogus.filter((l) => !RE_LESSON.test(l)).length;
ok('C11 [negative control] grammar detector rejects 3 synthetic bad lines',
  rejected === 3, `${rejected}/3 rejected`);

// C12 -- the REMAINING defect is measured, not assumed: the cap is still breached,
// which is exactly what the handoff note hands to a human.
ok('C12 cap violation still OPEN (asserted, not assumed)', liveL.length > 20,
  `${liveL.length} lessons vs documented cap 20 -- overflow ${liveL.length - 20}`);

// C13 -- every ledger reference the TOOLING JOINS ON resolves unambiguously.
// v1 of this check scanned the whole ledger line and fired on the trailing prose note
// ("duplicate L-023/L-025/L-026 in learnings.md") -- accurate prose, not a join key.
// Narrowed to the applied=/vetoed= fields, which is what `stats` actually joins,
// and given its own negative control below so the narrowing cannot hide a real hit.
const ledger = fs.readFileSync('/opt/swarm/playbook/applied.log', 'utf8');
const disputed = ['L-023', 'L-025', 'L-026'];
const joinKeys = (line) => (line.match(/(?:applied|vetoed)=([^|]*)/g) || [])
  .flatMap((f) => f.split('=')[1].split(',')).map((s) => s.trim()).filter(Boolean);
const bareRefs = ledger.split('\n').filter(Boolean).flatMap((line, i) =>
  joinKeys(line).filter((k) => disputed.includes(k)).map((k) => `line${i + 1}:${k}`));
ok('C13 no ledger JOIN KEY references a disputed id without a source suffix',
  bareRefs.length === 0,
  bareRefs.length ? `ambiguous: ${bareRefs}` : 'join keys clean; only suffixed refs (L-023-moon, L-026-repo-atlas)');

// C13b -- NEGATIVE CONTROL: the narrowed detector must still catch a bare join-key ref.
const synth = '2026-01-01 | mode=auto | applied=L-003,L-023 | vetoed=L-025 | targets=x';
const synthHits = joinKeys(synth).filter((k) => disputed.includes(k));
ok('C13b [negative control] narrowed detector catches bare ids in applied=/vetoed=',
  synthHits.length === 2, `caught ${JSON.stringify(synthHits)} in a synthetic ledger line`);

console.log(`\n${pass}/${pass + fail} checks passed`);
process.exit(fail ? 1 : 0);
