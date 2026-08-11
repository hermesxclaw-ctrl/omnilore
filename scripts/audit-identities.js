#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'search-index.json'), 'utf8'));

function normalizeName(value) {
  return String(value || '').normalize('NFKC').trim().toLocaleLowerCase('en');
}

const grouped = new Map();
for (const entity of index) {
  const normalizedName = normalizeName(entity.n);
  if (!grouped.has(normalizedName)) grouped.set(normalizedName, []);
  grouped.get(normalizedName).push(entity);
}

const groups = [...grouped.entries()]
  .filter(([, entities]) => entities.length > 1)
  .sort(([left], [right]) => left.localeCompare(right, 'en'))
  .map(([normalizedName, entities]) => ({
    normalizedName,
    displayNames: [...new Set(entities.map((entity) => entity.n))],
    slugs: entities.map((entity) => entity.s).sort(),
    decision: 'unresolved',
    note: 'Same visible name detected. Research identity, tradition, and source provenance before merging or suppressing either route.'
  }));

const ledger = {
  generatedFrom: 'assets/search-index.json',
  policy: 'Never merge records by name alone. Canonicalize only after source-backed identity review.',
  protectedCanonicalRecords: {
    lilith: {
      slug: 'lilith',
      rule: 'The illustrated Lilith dossier is the sole exact-name searchable record.'
    }
  },
  duplicateGroupCount: groups.length,
  groups
};

const outputPath = path.join(root, 'data', 'identity-review.json');
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
console.log(`Wrote ${groups.length} duplicate-name groups to ${path.relative(root, outputPath)}`);
