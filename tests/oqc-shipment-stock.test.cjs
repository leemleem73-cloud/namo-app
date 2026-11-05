const test=require('node:test'),assert=require('node:assert/strict'),qty=require('../public/js/qmes-oqc-shipqty-20261105.js'),core=require('../public/js/qmes-finished-stock-core-20261103.js');
const checks=['외관','입도(Dmax)','점도','수분율','고형분','접착력','절연저항','전해액 안정성'];
const records=(over={})=>checks.map((check,i)=>({id:'r'+i,groupId:'g1',date:'2026-10-06',lot:'F1',product:'제품A',check,inspectionDecision:'자동판정',judge:'합격',shippingStatus:'출하완료',shipQty:'20',...over}));
const build=(over={})=>core.build({orders:[{id:'w1',lot:'F1',product:'제품A',actualQty:100}],oqc:records(),...over}).rows.find(r=>r.lot==='F1');
test('shipment quantity accepts exact kg precision and rejects invalid input',()=>{
 assert.equal(qty.normalize('1,234.123456'),'1234.123456');assert.equal(qty.normalize('.5'),'0.5');assert.equal(qty.normalize(''),'');
 for(const value of ['-1','NaN','1.1234567','9e99','1,2'])assert.throws(()=>qty.normalize(value));
 assert.throws(()=>qty.validateCompletion(''));assert.throws(()=>qty.validateCompletion('0'));assert.doesNotThrow(()=>qty.validateCompletion('20'));
 assert.doesNotThrow(()=>qty.validateCompletion('',[{shippingStatus:'출하완료',shipQty:''}]));
});
test('eight inspection rows deduct one completed quantity; passing or pending inspections do not ship',()=>{
 const r=build();assert.equal(r.produced,100);assert.equal(r.shipped,20);assert.equal(r.book,80);assert.equal(r.available,80);assert.equal(r.ledger.filter(e=>e.kind==='출하').length,1);
 for(const status of ['','출하대기','출하보류']){const held=build({oqc:records({shippingStatus:status})});assert.equal(held.shipped,0);assert.equal(held.book,100);}
});
test('existing ERP shipment wins without double deduction; mismatches are flagged instead of guessed',()=>{
 const erp={shipNo:'S1',lot:'F1',product:'제품A',qty:20,delivery:'출하완료',date:'2026-10-07'};
 const r=build({shipments:[erp]});assert.equal(r.shipped,20);assert.equal(r.book,80);assert.equal(r.ledger.filter(e=>e.kind==='출하').length,1);
 const mismatch=build({shipments:[{...erp,qty:10}]});assert.equal(mismatch.book,null);assert(mismatch.issues.includes('출하검사·출하 기록 수량 대조 필요'));
});
test('missing, conflicting and invalid completed quantities remain explicitly uncertain',()=>{
 const missing=build({oqc:records({shipQty:''})});assert.equal(missing.shipped,null);assert.equal(missing.book,null);assert(missing.issues.includes('출하완료 · 출하수량 미입력'));
 const conflicting=records();conflicting[0].shipQty='10';assert.equal(build({oqc:conflicting}).book,null);
 const invalid=records();invalid[0].shipQty='-5';assert.equal(build({oqc:invalid}).book,null);
});
test('partial shipments from different inspections add, and corrections replace rather than accumulate',()=>{
 const partial=build({oqc:[...records({shipQty:'20'}),...records({groupId:'g2',date:'2026-10-08',shipQty:'10'})]});assert.equal(partial.shipped,30);assert.equal(partial.book,70);
 const before=records({shippingStatus:'출하대기',shipQty:'20'}),after=records();
 const fact=qty.capture(before,after,'20','2026-11-05T00:00:00Z','movement-1');assert(fact.every(r=>r.stockShipment.id==='movement-1'));
 const corrected=qty.capture(fact,fact,'18','2026-11-05T01:00:00Z','ignored');assert(corrected.every(r=>r.stockShipment.id==='movement-1'&&r.stockShipment.recordedAt==='2026-11-05T00:00:00Z'));
 assert.equal(build({oqc:corrected}).shipped,18);
});
test('an NG edit does not erase an already recorded physical shipment',()=>{
 const before=qty.capture(records({shippingStatus:'出荷待ち'}),records(),'20','2026-11-05T00:00:00Z','s1');
 const held=qty.capture(before,before.map(r=>({...r,judge:'불합격',shippingStatus:'출하보류'})),'20','2026-11-06T00:00:00Z','ignored'),r=build({oqc:held});
 assert.equal(r.shipped,20);assert.equal(r.book,80);assert.equal(r.available,0);
 const pending=qty.capture(records({shipQty:''}),records({shipQty:'',shippingStatus:'출하보류',judge:'불합격'}),'','2026-11-05T00:00:00Z','pending');
 assert(pending.every(row=>row.stockShipment.completed&&row.stockShipment.quantity===null));assert.equal(build({oqc:pending}).book,null);
});
test('unknown actual shipment dates are not treated as inspection dates across an opening balance',()=>{
 const r=build({entries:[{id:'opening',type:'opening',status:'confirmed',date:'2026-10-07',quantity:50,note:'실사',product:'제품A',lot:'F1'}]});assert.equal(r.book,null);assert(r.issues.includes('기초재고 전후 출하·사용 일자 확인 필요'));
});
test('registration saves quantity on each item without silently marking shipment complete',()=>{
 const reg=require('../qmes-oqc-registration-20261021.js'),rules=require('../public/js/qmes-oqc-rules-20261019.js'),normalized=reg.normalizeRegistration({requestId:'12345678-1234-1234-1234-123456789abc',fields:{date:'2026-11-05',lot:'F1',inspector:'담당자',shipQty:'25.5'},measurements:Object.fromEntries(rules.items.map(name=>[name,['','','']]))});
 const payload=reg.makePayload(normalized,{id:'u1',name:'담당자'},'2026-11-05T00:00:00Z');assert(payload.rows.every(r=>r.shipQty==='25.5'&&r.shippingStatus===''&&!r.stockShipment));
});
