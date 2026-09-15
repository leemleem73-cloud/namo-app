/* NAMO QMES - premium purchase overview + IQC navigation (2026-09-15)
 * Safe additive patch. Core ERP source is not overwritten.
 * - Keeps the shared purchase-order DB as the authoritative live source.
 * - Falls back to the verified historical capture rows if the DB is unavailable.
 * - Rebuilds only the historical imported purchase IDs in the background.
 * - Clicking a purchase date/order number opens Incoming Inspection (IQC).
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_CAPTURE_REBUILD_20260915_V3__) return;
  window.__QMES_PURCHASE_CAPTURE_REBUILD_20260915_V3__=true;

  const STYLE_ID='qmes-purchase-capture-style-20260915-v3';
  const YEAR=String(new Date().getFullYear());
  const ALL_IMPORTED_IDS=[
    '2026-06-25-1','2026-06-08-2','2026-06-08-1','2026-05-15-1','2026-04-28-1','2026-04-14-1','2026-03-30-1','2026-01-26-1','2026-01-23-1','2026-01-13-1',
    '2025-12-03-1','2025-11-11-1','2025-11-10-1','2025-10-01-2','2025-10-01-1','2025-09-30-1','2025-09-16-2','2025-09-12-1'
  ];

  const CAPTURE_ROWS=[
    {purchaseNo:'2026-01-13-1',orderDate:'2026-01-13',purchaseType:'ERP 이관',item:'NMP(PUYANG GUANGMING CHEMICAL) [KG]',qty:3000,unitPrice:2950,amount:8850000,vat:885000,total:9735000,supplier:'(주)케미웍스',receiptStatus:'입고완료'},
    {purchaseNo:'2026-01-23-1',orderDate:'2026-01-23',purchaseType:'ERP 이관',item:'NMP(SNET) [KG]',qty:2000,unitPrice:0,amount:6350561,vat:635056,total:6985617,supplier:'모리토루 케미칼즈 한국 주식회사',receiptStatus:'입고완료'},
    {purchaseNo:'2026-01-26-1',orderDate:'2026-01-26',purchaseType:'ERP 이관',item:'AOH30(Boehmite) [KG]',qty:300,unitPrice:9700,amount:2910000,vat:291000,total:3201000,supplier:'강신산업(주)',receiptStatus:'입고완료'},
    {purchaseNo:'2026-03-30-1',orderDate:'2026-03-30',purchaseType:'ERP 이관',item:'ADC30G(SBR) [KG]',qty:300,unitPrice:11237,amount:3371100,vat:337110,total:3708210,supplier:'LG Chemical',receiptStatus:'입고완료'},
    {purchaseNo:'2026-04-14-1',orderDate:'2026-04-14',purchaseType:'ERP 이관',item:'Solef5130(PVdF)',qty:40,unitPrice:36448,amount:1457920,vat:145792,total:1603712,supplier:'한국 사이언스코(주)',receiptStatus:'입고완료'},
    {purchaseNo:'2026-04-28-1',orderDate:'2026-04-28',purchaseType:'ERP 이관',item:'SBS(KTR-201) [KG]',qty:50,unitPrice:29522,amount:1476100,vat:147610,total:1623710,supplier:'금호석유화학(주)',receiptStatus:'입고완료'},
    {purchaseNo:'2026-05-15-1',orderDate:'2026-05-15',purchaseType:'ERP 이관',item:'Solef5140 [KG]',qty:20,unitPrice:36649,amount:732980,vat:73298,total:806278,supplier:'한국 사이언스코(주)',receiptStatus:'입고완료'},
    {purchaseNo:'2026-06-08-1',orderDate:'2026-06-08',purchaseType:'ERP 이관',item:'Solef5140 [KG]',qty:20,unitPrice:36649,amount:732980,vat:73298,total:806278,supplier:'한국 사이언스코(주)',receiptStatus:'입고완료'},
    {purchaseNo:'2026-06-08-2',orderDate:'2026-06-08',purchaseType:'ERP 이관',item:'ADC30G(SBR) [KG]',qty:300,unitPrice:11237,amount:3371100,vat:337110,total:3708210,supplier:'LG화학',receiptStatus:'입고완료'},
    {purchaseNo:'2026-06-25-1',orderDate:'2026-06-25',purchaseType:'ERP 이관',item:'SBS(KTR-201) [KG]',qty:50,unitPrice:30700,amount:1535000,vat:153500,total:1688500,supplier:'금호석유화학(주)',receiptStatus:'입고완료'}
  ];

  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
  const number=value=>{const parsed=Number(clean(value).replace(/,/g,''));return Number.isFinite(parsed)?parsed:0;};
  const money=value=>number(value).toLocaleString('ko-KR');
  const esc=value=>clean(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const idOf=row=>clean(row&&(row.purchaseNo||row.no||row.id));
  const rowItem=row=>clean(row&&(row.item||row.material||row.itemName||row.materialName));
  const rowAmount=row=>number(row&&row.amount)||number(row&&row.qty)*number(row&&(row.unitPrice!=null?row.unitPrice:row.price));
  const rowVat=row=>{
    if(row&&row.vat!=null&&clean(row.vat)!=='') return number(row.vat);
    return Math.round(rowAmount(row)*0.1);
  };
  const rowTotal=row=>{
    if(row&&row.total!=null&&clean(row.total)!=='') return number(row.total);
    return rowAmount(row)+rowVat(row);
  };
  const rowStatus=row=>clean(row&&(row.receiptStatus||row.receiving||row.status||row.iqcStatus||row.iqc))||'미입고';
  const rowType=row=>clean(row&&(row.purchaseType||row.type))||'정기발주';
  const canonicalSupplier=value=>/^(LG\s*Chemical|LG\s*화학)$/i.test(clean(value))?'LG화학':clean(value);
  const monthLabel=date=>clean(date).slice(0,7).replace('-','/');
  const displayNo=value=>{
    const no=clean(value);
    if(/^\d{4}-\d{2}-\d{2}-.+$/.test(no)) return no.slice(0,7).replace('-','/')+no.slice(7);
    return no;
  };

  let currentRows=CAPTURE_ROWS.slice();
  let rebuilding=false;
  let hydratePromise=null;
  let scheduled=false;
  const filterState={
    from:YEAR+'-01-01',
    to:YEAR+'-12-31',
    supplier:'',
    item:'',
    type:'',
    status:'',
    query:''
  };

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
      return row&&clean(row.supplier)===target.supplier&&rowItem(row)===target.item&&number(row.qty)===target.qty&&rowAmount(row)===target.amount;
    });
  }

  async function rebuildImportedHistory(){
    if(rebuilding) return;
    rebuilding=true;
    try{
      let existing=await loadDbRows();
      if(sameCapture(existing)) return;
      const ids=new Set(existing.map(idOf));
      for(const id of ALL_IMPORTED_IDS){
        if(!ids.has(id)) continue;
        try{await request('/api/purchase-orders/'+encodeURIComponent(id),{method:'DELETE'});}catch(error){if(error.status!==404)throw error;}
      }
      for(const row of CAPTURE_ROWS){
        await request('/api/purchase-orders',{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({
            purchaseNo:row.purchaseNo,purchaseType:'ERP 이관',productionType:'D-양산',orderDate:row.orderDate,
            supplier:row.supplier,item:row.item,material:row.item,qty:row.qty,unit:'kg',unitPrice:row.unitPrice,amount:row.amount,
            warehouse:'',paymentTerms:'부가세율 적용',approvalStatus:'승인완료',receiptStatus:'입고완료',receivedQty:row.qty,
            iqcRequired:false,iqcStatus:'기존 ERP 반영',coaRequired:false,msdsRequired:false,lotRequired:false,status:'입고완료',
            notes:'구매현황 캡처 기준 재등록 · 공급가액 '+money(row.amount)+'원 · 부가세 '+money(row.vat)+'원 · 합계 '+money(row.total)+'원'
          })
        });
      }
      existing=await loadDbRows();
      try{localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(existing));}catch(_error){}
      window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'purchase',source:'capture-rebuild-v3'}}));
    }catch(error){
      console.error('[QMES purchase premium] background rebuild failed',error);
    }finally{
      rebuilding=false;
    }
  }

  function normalizeRows(rows){
    const list=(Array.isArray(rows)?rows:[]).filter(row=>{
      const id=idOf(row);
      const supplier=clean(row&&row.supplier);
      return !(id==='PO-260824-01'&&/^Supplier A$/i.test(supplier))&&!(id==='PO-260824-02'&&/^Supplier B$/i.test(supplier));
    }).map(row=>({
      source:row,
      purchaseNo:idOf(row),
      orderDate:clean(row&&row.orderDate).slice(0,10),
      item:rowItem(row),
      qty:number(row&&row.qty),
      unit:clean(row&&row.unit)||'kg',
      unitPrice:number(row&&(row.unitPrice!=null?row.unitPrice:row.price)),
      amount:rowAmount(row),
      vat:rowVat(row),
      total:rowTotal(row),
      supplier:clean(row&&row.supplier),
      purchaseType:rowType(row),
      status:rowStatus(row),
      due:clean(row&&(row.requestedDueDate||row.due||row.dueDate)),
      iqcStatus:clean(row&&(row.iqcStatus||row.iqc))
    })).filter(row=>row.purchaseNo||row.item||row.supplier);

    list.sort((a,b)=>{
      const da=a.orderDate||'9999-99-99',db=b.orderDate||'9999-99-99';
      if(da!==db) return da.localeCompare(db);
      return a.purchaseNo.localeCompare(b.purchaseNo);
    });
    return list;
  }

  function activeRows(){
    const q=clean(filterState.query).toLowerCase();
    const item=clean(filterState.item).toLowerCase();
    return normalizeRows(currentRows).filter(row=>{
      if(filterState.from&&row.orderDate&&row.orderDate<filterState.from) return false;
      if(filterState.to&&row.orderDate&&row.orderDate>filterState.to) return false;
      if(filterState.supplier&&canonicalSupplier(row.supplier)!==filterState.supplier) return false;
      if(item&&!row.item.toLowerCase().includes(item)) return false;
      if(filterState.type&&row.purchaseType!==filterState.type) return false;
      if(filterState.status&&!row.status.includes(filterState.status)) return false;
      if(q&&![row.purchaseNo,row.orderDate,row.item,row.supplier,row.purchaseType,row.status,row.due,row.iqcStatus].some(value=>clean(value).toLowerCase().includes(q))) return false;
      return true;
    });
  }

  function totals(rows){
    return rows.reduce((sum,row)=>({
      qty:sum.qty+row.qty,
      unitPrice:sum.unitPrice+row.unitPrice,
      amount:sum.amount+row.amount,
      vat:sum.vat+row.vat,
      total:sum.total+row.total
    }),{qty:0,unitPrice:0,amount:0,vat:0,total:0});
  }

  function iconSvg(kind){
    const common='width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    if(kind==='cart') return `<svg ${common}><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.3 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H7"/></svg>`;
    if(kind==='coins') return `<svg ${common}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/></svg>`;
    if(kind==='tax') return `<svg ${common}><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5"/><path d="M9 12h6M9 16h6"/></svg>`;
    if(kind==='calc') return `<svg ${common}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h2M14 14h2M8 18h2M14 18h2"/></svg>`;
    return `<svg ${common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 0 1 4 4v4"/></svg>`;
  }

  function kpiHtml(rows){
    const sum=totals(rows);
    const suppliers=new Set(rows.map(row=>canonicalSupplier(row.supplier)).filter(Boolean));
    const cards=[
      ['cart','총 발주수량',money(sum.qty)+' kg','현재 조회 기준'],
      ['coins','공급가액',money(sum.amount)+' 원','부가세 제외'],
      ['tax','부가세',money(sum.vat)+' 원','VAT 10% 기준'],
      ['calc','총 합계',money(sum.total)+' 원','공급가액 + 부가세'],
      ['users','거래처 수',money(suppliers.size)+' 개사','중복 거래처 제외']
    ];
    return `<div class="qpc-kpis">${cards.map(card=>`<article class="qpc-kpi"><div class="qpc-kpi-icon">${iconSvg(card[0])}</div><div><span>${card[1]}</span><strong>${card[2]}</strong><small>${card[3]}</small></div></article>`).join('')}</div>`;
  }

  function optionHtml(value,label,selected){return `<option value="${esc(value)}"${value===selected?' selected':''}>${esc(label)}</option>`;}

  function filterHtml(allRows){
    const suppliers=Array.from(new Set(allRows.map(row=>canonicalSupplier(row.supplier)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ko'));
    const types=Array.from(new Set(allRows.map(row=>row.purchaseType).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ko'));
    return `<section class="qpc-filter-card" aria-label="구매 발주 검색 조건">
      <div class="qpc-filter-grid">
        <label class="qpc-field qpc-period"><span>기간</span><div class="qpc-period-inputs"><input data-qpc-filter="from" type="date" value="${esc(filterState.from)}"><b>~</b><input data-qpc-filter="to" type="date" value="${esc(filterState.to)}"></div></label>
        <label class="qpc-field"><span>거래처</span><select data-qpc-filter="supplier">${optionHtml('','전체',filterState.supplier)}${suppliers.map(value=>optionHtml(value,value,filterState.supplier)).join('')}</select></label>
        <label class="qpc-field"><span>품목명</span><input data-qpc-filter="item" type="search" value="${esc(filterState.item)}" placeholder="품목명, 코드, 규격 검색"></label>
        <label class="qpc-field"><span>구매 구분</span><select data-qpc-filter="type">${optionHtml('','전체',filterState.type)}${types.map(value=>optionHtml(value,value,filterState.type)).join('')}</select></label>
        <label class="qpc-field"><span>납기 상태</span><select data-qpc-filter="status">${optionHtml('','전체',filterState.status)}${['미입고','부분입고','입고완료','IQC대기'].map(value=>optionHtml(value,value,filterState.status)).join('')}</select></label>
        <label class="qpc-field qpc-query"><span>통합 검색</span><input data-qpc-filter="query" type="search" value="${esc(filterState.query)}" placeholder="발주번호, 품목명, 거래처명 검색..."></label>
        <div class="qpc-filter-actions"><button type="button" class="qpc-btn primary" data-qpc-action="search"><span>⌕</span> 검색 (F3)</button><button type="button" class="qpc-btn" data-qpc-action="reset"><span>↻</span> 초기화</button><button type="button" class="qpc-btn" data-qpc-action="option"><span>⚙</span> 옵션</button></div>
      </div>
    </section>`;
  }

  function tableHtml(rows){
    const groups=[];
    rows.forEach(row=>{
      const month=monthLabel(row.orderDate)||'기타';
      let group=groups.find(item=>item.month===month);
      if(!group){group={month,rows:[]};groups.push(group);}
      group.rows.push(row);
    });

    let body='';
    groups.forEach(group=>{
      const sum=totals(group.rows);
      body+=`<tr class="qpc-month"><td colspan="2"><span class="qpc-chevron">⌄</span><strong>${esc(group.month)} (${group.rows.length}건)</strong></td><td class="num">${money(sum.qty)}</td><td class="num">${money(sum.unitPrice)}</td><td class="num">${money(sum.amount)}</td><td class="num">${money(sum.vat)}</td><td class="num">${money(sum.total)}</td><td></td></tr>`;
      group.rows.forEach(row=>{
        body+=`<tr class="qpc-detail">
          <td class="qpc-no"><button type="button" class="qpc-date-link" data-qpc-action="iqc" data-purchase-no="${esc(row.purchaseNo)}" data-order-date="${esc(row.orderDate)}" data-item="${esc(row.item)}" data-supplier="${esc(row.supplier)}" title="수입검사 (IQC)로 이동">${esc(displayNo(row.purchaseNo||row.orderDate))}<span aria-hidden="true">↗</span></button></td>
          <td><strong>${esc(row.item||'-')}</strong>${row.due?`<small>요청납기 ${esc(row.due)}</small>`:''}</td>
          <td class="num">${money(row.qty)}</td><td class="num">${row.unitPrice?money(row.unitPrice):''}</td><td class="num">${money(row.amount)}</td><td class="num">${money(row.vat)}</td><td class="num qpc-total-money">${money(row.total)}</td><td>${esc(row.supplier||'-')}</td>
        </tr>`;
      });
    });
    const sum=totals(rows);
    body+=`<tr class="qpc-total"><td></td><td>총합계</td><td class="num">${money(sum.qty)}</td><td class="num">${money(sum.unitPrice)}</td><td class="num">${money(sum.amount)}</td><td class="num">${money(sum.vat)}</td><td class="num">${money(sum.total)}</td><td></td></tr>`;
    if(!rows.length) body=`<tr><td colspan="8" class="qpc-empty">조건에 맞는 구매 발주가 없습니다.</td></tr>`;

    return `<section class="qpc-table-card"><div class="qpc-table-head"><div><strong>발주 목록</strong><span>총 ${rows.length}건</span><small>일자-No. 클릭 시 수입검사(IQC)로 이동</small></div><button type="button" class="qpc-export" data-qpc-action="export">⇩ 엑셀 다운로드</button></div><div class="qpc-scroll"><table class="qpc-table"><thead><tr><th>일자-No.</th><th>품목명(규격)</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>합계</th><th>거래처명</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
  }

  function dashboardHtml(){
    const allRows=normalizeRows(currentRows);
    const rows=activeRows();
    return `<div class="qpc-dashboard">${kpiHtml(rows)}${filterHtml(allRows)}${tableHtml(rows)}</div>`;
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-purchase-capture-mode{--qpc-ink:#12233c;--qpc-muted:#6b7f95;--qpc-border:#dbe5ee;--qpc-blue:#087fbd;--qpc-teal:#009b93;--qpc-bg:#f5f8fb}
      .qmes-purchase-capture-mode .qp-flow,.qmes-purchase-capture-mode .qp-kpis,.qmes-purchase-capture-mode>.qerp-card,.qmes-purchase-capture-mode .qmes-purchase-page-body>.qerp-card{display:none!important}
      .qmes-purchase-capture-mode{background:linear-gradient(180deg,#f8fbfd 0%,#f3f7fb 100%)!important;border-radius:14px;padding:2px 0 18px!important}
      .qmes-purchase-capture-mode .qerp-head{margin:0 0 16px!important;padding:8px 4px 0!important;align-items:center!important}
      .qmes-purchase-capture-mode .qerp-title{font-size:24px!important;color:var(--qpc-ink)!important;letter-spacing:-.55px!important}
      .qmes-purchase-capture-mode .qerp-sub{font-size:12px!important;color:#5f748b!important;margin-top:4px!important}
      .qmes-purchase-capture-mode .qerp-head-actions{gap:9px!important}
      .qmes-purchase-capture-mode .qerp-head-actions .qerp-btn{height:40px!important;border-radius:9px!important;padding:0 17px!important;background:linear-gradient(135deg,#08a49a,#078c87)!important;box-shadow:0 6px 16px rgba(0,143,136,.16)!important}
      .qmes-purchase-capture-mode .qerp-head-actions .qerp-sync{height:38px!important;border-radius:10px!important;padding:0 14px!important;background:#effbf4!important;border:1px solid #b8ebca!important;color:#16834d!important;font-size:11px!important}
      .qmes-purchase-capture-host{display:block!important}
      .qpc-dashboard{display:grid;gap:14px;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;color:var(--qpc-ink)}
      .qpc-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
      .qpc-kpi{min-width:0;min-height:88px;display:flex;align-items:center;gap:13px;padding:14px 16px;background:#fff;border:1px solid var(--qpc-border);border-radius:13px;box-shadow:0 8px 24px rgba(31,57,79,.045)}
      .qpc-kpi-icon{width:44px;height:44px;flex:0 0 44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#eaf6ff,#edf9ff);color:#1184c3}
      .qpc-kpi span,.qpc-kpi small{display:block}.qpc-kpi span{font-size:11px;font-weight:800;color:#6b8096}.qpc-kpi strong{display:block;margin-top:2px;font-size:20px;line-height:1.25;font-weight:950;color:#15304f;white-space:nowrap}.qpc-kpi small{margin-top:2px;font-size:9px;color:#9aabba;font-weight:650}
      .qpc-filter-card,.qpc-table-card{background:#fff;border:1px solid var(--qpc-border);border-radius:13px;box-shadow:0 8px 26px rgba(31,57,79,.045)}
      .qpc-filter-card{padding:13px 14px}.qpc-filter-grid{display:grid;grid-template-columns:1.45fr .9fr 1.05fr .72fr .72fr 1.25fr auto;gap:10px;align-items:end}
      .qpc-field{display:block;min-width:0}.qpc-field>span{display:block;margin:0 0 6px;font-size:10px;font-weight:850;color:#556d84}.qpc-field input,.qpc-field select{width:100%;height:38px;border:1px solid #ccd9e5;border-radius:8px;background:#fff;padding:0 10px;color:#18324e;font-size:11px;font-weight:650;outline:none;transition:.16s}.qpc-field input:focus,.qpc-field select:focus{border-color:#42a9d6;box-shadow:0 0 0 3px rgba(47,163,211,.11)}.qpc-field input::placeholder{color:#a1b0bf}
      .qpc-period-inputs{display:grid;grid-template-columns:1fr 18px 1fr;align-items:center;gap:5px}.qpc-period-inputs b{text-align:center;color:#91a2b3;font-size:11px}.qpc-filter-actions{display:flex;align-items:center;gap:7px;white-space:nowrap}.qpc-btn{height:38px;border:1px solid #cdd9e4;border-radius:8px;background:#fff;color:#39526c;padding:0 13px;font-size:11px;font-weight:850;cursor:pointer;box-shadow:0 2px 5px rgba(31,57,79,.03)}.qpc-btn:hover{background:#f7fafc}.qpc-btn.primary{min-width:105px;background:linear-gradient(135deg,#169bd1,#087fbd);border-color:#087fbd;color:#fff;box-shadow:0 6px 14px rgba(8,127,189,.18)}
      .qpc-table-card{overflow:hidden}.qpc-table-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 14px;border-bottom:1px solid #e2e9ef}.qpc-table-head>div{display:flex;align-items:center;gap:8px;min-width:0}.qpc-table-head strong{font-size:14px;font-weight:950;color:#17324f}.qpc-table-head span{font-size:10px;font-weight:800;color:#7c8fa2}.qpc-table-head small{font-size:9px;color:#9aabba;font-weight:700}.qpc-export{height:30px;border:1px solid #cedae5;border-radius:7px;background:#fff;color:#476078;padding:0 10px;font-size:10px;font-weight:850;cursor:pointer}
      .qpc-scroll{overflow:auto;max-height:calc(100vh - 390px);min-height:280px}.qpc-table{width:100%;min-width:1130px;border-collapse:separate;border-spacing:0;font-size:11px}.qpc-table th{position:sticky;top:0;z-index:2;height:38px;padding:0 10px;border-bottom:1px solid #d8e2eb;border-right:1px solid #e5ebf1;background:#f8fafc;text-align:center;color:#3f566d;font-size:10px;font-weight:900;white-space:nowrap}.qpc-table th:last-child{border-right:0}.qpc-table td{height:34px;padding:6px 10px;border-bottom:1px solid #e8edf2;border-right:1px solid #eef2f5;background:#fff;color:#31465d;vertical-align:middle}.qpc-table td:last-child{border-right:0}.qpc-table td.num{text-align:right;font-variant-numeric:tabular-nums}.qpc-table td:nth-child(2){min-width:310px}.qpc-table td:nth-child(8){min-width:190px}.qpc-table .qpc-detail:hover td{background:#fbfdff}.qpc-table .qpc-month td{height:34px;background:linear-gradient(90deg,#f1f7fc,#f8fbfd);font-weight:900;color:#1f5a8d;border-bottom-color:#d7e5f0}.qpc-chevron{display:inline-block;width:20px;text-align:center;color:#4c7da7}.qpc-table .qpc-total td{height:38px;background:#edf6fd;font-weight:950;color:#153c5f;border-bottom:0}.qpc-total-money{font-weight:850;color:#183f61!important}.qpc-no{text-align:center;white-space:nowrap}.qpc-date-link{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:0;background:transparent;color:#1f73c9;font-size:11px;font-weight:850;padding:3px 5px;border-radius:6px;cursor:pointer}.qpc-date-link span{font-size:9px;opacity:0;transform:translateX(-2px);transition:.14s}.qpc-date-link:hover{background:#edf6ff;color:#075fae}.qpc-date-link:hover span{opacity:1;transform:none}.qpc-detail td:nth-child(2) strong{display:block;font-size:11px;font-weight:760;color:#2a4056}.qpc-detail td:nth-child(2) small{display:block;margin-top:2px;color:#9aa8b6;font-size:9px}.qpc-empty{text-align:center!important;padding:42px!important;color:#97a7b6!important;font-weight:750!important}
      @media(max-width:1500px){.qpc-filter-grid{grid-template-columns:1.35fr .8fr 1fr .72fr .72fr 1.1fr}.qpc-filter-actions{grid-column:1/-1;justify-content:flex-end}.qpc-kpi strong{font-size:17px}}
      @media(max-width:1180px){.qpc-kpis{grid-template-columns:repeat(3,1fr)}.qpc-filter-grid{grid-template-columns:repeat(3,1fr)}.qpc-period{grid-column:span 2}.qpc-query{grid-column:span 2}.qpc-scroll{max-height:none}}
      @media(max-width:760px){.qpc-kpis{grid-template-columns:1fr 1fr}.qpc-filter-grid{grid-template-columns:1fr 1fr}.qpc-period,.qpc-query{grid-column:1/-1}.qpc-filter-actions{justify-content:flex-start;overflow:auto}.qpc-table-head small{display:none}}
    `;
    document.head.appendChild(style);
  }

  function purchaseRoot(){
    return document.querySelector('.qmes-purchase-live,.qp-root')||Array.from(document.querySelectorAll('#root main,#root .qerp')).find(node=>/구매\s*[·ㆍ]?\s*발주관리/.test(clean(node.textContent)));
  }

  function renderDashboard(){
    ensureStyle();
    const root=purchaseRoot();
    if(!root) return false;
    root.classList.add('qmes-purchase-capture-mode');
    let host=root.querySelector('.qmes-purchase-capture-host');
    if(!host){
      host=document.createElement('div');
      host.className='qmes-purchase-capture-host';
      const header=root.querySelector('.qerp-head');
      if(header) header.insertAdjacentElement('afterend',host); else root.prepend(host);
    }
    host.innerHTML=dashboardHtml();
    return true;
  }

  async function hydrateRows(force){
    if(hydratePromise&&!force) return hydratePromise;
    hydratePromise=(async()=>{
      try{
        const rows=await loadDbRows();
        if(rows.length) currentRows=rows;
        renderDashboard();
      }catch(error){
        console.warn('[QMES purchase premium] live rows unavailable; using fallback',error&&error.message?error.message:error);
        renderDashboard();
      }finally{
        hydratePromise=null;
      }
    })();
    return hydratePromise;
  }

  function readFilters(host){
    const get=name=>host.querySelector(`[data-qpc-filter="${name}"]`)?.value||'';
    filterState.from=get('from');filterState.to=get('to');filterState.supplier=get('supplier');filterState.item=get('item');filterState.type=get('type');filterState.status=get('status');filterState.query=get('query');
  }

  function resetFilters(){
    filterState.from=YEAR+'-01-01';filterState.to=YEAR+'-12-31';filterState.supplier='';filterState.item='';filterState.type='';filterState.status='';filterState.query='';
  }

  function navigateToIqc(button){
    const detail={
      purchaseNo:clean(button.dataset.purchaseNo),
      orderDate:clean(button.dataset.orderDate),
      item:clean(button.dataset.item),
      supplier:clean(button.dataset.supplier)
    };
    try{
      sessionStorage.setItem('qmes_purchase_iqc_pending','1');
      sessionStorage.setItem('qmes_purchase_iqc_context',JSON.stringify(detail));
      sessionStorage.setItem('qmes_current_tab','iqc');
    }catch(_error){}
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'iqc',openMenu:'qualityMenu',source:'purchase-overview',purchase:detail}}));
    requestAnimationFrame(()=>{try{window.qmesSetGlobalSidebarGroup?.('품질검사');}catch(_error){}});
  }

  function exportCsv(){
    const rows=activeRows();
    const csvRows=[['일자-No.','품목명(규격)','수량','단가','공급가액','부가세','합계','거래처명']].concat(rows.map(row=>[displayNo(row.purchaseNo),row.item,row.qty,row.unitPrice,row.amount,row.vat,row.total,row.supplier]));
    const csv='\ufeff'+csvRows.map(cols=>cols.map(value=>'"'+String(value==null?'':value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download='QMES_구매발주현황_'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function apply(){
    scheduled=false;
    if(!renderDashboard()) return;
    hydrateRows(false);
    rebuildImportedHistory();
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    setTimeout(apply,60);
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    const button=target.closest('[data-qpc-action]');
    if(!button) return;
    const host=button.closest('.qmes-purchase-capture-host');
    if(!host) return;
    const action=button.dataset.qpcAction;
    if(action==='iqc'){
      event.preventDefault();event.stopPropagation();navigateToIqc(button);return;
    }
    if(action==='search'){
      readFilters(host);renderDashboard();return;
    }
    if(action==='reset'){
      resetFilters();renderDashboard();return;
    }
    if(action==='export'){
      exportCsv();return;
    }
    if(action==='option'){
      const query=host.querySelector('[data-qpc-filter="query"]');
      if(query){query.focus();query.select?.();}
    }
  },true);

  document.addEventListener('keydown',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target||!target.closest('.qmes-purchase-capture-host')) return;
    if(event.key==='Enter'&&target.matches('[data-qpc-filter]')){
      event.preventDefault();
      const host=target.closest('.qmes-purchase-capture-host');
      readFilters(host);renderDashboard();
    }
    if(event.key==='F3'){
      event.preventDefault();
      const host=target.closest('.qmes-purchase-capture-host');
      readFilters(host);renderDashboard();
    }
  },true);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true}); else schedule();
  window.addEventListener('qmes:navigate-tab',schedule);
  window.addEventListener('qmes:erp-data-changed',event=>{if(!event?.detail?.kind||event.detail.kind==='purchase')setTimeout(()=>hydrateRows(true),120);});
  document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('#qmes-erp-sidebar'))setTimeout(schedule,80);},true);
  new MutationObserver(()=>{if(purchaseRoot()&&!document.querySelector('.qmes-purchase-capture-host'))schedule();}).observe(document.documentElement,{childList:true,subtree:true});
})();
