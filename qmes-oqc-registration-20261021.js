'use strict';

// Create one OQC group without replacing existing inspection records.
// Browser labels are advisory: shared measurement rules determine every saved result.
const { createHash } = require('node:crypto');
const rules = require('./public/js/qmes-oqc-rules-20261019.js');
const endpoint = '/api/qmes-sync/oqc/register';
const version = '20261021-1';
const invalid = message => Object.assign(new Error(message), { status: 400 });
const conflict = message => Object.assign(new Error(message), { status: 409 });
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function text(value, name, maximum, required = false) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > maximum) throw invalid(name + '을(를) 확인해 주세요.');
  const result = value.trim();
  if (required && (!result || result === '-')) throw invalid(name + '을(를) 입력해 주세요.');
  return result;
}

function normalizeRegistration(body) {
  if (!object(body) || !object(body.fields) || !object(body.measurements)) {
    throw invalid('출하검사 기본정보와 측정값을 확인해 주세요.');
  }
  const requestId = text(body.requestId, '등록 식별자', 36, true).toLowerCase();
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(requestId)) throw invalid('등록 식별자를 확인해 주세요.');
  const source = body.fields;
  const fields = {
    date: text(source.date, '검사일자', 10, true),
    lot: text(source.lot, '완제품 LOT', 120, true).toUpperCase(),
    product: text(source.product, '제품명', 200),
    customer: text(source.customer, '고객사', 200),
    inspector: text(source.inspector, '검사자', 120, true),
    remarks: text(source.remarks, '비고', 2000),
    // Included in retry identity, but never used to issue a CoA or decide a result.
    coaStatus: text(source.coaStatus, 'CoA 상태', 40),
    inspectionStatus: text(source.inspectionStatus, '검사상태', 40),
  };
  const date = new Date(fields.date + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== fields.date) {
    throw invalid('올바른 검사일자를 입력해 주세요.');
  }
  const entered = {};
  for (const [name, values] of Object.entries(body.measurements)) {
    const item = rules.canonical(name);
    if (!rules.items.includes(item) || Object.hasOwn(entered, item) || !Array.isArray(values) || values.length > 3) {
      throw invalid('검사항목별 1차·2차·3차 측정값을 확인해 주세요.');
    }
    entered[item] = Array.from({ length: 3 }, (_, index) => {
      const value = index < values.length ? values[index] : '';
      if (typeof value !== 'string' || value.length > 100) throw invalid(item + ' 측정값을 확인해 주세요.');
      return value.trim();
    });
  }
  const measurements = Object.fromEntries(rules.items.map(item => [item, entered[item] || ['', '', '']]));
  const requestHash = createHash('sha256').update(JSON.stringify({ fields, measurements })).digest('hex');
  return { requestId, recordKey: 'oqc-registration:' + requestId, requestHash, fields, measurements };
}

function makePayload(normalized, user, now) {
  const { requestId, requestHash, fields, measurements } = normalized;
  const result = rules.evaluateMeasurements(measurements);
  const groupId = 'OQC-' + fields.date.replace(/-/g, '') + '-' + requestId;
  const inspectionStatus = result.overall === '대기' ? '검사중' : '검사완료';
  const rows = rules.items.map((check, index) => {
    const values = measurements[check];
    const numbers = values.map(rules.parseNumber);
    return {
      id: groupId + '-' + (index + 1), groupId,
      date: fields.date, shipDate: '', time: '',
      lot: fields.lot, product: fields.product, customer: fields.customer,
      inspector: fields.inspector, remarks: fields.remarks,
      writerName: String(user.name || ''), writerUserId: String(user.id),
      check, measurements: values.slice(), value: values.join(' / '),
      average: numbers.every(value => value !== null) ? numbers.reduce((sum, value) => sum + value, 0) / 3 : null,
      judge: result.items[check], inspectionDecision: '자동판정', inspectionStatus,
      // Inspection save does not confirm shipment or create a second manual hold on every row.
      // Failed measurements themselves create durable holds through the existing database trigger.
      shippingStatus: '', coaStatus: '대기', shipQty: '', destination: '',
      note: '출하검사',
    };
  });
  return {
    mode: 'OQC', lotNo: fields.lot, groupId, rows, overall: result.overall,
    savedAt: now, savedBy: String(user.name || ''),
    registration: { version, requestId, requestHash, userId: String(user.id) },
  };
}

function dataFor(recordKey, payload) {
  const measurements = {};
  for (const row of payload.rows || []) {
    const name = rules.canonical(row.check);
    if (rules.items.includes(name)) measurements[name] = row.measurements;
  }
  return { recordKey, groupId: payload.groupId, rows: payload.rows, overall: rules.evaluateMeasurements(measurements).overall };
}

