#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function plainText(html) {
  return String(html).replace(/<[^>]+>/g, '')
    .replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;|&rsquo;/g, '’')
    .replace(/&hellip;/g, '…').replace(/&[^;]+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

function isComplete(text) {
  return /[.!?…:;”’"')\]]$/.test(String(text).trim());
}

function completeHook(ledeHtml) {
  const text = plainText(ledeHtml);
  const endings = [];
  for (let index = 0; index < text.length; index += 1) {
    if (/[.!?…]/.test(text[index]) && (index === text.length - 1 || /\s/.test(text[index + 1]))) endings.push(index + 1);
  }
  const useful = endings.filter((ending) => ending >= 110 && ending <= 280);
  if (useful.length) return text.slice(0, useful[0]).trim();
  const first = endings.find((ending) => ending > 40);
  if (first && first <= 320) return text.slice(0, first).trim();
  const limit = Math.min(220, text.length);
  const boundary = text.lastIndexOf(' ', limit);
  return `${text.slice(0, boundary > 60 ? boundary : limit).trim()}…`;
}

function repairPageHooks(source) {
  return String(source).replace(
    /(<p class="hook">)([\s\S]*?)(<\/p>[\s\S]{0,600}?<p class="lede">)([\s\S]*?)(<\/p>)/g,
    function (match, open, hookHtml, between, ledeHtml, close) {
      if (isComplete(plainText(hookHtml))) return match;
      return open + completeHook(ledeHtml) + between + ledeHtml + close;
    }
  );
}

function run(site) {
  const directory = path.join(site, 'entity');
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.html'));
  let changed = 0;
  for (const file of files) {
    const target = path.join(directory, file);
    const source = fs.readFileSync(target, 'utf8');
    const revised = repairPageHooks(source);
    if (revised === source) continue;
    fs.writeFileSync(target, revised, 'utf8');
    changed += 1;
  }
  return { files: files.length, changed };
}

if (require.main === module) console.log(JSON.stringify(run(path.resolve(__dirname, '..')), null, 2));

module.exports = { completeHook, repairPageHooks, run };
