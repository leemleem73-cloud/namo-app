const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../public/js/qmes-material-stock-core-20261103.js');
const receipt=(extra={})=>({id:'i1',date:'2026-11-01',lot:'RAW-1',item:'NMP',supplier:'공급사',incoming_qty:'100',judge:'합격',...extra});
const order=(extra={})=>({id:'w1',workDate:'2026-11-02',fields:{'생산 LOT NO':'FIN-1','진행상태':'완료'},materials:[{name:'NMP',lot:'RAW-1',plan:'50',actual:'40'}],...extra});
const entry=(extra={})=>({id:'e1',material:'NMP',lot:'RAW-1',supplier:'공급사',type:'retest',status:'confirmed',quantity:0.025,date:'2026-11-02',note:'재검사 25 g 사용',...extra});
test('IQC kg minus actual use and confirmed sample use, with micro-kg precision',()=>{
 const result=core.build({iqc:[receipt()],orders:[order()],entries:[entry()]});const row=result.rows[0];
 assert.equal(row.incoming,100);assert.equal(row.used,40);assert.equal(row.sample,0.025);assert.equal(row.balance,59.975);assert.equal(row.available,59.975);
});
test('planned quantities never deduct stock; blank actual is not a zero measurement',()=>{
 const row=core.build({iqc:[receipt()],orders:[order({fields:{'생산 LOT NO':'FIN-1','진행상태':'대기'},materials:[{name:'NMP',lot:'RAW-1',plan:'50',actual:''}]})]}).rows[0];
 assert.equal(row.balance,100);assert.equal(row.reserved,50);assert.equal(row.used,0);
 assert.equal(core.number(''),null);assert.equal(core.number('0'),0);assert.equal(core.number('1,234.56'),1234.56);
});
test('unknown retest amounts are retained without invented deductions; confirming edits applies once',()=>{
 const pending=entry({status:'pending',quantity:null,date:''});
 const row=core.build({iqc:[receipt()],entries:[pending]}).rows[0];assert.equal(row.balance,100);assert.equal(row.pending,1);assert.equal(row.available,0);assert.equal(row.ledger.find(r=>r.pending).delta,null);
 const records=[{record_key:core.PREFIX+'e1',payload:{entry:entry()}},{record_key:core.PREFIX+'e1',payload:{entry:pending}}];
 const once=core.readEntries(records);assert.equal(once.length,1);assert.equal(core.build({iqc:[receipt()],entries:once}).rows[0].balance,99.975);
});
test('IQC reinspections are not additional receipts, while separate receipt dates accumulate',()=>{
 const rows=[receipt(),receipt({id:'i2'}),receipt({id:'i3',date:'2026-11-03',incoming_qty:20})];
 const row=core.build({iqc:rows}).rows[0];assert.equal(row.incoming,120);assert.equal(row.receipts.length,2);assert.equal(row.available,0);assert.ok(row.issues.some(s=>s.includes('중복검사')));
});
test('conflicting received weights and inspection sample qty never fabricate incoming mass',()=>{
 assert.equal(core.build({iqc:[receipt(),receipt({id:'i2',incoming_qty:80})]}).rows[0].incoming,0);
 const row=core.build({iqc:[receipt({incoming_qty:null,qty:500})]}).rows[0];assert.equal(row.incoming,0);assert.equal(row.available,0);
});
test('work-order actuals and legacy worklog do not double-deduct the same production input',()=>{
 const actual={workDate:'2026-11-02',finishedLot:'FIN-1',lotNo:'RAW-1',material:'NMP',supName:'공급사',inputQty:40};
 assert.equal(core.build({iqc:[receipt()],orders:[order()],actuals:[actual]}).rows[0].used,40);
 assert.equal(core.build({iqc:[receipt()],actuals:[{...actual,seq:1},{...actual,seq:2}]}).rows[0].used,80);
});
test('quality holds, pending inspection and source failures exclude computed availability',()=>{
 assert.equal(core.build({iqc:[receipt()],holds:[{lot:'RAW-1',released_at:null}]}).rows[0].available,0);
 assert.equal(core.build({iqc:[receipt({judge:'대기'})]}).rows[0].available,0);
 assert.equal(core.build({iqc:[receipt({judge:'합격',items_json:[{values:['미확인']} ]})]}).rows[0].available,0);
 assert.equal(core.build({iqc:[receipt()],sourceErrors:['보류 조회 실패']}).rows[0].available,0);
 assert.equal(core.build({iqc:[receipt()],holds:[{lot:'RAW-1',released_at:'2026-11-02'}]}).rows[0].available,100);
});
test('ambiguous supplier LOTs remain unallocated rather than charging an arbitrary stock lot',()=>{
 const result=core.build({iqc:[receipt(),receipt({id:'i2',supplier:'다른 공급사'})],orders:[order()]});
 assert.equal(result.unallocated.length,1);assert.equal(result.rows.reduce((sum,row)=>sum+row.used,0),0);assert.ok(result.rows.every(row=>row.available===0));
});
test('opening stock starts at beginning of its date and does not re-add historical receipts',()=>{
 const row=core.build({iqc:[receipt(),receipt({date:'2026-11-03',id:'i2',incoming_qty:10})],orders:[order()],entries:[entry({type:'opening',quantity:60,date:'2026-11-03'})]}).rows[0];
 assert.equal(row.opening,60);assert.equal(row.incoming,10);assert.equal(row.used,0);assert.equal(row.balance,70);
});
test('signed adjustments and cancellations do not silently clamp negative balances',()=>{
 const row=core.build({iqc:[receipt()],entries:[entry({quantity:110}),entry({id:'e2',type:'adjustment',quantity:2,direction:'in'}),entry({id:'e3',status:'cancelled',quantity:55})]}).rows[0];
 assert.equal(row.balance,-8);assert.equal(row.available,0);assert.ok(row.issues.some(s=>s.includes('음수')));
});
test('entry validation accepts unknown quantities, requires confirmed facts and rejects negative use',()=>{
 assert.equal(core.validateEntry(entry({status:'pending',quantity:null,date:''})).quantity,null);
 assert.equal(core.validateEntry(entry({type:'opening',quantity:0})).quantity,0);
 for(const change of [{quantity:null},{quantity:-1},{date:''},{note:''}])assert.throws(()=>core.validateEntry(entry(change)));
});
test('source data stays unchanged and unrelated shared records are ignored',()=>{
 const source={iqc:[receipt()],orders:[order()],entries:[entry()]},before=JSON.stringify(source);core.build(source);assert.equal(JSON.stringify(source),before);
 assert.equal(core.readEntries([{record_key:'erp:sales',payload:{entry:entry()}}]).length,0);
});
test('분산제 and BYK180 share the approved 2708935 LOT without changing any other leading zeros',()=>{
 const iqc=[receipt({item:'분산제',lot:'0002708935'})],orders=[order({materials:[{name:'BYK-180',lot:'002708935',plan:50,actual:40}]})];
 const row=core.build({iqc,orders}).rows[0];assert.equal(row.material,'BYK180 (분산제)');assert.equal(row.lot,'2708935');assert.equal(row.used,40);assert.equal(row.balance,60);assert.equal(row.receipts[0].originals[0].lot,'0002708935');assert.equal(core.lot('00012345'),'00012345');
});
test('a unique LOT cannot charge an unrelated material; unmatched production cannot create receipt stock',()=>{
 const result=core.build({iqc:[receipt()],orders:[order({materials:[{name:'PVDF',lot:'RAW-1',actual:30}]})]});
 assert.equal(result.rows[0].used,0);assert.equal(result.unallocated.length,1);assert.equal(result.rows[0].available,0);
 const onlyWork=core.build({orders:[order()]});assert.equal(onlyWork.rows.length,0);assert.equal(onlyWork.unallocated.length,1);
});
test('supplier authority is IQC only: same-material LOT evidence is usable, purchases are never substituted',()=>{
 let result=core.build({iqc:[receipt({supplier:''})],purchases:[{id:'p1',item:'NMP',lot:'RAW-1',supplier:'발주 업체'}]});assert.equal(result.rows[0].supplier,'');assert.equal(result.rows[0].available,0);
 result=core.build({iqc:[receipt({supplier:''}),receipt({id:'i2'})]});assert.equal(result.rows.length,1);assert.equal(result.rows[0].supplier,'공급사');assert.ok(result.rows[0].notices.some(s=>s.includes('동일 원료/LOT')));
 const result2=core.build({iqc:[receipt({supplier:''}),receipt({id:'i2',item:'PVDF',supplier:'다른 원료 업체'})]});assert.equal(result2.rows.find(r=>r.material==='NMP').supplier,'');
});
test('worklog supplier spelling never overwrites the IQC supplier',()=>{
 const actual={workDate:'2026-11-02',finishedLot:'F',lotNo:'RAW-1',material:'NMP',supName:'투입 시 잘못 적은 업체',inputQty:5};const row=core.build({iqc:[receipt()],actuals:[actual]}).rows[0];assert.equal(row.supplier,'공급사');assert.equal(row.used,5);assert.ok(row.notices.some(s=>s.includes('수입검사 원본 기준')));
});
test('mixed raw materials do not collapse into a pure ingredient family',()=>{
 assert.notEqual(core.material('SBS+PVdF'),core.material('SBS'));
 assert.notEqual(core.material('NMP+SBR'),core.material('NMP'));
});
test('stock reads passed IQC items and saved overall judgment instead of defaulting to pending',()=>{
 const passedItems=[{name:'외관',judge:'합격'},{name:'중량',judge:'합격'}];
 assert.equal(core.judgment({judge:'대기',items_json:passedItems}),'합격');
 assert.equal(core.judgment({items_json:JSON.stringify([{name:'종합판정',value:'합격'}])}),'합격');
 const row=core.build({iqc:[receipt({judge:'',items_json:[{name:'종합판정',value:'합격'}]})]}).rows[0];
 assert.equal(row.receipts[0].judge,'합격');assert.equal(row.quality,'사용가능');assert.equal(row.available,100);
});
test('unconfirmed and failed inspections never become passes just to change the ledger label',()=>{
 assert.equal(core.judgment({items_json:[]}), '대기');
 assert.equal(core.judgment({judge:'합격',items_json:[{name:'COA 확인',values:['미확인']}]}),'불합격');
 assert.equal(core.judgment({judge:'합격',items_json:[{name:'COA 확인',values:['확인중']}]}),'대기');
 assert.equal(core.judgment({judge:'보류',items_json:[]}),'보류');
});
test('latest saved IQC timestamp is used instead of alphabetically sorting UUID record IDs',()=>{
 const records=[receipt({id:'zz-old',createdAt:'2025-11-10T00:00:00Z',judge:'대기'}),receipt({id:'aa-new',createdAt:'2025-11-11T00:00:00Z',judge:'합격'})];
 assert.equal(core.build({iqc:records}).rows[0].receipts[0].judge,'합격');
 const apiOrder=[receipt({id:'aa-new',judge:'합격'}),receipt({id:'zz-old',judge:'대기'})];
 assert.equal(core.build({iqc:apiOrder}).rows[0].receipts[0].judge,'합격');
});
