// cycle-013 GATE ADDENDUM 2 — the corrected A8 control, WITH a negative control.
//
// AUTHORED AFTER THE POST-FIX RUN. This file did not exist when
// cycle-013-gate.mjs was sealed (adf046b8…), when its baseline was captured,
// or when the fixers were dispatched. It pre-commits NOTHING and is a repair
// of a broken instrument, never part of the sealed evidence.
//
// WHY IT EXISTS — and this one is self-inflicted in an instructive way.
//
// The sealed gate's A8 control asserted the token matcher survived the rename
// byte-identical, by slicing the region between two anchors:
//     indexOf('const singleEntryMarkers = [')  ..  indexOf('assert(hasWarning')
// and hashing it. The anchors were assumed UNIQUE. They were unique when the
// gate was sealed (1 occurrence each) and are not unique now (2 each) —
// because FIXER 2, obeying the instruction "do not insert anything between
// `const singleEntryMarkers = [` and `assert(hasWarning`", QUOTED BOTH ANCHOR
// STRINGS in the comment note explaining that it had not touched the region.
// The note sits ABOVE the test, so first-occurrence indexOf now slices 62
// bytes of comment prose instead of the 898-byte matcher, and A8 reported
// FAIL against a region that had not changed.
//
// The instruction that protected the region is what broke the check on it.
//
// THE MATCHER IS IN FACT UNTOUCHED, established two independent ways before
// this file was written — neither of them by re-running the broken check:
//
//   1. `git diff -U1 test/readme-tags.test.js` shows exactly three changed
//      hunks: the inserted comment note, the test-name line, and the assert
//      message line. The matcher region does not appear in the diff at all.
//   2. Re-slicing with LAST-occurrence anchors against `git show HEAD:` and
//      against the working tree both yield 898 bytes, sha256
//      389c3c2a1678ecdc805682c48d5963dc96871cd1ae0041c8f0355df9972d6b28,
//      identical to each other and to the sealed value.
//
// This is the SEVENTH instrument bug of run #3 and the FOURTH inside a gate I
// sealed myself. Named as its own sub-species, distinct from the cycle-12
// substring-vs-structural family and from addendum 1's format-assumption bug:
// an ANCHOR-UNIQUENESS assumption. A check that locates its subject by
// searching for a string must assert that the string occurs exactly as many
// times as it expects, and FAIL LOUDLY AS UNPARSEABLE when it does not —
// rather than silently measuring whatever the wrong match happened to bracket.
// A8 below therefore checks anchor cardinality FIRST and refuses to render a
// pass/fail verdict on the property until the anchors resolve unambiguously.
//
// Run:  node .swarm/runs/cycle-013-gate-addendum-2.mjs      (cwd = repo root)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const SEALED_MATCHER_SHA =
  '389c3c2a1678ecdc805682c48d5963dc96871cd1ae0041c8f0355df9972d6b28';
const OPEN = 'const singleEntryMarkers = [';
const CLOSE = 'assert(hasWarning';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Extract the matcher region UNAMBIGUOUSLY, or refuse to answer.
// Returns {ok:true, body} | {ok:false, reason} — never a silent wrong slice.
function extractMatcher(text) {
  const opens = text.split(OPEN).length - 1;
  const closes = text.split(CLOSE).length - 1;
  if (opens === 0 || closes === 0) {
    return { ok: false, reason: `anchor missing (open=${opens} close=${closes})` };
  }
  // The matcher is the LAST occurrence pair: prose that mentions the anchors
  // is commentary and always precedes the code it describes in this file.
  const bs = text.lastIndexOf(OPEN);
  const be = text.indexOf(CLOSE, bs);
  if (be === -1) {
    return { ok: false, reason: 'no closing anchor after the final opening anchor' };
  }
  const body = text.slice(bs, be);
  // Structural sanity: the real matcher contains the nine marker regexes and
  // the hasWarning reduction. Prose quoting the anchors does not.
  const looksLikeCode =
    /singleEntryMarkers\s*=\s*\[/.test(body) &&
    (body.match(/\/\\b/g) || []).length >= 9 &&
    /const hasWarning = sentences\.some/.test(body);
  if (!looksLikeCode) {
    return { ok: false, reason: `slice does not look like the matcher (${body.length}B)` };
  }
  return { ok: true, body, opens, closes };
}

const cur = fs.readFileSync('test/readme-tags.test.js', 'utf8');
const got = extractMatcher(cur);

if (!got.ok) {
  console.log(`UNPARSEABLE  A8'  ${got.reason}`);
  process.exit(2); // NOT exit 1 — an unread instrument is not a changed matcher.
}

const ok = sha(got.body) === SEALED_MATCHER_SHA;
console.log(
  `${ok ? 'PASS' : 'FAIL'}  A8'  CONTROL (corrected): matcher byte-identical to seal  ` +
    `[${sha(got.body).slice(0, 16)} vs ${SEALED_MATCHER_SHA.slice(0, 16)}, ${got.body.length}B, ` +
    `anchors open=${got.opens} close=${got.closes}]`
);

// --- NEGATIVE CONTROL ------------------------------------------------------
// A control that cannot fail is not a control. Prove this check DIES on a real
// narrowing of the matcher — the exact change it exists to forbid — by
// planting a tenth marker regex in a throwaway copy and re-running the check
// against it. If this comes back PASS, the check above is worthless and the
// A8' verdict must be discarded.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c13-a8-negctl-'));
let negOk = false;
let negNote = '';
try {
  const mutated = cur.replace(
    /(\s*)\/\\boccurs\? once\\b\/i,/,
    '$1/\\boccurs? once\\b/i,$1/\\bsolitary\\b/i,'
  );
  if (mutated === cur) {
    negNote = 'MUTATION DID NOT APPLY — negative control inconclusive';
  } else {
    const f = path.join(tmp, 'mutated.js');
    fs.writeFileSync(f, mutated);
    const m = extractMatcher(fs.readFileSync(f, 'utf8'));
    if (!m.ok) {
      negNote = `mutated copy unparseable: ${m.reason}`;
    } else {
      const diesCorrectly = sha(m.body) !== SEALED_MATCHER_SHA;
      negOk = diesCorrectly;
      negNote = `mutated matcher ${m.body.length}B sha=${sha(m.body).slice(0, 16)} — check ${
        diesCorrectly ? 'correctly FAILS it' : 'WRONGLY PASSES it'
      }`;
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`${negOk ? 'PASS' : 'FAIL'}  A8'-negctl  a planted 10th marker regex is detected  [${negNote}]`);

// --- CORROBORATION ---------------------------------------------------------
// Independent of the hash entirely: git must report the matcher lines as
// unchanged. Two mechanisms agreeing beats one mechanism asserting.
let gitOk = false;
let gitNote = '';
try {
  const head = execSync('git show HEAD:test/readme-tags.test.js', {
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  const h = extractMatcher(head);
  gitOk = h.ok && h.body === got.body;
  gitNote = h.ok
    ? `HEAD matcher ${h.body.length}B, identical to working tree: ${h.body === got.body}`
    : `HEAD unparseable: ${h.reason}`;
} catch (e) {
  gitNote = `git failed: ${e.message}`;
}
console.log(`${gitOk ? 'PASS' : 'FAIL'}  A8'-corrob  matcher identical to HEAD by independent re-slice  [${gitNote}]`);

process.exit(ok && negOk && gitOk ? 0 : 1);
