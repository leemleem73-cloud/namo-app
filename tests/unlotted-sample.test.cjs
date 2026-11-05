const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {PGlite}=require('@electric-sql/pglite');
const stock=require('../public/js/qmes-material-stock-core-20261103.js');
test('named unlotted samples save while empty LOT, held real LOT and top-level dash remain blocked',async()=>{
 const db=new PGlite();try{
 await db.exec("CREATE TABLE qmes_work_order_documents(id text PRIMARY KEY,document jsonb);CREATE TABLE inventory_transactions(transaction_type text,lot_no text);");
 await db.exec(fs.readFileSync(__dirname+'/../qmes-quality-gate-20261021.sql','utf8'));
 const doc=m=>({fields:{'생산 LOT NO':'FG-SAMPLE','진행상태':'완료'},materials:[m]});
 const sample={name:'PAI 27-2',lot:'-',actual:'15.1',plan:'15.084'};
 await db.query("INSERT INTO qmes_work_order_documents VALUES('sample',$1)",[doc(sample)]);
 assert.equal((await db.query("SELECT count(*)::int n FROM qmes_lot_genealogy WHERE parent_lot='-'")).rows[0].n,0);
 const saved=(await db.query("SELECT document FROM qmes_work_order_documents WHERE id='sample'")).rows[0].document;
 assert.equal(saved.materials[0].lot,'-');assert.equal(saved.materials[0].actual,'15.1');
 await db.query("SELECT qmes_gate_assert('FG-SAMPLE','공정 기록')");
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('blank',$1)",[doc({...sample,lot:''})]),/원료 LOT/);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('unnamed',$1)",[doc({...sample,name:''})]),/QUALITY_GATE/);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('intermediate',$1)",[doc({...sample,name:'중간배치'})]),/QUALITY_GATE/);
 await db.query("SELECT qmes_gate_hold('RAW-HELD','test','manual','시험','{}')");
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('held',$1)",[doc({...sample,lot:'RAW-HELD'})]),/QUALITY_GATE/);
 await assert.rejects(()=>db.query("INSERT INTO inventory_transactions VALUES('SHIPMENT','-')"),/QUALITY_GATE/);
 await db.query("SELECT qmes_gate_hold('FG-SAMPLE','product:test','manual','생산품 보류','{}')");
 await assert.rejects(()=>db.query("SELECT qmes_gate_assert('FG-SAMPLE','출하 확정',true)"),/QUALITY_GATE/);
 }finally{await db.close();}
});
test('unlotted sample usages never merge with each other or consume a matched ordinary receipt',()=>{
 const orders=[{id:'w1',fields:{'생산 LOT NO':'FG1','진행상태':'완료'},workDate:'2026-10-15',materials:[{name:'PAI',lot:'-',actual:'15.1'}]},{id:'w2',fields:{'생산 LOT NO':'FG2','진행상태':'완료'},materials:[{name:'NMP',lot:'-',actual:'1'}]}];
 const result=stock.build({iqc:[{id:'i',item:'PAI',lot:'REAL',supplier:'S',date:'2026-10-01',incoming_qty:100,judge:'합격'}],orders});
 assert.equal(result.rows.length,1);assert.equal(result.rows[0].balance,100);assert.equal(result.rows[0].used,0);
 assert.equal(result.unallocated.length,2);assert.deepEqual(result.unallocated.map(e=>e.quantity),[15.1,1]);assert.deepEqual(result.unallocated.map(e=>e.output),['FG1','FG2']);assert.ok(result.unallocated.every(e=>e.note.includes('연구 샘플')));
});
test('LOT dropdown provides one explicit sample choice and keeps selected dash across refresh',()=>{
 const source=fs.readFileSync(__dirname+'/../public/js/namo-workorder-material-enterprise-20261014.js','utf8');
 const code=source.slice(source.indexOf('  function drawRow('),source.indexOf('  function draw(form,state)'));
 const options=[],select={dataset:{},style:{},replaceChildren(){options.length=0},add(v){options.push(v)}},input={value:'-',style:{setProperty(){}},hidden:true},name={value:'__manual__'};
 const row={dataset:{},querySelector:s=>s==='.material-lot-manual'?input:s==='.material-name-select'?name:s==='.nwm-iqc-lot-select'?select:null};
 const ctx={candidates:()=>[{lot:'-'},{lot:'REAL'}],text:v=>String(v||''),Option:function(text,value){this.text=text;this.value=value;}};
 vm.runInNewContext(code,ctx);ctx.drawRow(row,{version:1,rows:[]});ctx.drawRow(row,{version:2,rows:[]});
 assert.equal(options.filter(o=>o.value==='-').length,1);assert.ok(options.find(o=>o.value==='-').text.includes('연구 샘플'));assert.equal(select.value,'-');assert.equal(input.value,'-');
});
