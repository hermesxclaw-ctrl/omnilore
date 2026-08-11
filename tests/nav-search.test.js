const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'nav-search.js'), 'utf8');

test('registers the service worker from the shared asset location on web protocols', () => {
  assert.match(source, /navigator\.serviceWorker\.register/);
  assert.match(source, /new URL\('\.\.\/sw\.js'/);
  assert.match(source, /https\?:/);
});

test('shared search UI contains no mojibake glyph sequences', () => {
  assert.doesNotMatch(source, /â†|Ã.|Â.|\uFFFD/);
});

test('shared navigation binds the wing menu with an expanded state', () => {
  assert.match(source, /getElementById\('navToggle'\)/);
  assert.match(source, /setAttribute\('aria-expanded'/);
  assert.match(source, /classList\.toggle\('open'/);
});

test('obsolete competing search implementations are absent', () => {
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'assets', 'omnilore-core.js')), false);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'assets', 'search-worker.js')), false);
});
