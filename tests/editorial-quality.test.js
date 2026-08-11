const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = require('../assets/search-index.json');

test('editorial audit covers every public draft and researched dossier', () => {
  const auditPath = path.join(root, 'data', 'editorial-audit.json');
  assert.equal(fs.existsSync(auditPath), true, 'data/editorial-audit.json is required');
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const expected = index.filter((entity) => ['draft', 'researched'].includes(entity.status)).map((entity) => entity.s).sort();
  assert.deepEqual(audit.records.map((record) => record.slug).sort(), expected);
  assert.equal(audit.records.every((record) => Array.isArray(record.flags)), true);
});

test('Omnilore has a reusable anti-generic voice profile', () => {
  const profile = fs.readFileSync(path.join(root, 'docs', 'editorial', 'voice-profile.md'), 'utf8');
  assert.match(profile, /VOICE PROFILE/);
  assert.match(profile, /Banned Moves/);
  assert.match(profile, /Do not begin with “Imagine”/);
  assert.match(profile, /Evidence before atmosphere/);
});

test('canonical Lilith opens with evidence rather than an invented reader story', () => {
  const page = fs.readFileSync(path.join(root, 'entity', 'lilith.html'), 'utf8');
  assert.doesNotMatch(page, /grandmother&#39;s attic|She visits me in my dreams/);
  assert.match(page, /A protective bowl does not tell a biography/);
  assert.match(page, /The first-wife story arrives much later/);
  assert.match(page, /MESOPOTAMIAN AND JEWISH TRADITIONS/);
});

test('Lilith search excerpt matches the evidence-led opening', () => {
  const lilith = index.find((entity) => entity.s === 'lilith');
  assert.match(lilith.e, /A protective bowl does not tell a biography/);
  assert.doesNotMatch(lilith.e, /grandmother|journal/i);
});

test('researched core dossiers have complete evidence-led introductions', () => {
  const slugs = ['achilles', 'anubis', 'athena', 'banshee', 'baphomet', 'hades'];
  const intros = require('../data/editorial-intros.json');
  for (const slug of slugs) {
    const page = fs.readFileSync(path.join(root, 'entity', `${slug}.html`), 'utf8');
    const firstPanel = page.match(/<div class="tab-panel active"[\s\S]*?<\/div>\s*<div class="tab-panel"/);
    assert.ok(firstPanel, `missing first panel for ${slug}`);
    assert.doesNotMatch(firstPanel[0], /<p>Attested:/, slug);
    assert.doesNotMatch(firstPanel[0], /Twelve tabs, wiki-sorted|Full frag wired/, slug);
    assert.match(firstPanel[0], /<p class="hook">[^<]{80,}<\/p>/, slug);
    assert.match(firstPanel[0], /<p class="lede">[^<]{120,}<\/p>/, slug);
    assert.equal(index.find((entity) => entity.s === slug).e, intros[slug].hook, `${slug} search excerpt`);
  }
});
