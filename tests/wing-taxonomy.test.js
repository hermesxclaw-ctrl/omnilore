const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.resolve(__dirname, '..');
const taxonomy = require('../assets/wing-taxonomy.js');
const index = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'search-index.json'), 'utf8'));

test('taxonomy defines 17 unique routed wings', () => {
  assert.equal(taxonomy.length, 17);
  assert.equal(new Set(taxonomy.map((wing) => wing.key)).size, 17);
  assert.equal(new Set(taxonomy.map((wing) => wing.route)).size, 17);
  for (const wing of taxonomy) assert.equal(fs.existsSync(path.join(site, wing.route)), true, wing.route);
});

test('wing counts are derived from the current index', () => {
  const expected = Object.fromEntries(taxonomy.map((wing) => [wing.key, 0]));
  for (const entity of index) if (Object.hasOwn(expected, entity.k)) expected[entity.k] += 1;
  const pantheon = taxonomy.find((wing) => wing.key === 'divine');
  const nightParade = taxonomy.find((wing) => wing.key === 'yokai');
  assert.equal(expected[pantheon.key], 1584);
  assert.equal(expected[nightParade.key], 1082);
});

test('wing HTML fallbacks advertise current counts before JavaScript loads', () => {
  const counts = Object.fromEntries(taxonomy.map((wing) => [wing.key, 0]));
  for (const entity of index) if (Object.hasOwn(counts, entity.k)) counts[entity.k] += 1;
  for (const wing of taxonomy) {
    const source = fs.readFileSync(path.join(site, wing.route), 'utf8');
    const formatted = counts[wing.key].toLocaleString('en-US');
    assert.match(source, new RegExp(`<span id="hero-count">${formatted} entities awake<\\/span>`), wing.route);
    assert.match(source, new RegExp(`<p class="collection-count" id="count">${formatted} records in this wing<\\/p>`), wing.route);
  }
});

test('wing HTML fallbacks contain only the first real records assigned to that wing', () => {
  for (const wing of taxonomy) {
    const source = fs.readFileSync(path.join(site, wing.route), 'utf8');
    const grid = source.match(/<section class="wing-grid" id="wing-grid"[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(grid, wing.route);
    const actual = [...grid[1].matchAll(/href="\.\.\/entity\/([^"/]+)\.html"/g)].map((match) => match[1]);
    const expected = index.filter((entity) => entity.k === wing.key && entity.status !== 'quarantined').slice(0, 60).map((entity) => entity.s);
    assert.deepEqual(actual, expected, wing.route);
  }
});

test('every wing preserves a visible keyboard focus indicator', () => {
  for (const wing of taxonomy) {
    const source = fs.readFileSync(path.join(site, wing.route), 'utf8');
    assert.doesNotMatch(source, /\.search-wrap input:focus\{outline:0\}/, wing.route);
    assert.match(source, /\.search-wrap input:focus-visible\{[^}]*outline:/, wing.route);
  }
});

test('every wing keeps decorative horizontal overflow within viewport bounds', () => {
  for (const wing of taxonomy) {
    const source = fs.readFileSync(path.join(site, wing.route), 'utf8');
    assert.match(source, /html,body\{overflow-x:hidden\}/, wing.route);
  }
});
