'use strict';
// Loaded before session-dependent addons; the database triggers are the final guard.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 3, connectionTimeoutMillis: 10000 });
let ready, initialized = false;
const schema = () => {
  if (!ready) ready = pool.query(fs.readFileSync(path.join(__dirname, 'qmes-quality-gate-20261021.sql'), 'utf8'))
    .then(result => { initialized = true; return result; })
    .catch(e => { ready = null; throw e; });
  return ready;
};
const str = v => String(v == null ? '' : v).trim();
const actor = req => str(req.session?.user?.id);
const reject = (res, status, message) => res.status(status).json({ success: false, message });
const authorized = u => u?.status === 'APPROVED' && (u.role === 'admin' ||
  u.department === '품질부' && ['부장', '이사', '상무', '전무', '대표이사'].includes(u.title));
async function user(client, req) {
  const result = await client.query('SELECT id,name,department,title,role,status FROM users WHERE id::text=$1', [actor(req)]);
  return result.rows[0];
}
async function api(req, res) {
  const route = req.path.replace('/api/qmes-quality-gate', '');
  if (req.method === 'GET' && route === '/holds') {
    const u = await user(pool, req);
    if (u?.status !== 'APPROVED') return reject(res, 403, '승인된 사용자만 조회할 수 있습니다.');
    const lot = str(req.query.lot).toUpperCase();
    const result = await pool.query(`SELECT * FROM qmes_lot_holds WHERE ($1='' OR lot=$1)
      ORDER BY (released_at IS NULL) DESC,id DESC LIMIT 300`, [lot]);
    const events = await pool.query(`SELECT * FROM qmes_lot_gate_events WHERE ($1='' OR lot=$1) ORDER BY id DESC LIMIT 100`, [lot]);
    return res.json({ success: true, data: { holds: result.rows, events: events.rows, canRelease: authorized(u) } });
  }
  if (req.method === 'GET' && route === '/status') {
    const lot = str(req.query.lot).toUpperCase();
    if (!lot) return reject(res, 400, 'LOT를 입력하세요.');
    try {
      await pool.query("SELECT qmes_gate_assert($1,'출하 확정',true)", [lot]);
      return res.json({ success: true, data: { lot, shippable: true } });
    } catch (e) {
      if (!e.message.includes('[QUALITY_GATE]')) throw e;
      return res.json({ success: true, data: { lot, shippable: false, reason: e.message } });
    }
  }
  if (req.method !== 'POST' || !['/hold', '/release'].includes(route)) return reject(res, 404, '지원하지 않는 품질 통제 요청입니다.');
  const reason = str(req.body?.reason);
  if (!reason || reason.length > 2000) return reject(res, 400, '사유를 1~2,000자로 입력하세요.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(20261021,731)');
    const u = await user(client, req);
    if (u?.status !== 'APPROVED') { await client.query('ROLLBACK'); return reject(res, 403, '승인된 사용자만 처리할 수 있습니다.'); }
    if (route === '/hold') {
      const lot = str(req.body.lot).toUpperCase();
      if (!lot || lot.length > 120) { await client.query('ROLLBACK'); return reject(res, 400, '올바른 LOT를 입력하세요.'); }
      await client.query("SELECT qmes_gate_hold($1,'manual:'||gen_random_uuid()::text,'manual',$2,$3::jsonb)",
        [lot, reason, JSON.stringify({ actor: u.id, name: u.name, reason })]);
      await client.query('INSERT INTO qmes_lot_gate_events(action,lot,actor,detail) VALUES($1,$2,$3,$4::jsonb)',
        ['MANUAL_HOLD', lot, u.name, JSON.stringify({ userId: u.id, reason })]);
    } else {
      if (!authorized(u)) { await client.query('ROLLBACK'); return reject(res, 403, '관리자 또는 품질부 부장 이상만 해제 승인할 수 있습니다.'); }
      const id = str(req.body.id);
      if (!/^[1-9][0-9]*$/.test(id)) { await client.query('ROLLBACK'); return reject(res, 400, '보류번호를 확인하세요.'); }
      const result = await client.query('SELECT * FROM qmes_lot_holds WHERE id=$1 FOR UPDATE', [id]);
      const hold = result.rows[0];
      if (!hold || hold.released_at) { await client.query('ROLLBACK'); return reject(res, 409, '이미 해제되었거나 보류 내역이 없습니다.'); }
      const kind = ['iqc', 'pqc', 'oqc'].includes(hold.kind) ? hold.kind : str(req.body.retestKind).toLowerCase();
      if (!['iqc', 'pqc', 'oqc'].includes(kind)) { await client.query('ROLLBACK'); return reject(res, 400, '재검사 종류를 선택하세요.'); }
      const pass = await client.query(`SELECT qmes_gate_inspection_pass($1,$2) AND EXISTS(
        SELECT 1 FROM qmes_lot_observations WHERE lot=$1 AND kind=$2 AND observed_at>$3
        AND inspection_date=(SELECT max(inspection_date) FROM qmes_lot_observations WHERE lot=$1 AND kind=$2)) AS passed`,
      [hold.lot, kind, hold.created_at]);
      if (!pass.rows[0]?.passed) { await client.query('ROLLBACK'); return reject(res, 409, '보류 등록 이후 저장된 최신 재검사 합격이 필요합니다. 측정값과 검사 판정을 확인하세요.'); }
      const open = await client.query(`SELECT 1 FROM qmes_lot_observations WHERE lot=$1 AND kind='ncr'
        AND upper(coalesce(payload->>'status','OPEN')) NOT IN ('CLOSED','종결','완료','해제') LIMIT 1`, [hold.lot]);
      if (open.rowCount) { await client.query('ROLLBACK'); return reject(res, 409, '해당 LOT의 미종결 NCR을 먼저 처리하세요.'); }
      const retest = await client.query(`SELECT source,entry,kind,inspection_date,payload,observed_at FROM qmes_lot_observations
        WHERE lot=$1 AND kind=$2 AND inspection_date=(SELECT max(inspection_date) FROM qmes_lot_observations WHERE lot=$1 AND kind=$2)`, [hold.lot, kind]);
      const evidence = { userId: u.id, name: u.name, department: u.department, title: u.title, retest: retest.rows };
      await client.query(`UPDATE qmes_lot_holds SET released_at=clock_timestamp(),released_by=$2,release_reason=$3,release_evidence=$4::jsonb WHERE id=$1`,
        [id, u.name, reason, JSON.stringify(evidence)]);
      await client.query('INSERT INTO qmes_lot_gate_events(action,lot,actor,detail) VALUES($1,$2,$3,$4::jsonb)',
        ['RELEASE', hold.lot, u.name, JSON.stringify({ holdId: id, reason, ...evidence })]);
    }
    await client.query('COMMIT');
    return res.json({ success: true, message: route === '/hold' ? 'LOT가 보류되었습니다.' : '해제 승인이 기록되었습니다. 다른 보류가 남아 있으면 차단이 유지됩니다.' });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

const guardedPath = /^\/api\/(qmes-quality-gate(?:\/|$)|qmes-sync(?:\/|$)|qmes-extra-sync(?:\/|$)|qmes\/|qmes-ncr(?:\/|$)|iqc(?:\/|$)|pqc(?:\/|$)|oqc(?:\/|$)|worklog(?:\/|$)|inventory(?:\/|$)|certificate(?:\/|$)|nonconform(?:\/|$))/;
async function middleware(req, res, next) {
  if (req.method === 'GET' && req.path === '/api/qmes-quality-gate/health') {
    return res.status(initialized ? 200 : 503).json({ success: initialized, version: '20261021-1' });
  }
  const own = req.path.startsWith('/api/qmes-quality-gate/');
  if (!own && (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !guardedPath.test(req.path))) return next();
  if (!req.session?.user) return reject(res, 401, '로그인이 필요합니다.');
  if (own && req.method === 'POST' && req.headers?.origin) {
    try { if (new URL(req.headers.origin).host !== req.get('host')) return reject(res, 403, '같은 사이트에서 요청하세요.'); }
    catch (_) { return reject(res, 403, '요청 출처를 확인하세요.'); }
  }
  try {
    await schema();
    // Add triggers if another addon lazily created a table after startup.
    await pool.query('SELECT qmes_gate_install()');
    if (own) return await api(req, res);
    const expected = req.path.startsWith('/api/qmes/oqc/coa/') ? 'qmes_oqc_coa_issues'
      : req.path.startsWith('/api/qmes/work-orders') ? 'qmes_work_order_documents'
      : req.path.startsWith('/api/qmes-ncr/reports') ? 'qmes_ncr_reports'
      : /^\/api\/qmes-(extra-)?sync\//.test(req.path) ? 'qmes_sync_records'
      : req.path.startsWith('/api/inventory/') ? 'inventory_transactions'
      : req.path.startsWith('/api/worklog') ? 'worklog'
      : null;
    if (expected) {
      const installed = await pool.query('SELECT 1 FROM qmes_lot_gate_installed WHERE table_name=$1', [expected]);
      if (!installed.rowCount) return reject(res, 503, '품질 차단 상태를 준비 중입니다. 해당 목록 화면을 새로고침한 뒤 다시 저장하세요.');
    }
    const json = res.json;
    res.json = function gateAudit(body) {
      const message = str(body?.message);
      if (message.includes('[QUALITY_GATE]')) {
        res.json = json;
        res.status(409);
        const blocked = { ...body, success: false, code: 'QUALITY_GATE_BLOCKED' };
        pool.query('INSERT INTO qmes_lot_gate_events(action,actor,detail) VALUES($1,$2,$3::jsonb)',
          ['BLOCK', actor(req), JSON.stringify({ path: req.path, method: req.method, reason: message })])
          .then(() => json.call(res, blocked)).catch(e => { console.error('[quality gate audit]', e.message); json.call(res, blocked); });
        return res;
      }
      return json.call(res, body);
    };
    return next();
  } catch (e) {
    console.error('[quality gate]', e.message);
    return reject(res, 503, '품질 차단 상태를 확인할 수 없어 저장을 중단했습니다. 잠시 후 다시 시도하세요.');
  }
}
if (!express.__qmesQualityGate20261021) {
  express.__qmesQualityGate20261021 = true;
  const use = express.application.use;
  express.application.use = function (...args) {
    const result = use.apply(this, args);
    if (!this.__qmesQualityGate && args.flat().some(fn => typeof fn === 'function' && fn.name === 'session')) {
      this.__qmesQualityGate = true;
      use.call(this, middleware);
    }
    return result;
  };
  // Warm the migration before the first operator saves a production record.
  const warm = setTimeout(() => schema().catch(e => console.error('[quality gate init]', e.message)), 1000);
  warm.unref();
}
module.exports = { authorized, middleware, schema, pool, api };
