/* QMES 2026-08-12: PQC/OQC remarks width + equipment history one-screen alignment */
(function installQmesInspectionHistoryLayoutFix(){
  'use strict';
  if (window.__QMES_INSPECTION_HISTORY_LAYOUT_FIX_20260812__) return;
  window.__QMES_INSPECTION_HISTORY_LAYOUT_FIX_20260812__ = true;

  const style = document.createElement('style');
  style.id = 'qmes-inspection-history-layout-fix-20260812';
  style.textContent = `
    /* 공정/출하검사 비고 입력칸을 다시 넓게 */
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-wide-remarks{
      grid-column:span 2!important;
      min-width:0!important;
      width:100%!important;
      max-width:none!important;
    }
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-wide-remarks input,
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-wide-remarks textarea{
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
      box-sizing:border-box!important;
    }

    /* 설비 점검 기록: 기존 min-width:960px 규칙보다 높은 우선순위로 한 화면 고정 */
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table-wrap{
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
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

    /* 일시 / 설비 / 관리항목 / 판독값 / 판정 / 점검자 / 비고 / 관리 = 100% */
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(1),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(1){width:13%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(2),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(2){width:11%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(3),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(3){width:15%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(4),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(4){width:10%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(5),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(5){width:8%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(6),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(6){width:11%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(7),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(7){width:18%!important;}
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(8),
    html body .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(8){width:14%!important;}

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
      color:#111827!important;
      -webkit-text-fill-color:#111827!important;
      white-space:nowrap!important;
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

  function getMode(){
    const active = document.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text = String(active?.textContent || '').toUpperCase();
    if (text.includes('PQC')) return 'PQC';
    if (text.includes('OQC')) return 'OQC';
    if (text.includes('IQC')) return 'IQC';
    const title = String(document.querySelector('.qmes-ipad-inspection-head h1')?.textContent || '');
    if (title.includes('공정검사')) return 'PQC';
    if (title.includes('출하검사')) return 'OQC';
    if (title.includes('수입검사')) return 'IQC';
    return '';
  }

  function widenRemarks(){
    const mode = getMode();
    document.querySelectorAll('.qmes-ipad-form-grid label.qmes-pqc-oqc-wide-remarks')
      .forEach((label) => label.classList.remove('qmes-pqc-oqc-wide-remarks'));
    if (mode !== 'PQC' && mode !== 'OQC') return;
    document.querySelectorAll('.qmes-ipad-pop .qmes-ipad-form-grid label').forEach((label) => {
      const caption = String(label.querySelector('span')?.textContent || '').replace(/\s+/g,' ').trim();
      if (caption === '비고' || caption.startsWith('비고 ')) label.classList.add('qmes-pqc-oqc-wide-remarks');
    });
  }

  let queued = false;
  function schedule(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; widenRemarks(); });
  }
  const observer = new MutationObserver(schedule);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      widenRemarks();
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }, {once:true});
  } else {
    widenRemarks();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
