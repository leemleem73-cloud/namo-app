'use strict';
// Run with linkedom available: NODE_PATH=/path/to/test/node_modules node --test tests/oqc-registration-parity-20261021.test.cjs
// Uses the actual registration builder, initialization, layout, auto-judgment and interlock scripts.
// linkedom supplies DOM behavior only; these assertions do not claim browser pixel rendering.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { parseHTML } = require('linkedom');
const repo = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(repo, 'public/index.html'), 'utf8');
const readScript = name => fs.readFileSync(path.join(repo, 'public/js', name), 'utf8');
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function fixture(t, beforePatch) {
  const { window: dom } = parseHTML('<!doctype html><html><head></head><body><main id="mainWorkspace"><section class="am-split" data-am-screen="outgoing"><div id="mount"></div><button id="modalSave" type="button">저장</button></section></main></body></html>');
  // Use a distinct application window because linkedom's Window proxy shares JS globals.
  const window = { document: dom.document, Event: dom.Event, HTMLSelectElement: dom.HTMLSelectElement };
  // linkedom omits the capture phase. Retain actual document capture listeners and
  // dispatch them before target/bubble listeners, as the browser DOM requires.
  const captures = new Map();
  const nativeAdd = window.document.addEventListener.bind(window.document);
  window.document.addEventListener = (type, listener, options) => {
    if (options === true || options?.capture) {
      if (!captures.has(type)) captures.set(type, []);
      captures.get(type).push(listener);
    } else nativeAdd(type, listener, options);
  };
  const dispatch = (target, type) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    event.target = target;
    let stopped = false;
    const stop = event.stopImmediatePropagation.bind(event);
    event.stopImmediatePropagation = () => { stopped = true; stop(); };
    for (const listener of captures.get(type) || []) {
      listener.call(window.document, event);
      if (stopped) break;
    }
    if (!stopped) target.dispatchEvent(event);
    return event;
  };
  // linkedom omits select.value assignment and option.value's text fallback.
  // Emulate only this browser platform primitive; application judgment logic is not mocked.
  Object.defineProperty(dom.HTMLOptionElement.prototype, 'value', {
    configurable: true,
    get() { return this.getAttribute('value') ?? this.textContent; },
    set(value) { this.setAttribute('value', String(value)); }
  });
  const noSelection = new WeakSet();
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable: true,
    get() {
      if (noSelection.has(this)) return '';
      const option = [...this.options].find(el => el.selected) || this.options[0];
      return option ? option.value : '';
    },
    set(value) {
      let selected = false;
      for (const option of this.options) {
        const match = !selected && option.value === String(value);
        if (match) option.setAttribute('selected', ''); else option.removeAttribute('selected');
        if (match) selected = true;
      }
      if (selected) noSelection.delete(this); else noSelection.add(this);
    }
  });
  const observers = [];
  const context = vm.createContext({
    window, document: window.document, console, queueMicrotask,
    crypto: { randomUUID },
    Event: window.Event,
    MutationObserver: function (callback) {
      // Both production observers request childList only. linkedom also reports attributes;
      // filter those to honor the browser API and avoid false observer recursion.
      const observer = new dom.MutationObserver(records => {
        const children = records.filter(record => record.type === 'childList');
        if (children.length) callback(children);
      });
      observers.push(observer);
      return observer;
    },
    NAMO_RAW_MATERIALS: [],
    qmesQualityApprovalPeople: () => ({ writer: '검증 작성자', reviewer: '검토대기', approver: '승인대기' })
  });
  t.after(() => observers.forEach(observer => observer.disconnect()));
  const execute = name => vm.runInContext(readScript(name), context, { filename: name });
  for (const name of ['stdMeasureCell', 'standardInspectionRows', 'standardInspectionForm', 'initStandardInspectionForm', 'evaluatePqcMeasurements']) {
    const start = index.indexOf('function ' + name + '(');
    const end = index.indexOf('\nfunction ', start + 1);
    assert.ok(start >= 0 && end > start, name + ' exists in actual index');
    vm.runInContext(index.slice(start, end), context, { filename: 'index.html:' + name });
  }
  window.standardInspectionForm = context.standardInspectionForm;
  window.initStandardInspectionForm = context.initStandardInspectionForm;
  window.openNewForm = type => window.standardInspectionForm(type);
  execute('qmes-oqc-registration-layout-20261021.js');
  const mount = window.document.getElementById('mount');
  mount.innerHTML = window.openNewForm('outgoing');
  const root = mount.querySelector('.std-inspection');
  beforePatch?.({ window, root, context });
  execute('qmes-oqc-rules-20261019.js');
  window.qmesOqcRules = context.qmesOqcRules;
  execute('qmes-oqc-sequential-block-20261021.js');
  execute('qmes-oqc-registration-auto-judge-20261021-v2.js');
  window.initStandardInspectionForm('outgoing');
  const rows = [...root.querySelectorAll('.std-result tbody tr')];
  const row = name => rows.find(tr => tr.querySelector('.item').textContent.trim() === name);
  const controls = name => [...row(name).querySelectorAll('.std-measure')];
  const set = (name, sample, value) => {
    const input = controls(name)[sample];
    input.value = value;
    dispatch(input, input.tagName === 'SELECT' ? 'change' : 'input');
  };
  const set3 = (name, value) => [0, 1, 2].forEach(sample => set(name, sample, value));
  const label = name => row(name).querySelector('.oqc-auto-item-judge').textContent;
  const overall = () => root.querySelector('#stdOverallJudge').value;
  return { window, context, root, mount, rows, row, controls, set, set3, label, overall, execute, dispatch };
}

