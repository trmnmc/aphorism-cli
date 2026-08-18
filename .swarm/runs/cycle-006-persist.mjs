// Cycle 6 persist: QA-full return artifact + backlog + state updates.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const SW = '/opt/targets/aphorism-cli/.swarm';
const atomic = (p, obj) => {
  writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2));
  renameSync(p + '.tmp', p);
};

// ---------- 1. the QA return artifact (qa-verify.js return shape) ----------
const qa = {
  runId: 'cycle-006-qa-full-direct-agent',
  mode: 'full',
  instrument: 'DIRECT AGENT FALLBACK, not workflows/qa-verify.js. This is a headless `-p` cycle (pacer-spawned), where the Workflow tool is review-gated; SKILL.md RESUME prescribes direct Agent calls as the documented fallback. Stage deviations are recorded per stage below.',
  scenarios: [
    { id: 'S1', title: '--list + --author filter + valid seed: seed ignored, EM DASH line format' },
    { id: 'S2', title: '--json --seed Infinity --tag design: deterministic single-line object' },
    { id: 'S3', title: 'NEGATIVE: --tag desi must not substring-match design; empty set is exit 1, stderr only' },
    { id: 'S4', title: 'NEGATIVE: unparseable --seed under --list is still bad usage (exit 2)' }
  ],
  results: [
    { scenario_id: 'S1', status: 'pass', actual: 'exit 0/0; stderr empty both runs; stdout byte-identical across --seed 7 and --seed 99; 7 lines; every line exactly one " U+2014 " separator; every author segment contains "dijk"; no hyphen-minus or en-dash separator anywhere', evidence: 'conductor-run, .swarm/runs/cycle-006-qa-verify.txt' },
    { scenario_id: 'S2', status: 'pass', actual: 'exit 0; stderr empty; stdout byte-identical across two identical runs; exactly 1 stdout line; parses as JSON with text/author/tags, tags is an array containing "design"; discriminator: -Infinity also exits 0 AND selects a DIFFERENT entry than Infinity, so the non-finite branch is not degenerate', evidence: 'conductor-run, .swarm/runs/cycle-006-qa-verify.txt' },
    { scenario_id: 'S3', status: 'pass', actual: 'exit 1 exactly; stdout exactly 0 bytes; stderr 44 bytes "aphorism: no aphorism matches those filters"', evidence: 'conductor-run, .swarm/runs/cycle-006-qa-verify.txt' },
    { scenario_id: 'S4', status: 'pass', actual: 'exit 2 exactly; stdout 0 bytes (listing NOT printed); stderr 47 bytes "aphorism: flag --seed requires a numeric value"; control: bare --list exits 0 with 50 lines, so the suppression is specific to the usage error', evidence: 'conductor-run, .swarm/runs/cycle-006-qa-verify.txt' }
  ],
  look: {
    findings: [
      {
        severity: 'medium',
        severity_note: 'Agent claimed HIGH on the stated mechanism "--list | head -1 only survives by luck because 50 lines fit the 64KB pipe buffer". CONDUCTOR RE-SCORED to medium: that mechanism is WRONG. head -1, head -5, sed 1q, grep -q and wc -l are all measured CLEAN. The crash needs a consumer that closes the pipe WITHOUT reading at all.',
        where: 'bin/aphorism.js:28,43,48 — process.stdout.write with no error handler',
        expected: 'A Unix filter whose consumer closes early exits quietly (SIGPIPE convention), emitting no diagnostics.',
        found: "Unhandled 'error' event: 1006 bytes of raw Node internals (stack frames, errno -32, Node version banner) on stderr.",
        reproduced: true,
        repro_output: 'CRASH err_bytes=1006: `node bin/aphorism.js --list | true`; `node bin/aphorism.js | true`; `node bin/aphorism.js --list | head -0`; CRASH err_bytes=1045: `node bin/aphorism.js --list | /nonexistent-cmd-xyz`. CLEAN (err_bytes=0): head -1, head -5, sed 1q, grep -q match, grep -q no-match, wc -l, --list --json | head -2.',
        trigger_class: 'Consumer closes the pipe without reading. Most realistic real-world instance: the downstream command fails to exec.'
      },
      {
        severity: 'medium',
        where: 'bin/aphorism.js — same missing stdout error handler; README exit-code table',
        expected: 'A failed stdout write reports in the tool\'s own "aphorism: ..." convention with an exit code distinct from the documented "no match".',
        found: 'Same unhandled-error crash (ENOSPC stack trace) AND exit code 1, which the README defines as "no aphorism matched the given filters". A script checking for exit 1 concludes its filter matched nothing when the disk was actually full.',
        reproduced: true,
        repro_output: 'stdout redirected to /dev/full: exit=1, stderr = "Error: ENOSPC: no space left on device, write" + full Node stack.'
      },
      {
        severity: 'low',
        where: 'src/corpus.js — the Saint-Exupery entry (line 42 of --list output)',
        expected: 'Antoine de Saint-Exupéry (U+00E9)',
        found: 'Antoine de Saint-Exupery — plain ASCII "e". Discriminator run: the corpus contains ZERO U+00E9 anywhere, while EM DASH U+2014 is present throughout, so UTF-8 transport works and this is a data-entry error, not an encoding limit.',
        reproduced: true,
        repro_output: 'codepoints around "Exup": E=U+0045 x=U+0078 u=U+0075 p=U+0070 e=U+0065 r=U+0072 y=U+0079 | corpus contains any U+00E9: false | corpus contains U+2014: true'
      },
      {
        severity: 'low',
        where: 'src/args.js:55 (parseSeedValue) vs SPEC.md Domain rules, Selection clause',
        expected: 'Per the locked Domain rule, "--seed accepts any value that Number() parses to a non-NaN number". Number("") === 0 and Number("   ") === 0, both non-NaN, so both should be accepted as seed 0.',
        found: 'parseSeedValue rejects empty and whitespace-only values with an EXPLICIT guard placed BEFORE the Number() check (`if (raw === "" || raw.trim() === "") return { ok: false }`), so `--seed ""` exits 2. Deliberate implementation choice contradicting the literal clause — not an accidental bug.',
        reproduced: true,
        repro_output: '`--seed "" --json` -> exit 2, "aphorism: flag --seed requires a numeric value". Control: `--seed 0` -> exit 0. Control: `--seed " 5 "` produces output byte-identical to `--seed 5` (exit 0), so whitespace-PADDED values ARE accepted; only empty/whitespace-only are not.',
        adjudication: 'RULING QUESTION, not a defect to fix blind. The spec text decides it (non-NaN => accept), but "--seed \\"\\"" is also arguably "missing flag argument" (exit 2 per the Exit codes clause), and rejecting it is friendlier when a script passes an unset $SEED. A human must rule. Routed to Q-3, cross-referenced to J-7.'
      }
    ],
    unconfirmed: [
      '`--` rejected as "unknown flag: --" rather than treated as end-of-options. Tool takes no positional args, so arguably fine; convention question, not a defect.',
      'Seeds 0-49 map to only 27 distinct aphorisms (~32 expected under uniform hashing); all 50 entries confirmed reachable within seeds 0-599. No wrongness demonstrated — within plausible variance.'
    ],
    clean_surfaces_probed: 'Exit codes 0/1/2 match the README table; errors never reach stdout (redirected stdout stays 0 bytes on no-match); --help on stdout; exactly one trailing newline in text/JSON/list/NDJSON modes (verified with od); all 50 NDJSON lines parse; tag vocabulary and counts match the README tables; unseeded runs genuinely random (27 distinct in 40 draws); duplicate flags last-wins; --author=value syntax works; AND composition works; no ANSI/TTY-dependent output; correct from a foreign cwd.',
    screenshots: [],
    server_log_tail: null
  },
  taste: null,
  agents_used: 2,
  agent_roles: 'author (fable, spec-blind), live-look (fable). Executor stage run BY THE CONDUCTOR rather than a sonnet agent — see instrument note.',
  dead_agents: [],
  timestamp: 1787032699
};
atomic(`${SW}/runs/cycle-006-qa.json`, qa);

