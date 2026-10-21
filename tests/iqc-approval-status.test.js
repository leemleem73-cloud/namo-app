'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const backendSource = fs.readFileSync(path.join(root, 'qmes-quality-approval-safe.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const statusPath = '/api/qmes-quality/iqc-statuses';
const senior = { id: 'quality-manager', name: '품질 담당자', title: '부장', role: 'user' };
const viewer = { id: 'research-viewer', name: '연구소 조회자', title: '연구원', role: 'user' };

function backendHarness() {
  const queries = [];
  const routes = new Map();
  const records = ['approved', 'reviewed', 'pending', 'missing', 'deleted'];
  const approvals = records.filter(id => id !== 'missing').map((id, index) => ({
    record_id: id,
    status: ['APPROVED', 'REVIEWED', 'PENDING', 'DELETED'][index],
    updated_at: '2026-10-21T02:00:00.000Z',
    title: 'Private approval title',
    writer_user_id: senior.id,
    reviewer_user_id: senior.id,
    approver_user_id: senior.id,
    writer_name: senior.name,
    reviewer_name: senior.name,
    approver_name: senior.name,
  }));
  class Pool {
    async query(sql, params) {
      queries.push({ sql, params });
      // The existing module initializes its schema once; the status read must
      // not create approvals, send notifications, or alter source signatures.
      if (/^\s*CREATE TABLE IF NOT EXISTS qmes_quality_approvals\b/.test(sql)) {
        return { rows: [], rowCount: 0 };
      }
      assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|TRUNCATE)\s+(?:INTO|FROM|iqc|qmes_)/i);
      const selection = sql.match(/^\s*SELECT\s+([\s\S]+?)\s+FROM\s+iqc\s+i\b/i);
      assert.ok(selection, 'status reads must be scoped to existing IQC records');
      assert.match(sql, /LEFT\s+JOIN\s+qmes_quality_approvals\s+a/i);
      assert.match(sql, /a\.doc_type\s*=\s*'IQC'/i);
      assert.match(sql, /a\.record_id\s*=\s*i\.id::text/i);
      assert.match(sql, /a\.status\s*<>\s*'DELETED'/i);
      let result = records.map(id => {
        const approval = approvals.find(row => row.record_id === id && row.status !== 'DELETED');
        const completeRow = { record_id: id, status: null, updated_at: null, ...approval };
        if (/\*/.test(selection[1])) return completeRow;
        return Object.fromEntries(selection[1].split(',').map(field => {
          const key = field.trim().match(/\bAS\s+(\w+)\s*$/i)?.[1]
            || field.trim().match(/\.(\w+)\s*$/)?.[1];
          assert.ok(key, 'unrecognized projected field: ' + field);
          return [key, completeRow[key]];
        }));
      });
      // Model the former participant filter so a regression cannot pass simply
      // because the DB stub returns the same rows for every query.
      if (/\bWHERE\b[\s\S]*\b(?:writer|reviewer|approver)_user_id\b/i.test(sql)) {
        result = result.filter(row => approvals.some(a => a.record_id === row.record_id
          && [a.writer_user_id, a.reviewer_user_id, a.approver_user_id].includes(params?.[0])));
      }
      const limit = sql.match(/\bLIMIT\s+(\d+)/i);
      if (limit) result = result.slice(0, Number(limit[1]));
      return { rows: result, rowCount: result.length };
    }
  }
  const app = {};
  for (const method of ['get', 'post', 'delete']) {
    app[method] = (url, ...handlers) => routes.set(method.toUpperCase() + ' ' + url, handlers);
  }
  const module = { exports: {} };
  const context = vm.createContext({
    module, exports: module.exports, process: { env: {} }, console,
    require(name) {
      if (name === 'express') return { application: { use() {} } };
      if (name === 'pg') return { Pool };
      if (name === 'dotenv') return { config() {} };
      throw new Error('Unexpected dependency: ' + name);
    },
  });
  vm.runInContext(backendSource, context, { filename: 'qmes-quality-approval-safe.js' });
  module.exports.installQmesQualityApprovalSafe(app);
  async function request(user) {
    const handlers = routes.get('GET ' + statusPath);
    assert.ok(handlers, 'shared IQC status endpoint must exist');
    const req = { session: user ? { user } : {} };
    const res = {
      statusCode: 200, headers: {}, body: undefined,
      status(code) { this.statusCode = code; return this; },
      set(key, value) { this.headers[key] = value; return this; },
      json(body) { this.body = JSON.parse(JSON.stringify(body)); return this; },
    };
    const next = index => handlers[index] ? handlers[index](req, res, () => next(index + 1)) : undefined;
    await next(0);
    return res;
  }
  return { queries, request };
}

