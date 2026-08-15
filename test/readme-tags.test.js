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

test('README should acknowledge single-entry tag limitation', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Check for language describing the limitation
  const hasWarning = readmeContent.includes('exactly one') ||
                     readmeContent.includes('single-entry') ||
                     readmeContent.includes('Single-entry');

  assert(hasWarning, 'README should acknowledge that some tags appear only once');
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

// Helper: find every "heading line immediately followed by a `| Tag | Count |`
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
  const lines = sectionText.split('\n');
  const tableRowPattern = /\| `([a-z]+)` \| (\d+) \|/;
  const bands = [];

  for (let i = 0; i < lines.length; i++) {
    const headingLine = lines[i];

    // Allow any number of blank lines between the heading and its table's
    // `| Tag | Count |` header row -- idiomatic markdown often puts one
    // there. Skip forward over blank lines only; stop at the first
    // non-blank line and require THAT one to be the header row. This means
    // a heading with no table (blank lines followed by ordinary prose, or
    // by another heading) never has a later, unrelated table grafted onto
    // it -- the scan does not skip past non-blank content looking for a
    // table further down.
    let headerIdx = i + 1;
    while (headerIdx < lines.length && lines[headerIdx].trim() === '') {
      headerIdx++;
    }
    const headerRowLine = lines[headerIdx];
    // The separator row must immediately follow the header row -- that is
    // standard markdown table syntax (a blank line there would stop it from
    // rendering as a table at all), so only heading-to-header spacing is
    // being relaxed here, not header-to-separator.
    const separatorRowLine = lines[headerIdx + 1];

    if (!headerRowLine || !/^\|\s*Tag\s*\|\s*Count\s*\|\s*$/.test(headerRowLine.trim())) {
      continue;
    }
    if (!separatorRowLine || !/^\|[-\s|]+\|$/.test(separatorRowLine.trim())) {
      continue;
    }

    // Derive the band's numeric bounds from the heading line's digits only.
    const openEnded = headingLine.match(/(\d+)\s*\+/);
    const rangePair = headingLine.match(/(\d+)\s*[-‐‑‒–—―]\s*(\d+)/);

    let min, max, bandTokenStart, bandTokenEnd;
    if (openEnded) {
      min = parseInt(openEnded[1], 10);
      max = Infinity;
      bandTokenStart = openEnded.index;
      bandTokenEnd = openEnded.index + openEnded[0].length;
    } else if (rangePair) {
      min = parseInt(rangePair[1], 10);
      max = parseInt(rangePair[2], 10);
      bandTokenStart = rangePair.index;
      bandTokenEnd = rangePair.index + rangePair[0].length;
    } else {
      // A table with no parseable band token in its heading -- nothing to
      // check it against, skip rather than guess.
      continue;
    }

    // Collect this table's own rows (starting right after the separator
    // row) until a line that is not itself a table row.
    const rows = {};
    let k = headerIdx + 2;
    while (k < lines.length) {
      const rowMatch = lines[k].match(tableRowPattern);
      if (!rowMatch) break;
      rows[rowMatch[1]] = parseInt(rowMatch[2], 10);
      k++;
    }

    // bandTokenStart/bandTokenEnd is the character span, within headingLine,
    // consumed by the bounds token itself (e.g. "5+" or "2-4"). Kept so
    // downstream parsing of the heading's leading "N tags" count (T-022)
    // can tell the bounds digits apart from the count digits even when a
    // reworded heading places them close together.
    bands.push({ headingLine, min, max, rows, bandTokenStart, bandTokenEnd });
  }

  return bands;
}

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
// Guard the remaining corpus-derived cardinalities in the Tag vocabulary
// section that the tests above do not touch:
//
//   - line 57 / 65: each band table heading also states, up front, HOW MANY
//     tags belong to that band (e.g. "4 tags have a robust pool (5+
//     entries):", "12 tags appear 2-4 times:"). The band-table test above
//     only checks that the table's ROWS match the corpus set for that band's
//     numeric range -- it never looks at this leading count, so editing it
//     to a wrong number while leaving the table's rows untouched was
//     previously undetected.
//
//   - line 55: the section's opening sentence states, in prose, how many
//     tags appear on 2-or-more entries and how many appear on exactly one
//     entry. The "exactly one" figure here is a SEPARATE textual claim from
//     the "tags appear exactly once" figure later in the section (line 81,
//     already guarded) -- the two could be made to disagree with each other
//     while this one stayed unchecked.
//
// Every expected number below is derived from `corpus` at test time, never
// hardcoded. Extraction is keyed to the digits plus the minimal structural
// tokens that carry their mathematical meaning ("tags" immediately after
// the band-heading count; "or more" / "exactly one" for the prose claims),
// never to the surrounding descriptive wording, so rewording "have a robust
// pool" to "have a deep pool", "appear" to "occur", or "They are not evenly
// distributed:" to anything else must not change whether this guard fires.
// ---------------------------------------------------------------------------

