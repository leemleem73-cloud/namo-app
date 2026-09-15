/* NAMO QMES - authoritative purchase-order read fix (2026-09-15)
 *
 * Problem fixed:
 * - purchase_orders DB contained the migrated purchase history,
 * - but ERP purchase UI could reuse a cached /api/qmes-sync/inventory response (304)
 *   and render an old empty erp:purchase payload.
 *
 * This patch makes shared-sync reads cache-free and, for inventory reads, replaces
 * erp:purchase with the authoritative /api/purchase-orders rows when available.
 * No purchase records are created/deleted here; this is a read/display consistency fix.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_AUTHORITATIVE_READ_FIX_20260915__) return;
  window.__QMES_PURCHASE_AUTHORITATIVE_READ_FIX_20260915__=true;

  const originalList=typeof window.qmesSyncList==='function'?window.qmesSyncList:null;
  const allowedTypes=new Set(['iqc','pqc','oqc','workorder','equipment','inventory']);
  let purchaseFetchPromise=null;
  let refreshRunning=false;

  const clean=value=>String(value==null?'':value).trim();

  async function jsonRequest(url){
    const response=await fetch(url,{
      credentials:'same-origin',
      cache:'no-store',
      headers:{
        'Accept':'application/json',
        'Cache-Control':'no-cache, no-store, max-age=0',
        'Pragma':'no-cache'
      }
    });
    const payload=await response.json().catch(()=>({success:false,message:`HTTP ${response.status}`}));
    if(response.status===401){
      try{sessionStorage.removeItem('qmes-current-user-v1');}catch(_error){}
      throw new Error(payload?.message||'로그인 세션이 만료되었습니다.');
    }
    if(!response.ok||payload?.success===false) throw new Error(payload?.message||`공용 DB 요청 실패 (${response.status})`);
    return payload?.data;
  }

  async function fetchPurchaseRows(force=false){
    if(purchaseFetchPromise&&!force) return purchaseFetchPromise;
    purchaseFetchPromise=(async()=>{
      try{
        const stamp=Date.now();
        const data=await jsonRequest(`/api/purchase-orders?_qmesFresh=${stamp}`);
        const rows=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];
        if(rows.length){
          try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(rows));}catch(_error){}
          window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
        }
        return rows;
      }catch(error){
        console.warn('[QMES purchase fresh] authoritative read failed',error?.message||error);
        return [];
      }finally{
        purchaseFetchPromise=null;
      }
    })();
    return purchaseFetchPromise;
  }

  function replacePurchaseRecord(records,rows){
    const list=Array.isArray(records)?records.slice():[];
    if(!rows.length) return list;
    const index=list.findIndex(record=>clean(record?.record_key)==='erp:purchase');
    const previous=index>=0?list[index]:{};
    const record={
      ...previous,
      record_type:'inventory',
      record_key:'erp:purchase',
      payload:{
        ...(previous?.payload&&typeof previous.payload==='object'?previous.payload:{}),
        module:'erp',kind:'purchase',schema:3,rows,
        updatedAt:new Date().toISOString(),
        updatedBy:'DB authoritative read'
      },
      updated_at:previous?.updated_at||new Date().toISOString()
    };
    if(index>=0) list[index]=record;
    else list.push(record);
    return list;
  }

  async function freshSyncList(type){
    const normalized=clean(type).toLowerCase();
    if(!allowedTypes.has(normalized)){
      if(originalList) return originalList(type);
      throw new Error('지원하지 않는 동기화 유형입니다.');
    }

    let records=[];
    try{
      const stamp=Date.now();
      const data=await jsonRequest(`/api/qmes-sync/${encodeURIComponent(normalized)}?_qmesFresh=${stamp}`);
      records=Array.isArray(data)?data:[];
    }catch(error){
      console.warn('[QMES sync fresh] read failed',normalized,error?.message||error);
      if(originalList){
        try{records=await originalList(type);}catch(_originalError){records=[];}
      }
    }

    if(normalized==='inventory'){
      const purchaseRows=await fetchPurchaseRows();
      if(purchaseRows.length) records=replacePurchaseRecord(records,purchaseRows);
    }
    return records;
  }

  window.qmesSyncList=freshSyncList;

  async function repairVisiblePurchasePage(){
    if(refreshRunning) return;
    const currentTab=(()=>{try{return sessionStorage.getItem('qmes_current_tab')||'';}catch(_error){return '';}})();
    if(currentTab!=='erpPurchase') return;
    const bodyText=clean(document.body?.innerText);
    const emptyVisible=bodyText.includes('등록된 신규 구매 발주가 없습니다')||bodyText.includes('총 0건');
    if(!emptyVisible) return;

    refreshRunning=true;
    try{
      const rows=await fetchPurchaseRows(true);
      if(!rows.length) return;
      try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(rows));}catch(_error){}

      /* Remount only the purchase tab once so React rereads the now-fresh rows. */
      const key='qmes-purchase-authoritative-remount-20260915';
      let already=false;
      try{already=sessionStorage.getItem(key)==='1';sessionStorage.setItem(key,'1');}catch(_error){}
      if(!already){
        window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'dash'}}));
        setTimeout(()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'erpPurchase'}})),80);
      }
    }finally{
      refreshRunning=false;
    }
  }

  const boot=()=>{
    setTimeout(repairVisiblePurchasePage,120);
    setTimeout(repairVisiblePurchasePage,700);
    setTimeout(repairVisiblePurchasePage,1800);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(repairVisiblePurchasePage,120));
})();