function inlineFunction(name, nextName) {
  const start = indexSource.indexOf('function ' + name + '(');
  const end = indexSource.indexOf('\nfunction ' + nextName + '(', start);
  assert.ok(start >= 0 && end > start, 'inline production function not found: ' + name);
  const asyncStart = indexSource.slice(start - 6, start) === 'async ' ? start - 6 : start;
  return indexSource.slice(asyncStart, end);
}

function frontendHarness(fetchImpl, oldStates = {}) {
  const body = { innerHTML: '' };
  const section = {
    id: 'incoming', isConnected: true, _iqcPage: 2,
    querySelector(selector) { return selector === 'tbody' ? body : null; },
  };
  const window = {
    __QMES_IQC_APPROVALS__: oldStates,
    qmesAuthDataReady: { async wait() {} },
  };
  const context = vm.createContext({
    window, fetch: fetchImpl, setTimeout,
    console: { warn() {}, error() {} },
    iqcJudge: () => '합격', iqcRemark: () => '', iqcDateText: value => value || '-',
    iqcWeightText: () => '100', iqcItemSummary: () => '포장상태 / 외관',
    updateIncomingMaterialsFromDb() {}, saveIncomingPageCache() {}, applyIncomingMetrics() {}, wireModule() {},
    renderIncomingPage(current) {
      body.innerHTML = current._iqcRows.map((row, index) => context.iqcRowHtml(row, index)).join('');
    },
  });
  vm.runInContext(inlineFunction('iqcRowHtml', 'updateIncomingMaterialsFromDb'), context);
  vm.runInContext(inlineFunction('loadIncomingFromDb', 'qualityApprovalShell'), context);
  return { context, section, window, body, load: () => context.loadIncomingFromDb(section) };
}

function response(data, ok = true, success = true) {
  return { ok, status: ok ? 200 : 500, async json() { return { success, data }; } };
}

test('senior and unrelated IQC viewer receive identical completed document status', async () => {
  const backend = backendHarness();
  const managerResult = await backend.request(senior);
  const viewerResult = await backend.request(viewer);
  assert.equal(managerResult.statusCode, 200);
  assert.equal(viewerResult.statusCode, 200);
  assert.deepEqual(viewerResult.body, managerResult.body);
  assert.equal(viewerResult.body.data.find(row => row.record_id === 'approved').status, 'APPROVED');
  assert.equal(viewerResult.body.data.find(row => row.record_id === 'deleted').status, null);
});

test('anonymous status access is rejected before any database query', async () => {
  const backend = backendHarness();
  const result = await backend.request();
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.success, false);
  assert.equal(backend.queries.length, 0);
});

test('status reads expose no private approval payload and do not write document data', async () => {
  const backend = backendHarness();
  await backend.request(senior); // Complete the module\'s existing one-time schema setup.
  backend.queries.length = 0;
  const result = await backend.request(viewer);
  assert.equal(backend.queries.length, 1);
  assert.match(backend.queries[0].sql, /^\s*SELECT\b/);
  assert.equal(backend.queries[0].params, undefined);
  for (const row of result.body.data) {
    assert.deepEqual(Object.keys(row).sort(), ['record_id', 'status', 'updated_at']);
  }
  assert.match(result.headers['Cache-Control'], /no-store/);
  assert.doesNotMatch(backend.queries[0].sql, /\bLIMIT\b/i);
});

