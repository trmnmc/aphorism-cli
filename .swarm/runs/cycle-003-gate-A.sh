#!/usr/bin/env bash
# Cycle 3 gate — section A (invariants). Conductor-run, never delegated.
T=/opt/targets/aphorism-cli

echo "=== A1 corpus sha256 ==="
sha256sum "$T/src/corpus.js"
echo "expect  77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e"

echo "=== A2 --help sha256 ==="
node "$T/bin/aphorism.js" --help | sha256sum
echo "expect  d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64"

echo "=== A3 package.json ==="
node -e 'const p=require("/opt/targets/aphorism-cli/package.json");console.log("dependencies:",JSON.stringify(p.dependencies||null),"devDependencies:",JSON.stringify(p.devDependencies||null))'
printf 'pkg diff vs HEAD -> ['
git -C "$T" diff HEAD -- package.json | tr -d '\n'
printf ']\n'

echo "=== A4 cited-path diff (the anti-cheat cell) ==="
printf '4b63e91..HEAD    -> ['
git -C "$T" diff 4b63e91..HEAD -- src bin test .github | tr -d '\n'
printf ']\n'
printf '4b63e91 worktree -> ['
git -C "$T" diff 4b63e91 -- src bin test .github | tr -d '\n'
printf ']\n'

echo "=== A5 citation-test byte identity vs 4b63e91 ==="
sha256sum "$T/test/node-support-citation.test.js"
git -C "$T" show 4b63e91:test/node-support-citation.test.js | sha256sum

echo "=== A-extra: full working-tree scope ==="
git -C "$T" status --porcelain
