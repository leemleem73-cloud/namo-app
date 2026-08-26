/* QMES sales/delivery compact UI + packaging information — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPACT_UI_20260826__) return;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const ERP_SYNC_TYPE="inventory";
  const ERP_RECORD_KEY="erp:sales";
  const formPackagingState={type:"",unitWeight:"",packageQty:""};
  let pendingSave=null;

  const style=document.createElement("style");
  style.id="qmes-sales-compact-ui-20260826-style";
  style.textContent=`
    .qerp-sales-compact-form{
      display:grid!important;
      grid-template-columns:minmax(118px,.9fr) minmax(135px,1fr) minmax(132px,.95fr) minmax(142px,1.05fr) minmax(82px,.62fr) minmax(98px,.72fr) minmax(94px,.7fr) minmax(82px,.6fr) auto!important;
      gap:7px!important;
      align-items:end!important;
      margin-bottom:10px!important;
    }
    .qerp-sales-compact-form .qerp-field{min-width:0!important;}
    .qerp-sales-compact-form .qerp-field label{margin-bottom:3px!important;font-size:9px!important;line-height:1.15!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-field input,
    .qerp-sales-compact-form .qerp-field select{height:32px!important;padding:0 7px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-form-actions{grid-column:auto!important;align-self:end!important;display:flex!important;gap:6px!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-form-actions .qerp-btn{height:32px!important;padding:0 9px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-error{grid-column:1/-1!important;padding:6px 8px!important;margin:0!important;}
    .qmes-sales-pack-field input,.qmes-sales-pack-field select{background:#fffdf7!important;border-color:#f1c67b!important;}
    .qmes-sales-packaging-text{font-size:11px;font-weight:800;color:#334155;white-space:nowrap;}
    .qmes-sales-packaging-empty{font-size:10px;font-weight:800;color:#c2410c;background:#fff7ed;border-radius:999px;padding:3px 6px;white-space:nowrap;}
    @media(max-width:1500px){
      .qerp-sales-compact-form{grid-template-columns:repeat(5,minmax(0,1fr))!important;}
      .qerp-sales-compact-form .qerp-form-actions{grid-column:1/-1!important;justify-content:flex-end!important;}
    }
    @media(max-width:1050px){.qerp-sales-compact-form{grid-template-columns:repeat(3,minmax(0,1fr))!important;}}
    @media(max-width:700px){.qerp-sales-compact-form{grid-template-columns:1fr!important;}}
  `;
  document.head.appendChild(style);

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function num(value){const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;}
  function readJson(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_error){}}
  function readPackagingMap(){const value=readJson(PACK_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
  function readSalesRows(){const value=readJson(SALES_KEY,[]);return Array.isArray(value)?value:[];}
  function salesRoot(){
    return Array.from(document.querySelectorAll(".qerp")).find(root=>clean(root.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  }
  function ensureOption(select,value){
    if(!select)return;
    let option=Array.from(select.options||[]).find(opt=>clean(opt.value||opt.textContent)===value);
    if(!option){option=document.createElement("option");option.value=value;option.textContent=value;select.appendChild(option);}
    if(select.value!==value){
      select.value=value;
      select.dispatchEvent(new Event("change",{bubbles:true}));
    }
  }
  function fieldByLabel(form,label){
    return Array.from(form.querySelectorAll(".qerp-field")).find(field=>clean(field.querySelector("label")?.textContent)===label)||null;
  }
  function makeField(label,kind){
    const field=document.createElement("div");
    field.className="qerp-field qmes-sales-pack-field";
    field.dataset.qmesSalesPack=kind;
    const lab=document.createElement("label");lab.textContent=label;field.appendChild(lab);
    if(kind==="type"){
      const select=document.createElement("select");
      select.innerHTML='<option value="">선택</option><option value="CAN">CAN</option><option value="DRUM">DRUM</option><option value="IBC">IBC</option><option value="기타">기타</option>';
      select.value=formPackagingState.type;
      select.addEventListener("change",()=>{formPackagingState.type=select.value;});
      field.appendChild(select);
    }else{
      const input=document.createElement("input");
      input.type="number";input.min="0";input.step=kind==="unitWeight"?"0.001":"1";input.inputMode="decimal";
      input.placeholder=kind==="unitWeight"?"kg/EA":"EA";
      input.value=formPackagingState[kind];
      input.addEventListener("input",()=>{formPackagingState[kind]=input.value;});
      field.appendChild(input);
    }
    return field;
  }
  function ensurePackagingFields(form){
    const actions=form.querySelector(".qerp-form-actions");
    if(!actions)return;
    if(!form.querySelector('[data-qmes-sales-pack="type"]')) actions.before(makeField("포장형태","type"));
    if(!form.querySelector('[data-qmes-sales-pack="unitWeight"]')) actions.before(makeField("단위 포장량(kg)","unitWeight"));
    if(!form.querySelector('[data-qmes-sales-pack="packageQty"]')) actions.before(makeField("포장수량(EA)","packageQty"));
  }
  function packagingText(pkg){
    if(!pkg)return "";
    const type=clean(pkg.type||pkg.packagingType);
    const unit=num(pkg.unitWeight??pkg.unitPackQty);
    const count=num(pkg.packageQty);
    if(!type&&!unit&&!count)return "";
    const parts=[];
    if(type)parts.push(type);
    if(unit&&count)parts.push(`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`);
    else if(unit)parts.push(`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg/EA`);
    else if(count)parts.push(`${count.toLocaleString("ko-KR")}EA`);
    return parts.join(" · ");
  }
  function resolvePackaging(rowId){
    const rows=readSalesRows();
    const row=rows.find(item=>clean(item?.id)===rowId)||{};
    const map=readPackagingMap();
    const key=clean(row.workOrder)||rowId;
    return map[rowId]||map[key]||row.packaging||(
      row.packagingType||row.unitPackQty||row.packageQty
        ? {type:row.packagingType,unitWeight:row.unitPackQty,packageQty:row.packageQty}
        : null
    );
  }
  function ensurePackagingColumn(root){
    const table=Array.from(root.querySelectorAll("table.qerp-table")).find(table=>/수주번호/.test(clean(table.querySelector("thead")?.textContent)));
    if(!table)return;
    const headRow=table.querySelector("thead tr");
    if(headRow&&!headRow.querySelector('[data-qmes-sales-pack-head="1"]')){
      const th=document.createElement("th");th.dataset.qmesSalesPackHead="1";th.textContent="포장정보";
      const headers=Array.from(headRow.children);
      const dueHeader=headers.find(el=>clean(el.textContent)==="납기일");
      if(dueHeader)headRow.insertBefore(th,dueHeader);else headRow.appendChild(th);
    }
    table.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);
      if(!id)return;
      let td=tr.querySelector('[data-qmes-sales-pack-cell="1"]');
      if(!td){
        td=document.createElement("td");td.dataset.qmesSalesPackCell="1";
        const cells=Array.from(tr.children);
        const dueCell=cells[5];
        if(dueCell)tr.insertBefore(td,dueCell);else tr.appendChild(td);
      }
      const info=packagingText(resolvePackaging(id));
      td.innerHTML="";
      const span=document.createElement("span");
      span.className=info?"qmes-sales-packaging-text":"qmes-sales-packaging-empty";
      span.textContent=info||"포장정보 미입력";
      td.appendChild(span);
    });
  }
  function normalizeRows(root){
    root.querySelectorAll(".qerp-table tbody tr").forEach(row=>{
      const cells=Array.from(row.querySelectorAll(":scope > td")).filter(td=>!td.hasAttribute("data-qmes-sales-pack-cell"));
      if(cells.length<8)return;
      const customer=clean(cells[1]?.textContent);
      if(!customer||customer==="-") cells[1].textContent="현대자동차";
      const product=clean(cells[3]?.textContent);
      if(!product||product==="-"||/전도 슬러리|Binder Solution/i.test(product)) cells[3].textContent="NBA20-HM01";
      const status=clean(cells[7]?.textContent);
      if(status==="생산완료"||status==="-"||status==="검사중"){
        const badge=cells[7].querySelector(".qerp-status");
        if(badge){badge.textContent="출하검사 대기";badge.className="qerp-status orange";}
        else cells[7].textContent="출하검사 대기";
      }
    });
  }
  function formSnapshot(form){
    const get=label=>{
      const field=fieldByLabel(form,label);
      const control=field?.querySelector("input,select");
      return clean(control?.value);
    };
    return {
      customer:get("고객사"),po:get("고객 PO 번호"),due:get("요청 납기일"),product:get("제품"),qty:num(get("수량 (kg)")),
      packaging:{type:clean(formPackagingState.type),unitWeight:num(formPackagingState.unitWeight),packageQty:num(formPackagingState.packageQty)}
    };
  }
  function validatePackaging(event,form){
    const snap=formSnapshot(form);const pkg=snap.packaging;
    const touched=Boolean(pkg.type||pkg.unitWeight||pkg.packageQty);
    if(!touched)return true;
    if(!pkg.type||pkg.unitWeight<=0||pkg.packageQty<=0){
      event.preventDefault();event.stopImmediatePropagation();
      window.alert("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");
      return false;
    }
    return true;
  }
  async function syncRows(rows){
    if(typeof window.qmesSyncUpsert!=="function")return;
    try{
      await window.qmesSyncUpsert(ERP_SYNC_TYPE,ERP_RECORD_KEY,{module:"erp",schema:2,kind:"sales",rows,updatedAt:new Date().toISOString(),updatedBy:clean(window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||window.__QMES_USER__||"")});
    }catch(error){console.warn("[QMES] sales packaging shared sync failed",error);}
  }
  function savePendingPackaging(){
    if(!pendingSave)return false;
    const rows=readSalesRows();
    if(!rows.length)return false;
    const snap=pendingSave.snapshot;
    let row=rows.find(item=>!pendingSave.beforeIds.has(clean(item?.id)));
    if(!row){
      row=rows.find(item=>clean(item?.customer)===snap.customer&&clean(item?.product)===snap.product&&clean(item?.due)===snap.due&&Math.abs(num(item?.qty)-snap.qty)<0.001);
    }
    if(!row)return false;
    const pkg={type:snap.packaging.type,unitWeight:snap.packaging.unitWeight,packageQty:snap.packaging.packageQty,total:Number((snap.packaging.unitWeight*snap.packaging.packageQty).toFixed(3)),savedAt:new Date().toISOString()};
    const map=readPackagingMap();
    map[clean(row.id)]=pkg;
    if(clean(row.workOrder))map[clean(row.workOrder)]=pkg;
    writeJson(PACK_KEY,map);
    const next=rows.map(item=>clean(item?.id)===clean(row.id)?{...item,packaging:pkg,packagingType:pkg.type,unitPackQty:pkg.unitWeight,packageQty:pkg.packageQty,packagingTotal:pkg.total}:item);
    writeJson(SALES_KEY,next);
    syncRows(next);
    pendingSave=null;
    schedule();
    return true;
  }
  document.addEventListener("submit",event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||!form.classList.contains("qerp-form"))return;
    const root=form.closest(".qerp");
    if(!root||clean(root.querySelector(".qerp-title")?.textContent)!=="수주 · 납기관리")return;
    if(!validatePackaging(event,form))return;
    const snap=formSnapshot(form);
    if(!snap.packaging.type)return;
    pendingSave={snapshot:snap,beforeIds:new Set(readSalesRows().map(row=>clean(row?.id)))};
    [80,220,600,1200,2200].forEach(delay=>setTimeout(savePendingPackaging,delay));
  },true);

  function apply(){
    const root=salesRoot();
    if(!root)return;
    const form=root.querySelector("form.qerp-form");
    if(form){
      form.classList.add("qerp-sales-compact-form");
      const fields=Array.from(form.querySelectorAll(".qerp-field"));
      const customerField=fields.find(field=>clean(field.querySelector("label")?.textContent)==="고객사");
      const productField=fields.find(field=>clean(field.querySelector("label")?.textContent)==="제품");
      ensureOption(customerField?.querySelector("select"),"현대자동차");
      ensureOption(productField?.querySelector("select"),"NBA20-HM01");
      ensurePackagingFields(form);
    }
    normalizeRows(root);
    ensurePackagingColumn(root);
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("qmes:erp-runtime-loaded",schedule);
  window.addEventListener("qmes:erp-data-changed",event=>{if(event?.detail?.kind==="sales")setTimeout(savePendingPackaging,0);schedule();});
  window.addEventListener("qmes:quality-linkage-updated",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
