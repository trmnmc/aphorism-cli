#!/usr/bin/env python3
"""Block until the triage file stops growing, so the gate never reads a half-written
document. Size stable across 4 consecutive 10s samples is the settle condition."""
import os, sys, time

DOC = "/opt/targets/aphorism-cli/docs/corpus-attribution-triage.md"
prev, stable, waited = -1, 0, 0
while stable < 4 and waited < 1500:
    try:
        cur = os.path.getsize(DOC)
    except OSError:
        cur = 0
    stable = stable + 1 if (cur == prev and cur > 0) else 0
    prev = cur
    time.sleep(10)
    waited += 10
print(f"settled at {prev} bytes after {waited}s")
