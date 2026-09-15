/* NAMO QMES - purchase creation DB fix (safe additive patch, 2026-09-15)
 * Core ERP purchase source is left untouched.
 * When the existing purchase form saves erp:purchase through qmesSyncUpsert,
 * mirror only newly-created purchase rows into the authoritative purchase_orders API.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_CREATE_DB_FIX_20260915__) return;
  window.__QMES_PURCHASE_CREATE_DB_FIX_20260915__=true;

  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
  const rowNo=row=>clean(row&&((row.purchaseNo)||(row.no)||(row.id)));
  const isRecent=row=>{
    const stamp=Date.parse(row&&row.createdAt||'');
    return Number.isFinite(stamp)&&Math.abs(Date.now()-stamp)<=120000;
  };

  async function apiJson(url,options){
    const response=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},options||{}));
    const result=await response.json().catch(()=>({success:false,message:'HTTP '+response.status}));
    if(!response.ok||(result&&result.success===false)){
      const error=new Error((result&&result.message)||('요청 실패 ('+response.status+')'));
      error.status=response.status;
      throw error;
    }
    return result&&Object.prototype.hasOwnProperty.call(result,'data')?result.data:result;
  }

  async function currentDbIds(){
    const data=await apiJson('/api/purchase-orders?_qmesFresh='+Date.now(),{
      headers:{
        'Accept':'application/json',
        'Cache-Control':'no-cache, no-store, max-age=0',
        'Pragma':'no-cache'
      }
    });
    const rows=Array.isArray(data)?data:(data&&Array.isArray(data.rows)?data.rows:[]);
    return {rows,ids:new Set(rows.map(rowNo).filter(Boolean))};
  }

  async function mirrorNewRows(payload){
    if(!payload||!Array.isArray(payload.rows)) return payload;
    const snapshot=await currentDbIds();
    const candidates=payload.rows.filter(row=>{
      const id=rowNo(row);
      return id&&!snapshot.ids.has(id)&&isRecent(row);
    });
    if(!candidates.length) return payload;

    const rows=payload.rows.slice();
    for(const candidate of candidates){
      const id=rowNo(candidate);
      try{
        const saved=await apiJson('/api/purchase-orders',{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify(candidate)
        });
        const serverRow=saved&&typeof saved==='object'?saved:candidate;
        const index=rows.findIndex(row=>rowNo(row)===id);
        if(index>=0) rows[index]=Object.assign({},candidate,serverRow);
        snapshot.ids.add(rowNo(serverRow)||id);
        snapshot.rows.unshift(serverRow);
      }catch(error){
        console.error('[QMES purchase create] DB registration failed',id,error);
        window.alert('구매 발주 등록 실패: '+(error&&error.message?error.message:'공용 DB 저장 오류'));
        throw error;
      }
    }

    try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(rows));}catch(_error){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=snapshot.rows;
    return Object.assign({},payload,{rows});
  }

  function wrap(){
    const original=window.qmesSyncUpsert;
    if(typeof original!=='function'||original.__QMES_PURCHASE_CREATE_DB_WRAPPED__) return;

    const wrapped=async function(type,key,payload){
      const normalizedType=clean(type).toLowerCase();
      const normalizedKey=clean(key);
      let nextPayload=payload;
      if(normalizedType==='inventory'&&normalizedKey==='erp:purchase'){
        nextPayload=await mirrorNewRows(payload);
      }
      return original.call(this,type,key,nextPayload);
    };
    wrapped.__QMES_PURCHASE_CREATE_DB_WRAPPED__=true;
    wrapped.__QMES_PURCHASE_CREATE_DB_SOURCE__=original;
    window.qmesSyncUpsert=wrapped;
  }

  wrap();
  let count=0;
  const timer=setInterval(()=>{
    wrap();
    count+=1;
    if(count>=20) clearInterval(timer);
  },250);
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(wrap,0));
})();
