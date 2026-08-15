#!/usr/bin/env python3
"""Cycle 10 step-0 heartbeat: capture the conductor PID by walking up the process
tree to the claude binary, then stamp the runfile heartbeat. Worst-case wave budget
(2700s) is used until step 4 picks the work type."""
import json, os, subprocess, sys, time

RUNFILE = "/opt/swarm/runs/current.json"


def cmd_of(pid):
    try:
        return subprocess.run(["ps", "-o", "command=", "-p", str(pid)],
                              capture_output=True, text=True).stdout.strip()
    except Exception:
        return ""


def ppid_of(pid):
    try:
        out = subprocess.run(["ps", "-o", "ppid=", "-p", str(pid)],
                             capture_output=True, text=True).stdout.strip()
        return int(out) if out else 0
    except Exception:
        return 0


def find_conductor_pid():
    pid = os.getpid()
    trail = []
    for _ in range(10):
        c = cmd_of(pid)
        trail.append((pid, c[:70]))
        if "claude" in c:
            return pid, trail
        nxt = ppid_of(pid)
        if nxt in (0, 1):
            return os.getppid(), trail
        pid = nxt
    return os.getppid(), trail


pid, trail = find_conductor_pid()
now = int(time.time())

with open(RUNFILE) as f:
    rf = json.load(f)

rf["heartbeat"] = {
    "ts": now,
    "next_wakeup_at": now + 2700,
    "pid": pid,
    "limp": rf["heartbeat"].get("limp", False),
    "degraded_tiers": rf["heartbeat"].get("degraded_tiers", []),
}

tmp = RUNFILE + ".tmp"
with open(tmp, "w") as f:
    json.dump(rf, f, indent=2)
os.replace(tmp, RUNFILE)

for p, c in trail:
    print(f"  hop pid={p} cmd={c}")
print(f"conductor pid={pid}  ts={now}  next_wakeup_at={now + 2700}")
