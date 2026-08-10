# Omnilore Archive Engine Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every static Omnilore page use one reliable search, routing, and collection engine, then remove verified dead ends and duplicate Lilith work copies.

**Architecture:** Add a browser-safe shared module that owns normalization, result ranking, path-aware entity URLs, search UI state, and index validation. Make browse and all seventeen wing pages delegate filtering/search to shared helpers; remove their duplicated inline ranking code. Add Node built-in test and link-integrity scripts because this repository has no package manager or pre-existing test runner.

**Tech Stack:** Static HTML, browser JavaScript, Web Workers, Node.js built-in test runner, PowerShell, GitHub Pages-compatible relative URLs.

## Global Constraints

- Keep the site static; do not introduce a hosted API or database.
- Preserve `entity/lilith.html` as the canonical Lilith page.
- Do not generate lore or make unverified research claims.
- All entity-facing content inserted into HTML must be escaped.
- Every changed behavior must have RED and GREEN evidence in Node tests; checkpoint commits are required after each TDD stage.
- Keep page URLs functional from root, `/entity/`, and `/wings/` depths and when opened via `file:///`.

---

### Task 1: Establish an executable static-site test harness

**Files:**
- Create: `tests/archive-engine.test.js`
- Create: `tests/site-integrity.test.js`
- Create: `scripts/check-site-integrity.js`
- Create: `docs/testing/archive-engine-repair.tdd.md`

**Interfaces:**
- Consumes: Node.js built-in `node:test`, `assets/search-index.js`, source HTML.
- Produces: `node --test tests/archive-engine.test.js tests/site-integrity.test.js` and `node scripts/check-site-integrity.js` as repeatable verification commands.

- [ ] **Step 1: Write failing tests for the missing module and known wing regression**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createArchiveEngine } from '../assets/archive-engine.js';

test('ranks an exact entity before an alias and close spelling', () => {
  const engine = createArchiveEngine(sampleIndex);
  assert.equal(engine.search('Lilith', { limit: 3 })[0].entity.s, 'lilith');
});

