// Reusable dashboard renderer for improvement run #8.
// L-043 (carry-forward clause): EVERY series is re-derived from the committed source on
// each pass. This script NEVER reads runs/dashboard.html back — the template is the only
// input. After writing, it MEASURES the rendered file and refuses to claim success on a
// count it did not observe.
import fs from 'node:fs';

const SWARM = '/opt/swarm';
const TPL = `${SWARM}/templates/dashboard.template.html`;
const OUT = `${SWARM}/runs/dashboard.html`;

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rf = JSON.parse(fs.readFileSync(`${SWARM}/runs/current.json`, 'utf8'));
const now = Math.floor(Date.now() / 1000);
const iso = e => new Date(e * 1000).toISOString().replace('T', ' ').slice(0, 16) + 'Z';

// ---- per-target state, re-derived from disk every pass -------------------------------
const targets = rf.targets.map(t => {
  const st = JSON.parse(fs.readFileSync(`${t.path}/.swarm/state.json`, 'utf8'));
  const bl = JSON.parse(fs.readFileSync(`${t.path}/.swarm/backlog.json`, 'utf8'));
  const ki = JSON.parse(fs.readFileSync(`${t.path}/.swarm/known-issues.json`, 'utf8'));
  const counts = (bl.items || []).reduce((a, i) => (a[i.status] = (a[i.status] || 0) + 1, a), {});
  return { t, st, bl, ki, counts };
});

