const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { scanSite, stripDeploymentBase } = require('../scripts/check-site-integrity.js');

const site = path.resolve(__dirname, '..');
const wings = fs.readdirSync(path.join(site, 'wings')).filter((file) => file.endsWith('.html'));

test('sitemap deployment URLs resolve beneath the static site root', () => {
  assert.equal(stripDeploymentBase('/omnilore/entity/lilith.html', '/omnilore/'), 'entity/lilith.html');
  assert.equal(stripDeploymentBase('/omnilore/', '/omnilore/'), 'index.html');
  assert.equal(stripDeploymentBase('/entity/lilith.html', '/omnilore/'), 'entity/lilith.html');
});

test('every wing is free of the malformed orphan sort statement', () => {
  const broken = wings.filter((file) => {
    const source = fs.readFileSync(path.join(site, 'wings', file), 'utf8');
    return source.includes(';.sort(');
  });
  assert.deepEqual(broken, []);
});

test('every wing delegates filtering to the shared collection controller', () => {
  const missing = wings.filter((file) => {
    const source = fs.readFileSync(path.join(site, 'wings', file), 'utf8');
    return !source.includes('../assets/collection-controller.js');
  });
  assert.deepEqual(missing, []);
});

test('wings contain no competing inline collection implementation', () => {
  const legacy = wings.filter((file) => {
    const source = fs.readFileSync(path.join(site, 'wings', file), 'utf8');
    return /OMNILORE_INDEX\.sort|const WING=|new Worker\('\.\.\/assets\/search-worker\.js'\)/.test(source);
  });
  assert.deepEqual(legacy, []);
});

test('wing pagination respects the hidden attribute', () => {
  const broken = wings.filter((file) => {
    const source = fs.readFileSync(path.join(site, 'wings', file), 'utf8');
    return /\.more\{display:block/.test(source) && !/\.more\[hidden\]\{display:none/.test(source);
  });
  assert.deepEqual(broken, []);
});

test('homepage and browse do not bind competing legacy global-search handlers', () => {
  const homepage = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  const browse = fs.readFileSync(path.join(site, 'browse.html'), 'utf8');
  assert.doesNotMatch(homepage, /\/\/ search with aliases/);
  assert.doesNotMatch(browse, /var sel=-1,lastTop=null/);
});

test('Browse delegates ranking and filtering to the archive engine', () => {
  const browse = fs.readFileSync(path.join(site, 'browse.html'), 'utf8');
  assert.match(browse, /assets\/browse-controller\.js/);
  assert.match(browse, /assets\/archive-engine\.js/);
  assert.doesNotMatch(browse, /new Worker\(|function scoreEnt|function lev\(/);
});

test('Wings exposes categorized filters and computed counts', () => {
  const source = fs.readFileSync(path.join(site, 'wings.html'), 'utf8');
  assert.match(source, /id="wing-filters"/);
  assert.match(source, /assets\/wing-taxonomy\.js/);
  assert.match(source, /assets\/wings-controller\.js/);
  assert.doesNotMatch(source, /624 entities|37 entities|434 entities/);
});

test('visible archive totals and canonical Lilith grammar are current', () => {
  for (const file of ['index.html', 'browse.html', 'wings.html', 'rabbit-hole.html', 'legal.html', path.join('entity', 'lilith.html')]) {
    const source = fs.readFileSync(path.join(site, file), 'utf8');
    assert.doesNotMatch(source, /25,506|25,512|25,596/, file);
  }
  const lilith = fs.readFileSync(path.join(site, 'entity', 'lilith.html'), 'utf8');
  assert.doesNotMatch(lilith, /Demon of Mesopotamian|Demon of Mesopotamia/);
  assert.match(lilith, /MESOPOTAMIAN AND JEWISH TRADITIONS · LAYERED RECORD/);
});

test('the shared nav loader can supply the search index to pages that only load a worker', () => {
  const navSearch = fs.readFileSync(path.join(site, 'assets', 'nav-search.js'), 'utf8');
  assert.match(navSearch, /search-index\.js/);
  assert.match(navSearch, /ensureIndex/);
});

test('shared navigation owns Random and search accessibility state', () => {
  const navSearch = fs.readFileSync(path.join(site, 'assets', 'nav-search.js'), 'utf8');
  const homepage = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  assert.match(navSearch, /\.js-rand/);
  assert.match(navSearch, /\.random\(/);
  assert.match(navSearch, /role.*combobox/);
  assert.match(navSearch, /aria-expanded/);
  assert.match(navSearch, /role.*listbox/);
  assert.doesNotMatch(homepage, /getElementById\('rand'\)\.onclick/);
});

test('only the canonical Lilith page remains', () => {
  const duplicates = [
    'lilith-12TAB-WORKCOPY.html',
    'lilith-copy.html',
    'lilith-perfect-copy.html',
    'lilith-WORK-12TAB-EDGE.html',
    'lilith-YAY-12TAB.html'
  ].filter((file) => fs.existsSync(path.join(site, 'entity', file)));
  assert.deepEqual(duplicates, []);
  assert.equal(fs.existsSync(path.join(site, 'entity', 'lilith.html')), true);
});

test('generic tabs expose scoped keyboard and ARIA behavior', () => {
  const widgets = fs.readFileSync(path.join(site, 'assets', 'widgets.js'), 'utf8');
  assert.match(widgets, /\.tabbar/);
  assert.match(widgets, /role.*tablist/);
  assert.match(widgets, /aria-selected/);
  assert.match(widgets, /aria-controls/);
  assert.match(widgets, /ArrowRight/);
  assert.match(widgets, /Home/);
  assert.match(widgets, /End/);
  assert.doesNotMatch(widgets, /document\.querySelectorAll\('\.tab-btn'\)\.forEach/);
});

test('service worker refreshes every shared archive dependency', () => {
  const worker = fs.readFileSync(path.join(site, 'sw.js'), 'utf8');
  for (const asset of ['archive-engine.js', 'nav-search.js', 'collection-controller.js', 'browse-controller.js', 'wing-taxonomy.js', 'wings-controller.js', 'widgets.js']) {
    assert.match(worker, new RegExp(asset.replace('.', '\\.')));
  }
  assert.match(worker, /omnilore-v3/);
  assert.match(worker, /staleWhileRevalidate/);
});

test('all local page, asset, and sitemap targets resolve to files in the archive', () => {
  const report = scanSite(site);
  assert.deepEqual(report.missing, []);
  assert.deepEqual(report.malformedScripts, []);
  assert.deepEqual(report.duplicateLilithRoutes, []);
});
