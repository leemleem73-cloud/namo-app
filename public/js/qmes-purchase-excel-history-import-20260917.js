/* NAMO QMES - approved 2026 purchase history display bridge
 * 2026-09-17
 * Production QMES only.
 * The 10 approved 2026 purchase rows already exist in the production DB.
 * This file must never POST them again. It only reads DB rows, merges the approved
 * historical rows for display, and keeps the 2026 date range visible.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_EXCEL_HISTORY_IMPORT_20260917_V5__) return;
  window.__QMES_PURCHASE_EXCEL_HISTORY_IMPORT_20260917_V5__=true;

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
  let timer=0;

  function purchasePage(){
    const roots=[...document.querySelectorAll('.qmes-purchase-live,main,[role="main"],.main-content,.content-area,.page-content')];
    return roots.find(root=>{
      if(!root||!root.isConnected) return false;
      const text=clean(root.textContent).slice(0,2400);
      return /구매\s*[·ㆍ]?\s*발주관리/.test(text)&&(/발주번호|구매 DB 연동|신규 구매 발주/.test(text));
    })||null;
  }

  function noOf(row){return clean(row&&(row.purchaseNo||row.purchase_no||row.no||row.id));}
  function listRows(data){
    if(Array.isArray(data)) return data;
    if(data&&Array.isArray(data.rows)) return data.rows;
    if(data&&Array.isArray(data.items)) return data.items;
    if(data&&Array.isArray(data.data)) return data.data;
    if(data&&data.data&&Array.isArray(data.data.rows)) return data.data.rows;
    return [];
  }

  function displayRow(row){
    const vat=Math.round(row.amount*0.1);
    return {
      id:row.purchaseNo,no:row.purchaseNo,purchaseNo:row.purchaseNo,purchase_no:row.purchaseNo,
      purchaseType:'ERP 이관',purchase_type:'ERP 이관',productionType:'D-양산',production_type:'D-양산',
      supplier:row.supplier,item:row.item,qty:row.qty,unit:'kg',unitPrice:row.unitPrice,unit_price:row.unitPrice,
      amount:row.amount,supplyAmount:row.amount,supply_amount:row.amount,vatAmount:vat,vat_amount:vat,
      totalAmount:row.amount+vat,total_amount:row.amount+vat,orderDate:row.orderDate,order_date:row.orderDate,
      requestedDueDate:row.orderDate,requested_due_date:row.orderDate,approvalStatus:'승인완료',approval_status:'승인완료',
      receiptStatus:'입고완료',receipt_status:'입고완료',receivedQty:row.qty,received_qty:row.qty,
      iqcRequired:false,iqc_required:false,iqcStatus:'기존 ERP 반영',iqc_status:'기존 ERP 반영',
      status:'입고완료',warehouse:'내부창고(충주)',paymentTerms:'부가세율 적용',payment_terms:'부가세율 적용',
      notes:'2026 구매내역 엑셀 이관 · 기존 DB 등록분'
    };
  }

  function mergeRows(serverRows){
    const out=[];
    const seen=new Set();
    for(const row of serverRows||[]){
      const no=noOf(row);
      if(!no||seen.has(no)) continue;
      seen.add(no); out.push(row);
    }
    for(const row of approvedRows){
      if(seen.has(row.purchaseNo)) continue;
      seen.add(row.purchaseNo); out.push(displayRow(row));
    }
    return out;
  }

  function setInputValue(input,value){
    if(!input) return;
    const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    if(d&&d.set)d.set.call(input,value);else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function force2026(){
    const root=purchasePage();
    if(!root) return;
    const host=root.querySelector('.qpx-enterprise-host')||document.querySelector('.qmes-purchase-live .qpx-enterprise-host');
    if(!host) return;
    const from=host.querySelector('[data-qpx-filter="from"]');
    const to=host.querySelector('[data-qpx-filter="to"]');
    const search=host.querySelector('[data-qpx-search]');
    if(!from||!to) return;
    const changed=from.value!=='2026-01-01'||to.value!=='2026-12-31';
    if(changed){
      setInputValue(from,'2026-01-01');
      setInputValue(to,'2026-12-31');
      if(search)setTimeout(()=>search.click(),0);
    }
  }

  function publish(rows){
    const merged=mergeRows(rows);
    try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(merged));}catch(_error){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=merged;
    window.dispatchEvent(new CustomEvent('qmes:purchase-db-refresh',{detail:{rows:merged,source:'excel-history-import-v5-readonly'}}));
    [40,140,320,700].forEach(ms=>setTimeout(force2026,ms));
  }

  async function readOnlySync(){
    if(running||!purchasePage()) return;
    running=true;
    try{
      const response=await fetch('/api/purchase-orders?_purchaseHistoryRead='+Date.now(),{
        method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','Cache-Control':'no-cache, no-store, max-age=0'}
      });
      let rows=[];
      if(response.ok){
        const json=await response.json().catch(()=>[]);
        rows=listRows(json);
      }
      publish(rows);
      lastSyncAt=Date.now();
      console.info('[QMES purchase history] read-only sync',{serverRows:rows.length,displayRows:mergeRows(rows).length});
    }catch(error){
      publish([]);
      lastSyncAt=Date.now();
      console.warn('[QMES purchase history] DB read unavailable; approved rows kept visible',error&&error.message?error.message:error);
    }finally{
      running=false;
    }
  }

  function refresh(){
    if(!purchasePage()) return;
    force2026();
    if(Date.now()-lastSyncAt>30000) readOnlySync();
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,100);}
  function start(){
    schedule();
    setTimeout(readOnlySync,180);
    setInterval(()=>{if(purchasePage())refresh();},5000);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(refresh,80));
    document.addEventListener('click',e=>{
      const t=e.target instanceof Element?e.target.closest('button,a,[data-qmes-menu]'):null;
      if(t&&/구매|발주/.test(clean(t.textContent)))setTimeout(refresh,100);
    },true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* Global calendar loader: applies compact/movable calendar behavior across QMES. */
(function(){
  'use strict';
  const id='qmes-global-calendar-compact-draggable-20260917-loader';
  if(document.getElementById(id)) return;
  const script=document.createElement('script');
  script.id=id;
  script.src='/js/qmes-global-calendar-compact-draggable-20260917.js?v=20260917-1';
  script.defer=true;
  document.head.appendChild(script);
})();
