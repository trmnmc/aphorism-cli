#!/usr/bin/env python3
"""
r8-gate-c7.py -- conductor verification gate for improvement run #8, cycle 7.

Authored AFTER the builder's work landed and never shown to the builder
(hard rule 2). Committed exactly as it ran.

Item under gate: W-8 -- "Re-run the detection floor at final HEAD and prove no
baseline detection was lost."

Design notes, so a reader can judge the instrument and not just its verdicts:

  * Cell C4 does NOT trust tools/detection-floor.mjs. It recomputes the whole
    partition itself, in this file, straight from the two committed JSON
    records, and then requires the tool's printed partition to match set for
    set. If the tool and this gate disagree, the tool fails.
  * Cell C3 does NOT trust the artifact. It re-runs the instrument against HEAD
    itself and diffs verdict-by-verdict against the committed final record. The
    builder's own --remeasure output is not evidence here.
  * Every cell that must FAIL on bad input has a companion cell that must stay
    GREEN on good input, so a check that dies on everything is visible as such.
  * The suite parse reads the `ℹ tests/pass/fail/skipped` lines that
    `node --test` actually emits (verified by eye before this file was written;
    a cycle-6 gate defect read `# pass N` from a reporter that emits `ℹ pass N`).
  * The dependency clause is measured as "no manifest or lockfile tracked or on
    disk, no node_modules, tools/ imports node: builtins only" -- this repo has
    never had a package.json, and being manifest-less IS its zero-dep surface
    (a cycle-6 gate defect read a package.json that does not exist).
"""

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = "/opt/targets/aphorism-cli"
BASELINE = os.path.join(ROOT, "tools", "mutation-matrix-baseline.json")
FINAL = os.path.join(ROOT, "tools", "mutation-matrix-final.json")
FLOOR = os.path.join(ROOT, "tools", "detection-floor.mjs")

CELLS = []


def cell(name, ok, detail):
    CELLS.append((name, bool(ok), detail))
    print("\n--> %s %s" % (name, "PASS" if ok else "FAIL"))
    for line in str(detail).splitlines():
        print("    " + line)
    return ok


def run(args, cwd=ROOT, timeout=900, env=None):
    e = dict(os.environ)
    if env:
        e.update(env)
    p = subprocess.run(args, cwd=cwd, capture_output=True, text=True,
                       timeout=timeout, env=e)
    return p.returncode, p.stdout, p.stderr


