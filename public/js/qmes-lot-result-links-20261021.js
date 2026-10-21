/* Open the exact saved document from LOT trace results. */
(function () {
  'use strict';
  const normalize = value => String(value || '').trim().toUpperCase();
  function start() {
    const root = document.getElementById('lotTrace');
    if (!root) return;
    const style = document.createElement('style');
    style.textContent = '#lotTrace .lot-detail-table .lot-record-link{border:0!important;background:transparent!important;padding:0!important;color:#006bc3!important;font:inherit!important;font-weight:800!important;text-decoration:underline!important;text-underline-offset:3px;cursor:pointer!important}#lotTrace .lot-record-link:focus-visible{outline:2px solid #2185d0;outline-offset:4px}';
    document.head.append(style);
    function decorate() {
      root.querySelectorAll('#lotResultBody .lot-compact-section').forEach(section => {
        const title = section.querySelector('summary span')?.textContent.trim() || '';
        const type = title === '작업지시 / 생산 LOT' ? 'work' : title === '공정검사 (PQC)' ? 'process' : title === '출하검사 (OQC)' ? 'outgoing' : '';
        if (!type) return;
        section.querySelectorAll('tbody tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          const cell = cells[type === 'work' ? 0 : 1];
          if (!cell || cell.querySelector('.lot-record-link') || !cell.textContent.trim() || cell.textContent.trim() === '-') return;
          const button = document.createElement('button'); button.type = 'button';
          button.className = 'lot-record-link'; button.textContent = cell.textContent.trim();
          button.dataset.targetPage = type;
          button.dataset.date = cells[0]?.textContent.trim() || '';
          button.dataset.product = cells[2]?.textContent.trim() || '';
          button.setAttribute('aria-label', button.textContent + ' ' + ({work:'작업지시서',process:'공정검사',outgoing:'출하검사 성적서'}[type]) + ' 열기');
          cell.replaceChildren(button);
        });
      });
    }
    const observer = new MutationObserver(() => {observer.disconnect();decorate();observe();});
    const observe = () => observer.observe(root, {subtree:true,childList:true});
    decorate();observe();
    let busy = false;
    root.addEventListener('click', async event => {
      const button = event.target.closest('.lot-record-link');
      if (!button) return;
      event.preventDefault();event.stopPropagation();
      if (busy) return;
      busy = true;button.disabled = true;
      try {
        const type = button.dataset.targetPage;
        if (type === 'work') {await window.openPqcLinkedWorkOrder(button.textContent.trim());return;}
        const menu = document.querySelector('#sidebar .menu[data-page="' + type + '"]');
        if (!menu) throw Error('해당 검사 화면을 찾을 수 없습니다.');
        menu.click();
        // Let the page's initial scheduled fetch start before issuing the awaited refresh.
        await new Promise(resolve => setTimeout(resolve, 0));
        const section = document.getElementById(type);
        await window.loadHistoricalInspectionRows(section, type);
        if (!section?.classList.contains('active')) return;
        const rows = section._inspectionAllRows || [...section.querySelectorAll('tbody tr.data-row')];
        const matches = rows.filter(row => {
          const cells = row.querySelectorAll('td');
          return normalize(cells[4]?.textContent) === normalize(button.textContent)
            && String(cells[1]?.textContent || '').trim().slice(0,10) === button.dataset.date.slice(0,10)
            && (!button.dataset.product || button.dataset.product === '-' || normalize(cells[3]?.textContent) === normalize(button.dataset.product));
        });
        if (!matches.length) throw Error('해당 검사 기록을 찾을 수 없습니다. 검사 목록을 확인해 주세요.');
        if (matches.length !== 1) throw Error('같은 일자와 LOT의 검사 기록이 여러 건입니다. 검사 목록에서 선택해 주세요.');
        if (type === 'outgoing') window.issueInspectionReport('outgoing', matches[0]);
        else window.showRowDetail('process', matches[0]);
      } catch (error) {window.toast?.(error.message || '연결 문서를 열지 못했습니다.');}
      finally {busy = false;button.disabled = false;}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});else start();
})();
