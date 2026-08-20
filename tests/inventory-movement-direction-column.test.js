const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ui=fs.readFileSync(path.join(__dirname,'../public/js/inventory-enterprise-auto-mode-20260820-v6.jsx'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const helpers=ui.match(/function txPhysicalLocation\(tx,value\)\{[\s\S]*?\n\}\nfunction txDirectionLabel\(tx\)\{[\s\S]*?\n\}/)?.[0];
const locationMap={canonicalRawLocation(value){
  const key=String(value||'').toUpperCase().replace(/[\s_()\-+]/g,'');
  if(key.includes('PAI')||key.includes('SBS'))return 'A-1-1';
  if(key.includes('SBR'))return 'A-2-1';
  if(key.includes('BYK180'))return 'A-3-2';
  if(key.includes('PVDF'))return 'A-3-1';
  if(key.includes('AOH30')||key.includes('BOEHMITE'))return 'A-4-1';
  if(key.includes('NMP'))return 'A-5-1';
  return 'UNASSIGNED';
}};
const direction=new Function('window',`${helpers};return txDirectionLabel;`)({qmesInventoryPhysicalLocations:locationMap});

assert.match(ui,/<th>이동 방향<\/th>/);
assert.doesNotMatch(ui,/<th>From<\/th>/);
assert.doesNotMatch(ui,/<th>To<\/th>/);
assert.match(ui,/<td>\{txDirectionLabel\(tx\)\}<\/td>/);
assert.doesNotMatch(ui,/tx\.from_status&&<small>/);
assert.doesNotMatch(ui,/tx\.to_status&&<small>/);
assert.equal(direction({transaction_type:'RECEIPT',from_location:'',to_location:'A-3-2'}),'외부입고 → A-3-2');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'BYK-180',from_location:'',to_location:'RM'}),'외부입고 → A-3-2');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'PAI',from_location:'',to_location:'UNASSIGNED'}),'외부입고 → A-1-1');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'SBR',from_location:'',to_location:'RM'}),'외부입고 → A-2-1');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'PVDF',from_location:'',to_location:'RM'}),'외부입고 → A-3-1');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'SBS',from_location:'',to_location:'RM'}),'외부입고 → A-1-1');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'NMP',from_location:'',to_location:'RM'}),'외부입고 → A-5-1');
assert.equal(direction({transaction_type:'RECEIPT',item_code:'BOEHMITE',from_location:'',to_location:'RM'}),'외부입고 → A-4-1');
assert.equal(direction({transaction_type:'PRODUCTION_ISSUE',from_location:'A-3-2',to_location:''}),'A-3-2 → 생산사용');
assert.equal(direction({transaction_type:'ISSUE',from_location:'A-3-2',to_location:''}),'A-3-2 → 외부출고');
assert.equal(direction({transaction_type:'SHIPMENT',from_location:'B-2-1',to_location:''}),'B-2-1 → 출하');
assert.equal(direction({transaction_type:'PRODUCTION_RECEIPT',from_location:'',to_location:'B-2-1'}),'생산완료 → B-2-1');
assert.equal(direction({transaction_type:'RETURN',from_location:'',to_location:'A-2-1'}),'반품입고 → A-2-1');
assert.match(ui,/!\/\^PHOTO-RACK-MIGRATION-\/i\.test\(String\(tx\.reference_no\|\|''\)\)/);
assert.match(index,/inventory-enterprise-auto-mode-20260820-v6\.jsx\?v=20260820-7/);
assert.doesNotMatch(index,/inventory-enterprise-auto-mode-20260820-v5\.jsx\?v=20260820-6/);

console.log('PASS: inventory movement direction column (22 checks)');
