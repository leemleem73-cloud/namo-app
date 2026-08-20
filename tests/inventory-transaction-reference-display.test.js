const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ui=fs.readFileSync(path.join(__dirname,'../public/js/inventory-enterprise-auto-mode-20260820-v5.jsx'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const helperSource=ui.match(/function txDisplayReference\(tx\)\{[\s\S]*?\n\}/)?.[0];
const displayReference=new Function(`${helperSource};return txDisplayReference;`)();

assert.match(ui,/<th>작업지시\/처리내용<\/th>/);
assert.match(ui,/function txDisplayReference\(tx\)/);
assert.match(ui,/PHOTO-RACK-MIGRATION-[^\n]*return '랙 위치 자동이전'/);
assert.match(ui,/\^IQC:[^\n]*return '수입검사 자동입고'/);
assert.match(ui,/\^WOISSUE:[^\n]*return '생산투입 자동처리'/);
assert.match(ui,/\^WO:[^\n]*return '생산완료 자동입고'/);
assert.match(ui,/reference\.length>32\)return '시스템 자동처리'/);
assert.match(ui,/<td>\{txDisplayReference\(tx\)\}<\/td>/);
assert.doesNotMatch(ui,/tx\.work_order_no\|\|tx\.reference_no\|\|tx\.production_lot/);
assert.match(index,/inventory-enterprise-auto-mode-20260820-v5\.jsx\?v=20260820-6/);
assert.doesNotMatch(index,/inventory-enterprise-auto-mode-20260820-v4\.jsx\?v=20260820-4/);
assert.equal(displayReference({work_order_no:'WO-260820-001',reference_no:'PHOTO-RACK-MIGRATION-x'}),'WO-260820-001');
assert.equal(displayReference({production_lot:'CBF2501',reference_no:'WO:CBF2501'}),'CBF2501');
assert.equal(displayReference({reference_no:'PHOTO-RACK-MIGRATION-20260820:RM:NMP:LOT1:AVAILABLE'}),'랙 위치 자동이전');
assert.equal(displayReference({reference_no:'IQC:IQC-260820-001'}),'수입검사 자동입고');
assert.equal(displayReference({reference_no:'123456789012345678901234567890123'}),'시스템 자동처리');
assert.equal(displayReference({reference_no:'REF-01'}),'REF-01');

console.log('PASS: inventory transaction reference display (17 checks)');
