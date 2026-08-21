const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const server = read('inventory-server.js');
const iqc = read('public/js/iqc.jsx');
const autoLink = read('public/js/inventory-auto-link-all-20260820-v7.jsx');
const bridge = read('public/js/inventory-menu-bridge-20260820-v2.js');
const metadataFix = read('public/js/inventory-packaging-qr-label-fix-20260821.js');
const index = read('public/index.html');

assert.match(server, /app\.patch\('\/api\/inventory\/transactions\/:id\/packaging'/);
assert.match(server, /SET packaging_type=\$2/);
assert.match(server, /package_qty=COALESCE\(\$4,package_qty\)/);

assert.match(iqc, /qmesSyncUpsert\("iqc", rowData\.inNo/);
assert.match(iqc, /type:"iqc", key:rowData\.inNo/);

assert.match(autoLink, /const appDb=/);
assert.match(autoLink, /patchPackaging\(existingTx\.id/);
assert.match(autoLink, /\/transactions\/\$\{encodeURIComponent\(id\)\}\/packaging/);

const printStart = bridge.indexOf('async function printLabels(sheet)');
const popupOpen = bridge.indexOf("const win=open('',\'_blank\'", printStart);
const firstAwait = bridge.indexOf('await matchTx(sheet)', printStart);
assert.ok(printStart >= 0 && popupOpen > printStart && firstAwait > popupOpen, '인쇄창은 첫 await 전에 열려야 한다.');
assert.match(bridge, /인쇄 창이 차단되었습니다/);

assert.match(metadataFix, /typeof DB!=='undefined'&&DB/);
assert.match(index, /iqc\.jsx\?v=20260821-packaging-sync2/);
assert.match(index, /inventory-auto-link-all-20260820-v7\.jsx\?v=20260821-packaging-sync2/);
assert.match(index, /inventory-menu-bridge-20260820-v2\.js\?v=20260821-qr3/);

console.log('PASS: IQC packaging persistence and QR popup-safe printing');
