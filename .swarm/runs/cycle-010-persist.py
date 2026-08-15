#!/usr/bin/env python3
"""Cycle 10 step-7 persist: backlog (I-4 decomposition + %5 hygiene), state.json,
journal block, runfile + .bak. Atomic writes (.tmp then replace) throughout."""
import json, os, time

T = "/opt/targets/aphorism-cli"
SW = "/opt/swarm"
BACKLOG = f"{T}/.swarm/backlog.json"
STATE = f"{T}/.swarm/state.json"
JOURNAL = f"{T}/.swarm/journal.md"
RUNFILE = f"{SW}/runs/current.json"

now = int(time.time())
CYCLE = 10


def atomic(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        f.write(text)
    os.replace(tmp, path)


# ---------------- backlog ----------------
bl = json.load(open(BACKLOG))
items = bl["items"]
by_id = {i["id"]: i for i in items}

# I-4 becomes an umbrella over the two slices decomposed this cycle.
i4 = by_id["I-4"]
i4["title"] = "Corpus attribution triage (umbrella — decomposed cycle 10 into I-4a + I-4b)"
i4["priority"] = 1
i4["deps"] = ["I-4a", "I-4b"]
i4["files_hint"] = []
i4["model"] = "conductor"
i4["notes"] += (
    " || DECOMPOSED cycle 10 into I-4a and I-4b, per the cycle-9 handoff's stated preference for "
    "S-effort slices over accepting one M-effort exception under gear 1. The split is NOT by risk "
    "band, which would have been circular — you cannot slice by a ranking the work exists to "
    "produce. It is by KIND of claim: I-4b is the ranked judgment artifact (what is likely wrong), "
    "I-4a is a mechanical repo sweep (does any file overclaim). Those need different evidence and "
    "different verification, which is what makes the seam real. This umbrella closes when I-4a lands; "
    "id retired from direct execution, not dropped."
)

i4b = {
    "id": "I-4b",
    "title": "Risk-ranked attribution triage document for the 50-entry corpus",
    "kind": "qa",
    "priority": 1,
    "value": "H",
    "effort": "S",
    "status": "done",
    "deps": [],
    "files_hint": ["docs/corpus-attribution-triage.md"],
    "acceptance": (
        "a written risk-ranked list names the corpus entries most likely to carry a wrong or "
        "unverifiable attribution, with an entry-specific stated reason for each of all 50 entries, "
        "and never presents itself as an audit"
    ),
    "packages": [],
    "model": "sonnet",
    "attempts": 0,
    "notes": (
        "TRIAGE, never an audit (KI-2, T-006). Dispatched as ONE sonnet Agent, file scope exactly "
        "docs/corpus-attribution-triage.md, network use explicitly forbidden — the deliverable's whole "
        "value depends on it being honest about resting on recall alone. || VERIFIED cycle 10. The hard "
        "problem: a triage is a JUDGMENT artifact, so no command's exit code can prove it right, and the "
        "usual gate has nothing to bite on. Two-part answer. (1) Everything mechanically provable was "
        "proven by harness .swarm/runs/cycle-010-verify-I-4b.js (16/16, evidence "
        ".swarm/runs/cycle-010-verify-I-4b.txt): all 50 entries covered exactly once and keyed to the "
        "corpus by TWO independent columns (author verbatim + text prefix, so a shifted or invented row "
        "cannot pass), fixed risk/signal vocabularies, non-degeneracy (>=3 bands, no band over 60%, 7 "
        "distinct signals), 50 distinct non-boilerplate reasons, the self-hedged Anonymous entry anchored "
        "to LOW, product tree byte-identical to HEAD and suite 59/59 green. Two NEGATIVE CONTROLS prove "
        "the checks can fail: a corrupted table (row dropped + author swapped) is rejected, and a "
        "hypothetical all-MEDIUM table fails non-degeneracy. (2) The substantive claim was measured "
        "against a ranking SEALED BEFORE DISPATCH (.swarm/runs/cycle-010-precommit.md): the agent's HIGH "
        "band {0,3,10,27,38,39,45,48} contains 4 of the 5 sealed Tier A entries, and independently found "
        "4 the conductor had not ranked HIGH. || CONDUCTOR ADDENDUM appended to the document, marked as "
        "separately authored: the four places the two independent derivations DISAGREED, recorded as "
        "disagreements between two unverified opinions rather than as corrections. Chief among them, row "
        "#45 asserts that Stroustrup's FAQ disclaims the foot-gun quote while the conductor recalls the "
        "opposite — that row is the only one in the table making a checkable claim about what a primary "
        "source says, so it was moved to the top of the human's queue precisely because the two passes "
        "conflict. Also added: the #25 Postel paraphrase the table rated LOW and missed."
    ),
}

i4a = {
    "id": "I-4a",
    "title": "Sweep the repo for language that overclaims the corpus as audited or verified",
    "kind": "fix",
    "priority": 2,
    "value": "M",
    "effort": "S",
    "status": "todo",
    "deps": ["I-4b"],
    "files_hint": ["src/corpus.js"],
    "acceptance": (
        "no file in the repo describes the corpus as audited, verified, fact-checked, or its "
        "attributions as honest/correct, and any such wording is replaced with an accurate "
        "description that points at docs/corpus-attribution-triage.md"
    ),
    "packages": [],
    "model": "conductor",
    "attempts": 0,
    "notes": (
        "The other half of I-4's acceptance clause. CONDUCTOR-SCOUTED cycle 10, not yet executed: "
        "a grep across README.md, REPORT.md and src/ found REPORT.md already honest (it states the "
        "attributions are unaudited and KI-2 open), but src/corpus.js carries a header comment claiming "
        "'honest attribution' and that uncertain entries 'are attributed to Anonymous rather than "
        "guessing a famous name'. I-4b measured that claim as false in at least 8 places: exactly one "
        "of 50 entries is hedged to Anonymous, while eight carry HIGH-risk attributions to named people. "
        "So this is a real overclaim in a PRODUCT file, not a paperwork tidy. Ordered AFTER I-4b "
        "deliberately — the triage supplies the evidence for what the replacement wording may honestly "
        "say, and doing it first would have meant writing the comment twice. Conductor-executed and "
        "S-effort: it is a prose edit to a product file, which by the cycle-8 precedent must be gated by "
        "byte-comparing everything outside the edited comment against HEAD."
    ),
}

items.insert(items.index(i4) + 1, i4b)
items.insert(items.index(i4) + 1, i4a)

# %5 hygiene: reprioritize to the actual remaining order; no dedupe or drops needed.
by_id["I-5"]["priority"] = 3
by_id["I-6"]["priority"] = 9
atomic(BACKLOG, json.dumps(bl, indent=2, ensure_ascii=False) + "\n")

live = [i for i in items if i["status"] != "dropped"]
counts = {}
for i in live:
    counts[i["status"]] = counts.get(i["status"], 0) + 1
print("backlog:", counts, "live:", len(live))

# ---------------- state ----------------
st = json.load(open(STATE))
st["cycle"] = CYCLE
st["decisions"].extend([
    {
        "cycle": 10,
        "what": "I-4 decomposed into I-4a (mechanical overclaim sweep) and I-4b (the ranked judgment "
                "artifact) — split by KIND OF CLAIM, not by risk band.",
        "why": "Cycle 9's handoff named two exits for I-4 not fitting gear 1's S-effort rule and "
               "preferred decomposition. The obvious decomposition — slice the corpus by risk band — is "
               "circular: the band assignment IS the deliverable, so you cannot use it to define the "
               "slices. Splitting by kind of claim gives two pieces that genuinely need DIFFERENT "
               "evidence: I-4b is a judgment that can only be cross-checked against an independent "
               "derivation, while I-4a is a mechanical grep-and-fix gated by byte-comparison. A seam "
               "that changes the verification method is a real seam; one that just halves the word "
               "count is not.",
    },
    {
        "cycle": 10,
        "what": "A judgment artifact was gated against a ranking SEALED TO DISK BEFORE the agent was "
                "dispatched, rather than by reading the output and agreeing with it.",
        "why": "Every prior gate this run had a command whose exit code carried the claim. A triage has "
               "none — it is 50 opinions about provenance, and reading it can only confirm that it reads "
               "well, which is precisely what a confabulated document also does. Writing the conductor's "
               "own high-risk list first (.swarm/runs/cycle-010-precommit.md) converts the check into a "
               "measurement: the agent could not have seen it, so overlap is evidence about the ranking "
               "rather than about the prose. It also cuts both ways by design — the agent's HIGH band "
               "found 4 entries the sealed list had NOT ranked high (#38 Wheeler, #39 Hopper, #45 "
               "Stroustrup, #48 Kay), and on inspection at least three are good catches, so the "
               "pre-commitment measured the conductor as much as the agent. Recorded honestly: the "
               "sealed list also contained an off-by-one (it named idx 39 as Wheeler; Wheeler is 38, 39 "
               "is Hopper), which affected only the informational Tier B tally, never the gate.",
    },
    {
        "cycle": 10,
        "what": "The document was ACCEPTED and then extended with a separately-attributed conductor "
                "addendum recording the four disagreements, rather than being sent back for a fix.",
        "why": "The disagreements are not defects the author could resolve — neither party has a source, "
               "so a revision round would only have produced a more confident document with the same "
               "epistemic basis, which is the opposite of what this deliverable is for. Row #45 is the "
               "sharp case: it asserts a specific checkable fact about what Stroustrup's FAQ SAYS "
               "(that he disclaims the foot-gun line) and row #46 leans on the same asserted FAQ. The "
               "conductor recalls the reverse. Recording that conflict at the top of the human's queue "
               "is strictly more useful than silently picking a winner, because the fact that two "
               "independent passes disagree about a primary source is itself the finding. Suppressing it "
               "to make the artifact look cleaner would have been the dishonest option.",
    },
])
st["known_issues"] = [
    {**ki, "note_cycle_10": (
        "STILL OPEN and still high. Item I-4b delivered docs/corpus-attribution-triage.md this cycle: "
        "a risk-ranked list of all 50 entries (8 HIGH / 16 MEDIUM / 26 LOW) with an entry-specific "
        "reason each. That is the human-actionable triage KI-2 asked for; it is explicitly NOT an audit "
        "and does not resolve this issue. Nothing in the corpus was changed. The eight HIGH entries are "
        "the queue a human should work first."
    )} if ki["id"] == "KI-2" else ki
    for ki in st["known_issues"]
]
st["counters"]["consecutive_no_value"] = 0
st["counters"]["consecutive_failures"] = 0
st["last_cycle"] = {
    "n": CYCLE,
    "work": "I-4b — risk-ranked corpus attribution triage (direct Agent, sonnet, k=1, file scope "
            "docs/corpus-attribution-triage.md only) gated against a pre-dispatch sealed ranking",
    "outcome": "1 verified; 16/16 harness checks green including 2 negative controls; 50/50 entries "
               "covered and double-keyed to the corpus; conductor addendum records 4 disagreements; "
               "suite 59/59 green, product tree byte-identical to HEAD",
    "commit": "PENDING",
}
atomic(STATE, json.dumps(st, indent=2, ensure_ascii=False) + "\n")
print("state written: cycle", st["cycle"])
