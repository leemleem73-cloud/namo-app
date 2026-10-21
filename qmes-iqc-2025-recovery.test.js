'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { recoverIqc2025Approvals, approvalFromSource, stageSignature } = require('./qmes-iqc-2025-recovery');
const users = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Writer' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Reviewer' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Approver' }
];
const manager = { id: '44444444-4444-4444-8444-444444444444', name: 'Current manager' };
const time = '2025-11-11T10:30:00+09:00';
const signed = (user, action) => ({ userId: user.id, name: user.name, action, status: '\uc644\ub8cc', signedAt: time });
const row = (patch = {}) => ({ record_id: 'sample', inspector: 'Writer', item: 'NMP', lot: 'LOT-2025', inspection_date: '2025-11-11', created_at: '2026-10-07T04:48:00Z', sign_writer: {}, sign_reviewer: {}, sign_approver: {}, ...patch });

test('approved source preserves original writer, actors and timestamps', () => {
  const source = row({ sign_reviewer: signed(users[1], '\uac80\ud1a0'), sign_approver: signed(users[2], '\uc2b9\uc778') });
  const snapshot = JSON.stringify(source);
  const result = approvalFromSource(source, users, manager);
  assert.equal(result.status, 'APPROVED');
  assert.deepEqual(result.writer, users[0]);
  assert.deepEqual(result.reviewer, users[1]);
  assert.deepEqual(result.approver, users[2]);
  assert.equal(result.reviewedAt, time);
  assert.equal(result.approvedAt, time);
  assert.equal(JSON.stringify(source), snapshot);
});
test('review completion remains reviewed, not approved', () => {
  const result = approvalFromSource(row({ sign_reviewer: JSON.stringify(signed(users[1], '\uac80\ud1a0')) }), users, manager);
  assert.equal(result.status, 'REVIEWED');
  assert.equal(result.approvedAt, null);
  assert.deepEqual(result.approver, manager);
});
test('a name, senior position, pending state or malformed signature never grants approval', () => {
  for (const value of [{name:'Approver'}, {name:'Approver',position:'\ubd80\uc7a5'}, {name:'Approver',status:'PENDING',signedAt:time}, {name:'Approver',action:'\uac80\ud1a0',status:'\uc644\ub8cc',signedAt:time}, [], 'broken', null]) {
    assert.equal(stageSignature(value, 'approve').completed, false);
  }
});
test('approved history without a saved time does not fabricate approval or review dates', () => {
  const result = approvalFromSource(row({sign_approver:{name:'Former approver',status:'APPROVED'}}), users, manager);
  assert.equal(result.status, 'APPROVED');
  assert.deepEqual(result.approver, {id:null,name:'Former approver'});
  assert.deepEqual(result.reviewer, {id:null,name:''});
  assert.equal(result.approvedAt, null);
  assert.equal(result.reviewedAt, null);
});
test('empty historical signatures remain pending and do not alter the source', () => {
  const source = row();
  const before = JSON.stringify(source);
  assert.equal(approvalFromSource(source, users, manager).status, 'PENDING');
  assert.equal(JSON.stringify(source), before);
});
test('saved inspector wins over a different login left in writer signature', () => {
  const result = approvalFromSource(row({sign_writer:signed(users[2], '\uc791\uc131')}), users, manager);
  assert.deepEqual(result.writer, users[0]);
});
test('ambiguous names are not linked to a random account', () => {
  const result = approvalFromSource(row(), [...users,{id:manager.id,name:'Writer'}], manager);
  assert.deepEqual(result.writer, {id:null,name:'Writer'});
});
test('recovery remains possible when there is no current quality manager', () => {
  assert.equal(approvalFromSource(row({sign_approver:signed(users[2], '\uc2b9\uc778')}), users, null).status, 'APPROVED');
  assert.deepEqual(approvalFromSource(row(), users, null).approver, {id:null,name:''});
});
function fakePool(rows, options = {}) {
  const calls = [];
  let connections = 0, releases = 0, failAudit = !!options.failAudit;
  const inserted = [], audits = [];
  const client = {
    async query(sql, params = []) {
      calls.push({sql,params});
      const normalized = sql.replace(/\s+/g,' ').trim();
      assert.doesNotMatch(normalized, /^(UPDATE|DELETE|TRUNCATE|DROP)\b/i);
      if (normalized.startsWith('SELECT i.id::text')) {
        assert.match(normalized, /LEFT\(i.date::text, 4\) = '2025'/);
        assert.match(normalized, /NOT EXISTS.*a.doc_type='IQC' AND a.record_id=i.id::text/);
        assert.doesNotMatch(normalized, /status\s*(<>|!=)\s*'DELETED'/);
        assert.match(normalized, /FOR UPDATE OF i/);
        return {rows};
      }
      if (normalized === 'SELECT id, name FROM users') return {rows:users};
      if (normalized.startsWith('INSERT INTO qmes_quality_approvals')) {
        assert.match(normalized, /ON CONFLICT DO NOTHING/);
        if (options.conflict) return {rowCount:0,rows:[]};
        inserted.push(params);
        return {rowCount:1,rows:[{id:inserted.length}]};
      }
      if (normalized.startsWith('INSERT INTO qmes_iqc_2025_recovery_audit')) {
        if (failAudit) { failAudit=false; throw new Error('audit failure'); }
        audits.push(params);
      }
      if (normalized.startsWith('SELECT COUNT(*)')) return {rows:[{inspections:rows.length, linked:rows.length, missing:0,intentionally_deleted:0}]};
      return {rowCount:0,rows:[]};
    },
    release() { releases++; }
  };
  return {calls,inserted,audits,get connections(){return connections;},get releases(){return releases;},async connect(){connections++;return client;}};
}
test('atomic IQC-only recovery uses saved dates and snapshots, without changing source or existing rows', async () => {
  const source = row({sign_approver:signed(users[2], '\uc2b9\uc778')});
  const pool = fakePool([source]);
  assert.equal(await recoverIqc2025Approvals(pool, manager), 1);
  assert.equal(pool.calls[0].sql, 'BEGIN');
  assert.equal(pool.calls.at(-1).sql, 'COMMIT');
  assert.equal(pool.inserted[0][8], 'APPROVED');
  assert.equal(pool.inserted[0][10], time);
  assert.equal(pool.inserted[0][11], source.created_at);
  assert.deepEqual(JSON.parse(pool.audits[0][2]), source);
  assert.equal(pool.releases, 1);
});
test('concurrent readers share one recovery and successful retries do not duplicate rows', async () => {
  const pool = fakePool([row()]);
  await Promise.all(Array.from({length:10},()=>recoverIqc2025Approvals(pool, manager)));
  await recoverIqc2025Approvals(pool, manager);
  assert.equal(pool.connections, 1);
  assert.equal(pool.inserted.length, 1);
  assert.equal(pool.audits.length, 1);
});
test('a uniqueness conflict is not counted or audited as an insertion', async () => {
  const pool = fakePool([row()], {conflict:true});
  assert.equal(await recoverIqc2025Approvals(pool, manager), 0);
  assert.equal(pool.audits.length, 0);
});
test('failure rolls back the transaction, releases connection and allows a retry', async () => {
  const pool = fakePool([row()], {failAudit:true});
  await assert.rejects(recoverIqc2025Approvals(pool, manager), /audit failure/);
  assert.equal(pool.calls.at(-1).sql, 'ROLLBACK');
  assert.equal(pool.releases, 1);
  await recoverIqc2025Approvals(pool, manager);
  assert.equal(pool.calls.at(-1).sql, 'COMMIT');
  assert.equal(pool.connections, 2);
  assert.equal(pool.releases, 2);
});
test('no missing 2025 records produces no writes', async () => {
  const pool = fakePool([]);
  assert.equal(await recoverIqc2025Approvals(pool, manager), 0);
  assert.equal(pool.inserted.length, 0);
  assert.equal(pool.audits.length, 0);
  assert.equal(pool.calls.some(c=>/CREATE TABLE/.test(c.sql)), false);
});
