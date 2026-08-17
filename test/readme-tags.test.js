'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Import corpus
const { corpus } = require('../src/corpus.js');

// Helper: count tags in corpus
function countTagsInCorpus() {
  const tagCount = {};
  corpus.forEach(entry => {
    entry.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  return tagCount;
}

// Helper: extract tags mentioned in README
function extractTagsFromReadme(readmeContent) {
  const tags = new Set();

  // Match backtick-quoted tags: `tag`
  const backtickPattern = /\`([a-z]+)\`/g;
  let match;
  while ((match = backtickPattern.exec(readmeContent)) !== null) {
    tags.add(match[1]);
  }

  return Array.from(tags).sort();
}

// Helper: extract counts from README tables
function extractCountsFromReadme(readmeContent) {
  const counts = {};

  // Match table rows: | `tag` | count |
  const tableRowPattern = /\| \`([a-z]+)\` \| (\d+) \|/g;
  let match;
  while ((match = tableRowPattern.exec(readmeContent)) !== null) {
    const tag = match[1];
    const count = parseInt(match[2], 10);
    counts[tag] = count;
  }

  return counts;
}

test('README tags must exist in corpus', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagsInCorpus = countTagsInCorpus();

  // Find the Tag vocabulary section
  const tagVocabStart = readmeContent.indexOf('## Tag vocabulary');
  assert(tagVocabStart !== -1, 'README must have a Tag vocabulary section');

  const nextSection = readmeContent.indexOf('\n## ', tagVocabStart + 1);
  const tagVocabEnd = nextSection > -1 ? nextSection : readmeContent.length;
  const tagVocabSection = readmeContent.substring(tagVocabStart, tagVocabEnd);

  // Strip fenced code blocks (e.g. the trailing ```sh command-line example) so
  // shell tokens inside them are never mistaken for tag claims.
  const tagVocabProse = tagVocabSection.replace(/```[\s\S]*?```/g, '');

  // Every backtick-quoted lowercase-word token anywhere in what remains --
  // table row, prose list, aside, whatever -- is a tag claim. This is
  // deliberately NOT keyed to any specific lead-in sentence: rewording the
  // prose around the list must not stop a claimed tag from being checked.
  // Reuses the same extraction helper used elsewhere in this file so table
  // rows and prose entries are not parsed by two independent regexes.
  const allClaimedTags = extractTagsFromReadme(tagVocabProse);

  // Each claimed tag must exist in the corpus
  for (const tag of allClaimedTags) {
    assert(tag in tagsInCorpus, 'Tag ' + tag + ' is claimed in README Tag vocabulary section but does not exist in corpus');
  }
});


test('README tag counts must match corpus', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagsInCorpus = countTagsInCorpus();
  const countsInReadme = extractCountsFromReadme(readmeContent);

  for (const tag of Object.keys(countsInReadme)) {
    const countInReadme = countsInReadme[tag];
    const countInCorpus = tagsInCorpus[tag];
    assert.equal(
      countInCorpus,
      countInReadme,
      'Tag ' + tag + ' has count ' + countInCorpus + ' in corpus but README says ' + countInReadme
    );
  }
});

test('README must state total unique tags correctly', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagsInCorpus = countTagsInCorpus();
  const totalUniqueTags = Object.keys(tagsInCorpus).length;

  // Look for "X distinct tags" in the README
  const match = readmeContent.match(/(\d+)\s+distinct tags/);
  assert(match, 'README should state the total number of distinct tags');

  const statedCount = parseInt(match[1], 10);
  assert.equal(statedCount, totalUniqueTags, 'README states ' + statedCount + ' distinct tags but corpus has ' + totalUniqueTags);
});

test('README must correctly describe single-entry tag count', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagsInCorpus = countTagsInCorpus();

  // Count single-entry tags
  let singleEntryCount = 0;
  for (const tag of Object.keys(tagsInCorpus)) {
    if (tagsInCorpus[tag] === 1) {
      singleEntryCount++;
    }
  }

  // Look for "remaining X tags" or "X tags appear exactly once"
  const match = readmeContent.match(/(\d+)\s+tags appear exactly once/);
  assert(match, 'README should state how many tags appear exactly once');

  const statedCount = parseInt(match[1], 10);
  assert.equal(statedCount, singleEntryCount, 'README states ' + statedCount + ' single-entry tags but corpus has ' + singleEntryCount);
});

test('README must list all single-entry tags', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagsInCorpus = countTagsInCorpus();

  // Find all single-entry tags
  const singleEntryTags = [];
  for (const tag of Object.keys(tagsInCorpus)) {
    if (tagsInCorpus[tag] === 1) {
      singleEntryTags.push(tag);
    }
  }
  singleEntryTags.sort();

  // Extract tags from README
  const tagsInReadme = extractTagsFromReadme(readmeContent);

  // Check each single-entry tag is mentioned
  for (const tag of singleEntryTags) {
    assert(tagsInReadme.includes(tag), 'Single-entry tag ' + tag + ' is not mentioned in README');
  }
});

// (T-033 / T-035) This is a CONTENT guard ("does the doc say a thing"), not
// an EXTRACTION guard ("find this number") like every other test in this
// file -- that is what lets it fail in two directions at once, and why it
// needed its own measurement rather than another narrowing of the anchor
// wording.
//
// T-033 measured three cells (scratch harness, not committed):
//   P1 -- honest reword of the two acknowledgement sentences (numbers
//         untouched, limitation still plainly stated, just reworded away
//         from the three old hardcoded substrings) -- pre-T-033 code: FALSE
//         REJECTION. Fires when it must not.
//   P2 -- limitation genuinely not acknowledged anywhere -- pre-T-033 code:
//         correctly fires. Must keep firing.
//   P3 -- decoy sentence ("Install with exactly one command.") inserted in
//         an unrelated section (Usage), genuine acknowledgement removed from
//         Tag vocabulary -- pre-T-033 code: SILENT SATISFACTION. Passes when
//         it must not, because a whole-document substring search cannot
//         tell "the concept, stated somewhere on-topic" from "the words,
//         stated anywhere at all".
//
// T-033's fix scoped the search to the Tag vocabulary section and widened
// three hardcoded substrings to nine phrase-level markers for the single-
// occurrence CONCEPT. That killed P3 as measured -- but only because P3's
// decoy lived OUTSIDE the section. T-035 measured a fourth cell:
//   M1 -- genuine acknowledgement sentences stripped from INSIDE the Tag
//         vocabulary section, replaced with the unrelated-but-true sentence
//         "Each tag name is exactly one word." (also inside the section) --
//         T-033 code: SILENT SATISFACTION AGAIN. "exactly one" matches
//         regardless of what it is one OF -- scoping to the section cannot
//         help when the decoy is IN the section.
//
// The T-035 fix adds two more structural requirements, checked per SENTENCE
// (split on '.'/newline, not ';' -- the real README's own acknowledgement
// sentence joins "16 tags appear on 2 or more entries" and "the remaining 21
// appear on exactly one entry" with a semicolon, which is structurally ONE
// sentence; splitting on ';' would sever "tags" from "exactly one entry" and
// break that sentence) rather than anywhere in the whole section:
//   1. the sentence must mention `tag`/`tags` -- necessary but NOT
//      sufficient on its own, since the M1 decoy ("Each tag name is...")
//      already does this; kept anyway because it costs nothing and rules
//      out markers landing in a sentence about something else entirely.
//   2. the sentence must ALSO contain `entry`/`entries` -- the one word this
//      README consistently uses for "an item in the corpus" ("2 or more
//      entries", "exactly one entry", "single-entry"). This is what M1
//      lacks ("word", not "entry") and what a decoy would need to
//      independently reproduce to slip through -- much narrower ground than
//      just reusing one of the nine marker phrases.
// A sentence must satisfy tag-word AND entry-word AND one of the nine
// marker phrases, ALL THREE in the same sentence, to count.
//
// Explicitly measured and NOT claimed to be closed by this fix (see the
// scratch harness cited above for the exact probes):
//   - Adversarial sentences that reuse "entry" in a NON-corpus sense right
//     next to the word "tag" (e.g. "The install script writes exactly one
//     entry per tag to the local cache file, once per run.") still pass
//     silently. No regex-only rule found separates "corpus entry" from
//     "cache/dictionary entry" without also rejecting the real README (the
//     real acknowledgement sentences do not say "corpus" in the same
//     sentence as "entry", so requiring that word too would break them).
//     This is a narrower, harder-to-hit hole than the one this item closes
//     (the decoy now needs its own natural-sounding use of "entry" glued to
//     "tag", not just reuse of a common quantifier), left open on the
//     record rather than patched into a new false rejection.
//   - This narrows what counts as an honest acknowledgement: an honest
//     reword that swaps "entry"/"entries" for a synonym the README does not
//     otherwise use in an entry-bearing sentence -- e.g. "16 tags occur two
//     or more times; the remaining 21 occur exactly one time." (uses
//     "exactly one", a marker, but never says "entry") -- now FAILS where
//     the T-033 code passed it. This is the same class of gap T-034
//     already tracks (the marker list is a finite enumeration); T-035 does
//     not fix T-034 and this note is that measurement, made explicit rather
//     than silently absorbed into "no regression."
//
// ===========================================================================
// FAMILY BOUNDARY (cycle 39, re-measured, deliberately NOT closed).
//
// Four residuals of this guard -- T-034, T-036, T-037, T-038 -- are recorded
// here as a documented limit rather than patched, and the reason is a
// measurement about the INSTRUMENT, not about any one of them.
//
// The T-031 block further down this file (collectMarkerBindings) wrote the
// prediction at cycle 35: "every previous narrowing bought exactly one new
// false rejection." The two narrowings that followed it both confirmed it,
// on this guard specifically:
//   - T-033 (cycle 37) scoped the search to the section and widened three
//     substrings to nine markers. Bought: the outside-decoy kill (P3).
//     Cost: renaming the section heading now fires the guard on a document
//     in which every claim is still true (cell D3 -> T-036).
//   - T-035 (cycle 38) added the same-sentence tag-word + entry-word
//     requirement. Bought: the in-section "Each tag name is exactly one
//     word." decoy (M1). Cost: an honest two-sentence split of the
//     distribution paragraph now fires (cell E3 -> T-038). And the silent
//     hole it aimed at survived in narrower form: a decoy carrying BOTH
//     domain nouns still satisfies the guard (cells D4a/D4b -> T-037).
// Three consecutive narrowings, three kills, two new false rejections, and
// the silent direction still open. That is the cost curve, and it is why a
// fourth narrowing is not being written.
//
// All six cells below were RE-MEASURED at cycle 39 against this code, each
// run in isolation via --test-name-pattern on this test's own name so that
// the neighbouring count guards can neither supply nor mask the verdict
// (they fire on several of these READMEs for their own, unrelated reasons --
// that confounder is what made the cycle-38 readings hard to interpret).
// Harness and full output: .swarm/runs/cycle-039-ackguard-probe.js and
// .swarm/runs/cycle-039-verify-ackguard.txt.
//
//   C0  baseline  pristine README                              SILENT  (correct)
//   D1  T-034     both acknowledgement sentences reworded
//                 outside the 9 markers, numbers unchanged     FIRES   (false rejection)
//   D3  T-036     "## Tag vocabulary" renamed "## Tags"        FIRES   (false rejection)
//   D4a T-037     acknowledgement stripped, in-section decoy
//                 "Tags are listed in alphabetical order,
//                  one entry per line."                        SILENT  (missed)
//   D4b T-037     acknowledgement stripped, in-section decoy
//                 "A tag name is a single-entry token with
//                  no spaces."                                 SILENT  (missed)
//   E3  T-038     honest two-sentence split of the
//                 distribution facts, numbers unchanged        FIRES   (false rejection)
//
// The SILENT pair (D4a/D4b) is the heavy half of this call and is named as
// such rather than folded in with the rest: this guard can be satisfied by a
// README that does NOT acknowledge the limitation, so long as some sentence
// in the section pairs "tag" and "entry" with one of the nine markers. That
// is a real gap being left open on the record for the second time on this
// guard. It is tracked as a known issue, not retired by this note.
//
// What this boundary does NOT say is that the guard is unfixable. The
// recorded right answer is the structural re-shape (T-024): stop deriving
// the verdict from marker phrases positioned inside an English sentence and
// read what the section structurally asserts instead. That is M-effort work
// and did not fit this run's window; it is on the backlog, not lost.
//
// If you are about to narrow this guard a fourth time: the four cells above
// are your regression set, the two FIRES cells are correct READMEs you must
// not break, and the prediction in the T-031 block is now measured twice.
// ===========================================================================
test('README should acknowledge single-entry tag limitation', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Scope to the Tag vocabulary section -- mirrors the inline slice the
  // first test in this file already does (getTagVocabSection is defined
  // later but hoisted; kept inline here too, matching that earlier test's
  // own convention, rather than reaching forward for the helper).
  const tagVocabStart = readmeContent.indexOf('## Tag vocabulary');
  assert(tagVocabStart !== -1, 'README must have a Tag vocabulary section');
  const nextSection = readmeContent.indexOf('\n## ', tagVocabStart + 1);
  const tagVocabEnd = nextSection > -1 ? nextSection : readmeContent.length;
  const tagVocabSection = readmeContent.substring(tagVocabStart, tagVocabEnd);

  const singleEntryMarkers = [
    /\bexactly once\b/i,
    /\bexactly one\b/i,
    /\bonly once\b/i,
    /\bjust once\b/i,
    /\bonly one\b/i,
    /\bsingle-entry\b/i,
    /\bone entry\b/i,
    /\bappears? once\b/i,
    /\boccurs? once\b/i,
  ];
  // Domain words the claim must ALSO carry, in the SAME sentence as the
  // marker, so a marker phrase landing in a sentence about something other
  // than "how many corpus entries each tag has" cannot satisfy this test on
  // its own (see the comment block above -- this is what T-035 adds).
  const tagWord = /\btags?\b/i;
  const entryWord = /\bentr(?:y|ies)\b/i;

  const sentences = tagVocabSection.split(/[.\n]/);
  const hasWarning = sentences.some((sentence) => {
    if (!tagWord.test(sentence)) return false;
    if (!entryWord.test(sentence)) return false;
    return singleEntryMarkers.some((marker) => marker.test(sentence));
  });

  assert(hasWarning, 'README Tag vocabulary section should acknowledge that some tags appear only once');
});

