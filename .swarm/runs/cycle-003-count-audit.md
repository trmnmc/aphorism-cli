# N-7 — Count-claim audit of README.md, REPORT.md, docs/

Audited by a fresh agent against the live tree at commit `b627ed2` (branch `master`,
working tree clean — the `main`/`c2a703d` head named in this task's initial git-status
context did not match the actual repo state on disk; all measurements below were taken
against what was actually checked out).

## Scope decision (read first)

The acceptance clause's examples — corpus entry count, test count, source file count,
file sizes — are all **counts about the repo's own current shape**. REPORT.md alone
contains 630 digit-bearing lines. The overwhelming majority are commit hashes, ISO
timestamps, cycle numbers, dollar-cost figures, percentages from SWARM's own pacer/
allocator telemetry, and backlog/known-issue IDs (`KI-14`, `T-024a`, …) — none of these
are "count claims about this repo" in the sense the item means, and nearly all of them
are already explicitly cycle- or commit-anchored by the document's own house style (a
`_Correction carried by this reconciliation..._` pattern the report uses throughout).
I read REPORT.md in full, front to back (all 1227 lines), to classify every claim in it,
but the ledger below itemizes line-by-line only the claims that are genuinely about repo
**counts** (corpus, tags, tests, source/test line counts, file counts, dependency count,
backlog/known-issue tallies where they double as repo state) — not every digit in the
file. Where I collapsed a run of near-identical anchored restatements (e.g. the "1511 of
2101" / "549 lines" pair, which recurs at 3+ sites each with its own correction note
already attached), I say so and give all the line numbers.

**What this enumeration might have missed:** (1) number-words — I ran a targeted
word-number grep (`One`…`Fifty`) over README.md and docs/ (full coverage, 4 hits, all
prose, none a repo-count claim) but only a coverage pass, not a per-instance re-verify,
over REPORT.md's 35 word-number hits, because I had already read and classified every
sentence containing them during the full sequential read — none were unanchored
current-state repo-count claims. (2) numbers inside markdown tables were covered (the
tag tables, the risk-band table, the derivation table) but numbers inside **fenced code
blocks** (e.g. the allocator JSON dump at REPORT.md:521, `weekly_used_pct = 93`) were
treated as verbatim historical log output, not prose claims, and excluded. (3) the
triage doc's citation years (1974, 1982, 2015, …) and RFC numbers are facts about the
quotes' real-world origins, not about this repo, and are correctly out of scope — this
was confirmed against REPORT.md's own line 947-948, which already made this exact scope
call.

## Live-tree measurements (commands + recorded output)

```
$ node -e "const c=require('./src/corpus.js').corpus; console.log('entries:', c.length);"
entries: 50

$ node bin/aphorism.js --list | wc -l
50

$ node -e "const c=require('./src/corpus.js').corpus; console.log('authors:', new Set(c.map(e=>e.author)).size);"
authors: 24

$ node -e "
const c=require('./src/corpus.js').corpus;
const m={};
for (const e of c) for (const t of e.tags) m[t]=(m[t]||0)+1;
const keys=Object.keys(m);
console.log('distinct tags:', keys.length);
console.log('tags with count===1:', keys.filter(k=>m[k]===1).length);
console.log('tags with count>=2:', keys.filter(k=>m[k]>=2).length);
console.log('min pool:', Math.min(...Object.values(m)), 'max pool:', Math.max(...Object.values(m)));
console.log(JSON.stringify(m));
"
distinct tags: 12
tags with count===1: 0
tags with count>=2: 12
min pool: 3 max pool: 14
{"performance":5,"debugging":7,"humor":9,"readability":4,"design":14,"simplicity":12,
 "reliability":4,"complexity":5,"philosophy":3,"language":4,"teamwork":7,"process":4}

$ node -e "const c=require('./src/corpus.js').corpus; console.log(c.filter(e=>e.author==='Anonymous').length);"
1

$ node --test test/*.test.js   # note: `node --test test/` (no glob) is NOT equivalent —
                                # it tries to require the directory as a single module and
                                # fails with MODULE_NOT_FOUND (1 test, 1 fail, 0 pass) — verified below
tests 102
pass 102
fail 0

$ node --test test/            # discriminator, confirms the glob matters
tests 1
pass 0
fail 1   (MODULE_NOT_FOUND)

$ wc -l src/*.js bin/aphorism.js
  133 src/args.js
  269 src/corpus.js
   91 src/select.js
   56 bin/aphorism.js
  549 total

$ wc -l test/*.test.js
  217 test/args.test.js
  541 test/cli.test.js
 2175 test/readme-tags.test.js
  298 test/select.test.js
 3231 total

$ ls src/*.js bin/*.js | wc -l
4

$ find . -not -path './.git*' -not -path './.swarm*' -iname 'package*.json'
(no output — no manifest anywhere in the tree)

$ find . -iname 'node_modules' -not -path './.git*'
(no output)

$ grep -n "require(" src/*.js bin/*.js
bin/aphorism.js:7:const { corpus } = require('../src/corpus.js');
bin/aphorism.js:8:const { filter, pick } = require('../src/select.js');
bin/aphorism.js:9:const { parseArgs, HELP } = require('../src/args.js');
(only relative local files — zero third-party requires in shipped src/bin)

$ grep -cE '^\| [0-9]+ \|' docs/corpus-attribution-triage.md
50

$ grep -oE '\| (HIGH|MEDIUM|LOW) \|' docs/corpus-attribution-triage.md | sort | uniq -c
      8 | HIGH |
     26 | LOW |
     16 | MEDIUM |

$ sed -n '76,95p' docs/corpus-attribution-triage.md | grep -cE '^[0-9]+\. \*\*#'
8    # "Top of the queue" list length, cross-checks the HIGH count above

$ sed -n '96,133p' docs/corpus-attribution-triage.md | grep -cE '^[0-9]+\. \*\*'
4    # "Conductor addendum" numbered notes, cross-checks docs.md:101/103 "four notes"

$ node -e "
const fs=require('fs');
const lines = fs.readFileSync('docs/corpus-attribution-triage.md','utf8').split('\n');
const ids=[];
for (const l of lines) { const m=l.match(/^\| (\d+) \|/); if (m) ids.push(Number(m[1])); }
console.log('sequential 0..49, no dupes/gaps:', JSON.stringify(ids)===JSON.stringify([...Array(50).keys()]));
"
sequential 0..49, no dupes/gaps: true
```

