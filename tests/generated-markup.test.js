const test = require('node:test');
const assert = require('node:assert/strict');

const { inspectMarkup, repairMarkup } = require('../scripts/audit-generated-markup.js');

test('repairs nested paragraphs without losing their content', () => {
  const source = '<p class="lede"><p>A storm arrives.</p></p><p><p>The door opens.</p></p>';
  const repaired = repairMarkup(source, { slug: 'storm', wing: 'spirit' });
  assert.equal(repaired, '<p class="lede">A storm arrives.</p><p>The door opens.</p>');
  assert.equal(inspectMarkup(repaired).nestedParagraphs, 0);
});

test('repairs generator paragraphs whose closing tags were truncated', () => {
  const source = '<p><p>Attested account ends abruptly<p class="meta">Sources</p>';
  const repaired = repairMarkup(source, { slug: 'account', wing: 'divine' });
  assert.equal(repaired, '<p>Attested account ends abruptly</p><p class="meta">Sources</p>');
});

test('repairs chained Google Fonts URLs and repeated generic identifiers', () => {
  const source = 'href="https://fonts.googleapis.com/css2?family=Inter&display=swap/css2?family=Lora&display=swap" FILE OPENED — AAT-1524 >Wake the Coils<';
  const repaired = repairMarkup(source, { slug: 'aatxe', wing: 'liminal' });
  assert.match(repaired, /family=Inter&family=Lora&display=swap/);
  assert.doesNotMatch(repaired, /display=swap\/css2|AAT-1524/);
  assert.match(repaired, />Reveal archive effect</);
});

test('uses entity-aware opening labels', () => {
  assert.match(repairMarkup('>The Fiend<', { slug: 'athena', wing: 'divine' }), />The Figure</);
  assert.match(repairMarkup('>The Fiend<', { slug: 'aegis', wing: 'relic' }), />The Object</);
  assert.match(repairMarkup('>The Fiend<', { slug: 'beelzebub', wing: 'demonic' }), />The Fiend</);
});

test('does not flag Fiend labels for demonic records', () => {
  assert.equal(inspectMarkup('>The Fiend<', { wing: 'demonic' }).genericFiendLabels, 0);
  assert.equal(inspectMarkup('>The Fiend<', { wing: 'divine' }).genericFiendLabels, 1);
});

test('replaces corrupt generated sigil characters', () => {
  const repaired = repairMarkup('<text>�</text>', { slug: 'unknown', wing: 'liminal' });
  assert.equal(repaired, '<text>◇</text>');
});
