// cycle 33 verification gate for the T-026 BOUNDARY act.
// The claim under test is narrow and therefore has to be proven narrowly:
// "this edit adds documentation and moves ZERO behavioural bytes."
// Reading the diff would only confirm I changed what I meant to; it cannot
// prove nothing else moved. So G3/G4 measure it (cycle-8 method).
const cp = require('child_process'), fs = require('fs');
const T = '/opt/targets/aphorism-cli';
const F = 'test/readme-tags.test.js';
const g = a => cp.execFileSync('git', ['-C', T, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

let ok = 0, bad = 0;
const chk = (name, pass, detail) => {
  console.log((pass ? 'PASS ' : 'FAIL ') + name.padEnd(46) + (detail || ''));
  pass ? ok++ : bad++;
};

// G2 -- README.md must be untouched.
const rdHead = g(['show', 'HEAD:README.md']);
const rdNow = fs.readFileSync(T + '/README.md', 'utf8');
chk('G2 README.md byte-identical to HEAD', rdHead === rdNow,
  rdHead.length + ' bytes');

// G3 -- every changed line in the diff is an ADDITION, and every addition is a
// comment line. A single non-comment addition, or any deletion, fails this.
const diff = g(['diff', '--unified=0', '--', F]);
const adds = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
const dels = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---'));
const nonComment = adds.filter(l => {
  const s = l.slice(1).trim();
  return s !== '' && !s.startsWith('//');
});
chk('G3a zero deletions in the diff', dels.length === 0, dels.length + ' deletions');
chk('G3b every added line is a comment', nonComment.length === 0,
  adds.length + ' added, ' + nonComment.length + ' non-comment');
if (nonComment.length) nonComment.slice(0, 5).forEach(l => console.log('        offending: ' + l));

// G4 -- the DISCRIMINATOR. Strip every full-line // comment and all blank lines
// from both arms; the remainders must be byte-identical. G3 alone would pass an
// edit that added a comment AND silently altered a line's trailing whitespace or
// reflowed code; this cannot, because it compares the surviving code bytes.
const strip = s => s.split('\n')
  .filter(l => { const t = l.trim(); return t !== '' && !t.startsWith('//'); })
  .join('\n');
const jsHead = g(['show', 'HEAD:' + F]);
const jsNow = fs.readFileSync(T + '/' + F, 'utf8');
const sh = strip(jsHead), sn = strip(jsNow);
chk('G4 code bytes identical after comment strip', sh === sn,
  sh.length + ' vs ' + sn.length + ' bytes');
if (sh !== sn) {
  for (let i = 0; i < Math.max(sh.length, sn.length); i++) {
    if (sh[i] !== sn[i]) {
      console.log('        first divergence at ' + i + ': ' +
        JSON.stringify(sh.slice(i - 60, i + 60)) + ' vs ' +
        JSON.stringify(sn.slice(i - 60, i + 60)));
      break;
    }
  }
}

// G5 -- NEGATIVE CONTROL. G4 is a PASS-shaped result: if `strip` were broken and
// returned '' for everything, G4 would pass vacuously. So prove strip can SEE a
// code change: inject one into a copy of the current file and require G4's
// comparison to FAIL against it.
const tampered = jsNow.replace('function lineHasBandToken(line) {',
  'function lineHasBandToken(line) { /*x*/ void 0;');
chk('G5 strip-sanity: a real code change IS seen',
  tampered !== jsNow && strip(tampered) !== sn,
  'control');

// G6 -- the added block must actually name the out-of-scope prose shape and the
// reason, which is what T-026's BOUNDARY acceptance clause requires. Checked as
// presence of the specific measured artefacts, not as word count.
const added = adds.map(l => l.slice(1)).join('\n');
const needs = ['Requires Node 18+ to run.', 'BOUNDARY', 'T-025', '78/76/2', 'T-024'];
const missing = needs.filter(n => !added.includes(n));
chk('G6 BOUNDARY comment names shape + reason', missing.length === 0,
  missing.length ? 'missing: ' + missing.join(', ') : needs.length + ' required elements');

// G7 -- no scratch debris (standing KI-7 control).
const scratch = fs.existsSync(T + '/.swarm/scratch');
chk('G7 KI-7: .swarm/scratch removed', !scratch,
  scratch ? 'STILL PRESENT' : 'absent');

console.log('\nGATE ' + ok + '/' + (ok + bad) + (bad ? '  -- ' + bad + ' FAILED' : ''));
