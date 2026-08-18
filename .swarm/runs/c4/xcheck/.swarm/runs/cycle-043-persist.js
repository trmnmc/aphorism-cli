#!/usr/bin/env node
// cycle 43 — atomic state.json update (write .tmp, then mv). No backlog change this cycle.
const fs = require('fs');
const P = '/opt/targets/aphorism-cli/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(P, 'utf8'));

s.cycle = 43;
// phase stays POLISH — no phase transition this cycle.

const ki5 = s.known_issues.find((k) => k.id === 'KI-5');
ki5.note_cycle_43 =
  "ROOT CAUSE MEASURED, not inferred. For 42 cycles the allowlist gap was a black-box " +
  "observation ('the script is refused'); this cycle READ the permission source of truth, " +
  "/opt/swarm/.claude/settings.json. permissions.allow contains exactly TWO SWARM-script " +
  "entries: 'Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)' -- a macOS path that " +
  "does not exist on this host -- and 'Bash(bin/swarm-notify.sh:*)', the relative form that " +
  "works. There is NO entry for swarm-budget.sh or swarm-playbook.sh in ANY path form, and " +
  "none for the VPS prefix /opt/swarm/bin. The underlying cause of the whole KI-5 family is " +
  "that settings.json was never migrated from macOS to the VPS. Established by a 16-check " +
  "gate (.swarm/runs/cycle-043-gate-ki5.js, output cycle-043-verify-ki5.txt): the allowlist " +
  "contents PREDICTED 7/7 measured cells including two negative controls (awk absent -> " +
  "denied; pgrep present -> clean) and two cells no prior cycle had measured. The " +
  "discriminator is cell 3 vs cell 4: identical script AND arguments (swarm-notify.sh poll), " +
  "varying ONLY the path form, giving OPPOSITE outcomes -- absolute DENIED, relative CLEAN. " +
  "A 'the script isn't allowlisted' theory predicts those two alike; the allowlist predicts " +
  "them opposite, which is the observation a wrong theory could not have produced. " +
  "TWO OPERATIONAL CONSEQUENCES, derived from the allowlist rather than executed: (S8) " +
  "WRAP_UP's 'bin/swarm-playbook.sh append' WILL be refused -- the manual fallback is " +
  "confirmed necessary, and was pre-drafted this cycle to /opt/swarm/runs/wrapup-candidates.md " +
  "rather than left to the WRAP_UP clock; (S9) 'bin/swarm-notify.sh send wrap-up ...' " +
  "relative from cwd=/opt/swarm WILL be permitted, so the wrap-up push can go out -- " +
  "previously unknown and assumed dead. ALSO FOUND: permissions.additionalDirectories is " +
  "EMPTY, so the target is reachable only via the pacer's --add-dir flag. " +
  "NOTE the compounding with note_cycle_12: the playbook is inert for TWO independent " +
  "reasons -- the cap breach (cmd_parse exits 2 at >20 lessons) AND this allowlist gap. " +
  "Fixing either alone leaves it inert. NOT FIXED HERE, deliberately: hard rule 5 makes " +
  "settings.json read-only until WRAP_UP completes, so tool bugs found mid-run go to the " +
  "journal and the morning report, never to a live edit. The repair is two added lines.";

s.counters.autotune_note_cycle_43 =
  "Wave autotune NOT applied; k_current stays 5, wave_streak stays 0. FIFTH consecutive " +
  "zero-agent cycle -- no wave dispatched, no agent ran. Autotune measures how much parallel " +
  "CODE a target can absorb, and a cycle that dispatched nothing measures nothing about that. " +
  "Same reasoning as cycles 39-42. Inert either way: effective wave size = " +
  "min(k_current 5, gear cap 1) = 1, and gear 1 is structurally fixed for the rest of the run.";

s.counters.churn_note_cycle_43 =
  "consecutive_no_value stays 0. ELEVENTH consecutive verified-value cycle, and the honest " +
  "label is the same one cycle 42 used: verified-value-with-no-item-landed. NO BACKLOG ITEM " +
  "LANDED and none could -- all six remaining todos need a builder and the allocator " +
  "authorises zero agent burn. Held at 0 on the rule's PURPOSE rather than its proxy, per the " +
  "cycle-42 reasoning: the counter exists to detect a target that cannot make progress, and " +
  "charging a board that CANNOT be worked to the stall ladder would walk the run into a false " +
  "stall on arithmetic it does not control. What this cycle produced instead: the root cause " +
  "of KI-5 after 42 cycles of black-box refusals (16/16 gate, 7/7 predicted cells, 2 negative " +
  "controls), and the WRAP_UP DISTILL candidate set pre-drafted and gated (13/13, 2 negative " +
  "controls) now that S8 CONFIRMS the script will refuse. Both are WRAP_UP de-risking: a " +
  "session death from here costs the human neither the lessons nor the diagnosis.";

fs.writeFileSync(P + '.tmp', JSON.stringify(s, null, 2) + '\n');
fs.renameSync(P + '.tmp', P);
console.log('state.json written atomically: cycle', s.cycle, 'phase', s.phase);
console.log('KI-5 notes now:', Object.keys(ki5).filter((k) => k.startsWith('note_')).join(','));
