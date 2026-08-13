const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const entityDirectory = path.join(__dirname, '..', 'entity');

test('entity source footers never leak an unrelated Lilith example identifier', () => {
  const leakingFiles = fs.readdirSync(entityDirectory)
    .filter((file) => file.endsWith('.html'))
    .filter((file) => fs.readFileSync(path.join(entityDirectory, file), 'utf8').includes('Lilith 118386 is the example.'));

  assert.deepEqual(leakingFiles, []);
});
