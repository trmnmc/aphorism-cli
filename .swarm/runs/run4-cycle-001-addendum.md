
### cycle 1 addendum | dashboard render | KI-11's ROOT CAUSE found, and closed in the renderer

KI-11 has sat open since run #3 as a symptom with no cause: "SWARM/runs/dashboard.html
carries THREE copies of the cycle-37 timeline tick; two of them sit INSIDE HTML comment
regions." This cycle reproduced it on the first render and found why.

MEASURED, first render of this cycle (naive `replaceAll` per the template's own header,
which says the placeholders are substituted "sed-style, global, every occurrence"):
  grep -n 'class="tick' runs/dashboard.html   -> 4 occurrences from a loop that emitted 1
    line  21  inside the HTML header comment that DOCUMENTS {{TIMELINE_HTML}}
    line 237  inside the .timeline region comment that documents the per-tick shape
    line 240  the template's own literal example tick (correct, not a leak)
    line 247  the real strip (correct)

ROOT CAUSE: the template documents its own placeholders USING THE PLACEHOLDER TOKENS,
inside comments. Global substitution fills the documentation as well as the slot. It was
never a duplicated loop — which is why "three copies" was so hard to place from the
symptom. The template is not wrong to document its contract, and it is fenced read-only
mid-run by hard rule 5 regardless, so the RENDERER is where this gets fixed: it now
refuses to substitute inside comment regions.

AND THE FIRST FIX WAS INCOMPLETE, which is the part worth writing down. Skipping only
`<!-- -->` still left a full copy of the stat tiles and the station rows inside the two
CSS `/* */` region notes at .stats and .stations. Comments here come in two dialects and
the first correction caught one. That was found by MEASURING the corrected render rather
than by trusting that the fix had worked — the same discipline that caught C4 an hour
earlier, applied to the fix instead of to the instrument.

VERIFICATION EVIDENCE (self-checks now part of every render this run makes):
  node /opt/swarm/runs/run4-render-dashboard.mjs
    naive render         29223 bytes   4 tick occurrences, 1 emitted     DEFECT REPRODUCED
    HTML-comments only   24119 bytes   1 live tick, stats+stations still leaking into CSS
    both dialects        22787 bytes
      tick self-check: 1 live tick(s) for 1 completed cycle(s) — OK
      comment-leak self-check: 0 leaks (KI-11 class closed in both dialects)
      unfilled placeholders: 0
  The 6,436-byte drop between the naive and the corrected render IS the duplicated
  content, which is a second, independent reading of the same defect.

SCOPE, stated honestly: this closes the KI-11 CLASS for every render THIS run makes,
because this run renders through its own script under SWARM/runs/ (the one place hard
rule 5 permits writing). It does NOT fix the template, and a future run that renders by
hand or with a naive substitution will reproduce it. The durable fix is either a
`bin/`-level renderer or a template that documents its placeholders without spelling the
tokens — both are SWARM tool changes, fenced during a run, and so belong in the morning
report rather than in a live edit. Filed accordingly, with the cause attached this time.
