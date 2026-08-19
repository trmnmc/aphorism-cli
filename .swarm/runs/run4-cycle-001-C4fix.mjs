// run #4, cycle 1 — REPAIR + MEASUREMENT for the C4 instrument defect.
//
// The cycle-1 gate's C4 cell parsed `^# tests (\d+)` (TAP). Node 24 emitted the SPEC
// reporter — `ℹ tests 118` — so the cell read tests=0 and failed. The tree was green the
// whole time; the instrument was wrong. Per this repo's standing precedent (cycle 4,
// cycle 12, cycle 14) the original gate file is NOT edited: rewriting a gate after it has
// run destroys the evidence of what it measured. This is a separate, additive artifact.
//
// The fix is measured, not asserted. Four columns, per the playbook line about measuring a
// detection fix against true-positive controls AND the unfixed baseline:
//   A. UNFIXED parser on the REAL output     -> must reproduce the defect (miss)
//   B. FIXED parser on the REAL output       -> must recover the true counts
//   C. FIXED parser on synthetic TAP output  -> must still work (no regression on the
//                                               format the unfixed parser did handle)
//   D. FIXED parser on synthetic FAILING out -> must report FAIL (the fix must not be a
//                                               rubber stamp that says green on anything)
import { execSync } from "child_process";

const T = "/opt/targets/aphorism-cli";

const unfixed = (s) => ({
  tests: Number((s.match(/^# tests (\d+)/m) || [])[1] || 0),
  fail: Number((s.match(/^# fail (\d+)/m) || [])[1] ?? -1)
});
// Accepts either reporter: TAP's "# tests N" or spec's "ℹ tests N".
const fixed = (s) => ({
  tests: Number((s.match(/^[#ℹ]\s*tests (\d+)/m) || [])[1] || 0),
  fail: Number((s.match(/^[#ℹ]\s*fail (\d+)/m) || [])[1] ?? -1)
});

let real = "", exit0 = false;
try { real = execSync("node --test test/*.test.js 2>&1", { cwd: T, encoding: "utf8", timeout: 120000 }); exit0 = true; }
catch (e) { real = (e.stdout || "") + (e.stderr || ""); }

const TAP = "TAP version 13\nok 1 - x\n1..3\n# tests 3\n# pass 3\n# fail 0\n";
const FAILING = "ℹ tests 118\nℹ pass 115\nℹ fail 3\n";

const rows = [
  ["A", "UNFIXED parser on REAL output — must MISS (reproduces the defect)",
    unfixed(real), (r) => r.tests === 0],
  ["B", "FIXED parser on REAL output — must recover a green >=118 suite",
    fixed(real), (r) => r.tests >= 118 && r.fail === 0 && exit0],
  ["C", "CONTROL: FIXED parser on synthetic TAP — no regression on the old format",
    fixed(TAP), (r) => r.tests === 3 && r.fail === 0],
  ["D", "CONTROL: FIXED parser on synthetic FAILING output — must report the failure",
    fixed(FAILING), (r) => r.tests === 118 && r.fail === 3]
];

let allOk = true;
for (const [id, what, got, ok] of rows) {
  const pass = ok(got);
  if (!pass) allOk = false;
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}  ${what}\n        parsed tests=${got.tests} fail=${got.fail}`);
}
console.log(`\nsuite exited 0: ${exit0}`);
console.log(allOk
  ? "\nALL 4 COLUMNS AS EXPECTED — the defect is reproduced (A), the fix recovers the true\ncounts (B), and it is neither format-regressive (C) nor a rubber stamp (D)."
  : "\nCOLUMNS DID NOT COME OUT AS EXPECTED — do not adopt this fix.");
process.exit(allOk ? 0 : 1);
