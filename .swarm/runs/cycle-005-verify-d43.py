# Conductor verify check, cycle 5, item N-10, gap D-43 (empty/whitespace --seed).
# Authored at verification time by the conductor; not taken from any builder note.
# Discriminator: a control seed ("0") must SUCCEED, so a check that merely dies on
# everything is distinguishable from one that measures the rejection.
import subprocess

BIN = "/opt/targets/aphorism-cli/bin/aphorism.js"
for label, arg in [("empty", ""), ("whitespace", "   "), ("CONTROL 0", "0")]:
    r = subprocess.run(["node", BIN, "--seed", arg],
                       capture_output=True, text=True)
    print("seed=%-12s arg=%-6r exit=%d stdout=%r stderr=%r"
          % (label, arg, r.returncode, r.stdout.strip()[:60], r.stderr.strip()[:70]))
