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

// Helper: does `line` itself carry a parseable band token (an "N+" or
// "N<dash>M" shape)? Used below to tell an ordinary prose sentence apart
// from what is plausibly ANOTHER band heading, so the heading-to-table scan
// knows where it must stop rather than reading through it.
function lineHasBandToken(line) {
  return /(\d+)\s*\+/.test(line) || /(\d+)\s*[-‐‑‒–—―]\s*(\d+)/.test(line);
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
  const lines = sectionText.split('\n');
  const tableRowPattern = /\| `([a-z]+)` \| (\d+) \|/;
  const headerRowPattern = /^\|\s*Tag\s*\|\s*Count\s*\|\s*$/;
  const bands = [];

  for (let i = 0; i < lines.length; i++) {
    const headingLine = lines[i];

    // Between the heading and its table's `| Tag | Count |` header row,
    // tolerate any number of blank lines AND any number of ordinary prose
    // lines (e.g. "See the table below.") -- idiomatic markdown may put a
    // lead-in sentence there (T-025). What the scan will NOT read through is
    // a line that itself looks like another band heading (carries its own
    // "N+" / "N-M" token, per lineHasBandToken): that is the one shape a
    // real heading-to-table gap is never expected to contain, and it is
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
      if (lineHasBandToken(lines[idx])) {
        break; // looks like another band heading -- stop, no table for this one
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
    '4 tags have a robust pool (5+ entries):',
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
    '4 tags have a robust pool (5+ entries):',
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
    '4 tags have a robust pool (5+ entries):',
    '',
    'The table for this band was removed by mistake.',
    '',
    '12 tags appear 2-4 times:',
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
// ..." construction) and return the digit binding for EVERY occurrence of
// `marker` anywhere in the text -- not just the first clause that contains
// one, and not just the first (or last) occurrence within a clause.
//
// Why "every occurrence", not "first" or "last": a README that states a
// count once correctly and once incorrectly is self-contradictory, and a
// reader trusts whichever occurrence they happen to read. Binding to only
// one position (first OR last) makes the guard's behaviour depend on which
// of two contradictory claims happens to appear earlier in the prose --
// that is a hole, not a fix, no matter which position wins. Collecting
// every occurrence and later requiring ALL of them to agree with the truth
// (see the two C1/C2 tests below) is symmetric in document order: it does
// not matter whether the true claim or the false one comes first.
//
// Digit-window scoping, decided deliberately: each occurrence's bound digit
// is the nearest preceding digit run WITHIN THAT OCCURRENCE'S OWN CLAUSE,
// searched only up to that occurrence's own position (not the whole
// clause). Two things this rules out:
//   - Scoping to the whole SECTION (not the clause) would let an unrelated
//     number from a different parenthetical aside bind to this marker.
//   - Scoping each occurrence to "nearest digit anywhere in the clause"
//     (rather than "nearest digit before THIS occurrence") would make two
//     occurrences of the same marker within one clause re-bind the SAME
//     digit run instead of two different ones -- e.g. "8 are rated HIGH
//     and 9 are rated HIGH" must yield bindings [8, 9], not [8, 8] (which
//     would hide the fact that the clause states two different numbers).
//     Advancing the window to "up to this occurrence's own index" is what
//     keeps the second HIGH from grabbing the first HIGH's digit.
//
// Keyed to the marker word/token that carries the claim's actual meaning
// ("entries", "HIGH"), never to the verb or descriptive prose around it, so
// rewording "ranks all 50 entries" to "catalogs all 50 entries" or "8 are
// rated HIGH" to "8 fall into the HIGH tier" leaves the extraction
// unaffected.
//
// Returns an array of { value, context } bindings -- context is the
// trimmed, whitespace-collapsed clause the binding came from, kept so a
// mismatch assertion can tell a reader WHICH sentence in their README holds
// which number, not merely that two numbers disagree. A marker occurrence
// with no preceding digit in its own clause contributes no binding (it is
// not evidence either way -- mirrors the previous null-return for an
// unparseable clause). An empty return means the marker never occurred
// anywhere with a bindable digit, which callers must treat as a loud parse
// failure, never a silent pass.
//
// KNOWN BOUNDARY (T-031, measured, deliberately NOT closed): clause-scoping
// means a marker occurrence with no digit in ITS OWN clause "contributes no
// binding" (previous paragraph) even when a digit sits just across the dash,
// in the ADJACENT clause -- e.g. "A later note records 9 -- HIGH entries --
// in total." splits into ["...records 9 ", " HIGH entries ", " in total."];
// neither "HIGH" nor "entries" has a preceding digit in its own clause, so
// this contradictory, entirely fabricated claim binds NOTHING and is
// silently skipped rather than caught -- confirmed still true as of this
// writing (README stays green with that sentence appended). The same
// sentence written with ASCII "--" instead of em/en dashes IS caught,
// because "--" is not a clause boundary here and the whole sentence stays in
// one clause with its digit.
//
// This was investigated as a possible fix, not just accepted on faith: two
// candidate widenings were built and run against the corpus of README
// mutations below, and BOTH were rejected because both broke true prose:
//   1. Unconditionally fall back to the previous clause's trailing digit
//      when the current clause has none. Catches the hole above, but also
//      turns "Some entries -- flagged HIGH by the triage doc -- are still
//      under review" into a false C1 failure: "entries" (no count stated at
//      all) grabs the unrelated "8" that belongs to the HIGH clause next to
//      it, and the assertion reports a fabricated contradiction that isn't
//      in the text.
//   2. Same, but only fall back if the previous clause has no marker
//      occurrence of its own (so a digit already "spoken for" by its own
//      clause's claim can't also be borrowed by a neighbor). Still catches
//      the hole, but still breaks true prose: "The triage doc was rewritten
//      in 2019 -- HIGH standards apply to every entry reviewed since -- and
//      remains in force today" turns the unrelated year 2019 into a false
//      C2 failure, because 2019's own clause has no marker in it either, so
//      heuristic (2) waves it through as a legitimate cross-clause donor.
// Both failures are the exact hazard the "digit-window scoping" paragraph
// above was already written to prevent (an unrelated number from a
// different parenthetical aside binding to this marker) -- crossing the
// clause boundary to catch the far-side-of-the-dash contradiction and
// avoiding that hazard turned out to be the same request. No fix was found
// that catches the T-031 shape without also rejecting correct READMEs, so
// none is applied here. If you are tempted to narrow this further, first
// write down the true-prose case your narrowing would newly reject -- this
// guard family's history (see repo history around T-016 through T-030) is
// that every previous narrowing bought exactly one new false rejection, and
// eventually the accumulated false-rejection cost is what gets a guard like
// this deleted outright. A silent miss on a self-contradictory README is a
// real gap, not a non-issue -- it is being left open, on the record, as a
// documented limit of a dash/digit-proximity heuristic rather than patched
// into a new false positive.
function collectMarkerBindings(text, markerPattern) {
  const clauses = text.split(/[–—]/); // en dash, em dash
  const globalMarker = new RegExp(
    markerPattern.source,
    markerPattern.flags.includes('g') ? markerPattern.flags : markerPattern.flags + 'g'
  );
  const bindings = [];

  for (const clause of clauses) {
    globalMarker.lastIndex = 0;
    let match;
    while ((match = globalMarker.exec(clause)) !== null) {
      const before = clause.slice(0, match.index);
      const digitMatches = before.match(/\d+/g);
      if (digitMatches && digitMatches.length > 0) {
        bindings.push({
          value: parseInt(digitMatches[digitMatches.length - 1], 10),
          context: clause.trim().replace(/\s+/g, ' '),
        });
      }
      // Defensive only: markerPattern here is always \b-anchored, so
      // matches are never zero-width, but guard against an infinite loop
      // regardless.
      if (globalMarker.lastIndex === match.index) globalMarker.lastIndex++;
    }
  }

  return bindings;
}

// Helper: turn a set of bindings (from collectMarkerBindings) and the
// independently-derived true value into an assertion message that NAMES the
// wrong number(s), rather than just reporting "mismatch". Handles both
// shapes a reader can hit:
//   - one binding is right, another is wrong -- names the wrong one(s) and
//     says they contradict the true value.
//   - EVERY binding is wrong (including the case where two bindings
//     disagree with each other and neither happens to equal the truth) --
//     says plainly that none of the stated figures match, and lists all of
//     them, so a reader is not told "matches nothing" without being told
//     what the nothing was.
function formatBindingMismatch(bindings, truth, subjectLabel) {
  const wrongBindings = bindings.filter((b) => b.value !== truth);
  const correctCount = bindings.length - wrongBindings.length;
  const wrongList = wrongBindings
    .map((b) => b.value + ' (in "...' + b.context + '...")')
    .join(', and also as ');

  if (correctCount > 0) {
    return (
      'README Attribution section states ' + subjectLabel + ' as ' + truth +
      ' in one place, but ALSO states it as ' + wrongList + ' elsewhere -- these contradict ' +
      'each other; the true value is ' + truth
    );
  }
  return (
    'README Attribution section states ' + subjectLabel + ' as ' + wrongList +
    ' -- NONE of these match the true value: ' + subjectLabel + ' is ' + truth
  );
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

  const bindings = collectMarkerBindings(attributionSection, /\bentries\b/);
  assert(
    bindings.length > 0,
    'could not find a "<N> entries" claim in the Attribution section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );

  // ALL occurrences of the claim must agree with corpus.length -- not just
  // whichever one appears first or last in the section (see
  // collectMarkerBindings above for why picking a position is disqualified).
  const wrongBindings = bindings.filter((b) => b.value !== corpus.length);
  assert.equal(
    wrongBindings.length,
    0,
    formatBindingMismatch(bindings, corpus.length, 'the corpus-size ("entries") claim')
  );
});

test('README Attribution section HIGH-risk count must match the triage doc table (C2)', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const attributionSection = getAttributionSection(readmeContent);

  const bindings = collectMarkerBindings(attributionSection, /\bHIGH\b/);
  assert(
    bindings.length > 0,
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

  // ALL occurrences of the claim must agree with the triage doc's actual
  // HIGH count -- not just whichever one appears first or last in the
  // section (see collectMarkerBindings above for why picking a position is
  // disqualified).
  const wrongBindings = bindings.filter((b) => b.value !== actualHigh);
  assert.equal(
    wrongBindings.length,
    0,
    formatBindingMismatch(bindings, actualHigh, 'the HIGH-risk count claim')
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
