# Omnilore Complete Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development for every behavior change and verification-before-completion before every release claim. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair Omnilore from its shared static backend outward, then improve its entity corpus through controlled, source-aware editorial batches.

**Architecture:** Keep GitHub Pages compatibility while making `archive-engine.js`, `nav-search.js`, `collection-controller.js`, and `widgets.js` the only shared behavior owners. Derive public status, wing membership, counts, routes, and generated HTML from validated source data rather than page-local copies.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON/JavaScript search index, Node.js built-in tests, Playwright with Microsoft Edge, Python local HTTP server, Git.

## Global Constraints

- Backend/search/routing repairs precede prose and cosmetic work.
- Preserve `entity/lilith.html` and its illustrated presentation.
- Quarantine uncertain records before deletion; never merge identities by visible name alone.
- Write and observe a failing regression test before production behavior changes.
- After each GREEN result, check browser behavior and corpus-wide side effects.
- Do not claim all-site correctness from focused tests or a truncated scan.
- Keep the site usable on GitHub Pages and through the supported local test server.

---

### Task 1: Repair the integrity gate

**Files:**
- Modify: `scripts/check-site-integrity.js`
- Modify: `tests/site-integrity.test.js`
- Create: `tests/fixtures/integrity/omnilore-prefix-sitemap.xml`

**Interfaces:**
- Consumes: `{ siteRoot, deploymentBase: '/omnilore/' }`
- Produces: `{ missing, malformedScripts, duplicateLilithRoutes, missingEntityPages, orphanEntityPages }`

- [ ] Add a test proving `/omnilore/entity/lilith.html` resolves to `<siteRoot>/entity/lilith.html`, while a real missing target remains reported.
- [ ] Run `node --test tests/site-integrity.test.js`; require failure caused by deployment-prefix handling.
- [ ] Extract and export `stripDeploymentBase(urlPath, deploymentBase)` and use it for sitemap resolution only.
- [ ] Run the focused test, then `node scripts/check-site-integrity.js`; retain the full machine-readable result.
- [ ] Add regression cases for fragments, query strings, encoded filenames, external URLs, and root-relative assets.

### Task 2: Establish one archive engine and public-record contract

**Files:**
- Modify: `assets/archive-engine.js`
- Modify: `assets/nav-search.js`
- Modify or remove: `assets/omnilore-core.js`
- Modify: `tests/archive-engine.test.js`

**Interfaces:**
- `createArchiveEngine(index, locationPath, options?)`
- `search(query, { wing?, culture?, status?, limit?, offset? })`
- `entityUrl(entityOrSlug): string | null`
- `random({ wing?, culture?, status? }): entity | null`

- [ ] Add failing tests for exact-name priority, aliases, typo tolerance, pre-escaped names, unknown slugs, public statuses, deterministic filters, and valid random results.
- [ ] Run `node --test tests/archive-engine.test.js` and verify each new assertion fails for its intended reason.
- [ ] Make archive-engine the only rank/filter/route authority; expose text values rather than prebuilt unsafe HTML.
- [ ] Reduce nav-search to a UI adapter with combobox/listbox semantics, `aria-expanded`, active-descendant state, status announcements, arrows, Enter, and Escape.
- [ ] Remove or integrate the unused second search/data API in omnilore-core.
- [ ] Run focused tests and `node --check` for every changed JavaScript file.

### Task 3: Repair Random and shared navigation

**Files:**
- Modify: `assets/widgets.js`
- Modify: shared/generated navigation markup and its source generator
- Modify: `tests/site-integrity.test.js`

**Interfaces:**
- Consumes: `.js-rand`, `window.OMNILORE_INDEX`, archive-engine.
- Produces: a valid entity navigation or an announced unavailable state.

- [ ] Add a failing test forbidding `href="#"` Random links without a shared binding and requiring the selected slug to exist.
- [ ] Bind all Random controls once through widgets/archive-engine and use a real fallback URL.
- [ ] Verify Random from root, entity, and wing pages in Edge; repeat with storage disabled.
- [ ] Scan every HTML file for orphan `#` navigation and unbound action classes.

### Task 4: Replace all competing Browse and wing controllers

**Files:**
- Modify: `assets/collection-controller.js`
- Modify: `assets/search-worker.js`
- Modify: `browse.html`
- Modify: all files under `wings/*.html`
- Modify: `tests/archive-engine.test.js`
- Modify: `tests/site-integrity.test.js`