def sha256_file(p):
    with open(p, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


print("=" * 78)
print("W-8 VERIFICATION GATE -- run #8 cycle 7")
print("=" * 78)

HEAD = run(["git", "rev-parse", "HEAD"])[1].strip()
print("HEAD = %s" % HEAD)

# ---------------------------------------------------------------- C1 scope
ALLOWED = {"tools/detection-floor.mjs",
           "tools/mutation-matrix-final.json",
           "tools/run-all.mjs"}


def classify(path):
    """True == inside the builder's declared scope."""
    return path in ALLOWED


_, porcelain, _ = run(["git", "status", "--porcelain"])
touched = sorted({ln[3:].strip() for ln in porcelain.splitlines() if ln.strip()})
outside = [p for p in touched if not classify(p)]

FORBIDDEN_PROBES = ["src/corpus.js", "test/readme-tags.test.js",
                    "tools/mutation-matrix-baseline.json", "README.md"]
converse = [p for p in FORBIDDEN_PROBES if classify(p)]

scratch = [d for d in os.listdir(ROOT) if d.startswith(".scratch")]

# baseline record byte-unmoved vs its committed blob
committed_baseline = subprocess.run(
    ["git", "show", "HEAD:tools/mutation-matrix-baseline.json"],
    cwd=ROOT, capture_output=True, timeout=60).stdout
base_sha_disk = sha256_file(BASELINE)
base_sha_head = sha256_bytes(committed_baseline)

cell("C1 scope + baseline immutability",
     not outside and not converse and not scratch and base_sha_disk == base_sha_head,
     "touched paths           : %s\n"
     "outside declared scope  : %s\n"
     "converse control (these 4 forbidden paths must all be rejected by the\n"
     "  classifier; 0 accepted == the classifier is not a rubber stamp): %s accepted\n"
     "leftover .scratch* trees: %s\n"
     "baseline json sha256 on disk : %s\n"
     "baseline json sha256 at HEAD : %s  identical=%s"
     % (touched, outside, len(converse), scratch,
        base_sha_disk[:16], base_sha_head[:16], base_sha_disk == base_sha_head))

# ------------------------------------------------- C2 artifact provenance
base = json.load(open(BASELINE))
fin = json.load(open(FINAL))

recorded = fin.get("meta", {}).get("measuredCommit")
same_keys = list(base.keys()) == list(fin.keys())
ids_fin = [r["id"] for r in fin["results"]] + [s["id"] for s in fin["skippedClaims"]]
unique = len(ids_fin) == len(set(ids_fin))

cell("C2 provenance + machine-comparable shape",
     recorded == HEAD and same_keys and unique
     and base["identity"]["verdict"] == "GREEN"
     and fin["identity"]["verdict"] == "GREEN",
     "final meta.measuredCommit : %s\n"
     "repo HEAD                 : %s   equal=%s\n"
     "top-level keys baseline   : %s\n"
     "top-level keys final      : %s   identical=%s\n"
     "ids unique across results+skippedClaims: %s (%d ids)\n"
     "identity control verdict  : baseline=%s (%s)  final=%s (%s)"
     % (recorded, HEAD, recorded == HEAD, list(base.keys()), list(fin.keys()),
        same_keys, unique, len(ids_fin),
        base["identity"]["verdict"], base["identity"]["suite"],
        fin["identity"]["verdict"], fin["identity"]["suite"]))

# -------------------------- C2b freshness input-set completeness (my own)
# The tool exempts a non-HEAD record when the diff touches nothing that can
# change a verdict. That exemption is only sound if its path set covers every
# real input. Measure the real input set rather than trusting the regex.
edit_files = sorted({e["file"] for r in base["results"] + fin["results"]
                     for e in r.get("edits", [])})
src = open(FLOOR).read()
m = re.search(r"const VERDICT_RELEVANT = /\^\((.*?)\)/", src)
vr = m.group(1) if m else "(not found)"
# a mutation table hardcoded in the instrument, not re-derived at runtime:
spawns_inventory = "guard-inventory" in re.sub(r"(?m)^\s*//.*$", "", src) or \
    bool(re.search(r"spawnSync\([^)]*guard-inventory",
                   open(os.path.join(ROOT, "tools", "mutation-matrix.mjs")).read()))
covered = all(re.match(r"^(README\.md$|docs/|src/|bin/|test/|\.github/|tools/mutation-matrix\.mjs$)", f)
              for f in edit_files)

cell("C2b freshness exemption covers the real verdict-input set",
     covered and not spawns_inventory,
     "files any mutation edits (measured from both records): %s\n"
     "VERDICT_RELEVANT alternation in detection-floor.mjs   : %s\n"
     "every mutation-edited file matched by it              : %s\n"
     "instrument re-derives its mutation table from\n"
     "  tools/guard-inventory.mjs at runtime                : %s\n"
     "  (it does not -- the table is hardcoded at line ~196 and transcribed at\n"
     "   baseline, so guard-inventory.mjs is correctly NOT a verdict input)\n"
     "guards live under test/ and the table lives in tools/mutation-matrix.mjs,\n"
     "both inside the set -- so the exemption cannot skip a real input."
     % (edit_files, vr, covered, spawns_inventory))

# ------------------------------------ C3 non-fabrication: re-measure MYSELF
tmpdir = tempfile.mkdtemp(prefix="r8gate7-")
mine = os.path.join(tmpdir, "conductor-remeasure.json")
rc3, out3, err3 = run(["node", "tools/mutation-matrix.mjs", "--rev", HEAD, "--json"],
                      timeout=3600)
open(mine, "w").write(out3)
try:
    mine_rec = json.loads(out3)
    parsed3 = True
except Exception as exc:  # noqa
    mine_rec = None
    parsed3 = False
    print("    (conductor re-measure did not parse: %s)" % exc)

if parsed3:
    mv = {r["id"]: r["verdict"] for r in mine_rec["results"]}
    fv = {r["id"]: r["verdict"] for r in fin["results"]}
    ms = {s["id"] for s in mine_rec["skippedClaims"]}
    fs = {s["id"] for s in fin["skippedClaims"]}
    diffs = sorted(set(mv) ^ set(fv)) + \
        sorted(i for i in set(mv) & set(fv) if mv[i] != fv[i])
    mg = {r["id"]: r.get("guardTitle") for r in mine_rec["results"]}
    fg = {r["id"]: r.get("guardTitle") for r in fin["results"]}
    gdiffs = sorted(i for i in set(mg) & set(fg) if mg[i] != fg[i])
    id_ok = (mine_rec["identity"]["verdict"] == fin["identity"]["verdict"]
             and mine_rec["identity"]["suite"] == fin["identity"]["suite"])
    cell("C3 artifact is not fabricated -- conductor re-derived it independently",
         rc3 == 0 and not diffs and ms == fs and not gdiffs and id_ok,
         "conductor ran: node tools/mutation-matrix.mjs --rev %s --json   exit=%d\n"
         "rows: conductor=%d  committed=%d\n"
         "verdict differences (id-by-id)      : %s\n"
         "guardTitle differences on shared ids: %s\n"
         "skippedClaims  conductor=%s\n"
         "               committed=%s   equal=%s\n"
         "identity control conductor=%s %s  committed=%s %s  equal=%s"
         % (HEAD[:7], rc3, len(mv), len(fv), diffs, gdiffs,
            sorted(ms), sorted(fs), ms == fs,
            mine_rec["identity"]["verdict"], mine_rec["identity"]["suite"],
            fin["identity"]["verdict"], fin["identity"]["suite"], id_ok))
else:
    cell("C3 artifact is not fabricated -- conductor re-derived it independently",
         False, "conductor re-measure exit=%d, stdout did not parse as JSON.\n"
                "stderr tail:\n%s" % (rc3, err3[-800:]))

# -------------------- C4 conductor computes the partition, tool must match
same_guard, guard_changed, claim_gone, lost, unaccounted = set(), set(), set(), set(), set()
fin_by_id = {r["id"]: r for r in fin["results"]}
fin_skip = {s["id"]: s for s in fin["skippedClaims"]}
for r in base["results"]:
    if r["verdict"] != "CAUGHT":
        continue
    i = r["id"]
    if i in fin_by_id:
        f = fin_by_id[i]
        if f["verdict"] != "CAUGHT":
            lost.add(i)
        elif f.get("guardTitle") == r.get("guardTitle"):
            same_guard.add(i)
        else:
            guard_changed.add(i)
    elif i in fin_skip:
        claim_gone.add(i)
    else:
        unaccounted.add(i)

rc4, out4, err4 = run(["node", "tools/detection-floor.mjs"], timeout=600)


def parse_bucket(text, header):
    """Ids printed at exactly two-space indent under a bucket header."""
    m = re.search(r"(?m)^%s \((\d+)\):.*$" % re.escape(header), text)
    if not m:
        return None, None
    tail = text[m.end():]
    stop = re.search(r"(?m)^(?:[A-Z][A-Z -]+ \(\d+\)|=====|VERDICT)", tail)
    body = tail[:stop.start()] if stop else tail
    return int(m.group(1)), {x for x in re.findall(r"(?m)^  (M\d\d)\s", body)}


t_same_n, t_same = parse_bucket(out4, "SAME-GUARD")
t_chg_n, t_chg = parse_bucket(out4, "GUARD-CHANGED")
t_gone_n, t_gone = parse_bucket(out4, "CLAIM-GONE")
t_lost_n, _ = parse_bucket(out4, "DETECTION-LOST")

parser_sane = None not in (t_same_n, t_chg_n, t_gone_n, t_lost_n) and \
    t_same_n == len(t_same) and t_chg_n == len(t_chg) and t_gone_n == len(t_gone)

agree = (parser_sane and t_same == same_guard and t_chg == guard_changed
         and t_gone == claim_gone and t_lost_n == len(lost) == 0
         and not unaccounted
         and len(same_guard | guard_changed | claim_gone | lost) ==
         len([r for r in base["results"] if r["verdict"] == "CAUGHT"]))

cell("C4 partition recomputed by the conductor matches the tool, set for set",
     rc4 == 0 and agree,
     "detection-floor.mjs exit                      : %d\n"
     "conductor SAME-GUARD    : %s\n"
     "tool      SAME-GUARD    : %s  (header said %s)  equal=%s\n"
     "conductor GUARD-CHANGED : %s\n"
     "tool      GUARD-CHANGED : %s  (header said %s)  equal=%s\n"
     "conductor CLAIM-GONE    : %s\n"
     "tool      CLAIM-GONE    : %s  (header said %s)  equal=%s\n"
     "conductor DETECTION-LOST: %s   tool header said %s\n"
     "conductor UNACCOUNTED   : %s\n"
     "baseline CAUGHT total   : %d   buckets sum to %d  (complete=%s)\n"
     "parser sanity (each header count == ids actually parsed): %s"
     % (rc4, sorted(same_guard), sorted(t_same or []), t_same_n, t_same == same_guard,
        sorted(guard_changed), sorted(t_chg or []), t_chg_n, t_chg == guard_changed,
        sorted(claim_gone), sorted(t_gone or []), t_gone_n, t_gone == claim_gone,
        sorted(lost), t_lost_n, sorted(unaccounted),
        len([r for r in base["results"] if r["verdict"] == "CAUGHT"]),
        len(same_guard | guard_changed | claim_gone | lost), agree, parser_sane))

# ------------ C5 the tool can FAIL, for the reason it names (conductor's own
#              injection, on an id the builder did not use)
inj = os.path.join(tmpdir, "final-M09-silent.json")
doc = json.loads(json.dumps(fin))
for r in doc["results"]:
    if r["id"] == "M09":
        r["verdict"] = "SILENT"
        r["firedGuards"] = []
json.dump(doc, open(inj, "w"))
rc5, out5, err5 = run(["node", "tools/detection-floor.mjs", "--final", inj], timeout=600)
names_m09 = bool(re.search(r"M09.*(DETECTION LOST|LOST)", out5 + err5))

cell("C5 converse control -- flipping M09 CAUGHT->SILENT is caught and named",
     rc5 != 0 and names_m09,
     "conductor injection: M09 verdict CAUGHT -> SILENT, firedGuards emptied,\n"
     "  written to a COPY; the committed artifact was not touched.\n"
     "exit=%d (non-zero required)   names M09 as lost=%s\n"
     "relevant output lines:\n%s"
     % (rc5, names_m09,
        "\n".join(l for l in (out5 + err5).splitlines() if "M09" in l)[:600]))

# ------------ C5b a silently DROPPED row must not read as a pass
inj2 = os.path.join(tmpdir, "final-M15-dropped.json")
doc2 = json.loads(json.dumps(fin))
doc2["results"] = [r for r in doc2["results"] if r["id"] != "M15"]
doc2["skippedClaims"] = [s for s in doc2["skippedClaims"] if s["id"] != "M15"]
json.dump(doc2, open(inj2, "w"))
rc5b, out5b, err5b = run(["node", "tools/detection-floor.mjs", "--final", inj2], timeout=600)
names_m15 = "M15" in (out5b + err5b)

cell("C5b converse control -- a baseline row missing from BOTH arrays fails",
     rc5b != 0 and names_m15,
     "conductor injection: M15 deleted from results AND skippedClaims.\n"
     "exit=%d (non-zero required)   names M15=%s\n"
     "relevant output lines:\n%s"
     % (rc5b, names_m15,
        "\n".join(l for l in (out5b + err5b).splitlines() if "M15" in l)[:600]))

# ------------ C6 GREEN control: an undoctored copy through the same path
good = os.path.join(tmpdir, "final-untouched-copy.json")
shutil.copyfile(FINAL, good)
rc6, out6, _ = run(["node", "tools/detection-floor.mjs", "--final", good], timeout=600)
cell("C6 green control -- the same --final path on an UNDOCTORED copy passes",
     rc6 == 0 and "DETECTION FLOOR HOLDS" in out6,
     "exit=%d  verdict line: %s\n"
     "(C5/C5b would be worthless without this: it proves --final does not\n"
     " simply fail on everything handed to it.)"
     % (rc6, next((l for l in out6.splitlines() if l.startswith("VERDICT")), "(none)")))

# ------------ C7 staleness cannot be waved through by the content exemption
_, revlist, _ = run(["git", "rev-list", "--max-count=25", "HEAD"])
stale_rev = None
for r in revlist.split()[1:]:
    _, names, _ = run(["git", "diff", "--name-only", r, "HEAD"])
    if any(re.match(r"^(README\.md$|docs/|src/|bin/|test/|\.github/|tools/mutation-matrix\.mjs$)", n)
           for n in names.splitlines()):
        stale_rev = r
        break

if stale_rev:
    inj3 = os.path.join(tmpdir, "final-stale.json")
    doc3 = json.loads(json.dumps(fin))
    doc3["meta"]["measuredCommit"] = stale_rev
    doc3["meta"]["measuredRev"] = stale_rev
    json.dump(doc3, open(inj3, "w"))
    rc7, out7, err7 = run(["node", "tools/detection-floor.mjs", "--final", inj3], timeout=600)
    _, names7, _ = run(["git", "diff", "--name-only", stale_rev, "HEAD"])
    rel = [n for n in names7.splitlines()
           if re.match(r"^(README\.md$|docs/|src/|bin/|test/|\.github/|tools/mutation-matrix\.mjs$)", n)]
    cell("C7 a genuinely stale record is refused, not exempted",
         rc7 == 3 and "STALE" in (out7 + err7).upper(),
         "conductor injection: measuredCommit -> %s, whose diff to HEAD touches\n"
         "  verdict-relevant paths: %s\n"
         "exit=%d (3 == STALE required)   says STALE=%s\n"
         "no partition may be printed on a stale record: SAME-GUARD header present=%s"
         % (stale_rev[:7], rel, rc7, "STALE" in (out7 + err7).upper(),
            "SAME-GUARD (" in out7))
else:
    cell("C7 a genuinely stale record is refused, not exempted", False,
         "could not find a rev in the last 25 whose diff to HEAD touches a\n"
         "verdict-relevant path -- cell NOT RUN, reported as not-run.")

# ------------ C8 the finding re-derives from the single entry point
rc8, out8, err8 = run(["node", "tools/run-all.mjs"], timeout=1800)
has_floor = "detection-floor" in out8
mm_skipped = re.search(r"SKIPPED:.*mutation-matrix", out8) is not None
cell("C8 registered in run-all.mjs; mutation-matrix still SKIPPED, not dropped",
     rc8 == 0 and has_floor and mm_skipped,
     "exit=%d   detection-floor present in output=%s   mutation-matrix still\n"
     "  explicitly SKIPPED (not silently dropped)=%s\n"
     "rollup line: %s"
     % (rc8, has_floor, mm_skipped,
        next((l for l in out8.splitlines() if "ran clean" in l or "PROBLEM" in l), "(none)")))

# ------------ C9 W-6 standing invariant
corpus_sha = sha256_file(os.path.join(ROOT, "src", "corpus.js"))
_, helpout, _ = run(["node", "bin/aphorism.js", "--help"])
help_sha = sha256_bytes(helpout.encode())
_, frozen, _ = run(["git", "status", "--porcelain", "--",
                    "src", "bin", "test", ".github", "README.md", "docs"])

manifests = ["package.json", "package-lock.json", "npm-shrinkwrap.json",
             "yarn.lock", "pnpm-lock.yaml", "bun.lockb"]
_, tracked, _ = run(["git", "ls-files"] + manifests)
on_disk = [m for m in manifests if os.path.exists(os.path.join(ROOT, m))]
node_modules = os.path.exists(os.path.join(ROOT, "node_modules"))

imports = []
for f in sorted(os.listdir(os.path.join(ROOT, "tools"))):
    if f.endswith(".mjs"):
        for spec in re.findall(r"""(?m)^\s*import[^'"]*['"]([^'"]+)['"]""",
                               open(os.path.join(ROOT, "tools", f)).read()):
            imports.append((f, spec))
non_builtin = [(f, s) for f, s in imports if not s.startswith("node:")]
# converse control: the classifier must reject three non-builtin shapes
probe_specs = ["lodash", "./helper.js", "../node_modules/x/index.js"]
probe_rejected = [s for s in probe_specs if not s.startswith("node:")]

cell("C9 W-6 standing invariant re-measured",
     corpus_sha == "77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e"
     and help_sha == "d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64"
     and not frozen.strip() and not tracked.strip() and not on_disk
     and not node_modules and not non_builtin and len(probe_rejected) == 3,
     "src/corpus.js sha256 : %s  (baseline 77a4de5c...)  unmoved=%s\n"
     "--help        sha256 : %s  (baseline d759d781...)  unmoved=%s\n"
     "git status over src bin test .github README.md docs: %r (must be empty)\n"
     "dependency surface (restated, this repo has never had a manifest):\n"
     "  manifests/lockfiles tracked : %r\n"
     "  manifests/lockfiles on disk : %s\n"
     "  node_modules present        : %s\n"
     "  tools/ imports              : %d total, %d non-node: builtins %s\n"
     "  converse control -- classifier rejects %d/3 of %s"
     % (corpus_sha[:16], corpus_sha.startswith("77a4de5c"),
        help_sha[:16], help_sha.startswith("d759d781"),
        frozen.strip(), tracked.strip(), on_disk, node_modules,
        len(imports), len(non_builtin), non_builtin,
        len(probe_rejected), probe_specs))

# ------------ C10 test_cmd, parsed from the reporter node --test ACTUALLY emits
rc10, out10, err10 = run(["node", "--test"] +
                         sorted("test/" + f for f in os.listdir(os.path.join(ROOT, "test"))
                                if f.endswith(".test.js")), timeout=1800)
blob = out10 + err10


def tapnum(key):
    m = re.search(r"(?m)^\s*ℹ %s (\d+)\s*$" % key, blob)
    return int(m.group(1)) if m else -1


t, p, f, s = tapnum("tests"), tapnum("pass"), tapnum("fail"), tapnum("skipped")
cell("C10 test_cmd green at the gated tree",
     rc10 == 0 and t > 0 and f == 0 and p == t,
     "node --test test/*.test.js  exit=%d\n"
     "tests=%d pass=%d fail=%d skipped=%d\n"
     "(a DROP from the 129 run baseline is a PASS under S-1; HEAD is 128 after\n"
     " W-7's cycle-4 guard consolidation.)" % (rc10, t, p, f, s))

# ------------ C11 the ruling survives machine-readably, on failing runs too
def ruling_parts(text):
    return {
        "id": "W8-R1" in text,
        "ruling": bool(re.search(r"(?s)RULING W8-R1:.*NOT a lost detection", text)),
        "for": "FOR the ruling" in text,
        "against": "AGAINST the ruling" in text,
        "falsifier": "WHAT WOULD MAKE IT WRONG" in text,
        "scope": "SCOPE GUARD" in text,
    }


on_pass = ruling_parts(out4)
on_fail = ruling_parts(out5 + err5)
cell("C11 ruling W8-R1 is durable -- printed on passing AND failing runs",
     all(on_pass.values()) and all(on_fail.values()),
     "on the PASSING run : %s\n"
     "on the FAILING run : %s\n"
     "(the ruling is the part of W-8 no mechanism can produce; a ruling that\n"
     " only prints when the news is good is not a record.)"
     % (on_pass, on_fail))

shutil.rmtree(tmpdir, ignore_errors=True)

print("\n" + "=" * 78)
ok = sum(1 for _, v, _ in CELLS if v)
for n, v, _ in CELLS:
    print("  %-4s %s" % ("PASS" if v else "FAIL", n))
print("GATE: %d/%d cells pass" % (ok, len(CELLS)))
print("=" * 78)
sys.exit(0 if ok == len(CELLS) else 1)
