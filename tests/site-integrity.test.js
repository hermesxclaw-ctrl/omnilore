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

test('homepage and browse do not bind competing legacy global-search handlers', () => {
  const homepage = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  const browse = fs.readFileSync(path.join(site, 'browse.html'), 'utf8');
  assert.doesNotMatch(homepage, /\/\/ search with aliases/);
  assert.doesNotMatch(browse, /var sel=-1,lastTop=null/);
});

test('the shared nav loader can supply the search index to pages that only load a worker', () => {
  const navSearch = fs.readFileSync(path.join(site, 'assets', 'nav-search.js'), 'utf8');
  assert.match(navSearch, /search-index\.js/);
  assert.match(navSearch, /ensureIndex/);
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
