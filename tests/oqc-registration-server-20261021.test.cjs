'use strict';
// NODE_PATH=/tmp/qmes-gate-test/node_modules node --test tests/oqc-registration-server-20261021.test.cjs
// Executes the registration SQL and quality-gate triggers against an isolated PostgreSQL engine.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const { createHandler, normalizeRegistration, makePayload } = require('../qmes-oqc-registration-20261021.js');
const rules = require('../public/js/qmes-oqc-rules-20261019.js');
let db, handler;
const query = async (sql, parameters) => db.query(sql, parameters);
const values = { '외관': '이상없음', '입도(Dmax)': '9', '점도': '1500', '수분율': '100', '고형분': '20', '접착력': '450', '절연저항': 'Overflow', '전해액 안정성': '미탈리' };
function input(lot = 'TEST-' + randomUUID()) {
  return {
    requestId: randomUUID(),
    fields: { date: '2026-10-21', lot, product: 'TEST-PRODUCT', customer: 'TEST-CUSTOMER', inspector: '검사담당자', remarks: '', coaStatus: '대기', inspectionStatus: '검사완료' },
    measurements: Object.fromEntries(rules.items.map(item => [item, Array(3).fill(values[item])])),
  };
}
async function call(body, user = { id: 'operator', name: '사용자 위조', role: 'admin' }, currentHandler = handler) {
  const req = { session: { user }, body };
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await currentHandler(req, res); return res;
}
async function stored(key) {
  return (await query("SELECT payload FROM qmes_sync_records WHERE record_type='oqc' AND record_key=$1", [key])).rows[0]?.payload;
}
before(async () => {
  db = new PGlite();
  await db.exec(`CREATE TABLE users(id text PRIMARY KEY,name text,email text,status text);
    INSERT INTO users VALUES('operator','로그인 작성자','operator@example.test','APPROVED'),
      ('second','다른 사용자','second@example.test','APPROVED'),('disabled','비활성 사용자','','REJECTED');
    CREATE TABLE qmes_sync_records(record_type text,record_key text,payload jsonb,updated_by text,updated_at timestamptz,
      PRIMARY KEY(record_type,record_key));
    CREATE TABLE inventory_transactions(id bigint GENERATED ALWAYS AS IDENTITY,transaction_type text,lot_no text);`);
  await db.exec(fs.readFileSync(path.join(__dirname, '../qmes-quality-gate-20261021.sql'), 'utf8'));
  const pool = { connect: async () => ({ query, release() {} }) };
  handler = createHandler({ pool });
});
after(async () => { await db?.close(); });

test('unauthenticated and non-approved accounts cannot register or create rows', async () => {
  const body = input();
  assert.equal((await call(body, null)).code, 401);
  assert.equal((await call(body, { id: 'disabled', status: 'APPROVED', role: 'admin' })).code, 403);
  assert.equal((await call(body, { id: 'missing' })).code, 403);
  assert.equal(await stored('oqc-registration:' + body.requestId), undefined);
});

test('a regular approved user stores eight measured rows and server-owned writer identity', async () => {
  const body = input();
  body.fields.coaStatus = '발행완료'; body.fields.inspectionStatus = '출하완료';
  body.fields.writerName = '위조 작성자'; body.judge = '불합격';
  const result = await call(body);
  assert.equal(result.code, 200); assert.equal(result.body.created, true);
  assert.equal(result.body.data.rows.length, 8); assert.equal(result.body.data.overall, '합격');
  const payload = await stored(result.body.data.recordKey);
  assert.equal(payload.savedBy, '로그인 작성자');
  assert.equal(new Set(payload.rows.map(row => row.groupId)).size, 1);
  for (const row of payload.rows) {
    assert.equal(row.writerUserId, 'operator'); assert.equal(row.writerName, '로그인 작성자');
    assert.equal(row.inspector, '검사담당자'); assert.equal(row.coaStatus, '대기');
    assert.equal(row.shipDate, ''); assert.equal(row.shippingStatus, '');
    assert.equal(row.judge, '합격'); assert.equal(row.inspectionStatus, '검사완료');
  }
});

test('an exact retry succeeds without another insert, timestamp change, or mutation', async () => {
  const body = input();
  const first = await call(body), snapshot = await stored(first.body.data.recordKey);
  const retry = await call(structuredClone(body));
  assert.equal(retry.code, 200); assert.equal(retry.body.created, false);
  assert.deepEqual(await stored(first.body.data.recordKey), snapshot);
  assert.deepEqual(retry.body.data, first.body.data);
});

test('a changed retry or different account cannot replace an existing request', async () => {
  const body = input(); const first = await call(body), snapshot = await stored(first.body.data.recordKey);
  const edited = structuredClone(body); edited.measurements['점도'][0] = '1700';
  assert.equal((await call(edited)).code, 409);
  assert.equal((await call(body, { id: 'second' })).code, 409);
  assert.deepEqual(await stored(first.body.data.recordKey), snapshot);
});

