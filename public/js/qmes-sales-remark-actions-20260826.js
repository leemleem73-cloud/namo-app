/* NAMO QMES — final sales table cleanup: delivery place + unlabeled actions — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_REMARK_ACTIONS_20260826__) return;
  window.__QMES_SALES_REMARK_ACTIONS_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const map=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rowById=id=>rows().find(row=>clean(row?.id)===clean(id))||null;
  const root=()=>Array.from(document.querySelectorAll(".qerp")).find(el=>clean(el.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  const table=r=>Array.from(r?.querySelectorAll("table.qerp-table")||[]).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)))||null;

  function metaFor(row){
    if(!row)return {};
    const m=map(META_KEY),id=clean(row.id),key=clean(row.workOrder)||id;
    return m[id]||m[key]||row.orderMeta||{};
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-final-actions-style-20260826"))return;
    const style=document.createElement("style");
    style.id="qmes-sales-final-actions-style-20260826";
    style.textContent=`
      /* Keep compact UI's remark nodes present so it does not recreate them,
         but remove the remarks column visually from the sales list. */
      .qerp-table [data-qmes-sales-remark-head],
      .qerp-table [data-qmes-sales-remark-cell]{display:none!important;}
      .qmes-sales-action-cell{white-space:nowrap;text-align:center!important;min-width:86px!important;}
      .qmes-sales-action-wrap{display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;}
      .qmes-sales-edit-btn,.qmes-sales-delete-btn{height:30px;border-radius:6px;padding:0 8px;font-size:10px;font-weight:900;cursor:pointer;background:#fff;}
      .qmes-sales-edit-btn{border:1px solid #bfdbfe;color:#1d4ed8;background:#eff6ff;}
      .qmes-sales-delete-btn{border:1px solid #fecaca;color:#b91c1c;}
    `;
    document.head.appendChild(style);
  }

  function editSales(id){
    const row=rowById(id);if(!row){window.alert("수주 데이터를 찾을 수 없습니다.");return;}
    const meta=metaFor(row);
    const customer=window.prompt("고객사",clean(meta.customerOverride)||clean(row.customer));if(customer===null)return;
    const po=window.prompt("고객 PO",clean(meta.poOverride)||clean(row.po));if(po===null)return;
    const due=window.prompt("요청 납기일 (YYYY-MM-DD)",clean(meta.requestedDue)||clean(row.due));if(due===null)return;
    const product=window.prompt("제품",clean(meta.productOverride)||clean(row.product));if(product===null)return;
    const qty=window.prompt("수량 (kg)",String(meta.qtyOverride||row.qty||""));if(qty===null)return;
    const deliveryPlace=window.prompt("납품처",clean(meta.deliveryPlace)||clean(row.deliveryPlace));if(deliveryPlace===null)return;

    const qtyNum=Number(String(qty).replace(/,/g,""));
    if(!customer.trim()||!product.trim()||!Number.isFinite(qtyNum)||qtyNum<=0){window.alert("고객사·제품·수량을 확인하세요.");return;}
    if(due.trim()&&!/^20\d{2}-\d{2}-\d{2}$/.test(due.trim())){window.alert("요청 납기일은 YYYY-MM-DD 형식으로 입력하세요.");return;}

    const idKey=clean(row.id),workKey=clean(row.workOrder)||idKey;
    const metaMap=map(META_KEY);
    const nextMeta={
      ...meta,
      customerOverride:customer.trim(),
      poOverride:po.trim()||"-",
      productOverride:product.trim(),
      qtyOverride:qtyNum,
      requestedDue:due.trim(),
      deliveryPlace:deliveryPlace.trim(),
      savedAt:new Date().toISOString()
    };
    metaMap[idKey]=nextMeta;metaMap[workKey]=nextMeta;write(META_KEY,metaMap);

    if(typeof window.qmesSalesFromWorkOrderApply==="function")window.qmesSalesFromWorkOrderApply();
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_EDIT",id:idKey}}));
    setTimeout(()=>window.location.reload(),100);
  }

  function removeLegacyManage(t){
    const head=t?.querySelector("thead tr");if(!head)return;
    const headers=Array.from(head.children);
    headers.forEach((th,index)=>{
      if(th.hasAttribute("data-qmes-sales-manage-head")||clean(th.textContent)==="관리"){
        th.remove();
        t.querySelectorAll("tbody tr").forEach(tr=>tr.children[index]?.remove());
      }
    });
    t.querySelectorAll('[data-qmes-sales-manage-cell]').forEach(node=>node.remove());
  }

  function normalizeDeliveryHeaderAndCells(t){
    const head=t.querySelector("thead tr");if(!head)return;
    const deliveryHead=head.querySelector('[data-qmes-sales-delivery-head]')||Array.from(head.children).find(th=>clean(th.textContent)==="납품정보");
    if(deliveryHead&&clean(deliveryHead.textContent)!=="납품처")deliveryHead.textContent="납품처";

    t.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;
      const row=rowById(id);if(!row)return;
      const deliveryCell=tr.querySelector('[data-qmes-sales-delivery-cell]');
      if(!deliveryCell)return;
      const place=clean(metaFor(row).deliveryPlace)||clean(row.deliveryPlace)||"-";
      let span=deliveryCell.querySelector(".qmes-sales-delivery-text");
      if(!span){deliveryCell.innerHTML="";span=document.createElement("span");span.className="qmes-sales-delivery-text";deliveryCell.appendChild(span);}
      if(span.textContent!==place)span.textContent=place;
      span.title=place==="-"?"":place;
    });
  }

  function ensureActionColumn(t){
    const head=t.querySelector("thead tr");if(!head)return;
    let actionHead=head.querySelector('[data-qmes-sales-action-head="1"]');
    if(!actionHead){
      actionHead=document.createElement("th");
      actionHead.dataset.qmesSalesActionHead="1";
      actionHead.textContent="";
      actionHead.setAttribute("aria-label","수주 작업");
      head.appendChild(actionHead);
    }

    t.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;
      let cell=tr.querySelector('[data-qmes-sales-action-cell="1"]');
      if(!cell){
        cell=document.createElement("td");
        cell.dataset.qmesSalesActionCell="1";
        cell.className="qmes-sales-action-cell";
        tr.appendChild(cell);
      }
      let wrap=cell.querySelector(".qmes-sales-action-wrap");
      if(!wrap){cell.innerHTML="";wrap=document.createElement("div");wrap.className="qmes-sales-action-wrap";cell.appendChild(wrap);}
      let edit=wrap.querySelector(".qmes-sales-edit-btn");
      if(!edit){edit=document.createElement("button");edit.type="button";edit.className="qmes-sales-edit-btn";edit.textContent="수정";wrap.appendChild(edit);}
      edit.dataset.qmesSalesEdit=id;
      let del=wrap.querySelector(".qmes-sales-delete-btn");
      if(!del){del=document.createElement("button");del.type="button";del.className="qmes-sales-delete-btn";del.textContent="삭제";wrap.appendChild(del);}
      del.dataset.salesId=id;
    });
  }

  function hideRemarkHeaderFallback(t){
    const head=t.querySelector("thead tr");if(!head)return;
    Array.from(head.children).forEach((th,index)=>{
      if(clean(th.textContent)!=="비고")return;
      th.style.setProperty("display","none","important");
      t.querySelectorAll("tbody tr").forEach(tr=>{
        const td=tr.children[index];if(td)td.style.setProperty("display","none","important");
      });
    });
  }

  let applying=false;
  function apply(){
    if(applying)return;
    const r=root(),t=table(r);if(!t)return;
    applying=true;
    try{
      ensureStyle();
      removeLegacyManage(t);
      normalizeDeliveryHeaderAndCells(t);
      hideRemarkHeaderFallback(t);
      ensureActionColumn(t);
    }finally{applying=false;}
  }

  document.addEventListener("click",event=>{
    const edit=event.target.closest?.(".qmes-sales-edit-btn");
    if(!edit)return;
    event.preventDefault();event.stopPropagation();editSales(edit.dataset.qmesSalesEdit||"");
  },true);

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else apply();
})();
