// cycle 49 — file KI-17 (dashboard render patched the legend, not the live node).
import fs from 'node:fs';
const F = '/opt/targets/aphorism-cli/.swarm/state.json';
const st = JSON.parse(fs.readFileSync(F, 'utf8'));

if (st.known_issues.some((k) => k.id === 'KI-17')) throw new Error('KI-17 already filed');

st.known_issues.push({
  id: 'KI-17',
  severity: 'medium',
  cycle_found: 49,
  status: 'open (repaired in the rendered artifact; the defective pattern is what remains filed)',
  desc:
    "CONDUCTOR-INSTRUMENT DEFECT, found at cycle 49 while rendering the dashboard. The LIVE per-target node in SWARM/runs/dashboard.html read \"cycle 46 - 12 known issues open\" while the run was at cycle 48. Cause: dashboard.html's first 112 lines are ONE HTML comment holding a legend with PLACEHOLDER copies of several live anchors, and runs/cycle47-dashboard.mjs matched the target node with /<div class=\"target\"><b>\\/opt\\/targets\\/aphorism-cli<\\/b><span>[^<]*<\\/span><\\/div>/ -- no `g` flag and NO match-count assertion. String.replace with a non-global regex replaces only the FIRST match, and the first match in the file is the legend copy at line 38. So cycle 47 patched a comment nobody sees and left the human-visible node stale; cycle 48 reused the same script and repeated it. DISCRIMINATOR against \"the render simply did not run\": the legend copy WAS advanced to cycle 47 and then to cycle 48, so the writes landed -- they landed in the wrong region. This is precisely the KI-11 failure mode that runs/c46-dash.mjs's own header warns about in prose, three cycles before it happened; the warning existed and the assertion did not. REPAIRED IN THE ARTIFACT at cycle 49 (runs/c49-dash.mjs anchors the substitution on the `<!-- TARGETS -->` marker so it cannot reach the legend, and asserts an exact match count of 1 before replacing). WHAT REMAINS OPEN is the general defect: the dashboard is re-rendered by a hand-written per-cycle script, so the discipline is re-implemented from scratch every cycle and is only as good as the conductor's memory of it. A prose warning in one cycle's script does not carry to the next. Fix for a human: either strip the legend comment out of the published artifact, or give the anchors machine-distinguishable ids so a render cannot address the legend at all.",
  note:
    'Cost, stated honestly: two cycles of a stale status line on the one page a human actually looks at, while the run itself was healthy and every other live region (banner, timeline, evidence strip) updated correctly. Nothing about the PRODUCT was misreported; the run metadata was. Filed rather than treated as a one-off render slip because the same trap has now fired twice in a row after being documented once.',
});

fs.writeFileSync(F + '.tmp', JSON.stringify(st, null, 2) + '\n');
fs.renameSync(F + '.tmp', F);
const open = st.known_issues.filter((k) => (k.status || '').startsWith('open')).length;
console.log(`known_issues: ${st.known_issues.length} total, ${open} open`);
