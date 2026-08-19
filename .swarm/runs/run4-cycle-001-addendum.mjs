// run #4, cycle 1 — append the dashboard addendum and update KI-11 with its cause.
import fs from "fs";
const T = "/opt/targets/aphorism-cli";
// NOTE: the journal append lived here and ALREADY RAN (the first invocation appended the
// addendum, then died on the known-issues shape below). Re-running it would double-append,
// so it is removed rather than guarded — verified once present via grep before editing.
const kp = T + "/.swarm/known-issues.json";
const k = JSON.parse(fs.readFileSync(kp, "utf8"));
const arr = k.issues;
const ki11 = arr.find((i) => i.id === "KI-11");
if (ki11) {
  ki11.status = "ROOT CAUSE FOUND at run #4 cycle 1; class closed for this run's renders, template unfixed (SWARM tool change, fenced mid-run)";
  ki11.root_cause = "The dashboard template documents its own placeholders using the placeholder TOKENS, inside comments — the HTML header key, and the CSS region notes at .stats/.stations. Global substitution fills the documentation as well as the slot, so each documenting comment silently emits one extra copy. Never a duplicated loop, which is why the symptom ('three copies of the tick') resisted placement. Reproduced on this cycle's first render: 4 tick occurrences from a loop that emitted 1. Fixed in SWARM/runs/run4-render-dashboard.mjs by refusing to substitute inside comment regions — and note the first fix was INCOMPLETE, skipping only <!-- --> while the CSS /* */ half kept leaking the stat tiles and station rows; both dialects are skipped now, verified by a 0-leak self-check and a 6,436-byte drop in rendered size that is the duplicated content itself.";
  ki11.next_actor = "swarm operator — the durable fix is a bin/-level renderer or a template that documents placeholders without spelling the tokens; both are SWARM tool changes, fenced by hard rule 5 during a run, so they belong in the morning report, not a live edit.";
}
fs.writeFileSync(kp + ".tmp", JSON.stringify(k, null, 2));
fs.renameSync(kp + ".tmp", kp);
console.log("addendum appended; KI-11 updated:", !!ki11);
