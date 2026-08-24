#!/usr/bin/env python3
"""
r8-gate-c7-addendum.py -- re-takes the three cells r8-gate-c7.py got WRONG.

r8-gate-c7.py is committed exactly as it ran, at 10/13. All three of its
failures were defects in the conductor's own instrument, not in W-8's work.
Each is named in the header of the cell that replaces it. Nothing has been
re-labelled and nothing was silently re-run.

  D1 (C1)  The scope classifier ran AFTER this gate had already written its own
           script and transcript into .swarm/runs/, then reported those two
           conductor-authored files as "outside declared scope". The check was
           measuring itself.

  D2 (C2b) The "does the instrument re-derive its mutation table from
           guard-inventory.mjs at runtime?" probe stripped // comments from
           tools/DETECTION-FLOOR.mjs (the wrong file) and then substring-matched
           "guard-inventory" -- which appears there inside the W8-R1 RULING TEXT
           as a string literal, not as an invocation. It answered True on the
           strength of prose in an unrelated file.

  D3 (C4)  The conductor's independent partition compared the `guardTitle`
           field between the two records to decide SAME-GUARD vs GUARD-CHANGED.
           `guardTitle` is the TRANSCRIBED title from the instrument's hardcoded
           mutation table: it is byte-identical in both records for all 15
           shared ids BY CONSTRUCTION (measured below), so that rule could never
           return GUARD-CHANGED for anything. The measured signal is
           `firedGuards` -- which guard actually fired in the measured tree.
           The tool was right and the gate was wrong.
"""

import json
import os
import re
import subprocess
import sys

ROOT = "/opt/targets/aphorism-cli"
CELLS = []


def cell(name, ok, detail):
    CELLS.append((name, bool(ok), detail))
    print("\n--> %s %s" % (name, "PASS" if ok else "FAIL"))
    for line in str(detail).splitlines():
        print("    " + line)
    return ok


def run(args, cwd=ROOT, timeout=900):
    p = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout, p.stderr


print("=" * 78)
print("W-8 GATE ADDENDUM -- run #8 cycle 7 -- re-taking C1, C2b, C4")
print("=" * 78)

base = json.load(open(os.path.join(ROOT, "tools", "mutation-matrix-baseline.json")))
fin = json.load(open(os.path.join(ROOT, "tools", "mutation-matrix-final.json")))

# ------------------------------------------------------------------- C1'
# D1: partition the working tree into BUILDER scope and CONDUCTOR gate
# artifacts, each enumerated explicitly. A wildcard over .swarm/ would let work
# hide there, so every conductor file is named individually.
BUILDER_SCOPE = {"tools/detection-floor.mjs",
                 "tools/mutation-matrix-final.json",
                 "tools/run-all.mjs"}
CONDUCTOR_ARTIFACTS = {".swarm/runs/r8-gate-c7.py",
                       ".swarm/runs/r8-cycle-007-verify-gate.txt",
                       ".swarm/runs/r8-gate-c7-addendum.py",
                       ".swarm/runs/r8-cycle-007-verify-gate-addendum.txt"}

_, porcelain, _ = run(["git", "status", "--porcelain"])
touched = sorted({ln[3:].strip() for ln in porcelain.splitlines() if ln.strip()})
builder = [p for p in touched if p in BUILDER_SCOPE]
conductor = [p for p in touched if p in CONDUCTOR_ARTIFACTS]
unclassified = [p for p in touched if p not in BUILDER_SCOPE | CONDUCTOR_ARTIFACTS]

# converse control: the classifier must still reject real work paths AND a
# plausible file smuggled under .swarm/ that is not one of the named artifacts.
PROBES = ["src/corpus.js", "test/readme-tags.test.js", "README.md",
          "tools/mutation-matrix-baseline.json", ".swarm/runs/sneaky-builder-file.mjs"]
accepted = [p for p in PROBES if p in BUILDER_SCOPE | CONDUCTOR_ARTIFACTS]

scratch = [d for d in os.listdir(ROOT) if d.startswith(".scratch")]

