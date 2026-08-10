# Omnilore Archive Engine Design

## Goal

Replace the static site's scattered, inconsistent page scripts with one dependable archive engine so a visitor can search, filter, and open any valid entity from the home page, browse page, wings, or entity pages.

## Scope and order

This is deliberately split into independent releases. The first release is site infrastructure, not mass prose generation.

1. **Archive engine:** one shared, client-side search and route module loaded from every page depth.
2. **Navigation and collection behavior:** all global search boxes, random links, wing pages, collection filters, tabs, keyboard controls, and result links use that module or a compatible shared helper.
3. **Integrity repair:** detect broken local links, broken scripts, malformed inline JavaScript, duplicate page records, stale count labels, and inaccessible controls. Keep canonical `entity/lilith.html`; remove only the five explicitly named Lilith work-copy files after automated reference checks prove nothing links to them.
4. **Independent audit:** run a separate review pass that treats the work as untrusted: validate every local URL target, execute critical user flows, inspect console errors, and repair verified findings.
5. **Editorial work:** revise only researched/visible high-value pages in source-aware batches. Do not manufacture information for unresearched templates; visibly distinguish researched dossiers from catalogue stubs.

## User journeys

- As a visitor, I can type a name, alias, culture, epithet, or close spelling into any global search box and get ranked results.
- As a keyboard user, I can use Arrow keys to choose a result, Enter to open the selected result (or the highest ranked result), and Escape to close results.
- As a visitor, I can open a wing and use its category/filter controls to narrow that wing's real entity data without a broken page or false count.
- As a visitor, I can activate a tab or disclosure with a mouse or keyboard and receive the associated on-page information with correct ARIA state.
- As a visitor, every internal archive link opens a real local page and never points at a deleted duplicate.
- As a reader, I see one canonical Lilith page: the existing image-rich `entity/lilith.html`.

## Architecture

`assets/archive-engine.js` will be the single source of truth for path-aware entity URLs, normalized search ranking, safe result rendering, keyboard selection, and search-index readiness. It consumes `assets/search-index.js` and does not require a server, keeping GitHub Pages compatibility.

`assets/nav-search.js` becomes a thin global-search adapter or is folded into the archive engine without duplicate event handlers. Browse and wing pages call the same normalization/ranking functions rather than keeping separate inline variants. Wing data remains defined by `k` values in the index; the interface exposes these categories as selectable filters and derives counts from the current filtered result set.

The site will retain static entity HTML pages. "Backend" here means a deterministic local data layer and route-integrity checks, not a misleading network API or database that GitHub Pages cannot host.

## Error handling and safety

- If the search index is unavailable, show a clear loading/unavailable state rather than dead results.
- Never inject entity names, aliases, cultures, or query text through unsafe HTML; escape result content before rendering.
- Only navigate to a slug after validating that it is a valid indexed entity slug.
- Keep Unicode-aware normalization for diacritics and aliases.
- Preserve exact identity boundaries: do not merge similarly named entities as a side effect of duplicate cleanup.
- Deletion eligibility requires: exact filename match, byte/content comparison, no sitemap/navigation/index reference, and no inbound local HTML reference.

## Testing and verification

Tests will precede production changes. The test suite will cover ranking (exact, prefix, alias, culture, typo), path generation at root/entity/wing depth, Enter and arrow-key behavior, filters, tab keyboard access, canonical Lilith references, and route/link integrity.

The critical browser pass will test homepage search, browse search and filters, one representative page from each wing, an entity-page search, random navigation, mobile menu, and all local script/style/image/link URLs. The final integrity scan checks every local `href`, `src`, sitemap URL, and indexed entity route against the filesystem and reports failures by source file.

## Explicit non-goals for this release

- Claiming that all 25,596 entries have researched prose.
- Building a server/API that cannot run on the static GitHub Pages deployment.
- Deleting an entity merely because its name resembles another entity.
- Adding uncited lore or graph links to make sparse pages sound complete.

## Acceptance criteria

- A single shared search implementation serves all page depths and supports Enter, arrows, Escape, aliases, and close spelling.
- Every wing loads valid entity data, has working filters, and reports accurate visible counts.
- The canonical Lilith remains; confirmed work-copy duplicates are absent from the site, sitemap, index, and links.
- No broken internal local URL, malformed production JavaScript, or console error remains in the audited critical paths.
- Accessibility checks confirm keyboard-operable controls and truthful ARIA states.
- A separate critical audit produces evidence of the tests and any repaired findings.
