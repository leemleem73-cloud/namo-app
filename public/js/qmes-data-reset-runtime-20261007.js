(function () {
  'use strict';

  const OPERATIONAL_SECTIONS = [
    'orders',
    'purchase',
    'work',
    'inventory',
    'incoming',
    'process',
    'outgoing',
    'quality',
    'approval'
  ];

  try {
    localStorage.removeItem('namo_qmes_incoming_materials_v1');
  } catch (_error) {}

  if (typeof window.getIncomingMaterials === 'function') {
    window.getIncomingMaterials = function getIncomingMaterialsResetSafe() {
      try {
        const saved = JSON.parse(localStorage.getItem('namo_qmes_incoming_materials_v1') || '[]');
        return Array.isArray(saved) ? saved : [];
      } catch (_error) {
        return [];
      }
    };
  }

  if (typeof window.lotTraceData === 'function') {
    window.lotTraceData = function lotTraceDataResetSafe() {
      return [];
    };
  }

  function replaceWithEmptyRow(tbody) {
    if (!tbody) return;
    const table = tbody.closest('table');
    const columnCount = table ? Math.max(1, table.querySelectorAll('thead th').length) : 1;
    tbody.innerHTML =
      '<tr class="qmes-reset-empty-row"><td colspan="' + columnCount +
      '" style="height:72px;text-align:center;color:#94a3b8;background:#fff">등록된 데이터가 없습니다.</td></tr>';
  }

  function clearOperationalSampleRows() {
    OPERATIONAL_SECTIONS.forEach(function (id) {
      const section = document.getElementById(id);
      if (!section) return;
      const rows = Array.from(section.querySelectorAll('tbody tr.data-row'));
      if (rows.length === 6) {
        const bodies = new Set(rows.map(function (row) { return row.parentElement; }).filter(Boolean));
        bodies.forEach(replaceWithEmptyRow);
      }
    });
  }

  function clearDashboardSamples() {
    document.querySelectorAll('.kpi-value').forEach(function (el) {
      el.textContent = '0';
    });
    document.querySelectorAll('.bars .bar').forEach(function (el) {
      el.style.height = '0%';
    });
    document.querySelectorAll('.status-row .fill').forEach(function (el) {
      el.style.width = '0%';
    });
    document.querySelectorAll('.status-row .pct').forEach(function (el) {
      el.textContent = '0%';
    });

    Array.from(document.querySelectorAll('.card-head b')).forEach(function (heading) {
      if (heading.textContent.trim() !== '금일 주요 진행현황') return;
      const card = heading.closest('.table-card, .card');
      if (!card) return;
      replaceWithEmptyRow(card.querySelector('tbody'));
    });
  }

  function clearLotTraceSamples() {
    if (typeof window.lotTraceData === 'function') {
      window.lotTraceData = function lotTraceDataResetSafe() {
        return [];
      };
    }
    if (typeof window.buildModule === 'function' && document.getElementById('lotTrace')) {
      try {
        window.buildModule('lotTrace');
      } catch (_error) {}
    }
  }

  function applyResetView() {
    clearDashboardSamples();
    clearOperationalSampleRows();
    clearLotTraceSamples();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(applyResetView, 0);
    }, { once: true });
  } else {
    setTimeout(applyResetView, 0);
  }
})();
