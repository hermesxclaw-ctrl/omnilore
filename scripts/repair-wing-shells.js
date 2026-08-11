const fs = require('node:fs');
const path = require('node:path');

const site = path.resolve(__dirname, '..');
const wingDirectory = path.join(site, 'wings');
const files = fs.readdirSync(wingDirectory).filter((file) => file.endsWith('.html'));
const legacyController = /<script>const WING=[\s\S]*?<\/script>(?=<script src="\.\.\/assets\/nav-search\.js"><\/script>)/;
const taxonomy = require(path.join(site, 'assets', 'wing-taxonomy.js'));
const index = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'search-index.json'), 'utf8'));
const counts = Object.fromEntries(taxonomy.map((wing) => [wing.key, 0]));
for (const entity of index) if (Object.hasOwn(counts, entity.k)) counts[entity.k] += 1;
const wingByFile = Object.fromEntries(taxonomy.map((wing) => [path.basename(wing.route), wing]));

for (const file of files) {
  const target = path.join(wingDirectory, file);
  const original = fs.readFileSync(target, 'utf8');
  let revised = original.replace(legacyController, '');
  if (!/\.more\[hidden\]\{display:none!important\}/.test(revised)) {
    revised = revised.replace('</style>', '.more[hidden]{display:none!important}</style>');
  }
  if (!/html,body\{overflow-x:hidden\}/.test(revised)) {
    revised = revised.replace('</style>', 'html,body{overflow-x:hidden}</style>');
  }
  revised = revised.replace(
    '.search-wrap input:focus{outline:0}',
    '.search-wrap input:focus{outline:2px solid transparent}.search-wrap input:focus-visible{outline:2px solid var(--signal);outline-offset:4px;border-radius:2px}'
  );
  const wing = wingByFile[file];
  if (wing) {
    const formatted = counts[wing.key].toLocaleString('en-US');
    revised = revised.replace(/(<span id="hero-count">)[^<]*(<\/span>)/, `$1${formatted} entities awake$2`);
    revised = revised.replace(/(<p class="collection-count" id="count">)[^<]*(<\/p>)/, `$1${formatted} records in this wing$2`);
    revised = revised.replace('This is a distinct wing, not a generic archive filter.', 'Search or browse the records assigned to this wing.');
  }
  if (revised !== original) fs.writeFileSync(target, revised, 'utf8');
}

console.log(`Repaired ${files.length} wing shells.`);
