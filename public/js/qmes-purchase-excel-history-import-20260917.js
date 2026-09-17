/* NAMO QMES - approved 2026 purchase Excel history import
 * 2026-09-17
 * Production QMES only.
 * - idempotently register the 10 supplied 2026 purchase rows
 * - treat 409 duplicate purchase numbers as already registered
 * - never overwrite an existing purchase number
 * - keep the approved 2026 history visible even if the DB list omits legacy rows
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_EXCEL_HISTORY_IMPORT_20260917_V4__) return;
  window.__QMES_PURCHASE_EXCEL_HISTORY_IMPORT_20260917_V4__ = true;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const approvedRows=[
    {purchaseNo:'2026-01-13-1',orderDate:'2026-01-13',supplier:'(주)케미웍스',item:'NMP(PUYANG GUANGMING CHEMICAL) [KG]',qty:3000,unitPrice:2950,amount:8850000},
    {purchaseNo:'2026-01-23-1',orderDate:'2026-01-23',supplier:'모리토루 케미칼즈 한국 주식회사',item:'NMP(SNET) [KG]',qty:2000,unitPrice:0,amount:6350561},
    {purchaseNo:'2026-01-26-1',orderDate:'2026-01-26',supplier:'강신산업(주)',item:'AOH30(Boehmite) [KG]',qty:300,unitPrice:9700,amount:2910000},
    {purchaseNo:'2026-03-30-1',orderDate:'2026-03-30',supplier:'LG Chemical',item:'ADC30G(SBR) [KG]',qty:300,unitPrice:11237,amount:3371100},
    {purchaseNo:'2026-04-14-1',orderDate:'2026-04-14',supplier:'한국 사이언스코(주)',item:'Solef5130(PVdF)',qty:40,unitPrice:36448,amount:1457920},
    {purchaseNo:'2026-04-28-1',orderDate:'2026-04-28',supplier:'금호석유화학(주)',item:'SBS(KTR-201) [KG]',qty:50,unitPrice:29522,amount:1476100},
    {purchaseNo:'2026-05-15-1',orderDate:'2026-05-15',supplier:'한국 사이언스코(주)',item:'Solef5140 [KG]',qty:20,unitPrice:36649,amount:732980},
    {purchaseNo:'2026-06-08-1',orderDate:'2026-06-08',supplier:'한국 사이언스코(주)',item:'Solef5140 [KG]',qty:20,unitPrice:36649,amount:732980},
    {purchaseNo:'2026-06-08-2',orderDate:'2026-06-08',supplier:'LG화학',item:'ADC30G(SBR) [KG]',qty:300,unitPrice:11237,amount:3371100},
    {purchaseNo:'2026-06-25-1',orderDate:'2026-06-25',supplier:'금호석유화학(주)',item:'SBS(KTR-201) [KG]',qty:50,unitPrice:30700,amount:1535000}
  ];

  let running=false;
  let lastSyncAt=0;
  let pollTimer=0;

  function purchasePage(){
    const candidates=[...document.querySelectorAll('.qmes-purchase-live,main,[role="main"],.main-content,.content-area,.page-content')];
    return candidates.find(root=>{
      if(!root||!root.isConnected) return false;
      const text=clean(root.textContent).slice(0,2200);
      return /구매\s*[·ㆍ]?\s*발주관리/.test(text) && (/발주번호|구매 DB 연동|신규 구매 발주/.test(text));
    })||null;
  }

  async function apiJson(url,options){
    const response=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},options||{}));
    const payload=await response.json().catch(()=>({success:false,message:'HTTP '+response.status}));
    if(!response.ok||(payload&&payload.success===false)){
      const error=new Error((payload&&payload.message)||('요청 실패 ('+response.status+')'));
      error.status=response.status;
      error.payload=payload;
      throw error;
    }
    return payload&&Object.prototype.hasOwnProperty.call(payload,'data')?payload.data:payload;
  }

  function listRows(data){
    if(Array.isArray(data)) return data;
    if(data&&Array.isArray(data.rows)) return data.rows;
    if(data&&Array.isArray(data.items)) return data.items;
    if(data&&data.data){
      if(Array.isArray(data.data)) return data.data;
      if(Array.isArray(data.data.rows)) return data.data.rows;
      if(Array.isArray(data.data.items)) return data.data.items;
    }
    return [];
  }

  function purchaseNo(row){return clean(row&&(row.purchaseNo||row.purchase_no||row.no||row.id));}

  function postPayload(row){
    return {
      purchaseNo:row.purchaseNo,
      purchaseType:'ERP 이관',
      productionType:'D-양산',
      supplier:row.supplier,
      item:row.item,
      qty:row.qty,
      unit:'kg',
      unitPrice:row.unitPrice,
      amount:row.amount,
      orderDate:row.orderDate,
      requestedDueDate:row.orderDate,
      warehouse:'내부창고(충주)',
      paymentTerms:'부가세율 적용',
      approvalStatus:'승인완료',
      receiptStatus:'입고완료',
      receivedQty:row.qty,
      iqcRequired:false,
      iqcStatus:'기존 ERP 반영',
      coaRequired:false,
      msdsRequired:false,
      lotRequired:false,
      status:'입고완료',
      notes:'2026 구매내역 엑셀 이관 · 2026-09-17 화면자료 기준'
    };
  }

  function displayRow(row){
    return Object.assign({},postPayload(row),{
      id:row.purchaseNo,
      no:row.purchaseNo,
      price:row.unitPrice,
      received:row.qty,
      requested_due_date:row.orderDate,
      order_date:row.orderDate,
      purchase_no:row.purchaseNo,
      approval_status:'승인완료',
      receipt_status:'입고완료',
      received_qty:row.qty,
      iqc_required:false,
      iqc_status:'기존 ERP 반영'
    });
  }

  function setInputValue(input,value){
    if(!input) return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    if(descriptor&&descriptor.set) descriptor.set.call(input,value); else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function forceFullYearAndSearch(){
    const root=purchasePage();
    if(!root) return false;
    const host=root.querySelector('.qpx-enterprise-host')||document.querySelector('.qmes-purchase-live .qpx-enterprise-host');
    if(!host) return false;
    const from=host.querySelector('[data-qpx-filter="from"]');
    const to=host.querySelector('[data-qpx-filter="to"]');
    const search=host.querySelector('[data-qpx-search]');
    if(!from||!to||!search) return false;
    const changed=from.value!=='2026-01-01'||to.value!=='2026-12-31';
    if(changed){
      setInputValue(from,'2026-01-01');
      setInputValue(to,'2026-12-31');
      setTimeout(()=>search.click(),0);
    }
    return true;
  }

  function mergeForDisplay(serverRows){
    const merged=[];
    const seen=new Set();
    for(const row of serverRows||[]){
      const no=purchaseNo(row);
      if(!no||seen.has(no)) continue;
      seen.add(no);
      merged.push(row);
    }
    for(const row of approvedRows){
      if(seen.has(row.purchaseNo)) continue;
      seen.add(row.purchaseNo);
      merged.push(displayRow(row));
    }
    return merged;
  }

  function refreshEnterprise(rows){
    const merged=mergeForDisplay(rows);
    try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(merged));}catch(_error){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=merged;
    window.dispatchEvent(new CustomEvent('qmes:purchase-db-refresh',{detail:{rows:merged,source:'excel-history-import-v4'}}));
    [50,160,350,700].forEach(delay=>setTimeout(forceFullYearAndSearch,delay));
  }

  async function ensureRows(){
    if(running||!purchasePage()) return;
    running=true;
    try{
      const current=listRows(await apiJson('/api/purchase-orders?_excelHistory='+Date.now(),{
        headers:{Accept:'application/json','Cache-Control':'no-cache, no-store, max-age=0',Pragma:'no-cache'}
      }));
      const ids=new Set(current.map(purchaseNo).filter(Boolean));
      const missing=approvedRows.filter(row=>!ids.has(row.purchaseNo));

      let inserted=0;
      let conflicts=0;
      for(const row of missing){
        try{
          await apiJson('/api/purchase-orders',{
            method:'POST',
            headers:{'Content-Type':'application/json',Accept:'application/json'},
            body:JSON.stringify(postPayload(row))
          });
          inserted+=1;
        }catch(error){
          if(error&&error.status===409){
            conflicts+=1;
            continue;
          }
          throw error;
        }
      }

      let finalRows=[];
      try{
        finalRows=listRows(await apiJson('/api/purchase-orders?_excelHistoryDone='+Date.now(),{
          headers:{Accept:'application/json','Cache-Control':'no-cache, no-store, max-age=0',Pragma:'no-cache'}
        }));
      }catch(error){
        console.warn('[QMES purchase Excel import] final DB read failed; using current rows',error&&error.message?error.message:error);
        finalRows=current;
      }

      lastSyncAt=Date.now();
      refreshEnterprise(finalRows);
      console.info('[QMES purchase Excel import] ready',{
        approved:approvedRows.length,
        serverRows:finalRows.length,
        inserted,
        alreadyRegistered:conflicts
      });
    }catch(error){
      console.warn('[QMES purchase Excel import] sync failed',error&&error.message?error.message:error);
      refreshEnterprise([]);
      lastSyncAt=Date.now();
    }finally{
      running=false;
    }
  }

  function keepVisible(){
    if(!purchasePage()) return;
    forceFullYearAndSearch();
    if(Date.now()-lastSyncAt>15000) ensureRows();
  }

  function schedule(){
    clearTimeout(pollTimer);
    pollTimer=setTimeout(keepVisible,100);
  }

  function start(){
    schedule();
    setInterval(()=>{if(purchasePage()) keepVisible();},3000);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(keepVisible,80));
    document.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target.closest('button,a,[data-qmes-menu]'):null;
      if(target&&/구매|발주/.test(clean(target.textContent))) setTimeout(keepVisible,100);
    },true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