**Interfaces:**
- `initCollection({ root, wing?, pageSize, entityPrefix })`
- Derives visible count, pagination state, and empty state from archive-engine results.

- [ ] Add failing tests proving Browse and wings share ranking, no inline `OMNILORE_INDEX.sort` runs before load, and no page defines a second scoring function.
- [ ] Remove copied Browse fallback scoring and all old wing search/filter blocks.
- [ ] Make search-worker call or share the archive-engine scoring contract; remove it if it cannot remain single-source.
- [ ] Ensure the load-more control is hidden when `visible >= total`, including zero-result wings.
- [ ] Run tests, syntax checks, and browser flows for Browse plus all 17 wings; require zero page errors.

### Task 5: Rebuild wing taxonomy and filtering

**Files:**
- Create: `assets/wing-taxonomy.js`
- Modify: `assets/search-index.json`
- Regenerate: `assets/search-index.js`
- Modify: `wings.html`
- Modify: all `wings/*.html`
- Create: `scripts/audit-wing-taxonomy.js`
- Create: `tests/wing-taxonomy.test.js`

**Interfaces:**
- `WING_TAXONOMY`: stable wing ID, label, route, description, accepted categories.
- Audit output: assigned, unassigned, invalid, and per-wing counts.

- [ ] Add failing tests for the 17 routes, computed counts, discoverable unassigned records, filter buttons, and zero unknown category keys.
- [ ] Define taxonomy separately from decorative wing prose and map records using explicit evidence from existing type/culture fields.
- [ ] Give `liminal` records a visible category/filter destination instead of silently forcing speculative reassignment.
- [ ] Replace hard-coded counts with values generated from the validated index.
- [ ] Provide useful empty states while categories are being researched.
- [ ] Run the taxonomy audit and visually test filter behavior at desktop and mobile widths.

### Task 6: Repair tabs, dialogs, menus, and live feedback

**Files:**
- Modify: `assets/widgets.js`
- Modify: generic entity-page generator/source templates
- Modify: `entity/lilith.html`
- Modify: `assets/souls/lilith/lilith.js`
- Create: `tests/widgets.test.js`

**Interfaces:**
- Each tablist controls only its own tabs/panels.
- Dialogs restore focus, close on Escape when allowed, and trap focus while modal.

- [ ] Add failing DOM-contract tests for tablist scoping, roles, selected state, hidden panels, ArrowLeft/Right, Home/End, dialogs, menus, focus visibility, and live counts.
- [ ] Refactor widgets so multiple independent tab groups cannot deactivate one another.
- [ ] Generate explicit IDs, `aria-controls`, `aria-labelledby`, `role`, `tabindex`, and `hidden` state.
- [ ] Preserve Lilith’s stronger source drawer while aligning its main tabs with the shared contract.
- [ ] Test keyboard-only flows and reduced motion at 390px and desktop widths.

### Task 7: Introduce honest status and quarantine

**Files:**
- Create: `data/entity-status.json`
- Create: `scripts/audit-entity-status.js`
- Modify/regenerate: `assets/search-index.json`
- Modify/regenerate: `assets/search-index.js`
- Modify: browse/search/card rendering
- Create: `tests/entity-status.test.js`

**Interfaces:**
- Status enum: `researched | reviewed | draft | stub | quarantined`.
- Public default: exclude `quarantined`; display honest labels for the other states.

- [ ] Add failing tests rejecting universal `_finished`, unknown statuses, and public exposure of known batch artifacts.
- [ ] Seed status from measurable evidence: source presence, template contamination, malformed markup, and explicit reviewed-page allowlists.
- [ ] Quarantine the 19 batch/import artifacts without deleting their files or source evidence.
- [ ] Show status in cards and dossiers; remove all claims that the full corpus is finished.
- [ ] Run status distribution and route-impact audits before and after regeneration.

### Task 8: Resolve identity duplicates safely

**Files:**
- Create: `data/identity-review.json`
- Create: `scripts/audit-identities.js`
- Modify: search index and entity sources only for individually reviewed cases
- Create: `tests/identity-review.test.js`

**Interfaces:**
- Decision enum: `distinct | alias-of | duplicate | unresolved` with evidence and canonical slug.

