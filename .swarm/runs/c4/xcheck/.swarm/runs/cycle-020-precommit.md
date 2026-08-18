# Cycle 20 — sealed pre-commitment for T-014

Written by the conductor BEFORE the builder was dispatched, from my own read of
`README.md` lines 53–83 and `test/readme-tags.test.js`. The builder never sees this file.
Its purpose: if the returned work merely agrees with me after the fact, that is weak
evidence; if it matches a prediction it could not have seen, that is strong evidence.

## What the two survivors actually are

`extractCountsFromReadme` walks `| \`tag\` | count |` rows and asserts README→corpus. It
iterates `Object.keys(countsInReadme)` — the README's rows — so a tag with no row is never
looked at. That is A7 in one sentence: **the loop's domain is the README, so absence is
unrepresentable.**

A8 is a second consequence of the same shape: the row carries a count, the count is checked,
and the *heading above the row* — "4 tags have a robust pool (5+ entries)" / "12 tags appear
2–4 times" — is never connected to the row at all. The two tables are, to the current guard,
one undifferentiated bag of rows.

## Predicted correct shape (my answer, sealed)

1. **Bidirectional (A7):** the set of tags with corpus count ≥ 2 must EQUAL the set of tags
   carrying a table row. Not a subset in either direction — equality, so a spurious row and a
   missing row both fail. The ≥ 2 threshold is itself derivable (the two bands are 5+ and
   2–4), so it must not be hardcoded as the literal 2 if the headings can supply it.
2. **Band-aware (A8):** parse each table's band from its own heading's NUMBERS (`5+` → min 5,
   no max; `2–4` → min 2, max 4), then assert every row under that heading has a count inside
   its band. Keying to the digits, not to the phrases "robust pool" or "appear", is what keeps
   this from recreating T-012.

## Failability targets — these mutations MUST fail the suite after the fix

- **M-A7** delete the whole `| \`debugging\` | 5 |` row → must fail. (Cycle 19's V1 survived.)
- **M-A8** move the `| \`performance\` | 4 |` row from the 2–4 table into the 5+ table, count
  untouched → must fail. (Cycle 19's V2 survived.)

## Attribution targets — removing the new assertion must let each mutation survive again

Per L-029 a kill I cannot attribute is not evidence. I will re-run M-A7 and M-A8 against a
tree with the new assertions deleted and require them to SURVIVE there.

## Negative controls — these must NOT fail (no false rejection)

- **N1** reword the heading "4 tags have a robust pool (5+ entries)" to
  "4 tags have a deep pool (5+ entries)" → must still pass. The band digits are unchanged;
  only English moved. A fix that fails here has recreated T-012 and I will reject it.
- **N2** the unmutated tree must stay 65-green plus the new tests, 0 fail.

## Predicted risks in the returned work

- (R1) Hardcoding the tag→band mapping as a literal list, which passes today and rots the
  moment T-007 retags anything. I will read the diff for this specifically.
- (R2) Keying the band parse to the lead-in sentence rather than its digits — the T-012 trap,
  named explicitly in the item's own notes.
- (R3) Widening `extractCountsFromReadme` in a way that also changes what the EXISTING count
  test sees, silently altering a passing guard. Any change to the shared helper gets checked
  against the old behaviour.
