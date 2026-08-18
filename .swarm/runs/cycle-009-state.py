import json, os

SP = '/opt/targets/aphorism-cli/.swarm/state.json'
s = json.load(open(SP))

s['cycle'] = 9
s['phase'] = 'VALUE_LOOP'

s['qa']['last_taste_cycle'] = 9
s['qa']['taste_note_cycle_009'] = (
    "TASTE pass RUN and VERIFIED at cycle 9 -- the last of the three pre-POLISH gates "
    "(review-fix c5, QA full c6, TASTE c9). Verdict: wears-thin, 4 boredom findings, 0 fundamental. "
    "Dispatched as a DIRECT fable Agent call, not workflows/qa-verify.js: headless `-p` cycle, "
    "Workflow tool review-gated, direct dispatch is the documented SKILL.md fallback. Two "
    "contract-faithful adaptations are recorded in .swarm/runs/cycle-009-taste.json (CLI brief "
    "replaces the web serverBrief; no browser so evidence is raw terminal output, screenshots empty). "
    "THE GATE IS THE POINT: all four findings were conductor-reproduced by an 8-check script authored "
    "AFTER the agent returned (.swarm/runs/cycle-009-taste-gate.mjs, 8/8 PASS) plus test_cmd 118/118. "
    "One agent figure was measured and came back CONSERVATIVE rather than inflated: it reported the "
    "first repeat at use 12, but with N=50 the median first repeat is draw 9 and P(repeat by 12) = "
    "76.2%, so the staleness bites SOONER than reported. The agent honored read-only -- git status "
    "was empty after its run. last_full_qa_cycle stays 6: this cycle ran no full-QA workflow."
)

s.setdefault('decisions', []).append({
    "cycle": 9,
    "kind": "scope",
    "what": "The taste seat's headline finding (TS-1: the 50-entry corpus repeats by ~draw 9) is filed BLOCKED on a human scope decision rather than built, and the run does NOT re-aim its remaining clock at corpus depth.",
    "why": (
        "Two facts had to be held together. First, the finding is real and measured, not an "
        "impression: median first repeat at draw 9, P(repeat by 12) = 76.2%, 34% of the corpus in "
        "three voices, 5 of 12 tag pools at <= 4 entries -- all conductor-reproduced. Second, "
        "'corpus expansion' is an EXPLICIT locked non-goal of improvement run #3, whose whole brief "
        "is measure/repair/document with no new features. A swarm that lifts its own locked non-goal "
        "because an agent it dispatched made a good argument is exactly the drift the spec lock "
        "exists to prevent, so building it was never available to this cycle. The honest third "
        "option -- taken -- is to file TS-1..TS-3 blocked with a named human actor (K-5), so the "
        "finding survives into the morning report at full strength instead of being dropped, "
        "re-scoped, or silently converted into work the spec forbids. Note the severity was "
        "'notable', not 'fundamental': cycle.md only re-aims the clock on a fundamental verdict, and "
        "that threshold was genuinely not met -- the product's SHAPE (one quiet attributed line, "
        "pipeable, stderr-clean) held up across 32 uses; only its POOL ran out. TS-4, the one "
        "finding the non-goals permit fixing (help-text repair, no flag/dependency/corpus change), "
        "is filed todo and is the natural POLISH pick for the next cycle."
    )
})

c = s.setdefault('counters', {})
c['verified_this_cycle'] = 1
c['consecutive_no_value'] = 0
c['consecutive_failures'] = 0
# Wave autotune does NOT apply: it keys off a build-wave's merges + verification, and no build
# wave ran this cycle. k_current and wave_streak are left exactly as cycle 8 set them.

json.dump(s, open(SP + '.tmp', 'w'), indent=2)
os.replace(SP + '.tmp', SP)
print('state cycle', s['cycle'], 'phase', s['phase'], 'last_taste_cycle', s['qa']['last_taste_cycle'])
print('decisions', len(s['decisions']), 'counters', json.dumps(c))