test('initial registration has 8 automatic, accessible judgments and original 24 measurements', async t => {
  const f = fixture(t);
  await flush();
  assert.equal(f.rows.length, 8);
  assert.equal(f.root.querySelectorAll('.std-measure').length, 24);
  assert.equal(f.overall(), '대기');
  assert.equal(f.root.querySelector('#stdOverallJudge').disabled, true);
  for (const row of f.rows) {
    const judge = row.querySelector('.std-row-judge');
    assert.equal(judge.disabled, true);
    assert.equal(judge.getAttribute('aria-hidden'), 'true');
    assert.equal(row.querySelector('.oqc-auto-item-judge').textContent, '대기');
    assert.equal(row.querySelector('.oqc-auto-item-judge').getAttribute('aria-live'), 'polite');
  }
  assert.deepEqual([...f.controls('외관')[0].options].map(option => option.value), ['', '이상없음', '이상있음']);
  assert.deepEqual([...f.controls('전해액 안정성')[0].options].map(option => option.value), ['', '미탈리', '탈리']);
  assert.equal(f.root.querySelectorAll('.oqc-sequential-locked').length, 0);
  assert.equal(f.controls('절연저항')[0].type, 'text');
});

test('a row stays pending for 1 or 2 valid measurements; the third produces pass', async t => {
  const f = fixture(t);
  f.set('입도(Dmax)', 0, '9'); await flush();
  assert.equal(f.label('입도(Dmax)'), '대기');
  f.set('입도(Dmax)', 1, '9'); await flush();
  assert.equal(f.label('입도(Dmax)'), '대기');
  f.set('입도(Dmax)', 2, '9'); await flush();
  assert.equal(f.label('입도(Dmax)'), '합격');
  assert.equal(f.overall(), '대기');
});

test('numeric judgments enforce the displayed strict and inclusive boundaries', async t => {
  const f = fixture(t);
  const cases = [
    ['입도(Dmax)', '9.999', '합격'], ['입도(Dmax)', '10', '불합격'], ['입도(Dmax)', '-1', '불합격'], ['입도(Dmax)', '5', '합격'],
    ['점도', '1200', '합격'], ['점도', '1800', '합격'], ['점도', '1800.01', '불합격'], ['점도', '1500', '합격'],
    ['수분율', '1999.9', '합격'], ['수분율', '2000', '불합격'], ['수분율', '100', '합격'],
    ['고형분', '19', '합격'], ['고형분', '21', '합격'], ['고형분', '18.999', '불합격'], ['고형분', '20', '합격'],
    ['접착력', '400', '합격'], ['접착력', '399.9', '불합격'], ['접착력', '450', '합격'],
    ['절연저항', '200', '합격'], ['절연저항', '199.9', '불합격'], ['절연저항', 'Overflow', '합격']
  ];
  for (const [name, value, expected] of cases) {
    f.set3(name, value); await flush();
    assert.equal(f.label(name), expected, name + ' ' + value);
  }
});

test('one failing reading locks subsequent rows, preserves their values and permits correction', async t => {
  const f = fixture(t);
  f.set3('외관', '이상없음');
  f.set3('입도(Dmax)', '5');
  f.set3('점도', '1500');
  f.set('수분율', 0, '100');
  f.set('입도(Dmax)', 1, '10');
  await flush();
  assert.equal(f.overall(), '불합격');
  assert.equal(f.label('입도(Dmax)'), '불합격');
  assert.equal(f.root.querySelector('.oqc-sequential-warning strong').textContent, '후속 공정 차단');
  assert.equal(f.root.querySelectorAll('.oqc-sequential-locked').length, 6);
  assert.ok(f.controls('입도(Dmax)').every(input => !input.disabled), 'failing item can be corrected');
  assert.ok(f.controls('점도').every(input => input.disabled));
  assert.equal(f.controls('점도')[0].value, '1500');
  assert.equal(f.controls('수분율')[0].value, '100');
  f.set('입도(Dmax)', 1, '5'); await flush();
  assert.equal(f.label('입도(Dmax)'), '합격');
  assert.equal(f.root.querySelectorAll('.oqc-sequential-locked').length, 0);
  assert.equal(f.root.querySelector('.oqc-sequential-warning'), null);
  assert.ok(f.controls('점도').every(input => !input.disabled));
  assert.ok([...f.root.querySelectorAll('.std-row-judge')].every(input => input.disabled), 'judgments remain read-only after unlocking');
});

