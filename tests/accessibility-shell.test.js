const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const baseCss = fs.readFileSync(path.join(__dirname, '..', 'assets', 'base.css'), 'utf8');

test('global search has a keyboard-visible focus style', () => {
  assert.match(baseCss, /\.nav-search #q:focus-visible\{[^}]*outline:/);
});

test('shared stylesheet contains no common mojibake sequences', () => {
  assert.doesNotMatch(baseCss, /â€|âŒ|Ã.|Â.|\uFFFD/);
});
