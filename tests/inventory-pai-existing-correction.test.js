const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const server=fs.readFileSync(path.join(__dirname,'../inventory-server.js'),'utf8');
const client=fs.readFileSync(path.join(__dirname,'../public/js/inventory-auto-link-all-20260820-v6.jsx'),'utf8');

assert.match(server,/value\.includes\('PAI'\)\) return 'A-1-1'/);
assert.match(server,/b\.location_code IN \('RM','UNASSIGNED'\)/);
assert.match(server,/b\.location_code AS source_location/);
assert.match(server,/if \(targetLocation === row\.source_location\) continue/);
assert.match(server,/location_code=\$3 AND quality_status=\$4/);
assert.match(client,/source==='RM'\|\|source==='UNASSIGNED'/);
assert.match(client,/if\(toLocation===fromLocation\) continue/);
assert.match(client,/migrateLegacyLocationStock/);

console.log('PASS: existing PAI location correction (8 checks)');
