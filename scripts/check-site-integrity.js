const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function localTarget(raw) {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('#') || value.startsWith('data:') || value.startsWith('javascript:') || value.startsWith('mailto:') || value.startsWith('tel:') || value === 'about:blank' || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return null;
  return value.split('#')[0].split('?')[0];
}

function resolveTarget(site, source, raw) {
  const target = localTarget(raw);
  if (!target) return null;
  return target.startsWith('/') ? path.resolve(site, '.' + target) : path.resolve(path.dirname(source), target);
}

function inlineScripts(source) {
  return [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1].trim()).filter(Boolean);
}

function scanSite(site) {
  const htmlFiles = walk(site).filter((file) => file.endsWith('.html'));
  const missing = [], malformedScripts = [];
  for (const file of htmlFiles) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
      const resolved = resolveTarget(site, file, match[1]);
      if (resolved && !fs.existsSync(resolved)) missing.push({ file: path.relative(site, file), target: match[1] });
    }
    for (const script of inlineScripts(source)) {
      try { new vm.Script(script, { filename: path.relative(site, file) }); }
      catch (error) { malformedScripts.push({ file: path.relative(site, file), message: error.message }); }
    }
  }
  const sitemap = path.join(site, 'sitemap.xml');
  if (fs.existsSync(sitemap)) {
    const xml = fs.readFileSync(sitemap, 'utf8');
    for (const match of xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/gi)) {
      const resolved = resolveTarget(site, sitemap, match[1]);
      if (resolved && !fs.existsSync(resolved)) missing.push({ file: 'sitemap.xml', target: match[1] });
    }
  }
  const duplicateLilithRoutes = walk(path.join(site, 'entity')).filter((file) => /lilith-(?:12tab-workcopy|copy|perfect-copy|work-12tab-edge|yay-12tab)\.html$/i.test(file)).map((file) => path.relative(site, file));
  return { htmlFiles: htmlFiles.length, missing, malformedScripts, duplicateLilithRoutes };
}

if (require.main === module) {
  const report = scanSite(path.resolve(__dirname, '..'));
  console.log(JSON.stringify(report, null, 2));
  if (report.missing.length || report.malformedScripts.length || report.duplicateLilithRoutes.length) process.exitCode = 1;
}

module.exports = { scanSite };
