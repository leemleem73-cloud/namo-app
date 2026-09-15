/* NAMO QMES - IQC field input shared history panel (2026-09-15)
 * Shows the shared IQC ledger on the actual IQC field-input screen.
 * Safe additive patch: no existing input/save logic is replaced.
 */
(function(){
  'use strict';
  if(window.__QMES_IQC_FIELD_HISTORY_20260915__) return;
  window.__QMES_IQC_FIELD_HISTORY_20260915__=true;

  const PANEL_ID='qmes-iqc-field-history-20260915';
  const STYLE_ID='qmes-iqc-field-history-style-20260915';
  let cachedRows=[];
  let loading=false;
  let lastPullAt=0;
  let scheduled=false;

  const clean=value=>String(value==null?'':value).trim();
  const esc=value=>clean(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const dateOf=row=>clean(row?.inspectedAt||row?.recv||row?.date).slice(0,10);
  const lotOf=row=>clean(row?.lot||row?.lotNo||row?.lot_no);
  const nameOf=row=>clean(row?.name||row?.material||row?.materialName)||'-';
  const supplierOf=row=>clean(row?.supplier||row?.vendor)||'-';
  const qtyOf=row=>clean(row?.qty||row?.incomingQty||row?.incoming_qty)||'-';
  const judgeOf=row=>clean(row?.judge||row?.result||row?.status)||'-';
  const inspectorOf=row=>clean(row?.inspector||row?.by)||'-';

  function isIqcFieldScreen(){
    const root=document.querySelector('.qmes-ipad-pop');
    if(!root) return false;
    const heading=clean(root.querySelector('.qmes-ipad-work-head h1')?.textContent);
    return /수입검사\s*현장입력/.test(heading);
  }

  function getRows(){
    const source=cachedRows.length?cachedRows:(Array.isArray(window.DB?.iqc)?window.DB.iqc:[]);
    return source.slice().sort((a,b)=>{
      const bd=`${dateOf(b)} ${clean(b?.inNo)}`;
      const ad=`${dateOf(a)} ${clean(a?.inNo)}`;
      return bd.localeCompare(ad);
    }).slice(0,10);
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${PANEL_ID}{margin:14px 0 16px;padding:0;border:1px solid #cbd9e5;border-radius:14px;background:#fff;box-shadow:0 5px 18px rgba(40,73,96,.07);overflow:hidden;font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif}
      #${PANEL_ID} .qmes-iqc-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border-bottom:1px solid #e2e8f0;background:linear-gradient(180deg,#f8fbfd,#f2f7fa)}
      #${PANEL_ID} .qmes-iqc-history-title{display:flex;align-items:center;gap:10px;min-width:0}
      #${PANEL_ID} .qmes-iqc-history-title b{font-size:15px;color:#173a53;font-weight:900;white-space:nowrap}
      #${PANEL_ID} .qmes-iqc-history-title span{font-size:11px;color:#6b8191;font-weight:700;white-space:nowrap}
      #${PANEL_ID} .qmes-iqc-history-refresh{height:32px;padding:0 12px;border:1px solid #a8c2d4;border-radius:8px;background:#fff;color:#245b7d;font-size:11px;font-weight:850;cursor:pointer}
      #${PANEL_ID} .qmes-iqc-history-refresh:disabled{opacity:.55;cursor:wait}
      #${PANEL_ID} .qmes-iqc-history-scroll{overflow:auto;max-height:360px}
      #${PANEL_ID} table{width:100%;min-width:850px;border-collapse:collapse;table-layout:fixed}
      #${PANEL_ID} th{position:sticky;top:0;z-index:1;padding:9px 8px;border-bottom:1px solid #d7e1e8;background:#edf4f8;color:#3f5f74;font-size:10px;font-weight:900;text-align:center}
      #${PANEL_ID} td{padding:9px 8px;border-bottom:1px solid #edf1f4;color:#334b5c;font-size:11px;font-weight:650;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${PANEL_ID} tbody tr:last-child td{border-bottom:0}
      #${PANEL_ID} .qmes-iqc-history-lot{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#155e75;font-weight:850}
      #${PANEL_ID} .qmes-iqc-history-pass{display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:24px;padding:0 8px;border-radius:999px;background:#ecfdf3;color:#047857;font-weight:900}
      #${PANEL_ID} .qmes-iqc-history-fail{display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:24px;padding:0 8px;border-radius:999px;background:#fff1f2;color:#be123c;font-weight:900}
      #${PANEL_ID} .qmes-iqc-history-empty{padding:20px!important;color:#7a8d9b!important;text-align:center!important;font-weight:750!important}
      @media(max-width:900px){#${PANEL_ID}{margin:10px 0 14px}#${PANEL_ID} .qmes-iqc-history-head{padding:11px 12px}#${PANEL_ID} .qmes-iqc-history-title span{display:none}}
    `;
    document.head.appendChild(style);
  }

  function render(){
    if(!isIqcFieldScreen()){
      document.getElementById(PANEL_ID)?.remove();
      return;
    }
    const root=document.querySelector('.qmes-ipad-pop');
    const tabs=root?.querySelector('.qmes-ipad-mode-tabs');
    const firstSection=root?.querySelector('.qmes-ipad-section');
    if(!root||(!tabs&&!firstSection)) return;
    ensureStyle();

    let panel=document.getElementById(PANEL_ID);
    if(!panel){
      panel=document.createElement('section');
      panel.id=PANEL_ID;
      if(tabs?.parentNode) tabs.insertAdjacentElement('afterend',panel);
      else firstSection?.parentNode?.insertBefore(panel,firstSection);
    }

    const rows=getRows();
    const total=Array.isArray(window.DB?.iqc)?window.DB.iqc.length:rows.length;
    const body=rows.length?rows.map(row=>{
      const judge=judgeOf(row);
      const judgeClass=judge==='합격'?'qmes-iqc-history-pass':judge==='불합격'?'qmes-iqc-history-fail':'';
      return `<tr>
        <td title="${esc(dateOf(row)||'-')}">${esc(dateOf(row)||'-')}</td>
        <td title="${esc(clean(row?.inNo)||'-')}">${esc(clean(row?.inNo)||'-')}</td>
        <td title="${esc(nameOf(row))}">${esc(nameOf(row))}</td>
        <td title="${esc(supplierOf(row))}">${esc(supplierOf(row))}</td>
        <td class="qmes-iqc-history-lot" title="${esc(lotOf(row)||'-')}">${esc(lotOf(row)||'-')}</td>
        <td title="${esc(qtyOf(row))}">${esc(qtyOf(row))}</td>
        <td title="${esc(inspectorOf(row))}">${esc(inspectorOf(row))}</td>
        <td><span class="${judgeClass}">${esc(judge)}</span></td>
      </tr>`;
    }).join(''):`<tr><td class="qmes-iqc-history-empty" colspan="8">수입검사 이력이 없습니다.</td></tr>`;

    panel.innerHTML=`
      <div class="qmes-iqc-history-head">
        <div class="qmes-iqc-history-title"><b>최근 수입검사 이력</b><span>공용 DB 기준 · 전체 ${Number(total)||0}건 · 최근 ${rows.length}건 표시</span></div>
        <button type="button" class="qmes-iqc-history-refresh" ${loading?'disabled':''}>${loading?'불러오는 중...':'이력 새로고침'}</button>
      </div>
      <div class="qmes-iqc-history-scroll">
        <table aria-label="최근 수입검사 이력">
          <thead><tr><th>검사일자</th><th>입고번호</th><th>원자재명</th><th>업체명</th><th>원재료 LOT</th><th>입고중량</th><th>검사자</th><th>판정</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    panel.querySelector('.qmes-iqc-history-refresh')?.addEventListener('click',()=>pull(true));
  }

  async function pull(force){
    if(loading) return;
    const now=Date.now();
    if(!force&&now-lastPullAt<15000){render();return;}
    loading=true;
    render();
    try{
      const local=Array.isArray(window.DB?.iqc)?window.DB.iqc:[];
      if(typeof window.qmesSyncPullInspection==='function'){
        const next=await window.qmesSyncPullInspection('iqc',local);
        if(Array.isArray(next)){
          cachedRows=next;
          if(window.DB) window.DB.iqc=next;
          try{if(typeof window.dbSave==='function') window.dbSave();}catch(_error){}
        }else cachedRows=local;
      }else cachedRows=local;
      lastPullAt=Date.now();
    }catch(error){
      console.warn('[QMES] IQC 현장 이력 동기화 실패:',error?.message||error);
      cachedRows=Array.isArray(window.DB?.iqc)?window.DB.iqc:[];
    }finally{
      loading=false;
      render();
    }
  }

  function apply(){
    scheduled=false;
    if(isIqcFieldScreen()) pull(false);
    else render();
  }
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(apply);
  }

  document.addEventListener('click',event=>{
    if(event.target instanceof Element&&event.target.closest('button')) setTimeout(schedule,0);
  },true);
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  document.addEventListener('qmes:data-updated',()=>{lastPullAt=0;setTimeout(schedule,0);});
  document.addEventListener('qmes:shared-sync-complete',()=>{lastPullAt=0;setTimeout(schedule,0);});

  const start=()=>{
    if(!document.body) return;
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true});
    schedule();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
