/* IQC sequential entry interlock. Keep existing manual judgments and saved values. */
(function () {
  'use strict';
  if (window.__qmesIqcSequentialBlock20261021) return;
  window.__qmesIqcSequentialBlock20261021 = true;

  const formSelector = '.std-inspection[data-inspection-type="incoming"]';
  const controlSelector = '.std-measure,.std-row-judge';
  const lockedControls = new WeakMap();
  const style = document.createElement('style');
  style.id = 'qmes-iqc-sequential-block-20261021';
  style.textContent = `
    @media screen {
      ${formSelector} .iqc-sequential-warning{border:2px solid #dc2626;border-radius:7px;background:#fff1f2;padding:16px 20px;margin:12px 0;color:#b91c1c;text-align:center}
      ${formSelector} .iqc-sequential-warning strong{display:block;font-size:30px!important;line-height:1.3;font-weight:900!important;color:#dc2626!important}
      ${formSelector} .iqc-sequential-warning span{display:block;margin-top:7px;font-size:14px;line-height:1.6;color:#991b1b}
      html body #mainWorkspace ${formSelector} table.std-result tr.iqc-sequential-locked>:is(th,td),
      ${formSelector} table.std-result tr.iqc-sequential-locked>:is(th,td){background:#fff1f2!important}
      html body #mainWorkspace ${formSelector} table.std-result tr.iqc-sequential-locked :is(input,select):disabled,
      ${formSelector} table.std-result tr.iqc-sequential-locked :is(input,select):disabled{background:#f1f2f4!important;color:#737c89!important;border-color:#e3b7bb!important;cursor:not-allowed!important}
      ${formSelector} table.std-result tr.iqc-sequential-locked input::placeholder{color:#737c89!important;opacity:1}
      ${formSelector} .iqc-sequential-locked .std-row-judge{display:none!important}
      html body #mainWorkspace ${formSelector} table.std-result .iqc-sequential-label,
      ${formSelector} table.std-result .iqc-sequential-label{display:inline-block!important;font-size:20px!important;line-height:1.35!important;font-weight:900!important;color:#dc2626!important;white-space:nowrap!important;word-break:keep-all!important}
      ${formSelector} table.std-result.iqc-sequential-active col.judge{width:160px!important}
      ${formSelector} table.std-result.iqc-sequential-active col.m{width:auto!important}
    }
    @media screen and (max-width:700px){${formSelector} .iqc-sequential-warning strong{font-size:24px!important}}
    @media print{${formSelector} .iqc-sequential-warning,${formSelector} .iqc-sequential-label{display:none!important}}
  `;
  document.head.appendChild(style);

  const failStyle=document.createElement('style');
  failStyle.id='iqc-auto-fail-red-20261023';
  failStyle.textContent=`
    .std-inspection[data-inspection-type="incoming"] #stdOverallJudge[data-iqc-fail="1"],
    .std-inspection[data-inspection-type="incoming"] .std-row-judge[data-iqc-fail="1"]{
      color:#dc2626!important;
      font-weight:900!important;
    }
  `;
  document.head.appendChild(failStyle);

  function setLocked(input, locked) {
    if (locked) {
      if (!lockedControls.has(input)) {
        lockedControls.set(input, { disabled: input.disabled, aria: input.getAttribute('aria-disabled') });
      }
      input.disabled = true;
      if (input.getAttribute('aria-disabled') !== 'true') input.setAttribute('aria-disabled', 'true');
    } else if (lockedControls.has(input)) {
      const previous = lockedControls.get(input);
      input.disabled = previous.disabled;
      if (previous.aria === null) input.removeAttribute('aria-disabled');
      else input.setAttribute('aria-disabled', previous.aria);
      lockedControls.delete(input);
    }
  }

  function refresh() {
    document.querySelectorAll(formSelector + ' .std-result').forEach(table => {
      const rows = [...table.querySelectorAll('tbody tr')].filter(row =>
        row.querySelector('.std-measure') && row.querySelector('.std-row-judge'));
      if (!rows.length) return; // Issued/read-only certificates are not entry forms.

      // IQC has material-specific/manual judgments. A qualitative "부적합" or
      // COA "미확인" must block immediately, just like PQC stops on the first failed item.
      const judgments = rows.map(row => row.querySelector('.std-row-judge').value);
      const rowFailed = rows.map((row,index) => {
        const measureValues=[...row.querySelectorAll('.std-measure')].map(input=>String(input.value||'').trim());
        return judgments[index] === '불합격' || measureValues.includes('부적합') || measureValues.includes('미확인');
      });
      const firstFail = rowFailed.findIndex(Boolean);
      table.classList.toggle('iqc-sequential-active', firstFail >= 0);
      rows.forEach((row,index)=>{
        const judge=row.querySelector('.std-row-judge');
        if(judge) judge.dataset.iqcFail=(judgments[index]==='불합격' || rowFailed[index])?'1':'0';
      });
      rows.forEach((row, index) => {
        const locked = firstFail >= 0 && index > firstFail;
        row.classList.toggle('iqc-sequential-locked', locked);
        row.querySelectorAll(controlSelector).forEach(input => setLocked(input, locked));
        let label = row.querySelector('.iqc-sequential-label');
        if (locked && !label) {
          label = document.createElement('strong');
          label.className = 'iqc-sequential-label';
          label.textContent = '후속 공정 차단';
          row.querySelector('.std-row-judge').parentElement.appendChild(label);
        } else if (!locked && label) label.remove();
      });

      const root = table.closest(formSelector);
      const overall = root.querySelector('#stdOverallJudge');
      if (overall) {
        const value = firstFail >= 0 ? '불합격' : judgments.every(value => value === '합격') ? '합격' : '대기';
        if (overall.value !== value) overall.value = value;
        overall.dataset.iqcFail = value === '불합격' ? '1' : '0';
      }
      let warning = table.parentElement.querySelector('.iqc-sequential-warning');
      if (firstFail >= 0) {
        if (!warning) {
          warning = document.createElement('div');
          warning.className = 'iqc-sequential-warning';
          warning.setAttribute('role', 'alert');
          const heading = document.createElement('strong');
          heading.textContent = '후속 공정 차단';
          warning.append(heading, document.createElement('span'));
          table.before(warning);
        }
        const name = rows[firstFail].querySelector('.item')?.textContent.trim() || '검사항목';
        const message = name + ' 불합격 — 이후 검사항목은 입력할 수 없습니다. 불합격 결과를 저장하고 원인 조치 후 재검사하세요. 저장된 LOT 보류는 별도 해제 승인이 필요합니다.';
        if (warning.lastElementChild.textContent !== message) warning.lastElementChild.textContent = message;
      } else if (warning) warning.remove();
    });
  }

  for (const type of ['input', 'change']) document.addEventListener(type, event => {
    if (event.target.closest?.(formSelector)) refresh();
  });
  // Refresh before the existing save handler gathers the original controls.
  document.addEventListener('click', event => {
    if (event.target.closest?.('#modalSave,[data-am-save]') && document.querySelector(formSelector)) refresh();
  }, true);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; refresh(); });
  }).observe(document.body, { childList: true, subtree: true });
  refresh();
})();
