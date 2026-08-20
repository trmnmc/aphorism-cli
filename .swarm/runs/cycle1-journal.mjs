import fs from "node:fs";

const rf = JSON.parse(fs.readFileSync("/opt/swarm/runs/current.json", "utf8"));
const mirror = JSON.parse(JSON.stringify(rf));
delete mirror.artifact.url;

const block = `

## cycle 1 | 2026-08-20T15:1xZ | aphorism-cli | BUILD

**Work:** Q-1 (extract the five run-journal blockquotes out of README.md) — ONE builder, k=1.
**Why k=1:** Q-1, Q-3 and Q-4 all edit README.md, and two fixers must never share a file
(L-016). Gear 2 allowed k=2; the file-scope rule bound tighter and won.

**Dispatch shape:** direct Agent call, not Workflow — Workflow is review-gated in a headless
\`-p\` session, and L-016's documented fallback is direct foreground Agent calls with the scope
declared IN the prompt.

**The one instruction that made this a measurement rather than a chore:** the builder was
forbidden from touching \`test/\`, \`src/\`, \`bin/\` and \`.github/\`, and was told in as many words
that a red suite on return was an acceptable outcome it must NOT repair. Which guards break
under honest prose IS the deliverable; a builder that helpfully fixes one destroys the result.

### Sealed gate (L-042)

Authored and hash-sealed BEFORE dispatch, held under \`/opt/swarm/runs/\` — outside the target —
so it was structurally unreachable to the builder rather than merely forbidden by a prompt line.

\`\`\`
gate script      sha256 49b328d37d544d82d2142263e7350cb665fe4b96405576d7f002d2c122e1bb33
pre-dispatch out sha256 f0a751bab7f80a5dfa09949c03b10d6fd3ddc8ffc809face8cb9e907d51393df
baseline (95 ln) sha256 8675695d82f0841e08777378f85e8eebe9a83d451ee607c4cda44ca3a3c30622
gate script AFTER verification: 49b328d3... — UNCHANGED, so the check predated the work and
the judged tree never moved.
\`\`\`

**Pre-dispatch SMOKE RUN against unmodified HEAD — 4/7, and the split is the point:**
A/B/C FAIL (the work genuinely was not done) while D/E/F/G PASS (the controls are live and
not dying on everything — a gate that fails on every input is a snapshot test, L-044).
Cell F is the deliberate converse arm: it asserts the live CI citation and both standing
limits are still PRESENT, so a builder that satisfied "remove the blockquotes" and "shrink the
file" by deleting the section outright would fail it. F passing on unmodified HEAD proves F can
actually locate what it looks for.

The smoke run also caught one real defect in the instrument before it ever judged work:
\`require("node:crypto")\` inside an ESM module. Repaired pre-dispatch, before any hash was taken.

### VERIFICATION EVIDENCE — sealed gate, post-dispatch: 7/7

\`\`\`
SEALED GATE Q-1 — 7/7 cells pass
[PASS] A. zero \`> **Updated 2026-08-20 (cycle N)**\` headers in README.md      0 found (expected 0)
[PASS] B. all 5 blockquotes byte-identical in a dated docs/ file, ascending
          all 5 byte-identical in docs/node-support-citation-history.md; order [3, 5, 6, 9, 10]
[PASS] C. README >= 5000 bytes smaller                       16609 -> 11165 bytes (shrink 5444)
[PASS] D. node --test >= 121 tests, 0 fail                   tests 121 / pass 121 / fail 0
[PASS] E. corpus.js + --help byte-identical to 3a17cc5       corpus 77a4de5c, help d759d781
[PASS] F. README still states the live citation + both limits  all 5 live claims present
[PASS] G. still zero dependencies                            no package.json
\`\`\`

**Scope discipline, verified not asked:** \`git status --porcelain\` = \` M README.md\` +
\`?? docs/node-support-citation-history.md\`. Nothing under \`test/\`, \`src/\`, \`bin/\`, \`.github/\`.
README 309 -> 233 lines, 16,609 -> 11,165 bytes (-33%).

**Diff read despite green (L-042).** The rewritten \`### Node support\` reads as documentation:
the matrix table, the retirement condition stated exactly once, the two standing limits as a
numbered list, the verified-at-18 caveat, and a pointer to the moved history.

### THE CYCLE'S HEADLINE RESULT — a negative, and it is the most valuable thing here

**114 README lines deleted, the whole Node-support section rewritten, and ZERO guards broke.**
121/121 green, unchanged.

This run's premise was that the padded prose existed because guards read it, and that moving it
would expose guards anchored to prose rather than to structure (L-043). Measured: it did not.
The guards survived honest prose. The premise was half wrong, in the useful direction — and
"half wrong, measured" is a real result where "the suite feels thin" was five runs of assertion.

Zero-breaks is exactly the shape that could also mean the guards are INERT, so that was tested
rather than assumed (L-029 failable + attributable, L-044 converse control):

\`\`\`
MUTATION  README retirement base 2b003ea -> c9dd7ff (a real earlier commit in this history)
$ node --test test/node-support-citation.test.js
  FAIL — ERR_ASSERTION, non-empty diff, message names the cited base, the pathspec, and the
  fact that base-vs-working-tree is no longer empty. The guard explains itself correctly.

CONVERSE  restore README (sha256 ebb0d9c4... on both sides — byte-exact, not "looks the same")
$ node --test test/node-support-citation.test.js
  ℹ pass 2   ℹ fail 0   ℹ skipped 0
\`\`\`

Kill and survive arms both observed; attribution pinned by running that file alone rather than
the whole suite. \`test/node-support-citation.test.js\` is LIVE and correctly anchored.

### Q-3 doc->doc half closed incidentally

README:306's \`# tests 120\` / \`(119 -> 120)\` — which contradicted the 121-test matrix table 115
lines above it in the same section — is gone, replaced by \`# tests <n>\` / \`ℹ tests <n>\` plus
"The test count moves as the suite grows". That is the correct repair rather than a restamp:
the durable claim is the TAP-vs-spec-reporter split and the U+2139 marker, and the literal
count was the part that rotted (L-042's simulated-future clause — the new form cannot rot).

### Not done, stated plainly

- Q-2 is IN_PROGRESS, not done: liveness is proven for \`node-support-citation.test.js\` only.
  \`readme-tags.test.js\` (folds into Q-4) and \`citations.test.js\` have not had the same
  kill/converse treatment.
- Q-3's remaining half is unbuilt: no guard yet stops a count claim in that section silently
  disagreeing with its own matrix table.
- Q-4 untouched. The builder ADDED a note at \`## Tag vocabulary\` naming \`readme-tags.test.js\`
  and saying plainly that the guard is why the paragraph restates one count twice — honest, and
  it makes the Q-4 target easier to see, but the restatement itself is still there.

**Commit:** see below. **Next:** cycle 2 — Q-4 (re-anchor the tag guard, prove it live the same
way), then Q-3's guard. Driven by \`swarm-pacer.timer\` (\`OnUnitInactiveSec=5min\`).

runfile-mirror:
\`\`\`json
${JSON.stringify(mirror, null, 2)}
\`\`\`
`;

fs.appendFileSync("/opt/targets/aphorism-cli/.swarm/journal.md", block);
console.log("cycle 1 journal appended,", block.length, "chars");
