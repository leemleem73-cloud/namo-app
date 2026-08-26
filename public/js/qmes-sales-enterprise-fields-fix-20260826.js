/* NAMO QMES — enterprise sales fields/table alignment fix — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ENTERPRISE_FIELDS_FIX_20260826__) return;
  window.__QMES_SALES_ENTERPRISE_FIELDS_FIX_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const state={customerItemCode:"",deliveryPlace:"",orderType:"양산"};

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const map=k=>{const v=read(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const root=()=>Array.from(document.querySelectorAll(".qerp")).find(el=>clean(el.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  const table=r=>Array.from(r?.querySelectorAll("table.qerp-table")||[]).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)))||null;
  const rowData=id=>rows().find(r=>clean(r?.id)===id)||{};
  const metaFor=id=>{const r=rowData(id),m=map(META_KEY),key=clean(r.workOrder)||id;return m[id]||m[key]||r.orderMeta||{};};
  const packagingFor=id=>{const r=rowData(id),m=map(PACK_KEY),key=clean(r.workOrder)||id;return m[id]||m[key]||r.packaging||null;};
  const remarkFor=id=>{const r=rowData(id),m=map(REMARK_KEY),key=clean(r.workOrder)||id;return clean(m[id]??m[key]??r.remarks??r.remark??r.note);};
  const packageText=p=>{if(!p)return "포장정보 미입력";const type=clean(p.type||p.packagingType),u=Number((p.unitWeight??p.unitPackQty)??0),q=Number(p.packageQty||0);return [type,u&&q?`${u}kg × ${q}EA`:u?`${u}kg/EA`:q?`${q}EA`:""].filter(Boolean).join(" · ")||"포장정보 미입력";};
  const today=()=>new Date().toISOString().slice(0,10);

  function dueStatus(row){
    if(/출하완료/.test(clean(row.shipping)))return ["완료","done"];
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(clean(row.due)))return ["-","neutral"];
    const d=Math.round((new Date(row.due+"T00:00:00")-new Date(today()+"T00:00:00"))/86400000);
    if(d<0)return [`지연 ${Math.abs(d)}일`,"bad"];
    if(d<=7)return [`임박 D-${d}`,"warn"];
    return ["정상","good"];
  }

  function field(label,kind){
    const wrap=document.createElement("div");wrap.className="qerp-field qmes-sales-extra-field";wrap.dataset.qmesEnterpriseField=kind;
    const l=document.createElement("label");l.textContent=label;wrap.appendChild(l);
    if(kind==="orderType"){
      const s=document.createElement("select");s.innerHTML='<option>양산</option><option>개발</option><option>샘플</option><option>긴급</option>';s.value=state.orderType;s.onchange=()=>state.orderType=s.value;wrap.appendChild(s);
    }else{
      const i=document.createElement("input");i.type="text";i.placeholder=kind==="customerItemCode"?"고객 품목코드":"납품처 / 공장";i.oninput=()=>state[kind]=i.value;wrap.appendChild(i);
    }
    return wrap;
  }

  function ensureForm(r){
    const f=r.querySelector("form.qerp-form");if(!f)return;
    f.classList.add("qerp-sales-compact-form");
    const actions=f.querySelector(".qerp-form-actions");if(!actions)return;
    if(!f.querySelector('[data-qmes-enterprise-field="customerItemCode"]'))actions.before(field("고객 품목코드","customerItemCode"));
    if(!f.querySelector('[data-qmes-enterprise-field="deliveryPlace"]'))actions.before(field("납품처","deliveryPlace"));
    if(!f.querySelector('[data-qmes-enterprise-field="orderType"]'))actions.before(field("수주구분","orderType"));
  }

  function resetCustomColumns(t){
    const h=t.querySelector("thead tr");if(!h)return;
    h.querySelectorAll('[data-qmes-sales-pack-head],[data-qmes-sales-due-head],[data-qmes-sales-delivery-head],[data-qmes-sales-remark-head],[data-qmes-sales-manage-head]').forEach(n=>n.remove());
    t.querySelectorAll("tbody tr").forEach(tr=>tr.querySelectorAll('[data-qmes-sales-pack-cell],[data-qmes-sales-due-cell],[data-qmes-sales-delivery-cell],[data-qmes-sales-remark-cell],[data-qmes-sales-manage-cell]').forEach(n=>n.remove()));
  }

  function insertHead(h,text,attr,beforeText){
    const th=document.createElement("th");th.textContent=text;th.setAttribute(attr,"1");
    const before=Array.from(h.children).find(x=>clean(x.textContent)===beforeText);
    if(before)h.insertBefore(th,before);else h.appendChild(th);
  }
  function insertCellByHeader(tr,h,attr,cellAttr){
    const th=h.querySelector(`[${attr}="1"]`);if(!th)return null;
    const idx=Array.from(h.children).indexOf(th),td=document.createElement("td");td.setAttribute(cellAttr,"1");
    const target=tr.children[idx]||null;if(target)tr.insertBefore(td,target);else tr.appendChild(td);return td;
  }

  function ensureTable(r){
    const t=table(r);if(!t)return;
    if(t.dataset.qmesEnterpriseFixed==="1")return;
    resetCustomColumns(t);
    const h=t.querySelector("thead tr");if(!h)return;
    insertHead(h,"포장정보","data-qmes-sales-pack-head","납기일");
    insertHead(h,"납기상태","data-qmes-sales-due-head","생산계획");
    insertHead(h,"납품정보","data-qmes-sales-delivery-head","__END__");
    insertHead(h,"비고","data-qmes-sales-remark-head","__END__");
    insertHead(h,"","data-qmes-sales-manage-head","__END__");

    t.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;const row=rowData(id),meta=metaFor(id);
      const p=insertCellByHeader(tr,h,"data-qmes-sales-pack-head","data-qmes-sales-pack-cell");if(p){p.textContent=packageText(packagingFor(id));p.className=packageText(packagingFor(id))==="포장정보 미입력"?"qmes-sales-packaging-empty":"qmes-sales-packaging-text";}
      const d=insertCellByHeader(tr,h,"data-qmes-sales-due-head","data-qmes-sales-due-cell");if(d){const [label,cls]=dueStatus(row),s=document.createElement("span");s.className=`qmes-sales-due-badge ${cls}`;s.textContent=label;d.appendChild(s);}
      const di=insertCellByHeader(tr,h,"data-qmes-sales-delivery-head","data-qmes-sales-delivery-cell");if(di)di.textContent=[clean(meta.orderType),clean(meta.deliveryPlace)].filter(Boolean).join(" · ")||"-";
      const rm=insertCellByHeader(tr,h,"data-qmes-sales-remark-head","data-qmes-sales-remark-cell");if(rm)rm.textContent=remarkFor(id)||"-";
      const mg=insertCellByHeader(tr,h,"data-qmes-sales-manage-head","data-qmes-sales-manage-cell");if(mg){const b=document.createElement("button");b.type="button";b.className="qmes-sales-delete-btn";b.dataset.salesId=id;b.textContent="삭제";mg.appendChild(b);}
      const code=clean(meta.customerItemCode);if(code&&tr.children[3]&&!tr.children[3].querySelector(".qmes-sales-subtext")){const s=document.createElement("span");s.className="qmes-sales-subtext";s.textContent=`고객품번 ${code}`;tr.children[3].appendChild(s);}
    });
    t.dataset.qmesEnterpriseFixed="1";
  }

  document.addEventListener("submit",e=>{
    const f=e.target;if(!(f instanceof HTMLFormElement)||!f.classList.contains("qerp-form"))return;
    const r=f.closest(".qerp");if(!r||clean(r.querySelector(".qerp-title")?.textContent)!=="수주 · 납기관리")return;
    const before=new Set(rows().map(x=>clean(x.id)));
    const snap={customerItemCode:clean(state.customerItemCode),deliveryPlace:clean(state.deliveryPlace),orderType:clean(state.orderType)||"양산"};
    [120,350,800,1500].forEach(ms=>setTimeout(()=>{
      const rs=rows();const row=rs.find(x=>!before.has(clean(x.id)));if(!row)return;
      const id=clean(row.id),key=clean(row.workOrder)||id,m=map(META_KEY),meta={...m[id],...snap,orderDate:clean(m[id]?.orderDate)||today(),savedAt:new Date().toISOString()};m[id]=meta;m[key]=meta;write(META_KEY,m);
      const next=rs.map(x=>clean(x.id)===id?{...x,orderMeta:meta,customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderDate:meta.orderDate}:x);write(SALES_KEY,next);
      const rr=root();const tt=table(rr);if(tt){delete tt.dataset.qmesEnterpriseFixed;}schedule();
    },ms));
  },true);

  function apply(){const r=root();if(!r)return;ensureForm(r);const t=table(r);if(t&&t.querySelectorAll("tbody tr").length!==Number(t.dataset.qmesRowCount||-1)){delete t.dataset.qmesEnterpriseFixed;t.dataset.qmesRowCount=String(t.querySelectorAll("tbody tr").length);}ensureTable(r);}
  let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated"].forEach(n=>window.addEventListener(n,()=>setTimeout(schedule,0)));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
