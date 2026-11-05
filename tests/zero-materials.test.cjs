const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('zero-input recipe rows are ignored without omitting actual material LOT checks',async()=>{
 const db=new PGlite();try{
 await db.exec("CREATE TABLE qmes_work_order_documents(id text PRIMARY KEY,document jsonb);");
 await db.exec(fs.readFileSync(__dirname+'/../qmes-quality-gate-20261021.sql','utf8'));
 for(const value of ['0','0.0','0.000',0,' 0.00 ']){
 assert.equal((await db.query("SELECT qmes_gate_unused_material($1) ok",[{actual:value,plan:10}])).rows[0].ok,true);
 await db.query("INSERT INTO qmes_work_order_documents VALUES($1,$2)",['zero'+String(value),{fields:{'생산 LOT NO':'FG','진행상태':'발행'},materials:[{name:'unused',actual:value,plan:10,lot:''}]}]).catch(e=>{if(e.code!=='23505')throw e;});
 }
 await db.query("SELECT qmes_gate_hold('HELD-RAW','test','manual','검증','{}')");
 const doc=m=>({fields:{'생산 LOT NO':'FG','진행상태':'발행'},materials:[m]});
 await db.query("INSERT INTO qmes_work_order_documents VALUES('unused-held',$1)",[doc({lot:'HELD-RAW',actual:'0.000'})]);
 assert.equal((await db.query("SELECT count(*)::int n FROM qmes_lot_genealogy WHERE parent_lot='HELD-RAW'")).rows[0].n,0);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('used-held',$1)",[doc({lot:'HELD-RAW',actual:'1'})]),/QUALITY_GATE/);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('missing',$1)",[doc({name:'PAI',lot:'',actual:'15.1'})]),/원료 LOT 번호/);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('planned-held',$1)",[doc({lot:'HELD-RAW',plan:'10',actual:''})]),/QUALITY_GATE/);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('invalid',$1)",[doc({lot:'',actual:'not-a-number'})]),/원료 LOT 번호/);
 }finally{await db.close();}
});
