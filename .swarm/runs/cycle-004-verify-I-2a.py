"""Conductor verification of item I-2a (cycle 4) — INDEPENDENT re-measurement.

Authored at verification time, after the sweep agent returned. Every mutation below is
re-derived by the conductor from the agent's one-SENTENCE description of the mutation,
never copied from the agent's recorded diff: if the agent's diff had been a subtle no-op,
copying it would reproduce the no-op and the check would pass vacuously.

Two samples:
  * ALL 7 claimed SURVIVORS  -> a false survivor claim (mutation is really killed, or is
    equivalent) shows up as a mismatch.
  * 4 claimed KILLS          -> the falsification control. Under-reporting survivors is
    the worse error, so a claimed kill that actually survives must be caught.

Per mutant: a fresh WHOLE-REPO-minus-.git scratch copy (playbook L-030), exactly one
edit, a conductor-authored observable-difference probe against the pristine binary, then
the full suite. A mutant whose observable probe shows NO difference is EQUIVALENT and its
SURVIVED claim is rejected regardless of what the suite did.
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path("/opt/targets/aphorism-cli")
SCRATCH = Path("/opt/swarm/runs/verify-scratch-c4")
BIN = "bin/aphorism.js"
SEL = "src/select.js"
ARGS = "src/args.js"

# (id, claimed_verdict, file, old, new, probe_argv, description)
MUTANTS = [
    # ---------- claimed SURVIVORS ----------
    ("M07", "SURVIVED", SEL,
     "entry.tags.some((t) => t.toLowerCase() === needle)",
     "entry.tags.some((t) => t.toLowerCase().includes(needle))",
     ["--list", "--tag", "test"],
     "tag membership: swap === for .includes()"),

    ("M12", "SURVIVED", BIN,
     "    const body = candidates\n",
     "    const body = candidates.slice(0, -1)\n",
     ["--list"],
     "--list drops the last matching entry"),

    ("M13", "SURVIVED", BIN,
     "    const body = candidates\n",
     "    const body = candidates.slice().reverse()\n",
     ["--list"],
     "--list reverses corpus order"),

    ("M14", "SURVIVED", BIN,
     "${opts.json ? JSON.stringify(chosen) : format(chosen)}",
     "${opts.json ? JSON.stringify(chosen, null, 2) : format(chosen)}",
     ["--json", "--seed", "7"],
     "--json pretty-prints instead of emitting one line"),

    ("M16", "SURVIVED", BIN,
     "    const body = candidates\n"
     "      .map((e) => (opts.json ? JSON.stringify(e) : `${e.text} \u2014 ${e.author}`))\n"
     "      .join('\\n');\n",
     "    const body = opts.json\n"
     "      ? JSON.stringify(candidates, null, 2)\n"
     "      : candidates.map((e) => `${e.text} \u2014 ${e.author}`).join('\\n');\n",
     ["--list", "--json", "--tag", "yagni"],
     "--list --json emits one pretty JSON array instead of NDJSON"),

    ("M21", "SURVIVED", ARGS,
     "  if (Number.isNaN(n)) return { ok: false };",
     "  if (Number.isNaN(n) || n < 0) return { ok: false };",
     ["--seed", "-5", "--json"],
     "parseSeedValue rejects negative seeds"),

    ("M22", "SURVIVED", ARGS,
     "      if (next === undefined || looksLikeFlag(next)) {",
     "      if (next === undefined || (arg !== '--seed' && looksLikeFlag(next))) {",
     ["--seed", "--list"],
     "--seed loses its flag-lookahead guard"),

    # ---------- claimed KILLS (falsification control) ----------
    ("K-M04", "KILLED", SEL,
     "      entry.author.toLowerCase().includes(needle)",
     "      entry.author.includes(needle)",
     ["--list", "--author", "dijkstra"],
     "author match loses case-insensitivity on the entry side"),

    ("K-M08", "KILLED", SEL,
     "    const needle = String(tag).toLowerCase();\n    result = result.filter((entry) =>",
     "    const needle = String(tag).toLowerCase();\n    result = corpus.slice().filter((entry) =>",
     ["--list", "--author", "dijkstra", "--tag", "management"],
     "author+tag stops being an AND: the tag filter discards the author narrowing"),

    ("K-M09", "KILLED", BIN,
     "const EXIT_NO_MATCH = 1;",
     "const EXIT_NO_MATCH = 0;",
     ["--author", "nobody-said-this-ever"],
     "empty-match exit code becomes 0"),

    ("K-M15", "KILLED", BIN,
     "${opts.json ? JSON.stringify(chosen) : format(chosen)}",
     "${opts.json ? JSON.stringify({ text: chosen.text, author: chosen.author }) : format(chosen)}",
     ["--json", "--seed", "7"],
     "--json drops the tags field"),
]


def copy_repo(dest):
    """WHOLE repo minus .git — never a hand-enumerated file subset (L-030)."""
    shutil.copytree(REPO, dest, ignore=shutil.ignore_patterns(".git"))


def run_suite(cwd):
    r = subprocess.run("node --test test/*.test.js", shell=True, cwd=cwd,
                       capture_output=True, text=True)
    blob = r.stdout + r.stderr
    def grab(label):
        m = re.search(r"^[^\n]*?\b" + label + r"\s+(\d+)\s*$", blob, re.M)
        return int(m.group(1)) if m else None
    return {"exit": r.returncode, "pass": grab("pass"), "fail": grab("fail"),
            "failing": sorted(set(re.findall(r"^not ok \d+ - (.+?)$", blob, re.M)))}


def run_cli(cwd, argv):
    r = subprocess.run([sys.executable and "node", "bin/aphorism.js", *argv],
                       cwd=cwd, capture_output=True, text=True)
    return (r.returncode, r.stdout, r.stderr)


def brief(triple, limit=110):
    code, out, err = triple
    s = f"exit={code} stdout[{len(out)}B]={out[:limit]!r} stderr={err.strip()[:limit]!r}"
    return s.replace("\\n", "\\n")


def main():
    if SCRATCH.exists():
        shutil.rmtree(SCRATCH)
    SCRATCH.mkdir(parents=True)

    print("=" * 78)
    print("I-2a VERIFICATION — conductor-authored, run after the sweep returned")
    print("=" * 78)

    pristine = SCRATCH / "pristine"
    copy_repo(pristine)
    base = run_suite(pristine)
    print(f"\nBASELINE (pristine whole-repo copy): exit={base['exit']} "
          f"pass={base['pass']} fail={base['fail']}")
    if base["pass"] != 52 or base["fail"] != 0:
        print("BASELINE MISMATCH — aborting")
        return 1

    rows = []
    for mid, claimed, rel, old, new, probe, desc in MUTANTS:
        d = SCRATCH / mid
        copy_repo(d)
        f = d / rel
        src = f.read_text()
        n = src.count(old)
        if n != 1:
            rows.append((mid, claimed, "PATCH-FAILED", f"anchor matched {n}x", "", ""))
            print(f"\n--- {mid}: PATCH ANCHOR MATCHED {n}x — mutation not applied")
            continue
        f.write_text(src.replace(old, new))

        pr = run_cli(pristine, probe)
        mu = run_cli(d, probe)
        differs = pr != mu
        res = run_suite(d)
        observed = "KILLED" if (res["fail"] or 0) > 0 else "SURVIVED"
        if not differs:
            observed = "EQUIVALENT"
        agree = "AGREES" if observed == claimed else "*** DISAGREES ***"
        rows.append((mid, claimed, observed, agree, res, differs))

        print(f"\n--- {mid} [{rel}] {desc}")
        print(f"    probe: aphorism {' '.join(probe)}")
        print(f"    pristine: {brief(pr)}")
        print(f"    mutant  : {brief(mu)}")
        print(f"    observable difference: {differs}")
        print(f"    suite: exit={res['exit']} pass={res['pass']} fail={res['fail']}"
              + (f" failing={res['failing']}" if res["failing"] else ""))
        print(f"    claimed={claimed}  observed={observed}  -> {agree}")

    print("\n" + "=" * 78)
    print("SUMMARY")
    print("=" * 78)
    bad = 0
    for r in rows:
        mid, claimed, observed = r[0], r[1], r[2]
        flag = "ok  " if (len(r) > 3 and r[3] == "AGREES") else "BAD "
        if flag == "BAD ":
            bad += 1
        print(f"  {flag} {mid:<6} claimed={claimed:<10} observed={observed}")
    print(f"\n{len(rows) - bad}/{len(rows)} agree with the agent's claim; {bad} disagree.")

    shutil.rmtree(SCRATCH)
    print(f"scratch removed: {SCRATCH}")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