test('same normalized LOT/date under a new request rejects duplicate group without overwrite', async () => {
  const body = input('EXISTING-LOT'); const first = await call(body), snapshot = await stored(first.body.data.recordKey);
  const duplicate = input(' existing-lot ');
  assert.equal((await call(duplicate)).code, 409);
  assert.equal(await stored('oqc-registration:' + duplicate.requestId), undefined);
  assert.deepEqual(await stored(first.body.data.recordKey), snapshot);
  const historical = { rows: [{ id: 'old', lot: ' historical-lot ', date: '2026-10-21', check: '외관', measurements: ['', '', ''], judge: '대기' }] };
  await query("INSERT INTO qmes_sync_records(record_type,record_key,payload) VALUES('oqc','old-history',$1)", [historical]);
  assert.equal((await call(input('HISTORICAL-LOT'))).code, 409);
  assert.deepEqual(await stored('old-history'), historical);
});

test('failed measurements override tampered PASS and retain later measurements while creating a durable hold', async () => {
  const body = input('FAILED-REGISTRATION');
  body.measurements['입도(Dmax)'] = ['10', '', ''];
  body.measurements['점도'] = ['1501', '1502', '1503'];
  body.judge = '합격'; body.overall = '합격'; body.fields.inspectionDecision = '합격';
  const result = await call(body);
  assert.equal(result.code, 200); assert.equal(result.body.data.overall, '불합격');
  const rows = result.body.data.rows;
  assert.equal(rows[1].judge, '불합격'); assert.deepEqual(rows[1].measurements, ['10', '', '']);
  assert.deepEqual(rows[2].measurements, ['1501', '1502', '1503']);
  assert.equal(rows[2].average, 1502); assert.equal(rows[2].shippingStatus, '');
  const holds = await query("SELECT id FROM qmes_lot_holds WHERE lot='FAILED-REGISTRATION' AND released_at IS NULL");
  assert.equal(holds.rows.length, 1);
  await assert.rejects(query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('SHIPMENT','FAILED-REGISTRATION')"), /QUALITY_GATE/);
});

test('incomplete results with optional product/customer save as waiting and cannot be shipped', async () => {
  const body = input('PENDING-REGISTRATION'); body.fields.product = ''; body.fields.customer = '';
  body.measurements = { '외관': ['이상없음', '이상없음', '이상없음'], '입도(Dmax)': ['9'] };
  const result = await call(body);
  assert.equal(result.code, 200); assert.equal(result.body.data.overall, '대기');
  assert.equal(result.body.data.rows[0].judge, '합격');
  assert.deepEqual(result.body.data.rows[1].measurements, ['9', '', '']);
  assert.equal(result.body.data.rows[1].judge, '대기');
  assert.equal(result.body.data.rows[2].inspectionStatus, '검사중');
  await assert.rejects(query("INSERT INTO inventory_transactions(transaction_type,lot_no) VALUES('SHIPMENT','PENDING-REGISTRATION')"), /QUALITY_GATE/);
});

test('invalid calendar dates, missing required fields, and malformed measurements never persist', async () => {
  const cases = [];
  for (const date of ['2026-02-30', '2026-13-01', '2026-1-01']) { const body = input(); body.fields.date = date; cases.push(body); }
  for (const field of ['date', 'lot', 'inspector']) { const body = input(); body.fields[field] = ' '; cases.push(body); }
  for (const field of ['product', 'customer']) { const body = input(); body.fields[field] = {}; cases.push(body); }
  const tooMany = input(); tooMany.measurements['점도'] = ['1500', '1500', '1500', '1500']; cases.push(tooMany);
  const badType = input(); badType.measurements['점도'][0] = 1500; cases.push(badType);
  const badId = input(); badId.requestId = 'existing-key'; cases.push(badId);
  for (const body of cases) {
    assert.equal((await call(body)).code, 400);
    assert.equal(await stored('oqc-registration:' + body.requestId), undefined);
  }
});

test('numeric boundary and qualitative results agree with the shared OQC rules', () => {
  const cases = [
    ['입도(Dmax)', '9.999', '합격'], ['입도(Dmax)', '10', '불합격'], ['입도(Dmax)', '-1', '불합격'],
    ['점도', '1200', '합격'], ['점도', '1800', '합격'], ['점도', '1199.9', '불합격'], ['점도', '1800.1', '불합격'],
    ['고형분', '19', '합격'], ['고형분', '21', '합격'], ['고형분', '21.01', '불합격'],
    ['수분율', '1999', '합격'], ['수분율', '2000', '불합격'], ['접착력', '400', '합격'], ['접착력', '399.9', '불합격'],
    ['절연저항', '200', '합격'], ['절연저항', 'Overflow', '합격'], ['절연저항', '199.9', '불합격'],
    ['외관', '이상있음', '불합격'], ['전해액 안정성', '탈리', '불합격'],
  ];
  for (const [item, value, expected] of cases) {
    const body = input(); body.measurements[item] = [value, value, value];
    const normalized = normalizeRegistration(body);
    const payload = makePayload(normalized, { id: 'operator', name: '검증' }, '2026-10-21T00:00:00Z');
    assert.equal(payload.rows.find(row => row.check === item).judge, expected, item + ' ' + value);
  }
});

test('a database insert failure rolls back and does not report success', async () => {
  const body = input();
  const failedHandler = createHandler({ pool: { connect: async () => ({
    query: (sql, parameters) => /^INSERT INTO qmes_sync_records/.test(sql) ? Promise.reject(new Error('simulated storage failure')) : query(sql, parameters),
    release() {},
  }) } });
  const result = await call(body, { id: 'operator' }, failedHandler);
  assert.equal(result.code, 500); assert.equal(result.body.success, false);
  assert.equal(await stored('oqc-registration:' + body.requestId), undefined);
});
