const fs = require('node:fs');
const path = require('node:path');

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
  if (quarantined.has(entity.s)) entity.status = 'quarantined';
  else if (reviewed.has(entity.s)) entity.status = 'reviewed';
  else if (researched.has(entity.s)) entity.status = 'researched';
  else if (!entity.e || /reserved archive dossier/i.test(entity.e) || entity.e.trim().length < 80) entity.status = 'stub';
  else entity.status = 'draft';
  entity._finished = entity.status === 'reviewed';
  counts[entity.status] += 1;
}

const json = JSON.stringify(index);
fs.writeFileSync(indexPath, json, 'utf8');
fs.writeFileSync(scriptPath, `window.OMNILORE_INDEX=${json};\n`, 'utf8');
console.log(JSON.stringify({ total: index.length, counts }, null, 2));
