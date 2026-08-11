const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = require('../assets/search-index.json');

function key(name) {
  return String(name || '').normalize('NFKC').trim().toLocaleLowerCase('en');
}

function duplicateGroups() {
  const groups = new Map();
  for (const entity of index) {
    const normalized = key(entity.n);
    if (!groups.has(normalized)) groups.set(normalized, []);
    groups.get(normalized).push(entity.s);
  }
  return [...groups.entries()].filter(([, slugs]) => slugs.length > 1);
}

test('identity review ledger covers every duplicate visible name', () => {
  const ledgerPath = path.join(root, 'data', 'identity-review.json');
  assert.equal(fs.existsSync(ledgerPath), true, 'data/identity-review.json is required');
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const byName = new Map(ledger.groups.map((group) => [group.normalizedName, group]));
  for (const [normalizedName, slugs] of duplicateGroups()) {
    const group = byName.get(normalizedName);
    assert.ok(group, `missing identity review for ${normalizedName}`);
    assert.deepEqual([...group.slugs].sort(), [...slugs].sort());
    assert.match(group.decision, /^(unresolved|distinct|canonicalized)$/);
  }
});

test('Lilith has one searchable canonical record', () => {
  const liliths = index.filter((entity) => key(entity.n) === 'lilith');
  assert.deepEqual(liliths.map((entity) => entity.s), ['lilith']);
  assert.notEqual(liliths[0].status, 'quarantined');
});
