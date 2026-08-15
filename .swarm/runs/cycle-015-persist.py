#!/usr/bin/env python3
"""Cycle 15 persist: state.json, backlog.json (atomic each), then the journal block."""
import json, os, time

T = "/opt/targets/aphorism-cli/.swarm"

def atomic(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)

# ---------------- state.json ----------------
s = json.load(open(T + "/state.json"))
s["cycle"] = 15
s["phase"] = "POLISH"
s["last_cycle"] = {
    "n": 15,
    "work": ("build-wave (one item, k_cap 1 at gear 1) -- T-010, the date-seeded quote-of-the-day "
             "recipe in the README usage examples. First build-wave.js dispatch of this run; the "
             "Workflow tool was permitted for the second consecutive cycle."),
    "outcome": ("VERIFIED done. 19/19 conductor harness checks including 4 negative controls; the "
                "README line was executed verbatim through bash and matched the today-seeded output; "
                "diff is exactly 1 insertion / 0 deletions; suite 59/59. Two harness checks were "
                "REPAIRED mid-gate (a wrong node --test summary marker and a section fence coarser "
                "than the dispatch's own scope) -- both repairs tightened the assertions. Residual "
                "overclaim measured and filed as T-011, not absorbed."),
    "commit": "PENDING",
}
c = s.setdefault("counters", {})
c["consecutive_no_value"] = 0
c["consecutive_failures"] = 0
# Wave autotune: the wave was CLEAN (zero reverts, zero failed verifies) -> streak 1 -> 2,
# which fires the bump; k_current is already at the hard max of 5, so it stays and the
# streak resets. Inert this cycle either way -- gear 1 clamps the effective wave to 1.
c["wave_streak"] = 0
c["k_current"] = 5
atomic(T + "/state.json", s)

# ---------------- backlog.json ----------------
b = json.load(open(T + "/backlog.json"))
items = b["items"]
by_id = {i["id"]: i for i in items}

t10 = by_id["T-010"]
t10["status"] = "done"
t10["notes"] = t10.get("notes", "") + (
    " CYCLE 15 VERIFIED: landed as a single README line inside the usage-examples fence -- "
    "`node bin/aphorism.js --seed $(date +%Y%m%d)      # same aphorism all day; changes at local "
    "midnight`. Conductor harness .swarm/runs/cycle-015-verify-T-010.{js,txt}: 19/19 with 4 negative "
    "controls. The line was pasted verbatim into bash and its output matched the today-seeded run "
    "byte for byte (A6/A7), so the recipe is proven against the shipped binary rather than read. "
    "Scope clean: 1 insertion, 0 deletions, Flags table and every fenced section byte-identical."
)

# Out-of-scope hygiene (cycle.md step 3, every 5th cycle). T-005 is a feature and the SPEC's
# Non-goals exclude every Nice-to-have for this run, so it is unpickable by construction --
# leaving it `todo` misreports it as available work every time the board is read. `dropped`
# never deletes: the record and its reasoning survive for the next run's spec.
t05 = by_id["T-005"]
t05["status"] = "dropped"
t05["notes"] = t05.get("notes", "") + (
    " CYCLE 15 HYGIENE: dropped as out of scope, not as low value. SPEC Non-goals: 'This run only: "
    "any new user-visible feature, including every Nice-to-have above', and rotation is listed under "
    "Nice-to-haves. Kept for the record because the cycle-14 taste pass independently named no-repeat "
    "rotation as the structural fix for its top complaint (wears-thin) -- that makes it the strongest "
    "candidate for the NEXT run's spec, and dropping it here is a scope statement, not a verdict on "
    "its worth."
)

items.append({
    "id": "T-011",
    "title": "Tighten the quote-of-the-day recipe's change claim to match the measured behaviour",
    "kind": "docs",
    "priority": 5,
    "value": "M",
    "effort": "S",
    "status": "todo",
    "deps": ["T-010"],
    "files_hint": ["README.md"],
    "packages": [],
    "model": "haiku",
    "attempts": 0,
    "acceptance": (
        "The README's date-seed recipe comment does not imply the aphorism always differs from one "
        "day to the next. Reworded so it stays true on the days it repeats, without adding a "
        "sentence of hedging clutter to a one-line example -- the comment must remain a single "
        "trailing comment on one line."
    ),
    "notes": (
        "Source: conductor verification gate, cycle 15 (harness check A4/A9). MEASURED, not suspected: "
        "sweeping 365 consecutive date seeds against the shipped binary, 11 of 364 consecutive-day "
        "pairs return the SAME aphorism (~3%) -- the seed always changes at local midnight, but the "
        "selection it maps to does not. First few: 20261015->20261016, 20261107->20261108, "
        "20270121->20270122. Over a year all 50 corpus entries appear. The shipped comment reads "
        "'same aphorism all day; changes at local midnight', whose subject is ambiguous: read as 'the "
        "aphorism changes at local midnight' it is false about 11 days a year. It is NOT a gate "
        "failure -- A9 passed, since the phrasing carries no unhedged every-day-different promise, and "
        "the clause it does make unambiguously (local midnight, not UTC) is exactly right. Filed "
        "rather than absorbed because this run's identity is closing doc/behaviour divergences (I-3) "
        "and sweeping overclaiming language (I-4a); prose this run ADDS is held to the same standard. "
        "Deliberately not fixed by the conductor: the conductor authored the gate that found it, and "
        "fixing it inline would be coding to its own check."
    ),
})
atomic(T + "/backlog.json", b)

from collections import Counter
print("backlog:", Counter(i["status"] for i in items), "live:", len(items))
print("state: cycle", s["cycle"], "phase", s["phase"])
