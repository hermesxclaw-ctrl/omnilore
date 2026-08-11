# Omnilore Complete Repair Design

## Goal

Make the static Omnilore archive dependable before expanding its prose: one local data/search system, working navigation and wings, honest record states, valid generated pages, accessible controls, and an evidence-aware editorial pipeline that can improve the corpus without silently breaking unrelated pages.

## Delivery order

1. **Foundation:** consolidate search, routes, Random, local data loading, service-worker updates, and the integrity scanner.
2. **Collections:** remove legacy wing controllers; derive filters, counts, pagination, and empty states from the same index.
3. **Interactions:** repair tabs, dialogs, menus, focus, live status, and mobile behavior through shared components.
4. **Data governance:** replace the universal finished flag with honest states; quarantine import artifacts; review duplicate-name groups without automatic identity merges; protect `entity/lilith.html`.
5. **Generator quality:** repair invalid HTML, escaping, typography URLs, image loading, shared labels, grammar, and page-specific terminology at the generator/source level.
6. **Editorial quality:** research and rewrite dossiers in bounded batches, distinguish fact from interpretation and invented framing, preserve cultural variants, and attach usable sources.
7. **Release audit:** validate every local route and dependency plus representative browser flows at every template and page depth.

## Architecture

`assets/archive-engine.js` is the sole authority for normalization, ranking, filtering, valid slugs, and depth-aware entity URLs. `assets/nav-search.js` only binds the global search UI. `assets/collection-controller.js` owns browse and wing collection behavior. `assets/widgets.js` owns reusable tabs, disclosures, menus, dialogs, and Random controls. No page keeps a competing search or collection implementation.

The site remains deployable to GitHub Pages without a server. Its backend is a deterministic local index and build-time validation pipeline. `assets/omnilore-core.js` is either integrated behind the same interfaces or removed; it must not remain an unused second data/search API.

Entity state is explicit: `researched`, `reviewed`, `draft`, `stub`, or `quarantined`. Only reviewed pages may be described as finished. Duplicate visible names are identity-review cases, not automatic deletion candidates. Batch-import artifacts remain recoverable outside public navigation until their records are split or rejected.

## Feedback and regression loop

Every behavioral change follows RED, GREEN, and impact review:

1. Add a regression test that fails for the observed defect.
2. Run it and confirm the expected failure.
3. Make the smallest production change that resolves it.
4. Run focused tests and JavaScript syntax checks.
5. Exercise the affected flow in a real browser at root, entity, or wing depth as applicable.
6. Run a corpus-wide impact scan for changed selectors, routes, generated markup, counts, and statuses.
7. Revise regressions before proceeding.
8. Run the complete suite at each release boundary.

## Visitor behavior

- Search accepts names, aliases, cultures, epithets, and close spellings consistently on every page. Arrow keys choose results; Enter opens the selected or highest-ranked valid record; Escape closes the list.
- Random always opens a valid indexed public entity and never uses a dead hash link.
- Wings expose meaningful category filters, truthful counts, useful empty states, and correctly hidden pagination controls.
- Tabs and dialogs work with mouse, touch, and keyboard and expose truthful ARIA state.
- Draft or quarantined records are never presented as researched dossiers.
- The illustrated canonical Lilith remains the only Lilith record representing that exact identity; similarly named traditions are retained when genuinely distinct.

## Content rules

- Never invent facts, sources, quotations, dates, or consensus.
- Clearly label fictional framing, modern adaptations, disputed interpretations, and regional variants.
- Prefer direct, specific prose over repeated atmospheric templates.
- Immersive openings may place the reader in a scene, but must not disguise invention as historical evidence.
- Each rewritten dossier must pass identity, factual support, originality, clarity, cultural-context, and copyediting checks.
- Pages lacking sufficient evidence remain honest stubs instead of receiving fabricated completeness.

## Safety boundaries

- No bulk deletion based on name similarity.
- No mass rewrite without a small reviewed pilot and a reversible source record.
- No search result may navigate to an unindexed slug.
- No unescaped corpus text may be inserted with `innerHTML`.
- GitHub Pages base paths, local HTTP, and supported `file:///` fallbacks must be tested deliberately.
- A failed scanner, truncated scan, console error, or untested browser path blocks a completion claim.

## Acceptance criteria

- One search/routing implementation and one collection controller serve all supported page depths.
- Global search, Browse, all 17 wings, Random, tabs, dialogs, menus, and pagination have automated regression coverage and browser evidence.
- Wing categories and visible counts are computed from the current index; unassigned records have an explicit discoverable home.
- The integrity tool understands the `/omnilore/` deployment base and reports zero broken local dependencies on a complete run.
- No public record is falsely marked finished, and batch artifacts are excluded from normal results.
- Generator scans report zero nested paragraphs, malformed font URLs, duplicate loading attributes, raw replacement characters, or double-encoded display names.
- Editorial status and sources accurately reflect the evidence available for each rewritten dossier.
- Full unit, syntax, integrity, desktop, mobile, and accessibility gates pass immediately before completion is claimed.

