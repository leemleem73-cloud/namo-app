/* NAMO QMES - rebuild purchase history from user-supplied capture (2026-09-15)
 * Safe additive patch: does not replace core ERP or auth source files.
 * - Removes only the previously imported historical purchase IDs listed below.
 * - Recreates the 10 rows shown in the latest purchase capture.
 * - Renders a purchase-status table with the same business columns as the capture.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_CAPTURE_REBUILD_20260915__) return;
  window.__QMES_PURCHASE_CAPTURE_REBUILD_20260915__=true;

  const ALL_IMPORTED_IDS=[
    '2026-06-25-1','2026-06-08-2','2026-06-08-1','2026-05-15-1','2026-04-28-1','2026-04-14-1','2026-03-30-1','2026-01-26-1','2026-01-23-1','2026-01-13-1',
    '2025-12-03-1','2025-11-11-1','2025-11-10-1','2025-10-01-2','2025-10-01-1','2025-09-30-1','2025-09-16-2','2025-09-12-1'
  ];

  const CAPTURE_ROWS=[
    {purchaseNo:'2026-01-13-1',orderDate:'2026-01-13',item:'NMP(PUYANG GUANGMING CHEMICAL) [KG]',qty:3000,unitPrice:2950,amount:8850000,vat:885000,total:9735000,supplier:'(주)케미웍스'},
    {purchaseNo:'2026-01-23-1',orderDate:'2026-01-23',item:'NMP(SNET) [KG]',qty:2000,unitPrice:0,amount:6350561,vat:635056,total:6985617,supplier:'모리토루 케미칼즈 한국 주식회사'},
    {purchaseNo:'2026-01-26-1',orderDate:'2026-01-26',item:'AOH30(Boehmite) [KG]',qty:300,unitPrice:9700,amount:2910000,vat:291000,total:3201000,supplier:'강신산업(주)'},
    {purchaseNo:'2026-03-30-1',orderDate:'2026-03-30',item:'ADC30G(SBR) [KG]',qty:300,unitPrice:11237,amount:3371100,vat:337110,total:3708210,supplier:'LG Chemical'},
    {purchaseNo:'2026-04-14-1',orderDate:'2026-04-14',item:'Solef5130(PVdF)',qty:40,unitPrice:36448,amount:1457920,vat:145792,total:1603712,supplier:'한국 사이언스코(주)'},
    {purchaseNo:'2026-04-28-1',orderDate:'2026-04-28',item:'SBS(KTR-201) [KG]',qty:50,unitPrice:29522,amount:1476100,vat:147610,total:1623710,supplier:'금호석유화학(주)'},
    {purchaseNo:'2026-05-15-1',orderDate:'2026-05-15',item:'Solef5140 [KG]',qty:20,unitPrice:36649,amount:732980,vat:73298,total:806278,supplier:'한국 사이언스코(주)'},
    {purchaseNo:'2026-06-08-1',orderDate:'2026-06-08',item:'Solef5140 [KG]',qty:20,unitPrice:36649,amount:732980,vat:73298,total:806278,supplier:'한국 사이언스코(주)'},
    {purchaseNo:'2026-06-08-2',orderDate:'2026-06-08',item:'ADC30G(SBR) [KG]',qty:300,unitPrice:11237,amount:3371100,vat:337110,total:3708210,supplier:'LG화학'},
    {purchaseNo:'2026-06-25-1',orderDate:'2026-06-25',item:'SBS(KTR-201) [KG]',qty:50,unitPrice:30700,amount:1535000,vat:153500,total:1688500,supplier:'금호석유화학(주)'}
  ];

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const money=v=>Number(v||0).toLocaleString('ko-KR');
  const idOf=row=>clean(row&&(row.purchaseNo||row.no||row.id));
  let rebuilding=false;
  let renderedSignature='';

  async function request(url,options){
    const response=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},options||{}));
    const payload=await response.json().catch(()=>({success:false,message:'HTTP '+response.status}));
    if(!response.ok||(payload&&payload.success===false)){
      const error=new Error((payload&&payload.message)||('요청 실패 ('+response.status+')'));
      error.status=response.status;
      throw error;
    }
    return payload&&Object.prototype.hasOwnProperty.call(payload,'data')?payload.data:payload;
  }

  async function loadDbRows(){
    const data=await request('/api/purchase-orders?_capture='+Date.now(),{
      headers:{'Accept':'application/json','Cache-Control':'no-cache, no-store, max-age=0','Pragma':'no-cache'}
    });
    return Array.isArray(data)?data:(data&&Array.isArray(data.rows)?data.rows:[]);
  }

  function sameCapture(existing){
    const map=new Map(existing.map(row=>[idOf(row),row]));
    if(ALL_IMPORTED_IDS.some(id=>id.startsWith('2025-')&&map.has(id))) return false;
    return CAPTURE_ROWS.every(target=>{
      const row=map.get(target.purchaseNo);
      if(!row) return false;
      return clean(row.supplier)===target.supplier&&clean(row.item||row.material)===target.item&&Number(row.qty||0)===target.qty&&Number(row.amount||0)===target.amount;
    });
  }

  async function deleteImported(existing){
    const currentIds=new Set(existing.map(idOf));
    for(const id of ALL_IMPORTED_IDS){
      if(!currentIds.has(id)) continue;
      try{
        await request('/api/purchase-orders/'+encodeURIComponent(id),{method:'DELETE'});
      }catch(error){
        if(error.status!==404) throw error;
      }
    }
  }

  async function createCaptureRows(){
    for(const row of CAPTURE_ROWS){
      const body={
        purchaseNo:row.purchaseNo,
        purchaseType:'ERP 이관',
        productionType:'D-양산',
        orderDate:row.orderDate,
        supplier:row.supplier,
        item:row.item,
        material:row.item,
        qty:row.qty,
        unit:'kg',
        unitPrice:row.unitPrice,
        amount:row.amount,
        warehouse:'',
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
        notes:'구매현황 캡처 기준 재등록 · 공급가액 '+money(row.amount)+'원 · 부가세 '+money(row.vat)+'원 · 합계 '+money(row.total)+'원'
      };
      await request('/api/purchase-orders',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(body)
      });
    }
  }

  async function rebuildIfNeeded(){
    if(rebuilding) return null;
    rebuilding=true;
    try{
      let rows=await loadDbRows();
      if(!sameCapture(rows)){
        await deleteImported(rows);
        await createCaptureRows();
        rows=await loadDbRows();
        try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(rows));}catch(_error){}
        window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'purchase',source:'capture-rebuild'}}));
      }
      return rows;
    }catch(error){
      console.error('[QMES purchase capture rebuild] failed',error);
      return null;
    }finally{
      rebuilding=false;
    }
  }

  function monthLabel(date){return clean(date).slice(0,7).replace('-','/');}
  function captureFromDb(rows){
    const map=new Map((rows||[]).map(row=>[idOf(row),row]));
    return CAPTURE_ROWS.map(target=>{
      const row=map.get(target.purchaseNo)||target;
      return Object.assign({},target,row,{
        purchaseNo:target.purchaseNo,
        orderDate:target.orderDate,
        supplier:target.supplier,
        item:target.item,
        qty:target.qty,
        unitPrice:target.unitPrice,
        amount:target.amount,
        vat:target.vat,
        total:target.total
      });
    });
  }

  function tableHtml(rows){
    const groups=[];
    for(const row of rows){
      const month=monthLabel(row.orderDate);
      let group=groups[groups.length-1];
      if(!group||group.month!==month){group={month,rows:[]};groups.push(group);}
      group.rows.push(row);
    }
    let body='';
    let totalQty=0,totalPrice=0,totalSupply=0,totalVat=0,totalSum=0;
    groups.forEach(group=>{
      group.rows.forEach(row=>{
        totalQty+=row.qty; totalPrice+=row.unitPrice; totalSupply+=row.amount; totalVat+=row.vat; totalSum+=row.total;
        body+=`<tr><td class="qpc-no">${row.purchaseNo.replace(/-/g,'/').replace(/\/(\d+)$/,' -$1')}</td><td>${row.item}</td><td class="num">${money(row.qty)}</td><td class="num">${row.unitPrice?money(row.unitPrice):''}</td><td class="num">${money(row.amount)}</td><td class="num">${money(row.vat)}</td><td class="num">${money(row.total)}</td><td>${row.supplier}</td></tr>`;
      });
      const qty=group.rows.reduce((s,r)=>s+r.qty,0),price=group.rows.reduce((s,r)=>s+r.unitPrice,0),supply=group.rows.reduce((s,r)=>s+r.amount,0),vat=group.rows.reduce((s,r)=>s+r.vat,0),sum=group.rows.reduce((s,r)=>s+r.total,0);
      body+=`<tr class="qpc-month"><td></td><td>${group.month} 계</td><td class="num">${money(qty)}</td><td class="num">${money(price)}</td><td class="num">${money(supply)}</td><td class="num">${money(vat)}</td><td class="num">${money(sum)}</td><td></td></tr>`;
    });
    body+=`<tr class="qpc-total"><td></td><td>총합계</td><td class="num">${money(totalQty)}</td><td class="num">${money(totalPrice)}</td><td class="num">${money(totalSupply)}</td><td class="num">${money(totalVat)}</td><td class="num">${money(totalSum)}</td><td></td></tr>`;
    return `<div class="qpc-wrap"><div class="qpc-title">구매현황</div><div class="qpc-scroll"><table class="qpc-table"><thead><tr><th>일자-No.</th><th>품목명(규격)</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>합계</th><th>거래처명</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  }

  function ensureStyle(){
    if(document.getElementById('qmes-purchase-capture-style-20260915')) return;
    const style=document.createElement('style');
    style.id='qmes-purchase-capture-style-20260915';
    style.textContent=`
      .qpc-wrap{margin:12px 0 16px;border:1px solid #d8e1e8;border-radius:10px;background:#fff;overflow:hidden}.qpc-title{padding:12px 14px;border-bottom:1px solid #dfe6ec;font-size:15px;font-weight:900;color:#172033}.qpc-scroll{overflow:auto}.qpc-table{width:100%;min-width:1050px;border-collapse:collapse;font-size:12px}.qpc-table th{height:44px;padding:0 10px;border:1px solid #d9e1e7;background:#f4f6f8;text-align:center;color:#111827;font-weight:900}.qpc-table td{padding:9px 10px;border:1px solid #e1e7ec;color:#172033;background:#fff}.qpc-table td.num{text-align:right;font-variant-numeric:tabular-nums}.qpc-table .qpc-no{color:#2356a8;text-align:center;white-space:nowrap}.qpc-table .qpc-month td{background:#f7f7f7;font-weight:900}.qpc-table .qpc-total td{background:#fafafa;font-weight:950;font-size:13px}.qpc-table td:nth-child(2){min-width:280px}.qpc-table td:nth-child(8){min-width:190px}
    `;
    document.head.appendChild(style);
  }

  function purchaseRoot(){
    return document.querySelector('.qmes-purchase-live,.qp-root')||Array.from(document.querySelectorAll('#root main,#root .qerp')).find(node=>/구매\s*[·ㆍ]?\s*발주관리/.test(clean(node.textContent)));
  }

  function render(rows){
    ensureStyle();
    const root=purchaseRoot();
    if(!root||!rows) return;
    const captureRows=captureFromDb(rows);
    const signature=JSON.stringify(captureRows.map(r=>[r.purchaseNo,r.amount,r.supplier]));
    let host=root.querySelector('.qmes-purchase-capture-host');
    if(!host){
      host=document.createElement('div');
      host.className='qmes-purchase-capture-host';
      const flow=root.querySelector('.qp-flow');
      const kpis=root.querySelector('.qp-kpis');
      const anchor=kpis||flow||root.firstElementChild;
      if(anchor&&anchor.parentNode) anchor.insertAdjacentElement('afterend',host); else root.prepend(host);
    }
    if(renderedSignature!==signature||!host.innerHTML){host.innerHTML=tableHtml(captureRows);renderedSignature=signature;}
  }

  async function apply(){
    if(!purchaseRoot()) return;
    const rows=await rebuildIfNeeded();
    if(rows) render(rows);
  }

  function schedule(){setTimeout(apply,100);setTimeout(apply,800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('qmes:navigate-tab',schedule);
  document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('#qmes-erp-sidebar'))setTimeout(schedule,80);},true);
})();
