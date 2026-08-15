'use strict';
const cp = require('child_process');
const path = require('path');

const CWD = '/opt/targets/aphorism-cli';
const BIN = path.join(CWD, 'bin', 'aphorism.js');

function run(argv) {
  const res = cp.spawnSync('node', [BIN].concat(argv), { encoding: 'utf8', cwd: CWD });
  return {
    argv: argv,
    status: res.status,
    signal: res.signal,
    stdout: res.stdout === null ? '' : res.stdout,
    stderr: res.stderr === null ? '' : res.stderr,
  };
}

function bytesEqual(a, b) {
  return Buffer.from(a, 'utf8').equals(Buffer.from(b, 'utf8'));
}

function parseNdjson(stdout) {
  var lines = stdout.split('\n').filter(function (l) { return l.length > 0; });
  return lines.map(function (l) { return JSON.parse(l); });
}

var out = { results: {} };

function s1() {
  var r1 = run(['--seed', '42', '--json']);
  var r2 = run(['--seed', '42', '--json']);
  var r3 = run(['--seed', '42']);
  var r4 = run(['--seed', 'Infinity', '--json']);
  var r5 = run(['--seed', 'Infinity', '--json']);
  var r6 = run(['--seed', '-2.5', '--json']);
  var r7 = run(['--seed', '-2.5', '--json']);

  var runs = { r1: r1, r2: r2, r3: r3, r4: r4, r5: r5, r6: r6, r7: r7 };
  var allExit0 = Object.keys(runs).every(function (k) { return runs[k].status === 0; });
  var allStderrEmpty = Object.keys(runs).every(function (k) { return runs[k].stderr === ''; });

  var r1Json = null, r1ParseErr = null;
  try {
    var trimmed = r1.stdout.replace(/\n$/, '');
    var lc = trimmed.split('\n').length;
    if (lc !== 1) throw new Error('r1 stdout not single line, lines=' + lc);
    r1Json = JSON.parse(trimmed);
  } catch (e) { r1ParseErr = String(e); }

  var pair12 = bytesEqual(r1.stdout, r2.stdout);
  var pair45 = bytesEqual(r4.stdout, r5.stdout);
  var pair67 = bytesEqual(r6.stdout, r7.stdout);

  var r3ContainsText = null;
  if (r1Json && typeof r1Json.text === 'string') {
    r3ContainsText = r3.stdout.indexOf(r1Json.text) !== -1;
  }

  out.results.S1 = {
    runs: runs, allExit0: allExit0, allStderrEmpty: allStderrEmpty,
    r1Json: r1Json, r1ParseErr: r1ParseErr,
    pair12: pair12, pair45: pair45, pair67: pair67, r3ContainsText: r3ContainsText,
  };
}
s1();

function s2() {
  var r1 = run(['--list']);
  var r2 = run(['--list', '--seed', '999']);
  var r3 = run(['--list', '--seed', 'abc']);

  var lines1 = r1.stdout.split('\n').filter(function (l) { return l.length > 0; });
  var emDashRe = /^.+ — .+$/;
  var allLinesMatch = lines1.every(function (l) { return emDashRe.test(l); });
  var hasPlainHyphenInstead = lines1.some(function (l) { return / - /.test(l) && !/ — /.test(l); });

  out.results.S2 = {
    r1: { status: r1.status, stderr: r1.stderr, lineCount: lines1.length, allLinesMatchEmDash: allLinesMatch, sampleLines: lines1.slice(0, 3), hasPlainHyphenInstead: hasPlainHyphenInstead },
    r2: { status: r2.status, stderr: r2.stderr, byteIdenticalToR1: bytesEqual(r1.stdout, r2.stdout) },
    r3: { status: r3.status, stdout: r3.stdout, stdoutBytes: Buffer.byteLength(r3.stdout, 'utf8'), stderr: r3.stderr },
  };
}
s2();

var harvestRun = run(['--list', '--json']);
var harvest = null, harvestErr = null;
try {
  harvest = parseNdjson(harvestRun.stdout);
} catch (e) { harvestErr = String(e); }

out.harvest_meta = {
  status: harvestRun.status,
  stderr: harvestRun.stderr,
  count: harvest ? harvest.length : null,
  harvestErr: harvestErr,
  sample: harvest ? harvest.slice(0, 2) : null,
};