### Zero-dependency verification — what it covers and what it doesn't

"Zero dependencies" was checked two ways: (1) no `package.json` / `package-lock.json` /
`node_modules` anywhere in the tree, so there is no declared or installed third-party
package; (2) every `require(...)` in `src/` and `bin/` is either a relative path to
another file in this repo or would resolve to a Node core module (none appear — only
relative requires exist in shipped code; test files additionally use `node:test`,
`node:assert`, `fs`, `path`, `child_process`, all core). This **does not** and cannot
rule out a dependency installed globally and referenced some other way (e.g. shelling
out to a globally-installed binary) — I found no evidence of that, but it's a blind spot
worth naming rather than silently covering.

### "Node 18+" — left as UNVERIFIABLE, not corrected either way

README.md:10 claims a Node 18+ floor. `node:test` / `node --test` (used throughout
`test/`) requires Node ≥ 18, which is *consistent with* the claim, but I have no way to
spin up multiple Node versions in this environment to establish the actual minimum, and
neither does REPORT.md claim to have done so — it says explicitly (line 750) that
whether the Node 18+ floor is real "needs a CI matrix" and has never been machine-checked.
I did not touch this line: it is already honestly caveated at its only other mention, and
I have no stronger evidence than what's already disclosed.

## Ledger

Legend: **C** = CURRENT, **H** = HISTORICAL, **A** = AMBIGUOUS.

