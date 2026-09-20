/* QMES Sales/Due ledger Excel download - 2026-09-21
 * Additive patch only. Adds an Excel download button to the current Sales ledger.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EXCEL_DOWNLOAD_20260921__) return;
  window.__QMES_SALES_EXCEL_DOWNLOAD_20260921__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const SHIPPING="qmes-erp-shipping-v1";
  const DELETED="qmes-sales-deleted-v1";
  const STANDARD="(주) 현대자동차";
  const BTN_ID="qmes-sales-excel-download-20260921";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0};
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const metaMap=()=>{const v=read(META,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const shipRows=()=>{const v=read(SHIPPING,[]);return Array.isArray(v)?v:[]};
  const delRows=()=>{const v=read(DELETED,[]);return Array.isArray(v)?v:[]};

  function normalizeCustomer(v){
    const raw=clean(v);
    const compact=raw.replace(/\s+/g,"").replace(/^주식회사/,"(주)");
    if(compact==="현대자동차"||compact==="(주)현대자동차") return STANDARD;
    return raw;
  }

  function meta(r,m){
    const k=clean(r&&(r.workOrder||r.id));
    return m[k]||m[clean(r&&r.id)]||(r&&r.orderMeta)||{};
  }

  function shownId(r,m){
    return clean(meta(r,m).salesOrderIdOverride)||clean(r&&r.id);
  }

  function iso(v){
    const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    return m?m[1]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[3]).padStart(2,"0"):"";
  }

  function orderDateFromId(id){
    let m=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);
    if(m) return m[1]+"-"+m[2]+"-"+m[3];
    m=clean(id).match(/^SO-(\d{2})(\d{2})(\d{2})-/i);
    return m?"20"+m[1]+"-"+m[2]+"-"+m[3]:"";
  }

  function isDeleted(r,m){
    const id=clean(r&&r.id),wo=clean(r&&(r.workOrder||r.id)),shown=shownId(r,m);
    return delRows().some(x=>{
      const did=clean(x&&x.id),dwo=clean(x&&x.workOrder);
      return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo);
    });
  }

  function shipped(r,m,ships){
    const mm=meta(r,m),id=shownId(r,m),raw=clean(r&&r.id),wo=clean(r&&(r.workOrder||r.id));
    const status=[r&&r.shipping,mm.shippingStatus].map(clean).join(" ");
    if((r&&r.actualShipment===true)||mm.actualShipment===true||/출하완료|납품완료|배송완료|출고완료/.test(status)) return true;
    return (ships||[]).some(s=>{
      const sid=clean(s&&(s.sales||s.salesOrder||s.salesOrderId)),swo=clean(s&&(s.workOrder||s.lot));
      const st=[s&&s.shipping,s&&s.delivery,s&&s.status].map(clean).join(" ");
      return ((sid&&(sid===id||sid===raw))||(wo&&swo===wo))&&((s&&s.actualShipment===true)||/출하완료|납품완료|배송완료|출고완료/.test(st));
    });
  }

  function production(r,m,done){
    if(done) return "생산완료";
    const mm=meta(r,m),raw=clean(mm.productionPlanStatus)||clean(r&&r.plan);
    if(/완료/.test(raw)) return "생산완료";
    if(/생산중|진행/.test(raw)) return "생산진행";
    if(clean(r&&r.workOrder)||clean(mm.workOrder)) return "생산진행";
    return raw||"생산대기";
  }

  function shipping(r,m,done){
    if(done) return "출하완료";
    const mm=meta(r,m),raw=clean(mm.shippingStatus)||clean(r&&r.shipping);
    return raw&&raw!=="-"?raw:"출하대기";
  }

  function dueState(dueValue,done){
    if(done) return {label:"완료",bucket:"완료"};
    if(!dueValue) return {label:"-",bucket:"기타"};
    const days=Math.ceil((new Date(dueValue+"T23:59:59").getTime()-Date.now())/86400000);
    if(days<0) return {label:"지연 "+Math.abs(days)+"일",bucket:"지연"};
    if(days<=7) return {label:"임박 D-"+days,bucket:"임박"};
    return {label:"정상",bucket:"정상"};
  }

  function progress(prod,ship){
    if(/출하완료/.test(ship)) return "출하완료";
    if(/출하/.test(ship)&&!/대기/.test(ship)) return "출하진행";
    if(/생산완료/.test(prod)) return "생산완료";
    if(/진행/.test(prod)) return "생산진행";
    return "생산대기";
  }

  function buildRows(rows){
    const m=metaMap(),ships=shipRows();
    return (Array.isArray(rows)?rows:[])
      .filter(r=>r&&!isDeleted(r,m))
      .map(r=>{
        const mm=meta(r,m),id=shownId(r,m);
        const date=iso(mm.orderDate||r&&r.orderDate||r&&r.productionDate||r&&r.createdAt)||orderDateFromId(id);
        const customer=normalizeCustomer(mm.customerOverride||r&&r.customer)||"-";
        const product=clean(mm.productOverride||r&&r.product)||"-";
        const qty=num(mm.qtyOverride!=null?mm.qtyOverride:r&&r.qty);
        const due=iso(mm.requestedDue||r&&r.due);
        const done=shipped(r,m,ships);
        const prod=production(r,m,done),ship=shipping(r,m,done),ds=dueState(due,done);
        return {id,date,customer,product,qty,unit:"kg",due,dueState:ds,production:prod,shipping:ship,progress:progress(prod,ship)};
      });
  }

  function rowIdentity(x){
    return [x.date,normalizeCustomer(x.customer).replace(/^\(주\)\s*/,"").replace(/\s+/g,""),clean(x.product).replace(/\s+/g,"").toLowerCase(),String(num(x.qty))].join("|");
  }

  function idScore(id){
    if(/^SO-\d{6,8}-\d{3}$/i.test(clean(id))) return 3;
    if(/^SO-\d{6,8}-\d{2}$/i.test(clean(id))) return 2;
    return 1;
  }

  function dedupe(rows){
    const byKey=new Map();
    (rows||[]).forEach(row=>{
      const key=rowIdentity(row);
      const current=byKey.get(key);
      if(!current||idScore(row.id)>idScore(current.id)) byKey.set(key,row);
    });
    return [...byKey.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
  }

  async function loadRows(){
    let rows=read(SALES,[]);
    if(typeof window.qmesSyncList==="function"){
      try{
        const records=await window.qmesSyncList("inventory");
        const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)==="erp:sales");
        let payload=found&&found.payload;
        if(typeof payload==="string"){try{payload=JSON.parse(payload)}catch(_){payload=null}}
        if(payload&&Array.isArray(payload.rows)&&payload.rows.length) rows=payload.rows;
      }catch(_){}
    }
    return dedupe(buildRows(rows));
  }

  function filterState(){
    const root=document.querySelector(".qmes-sales-ledger-v4");
    if(!root) return {from:"",to:"",customer:"",product:"",progress:"전체",due:"전체",q:""};
    const fields=[...root.querySelectorAll(".qrl-field")];
    const get=label=>{
      const f=fields.find(x=>clean(x.querySelector("span")?.textContent)===label);
      if(!f) return "";
      if(label==="기간"){
        const ds=f.querySelectorAll('input[type="date"]');
        return {from:ds[0]?.value||"",to:ds[1]?.value||""};
      }
      const el=f.querySelector("input,select");
      return el?clean(el.value):"";
    };
    const d=get("기간")||{};
    return {
      from:d.from||"",
      to:d.to||"",
      customer:get("거래처"),
      product:get("품목명"),
      progress:get("진행상태")||"전체",
      due:get("납기상태")||"전체",
      q:get("통합검색")
    };
  }

  function applyFilters(rows,state){
    const qq=clean(state.q).toLowerCase(),pq=clean(state.product).toLowerCase();
    return rows.filter(x=>{
      if(state.from&&x.date&&x.date<state.from) return false;
      if(state.to&&x.date&&x.date>state.to) return false;
      if(state.customer&&x.customer!==state.customer) return false;
      if(pq&&!x.product.toLowerCase().includes(pq)) return false;
      if(state.progress!=="전체"&&x.progress!==state.progress) return false;
      if(state.due!=="전체"&&x.dueState.bucket!==state.due) return false;
      if(qq&&!([x.id,x.date,x.customer,x.product,x.due,x.production,x.shipping].join(" ").toLowerCase().includes(qq))) return false;
      return true;
    });
  }

  function ensureXLSX(){
    if(window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-qmes-sales-xlsx="1"]');
      if(existing){
        existing.addEventListener("load",()=>resolve(window.XLSX),{once:true});
        existing.addEventListener("error",()=>reject(new Error("XLSX load failed")),{once:true});
        return;
      }
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.async=true;
      s.dataset.qmesSalesXlsx="1";
      s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error("XLSX unavailable"));
      s.onerror=()=>reject(new Error("XLSX load failed"));
      document.head.appendChild(s);
    });
  }

  async function download(){
    const btn=document.getElementById(BTN_ID);
    const old=btn&&btn.textContent;
    if(btn){btn.disabled=true;btn.textContent="다운로드 중...";}
    try{
      const rows=applyFilters(await loadRows(),filterState());
      if(!rows.length){alert("다운로드할 수주 데이터가 없습니다.");return;}

      const XLSX=await ensureXLSX();
      const now=new Date();
      const stamp=now.toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
      const exportedAt=now.toLocaleString("ko-KR",{timeZone:"Asia/Seoul"});

      const aoa=[
        ["수주·납기 관리대장"],
        ["다운로드 일시",exportedAt],
        [],
        ["No","수주일","수주번호","거래처명","품목명 (규격)","수주수량","단위","요청납기","납기상태","생산상태","출하상태"],
        ...rows.map((x,i)=>[
          i+1,
          x.date||"",
          x.id||"",
          x.customer||"",
          x.product||"",
          x.qty,
          x.unit||"kg",
          x.due||"",
          x.dueState.label||"",
          x.production||"",
          x.shipping||""
        ])
      ];

      const ws=XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"]=[
        {wch:7},{wch:13},{wch:18},{wch:20},{wch:28},{wch:12},{wch:8},{wch:13},{wch:13},{wch:13},{wch:13}
      ];
      ws["!autofilter"]={ref:"A4:K"+String(4+rows.length)};

      const wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws,"수주납기관리대장");
      XLSX.writeFile(wb,"수주납기관리대장_"+stamp+".xlsx");
    }catch(error){
      console.error("[QMES Sales Excel]",error);
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old||"엑셀 다운로드";}
    }
  }

  function installStyle(){
    if(document.getElementById(BTN_ID+"-style")) return;
    const s=document.createElement("style");
    s.id=BTN_ID+"-style";
    s.textContent=`
      #${BTN_ID}{
        height:36px!important;
        padding:0 13px!important;
        border:1px solid #9bc7a8!important;
        border-radius:8px!important;
        background:#f2fbf4!important;
        color:#19723b!important;
        font:inherit!important;
        font-size:11px!important;
        font-weight:850!important;
        cursor:pointer!important;
        white-space:nowrap!important;
      }
      #${BTN_ID}:hover{background:#e8f7ec!important}
      #${BTN_ID}:disabled{opacity:.55!important;cursor:wait!important}
    `;
    document.head.appendChild(s);
  }

  function ensureButton(){
    installStyle();
    const host=document.querySelector(".qmes-sales-ledger-v4 .qslv4-head-actions");
    if(!host||document.getElementById(BTN_ID)) return;
    const btn=document.createElement("button");
    btn.id=BTN_ID;
    btn.type="button";
    btn.textContent="엑셀 다운로드";
    btn.addEventListener("click",download);
    const progress=host.querySelector("#qmes-sales-progress-button-20260826");
    if(progress) host.insertBefore(btn,progress);
    else host.appendChild(btn);
  }

  function boot(){
    ensureButton();
    [200,600,1200,2500,5000].forEach(ms=>setTimeout(ensureButton,ms));
    window.addEventListener("qmes:erp-data-changed",()=>setTimeout(ensureButton,60));
    window.addEventListener("qmes:data-updated",()=>setTimeout(ensureButton,60));
    window.addEventListener("qmes:navigate-tab",()=>setTimeout(ensureButton,80));
    setInterval(ensureButton,1500);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();