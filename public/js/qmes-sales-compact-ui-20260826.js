/* QMES sales/delivery compact UI + packaging + remarks + delete — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPACT_UI_20260826__) return;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const DELETED_KEY="qmes-sales-deleted-v1";
  const ERP_SYNC_TYPE="inventory";
  const ERP_RECORD_KEY="erp:sales";
  const formState={type:"",unitWeight:"",packageQty:"",remarks:""};
  let pendingSave=null;
  let deleting=false;

  const style=document.createElement("style");
  style.id="qmes-sales-compact-ui-20260826-style";
  style.textContent=`
    .qerp-sales-compact-form{
      display:grid!important;
      grid-template-columns:minmax(112px,.85fr) minmax(128px,.95fr) minmax(126px,.92fr) minmax(135px,1fr) minmax(76px,.58fr) minmax(92px,.68fr) minmax(90px,.66fr) minmax(78px,.58fr) minmax(120px,.9fr) auto!important;
      gap:7px!important;align-items:end!important;margin-bottom:10px!important;
    }
    .qerp-sales-compact-form .qerp-field{min-width:0!important;}
    .qerp-sales-compact-form .qerp-field label{margin-bottom:3px!important;font-size:9px!important;line-height:1.15!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-field input,.qerp-sales-compact-form .qerp-field select{height:32px!important;padding:0 7px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-form-actions{grid-column:auto!important;align-self:end!important;display:flex!important;gap:6px!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-form-actions .qerp-btn{height:32px!important;padding:0 9px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-error{grid-column:1/-1!important;padding:6px 8px!important;margin:0!important;}
    .qmes-sales-pack-field input,.qmes-sales-pack-field select{background:#fffdf7!important;border-color:#f1c67b!important;}
    .qmes-sales-remark-field input{background:#f8fafc!important;}
    .qmes-sales-packaging-text{font-size:11px;font-weight:800;color:#334155;white-space:nowrap;}
    .qmes-sales-packaging-empty{font-size:10px;font-weight:800;color:#c2410c;background:#fff7ed;border-radius:999px;padding:3px 6px;white-space:nowrap;}
    .qmes-sales-remark-text{display:inline-block;max-width:170px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;color:#475569;}
    .qmes-sales-delete-btn{border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:6px;padding:4px 8px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap;}
    .qmes-sales-delete-btn:hover{background:#fff1f2;border-color:#fca5a5;}
    @media(max-width:1600px){.qerp-sales-compact-form{grid-template-columns:repeat(5,minmax(0,1fr))!important}.qerp-sales-compact-form .qerp-form-actions{grid-column:1/-1!important;justify-content:flex-end!important}}
    @media(max-width:1050px){.qerp-sales-compact-form{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
    @media(max-width:700px){.qerp-sales-compact-form{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function num(value){const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;}
  function readJson(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_error){}}
  function readMap(key){const value=readJson(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
  function readSalesRows(){const value=readJson(SALES_KEY,[]);return Array.isArray(value)?value:[];}
  function currentUser(){const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};return clean(user?.name||user?.uid||user);}
  function salesRoot(){return Array.from(document.querySelectorAll(".qerp")).find(root=>clean(root.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;}
  function tableFor(root){return Array.from(root?.querySelectorAll("table.qerp-table")||[]).find(table=>/수주번호/.test(clean(table.querySelector("thead")?.textContent)))||null;}
  function ensureOption(select,value){
    if(!select)return;
    let option=Array.from(select.options||[]).find(opt=>clean(opt.value||opt.textContent)===value);
    if(!option){option=document.createElement("option");option.value=value;option.textContent=value;select.appendChild(option);}
    if(select.value!==value){select.value=value;select.dispatchEvent(new Event("change",{bubbles:true}));}
  }
  function fieldByLabel(form,label){return Array.from(form.querySelectorAll(".qerp-field")).find(field=>clean(field.querySelector("label")?.textContent)===label)||null;}

  function makeField(label,kind){
    const field=document.createElement("div");
    field.className=`qerp-field ${kind==="remarks"?"qmes-sales-remark-field":"qmes-sales-pack-field"}`;
    field.dataset.qmesSalesMeta=kind;
    const lab=document.createElement("label");lab.textContent=label;field.appendChild(lab);
    if(kind==="type"){
      const select=document.createElement("select");
      select.innerHTML='<option value="">선택</option><option value="CAN">CAN</option><option value="DRUM">DRUM</option><option value="IBC">IBC</option><option value="기타">기타</option>';
      select.value=formState.type;
      select.addEventListener("change",()=>{formState.type=select.value;});
      field.appendChild(select);
    }else{
      const input=document.createElement("input");
      if(kind==="unitWeight"||kind==="packageQty"){
        input.type="number";input.min="0";input.step=kind==="unitWeight"?"0.001":"1";input.inputMode="decimal";
        input.placeholder=kind==="unitWeight"?"kg/EA":"EA";
      }else{
        input.type="text";input.maxLength=120;input.placeholder="비고 입력";
      }
      input.value=formState[kind]||"";
      input.addEventListener("input",()=>{formState[kind]=input.value;});
      field.appendChild(input);
    }
    return field;
  }
  function ensureMetaFields(form){
    const actions=form.querySelector(".qerp-form-actions");if(!actions)return;
    if(!form.querySelector('[data-qmes-sales-meta="type"]'))actions.before(makeField("포장형태","type"));
    if(!form.querySelector('[data-qmes-sales-meta="unitWeight"]'))actions.before(makeField("단위 포장량(kg)","unitWeight"));
    if(!form.querySelector('[data-qmes-sales-meta="packageQty"]'))actions.before(makeField("포장수량(EA)","packageQty"));
    if(!form.querySelector('[data-qmes-sales-meta="remarks"]'))actions.before(makeField("비고","remarks"));
  }

  function packagingText(pkg){
    if(!pkg)return "";
    const type=clean(pkg.type||pkg.packagingType),unit=num(pkg.unitWeight??pkg.unitPackQty),count=num(pkg.packageQty);
    if(!type&&!unit&&!count)return "";
    const parts=[];if(type)parts.push(type);
    if(unit&&count)parts.push(`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`);
    else if(unit)parts.push(`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg/EA`);
    else if(count)parts.push(`${count.toLocaleString("ko-KR")}EA`);
    return parts.join(" · ");
  }
  function rowData(id){return readSalesRows().find(item=>clean(item?.id)===clean(id))||{};}
  function resolvePackaging(id){
    const row=rowData(id),map=readMap(PACK_KEY),key=clean(row.workOrder)||id;
    return map[id]||map[key]||row.packaging||(row.packagingType||row.unitPackQty||row.packageQty?{type:row.packagingType,unitWeight:row.unitPackQty,packageQty:row.packageQty}:null);
  }
  function resolveRemark(id){
    const row=rowData(id),map=readMap(REMARK_KEY),key=clean(row.workOrder)||id;
    return clean(map[id]??map[key]??row.remarks??row.remark??row.note);
  }

  function insertHeader(head,label,attr,beforeLabel){
    let th=head.querySelector(`[${attr}="1"]`);if(th)return th;
    th=document.createElement("th");th.setAttribute(attr,"1");th.textContent=label;
    const before=beforeLabel?Array.from(head.children).find(el=>clean(el.textContent)===beforeLabel):null;
    if(before)head.insertBefore(th,before);else head.appendChild(th);
    return th;
  }
  function ensureTableColumns(root){
    const table=tableFor(root);if(!table)return;
    const head=table.querySelector("thead tr");if(!head)return;
    insertHeader(head,"포장정보","data-qmes-sales-pack-head","납기일");
    insertHeader(head,"비고","data-qmes-sales-remark-head",null);
    insertHeader(head,"관리","data-qmes-sales-manage-head",null);

    table.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;
      let pack=tr.querySelector('[data-qmes-sales-pack-cell="1"]');
      if(!pack){
        pack=document.createElement("td");pack.dataset.qmesSalesPackCell="1";
        const dueIndex=Array.from(head.children).findIndex(el=>clean(el.textContent)==="납기일");
        const target=tr.children[dueIndex]||null;
        if(target)tr.insertBefore(pack,target);else tr.appendChild(pack);
      }
      let span=pack.querySelector("span");if(!span){span=document.createElement("span");pack.appendChild(span);}
      const info=packagingText(resolvePackaging(id));
      const cls=info?"qmes-sales-packaging-text":"qmes-sales-packaging-empty";
      const label=info||"포장정보 미입력";
      if(span.className!==cls)span.className=cls;if(span.textContent!==label)span.textContent=label;

      let remark=tr.querySelector('[data-qmes-sales-remark-cell="1"]');
      if(!remark){remark=document.createElement("td");remark.dataset.qmesSalesRemarkCell="1";tr.appendChild(remark);}
      let remarkSpan=remark.querySelector("span");if(!remarkSpan){remarkSpan=document.createElement("span");remarkSpan.className="qmes-sales-remark-text";remark.appendChild(remarkSpan);}
      const remarkText=resolveRemark(id)||"-";if(remarkSpan.textContent!==remarkText)remarkSpan.textContent=remarkText;remarkSpan.title=remarkText==="-"?"":remarkText;

      let manage=tr.querySelector('[data-qmes-sales-manage-cell="1"]');
      if(!manage){manage=document.createElement("td");manage.dataset.qmesSalesManageCell="1";tr.appendChild(manage);}
      let button=manage.querySelector(".qmes-sales-delete-btn");
      if(!button){button=document.createElement("button");button.type="button";button.className="qmes-sales-delete-btn";button.textContent="삭제";manage.appendChild(button);}
      if(button.dataset.salesId!==id)button.dataset.salesId=id;
    });
  }

  function formSnapshot(form){
    const get=label=>{const field=fieldByLabel(form,label),control=field?.querySelector("input,select");return clean(control?.value);};
    return {customer:get("고객사"),po:get("고객 PO 번호"),due:get("요청 납기일"),product:get("제품"),qty:num(get("수량 (kg)")),remarks:clean(formState.remarks),packaging:{type:clean(formState.type),unitWeight:num(formState.unitWeight),packageQty:num(formState.packageQty)}};
  }
  function validatePackaging(event,form){
    const pkg=formSnapshot(form).packaging,touched=Boolean(pkg.type||pkg.unitWeight||pkg.packageQty);
    if(!touched)return true;
    if(!pkg.type||pkg.unitWeight<=0||pkg.packageQty<=0){event.preventDefault();event.stopImmediatePropagation();window.alert("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");return false;}
    return true;
  }
  async function syncRows(rows,source="SALES_META"){
    if(typeof window.qmesSyncUpsert!=="function")return "local";
    try{
      await window.qmesSyncUpsert(ERP_SYNC_TYPE,ERP_RECORD_KEY,{module:"erp",schema:2,kind:"sales",rows,source,updatedAt:new Date().toISOString(),updatedBy:currentUser()});
      return "shared";
    }catch(error){console.warn("[QMES] sales metadata sync failed",error);return "local";}
  }

  function savePendingMeta(){
    if(!pendingSave)return false;
    const rows=readSalesRows();if(!rows.length)return false;
    const snap=pendingSave.snapshot;
    let row=rows.find(item=>!pendingSave.beforeIds.has(clean(item?.id)));
    if(!row)row=rows.find(item=>clean(item?.customer)===snap.customer&&clean(item?.product)===snap.product&&clean(item?.due)===snap.due&&Math.abs(num(item?.qty)-snap.qty)<0.001);
    if(!row)return false;
    const id=clean(row.id),workOrder=clean(row.workOrder);
    const pkgTouched=Boolean(snap.packaging.type||snap.packaging.unitWeight||snap.packaging.packageQty);
    let pkg=null;
    if(pkgTouched){
      pkg={type:snap.packaging.type,unitWeight:snap.packaging.unitWeight,packageQty:snap.packaging.packageQty,total:Number((snap.packaging.unitWeight*snap.packaging.packageQty).toFixed(3)),savedAt:new Date().toISOString()};
      const map=readMap(PACK_KEY);map[id]=pkg;if(workOrder)map[workOrder]=pkg;writeJson(PACK_KEY,map);
    }
    if(snap.remarks){const map=readMap(REMARK_KEY);map[id]=snap.remarks;if(workOrder)map[workOrder]=snap.remarks;writeJson(REMARK_KEY,map);}
    const next=rows.map(item=>clean(item?.id)===id?{...item,...(pkg?{packaging:pkg,packagingType:pkg.type,unitPackQty:pkg.unitWeight,packageQty:pkg.packageQty,packagingTotal:pkg.total}:{}),remarks:snap.remarks||clean(item?.remarks)}:item);
    writeJson(SALES_KEY,next);syncRows(next);
    pendingSave=null;formState.type="";formState.unitWeight="";formState.packageQty="";formState.remarks="";schedule();
    return true;
  }

  function addDeleted(row){
    const list=readJson(DELETED_KEY,[]),items=Array.isArray(list)?list:[];
    const id=clean(row?.id),workOrder=clean(row?.workOrder);
    const filtered=items.filter(item=>clean(item?.id)!==id&&(!workOrder||clean(item?.workOrder)!==workOrder));
    filtered.push({id,workOrder,deletedAt:new Date().toISOString(),deletedBy:currentUser()});
    writeJson(DELETED_KEY,filtered.slice(-500));
  }
  async function deleteSales(id){
    if(deleting)return;
    const rows=readSalesRows(),row=rows.find(item=>clean(item?.id)===clean(id));if(!row){window.alert("삭제할 수주 데이터를 찾을 수 없습니다.");return;}
    if(!window.confirm(`${id} 수주를 목록에서 삭제하시겠습니까?\n작업지시·검사 원본 데이터는 삭제되지 않습니다.`))return;
    deleting=true;
    try{
      addDeleted(row);
      const workOrder=clean(row.workOrder),pack=readMap(PACK_KEY),remarks=readMap(REMARK_KEY);
      delete pack[id];delete remarks[id];if(workOrder){delete pack[workOrder];delete remarks[workOrder];}
      writeJson(PACK_KEY,pack);writeJson(REMARK_KEY,remarks);
      const next=rows.filter(item=>clean(item?.id)!==clean(id));
      writeJson(SALES_KEY,next);
      const root=salesRoot(),tr=Array.from(tableFor(root)?.querySelectorAll("tbody tr")||[]).find(item=>clean(item.children[0]?.textContent)===clean(id));
      if(tr)tr.remove();
      await syncRows(next,"SALES_DELETE");
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_DELETE",id}}));
      setTimeout(()=>window.location.reload(),120);
    }finally{deleting=false;}
  }

  document.addEventListener("submit",event=>{
    const form=event.target;if(!(form instanceof HTMLFormElement)||!form.classList.contains("qerp-form"))return;
    const root=form.closest(".qerp");if(!root||clean(root.querySelector(".qerp-title")?.textContent)!=="수주 · 납기관리")return;
    if(!validatePackaging(event,form))return;
    const snap=formSnapshot(form),hasMeta=Boolean(snap.remarks||snap.packaging.type||snap.packaging.unitWeight||snap.packaging.packageQty);
    if(!hasMeta)return;
    pendingSave={snapshot:snap,beforeIds:new Set(readSalesRows().map(row=>clean(row?.id)))};
    [80,220,600,1200,2200].forEach(delay=>setTimeout(savePendingMeta,delay));
  },true);
  document.addEventListener("click",event=>{
    const button=event.target.closest?.(".qmes-sales-delete-btn");if(!button)return;
    event.preventDefault();event.stopPropagation();deleteSales(button.dataset.salesId||"");
  },true);

  function apply(){
    const root=salesRoot();if(!root)return;
    const form=root.querySelector("form.qerp-form");
    if(form){
      form.classList.add("qerp-sales-compact-form");
      const fields=Array.from(form.querySelectorAll(".qerp-field"));
      const customerField=fields.find(field=>clean(field.querySelector("label")?.textContent)==="고객사");
      const productField=fields.find(field=>clean(field.querySelector("label")?.textContent)==="제품");
      ensureOption(customerField?.querySelector("select"),"현대자동차");
      ensureOption(productField?.querySelector("select"),"NBA20-HM01");
      ensureMetaFields(form);
    }
    ensureTableColumns(root);
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("qmes:erp-runtime-loaded",schedule);
  window.addEventListener("qmes:erp-data-changed",event=>{if(event?.detail?.kind==="sales"&&event?.detail?.source!=="SALES_DELETE")setTimeout(savePendingMeta,0);schedule();});
  window.addEventListener("qmes:quality-linkage-updated",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
