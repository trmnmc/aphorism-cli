// run #4, cycle 1 — append the journal block + runfile-mirror. Conductor-authored.
import fs from "fs";
const T = "/opt/targets/aphorism-cli";
const block = fs.readFileSync(T + "/.swarm/runs/run4-cycle-001-journal.md", "utf8");
const rp = "/opt/swarm/runs/current.json";
const rf = JSON.parse(fs.readFileSync(rp, "utf8"));

// step 9 — schedule wakeup. Value cycle -> base 90s. Clamp so wake + 900 <= stop_at.
const now = Math.floor(Date.now() / 1000);
const stopAt = Math.floor(Date.parse(rf.stop_at) / 1000);
const wake = Math.min(now + 90, stopAt - 900);
rf.heartbeat.ts = now;
rf.heartbeat.next_wakeup_at = wake;
fs.writeFileSync(rp + ".tmp", JSON.stringify(rf, null, 2));
fs.renameSync(rp + ".tmp", rp);
fs.copyFileSync(rp, rp + ".bak");

const mirror = JSON.parse(JSON.stringify(rf));
if (mirror.artifact) delete mirror.artifact.url;
const tail = "commit: (this cycle)\nnext wakeup: " + wake + " (+" + (wake - now) + "s)\nrunfile-mirror:\n```json\n" +
  JSON.stringify(mirror) + "\n```\n";
console.log("next_wakeup_at", wake, "(+" + (wake - now) + "s), stop_at", stopAt);
fs.appendFileSync(T + "/.swarm/journal.md", block + tail);
console.log("appended", block.length + tail.length, "bytes to journal.md");