test('IQC list requests shared status and renders approval identically for both sessions', async () => {
  const backend = backendHarness();
  for (const user of [senior, viewer]) {
    const requested = [];
    const frontend = frontendHarness(async (url, options) => {
      requested.push(url);
      assert.equal(options.credentials, 'same-origin');
      assert.equal(options.cache, 'no-store');
      if (url === '/api/iqc') return response([{ id: 'approved' }]);
      assert.equal(url, statusPath);
      return response((await backend.request(user)).body.data);
    });
    await frontend.load();
    assert.deepEqual(requested, ['/api/iqc', statusPath]);
    assert.match(frontend.body.innerHTML, />승인완료</);
    assert.doesNotMatch(frontend.body.innerHTML, />검토대기</);
  }
});

test('only actual PENDING records render as 검토대기', () => {
  const frontend = frontendHarness(() => { throw new Error('not used'); });
  const labels = new Map([
    ['APPROVED', '승인완료'], ['REVIEWED', '승인대기'], ['DRAFT', '작성중'],
    ['PENDING', '검토대기'], [null, '확인 필요'], ['DELETED', '확인 필요'], ['UNKNOWN', '확인 필요'],
  ]);
  for (const [status, label] of labels) {
    frontend.window.__QMES_IQC_APPROVALS__ = { record: { status } };
    const html = frontend.context.iqcRowHtml({ id: 'record' }, 0);
    assert.ok(html.includes('>' + label + '<'), status + ' must render ' + label);
    if (status !== 'PENDING') assert.doesNotMatch(html, />검토대기</);
  }
  frontend.window.__QMES_IQC_APPROVALS__ = {};
  assert.match(frontend.context.iqcRowHtml({ id: 'missing' }, 0), />확인 필요</);
});

test('failed status lookup clears a previous session\'s completed status', async t => {
  const failures = {
    network: async () => { throw new Error('offline'); },
    http: async () => response(null, false, false),
    malformed: async () => response({ unexpected: true }),
  };
  for (const [name, failStatus] of Object.entries(failures)) {
    await t.test(name, async () => {
      const frontend = frontendHarness(async url => url === '/api/iqc'
        ? response([{ id: 'approved' }]) : failStatus(), { approved: { status: 'APPROVED' } });
      await frontend.load();
      assert.equal(Object.keys(frontend.window.__QMES_IQC_APPROVALS__).length, 0);
      assert.match(frontend.body.innerHTML, />확인 필요</);
      assert.doesNotMatch(frontend.body.innerHTML, />승인완료<|>검토대기</);
    });
  }
});

test('a superseded status response cannot overwrite the latest list request', async () => {
  let releaseOld;
  let markStarted;
  const oldStarted = new Promise(resolve => { markStarted = resolve; });
  const oldStatus = new Promise(resolve => { releaseOld = resolve; });
  let statusRequests = 0;
  const frontend = frontendHarness(async url => {
    if (url === '/api/iqc') return response([{ id: 'approved' }]);
    assert.equal(url, statusPath);
    if (++statusRequests === 1) { markStarted(); return oldStatus; }
    return response([{ record_id: 'approved', status: 'APPROVED' }]);
  });
  const firstLoad = frontend.load();
  await oldStarted;
  await frontend.load();
  releaseOld(response([{ record_id: 'approved', status: 'PENDING' }]));
  await firstLoad;
  assert.equal(frontend.window.__QMES_IQC_APPROVALS__.approved.status, 'APPROVED');
  assert.match(frontend.body.innerHTML, />승인완료</);
});
