const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ui=fs.readFileSync(path.join(__dirname,'../public/js/inventory-enterprise-auto-mode-20260820-v4.jsx'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');

assert.doesNotMatch(ui,/section==='lot'\|\|section==='movement'/);
assert.match(ui,/section==='lot'&&<><InventoryFilters[\s\S]*?<StockTable rows=\{filtered\}/);
assert.match(ui,/section==='movement'&&<div className="inv-panel"><h3>자동 입출고 처리 내역<\/h3><TxTable rows=\{movementRows\}/);
assert.match(ui,/const movementRows=transactions\.filter\(tx=>INV_MOVEMENT_TYPES\.has\(tx\.transaction_type\)\)/);
assert.match(ui,/const INV_MOVEMENT_TYPES=new Set\(\['RECEIPT','ISSUE','MOVE','PRODUCTION_ISSUE','PRODUCTION_RECEIPT','SHIPMENT','RETURN'\]\)/);
assert.match(ui,/section==='history'&&<div className="inv-panel"><h3>재고 Transaction 원장<\/h3><TxTable rows=\{transactions\}/);
assert.match(index,/inventory-enterprise-auto-mode-20260820-v4\.jsx\?v=20260820-4/);
assert.doesNotMatch(index,/inventory-enterprise-auto-mode-20260820-v3\.jsx\?v=20260820-3/);

console.log('PASS: inventory movement and LOT split (8 checks)');
