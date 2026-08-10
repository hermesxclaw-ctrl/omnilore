const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.resolve(__dirname, '..');
const wings = fs.readdirSync(path.join(site, 'wings')).filter((file) => file.endsWith('.html'));

test('every wing is free of the malformed orphan sort statement', () => {
  const broken = wings.filter((file) => {
    const source = fs.readFileSync(path.join(site, 'wings', file), 'utf8');
    return source.includes(';.sort(');
  });
  assert.deepEqual(broken, []);
});

test('every wing delegates filtering to the shared collection controller', () => {
  const missing = wings.filter((file) => {
    const source = fs.readFileSync(path.join(site, 'wings', file), 'utf8');
    return !source.includes('../assets/collection-controller.js');
  });
  assert.deepEqual(missing, []);
});

test('only the canonical Lilith page remains', () => {
  const duplicates = [
    'lilith-12TAB-WORKCOPY.html',
    'lilith-copy.html',
    'lilith-perfect-copy.html',
    'lilith-WORK-12TAB-EDGE.html',
    'lilith-YAY-12TAB.html'
  ].filter((file) => fs.existsSync(path.join(site, 'entity', file)));
  assert.deepEqual(duplicates, []);
  assert.equal(fs.existsSync(path.join(site, 'entity', 'lilith.html')), true);
});
