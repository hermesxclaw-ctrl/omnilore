#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const entityDirectory = path.join(root, 'entity');
const files = fs.readdirSync(entityDirectory).filter((file) => file.endsWith('.html'));
const incompleteHooks = [];
const incompleteProse = [];

function plainText(html) {
  return html.replace(/<[^>]+>/g, '')
    .replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;|&rsquo;/g, '’')
    .replace(/&hellip;/g, '…').replace(/&[^;]+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

function looksIncomplete(text) {
  return text.length > 30 && !/[.!?…:;”’"')\]]$/.test(text);
}

for (const file of files) {
  const source = fs.readFileSync(path.join(entityDirectory, file), 'utf8');
  for (const match of source.matchAll(/<p class="hook">([\s\S]*?)<\/p>/g)) {
    const text = plainText(match[1]);
    if (looksIncomplete(text)) incompleteHooks.push({ file, ending: text.slice(-60) });
  }
  for (const match of source.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)) {
    const text = plainText(match[1]);
    if (text.length > 180 && looksIncomplete(text)) incompleteProse.push({ file, ending: text.slice(-60) });
  }
}

console.log(JSON.stringify({
  files: files.length,
  incompleteHookCount: incompleteHooks.length,
  incompleteProseCount: incompleteProse.length,
  hookSample: incompleteHooks.slice(0, 30),
  proseSample: incompleteProse.slice(0, 30)
}, null, 2));
