#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jsonPath = path.join(root, 'assets', 'search-index.json');
const jsPath = path.join(root, 'assets', 'search-index.js');
const overrides = JSON.parse(fs.readFileSync(path.join(root, 'data', 'editorial-overrides.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const bySlug = new Map(index.map((entity) => [entity.s, entity]));

for (const [slug, override] of Object.entries(overrides)) {
  const entity = bySlug.get(slug);
  if (!entity) throw new Error(`Editorial override references missing slug: ${slug}`);
  if (override.excerpt) entity.e = override.excerpt;
}

fs.writeFileSync(jsonPath, `${JSON.stringify(index)}\n`, 'utf8');
fs.writeFileSync(jsPath, `window.OMNILORE_INDEX=${JSON.stringify(index)};\n`, 'utf8');
console.log(`Applied ${Object.keys(overrides).length} editorial overrides.`);
