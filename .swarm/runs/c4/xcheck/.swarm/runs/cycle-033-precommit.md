# cycle 33 — conductor pre-commitment (SEALED BEFORE DISPATCH)
target: aphorism-cli   items: T-026 (p4), T-028 (p6), T-027 (p7)
work type: QA / CLASSIFICATION pass (forced work-type switch, churn breaker at consecutive_no_value=2)

## Why this file is not in <target>/.swarm/runs/
KI-8 is HIGH: at cycle 31 a builder read the conductor's pre-dispatch baseline out of
<target>/.swarm/runs/, and at cycle 32 a builder read the GATE ITSELF and optimised against it.
Subagents are sandboxed to the session --add-dir list (/opt/swarm and /opt/targets/aphorism-cli,
per KI-6), so BOTH of those directories are readable by any dispatched agent. KI-8's remedy
option (1) — write baselines to SWARM/runs/ — therefore does NOT close the leak.
This file is written to /home/swarm/.swarm-seal/, which is outside the --add-dir list, and a
SHA-256 of it is written into the target BEFORE dispatch. The hash proves the seal was not
back-edited; it reveals nothing to an agent that reads it. The plaintext is copied into
<target>/.swarm/runs/ only AFTER the classifier returns.

## T-026 — the heading-to-table scan's digit-shape stop rule
PREDICTION: **BOUNDARY**, not HOLE.
REASONING (the load-bearing claim, and it is falsifiable):
  This README's band "headings" are NOT markdown headings. They are ordinary prose lines —
  "4 tags have a robust pool (5+ entries):" and "12 tags appear 2-4 times:". So there is NO
  markdown structure for the stop rule to read. The obvious re-shape that T-024 asks for
  ("stop at a real markdown heading, /^#{1,6}\s/") CANNOT work here: the 5+ scan would read
  straight past the 2-4 prose heading and graft the 2-4 table onto the 5+ band.
  The digit-shape token is therefore not a lazy approximation of an available structural
  signal — it is the ONLY signal present. Loosening it to let "Requires Node 18+ to run."
  through requires a SECOND English anchor (the word "tags", or a trailing colon) to tell a
  band heading from prose, which is a seventh prose narrowing and exactly what cycle 25's
  standing finding says raises the odds a maintainer deletes the whole family.
REFUTATION CONDITION (what would make me wrong — I want this measured, not assumed):
  a stop rule that simultaneously (a) turns the "Node 18+" README GREEN, (b) keeps the
  cycle-29 orphan and sibling-theft probes RED, and (c) introduces NO new English-word
  anchor. If such a rule is measured, T-026 is a HOLE and I am wrong.
PREDICTED SIGNATURES: pristine 78/78/0. "Node 18+" prose inserted, every claim TRUE -> RED.
  Plain prose with no band token ("See the table below.") -> GREEN (T-025 widened this).
EXPECTED ACT IF BOUNDARY HOLDS: comment at the extraction site naming the exact out-of-scope
  prose shape, and naming the real fix as a DOCUMENT change (make band headings real markdown
  headings), which is a README edit and outside the builder file scope used all run.

## T-028 — two plausible --list-behaviour headings
PREDICTION: **stay RED; close as a deliberate accepted trade, no code change.**
REASONING: a README with two "### " headings both claiming to describe --list behaviour IS
  ambiguous documentation; refusing to pick one and naming both verbatim is correct, not a
  defect. The only measured alternative (first-match) was proven a SILENT HOLE at cycle 28.
  Any non-positional disambiguation needs a third signal (section CONTENT), which is a new
  anchor of the same family.
REFUTATION CONDITION: a measured non-positional disambiguation that keeps cycle-30 cells
  P1 and P2 RED. If that exists, the item should go GREEN instead and I am wrong.

## T-027 — the British-spelling lock in the --list-behaviour locator
PREDICTION: **HOLE** — and note this is the OPPOSITE lean from T-026, deliberately.
REASONING: widening /\bbehaviour\b/i to /\bbehaviou?r\b/i does NOT add an anchor; it loosens
  an anchor that already exists. It cannot create mis-attachment, because the locator already
  asserts on AMBIGUITY when more than one candidate matches (that assert is what T-028 is
  about) — so a second candidate surfaced by the widening fails LOUD rather than being
  silently picked. The cycle-25 finding is about ADDING prose anchors, not about spelling
  tolerance on one already present.
REFUTATION CONDITION: if widening turns any previously-RED theft/ambiguity cell GREEN.
CAVEAT ON MY OWN PREDICTION: T-027 is priority 7 and is the least important of the three; if
  budget runs short it is the one to drop, and dropping it must be reported as not-run.

## Standing self-checks
- I have NOT told the classifier agent any of the above.
- The deciding discriminators for the gate will be authored AFTER the agent returns
  (KI-8 remedy option 2 — the thing that actually saved cycles 31 and 32).
- Two of the three predictions (T-026 BOUNDARY, T-028 stay-RED) are the CHEAP outcomes that
  close items with little work. That is a bias I am aware of and it is why each carries an
  explicit refutation condition naming a measurement, not an argument.
