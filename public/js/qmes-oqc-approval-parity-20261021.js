/* Match the PQC two-row approval table, preserving OQC approval labels. */
(function () {
  'use strict';
  const original = window.standardInspectionForm;
  if (typeof original !== 'function') return;
  window.standardInspectionForm = function (type) {
    const html = original.apply(this, arguments);
    if (type !== 'outgoing') return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    const root = template.content.querySelector('.std-inspection[data-inspection-type="outgoing"]');
    const old = root?.querySelector('.std-approval-row');
    if (!old) return html;
    const people = [...old.querySelectorAll('.pqc-approval-person')].map(el => el.textContent.trim());
    const wrap = document.createElement('section');
    wrap.className = 'pqc-esign-wrap oqc-esign-parity';
    wrap.setAttribute('aria-label', '출하검사 전자결재');
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
    style.id = 'qmes-oqc-esign-parity-20261021';
    style.textContent = source.textContent.replaceAll('[data-am-screen="process"]', '[data-am-screen="outgoing"]');
    document.head.append(style);
  }
})();
(function () {
  'use strict';
  function install() {
    const original = window.qmesOpenOutgoingDetail;
    if (typeof original !== 'function') return;
    window.qmesOpenOutgoingDetail = function (row) {
      const result = original.apply(this, arguments);
      const pane = document.querySelector('.am-split[data-am-screen="outgoing"]');
      const measures = pane?.querySelector('.oqc-detail-measure-section');
      if (!measures || pane.querySelector('.oqc-esign-parity')) return result;
      const recordId = String(row?.dataset?.sourceId || '');
      const record = document.getElementById('outgoing')?._oqcRecords?.get(String(row?.dataset?.sourceKey || '') + '|' + recordId);
      const section = document.createElement('section');
      section.className = 'pqc-esign-wrap oqc-esign-parity';
      section.setAttribute('aria-label', '출하검사 전자결재');
      section.innerHTML = '<div class="pqc-esign-table"><div class="pqc-esign-side">전자결재</div><div class="pqc-esign-head">작성</div><div class="pqc-esign-head">검토</div><div class="pqc-esign-head">승인</div><div class="pqc-esign-person"></div><div class="pqc-esign-person"></div><div class="pqc-esign-person"></div></div><div class="pqc-esign-note">검사기준 및 측정값 확인 후 저장하십시오. <span>※ 관리본 · 전자기록</span><span>(주)나모케미칼 품질부</span></div>';
      const people = section.querySelectorAll('.pqc-esign-person');
      function person(index, name, date) {
        const b = document.createElement('b'); b.textContent = name;
        people[index].replaceChildren(b);
        if (date) { const small = document.createElement('small'); small.textContent = new Date(date).toLocaleString('ko-KR'); people[index].append(small); }
      }
      person(0, record?.inspector || '작성자');
      person(1, '검토대기'); person(2, '승인대기');
      measures.after(section);
      if (recordId) fetch('/api/qmes-quality/approvals/record?docType=OQC&recordId=' + encodeURIComponent(recordId), {credentials:'same-origin',cache:'no-store'})
        .then(response => { if (!response.ok) throw Error('결재 조회 실패'); return response.json(); })
        .then(json => {
          if (!section.isConnected || !json.success || !json.data) return;
          const a = json.data;
          person(0, a.writer_name || record?.inspector || '작성자');
          if (a.reviewed_at) person(1, a.reviewer_name || '검토완료', a.reviewed_at);
          if (a.status === 'APPROVED' && a.approved_at) person(2, a.approver_name || '승인완료', a.approved_at);
        }).catch(error => {
          if (section.isConnected) { person(1, '조회 확인 필요'); person(2, '조회 확인 필요'); }
          console.warn('[OQC approval]', error);
        });
      return result;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
