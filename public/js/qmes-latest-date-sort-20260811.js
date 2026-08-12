/* QMES global latest-date-first table ordering — 2026-08-11
 * Applies to rendered ledger/history/inspection-result tables that expose a date column.
 * Work-order issue history is intentionally excluded because it already owns its ordering.
 */
(function () {
  'use strict';

  var DATE_HEADERS = [
    '일자', '날짜', '등록일', '등록일자', '작성일', '작성일자', '발행일', '발행일자',
    '생산일', '생산일자', '검사일', '검사일자', '검사일시', '검사날짜', '성적일', '성적일자',
    '시험일', '시험일자', '측정일', '측정일자', '입고일', '입고일자', '출고일', '출고일자',
    '출하일', '출하일자', '작업일', '작업일자', '교육일', '교육일자', '점검일', '점검일자',
    '교정일', '교정일자', '평가일', '평가일자', '발생일', '발생일자', '처리일', '처리일자'
  ];
  var DATE_HEADER_SET = new Set(DATE_HEADERS.map(normalize));
  var pending = false;
  var sorting = false;

  function normalize(value) {
    return String(value == null ? '' : value).replace(/\s+/g, '').replace(/[▲▼↕]/g, '').trim();
  }

  function textOf(cell) {
    if (!cell) return '';
    var input = cell.querySelector && cell.querySelector('input,select,textarea');
    if (input) return String(input.value || input.getAttribute('value') || '').trim();
    return String(cell.textContent || '').trim();
  }

  function dateValue(raw) {
    var value = String(raw || '').trim();
    if (!value) return Number.NEGATIVE_INFINITY;
    var m = value.match(/(20\d{2})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{1,2})(?:\s+(\d{1,2}):?(\d{2})?)?/);
    if (!m) return Number.NEGATIVE_INFINITY;
    return Number(m[1]) * 100000000 + Number(m[2]) * 1000000 + Number(m[3]) * 10000 + Number(m[4] || 0) * 100 + Number(m[5] || 0);
  }

  function isWorkOrderTable(table) {
    var headers = Array.from(table.querySelectorAll('thead th')).map(function (th) { return normalize(th.textContent); });
    var joined = headers.join('|');
    return joined.indexOf('LOTNo.') >= 0 && joined.indexOf('계획량') >= 0 && joined.indexOf('실투입량') >= 0 && joined.indexOf('생산일자') >= 0;
  }

  function findDateColumn(table) {
    var headers = Array.from(table.querySelectorAll('thead th'));
    for (var i = 0; i < headers.length; i += 1) {
      var key = normalize(headers[i].textContent);
      if (DATE_HEADER_SET.has(key)) return i;
      if (/^(검사|성적|시험|측정).*(일|일자|일시|날짜)$/.test(key)) return i;
    }
    return -1;
  }

  function sortTable(table) {
    if (!table || table.dataset.qmesKeepOrder === 'true' || isWorkOrderTable(table)) return;
    var index = findDateColumn(table);
    if (index < 0) return;
    var bodies = Array.from(table.tBodies || []);
    bodies.forEach(function (tbody) {
      var rows = Array.from(tbody.rows || []);
      if (rows.length < 2) return;
      var sortable = rows.filter(function (row) {
        return row.cells && row.cells.length > index && dateValue(textOf(row.cells[index])) !== Number.NEGATIVE_INFINITY;
      });
      if (sortable.length < 2) return;

      var originalIndex = new Map(rows.map(function (row, i) { return [row, i]; }));
      var ordered = rows.slice().sort(function (a, b) {
        var ad = a.cells && a.cells.length > index ? dateValue(textOf(a.cells[index])) : Number.NEGATIVE_INFINITY;
        var bd = b.cells && b.cells.length > index ? dateValue(textOf(b.cells[index])) : Number.NEGATIVE_INFINITY;
        if (ad !== bd) return bd - ad;
        return originalIndex.get(a) - originalIndex.get(b);
      });
      var changed = ordered.some(function (row, i) { return row !== rows[i]; });
      if (!changed) return;
      var fragment = document.createDocumentFragment();
      ordered.forEach(function (row) { fragment.appendChild(row); });
      tbody.appendChild(fragment);
    });
  }

  function sortAll() {
    if (sorting) return;
    sorting = true;
    try {
      document.querySelectorAll('table').forEach(sortTable);
    } finally {
      sorting = false;
    }
  }

  function schedule() {
    if (pending || sorting) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      sortAll();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('qmes:data-updated', schedule);
  window.addEventListener('qmes:data-changed', schedule);
  window.addEventListener('focus', schedule);
  window.qmesSortLatestDateFirst = sortAll;
})();

