/* NAMO QMES — stable sales remark actions (edit/delete in remarks only) — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_REMARK_ACTIONS_20260826__) return;
  window.__QMES_SALES_REMARK_ACTIONS_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";

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
  function remarkFor(row){
    if(!row)return "";
    const m=map(REMARK_KEY),id=clean(row.id),key=clean(row.workOrder)||id;
    return clean(m[id]??m[key]??row.remarks??row.remark??row.note);
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-remark-actions-style-20260826"))return;
    const style=document.createElement("style");
    style.id="qmes-sales-remark-actions-style-20260826";
    style.textContent=`
      .qmes-sales-remark-actions{display:flex;align-items:center;gap:5px;margin-top:5px;white-space:nowrap}
      .qmes-sales-edit-btn,.qmes-sales-delete-btn{height:30px;border-radius:6px;padding:0 8px;font-size:10px;font-weight:900;cursor:pointer;background:#fff}
      .qmes-sales-edit-btn{border:1px solid #bfdbfe;color:#1d4ed8;background:#eff6ff}
      .qmes-sales-delete-btn{border:1px solid #fecaca;color:#b91c1c}
      .qmes-sales-remark-value{display:block;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569;font-size:10px;min-height:16px}
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
    const note=window.prompt("비고",remarkFor(row));if(note===null)return;

    const qtyNum=Number(String(qty).replace(/,/g,""));
    if(!customer.trim()||!product.trim()||!Number.isFinite(qtyNum)||qtyNum<=0){window.alert("고객사·제품·수량을 확인하세요.");return;}
    if(due.trim()&&!/^20\d{2}-\d{2}-\d{2}$/.test(due.trim())){window.alert("요청 납기일은 YYYY-MM-DD 형식으로 입력하세요.");return;}

    const idKey=clean(row.id),workKey=clean(row.workOrder)||idKey;
    const metaMap=map(META_KEY);
    const nextMeta={...meta,customerOverride:customer.trim(),poOverride:po.trim()||"-",productOverride:product.trim(),qtyOverride:qtyNum,requestedDue:due.trim(),savedAt:new Date().toISOString()};
    metaMap[idKey]=nextMeta;metaMap[workKey]=nextMeta;write(META_KEY,metaMap);

    const remarkMap=map(REMARK_KEY);remarkMap[idKey]=note.trim();remarkMap[workKey]=note.trim();write(REMARK_KEY,remarkMap);
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

  function normalizeRemarkCells(t){
    t.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;
      const remark=tr.querySelector('[data-qmes-sales-remark-cell="1"]');
      if(!remark)return;
      const row=rowById(id);if(!row)return;
      const wanted=remarkFor(row)||"-";

      let value=remark.querySelector(".qmes-sales-remark-value");
      if(!value){
        remark.innerHTML="";
        value=document.createElement("span");value.className="qmes-sales-remark-value";remark.appendChild(value);
      }
      if(value.textContent!==wanted)value.textContent=wanted;
      value.title=wanted==="-"?"":wanted;

      let actions=remark.querySelector(".qmes-sales-remark-actions");
      if(!actions){actions=document.createElement("div");actions.className="qmes-sales-remark-actions";remark.appendChild(actions);}
      if(!actions.querySelector(".qmes-sales-edit-btn")){
        const edit=document.createElement("button");edit.type="button";edit.className="qmes-sales-edit-btn";edit.dataset.qmesSalesEdit=id;edit.textContent="수정";actions.appendChild(edit);
      }
      if(!actions.querySelector(".qmes-sales-delete-btn")){
        const del=document.createElement("button");del.type="button";del.className="qmes-sales-delete-btn";del.dataset.salesId=id;del.textContent="삭제";actions.appendChild(del);
      }
    });
  }

  let applying=false;
  function apply(){
    if(applying)return;
    const r=root(),t=table(r);if(!t)return;
    applying=true;
    try{ensureStyle();removeLegacyManage(t);normalizeRemarkCells(t);}finally{applying=false;}
  }

  document.addEventListener("click",event=>{
    const edit=event.target.closest?.(".qmes-sales-edit-btn");
    if(!edit)return;
    event.preventDefault();event.stopPropagation();editSales(edit.dataset.qmesSalesEdit||"");
  },true);

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else apply();
})();
