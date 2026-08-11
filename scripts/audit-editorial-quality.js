#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'search-index.json'), 'utf8'));

const patterns = [
  ['imagine-hook', /\bimagine\b/i],
  ['vast-hook', /\bin the vast\b/i],
  ['shadowy-hook', /\bin the shadowy (?:corners|margins|depths)\b/i],
  ['step-into-hook', /\bstep into\b/i],
  ['empty-fascinating', /\bfascinating\b/i],
  ['empty-rich-complex', /\brich and complex\b/i],
  ['empty-captivating', /\bcaptivat(?:ed|ing)\b/i],
  ['empty-enigmatic', /\benigmatic\b/i],
  ['tapestry-cliche', /\btapestr(?:y|ies)\b/i],
  ['stands-as-cliche', /\bstands as\b/i],
  ['archive-self-reference', /\b(?:OmniLore|archive of all things unreal|vast (?:catalog|archive|library))\b/i]
];

const records = index
  .filter((entity) => ['draft', 'researched'].includes(entity.status))
  .map((entity) => {
    const excerpt = String(entity.e || '');
    return {
      slug: entity.s,
      name: entity.n,
      status: entity.status,
      flags: patterns.filter(([, pattern]) => pattern.test(excerpt)).map(([flag]) => flag)
    };
  });

const flagCounts = Object.fromEntries(patterns.map(([flag]) => [flag, records.filter((record) => record.flags.includes(flag)).length]));
const output = {
  generatedFrom: 'assets/search-index.json',
  policy: 'Flags identify editorial review work; they do not authorize automatic factual rewriting.',
  recordsAudited: records.length,
  recordsFlagged: records.filter((record) => record.flags.length).length,
  flagCounts,
  records
};

const outputPath = path.join(root, 'data', 'editorial-audit.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ recordsAudited: output.recordsAudited, recordsFlagged: output.recordsFlagged, flagCounts }, null, 2));
