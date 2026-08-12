const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.resolve(__dirname, '..');
const entityDirectory = path.join(site, 'entity');
const files = fs.readdirSync(entityDirectory).filter((file) => file.endsWith('.html'));
const statuses = new Map(JSON.parse(fs.readFileSync(path.join(site, 'assets', 'search-index.json'), 'utf8')).map((entity) => [`${entity.s}.html`, entity.status]));

test('every entity keeps its tab map, interaction controller, and wired placeholder links', () => {
  const tabIssues = [];
  const placeholderIssues = [];
  const missingWidgets = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(entityDirectory, file), 'utf8');
    const tabs = [...source.matchAll(/class="tab-btn[^"]*"[^>]*data-tab="([^"]+)"/g)].map((match) => match[1]);
    const panelIds = [...source.matchAll(/<div class="tab-panel[^"]*" id="tab-([^"]+)"/g)].map((match) => match[1]);
    if (!['stub', 'quarantined'].includes(statuses.get(file)) && (tabs.length !== 12 || new Set(tabs).size !== tabs.length || tabs.some((id) => !panelIds.includes(id)))) {
      tabIssues.push({ file, tabs: tabs.length, panels: panelIds.length });
    }
    for (const match of source.matchAll(/<a\b[^>]*href="#"[^>]*>/g)) {
      if (!/class="[^"]*\bjs-rand\b/.test(match[0])) placeholderIssues.push({ file, markup: match[0] });
    }
    if (!source.includes('../assets/widgets.js')) missingWidgets.push(file);
  }
  assert.deepEqual(tabIssues, []);
  assert.deepEqual(placeholderIssues, []);
  assert.deepEqual(missingWidgets, []);
});