// ---------------------------------------------------------------------------
// Bidirectional, band-aware guard on the Tag vocabulary count tables.
//
// The tests above already check that every *stated* claim (a count that
// appears somewhere in the README) matches the corpus. What they cannot
// catch is a whole row going missing (the README simply stops claiming
// something the corpus still has), or a row surviving but landing under
// the wrong band heading (its count no longer satisfies the range that
// heading states). Both are silent under a "does every stated fact match"
// check, because deleting or relocating a row does not make any remaining
// stated fact false on its own.
//
// The fix compares, per band table, the SET of tags the corpus says belong
// in that band against the SET of tags actually present as rows in that
// table -- not just their counts. A deleted row shrinks the actual set.
// A relocated row moves a tag into a table whose expected set (derived
// from the corpus, independently of the table) does not contain it.
//
// Band boundaries are parsed from the NUMBERS in each heading line only
// (an "N+" token, or an "N<dash>M" token), never from the surrounding
// English, so rewording "robust pool" to "deep pool" or "appear" to
// "occur" cannot silence this guard -- only changing the digits can.
// ---------------------------------------------------------------------------

// Helper: return the Tag vocabulary section's raw text (heading through the
// line before the next top-level "## " heading). Shared by the tests below;
// mirrors the slicing already done inline in the first test in this file.
function getTagVocabSection(readmeContent) {
  const tagVocabStart = readmeContent.indexOf('## Tag vocabulary');
  assert(tagVocabStart !== -1, 'README must have a Tag vocabulary section');
  const nextSection = readmeContent.indexOf('\n## ', tagVocabStart + 1);
  const tagVocabEnd = nextSection > -1 ? nextSection : readmeContent.length;
  return readmeContent.substring(tagVocabStart, tagVocabEnd);
}

// Helper: is `line` itself a real band heading? Used below both to decide
// which lines the heading-to-table scan even treats as a heading, and to
// tell an ordinary prose sentence apart from what is plausibly ANOTHER band
// heading, so the scan knows where it must stop rather than reading through
// it.
//
// ---------------------------------------------------------------------------
// T-026 / T-039 / T-024b — HISTORY AND RESOLUTION (J-2b, this run).
//
// This used to be answered by lineHasBandToken(line): does the line carry a
// parseable "N+" or "N<dash>M" digit shape? That made ANY digit-shaped line
// a heading candidate, prose included, and two items measured the fallout:
//
// T-026 asked whether a band heading separated from its table by prose that
// carries a coincidental band-shaped token -- "Requires Node 18+ to run." --
// silently loses coverage. MEASURED: no, it is LOUD (T-019 still fires on a
// deleted row even with the prose line present --
// .swarm/runs/cycle-040-prose-anchor-probe.js). But the same measurement
// found the stop rule does not PREVENT mis-attachment, it RELOCATES it
// (.swarm/runs/cycle-040-band-dump.js): the prose line is itself a heading
// candidate on the next loop iteration, matches its own "18+" token, and is
// handed the very table the real heading was just stopped from reaching --
// filed separately as T-039 so the relocation itself had a place to be
// tracked once T-026 closed as a boundary on the narrower question it asked.
//
// Both items named the same recorded right answer: derive heading-ness from
// document STRUCTURE (a heading recognised AS a heading) rather than from a
// digit shape in a line. That is what this helper now does. README.md's
// band lead-ins are real `#### ` markdown headings ("#### Robust pool (5+
// entries)", "#### Appears 3–4 times") that no longer carry a leading "N
// tags" prose count at all (see the T-024b resolution further down this
// file for why dropping that count costs no coverage). A line's own digits,
// however band-shaped, no longer make it a heading candidate -- only the
// `#### ` marker does. Re-measured directly against this fix in the "T-039"
// test below: the cycle-40 scenario (heading, "Requires Node 18+ to run.",
// then the real table) now finds exactly the real band, never a phantom one
// headed by the prose line.
// ---------------------------------------------------------------------------
function isBandHeadingLine(line) {
  return /^####\s+\S/.test(line);
}

// Helper: find every "heading line eventually followed by a `| Tag | Count |`
// table" in the given text, and for each one derive its band's [min, max]
// bounds purely from digits/punctuation in that heading line -- never from
// the words around them -- plus the set of {tag, count} rows actually
// present in that specific table (as opposed to the whole document, so two
// tables' rows are never conflated).
//
// Recognised band shapes in a heading line:
//   - an "N+" token (e.g. "(5+ entries)")   -> band is [N, Infinity)
//   - an "N<dash>M" token (e.g. "2-4 times", "2–4 times") -> band is [N, M]
// Any dash character (hyphen, en dash, em dash) is accepted so a stylistic
// dash swap does not break parsing.
function extractBandTablesFromReadme(sectionText) {
  // Strip fenced code blocks before scanning at all (T-024b/T-039 sibling
  // defect, measured live: a fenced illustrative example inside the Tag
  // vocabulary section -- e.g. "the old format, for reference:" followed by
  // a ``` block containing what LOOKS like a `#### ` heading and a
  // `| Tag | Count |` table -- was read as a second, real band by this
  // function before this line existed, because nothing scoped the scan away
  // from fenced content. A fence is an example, not a claim: mirrors the
  // fence-stripping the tag-name census already does for backtick-quoted
  // tags earlier in this file (extractTagsFromReadme's caller). Done once,
  // here, rather than at each of this function's call sites, so no future
  // caller can reintroduce the hole by forgetting to strip first.
  const strippedText = sectionText.replace(/```[\s\S]*?```/g, '');
  const lines = strippedText.split('\n');
  const tableRowPattern = /\| `([a-z]+)` \| (\d+) \|/;
  const headerRowPattern = /^\|\s*Tag\s*\|\s*Count\s*\|\s*$/;
  const bands = [];

  for (let i = 0; i < lines.length; i++) {
    const headingLine = lines[i];

    // Only a real heading (isBandHeadingLine, i.e. a `#### ` line -- T-039)
    // is even considered as a candidate. An ordinary prose line, however
    // band-shaped its own digits look, is skipped outright and can never be
    // mistaken for a heading -- this is what makes the mis-attachment/
    // relocation hazard measured for T-026/T-039 (see the comment above
    // isBandHeadingLine) structurally unreachable rather than merely
    // stopped-at-and-relocated.
    if (!isBandHeadingLine(headingLine)) {
      continue;
    }

    // Between the heading and its table's `| Tag | Count |` header row,
    // tolerate any number of blank lines AND any number of ordinary prose
    // lines (e.g. "See the table below.") -- idiomatic markdown may put a
    // lead-in sentence there (T-025). What the scan will NOT read through is
    // another real heading (isBandHeadingLine again): that is the one shape
    // a real heading-to-table gap is never expected to contain, and it is
    // also the shape of the exact hazard this scan must not walk past --
    // one heading's search reaching down into a DIFFERENT heading's table.
    // Hitting such a line aborts the search for THIS heading outright (no
    // table found), rather than reading past it looking for one further
    // down. This bounds the "widening" to prose only: a heading with no
    // table of its own (prose, then another real band heading, then that
    // other heading's table) still never has a foreign table grafted onto
    // it here.
    //
    // This is deliberately not the only thing standing between a widened
    // scan and a mis-attached table: even if the search below did latch
    // onto the wrong table, the two callers of this function (the
    // "contains exactly the corpus tags" test and the T-019 wholesale-
    // deletion test) independently recompute each band's expected tag SET
    // from the corpus using this band's own [min, max] and assert it is
    // EXACTLY (not just approximately) the table's actual row set. A
    // mis-attached table's rows are corpus-derived from a *different*
    // heading's range, so they are exceedingly unlikely to exactly equal
    // this heading's own expected set -- a coincidence, not a design this
    // scan relies on, but a second line of defence measured to hold in
    // every mis-attachment shape tried while sizing this change (see the
    // T-025 test below).
    let headerIdx = -1;
    for (let idx = i + 1; idx < lines.length; idx++) {
      const trimmed = lines[idx].trim();
      if (trimmed === '') continue;
      if (headerRowPattern.test(trimmed)) {
        headerIdx = idx;
        break;
      }
      if (isBandHeadingLine(lines[idx])) {
        break; // another real heading -- stop, no table for this one
      }
      // else: ordinary prose line, keep scanning forward
    }
    if (headerIdx === -1) {
      continue;
    }
    const headerRowLine = lines[headerIdx];
    // The separator row must immediately follow the header row -- that is
    // standard markdown table syntax (a blank line there would stop it from
    // rendering as a table at all), so only heading-to-header spacing is
    // being relaxed here, not header-to-separator.
    const separatorRowLine = lines[headerIdx + 1];

    if (!headerRowLine || !headerRowPattern.test(headerRowLine.trim())) {
      continue;
    }
    if (!separatorRowLine || !/^\|[-\s|]+\|$/.test(separatorRowLine.trim())) {
      continue;
    }

    // Derive the band's numeric bounds from the heading line's digits only.
    const openEnded = headingLine.match(/(\d+)\s*\+/);
    const rangePair = headingLine.match(/(\d+)\s*[-‐‑‒–—―]\s*(\d+)/);

    let min, max;
    if (openEnded) {
      min = parseInt(openEnded[1], 10);
      max = Infinity;
    } else if (rangePair) {
      min = parseInt(rangePair[1], 10);
      max = parseInt(rangePair[2], 10);
    } else {
      // A table with no parseable band token in its heading -- nothing to
      // check it against, skip rather than guess.
      continue;
    }

    // Collect this table's own rows (starting right after the separator
    // row) until a line that is not itself a table row. The number of rows
    // found here IS the band's count (T-024b) -- there is no separate "N
    // tags" prose figure to parse or reconcile against it any more.
    const rows = {};
    let k = headerIdx + 2;
    while (k < lines.length) {
      const rowMatch = lines[k].match(tableRowPattern);
      if (!rowMatch) break;
      rows[rowMatch[1]] = parseInt(rowMatch[2], 10);
      k++;
    }

    bands.push({ headingLine, min, max, rows });
  }

  return bands;
}

