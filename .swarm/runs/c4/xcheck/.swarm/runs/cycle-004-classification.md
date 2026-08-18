# Cycle 4 — HOLE vs BOUNDARY classification of the I-2a survivors

Conductor judgment, made AFTER the sweep returned and after every survivor was
independently re-measured (`cycle-004-verify-I-2a.txt`, 11/11 agree). This classification
was deliberately withheld from the sweep agent: a survivor is a measurement, but whether
it deserves a test is a judgment about what the product actually promises.

The authority for "what the product promises" is `.swarm/SPEC.md` **§ Domain rules**, not
the test suite and not intuition. Each verdict below cites the rule it rests on.

| id | behavior | file | verdict | rule |
|---|---|---|---|---|
| M07 | `--tag` membership vs substring | `src/select.js` | **HOLE** | "`--tag` matches … against **membership** in the aphorism's `tags` array" |
| M12 | `--list` drops the last entry | `bin/aphorism.js` | **HOLE** | "`--list` prints **every** aphorism in the filtered set" |
| M13 | `--list` reverses order | `bin/aphorism.js` | **HOLE** | "… one per line, **in corpus order**" |
| M14 | `--json` pretty-prints | `bin/aphorism.js` | **HOLE** | "`--json` emits … as a **single-line** JSON object" |
| M21 | negative `--seed` rejected | `src/args.js` | **HOLE** | exit 2 is "bad usage (unknown flag or missing flag argument)"; `-5` is neither |
| M22 | `--seed` lookahead guard dropped | `src/args.js` | **BOUNDARY** | contract is exit 2 + clean stdout + a message on stderr — all three still hold |
| M16 | `--list --json` array vs NDJSON | `bin/aphorism.js` | **DEFERRED to I-3** | no rule describes this combination yet (SPEC OPEN AMBIGUITIES, item I-3(c)) |

## Why the two non-HOLEs are not hardened

**M22 — BOUNDARY.** The mutant still exits 2, still writes zero bytes to stdout, and still
puts a human-readable message on stderr. The only thing that changed is the wording:
`flag --seed requires a value` became `flag --seed requires a numeric value`. Every clause
of the documented contract survives. A test that pinned the exact string would not be
protecting a promise — it would freeze prose no rule fixes, and would false-reject an
honest reword of an error message. Recorded, not hardened. This is the case the item's own
notes anticipated: a survivor can be the suite being *correct*.

**M16 — DEFERRED, not classified.** `--list --json` is the one surface the SPEC explicitly
lists as an OPEN AMBIGUITY (I-3(c)); the shipped behavior is NDJSON and no Domain rule says
so. Writing a test now would silently promote today's implementation to a promise and
pre-empt the decision I-3 exists to make. The honest order is: I-3 writes the rule, then a
test can enforce it. Feeding this to I-3 as measured evidence that the surface is
completely unprotected.

Note the two are distinguished on purpose. M22 has a rule and satisfies it; M16 has no rule
at all. Both correctly produce no test this cycle, but for opposite reasons, and only M16
creates downstream work.

## Assignment to the follow-on items

Each HOLE goes to whichever test file can observe it, keeping I-2b and I-2c on
pairwise-disjoint files.

**I-2b — `test/cli.test.js`** (4 holes, all observable through the shipped binary):

- **M07** — `--tag test` must exit 1. The corpus has a `testing` tag and no `test` tag, so
  a substring mutant returns matches where membership returns none. Note the existing tag
  test cannot see this: it only checks case-insensitivity.
- **M12** — `--list` must print exactly as many lines as the corpus has entries. The
  existing assertion is a *floor* (`lines.length >= 40`) against a 50-entry corpus, so
  dropping an entry passes it.
- **M13** — `--list`'s first and last lines must match corpus order. Nothing asserts order today.
- **M14** — `--json` output must be exactly one line. The existing test does
  `JSON.parse(trim())`, which a pretty-printed object also satisfies.

**I-2c — `test/args.test.js`** (1 hole, parser-level):

- **M21** — `parseArgs(['--seed', '-5'])` must yield `seed === -5` with no error.

I-2c stands on its own evidence rather than being padded: it gets exactly the one survivor
that lives in the parser, and would have been closed as not-needed had that survivor not
appeared.

## Standing requirement for both follow-on items

Every added test must be proven **twice** (playbook L-029): it fails against its specific
mutation from this sweep, and removing it lets that same mutation survive. A kill that
cannot be attributed to the new test is not evidence. The exact mutations are recorded in
`cycle-004-mutation-sweep.json` and re-derived independently in `cycle-004-verify-I-2a.py`.
