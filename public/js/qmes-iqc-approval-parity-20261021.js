/* Match the PQC two-row approval table, preserving IQC approval labels. */
(function () {
  'use strict';
  const original = window.standardInspectionForm;
  if (typeof original !== 'function') return;
  window.standardInspectionForm = function (type) {
    const html = original.apply(this, arguments);
    if (type !== 'incoming') return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    const root = template.content.querySelector('.iqc-pqc-layout');
    const old = root?.querySelector('.std-approval-row');
    if (!old) return html;
    const people = [...old.querySelectorAll('.pqc-approval-person')].map(el => el.textContent.trim());
    const wrap = document.createElement('section');
    wrap.className = 'pqc-esign-wrap iqc-esign-parity';
    wrap.setAttribute('aria-label', '수입검사 전자결재');
    const table = document.createElement('div');
    table.className = 'pqc-esign-table';
    const side = document.createElement('div');
    side.className = 'pqc-esign-side';
    side.textContent = '전자결재';
    table.append(side);
    ['작성', '검토', '승인'].forEach(text => {
      const head = document.createElement('div');
      head.className = 'pqc-esign-head';
      head.textContent = text;
      table.append(head);
    });
    people.forEach(text => {
      const person = document.createElement('div');
      person.className = 'pqc-esign-person';
      const name = document.createElement('b');
      name.textContent = text;
      person.append(name);
      table.append(person);
    });
    const note = document.createElement('div');
    note.className = 'pqc-esign-note';
    note.innerHTML = '검사기준 및 측정값 확인 후 저장하십시오. <span>※ 관리본 · 전자기록</span><span>(주)나모케미칼 품질부</span>';
    wrap.append(table, note);
    old.replaceWith(wrap);
    root.querySelector('.std-premium-footer')?.remove();
    return root.outerHTML;
  };
  // Reuse the actual PQC stylesheet so dimensions and future style changes stay aligned.
  const source = document.getElementById('qmes-pqc-esign-style-20261021');
  if (source) {
    const style = document.createElement('style');
    style.id = 'qmes-iqc-esign-parity-20261021';
    style.textContent = source.textContent.replaceAll('[data-am-screen="process"]', '[data-am-screen="incoming"]');
    document.head.append(style);
  }
})();
