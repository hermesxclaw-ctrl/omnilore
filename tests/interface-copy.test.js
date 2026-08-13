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

test('entity source footers do not make a blanket Wikipedia dossier provenance claim', () => {
  const misleadingFiles = fs.readdirSync(entityDirectory)
    .filter((file) => file.endsWith('.html'))
    .filter((file) => /Via Wikipedia — &quot;[^&]*?&quot;; dossier /.test(fs.readFileSync(path.join(entityDirectory, file), 'utf8')));

  assert.deepEqual(misleadingFiles, []);
});

test('dossier summaries use singular nouns for a count of one', () => {
  const grammarErrors = fs.readdirSync(entityDirectory)
    .filter((file) => file.endsWith('.html'))
    .filter((file) => /\b1 (?:stories|powers|relations)\b/.test(fs.readFileSync(path.join(entityDirectory, file), 'utf8')));

  assert.deepEqual(grammarErrors, []);
});
