'use strict';
// Run: NODE_PATH=<test dependencies> node --test tests/quality-gate-20261021.test.cjs
// PGlite executes the actual PostgreSQL trigger migration in an isolated database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
const rules = require('../public/js/qmes-oqc-rules-20261019.js');
let db;
const query = (sql, params) => db.query(sql, params);
const sync = (kind, key, rows) => query(`INSERT INTO qmes_sync_records(record_type,record_key,payload) VALUES($1,$2,$3)
 ON CONFLICT(record_type,record_key) DO UPDATE SET payload=EXCLUDED.payload`, [kind, key, { rows }]);
const shipment = lot => query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('SHIPMENT',$1)", [lot]);
const blocked = fn => assert.rejects(fn, /QUALITY_GATE/);
const values = { '외관': '이상없음', '입도(Dmax)': '5', '점도': '1500', '수분율': '100', '고형분': '20', '접착력': '450', '절연저항': 'overflow', '전해액 안정성': '미탈리' };
const rows = (lot, date = '2026-10-21') => rules.items.map((check, n) => ({ id: String(n), lot, date, check, judge: '합격', measurements: Array(3).fill(values[check]) }));
before(async () => {
 db = new PGlite();
 await db.exec(`CREATE TABLE qmes_sync_records(record_type text,record_key text,payload jsonb,PRIMARY KEY(record_type,record_key));
 CREATE TABLE iqc(id text PRIMARY KEY,lot text,date date,items_json jsonb,fail numeric);
 CREATE TABLE pqc(id text PRIMARY KEY,lot text,date date,judge text);
 CREATE TABLE oqc(id text PRIMARY KEY,lot text,date date,judge text);
 CREATE TABLE qmes_work_order_documents(id text PRIMARY KEY,document jsonb);
 CREATE TABLE worklog(id text PRIMARY KEY,finished_lot text,prod_qty text);
 CREATE TABLE worklog_materials(worklog_id text,lot_no text,input_qty text);
 CREATE TABLE inventory_transactions(id bigint GENERATED ALWAYS AS IDENTITY,transaction_type text,lot_no text);
 CREATE TABLE inventory_balances(item_code text,lot_no text,location_code text,quality_status text,quantity numeric);
 CREATE TABLE inventory_reservations(lot_no text,status text);
 CREATE TABLE qmes_ncr_reports(id text PRIMARY KEY,lot text,status text);
 CREATE TABLE qmes_oqc_coa_issues(id text PRIMARY KEY,snapshot jsonb);
 CREATE TABLE certificates(cert_type text,lot text);
 INSERT INTO iqc VALUES('existing','OLD-RAW','2026-10-20','[{"judge":"불합격"}]',1);`);
 await db.exec(fs.readFileSync(path.join(__dirname, '../qmes-quality-gate-20261021.sql'), 'utf8'));
});
after(async () => { await db?.close(); });

