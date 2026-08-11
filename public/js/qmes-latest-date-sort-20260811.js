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
