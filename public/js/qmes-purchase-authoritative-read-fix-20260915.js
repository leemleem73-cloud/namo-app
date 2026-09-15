/* NAMO QMES - authoritative purchase-order read fix V2 (2026-09-15)
 * - Bypass stale /api/qmes-sync/inventory browser cache.
 * - Read purchase rows from the authoritative /api/purchase-orders API.
 * - If the purchase page is already mounted with an empty legacy snapshot,
 *   remount the tab after the fresh rows are loaded so React reads the DB rows.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_AUTHORITATIVE_READ_FIX_20260915_V2__) return;
  window.__QMES_PURCHASE_AUTHORITATIVE_READ_FIX_20260915_V2__=true;

  const originalList=typeof window.qmesSyncList==='function'?window.qmesSyncList:null;
  const allowedTypes=new Set(['iqc','pqc','oqc','workorder','equipment','inventory']);
  const LOCAL_KEY='qmes-erp-purchase-v1';
  const REMOUNT_KEY='qmes-purchase-authoritative-remount-v2';
  let purchaseFetchPromise=null;
  let refreshRunning=false;

  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();

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
    const payload=await response.json().catch(()=>({success:false,message:'HTTP '+response.status}));
    if(response.status===401){
      try{sessionStorage.removeItem('qmes-current-user-v1');}catch(_error){}
      throw new Error((payload&&payload.message)||'로그인 세션이 만료되었습니다.');
    }
    if(!response.ok||(payload&&payload.success===false)) throw new Error((payload&&payload.message)||('공용 DB 요청 실패 ('+response.status+')'));
    return payload&&Object.prototype.hasOwnProperty.call(payload,'data')?payload.data:payload;
  }

  async function fetchPurchaseRows(force){
    if(purchaseFetchPromise&&!force) return purchaseFetchPromise;
    purchaseFetchPromise=(async()=>{
      try{
        const data=await jsonRequest('/api/purchase-orders?_qmesFresh='+Date.now());
        const rows=Array.isArray(data)?data:(data&&Array.isArray(data.rows)?data.rows:[]);
        if(rows.length){
          try{localStorage.setItem(LOCAL_KEY,JSON.stringify(rows));}catch(_error){}
          window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
        }
        return rows;
      }catch(error){
        console.warn('[QMES purchase fresh] authoritative read failed',error&&error.message?error.message:error);
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
    const index=list.findIndex(record=>clean(record&&record.record_key)==='erp:purchase');
    const previous=index>=0?list[index]:{};
    const previousPayload=previous&&previous.payload&&typeof previous.payload==='object'?previous.payload:{};
    const record=Object.assign({},previous,{
      record_type:'inventory',
      record_key:'erp:purchase',
      payload:Object.assign({},previousPayload,{
        module:'erp',kind:'purchase',schema:3,rows:rows,
        updatedAt:new Date().toISOString(),
        updatedBy:'DB authoritative read'
      }),
      updated_at:previous.updated_at||new Date().toISOString()
    });
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
      const data=await jsonRequest('/api/qmes-sync/'+encodeURIComponent(normalized)+'?_qmesFresh='+Date.now());
      records=Array.isArray(data)?data:[];
    }catch(error){
      console.warn('[QMES sync fresh] read failed',normalized,error&&error.message?error.message:error);
      if(originalList){
        try{records=await originalList(type);}catch(_originalError){records=[];}
      }
    }

    if(normalized==='inventory'){
      const purchaseRows=await fetchPurchaseRows(false);
      if(purchaseRows.length) records=replacePurchaseRecord(records,purchaseRows);
    }
    return records;
  }

  window.qmesSyncList=freshSyncList;

  function purchasePageVisible(){
    try{
      if(sessionStorage.getItem('qmes_current_tab')==='erpPurchase') return true;
    }catch(_error){}
    const headings=Array.from(document.querySelectorAll('#root h1,#root h2,.qerp-title'));
    return headings.some(node=>/구매\s*[·ㆍ]?\s*발주관리/.test(clean(node.textContent)));
  }

  function emptyPurchasePageVisible(){
    const text=clean(document.body&&document.body.innerText);
    return text.indexOf('등록된 신규 구매 발주가 없습니다')>=0||/총\s*0건/.test(text);
  }

  function remountPurchaseTab(){
    let attempts=0;
    try{attempts=Number(sessionStorage.getItem(REMOUNT_KEY)||0)||0;}catch(_error){}
    if(attempts>=2) return false;
    try{sessionStorage.setItem(REMOUNT_KEY,String(attempts+1));}catch(_error){}
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'dash'}}));
    setTimeout(function(){
      window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'erpPurchase'}}));
    },140);
    return true;
  }

  async function repairVisiblePurchasePage(){
    if(refreshRunning||!purchasePageVisible()||!emptyPurchasePageVisible()) return;
    refreshRunning=true;
    try{
      const rows=await fetchPurchaseRows(true);
      if(!rows.length) return;
      try{localStorage.setItem(LOCAL_KEY,JSON.stringify(rows));}catch(_error){}
      remountPurchaseTab();
    }finally{
      refreshRunning=false;
    }
  }

  function scheduleRepair(){
    setTimeout(repairVisiblePurchasePage,120);
    setTimeout(repairVisiblePurchasePage,650);
    setTimeout(repairVisiblePurchasePage,1600);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scheduleRepair,{once:true});
  else scheduleRepair();
  window.addEventListener('qmes:navigate-tab',scheduleRepair);
})();
