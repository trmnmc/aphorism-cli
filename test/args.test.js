'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs, HELP } = require('../src/args.js');

test('zero args: no error, no filters set', () => {
  const result = parseArgs([]);
  assert.equal(result.error, undefined);
  assert.equal(result.author, undefined);
  assert.equal(result.tag, undefined);
  assert.equal(result.seed, undefined);
  assert.equal(result.list, false);
  assert.equal(result.json, false);
  assert.equal(result.help, false);
});

test('--author <name> sets author string', () => {
  const result = parseArgs(['--author', 'Ada Lovelace']);
  assert.equal(result.error, undefined);
  assert.equal(result.author, 'Ada Lovelace');
});

test('--author=<name> equals form sets author string', () => {
  const result = parseArgs(['--author=Ada Lovelace']);
  assert.equal(result.error, undefined);
  assert.equal(result.author, 'Ada Lovelace');
});

test('--tag <tag> sets tag string', () => {
  const result = parseArgs(['--tag', 'testing']);
  assert.equal(result.error, undefined);
  assert.equal(result.tag, 'testing');
});

test('--tag=<tag> equals form sets tag string', () => {
  const result = parseArgs(['--tag=testing']);
  assert.equal(result.error, undefined);
  assert.equal(result.tag, 'testing');
});

test('combined --author X --tag Y sets both', () => {
  const result = parseArgs(['--author', 'Kernighan', '--tag', 'debugging']);
  assert.equal(result.error, undefined);
  assert.equal(result.author, 'Kernighan');
  assert.equal(result.tag, 'debugging');
});

test('--seed <n> parses as a number', () => {
  const result = parseArgs(['--seed', '42']);
  assert.equal(result.error, undefined);
  assert.equal(result.seed, 42);
  assert.equal(typeof result.seed, 'number');
});

test('--seed=<n> equals form parses as a number', () => {
  const result = parseArgs(['--seed=7']);
  assert.equal(result.error, undefined);
  assert.equal(result.seed, 7);
  assert.equal(typeof result.seed, 'number');
});

test('--seed <n> accepts a negative number', () => {
  const result = parseArgs(['--seed', '-5']);
  assert.equal(result.error, undefined);
  assert.equal(result.seed, -5);
  assert.equal(typeof result.seed, 'number');
});

test('--seed=<n> equals form accepts a negative number', () => {
  const result = parseArgs(['--seed=-5']);
  assert.equal(result.error, undefined);
  assert.equal(result.seed, -5);
  assert.equal(typeof result.seed, 'number');
});

test('non-numeric --seed is a usage error', () => {
  const result = parseArgs(['--seed', 'banana']);
  assert.equal(typeof result.error, 'string');
  assert.match(result.error, /seed/i);
});

test('non-numeric --seed= equals form is a usage error', () => {
  const result = parseArgs(['--seed=banana']);
  assert.equal(typeof result.error, 'string');
  assert.match(result.error, /seed/i);
});

test('--list sets list: true', () => {
  const result = parseArgs(['--list']);
  assert.equal(result.error, undefined);
  assert.equal(result.list, true);
});

test('--json sets json: true', () => {
  const result = parseArgs(['--json']);
  assert.equal(result.error, undefined);
  assert.equal(result.json, true);
});

test('--help sets help: true', () => {
  const result = parseArgs(['--help']);
  assert.equal(result.error, undefined);
  assert.equal(result.help, true);
});

test('-h sets help: true', () => {
  const result = parseArgs(['-h']);
  assert.equal(result.error, undefined);
  assert.equal(result.help, true);
});

test('unknown flag is a usage error', () => {
  const result = parseArgs(['--bogus']);
  assert.equal(typeof result.error, 'string');
  assert.match(result.error, /bogus/i);
});

test('unknown short flag is a usage error', () => {
  const result = parseArgs(['-x']);
  assert.equal(typeof result.error, 'string');
});

test('--author missing value at end of argv is a usage error', () => {
  const result = parseArgs(['--author']);
  assert.equal(typeof result.error, 'string');
  assert.match(result.error, /author/i);
});

test('--tag missing value because next token is another flag is a usage error', () => {
  const result = parseArgs(['--tag', '--list']);
  assert.equal(typeof result.error, 'string');
  assert.match(result.error, /tag/i);
});

test('--seed missing value at end of argv is a usage error', () => {
  const result = parseArgs(['--seed']);
  assert.equal(typeof result.error, 'string');
  assert.match(result.error, /seed/i);
});

test('--author= with empty value is a usage error', () => {
  const result = parseArgs(['--author=']);
  assert.equal(typeof result.error, 'string');
});

test('a bare positional argument (not a flag) is a usage error', () => {
  const result = parseArgs(['wat']);
  assert.equal(typeof result.error, 'string');
});

test('parseArgs never throws on malformed input', () => {
  const inputs = [
    ['--author'],
    ['--tag'],
    ['--seed'],
    ['--seed', 'nope'],
    ['--bogus'],
    ['wat'],
    ['--author=', '--tag='],
    [],
  ];
  for (const argv of inputs) {
    assert.doesNotThrow(() => parseArgs(argv));
  }
});

test('absent options are undefined/false, never null', () => {
  const result = parseArgs([]);
  assert.notEqual(result.author, null);
  assert.notEqual(result.tag, null);
  assert.notEqual(result.seed, null);
  assert.equal(result.author, undefined);
  assert.equal(result.tag, undefined);
  assert.equal(result.seed, undefined);
});

test('HELP is a non-empty string mentioning every flag name', () => {
  assert.equal(typeof HELP, 'string');
  assert.ok(HELP.length > 0);
  for (const flag of ['--author', '--tag', '--seed', '--list', '--json', '--help', '-h']) {
    assert.ok(HELP.includes(flag), `HELP should mention ${flag}`);
  }
});

test('HELP fits comfortably on one 24-line terminal screen', () => {
  const lines = HELP.split('\n');
  assert.ok(lines.length <= 24, `HELP has ${lines.length} lines, expected <= 24`);
});
