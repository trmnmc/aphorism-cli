// Cycle 7 (run #4) — conductor probe: is EXIT_WRITE_ERROR (3) REACHABLE from an ordinary
// shell invocation? The SPEC's "Exit codes" Domain rule enumerates 0/1/2 only; bin/aphorism.js
// ships a 3. An unreachable 3 is dead code (cosmetic); a reachable 3 is a shipped behaviour
// the Domain rules do not enumerate, on the surface run #4's M-5 calls the regression floor.
//
// Probes are plain `sh -c` invocations a user could type. Exit code is what a calling script
// would see.
import { execSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const CASES = [
  ['baseline',                  `node bin/aphorism.js --seed 1`],
  ['no-match (documented 1)',   `node bin/aphorism.js --tag nosuchtag`],
  ['bad usage (documented 2)',  `node bin/aphorism.js --nope`],
  ['stdout CLOSED (>&-)',       `node bin/aphorism.js --seed 1 >&-`],
  ['stdout -> /dev/full',       `node bin/aphorism.js --seed 1 >/dev/full`],
  ['stdout EPIPE (| true)',     `node bin/aphorism.js --seed 1 | true`],
  ['stdout EPIPE (| head -1)',  `node bin/aphorism.js --list | head -1`],
  ['stderr CLOSED, no-match',   `node bin/aphorism.js --tag nosuchtag 2>&-`],
  ['stderr CLOSED, bad usage',  `node bin/aphorism.js --nope 2>&-`],
];

console.log('label'.padEnd(28), 'exit', ' stdout_bytes  stderr(trimmed)');
for (const [label, cmd] of CASES) {
  let code = 0, out = '', err = '';
  try {
    out = execSync(cmd + ' 2>/tmp/c007err', { cwd: T, encoding: 'utf8', shell: '/bin/sh' });
  } catch (e) {
    code = e.status ?? -1;
    out = e.stdout ?? '';
  }
  try { err = execSync('cat /tmp/c007err', { encoding: 'utf8' }); } catch {}
  console.log(
    label.padEnd(28),
    String(code).padStart(4),
    String(out.length).padStart(9),
    '  ' + JSON.stringify(err.trim().slice(0, 70))
  );
}
