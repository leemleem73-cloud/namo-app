/* OQC uses the same completed-stage rules as the PQC electronic signature grid. */
(function () {
  'use strict';
  const form = window.standardInspectionForm;
  window.standardInspectionForm = function (type) {
    const html = form.apply(this, arguments);
    if (type !== 'outgoing') return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    const people = template.content.querySelectorAll('.oqc-esign-parity .pqc-esign-person');
    [1, 2].forEach(index => {
      if (!people[index]) return;
      const label = document.createElement('b');
      label.textContent = index === 1 ? '검토대기' : '승인대기';
      people[index].replaceChildren(label);
    });
    return template.content.querySelector('.std-inspection[data-inspection-type="outgoing"]')?.outerHTML || html;
  };
  const report = window.issueInspectionReport;
  window.issueInspectionReport = function (type, row, bulkRenderOnly) {
    const result = report.apply(this, arguments);
    if (type !== 'outgoing' || bulkRenderOnly) return result;
    const section = document.querySelector('.std-inspection[data-inspection-type="outgoing"] .oqc-esign-parity');
    const recordId = String(row?.dataset?.sourceId || '');
    if (!section || !recordId) return result;
    const people = section.querySelectorAll('.pqc-esign-person');
    const record = document.getElementById('outgoing')?._oqcRecords?.get(String(row?.dataset?.sourceKey || '') + '|' + recordId);
    function draw(index, name, date) {
      if (!people[index]) return;
      const b = document.createElement('b'); b.textContent = name;
      people[index].replaceChildren(b);
      if (date) {
        const small = document.createElement('small');
        small.textContent = new Date(date).toLocaleString('ko-KR');
        people[index].append(small);
      }
    }
    draw(0, record?.inspector || '작성자');
    fetch('/api/qmes-quality/approvals/record?docType=OQC&recordId=' + encodeURIComponent(recordId), {credentials:'same-origin',cache:'no-store'})
      .then(response => { if (!response.ok) throw Error('결재 조회 실패'); return response.json(); })
      .then(json => {
        if (!section.isConnected) return;
        if (!json.success) throw Error('결재 조회 실패');
        const a = json.data;
        if (!a) return;
        draw(0, a.writer_name || record?.inspector || '작성자');
        if (a.reviewed_at) draw(1, a.reviewer_name || '검토완료', a.reviewed_at);
        if (a.status === 'APPROVED' && a.approved_at) draw(2, a.approver_name || '승인완료', a.approved_at);
      }).catch(error => {
        if (section.isConnected) { draw(1, '조회 확인 필요'); draw(2, '조회 확인 필요'); }
        console.warn('[OQC report approval]', error);
      });
    return result;
  };
})();
