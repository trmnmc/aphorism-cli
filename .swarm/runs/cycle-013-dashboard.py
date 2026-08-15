#!/usr/bin/env python3
"""Cycle 13 step-8 dashboard render. Reads state/runfile/journal/allocator and fills
templates/dashboard.template.html. Every journal-derived string is HTML-escaped before
it enters the page -- journal text carries raw command output and user msg payloads,
so it is data, never markup.

One change from cycle 12's renderer, stated because it affects what a reader sees:
tick colour used to key on "did this cycle verify a backlog item?". Cycle 13 verified
zero items and is still not a failed cycle -- it closed a required step-4 gate. So a
cycle now reads OK if it verified an item OR its outcome records a satisfied gate. The
burn-up bars are untouched and still count only verified items, so nothing inflates
the progress curve."""
import html, json, os, re, time

T = "/opt/targets/aphorism-cli"
SW = "/opt/swarm"
TPL = f"{SW}/templates/dashboard.template.html"
OUT = f"{SW}/runs/dashboard.html"

st = json.load(open(f"{T}/.swarm/state.json"))
rf = json.load(open(f"{SW}/runs/current.json"))
alloc = json.load(open(f"{SW}/runs/allocator.json"))
journal = open(f"{T}/.swarm/journal.md").read()
try:
    ctl = json.load(open(f"{SW}/runs/control.json"))
except Exception:
    ctl = {"pending": [], "applied": []}

E = html.escape
iso = lambda t: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t))

# ---- per-cycle facts from the journal ----------------------------------------
blocks = re.split(r"^## cycle ", journal, flags=re.M)[1:]
cycles = []
for b in blocks:
    n = int(re.match(r"(\d+)", b).group(1))
    work = re.search(r"^work: (.+)$", b, re.M)
    outcome = re.search(r"^outcome: (.+)$", b, re.M)
    otext = (outcome.group(1) if outcome else "").strip()
    m = re.search(r"(\d+) item", otext)
    verified = int(m.group(1)) if m else 0
    gate = "satisfied" in otext and "gate" in otext
    cycles.append({"n": n, "work": (work.group(1) if work else "").strip().rstrip(","),
                   "outcome": otext, "verified": verified, "ok": bool(verified) or gate})
cycles.sort(key=lambda c: c["n"])

items = json.load(open(f"{T}/.swarm/backlog.json"))["items"]
live = [i for i in items if i["status"] != "dropped"]
done = [i for i in live if i["status"] == "done"]
total = len(live)
pct = round(100 * len(done) / total) if total else 0

# ---- header / meta -----------------------------------------------------------
now = int(time.time())
gen, nxt = iso(now), iso(rf["heartbeat"]["next_wakeup_at"])
notify_line = f"notify off &middot; control: {len(ctl.get('pending', []))} pending &middot; last: none"
status_line = E(
    f"cycle {st['cycle']} | aphorism-cli | {st['phase']} | QA-full pass "
    f"→ 0 spec divergences (27/27 checks, 4 negative controls) | next wake {nxt}"
)

# ---- stats -------------------------------------------------------------------
def tile(k, b, s, cls=""):
    return (f'<div class="stat{cls}"><span class="k">{E(k)}</span><b>{E(b)}</b>'
            f'<span class="s">{E(s)}</span></div>')

bd = rf["budget"]
open_ki = [k for k in st["known_issues"] if k.get("status") != "resolved"]
q = st.get("qa", {})
stats = "".join([
    tile("pace", f"G{bd['gear']} · {alloc['posture']} · {bd['mode']}",
         f"dial {alloc['dial']} · premium {alloc['allow_premium_pct']}% · k≤{bd['k_cap']}", " stat-warn"),
    tile("backlog", f"{len(done)}/{total}", f"{pct}% done · cycle {st['cycle']}"),
    tile("suite", "59/59", "node --test test/*.test.js · 0 fail"),
    tile("QA gate", "full ✓ / taste —",
         f"full c{q.get('last_full_qa_cycle', 0)} · taste never run"),
    tile("known issues", str(len(open_ki)),
         "KI-2 attributions (high) · KI-5 playbook cap (med)", " stat-warn"),
    tile("allocator", f"{alloc['weekly_used_pct']}%",
         f"week elapsed {alloc['week_elapsed_pct']}% · opus {alloc['opus_used_pct']}%", " stat-warn"),
])