// ---------------------------------------------------------------------------
// Guard the heading-to-table scan itself against the T-025 layout: a band
// heading separated from its `| Tag | Count |` table by an ordinary prose
// sentence (e.g. "See the table below."), rather than by blank lines only.
//
// This exercises extractBandTablesFromReadme directly, on hand-built section
// text, rather than through the real README -- the point is to pin down the
// extractor's own behaviour at this specific layout shape, independent of
// whatever the README happens to say today.
// ---------------------------------------------------------------------------

test('extractBandTablesFromReadme tolerates a prose sentence between a band heading and its table (T-025), without mis-attaching a table when the real one is missing', () => {
  // T-025's exact layout: heading / blank / ordinary sentence / blank / the
  // real `| Tag | Count |` table. Every number here is correct (matches the
  // real corpus), so this must be found as a normal, complete band.
  const correctLayout = [
    '#### Robust pool (5+ entries)',
    '',
    'See the table below.',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
    '| `debugging` | 5 |',
  ].join('\n');

  const bandsCorrect = extractBandTablesFromReadme(correctLayout);
  assert.equal(
    bandsCorrect.length,
    1,
    'a band heading separated from its table by an ordinary sentence must still be recognised as having that table'
  );
  assert.deepEqual(
    Object.keys(bandsCorrect[0].rows).sort(),
    ['debugging', 'design', 'humor', 'simplicity'],
    'the table found for the T-025 layout must be the heading\'s own table, with all of its rows'
  );

  // Same layout, but with a row (`debugging`) deleted from the table. The
  // extractor must still see the table (so the caller tests can compare its
  // rows against the corpus) -- and it must see the DEFECT, not silently
  // backfill or hide the missing row.
  const rowDeletedLayout = [
    '#### Robust pool (5+ entries)',
    '',
    'See the table below.',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
  ].join('\n');

  const bandsRowDeleted = extractBandTablesFromReadme(rowDeletedLayout);
  assert.equal(bandsRowDeleted.length, 1, 'the table must still be found even with a row missing from it');
  assert(
    !('debugging' in bandsRowDeleted[0].rows),
    'a row deleted under the T-025 layout must be visibly absent from the extracted rows, not silently present'
  );

  // Mis-attachment probe: the heading's OWN table is missing entirely (only
  // prose sits where it should be), and a DIFFERENT band's real heading and
  // table follow. Tolerating prose between a heading and its table must not
  // let the first heading reach past the second heading and steal ITS
  // table -- that is exactly the "widen the scan" hazard T-025 was filed to
  // measure.
  const misattachLayout = [
    '#### Robust pool (5+ entries)',
    '',
    'The table for this band was removed by mistake.',
    '',
    '#### Appears 2-4 times',
    '| Tag | Count |',
    '|---|---|',
    '| `performance` | 4 |',
    '| `language` | 3 |',
  ].join('\n');

  const bandsMisattach = extractBandTablesFromReadme(misattachLayout);
  assert.equal(
    bandsMisattach.length,
    1,
    'a heading whose own table is missing must not mis-attach a different band\'s table -- only the ' +
      'second heading\'s genuine band should be found'
  );
  assert.equal(bandsMisattach[0].min, 2, 'the one band found must be the second heading\'s own 2-4 band, not the first heading\'s 5+ band');
});

// ---------------------------------------------------------------------------
// T-039 — re-measure the exact cycle-40 relocation scenario against the
// isBandHeadingLine fix, directly (hand-built section text, same style as
// the T-025 test above). Pre-fix, this heading-detection function was
// lineHasBandToken(line) -- true for ANY line carrying an "N+"/"N-M" digit
// shape, prose included. "Requires Node 18+ to run." satisfied it, so on
// the loop iteration that reached that prose line, it was itself treated as
// a heading candidate, matched its own "18+" token, and successfully found
// the REAL heading's table below it -- producing a phantom band [18, inf)
// that owned the real band's rows while the real [5, inf) band vanished
// from the returned array entirely (see .swarm/runs/cycle-040-band-dump.js
// for the original measurement). This test fails against that exact old
// behaviour (a reverted isBandHeadingLine back to a lineHasBandToken-style
// digit-shape test reproduces both assertions failing) and passes against
// the fix, so it is the mutation-survivor proof for T-039 required by this
// item's acceptance.
// ---------------------------------------------------------------------------

test('extractBandTablesFromReadme does not let a band-shaped PROSE line steal a real heading\'s table (T-039)', () => {
  const layout = [
    '#### Robust pool (5+ entries)',
    '',
    'Requires Node 18+ to run.',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
    '| `debugging` | 5 |',
  ].join('\n');

  const bands = extractBandTablesFromReadme(layout);
  assert.equal(
    bands.length,
    1,
    'exactly one band must be found: the real heading\'s own -- not a phantom band headed by the prose line'
  );
  assert.equal(
    bands[0].min,
    5,
    'the band must be the real [5, inf) band, not a phantom [18, inf) band read off "Requires Node 18+ to run."'
  );
  assert.equal(bands[0].max, Infinity);
  assert(
    bands[0].headingLine.trim().startsWith('#### Robust pool'),
    'the band must be attached to the real "#### " heading, not to the prose line: got "' +
      bands[0].headingLine.trim() + '"'
  );
  assert.deepEqual(
    Object.keys(bands[0].rows).sort(),
    ['debugging', 'design', 'humor', 'simplicity'],
    'the real heading must own all four of its table\'s rows -- none of them may be stranded under a phantom heading'
  );
});

test('extractBandTablesFromReadme does not read a fenced example block as a second, real band table', () => {
  // MEASURED live while closing J-2b: before extractBandTablesFromReadme
  // stripped fenced code blocks, a fenced illustrative example inside the
  // Tag vocabulary section -- e.g. an "old format, kept here as an
  // example:" aside showing what a `#### ` heading and `| Tag | Count |`
  // table used to look like -- was read as a second, genuine band. Its
  // fabricated row (`design` with a wrong count) would then be checked
  // against the real corpus by the set-equality guard below as if it were
  // a real README claim, and a maintainer swapping in an out-of-band tag
  // for the fenced example (entirely reasonable, since it is explicitly
  // marked as illustrative) would false-reject an otherwise correct
  // README. A fence is an example, not a claim.
  const layout = [
    '#### Robust pool (5+ entries)',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
    '| `debugging` | 5 |',
    '',
    'Old format, kept here as an example:',
    '',
    '```',
    '#### Robust pool (5+ entries)',
    '| Tag | Count |',
    '|---|---|',
    '| `philosophy` | 999 |',
    '```',
  ].join('\n');

  const bands = extractBandTablesFromReadme(layout);
  assert.equal(
    bands.length,
    1,
    'a fenced illustrative example must not be read as a second band table -- only the one real band should be found'
  );
  assert.deepEqual(
    Object.keys(bands[0].rows).sort(),
    ['debugging', 'design', 'humor', 'simplicity'],
    'the real band\'s rows must not be joined by a row fabricated from inside a fenced example'
  );
});

// ---------------------------------------------------------------------------
// SILENT HOLE, measured live while closing J-2b (sibling of T-024b/T-039,
// same code, not filed as a separate backlog item because it was found and
// closed within this item's own gate rather than inherited from a prior
// cycle). extractBandTablesFromReadme only ever looks for a table BELOW a
// line it recognises as a heading (isBandHeadingLine, i.e. `#### `). A
// `| Tag | Count |` table placed under any OTHER heading shape -- a `### `
// heading, a bold lead-in, or no heading at all -- is not rejected and does
// not abort anything; it is simply never looked at. MEASURED: a table
// placed under "### Additional tags" claiming `philosophy` belongs to the
// 5+-entries band (real corpus count: 3) passed the full suite silently,
// because extractBandTablesFromReadme's returned array never contained it --
// nothing downstream (the set-equality guard, the T-019 wholesale-deletion
// guard) ever iterates a band it was never handed.
//
// The fix is a second, independent structural scan that finds every
// `| Tag | Count |` table in the section by its header-plus-separator shape
// ALONE, with no heading requirement at all, and asserts its count matches
// the number of bands extractBandTablesFromReadme actually recognised. A
// mismatch means some table in this shape exists under a heading (or lack
// of one) this file's band detection does not recognise -- named loudly,
// with its preceding line for a maintainer to act on, rather than silently
// dropped. This is the same shape of fix as the Attribution section's
// "unrecognised row label" guard (RECOGNISED_ATTRIBUTION_COUNT_LABELS)
// further down this file: a narrow, argued house rule that this ONE section
// contains nothing in this exact table shape except a recognised band.
// ---------------------------------------------------------------------------

// Helper: every `| Tag | Count |` table in the given (already
// fence-stripped) lines, located purely by its header row plus the
// `|---|---|` separator row immediately below it -- no heading of any kind
// required. `precedingLine` (the nearest non-blank line above the header)
// is carried only for a useful failure message, never used to decide
// whether a table counts.
function findAllTagCountTableHeaders(strippedLines) {
  const headerRowPattern = /^\|\s*Tag\s*\|\s*Count\s*\|\s*$/;
  const headers = [];
  for (let idx = 0; idx < strippedLines.length; idx++) {
    if (!headerRowPattern.test(strippedLines[idx].trim())) continue;
    const separatorLine = strippedLines[idx + 1];
    if (!separatorLine || !/^\|[-\s|]+\|$/.test(separatorLine.trim())) continue;
    let precedingIdx = idx - 1;
    while (precedingIdx >= 0 && strippedLines[precedingIdx].trim() === '') precedingIdx--;
    const precedingLine = precedingIdx >= 0 ? strippedLines[precedingIdx].trim() : '(start of section)';
    headers.push({ headerIdx: idx, precedingLine });
  }
  return headers;
}

test('extractBandTablesFromReadme\'s recognised bands account for every structural `| Tag | Count |` table -- a table under an unrecognised heading shape is a loud mismatch, not a silent miss', () => {
  // Adversarial fixture: the real band, plus a second, genuine
  // `| Tag | Count |` table sitting under a "### " heading (not "#### ") --
  // a heading shape extractBandTablesFromReadme does not recognise. Its
  // claim is false (philosophy's real corpus count is 3, not a 5+-band
  // fit), which is exactly the point: nothing about this table's SHAPE
  // marks it as bogus, only its content does, and content is precisely what
  // the silent hole never reaches.
  const orphanedLayout = [
    '#### Robust pool (5+ entries)',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
    '| `debugging` | 5 |',
    '',
    '### Additional tags',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `philosophy` | 3 |',
  ].join('\n');

  const strippedLines = orphanedLayout.replace(/```[\s\S]*?```/g, '').split('\n');
  const allTables = findAllTagCountTableHeaders(strippedLines);
  const bands = extractBandTablesFromReadme(orphanedLayout);

  assert.equal(allTables.length, 2, 'the fixture structurally contains two "| Tag | Count |" tables');
  assert.equal(bands.length, 1, 'only one of the two is recognised as a band -- the "### Additional tags" table is the silent hole this guard exists to name');
  assert.notEqual(
    allTables.length,
    bands.length,
    'the mismatch itself is the signal a real guard must act on -- see the next test for the real-README assertion'
  );

  // Control: the same layout with the second table removed entirely must
  // NOT trip a mismatch -- this guard fires on an unrecognised table, not
  // on having exactly one band.
  const cleanLayout = [
    '#### Robust pool (5+ entries)',
    '',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
    '| `debugging` | 5 |',
  ].join('\n');
  const cleanStrippedLines = cleanLayout.replace(/```[\s\S]*?```/g, '').split('\n');
  assert.equal(findAllTagCountTableHeaders(cleanStrippedLines).length, extractBandTablesFromReadme(cleanLayout).length);
});

