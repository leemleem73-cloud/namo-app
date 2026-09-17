/* NAMO QMES - approved 2026 purchase Excel history import
 * 2026-09-17
 * Purpose:
 * - idempotently register the 10 purchase rows supplied from the 2026 Excel ledger
 * - refresh the authoritative purchase DB view after import
 * - open purchase management with the full 2026 date range so the imported rows are visible
 * Existing rows are never overwritten: only missing purchase numbers are POSTed.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_EXCEL_HISTORY_IMPORT_20260917__) return;
  window.__QMES_PURCHASE_EXCEL_HISTORY_IMPORT_20260917__ = true;

  const IMPORT_KEY='qmes-purchase-excel-history-import-20260917-v1';
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
  let attempts=0;
  let timer=0;

  function purchasePageVisible(){
    const root=document.querySelector('.qmes-purchase-live');
    if(!root) return false;
    const text=clean(root.textContent).slice(0,1800);
    return /구매/.test(text)&&/발주/.test(text);
  }

  async function apiJson(url,options){
    const response=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},options||{}));
    const payload=await response.json().catch(()=>({success:false,message:'HTTP '+response.status}));
    if(!response.ok||(payload&&payload.success===false)){
      const error=new Error((payload&&payload.message)||('요청 실패 ('+response.status+')'));
      error.status=response.status;
      throw error;
    }
    return payload&&Object.prototype.hasOwnProperty.call(payload,'data')?payload.data:payload;
  }

  function listRows(data){
    if(Array.isArray(data)) return data;
    if(data&&Array.isArray(data.rows)) return data.rows;
    if(data&&Array.isArray(data.items)) return data.items;
    return [];
  }

  function purchaseNo(row){
    return clean(row&&(row.purchaseNo||row.purchase_no||row.no||row.id));
  }

  function payload(row){
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

  function show2026Range(){
    const host=document.querySelector('.qmes-purchase-live .qpx-enterprise-host');
    if(!host) return false;
    const from=host.querySelector('[data-qpx-filter="from"]');
    const to=host.querySelector('[data-qpx-filter="to"]');
    const search=host.querySelector('[data-qpx-search]');
    if(!from||!to||!search) return false;
    if(from.value!=='2026-01-01'||to.value!=='2026-12-31'){
      from.value='2026-01-01';
      to.value='2026-12-31';
      search.click();
    }
    return true;
  }

  function refreshEnterpriseView(rows){
    try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(rows));}catch(_error){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
    const sync=document.querySelector('.qmes-purchase-live .qpx-enterprise-host [data-qpx-sync]');
    if(sync&&!sync.disabled) sync.click();
    setTimeout(show2026Range,120);
    setTimeout(show2026Range,450);
    setTimeout(show2026Range,900);
  }

  async function ensureApprovedRows(){
    if(running||!purchasePageVisible()) return;
    running=true;
    attempts+=1;
    try{
      const current=listRows(await apiJson('/api/purchase-orders?_qmesExcelImport='+Date.now(),{
        headers:{'Accept':'application/json','Cache-Control':'no-cache, no-store, max-age=0','Pragma':'no-cache'}
      }));
      const ids=new Set(current.map(purchaseNo).filter(Boolean));
      const missing=approvedRows.filter(row=>!ids.has(row.purchaseNo));

      for(const row of missing){
        await apiJson('/api/purchase-orders',{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify(payload(row))
        });
      }

      const finalRows=listRows(await apiJson('/api/purchase-orders?_qmesExcelImportDone='+Date.now(),{
        headers:{'Accept':'application/json','Cache-Control':'no-cache, no-store, max-age=0','Pragma':'no-cache'}
      }));
      const finalIds=new Set(finalRows.map(purchaseNo).filter(Boolean));
      const unresolved=approvedRows.filter(row=>!finalIds.has(row.purchaseNo));
      if(unresolved.length) throw new Error('미등록 발주 '+unresolved.map(row=>row.purchaseNo).join(', '));

      try{sessionStorage.setItem(IMPORT_KEY,'ok');}catch(_error){}
      refreshEnterpriseView(finalRows);
      console.info('[QMES purchase Excel import] ensured',approvedRows.length,'rows; inserted',missing.length);
    }catch(error){
      console.warn('[QMES purchase Excel import] registration failed',error&&error.message?error.message:error);
      if(attempts<3){
        clearTimeout(timer);
        timer=setTimeout(ensureApprovedRows,1200*attempts);
      }
    }finally{
      running=false;
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(!purchasePageVisible()) return;
      let done=false;
      try{done=sessionStorage.getItem(IMPORT_KEY)==='ok';}catch(_error){}
      if(done){
        show2026Range();
        return;
      }
      ensureApprovedRows();
    },100);
  }

  function start(){
    schedule();
    window.addEventListener('qmes:navigate-tab',schedule);
    document.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target.closest('button,a,[data-qmes-menu]'):null;
      if(target&&/구매|발주/.test(clean(target.textContent))) setTimeout(schedule,120);
    },true);
    new MutationObserver(()=>{
      if(purchasePageVisible()) schedule();
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