test('all 24 readings are required for overall pass; clearing or failing one changes it immediately', async t => {
  const f = fixture(t);
  const values = { '외관': '이상없음', '입도(Dmax)': '5', '점도': '1500', '수분율': '100', '고형분': '20', '접착력': '450', '절연저항': 'Overflow', '전해액 안정성': '미탈리' };
  for (const [name, value] of Object.entries(values)) f.set3(name, value);
  await flush();
  assert.equal(f.overall(), '합격');
  assert.ok(f.rows.every(row => row.querySelector('.oqc-auto-item-judge').dataset.oqcAutoResult === '합격'));
  f.set('전해액 안정성', 2, ''); await flush();
  assert.equal(f.overall(), '대기');
  f.set('전해액 안정성', 2, '탈리'); await flush();
  assert.equal(f.overall(), '불합격');
  assert.equal(f.label('전해액 안정성'), '불합격');
  f.set('전해액 안정성', 2, '미탈리'); await flush();
  assert.equal(f.overall(), '합격');
});

test('legacy qualitative selections normalize without losing entered values', async t => {
  const f = fixture(t, ({ root }) => {
    for (const row of root.querySelectorAll('.std-result tbody tr')) {
      const name = row.querySelector('.item').textContent.trim();
      if (name === '외관' || name === '전해액 안정성') {
        for (const input of row.querySelectorAll('.std-measure')) input.value = '적합';
      }
    }
  });
  await flush();
  assert.ok(f.controls('외관').every(input => input.value === '이상없음'));
  assert.ok(f.controls('전해액 안정성').every(input => input.value === '미탈리'));
  assert.equal(f.label('외관'), '합격');
  assert.equal(f.label('전해액 안정성'), '합격');
});

test('manual selector tampering is recalculated before the save click is handled', async t => {
  const f = fixture(t);
  await flush();
  f.row('점도').querySelector('.std-row-judge').value = '합격';
  f.root.querySelector('#stdOverallJudge').value = '합격';
  f.dispatch(f.window.document.getElementById('modalSave'), 'click');
  await flush();
  assert.equal(f.row('점도').querySelector('.std-row-judge').value, '대기');
  assert.equal(f.overall(), '대기');
});

test('registration-only patch leaves process form and outgoing certificate markup untouched', async t => {
  const f = fixture(t);
  await flush();
  f.mount.innerHTML = f.window.standardInspectionForm('process') + f.window.standardInspectionForm('outgoing');
  const before = f.mount.innerHTML;
  await flush();
  assert.equal(f.mount.innerHTML, before);
  assert.equal(f.mount.querySelectorAll('.oqc-auto-item-judge').length, 0);
  const sourceBefore = f.context.evaluatePqcMeasurements({ '외관': ['이상없음', '이상없음', '이상없음'], '입도(Dmax)': ['9', '9', '9'], '점도': ['1500', '1500', '1500'], '고형분': ['20', '20', '20'] });
  assert.equal(sourceBefore.overall, '합격');
  f.execute('qmes-oqc-registration-auto-judge-20261021-v2.js');
  assert.equal(f.window.document.querySelectorAll('#qmes-oqc-registration-auto-judge-20261021').length, 1, 'idempotent installation');
});

function saveFixture(t, response) {
  const f = fixture(t);
  const effects = { requests: [], messages: [], closed: 0, loads: [], legacySaves: 0, forwards: 0 };
  f.window.__QMES_CURRENT_USER__ = { name: '등록 검증자' };
  f.window.toast = message => effects.messages.push(message);
  f.window.closeModal = () => { effects.closed++; f.root.remove(); };
  f.window.loadHistoricalInspectionRows = async (section, type) => effects.loads.push({ section: section.id, type });
  f.window.document.body.insertAdjacentHTML('beforeend', '<section id="outgoing" class="module-page"></section>');
  f.context.fetch = async (url, options) => {
    const request = { url, ...options, payload: JSON.parse(options.body) };
    effects.requests.push(request);
    return response ? response(request, effects) : { ok: true, json: async () => ({ success: true, created: true }) };
  };
  const footer = f.window.document.getElementById('modalSave');
  footer.addEventListener('click', () => { effects.legacySaves++; });
  const top = f.window.document.createElement('button');
  top.setAttribute('data-am-save', '');
  top.type = 'button';
  top.textContent = '저장';
  top.addEventListener('click', () => { effects.forwards++; f.dispatch(footer, 'click'); });
  f.window.document.getElementById('mainWorkspace').append(top);
  f.execute('qmes-oqc-registration-save-20261021.js');
  const field = name => f.root.querySelector('[data-oqc-registration-field="' + name + '"]');
  field('lot').value = 'VALIDATION-LOT';
  field('product').value = '검증 제품';
  field('customer').value = '검증 고객';
  field('remarks').value = '검증 비고';
  return { ...f, effects, footer, top, field };
}

