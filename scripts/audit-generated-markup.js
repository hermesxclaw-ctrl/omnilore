const fs = require('node:fs');
const path = require('node:path');

function occurrences(source, pattern) {
  return [...String(source).matchAll(pattern)].length;
}

function inspectMarkup(source, entity) {
  return {
    nestedParagraphs: occurrences(source, /<p(?:\s[^>]*)?><p>/gi),
    chainedFontUrls: occurrences(source, /display=swap\/css2\?family=/gi),
    repeatedFileIds: occurrences(source, /AAT-1524/g),
    genericFiendLabels: entity && entity.wing === 'demonic' ? 0 : occurrences(source, />The Fiend</g),
    genericWakeActions: occurrences(source, /Wake the Coils/g),
    replacementCharacters: occurrences(source, /�/g),
    duplicateLoadingAttributes: occurrences(source, /<img\b[^>]*\bloading=["'][^"']+["'][^>]*\bloading=["'][^"']+["'][^>]*>/gi)
  };
}

function stableFileId(slug) {
  var hash = 2166136261;
  for (const character of String(slug || 'record')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `OMNI-${String(hash >>> 0).padStart(10, '0')}`;
}

function openingLabel(wing) {
  if (wing === 'demonic') return 'The Fiend';
  if (wing === 'relic' || wing === 'construct' || wing === 'fine-art') return 'The Object';
  if (wing === 'beast' || wing === 'cryptid' || wing === 'eldritch' || wing === 'undead') return 'The Being';
  return 'The Figure';
}

function repairImageLoading(tag) {
  const values = [...tag.matchAll(/\sloading=["']([^"']+)["']/gi)].map((match) => match[1].toLowerCase());
  if (values.length < 2) return tag;
  const selected = values.includes('eager') ? 'eager' : values[values.length - 1];
  return tag.replace(/\sloading=["'][^"']+["']/gi, '').replace(/\s*(\/?>)$/, ` loading="${selected}"$1`);
}

function repairMarkup(source, entity) {
  let revised = String(source);
  let previous;
  do {
    previous = revised;
    revised = revised.replace(/<p(\s[^>]*)?><p>([\s\S]*?)<\/p><\/p>/gi, '<p$1>$2</p>');
  } while (revised !== previous && /<p(?:\s[^>]*)?><p>/i.test(revised));
  revised = revised.replace(/<p(\s[^>]*)?><p>([\s\S]*?)(?=<p(?:\s|>))/gi, '<p$1>$2</p>');
  revised = revised.replace(/&display=swap\/css2\?family=/gi, '&family=');
  revised = revised.replace(/AAT-1524/g, stableFileId(entity.slug));
  revised = revised.replace(/>The Fiend</g, '>' + openingLabel(entity.wing) + '<');
  revised = revised.replace(/Wake the Coils/g, 'Reveal archive effect');
  revised = revised.replace(/>�<\/text>/g, '>◇</text>');
  revised = revised.replace(/<img\b[^>]*>/gi, repairImageLoading);
  return revised;
}

function totalFindings(report) {
  return Object.values(report).reduce((sum, value) => sum + value, 0);
}

function run(options) {
  const site = options.site;
  const index = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'search-index.json'), 'utf8'));
  const bySlug = new Map(index.map((entity) => [entity.s, entity]));
  const files = fs.readdirSync(path.join(site, 'entity')).filter((file) => file.endsWith('.html'));
  const totals = {}, remaining = {}, changed = [];
  for (const file of files) {
    const target = path.join(site, 'entity', file);
    const source = fs.readFileSync(target, 'utf8');
    const slug = file.slice(0, -5), entity = bySlug.get(slug) || {};
    const context = { slug, wing: entity.k };
    const before = inspectMarkup(source, context);
    for (const [name, count] of Object.entries(before)) totals[name] = (totals[name] || 0) + count;
    let output = source;
    if (options.repair && totalFindings(before)) {
      output = repairMarkup(source, context);
      if (output !== source) {
        fs.writeFileSync(target, output, 'utf8');
        changed.push(file);
      }
    }
    const after = inspectMarkup(output, context);
    for (const [name, count] of Object.entries(after)) remaining[name] = (remaining[name] || 0) + count;
  }
  return { files: files.length, changed: changed.length, totals, remaining };
}

if (require.main === module) {
  const report = run({ site: path.resolve(__dirname, '..'), repair: process.argv.includes('--repair') });
  console.log(JSON.stringify(report, null, 2));
  if (!process.argv.includes('--repair') && totalFindings(report.remaining)) process.exitCode = 1;
}

module.exports = { inspectMarkup, repairMarkup, run };
