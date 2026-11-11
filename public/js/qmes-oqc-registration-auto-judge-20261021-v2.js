/* OQC registration: share the measured-result rules used by detail, CoA and the server. */
(function () {
  'use strict';
  if (window.__qmesOqcRegistrationAutoJudge20261021V2) return;
  window.__qmesOqcRegistrationAutoJudge20261021V2 = true;
  window.__qmesOqcRegistrationAutoJudge20261021 = true;
  const scope = '.std-inspection.oqc-pqc-layout[data-inspection-type="outgoing"]';
  const style = document.createElement('style');
  style.id = 'qmes-oqc-registration-auto-judge-20261021';
  style.textContent = `
    ${scope} .std-row-judge{display:none!important}
    ${scope} .oqc-auto-item-judge{font-size:13px!important;font-weight:700!important;color:#66758c!important}
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
      const revision=rules.standardRevisionForDate(root.querySelector('[data-oqc-registration-field="date"]')?.value,1);
      const measurements = {};
      rows.forEach(row => {
        const name = rules.canonical(row.querySelector('.item')?.textContent.trim());
        const controls = [...row.querySelectorAll('.std-measure')];
        if(name==='전해액 안정성'){
          const spec=row.querySelector('.spec'),method=row.querySelector('.method');
          const specText=revision===0?'미탈리':'팽창률 < 150%';
          const methodText=revision===0?'육안':'마이크로미터';
          if(spec&&spec.textContent!==specText)spec.textContent=specText;
          if(method&&method.textContent!==methodText)method.textContent=methodText;
        }
        controls.forEach((input, index) => {
          if(name==='전해액 안정성'&&((revision===0)!==(input.tagName==='SELECT'))){
            const control=document.createElement(revision===0?'select':'input');
            control.className=input.className;
            control.disabled=input.disabled;
            if(revision===0){
              for(const value of new Set(['','미탈리','탈리',input.value]))control.add(new Option(value||'선택',value));
            }else{
              control.type='text';
              control.inputMode='decimal';
              control.placeholder='팽창률 (%)';
            }
            control.value=input.value;
            input.replaceWith(control);
            input=controls[index]=control;
          }
          input.setAttribute('aria-label', name + ' ' + (index + 1) + '차 측정값');
          if (name === '외관' && input.tagName === 'SELECT' && !input.dataset.oqcAutoOptions) {
            const good = '이상없음';
            const bad = '이상있음';
            const old = input.value;
            const value = old === '적합' ? good : old === '부적합' ? bad : old;
            input.replaceChildren();
            for (const v of [...new Set(['', good, bad, ...(value ? [value] : [])])]) {
              const option = document.createElement('option');
              option.value = v;
              option.textContent = v || '선택';
              input.appendChild(option);
            }
            input.value = value;
            input.dataset.oqcAutoOptions = '1';
          }
          if (name === '절연저항' && input.tagName !== 'SELECT') {
            const select=document.createElement('select');
            for(const attr of input.attributes)if(!['type','inputmode','placeholder'].includes(attr.name))select.setAttribute(attr.name,attr.value);
            const value=input.value;select.disabled=input.disabled;
            for(const v of [...new Set(['','Overflow',...(value?[value]:[])])]){const option=document.createElement('option');option.value=v;option.textContent=v||'선택';select.appendChild(option);}
            select.value=value;input.replaceWith(select);controls[index]=select;
          }
        });
        measurements[name] = controls.map(input => input.value);
      });
      const result = rules.evaluateMeasurements(measurements,revision);
      rows.forEach(row => {
        const name = rules.canonical(row.querySelector('.item')?.textContent.trim());
        const judge = row.querySelector('.std-row-judge');
        if (!judge) return;
        const value = result.items[name] || '대기';
        // Keep the existing value for save/interlock readers; the visible result is automatic.
        if (judge.value !== value) judge.value = value;
        judge.disabled = true;
        judge.setAttribute('aria-hidden', 'true');
        judge.tabIndex = -1;
        let label = row.querySelector('.oqc-auto-item-judge');
        if (!label) {
          label = document.createElement('span');
          label.className = 'oqc-auto-item-judge';
          label.setAttribute('aria-live', 'polite');
          judge.parentElement.appendChild(label);
        }
        if (label.textContent !== value) label.textContent = value;
        if (label.dataset.oqcAutoResult !== value) label.dataset.oqcAutoResult = value;
      });
      const overall = root.querySelector('#stdOverallJudge');
      if (overall) {
        if (overall.value !== result.overall) overall.value = result.overall;
        overall.disabled = true;
        overall.title = '측정값에 따른 자동 판정';
        if (overall.dataset.oqcAutoResult !== result.overall) overall.dataset.oqcAutoResult = result.overall;
      }
    });
  }

  const original = window.initStandardInspectionForm;
  if (typeof original === 'function') window.initStandardInspectionForm = function (type) {
    const result = original.apply(this, arguments);
    if (type === 'outgoing') refresh();
    return result;
  };
  // Recalculate before the existing change/save and sequential-lock listeners read the values.
  let frame=0;function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;refresh();});}
  for (const event of ['input', 'change']) document.addEventListener(event, e => {
    if (e.target.closest(scope) || e.target.closest('#modalSave,[data-am-save]')) schedule();
  }, true);
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; refresh(); });
  }).observe(document.body, { childList: true, subtree: true });
  refresh();
})();