test('every wing page uses the shared wing controller and has no orphan sort expression', () => {
  for (const file of wingFiles) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /archive-engine\.js/);
    assert.doesNotMatch(source, /;\.sort\(/);
  }
});
```

- [ ] **Step 2: Run the tests and record RED evidence**

Run: `node --test tests/archive-engine.test.js tests/site-integrity.test.js`

Expected: FAIL because `assets/archive-engine.js` is absent and all 17 wings contain the malformed `;.sort(...)` statement.

- [ ] **Step 3: Commit the RED checkpoint**

```powershell
git add tests/archive-engine.test.js tests/site-integrity.test.js scripts/check-site-integrity.js
git commit -m "test: add archive engine regression coverage"
```

### Task 2: Implement the shared search and route engine

**Files:**
- Create: `assets/archive-engine.js`
- Modify: `assets/nav-search.js`
- Modify: `assets/omnilore-core.js`
- Test: `tests/archive-engine.test.js`

**Interfaces:**
- Exports on `window.Omnilore.archive`: `create(index)`, `search(query, options)`, `entityUrl(slug)`, `initNavSearch(root)`.
- Consumes: indexed entries shaped `{ s, n, a, c, e, d, k, _finished }`.
- Produces: safe ranked result objects `{ entity, score, matchedBy }` and correct relative entity URLs.

- [ ] **Step 1: Expand the failing tests for root/entity/wing routes, aliases, typos, and keyboard behavior**

```js
assert.equal(engine.entityUrl('lilith', '/index.html'), 'entity/lilith.html');
assert.equal(engine.entityUrl('lilith', '/entity/lilith.html'), 'lilith.html');
assert.equal(engine.entityUrl('lilith', '/wings/pantheon-halls.html'), '../entity/lilith.html');
assert.equal(engine.search('liltih', { limit: 1 })[0].entity.s, 'lilith');
assert.equal(engine.search('Queen of the Night', { limit: 1 })[0].entity.s, 'lilith');
```

- [ ] **Step 2: Run the focused test and capture RED**

Run: `node --test tests/archive-engine.test.js`

Expected: FAIL with missing public API or assertions against the old duplicated search behavior.

- [ ] **Step 3: Implement the minimal shared engine**

```js
function createArchiveEngine(index, locationPath) {
  return {
    search(query, options) { /* normalized exact, prefix, substring, alias, culture, epithet, token, typo ranking */ },
    entityUrl(slug) { /* root/entity/wing-relative URL */ },
    initNavSearch(root) { /* input, escaped result list, arrows, Enter, Escape */ }
  };
}
```

- [ ] **Step 4: Convert `nav-search.js` into the sole global search binding**

```js
window.Omnilore.archive.initNavSearch(document);
```

Remove inline homepage and browse global-search handlers that assign `q.oninput` or `q.onkeydown`, so a field can never receive competing handlers.

- [ ] **Step 5: Run GREEN and commit**

Run: `node --test tests/archive-engine.test.js`

Expected: PASS for exact/prefix/alias/culture/typo ranking, path depths, escaping, arrows, Enter, and Escape.

```powershell
git add assets/archive-engine.js assets/nav-search.js assets/omnilore-core.js tests/archive-engine.test.js
git commit -m "fix: unify Omnilore archive search and routing"
```

### Task 3: Repair browse and every wing around shared filtering

**Files:**
- Create: `assets/collection-controller.js`
- Modify: `browse.html`
- Modify: `wings.html`
- Modify: `wings/bronze-gallery.html`
- Modify: `wings/cold-crypt.html`
- Modify: `wings/crooked-hall.html`
- Modify: `wings/evidence-room.html`
- Modify: `wings/great-menagerie.html`
- Modify: `wings/locked-wing.html`
- Modify: `wings/night-parade.html`
- Modify: `wings/observatory.html`
- Modify: `wings/painted-wing.html`
- Modify: `wings/pantheon-halls.html`
- Modify: `wings/reliquary.html`
- Modify: `wings/sealed-vault.html`
- Modify: `wings/server-vault.html`
- Modify: `wings/tape-library.html`
- Modify: `wings/twilight-garden.html`
- Modify: `wings/veiled-gallery.html`
- Modify: `wings/workshop-vault.html`
- Test: `tests/archive-engine.test.js`, `tests/site-integrity.test.js`

**Interfaces:**
- Consumes: `Omnilore.archive.search(query, { wing, culture, offset, limit })`.
- Produces: `Omnilore.collections.initWing({ wing, grid, query, count, more, entityPrefix })`.

- [ ] **Step 1: Add failing controller and DOM contract tests**

```js
test('a wing filter returns only entities whose k matches its configured wing', () => {
  assert.deepEqual(engine.search('', { wing: 'divine' }).map(r => r.entity.k), ['divine']);
});

