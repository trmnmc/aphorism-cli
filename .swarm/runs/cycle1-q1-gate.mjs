// SEALED VERIFICATION GATE — Q-1 (improvement run #6, aphorism-cli)
// Authored 2026-08-20 cycle 1, BEFORE dispatch. Held under /opt/swarm/runs/ — outside the
// target repo — so it is structurally unreachable to the builder (hard rule 5 + L-042),
// not merely forbidden by a prompt line.
//
// Cells fail CLOSED: anything this script cannot parse or locate is FAIL, never PASS (L-041).

import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const T = "/opt/targets/aphorism-cli";
const BASELINE = "/opt/swarm/runs/q1-blockquotes-baseline.txt";

const B = {
  readme_bytes: 16609,
  corpus_sha: "77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e",
  help_sha: "d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64",
  min_shrink: 5000,
  min_tests: 121,
};

const results = [];
const cell = (id, desc, fn) => {
  let pass = false, note = "";
  try {
    const r = fn();
    pass = r.pass;
    note = r.note;
  } catch (e) {
    pass = false;
    note = "FAIL-CLOSED: " + e.message;
  }
  results.push({ id, desc, pass, note });
};

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: T, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// Split the 95-line baseline into its five blockquotes, keyed by cycle number.
const baseLines = fs.readFileSync(BASELINE, "utf8").split("\n");
const HDR = /^> \*\*Updated 2026-08-20 \(cycle (\d+)\)\.\*\*/;
const blocks = [];
for (const line of baseLines) {
  const m = line.match(HDR);
  if (m) blocks.push({ cycle: Number(m[1]), lines: [line] });
  else if (blocks.length) blocks[blocks.length - 1].lines.push(line);
}
// trailing blank from sed
for (const b of blocks) while (b.lines.length && b.lines[b.lines.length - 1] === "") b.lines.pop();

const readme = fs.readFileSync(`${T}/README.md`, "utf8");

// --- A: the blockquote form is gone from README ---------------------------------------
cell("A", "README.md contains zero `> **Updated 2026-08-20 (cycle N)**` blockquote headers", () => {
  const n = readme.split("\n").filter((l) => HDR.test(l)).length;
  return { pass: n === 0, note: `${n} header(s) found in README.md (expected 0)` };
});

// --- B: every moved blockquote survives byte-identically in docs/, chronologically -----
cell("B", "all 5 blockquotes present byte-identically in a dated docs/ file, in ascending cycle order", () => {
  if (blocks.length !== 5) throw new Error(`baseline split gave ${blocks.length} blocks, expected 5`);
  const docs = fs
    .readdirSync(`${T}/docs`)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ f, text: fs.readFileSync(`${T}/docs/${f}`, "utf8") }));
  if (!docs.length) throw new Error("no .md files under docs/");

  const hits = [];
  for (const b of blocks) {
    const needle = b.lines.join("\n");
    const found = docs.find((d) => d.text.includes(needle));
    if (!found) return { pass: false, note: `cycle ${b.cycle} blockquote NOT byte-identical in any docs/*.md` };
    hits.push({ cycle: b.cycle, file: found.f, at: found.text.indexOf(needle) });
  }
  const files = [...new Set(hits.map((h) => h.file))];
  if (files.length !== 1) return { pass: false, note: `blockquotes split across ${files.length} files: ${files.join(", ")}` };
  const order = hits.slice().sort((a, b2) => a.at - b2.at).map((h) => h.cycle);
  const asc = order.every((c, i) => i === 0 || c > order[i - 1]);
  return {
    pass: asc,
    note: `all 5 byte-identical in docs/${files[0]}; document order = [${order.join(", ")}]${asc ? " (ascending)" : " (NOT ascending)"}`,
  };
});

// --- C: README actually got smaller ----------------------------------------------------
cell("C", `README.md at least ${B.min_shrink} bytes smaller than ${B.readme_bytes}`, () => {
  const now = fs.statSync(`${T}/README.md`).size;
  const shrink = B.readme_bytes - now;
  return { pass: shrink >= B.min_shrink, note: `${B.readme_bytes} -> ${now} bytes (shrink ${shrink})` };
});

// --- D: suite green, no test weakened by count -----------------------------------------
cell("D", `node --test reports >= ${B.min_tests} tests and 0 fail`, () => {
  let out;
  try {
    out = sh("bash", ["-c", "node --test test/*.test.js 2>&1 | tail -12"]);
  } catch (e) {
    out = String(e.stdout || "") + String(e.stderr || "");
  }
  const g = (k) => {
    const m = out.match(new RegExp(`^[ℹ#]?\\s*${k}\\s+(\\d+)$`, "m"));
    if (!m) throw new Error(`could not parse '${k}' from suite output`);
    return Number(m[1]);
  };
  const tests = g("tests"), fail = g("fail"), pass = g("pass");
  return {
    pass: tests >= B.min_tests && fail === 0,
    note: `tests ${tests} / pass ${pass} / fail ${fail} (floor ${B.min_tests})`,
  };
});

// --- E: Q-5 invariants — product surface untouched --------------------------------------
cell("E", "src/corpus.js and --help output byte-identical to 3a17cc5", () => {
  const c = sha(fs.readFileSync(`${T}/src/corpus.js`));
  const h = sha(sh("node", ["bin/aphorism.js", "--help"]));
  const ok = c === B.corpus_sha && h === B.help_sha;
  return {
    pass: ok,
    note: `corpus ${c.slice(0, 8)} (want ${B.corpus_sha.slice(0, 8)}), help ${h.slice(0, 8)} (want ${B.help_sha.slice(0, 8)})`,
  };
});

// --- F: real-claim-loss control — the live claims must SURVIVE in README ----------------
// This is the converse arm (L-044): a builder that satisfies A and C by deleting the
// section outright must FAIL here. A gate that only checks removal is a delete-detector.
cell("F", "README still states the live CI citation and both standing limits", () => {
  const norm = readme.replace(/\s+/g, " ");
  const need = [
    ["live run id", /32337875271/],
    ["cited commit", /2b003ea/],
    ["shallow-checkout limit", /shallow/i],
    ["transiently-red limit", /transient/i],
    ["not-proven-minimal caveat", /not\s+\*?\*?proven minimal/i],
  ];
  const missing = need.filter(([, re]) => !re.test(norm)).map(([n]) => n);
  return { pass: missing.length === 0, note: missing.length ? `MISSING: ${missing.join(", ")}` : "all 5 live claims present" };
});

// --- G: no dependency crept in ----------------------------------------------------------
cell("G", "still zero dependencies", () => {
  const hasPkg = fs.existsSync(`${T}/package.json`);
  if (!hasPkg) return { pass: true, note: "no package.json (zero-dep by construction)" };
  const p = JSON.parse(fs.readFileSync(`${T}/package.json`, "utf8"));
  const n = Object.keys(p.dependencies || {}).length + Object.keys(p.devDependencies || {}).length;
  return { pass: n === 0, note: `${n} declared dependencies` };
});

const passed = results.filter((r) => r.pass).length;
console.log(`SEALED GATE Q-1 — ${passed}/${results.length} cells pass\n`);
for (const r of results) console.log(`[${r.pass ? "PASS" : "FAIL"}] ${r.id}. ${r.desc}\n        ${r.note}`);
process.exit(passed === results.length ? 0 : 1);
