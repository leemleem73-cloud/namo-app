/* QMES CoA issued-history delete button patch — 2026-08-13 */
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
    try {
      localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set)));
    } catch (_error) {}
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
    if (changed && typeof window.dbSave === 'function') window.dbSave();
    return changed;
  }

  function deleteCoa(lot, row) {
    const key = String(lot || '').trim();
    if (!key) return;
    const coa = window.DB?.coa?.[key] || {};
    const certNo = coa.no || `COA-${key}`;
    if (!window.confirm(`${certNo} (${key}) 출하성적서 발행 내역을 삭제하시겠습니까?\n\nOQC 검사 원본은 삭제하지 않습니다.`)) return;

    const deletedLots = readDeletedLots();
    deletedLots.add(key);
    saveDeletedLots(deletedLots);

    if (window.DB?.coa && Object.prototype.hasOwnProperty.call(DB.coa, key)) delete DB.coa[key];
    if (typeof window.dbSave === 'function') window.dbSave();

    if (row) row.remove();
    window.alert(`${certNo} 발행 내역을 삭제했습니다.`);
    setTimeout(() => window.location.reload(), 80);
  }

  function enhanceIssuedTable() {
    purgeDeletedFromDb();
    const table = document.querySelector('.qmes-coa-issued-table');
    if (!table) return;

    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 8) return;
      const lot = String(cells[2]?.textContent || '').trim();
      if (!lot || row.querySelector('.qmes-coa-delete-btn')) return;

      const manageCell = cells[7];
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'qmes-manage-btn qmes-coa-delete-btn';
      deleteButton.textContent = '삭제';
      deleteButton.style.marginLeft = '6px';
      deleteButton.style.borderColor = 'rgba(244,63,94,.65)';
      deleteButton.style.color = '#fda4af';
      deleteButton.style.background = 'rgba(244,63,94,.08)';
      deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteCoa(lot, row);
      });
      manageCell.appendChild(deleteButton);
    });
  }

  purgeDeletedFromDb();
  const observer = new MutationObserver(enhanceIssuedTable);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener('DOMContentLoaded', enhanceIssuedTable);
  setTimeout(enhanceIssuedTable, 0);
  setTimeout(enhanceIssuedTable, 500);
})();