test('registration defaults, automatic states and missing-required-field errors keep the form open', async t => {
  const f = saveFixture(t);
  await flush();
  assert.equal(f.field('inspector').value, '등록 검증자');
  assert.equal(f.field('date').value, new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }));
  assert.equal(f.field('coaStatus').value, '대기');
  assert.equal(f.field('coaStatus').disabled, true);
  assert.equal(f.field('inspectionStatus').value, '검사중');
  assert.equal(f.field('inspectionStatus').disabled, true);
  f.field('lot').value = '';
  f.dispatch(f.top, 'click'); await flush();
  assert.equal(f.effects.requests.length, 0);
  assert.equal(f.effects.closed, 0);
  assert.match(f.root.querySelector('.oqc-registration-save-error').textContent, /완제품 LOT/);
  assert.equal(f.effects.legacySaves, 0);
  assert.equal(f.effects.forwards, 0);
});

test('top save persists pending data once, intercepts forwarding and updates the outgoing list', async t => {
  const f = saveFixture(t);
  f.set('입도(Dmax)', 0, '9'); await flush();
  f.dispatch(f.top, 'click');
  f.dispatch(f.top, 'click');
  await flush();
  assert.equal(f.effects.requests.length, 1);
  assert.equal(f.effects.legacySaves, 0);
  assert.equal(f.effects.forwards, 0);
  const request = f.effects.requests[0];
  assert.equal(request.url, '/api/qmes-sync/oqc/register');
  assert.equal(request.method, 'POST');
  assert.equal(request.credentials, 'same-origin');
  assert.match(request.payload.requestId, /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i);
  assert.deepEqual(request.payload.measurements['입도(Dmax)'], ['9', '', '']);
  assert.equal(Object.keys(request.payload.measurements).length, 8);
  assert.equal(request.payload.fields.remarks, '검증 비고');
  assert.equal(f.effects.closed, 1);
  assert.deepEqual(f.effects.loads, [{ section: 'outgoing', type: 'outgoing' }]);
  assert.equal(f.window.document.getElementById('outgoing').classList.contains('active'), true);
});

test('failed measurement is saved with disabled downstream values; error preserves and retries the same request', async t => {
  let finish;
  const f = saveFixture(t, (request, effects) => effects.requests.length === 1
    ? new Promise(resolve => { finish = resolve; })
    : { ok: true, json: async () => ({ success: true, created: true }) });
  f.set3('점도', '1500');
  f.set('입도(Dmax)', 0, '10'); await flush();
  assert.equal(f.overall(), '불합격');
  assert.equal(f.controls('점도')[0].disabled, true);
  f.dispatch(f.footer, 'click');
  assert.equal(f.footer.disabled, true);
  assert.ok([...f.root.querySelectorAll('input,select,textarea')].every(input => input.disabled));
  assert.deepEqual(f.effects.requests[0].payload.measurements['점도'], ['1500', '1500', '1500']);
  assert.deepEqual(f.effects.requests[0].payload.measurements['입도(Dmax)'], ['10', '', '']);
  const requestId = f.effects.requests[0].payload.requestId;
  f.dispatch(f.top, 'click');
  assert.equal(f.effects.requests.length, 1, 'busy request is not duplicated');
  finish({ ok: false, json: async () => ({ success: false, message: '일시적 저장 오류' }) });
  await flush();
  assert.equal(f.effects.closed, 0);
  assert.equal(f.root.isConnected, true);
  assert.equal(f.footer.disabled, false);
  assert.equal(f.controls('입도(Dmax)')[0].disabled, false);
  assert.equal(f.controls('점도')[0].disabled, true, 'interlock survives save error');
  assert.match(f.root.querySelector('.oqc-registration-save-error').textContent, /일시적 저장 오류/);
  f.dispatch(f.footer, 'click'); await flush();
  assert.equal(f.effects.requests.length, 2);
  assert.equal(f.effects.requests[1].payload.requestId, requestId);
  assert.equal(f.effects.closed, 1);
  assert.equal(f.effects.legacySaves, 0);
});