test('every `| Tag | Count |` table in the real README Tag vocabulary section is a recognised band table (no table may hide under an unrecognised heading shape)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagVocabSection = getTagVocabSection(readmeContent);

  const strippedLines = tagVocabSection.replace(/```[\s\S]*?```/g, '').split('\n');
  const allTables = findAllTagCountTableHeaders(strippedLines);
  const bands = extractBandTablesFromReadme(tagVocabSection);

  assert.equal(
    allTables.length,
    bands.length,
    'found ' + allTables.length + ' "| Tag | Count |" table(s) structurally in the Tag vocabulary section but only ' +
      bands.length + ' were recognised as band tables. A table is sitting under a heading shape (or no heading at ' +
      'all) that this file\'s band detection does not recognise, so it is being checked by nothing. Preceding ' +
      'lines: ' + allTables.map((t) => JSON.stringify(t.precedingLine)).join(', ') +
      '. Move it under its own `#### ` band heading with a parseable bound token ("N+" or "N-M").'
  );
});

test('every band table in README Tag vocabulary contains exactly the corpus tags whose count fits that band', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagVocabSection = getTagVocabSection(readmeContent);
  const tagsInCorpus = countTagsInCorpus();

  const bands = extractBandTablesFromReadme(tagVocabSection);
  assert(bands.length > 0, 'expected at least one parseable band table (heading with an N+ or N-M token, followed by a | Tag | Count | table) in the Tag vocabulary section');

  for (const band of bands) {
    // What the corpus says should be in this band, independent of the
    // table's own content: every tag whose corpus count falls in [min, max].
    const expectedTags = Object.keys(tagsInCorpus)
      .filter(tag => tagsInCorpus[tag] >= band.min && tagsInCorpus[tag] <= band.max)
      .sort();
    const actualTags = Object.keys(band.rows).sort();

    // Assertion 1 (kills row deletion, A7): nothing the corpus places in
    // this band may be missing from the table's actual rows.
    for (const tag of expectedTags) {
      assert(
        actualTags.includes(tag),
        'Tag `' + tag + '` (corpus count ' + tagsInCorpus[tag] + ') belongs in the band "' +
          band.headingLine.trim() + '" (' + band.min + '-' + (band.max === Infinity ? 'inf' : band.max) +
          ') but is missing a row in that table'
      );
    }

    // Assertion 2 (kills band relocation, A8): nothing present in this
    // table's actual rows may be a tag whose corpus count is outside the
    // band's own stated numeric range -- this also catches a row whose
    // count was edited without moving it, since expectedTags is computed
    // from the corpus's real count for that tag, not the table's claim.
    for (const tag of actualTags) {
      assert(
        expectedTags.includes(tag),
        'Tag `' + tag + '` has a row in the band "' + band.headingLine.trim() + '" (' +
          band.min + '-' + (band.max === Infinity ? 'inf' : band.max) +
          ') but its actual corpus count is ' + tagsInCorpus[tag] + ', which does not fit that band'
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Guard against an entire band table -- heading AND all its rows -- being
// deleted wholesale from the Tag vocabulary section (T-019).
//
// The "every band table ... contains exactly the corpus tags whose count
// fits that band" test above is blind to this: it iterates `bands`, the set
// of band tables extractBandTablesFromReadme actually FOUND. If a whole
// band table disappears, it is simply never in that array, so nothing in
// that test ever looks at the tags that used to live there -- every
// remaining stated fact in the README is still true, so the check stays
// green while the README goes silently quiet about an entire cohort of
// tags. Only a total wipeout (zero band tables left) is caught, by the
// pre-existing `bands.length > 0` sanity assertion in each of the two tests
// above; one-of-several-tables vanishing is not.
//
// The fix does not hardcode "there must be a 5+ band and a 2-4 band" --
// that would fire on a CORRECT README after a corpus retagging (T-007 is
// live on the backlog and would change the band boundaries and possibly
// the number of bands entirely), which is exactly the kind of false
// rejection a maintainer resolves by deleting the guard. Instead this
// checks a corpus-derived invariant that holds regardless of how many band
// tables exist or where their boundaries fall: every corpus tag that
// appears on 2 or more entries must be a row in the UNION of whatever band
// tables are actually present. Deleting one whole band table shrinks that
// union and strands its tags with no table claiming them, which this test
// names individually.
// ---------------------------------------------------------------------------

test('every corpus tag appearing on 2+ entries must have a row in some band table (no band table may be deleted wholesale) (T-019)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagVocabSection = getTagVocabSection(readmeContent);
  const tagsInCorpus = countTagsInCorpus();

  const bands = extractBandTablesFromReadme(tagVocabSection);

  // Union of every row actually present across ALL band tables found in the
  // section -- not scoped to any single band, so a tag is credited as
  // "covered" regardless of which table (if any) it currently lives in.
  const actualTagsUnion = new Set();
  for (const band of bands) {
    for (const tag of Object.keys(band.rows)) {
      actualTagsUnion.add(tag);
    }
  }

  // Expected set derived purely from the corpus: every tag with 2 or more
  // entries is supposed to be claimed by SOME band table somewhere in the
  // section. "2" is not a band boundary borrowed from today's README -- it
  // is the corpus-wide split between "appears more than once" and
  // "appears exactly once" that the section's own opening sentence and the
  // single-entry-tag tests elsewhere in this file already establish.
  const expectedMultiEntryTags = Object.keys(tagsInCorpus)
    .filter(tag => tagsInCorpus[tag] >= 2)
    .sort();

  for (const tag of expectedMultiEntryTags) {
    assert(
      actualTagsUnion.has(tag),
      'Tag `' + tag + '` (corpus count ' + tagsInCorpus[tag] + ') appears on 2+ entries in the corpus but has ' +
        'no row in ANY band table in the Tag vocabulary section -- an entire band table may have been deleted'
    );
  }
});

// ---------------------------------------------------------------------------
// T-024b — CLOSED via structural re-shape (J-2b), not a further narrowing.
//
// This file used to carry a test here ("README band table headings must
// state the correct count of tags in their band") that scanned each band
// heading line for a "<digits> tags" phrase -- the README used to write
// "7 tags have a robust pool (5+ entries):" and "5 tags appear 3–4 times:"
// -- and compared it to a corpus-derived expectation. T-023 MEASURED that
// scan's false rejection: a heading whose lead-in carries a SECOND, true
// "N tags" phrase before its own count -- e.g. "Of 37 tags, 4 tags carry
// 5+ entries each:" -- reads 37, not 4, no matter how the "first match
// that doesn't overlap the bounds token" rule is refined, because both
// numbers are genuinely "<digits> tags" phrases in the same line and
// nothing about their shape distinguishes which one the heading MEANS.
//
// The cycle-39 family decision was against a further (fourth-plus)
// narrowing of any guard in this prose-anchored family, and the J-2a half
// of this run's item closed its sibling defect (the Attribution counts) by
// deleting the prose reader and moving the claim into a table rather than
// parsing it better. The same move applies here, in the form this
// heading's numbers actually need: README.md's band headings no longer
// state an "N tags" figure in prose at all. "#### Robust pool (5+
// entries)" and "#### Appears 3–4 times" carry only the band's bound
// token, never a count -- see extractBandTablesFromReadme above, where the
// band's row count is now read directly off the table (`rows`), with no
// heading-text count to parse, reconcile, or be fooled by a decoy digit
// run in.
//
// WHY THIS DROPS NO COVERAGE. The mutation the deleted test used to catch
// was "a band heading states a WRONG 'N tags' figure while its table's rows
// stay correct". That mutation is no longer expressible: there is no
// prose figure left in the document to make wrong, the same way C7's
// "no digit runs outside the counts table" rule (see the Attribution
// section further down this file) makes a stray Attribution-section number
// inexpressible rather than merely unchecked. The mutation that remains
// reachable -- "the table's rows do not actually match what the corpus
// says belongs in this band" (a row deleted, added, or relocated) -- is
// still caught, and MORE strongly than the deleted count-comparison ever
// was: the "every band table ... contains exactly the corpus tags whose
// count fits that band" test just above this comment compares the full SET
// of expected vs. actual tags per band, which implies the row count is
// correct (two exactly-equal finite sets have equal cardinality) without
// the reverse implication holding (a correct count does not imply a
// correct set -- e.g. one wrong tag swapped for another of the same count
// would pass a count-only check and fail the set check). The unit test
// below proves the new design directly, independent of whatever README.md
// says today: a decoy "N tags" phrase in the heading cannot change the
// derived band or its row count, and a genuinely wrong table (a row
// missing) is still visible as a wrong row count, not silently papered
// over by the decoy text.
// ---------------------------------------------------------------------------

test('extractBandTablesFromReadme derives a band\'s row count purely from its table, ignoring decoy "N tags" phrases in the heading line (T-024b)', () => {
  // T-023's measured false-rejection case, reproduced directly: a heading
  // whose lead-in states a second, true "N tags" phrase (37, the old
  // total-vocabulary figure) before its own band's actual count (4). The
  // deleted prose-count reader read 37 off this exact line. This heading is
  // no longer scanned for a count at all -- prove decoy digits anywhere in
  // the heading text cannot change which band this table belongs to or how
  // many rows it has.
  const decoyHeadingLayout = [
    '#### Of 37 tags, 4 tags carry 5+ entries each',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
    '| `debugging` | 5 |',
  ].join('\n');

  const bands = extractBandTablesFromReadme(decoyHeadingLayout);
  assert.equal(bands.length, 1, 'a decoy "N tags" phrase in the heading must not stop the real table from being found');
  assert.equal(bands[0].min, 5, 'the band bounds must come from the 5+ token, not either decoy digit (37 or 4)');
  assert.equal(bands[0].max, Infinity);
  assert.equal(
    Object.keys(bands[0].rows).length,
    4,
    'the band\'s count is the table\'s own row count (4), regardless of what the heading prose claims'
  );

  // Same decoy heading, but the table itself is short a row. Proves the
  // "wrong band count under this heading" direction still fails -- via a
  // comparison of the table's actual rows, not a parsed prose digit -- so
  // deleting the old count-comparison test did not create a blind spot.
  const decoyHeadingRowDeleted = [
    '#### Of 37 tags, 4 tags carry 5+ entries each',
    '| Tag | Count |',
    '|---|---|',
    '| `design` | 13 |',
    '| `simplicity` | 10 |',
    '| `humor` | 9 |',
  ].join('\n');

  const bandsShort = extractBandTablesFromReadme(decoyHeadingRowDeleted);
  assert.equal(bandsShort.length, 1);
  assert.equal(
    Object.keys(bandsShort[0].rows).length,
    3,
    'a row missing from the table must be visible as a row-count of 3, not silently backfilled to whatever the decoy heading prose implies'
  );
  assert.notEqual(
    Object.keys(bandsShort[0].rows).length,
    4,
    'the extracted count must diverge from the decoy heading\'s own "4 tags" phrase when the table disagrees with it -- proving the extraction reads the table, not the prose'
  );
});

test('README opening sentence must state correct multi-entry and single-entry tag counts', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagVocabSection = getTagVocabSection(readmeContent);
  const tagsInCorpus = countTagsInCorpus();

  // "<N> tags ... or more <...>" -- the count of tags appearing on 2+
  // entries. Keyed to "or more" (the mathematical content of the claim,
  // i.e. an inclusive lower bound), not to any of the words around it, and
  // scoped to a single clause (no '.', ';' or newline crossed) so it cannot
  // accidentally span into an unrelated sentence or table heading.
  const multiEntryMatch = tagVocabSection.match(/(\d+)\s+tags?\b[^.;\n]*\bor more\b/i);
  assert(
    multiEntryMatch,
    'could not find a "<N> tags ... or more" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const statedMultiEntryCount = parseInt(multiEntryMatch[1], 10);
  const expectedMultiEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] >= 2).length;
  assert.equal(
    statedMultiEntryCount,
    expectedMultiEntryCount,
    'README states ' + statedMultiEntryCount + ' tags appear on 2 or more entries, but the corpus has ' +
      expectedMultiEntryCount
  );

  // "<N> ... exactly one <...>" -- the count of tags appearing on exactly
  // one entry, as stated in the section's OPENING sentence. Deliberately
  // distinct from (and must independently agree with) the later "<N> tags
  // appear exactly once" claim guarded elsewhere in this file: "exactly
  // one" here does not match "exactly once" there, so the two claims are
  // checked against the corpus separately and cannot silently drift from
  // each other.
  const singleEntryMatch = tagVocabSection.match(/(\d+)\b[^.;\n]*\bexactly one\b/i);
  assert(
    singleEntryMatch,
    'could not find a "<N> ... exactly one" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const statedSingleEntryCount = parseInt(singleEntryMatch[1], 10);
  const expectedSingleEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] === 1).length;
  assert.equal(
    statedSingleEntryCount,
    expectedSingleEntryCount,
    'README states ' + statedSingleEntryCount + ' tags appear on exactly one entry, but the corpus has ' +
      expectedSingleEntryCount
  );
});