test('README band table headings must state the correct count of tags in their band', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const tagVocabSection = getTagVocabSection(readmeContent);
  const tagsInCorpus = countTagsInCorpus();

  const bands = extractBandTablesFromReadme(tagVocabSection);
  assert(bands.length > 0, 'expected at least one parseable band table (heading with an N+ or N-M token, followed by a | Tag | Count | table) in the Tag vocabulary section');

  for (const band of bands) {
    // The band's stated "N tags ..." count, found anywhere on the heading
    // line -- NOT anchored to the start (T-022: a descriptive lead-in
    // phrase, e.g. "Well-populated: 4 tags carry 5+ entries each.", must be
    // free to precede it). Scan every "<digits> tags" occurrence in the
    // line and take the first one whose digit run does NOT fall inside the
    // span already claimed by the band's own bounds token (the "5+" or
    // "2-4" parsed above as bandTokenStart/bandTokenEnd).
    //
    // Reading chosen for the digits-vs-digits hazard: the bounds token and
    // the count token are different numbers in the same line, both matched
    // by digit-based regexes, so a naive "first N-tags-shaped match wins"
    // parse could be fooled by a reworded heading that happens to land the
    // word "tags" right after the bounds token (e.g. "... 2-4 tags per
    // band, 12 tags total qualify:" -- a naive scan would read the count as
    // 4, not 12). Excluding any match whose digits overlap the bounds
    // token's own character span closes that hole without keying the count
    // extraction to any particular lead-in wording.
    const countPattern = /(\d+)\s+tags\b/g;
    let candidateMatch;
    let leadingCountMatch = null;
    while ((candidateMatch = countPattern.exec(band.headingLine)) !== null) {
      const digitStart = candidateMatch.index;
      const digitEnd = candidateMatch.index + candidateMatch[1].length;
      const overlapsBandToken = digitStart < band.bandTokenEnd && digitEnd > band.bandTokenStart;
      if (!overlapsBandToken) {
        leadingCountMatch = candidateMatch;
        break;
      }
    }
    assert(
      leadingCountMatch,
      'could not parse a "N tags" count (distinct from the band\'s own bounds token) from band heading "' +
        band.headingLine.trim() + '" -- this claim must fail loud, not pass silently, when it cannot be parsed'
    );
    const statedBandCount = parseInt(leadingCountMatch[1], 10);

    // Derived independently from the corpus using this band's own [min, max]
    // bounds (themselves parsed from the OTHER digits in the same heading,
    // e.g. the "5+" or "2-4" token) -- not from the table's rows, so this
    // cannot degenerate into checking the README against itself.
    const expectedBandCount = Object.keys(tagsInCorpus)
      .filter(tag => tagsInCorpus[tag] >= band.min && tagsInCorpus[tag] <= band.max)
      .length;

    assert.equal(
      statedBandCount,
      expectedBandCount,
      'Band heading "' + band.headingLine.trim() + '" states ' + statedBandCount +
        ' tags, but the corpus has ' + expectedBandCount + ' tags with count in [' +
        band.min + ', ' + (band.max === Infinity ? 'inf' : band.max) + ']'
    );
  }
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

// Helper: within a block of text, split on em/en dashes (the punctuation
// this README actually uses to set off parenthetical asides -- see the
// Attribution section's "... to be wrong -- 8 are rated HIGH -- and says
// ..." construction) and, in whichever dash-delimited clause contains
// `marker`, return the digit run closest to (immediately preceding) that
// marker. This is keyed to the marker word/token that carries the claim's
// actual meaning ("entries", "HIGH"), never to the verb or descriptive
// prose around it, so rewording "ranks all 50 entries" to "catalogs all 50
// entries" or "8 are rated HIGH" to "8 fall into the HIGH tier" leaves the
// extraction unaffected. Returns null (never a wrong number) if the marker
// cannot be found anywhere, so callers can fail loud on a parse miss
// instead of silently comparing null-derived data.
function extractNearestPrecedingCount(text, markerPattern) {
  const clauses = text.split(/[–—]/); // en dash, em dash
  for (const clause of clauses) {
    const markerIdx = clause.search(markerPattern);
    if (markerIdx === -1) continue;
    const before = clause.slice(0, markerIdx);
    const digitMatches = before.match(/\d+/g);
    if (digitMatches && digitMatches.length > 0) {
      return parseInt(digitMatches[digitMatches.length - 1], 10);
    }
  }
  return null;
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

test('README Attribution section corpus-size claim must match corpus.length (C1)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const attributionSection = getAttributionSection(readmeContent);

  const statedEntries = extractNearestPrecedingCount(attributionSection, /\bentries\b/);
  assert(
    statedEntries !== null,
    'could not find a "<N> entries" claim in the Attribution section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );

  assert.equal(
    statedEntries,
    corpus.length,
    'README Attribution section states the triage doc ranks ' + statedEntries +
      ' entries, but corpus.length is ' + corpus.length
  );
});

test('README Attribution section HIGH-risk count must match the triage doc table (C2)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const attributionSection = getAttributionSection(readmeContent);

  const statedHigh = extractNearestPrecedingCount(attributionSection, /\bHIGH\b/);
  assert(
    statedHigh !== null,
    'could not find a "<N> are rated HIGH" claim in the Attribution section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );

  const triagePath = path.join(__dirname, '..', 'docs', 'corpus-attribution-triage.md');
  const triageContent = fs.readFileSync(triagePath, 'utf8');
  const riskRows = parseTriageRiskRows(triageContent);
  assert(
    riskRows.length > 0,
    'could not parse any rows out of the docs/corpus-attribution-triage.md Risk table -- ' +
      'the table shape may have changed; this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const actualHigh = riskRows.filter(risk => risk === 'HIGH').length;

  assert.equal(
    statedHigh,
    actualHigh,
    'README Attribution section states ' + statedHigh + ' entries are rated HIGH, but ' +
      'docs/corpus-attribution-triage.md has ' + actualHigh + ' rows rated HIGH'
  );
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

// Helper: return the "### `--list` behaviour" section's raw text (heading
// through the line before the next "### " or "## " heading, whichever
// comes first). Located by the heading token itself, not by any prose
// sentence underneath it.
function getListBehaviourSection(readmeContent) {
  const headingPattern = /^### `--list` behaviour\s*$/m;
  const headingMatch = headingPattern.exec(readmeContent);
  assert(headingMatch, 'README must have a "### `--list` behaviour" section');
  const start = headingMatch.index;

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
