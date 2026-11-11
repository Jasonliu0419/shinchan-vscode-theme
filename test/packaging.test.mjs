import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const allowed = [
  'package.json', 'dist/extension.js', 'dist/webview.js', 'media/webview.css',
  'themes/shinchan-kasukabe-color-theme.json', 'README.md', 'LICENSE', 'CHANGELOG.md',
];
test('VSIX contains only the personal extension runtime and documentation', () => {
  const files = execFileSync('unzip', ['-Z1', 'shinchan-buddy.vsix'], { encoding: 'utf8' }).trim().split('\n');
  const payload = files.filter(path => path.startsWith('extension/') && !path.endsWith('/')).map(path => path.slice('extension/'.length));
  // vsce standardizes these three documentation names in the archive.
  const archiveNames = { 'README.md': 'readme.md', 'LICENSE': 'LICENSE.txt', 'CHANGELOG.md': 'changelog.md' };
  assert.deepEqual(payload.sort(), allowed.map(path => archiveNames[path] ?? path).sort());
  for (const file of ['dist/extension.js','dist/webview.js']) {
    const bundled = execFileSync('unzip', ['-p', 'shinchan-buddy.vsix', `extension/${file}`], { encoding: 'utf8' });
    assert.ok(!bundled.includes('sourceMappingURL='), 'Production VSIX must not reference development maps');
  }
});
test('package file listing is exactly the runtime allowlist', () => {
  const listing = execFileSync('./node_modules/.bin/vsce', ['ls', '--no-dependencies'], { encoding: 'utf8' });
  assert.deepEqual(listing.trim().split('\n').sort(), [...allowed].sort());
});
test('publish command is explicitly blocked', () => {
  const p = JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(p.publisher, 'local');
  assert.throws(() => execFileSync('npm', ['run','publish'], { encoding: 'utf8', stdio: 'pipe' }), error => {
    assert.match(error.stderr, /Personal extension: publishing is disabled/); return error.status === 1;
  });
});
