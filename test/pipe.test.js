'use strict';

// Regression coverage for the pipe/EPIPE root cause (item Q-1): bin/aphorism.js
// wrote to process.stdout with no 'error' listener. On POSIX, writes to a pipe
// are asynchronous, so a broken pipe surfaces later as an 'error' event rather
// than a thrown exception at the write() call site. With no listener that is an
// "unhandled 'error' event", which Node reports with a raw stack trace on
// stderr and a nonzero exit. Two distinct consequences followed from that one
// missing listener:
//
//   (1) A reader that closes the pipe early (`| true`, `| head -0`, a reader
//       that never spawned) should be a non-event for the CLI -- it exits
//       quietly, no stderr, no stack trace.
//   (2) A *non*-EPIPE write failure (e.g. the output device is full) is a real
//       fault. It must not be reported as exit 1, because README defines exit
//       1 as "no aphorism matched" -- a disk-full condition is not that. It
//       must use the tool's own one-line stderr convention and a distinct exit
//       code, with no raw stack trace either.
//
// These tests spawn the real binary (child_process) and do not depend on which
// random aphorism gets drawn.

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BIN = path.join(__dirname, '..', 'bin', 'aphorism.js');
const NODE = process.execPath;

// The unhandled-'error'-event crash always carries one of these markers.
// Absence of both is what "no raw stack trace" means below.
const CRASH_SIGNATURE = /Unhandled 'error' event|write EPIPE|node:events:\d/;

// Runs `node bin/aphorism.js <cliArgs> | <shellTail>` as a genuine shell
// pipeline. A real OS pipe (not a Node-side relay that would keep the read
// end open) is required to actually reproduce EPIPE -- that's what a real
// `cmd | other` does, and it's what these triggers describe in the wild.
function runPiped(cliArgs, shellTail) {
  const cli = [NODE, BIN, ...cliArgs].join(' ');
  return spawnSync('sh', ['-c', `${cli} | ${shellTail}`], { encoding: 'utf8' });
}

function devFullFd() {
  try {
    const fd = fs.openSync('/dev/full', 'w');
    return fd;
  } catch (e) {
    return null;
  }
}

// --- (1) EPIPE: consumer closes the pipe without reading -----------------

test('--list | true: exits quietly, zero stderr, no crash banner', () => {
  const r = runPiped(['--list'], 'true');
  assert.equal(r.stderr, '');
  assert.doesNotMatch(r.stderr, CRASH_SIGNATURE);
});

test('| true (no --list, single aphorism): exits quietly, zero stderr', () => {
  const r = runPiped([], 'true');
  assert.equal(r.stderr, '');
  assert.doesNotMatch(r.stderr, CRASH_SIGNATURE);
});

test('--list | head -0: exits quietly, zero stderr, no crash banner', () => {
  const r = runPiped(['--list'], 'head -0');
  assert.equal(r.stderr, '');
  assert.doesNotMatch(r.stderr, CRASH_SIGNATURE);
});

test('--list | /nonexistent-cmd-xyz: no crash banner from the CLI itself', () => {
  // The shell's own "not found" diagnostic (it, not the CLI, failed to
  // spawn the consumer) shares the pipeline's stderr and is not something
  // bin/aphorism.js controls or can suppress -- assert on the absence of
  // *our* crash signature, not on total silence.
  const r = runPiped(['--list'], '/nonexistent-cmd-xyz');
  assert.doesNotMatch(r.stderr, CRASH_SIGNATURE);
  assert.match(r.stderr, /not found|No such file/);
});

// --- (2) non-EPIPE write failure (disk full) ------------------------------

test('non-EPIPE stdout write failure: reported, not silent, not exit 1, no stack trace', (t) => {
  const fd = devFullFd();
  if (fd === null) {
    t.skip('/dev/full is not available on this platform/sandbox; cannot exercise a non-EPIPE write failure hermetically');
    return;
  }
  let r;
  try {
    r = spawnSync(NODE, [BIN, '--seed', '1'], { stdio: ['ignore', fd, 'pipe'], encoding: 'utf8' });
  } finally {
    fs.closeSync(fd);
  }
  // Must not be silent...
  assert.notEqual(r.stderr, '');
  // ...must use the tool's own one-line convention...
  assert.match(r.stderr, /^aphorism: /);
  assert.equal(r.stderr.trim().split('\n').length, 1, 'stderr must be a single line, not a stack trace');
  // ...must not carry a raw Node stack trace...
  assert.doesNotMatch(r.stderr, CRASH_SIGNATURE);
  assert.doesNotMatch(r.stderr, /\n\s+at /);
  // ...and must NOT be reported as exit 1 ("no aphorism matched" per README).
  assert.notEqual(r.status, 1);
  assert.notEqual(r.status, 0);
});

// --- (4) stderr side (item Q-3): the same EPIPE root cause, other stream --
//
// process.stdout had an 'error' listener (above); process.stderr did not.
// The bug is invisible if you just look at exit codes for `cmd | reader`,
// because a shell pipeline's own `$?` reports the *last* command's status
// (the reader's), not the CLI's. The discriminator has to read the CLI's
// own exit status via bash's PIPESTATUS array, redirecting the CLI's
// stdout to /dev/null and its stderr into the pipe under test with
// `2>&1 >/dev/null`. With an open reader (`cat`) the write succeeds and the
// run's own exit code comes through untouched. With a reader that hangs up
// immediately (`true`, `head -0`) the write fails with EPIPE; with no
// listener that crashes the process, and Node's crash exits 1 -- silently
// replacing whatever code the run had earned (2 for a bad flag, in the case
// below) with the unrelated "no aphorism matched" code.

