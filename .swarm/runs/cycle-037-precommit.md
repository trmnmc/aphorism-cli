# cycle 37 — sealed pre-dispatch commitment for T-033

Written BEFORE the builder is dispatched. sha256 committed to the target repo before dispatch;
this plaintext is DELETED for the whole dispatch window and restored + `sha256sum -c`'d afterwards
(KI-8 commit-reveal mitigation, as at cycle 36).

## The item

`test/readme-tags.test.js:160`, `README should acknowledge single-entry tag limitation`:

```js
const hasWarning = readmeContent.includes('exactly one') ||
                   readmeContent.includes('single-entry') ||
                   readmeContent.includes('Single-entry');
assert(hasWarning, 'README should acknowledge that some tags appear only once');
```

Whole-document substring presence. Two measured defects (cycle 36 probe P1):
(a) LOUD — an honest reword of README:55 / README:83 that still states the limitation is rejected.
(b) SILENT — `Install with exactly one command.` anywhere in the document satisfies it.

## Predictions (each names its own refutation condition)

**P1 — classification.** I predict the builder returns **HOLE with a shipped fix**, not BOUNDARY.
REFUTED IF: it returns BOUNDARY with a comment at the assertion site.

**P2 — shape of the fix.** I predict the fix SCOPES the search (to the Tag vocabulary section, to the
single-entry caveat neighbourhood, or to a bounded window) in order to close (b), and widens the
accepted vocabulary in order to close (a). REFUTED IF: the shipped diff only edits the substring
list with no scoping of WHERE the string may appear, or only scopes with no vocabulary widening.

**P3 — the redundancy the builder will (I predict) miss.** The neighbouring test at ~L630,
`README opening sentence must state correct multi-entry and single-entry tag counts`, already extracts
`/(\d+)\b[^.;\n]*\bexactly one\b/i` FROM THE TAG VOCABULARY SECTION and checks the number against the
corpus. That is a strictly STRONGER guard over the same acknowledgement, section-scoped, count-verified.
The independent value of the L160 assertion is therefore mostly the SECOND sentence (README:83, the
`--tag` echo caveat), not the first. I predict the builder does NOT raise subsumption/redundancy at all.
REFUTED IF: its report names the L630 / opening-sentence test as covering the same claim.

**P4 — sealed cell predictions.** Arms: HEAD = `git stash`-free copy of HEAD; WORK = the builder's tree.
Every cell is judged on the FAILING TEST NAME under `--test-reporter=tap`, never on suite colour —
cycle 36 established that P3's suite-level red is MASKED by a neighbouring guard, and the two must not
be collapsed.

| cell | README mutation | HEAD | WORK |
|---|---|---|---|
| G0 | pristine (control) | GREEN | GREEN |
| G1 | honest reword of BOTH sentences; limitation still plainly stated | RED, ack test fires | GREEN |
| G2 | limitation not acknowledged at all | RED, ack test fires | RED, ack test fires |
| G3 | literal only in an unrelated sentence (`Install with exactly one command.`), real acknowledgement removed | ack test does NOT fire | ack test FIRES |
| G4 | honest reword, but the acknowledgement moved into an UNRELATED section | RED, ack fires | RED, ack fires |

G4 is the discriminator that separates the two candidate fixes: a fix that merely widened the global
substring list turns G4 GREEN; a fix that scoped WHERE the acknowledgement must appear keeps it RED.
I predict G4 lands **RED@WORK**. REFUTED IF it is GREEN@WORK — which would mean P2's scoping half failed
even if the item's own acceptance cells pass.

G2 is also the ANTI-DELETION control: an assertion deleted rather than repaired turns G2 GREEN@WORK.

## Standing scope commitments

- Only `test/readme-tags.test.js` may change. **README.md must be byte-identical to HEAD** — README
  restructuring is KI-9 remedy option (2) and is a human call, explicitly out of this run's builder scope.
- Full suite green on the real tree, run by the conductor, not by the agent.
- L-029 both directions: the false rejection must disappear with the fix and RETURN without it.
- Fresh discriminators will be authored AFTER the builder returns and are deliberately NOT in this seal
  (KI-8 remedy option 2 — the only thing that has actually saved these cycles).