/* 2026-08-12 현장검사 비고 + 설비 점검 기록 최종 폭 보정 */
(function installInspectionAndEquipmentWidthFix(){
  'use strict';
  if (window.__QMES_INSPECTION_EQUIPMENT_WIDTH_FIX_20260812__) return;
  window.__QMES_INSPECTION_EQUIPMENT_WIDTH_FIX_20260812__ = true;

  var style = document.createElement('style');
  style.id = 'qmes-inspection-equipment-width-fix-20260812';
  style.textContent = `
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-remarks-wide{
      grid-column:1/-1!important;
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
    }
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-remarks-wide input{
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
      box-sizing:border-box!important;
    }

    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table-wrap{
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      overflow-x:hidden!important;
      box-sizing:border-box!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table{
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      table-layout:fixed!important;
      border-collapse:collapse!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th,
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td{
      box-sizing:border-box!important;
      padding-left:4px!important;
      padding-right:4px!important;
      text-align:center!important;
      vertical-align:middle!important;
      letter-spacing:0!important;
      word-spacing:0!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th{
      font-size:13px!important;
      line-height:1.2!important;
      white-space:nowrap!important;
      overflow:visible!important;
      text-overflow:clip!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td{
      font-size:12px!important;
      line-height:1.3!important;
      white-space:normal!important;
      word-break:keep-all!important;
      overflow-wrap:anywhere!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(1),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(1){width:13%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(2),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(2){width:11%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(3),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(3){width:15%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(4),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(4){width:10%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(5),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(5){width:8%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(6),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(6){width:11%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(7),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(7){width:18%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(8),html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(8){width:14%!important;}

    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-time-head,
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-time-cell,
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-head,
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-cell{
      width:auto!important;
      min-width:0!important;
      max-width:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-head{
      display:table-cell!important;
      visibility:visible!important;
      opacity:1!important;
      color:#111827!important;
      -webkit-text-fill-color:#111827!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-cell{
      overflow:visible!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-cell>div{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:3px!important;
      width:100%!important;
      min-width:0!important;
      flex-wrap:nowrap!important;
      white-space:nowrap!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-row-action{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:40px!important;
      min-width:40px!important;
      max-width:40px!important;
      height:30px!important;
      min-height:30px!important;
      padding:0 2px!important;
      box-sizing:border-box!important;
      overflow:visible!important;
      white-space:nowrap!important;
      font-size:11px!important;
      line-height:1!important;
    }
  `;
  document.head.appendChild(style);

  function activeInspectionMode(){
    var active = document.querySelector('.qmes-ipad-mode-tabs button.is-active');
    var text = String(active && active.textContent || '').toUpperCase();
    if (text.indexOf('PQC') >= 0) return 'PQC';
    if (text.indexOf('OQC') >= 0) return 'OQC';
    if (text.indexOf('IQC') >= 0) return 'IQC';
    return '';
  }

  function applyRemarksWidth(){
    document.querySelectorAll('.qmes-pqc-oqc-remarks-wide').forEach(function(label){ label.classList.remove('qmes-pqc-oqc-remarks-wide'); });
    var mode = activeInspectionMode();
    if (mode !== 'PQC' && mode !== 'OQC') return;
    document.querySelectorAll('.qmes-ipad-pop .qmes-ipad-form-grid label').forEach(function(label){
      var caption = String(label.querySelector('span') && label.querySelector('span').textContent || '').replace(/\s+/g,' ').trim();
      if (caption === '비고') label.classList.add('qmes-pqc-oqc-remarks-wide');
    });
  }

  var queued = false;
  function scheduleFix(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; applyRemarksWidth(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleFix, {once:true});
  else scheduleFix();
  new MutationObserver(scheduleFix).observe(document.documentElement,{childList:true,subtree:true});
})();

/* 2026-08-13 IQC 입고일자-입고번호 불일치 자동 복구 */
(function installIqcIncomingNumberRepair(){
  'use strict';
  if (window.__QMES_IQC_INNO_REPAIR_20260813__) return;
  window.__QMES_IQC_INNO_REPAIR_20260813__ = true;

  function findField(modal, labelText){
    var fields = Array.from(modal.querySelectorAll('.qmes-iqc-field'));
    return fields.find(function(field){
      var span = field.querySelector(':scope > span');
      return String(span && span.textContent || '').trim() === labelText;
    }) || null;
  }

  function dateCode(dateValue){
    var m = String(dateValue || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? (m[1].slice(2) + m[2] + m[3]) : '';
  }

  function buildNumber(oldNumber, recvDate){
    var code = dateCode(recvDate);
    if (!code) return oldNumber;
    var suffix = (String(oldNumber || '').match(/-(\d{4})$/) || [])[1] || '0001';
    var candidate = 'IQC-' + code + '-' + suffix;
    var used = new Set((window.DB && Array.isArray(DB.iqc) ? DB.iqc : []).map(function(r){ return String(r.inNo || ''); }));
    if (!used.has(candidate) || candidate === oldNumber) return candidate;
    for (var i = 1; i <= 9999; i += 1) {
      candidate = 'IQC-' + code + '-' + String(i).padStart(4,'0');
      if (!used.has(candidate)) return candidate;
    }
    return oldNumber;
  }

  function inspectModal(){
    var modal = document.querySelector('.qmes-iqc-modal[role="dialog"]');
    if (!modal) return;
    var title = String(modal.querySelector('.qmes-iqc-modal-head strong') && modal.querySelector('.qmes-iqc-modal-head strong').textContent || '');
    if (title.indexOf('수입검사 수정') < 0) return;
    var inNoField = findField(modal, '입고번호');
    var recvField = findField(modal, '입고일자');
    var inNoInput = inNoField && inNoField.querySelector('input');
    var recvInput = recvField && recvField.querySelector('input[type="date"]');
    if (!inNoInput || !recvInput) return;
    var oldNumber = String(inNoInput.value || '').trim();
    var expectedCode = dateCode(recvInput.value);
    var currentCode = (oldNumber.match(/^IQC-(\d{6})-/) || [])[1] || '';
    if (!expectedCode || expectedCode === currentCode) return;
    var repaired = buildNumber(oldNumber, recvInput.value);
    inNoInput.value = repaired;
    inNoInput.setAttribute('value', repaired);
    modal.dataset.qmesOldIqcInNo = oldNumber;
    modal.dataset.qmesRepairedIqcInNo = repaired;
  }

  document.addEventListener('click', function(event){
    var button = event.target && event.target.closest && event.target.closest('.qmes-iqc-modal-save');
    if (!button) return;
    var modal = button.closest('.qmes-iqc-modal');
    if (!modal) return;
    inspectModal();
    var oldNumber = modal.dataset.qmesOldIqcInNo || '';
    var repaired = modal.dataset.qmesRepairedIqcInNo || '';
    if (!oldNumber || !repaired || oldNumber === repaired) return;
    setTimeout(function(){
      try {
        if (!window.DB || !Array.isArray(DB.iqc)) return;
        var changed = false;
        DB.iqc = DB.iqc.map(function(row){
          if (String(row.inNo || '') !== oldNumber) return row;
          changed = true;
          return Object.assign({}, row, { inNo: repaired });
        });
        if (!changed) return;
        if (typeof window.dbSave === 'function') window.dbSave();
        if (typeof window.qmesSyncTombstoneInspection === 'function') {
          window.qmesSyncTombstoneInspection('iqc', oldNumber, [], '입고일자와 입고번호 날짜 불일치 자동 복구: ' + oldNumber + ' → ' + repaired).catch(function(error){
            console.warn('IQC 기존 입고번호 공용DB 정리 실패:', error && error.message);
          });
        }
        setTimeout(function(){ window.location.reload(); }, 250);
      } catch (error) {
        console.warn('IQC 입고번호 자동 복구 실패:', error && error.message);
      }
    }, 0);
  }, true);

  var queued = false;
  function scheduleRepair(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; inspectModal(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleRepair, {once:true});
  else scheduleRepair();
  new MutationObserver(scheduleRepair).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['value']});
})();