test('browse filter buttons and every wing page declare a shared controller target', () => {
  assert.match(browseSource, /collection-controller\.js/);
  assert.match(wingSource, /Omnilore\.collections\.initWing/);
});
```

- [ ] **Step 2: Run focused tests and record RED**

Run: `node --test tests/archive-engine.test.js tests/site-integrity.test.js`

Expected: FAIL because the collection controller is absent and wings use invalid inline code.

- [ ] **Step 3: Implement filter controller and replace repetitive inline scripts**

Use real index `k` and `c` fields for wing/culture selection, reset pagination whenever filter/query changes, derive count text from the filtered result count, and route cards using the provided `entityPrefix`. Preserve browse hash filters but update the URL through `history.replaceState` after each filter change.

- [ ] **Step 4: Add a visible category control to `wings.html`**

Render category buttons from actual `k` values and filter wing doors by their declared category rather than treating "Wings" as only decorative navigation. Each door remains an anchor to its corresponding real wing page.

- [ ] **Step 5: Run GREEN and commit**

Run: `node --test tests/archive-engine.test.js tests/site-integrity.test.js`

Expected: PASS and no `;.sort(` occurrence in any wing file.

```powershell
git add assets/collection-controller.js browse.html wings.html wings tests
git commit -m "fix: make Omnilore wing and browse filters functional"
```

### Task 4: Make generic interactions accessible and consolidate Lilith

**Files:**
- Modify: `assets/widgets.js`
- Modify: `entity/lilith.html`
- Delete: `entity/lilith-12TAB-WORKCOPY.html`
- Delete: `entity/lilith-copy.html`
- Delete: `entity/lilith-perfect-copy.html`
- Delete: `entity/lilith-WORK-12TAB-EDGE.html`
- Delete: `entity/lilith-YAY-12TAB.html`
- Modify: `sitemap.xml`
- Test: `tests/site-integrity.test.js`

**Interfaces:**
- Consumes: elements with `.tab-btn[data-tab]`, `.tab-panel[id]`, and `.acc-head`.
- Produces: tablist/tab/tabpanel roles, Arrow/Home/End navigation, `aria-selected`, hidden inactive panels, and canonical `entity/lilith.html` only.

- [ ] **Step 1: Add failing accessibility and duplicate-integrity tests**

```js
assert.match(widgets, /aria-selected/);
assert.match(widgets, /ArrowRight/);
assert.equal(existsSync('entity/lilith.html'), true);
for (const duplicate of lilithWorkCopies) assert.equal(existsSync(duplicate), false);
assert.doesNotMatch(allSiteText, /lilith-(copy|12TAB-WORKCOPY|perfect-copy|WORK-12TAB-EDGE|YAY-12TAB)/i);
```

- [ ] **Step 2: Run focused tests and record RED**

Run: `node --test tests/site-integrity.test.js`

Expected: FAIL because duplicate work copies exist and tabs lack full keyboard/ARIA behavior.

- [ ] **Step 3: Implement accessible tabs and update all affected tab markup**

Use button `role="tab"`, parent `role="tablist"`, panel `role="tabpanel"`, explicit `aria-controls`, `aria-selected`, and `hidden`. Bind ArrowLeft, ArrowRight, Home, End, Enter, and Space. Ensure exactly one selected tab per tablist.

- [ ] **Step 4: Verify duplicate eligibility, delete work copies, and regenerate sitemap entries**

Before deletion, run the integrity script in report-only mode and compare exact inbound references. Delete only the five named files; retain assets and `lilith.html`. Remove only their matching sitemap URLs.

- [ ] **Step 5: Run GREEN and commit**

Run: `node --test tests/site-integrity.test.js && node scripts/check-site-integrity.js`

Expected: PASS with zero duplicate Lilith routes and zero references to deleted work copies.

```powershell
git add assets/widgets.js entity/lilith.html sitemap.xml tests/site-integrity.test.js
git rm entity/lilith-12TAB-WORKCOPY.html entity/lilith-copy.html entity/lilith-perfect-copy.html entity/lilith-WORK-12TAB-EDGE.html entity/lilith-YAY-12TAB.html
git commit -m "fix: consolidate Lilith and improve archive controls"
```

### Task 5: Run the adversarial critical audit and document factual evidence

**Files:**
- Modify: `scripts/check-site-integrity.js`
- Modify: `docs/testing/archive-engine-repair.tdd.md`
- Test: all files in `tests/`

**Interfaces:**
- Consumes: every site HTML, local `href`/`src`, sitemap URL, index slug, and representative browser user journey.
- Produces: machine-readable integrity report with source file, reference, issue type, and exit code 1 on a broken local dependency.

- [ ] **Step 1: Add failing checks for link targets, scripts, styles, images, sitemap entities, and JavaScript syntax**

```js
test('all local HTML href and src targets exist at their resolved relative paths', () => {
  assert.deepEqual(runIntegrity().missing, []);
});

test('every indexed slug has exactly one canonical entity page', () => {
  assert.deepEqual(runIntegrity().missingEntityPages, []);
  assert.deepEqual(runIntegrity().duplicateCanonicalSlugs, []);
});
```

- [ ] **Step 2: Run the complete suite and capture RED**

Run: `node --test tests/*.test.js && node scripts/check-site-integrity.js`

Expected: FAIL until remaining broken URLs or malformed scripts found by the scanner are fixed.

- [ ] **Step 3: Repair only scanner-confirmed findings**

For each failure, update the source reference or restore the valid asset; do not suppress a check or replace a missing dossier with invented content. Re-run focused tests after every repair.

- [ ] **Step 4: Run final verification and browser flows**

Run: `node --test tests/*.test.js && node scripts/check-site-integrity.js`

Then verify in a real browser: homepage search `Lilith` → Enter; alias search → Enter; browse wing/culture filters; a wing local filter; entity-page global search; Random; tabs by keyboard; and a sample of each of the 17 wing pages.

- [ ] **Step 5: Write evidence and commit**

Record exact RED/GREEN commands, output, coverage limits, browser findings, repairs, and any remaining content-quality limits in `docs/testing/archive-engine-repair.tdd.md`.

```powershell
git add scripts/check-site-integrity.js docs/testing/archive-engine-repair.tdd.md tests
git commit -m "test: verify Omnilore archive integrity"
```
