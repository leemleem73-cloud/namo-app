const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const rules=require('../public/js/qmes-oqc-rules-20261019.js');
test('actual PostgreSQL: historical corrections retain NG and active holds; scope cannot authorize new operations',async()=>{
 const db=new PGlite();try{
 await db.exec("CREATE TABLE qmes_sync_records(record_type text,record_key text,payload jsonb,PRIMARY KEY(record_type,record_key));CREATE TABLE qmes_work_order_documents(id text PRIMARY KEY,document jsonb);CREATE TABLE inventory_transactions(transaction_type text,lot_no text);");
 await db.exec(fs.readFileSync(__dirname+'/../qmes-quality-gate-20261021.sql','utf8'));
 const vals={'외관':'이상없음','입도(Dmax)':'7','점도':'1500','수분율':'200','고형분':'20','접착력':'500','절연저항':'Overflow','전해액 안정성':'미탈리'};
 const rows=rules.items.map((check,i)=>({id:'r'+i,lot:'DBJ1501',date:'2026-10-15',check,measurements:Array(3).fill(vals[check]),judge:'합격'}));rows[2].measurements[0]='1140';rows[2].judge='불합격';
 const order={fields:{'생산 LOT NO':'DBJ1501','작업지시번호':'WO-20261015-001','진행상태':'완료'},materials:[]};
 // Historical completion existed before the failing inspection was entered.
 await db.query("INSERT INTO qmes_work_order_documents VALUES('w',$1)",[order]);
 for(const kind of ['pqc','oqc'])await db.query('INSERT INTO qmes_sync_records VALUES($1,$2,$3)',[kind,'old:'+kind,{rows}]);
 await db.exec('SELECT qmes_gate_historical_seed();SELECT qmes_gate_historical_seed();');
 assert.equal((await db.query("SELECT count(*)::int n FROM qmes_historical_corrections")).rows[0].n,1);
 assert.equal((await db.query("SELECT count(*)::int n FROM qmes_lot_gate_events WHERE action='HISTORICAL_CORRECTION'")).rows[0].n,1);
 const check=async()=> (await db.query("SELECT qmes_gate_historical_eligible('DBJ1501','2026-10-15') ok")).rows[0].ok;
 assert.equal(await check(),true);
 const complete=rows.map(r=>({...r,shippingStatus:'출하완료',shipQty:'50',remarks:'검토 및 승인하에 출하함'}));
 assert.equal((await db.query('SELECT qmes_gate_historical_oqc($1,$2) ok',[rows,complete])).rows[0].ok,true);
 await db.query("UPDATE qmes_sync_records SET payload=$1 WHERE record_type='oqc'",[{rows:complete}]);
 assert.equal(await check(),true);
 const edited={...order,productionActual:{quantity:50},remarks:'기승인 기록 수정'};
 await db.query("UPDATE qmes_work_order_documents SET document=$1 WHERE id='w'",[edited]);
 await assert.rejects(()=>db.query("INSERT INTO qmes_work_order_documents VALUES('new',$1)",[edited]),/QUALITY_GATE/);
 await assert.rejects(()=>db.query("INSERT INTO inventory_transactions VALUES('SHIPMENT','DBJ1501')"),/QUALITY_GATE/);
 assert.ok((await db.query("SELECT count(*)::int n FROM qmes_lot_holds WHERE lot='DBJ1501' AND released_at IS NULL")).rows[0].n>0);
 const altered=complete.map(r=>({...r}));altered[2]={...altered[2],measurements:['1150','1500','1500']};
 await assert.rejects(()=>db.query("UPDATE qmes_sync_records SET payload=$1 WHERE record_type='oqc'",[{rows:altered}]),/QUALITY_GATE/);
 await assert.rejects(()=>db.query("INSERT INTO qmes_sync_records VALUES('oqc','new-shipment',$1)",[{rows:complete}]),/QUALITY_GATE/);
 // Manual/new hold invalidates attested correction.
 await db.query("SELECT qmes_gate_hold('DBJ1501','new:manual','manual','새 보류','{}')");
 assert.equal(await check(),false);
 await assert.rejects(()=>db.query("UPDATE qmes_work_order_documents SET document=$1 WHERE id='w'",[{...edited,productionActual:{quantity:49}}]),/QUALITY_GATE/);
 assert.equal((await db.query("SELECT qmes_gate_historical_eligible('OTHER','2026-10-15') ok")).rows[0].ok,false);
 }finally{await db.close();}
});
