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
    .replace(/Demon of Mesopotamian/g, 'Demon of Mesopotamia');
  if (revised !== source) {
    fs.writeFileSync(file, revised, 'utf8');
    changed += 1;
  }
}
console.log(`Corrected shared interface copy in ${changed} HTML files.`);