- [ ] Add failing tests protecting canonical Lilith and forbidding deletion/redirect without a recorded identity decision.
- [ ] Populate all 151 duplicate-name groups as unresolved review cases.
- [ ] Review exact duplicates using sources, culture, chronology, type, and inbound references; never decide from name alone.
- [ ] Convert verified aliases to canonical search aliases and redirects; retain genuinely distinct identities.
- [ ] Re-run route, sitemap, search, and inbound-link audits after every resolved batch.

### Task 9: Repair the entity generator and regenerate safely

**Files:**
- Locate and modify: the source generator that emits the 6,000-page template family
- Create: `scripts/audit-generated-markup.js`
- Create: `tests/generated-markup.test.js`
- Regenerate only the affected template family after a snapshot diff

**Interfaces:**
- Audit detects nested paragraphs, malformed font URLs, duplicate loading attributes, replacement characters, encoded display names, generic IDs, and context-inappropriate labels.

- [ ] Add failing fixture tests for every measured generator defect.
- [ ] Repair paragraph construction, URL assembly, escaping boundaries, loading priority, per-record IDs, and entity-aware labels in the generator.
- [ ] Generate a 20-page mixed pilot including deity, spirit, artifact, hero, cryptid, fictional character, and sparse stub.
- [ ] Compare semantic and visual output; revise the generator until the pilot passes without erasing bespoke pages.
- [ ] Back up source data, regenerate the affected family, and require zero audit findings plus route-count stability.

### Task 10: Correct interface language and spelling

**Files:**
- Create: `data/editorial-lexicon.json`
- Create: `scripts/audit-interface-copy.js`
- Modify: shared templates and individually confirmed copy defects
- Create: `tests/interface-copy.test.js`

**Interfaces:**
- Lexicon distinguishes protected proper names from confirmed misspellings and defines entity-type-aware labels.

- [ ] Add failing tests for confirmed defects such as “The Demon of Mesopotamian,” universal “The Fiend,” repeated file IDs, truncated words, and literal encoded punctuation.
- [ ] Correct shared labels at their source; preserve legitimate diacritics and variant spellings.
- [ ] Run copy scans and review every automated replacement diff for false positives.
- [ ] Browser-check headings, cards, tabs, excerpts, and search results with Unicode-heavy names.

### Task 11: Build and execute the evidence-aware editorial pipeline

**Files:**
- Create: `docs/editorial/ENTITY-DOSSIER-STANDARD.md`
- Create: `data/editorial-review.json`
- Modify: entity source records and generated pages in bounded batches
- Create: `scripts/audit-editorial-quality.js`

**Interfaces:**
- Every dossier records identity scope, sources, factual assertions, variants, disputed claims, adaptation boundaries, fictional framing, copy review, and reviewer status.

- [ ] Define the dossier standard and measurable rejection rules for repetition, unsupported universals, invented framing, vague chronology, and source-free certainty.
- [ ] Pilot the process on Lilith plus a balanced set of weak and strong pages; preserve bespoke presentation.
- [ ] Separate Lilith’s fictional journal explicitly from the historical dossier and retain the image-rich canonical route.
- [ ] Research and rewrite by cultural/identity cohort, run originality and repeated-phrase scans, then mark reviewed only after factual and editorial gates pass.
- [ ] Leave insufficiently sourced records as clear stubs; never manufacture completeness to raise counts.

### Task 12: Complete release verification and regression revision

**Files:**
- Modify: `sw.js`
- Create: `tests/browser/critical-flows.spec.js`
- Create: `docs/testing/2026-08-11-complete-repair-evidence.md`
- Modify any source file only in response to a reproduced failing check

**Interfaces:**
- Release gate exits nonzero for any unit, syntax, integrity, route, browser-console, mobile, or accessibility failure.

- [ ] Add tests proving service-worker versioning and cache strategy deliver changed core assets rather than preserving stale behavior.
- [ ] Run `node --test tests/*.test.js` and retain complete output.
- [ ] Run `node --check` over all standalone JavaScript and compile-check inline scripts.
- [ ] Run the corrected full integrity, taxonomy, identity, status, markup, and editorial audits to completion.
- [ ] Browser-test homepage, Browse, all wings, representative entities for every template/status, search variants, Random, tabs, dialogs, menus, pagination, missing-index degradation, desktop, and 390px mobile.
- [ ] Record console errors, failed requests, counts, screenshots, and coverage limits; write a failing regression test before every resulting repair.
- [ ] Repeat the complete release gate after the final repair. Claim completion only if the fresh run exits zero and the evidence document reports no unresolved blocker.