// ---------------------------------------------------------------------------
// J-5 — an unrecognised tag-count claim can sit unread in this section.
//
// MEASURED (this item): every guard above reads a *specific* claim shape --
// "<N> distinct tags", "<N> tags ... or more", "<N> ... exactly one/once",
// a `| Tag | Count |` table row, a `#### ` band heading's own "N+"/"N-M"
// token. None of them read the section as a whole, so a NEW sentence making
// an unrelated tag-count claim is checked by nothing. Reproduced live: a
// paragraph reading "9 tags sit in the robust-pool band." (real count: 7
// rows in that table) inserted after "#### Robust pool (5+ entries)" left
// `node --test test/*.test.js` at 101 pass / 0 fail, unchanged. Confirmed
// pre-existing on the untouched suite before this test was added (see the
// PROOF note below for the exact command).
//
// WHY NOT C7's blanket "no digit runs outside the table" rule (the guard
// this mirrors, over in the Attribution section). Measured directly: this
// section's own opening and closing sentences carry LEGITIMATE prose counts
// -- "12 distinct tags", "12 tags appear on 2 or more entries", "0 tags
// appear exactly once" -- and three guards above already derive and check
// each of them against the corpus at test time. A blanket ban would reject
// today's real, entirely correct README (proof below), which is exactly the
// failure mode this whole guard family exists to avoid. Unlike the
// Attribution section (which had no legitimate prose counts to protect and
// so could move everything into a table, see the C7 comment block further
// down this file), moving these counts out of prose would be a README
// content change, out of scope for a test-file-only item.
//
// THE FIX: the same invariant C7 enforces, with an ALLOWLIST instead of a
// blanket ban. A digit run in this section's prose is either part of one of
// three RECOGNISED claim shapes -- each one the exact phrase pattern an
// existing guard above already derives and verifies against the corpus, not
// a new pattern invented for this test -- or it is a loud, named failure.
// `| Tag | Count |` table rows and a real `#### ` heading's own "N+"/"N-M"
// boundary token are excluded structurally (both are independently verified
// by extractBandTablesFromReadme and its callers above), not by pattern
// allowlist, so this guard cannot be satisfied by widening the allowlist to
// swallow a table or heading defect some OTHER guard exists to catch.
//
// CLAUSE SPLITTING, MEASURED NECESSARY. An early version of this guard
// matched each recognised pattern once against the whole section with a
// greedy `[^.;\n]*` (the same style the "or more" / "exactly one" guards
// above use, scoped to a full sentence). MEASURED FAILURE: the real
// closing half of the opening sentence is one long comma-joined clause with
// no period until its end ("... 0 tags appear exactly once, which is to say
// 0 tags sit on exactly one entry, so `--tag` never ..."). A decoy inserted
// mid-sentence with a comma on each side -- "0 tags appear exactly once,
// and secretly 9 tags matter here, which is to say 0 tags sit on exactly
// one entry" -- was SILENTLY SWALLOWED: the greedy match for the *second*
// "exactly one" reached backward across the decoy clause, past the comma,
// and covered the "9" along with it. Splitting the prose into clauses on
// '.', ',', ';' and newline BEFORE matching closes this: each recognised
// phrase in the real README sits wholly inside one comma-delimited clause
// (verified below), so a match can never reach into a neighbouring clause
// to launder a decoy digit through it.
//
// PROOF (both directions), run against a throwaway clone under
// /opt/swarm/scratch-aphorism-clone while sizing this fix, `node --test
// test/*.test.js` each time:
//   - real README, untouched: 101 pass / 0 fail (this test included; no
//     false rejection).
//   - "9 tags sit in the robust-pool band." inserted after the "#### Robust
//     pool (5+ entries)" heading (real count: 7 rows): this test fails,
//     naming "9" and the sentence it sits in.
//   - the same claim worded as "Only 9 tags are in the robust pool of
//     design-related work.", placed elsewhere in the section (immediately
//     before the closing sentence): also fails -- this guard is not keyed to
//     the literal wording or position of the cycle-3 example.
//   - a decoy count glued INTO a real heading -- "#### Robust pool (5+
//     entries, 9 tags total)" -- also fails: only the "5+" boundary token is
//     excluded, the rest of the heading line is scanned like any other
//     prose.
//   - the clause-splitting adversarial case above ("...exactly once, and
//     secretly 9 tags matter here, which is...") also fails post-fix (it
//     passed silently pre-fix, see CLAUSE SPLITTING above).
//
// KNOWN BOUNDARY, NOT CLOSED (measured, disclosed rather than patched):
//
//   1. English number WORDS are invisible to a `\d+` scan. "Nine tags sit in
//      the robust-pool band." (word, not digit) reproduces the ORIGINAL
//      cycle-3 hole exactly and this guard does not catch it -- measured
//      live alongside the digit-form case above. This is the same class of
//      gap the C7 comment block documents for the Attribution section (see
//      "two spellings slip under it" there) and it is left open for the same
//      reason: this section's own true prose could legitimately use a
//      spelled-out small number, and no measurement here has sized a rule
//      that closes the word form without a new false-rejection risk to
//      weigh against it.
//   2. The three recognised patterns are phrase shapes, not a general
//      "explain yourself" mechanism. An honest future rewording of a
//      recognised claim that inserts a comma where none exists today (e.g.
//      "12 tags, in total, appear on 2 or more entries") would split across
//      clauses and trip this guard even though the OTHER, more tolerant
//      guard for the same claim (above) would still accept it correctly.
//      Not reproduced against today's README (no such rewording exists), so
//      not a live false rejection -- named here as a standing risk of the
//      clause-splitting fix.
//   3. The closing sentence's "The smallest pool holds three aphorisms" is
//      spelled out in words today and is not, and was never, checked by any
//      guard in this file for correctness (it states an aphorism count, not
//      a tag count -- a different claim shape than the three this item
//      closes). Left uncovered by the allowlist on purpose: adding a
//      "N aphorisms" pattern here with no corresponding correctness check
//      would silently reopen a hole of exactly this item's shape, just
//      spelled differently. Consequence, measured: an HONEST future edit of
//      that word to a digit ("holds 3 aphorisms") would newly fail this
//      guard, loudly, naming "3" -- a false rejection of a true, unrelated
//      claim, traded on purpose against reopening a silent hole. If this
//      claim needs covering, it needs its own correctness guard (deriving
//      the true minimum band size from the corpus) added alongside a fourth
//      allowlist entry, not a bare allowlist entry on its own.
// ---------------------------------------------------------------------------

// The complete set of tag-count claim SHAPES this file verifies elsewhere --
// mirrors RECOGNISED_ATTRIBUTION_COUNT_LABELS's role below: every digit run
// in the section's prose must fall inside a match of one of these, or the
// digit is unrecognised and this guard fails loud. Each pattern is the exact
// phrase shape an existing test above already derives its number from and
// checks against the corpus -- adding a new recognised prose count here
// without also adding the guard that verifies it would reopen this item's
// own hole; see boundary note 3 above.
const RECOGNISED_TAG_COUNT_CLAIM_PATTERNS = [
  /\d+\s+distinct tags/i, // "README must state total unique tags correctly"
  /\d+\s+tags?\b[^,.;\n]*\bor more\b/i, // multi-entry count, opening-sentence test above
  /\d+\b[^,.;\n]*\bexactly (?:one|once)\b/i, // single-entry count, both phrasings, opening-sentence test + T-D above
];

// Helper: every digit run in the Tag vocabulary section's prose that is not
// accounted for by a `| Tag | Count |` table row, a real `#### ` heading's
// own boundary token, or one of the RECOGNISED_TAG_COUNT_CLAIM_PATTERNS
// above. Returns an array of { text, context } so the caller can name every
// offending number and where it sits, not just report a boolean.
function findUnrecognisedTagCountDigits(sectionText) {
  // Fenced code blocks are illustrative, not claims -- same rule the band
  // table extractor above applies, for the same reason (T-024b's fenced
  // "old format" example).
  const withoutFences = sectionText.replace(/```[\s\S]*?```/g, '');
  const lines = withoutFences.split('\n');

  const residualLines = lines.map((line) => {
    // Table rows (header, separator or data) are independently verified by
    // the band-table guards above; a stray table this file's band detection
    // doesn't recognise is independently caught by the structural-table-
    // count guard above too. Either way, not this guard's job.
    if (/^\s*\|.*\|\s*$/.test(line)) return '';

    // A real band heading: only its own boundary token ("N+" or "N-M",
    // whichever this line actually carries) is excluded -- it is what
    // extractBandTablesFromReadme parses and what the set-equality band
    // guard above verifies. Anything else on the same line, including a
    // decoy count glued into an otherwise-real heading, stays exposed.
    if (isBandHeadingLine(line)) {
      const openEnded = line.match(/\d+\s*\+/);
      const rangePair = line.match(/\d+\s*[-‐‑‒–—―]\s*\d+/);
      const token = openEnded ? openEnded[0] : rangePair ? rangePair[0] : null;
      return token ? line.replace(token, '') : line;
    }

    return line;
  });

  // Clauses, not lines or the whole section -- see CLAUSE SPLITTING above
  // for why a wider scope silently swallows a decoy digit.
  const clauses = residualLines.join('\n').split(/[.,;\n]/);

  const violations = [];
  for (const clause of clauses) {
    const digitPattern = /\d+/g;
    let digitMatch;
    while ((digitMatch = digitPattern.exec(clause)) !== null) {
      const recognised = RECOGNISED_TAG_COUNT_CLAIM_PATTERNS.some((pattern) => pattern.test(clause));
      if (!recognised) {
        violations.push({ text: digitMatch[0], context: clause.trim().replace(/\s+/g, ' ') });
      }
    }
  }
  return violations;
}

test('README Tag vocabulary section must contain no unrecognised count-claim digits (J-5)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagVocabSection = getTagVocabSection(readmeContent);

  const violations = findUnrecognisedTagCountDigits(tagVocabSection);

  const message =
    'README Tag vocabulary section states number(s) that no guard in this file checks: ' +
    violations.map((v) => '"' + v.text + '" (near "' + v.context + '")').join('; ') +
    '. Every count in this section must be either a `| Tag | Count |` table row, a band heading\'s own ' +
    'boundary token, or one of the recognised phrase shapes in RECOGNISED_TAG_COUNT_CLAIM_PATTERNS ' +
    '(test/readme-tags.test.js) -- each backed by a guard that derives its true value from the corpus. ' +
    'If this is a genuinely new, true count, add a recognised pattern here AND the guard that verifies it; ' +
    'otherwise remove the stray number.';

  assert.equal(violations.length, 0, message);
});

// ---------------------------------------------------------------------------
// Guard the README's cross-file and on-disk claims (T-016).
//
// Three claims live outside the Tag vocabulary section entirely and were
// previously checked by nothing:
//
//   C1 -- the ## Attribution section says the triage doc "ranks all 50
//         entries": that number must match corpus.length.
//   C2 -- the same section says "8 are rated HIGH": that number must match
//         the count of HIGH rows in docs/corpus-attribution-triage.md's
//         table.
//   C6 -- the ## Layout section's fenced block names a handful of paths
//         (bin/aphorism.js, src/corpus.js, ...): every one of them must
//         actually exist on disk.
//
// All three follow the same "derive, never hardcode" rule as the tests
// above: nothing here compares a stated number to a literal digit written
// in this file. C1 and C2 read corpus.length and the triage table at test
// time; C6 reads the filesystem at test time. A legitimate future change to
// the corpus, the triage doc, or the file layout -- paired with a correct
// README update -- must leave these tests green.
// ---------------------------------------------------------------------------

