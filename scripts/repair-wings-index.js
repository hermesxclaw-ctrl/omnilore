const fs = require('node:fs');
const path = require('node:path');
const taxonomy = require('../assets/wing-taxonomy.js');

const site = path.resolve(__dirname, '..');
const target = path.join(site, 'wings.html');
const index = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'search-index.json'), 'utf8'));
const counts = Object.create(null);
for (const entity of index) counts[entity.k] = (counts[entity.k] || 0) + 1;
let source = fs.readFileSync(target, 'utf8');

for (const wing of taxonomy) {
  const route = wing.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`(href="${route}"[\\s\\S]*?<span class="arch-count">)[^<]*(</span>)`);
  if (!expression.test(source)) throw new Error(`Missing wing door for ${wing.route}`);
  source = source.replace(expression, `$1${(counts[wing.key] || 0).toLocaleString('en-US')} entities$2`);
}

source = source.replace('Choose a <em>door,</em><br>not a filter.', 'Choose a <em>door,</em><br>or narrow the halls.');
source = source.replace('Every wing has its own weather, its own rules, and its own way of teaching you what the Archive contains. Find the room that is looking for you.', 'Every wing keeps its own atmosphere. Use the categories to narrow the halls, then enter the room that is looking for you.');
source = source.replace('</header><main class="gallery">', '</header><section class="wing-filter-shell" aria-label="Filter the wings"><p>Filter the seventeen doors</p><div id="wing-filters" class="wing-filters"></div><span id="wing-filter-status" class="wing-filter-status" aria-live="polite">17 wings shown</span></section><main class="gallery">');
source = source.replace('</style>', '.wing-filter-shell{max-width:1400px;margin:0 auto;padding:28px clamp(18px,5vw,72px) 0}.wing-filter-shell>p{margin:0 0 10px;color:var(--signal);font:500 .53rem "JetBrains Mono",monospace;letter-spacing:2px;text-transform:uppercase}.wing-filters{display:flex;flex-wrap:wrap;gap:7px}.wing-filters button{min-height:42px;padding:9px 13px;border:1px solid var(--hair);background:rgba(238,230,211,.025);color:rgba(238,230,211,.68);font:500 .54rem "JetBrains Mono",monospace;letter-spacing:1px;text-transform:uppercase;cursor:pointer}.wing-filters button[aria-pressed="true"]{border-color:var(--signal);background:rgba(139,191,193,.12);color:#d8eeee}.wing-filter-status{display:block;margin-top:10px;color:rgba(238,230,211,.5);font:500 .5rem "JetBrains Mono",monospace;letter-spacing:1px}.wing-door[hidden]{display:none!important}</style>');
const footerScripts = '<script src="assets/search-index.js"></script><script src="assets/nav-search.js"></script>';
if (!source.includes(footerScripts)) throw new Error('Missing Wings footer scripts');
source = source.replace(footerScripts, '<script src="assets/search-index.js"></script><script src="assets/wing-taxonomy.js"></script><script src="assets/nav-search.js"></script><script src="assets/wings-controller.js"></script>');
fs.writeFileSync(target, source, 'utf8');
console.log('Repaired Wings index with computed counts and categorized filters.');
