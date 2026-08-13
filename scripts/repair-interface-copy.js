const fs = require('node:fs');
const path = require('node:path');

const site = path.resolve(__dirname, '..');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

let changed = 0;
for (const file of walk(site).filter((target) => target.endsWith('.html'))) {
  const source = fs.readFileSync(file, 'utf8');
  const revised = source
    .replace(/25,506|25,512|25,596/g, '25,591')
    .replace(/Demon of Mesopotamian/g, 'Demon of Mesopotamia')
    .replace(/\s*Lilith 118386 is the example\./g, '')
    .replace(/Via Wikipedia — &quot;[^&]*?&quot;; dossier /g, 'Dossier summary: ')
    .replace(/\b1 stories\b/g, '1 story')
    .replace(/\b1 powers\b/g, '1 power')
    .replace(/\b1 relations\b/g, '1 relation');
  if (revised !== source) {
    fs.writeFileSync(file, revised, 'utf8');
    changed += 1;
  }
}
console.log(`Corrected shared interface copy in ${changed} HTML files.`);