// Helper: return the Attribution section's raw text (heading through the
// line before the next top-level "## " heading). Mirrors getTagVocabSection.
function getAttributionSection(readmeContent) {
  const start = readmeContent.indexOf('## Attribution');
  assert(start !== -1, 'README must have an Attribution section');
  const nextSection = readmeContent.indexOf('\n## ', start + 1);
  const end = nextSection > -1 ? nextSection : readmeContent.length;
  return readmeContent.substring(start, end);
}

// Helper: return the Layout section's raw text, same slicing convention.
function getLayoutSection(readmeContent) {
  const start = readmeContent.indexOf('## Layout');
  assert(start !== -1, 'README must have a Layout section');
  const nextSection = readmeContent.indexOf('\n## ', start + 1);
  const end = nextSection > -1 ? nextSection : readmeContent.length;
  return readmeContent.substring(start, end);
}

// ---------------------------------------------------------------------------
// Attribution section counts: read from STRUCTURE, not from an English
// sentence.
//
// This replaces collectMarkerBindings/formatBindingMismatch, which used to
// live here (T-016 through T-032; see backlog.json items T-024, T-024a,
// T-032 and state.json known issues KI-9, KI-10 for the full record). That
// approach read the Attribution section's PROSE, splitting it on em/en
// dashes and binding each marker word ("entries", "HIGH") to the nearest
// preceding digit run in its own clause. Six cycles tried to make that
// reading correct by narrowing the rule, and the measured conclusion,
// reached twice from independently-designed fixes -- a subject-first/
// subject-last binding swap at cycle 31, then a closed-template rewrite at
// cycle 32 that traded three new false rejections for one genuine repair --
// is that no rule which reads an English sentence to decide WHICH NUMBER a
// claim means can avoid falsely rejecting some naturally-written, entirely-
// true README. Only the membership of the falsely-rejected set moves. The
// mirror defect was also measured (T-031): a contradictory count separated
// from its marker by a dash lands in the ADJACENT clause and binds nothing,
// so a self-contradicting README passed silently. Two failure directions,
// from the same instrument, on the same guard.
//
// The fix is not a seventh narrowing of that rule. It removes the sentence
// from the loop. The two counts the Attribution section makes -- how many
// corpus entries the triage doc ranks, how many of those are rated HIGH --
// now live in a `| Attribution triage | Count |` table: the same shape
// (header row, `|---|---|` separator row, data rows) the Tag vocabulary
// section's `| Tag | Count |` tables already use, and that this file has
// never had to narrow a reading rule for, because a table cell has no
// grammar to misparse. parseAttributionCountsTable below locates that table
// the same way extractBandTablesFromReadme locates a band table: by its
// header row's literal text plus the separator row immediately below it,
// never by scanning prose for a marker word.
//
//   C1 -- the table's "Entries ranked" row must equal corpus.length AND the
//         number of data rows parseTriageRiskRows finds in the triage doc.
//         Both truths are derived at test time; neither is a digit literal
//         written into this file.
//   C2 -- the table's "Rated HIGH risk" row must equal the count of HIGH
//         rows parseTriageRiskRows returns. Also derived, never hardcoded.
//   C7 -- the guard that is what makes deleting the prose reader safe
//         rather than a silent regression. Moving the counts into a table
//         does not, on its own, stop a maintainer from ALSO leaving (or
//         re-introducing) a number in the surrounding prose -- e.g.
//         hand-editing the lead sentence back to "ranks all 51 entries"
//         while the table still correctly says 50. C1/C2 only ever look at
//         the table, so neither would catch that; without a third guard,
//         deleting collectMarkerBindings would trade a false-rejecting
//         instrument for a blind spot, not for nothing. C7 closes it by
//         asserting that ALL of the section's text EXCEPT the counts
//         table's own header, separator and data rows -- prose, headings,
//         list items, and fenced code alike -- carries NO digit runs at
//         all. That is a deliberate, narrow style rule
//         scoped to this ONE section, not a general ban on numbers in the
//         README: it is safe to enforce exactly because C1/C2 already
//         guarantee the table itself is complete and correct, so any prose
//         number left outside it can only ever be redundant with the table
//         (pointless) or in conflict with it (wrong) -- and banning both
//         outright is cheaper and louder than parsing and cross-checking a
//         prose number, which is the exact instrument this section just got
//         rid of. A red C7 means: move the number into the table. It does
//         not mean delete this guard -- doing that would reopen the hole it
//         exists to close.
//
// Table well-formedness, asserted by all three guards (C1, C2 and C7 each
// call assertAttributionCountsTableWellFormed before reading anything out
// of the table): two rules that between them close the last two ways a
// wrong number could sit in this section checked by nothing. Both were
// measured as silent holes in the first cut of this design -- a README
// stating a FALSE count that the suite accepted green -- so neither is
// decoration.
//
//   - A DUPLICATED row label fails loud, naming the label and EVERY value
//     found under it. The locator below used to build its Map with one
//     .set() per data row, so a repeated label silently overwrote and the
//     LAST occurrence won: `| Rated HIGH risk | 9 |` placed above
//     `| Rated HIGH risk | 8 |` passed, while the same two rows in the
//     other order failed. A guard whose verdict depends on document order
//     is the exact defect class this whole item exists to remove, and
//     "which occurrence wins" is the wrong question anyway: a table that
//     states one figure twice, differently, is broken whichever value
//     happens to be correct. The remedy named in the message is to delete
//     the wrong row, not to pick a winner -- which is also why the locator
//     no longer keeps a single value per label at all (see below).
//
//   - An UNRECOGNISED row label fails loud, naming it and listing the
//     labels that are recognised (RECOGNISED_ATTRIBUTION_COUNT_LABELS
//     below). C1 reads "Entries ranked", C2 reads "Rated HIGH risk", and
//     C7 excises the whole table from its digit scan -- so before this rule
//     a row under any other label (measured: `| HIGH rows in the doc | 9 |`)
//     was checked by nothing whatsoever. It sat inside the table, so C7
//     skipped it; no guard asked for that label, so no guard read it. This
//     rule is the exact mirror of C7: C7 says no number may sit OUTSIDE the
//     table, this says no row may sit INSIDE it that no guard reads.
//     Together they complete the invariant that is the whole reason the old
//     prose reader could be deleted without dropping coverage --
//
//         EVERY number written in digits, anywhere in the Attribution
//         section, is either a table row that a named guard verifies
//         against a truth derived at test time, or a loud failure.
//
//     -- and it is that invariant, not the table shape on its own, that
//     replaced collectMarkerBindings. A consequence, intended rather than
//     tolerated: adding a genuinely new count to this section requires
//     editing THIS file -- add its label to
//     RECOGNISED_ATTRIBUTION_COUNT_LABELS and write the guard that derives
//     and checks it. A new number in this section must not be able to
//     appear without a guard being written for it, and the assertion
//     message says so, so the next maintainer's path is not a puzzle.
//
// C7 scans FENCED CODE BLOCKS, and that is a deliberate trade of a loud
// false rejection for a silent acceptance. Stripping fences before the
// digit scan (as the first cut of this design did, mirroring the
// fenced-code stripping the Tag vocabulary tests above do) left a measured
// hole: a fenced block appended to this section reading "9 entries are
// rated HIGH." stated a false count -- there are 8 -- and the suite stayed
// green, a case the deleted prose reader had caught. Scanning fences costs
// something real, and it should be met as a decision rather than as a
// surprise: a maintainer pasting a genuinely useful and entirely TRUE
// snippet that happens to carry a digit, e.g.
//
//     grep -c "| HIGH |" docs/corpus-attribution-triage.md   # 8
//
// now goes red for stating a true thing. This repo's standing precedent
// settles which way to take that: a false rejection that is loud and has a
// named remedy is preferred to a silent acceptance of a wrong claim. What
// it buys is a rule statable in one line -- this section contains no
// numbers outside the counts table -- and one-line rules survive
// maintenance in a way that "no numbers, except in fences, except ..."
// does not, because every exception is somewhere for the next wrong number
// to be parked. If you need that grep line in the README, it belongs in a
// section this guard does not police.
//
// Markdown LINK TARGETS are still excluded from the scan. A link target is
// an address, not a claim a maintainer is asserting a fact in, and no
// measurement has found a hole there. This section's one target
// (`docs/corpus-attribution-triage.md`) carries no digits today, but a
// future doc filename or URL that did would otherwise trip C7 for a reason
// unrelated to an unchecked claim. Everything else is scanned: prose,
// headings, list items, inline code spans, indented and tilde-fenced
// blocks, and HTML comments were each measured firing C7.
//
// KNOWN BOUNDARY (measured, deliberately NOT closed): the invariant above
// is over ASCII digits, and two spellings slip under it. An English number
// WORD does: "Nine of those entries are rated HIGH." appended to this
// section states a false count -- there are 8 -- and the suite stays green.
// So does "9 entries are rated HIGH." with U+FF19 FULLWIDTH DIGIT NINE in
// place of the ASCII 9, because JS \d without the /u flag is ASCII-only.
// Both are recorded here rather than patched, and for a measured reason
// rather than squeamishness: closing the word case means banning English
// number words in this section, and this section's own current, entirely
// TRUE sentence ends "... says what would settle each one." A rule that
// rejects the live README on the word "one" is not a candidate. A rule
// banning "two".."twenty" but sparing "one" is the "no numbers, except ..."
// shape this whole design was chosen to avoid, and it buys back only the
// spellings a maintainer is least likely to reach for. The residual exposure
// is narrow because of where the counts now live: a wrong count has to be
// deliberately written out in words, which no ordinary edit does now that
// the figures sit in a table and a table cell takes digits. If you do close
// this, write down the true sentence your rule newly rejects BEFORE you add
// it -- that discipline is what this guard family's history (T-016 through
// T-032) is a record of.
//
// One more scope note, shared with every section-scoped guard in this file
// rather than special to C7: getAttributionSection stops at the next
// top-level "## " heading, so a claim moved below a NEW heading is outside
// this section and outside these guards by construction. That is the
// intended meaning of "in the Attribution section", not a leak -- but it is
// also the cheapest way to move a number out from under C7, so a review
// that sees a new "## " heading appear next to this one should ask what
// went under it.
// ---------------------------------------------------------------------------

// The complete set of row labels the guards in this file check, and
// therefore -- by the invariant above -- the only labels the counts table
// is permitted to carry. This is a set of label strings, not a count, so
// writing it down here is not a "derive, never hardcode" violation: no
// number in the README is ever compared against a literal in this file.
const RECOGNISED_ATTRIBUTION_COUNT_LABELS = ['Entries ranked', 'Rated HIGH risk'];

