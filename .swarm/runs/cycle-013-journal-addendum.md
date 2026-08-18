
## cycle 13 addendum — 2026-08-18T09:25Z — the eighth instrument bug, in the converse control I added to teach the third

The cycle-13 dashboard render substituted cleanly (11/11 anchors, MISS count 0, 3/3 evidence
blocks replaced per KI-33) and its assertion pass came back **19/20**, with this FAIL:

  FAIL  CONVERSE CONTROL: the page still remembers its own history (old stamp survives OUTSIDE the stamp elements)

MEASURED, not reasoned: the underlying property HOLDS. Occurrence counts on the live page,
comments stripped:

  "2026-08-18 08:38Z"  ->  0    (space form: the previous GEN stamp)
  "2026-08-18T08:38Z"  ->  2    (ISO-T form: cycle 12 tick title + journal one-liner)
  "2026-08-18T08:22Z"  ->  2    (ISO-T form: cycle 11, still there from two renders ago)
  "2026-08-18 09:22Z"  ->  1    (this cycle's stamp element)

The page remembers its past perfectly well. It just does not record history in the same
SERIALIZATION the stamp elements use: stamps render as `2026-08-18 09:22Z` (space) while
every history row renders as `2026-08-18T08:38Z` (ISO-T). My converse control searched for
the space form outside the stamp elements — a string that, by construction, can only ever
exist INSIDE them. It could not have passed.

THE IRONY IS THE POINT AND IS RECORDED AS SUCH. This control existed only because the
cycle-12 addendum instructed its successor to fix the stale-stamp assertion by making it
anchor-element-local, and I added a converse control (L-044) so the new check could not
become a snapshot test. The anchor-element fix WORKED — both stamp assertions passed on the
merits. The control guarding it is what broke, on a fresh error.

That is the EIGHTH instrument bug of run #3, and a third distinct species. Naming all of
them, because the run has now earned a taxonomy rather than a list:

  SUBSTRING-FOR-STRUCTURE   (c11 "102 tests", c12 deleted-bullet grep, c12 stale stamp)
      a substring test standing in for a structural property, applied to a document that
      legitimately contains the substring for another reason.
  FORMAT ASSUMPTION         (c13 gate A9)
      the check assumed a DIALECT of the tool it measured; the tool spoke another and
      returned no answer, which the check scored as failure rather than as unparseable.
  ANCHOR UNIQUENESS         (c13 gate A8)
      the check located its subject by string search without asserting cardinality, and
      silently measured whatever the wrong match bracketed.
  SERIALIZATION MISMATCH    (c13 dashboard converse control — new)
      the check assumed two parts of ONE document render the same value the same way. They
      did not, so it searched for a string that could not exist where it was looking.

The last three are the same deeper error wearing different clothes: **the check knew what it
wanted to measure and guessed at how that value would be spelled.** A9 guessed a reporter's
spelling, A8 guessed an anchor's uniqueness, this one guessed a timestamp's spelling. The
defensive shape for all three is identical and is now the standing rule for every future
harness: derive the representation FROM the document at run time, then assert against what
you derived — exactly what the gen/next anchors themselves already do, and the reason those
two assertions passed while the control around them failed.

The harness is NOT rewritten after the fact, following the cycle-12 precedent for this file
specifically: it is written fresh each cycle and pre-commits nothing, so the obligation is
weaker than for a sealed gate — but the next cycle COPIES IT FORWARD, and a harness copied
forward with a silently-corrected assertion teaches nothing. It stands at 19/20 with this
note. FOR CYCLE 14, applied deliberately in the copy and not backdated here: the converse
control should DERIVE the history serialization from the page (grep the tick titles for the
timestamp they actually carry) rather than assuming it matches the stamp format.

The dashboard page itself is correct.