cell("C1' scope, with conductor gate artifacts partitioned out by name  [fixes D1]",
     not unclassified and not accepted and not scratch,
     "builder-scope paths touched   : %s\n"
     "conductor gate artifacts      : %s\n"
     "UNCLASSIFIED (must be empty)  : %s\n"
     "converse control -- %d/%d of these must be rejected, %d accepted: %s\n"
     "  (the last probe is a plausible builder file smuggled under .swarm/;\n"
     "   the conductor set is enumerated by name, never by wildcard, so it is\n"
     "   rejected too)\n"
     "leftover .scratch* trees      : %s"
     % (builder, conductor, unclassified, len(PROBES), len(PROBES), len(accepted),
        PROBES, scratch))

# ------------------------------------------------------------------ C2b'
# D2: ask the right file, and ask for an INVOCATION rather than a substring.
mm_src = open(os.path.join(ROOT, "tools", "mutation-matrix.mjs")).read()
mm_code = re.sub(r"(?m)^\s*//.*$", "", mm_src)          # drop line comments
mm_code = re.sub(r"(?s)/\*.*?\*/", "", mm_code)          # drop block comments
invocation = re.search(
    r"(spawnSync|execFileSync|execSync|import\s*\(|from)\s*\(?[^\n;]{0,120}guard-inventory",
    mm_code)
mentions_in_code = [ln.strip()[:100] for ln in mm_code.splitlines()
                    if "guard-inventory" in ln]

edit_files = sorted({e["file"] for r in base["results"] + fin["results"]
                     for e in r.get("edits", [])})
VR = re.compile(r"^(README\.md$|docs/|src/|bin/|test/|\.github/|tools/mutation-matrix\.mjs$)")
covered = [f for f in edit_files if VR.match(f)]
uncovered = [f for f in edit_files if not VR.match(f)]
# converse control: the pattern must NOT match files that are genuinely
# irrelevant to a verdict, or the exemption would be a no-op.
IRRELEVANT = ["REPORT.md", ".swarm/journal.md", "tools/detection-floor.mjs",
              "tools/citation-tax.mjs"]
wrongly_relevant = [f for f in IRRELEVANT if VR.match(f)]

cell("C2b' the freshness exemption covers every real verdict input  [fixes D2]",
     not uncovered and invocation is None and not wrongly_relevant,
     "files any mutation actually edits (measured from both records): %s\n"
     "  matched by VERDICT_RELEVANT: %s   unmatched: %s\n"
     "does tools/mutation-matrix.mjs INVOKE guard-inventory.mjs at runtime?\n"
     "  (comments stripped, searching for a call/import, not a substring)\n"
     "  invocation found : %s\n"
     "  guard-inventory mentions surviving in code (not comments): %s\n"
     "  => the 18-row mutation table is hardcoded and transcribed at baseline,\n"
     "     so guard-inventory.mjs is correctly NOT a verdict input.\n"
     "guards fire from test/ and the table lives in tools/mutation-matrix.mjs,\n"
     "  both inside the pattern.\n"
     "converse control -- these must NOT be verdict-relevant, %d wrongly matched: %s"
     % (edit_files, covered, uncovered, bool(invocation), mentions_in_code,
        len(wrongly_relevant), IRRELEVANT))

# ------------------------------------------------------------------- C4'
# D3: decide SAME vs CHANGED from firedGuards -- the measured signal -- and
# first prove that guardTitle could not have worked.
bm = {r["id"]: r for r in base["results"]}
fm = {r["id"]: r for r in fin["results"]}
shared = sorted(set(bm) & set(fm))
title_is_constant = all(bm[i].get("guardTitle") == fm[i].get("guardTitle") for i in shared)

# precondition: at baseline, each CAUGHT row's OWN named guard must have fired,
# or "did the named guard still fire?" is not a meaningful question for it.
def fired_titles(rec):
    return {g.get("title") for g in rec.get("firedGuards", [])}


precondition_violations = [i for i, r in bm.items()
                           if r["verdict"] == "CAUGHT"
                           and r.get("guardTitle") not in fired_titles(r)]