// Helper: locate the Attribution section's counts table structurally -- by
// its header row (`| Attribution triage | Count |`) plus the `|---|---|`
// separator row immediately below it, the same two-anchor rule
// extractBandTablesFromReadme above uses for the Tag vocabulary section's
// `| Tag | Count |` tables. Returns { rows, headerIdx, tableEnd,
// headerCount } where `rows` is a Map from each data row's label cell
// (e.g. "Entries ranked") to the ARRAY of RAW (unparsed) value cell texts
// found under that label, in document order; `headerIdx` is the header row's
// line index and `tableEnd` is one past the last data row's line index --
// both kept so callers (see attributionTextOutsideTable below) can excise
// exactly the table's own lines and nothing else.
//
// `headerCount` is how many header rows the section contains, reported
// rather than resolved. Taking the first and ignoring the rest would be the
// same document-order-dependent verdict as the duplicated-label defect, one
// level up: a second counts table would be read by nothing, and would leak
// entirely if its cells held no digits for C7 to catch (measured: a second
// table with `| Rated HIGH risk | nine |` passed). The section is specified
// to hold exactly one counts table, so more than one is a loud failure --
// see assertAttributionCountsTableWellFormed.
//
// An array per label, not a value per label, is the point rather than
// bookkeeping: keeping one value would mean choosing between the first and
// the last occurrence of a duplicated label, and that choice is what made
// a self-contradicting table pass in one row order and fail in the other
// (see the duplicated-label rule in the comment block above). With every
// occurrence retained, no caller can accidentally read a single number out
// of a label that carries two, and the duplicate is a loud failure instead
// of a coin toss.
//
// Values are left unparsed here on purpose: a value that fails to parse as
// an integer is still a real row, and it is the CALLER's job
// (readAttributionCount below) to name that row and its bad value in a loud
// assertion, not this locator's job to quietly drop it.
//
// Returns null -- never an empty Map -- if the header row or the separator
// row cannot be found, so a caller can distinguish "the table is missing or
// malformed" from "the table exists and is (implausibly) empty" and fail
// loud on the former rather than reading a clean pass out of nothing.
function parseAttributionCountsTable(sectionText) {
  const lines = sectionText.split('\n');
  const headerRowPattern = /^\|\s*Attribution triage\s*\|\s*Count\s*\|\s*$/;
  const rowPattern = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/;

  const headerIndices = lines.reduce(
    (acc, line, idx) => (headerRowPattern.test(line.trim()) ? acc.concat(idx) : acc),
    []
  );
  if (headerIndices.length === 0) return null;
  const headerIdx = headerIndices[0];

  const separatorLine = lines[headerIdx + 1];
  if (!separatorLine || !/^\|[-\s|]+\|$/.test(separatorLine.trim())) return null;

  const rows = new Map();
  let end = headerIdx + 2;
  while (end < lines.length) {
    const trimmed = lines[end].trim();
    const rowMatch = trimmed.match(rowPattern);
    if (!rowMatch) break;
    const [, label, value] = rowMatch;
    if (!rows.has(label)) rows.set(label, []);
    rows.get(label).push(value);
    end++;
  }
  if (rows.size === 0) return null;

  return { rows, headerIdx, tableEnd: end, headerCount: headerIndices.length };
}

// Helper: assert the two whole-table rules described in the comment block
// above -- no duplicated row label, and no row label outside
// RECOGNISED_ATTRIBUTION_COUNT_LABELS -- plus the table's existence. Every
// guard that touches this table calls this FIRST, before reading any
// individual row, because both rules are about the table as a whole: a
// guard that only ever asked for its own label would never see a duplicated
// or unread row at all, which is precisely how both of these were silent.
//
// Duplicates are reported before unrecognised labels only so that a
// duplicated unrecognised label reads as the more specific of the two
// problems; neither ordering can let a table through.
function assertAttributionCountsTableWellFormed(table) {
  assert(
    table !== null,
    'could not find the "| Attribution triage | Count |" table in the README Attribution section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );

  assert(
    table.headerCount === 1,
    'the README Attribution section contains ' + table.headerCount +
      ' "| Attribution triage | Count |" header rows -- there must be exactly one counts table. Only the ' +
      'first would be read, so every row of the others would be verified by nothing; delete the extra table.'
  );

  const duplicated = Array.from(table.rows.entries()).filter(([, values]) => values.length > 1);
  assert(
    duplicated.length === 0,
    'the README Attribution counts table states the same row label more than once: ' +
      duplicated
        .map(
          ([label, values]) =>
            '"' + label + '" appears ' + values.length + ' times, with values ' +
            values.map((v) => '"' + v + '"').join(' then ')
        )
        .join('; ') +
      ' -- a table that states one figure twice, differently, is broken whichever value happens to be ' +
      'correct, and no reading order may be allowed to decide it. Delete the wrong row.'
  );

  const unrecognised = Array.from(table.rows.keys()).filter(
    (label) => !RECOGNISED_ATTRIBUTION_COUNT_LABELS.includes(label)
  );
  assert(
    unrecognised.length === 0,
    'the README Attribution counts table has row label(s) that no guard in this file checks: ' +
      unrecognised.map((label) => '"' + label + '"').join(', ') +
      ' -- the recognised labels are ' +
      RECOGNISED_ATTRIBUTION_COUNT_LABELS.map((label) => '"' + label + '"').join(', ') +
      '. Every number in this section must be either a table row a guard verifies or a loud failure, ' +
      'and a row under an unread label is neither: C7 excises the table from its digit scan, so nothing ' +
      'would check it. If this is a genuinely new count, that is fine but it takes a test change -- add ' +
      'the label to RECOGNISED_ATTRIBUTION_COUNT_LABELS in test/readme-tags.test.js and write the guard ' +
      'that derives its true value at test time. If it is not a new count, rename the row to a recognised ' +
      'label or delete it.'
  );
}

// Helper: fetch one labelled row's value out of a parseAttributionCountsTable
// result as an integer, asserting loudly at every point this can fail --
// table missing entirely, row missing from the table, the label carrying
// more than one row, or the row's cell not being a bare integer -- so a
// caller can go straight to comparing numbers without re-deriving any of
// these checks itself. The table-missing and duplicate-label assertions
// duplicate assertAttributionCountsTableWellFormed on purpose: this helper
// must be safe to call on its own, so that a guard added later which forgets
// the well-formedness call still cannot read a single number out of a
// contradictory or absent table.
function readAttributionCount(table, label) {
  assert(
    table !== null,
    'could not find the "| Attribution triage | Count |" table in the README Attribution section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  assert(
    table.rows.has(label),
    'the Attribution counts table has no "' + label + '" row -- rows found: ' +
      Array.from(table.rows.keys()).map((k) => '"' + k + '"').join(', ')
  );
  const values = table.rows.get(label);
  assert(
    values.length === 1,
    'the Attribution counts table has ' + values.length + ' rows labelled "' + label + '", with values ' +
      values.map((v) => '"' + v + '"').join(' then ') +
      ' -- this figure must be stated exactly once; delete the wrong row rather than letting row order pick one'
  );
  const raw = values[0];
  assert(
    /^\d+$/.test(raw),
    'the Attribution counts table\'s "' + label + '" row has value "' + raw + '", which is not a plain integer'
  );
  return parseInt(raw, 10);
}

// Helper: the Attribution section's text with the counts table's own lines
// (header, separator, every data row parseAttributionCountsTable walked)
// removed, and markdown link targets neutralised -- see the C7 discussion
// in the comment block above for what remains and why link targets are the
// ONLY exclusion. Fenced code blocks are deliberately NOT stripped: a false
// count inside a fence is still a false count in the README, and the loud
// false rejection that scanning them costs (a true snippet carrying a
// digit) is the trade this repo's precedent prefers.
//
// `table` must be a non-null parseAttributionCountsTable result; C7 (the
// only caller) asserts that itself before calling this.
function attributionTextOutsideTable(sectionText, table) {
  const lines = sectionText.split('\n');
  const withoutTable = lines.filter((_, idx) => idx < table.headerIdx || idx >= table.tableEnd);
  const prose = withoutTable.join('\n');
  return prose.replace(/\]\([^)]*\)/g, ']()'); // markdown link targets
}

// Helper: parse the triage doc's "| # | Aphorism | Author | Risk | Signal |
// Why |" table and return the Risk value of every real data row. A data
// row is identified structurally -- its first cell is a bare integer --
// which is true only for actual rows, never the header ("#") or the
// separator ("---") line, so this cannot double-count either of those.
function parseTriageRiskRows(triageContent) {
  const rows = [];
  for (const line of triageContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;
    const cells = trimmed.split('|').map(cell => cell.trim());
    // ['', id, aphorism, author, risk, signal, why, ''] for a real row.
    if (cells.length < 7) continue;
    if (!/^\d+$/.test(cells[1])) continue;
    const risk = cells[4];
    if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW') {
      rows.push(risk);
    }
  }
  return rows;
}

// Helper: pull every path named in the Layout section's fenced code block.
// Each line in that block is "<path>    <description>"; the path is
// whatever leading non-whitespace token contains a "/", which is true of
// every real entry (bin/aphorism.js, src/corpus.js, ..., test/) and false
// of nothing that block currently contains. Returns null if no fenced
// block can be found at all, so the caller can fail loud rather than
// silently checking zero paths.
function extractLayoutPaths(layoutSection) {
  const fenceMatch = layoutSection.match(/```[^\n]*\n([\s\S]*?)```/);
  if (!fenceMatch) return null;
  const paths = [];
  for (const line of fenceMatch[1].split('\n')) {
    const tokenMatch = line.match(/^(\S+)/);
    if (tokenMatch && tokenMatch[1].includes('/')) {
      paths.push(tokenMatch[1]);
    }
  }
  return paths;
}

test('README Attribution table "Entries ranked" count must match corpus.length and the triage doc (C1)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const attributionSection = getAttributionSection(readmeContent);
  const table = parseAttributionCountsTable(attributionSection);
  assertAttributionCountsTableWellFormed(table);

  const statedEntries = readAttributionCount(table, 'Entries ranked');

  assert.equal(
    statedEntries,
    corpus.length,
    'Attribution table "Entries ranked" row says ' + statedEntries + ' but corpus.length is ' + corpus.length
  );

  const triagePath = path.join(__dirname, '..', 'docs', 'corpus-attribution-triage.md');
  const triageContent = fs.readFileSync(triagePath, 'utf8');
  const riskRows = parseTriageRiskRows(triageContent);
  assert(
    riskRows.length > 0,
    'could not parse any rows out of the docs/corpus-attribution-triage.md Risk table -- ' +
      'the table shape may have changed; this claim must fail loud, not pass silently, when it cannot be parsed'
  );

  assert.equal(
    statedEntries,
    riskRows.length,
    'Attribution table "Entries ranked" row says ' + statedEntries + ' but docs/corpus-attribution-triage.md has ' +
      riskRows.length + ' data rows'
  );
});

test('README Attribution table "Rated HIGH risk" count must match the triage doc table (C2)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const attributionSection = getAttributionSection(readmeContent);
  const table = parseAttributionCountsTable(attributionSection);
  assertAttributionCountsTableWellFormed(table);

  const statedHigh = readAttributionCount(table, 'Rated HIGH risk');

  const triagePath = path.join(__dirname, '..', 'docs', 'corpus-attribution-triage.md');
  const triageContent = fs.readFileSync(triagePath, 'utf8');
  const riskRows = parseTriageRiskRows(triageContent);
  assert(
    riskRows.length > 0,
    'could not parse any rows out of the docs/corpus-attribution-triage.md Risk table -- ' +
      'the table shape may have changed; this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const actualHigh = riskRows.filter((risk) => risk === 'HIGH').length;

  assert.equal(
    statedHigh,
    actualHigh,
    'Attribution table "Rated HIGH risk" row says ' + statedHigh + ' but docs/corpus-attribution-triage.md has ' +
      actualHigh + ' HIGH rows'
  );
});

// C7 -- see the comment block above parseAttributionCountsTable for why this
// guard exists: it is what makes deleting the old prose reader safe rather
// than a silent regression. C1/C2 only ever look inside the counts table;
// without this, a number left (or reintroduced) anywhere else in the section
// -- including inside a fenced code block, which is where a false count was
// measured hiding when fences were excluded -- would be unchecked by
// anything in this file.
test('README Attribution section must contain no digit runs outside the counts table (C7)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const attributionSection = getAttributionSection(readmeContent);
  const table = parseAttributionCountsTable(attributionSection);
  assertAttributionCountsTableWellFormed(table);

  const outsideTable = attributionTextOutsideTable(attributionSection, table);
  const digitMatch = outsideTable.match(/\d+/);

  let message = '';
  if (digitMatch) {
    const contextStart = Math.max(0, digitMatch.index - 30);
    const contextEnd = digitMatch.index + digitMatch[0].length + 30;
    const context = outsideTable.slice(contextStart, contextEnd).trim().replace(/\s+/g, ' ');
    message =
      'README Attribution section contains the number "' + digitMatch[0] +
      '" outside the counts table (near "...' + context + '..."). Every number in this section ' +
      'belongs in the Attribution triage table, where a guard verifies it -- prose, headings and ' +
      'fenced code blocks are all scanned, deliberately, because a false count inside a fence is ' +
      'still a false count. Move the number into the table (adding a guard for it if it is a new ' +
      'count) rather than deleting this guard.';
  }
  assert(digitMatch === null, message);
});

