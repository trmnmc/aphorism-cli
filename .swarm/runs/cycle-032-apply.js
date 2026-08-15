// cycle 32 — backlog mutation (conductor). Run from the target root.
const fs = require('fs');
const b = JSON.parse(fs.readFileSync('.swarm/backlog.json', 'utf8'));
const it = id => b.items.find(x => x.id === id);

const a = it('T-024a');
a.status = 'blocked';
a.attempts = 2;
a.notes += `

=== ATTEMPT 2 REJECTED AT THE GATE AND REVERTED, cycle 32 — ITEM NOW BLOCKED (attempts 2) ===
Evidence: .swarm/runs/cycle-032-gate-T-024a.js and .txt (9 cells, every cell run on BOTH arms, FIXED = working tree, HEAD = git show HEAD:test/readme-tags.test.js).

WHAT THE BUILDER BUILT: extractNearestPrecedingCount was replaced by two helpers. extractEntriesCount reads /(\\d+)\\s*\\n?\\s*entries\\b/ — tight adjacency, no clause search. extractHighCount tries two closed grammatical templates in order: direct /(\\d+)\\s+(?:are|is)\\s+rated\\s+HIGH\\b/, then partitive /(\\d+)\\s+of\\s+the\\s+\\d+\\s+\\w+\\s+(?:are|is)\\s+rated\\s+HIGH\\b/. Suite green at 78/78/0, README byte-identical, file scope respected, no commit attempted. The builder's own report was unusually honest and volunteered the narrowing described below BEFORE the gate found it.

THE GATE MEASURED THE ONE QUESTION THAT REJECTED ATTEMPT 1 — did the ledger of naturally-written, entirely-TRUE READMEs this guard falsely rejects actually SHRINK, or did its membership merely move again? IT GREW. FIXED scores 5/9, HEAD scores 7/9. Three new false rejections bought one genuine repair:
  H1 TRUE   "— 8 fall into the HIGH band —"       HEAD GREEN          FIXED PARSE-MISS   REGRESSION
  H2 TRUE   "— 8 entries are rated HIGH —"        HEAD GREEN          FIXED PARSE-MISS   REGRESSION
  H3 TRUE   "ranks all 50 corpus entries"          HEAD GREEN          FIXED PARSE-MISS   REGRESSION (C1)
  H4 TRUE   "8 of the 50 entries are rated HIGH"   HEAD MISMATCH(50)   FIXED GREEN        improvement
H1 is the sharpest of the three: the docstring of the very helper being replaced named "8 fall into the HIGH tier" as a rewording it tolerated BY DESIGN. The replacement breaks the exact example its predecessor documented as supported. H3 shows the narrowing is not confined to C2 — C1's "derive, never hardcode" tolerance also shrank, from "any digit run in the clause before the marker" to "a digit run separated from the word entries by whitespace only".

AND THE CENTRAL CLAIM IS REFUTED DIRECTLY. The builder wrote that the templates decide "by the sentence's actual grammar, never by position". Cell H7 — an Attribution section carrying TWO bound HIGH claims, one TRUE (8) and one FALSE (9), BOTH in the direct template's own shape — is GREEN on the fixed tree. String.prototype.match returns the FIRST match, so when two template-shaped claims exist POSITION ALONE decides which one is read, and the wrong one goes SILENT. Position was not removed; it was moved behind a template.

WHY BLOCKED RATHER THAN A THIRD ATTEMPT: attempts 2 is the standing cap (cycle.md step 6.4). It is also the right call on the evidence rather than merely the rule. Two independent attempts, reasoning from different premises, each produced a lateral or negative trade — attempt 1 a perfect 2/4 <-> 2/4 swap, attempt 2 a 3-for-1 loss. The result consistent across both is that ANY rule which reads an English sentence to decide WHICH NUMBER a claim means will falsely reject some true README; only the membership of that set changes. That is now measured twice rather than argued, and it is the strongest evidence this run has produced for the cycle-25 standing finding. See KI-9 for what a human would need to decide.

HONEST NOTE ON THE BUILDER'S OWN HEADLINE EVIDENCE, recorded so a later reader does not have to rediscover it: the builder cited cell D4 from .swarm/runs/cycle-031-verify-T-024a.js as proof that it closed a silent hole present under HEAD. Cycle 31 recorded that D4 was MIS-AUTHORED BY THE CONDUCTOR and attributes nothing — the prose it plants never states a false HIGH claim in the clause carrying the marker, so both arms GREEN is the CORRECT verdict there, not a hole. The builder could not have known: that caveat lives in this notes field, not in the .js file it read. Its silent-hole double-proof therefore rests on a contested cell, and H7 — an unambiguous silent-hole probe authored fresh this cycle — shows the hole is not closed on either arm. None of this is held against the builder; it is a direct KI-8 consequence and is recorded there too.`;

