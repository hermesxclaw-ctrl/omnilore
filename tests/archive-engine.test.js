const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { createArchiveEngine } = require('../assets/archive-engine.js');

const index = [
  { s: 'lilith', n: 'Lilith', a: ['Queen of the Night'], c: 'Jewish folklore', e: 'Night spirit', k: 'divine', _finished: true },
  { s: 'lilitu', n: 'Lilitu', a: [], c: 'Mesopotamian religion', e: 'Wind spirit', k: 'divine', _finished: true },
  { s: 'lamia', n: 'Lamia', a: [], c: 'Greek mythology', e: 'Child-devouring daemon', k: 'monster', _finished: false }
];

test('ranks exact names, aliases, and close spellings deterministically', () => {
  const engine = createArchiveEngine(index, '/index.html');
  assert.equal(engine.search('Lilith', { limit: 3 })[0].entity.s, 'lilith');
  assert.equal(engine.search('Queen of the Night', { limit: 3 })[0].entity.s, 'lilith');
  assert.equal(engine.search('Liltih', { limit: 3 })[0].entity.s, 'lilith');
});

test('filters by real wing and culture fields', () => {
  const engine = createArchiveEngine(index, '/browse.html');
  assert.deepEqual(engine.search('', { wing: 'divine' }).map((result) => result.entity.s), ['lilith', 'lilitu']);
  assert.deepEqual(engine.search('', { culture: 'Greek mythology' }).map((result) => result.entity.s), ['lamia']);
});

test('builds working entity URLs at root, entity, and wing page depths', () => {
  assert.equal(createArchiveEngine(index, '/index.html').entityUrl('lilith'), 'entity/lilith.html');
  assert.equal(createArchiveEngine(index, '/entity/lilith.html').entityUrl('lilith'), 'lilith.html');
  assert.equal(createArchiveEngine(index, '/wings/pantheon-halls.html').entityUrl('lilith'), '../entity/lilith.html');
});

test('resolves keyboard navigation to selection before top result', () => {
  const engine = createArchiveEngine(index, '/index.html');
  const results = engine.search('lil', { limit: 3 });
  assert.equal(engine.resolveResultUrl(results, 1), 'entity/lilitu.html');
  assert.equal(engine.resolveResultUrl(results, -1), 'entity/lilith.html');
});

test('rejects unknown entity slugs instead of creating a dead route', () => {
  const engine = createArchiveEngine(index, '/index.html');
  assert.equal(engine.entityUrl('missing-entity'), null);
});
