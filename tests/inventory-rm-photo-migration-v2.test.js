const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const server=fs.readFileSync(path.join(__dirname,'../inventory-server.js'),'utf8');
const client=fs.readFileSync(path.join(__dirname,'../public/js/inventory-auto-link-all-20260820-v5.jsx'),'utf8');

assert.match(server,/ensureInventorySchema\(\);await migrateLegacyRmBalances\(\);const q=/);
assert.doesNotMatch(server,/if\(fromLocation==='RM'\)fromLocation=legacyRack/);
assert.match(server,/if\(toLocation==='RM'\)toLocation=legacyRack/);
assert.match(client,/async function migrateLegacyRmStock/);
assert.match(client,/location_code\|\|row\?\.locationCode\)==='RM'/);
assert.match(client,/transactionType:'MOVE'/);
assert.match(client,/fromLocation:'RM'/);
assert.match(client,/canonicalRawLocation/);
assert.match(client,/row\.location_code=toLocation/);

console.log('PASS: inventory RM recovery v2 (9 checks)');