const u = it('T-024');
u.notes += `

CYCLE 32: the T-024a half is now BLOCKED at attempts 2 (see that item, and KI-9). This umbrella cannot close during this run. Its one remaining live child is T-024b. The two failed attempts on T-024a are simultaneously the strongest evidence yet FOR this umbrella's premise and evidence that its prescribed remedy — "derive values from document STRUCTURE rather than from a position or literal inside an English sentence" — has NO REACHABLE IMPLEMENTATION for the Attribution counts specifically, because those claims live in a PARAGRAPH and a paragraph has no structure to read. T-024b concerns a HEADING, which does. A future conductor must not read T-024a-blocked as evidence that T-024b is unreachable: the two sit on different markdown constructs and that difference is the entire argument.`;

b.items.push({
  id: 'T-029',
  title: 'SILENT HOLE: a second, contradictory HIGH-count claim in the Attribution section passes green on both arms',
  status: 'todo',
  priority: 3,
  effort: 'S',
  kind: 'fix',
  attempts: 0,
  deps: [],
  model: 'sonnet',
  packages: [],
  files_hint: ['test/readme-tags.test.js'],
  acceptance: 'A README whose Attribution section carries TWO bound HIGH-count claims -- one TRUE (8) and one FALSE (9), the cycle-32 H7 shape -- must FAIL, and the failure message must name the WRONG number. Proven twice per L-029: the assertion fails against that README, and with the new code neutered that same README survives GREEN. Every existing kill stays a kill (cycle-32 cells H0, H5, H6 and H8 must remain correct on the fixed arm) and every parse miss must still fail LOUD. THE FIX MUST NOT BE POSITIONAL: "take the first match" and "take the last match" are BOTH disqualified, because either one goes silent on the mirror image of its own case -- that is the identical defect T-024a was rejected for, twice.',
  notes: `Source: conductor gate cell H7, cycle 32 (.swarm/runs/cycle-032-gate-T-024a.js and .txt). SEVENTH cycle running that a gate cell or a builder's volunteered uncertainty converted directly into a measured item (cf. T-020 c22, T-021 c23, T-018 c27, T-021 c28, T-026 c29, T-027 and T-028 c30).

MEASURED: an Attribution section reading "... to be wrong — 8 are rated HIGH — and says what would settle each one. A later audit note records that 9 are rated HIGH overall." is GREEN on HEAD at 78/78/0, and was ALSO green on the rejected T-024a attempt-2 tree. Both implementations stop at the first claim they can bind and never look at the rest of the section, so a contradictory second claim is invisible to them.

THIS IS A DIFFERENT AND MORE SERIOUS CLASS THAN THE REST OF THE FAMILY, which is why it is priority 3 while its siblings sit at 4 to 7. Every other member of the prose-anchor family (T-018, T-020, T-021, T-023, T-025, T-026, T-027, T-028) fails LOUD -- it rejects a correct README, which is irritating but safe, and the run has repeatedly classified that as the acceptable direction. This one fails SILENT: a README that contradicts itself, carrying a false count in plain sight, passes. Silent-and-wrong is the precise failure class this improvement run exists to remove, and the run has now spent five cycles hardening loud-and-wrong cases while this sat unmeasured underneath them.

NOT A REGRESSION -- HEAD has always had it. It went unfound because every prior cell in this family planted ONE claim and varied its WORDING; no cell had ever planted TWO. That is the transferable lesson and it is a wrap-up distillation candidate: a guard that extracts "the" value must be probed with a SECOND, CONTRADICTORY value, not only with reworded versions of the first.

HYPOTHESIS, RECORDED AS A HYPOTHESIS AND NOT AS SPEC: collect EVERY binding the section offers rather than the first, require at least one, and require ALL of them to equal the independently-derived truth. That is order-free by construction and needs no judgment about which claim the prose "meant". It must be measured rather than assumed -- in particular against the case where a section legitimately states the count more than once in different framings (which would then be required to agree, possibly correctly), and against what the extraction should do when two bindings disagree and NEITHER is the truth.`,
});

fs.writeFileSync('.swarm/backlog.json.tmp', JSON.stringify(b, null, 2));
fs.renameSync('.swarm/backlog.json.tmp', '.swarm/backlog.json');
console.log('backlog items:', b.items.length, '| T-024a:', it('T-024a').status, 'attempts', it('T-024a').attempts, '| T-029 filed');
