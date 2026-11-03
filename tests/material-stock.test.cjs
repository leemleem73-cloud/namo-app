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
