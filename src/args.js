'use strict';

// Pure CLI argument parser for aphorism-cli.
// No I/O, no process.exit — parseArgs() always returns a plain object,
// never throws, and reports malformed usage via the `error` field.

const HELP = `Usage: aphorism [options]

Options:
  --author <name>  filter by author (substring match, case-insensitive)
  --tag <tag>      filter by tag (whole-tag, case-insensitive)
  --seed <n>       deterministic pick using seed n
  --list           list all matching aphorisms, one per line
  --json           output as JSON (single line, or NDJSON with --list)
  -h, --help       show this help and exit
`;

const VALUE_FLAGS = {
  '--author': 'author',
  '--tag': 'tag',
  '--seed': 'seed',
};

const BOOL_FLAGS = {
  '--list': 'list',
  '--json': 'json',
  '--help': 'help',
  '-h': 'help',
};

// A token "looks like a flag" if it's `-h` or starts with `--`. This is used
// to decide whether a value-flag was given no value (its next token is
// itself a flag) without misclassifying things like a negative --seed value
// (e.g. `-5`) as a flag.
function looksLikeFlag(token) {
  return token === '-h' || token.startsWith('--');
}

function makeResult() {
  return {
    author: undefined,
    tag: undefined,
    seed: undefined,
    list: false,
    json: false,
    help: false,
    error: undefined,
  };
}

function parseSeedValue(raw) {
  if (raw === '' || raw.trim() === '') return { ok: false };
  const n = Number(raw);
  if (Number.isNaN(n)) return { ok: false };
  return { ok: true, value: n };
}

function parseArgs(argv) {
  const result = makeResult();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (typeof arg !== 'string' || !arg.startsWith('-')) {
      result.error = `unexpected argument: ${arg}`;
      return result;
    }

    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      const flag = arg.slice(0, eqIdx);
      const value = arg.slice(eqIdx + 1);

      if (!(flag in VALUE_FLAGS)) {
        result.error = `unknown flag: ${flag}`;
        return result;
      }

      if (value === '') {
        result.error = `flag ${flag} requires a value`;
        return result;
      }

      if (flag === '--seed') {
        const parsed = parseSeedValue(value);
        if (!parsed.ok) {
          result.error = `flag --seed requires a numeric value`;
          return result;
        }
        result.seed = parsed.value;
      } else {
        result[VALUE_FLAGS[flag]] = value;
      }
      continue;
    }

    if (arg in BOOL_FLAGS) {
      result[BOOL_FLAGS[arg]] = true;
      continue;
    }

    if (arg in VALUE_FLAGS) {
      const next = argv[i + 1];
      if (next === undefined || looksLikeFlag(next)) {
        result.error = `flag ${arg} requires a value`;
        return result;
      }

      if (arg === '--seed') {
        const parsed = parseSeedValue(next);
        if (!parsed.ok) {
          result.error = `flag --seed requires a numeric value`;
          return result;
        }
        result.seed = parsed.value;
      } else {
        result[VALUE_FLAGS[arg]] = next;
      }
      i++;
      continue;
    }

    result.error = `unknown flag: ${arg}`;
    return result;
  }

  return result;
}

module.exports = { parseArgs, HELP };