function runStderrDiscriminator(cliArgs, reader) {
  const cli = [NODE, BIN, ...cliArgs].join(' ');
  // Marker printed by bash itself, never touched by the CLI or the reader,
  // so it can't be confused with anything either of them writes.
  const cmd = `${cli} 2>&1 >/dev/null | ${reader} >/dev/null 2>&1; echo "PIPESTATUS0=\${PIPESTATUS[0]}"`;
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8' });
  const m = r.stdout.match(/PIPESTATUS0=(-?\d+)/);
  return { exitCode: m ? Number(m[1]) : null, raw: r };
}

test('usage error survives a closed stderr reader: still exits 2, not clobbered to 1', () => {
  const openReader = runStderrDiscriminator(['--bogus-flag'], 'cat');
  const closedTrue = runStderrDiscriminator(['--bogus-flag'], 'true');
  const closedHead = runStderrDiscriminator(['--bogus-flag'], 'head -0');
  assert.equal(openReader.exitCode, 2);
  // This is the exact collision from the item: a broken implementation
  // (no 'error' listener on process.stderr) lets Node's unhandled-error
  // crash overwrite this with 1.
  assert.equal(closedTrue.exitCode, 2);
  assert.equal(closedHead.exitCode, 2);
});

test('no-match exit code survives a closed stderr reader: still exits 1, not misreported', () => {
  const openReader = runStderrDiscriminator(['--tag', 'definitely-not-a-real-tag'], 'cat');
  const closedTrue = runStderrDiscriminator(['--tag', 'definitely-not-a-real-tag'], 'true');
  const closedHead = runStderrDiscriminator(['--tag', 'definitely-not-a-real-tag'], 'head -0');
  assert.equal(openReader.exitCode, 1);
  // A mutation that unconditionally overwrites process.exitCode on any
  // stderr 'error' (instead of leaving an EPIPE's exit code alone) would
  // change this away from 1.
  assert.equal(closedTrue.exitCode, 1);
  assert.equal(closedHead.exitCode, 1);
});

test('non-EPIPE stderr write failure: not silent, not the earned exit code, no stack trace', (t) => {
  const fd = devFullFd();
  if (fd === null) {
    t.skip('/dev/full is not available on this platform/sandbox; cannot exercise a non-EPIPE write failure hermetically');
    return;
  }
  let r;
  try {
    // stdout: 'pipe' (unused here) so the process doesn't inherit a real
    // terminal; stderr: fd, a write target that fails with ENOSPC, not
    // EPIPE -- the "disk full" case, distinct from a closed reader.
    r = spawnSync(NODE, [BIN, '--bogus-flag'], { stdio: ['ignore', 'pipe', fd], encoding: 'utf8' });
  } finally {
    fs.closeSync(fd);
  }
  // A handler that does nothing on non-EPIPE errors would silently leave
  // this at the usage-error path's own exit code (2) even though the
  // diagnostic never made it out -- that's the "silently succeed" this
  // guards against.
  assert.notEqual(r.status, 2);
  // Must not be misreported as exit 1 ("no aphorism matched" per README).
  assert.notEqual(r.status, 1);
  assert.notEqual(r.status, 0);
  // stdout is untouched by a stderr-side failure.
  assert.equal(r.stdout, '');
});

// --- (5) controls: these must stay green and unchanged --------------------

test('control: --list | head -1 stays completely clean', () => {
  const r = runPiped(['--list'], 'head -1');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

test('control: --list | head -5 stays completely clean', () => {
  const r = runPiped(['--list'], 'head -5');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

test('control: --list | sed 1q stays completely clean', () => {
  const r = runPiped(['--list'], 'sed 1q');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

test('control: --list | grep -q . stays completely clean', () => {
  const r = runPiped(['--list'], 'grep -q .');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

test('control: | wc -l stays completely clean', () => {
  const r = runPiped([], 'wc -l');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

test('control: --list --json | head -2 stays completely clean', () => {
  const r = runPiped(['--list', '--json'], 'head -2');
  assert.equal(r.stderr, '');
  assert.equal(r.status, 0);
});

test('control: exit 1 / exit 2 stderr messages and codes are unchanged', () => {
  const noMatch = spawnSync(NODE, [BIN, '--tag', 'definitely-not-a-real-tag'], { encoding: 'utf8' });
  assert.equal(noMatch.status, 1);
  assert.equal(noMatch.stderr, 'aphorism: no aphorism matches those filters\n');
  assert.equal(noMatch.stdout, '');

  const badFlag = spawnSync(NODE, [BIN, '--bogus-flag'], { encoding: 'utf8' });
  assert.equal(badFlag.status, 2);
  assert.equal(badFlag.stderr, 'aphorism: unknown flag: --bogus-flag\n');
  assert.equal(badFlag.stdout, '');
});

test('control: a normal (non-full) stdout target still exits 0 with empty stderr', () => {
  // Guards against a fix that routes ALL writes through the write-error
  // path (e.g. an always-nonzero exit code) instead of only real failures.
  const a = spawnSync(NODE, [BIN, '--seed', '1'], { encoding: 'utf8' });
  const b = spawnSync(NODE, [BIN, '--seed', '1'], { encoding: 'utf8' });
  assert.equal(a.status, 0);
  assert.equal(a.stderr, '');
  assert.equal(a.stdout, b.stdout, 'normal stdout output must be unaffected and deterministic under --seed');
});