test('README Layout section paths must exist on disk (C6)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const layoutSection = getLayoutSection(readmeContent);

  const layoutPaths = extractLayoutPaths(layoutSection);
  assert(
    layoutPaths !== null,
    'could not find a fenced code block in the Layout section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  assert(
    layoutPaths.length > 0,
    'found a fenced code block in the Layout section but no path-like tokens in it -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );

  for (const layoutPath of layoutPaths) {
    const absolutePath = path.join(__dirname, '..', layoutPath);
    assert(
      fs.existsSync(absolutePath),
      'README Layout section names `' + layoutPath + '` but it does not exist on disk at ' + absolutePath
    );
  }
});

// ---------------------------------------------------------------------------
// Guard the `--list` output format literal against the shipped binary
// (T-017 / survivor C5 of the cycle-19 mutation sweep).
//
// The "### `--list` behaviour" section states the per-line output format
// TWICE: once as a backtick-quoted LITERAL (`<text> — <author>`) and once
// as an English prose gloss ("(text, space, EM DASH, space, author)"). The
// literal is the machine-readable contract; the prose is free-form and is
// deliberately NEVER asserted against here (that would wrongly freeze
// wording no Domain rule promises -- see the C3/C4/C7 boundary class from
// the same sweep).
//
// The section itself is located structurally, by its markdown heading, and
// the separator is derived from whatever sits between the `<text>` and
// `<author>` placeholders in the literal at test time -- not from a
// hardcoded em-dash constant baked into this file (standing hazard from
// item T-012: never key extraction to a lead-in prose sentence that a
// maintainer could reword). If the README literal's separator changes, the
// expected-output computation below changes with it, so a rewritten
// literal that no longer matches the unchanged binary must fail this test.
// ---------------------------------------------------------------------------

// Helper: does this "### " heading LINE plausibly name the `--list`
// behaviour section? Two independent structural conditions, both required:
//
//   1. It carries the `--list` flag as a STANDALONE token -- backticks are
//      stripped first (so a backtick-quoted flag and a bare one normalize
//      the same way, tolerating the T-021 reformat), then the token must
//      not be glued to more flag-name characters on either side. This is
//      what keeps a heading for a DIFFERENT flag, e.g. "### `--list-only`
//      behaviour", from qualifying: "--list" is a substring of
//      "--list-only" but not a standalone token there.
//   2. It carries the word "behaviour" OR its American spelling "behavior"
//      (case-insensitive, own word; T-027 -- a maintainer rewording the
//      heading to the American spelling makes no README claim false and
//      must not trip the locator's "none found" failure).
//
// Deliberately NOT anchored to any specific lead-in phrase or position in
// the document (T-012 hazard) -- this reads heading STRUCTURE (the flag
// token, the word) rather than a full literal heading string, which is
// exactly what lets an honest reformat like "### --list behaviour" (no
// backticks) keep working.
function headingNamesListBehaviourSection(headingText) {
  const normalized = headingText.replace(/`/g, '');
  const hasListToken = /(^|[^A-Za-z0-9-])--list(?![A-Za-z0-9-])/.test(normalized);
  const hasBehaviourWord = /\bbehaviou?r\b/i.test(normalized);
  return hasListToken && hasBehaviourWord;
}

// Helper: return the "--list behaviour" section's raw text (heading through
// the line before the next "### " or "## " heading, whichever comes first).
//
// Located by scanning every "### " heading in the document and testing each
// one structurally (see headingNamesListBehaviourSection) rather than by
// matching one fixed, fully-formatted heading string -- that fixed-string
// match is what broke on the honest "### --list behaviour" reformat (no
// backticks) that this item exists to tolerate.
//
// Critically, this does NOT take the first heading that qualifies. An
// earlier decoy heading that happens to carry both the `--list` token and
// the word "behaviour" (e.g. "### Notes on `--list` behaviour") would, under
// a first-match scan, silently steal the section -- and if that decoy's own
// body contains a correct-looking format literal while the REAL section's
// literal has been mutated to something false, the whole guard goes green
// on a wrong README. That is strictly worse than failing loud, so instead:
// every heading in the document is tested, and if more than one qualifies,
// this throws an ambiguity error naming all of them rather than picking a
// winner. Zero qualifying headings is also a loud, named failure -- not a
// silent empty section.
function getListBehaviourSection(readmeContent) {
  const headingLinePattern = /^### (.+)$/gm;
  const candidates = [];
  let match;
  while ((match = headingLinePattern.exec(readmeContent)) !== null) {
    if (headingNamesListBehaviourSection(match[1])) {
      candidates.push({ index: match.index, headingLine: match[0].trim() });
    }
  }

  assert(
    candidates.length > 0,
    'README must have a "### " heading naming the standalone `--list` token and the word "behaviour" ' +
      '(e.g. "### `--list` behaviour" or "### --list behaviour") -- none found'
  );
  assert.equal(
    candidates.length,
    1,
    'found ' + candidates.length + ' "### " headings that could each plausibly be the `--list` behaviour ' +
      'section (' + candidates.map((c) => JSON.stringify(c.headingLine)).join(', ') + ') -- ambiguous, ' +
      'refusing to silently pick one'
  );

  const start = candidates[0].index;
  const nextH3 = readmeContent.indexOf('\n### ', start + 1);
  const nextH2 = readmeContent.indexOf('\n## ', start + 1);
  const boundaries = [nextH3, nextH2].filter((i) => i > -1);
  const end = boundaries.length > 0 ? Math.min(...boundaries) : readmeContent.length;

  return readmeContent.substring(start, end);
}

// Helper: pull the separator out of the backtick-quoted format LITERAL
// `<text>...<author>` in the given section text. Returns whatever
// characters sit between the two placeholders -- e.g. " — " (space, EM
// DASH, space) today, but this makes no assumption about which characters
// those are, so a mutated literal (e.g. an ASCII hyphen swap) yields a
// mutated separator here too. Deliberately does NOT look at the prose
// gloss sentence anywhere in the section.
function extractListFormatSeparator(listBehaviourSection) {
  const literalMatch = listBehaviourSection.match(/`<text>(.*?)<author>`/);
  assert(
    literalMatch,
    'could not find a `<text>...<author>` format literal in the "--list behaviour" section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  return literalMatch[1];
}

// ---------------------------------------------------------------------------
// Pin getListBehaviourSection's own locator behaviour (T-021), independent
// of whatever README.md happens to say today. Exercises it directly on
// hand-built document text, the same style as the T-025 extractor tests
// above.
// ---------------------------------------------------------------------------

test('getListBehaviourSection tolerates a reformatted "--list behaviour" heading with no backticks (T-021)', () => {
  const doc = [
    '## Flags',
    '',
    '### --list behaviour',
    '',
    'Format: `<text> — <author>`',
    '',
    '## Tag vocabulary',
  ].join('\n');

  const section = getListBehaviourSection(doc);
  assert(
    section.includes('<text> — <author>'),
    'the reformatted heading (no backticks) must still locate its own section body'
  );
});

test('getListBehaviourSection still fails on a SEPARATOR MISMATCH (not a heading-parse error) when a reformatted heading\'s literal is mutated (T-021)', () => {
  const doc = [
    '## Flags',
    '',
    '### --list behaviour',
    '',
    'Format: `<text> - <author>`', // mutated: ASCII hyphen, not em dash
    '',
    '## Tag vocabulary',
  ].join('\n');

  // The heading itself must resolve cleanly -- no parse-error throw here.
  const section = getListBehaviourSection(doc);
  const separator = extractListFormatSeparator(section);

  // The mutation must be visible as a wrong separator, not hidden behind a
  // heading-parse failure that masks it (the exact trap this item warns
  // about: B1/B2 must both fail, but on DIFFERENT assertions).
  assert.notEqual(separator, ' — ', 'a mutated separator under a reformatted heading must still be detectably wrong');
});

test('getListBehaviourSection reports ambiguity loudly instead of taking the first of two qualifying headings (T-021)', () => {
  const doc = [
    '## Flags',
    '',
    '### Notes on `--list` behaviour',
    '',
    'Format: `<text> — <author>`', // decoy: looks correct',
    '',
    '### --list behaviour',
    '',
    'Format: `<text> - <author>`', // real section, mutated -- must NOT be silently skipped
    '',
    '## Tag vocabulary',
  ].join('\n');

  assert.throws(
    () => getListBehaviourSection(doc),
    /ambiguous/,
    'two headings that both plausibly name the --list behaviour section must raise an ambiguity error, ' +
      'not silently resolve to whichever comes first in the document'
  );
});

test('getListBehaviourSection does not let "--list-only" satisfy the standalone `--list` token (T-021)', () => {
  const doc = [
    '## Flags',
    '',
    '### --list-only behaviour',
    '',
    'Format: `<text> — <author>`',
    '',
    '## Tag vocabulary',
  ].join('\n');

  assert.throws(
    () => getListBehaviourSection(doc),
    /none found/,
    'a heading for a different flag (--list-only) must not be mistaken for the --list behaviour section'
  );
});

test('getListBehaviourSection tolerates the American spelling "behavior" in the heading (T-027)', () => {
  const doc = [
    '## Flags',
    '',
    '### `--list` behavior',
    '',
    'Format: `<text> — <author>`',
    '',
    '## Tag vocabulary',
  ].join('\n');

  // A maintainer rewording "behaviour" to "behavior" makes no README claim
  // false and leaves the format literal untouched -- the locator must not
  // fail loud with "none found" over a spelling variant alone.
  const section = getListBehaviourSection(doc);
  assert(
    section.includes('<text> — <author>'),
    'the American-spelled heading must still locate its own section body'
  );
});

test('getListBehaviourSection still fails on a SEPARATOR MISMATCH (not a heading-parse error) under an American-spelled heading (T-027)', () => {
  const doc = [
    '## Flags',
    '',
    '### `--list` behavior',
    '',
    'Format: `<text> - <author>`', // mutated: ASCII hyphen, not em dash
    '',
    '## Tag vocabulary',
  ].join('\n');

  // Tolerating the spelling variant must not buy silence on a genuinely
  // wrong literal under that same heading -- the heading resolves cleanly
  // and the mutation surfaces as a wrong separator, not a masked locator
  // failure (same B1/B2 trap as T-021, one spelling axis over).
  const section = getListBehaviourSection(doc);
  const separator = extractListFormatSeparator(section);
  assert.notEqual(separator, ' — ', 'a mutated separator under an American-spelled heading must still be detectably wrong');
});

test('README `--list` format literal matches the shipped binary\'s actual --list output (T-017)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  const listBehaviourSection = getListBehaviourSection(readmeContent);
  const separator = extractListFormatSeparator(listBehaviourSection);

  const binPath = path.join(__dirname, '..', 'bin', 'aphorism.js');
  const stdout = execFileSync(process.execPath, [binPath, '--list'], { encoding: 'utf8' });

  // The binary prints one trailing newline (from console.log); strip
  // exactly that before splitting into per-aphorism lines.
  const actualLines = stdout.replace(/\n$/, '').split('\n');

  // Expected output derived from the real corpus, at test time, joined
  // with the separator parsed out of the README literal above -- never a
  // separator constant hardcoded in this file.
  const expectedLines = corpus.map((entry) => `${entry.text}${separator}${entry.author}`);

  assert.equal(
    actualLines.length,
    expectedLines.length,
    'README `--list` literal implies ' + expectedLines.length + ' output lines (one per corpus entry, unfiltered) ' +
      'but the binary printed ' + actualLines.length + ' lines for `node bin/aphorism.js --list`'
  );

  for (let i = 0; i < expectedLines.length; i++) {
    assert.equal(
      actualLines[i],
      expectedLines[i],
      'line ' + (i + 1) + ' of `node bin/aphorism.js --list` does not match the README\'s `--list` format ' +
        'literal `<text>' + separator + '<author>`: binary printed ' + JSON.stringify(actualLines[i]) +
        ' but the README-derived expectation (corpus entry #' + i + ') is ' + JSON.stringify(expectedLines[i])
    );
  }
});
