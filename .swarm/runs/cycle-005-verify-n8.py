# Conductor verify check, cycle 5, item N-8 (REPORT.md hand-off section).
# Authored at verification time by the conductor; not taken from any builder note.
# N-8's section asserts several COUNT claims. K-4 forbids a false count claim anywhere
# in the docs, so each is re-derived here from the live tree rather than trusted.
import json
import re
import subprocess

BIN = "/opt/targets/aphorism-cli/bin/aphorism.js"
ROOT = "/opt/targets/aphorism-cli/"

print("--- CLAIM: triage bands are 8 HIGH / 16 MEDIUM / 26 LOW ---")
triage = open(ROOT + "docs/corpus-attribution-triage.md").read()
for band in ("HIGH", "MEDIUM", "LOW"):
    # count table rows whose risk cell is exactly this band
    n = len(re.findall(r"\|\s*" + band + r"\s*\|", triage))
    print("  %-6s rows matching a risk cell: %d" % (band, n))

print("--- CLAIM: corpus tag vocabulary is 12 tags (37 -> 12 at cycle 46) ---")
src = open(ROOT + "src/corpus.js").read()
tags = sorted(set(re.findall(r"'([a-z-]+)'", src.split("tags:")[1])) ) if "tags:" in src else []
alltags = set()
for m in re.findall(r"tags:\s*\[([^\]]*)\]", src):
    for t in re.findall(r"['\"]([^'\"]+)['\"]", m):
        alltags.add(t)
print("  distinct tags in src/corpus.js: %d -> %s" % (len(alltags), sorted(alltags)))
entries = len(re.findall(r"tags:\s*\[", src))
print("  corpus entries: %d" % entries)

print("--- CLAIM: the fold map lives in .swarm/runs/cycle-046-retag.mjs ---")
import os
p = ROOT + ".swarm/runs/cycle-046-retag.mjs"
print("  exists: %s" % os.path.exists(p))
if os.path.exists(p):
    body = open(p).read()
    pairs = re.findall(r"['\"]([a-z-]+)['\"]\s*:\s*['\"]([a-z-]+)['\"]", body)
    print("  mapping pairs found: %d (claim says 26-name fold map)" % len(pairs))
    print("  testing -> %s" % dict(pairs).get("testing"))

print("--- CLAIM: seed 0 -> Kernighan, seed -0 -> Saint-Exupery (DIFFERENT) ---")
for s in ("0", "-0"):
    r = subprocess.run(["node", BIN, "--seed", s, "--json"], capture_output=True, text=True)
    try:
        print("  seed %-3s exit=%d author=%s" % (s, r.returncode, json.loads(r.stdout)["author"]))
    except Exception:
        print("  seed %-3s exit=%d RAW=%r" % (s, r.returncode, r.stdout[:80]))

print("--- CLAIM: usage error wins over --help in BOTH argv orders (exit 2) ---")
for argv in (["--help", "--seed", "abc"], ["--seed", "abc", "--help"], ["--help"]):
    r = subprocess.run(["node", BIN] + argv, capture_output=True, text=True)
    print("  %-28s exit=%d stderr=%r stdout_len=%d"
          % (" ".join(argv), r.returncode, r.stderr.strip()[:60], len(r.stdout)))
