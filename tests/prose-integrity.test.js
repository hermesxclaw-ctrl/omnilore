const test = require('node:test');
const assert = require('node:assert/strict');

const { completeHook, repairPageHooks } = require('../scripts/repair-truncated-hooks.js');

test('builds a hook from complete sentences in the longer lead', () => {
  const lede = 'The first sentence establishes the figure in a precise and memorable way. The second sentence adds the consequence that makes the record matter. A third sentence goes further.';
  assert.equal(completeHook(lede), 'The first sentence establishes the figure in a precise and memorable way. The second sentence adds the consequence that makes the record matter.');
});

test('falls back to a word boundary and visible ellipsis when no sentence is available', () => {
  const lede = 'A deliberately long opening without terminal punctuation that keeps adding detail about a damaged generated record until the safe hook limit is reached and then continues into material that cannot be displayed whole';
  const hook = completeHook(lede);
  assert.match(hook, /…$/);
  assert.doesNotMatch(hook, /\s…$/);
  assert.equal(lede.startsWith(hook.slice(0, -1)), true);
});

test('repairs only incomplete hooks and leaves complete hooks intact', () => {
  const broken = '<p class="hook">A broken open</p><p class="lede">A complete opening carries a real sentence to its proper end. More context follows after it.</p>';
  assert.match(repairPageHooks(broken), /<p class="hook">A complete opening carries a real sentence to its proper end\.<\/p>/);
  const complete = '<p class="hook">This opening is already complete.</p><p class="lede">Different longer prose.</p>';
  assert.equal(repairPageHooks(complete), complete);
});
