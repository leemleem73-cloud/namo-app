/* QMES CoA issued-history edit/delete controls — 2026-08-13 */
(function () {
  const TOMBSTONE_KEY = 'qmes-coa-deleted-lots-v1';
  const AUTO_NOTICE_TEXTS = ['OQC 전 항목 합격 건은 자동으로 발행 내역에 등록됩니다.', '날짜·LOT No.·고객사로 조회한 뒤 출력하세요.'];

  function removeAutoIssueNotice() {
    document.querySelectorAll('p,div,section,aside').forEach((node) => {
      if (node.querySelector('.qmes-coa-issued-table')) return;
      const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const matched = AUTO_NOTICE_TEXTS.some((phrase) => text.includes(phrase));
      if (!matched) return;
      /* 문장만 숨기면 빈 안내 칸이 남으므로, 해당 문장 전용 wrapper까지 제거한다. */
      const children = Array.from(node.children || []);
      const hasControls = !!node.querySelector('input,select,button,table');
      if (!hasControls && (children.length <= 2 || text.length < 180)) node.remove();
    });
  }

  function readDeletedLots() {
    try {
      const value = JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch (_error) { return new Set(); }
  }
  function saveDeletedLots(set) { try { localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set))); } catch (_error) {} }
  function persist() { try { if (typeof window.dbSave === 'function') window.dbSave(); } catch (_error) {} }
  function purgeDeletedFromDb() {
    if (!window.DB || !DB.coa) return false;
    const deletedLots = readDeletedLots(); let changed = false;
    deletedLots.forEach((lot) => { if (Object.prototype.hasOwnProperty.call(DB.coa, lot)) { delete DB.coa[lot]; changed = true; } });
    if (changed) persist(); return changed;
  }
  function deleteCoa(lot) {
    const key = String(lot || '').trim(); if (!key) return;
    const coa = window.DB?.coa?.[key] || {}; const certNo = coa.no || `COA-${key}`;
    if (!window.confirm(`${certNo} (${key}) 출하성적서 발행 내역을 삭제하시겠습니까?\n\nOQC 출하검사 원본은 삭제하지 않습니다.`)) return;
    const deletedLots = readDeletedLots(); deletedLots.add(key); saveDeletedLots(deletedLots);
    if (window.DB?.coa && Object.prototype.hasOwnProperty.call(DB.coa, key)) delete DB.coa[key];
    persist(); window.alert(`${certNo} 발행 내역을 삭제했습니다.`); window.location.reload();
  }
  function editCoa(lot) {
    const key = String(lot || '').trim(); if (!key || !window.DB?.coa?.[key]) return; const current = DB.coa[key];
    const customer = window.prompt('고객사', current.customer || ''); if (customer === null) return;
    const qty = window.prompt('출하량 (kg)', String(current.qty ?? '').replace(/\s*kg$/i, '')); if (qty === null) return;
    const ship = window.prompt('발행일 / 출하일 (YYYY-MM-DD)', current.ship || ''); if (ship === null) return;
    const shipNo = window.prompt('출하번호', current.shipNo || ''); if (shipNo === null) return;
    DB.coa[key] = {...current, customer:String(customer).trim(), qty:String(qty).trim(), ship:String(ship).trim(), shipNo:String(shipNo).trim()};
    persist(); window.alert(`${current.no || `COA-${key}`} 발행 내역을 수정했습니다.`); window.location.reload();
  }
  function styleAction(button, tone) {
    button.type = 'button'; button.className = `qmes-manage-btn qmes-coa-${tone}-btn`; button.style.marginLeft = '6px';
    if (tone === 'edit') { button.style.borderColor = 'rgba(56,189,248,.7)'; button.style.color = '#7dd3fc'; button.style.background = 'rgba(14,165,233,.08)'; }
    else { button.style.borderColor = 'rgba(244,63,94,.7)'; button.style.color = '#fda4af'; button.style.background = 'rgba(244,63,94,.08)'; }
  }
  function enhanceIssuedTable() {
    purgeDeletedFromDb(); removeAutoIssueNotice();
    const rows = document.querySelectorAll('.qmes-coa-issued-table tbody tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td'); if (cells.length < 8) return;
      const lot = String(cells[2]?.textContent || '').trim(); const manageCell = cells[7]; if (!lot || !manageCell) return;
      if (!manageCell.querySelector('.qmes-coa-edit-btn')) {
        const editButton = document.createElement('button'); editButton.textContent = '수정'; styleAction(editButton, 'edit');
        editButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); editCoa(lot); }); manageCell.appendChild(editButton);
      }
      if (!manageCell.querySelector('.qmes-coa-delete-btn')) {
        const deleteButton = document.createElement('button'); deleteButton.textContent = '삭제'; styleAction(deleteButton, 'delete');
        deleteButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); deleteCoa(lot); }); manageCell.appendChild(deleteButton);
      }
    });
  }
  purgeDeletedFromDb(); removeAutoIssueNotice();
  const observer = new MutationObserver(() => enhanceIssuedTable()); observer.observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener('DOMContentLoaded', enhanceIssuedTable); window.addEventListener('load', enhanceIssuedTable); setInterval(enhanceIssuedTable, 750);
})();

/* 2026-08-20 emergency rollback */
(function disableQmesCrossPcAutoLoader(){'use strict';window.__QMES_CROSS_PC_SYNC_LOADER_DISABLED__ = true;})();
(function loadStandaloneIqcEditScreen(){'use strict';if(document.querySelector('script[data-qmes-iqc-standalone-edit="true"]'))return;const script=document.createElement('script');script.src='./js/iqc-edit-screen-20260826.js?v=20260826-1';script.dataset.qmesIqcStandaloneEdit='true';script.async=false;document.body.appendChild(script);})();
