const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const script = html.match(/<script id="namo-global-operation-loader">([\s\S]*?)<\/script>/)[1];

function loader(nativeFetch) {
  const changes = [];
  const window = {
    location: new URL('https://namo.example/'),
    fetch: nativeFetch,
  };
  const document = {
    readyState: 'loading', body: null, addEventListener() {},
    documentElement: {
      setAttribute(name, value) { changes.push(value); },
      removeAttribute() {},
    },
  };
  vm.runInNewContext(script, { window, document, URL, Promise, setTimeout() {}, clearTimeout() {}, console });
  changes.length = 0;
  return { window, changes };
}

test('CoA status and preserved-record reads never cover the screen, even while pending', async () => {
  const calls = [];
  let finish;
  const response = { ok: true };
  const pending = new Promise(resolve => { finish = resolve; });
  const { window, changes } = loader((...args) => { calls.push(args); return pending; });
  const options = { method: 'POST', body: '{"targets":[]}', credentials: 'same-origin', cache: 'no-store' };
  const first = window.fetch('/api/qmes/oqc/coa/status', options);
  const second = window.fetch({ url: 'https://namo.example/api/qmes/oqc/coa/record', method: 'POST' });
  assert.deepEqual(changes, []);
  assert.equal(calls[0][1], options);
  assert.equal(calls.length, 2);
  finish(response);
  assert.equal(await first, response);
  assert.equal(await second, response);
  assert.deepEqual(changes, []);
});

test('issuance, cancellation, other writes and external URLs retain the loader', async () => {
  for (const url of ['/api/qmes/oqc/coa/issue', '/api/qmes/oqc/coa/cancel', '/api/qmes-sync/oqc/save-detail', 'https://other.example/api/qmes/oqc/coa/status']) {
    const { window, changes } = loader(async () => ({ ok: true }));
    await window.fetch(url, { method: 'POST' });
    assert.deepEqual(changes, ['active'], url);
  }
});

test('read failures propagate without covering the certificate', async () => {
  const failure = new Error('offline');
  const { window, changes } = loader(async () => { throw failure; });
  await assert.rejects(window.fetch('/api/qmes/oqc/coa/status', { method: 'POST' }), error => error === failure);
  assert.deepEqual(changes, []);
});
