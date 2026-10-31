#!/usr/bin/env node
// Read-only static checks for the isolated mobile QMES entry page.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const file = 'public/mobile-app-20261031.html';
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);
assert.ok(scripts.length, 'Inline application script missing');
scripts.forEach((source, index) => new vm.Script(source, {filename: file + '#script-' + index}));
for (const id of ['pc','home','work','drawer','dynamic-menu','worktitle','workloading','backhome','workmenu','search','query']) {
  assert.ok(html.includes('id="' + id + '"'), 'Missing mobile UI element: ' + id);
}
for (const marker of ['qmesMobileCheck','qmesMobileNavigationReport','function activate(','function build(','function wrapBusinessTables(']) {
  assert.ok(html.includes(marker), 'Missing mobile behavior: ' + marker);
}
assert.match(html, /src="\/\?desktop=1&pc=1"/, 'Expected shared PC business iframe');
assert.doesNotMatch(html, /(?:fetch|XMLHttpRequest)\s*\(\s*['"]https?:\/\//, 'Unexpected hard-coded external endpoint');
console.log('PASS: Mobile QMES inline JavaScript syntax and required UI anchors');
console.log('NOTE: This does not validate login, data operations, rendering or mobile browser behavior.');
