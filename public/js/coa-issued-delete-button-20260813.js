/* QMES CoA issued-history edit/delete controls — 2026-08-13 */
(function () {
  const TOMBSTONE_KEY = 'qmes-coa-deleted-lots-v1';

  function readDeletedLots() {
    try {
      const value = JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch (_error) {
      return new Set();
    }
  }

  function saveDeletedLots(set) {
    try { localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set))); } catch (_error) {}
  }

  function persist() {
    try { if (typeof window.dbSave === 'function') window.dbSave(); } catch (_error) {}
  }

  function purgeDeletedFromDb() {
    if (!window.DB || !DB.coa) return false;
    const deletedLots = readDeletedLots();
    let changed = false;
    deletedLots.forEach((lot) => {
      if (Object.prototype.hasOwnProperty.call(DB.coa, lot)) {
        delete DB.coa[lot];
        changed = true;
      }
    });
    if (changed) persist();
    return changed;
  }

  function deleteCoa(lot) {
    const key = String(lot || '').trim();
    if (!key) return;
    const coa = window.DB?.coa?.[key] || {};
    const certNo = coa.no || `COA-${key}`;
    if (!window.confirm(`${certNo} (${key}) 출하성적서 발행 내역을 삭제하시겠습니까?\n\nOQC 출하검사 원본은 삭제하지 않습니다.`)) return;

    const deletedLots = readDeletedLots();
    deletedLots.add(key);
    saveDeletedLots(deletedLots);
    if (window.DB?.coa && Object.prototype.hasOwnProperty.call(DB.coa, key)) delete DB.coa[key];
    persist();
    window.alert(`${certNo} 발행 내역을 삭제했습니다.`);
    window.location.reload();
  }

  function editCoa(lot) {
    const key = String(lot || '').trim();
    if (!key || !window.DB?.coa?.[key]) return;
    const current = DB.coa[key];

    const customer = window.prompt('고객사', current.customer || '');
    if (customer === null) return;
    const qty = window.prompt('출하량 (kg)', String(current.qty ?? '').replace(/\s*kg$/i, ''));
    if (qty === null) return;
    const ship = window.prompt('발행일 / 출하일 (YYYY-MM-DD)', current.ship || '');
    if (ship === null) return;
    const shipNo = window.prompt('출하번호', current.shipNo || '');
    if (shipNo === null) return;

    DB.coa[key] = {
      ...current,
      customer:String(customer).trim(),
      qty:String(qty).trim(),
      ship:String(ship).trim(),
      shipNo:String(shipNo).trim()
    };
    persist();
    window.alert(`${current.no || `COA-${key}`} 발행 내역을 수정했습니다.`);
    window.location.reload();
  }

  function styleAction(button, tone) {
    button.type = 'button';
    button.className = `qmes-manage-btn qmes-coa-${tone}-btn`;
    button.style.marginLeft = '6px';
    if (tone === 'edit') {
      button.style.borderColor = 'rgba(56,189,248,.7)';
      button.style.color = '#7dd3fc';
      button.style.background = 'rgba(14,165,233,.08)';
    } else {
      button.style.borderColor = 'rgba(244,63,94,.7)';
      button.style.color = '#fda4af';
      button.style.background = 'rgba(244,63,94,.08)';
    }
  }

  function enhanceIssuedTable() {
    purgeDeletedFromDb();

    const rows = document.querySelectorAll('.qmes-coa-issued-table tbody tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 8) return;
      const lot = String(cells[2]?.textContent || '').trim();
      const manageCell = cells[7];
      if (!lot || !manageCell) return;

      if (!manageCell.querySelector('.qmes-coa-edit-btn')) {
        const editButton = document.createElement('button');
        editButton.textContent = '수정';
        styleAction(editButton, 'edit');
        editButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          editCoa(lot);
        });
        manageCell.appendChild(editButton);
      }

      if (!manageCell.querySelector('.qmes-coa-delete-btn')) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        styleAction(deleteButton, 'delete');
        deleteButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          deleteCoa(lot);
        });
        manageCell.appendChild(deleteButton);
      }
    });
  }

  purgeDeletedFromDb();
  const observer = new MutationObserver(() => enhanceIssuedTable());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener('DOMContentLoaded', enhanceIssuedTable);
  window.addEventListener('load', enhanceIssuedTable);
  setInterval(enhanceIssuedTable, 750);
})();

/* 2026-08-20: load the central cross-PC synchronization bootstrap from an
 * existing index-loaded script so every QMES client uses shared DB pulls. */
(function loadQmesGlobalCrossPcSync(){
  'use strict';
  if (window.__QMES_GLOBAL_CROSS_PC_SYNC_LOADER__) return;
  window.__QMES_GLOBAL_CROSS_PC_SYNC_LOADER__ = true;
  var script = document.createElement('script');
  script.src = './js/qmes-global-cross-pc-sync-20260820.js?v=20260820-1';
  script.async = false;
  script.onerror = function(){ console.error('QMES 공용 동기화 모듈 로드 실패'); };
  document.head.appendChild(script);
})();