// ---- journal one-liners: re-parsed from journal.md, never carried forward -------------
function journalLines(path, n) {
  const txt = fs.readFileSync(path, 'utf8');
  const heads = [...txt.matchAll(/^## (cycle .+)$/gm)].map(m => m[1]);
  return heads.slice(-n).reverse();
}

// ---- verification evidence: last <=3 fenced blocks under an evidence heading ----------
function evidence(path, n) {
  const txt = fs.readFileSync(path, 'utf8');
  const out = [];
  for (const m of txt.matchAll(/### (?:Baseline pinned|VERIFICATION EVIDENCE[^\n]*)\n+```\n([\s\S]*?)```/g)) out.push(m[1].trim());
  return out.slice(-n).reverse();
}

const T = targets[0];
const jl = journalLines(`${T.t.path}/.swarm/journal.md`, 8);
const ev = evidence(`${T.t.path}/.swarm/journal.md`, 3);
const b = rf.budget;

const RUN_TITLE = esc(`aphorism-cli — ${rf.run_label}`);
const STATUS_LINE = esc(
  `cycle ${T.st.cycle} · ${T.st.phase} · gear ${b.gear} ${b.mode} (ρ ${b.ratio}) · ` +
  `backlog ${T.counts.todo || 0} todo / ${T.counts.done || 0} done / ${T.counts.blocked || 0} blocked · ` +
  `known issues ${T.ki.issues.length} · stop ${iso(rf.stop_at)}`);

const STATS_HTML = [
  ['phase', T.st.phase], ['cycle', T.st.cycle],
  ['gear', `${b.gear} ${b.mode}`], ['ρ', b.ratio],
  ['todo', T.counts.todo || 0], ['blocked', T.counts.blocked || 0],
  ['known issues', T.ki.issues.length],
  // These are the RUN BASELINE at commit 20b7ede, not a live measurement. Labelled as such:
  // the suite is 128/128 at HEAD (W-7 consolidated one guard away in cycle 4, D-R8-18), and
  // an unlabelled "129/129" tile was quietly asserting a stale number as current.
  ['tests @baseline 20b7ede', `${T.st.baseline.test_pass}/${T.st.baseline.test_total}`],
  ['test:src lines @baseline', `${T.st.baseline.test_lines}:${T.st.baseline.src_lines}`],
  ['weekly used', `${b.weekly.weekly_used_pct}% @ ${b.weekly.week_elapsed_pct}% elapsed`],
  // Same defect class as KI-36: this tile hardcoded "trickle · 4% overall / 2% premium"
  // while runs/allocator.json read posture "normal", 3.147% overall, 0% premium. Derived now,
  // and UNKNOWN (never a confident default) when the file is missing or unreadable.
  ['allocator', (() => {
    try {
      const a = JSON.parse(fs.readFileSync(`${SWARM}/runs/allocator.json`, 'utf8'));
      return `${a.posture} · ${a.allow_overall_pct}% overall / ${a.allow_premium_pct}% premium · human ${a.human_projected_pct}% proj`;
    } catch { return 'UNKNOWN (runs/allocator.json unreadable)'; }
  })()],
  ['no-value streak', T.st.counters.consecutive_no_value],
].map(([k, v]) => `<div class="tile"><div class="tile-k">${esc(k)}</div><div class="tile-v">${esc(v)}</div></div>`).join('\n');

// Burn-up strip: one bar per cycle, height = cumulative verified / current backlog total
// (cycle.md step 8). KI-36 / D-R8-16: this block used to hardcode `const verified = 0`,
// `data-cycles="1"` and a `cycle 0 — 0 verified` title, then self-check itself against a
// constant `burnup_bars_expected: 1` — so it reported ok:true, 1-of-1 bars, and published
// a flat empty strip through five cycles and thirteen verified items. The self-check
// validating the renderer against its own hardcoded intent, rather than against the spec,
// is what let it survive. Both halves are fixed here: the series is DERIVED, and the
// self-check compares against the derived length.
//
// Source of truth is the structural field backlog.items[].updated_cycle on status:"done"
// items — never journal prose. Items done before that field was written were backfilled
// from the run's own commit bodies (see runs/_c6-backfill.py, which refuses to run if the
// done-count and the mapping disagree).
const doneItems = (T.bl.items || []).filter(i => i.status === 'done');
const undated = doneItems.filter(i => typeof i.updated_cycle !== 'number');
const perCycle = new Map();
for (const i of doneItems) {
  if (typeof i.updated_cycle === 'number') perCycle.set(i.updated_cycle, (perCycle.get(i.updated_cycle) || 0) + 1);
}
const total = Math.max(1, (T.counts.todo || 0) + (T.counts.done || 0));
const lastCycle = T.st.cycle;
let cum = 0;
const bars = [];
for (let c = 0; c <= lastCycle; c++) {
  cum += perCycle.get(c) || 0;
  bars.push({ c, cum, pct: Math.round((cum / total) * 100) });
}
const BURNUP_BARS = bars.length;
const TIMELINE_HTML =
  `<div class="burnup" data-cycles="${BURNUP_BARS}">` +
  bars.map(b2 => `<div class="burnup-bar" style="height:${b2.pct}%" title="cycle ${b2.c} — ${b2.cum} verified / ${total} live items (${b2.pct}%)"></div>`).join('') +
  `</div><p class="muted">burn-up: ${cum} verified of ${total} live items through cycle ${lastCycle}` +
  (undated.length ? ` · ${undated.length} done item(s) carry no cycle and are EXCLUDED from the series` : '') +
  ` · per cycle ${bars.filter(b2 => b2.c > 0).map(b2 => `c${b2.c}:${perCycle.get(b2.c) || 0}`).join(' ')}</p>`;

const STATIONS_HTML = jl.map(l => `<li>${esc(l)}</li>`).join('\n') || '<li>(no journal blocks yet)</li>';

const DECISIONS_HTML = (T.st.decisions || []).map(d =>
  `<li><b>${esc(d.id)}</b> <span class="muted">[${esc(d.kind)}, cycle ${esc(d.cycle)}]</span><br>${esc(d.text)}</li>`).join('\n');

const HERO_HTML = ev.length
  ? ev.map(e => `<pre class="evidence">${esc(e)}</pre>`).join('\n')
  : `<p class="muted">No verification evidence yet — cycle 0 is kickoff and verifies no work items.</p>`;
const HERO_CAPTION = esc(
  `Baseline pinned at 20b7ede; ${cum} of ${total} live items verified through cycle ${lastCycle}. ` +
  'The taste judge scored use-twice 4/10 at kickoff: for the eighth consecutive run the CLI ' +
  'gains nothing a user would notice. That is recorded, not argued away.');

// notify/control meta line — computed, or UNKNOWN if it cannot be computed (L-041).
// The key is `notify_topic`; an earlier pass of this renderer read `nt.topic`, got
// undefined, and rendered a CONFIDENT "notify on (…)" from a value it had never read —
// a parse failure in the PASSING direction. It now fails closed to UNKNOWN.
let NOTIFY_LINE;
try {
  const nt = JSON.parse(fs.readFileSync(`${SWARM}/.ntfy.json`, 'utf8'));
  const topic = nt.notify_topic;
  if (typeof topic !== 'string' || topic.length < 4) throw new Error('notify_topic unreadable');
  let ctl = 'control idle';
  try {
    const c = JSON.parse(fs.readFileSync(`${SWARM}/runs/control.json`, 'utf8'));
    const last = (c.applied || []).slice(-1)[0];
    ctl = `control: ${(c.pending || []).length} pending` + (last ? ` · last: ${last.verb} (cycle ${last.applied_cycle})` : '');
  } catch { /* no control file yet — lazy-init, genuinely idle */ }
  NOTIFY_LINE = esc(`notify on (…${topic.slice(-4)}) · ${ctl}`);
} catch (e) {
  // Distinguish "configured off" from "could not be read" — never collapse the second
  // into the first, which is how a check that could not run ships as a definite negative.
  NOTIFY_LINE = fs.existsSync(`${SWARM}/.ntfy.json`)
    ? esc(`notify UNKNOWN (${e.message}) · control idle`)
    : 'notify off · control idle';
}

const TARGETS_HTML = `<section class="target"><h2>${esc(T.t.name)}</h2>
<p>${esc(T.st.idea)}</p>
<h3>Decisions</h3><ul>${DECISIONS_HTML}</ul></section>`;

const vals = {
  RUN_TITLE, STATUS_LINE, STATS_HTML, TIMELINE_HTML, STATIONS_HTML, DECISIONS_HTML,
  HERO_HTML, HERO_CAPTION, NOTIFY_LINE, TARGETS_HTML,
  GENERATED_AT: esc(iso(now)),
  EXPECTED_NEXT: esc(rf.heartbeat.next_wakeup_at ? iso(rf.heartbeat.next_wakeup_at) : 'n/a'),
};

// L-043 (dead-region clause): this template documents its own placeholders INSIDE HTML
// comments — {{TIMELINE_HTML}} appears at lines 21 and 226 in comment prose and only once
// live, at line 236. A naive replaceAll fills all three, so an HTML-fragment value renders
// three times and compounds every pass (this is KI-11's exact shape, and the first pass of
// this renderer reproduced it: 3 burn-up bars where 1 was intended). Fill NON-COMMENT
// segments only; comment copies are left as the documentation they are.
const raw = fs.readFileSync(TPL, 'utf8');
const segs = raw.split(/(<!--[\s\S]*?-->)/g);
let html = segs.map(s => {
  if (s.startsWith('<!--')) return s;                       // dead region — never filled
  for (const [k, v] of Object.entries(vals)) s = s.replaceAll(`{{${k}}}`, v);
  return s;
}).join('');

// Control: prove each placeholder was LOCATED in live (non-comment) template text at all,
// so an "all filled" verdict cannot be produced by a template that simply had none.
// NOTE: this must count occurrences in the RAW segments (pre-substitution). A first pass
// tested the raw segments for surviving placeholders and reported 0/12 filled against a
// render that was in fact correct — the instrument was wrong, not the output (L-041).
const liveText = segs.filter(s => !s.startsWith('<!--')).join('');
const liveFilled = Object.keys(vals).filter(k => liveText.includes(`{{${k}}}`));
const neverLocated = Object.keys(vals).filter(k => !liveText.includes(`{{${k}}}`));
const leftover = [...html.matchAll(/{{[A-Z_0-9]+}}/g)]
  .map(m => m[0])
  .filter(p => !segs.filter(s => s.startsWith('<!--')).some(c => c.includes(p)));
fs.writeFileSync(OUT + '.tmp', html);
fs.renameSync(OUT + '.tmp', OUT);

// ---- MEASURE the rendered file (L-043: never assume the strings landed) --------------
const rendered = fs.readFileSync(OUT, 'utf8');
// Measure MY bars by their own class. The template ships a static `<div class="bar">`
// example at line 248 that has nothing to do with the burn-up; counting on `class="bar"`
// conflated the two and reported 4 where 3 were mine. An attributable selector is the fix,
// not a bumped expected value.
const ticks = (rendered.match(/class="burnup-bar"/g) || []).length;
const commentTicks = (rendered.match(/<!--[\s\S]*?-->/g) || [])
  .reduce((n, c) => n + (c.match(/class="burnup-bar"/g) || []).length, 0);
console.log(JSON.stringify({
  // KI-36: compare against the DERIVED series length, never a constant. A self-check
  // pinned to the renderer's own hardcoded intent can never notice the renderer is wrong.
  ok: leftover.length === 0 && ticks === BURNUP_BARS && commentTicks === 0,
  bytes: rendered.length,
  unfilled_live_placeholders: leftover,
  live_placeholders_located_and_filled: liveFilled.length + '/' + Object.keys(vals).length,
  never_located_in_live_template: neverLocated,
  burnup_bars_rendered: ticks,
  burnup_bars_expected: BURNUP_BARS,
  burnup_verified_cumulative: cum,
  burnup_done_items_without_a_cycle: undated.map(i => i.id),
  burnup_bars_leaked_into_comments: commentTicks,
  journal_lines: jl.length,
  decisions: (T.st.decisions || []).length,
  notify_line: NOTIFY_LINE,
}, null, 1));
