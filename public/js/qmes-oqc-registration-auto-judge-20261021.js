/* OQC registration uses the same automatic measurement rules as OQC detail/CoA. */
(function () {
  'use strict';
  if (window.__qmesOqcRegistrationAutoJudge20261021) return;
  window.__qmesOqcRegistrationAutoJudge20261021 = true;
  const scope = '.std-inspection[data-inspection-type="outgoing"]';
  const style = document.createElement('style');
  style.textContent = `
    ${scope} .std-row-judge{display:none!important}
    html body #mainWorkspace ${scope} .oqc-auto-item-judge{font-size:13px!important;font-weight:700!important;color:#66758c!important}
    html body #mainWorkspace ${scope} [data-oqc-auto-result="합격"]{color:#15803d!important;font-weight:700!important}
    html body #mainWorkspace ${scope} [data-oqc-auto-result="불합격"]{color:#dc2626!important;font-weight:700!important}
    html body #mainWorkspace ${scope} [data-oqc-auto-result="대기"]{color:#66758c!important}
    ${scope} .oqc-sequential-locked .oqc-auto-item-judge{display:none!important}
    ${scope} #stdOverallJudge:disabled{opacity:1!important;-webkit-text-fill-color:currentColor;background:#fff!important;cursor:default}
  `;
  document.head.appendChild(style);
  function refresh() {
    const rules = window.qmesOqcRules;
    if (!rules) return;
    document.querySelectorAll(scope).forEach(root => {
      const rows = [...root.querySelectorAll('.std-result tbody tr')].filter(row => row.querySelector('.std-measure'));
      if (!rows.length) return;
      const measurements = {};
      rows.forEach(row => {
        const name = rules.canonical(row.querySelector('.item')?.textContent.trim());
        const controls = [...row.querySelectorAll('.std-measure')];
        controls.forEach(input => {
          if ((name === '외관' || name === '전해액 안정성') && input.tagName === 'SELECT' && !input.dataset.oqcAutoOptions) {
            const good = name === '외관' ? '이상없음' : '미탈리';
            const bad = name === '외관' ? '이상있음' : '탈리';
            const old = input.value;
            const value = old === '적합' ? good : old === '부적합' ? bad : old;
            input.replaceChildren();
            for (const v of [...new Set(['', good, bad, ...(value ? [value] : [])])]) {
              const option = document.createElement('option'); option.value = v; option.textContent = v || '선택'; input.appendChild(option);
            }
            input.value = value; input.dataset.oqcAutoOptions = '1';
          }
          if (name === '절연저항' && input.type === 'number') {
            input.type = 'text'; input.removeAttribute('inputmode'); input.placeholder = '측정값 또는 Overflow';
          }
        });
        measurements[name] = controls.map(input => input.value);
      });
      const result = rules.evaluateMeasurements(measurements);
      rows.forEach(row => {
        const name = rules.canonical(row.querySelector('.item')?.textContent.trim());
        const judge = row.querySelector('.std-row-judge');
        if (!judge) return;
        const value = result.items[name] || '대기';
        // Retain the original selector/value for existing save handlers; user judgement is read-only.
        if (judge.value !== value) judge.value = value;
        judge.disabled = true; judge.setAttribute('aria-hidden', 'true'); judge.tabIndex = -1;
        let text = row.querySelector('.oqc-auto-item-judge');
        if (!text) { text = document.createElement('span'); text.className = 'oqc-auto-item-judge'; text.setAttribute('aria-live', 'polite'); judge.parentElement.appendChild(text); }
        if (text.textContent !== value) text.textContent = value;
        if (text.dataset.oqcAutoResult !== value) text.dataset.oqcAutoResult = value;
      });
      const overall = root.querySelector('#stdOverallJudge');
      if (overall) {
        if (overall.value !== result.overall) overall.value = result.overall;
        overall.disabled = true; overall.title = '측정값에 따른 자동 판정';
        if (overall.dataset.oqcAutoResult !== result.overall) overall.dataset.oqcAutoResult = result.overall;
      }
    });
  }
  const original = window.initStandardInspectionForm;
  if (typeof original === 'function') window.initStandardInspectionForm = function (type) {
    const result = original.apply(this, arguments); if (type === 'outgoing') refresh(); return result;
  };
  // Calculate before existing change/save listeners read the retained controls.
  for (const event of ['input', 'change', 'click']) document.addEventListener(event, e => {
    if (e.target.closest(scope) || e.target.closest('#modalSave,[data-am-save]')) refresh();
  }, true);
  let pending = false;
  new MutationObserver(() => { if (pending) return; pending = true; queueMicrotask(() => { pending = false; refresh(); }); })
    .observe(document.body, { childList: true, subtree: true });
  refresh();
})();
