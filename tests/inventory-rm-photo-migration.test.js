const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../inventory-server.js'),'utf8');

assert.match(source,/function migrateLegacyRmBalances\(\)/);
assert.match(source,/WHERE b\.location_code='RM' AND b\.quantity>0/);
assert.match(source,/FOR UPDATE OF b/);
assert.match(source,/quantity=inventory_balances\.quantity\+EXCLUDED\.quantity/);
assert.match(source,/transaction_type[\s\S]*'MOVE'/);
assert.match(source,/DELETE FROM inventory_balances[\s\S]*location_code='RM'/);
assert.match(source,/\('UNASSIGNED', '위치확인', 'STORAGE'\)/);
assert.match(source,/if\(fromLocation==='RM'\)fromLocation=legacyRack/);
assert.match(source,/if\(toLocation==='RM'\)toLocation=legacyRack/);
assert.match(source,/사진 기준 기존 RM 위치 이전/);

console.log('PASS: legacy RM photo rack migration (10 checks)');