// ---------- 2. backlog ----------
const bl = JSON.parse(readFileSync(`${SW}/backlog.json`, 'utf8'));
const base = { deps: [], attempts: 0, filed_cycle: 6, packages: [], value: 'M' };
const add = [
  {
    ...base, id: 'Q-1', kind: 'fix', status: 'todo', priority: 2, effort: 'S',
    model: 'sonnet', owner: 'conductor', files_hint: ['bin/aphorism.js'],
    covers: 'KI-31',
    title: 'stdout write errors crash with raw Node internals; ENOSPC also collides with the "no match" exit code',
    acceptance: 'BOTH clauses, one root cause (bin/aphorism.js writes to process.stdout with no error handler). (1) When the consumer closes the pipe without reading, the tool exits QUIETLY: zero bytes on stderr, no Node stack trace, no "Unhandled \'error\' event" banner. Measured against the four triggers that currently crash — `--list | true`, `| true`, `--list | head -0`, `--list | /nonexistent-cmd-xyz` — each of which today emits 1006-1045 bytes. (2) A stdout write that fails for a NON-EPIPE reason (reproduce with stdout redirected to /dev/full) must NOT exit 1, because README defines exit 1 as "no aphorism matched"; it reports in the tool\'s own "aphorism: ..." one-line convention on stderr with a distinct non-zero code, and emits no raw stack trace. (3) CONTROLS that must stay green and unchanged: `--list | head -1`, `--list | head -5`, `--list | sed 1q`, `--list | grep -q .`, `| wc -l`, `--list --json | head -2` are all clean today and must remain byte-for-byte clean; the full suite (currently 102 tests) still passes; exit codes 0/1/2 on the normal paths are unchanged.',
    notes: 'From the cycle-6 QA live-look, conductor-reproduced. Agent scored this HIGH on the reasoning that "--list | head -1 only survives by luck"; the conductor MEASURED that claim FALSE (head -1 is clean) and re-scored to medium. Fix the defect, not the agent\'s severity story. New tests here are measured-survivor tests: the four crashing triggers are the mutants, the six clean pipelines are the must-stay-green controls.'
  },
  {
    ...base, id: 'Q-2', kind: 'fix', status: 'todo', priority: 5, effort: 'S', value: 'S',
    model: 'sonnet', owner: 'conductor', files_hint: ['src/corpus.js'],
    title: 'Corpus attribution "Antoine de Saint-Exupery" is missing its acute accent',
    acceptance: 'The attribution reads "Antoine de Saint-Exupéry" with U+00E9, verified by codepoint (not by eye) in the output of `node bin/aphorism.js --list`. The entry\'s text, tags and corpus POSITION are unchanged — this is a one-character repair, NOT corpus expansion (a run non-goal). The suite still passes, and any test asserting the old ASCII spelling is updated as part of the same change rather than left failing.',
    notes: 'Cycle-6 QA live-look, conductor-reproduced by codepoint dump. Discriminator: the corpus contains zero U+00E9 anywhere while U+2014 is present throughout, proving UTF-8 transport works and this is data entry, not encoding. In scope: the run mandate is "measure, repair, document"; repairing an existing entry is not expansion.'
  },
  {
    ...base, id: 'Q-3', kind: 'docs', status: 'blocked', priority: 6, effort: 'S',
    model: 'sonnet', owner: 'human:repo-maintainer', files_hint: ['.swarm/SPEC.md'],
    covers: 'KI-32',
    title: 'A human must rule: is `--seed ""` a valid seed 0, or a missing argument? Spec and shipped behaviour disagree',
    acceptance: 'A human rules, and the ruling is written into SPEC.md as an explicit clause EITHER WAY. The conflict, both sides measured: the Domain rules Selection clause says "--seed accepts any value that Number() parses to a non-NaN number", and Number("") === 0 (non-NaN), so the literal spec ACCEPTS `--seed ""` as seed 0. The shipped code refuses it at src/args.js:55 with a guard placed deliberately BEFORE the Number() check, exiting 2. The Exit codes clause also lists "missing flag argument" as exit 2, and `--seed ""` is arguably that. Neither reading is unreasonable: literal compliance says accept; ergonomics says a script passing an unset $SEED is better off with a loud error than a silent seed 0. Note the measured asymmetry the ruling must cover: whitespace-PADDED values ARE accepted today (`--seed " 5 "` is byte-identical to `--seed 5`), so only empty and whitespace-ONLY are refused. BLOCKED ON A HUMAN by construction — the swarm must not pick a side on a locked spec clause. If the ruling is "accept", it becomes a normal fix item; if "reject", the Domain rule gets an explicit carve-out sentence.',
    notes: 'Cycle-6 QA live-look, conductor-reproduced with controls. Joins the same human-owned ruling set as J-7 (four other unspecified CLI behaviours); kept separate because this one is a CONTRADICTION with a locked clause, whereas J-7\'s four are silences.'
  }
];
bl.items.push(...add);
atomic(`${SW}/backlog.json`, bl);