| # | File:Line | Quoted claim | Bucket | Check | Verdict | Action |
|---|---|---|---|---|---|---|
| 1 | README.md:10 | "Node 18+ and the repo is all you need" | C | `node:test` usage is consistent with an 18+ floor; no CI matrix available to establish the true minimum | **UNVERIFIABLE** (not TRUE/FALSE — no discriminating test available) | left alone; already caveated in REPORT.md:750 |
| 2 | README.md:3,10 | "zero-dependency" / "no dependencies" | C | no `package.json`/`node_modules` in tree; all `require()` in `src/`+`bin/` are relative or Node-core | **TRUE** | none |
| 3 | README.md:55 | "The corpus contains 12 distinct tags." | C | `distinct tags: 12` | **TRUE** | none |
| 4 | README.md:55 | "12 tags appear on 2 or more entries" | C | `tags with count>=2: 12` | **TRUE** | none |
| 5 | README.md:55 | "0 tags appear exactly once" | C | `tags with count===1: 0` | **TRUE** | none |
| 6 | README.md:55 | "0 tags sit on exactly one entry" (restatement of #5, deliberately kept per REPORT.md:930-938 since two separate test guards each check one phrasing) | C | same measurement | **TRUE** | none |
| 7 | README.md:60 | `design` \| 14 | C | tag-count map `design: 14` | **TRUE** | none |
| 8 | README.md:61 | `simplicity` \| 12 | C | `simplicity: 12` | **TRUE** | none |
| 9 | README.md:62 | `humor` \| 9 | C | `humor: 9` | **TRUE** | none |
| 10 | README.md:63 | `debugging` \| 7 | C | `debugging: 7` | **TRUE** | none |
| 11 | README.md:64 | `teamwork` \| 7 | C | `teamwork: 7` | **TRUE** | none |
| 12 | README.md:65 | `complexity` \| 5 | C | `complexity: 5` | **TRUE** | none |
| 13 | README.md:66 | `performance` \| 5 | C | `performance: 5` | **TRUE** | none |
| 14 | README.md:71 | `language` \| 4 | C | `language: 4` | **TRUE** | none |
| 15 | README.md:72 | `process` \| 4 | C | `process: 4` | **TRUE** | none |
| 16 | README.md:73 | `readability` \| 4 | C | `readability: 4` | **TRUE** | none |
| 17 | README.md:74 | `reliability` \| 4 | C | `reliability: 4` | **TRUE** | none |
| 18 | README.md:75 | `philosophy` \| 3 | C | `philosophy: 3` | **TRUE** | none |
| 19 | README.md:77 | "The smallest pool holds three aphorisms" | C | `min pool: 3` | **TRUE** | none |
| 20 | README.md:87 | "replaces an earlier 37-tag one in which 21 tags matched exactly one aphorism" | H (past-tense, describes the pre-cycle-46 state) | measured `src/corpus.js` at commit `9f5ae03~1` (the commit immediately before the cycle-46 retag): 37 distinct tags, 21 with count 1 | **TRUE as history** | left alone |
| 21 | README.md:90 | "Twenty-six low-count tag names were folded" | H | counted `FOLD` keys in `.swarm/runs/cycle-046-retag.mjs`: 26 entries | **TRUE as history** | left alone |
| 22 | README.md:125 | Attribution triage table: "Entries ranked \| 50" | C | triage row count | **TRUE** | none |
| 23 | README.md:126 | Attribution triage table: "Rated HIGH risk \| 8" | C | risk-band count, HIGH=8 | **TRUE** | none |
| 24 | REPORT.md:24-27 | "This repo has been through **three** SWARM runs." | **A** | git log shows a 4th run (labelled "run #3" in its own commit messages, e.g. `28fb1e5 cycle 2: N-1 allowlist handoff + N-2 playbook ledger`) is in progress today, but REPORT.md has not been appended by it — the sentence may mean "runs this *document* covers" (still 3, and still true) rather than "runs the repo has undergone" (now arguably 4, counting the in-flight one, by the same convention the document used for run #2 while *it* was in flight) | not resolved — see note | **left alone**, flagged for conductor ruling |
| 25 | REPORT.md:77 | "conductor re-count: **50** entries, **24** authors, **12** distinct tags (0 singletons, 7 tags ≥5 uses, 5 tags in the 2–4 band; thinnest pool 3, largest 14)" | H (labelled "re-measured 2026-08-16 03:10 UTC" in the section header, i.e. a build-run must-haves re-verification snapshot) | matches today's live corpus exactly (50/24/12/0-singletons/3-min/14-max), and separately the "7 ≥5 / 5 in 2-4 band" split matches today's map (design14,simplicity12,humor9,debugging7,teamwork7,complexity5,performance5 = 7 tags ≥5; language4,process4,readability4,reliability4,philosophy3 = 5 tags in 2-4 band) | **TRUE as history, and still true today (corpus untouched since)** | left alone |
| 26 | REPORT.md:104,108-109 | "consolidated from **37 tags to 12**... 21 of the 37 tags matched exactly one aphorism... Every tag now has a pool of at least 3" | H | same pre-retag measurement as #20; "pool of at least 3" matches today's `min pool: 3` | **TRUE as history** | left alone |
| 27 | REPORT.md:132-136 | "Cycle 49 — ...135/135 cells: all 12 live tags print an entry that genuinely carries that tag..." | H (dated to cycle 49's gate) | internal consistency only (12 matches today's tag count) | **consistent, not independently re-run** | left alone |
| 28 | REPORT.md:163,188,207-211 | "1511 of 2101 test lines" (3 sites) / "549 lines of shipped source" | H — each site already carries its own `_Correction carried by this reconciliation..._` note (lines 169-177, 205-216, 494-513) re-pinning the figure to commit `dbc1939` (1978/3034) and re-confirming 549 is still exactly right at that commit | consistent with git history at the named commits; **today's actual `wc -l test/*.test.js` total is 3231** (readme-tags.test.js has grown from 1978 to 2175 since `dbc1939`, from later run #2 cycles), which is *expected drift beyond the document's last anchor*, not an error — the document already predicts this ("Anything you want as of today, re-run the command without the `dbc1939` ref", line 783-784) | **TRUE as history at each stated commit** | left alone (all 5+ sites already self-corrected in the document's own style; re-pinning them again to yet another commit would be exactly the restructure N-6 owns) |
| 29 | REPORT.md:481-490 (Stats table) | "Commits **102 total**... Tests **80 pass/0 fail**... Source size 549 lines / 2101 lines of tests... Corpus 50·24·12" | H, explicitly flagged stale by the note at lines 494-513 which redirects to the derivation table | already handled by the document itself | **already corrected in-document** | left alone |
| 30 | REPORT.md:786-808 | Fresh derivation table (corpus 50/24/12, suite 101/0, source 549, test lines 3034, commits 122/116/6, backlog 18, known issues 20, etc.) | H — explicitly pinned to commit `dbc1939`, with the preamble stating this is deliberate ("Rows are anchored to that commit rather than to 'now' on purpose") | corpus/authors/tags/pool/singleton/Anonymous rows match today's live tree exactly (expected, since `src/corpus.js` hasn't changed since); source-line row (549) matches today; suite/test-lines/commit/backlog/known-issue rows do **not** match today (today: 102 tests not 101, 3231 test lines not 3034) because real work landed after `dbc1939` — exactly the drift the table's own preamble anticipates | **TRUE as history, correctly and deliberately not "now"** | left alone — do NOT re-pin to today, that is explicitly the thing this document tells the reader to do themselves by re-running the command |
| 31 | REPORT.md:1013-1017 | "`node --test test/*.test.js` → **102 tests, 102 pass, 0 fail**, run by the conductor at wrap-up... 91 tests at the end of run #1, 102 now: **+11**" | H — anchored "at wrap-up" (run #2's WRAP_UP, cycle 8/9, 2026-08-17) | `node --test test/*.test.js` today: **102 tests, 102 pass, 0 fail** — matches exactly (expected: nothing in src/test/bin has changed since run #2's last commit) | **TRUE as history, and happens to still be true today** | left alone |
| 32 | REPORT.md:1074-1080 | "23 tracked, 3 resolved this run..." (known issues) | H, anchored "this run" (run #2 WRAP_UP) | not independently re-derived (would require walking `.swarm/state.json` history, out of scope — `.swarm/` is off-limits except my deliverable) | not re-checked | left alone |
| 33 | docs/corpus-attribution-triage.md:23-74 | Risk table, 50 rows, ids 0-49 | C (the table itself is the current, only version of this data — no historical framing anywhere in this file) | row count 50, ids sequential 0-49 no gaps/dupes | **TRUE** | none |
| 34 | docs/corpus-attribution-triage.md risk column | 8 HIGH / 16 MEDIUM / 26 LOW | C | `uniq -c` on risk column: 8/26/16 | **TRUE** | none |
| 35 | docs/corpus-attribution-triage.md:76-94 | "Top of the queue" — 8 numbered HIGH entries | C | counted list items in that section: 8 | **TRUE**, and cross-consistent with #34 | none |
| 36 | docs/corpus-attribution-triage.md:101,103 | "the four notes below are the places where they did NOT agree... These four notes — on #45, #25, #6, and #4/#8/#9" | C | counted numbered items in "Conductor addendum": 4 | **TRUE** | none |

## What did NOT need any correction, and why

Every genuinely **current, unanchored** count claim I found — the entire README.md tag
vocabulary section (rows 3-19, 22-23 in the ledger) and the entire docs/
corpus-attribution-triage.md risk table (rows 33-36) — measured **TRUE** against the live
tree. This matches what REPORT.md itself already found and recorded at
REPORT.md:940-950 ("Every count claim citing the corpus or the triage table... was
re-derived... and found true, unchanged, zero edits needed"), which is itself a
historical claim (from run #2's J-4 item) that today's independent re-measurement
happens to reconfirm, because `src/corpus.js` and `docs/corpus-attribution-triage.md`
have not been touched since.

**No text was edited in README.md, REPORT.md, or docs/corpus-attribution-triage.md.**
There were zero FALSE current claims to correct.

## AMBIGUOUS / flagged items requiring a human or conductor ruling

- **REPORT.md:24-27, "This repo has been through three SWARM runs."** A 4th run
  (labelled "run #3" by its own commits) is now underway on this repo, but has not
  touched REPORT.md. Read one way ("runs this document's content covers") the sentence
  is still true; read the other way ("runs the repo has undergone, counting in-flight
  ones the way the document itself counted run #2 while it was in flight") it is now
  stale and should read "four". I did not edit it — this is exactly the kind of judgment
  call the item's hard constraints told me to leave to a human/conductor rather than
  guess at, and REPORT.md's own append-only convention means the "right" fix (an
  appended correction note, run #3's own status section) is that run's job, not mine.

## `git status --porcelain` and `git diff --stat` (verbatim)

```
$ git status --porcelain
(no output — clean)

$ git diff --stat
(no output — no changes)
```

No files were modified by this audit. The only artifact produced is this ledger.
