import json, os

BL = '/opt/targets/aphorism-cli/.swarm/backlog.json'
b = json.load(open(BL))

new = [
    {
        "id": "TS-4",
        "title": "Help's tag-discovery snippet is not a pasteable command",
        "kind": "polish", "status": "todo", "priority": 8, "effort": "S",
        "model": "sonnet", "deps": [],
        "files_hint": ["bin/aphorism.js", "README.md"], "packages": [],
        "acceptance": "The --help line that tells a user how to discover tags prints a COMPLETE, copy-pasteable command line (it names the binary as a user invokes it) and, as printed, actually produces a deduped tag list when pasted into a shell that has jq. No new flag, no new dependency, corpus untouched. If a correct one-liner is not achievable, the line is replaced by one that IS correct rather than left aspirational.",
        "attempts": 0,
        "notes": "From the cycle-9 TASTE pass, finding 4 (minor). CONDUCTOR-REPRODUCED: `node bin/aphorism.js --help` line 12 reads \"Run --list --json | jq '.tags[]' to see tags in the corpus.\" It omits the binary name, so it is not pasteable as printed, and `.tags[]` over NDJSON emits duplicates rather than a tag vocabulary. This is the ONLY one of the four taste findings that run #3's non-goals permit fixing: no flag, no dependency, no corpus entries."
    },
    {
        "id": "TS-1",
        "title": "Corpus depth: 50 canon-only entries repeat by roughly the 9th draw",
        "kind": "polish", "status": "blocked", "priority": 4, "effort": "L",
        "model": "sonnet", "deps": [],
        "files_hint": ["src/corpus.js"], "packages": [],
        "acceptance": "BLOCKED ON A HUMAN SCOPE DECISION, not on engineering. To unblock, the owner lifts the 'corpus expansion' non-goal at a future kickoff. Then: the corpus grows enough that a repeat is unlikely inside a typical session, weighted toward less-anthologized lines from the canonical voices and toward the last 15 years, with recent-repeat avoidance across consecutive invocations.",
        "attempts": 0,
        "blocked_reason": "Locked SPEC.md non-goal for run #3: 'corpus expansion'. The swarm cannot lift its own locked non-goal mid-run -- that is exactly the drift the spec lock exists to prevent -- so this is filed blocked rather than todo. NOT dropped, NOT quietly re-scoped.",
        "owner": "human (repo owner, at the next kickoff)",
        "notes": "From the cycle-9 TASTE pass, finding 1 (notable) -- the headline taste finding of run #3. CONDUCTOR-MEASURED, and the agent's figure was CONSERVATIVE: the corpus is 50 entries, so under uniform draws the MEDIAN first exact repeat lands at draw 9 and P(repeat by draw 12) = 76.2%. The agent reported feeling it at use 12; the arithmetic says most users feel it sooner. Severity 'notable' rather than 'fundamental' was CHECKED, not rubber-stamped: the SHAPE of the product (one quiet attributed line, pipeable, stderr-clean) held across 32 runs and is genuinely good; it is the POOL that runs out. The daily --seed MOTD pattern (7 distinct aphorisms across a simulated week) partially masks the repeat and is the product's strongest idea."
    },
    {
        "id": "TS-2",
        "title": "Five tag pools hold <= 4 entries, so --tag exhausts within a session",
        "kind": "polish", "status": "blocked", "priority": 3, "effort": "M",
        "model": "sonnet", "deps": ["TS-1"],
        "files_hint": ["src/corpus.js", "README.md"], "packages": [],
        "acceptance": "BLOCKED ON THE SAME HUMAN SCOPE DECISION as TS-1. Once corpus expansion is permitted, no tag pool is small enough to exhaust in a sitting. Until then only the documentation half is in scope: README/help may steer users toward the pools large enough to be worth filtering on.",
        "attempts": 0,
        "blocked_reason": "Locked SPEC.md non-goal for run #3: 'corpus expansion'. Same lock as TS-1.",
        "owner": "human (repo owner, at the next kickoff)",
        "notes": "From the cycle-9 TASTE pass, finding 2 (minor). CONDUCTOR-MEASURED from `--list --json`: philosophy=3 (two of the three Dijkstra), readability=4, reliability=4, language=4, process=4 -- 5 of 12 tags at <= 4 entries. README's claim that 'the smallest pool holds three aphorisms, so --tag always has something to choose between' is TRUE but experientially thin, which is the taste seat's point exactly: a green correctness gate cannot see this."
    },
    {
        "id": "TS-3",
        "title": "Three voices hold a third of the corpus, so draws sound same-registered",
        "kind": "polish", "status": "blocked", "priority": 2, "effort": "M",
        "model": "sonnet", "deps": ["TS-1"],
        "files_hint": ["src/corpus.js"], "packages": [],
        "acceptance": "BLOCKED ON THE SAME HUMAN SCOPE DECISION as TS-1. Once corpus expansion is permitted, added entries diversify author and era rather than deepening the already-dominant voices.",
        "attempts": 0,
        "blocked_reason": "Locked SPEC.md non-goal for run #3: 'corpus expansion'. Same lock as TS-1.",
        "owner": "human (repo owner, at the next kickoff)",
        "notes": "From the cycle-9 TASTE pass, finding 3 (minor). CONDUCTOR-MEASURED: 24 distinct authors over 50 entries, but Dijkstra 7 + Perlis 5 + Pike 5 = 17/50 = 34% of the corpus in three voices. The agent's claim that 'a third of the corpus is three voices' verified exactly."
    },
]

have = set(i['id'] for i in b['items'])
for n in new:
    assert n['id'] not in have, n['id']
b['items'].extend(new)
b['_provenance'] = b['_provenance'] + (
    "\n\n2026-08-18 run #3 cycle 9 (TASTE): appended TS-1..TS-4 from the owed taste pass. "
    "TS-4 is todo (in scope: help-text repair, no flag/dependency/corpus change). "
    "TS-1..TS-3 are BLOCKED on a human scope decision -- all three are corpus expansion, an "
    "explicit locked non-goal of run #3 -- each with a named actor per K-5. Filing them blocked "
    "rather than todo is deliberate: it keeps the step-4 picker from selecting work that would "
    "violate the locked spec, while refusing to drop the run's headline taste finding. "
    "Nothing pre-existing was modified."
)
json.dump(b, open(BL + '.tmp', 'w'), indent=2)
os.replace(BL + '.tmp', BL)

from collections import Counter
print('backlog now:', dict(Counter(i['status'] for i in b['items'])), 'total', len(b['items']))
