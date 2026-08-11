const test = require('node:test');
const assert = require('node:assert/strict');

const { repairParagraph, repairPageProse } = require('../scripts/repair-truncated-prose.js');

test('drops only the unfinished tail after a complete factual sentence', () => {
  const text = 'This opening sentence provides a complete and useful fact about the figure. This second sentence is also complete and adds necessary context. The generated third sentence cuts off before the final wor';
  assert.equal(repairParagraph(text), 'This opening sentence provides a complete and useful fact about the figure. This second sentence is also complete and adds necessary context.');
});

test('does not rewrite paragraphs without a defensible sentence boundary', () => {
  const text = 'A long generated passage with no sentence boundary that continues past the minimum length while listing uncertain material and eventually cuts off before the original writer could finish the thought or identify the sour';
  assert.equal(repairParagraph(text), text);
});

test('repairs inline markup while balancing tags at the sentence boundary', () => {
  const html = 'A complete sentence establishes the figure with <i>important evidence and necessary historical context.</i> A damaged continuation keeps accumulating enough text to pass the repair threshold, adds another clause without evidence, and then trails off inside <strong>source mater';
  assert.equal(repairParagraph(html), 'A complete sentence establishes the figure with <i>important evidence and necessary historical context.</i>');
});

test('repairs eligible body paragraphs without changing hooks', () => {
  const source = '<p class="hook">A complete hook.</p><p>This opening sentence provides a complete and useful fact about the figure with <i>necessary historical context.</i> The generated second sentence keeps accumulating damaged material until it finally cuts of</p>';
  const repaired = repairPageProse(source);
  assert.match(repaired, /<p>This opening sentence provides a complete and useful fact about the figure with <i>necessary historical context\.<\/i><\/p>/);
  assert.match(repaired, /<p class="hook">A complete hook\.<\/p>/);
});
