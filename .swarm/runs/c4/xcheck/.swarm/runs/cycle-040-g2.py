import subprocess
d = subprocess.run(['git', '-C', '/opt/targets/aphorism-cli', 'diff', '-U0', '--',
                    'test/readme-tags.test.js'], capture_output=True, text=True).stdout
lines = d.split('\n')
add = [l for l in lines if l.startswith('+') and not l.startswith('+++')]
rem = [l for l in lines if l.startswith('-') and not l.startswith('---')]
noncomment = [l for l in add if l[1:].strip() and not l[1:].strip().startswith('//')]
print('added lines total      :', len(add))
print('added NON-comment lines:', len(noncomment))
print('removed lines          :', len(rem))
for l in noncomment:
    print('   NONCOMMENT>', l)
