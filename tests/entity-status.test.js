const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.window = global;
require('../assets/entity-card.js');
const { createArchiveEngine } = require('../assets/archive-engine.js');

const records = [
  { s: 'reviewed', n: 'Reviewed', a: [], c: 'Test', k: 'divine', status: 'reviewed', _finished: true },
  { s: 'draft', n: 'Draft', a: [], c: 'Test', k: 'divine', status: 'draft', _finished: false },
  { s: 'stub', n: 'Stub', a: [], c: 'Test', k: 'liminal', status: 'stub', _finished: false },
  { s: 'batch_file', n: 'Batch file', a: [], c: 'Archive', k: 'liminal', status: 'quarantined', _finished: false }
];

test('public search excludes quarantined records but keeps honest drafts and stubs', () => {
  const engine = createArchiveEngine(records, '/browse.html');
  assert.deepEqual(engine.search('').map((result) => result.entity.s), ['reviewed', 'draft', 'stub']);
  assert.equal(engine.entityUrl('batch_file'), null);
});

test('draft and stub cards remain navigable and show honest status', () => {
  const draft = global.OMNI_CARD.card(records[1], 'entity/');
  const stub = global.OMNI_CARD.card(records[2], 'entity/');
  assert.match(draft, /href="entity\/draft\.html"/);
  assert.match(draft, />Draft</);
  assert.match(stub, /href="entity\/stub\.html"/);
  assert.match(stub, />Stub</);
  assert.doesNotMatch(draft + stub, /pointer-events:none|return false/);
});

test('quarantined records do not render public cards', () => {
  assert.equal(global.OMNI_CARD.card(records[3], 'entity/'), '');
});

test('the real index uses honest statuses and quarantines import artifacts', () => {
  const realIndex = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'assets', 'search-index.json'), 'utf8'));
  const allowed = new Set(['researched', 'reviewed', 'draft', 'stub', 'quarantined']);
  assert.equal(realIndex.every((entity) => allowed.has(entity.status)), true);
  assert.equal(realIndex.every((entity) => entity._finished === true), false);
  for (const slug of ['batch_h_dossiers', 'cryptid_dossiers', 'demon_batch_2', 'folklore_dossiers_raw', 'or_models', 'zeus.TRUE-ALL']) {
    assert.equal(realIndex.find((entity) => entity.s === slug).status, 'quarantined', slug);
  }
  assert.equal(realIndex.find((entity) => entity.s === 'lilith').status, 'researched');
});
