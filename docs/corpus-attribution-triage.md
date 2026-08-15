# Corpus Attribution Triage

## Method and limits

This document is a **triage**, not an audit. It was produced with no network
access — no search, no fetch, nothing that could look up a primary source —
so nothing here has been checked against an original publication, archive,
or recording. The entire basis for every row is the author's own prior
knowledge of how these programming quotations are commonly sourced (or fail
to be sourceable) in the wider literature and folklore of computing. That
knowledge can be wrong, outdated, or itself just repeating the same
folklore this triage is trying to flag.

Nothing in this document should be read as a settled or endorsed statement
of fact about any quotation's origin. It is a ranked list of *where a human
should spend their limited verification time first*, based on how thin or
contested each entry's provenance appears to be. Treat every
"documented-source" / LOW-risk row as "plausible and traceable in
principle," not as something this pass established as true.

## Attribution risk table

| # | Aphorism (first ~40 chars) | Author | Risk | Signal | Why |
|---|---|---|---|---|---|
| 0 | Premature optimization is the root of… | Donald Knuth | HIGH | truncation | The full 1974 passage reads "...say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%"; dropping that frame flips a hedged caveat into a blanket rule. |
| 1 | Beware of bugs in the above code; I… | Donald Knuth | LOW | documented-source | Traces to Knuth's own reward-check letters to readers who found errata in his books, a specific and often-cited primary text. |
| 2 | Any fool can write code that a computer… | Martin Fowler | MEDIUM | paraphrase | Tied to the opening of Fowler's "Refactoring" (1999), but the wording circulating online varies enough between paraphrases that the exact original sentence isn't pinned here. |
| 3 | There are only two hard things in… | Phil Karlton | HIGH | no-primary-source | No document or talk by Karlton himself has ever surfaced with this line; it exists only as a secondhand recollection from former Netscape colleagues after his 1997 death. |
| 4 | Simplicity is prerequisite for… | Edsger W. Dijkstra | MEDIUM | no-primary-source | Reads consistent with Dijkstra's EWD manuscript style but circulates in quote lists without a specific EWD number attached. |
| 5 | The competent programmer is fully… | Edsger W. Dijkstra | LOW | documented-source | From his 1972 ACM Turing Award lecture "The Humble Programmer," a specific published text. |
| 6 | If debugging is the process of… | Edsger W. Dijkstra | MEDIUM | no-primary-source | Repeated as a Dijkstra one-liner in quote compilations, but no EWD manuscript or transcript is commonly cited alongside it. |
| 7 | Testing shows the presence, not the… | Edsger W. Dijkstra | LOW | documented-source | Directly traceable to his 1969/1970 paper "Notes on Structured Programming," one of the most-cited texts in the corpus. |
| 8 | Elegance is not a dispensable luxury… | Edsger W. Dijkstra | MEDIUM | no-primary-source | Plausible Dijkstra phrasing on program style, but repeated without a pinned EWD reference to distinguish it from later paraphrase. |
| 9 | The question of whether computers can… | Edsger W. Dijkstra | MEDIUM | no-primary-source | Linked in secondary sources to Dijkstra's essays on AI skepticism, but no specific manuscript is consistently cited for this exact wording. |
| 10 | Computer science is no more about… | Edsger W. Dijkstra | HIGH | no-primary-source | One of the most-repeated Dijkstra lines on the internet, yet quote sites rarely cite an EWD number or interview, and this may be a later compression of a longer remark. |
| 11 | Controlling complexity is the essence… | Brian Kernighan | MEDIUM | no-primary-source | Consistent with Kernighan's writing on program design, but circulates without a pinned book or paper citation. |
| 12 | Debugging is twice as hard as writing… | Brian Kernighan | MEDIUM | co-author-credit | This is from "The Elements of Programming Style," co-written with P. J. Plauger, yet only Kernighan is named as the source here. |
| 13 | The most effective debugging tool is… | Brian Kernighan | LOW | documented-source | Traces to Kernighan's 1979 Bell Labs paper "Unix for Beginners." |
| 14 | There are two ways of constructing a… | C.A.R. Hoare | LOW | documented-source | From Hoare's 1980 Turing Award lecture "The Emperor's Old Clothes," published in CACM in 1981. |
| 15 | I call it my billion-dollar mistake.… | C.A.R. Hoare | MEDIUM | paraphrase | Compresses two separate sentences from Hoare's 2009 QCon London talk into one, smoothing over the "invented in 1965... couldn't resist the temptation" detail of the original. |
| 16 | Adding manpower to a late software… | Fred Brooks | LOW | documented-source | This is Brooks's Law, stated near-verbatim in "The Mythical Man-Month" (1975). |
| 17 | The bearing of a child takes nine… | Fred Brooks | LOW | documented-source | The companion illustration to Brooks's Law, also from "The Mythical Man-Month." |
| 18 | All programmers are optimists. | Fred Brooks | LOW | documented-source | Opening line of "The Mythical Man-Month," chapter 1, easily located in the book. |
| 19 | Plan to throw one away; you will,… | Fred Brooks | MEDIUM | truncation | The bare line omits that Brooks revised this advice in the book's 1995 anniversary edition, arguing incremental growth is often preferable to a throwaway prototype. |
| 20 | A language that doesn't affect the… | Alan Perlis | LOW | documented-source | One of the numbered entries in Perlis's 1982 "Epigrams on Programming" (ACM SIGPLAN Notices), a single locatable source for this and the other Perlis lines below. |
| 21 | Simplicity does not precede… | Alan Perlis | LOW | documented-source | Also one of the numbered "Epigrams on Programming" (1982), which collectors cite by epigram number. |
| 22 | It is better to have 100 functions… | Alan Perlis | LOW | documented-source | Among the most-cited entries in the same 1982 epigram collection. |
| 23 | If you have a procedure with 10… | Alan Perlis | LOW | documented-source | Another entry from the same 1982 epigram collection, distinct in number from the others reused here. |
| 24 | Optimization hinders evolution. | Alan Perlis | LOW | documented-source | Shortest of the five epigrams used in this corpus, but from the same 1982 SIGPLAN source as the rest. |
| 25 | Be conservative in what you send, be… | Jon Postel | LOW | documented-source | Codified as the "robustness principle" in RFC 761/793, specific and citable standards documents. |
| 26 | Organizations which design systems… | Melvin Conway | LOW | documented-source | From Conway's 1968 Datamation article "How Do Committees Invent?," the origin of Conway's Law. |
| 27 | Make it work, make it right, make it… | Kent Beck | HIGH | contested-origin | The work/right/fast progression is credited to Beck in TDD circles, but near-identical staged advice predates his popularization and is sometimes treated as general engineering folklore rather than his coinage. |
| 28 | I'm not a great programmer; I'm just… | Kent Beck | MEDIUM | no-primary-source | Repeated as a Beck line in interviews and slide decks, but no single talk or article is consistently cited as its origin. |
| 29 | Do the simplest thing that could… | Ward Cunningham | MEDIUM | contested-origin | Also closely tied to Kent Beck and the wider Extreme Programming community; Cunningham's own wiki hosts the phrase, but Beck's XP writing is credited with it too. |
| 30 | Focus is a matter of deciding what… | John Carmack | MEDIUM | no-primary-source | Attributed to Carmack across talks and social posts, but no specific venue is reliably pinned down here. |
| 31 | Talk is cheap. Show me the code. | Linus Torvalds | LOW | documented-source | Traces to a specific 2000 Linux kernel mailing list post by Torvalds, still findable in the public archives. |
| 32 | Bad programmers worry about the code.… | Linus Torvalds | MEDIUM | paraphrase | Circulates in a shortened form; the fuller remark it is drawn from makes a more specific point about data structures than this compressed version conveys. |
| 33 | Fancy algorithms are slow when n is… | Rob Pike | LOW | documented-source | Rule 3 of Pike's 1989 essay "Notes on Programming in C." |
| 34 | The bigger the interface, the weaker… | Rob Pike | LOW | documented-source | One of the "Go Proverbs" from Pike's 2015 Gopherfest talk, a recorded and transcribed source. |
| 35 | A little copying is better than a… | Rob Pike | LOW | documented-source | Also from the 2015 "Go Proverbs" talk. |
| 36 | Clear is better than clever. | Rob Pike | LOW | documented-source | Also from the 2015 "Go Proverbs" talk, among its best-known lines. |
| 37 | Errors are values. | Rob Pike | LOW | documented-source | Title and thesis of Pike's January 2015 post "Errors are values" on The Go Blog. |
| 38 | All problems in computer science can… | David Wheeler | HIGH | contested-origin | Also widely credited to Butler Lampson, and the common addendum ("...except for the problem of too many layers of indirection") is a separate later joke sometimes folded into the same line; no single originator is settled. |
| 39 | It's easier to ask forgiveness than… | Grace Hopper | HIGH | no-primary-source | The saying appears to predate Hopper's computing career as general folk wisdom; no recording or transcript establishes her as originator rather than a popularizer. |
| 40 | The most dangerous phrase in the… | Grace Hopper | MEDIUM | no-primary-source | Loosely corroborated across several interviews and speeches she gave, but no single original recording is commonly cited as the source. |
| 41 | Perfection is achieved, not when… | Antoine de Saint-Exupery | LOW | documented-source | From his 1939 book "Terre des Hommes" ("Wind, Sand and Stars"), a specific published work, though the English here is a translation. |
| 42 | You aren't gonna need it. | Ron Jeffries | MEDIUM | co-author-credit | YAGNI is documented in "Extreme Programming Installed," co-authored by Jeffries with Ann Anderson and Chet Hendrickson, though only Jeffries is named here. |
| 43 | Given enough eyeballs, all bugs are… | Eric S. Raymond | LOW | documented-source | From "The Cathedral and the Bazaar" (1997/1999); Raymond named the idea "Linus's Law" about Torvalds but wrote the line himself. |
| 44 | Code is read much more often than it… | Guido van Rossum | LOW | documented-source | A line from PEP 8, the Python style guide van Rossum originally authored. |
| 45 | C makes it easy to shoot yourself in… | Bjarne Stroustrup | HIGH | contested-origin | Stroustrup's own published FAQ states he does not believe he said this in this form and does not know who first phrased it this way — the clearest case in the corpus of a named author disclaiming a quote. |
| 46 | There are only two kinds of… | Bjarne Stroustrup | LOW | documented-source | Unlike the foot-gun line above, Stroustrup's own FAQ affirms this one as something he actually said. |
| 47 | Simple things should be simple,… | Alan Kay | MEDIUM | no-primary-source | Associated with Kay's design goals for Smalltalk, repeated in secondary sources without a single pinned talk or paper. |
| 48 | The best way to predict the future is… | Alan Kay | HIGH | contested-origin | Near-identical formulations predate or parallel this line (e.g. Dennis Gabor's 1963 "Inventing the Future"), and Kay is not the sole person credited with it. |
| 49 | It's not a bug, it's an undocumented… | Anonymous | LOW | self-hedged | Attributed to "Anonymous," so it makes no claim about a real person that could turn out to be wrong. |

## Top of the queue

These are the HIGH-risk entries, in the order a human should work through them.

1. **#45 — Bjarne Stroustrup, "shoot yourself in the foot."** Check Stroustrup's own FAQ page, where he directly addresses this exact quote and says he doesn't believe he phrased it this way and doesn't know who did. This is the single clearest fix in the corpus: the named author himself disclaims it, so the entry should either move to an "attributed to" framing or be dropped, not stated as a flat Stroustrup quote.

2. **#38 — David Wheeler, "another level of indirection."** Check whether any Wheeler-authored text contains this exact line, versus the well-known rival claim that it originates with (or was at least equally popularized by) Butler Lampson. If forced to guess, this is more honestly framed as "attributed to David Wheeler, also credited to Butler Lampson" rather than a clean single-author line.

3. **#48 — Alan Kay, "predict the future... invent it."** Check Dennis Gabor's 1963 book "Inventing the Future" and Kay's own later interviews, where he has been notably modest about sole credit for this formulation. The likely correct framing is "popularized by Alan Kay," not "coined by."

4. **#3 — Phil Karlton, "two hard things."** There is no talk, paper, or slide by Karlton himself to check against — that is the finding. The likely best fix is not reattribution but a softened framing ("attributed to Phil Karlton, unsourced") since no better claimant exists either.

5. **#39 — Grace Hopper, "ask forgiveness... permission."** Check whether the phrase shows up in print before Hopper's public speaking career; it reads like a pre-existing saying she used and popularized rather than coined. If so, "popularized by" is the more defensible framing than a bare attribution.

6. **#0 — Donald Knuth, "premature optimization."** Check the full 1974 "Structured Programming with Go To Statements" passage. The author (Knuth) is very likely right; the risk here is not misattribution but a truncation that inverts the practical advice — worth restoring the surrounding clause or footnoting it.

7. **#10 — Edsger W. Dijkstra, "computer science... telescopes."** Check the University of Texas E.W. Dijkstra Archive (EWD manuscripts) for this exact phrasing. Attribution to Dijkstra is plausible and low-stakes to keep; the actual gap is sourcing, not a rival claimant.

8. **#27 — Kent Beck, "make it work, make it right, make it fast."** Check for earlier appearances of this staged progression in software engineering writing that predates Beck's TDD-era popularization. If an earlier source exists, this should read as "popularized by," not "authored by," Beck.

## Conductor addendum

Written separately, and marked as such, by the reviewer who gated this document rather
than by its author. The ranking above was produced independently of a risk list the
reviewer had committed to disk beforehand; the two agreed on most of the top of the queue,
and the four notes below are the places where they did NOT agree. They are recorded as
disagreements between two unverified opinions, not as corrections — neither party had
access to a single source.

1. **#45 (Stroustrup, "shoot yourself in the foot") — check this one first, and check the
   claim about it as well as the quote.** This row is different in kind from every other
   row in the table: it asserts a specific, checkable fact about a specific document — that
   Stroustrup's own FAQ *disclaims* the line — and row #46 leans on the same asserted FAQ to
   affirm a different quote. The reviewer's recollection is the opposite: that Stroustrup's
   FAQ acknowledges the foot-gun line as genuinely his. One of those recollections is wrong
   and no source here can say which. That makes it the highest-value item in the document —
   not because the attribution is necessarily bad, but because a confident claim about what
   a primary source says is exactly the kind of thing that should never be taken on trust.

2. **#25 (Postel) is rated LOW but has a paraphrase problem the table missed.** The
   robustness principle as written in the RFCs is "be conservative in what you **do**, be
   liberal in what you accept **from others**." The corpus reads "be conservative in what you
   **send**." The attribution to Postel is sound; the wording is a common variant rather than
   the standard's text, which puts it in the same class as #0 — right person, altered words.

3. **#6 (Dijkstra, "if debugging is the process of removing bugs...") is rated MEDIUM here;
   the reviewer independently rated it HIGH.** Both agree no primary source is commonly
   cited. The disagreement is only about how much that matters for a quip of this shape,
   which reads like a joke retrofitted onto the field's most quotable name. Treat it as
   sitting on the HIGH/MEDIUM boundary.

4. **The MEDIUM Dijkstra rows (#4, #8, #9) are likely more findable than "no-primary-source"
   suggests.** The E. W. Dijkstra Archive is indexed and searchable by EWD number, so these
   are probably cheap to settle rather than genuinely unsourceable — they should be near the
   front of the MEDIUM queue on effort grounds, not the back.

## What would settle this

What would actually resolve any of the above is a primary source: the author's own published writing, an archived manuscript (Dijkstra's EWDs and Perlis's SIGPLAN epigrams are the model here), a dated recording or transcript of a talk, or a first-print publication that can be checked against the exact wording in this corpus — not another quote-aggregator page repeating the same unsourced attribution. Until someone does that checking for the entries flagged MEDIUM or HIGH above, this corpus should not be described as anything better than curated-and-unverified.
