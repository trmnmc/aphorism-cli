// run #4, cycle 1 — VERIFICATION GATE for the PLAN cycle.
// Conductor-authored AT VERIFICATION TIME. No agent saw this file; the plan agent was
// dispatched before it existed and its prompt contained no test command.
//
// Every cell re-derives its expected value from the tree at run time (backlog.json,
// SPEC.md, the filesystem) — never from a journal note or a prior cycle's summary.
// Cells C2b and C3b are CONTROLS: they must FAIL-to-find, proving the corresponding
// positive cell can detect absence rather than always reporting PASS.
import fs from "fs";
import { execSync } from "child_process";

const T = "/opt/targets/aphorism-cli";
const rows = [];
const cell = (id, what, pass, detail) => rows.push({ id, what, pass, detail });

// ---- C1: nothing lost. The 7 items live before this cycle must all still be present.
const PRE = ["T-006", "T-040", "J-7", "TS-1", "TS-2", "TS-3", "R-1"];
let b = null, parsed = true;
try { b = JSON.parse(fs.readFileSync(T + "/.swarm/backlog.json", "utf8")); }
catch (e) { parsed = false; }
cell("C1a", "backlog.json parses", parsed, parsed ? "ok" : "JSON parse failed");
const ids = parsed ? b.items.map((i) => i.id) : [];
const lost = PRE.filter((i) => !ids.includes(i));
cell("C1b", "all 7 pre-cycle items still present", lost.length === 0,
  `pre=7 now=${ids.length} lost=[${lost.join(",")}]`);

// ---- C2: must-have coverage, derived by PARSING SPEC.md, not from a hardcoded list.
const spec = fs.readFileSync(T + "/.swarm/SPEC.md", "utf8");
const mustHaves = [...new Set([...spec.matchAll(/\*\*(M-\d)\s/g)].map((m) => m[1]))].sort();
const covered = new Set();
for (const it of b ? b.items : []) for (const c of it.covers || []) covered.add(c);
const uncovered = mustHaves.filter((m) => !covered.has(m));
cell("C2a", `every must-have parsed from SPEC.md is covered (found ${mustHaves.length}: ${mustHaves.join(",")})`,
  mustHaves.length > 0 && uncovered.length === 0, `uncovered=[${uncovered.join(",")}]`);
// CONTROL: a must-have id that does not exist must read as NOT covered. If this cell
// reports "covered", C2a is a rubber stamp that says PASS regardless of the tree.
cell("C2b", "CONTROL: a non-existent must-have (M-9) reads as NOT covered", !covered.has("M-9"),
  covered.has("M-9") ? "M-9 covered — C2a is meaningless" : "M-9 absent as expected");

// ---- C3: no two dispatchable todo items share a file unless sequenced by deps.
const todo = (b ? b.items : []).filter((i) => i.status === "todo" && i.owner === "builder");
const clashes = [];
for (let i = 0; i < todo.length; i++)
  for (let j = i + 1; j < todo.length; j++) {
    const a = todo[i], c = todo[j];
    const shared = (a.files_hint || []).filter((f) => (c.files_hint || []).includes(f));
    if (!shared.length) continue;
    const seq = (a.deps || []).includes(c.id) || (c.deps || []).includes(a.id);
    if (!seq) clashes.push(`${a.id}/${c.id} share ${shared.join(",")} unsequenced`);
  }
cell("C3a", "no two builder todo items share a file without a dep edge", clashes.length === 0,
  clashes.length ? clashes.join("; ") : "0 unsequenced clashes");
// CONTROL: N-2 and N-5 DO share REPORT.md and MUST be dep-sequenced. If this cell fails,
// C3a passed only because it never found the overlap it exists to police.
const n2 = ids.includes("N-2"), n5 = ids.includes("N-5");
const n5o = (b ? b.items : []).find((i) => i.id === "N-5");
const shareSeq = n2 && n5 && (n5o.files_hint || []).includes("REPORT.md") && (n5o.deps || []).includes("N-2");
cell("C3b", "CONTROL: the one real file overlap (N-2/N-5 on REPORT.md) exists and IS sequenced",
  shareSeq, shareSeq ? "N-5 deps on N-2, both touch REPORT.md" : "overlap missing or unsequenced");

// ---- C4: M-5 standing guard — suite green, >= 118 tests. Run, do not ask.
let out = "", tests = 0, fail = -1, ok = false;
try {
  out = execSync("node --test test/*.test.js 2>&1", { cwd: T, encoding: "utf8", timeout: 120000 });
  ok = true;
} catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
tests = Number((out.match(/^# tests (\d+)/m) || [])[1] || 0);
fail = Number((out.match(/^# fail (\d+)/m) || [])[1] ?? -1);
cell("C4", "M-5 guard: suite green and >= 118 tests", ok && fail === 0 && tests >= 118,
  `tests=${tests} fail=${fail} exit0=${ok}`);

// ---- C5: acceptance clauses must not name a test command a builder could code to.
const leak = (b ? b.items : []).filter((i) =>
  /node --test|npm test|test_cmd|\.test\.js|execSync|assert\(/.test(i.acceptance || ""));
cell("C5", "no acceptance clause names a test command or file",
  leak.length === 0, leak.length ? "leaked: " + leak.map((i) => i.id).join(",") : "0 leaks");

// ---- report
const P = rows.filter((r) => r.pass).length;
for (const r of rows) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.id}  ${r.what}\n        ${r.detail}`);
console.log(`\n${P} PASS / ${rows.length - P} FAIL  of ${rows.length} cells`);
process.exit(P === rows.length ? 0 : 1);