function s3() {
  if (!harvest) {
    out.results.S3 = { blocked: true, reason: 'harvest failed', harvestErr: harvestErr };
    return;
  }
  var tagCounts = new Map();
  harvest.forEach(function (e) {
    (e.tags || []).forEach(function (t) {
      if (t.length >= 2) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
  });
  var candidateTags = Array.from(tagCounts.keys());
  if (candidateTags.length === 0) {
    var allTagsSeen = Array.from(new Set(harvest.reduce(function (a, e) { return a.concat(e.tags || []); }, [])));
    out.results.S3 = { blocked: true, reason: 'no tag of length >=2 found in harvest', tagsSeen: allTagsSeen };
    return;
  }
  var T = candidateTags[0];
  var P = T.slice(0, -1);
  var TCaseSwapped = T.split('').map(function (c) { return c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase(); }).join('');

  function lcf(s) { return s.toLowerCase(); }
  var S_T = harvest.filter(function (e) { return (e.tags || []).some(function (t) { return lcf(t) === lcf(T); }); });
  var S_P = harvest.filter(function (e) { return (e.tags || []).some(function (t) { return lcf(t) === lcf(P); }); });

  var run2 = run(['--list', '--json', '--tag', T]);
  var run3 = run(['--list', '--json', '--tag', TCaseSwapped]);
  var run4 = run(['--list', '--json', '--tag', P]);

  var run2Parsed = null, run2ParseErr = null;
  try { run2Parsed = parseNdjson(run2.stdout); } catch (e) { run2ParseErr = String(e); }

  var run2MatchesST = run2Parsed ? JSON.stringify(run2Parsed) === JSON.stringify(S_T) : false;
  var run3ByteIdenticalToRun2 = bytesEqual(run2.stdout, run3.stdout);

  var run4Parsed = null, run4ParseErr = null;
  try { run4Parsed = parseNdjson(run4.stdout); } catch (e) { run4ParseErr = String(e); }

  var sMinusP = S_T.filter(function (e) {
    return !S_P.some(function (p) { return p.text === e.text && p.author === e.author; });
  });

  var run4Verdict;
  if (S_P.length === 0) {
    run4Verdict = {
      expectExit1: true,
      actualExit: run4.status,
      stdoutBytes: Buffer.byteLength(run4.stdout, 'utf8'),
      stderrNonEmpty: run4.stderr.length > 0,
      ok: run4.status === 1 && Buffer.byteLength(run4.stdout, 'utf8') === 0 && run4.stderr.length > 0,
    };
  } else {
    var matchesP = run4Parsed ? JSON.stringify(run4Parsed) === JSON.stringify(S_P) : false;
    run4Verdict = {
      expectExit1: false,
      actualExit: run4.status,
      matchesSP: matchesP,
      run4Parsed: run4Parsed, S_P: S_P,
      ok: run4.status === 0 && matchesP,
    };
  }

  var leakedTOnlyEntries = run4Parsed ? run4Parsed.filter(function (e) {
    return sMinusP.some(function (s) { return s.text === e.text && s.author === e.author; });
  }) : [];

  out.results.S3 = {
    substitutions: { T: T, TCaseSwapped: TCaseSwapped, P: P },
    tagLenCheck: { held: true, how_checked: 'harvested tags of length>=2: ' + JSON.stringify(candidateTags.slice(0, 10)) },
    S_T_count: S_T.length,
    S_P_count: S_P.length,
    sMinusP_count: sMinusP.length,
    run2: { status: run2.status, stderr: run2.stderr, run2ParseErr: run2ParseErr, run2MatchesST: run2MatchesST, count: run2Parsed ? run2Parsed.length : null },
    run3: { status: run3.status, run3ByteIdenticalToRun2: run3ByteIdenticalToRun2 },
    run4: { status: run4.status, stdout: run4.stdout.slice(0, 500), stderr: run4.stderr, run4ParseErr: run4ParseErr, verdict: run4Verdict, leakedTOnlyEntriesCount: leakedTOnlyEntries.length, leakedTOnlyEntries: leakedTOnlyEntries },
  };
}
s3();

function s4() {
  if (!harvest) {
    out.results.S4 = { blocked: true, reason: 'harvest failed' };
    return;
  }
  var authorsSeen = Array.from(new Set(harvest.map(function (e) { return e.author; })));
  var chosenAuthor = authorsSeen.find(function (a) { return a.replace(/[^A-Za-z]/g, '').length >= 4; });
  if (!chosenAuthor) chosenAuthor = authorsSeen[0];

  function flipCase(s) {
    return s.split('').map(function (c) { return c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase(); }).join('');
  }

  var A = null;
  for (var start = 1; start < chosenAuthor.length - 1 && !A; start++) {
    var frag = chosenAuthor.slice(start, start + 4);
    if (frag.trim().length === frag.length && frag.length >= 2) {
      A = flipCase(frag);
    }
  }
  if (!A) A = flipCase(chosenAuthor);

  function lcf(s) { return s.toLowerCase(); }
  var S_A = harvest.filter(function (e) { return lcf(e.author).indexOf(lcf(A)) !== -1; });

  var allTags = Array.from(new Set(harvest.reduce(function (acc, e) { return acc.concat(e.tags || []); }, [])));
  var T = null;
  for (var i = 0; i < allTags.length; i++) {
    var cand = allTags[i];
    var S_T_cand = harvest.filter(function (e) { return (e.tags || []).some(function (t) { return lcf(t) === lcf(cand); }); });
    var inSA = S_A.some(function (e) { return (e.tags || []).some(function (t) { return lcf(t) === lcf(cand); }); });
    var setsDiffer = JSON.stringify(S_T_cand.map(function (x) { return x.text; }).sort()) !== JSON.stringify(S_A.map(function (x) { return x.text; }).sort());
    if (inSA && setsDiffer) { T = cand; break; }
  }
  if (!T && allTags.length > 0) T = allTags[0];

  var S_T = T ? harvest.filter(function (e) { return (e.tags || []).some(function (t) { return lcf(t) === lcf(T); }); }) : [];
  var S_AT = S_A.filter(function (e) { return S_T.some(function (t) { return t.text === e.text && t.author === e.author; }); });
  var S_union = harvest.filter(function (e) {
    return S_A.indexOf(e) !== -1 || S_T.indexOf(e) !== -1;
  });
  var unionStrictlyLarger = S_union.length > S_AT.length;

  var run2 = run(['--list', '--json', '--author', A]);
  var run3 = T ? run(['--list', '--json', '--tag', T]) : null;
  var run4 = T ? run(['--list', '--json', '--author', A, '--tag', T]) : null;

  var run2Parsed = null; try { run2Parsed = parseNdjson(run2.stdout); } catch (e) {}
  var run3Parsed = null; try { run3Parsed = run3 ? parseNdjson(run3.stdout) : null; } catch (e) {}
  var run4Parsed = null; try { run4Parsed = run4 ? parseNdjson(run4.stdout) : null; } catch (e) {}

  var run2MatchesSA = run2Parsed ? JSON.stringify(run2Parsed) === JSON.stringify(S_A) : false;
  var run3MatchesST = run3Parsed ? JSON.stringify(run3Parsed) === JSON.stringify(S_T) : false;

  var run4Verdict;
  if (S_AT.length === 0) {
    run4Verdict = { expectExit1: true, actualExit: run4 ? run4.status : null, stdoutBytes: run4 ? Buffer.byteLength(run4.stdout, 'utf8') : null, stderrNonEmpty: run4 ? run4.stderr.length > 0 : null };
  } else {
    var matchesAT = run4Parsed ? JSON.stringify(run4Parsed) === JSON.stringify(S_AT) : false;
    var matchesUnionInstead = run4Parsed ? JSON.stringify(run4Parsed.map(function (x) { return x.text; }).sort()) === JSON.stringify(S_union.map(function (x) { return x.text; }).sort()) : false;
    run4Verdict = { expectExit1: false, actualExit: run4.status, matchesSAT: matchesAT, matchesUnionInstead: matchesUnionInstead, S_AT_count: S_AT.length, run4Count: run4Parsed ? run4Parsed.length : null };
  }

  out.results.S4 = {
    substitutions: { chosenAuthor: chosenAuthor, A: A, T: T },
    S_A_count: S_A.length, S_T_count: S_T.length, S_AT_count: S_AT.length,
    unionCount: S_union.length, unionStrictlyLargerThanIntersection: unionStrictlyLarger,
    run2: { status: run2.status, stderr: run2.stderr, matchesSA: run2MatchesSA, count: run2Parsed ? run2Parsed.length : null },
    run3: run3 ? { status: run3.status, stderr: run3.stderr, matchesST: run3MatchesST, count: run3Parsed ? run3Parsed.length : null } : null,
    run4: run4 ? { status: run4.status, stdout: run4.stdout.slice(0, 500), stderr: run4.stderr, verdict: run4Verdict } : null,
  };
}
s4();

function s5() {
  var probeAuthor = 'qxzv-no-such-author-31337';
  var probeTag = 'qxzv-no-such-tag-31337';

  var assumptionAuthorHeld = null, assumptionTagHeld = null;
  var realAuthorFragment = null;
  if (harvest) {
    assumptionAuthorHeld = !harvest.some(function (e) { return e.author.toLowerCase().indexOf(probeAuthor.toLowerCase()) !== -1; });
    assumptionTagHeld = !harvest.some(function (e) { return (e.tags || []).some(function (t) { return t.toLowerCase() === probeTag.toLowerCase(); }); });
    if (harvest.length > 0) realAuthorFragment = harvest[0].author.slice(0, Math.max(3, Math.floor(harvest[0].author.length / 2)));
  }

  var r2 = run(['--author', probeAuthor]);
  var r3 = run(['--tag', probeTag, '--json']);
  var r4 = realAuthorFragment ? run(['--author', realAuthorFragment, '--tag', probeTag]) : null;

  function verdict(r) {
    if (!r) return null;
    return {
      status: r.status,
      stdoutBytes: Buffer.byteLength(r.stdout, 'utf8'),
      stderrBytes: Buffer.byteLength(r.stderr, 'utf8'),
      stdoutRaw: JSON.stringify(r.stdout),
      stderrRaw: JSON.stringify(r.stderr),
      ok: r.status === 1 && Buffer.byteLength(r.stdout, 'utf8') === 0 && r.stderr.length > 0,
    };
  }

  out.results.S5 = {
    probeAuthor: probeAuthor, probeTag: probeTag, realAuthorFragment: realAuthorFragment,
    assumptionAuthorHeld: assumptionAuthorHeld, assumptionTagHeld: assumptionTagHeld,
    r2: verdict(r2), r3: verdict(r3), r4: verdict(r4),
  };
}
s5();

function s6() {
  var r1 = run(['--frobnicate']);
  var r2 = run(['--seed']);
  var r3 = run(['--seed', '7', '--json']);
  var r4 = run(['--seed', '7', '--json']);

  function usageVerdict(r) {
    return {
      status: r.status,
      stdoutBytes: Buffer.byteLength(r.stdout, 'utf8'),
      stderrBytes: Buffer.byteLength(r.stderr, 'utf8'),
      stdoutRaw: JSON.stringify(r.stdout),
      stderrRaw: JSON.stringify(r.stderr).slice(0, 300),
      ok: r.status === 2 && Buffer.byteLength(r.stdout, 'utf8') === 0 && r.stderr.length > 0,
    };
  }

  var lines3 = r3.stdout.split('\n').filter(function (l) { return l.length > 0; });
  var r3Obj = null, r3ParseErr = null;
  try {
    if (lines3.length !== 1) throw new Error('not exactly one line, got ' + lines3.length);
    r3Obj = JSON.parse(lines3[0]);
  } catch (e) { r3ParseErr = String(e); }

  var hasKeys = r3Obj && typeof r3Obj.text === 'string' && typeof r3Obj.author === 'string' && Array.isArray(r3Obj.tags);
  var pair34 = bytesEqual(r3.stdout, r4.stdout);

  out.results.S6 = {
    r1: usageVerdict(r1),
    r2: usageVerdict(r2),
    r3: { status: r3.status, stderr: r3.stderr, stdoutLineCount: lines3.length, r3Obj: r3Obj, r3ParseErr: r3ParseErr, hasRequiredKeys: hasKeys },
    r4: { status: r4.status, stderr: r4.stderr },
    pair34: pair34,
  };
}
s6();

console.log(JSON.stringify(out, null, 2));
