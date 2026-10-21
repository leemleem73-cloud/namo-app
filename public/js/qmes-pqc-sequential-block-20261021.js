/* PQC: stop later measurement rows immediately when an earlier item fails. */
(function () {
  'use strict';
  if (window.__qmesPqcSequentialBlock20261021) return;
  window.__qmesPqcSequentialBlock20261021 = true;
  const style = document.createElement('style');
  style.textContent = `
    .pqc-sequential-warning{border:2px solid #dc2626;border-radius:7px;background:#fff1f2;padding:16px 20px;margin:12px 0;color:#b91c1c;text-align:center}
    .pqc-sequential-warning strong{display:block;font-size:30px!important;line-height:1.3;font-weight:900!important;color:#dc2626!important}
    .pqc-sequential-warning span{display:block;margin-top:7px;font-size:14px;line-height:1.6;color:#991b1b}
    .am-split[data-am-screen="process"] .pqc-detail-measure-table tr.pqc-sequential-locked{background:#fff1f2!important}
    .am-split[data-am-screen="process"] .pqc-detail-measure-table tr.pqc-sequential-locked td[data-pqc-item-judge]{font-size:20px!important;line-height:1.35!important;font-weight:900!important;color:#dc2626!important;white-space:normal!important}
    .pqc-sequential-locked [data-pqc-measure]:disabled{background:#f1f2f4!important;color:#737c89!important;cursor:not-allowed!important;border-color:#e3b7bb!important}
    @media(max-width:700px){.pqc-sequential-warning strong{font-size:24px!important}}
  `;
  document.head.appendChild(style);
  function refresh() {
    document.querySelectorAll('.am-split[data-am-screen="process"]').forEach(pane => {
      const cells = [...pane.querySelectorAll('[data-pqc-item-judge]')];
      if (!cells.length) return;
      const measurements = {};
      pane.querySelectorAll('[data-pqc-measure]').forEach(input => {
        (measurements[input.dataset.pqcMeasure] ||= [])[Number(input.dataset.measureIndex)] = input.value;
      });
      const rules = window.qmesOqcRules;
      const result = rules ? Object.fromEntries(cells.map(cell => [cell.dataset.pqcItemJudge,
        rules.evaluateItem(cell.dataset.pqcItemJudge, measurements[cell.dataset.pqcItemJudge])]))
        : typeof window.evaluatePqcMeasurements === 'function' ? window.evaluatePqcMeasurements(measurements).items : null;
      if (!result) return;
      const firstFail = cells.findIndex(cell => result[cell.dataset.pqcItemJudge] === '불합격');
      cells.forEach((cell, index) => {
        const row = cell.closest('tr');
        if (!row) return;
        const locked = firstFail >= 0 && index > firstFail;
        row.classList.toggle('pqc-sequential-locked', locked);
        row.querySelectorAll('[data-pqc-measure]').forEach(input => {
          if (locked && !input.dataset.pqcSequentialLock) {
            input.dataset.pqcSequentialLock = input.disabled ? 'previously-disabled' : 'owned';
            input.disabled = true;
            input.setAttribute('aria-disabled', 'true');
          } else if (!locked && input.dataset.pqcSequentialLock) {
            if (input.dataset.pqcSequentialLock === 'owned') { input.disabled = false; input.removeAttribute('aria-disabled'); }
            delete input.dataset.pqcSequentialLock;
          }
        });
        const label = locked ? '후속 공정 차단' : result[cell.dataset.pqcItemJudge] || '대기';
        if (cell.textContent !== label) cell.textContent = label;
      });
      let warning = pane.querySelector('.pqc-sequential-warning');
      if (firstFail >= 0) {
        if (!warning) {
          warning = document.createElement('div');
          warning.className = 'pqc-sequential-warning'; warning.setAttribute('role', 'alert');
          warning.innerHTML = '<strong>후속 공정 차단</strong><span></span>';
          const table = cells[0].closest('table'); table.parentNode.insertBefore(warning, table);
        }
        const message = cells[firstFail].dataset.pqcItemJudge + ' 불합격 — 이후 검사항목은 입력할 수 없습니다. 불합격 결과를 저장하고 원인 조치 후 재검사하세요. 저장된 LOT 보류는 별도 해제 승인이 필요합니다.';
        if (warning.lastElementChild.textContent !== message) warning.lastElementChild.textContent = message;
      } else if (warning) warning.remove();
    });
  }
  document.addEventListener('input', event => { if (event.target.matches('[data-pqc-measure]')) refresh(); });
  document.addEventListener('change', event => { if (event.target.matches('[data-pqc-measure]')) refresh(); });
  let pending = false;
  new MutationObserver(() => {
    if (pending) return; pending = true;
    queueMicrotask(() => { pending = false; refresh(); });
  }).observe(document.body, { childList: true, subtree: true });
  refresh();
})();