fin_skip = {s["id"]: s for s in fin["skippedClaims"]}
same, changed, gone, lost, unacc = set(), set(), set(), set(), set()
for i, r in bm.items():
    if r["verdict"] != "CAUGHT":
        continue
    if i in fm:
        f = fm[i]
        if f["verdict"] != "CAUGHT":
            lost.add(i)
        elif r.get("guardTitle") in fired_titles(f):
            same.add(i)
        else:
            changed.add(i)
    elif i in fin_skip:
        gone.add(i)
    else:
        unacc.add(i)

rc, out, err = run(["node", "tools/detection-floor.mjs"], timeout=600)


def parse_bucket(text, header):
    m = re.search(r"(?m)^%s \((\d+)\):.*$" % re.escape(header), text)
    if not m:
        return None, None
    tail = text[m.end():]
    stop = re.search(r"(?m)^(?:[A-Z][A-Z -]+ \(\d+\)|=====|VERDICT)", tail)
    body = tail[:stop.start()] if stop else tail
    return int(m.group(1)), {x for x in re.findall(r"(?m)^  (M\d\d)\s", body)}


t_same_n, t_same = parse_bucket(out, "SAME-GUARD")
t_chg_n, t_chg = parse_bucket(out, "GUARD-CHANGED")
t_gone_n, t_gone = parse_bucket(out, "CLAIM-GONE")
t_lost_n, _ = parse_bucket(out, "DETECTION-LOST")

caught_total = len([r for r in base["results"] if r["verdict"] == "CAUGHT"])
complete = len(same | changed | gone | lost) == caught_total and not unacc
agree = (t_same == same and t_chg == changed and t_gone == gone
         and t_lost_n == len(lost) == 0 and complete
         and not precondition_violations and title_is_constant)

# what the CHANGED row actually looks like, measured not asserted
changed_detail = "\n".join(
    "  %s baseline named guard : %s\n"
    "      still fires at HEAD  : %s\n"
    "      fired at HEAD instead: %s"
    % (i, (bm[i].get("guardTitle") or "")[:70],
       bm[i].get("guardTitle") in fired_titles(fm[i]),
       sorted(t[:70] for t in fired_titles(fm[i])))
    for i in sorted(changed))

cell("C4' partition recomputed from firedGuards matches the tool  [fixes D3]",
     rc == 0 and agree,
     "PROOF THE OLD RULE COULD NOT WORK: guardTitle is byte-identical between\n"
     "  the two records for all %d shared ids: %s\n"
     "  -- it is transcribed from the hardcoded table, not measured, so\n"
     "     comparing it can never yield GUARD-CHANGED.\n"
     "precondition (every baseline CAUGHT row's own named guard fired at\n"
     "  baseline) violations: %s\n"
     "\n"
     "detection-floor.mjs exit : %d\n"
     "conductor SAME-GUARD (%2d): %s\n"
     "tool      SAME-GUARD (%2d): %s   equal=%s\n"
     "conductor GUARD-CHANGED(%d): %s\n"
     "tool      GUARD-CHANGED(%s): %s   equal=%s\n"
     "conductor CLAIM-GONE  (%d): %s\n"
     "tool      CLAIM-GONE  (%s): %s   equal=%s\n"
     "conductor DETECTION-LOST : %s     tool header said %s\n"
     "conductor UNACCOUNTED    : %s\n"
     "baseline CAUGHT total %d; buckets sum to %d; complete=%s\n"
     "\n"
     "the one GUARD-CHANGED row, measured:\n%s"
     % (len(shared), title_is_constant, precondition_violations, rc,
        len(same), sorted(same), t_same_n, sorted(t_same or []), t_same == same,
        len(changed), sorted(changed), t_chg_n, sorted(t_chg or []), t_chg == changed,
        len(gone), sorted(gone), t_gone_n, sorted(t_gone or []), t_gone == gone,
        sorted(lost), t_lost_n, sorted(unacc),
        caught_total, len(same | changed | gone | lost), complete, changed_detail))

print("\n" + "=" * 78)
ok = sum(1 for _, v, _ in CELLS if v)
for n, v, _ in CELLS:
    print("  %-4s %s" % ("PASS" if v else "FAIL", n))
print("ADDENDUM: %d/%d re-taken cells pass" % (ok, len(CELLS)))
print("=" * 78)
sys.exit(0 if ok == len(CELLS) else 1)
