const fs = require('node:fs');
const path = require('node:path');

const target = path.resolve(__dirname, '..', 'browse.html');
const original = fs.readFileSync(target, 'utf8');
const legacyControllers = /<script src="assets\/entity-card\.js"><\/script><script>[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>(?=<aside id="content-advisory")/;
if (!legacyControllers.test(original)) throw new Error('Expected the hosted and file Browse controllers');
let revised = original.replace(legacyControllers, '<script src="assets/entity-card.js"></script>');
const sharedScripts = '<script src="assets/search-index.js"></script><script src="assets/nav-search.js"></script>';
if (!revised.includes(sharedScripts)) throw new Error('Expected the shared Browse script footer');
revised = revised.replace(sharedScripts, '<script src="assets/search-index.js"></script><script src="assets/archive-engine.js"></script><script src="assets/nav-search.js"></script><script src="assets/browse-controller.js"></script>');
fs.writeFileSync(target, revised, 'utf8');
console.log('Repaired Browse shell.');