function createHandler({ pool, auditLog } = {}) {
  if (!pool || typeof pool.connect !== 'function') throw new TypeError('OQC registration requires a database pool.');
  return async function registerOqc(req, res) {
    const reject = (status, message) => res.status(status).json({ success: false, message });
    const userId = String(req.session?.user?.id || '').trim();
    if (!userId) return reject(401, '로그인이 필요합니다.');
    let normalized;
    try { normalized = normalizeRegistration(req.body); }
    catch (error) { return reject(error.status || 400, error.message); }

    let client, transaction = false;
    try {
      client = await pool.connect();
      await client.query('BEGIN'); transaction = true;
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '10s'");
      const found = await client.query('SELECT id,name,email,status FROM users WHERE id::text=$1', [userId]);
      const user = found.rows[0];
      if (!user || user.status !== 'APPROVED') {
        await client.query('ROLLBACK'); transaction = false;
        return reject(403, '승인된 사용자만 등록할 수 있습니다.');
      }
      // Serialize retries for the same form, then registrations merged by the current list (LOT/date).
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [normalized.recordKey]);
      const existing = await client.query("SELECT payload FROM qmes_sync_records WHERE record_type='oqc' AND record_key=$1", [normalized.recordKey]);
      if (existing.rows.length) {
        const saved = existing.rows[0].payload;
        if (!object(saved) || saved.deleted || saved.registration?.userId !== String(user.id) || saved.registration?.requestHash !== normalized.requestHash) {
          throw conflict('이미 저장된 등록 요청의 내용이 다릅니다. 목록에서 기존 기록을 확인해 주세요.');
        }
        await client.query('COMMIT'); transaction = false;
        return res.json({ success: true, data: dataFor(normalized.recordKey, saved), created: false, message: '이미 저장된 출하검사입니다.' });
      }
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['oqc-registration:' + normalized.fields.lot + ':' + normalized.fields.date]);
      const duplicate = await client.query(`SELECT 1 FROM qmes_sync_records record
        CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(record.payload->'rows')='array'
          THEN record.payload->'rows' ELSE '[]'::jsonb END) item
        WHERE record.record_type='oqc' AND coalesce(record.payload->>'deleted','false')<>'true'
          AND upper(btrim(coalesce(item->>'lot','')))= $1
          AND left(coalesce(item->>'date',item->>'shipDate',''),10)= $2 LIMIT 1`,
      [normalized.fields.lot, normalized.fields.date]);
      if (duplicate.rows.length) throw conflict('같은 검사일자와 LOT의 출하검사가 있습니다. 목록에서 해당 기록을 열어 수정해 주세요.');

      const payload = makePayload(normalized, user, new Date().toISOString());
      const inserted = await client.query(`INSERT INTO qmes_sync_records(record_type,record_key,payload,updated_by,updated_at)
        VALUES('oqc',$1,$2::jsonb,$3,NOW()) ON CONFLICT(record_type,record_key) DO NOTHING RETURNING record_key`,
      [normalized.recordKey, JSON.stringify(payload), String(user.name || '')]);
      if (!inserted.rows.length) throw conflict('이미 저장된 등록 요청입니다. 목록에서 기존 기록을 확인해 주세요.');
      await client.query('COMMIT'); transaction = false;
      if (typeof auditLog === 'function') {
        try { await auditLog(req, 'CREATE', 'qmes_sync_records', 'oqc:' + normalized.recordKey, null, payload); }
        catch (error) { console.warn('[OQC registration audit]', error.message); }
      }
      return res.json({ success: true, data: dataFor(normalized.recordKey, payload), created: true, message: '출하검사 저장 완료' });
    } catch (error) {
      if (transaction) await client.query('ROLLBACK').catch(() => {});
      if (error.status) return reject(error.status, error.message);
      if (String(error.message || '').includes('[QUALITY_GATE]')) return reject(409, error.message);
      console.error('[OQC registration]', error.message);
      return reject(500, '출하검사 저장에 실패했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 저장해 주세요.');
    } finally { if (client) client.release(); }
  };
}

function install(app, options) {
  if (app.__qmesOqcRegistration20261021) return;
  app.__qmesOqcRegistration20261021 = true;
  const handler = createHandler(options);
  const middleware = typeof options.requireLogin === 'function' ? [options.requireLogin, handler] : [handler];
  app.post(endpoint, ...middleware);
}

module.exports = { endpoint, version, normalizeRegistration, makePayload, createHandler, install };
