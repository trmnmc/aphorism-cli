import json, os

SP = '/opt/targets/aphorism-cli/.swarm/state.json'
s = json.load(open(SP))

s['known_issues'].append({
    "id": "KI-34",
    "severity": "low",
    "opened_cycle": 9,
    "owner": "swarm-maintainer",
    "status": "open",
    "what": (
        "SWARM-side cycle commits carry messages that assert contents the commits do not and "
        "cannot have. `runs/` is gitignored in the SWARM repo (.gitignore:2), so the dashboard, "
        "the per-cycle render harness and the runfile are ALL untracked there -- yet several "
        "run #3 commit subjects name exactly those three artifacts."
    ),
    "detail": (
        "MEASURED at cycle 9, not inferred. `git -C /opt/swarm show --stat 76b3a01` -> subject "
        "\"run #3 cycle 6: QA full pass -- dashboard render, c6 harness, runfile\", contents: "
        "tmp_aph_err.txt (0 bytes) and tmp_aph_out.txt (0 bytes), 2 files changed, 0 "
        "insertions, 0 deletions. The commit contains two empty stray temp files and nothing "
        "else. The same shape applies to c2 (c2703b1). Found because cycle 9's own SWARM commit "
        "returned \"nothing to commit, working tree clean\" and that was CHECKED rather than "
        "shrugged off; `git check-ignore -v` confirmed runs/dashboard.html, runs/c9-dashboard.mjs "
        "and runs/current.json are all ignored by .gitignore:2."
    ),
    "why_it_matters": (
        "Low severity because NOTHING IS LOST: the durable state lives in the TARGET repo, which "
        "is committed and pushed every cycle per hard rule 1 and carries .swarm/journal.md, "
        "state.json, backlog.json and every per-cycle artifact. The runfile is additionally "
        "mirrored into each journal block, which is exactly the RESUME path for a lost runfile. "
        "The defect is one of RECORD HONESTY, not data: a reader auditing the run through SWARM "
        "commit subjects would believe a dashboard render was committed there when it was not. "
        "It also means the gitignored `runs/` tree is the ONE part of the run with no version "
        "history -- a bad render overwrites the previous one irrecoverably."
    ),
    "fix": (
        "Two independent halves, both for a human, neither applied (hard rule 5 fences SWARM "
        "outside runs/ and playbook/, and .gitignore is outside both). (1) Stop naming untracked "
        "artifacts in SWARM commit subjects -- or drop the SWARM-side cycle commit entirely, "
        "since the target commit is the one that carries the state. (2) Decide deliberately "
        "whether `runs/` should stay ignored; if the per-cycle harnesses and dashboards are "
        "meant to be auditable, un-ignore runs/*.mjs and runs/dashboard.html. Also worth "
        "deleting the two stray empty tmp_aph_*.txt files that DID get committed."
    ),
})

json.dump(s, open(SP + '.tmp', 'w'), indent=2)
os.replace(SP + '.tmp', SP)
print('known_issues now:', len(s['known_issues']), '-> KI-34 filed')

note = """
### cycle 9 addendum — a defect in the run's own bookkeeping (KI-34, low)

Found by VERIFYING a no-op instead of shrugging at it. The step-8 SWARM-side commit returned
  `nothing to commit, working tree clean`, which was surprising after writing dashboard.html,
  c9-dashboard.mjs and the runfile. `git check-ignore -v` explains it: `.gitignore:2` ignores
  `runs/` wholesale, so all three are untracked in the SWARM repo.

That is fine on its own. What is NOT fine is what it reveals about earlier commit subjects:

```
$ git -C /opt/swarm show --stat --oneline 76b3a01
76b3a01 run #3 cycle 6: QA full pass — dashboard render, c6 harness, runfile
 tmp_aph_err.txt | 0
 tmp_aph_out.txt | 0
 2 files changed, 0 insertions(+), 0 deletions(-)
```

The subject names three artifacts; the commit contains two empty stray temp files and none of
  them. The message asserts contents it cannot have.

SEVERITY IS LOW AND THE REASON MATTERS: nothing is lost. Hard rule 1's durable state is the
  TARGET repo, which is committed and pushed every cycle and carries the journal, state,
  backlog and every per-cycle artifact; the runfile is additionally mirrored into each journal
  block, which is precisely the RESUME path. So this is a record-honesty defect, not a data
  loss. But the morning report reads commit subjects as evidence, and a subject that claims a
  dashboard render it does not contain is the kind of small untruth that makes a run's whole
  record harder to trust. Also worth stating: because `runs/` is ignored, it is the one part of
  the run with NO version history — a bad render silently overwrites the last good one.

NOT FIXED, and deliberately so: `.gitignore` is outside `runs/` and `playbook/`, so hard rule 5
  fences it. Filed as KI-34 with both halves of the fix and a named owner, for the morning
  report. This cycle's own SWARM commit was simply not made, rather than forced with
  `--allow-empty` and a subject that would have repeated the same untruth.
"""

JR = '/opt/targets/aphorism-cli/.swarm/journal.md'
with open(JR, 'a') as f:
    f.write(note)
print('journal bytes:', os.path.getsize(JR))