// ---------- 3. state ----------
const st = JSON.parse(readFileSync(`${SW}/state.json`, 'utf8'));
st.cycle = 6;
st.phase = 'QA';
st.qa.last_full_qa_cycle = 6;
st.qa.full_qa_note_cycle_006 = 'QA FULL pass run as DIRECT AGENT calls, not workflows/qa-verify.js: this is a headless pacer-spawned `-p` cycle where the Workflow tool is review-gated, and SKILL.md RESUME prescribes direct Agent dispatch as the documented fallback. Two deviations from the script contract, both recorded and neither a weakening: (1) the spec-only author was isolated by giving it a byte-identical COPY of SPEC.md in a directory containing nothing else (sha256 b495c99f... verified equal to the original) plus an explicit no-other-file instruction, because the script achieves spec-blindness by passing spec_text inline and args must be literal; (2) the executor stage was run BY THE CONDUCTOR instead of a sonnet agent — for a CLI with no dev server the scenarios are plain invocations, so running them here yields conductor evidence directly rather than an agent claim the gate would have to re-verify anyway. Result: 4/4 scenarios PASS against a spec-derived answer key. The value came from the live-look, not the scenarios: 4 findings, all 4 conductor-reproduced, one agent severity claim measured FALSE and re-scored down.';
st.counters.verified_this_cycle = 4;
st.counters.consecutive_no_value = 0;
st.known_issues.push(
  {
    id: 'KI-31', severity: 'medium', opened_cycle: 6, owner: 'conductor',
    what: 'bin/aphorism.js writes to process.stdout (lines 28, 43, 48) with no error handler, so any stdout write failure surfaces as an unhandled \'error\' event: ~1006 bytes of raw Node internals on stderr. Two measured instances. (a) EPIPE when a consumer closes the pipe without reading — `--list | true`, `| true`, `--list | head -0`, `--list | /nonexistent-cmd-xyz`. Realistic trigger: the downstream command fails to exec. (b) ENOSPC on a failed write exits 1, the code README documents as "no aphorism matched", so a script mistakes a full disk for an empty filter result. NOT triggered by consumers that read at least one line: head -1, head -5, sed 1q, grep -q and wc -l are all measured clean.',
    settled_by: 'Backlog Q-1 (todo, priority 2). Handle stdout error events: exit quietly on EPIPE per Unix filter convention, and report other write failures in the tool\'s own one-line "aphorism: ..." convention with an exit code distinct from 1.'
  },
  {
    id: 'KI-32', severity: 'low', opened_cycle: 6, owner: 'human:repo-maintainer',
    what: 'The locked SPEC Domain rule ("--seed accepts any value that Number() parses to a non-NaN number") and the shipped code contradict each other for empty and whitespace-only seeds. Number("") === 0 is non-NaN so the clause accepts it; src/args.js:55 refuses it with a guard placed before the Number() check, exiting 2. Whitespace-PADDED values are accepted (`--seed " 5 "` === `--seed 5`), so the refusal is specific to empty/whitespace-only. Both readings are defensible, which is why this is a ruling and not a fix.',
    settled_by: 'Backlog Q-3 (blocked, human-owned). A human rules either way and the ruling is written into SPEC.md as an explicit clause. The swarm must not pick a side on a locked spec clause.'
  }
);
st.last_cycle = {
  cycle: 6, work: 'QA full pass (direct-agent fallback)', outcome: 'value',
  verified: '4/4 spec scenarios pass; 4/4 live-look findings conductor-reproduced; 3 backlog items + 2 known issues filed'
};
atomic(`${SW}/state.json`, st);

console.log('qa artifact + backlog(+3) + state written');
console.log('backlog counts:', JSON.stringify(bl.items.reduce((a, i) => (a[i.status] = (a[i.status] || 0) + 1, a), {})));
console.log('known_issues:', st.known_issues.length);
