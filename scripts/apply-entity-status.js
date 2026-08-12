const fs = require('node:fs');
const path = require('node:path');

function classify(entity, reviewed, researched, quarantined) {
  if (quarantined.has(entity.s)) return 'quarantined';
  if (reviewed.has(entity.s)) return 'reviewed';
  if (researched.has(entity.s)) return 'researched';
  const synopsis = String(entity.e || '').trim();
  if (!synopsis || /reserved archive dossier|this page is intentionally blank/i.test(synopsis) || synopsis.length < 80) return 'stub';
  return 'draft';
}

function isBlankPage(source) {
  return /<p class="hook">This page is intentionally blank and ready for source-backed lore, versions, images, and connections\.<\/p>/i.test(source);
}

function run() {
  const site = path.resolve(__dirname, '..');
  const policy = JSON.parse(fs.readFileSync(path.join(site, 'data', 'entity-status.json'), 'utf8'));
  const indexPath = path.join(site, 'assets', 'search-index.json');
  const scriptPath = path.join(site, 'assets', 'search-index.js');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const reviewed = new Set(policy.reviewed);
  const researched = new Set(policy.researched);
  const quarantined = new Set(policy.quarantined);
  const seen = new Set(index.map((entity) => entity.s));
  for (const slug of quarantined) if (!seen.has(slug)) throw new Error(`Quarantine slug is absent from the index: ${slug}`);
  for (const slug of researched) if (!seen.has(slug)) throw new Error(`Researched slug is absent from the index: ${slug}`);
  const counts = { reviewed: 0, researched: 0, draft: 0, stub: 0, quarantined: 0 };
  for (const entity of index) {
    entity.status = classify(entity, reviewed, researched, quarantined);
    const pagePath = path.join(site, 'entity', `${entity.s}.html`);
    if (entity.status === 'draft' && fs.existsSync(pagePath) && isBlankPage(fs.readFileSync(pagePath, 'utf8'))) entity.status = 'stub';
    entity._finished = entity.status === 'reviewed';
    counts[entity.status] += 1;
  }
  const json = JSON.stringify(index);
  fs.writeFileSync(indexPath, json, 'utf8');
  fs.writeFileSync(scriptPath, `window.OMNILORE_INDEX=${json};\n`, 'utf8');
  return { total: index.length, counts };
}

if (require.main === module) console.log(JSON.stringify(run(), null, 2));
module.exports = { classify, isBlankPage, run };
