const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const SRC = '/opt/targets/aphorism-cli';
const RD = fs.readFileSync(SRC + '/README.md', 'utf8');
const TF = fs.readFileSync(SRC + '/test/readme-tags.test.js', 'utf8');

function copy() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'c033-'));
  cp.execFileSync('bash', ['-c', 'cp -r ' + SRC + '/. ' + d + '/ && rm -rf ' + d + '/.git ' + d + '/.swarm']);
  return d;
}
function run(d) {
  let out;
  try {
    out = cp.execSync('node --test --test-reporter=tap test/*.test.js 2>&1',
      { cwd: d, encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const g = re => { const m = out.match(re); return m ? parseInt(m[1], 10) : null; };
  const tests = g(/^# tests (\d+)/m), pass = g(/^# pass (\d+)/m), fail = g(/^# fail (\d+)/m);
  const names = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1].trim());
  return { tests, pass, fail, names, raw: out };
}

// ---- README variants -------------------------------------------------
const H5 = '4 tags have a robust pool (5+ entries):';
const H24 = '12 tags appear 2–4 times:';
function insAfter(r, anchor, ins) {
  const i = r.indexOf(anchor);
  if (i < 0) throw new Error('anchor missing: ' + anchor);
  const e = i + anchor.length;
  return r.slice(0, e) + '\n' + ins + r.slice(e);
}
function dropRow(r, row) {
  if (!r.includes(row)) throw new Error('row missing: ' + row);
  return r.replace(row + '\n', '');
}
const V = {
  V0: r => r,
  V1: r => insAfter(r, H5, 'Requires Node 18+ to run.'),
  V1b: r => insAfter(r, H5, '\nRequires Node 18+ to run.\n'),
  V2: r => dropRow(insAfter(r, H5, 'Requires Node 18+ to run.'), '| `debugging` | 5 |'),
  V3: r => insAfter(r, H5, 'See the table below.'),
  // sibling theft: the 5+ heading loses its OWN table; the next table is the 2-4 band's
  VTHEFT: r => {
    const s = r.indexOf(H5) + H5.length, e = r.indexOf(H24);
    if (e < 0) throw new Error('theft anchors missing');
    return r.slice(0, s) + '\n\n' + r.slice(e);
  },
  // orphan: a table whose immediately preceding line carries no band token
  VORPHAN: r => insAfter(r, H5,
    'Some unrelated note.\n\n| Tag | Count |\n|---|---|\n| `design` | 13 |\n'),
  V4: r => r.replace('### `--list` behaviour', '### `--list` behavior'),
  V5: r => r.replace('### `--list` behaviour',
    '### Notes on `--list` behaviour\n\n`--list` is most useful piped into other tools.\n\n### `--list` behaviour'),
  // V6: an AMERICAN-spelled decoy heading alongside the real British one.
  // EVERY claim in both sections is TRUE. HEAD's British-only regex sees one
  // candidate; a widened /behaviou?r/ sees two. Prices T-027's real cost.
  V6: r => r.replace('### `--list` behaviour',
    '### Notes on `--list` behavior\n\n`--list` is most useful piped into other tools.\n\n### `--list` behaviour'),
  // V8 / V8CTL: does defect 2 (a prose line carrying a band token is PROMOTED to a
  // band heading and adopts the next table) go SILENT on a FALSE claim?
  // V8CTL is the control: the same false "7 tags" claim with NO prose line must be
  // caught (RED). V8 adds a prose line whose band token MATCHES the real band, so
  // the real heading aborts and a spurious [5,inf) band adopts its table with the
  // correct rows -- while the real heading's FALSE count is never examined.
  V8CTL: r => r.replace('4 tags have a robust pool (5+ entries):',
    '7 tags have a robust pool (5+ entries):'),
  V8: r => insAfter(r.replace('4 tags have a robust pool (5+ entries):',
    '7 tags have a robust pool (5+ entries):'),
    '7 tags have a robust pool (5+ entries):', 'Roughly 5+ entries each.'),
  // V9 / V10: THE CELL THAT SEPARATES THE TWO VERDICTS on Q1.
  // The classifier's fix requires a band heading to carry an "N tags" phrase,
  // arguing that is not a NEW anchor because a pre-existing test already demands
  // it of every real heading. V9 tests that claim directly: a band heading
  // reworded to drop the phrase, with EVERY remaining claim TRUE. If HEAD is RED
  // on V9, the phrase really is already mandatory and the argument holds.
  // V10 is the dangerous version -- same rewording, plus a FALSE count in that
  // band's table. HEAD must catch it. If the fix goes GREEN there, the fix buys
  // its repair with a SILENT hole, which is the cycle-28 disqualifier.
  V9: r => r.replace('4 tags have a robust pool (5+ entries):',
    'Robust pool (5+ entries):'),
  V10: r => r.replace('4 tags have a robust pool (5+ entries):',
    'Robust pool (5+ entries):').replace('| `design` | 13 |', '| `design` | 12 |'),
  // V10CTL: the same FALSE count with the heading left alone -- proves the guard
  // catches this defect normally, so a GREEN on V10 is attributable to the
  // rewording rather than to the count being unguarded in the first place.
  V10CTL: r => r.replace('| `design` | 13 |', '| `design` | 12 |'),
  // V7: the cycle-28 THEFT shape, rebuilt to defeat a CONTENT-based (non-positional)
  // disambiguator. The decoy carries a CORRECT-looking format literal; the REAL
  // section's literal is mutated so it no longer parses as a literal at all.
  // A disambiguator that picks "the candidate that has a literal" picks the DECOY
  // and goes GREEN on a README whose real section is wrong => SILENT.
  V7: r => {
    const real = '`<text> — <author>`';
    if (!r.includes(real)) throw new Error('real literal missing');
    const mutated = r.replace(real, '`<text> — <writer>`');
    return mutated.replace('### `--list` behaviour',
      '### Notes on `--list` behaviour\n\nEach aphorism is printed in the form `<text> — <author>`.\n\n### `--list` behaviour');
  },
};

// ---- guard-file arms -------------------------------------------------
const STOP_OLD = '      if (lineHasBandToken(lines[idx])) {';
const SPELL_OLD = String.raw`/\bbehaviour\b/i`;
const A = {
  HEAD: t => t,
  // F_MD: stop ONLY at a real markdown heading; digit-shape stop removed
  F_MD: t => {
    if (!t.includes(STOP_OLD)) throw new Error('stop anchor missing');
    return t.replace(STOP_OLD, '      if (/^\\s{0,3}#{1,6}\\s/.test(lines[idx])) {');
  },
  // F_BOTH: markdown heading OR band token (a strictly WIDER stop condition)
  F_BOTH: t => {
    if (!t.includes(STOP_OLD)) throw new Error('stop anchor missing');
    return t.replace(STOP_OLD,
      '      if (/^\\s{0,3}#{1,6}\\s/.test(lines[idx]) || lineHasBandToken(lines[idx])) {');
  },
  // F_SPELL: widen the British-spelling lock (Q3)
  F_SPELL: t => {
    if (!t.includes(SPELL_OLD)) throw new Error('spell anchor missing');
    return t.split(SPELL_OLD).join(String.raw`/\bbehaviou?r\b/i`);
  },
  // F_AGENT: the independent classifier's proposed HOLE fix, implemented as it
  // specified: a line is a band heading iff it carries a band token AND carries
  // an "N tags" count whose digits do NOT overlap that band token. Applied in
  // BOTH places (candidate eligibility and the stop rule), which is what it
  // said was required. Its argument for why the "N tags" anchor is not a NEW
  // prose anchor is that a pre-existing test already demands that phrase of
  // every real band heading -- cells V9/V10 below test exactly that claim.
  F_AGENT: t => {
    if (!t.includes(STOP_OLD)) throw new Error('stop anchor missing');
    const CAND = '    const headingLine = lines[i];';
    if (!t.includes(CAND)) throw new Error('candidate anchor missing');
    const helper = [
      'function lineLooksLikeBandHeading(line) {',
      '  const openEnded = line.match(/(\\d+)\\s*\\+/);',
      '  const rangePair = line.match(/(\\d+)\\s*[-‐‑‒–—―]\\s*(\\d+)/);',
      '  const bandMatch = openEnded || rangePair;',
      '  if (!bandMatch) return false;',
      '  const bandStart = bandMatch.index;',
      '  const bandEnd = bandMatch.index + bandMatch[0].length;',
      '  const countPattern = /(\\d+)\\s+tags\\b/g;',
      '  let m;',
      '  while ((m = countPattern.exec(line)) !== null) {',
      '    const digitStart = m.index;',
      '    const digitEnd = m.index + m[1].length;',
      '    if (!(digitStart < bandEnd && digitEnd > bandStart)) return true;',
      '  }',
      '  return false;',
      '}',
      '',
    ].join('\n');
    return t
      .replace('function lineHasBandToken(line) {', helper + 'function lineHasBandToken(line) {')
      .replace(STOP_OLD, '      if (lineLooksLikeBandHeading(lines[idx])) {')
      .replace(CAND, CAND + '\n    if (!lineLooksLikeBandHeading(headingLine)) continue;');
  },
  // F_COLON: the escape hatch my sealed prediction claimed does not exist.
  // Stop only at a line that carries a band token AND looks like a band
  // HEADING by typography (trailing colon). "Requires Node 18+ to run." has
  // a band token but no trailing colon; "12 tags appear 2-4 times:" has both.
  // If this passes every cell, T-026 is a HOLE and my prediction is WRONG.
  F_COLON: t => {
    if (!t.includes(STOP_OLD)) throw new Error('stop anchor missing');
    return t.replace(STOP_OLD,
      '      if (lineHasBandToken(lines[idx]) && /:\\s*$/.test(lines[idx])) {');
  },
  // F_CONTENT: the candidate NON-POSITIONAL disambiguator for Q2/T-028.
  // When more than one heading qualifies, keep only those whose own section
  // body carries a `<text>...<author>` format literal. Not first-match, not
  // last-match -- it reads content. This is the strongest non-positional rule
  // available, so if it goes SILENT on V7 the whole approach is refuted.
  F_CONTENT: t => {
    const anchor = '  const start = candidates[0].index;';
    if (!t.includes(anchor)) throw new Error('content anchor missing');
    const repl = [
      '  function sectionEndFor(s) {',
      "    const n3 = readmeContent.indexOf('\\n### ', s + 1);",
      "    const n2 = readmeContent.indexOf('\\n## ', s + 1);",
      '    const bs = [n3, n2].filter((i) => i > -1);',
      '    return bs.length > 0 ? Math.min(...bs) : readmeContent.length;',
      '  }',
      '  let winners = candidates;',
      '  if (candidates.length > 1) {',
      '    winners = candidates.filter((c) =>',
      '      /`<text>(.*?)<author>`/.test(readmeContent.substring(c.index, sectionEndFor(c.index))));',
      '  }',
      '  if (winners.length !== 1) {',
      "    assert.fail('ambiguous after content filter: ' + winners.length + ' candidates');",
      '  }',
      '  const start = winners[0].index;',
    ].join('\n');
    // remove HEAD's hard ambiguity assert so the content filter is what decides
    const amb = t.indexOf('  assert.equal(\n    candidates.length,\n    1,');
    if (amb < 0) throw new Error('ambiguity assert anchor missing');
    const ambEnd = t.indexOf('  );', amb) + 4;
    const stripped = t.slice(0, amb) + t.slice(ambEnd);
    if (!stripped.includes(anchor)) throw new Error('anchor lost after strip');
    return stripped.replace(anchor, repl);
  },
};

for (const c of process.argv.slice(2)) {
  const [vn, an] = c.split(':');
  const d = copy();
  const rd = V[vn](RD), tf = A[an](TF);
  fs.writeFileSync(d + '/README.md', rd);
  fs.writeFileSync(d + '/test/readme-tags.test.js', tf);
  // POSTCONDITION: the mutation must actually be present in what the guard reads
  const back = fs.readFileSync(d + '/README.md', 'utf8');
  const tback = fs.readFileSync(d + '/test/readme-tags.test.js', 'utf8');
  const landed = vn === 'V0' ? back === RD : back !== RD;
  const tlanded = an === 'HEAD' ? tback === TF : tback !== TF;
  const r = run(d);
  console.log(c.padEnd(16) + ' md=' + (landed ? 'Y' : 'N') + ' js=' + (tlanded ? 'Y' : 'N') +
    '  tests=' + r.tests + ' pass=' + r.pass + ' fail=' + r.fail +
    '  ' + (r.fail === 0 ? 'GREEN' : 'RED'));
  r.names.forEach(n => console.log('       X ' + n));
  if (r.tests === null) console.log('       UNPARSEABLE:\n' + r.raw.slice(0, 900));
  cp.execFileSync('rm', ['-rf', d]);
}
