/* IQC registration layout parity with PQC. Keep the original field IDs and save wiring. */
(function () {
  'use strict';
  const original = window.standardInspectionForm;
  if (typeof original !== 'function') return;
  window.standardInspectionForm = function (type) {
    const markup = original.apply(this, arguments);
    if (type !== 'incoming') return markup;
    const template = document.createElement('template');
    template.innerHTML = markup;
    const root = template.content.querySelector('.std-inspection');
    root.classList.add('iqc-pqc-layout');
    root.querySelector('.std-inspection-head')?.remove();
    root.querySelector('.std-premium-band')?.remove();
    const titles = [...root.querySelectorAll('.std-section-title')];
    titles.forEach(title => title.remove());
    const info = root.querySelector('.std-info');
    const fields = [...info.children];
    info.classList.add('am-inline-edit-grid');
    for (let index = 0; index < fields.length; index += 2) {
      const cell = document.createElement('div');
      cell.className = 'am-inline-cell';
      const label = document.createElement('label');
      label.textContent = fields[index].textContent;
      const input = fields[index + 1].querySelector('input,select');
      if (input?.id) label.htmlFor = input.id;
      cell.append(label, fields[index + 1]);
      fields[index].remove();
      info.append(cell);
    }
    const summary = root.querySelector('.std-summary-grid');
    [...summary.querySelectorAll('.std-summary-card')].slice(0, 2).forEach((card, index) => {
      const cell = document.createElement('div');
      cell.className = 'am-inline-cell';
      const label = document.createElement('label');
      label.textContent = index === 0 ? '검사합부' : '검사상태';
      const value = card.querySelector('.value');
      value.className = 'v';
      cell.append(label, value);
      info.append(cell);
    });
    summary.remove();
    const remarks = root.querySelector('.std-premium-remarks');
    const remarkCell = document.createElement('div');
    remarkCell.className = 'am-inline-cell full';
    const label = document.createElement('label');
    label.textContent = '비고';
    const textarea = remarks.querySelector('textarea');
    textarea.removeAttribute('style');
    textarea.placeholder = '비고 입력';
    remarkCell.append(label, textarea);
    info.append(remarkCell);
    remarks.remove();
    const table = root.querySelector('.std-result-wrap');
    const section = document.createElement('section');
    section.className = 'am-section iqc-pqc-measure-section';
    section.innerHTML = '<div class="am-section-head"><b>검사항목</b><span>항목별 측정값 입력</span></div>';
    table.before(section);
    section.append(table);
    return root.outerHTML;
  };
  const style = document.createElement('style');
  style.id = 'iqc-pqc-layout-20261021';
  style.textContent = `
  .am-split[data-am-screen="incoming"] .iqc-pqc-layout{border:0!important;background:#fff!important}
  .iqc-pqc-layout .std-info.am-inline-edit-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;border:1px solid #e0e5eb!important;border-bottom:0!important}
  .iqc-pqc-layout .std-info .am-inline-cell{min-width:0;grid-template-columns:128px minmax(0,1fr)!important}
  .iqc-pqc-layout .std-info .am-inline-cell>.v{padding:0!important;min-height:0!important;border:0!important;min-width:0!important}
  .iqc-pqc-layout .std-info input,.iqc-pqc-layout .std-info select{height:29px!important;min-height:29px!important;border-radius:2px!important;background:#fff!important;font-size:11px!important}
  .iqc-pqc-layout .std-info textarea{height:68px!important;resize:vertical!important}
  .iqc-pqc-layout .iqc-pqc-measure-section{margin-top:16px!important}
  .iqc-pqc-layout .std-result{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;border:1px solid #dce3ec!important;font-size:13px!important}
  .iqc-pqc-layout .std-result th,.iqc-pqc-layout .std-result td{height:54px!important;box-sizing:border-box!important;border:1px solid #dce3ec!important;padding:10px 8px!important;text-align:center!important;vertical-align:middle!important;line-height:1.45!important;font-size:13px!important;color:#35435b!important;background:#fff!important}
  .iqc-pqc-layout .std-result thead th{height:46px!important;background:#f4f6fa!important;font-weight:700!important}
  .iqc-pqc-layout .std-result input,.iqc-pqc-layout .std-result select{width:100%!important;min-width:0!important;height:38px!important;border:1px solid #dce3ed!important;border-radius:6px!important;background:#fff!important;font-size:13px!important;text-align:center!important}
  .iqc-pqc-layout .std-result col.no{width:5%}.iqc-pqc-layout .std-result col.item{width:12%}.iqc-pqc-layout .std-result col.spec{width:20%}.iqc-pqc-layout .std-result col.method{width:13%}.iqc-pqc-layout .std-result col.m{width:13.333%}.iqc-pqc-layout .std-result col.judge{width:10%}
  .iqc-pqc-layout .std-approval-row{margin-top:12px!important;display:grid!important;grid-template-columns:138px repeat(3,minmax(0,1fr))!important;border:1px solid #cbd6e2!important}
  .iqc-pqc-layout .approval-label{background:#f2f5f9!important;color:#2c3c50!important;font-size:12px!important}
  .iqc-pqc-layout .std-approval-item .pqc-approval-heading{background:#f9fbfd!important;font-size:12px!important}
  .iqc-pqc-layout .std-approval-item .pqc-approval-person{font-size:12px!important}
  .iqc-pqc-layout .std-premium-footer{border:1px solid #cbd6e2!important;border-top:0!important;background:#fff!important;color:#65768a!important;padding:9px 12px!important;font-size:11px!important}
  @media(max-width:1100px){.iqc-pqc-layout .std-info.am-inline-edit-grid{grid-template-columns:1fr!important}.iqc-pqc-layout .std-result-wrap{overflow-x:auto!important}}
  @media(max-width:760px){.iqc-pqc-layout .std-info .am-inline-cell{grid-template-columns:104px minmax(0,1fr)!important}.iqc-pqc-layout .std-approval-row{grid-template-columns:90px repeat(3,minmax(0,1fr))!important}}
  `;
  document.head.append(style);
})();
