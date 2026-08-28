/* NAMO QMES - Enterprise Sales module V1 - 2026-08-28
 * ADD-ONLY VIEW PATCH.
 * Replaces the visible Sales/Delivery list with the uploaded Enterprise '영업 / 수주' structure.
 * Sales Master data remains qmes-erp-sales-v1; production/quality/shipment remain downstream states.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ENTERPRISE_MODULE_20260828_V1__)return;
  window.__QMES_SALES_ENTERPRISE_MODULE_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const DELETED_KEY="qmes-sales-deleted-v1";
  const HOST_ID="qmes-sales-enterprise-module-20260828-v1";
  const STYLE_ID="qmes-sales-enterprise-module-style-20260828-v1";
  const IMPORT_ID="qmes-sales-enterprise-import-20260828-v1";
  let state={query:"",status:"전체 상태"};

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const salesRows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const metaMap=()=>readMap(META_KEY);
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=(row,map=metaMap())=>map[rowKey(row)]||map[clean(row?.id)]||row?.orderMeta||{};
  const visibleId=(row,map=metaMap())=>clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};

  function deleted(row){
    const id=clean(row?.id),shown=visibleId(row),wo=rowKey(row),list=read(DELETED_KEY,[]);
    return Array.isArray(list)&&list.some(x=>{const did=clean(x?.id),dwo=clean(x?.workOrder);return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo);});
  }

  function model(row){
    const map=metaMap(),meta=metaFor(row,map),id=visibleId(row,map),customer=clean(meta.customerOverride)||clean(row?.customer)||"-",product=clean(meta.productOverride)||clean(row?.product)||"-",qty=num(meta.qtyOverride??row?.qty),due=iso(meta.requestedDue||row?.due)||clean(meta.requestedDue||row?.due)||"-";
    const planNo=clean(meta.productionPlanId||meta.productionPlanNo||row?.productionPlanId||row?.productionPlanNo||row?.planNo);
    const planStatus=clean(meta.productionPlanStatus||row?.plan);
    const workOrder=clean(row?.workOrder||meta.workOrder);
    const production=planNo||workOrder||planStatus||"-";
    const shippingNo=clean(meta.shippingNo||row?.shippingNo||row?.shipmentNo);
    const shippingStatus=clean(meta.shippingStatus||row?.shipping);
    const shipment=shippingNo||shippingStatus||"-";
    const now=new Date(),dueDate=/^20\d{2}-\d{2}-\d{2}$/.test(due)?new Date(due+"T23:59:59"):null;
    const complete=/출하완료|납품완료|배송완료|출고완료/.test(shippingStatus)||row?.actualShipment===true||meta.actualShipment===true;
    let status="진행중",tone="blue";
    if(complete){status="출하완료";tone="green";}
    else if(dueDate&&dueDate.getTime()<now.getTime()){status="지연";tone="red";}
    else if(!workOrder&&(!planStatus||/계획대기|대기|미반영/.test(planStatus))){status="생산대기";tone="purple";}
    else if(/출하예정|출하검사\s*완료/.test(shippingStatus)){status="출하예정";tone="green";}
    return {row,id,customer,product,qty,due,production,shipment,status,tone};
  }

  function rowsFiltered(){
    const q=clean(state.query).toLowerCase();
    return salesRows().filter(row=>row&&!deleted(row)).map(model).filter(x=>{
      const text=[x.id,x.customer,x.product,x.due,x.production,x.shipment].join(" ").toLowerCase();
      const qok=!q||text.includes(q);
      const sok=state.status==="전체 상태"||x.status===state.status||(state.status==="진행중"&&x.status==="출하예정");
      return qok&&sok;
    });
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
      .qmes-sales-stable.qmes-sales-enterprise-active>.qerp-kpis,.qmes-sales-stable.qmes-sales-enterprise-active>.qerp-card{display:none!important}
      .qmes-sales-stable.qmes-sales-enterprise-active .qerp-title{font-size:22px!important;font-weight:950!important;letter-spacing:-.025em!important}.qmes-sales-stable.qmes-sales-enterprise-active .qerp-sub{font-size:11px!important}
      #${HOST_ID}{margin-top:14px;font-family:inherit;color:#172033}
      #${HOST_ID} .nse-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
      #${HOST_ID} .nse-left,#${HOST_ID} .nse-right{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      #${HOST_ID} input,#${HOST_ID} select{height:37px;border:1px solid #d7dee8;border-radius:8px;background:#fff;color:#4b5563;padding:0 10px;font:inherit;font-size:11px;outline:none}
      #${HOST_ID} .nse-search{width:230px}#${HOST_ID} input:focus,#${HOST_ID} select:focus{border-color:#9db9fb;box-shadow:0 0 0 3px #edf3ff}
      #${HOST_ID} .nse-btn,.qmes-sales-stable .nse-head-btn{height:37px;border:1px solid #d7dee8;background:#fff;color:#334155;padding:0 12px;border-radius:8px;font:inherit;font-size:11px;font-weight:850;cursor:pointer}
      .qmes-sales-stable .nse-head-btn{height:auto;min-height:36px}.qmes-sales-stable .nse-head-btn.primary{background:#2457d6;border-color:#2457d6;color:#fff}
      #${HOST_ID} .nse-card{background:#fff;border:1px solid #e3e8ef;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(15,23,42,.025)}
      #${HOST_ID} .nse-table-wrap{overflow:auto}#${HOST_ID} table{width:100%;border-collapse:collapse;font-size:11.3px}#${HOST_ID} th,#${HOST_ID} td{padding:12px 10px;border-bottom:1px solid #edf0f4;text-align:left;white-space:nowrap}
      #${HOST_ID} th{background:#fafbfd;color:#6e788b;font-size:10.5px;font-weight:850;position:sticky;top:0}#${HOST_ID} tbody tr:hover td{background:#fbfdff}
      #${HOST_ID} .nse-order{border:0;background:transparent;padding:0;color:#2457d6;font:inherit;font-weight:900;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
      #${HOST_ID} .nse-status{display:inline-block;padding:4px 7px;border-radius:999px;font-size:9.8px;font-weight:900}.nse-blue{background:#edf3ff;color:#2457d6}.nse-green{background:#eaf7ef;color:#187b43}.nse-purple{background:#f1edff;color:#6b4ec0}.nse-red{background:#fff0ee;color:#b83930}.nse-gray{background:#eef1f5;color:#657085}
      #${HOST_ID} .nse-empty{padding:42px 18px;text-align:center;color:#94a3b8;font-size:12px}#${HOST_ID} .nse-count{padding:9px 12px;border-top:1px solid #edf0f4;color:#8a94a6;font-size:9.5px;text-align:right}
      #qmes-sales-compliance-overlay-20260828-v2{display:none!important}
      @media(max-width:760px){#${HOST_ID} .nse-toolbar{align-items:stretch}#${HOST_ID} .nse-left,#${HOST_ID} .nse-right{width:100%}#${HOST_ID} .nse-search{flex:1;min-width:160px}}
    `;document.head.appendChild(s);
  }

  function renameTopMenu(){
    const candidates=document.querySelectorAll(".qmes-top-menu-item,.qmes-menu-item,.qmes-nav-item,nav button,nav a");
    candidates.forEach(node=>{
      const txt=clean(node.textContent).replace(/\s+/g,"");
      if(txt!=="수주·납기"&&txt!=="수주납기")return;
      const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;
      while((text=walker.nextNode())){if(/수주\s*·?\s*납기/.test(text.nodeValue||"")){text.nodeValue=(text.nodeValue||"").replace(/수주\s*·?\s*납기(?:관리)?/,"영업 / 수주");break;}}
    });
  }

  function ensureHeader(root){
    const title=root.querySelector(".qerp-title"),sub=root.querySelector(".qerp-sub"),actions=root.querySelector(".qerp-head-actions");
    if(title&&clean(title.textContent)!=="영업 / 수주 관리")title.textContent="영업 / 수주 관리";
    if(sub)sub.textContent="고객 수주, 납기, 생산연계, 출하 상태를 관리합니다.";
    if(actions&&!actions.querySelector("[data-nse-import]")){
      const btn=document.createElement("button");btn.type="button";btn.className="nse-head-btn";btn.setAttribute("data-nse-import","1");btn.textContent="수주 엑셀등록";
      const newBtn=Array.from(actions.querySelectorAll("button")).find(x=>/신규\s*수주/.test(clean(x.textContent)));
      actions.insertBefore(btn,newBtn||null);
    }
  }

  function render(){
    const host=document.getElementById(HOST_ID);if(!host)return;
    const list=rowsFiltered();
    host.innerHTML=`<div class="nse-toolbar"><div class="nse-left"><input class="nse-search" data-nse-search placeholder="수주번호 / 고객사 검색" value="${esc(state.query)}"><select data-nse-status>${["전체 상태","생산대기","진행중","출하예정","출하완료","지연"].map(x=>`<option ${x===state.status?"selected":""}>${x}</option>`).join("")}</select></div><div class="nse-right"><button class="nse-btn" type="button" data-nse-query>조회</button><button class="nse-btn" type="button" data-nse-export>엑셀</button></div></div><div class="nse-card"><div class="nse-table-wrap"><table><thead><tr><th>수주번호</th><th>고객사</th><th>제품</th><th>수량</th><th>납기</th><th>생산계획</th><th>출하</th><th>상태</th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td><button class="nse-order" data-nse-order="${esc(x.id)}">${esc(x.id)}</button></td><td>${esc(x.customer)}</td><td>${esc(x.product)}</td><td>${esc(x.qty.toLocaleString("ko-KR",{maximumFractionDigits:3}))} kg</td><td>${esc(x.due)}</td><td>${esc(x.production)}</td><td>${esc(x.shipment)}</td><td><span class="nse-status nse-${esc(x.tone)}">${esc(x.status)}</span></td></tr>`).join(""):`<tr><td colspan="8"><div class="nse-empty">조회 조건에 해당하는 수주가 없습니다.</div></td></tr>`}</tbody></table></div><div class="nse-count">${list.length.toLocaleString("ko-KR")}건</div></div>`;
  }

  function ensure(){
    ensureStyle();renameTopMenu();
    const root=document.querySelector(".qmes-sales-stable");
    if(!root){document.getElementById(HOST_ID)?.remove();return;}
    root.classList.add("qmes-sales-enterprise-active");ensureHeader(root);
    let host=document.getElementById(HOST_ID);
    if(!host){host=document.createElement("section");host.id=HOST_ID;const card=root.querySelector(":scope > .qerp-card");if(card)card.insertAdjacentElement("afterend",host);else root.appendChild(host);}
    render();
  }

  function exportExcel(){
    const list=rowsFiltered(),headers=["수주번호","고객사","제품","수량(kg)","납기","생산계획","출하","상태"];
    const cell=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    const csv="\ufeff"+[headers,...list.map(x=>[x.id,x.customer,x.product,x.qty,x.due,x.production,x.shipment,x.status])].map(row=>row.map(cell).join(",")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`NAMO_영업_수주_${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  function dateMinusOne(value){const t=iso(value);if(!t)return "";const d=new Date(t+"T00:00:00");d.setDate(d.getDate()-1);return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;}
  function nextId(due,used){const stamp=dateMinusOne(due)||new Date().toISOString().slice(0,10).replace(/-/g,"");let i=1,id="";do{id=`SO-${stamp}-${String(i++).padStart(3,"0")}`;}while(used.has(id));used.add(id);return id;}
  function headerValue(obj,names){for(const name of names){if(obj[name]!=null&&clean(obj[name]))return obj[name];}return "";}

  async function loadXlsx(){
    if(window.XLSX)return window.XLSX;
    await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";s.onload=resolve;s.onerror=()=>reject(new Error("엑셀 처리 모듈을 불러오지 못했습니다."));document.head.appendChild(s);});
    return window.XLSX;
  }

  async function importFile(file){
    try{
      const XLSX=await loadXlsx(),buffer=await file.arrayBuffer(),book=XLSX.read(buffer,{type:"array",cellDates:true}),sheet=book.Sheets[book.SheetNames[0]],data=XLSX.utils.sheet_to_json(sheet,{defval:"",raw:false});
      if(!data.length){alert("등록할 수주 데이터가 없습니다.");return;}
      const current=salesRows(),map=metaMap(),used=new Set(current.map(row=>visibleId(row,map)).filter(Boolean));let added=0,skipped=0;
      for(const src of data){
        const customer=clean(headerValue(src,["고객사","Customer","customer"])),product=clean(headerValue(src,["제품","제품명","Product","product"])),qty=num(headerValue(src,["수량","수주수량","수량(kg)","Qty","qty"])),due=iso(headerValue(src,["납기","납기일","요청납기일","Due","due"]));
        if(!customer||!product||!qty||!due){skipped++;continue;}
        let id=clean(headerValue(src,["수주번호","SO","Sales Order","salesOrderId"]));if(!id)id=nextId(due,used);else if(used.has(id)){skipped++;continue;}else used.add(id);
        const now=new Date().toISOString(),po=clean(headerValue(src,["고객 PO","고객PO","PO"])),delivery=clean(headerValue(src,["납품처","Delivery"])),customerItemCode=clean(headerValue(src,["고객 품목코드","고객품번","Customer Item"]));
        const meta={salesOrderIdOverride:id,requestedDue:due,customerOverride:customer,productOverride:product,qtyOverride:qty,deliveryPlace:delivery,customerItemCode,masterDataOwner:"SALES",source:"SALES_ENTERPRISE_EXCEL_V1",savedAt:now};
        const row={id,customer,po:po||"-",product,qty,due,plan:"계획대기",shipping:"-",deliveryPlace:delivery,customerItemCode,source:"EXCEL",orderMeta:meta};
        current.unshift(row);map[id]=meta;added++;
      }
      if(!added){alert(`등록된 수주가 없습니다. 필수값 또는 중복 수주번호를 확인하세요. (제외 ${skipped}건)`);return;}
      write(SALES_KEY,current);write(META_KEY,map);
      if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",schema:1,kind:"sales",rows:current,savedAt:new Date().toISOString(),source:"SALES_ENTERPRISE_EXCEL_V1"});
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"excel-import"}}));window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales"}}));
      alert(`수주 ${added}건 등록 완료${skipped?` / 제외 ${skipped}건`:""}`);ensure();
    }catch(error){console.error("[Sales Enterprise] Excel import failed",error);alert("수주 엑셀등록 중 오류가 발생했습니다. "+clean(error?.message));}
  }

  document.addEventListener("click",event=>{
    const t=event.target;if(!(t instanceof Element))return;
    const order=t.closest("[data-nse-order]");if(order){event.preventDefault();event.stopPropagation();window.qmesSalesOrderDetail?.open?.(order.getAttribute("data-nse-order"));return;}
    if(t.closest("[data-nse-query]")){event.preventDefault();const host=document.getElementById(HOST_ID);state.query=clean(host?.querySelector("[data-nse-search]")?.value);state.status=clean(host?.querySelector("[data-nse-status]")?.value)||"전체 상태";render();return;}
    if(t.closest("[data-nse-export]")){event.preventDefault();exportExcel();return;}
    if(t.closest("[data-nse-import]")){event.preventDefault();let input=document.getElementById(IMPORT_ID);if(!input){input=document.createElement("input");input.id=IMPORT_ID;input.type="file";input.accept=".xlsx,.xls,.csv";input.hidden=true;input.addEventListener("change",()=>{const file=input.files?.[0];if(file)importFile(file);input.value="";});document.body.appendChild(input);}input.click();}
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Enter"&&event.target?.matches?.(`#${HOST_ID} [data-nse-search]`)){event.preventDefault();state.query=clean(event.target.value);state.status=clean(document.querySelector(`#${HOST_ID} [data-nse-status]`)?.value)||"전체 상태";render();}},true);
  document.addEventListener("input",event=>{if(event.target?.matches?.(`#${HOST_ID} [data-nse-search]`))state.query=event.target.value;});
  document.addEventListener("change",event=>{if(event.target?.matches?.(`#${HOST_ID} [data-nse-status]`)){state.status=event.target.value;render();}});

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensure();});}
  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,DELETED_KEY].includes(event.key))schedule();});window.addEventListener("hashchange",schedule);window.addEventListener("popstate",schedule);
  const boot=()=>{ensure();[80,180,350,700,1200,2200,4000].forEach(ms=>setTimeout(ensure,ms));const app=document.getElementById("root")||document.body;new MutationObserver(schedule).observe(app,{childList:true,subtree:true});};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesEnterpriseModule={ensure,render,exportExcel};
})();
