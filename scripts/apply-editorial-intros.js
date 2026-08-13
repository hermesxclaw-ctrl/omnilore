#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const intros = JSON.parse(fs.readFileSync(path.join(root, 'data', 'editorial-intros.json'), 'utf8'));
const region = /(<div class="tab-panel active" id="tab-t0"><div class="divider">The Figure<\/div>\s*)[\s\S]*?(<p style="font-family:JetBrains Mono,monospace;font-size:\.52rem;letter-spacing:1px;text-transform:uppercase;color:var\(--t3\);margin:6px 0 10px">Full dossier)/;

for (const [slug, intro] of Object.entries(intros)) {
  const target = path.join(root, 'entity', `${slug}.html`);
  const original = fs.readFileSync(target, 'utf8');
  if (!region.test(original)) throw new Error(`Could not locate introduction region for ${slug}`);
  const replacement = `$1<p style="font-family:JetBrains Mono,monospace;font-size:.52rem;letter-spacing:1px;text-transform:uppercase;color:var(--t3);margin:-6px 0 12px">${intro.label}</p><p class="hook">${intro.hook}</p><div class="divider">Who It Is</div><p class="lede">${intro.lede}</p><p>${intro.body}</p>$2`;
  const revised = original.replace(region, replacement);
  if (revised !== original) fs.writeFileSync(target, revised, 'utf8');
}

console.log(`Applied ${Object.keys(intros).length} researched dossier introductions.`);
