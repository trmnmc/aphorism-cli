# Cycle 10 — SEALED CONDUCTOR PRE-COMMITMENT for item I-4b

Written BEFORE the triage agent was dispatched and never shown to it. This file exists so
the verification gate has something a plausible-sounding document cannot satisfy by being
plausible. The agent's deliverable is a judgment artifact, so the usual gate (run the
command, read the output) has nothing to bite on; this is the substitute — an independent
derivation, committed first, that the agent's output is then measured against.

Method note, stated honestly up front: this is the conductor's own recall of provenance
for well-known programming quotations. It is NOT a source check. Neither this file nor the
agent's document can establish who actually said any of these lines; both are risk
opinions. Agreement between two independent derivations raises confidence that the RANKING
is sane — it cannot make either one an audit. KI-2 stays open regardless of the outcome.

Entries are indexed 0-based in corpus order (src/corpus.js).

## Tier A — I independently judge these the highest-risk attributions

| idx | text (opening) | attributed to | why I rank it high |
|---|---|---|---|
| 10 | "Computer science is no more about computers than astronomy is about telescopes." | Edsger W. Dijkstra | Repeated everywhere as Dijkstra; I am not aware of any EWD that contains it. Commonly traced instead to Fellows & Parberry (1993) or to Hal Abelson. Likely MISATTRIBUTED, not merely unverifiable. |
| 6 | "If debugging is the process of removing software bugs, then programming must be the process of putting them in." | Edsger W. Dijkstra | Same shape: a quip that circulates as Dijkstra with no primary source I can point to in the EWD corpus. Reads as a joke retrofitted onto the most quotable name in the field. |
| 3 | "There are only two hard things in computer science: cache invalidation and naming things." | Phil Karlton | The attribution is probably right in substance, but it survives only as second-hand report (Tim Bray relaying it); Karlton died in 1997 leaving no published source. UNVERIFIABLE by construction, which is its own risk class. |
| 0 | "Premature optimization is the root of all evil." | Donald Knuth | Two independent defects. (i) Knuth published it (1974) but credited the sentiment to Hoare, so single-name credit is contested at the source. (ii) The corpus text is a COMPRESSION — the sentence begins "We should forget about small efficiencies, say about 97% of the time:" and the omission is exactly what makes the maxim get misused. |
| 27 | "Make it work, make it right, make it fast." | Kent Beck | Folklore maxim with several claimants — Beck, Butler Lampson, and the Kernighan/Plauger "make it work, then make it fast" lineage. I know of no primary Beck source. |

## Tier B — probably the right person, but the entry is compressed, paraphrased, or credits one of several co-authors

| idx | attributed to | the specific defect I expect |
|---|---|---|
| 25 | Jon Postel | Paraphrase. RFC wording is "be conservative in what you **do**, be liberal in what you accept **from others**". |
| 39 | David Wheeler | Truncation that inverts the joke: the famous form ends "...except for the problem of too many levels of indirection". Also often reassigned to Lampson or Kevlin Henney. |
| 12 | Brian Kernighan | Source is *The Elements of Programming Style*, Kernighan **and Plauger** — solo credit is incomplete. |
| 11 | Brian Kernighan | Same co-author issue (Kernighan & Plauger lineage). |
| 42 | Ron Jeffries | YAGNI is XP-collective; credited variously to Jeffries and to Beck. |
| 44 | Guido van Rossum | Appears in PEP 8 (multi-author); also widely attributed to Raymond Chen. |
| 41 | Antoine de Saint-Exupery | Right author, but it is a TRANSLATION so no verbatim English original exists; the name is also missing its accents (Saint-Exupéry). |
| 43 | Eric S. Raymond | Credit is correct — Raymond coined the formulation and named it after Linus — but it is very commonly flipped to Torvalds, so the entry is fragile rather than wrong. |

## Tier C — lowest risk

Index 49 is already hedged to "Anonymous" and is therefore the single most honest entry in
the file — it cannot be misattributed because it claims nothing. Beyond it, the low-risk
population is the entries traceable to a specific well-documented publication or post:
the Dijkstra EWDs (4, 5, 7, 8, 9), Brooks' *Mythical Man-Month* (16–19), Perlis'
*Epigrams on Programming* (20–24), Hoare's Turing lecture and QCon talk (14, 15), Fowler's
*Refactoring* (2), Stroustrup's FAQ (46, 47), the Go proverbs / Pike rules (33–38),
Linus' LKML posts (31, 32), Conway 1968 (26), and Hopper (40, 41-adjacent).

## Structural expectations the deliverable must satisfy

These are checkable mechanically and are checked by the harness, not by eye:

1. All 50 corpus entries covered, exactly once each, keyed to real corpus text.
2. At least 3 distinct risk bands actually used, and no single band holding more than 60%
   of the corpus — a document that rates everything "medium" has done no work.
3. Every entry carries a non-empty, entry-specific reason. Reasons must not be
   copy-pasted boilerplate shared verbatim across entries.
4. Index 49 (Anonymous) sits in the LOWEST risk band.
5. The document contains no claim that the corpus has been audited, verified, confirmed,
   or fact-checked, and says plainly somewhere that it is not an audit.
6. **The substantive discriminator:** the highest band must contain at least 2 of my
   Tier A set {0, 3, 6, 10, 27}. A triage that ranks by vibe rather than by provenance
   will miss these, because every one of them is a *famous* quote attributed to a
   *famous* name — they look safe and are not. Finding none of them is a fail.
