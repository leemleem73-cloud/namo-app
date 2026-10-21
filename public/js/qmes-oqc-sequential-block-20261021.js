/* OQC sequential entry interlock; preserve saved measurements and original controls. */
(function () {
  'use strict';
  if (window.__qmesOqcSequentialBlock20261021) return;
  window.__qmesOqcSequentialBlock20261021 = true;
  const style = document.createElement('style');
  style.textContent = `
    .oqc-sequential-warning{border:2px solid #dc2626;border-radius:7px;background:#fff1f2;padding:16px 20px;margin:12px 0;color:#b91c1c;text-align:center}
    .oqc-sequential-warning strong{display:block;font-size:30px!important;line-height:1.3;font-weight:900!important;color:#dc2626!important}
    .oqc-sequential-warning span{display:block;margin-top:7px;font-size:14px;line-height:1.6;color:#991b1b}
    html body #mainWorkspace .am-split[data-am-screen="outgoing"] table tr.oqc-sequential-locked>td,
    .std-inspection[data-inspection-type="outgoing"] tr.oqc-sequential-locked>td{background:#fff1f2!important}
    html body #mainWorkspace .am-split[data-am-screen="outgoing"] table tr.oqc-sequential-locked [data-oqc-item-judge],
    .std-inspection[data-inspection-type="outgoing"] .oqc-sequential-label{font-size:20px!important;line-height:1.35!important;font-weight:900!important;color:#dc2626!important;white-space:normal!important}
    html body #mainWorkspace .am-split[data-am-screen="outgoing"] table tr.oqc-sequential-locked :is(input,select):disabled,
    .std-inspection[data-inspection-type="outgoing"] tr.oqc-sequential-locked :is(input,select):disabled{background:#f1f2f4!important;color:#737c89!important;cursor:not-allowed!important;border-color:#e3b7bb!important}
    .oqc-sequential-locked .std-row-judge{display:none!important}
    @media(max-width:700px){.oqc-sequential-warning strong{font-size:24px!important}}
  `;
  document.head.appendChild(style);
  function refresh() {
    const rules = window.qmesOqcRules;
    if (!rules) return;
    document.querySelectorAll('.am-split[data-am-screen="outgoing"] .oqc-detail-items, .std-inspection[data-inspection-type="outgoing"] .std-result').forEach(table => {
      const rows = [...table.querySelectorAll('tbody tr')].filter(row => row.querySelector('[data-oqc-value],.std-measure'));
      if (!rows.length) return; // Printed certificates are read-only and remain untouched.
      const names = rows.map(row => rules.canonical(row.querySelector('th,.item')?.textContent.trim()));
      const results = rows.map((row, index) => {
        const values = [...row.querySelectorAll('[data-oqc-value],.std-measure')].map(input => {
          // Registration's qualitative controls use 적합 / 부적합.
          if (input.classList.contains('std-measure') && input.value === '적합') {
            if (names[index] === '외관') return '이상없음';
            if (names[index] === '전해액 안정성') return '미탈리';
          }
          return input.value;
        });
        return row.querySelector('.std-row-judge')?.value === '불합격' ? '불합격' : rules.evaluateItem(names[index], values);
      });
      const firstFail = results.indexOf('불합격');
      rows.forEach((row, index) => {
        const locked = firstFail >= 0 && index > firstFail;
        row.classList.toggle('oqc-sequential-locked', locked);
        row.querySelectorAll('[data-oqc-value],.std-measure,.std-row-judge').forEach(input => {
          if (locked && !input.dataset.oqcSequentialLock) {
            input.dataset.oqcSequentialLock = input.disabled ? 'previously-disabled' : 'owned';
            input.disabled = true; input.setAttribute('aria-disabled', 'true');
          } else if (!locked && input.dataset.oqcSequentialLock) {
            if (input.dataset.oqcSequentialLock === 'owned') { input.disabled = false; input.removeAttribute('aria-disabled'); }
            delete input.dataset.oqcSequentialLock;
          }
        });
        const judge = row.querySelector('[data-oqc-item-judge]');
        if (judge) {
          const label = locked ? '후속 공정 차단' : results[index];
          if (judge.textContent !== label) judge.textContent = label;
        } else {
          let label = row.querySelector('.oqc-sequential-label');
          if (locked && !label) {
            label = document.createElement('strong'); label.className = 'oqc-sequential-label';
            label.textContent = '후속 공정 차단'; row.lastElementChild.appendChild(label);
          } else if (!locked && label) label.remove();
        }
      });
      let warning = table.parentElement.querySelector('.oqc-sequential-warning');
      if (firstFail >= 0) {
        if (!warning) {
          warning = document.createElement('div'); warning.className = 'oqc-sequential-warning'; warning.setAttribute('role', 'alert');
          warning.innerHTML = '<strong>후속 공정 차단</strong><span></span>'; table.parentNode.insertBefore(warning, table);
        }
        const message = names[firstFail] + ' 불합격 — 이후 검사항목은 입력할 수 없습니다. 불합격 결과를 저장하고 원인 조치 후 재검사하세요. 저장된 LOT 보류는 별도 해제 승인이 필요합니다.';
        if (warning.lastElementChild.textContent !== message) warning.lastElementChild.textContent = message;
      } else if (warning) warning.remove();
    });
  }
  const matches = event => event.target.matches('[data-oqc-value],.std-measure,.std-row-judge');
  document.addEventListener('input', event => { if (matches(event)) refresh(); });
  document.addEventListener('change', event => { if (matches(event)) refresh(); });
  let pending = false;
  new MutationObserver(() => { if (pending) return; pending = true; queueMicrotask(() => { pending = false; refresh(); }); })
    .observe(document.body, { childList: true, subtree: true });
  refresh();
})();
