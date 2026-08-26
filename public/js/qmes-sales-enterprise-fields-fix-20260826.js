/* NAMO QMES — legacy sales patch compatibility shim — 2026-08-26
 * This file intentionally no longer rebuilds columns or labels.
 * It only removes any legacy 관리 column and places 수정/삭제 under 비고.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ENTERPRISE_FIELDS_FIX_20260826__) return;
  window.__QMES_SALES_ENTERPRISE_FIELDS_FIX_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const map=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rowById=id=>rows().find(row=>clean(row?.id)===clean(id))||null;
  const salesRoot=()=>Array.from(document.querySelectorAll(".qerp")).find(el=>clean(el.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  const salesTable=root=>Array.from(root?.querySelectorAll("table.qerp-table")||[]).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)))||null;

  function metaFor(row){
    if(!row)return {};
    const m=map(META_KEY),id=clean(row.id),key=clean(row.workOrder)||id;
    return m[id]||m[key]||row.orderMeta||{};
  }
  function remarkFor(row){
    if(!row)return "";
    const m=map(REMARK_KEY),id=clean(row.id),key=clean(row.workOrder)||id;
    return clean(m[id]??m[key]??row.remarks??row.remark??row.note);
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-legacy-actions-style-20260826"))return;
    const s=document.createElement("style");s.id="qmes-sales-legacy-actions-style-20260826";
    s.textContent=`
      .qmes-sales-legacy-actions{display:flex;gap:5px;align-items:center;margin-top:5px;white-space:nowrap}
      .qmes-sales-legacy-edit,.qmes-sales-delete-btn{height:30px;border-radius:6px;padding:0 8px;font-size:10px;font-weight:900;cursor:pointer;background:#fff}
      .qmes-sales-legacy-edit{border:1px solid #bfdbfe;color:#1d4ed8;background:#eff6ff}
      .qmes-sales-delete-btn{border:1px solid #fecaca;color:#b91c1c}
      .qmes-sales-legacy-remark{display:block;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569;font-size:10px;min-height:16px}
    `;document.head.appendChild(s);
  }

  function editSales(id){
    const row=rowById(id);if(!row){window.alert("수주 데이터를 찾을 수 없습니다.");return;}
    const meta=metaFor(row);
    const customer=window.prompt("고객사",clean(meta.customerOverride)||clean(row.customer));if(customer===null)return;
    const po=window.prompt("고객 PO",clean(meta.poOverride)||clean(row.po));if(po===null)return;
    const due=window.prompt("요청 납기일 (YYYY-MM-DD)",clean(meta.requestedDue)||clean(row.due));if(due===null)return;
    const product=window.prompt("제품",clean(meta.productOverride)||clean(row.product));if(product===null)return;
    const qty=window.prompt("수량 (kg)",String(meta.qtyOverride||row.qty||""));if(qty===null)return;
    const note=window.prompt("비고",remarkFor(row));if(note===null)return;
    const qtyNum=Number(String(qty).replace(/,/g,""));
    if(!customer.trim()||!product.trim()||!Number.isFinite(qtyNum)||qtyNum<=0){window.alert("고객사·제품·수량을 확인하세요.");return;}
    if(due.trim()&&!/^20\d{2}-\d{2}-\d{2}$/.test(due.trim())){window.alert("요청 납기일은 YYYY-MM-DD 형식으로 입력하세요.");return;}
    const idKey=clean(row.id),workKey=clean(row.workOrder)||idKey,m=map(META_KEY);
    const nextMeta={...meta,customerOverride:customer.trim(),poOverride:po.trim()||"-",productOverride:product.trim(),qtyOverride:qtyNum,requestedDue:due.trim(),savedAt:new Date().toISOString()};
    m[idKey]=nextMeta;m[workKey]=nextMeta;write(META_KEY,m);
    const rm=map(REMARK_KEY);rm[idKey]=note.trim();rm[workKey]=note.trim();write(REMARK_KEY,rm);
    if(typeof window.qmesSalesFromWorkOrderApply==="function")window.qmesSalesFromWorkOrderApply();
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_EDIT",id:idKey}}));
    setTimeout(()=>window.location.reload(),100);
  }

  function removeManageColumn(table){
    const head=table?.querySelector("thead tr");if(!head)return;
    Array.from(head.children).forEach((th,index)=>{
      if(th.hasAttribute("data-qmes-sales-manage-head")||clean(th.textContent)==="관리"){
        th.remove();
        table.querySelectorAll("tbody tr").forEach(tr=>tr.children[index]?.remove());
      }
    });
    table.querySelectorAll('[data-qmes-sales-manage-cell]').forEach(node=>node.remove());
  }

  function normalizeRemarks(table){
    const head=table.querySelector("thead tr");if(!head)return;
    const remarkIndex=Array.from(head.children).findIndex(th=>clean(th.textContent)==="비고"||th.hasAttribute("data-qmes-sales-remark-head"));
    if(remarkIndex<0)return;
    table.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent),row=rowById(id);if(!id||!row)return;
      const td=tr.querySelector('[data-qmes-sales-remark-cell]')||tr.children[remarkIndex];if(!td)return;
      td.innerHTML="";
      const value=document.createElement("span");value.className="qmes-sales-legacy-remark";value.textContent=remarkFor(row)||"-";td.appendChild(value);
      const actions=document.createElement("div");actions.className="qmes-sales-legacy-actions";
      const edit=document.createElement("button");edit.type="button";edit.className="qmes-sales-legacy-edit";edit.dataset.qmesSalesEdit=id;edit.textContent="수정";actions.appendChild(edit);
      const del=document.createElement("button");del.type="button";del.className="qmes-sales-delete-btn";del.dataset.salesId=id;del.textContent="삭제";actions.appendChild(del);
      td.appendChild(actions);
    });
  }

  let applying=false;
  function apply(){
    if(applying)return;
    const root=salesRoot(),table=salesTable(root);if(!table)return;
    applying=true;
    try{ensureStyle();removeManageColumn(table);normalizeRemarks(table);}finally{applying=false;}
  }

  document.addEventListener("click",event=>{
    const edit=event.target.closest?.(".qmes-sales-legacy-edit");if(!edit)return;
    event.preventDefault();event.stopPropagation();editSales(edit.dataset.qmesSalesEdit||"");
  },true);

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else apply();
})();
