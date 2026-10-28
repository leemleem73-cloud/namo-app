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
    // Keep each date input with its label and existing save binding.
    const dateCells = [...info.querySelectorAll('.am-inline-cell')];
    const receiptDate = dateCells.find(cell => cell.querySelector('label')?.textContent.trim() === '입고일자');
    const inspectionDate = dateCells.find(cell => cell.querySelector('label')?.textContent.trim() === '검사일자');
    if (receiptDate && inspectionDate) info.prepend(receiptDate, inspectionDate);
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

/* Align IQC report blocks and give each shared edge exactly one stroke. */
(function(){
 const style=document.createElement('style');style.id='iqc-report-alignment-single-borders-20261028';
 const pane='html body #mainWorkspace .am-split[data-am-screen="incoming"]:has(.iqc-pqc-layout)';
 const base=pane+' .iqc-pqc-layout';
 style.textContent=
 pane+' .am-detail-pane>.am-section>.am-section-body{padding:8px 0 0!important;box-sizing:border-box!important;min-width:0!important}'+
 base+'{width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important}'+
 base+'>:is(.std-info,.iqc-pqc-measure-section,.iqc-esign-parity){width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}'+
 base+' .std-info.am-inline-edit-grid{border:1px solid #d7e0e9!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell{border:0!important;border-right:1px solid #d7e0e9!important;border-bottom:1px solid #d7e0e9!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell:nth-child(2n),'+base+' .std-info.am-inline-edit-grid>.am-inline-cell.full{border-right:0!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell:last-child{border-bottom:0!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell>label{border-right:1px solid #d7e0e9!important}'+
 base+' .iqc-pqc-measure-section{border:0!important;border-top:1px solid #65717e!important;margin-top:16px!important;padding:0!important;box-shadow:none!important}'+
 base+' .iqc-pqc-measure-section>.am-section-head{border-bottom:1px solid #d7e0e9!important;box-sizing:border-box!important}'+
 base+' .iqc-pqc-measure-section>.std-result-wrap{border:0!important;outline:0!important;box-shadow:none!important;margin:0!important;padding:8px 0 0!important;width:100%!important;box-sizing:border-box!important}'+
 base+' table.std-result{width:100%!important;min-width:0!important;box-sizing:border-box!important;border:1px solid #d7e0e9!important;border-collapse:separate!important;border-spacing:0!important;margin:0!important}'+
 base+' table.std-result :is(thead,tbody) tr>:is(th,td){border:0!important;border-right:1px solid #d7e0e9!important;border-bottom:1px solid #d7e0e9!important}'+
 base+' table.std-result tr>:last-child{border-right:0!important}'+
 base+' table.std-result tbody tr:last-child>*{border-bottom:0!important}'+
 base+' .iqc-esign-parity{border:1px solid #d7e0e9!important;outline:0!important;box-shadow:none!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table{border:0!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table>div{border:0!important;border-right:1px solid #d7e0e9!important;box-sizing:border-box!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table>.pqc-esign-head{border-bottom:1px solid #d7e0e9!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table>div:nth-child(4),'+base+' .iqc-esign-parity>.pqc-esign-table>div:last-child{border-right:0!important}'+
 base+' .iqc-esign-parity>.pqc-esign-note{border:0!important;border-top:1px solid #d7e0e9!important}';
 document.head.append(style);
})();
