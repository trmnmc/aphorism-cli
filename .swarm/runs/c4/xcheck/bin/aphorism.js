#!/usr/bin/env node
'use strict';

// Entry point. Thin by design: all logic lives in pure modules under src/, so the
// interesting behaviour is testable without spawning a process.

const { corpus } = require('../src/corpus.js');
const { filter, pick } = require('../src/select.js');
const { parseArgs, HELP } = require('../src/args.js');

const EXIT_OK = 0;
const EXIT_NO_MATCH = 1;
const EXIT_USAGE = 2;

function format(entry) {
  return `${entry.text}\n    — ${entry.author}`;
}

function main(argv) {
  const opts = parseArgs(argv);

  if (opts.error) {
    process.stderr.write(`aphorism: ${opts.error}\n`);
    return EXIT_USAGE;
  }

  if (opts.help) {
    process.stdout.write(HELP.endsWith('\n') ? HELP : `${HELP}\n`);
    return EXIT_OK;
  }

  const candidates = filter(corpus, { author: opts.author, tag: opts.tag });

  if (candidates.length === 0) {
    process.stderr.write('aphorism: no aphorism matches those filters\n');
    return EXIT_NO_MATCH;
  }

  if (opts.list) {
    const body = candidates
      .map((e) => (opts.json ? JSON.stringify(e) : `${e.text} — ${e.author}`))
      .join('\n');
    process.stdout.write(`${body}\n`);
    return EXIT_OK;
  }

  const chosen = pick(candidates, opts.seed);
  process.stdout.write(`${opts.json ? JSON.stringify(chosen) : format(chosen)}\n`);
  return EXIT_OK;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { main, format };
