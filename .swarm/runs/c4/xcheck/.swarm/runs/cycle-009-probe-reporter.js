const { spawnSync } = require('node:child_process');
const r = spawnSync(process.execPath, ['--test', 'test/cli.test.js'], {
  cwd: '/opt/targets/aphorism-cli',
  encoding: 'utf8',
});
console.log('--- STDOUT TAIL ---');
console.log(r.stdout.split('\n').slice(-20).join('\n'));
console.log('--- STDERR TAIL ---');
console.log(r.stderr.split('\n').slice(-10).join('\n'));
console.log('--- node', process.version);
