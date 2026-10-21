/* Persist new OQC certificates, retaining failed/pending results and all three measurements. */
(function () {
  'use strict';
  if (window.__qmesOqcRegistrationSave20261021) return;
  window.__qmesOqcRegistrationSave20261021 = true;
  const scope = '.std-inspection.oqc-pqc-layout[data-inspection-type="outgoing"]';
  const states = new WeakMap();
  const fieldsByLabel = {
    '검사일자': 'date', '검사자': 'inspector', '고객사': 'customer',
    '제품명': 'product', '완제품 LOT': 'lot', '비고': 'remarks',
    'CoA 상태': 'coaStatus', '검사상태': 'inspectionStatus'
  };
  const tell = message => { if (typeof window.toast === 'function') window.toast(message); };

  function prepare(root) {
    if (!states.has(root)) {
      states.set(root, { requestId: crypto.randomUUID(), busy: false, saved: false });
      root.querySelectorAll('.std-info .am-inline-cell').forEach(cell => {
        const name = fieldsByLabel[cell.querySelector('label')?.textContent.trim()];
        const input = cell.querySelector('input,select,textarea');
        if (!name || !input) return;
        input.dataset.oqcRegistrationField = name;
        if (!input.id) input.id = 'oqcRegistration-' + name;
        cell.querySelector('label').htmlFor = input.id;
        if (name === 'date' && !input.value) input.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
        if (name === 'inspector' && !input.value) input.value = String(window.__QMES_CURRENT_USER__?.name || '');
        if (name === 'coaStatus') {
          input.value = '대기';
          input.disabled = true;
          input.title = 'CoA 발행 후 상태가 반영됩니다.';
        }
      });
    }
    const status = root.querySelector('[data-oqc-registration-field="inspectionStatus"]');
    if (status) {
      const result = root.querySelector('#stdOverallJudge')?.value || '대기';
      status.value = result === '대기' ? '검사중' : '검사완료';
      status.disabled = true;
      status.title = '측정값에 따른 자동 상태';
    }
    return states.get(root);
  }

  function showError(root, message) {
    let error = root.querySelector('.oqc-registration-save-error');
    if (!error) {
      error = document.createElement('div');
      error.className = 'oqc-registration-save-error';
      error.setAttribute('role', 'alert');
      error.style.cssText = 'margin:12px 0;padding:12px 16px;border:1px solid #efb8c4;border-radius:6px;background:#fff1f3;color:#a02040;font-size:13px';
      root.prepend(error);
    }
    error.textContent = message;
    error.hidden = false;
    tell(message);
  }

  async function save(root) {
    const state = prepare(root);
    if (state.busy || state.saved) return;
    if (!window.qmesOqcRules) {
      showError(root, '판정 기준을 불러오지 못했습니다. 화면을 다시 열어 주세요.');
      return;
    }
    const fields = Object.fromEntries([...root.querySelectorAll('[data-oqc-registration-field]')]
      .map(input => [input.dataset.oqcRegistrationField, input.value.trim()]));
    if (!fields.date || !fields.lot || !fields.inspector) {
      showError(root, '검사일자, 완제품 LOT, 검사자를 입력해 주세요.');
      return;
    }
    const measurements = {};
    root.querySelectorAll('.std-result tbody tr').forEach(row => {
      const name = window.qmesOqcRules.canonical(row.querySelector('.item')?.textContent.trim());
      measurements[name] = [...row.querySelectorAll('.std-measure')].map(input => input.value.trim());
    });
    const buttons = [...document.querySelectorAll('#mainWorkspace #modalSave,#mainWorkspace [data-am-save]')];
    const controls = [...root.querySelectorAll('input,select,textarea'), ...buttons].map(input => [input, input.disabled]);
    state.busy = true;
    controls.forEach(([input]) => { input.disabled = true; });
    const previousError = root.querySelector('.oqc-registration-save-error');
    if (previousError) previousError.hidden = true;
    try {
      const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(20000) : undefined;
      const response = await fetch('/api/qmes-sync/oqc/register', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ requestId: state.requestId, fields, measurements })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw Error(result.message || '출하검사 저장에 실패했습니다.');
      state.saved = true;
    } catch (error) {
      const message = error.name === 'TimeoutError' || error.name === 'AbortError'
        ? '연결이 지연되어 저장 결과를 확인하지 못했습니다. 다시 저장해 주세요.'
        : String(error.message || error);
      showError(root, '출하검사 저장 실패: ' + message);
    } finally {
      state.busy = false;
      controls.forEach(([input, wasDisabled]) => { input.disabled = wasDisabled; });
    }
    if (!state.saved) return;
    // A successful server write stays successful even if refreshing the list later fails.
    if (root.isConnected) {
      if (typeof workspacePreviousPage !== 'undefined') workspacePreviousPage = 'outgoing';
      if (typeof window.closeModal === 'function') window.closeModal();
      const section = document.getElementById('outgoing');
      if (section) {
        document.querySelectorAll('.module-page').forEach(page => page.classList.remove('active'));
        section.classList.add('active');
        try {
          if (typeof window.loadHistoricalInspectionRows === 'function') await window.loadHistoricalInspectionRows(section, 'outgoing');
        } catch (error) {
          tell('출하검사는 저장되었습니다. 목록을 다시 조회해 주세요.');
          return;
        }
      }
    }
    tell('출하검사 저장 완료');
  }

  const original = window.initStandardInspectionForm;
  if (typeof original === 'function') window.initStandardInspectionForm = function (type) {
    const result = original.apply(this, arguments);
    if (type === 'outgoing') document.querySelectorAll(scope).forEach(prepare);
    return result;
  };
  // Stop the legacy demo-save and its top-button forwarding before either closes the form.
  document.addEventListener('click', event => {
    const button = event.target.closest('#modalSave,[data-am-save]');
    const workspace = button?.closest('#mainWorkspace');
    const root = workspace?.querySelector(scope);
    if (!root) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void save(root);
  }, true);
  for (const name of ['input', 'change']) document.addEventListener(name, event => {
    const root = event.target.closest(scope);
    if (root) prepare(root);
  });
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; document.querySelectorAll(scope).forEach(prepare); });
  }).observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll(scope).forEach(prepare);
})();