test('migration backfills existing failures; normalized LOT cannot be issued or reserved', async () => {
 await blocked(() => query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('PRODUCTION_ISSUE',' old-raw ')"));
 await blocked(() => query("INSERT INTO inventory_reservations VALUES('OLD-RAW','ACTIVE')"));
 assert.equal((await query('SELECT count(*)::int AS n FROM inventory_transactions')).rows[0].n, 0);
});
test('failed inspection can be saved; editing pass or deleting cannot release hold', async () => {
 await query("INSERT INTO pqc VALUES('p1','FAIL-FG','2026-10-21','불합격')");
 await query("UPDATE pqc SET judge='합격' WHERE id='p1'");
 await query("DELETE FROM pqc WHERE id='p1'");
 await blocked(() => query("INSERT INTO worklog VALUES('w1','FAIL-FG','10')"));
 await blocked(() => query("INSERT INTO qmes_work_order_documents VALUES('wo1',$1)", [{ fields: { '생산 LOT NO': 'FAIL-FG', '진행상태': '완료' } }]));
 assert.equal((await query("SELECT count(*)::int AS n FROM qmes_lot_holds WHERE lot='FAIL-FG' AND released_at IS NULL")).rows[0].n, 1);
});
test('drafts and safe raw material input remain usable; missing LOT cannot record input', async () => {
 await query("INSERT INTO qmes_work_order_documents VALUES('draft',$1)", [{ fields: { '생산 LOT NO': 'FAIL-FG', '진행상태': '발행' }, materials: [] }]);
 await query("INSERT INTO worklog_materials VALUES('safe','GOOD-RAW','10')");
 await blocked(() => query("INSERT INTO worklog_materials VALUES('bad','OLD-RAW','10')"));
 await blocked(() => query("INSERT INTO worklog_materials VALUES('missing','','10')"));
});
test('shipping rejects missing/incomplete inspections and rolls back writes', async () => {
 await blocked(() => shipment('NO-OQC'));
 await sync('oqc', 'partial', rows('PARTIAL').slice(0,7));
 await blocked(() => shipment('PARTIAL'));
 await blocked(() => sync('inventory', 'erp:shipping', [{ lot: 'PARTIAL', status: '출하완료' }]));
 assert.equal((await query("SELECT count(*)::int AS n FROM qmes_sync_records WHERE record_key='erp:shipping'")).rows[0].n, 0);
});
test('complete measured OQC permits shipment, generic sync and formal CoA', async () => {
 await sync('oqc', 'good', rows('GOOD-FG'));
 await shipment('good-fg');
 await sync('inventory', 'erp:shipping', [{ lot: 'GOOD-FG', status: '출하완료' }]);
 await query("INSERT INTO qmes_oqc_coa_issues VALUES('c1',$1)", [{ fields: { lot: 'GOOD-FG' } }]);
 await blocked(() => query("INSERT INTO certificates VALUES('OQC','PARTIAL')"));
 await blocked(() => sync('coa', 'bypass', [{ lot: 'PARTIAL' }]));
});
test('client-supplied PASS cannot override out-of-spec measurements', async () => {
 const bad = rows('BAD-MEASURE'); bad[2].measurements[0] = '1900';
 await sync('oqc', 'badmeasure', bad);
 await blocked(() => shipment('BAD-MEASURE'));
 assert.equal((await query("SELECT count(*)::int AS n FROM qmes_lot_holds WHERE lot='BAD-MEASURE'")).rows[0].n, 1);
});
test('new pending inspection invalidates older passed inspection', async () => {
 await sync('oqc', 'older', rows('RETEST', '2026-10-20'));
 await shipment('RETEST');
 const pending = rows('RETEST'); pending[0].measurements = ['', '', ''];
 await sync('oqc', 'newer', pending);
 await blocked(() => shipment('RETEST'));
});
test('raw and intermediate holds propagate to downstream finished LOTs', async () => {
 await query("INSERT INTO qmes_work_order_documents VALUES('mid',$1)", [{ fields: { '생산 LOT NO': 'MID', '진행상태': '완료' }, materials: [{ lot: 'LATE-RAW', actual: '1' }] }]);
 await query("INSERT INTO qmes_work_order_documents VALUES('fg',$1)", [{ fields: { '생산 LOT NO': 'LINKED-FG', '진행상태': '완료' }, materials: [{ lot: 'MID', actual: '1' }] }]);
 await sync('oqc', 'linked', rows('LINKED-FG'));
 await shipment('LINKED-FG');
 await query("INSERT INTO iqc VALUES('late','LATE-RAW','2026-10-21','[{\"judge\":\"불합격\"}]',1)");
 await blocked(() => shipment('LINKED-FG'));
});
test('NCR close and stock status edits do not silently release quality holds', async () => {
 await query("INSERT INTO qmes_ncr_reports VALUES('ncr1','NCR-LOT','OPEN')");
 await query("UPDATE qmes_ncr_reports SET status='CLOSED' WHERE id='ncr1'");
 await blocked(() => query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('RELEASE','NCR-LOT')"));
 await query("INSERT INTO inventory_balances VALUES('ITEM','HELD-STOCK','RACK','HOLD',10)");
 await query("UPDATE inventory_balances SET quality_status='AVAILABLE' WHERE lot_no='HELD-STOCK'");
 await blocked(() => query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('ISSUE','HELD-STOCK')"));
});
test('SQL measurement validation agrees with shared browser/server rules including boundaries', async () => {
 for (const item of rules.items) {
  for (const value of ['', values[item], '10', '0', '-1', '1200', '1800', '2000', '19', '21', '400', '200', '1,500', '1,50', 'NaN', 'Infinity', '1e3', 'overflow']) {
   const measurements = [value,value,value];
   const result = await query('SELECT qmes_gate_measure_judge($1,$2) AS judge', [item, measurements]);
   assert.equal(result.rows[0].judge, rules.evaluateItem(item, measurements), item+' '+value);
  }
 }
});
test('PQC object measurements can retest; manual hold persists until explicitly released', async () => {
 await query("SELECT qmes_gate_hold('MANUAL','test:manual','manual','고객 지적','{}')");
 const measurements = Object.fromEntries(['외관','입도','점도','고형분'].map(k => [k, Array(3).fill(values[k === '입도' ? '입도(Dmax)' : k])]));
 await sync('pqc', 'retest', [{ lot: 'MANUAL', date: '2026-10-21', measurements }]);
 assert.equal((await query("SELECT qmes_gate_inspection_pass('MANUAL','pqc') AS passed")).rows[0].passed, true);
 await blocked(() => query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('ISSUE','MANUAL')"));
});
test('mobile work-order doc/inputs and delivery status cannot bypass the gate', async () => {
 await blocked(() => sync('workorder','mobile-bad',[{lotNo:'FAIL-FG',doc:{manualStatus:'완료',inputs:[]}}]));
 await blocked(() => query("INSERT INTO qmes_sync_records VALUES('workorder','mobile-input',$1)", [{lotNo:'NEW-FG',doc:{status:'발행',inputs:[{materialLot:'OLD-RAW',act:1}]}}]));
 await blocked(() => sync('inventory','delivery-bypass',[{lot:'PARTIAL',delivery:'납품완료'}]));
});
test('deleting old work documents does not erase the held raw LOT lineage', async () => {
 await query("DELETE FROM qmes_work_order_documents WHERE id IN ('mid','fg')");
 await blocked(() => shipment('LINKED-FG'));
});
test('release API checks database role, new retest, reason, duplicate approval and audit', async () => {
 await db.exec(`CREATE TABLE users(id text,name text,department text,title text,role text,status text);
 INSERT INTO users VALUES('operator','작업자','생산부','사원','user','APPROVED'),('quality','품질책임자','품질부','부장','user','APPROVED'),('disabled','퇴사자','품질부','부장','admin','REJECTED');`);
 const gate = require('../qmes-quality-gate-20261021.js');
 const execute = async (sql, params) => { const r=await query(sql,params);return {...r,rowCount:r.affectedRows??r.rows.length}; };
 gate.pool.query=execute;gate.pool.connect=async()=>({query:execute,release(){}});
 const call = async (id, body) => {
  const req={method:'POST',path:'/api/qmes-quality-gate/release',session:{user:{id,role:'admin'}},body};
  const res={code:200,status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await gate.api(req,res);return res;
 };
 const id=(await query("SELECT id FROM qmes_lot_holds WHERE lot='MANUAL'")).rows[0].id;
 assert.equal((await call('operator',{id,reason:'검증',retestKind:'pqc'})).code,403);
 assert.equal((await call('disabled',{id,reason:'검증',retestKind:'pqc'})).code,403);
 assert.equal((await call('quality',{id,reason:'',retestKind:'pqc'})).code,400);
 const noRetest=(await query("SELECT id FROM qmes_lot_holds WHERE lot='FAIL-FG'")).rows[0].id;
 assert.equal((await call('quality',{id:noRetest,reason:'재검사 없음',retestKind:'pqc'})).code,409);
 const release=await call('quality',{id,reason:'재검사 합격 확인',retestKind:'pqc'});
 assert.equal(release.code,200,JSON.stringify(release.body));
 await query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('ISSUE','MANUAL')");
 assert.equal((await call('quality',{id,reason:'중복',retestKind:'pqc'})).code,409);
 const event=(await query("SELECT detail FROM qmes_lot_gate_events WHERE action='RELEASE' AND lot='MANUAL'")).rows[0];
 assert.equal(event.detail.userId,'quality');assert.ok(event.detail.retest.length);
 // A later failing result re-opens the LOT after an approved release.
 await sync('pqc','manual-failed-again',[{lot:'MANUAL',date:'2026-10-22',judge:'불합격'}]);
 await blocked(()=>query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('ISSUE','MANUAL')"));
 await gate.pool.end();
});