# ---- stations ----------------------------------------------------------------
def station(ava, color, who, quip, chip, cls, ink=False):
    style = f"background:{color}" + (";color:#111" if ink else "")
    return (f'<div class="station {cls}"><span class="ava" style="{style}">{E(ava)}</span>'
            f'<span class="who"><b>{E(who)}</b><i>{E(quip)}</i></span>'
            f'<span class="chip">{E(chip)}</span></div>')

stations = "".join([
    station("Co", "#f2f2f2", "The Conductor", "Swept every tag, not the one it was handed.",
            "verifying", "st-ok", ink=True),
    station("Sc", "#4ea1ff", "The Scribe", "Wrote the answer key without ever seeing the code.",
            "returned", "st-ok"),
    station("Wa", "#7c5cff", "The Warden", "27 checks. Four of them exist only to fail.",
            "gate open", "st-ok"),
    station("Ma", "#e8834a", "The Mason", "Nothing to build. Nothing broke.", "idle", "st-off"),
])

# ---- timeline ----------------------------------------------------------------
ticks = "".join(
    f'<span class="tick {"tick-ok" if c["ok"] else "tick-warn"}" '
    f'title="{E("aphorism-cli c%d: %s" % (c["n"], c["outcome"][:90]))}">{c["n"]}</span>'
    for c in cycles
)

# ---- target block ------------------------------------------------------------
one_liners = "".join(
    f'<li>cycle {c["n"]} — {E(c["work"][:110])} [{E(c["outcome"][:70])}]</li>'
    for c in reversed(cycles[-8:])
)

cum, bars = 0, []
for c in cycles:
    cum += c["verified"]
    bars.append(f'<span style="height:{max(4, min(100, round(100 * cum / total)))}%"></span>')
burnup = ('<div class="burnup" title="cumulative verified items / backlog total, per cycle">'
          + "".join(bars) + "</div>")

ev_rows = [
    ("QA", "node .swarm/runs/cycle-013-verify-QA.js", "27 pass / 0 fail", "PASS"),
    ("I-5", "node .swarm/runs/cycle-012-verify-I-5.js", "17 pass / 0 fail", "PASS"),
    ("I-4a", "node .swarm/runs/cycle-011-verify-I-4a.js", "19 pass / 0 fail", "PASS"),
]
evidence = '<pre class="evidence">' + "\n".join(
    f'{E(i)} {E(cmd)} -&gt; {E(res)} <span class="pass">{E(v)}</span>'
    for i, cmd, res, v in ev_rows) + "</pre>"

targets = f"""
    <section class="target">
      <div class="thead"><h2>aphorism-cli</h2><span class="badge">{E(st['phase'])}</span></div>
      <div class="bar"><div class="fill" style="width:{pct}%"></div></div>
      <p class="counts">{len(done)} / {total} backlog items done &middot; cycle {st['cycle']}</p>
      <ul class="journal">{one_liners}</ul>
      {burnup}
      {evidence}
    </section>"""

decisions = "".join(
    f'<li>cycle {d["cycle"]} — {E(d["what"][:150])}</li>'
    for d in st["decisions"][-6:][::-1]
)

# ---- fill --------------------------------------------------------------------
page = open(TPL).read()
for k, v in {
    "RUN_TITLE": "aphorism-cli", "GENERATED_AT": gen, "EXPECTED_NEXT": nxt,
    "STATUS_LINE": status_line, "STATS_HTML": stats, "STATIONS_HTML": stations,
    "TIMELINE_HTML": ticks, "HERO_HTML": "", "HERO_CAPTION": "",
    "TARGETS_HTML": targets, "DECISIONS_HTML": decisions, "NOTIFY_LINE": notify_line,
}.items():
    page = page.replace("{{" + k + "}}", v)

tmp = OUT + ".tmp"
open(tmp, "w").write(page)
os.replace(tmp, OUT)
left = len(re.findall(r"\{\{[A-Z_]+\}\}", page))
print(f"dashboard rendered: {os.path.getsize(OUT)} B, {len(cycles)} cycles, "
      f"{len(done)}/{total} done ({pct}%), unfilled placeholders={left}")
