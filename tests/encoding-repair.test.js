const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.resolve(__dirname, '..', 'scripts', 'repair-encoding.py');

function repair(value) {
  const result = spawnSync('python', [script, '--text', value], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test('repairs common UTF-8 text decoded as Windows-1252', () => {
  assert.equal(repair('Lilith â€” night spirit Â· archiveâ€¦'), 'Lilith — night spirit · archive…');
  assert.equal(repair('ÃžorbjÃ¶rg lÃ­tilvÃ¶lva'), 'Þorbjörg lítilvölva');
});

test('preserves correctly encoded multilingual names', () => {
  assert.equal(repair('Śāntinātha · 日本語 · 관음 · 觀音'), 'Śāntinātha · 日本語 · 관음 · 觀音');
});
