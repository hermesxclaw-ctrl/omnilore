#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function isComplete(value) {
  const text = String(value).replace(/<[^>]+>/g, '').trim();
  return /[.!?…](?:&(?:quot|rsquo|rdquo);|["'’”])?$/.test(text);
}

function balanceInlineTags(fragment) {
  const stack = [];
  const voidTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr']);
  for (const match of fragment.matchAll(/<\s*(\/?)\s*([a-z][\w-]*)\b[^>]*>/gi)) {
    const closing = Boolean(match[1]);
    const name = match[2].toLowerCase();
    if (voidTags.has(name) || /\/\s*>$/.test(match[0])) continue;
    if (!closing) stack.push(name);
    else {
      const index = stack.lastIndexOf(name);
      if (index >= 0) stack.splice(index, 1);
    }
  }
  return fragment + stack.reverse().map((name) => `</${name}>`).join('');
}

function repairParagraph(innerHtml) {
  const value = String(innerHtml);
  const trimmed = value.trim();
  if (trimmed.length <= 180 || isComplete(trimmed)) return value;
  const boundaries = [...trimmed.matchAll(/[.!?…](?:&(?:quot|rsquo|rdquo);|["'’”])?(?=\s|<|$)/g)];
  if (!boundaries.length) return value;
  const last = boundaries[boundaries.length - 1];
  const end = last.index + last[0].length;
  if (end < 80) return value;
  return balanceInlineTags(trimmed.slice(0, end));
}

function repairPageProse(source) {
  return String(source).replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, function (match, attributes, innerHtml) {
    if (/\bclass=["'][^"']*\bhook\b/i.test(attributes || '')) return match;
    const repaired = repairParagraph(innerHtml);
    return repaired === innerHtml ? match : `<p${attributes || ''}>${repaired}</p>`;
  });
}

function run(site) {
  const directory = path.join(site, 'entity');
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.html'));
  let changed = 0;
  for (const file of files) {
    const target = path.join(directory, file);
    const source = fs.readFileSync(target, 'utf8');
    const revised = repairPageProse(source);
    if (revised === source) continue;
    fs.writeFileSync(target, revised, 'utf8');
    changed += 1;
  }
  return { files: files.length, changed };
}

if (require.main === module) console.log(JSON.stringify(run(path.resolve(__dirname, '..')), null, 2));

module.exports = { repairParagraph, repairPageProse, run };
