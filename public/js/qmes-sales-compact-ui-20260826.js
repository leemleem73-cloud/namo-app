/* QMES sales/delivery enterprise UI + packaging + remarks + delete — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPACT_UI_20260826__) return;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const DELETED_KEY="qmes-sales-deleted-v1";
  const ERP_SYNC_TYPE="inventory";
  const ERP_RECORD_KEY="erp:sales";
  const formState={customerItemCode:"",deliveryPlace:"",orderType:"양산",type:"",unitWeight:"",packageQty:"",remarks:""};
  let pendingSave=null;
  let deleting=false;

  const style=document.createElement("style");
  style.id="qmes-sales-compact-ui-20260826-style";
  style.textContent=`
    .qerp-sales-compact-form{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:14px!important;align-items:end!important;margin-bottom:14px!important;}
    .qerp-sales-compact-form .qerp-field{min-width:0!important;}
    .qerp-sales-compact-form .qerp-field label{margin-bottom:5px!important;font-size:10px!important;line-height:1.15!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-field input,.qerp-sales-compact-form .qerp-field select{height:38px!important;padding:0 9px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-form-actions{grid-column:1/-1!important;align-self:end!important;display:flex!important;justify-content:flex-end!important;gap:8px!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-form-actions .qerp-btn{height:38px!important;padding:0 13px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-error{grid-column:1/-1!important;padding:6px 8px!important;margin:0!important;}
    .qmes-sales-pack-field input,.qmes-sales-pack-field select{background:#fffdf7!important;border-color:#f1c67b!important;}
    .qmes-sales-extra-field input,.qmes-sales-extra-field select{background:#f8fbff!important;border-color:#bfdbfe!important;}
    .qmes-sales-remark-field input{background:#f8fafc!important;}
    .qmes-sales-packaging-text{font-size:11px;font-weight:800;color:#334155;white-space:nowrap;}
    .qmes-sales-packaging-empty{font-size:10px;font-weight:800;color:#c2410c;background:#fff7ed;border-radius:999px;padding:3px 6px;white-space:nowrap;}
    .qmes-sales-remark-text{display:inline-block;max-width:170px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;color:#475569;}
    .qmes-sales-delivery-text{font-size:10px;font-weight:800;color:#334155;white-space:nowrap;}
    .qmes-sales-subtext{display:block;margin-top:2px;color:#64748b;font-size:9px;font-weight:700;white-space:nowrap;}
    .qmes-sales-due-badge{display:inline-flex;border-radius:999px;padding:3px 6px;font-size:9px;font-weight:900;white-space:nowrap;}
    .qmes-sales-due-badge.good{background:#dcfce7;color:#15803d}.qmes-sales-due-badge.warn{background:#ffedd5;color:#c2410c}.qmes-sales-due-badge.bad{background:#fee2e2;color:#b91c1c}.qmes-sales-due-badge.done{background:#dbeafe;color:#1d4ed8}.qmes-sales-due-badge.neutral{background:#f1f5f9;color:#64748b}
    .qmes-sales-delete-btn{border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:6px;padding:4px 8px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap;}
    .qmes-sales-delete-btn:hover{background:#fff1f2;border-color:#fca5a5;}
    @media(max-width:1180px){.qerp-sales-compact-form{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    @media(max-width:700px){.qerp-sales-compact-form{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function num(value){const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;}
  function todayIso(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
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
    const packKinds=new Set(["type","unitWeight","packageQty"]);
    field.className=`qerp-field ${kind==="remarks"?"qmes-sales-remark-field":packKinds.has(kind)?"qmes-sales-pack-field":"qmes-sales-extra-field"}`;
    field.dataset.qmesSalesMeta=kind;
    const lab=document.createElement("label");lab.textContent=label;field.appendChild(lab);

    if(kind==="type"||kind==="orderType"){
      const select=document.createElement("select");
      if(kind==="type") select.innerHTML='<option value="">선택</option><option value="CAN">CAN</option><option value="DRUM">DRUM</option><option value="IBC">IBC</option><option value="기타">기타</option>';
      else select.innerHTML='<option value="양산">양산</option><option value="개발">개발</option><option value="샘플">샘플</option><option value="긴급">긴급</option>';
      select.value=formState[kind]||"";
      select.addEventListener("change",()=>{formState[kind]=select.value;});
      field.appendChild(select);
    }else{
      const input=document.createElement("input");
      if(kind==="unitWeight"||kind==="packageQty"){
        input.type="number";input.min="0";input.step=kind==="unitWeight"?"0.001":"1";input.inputMode="decimal";
        input.placeholder=kind==="unitWeight"?"kg/EA":"EA";
      }else{
        input.type="text";input.maxLength=120;
        input.placeholder=kind==="customerItemCode"?"고객 품목코드":kind==="deliveryPlace"?"납품처 / 공장":"비고 입력";
      }
      input.value=formState[kind]||"";
      input.addEventListener("input",()=>{formState[kind]=input.value;});
      field.appendChild(input);
    }
    return field;
  }

  function ensureMetaFields(form){
    const actions=form.querySelector(".qerp-form-actions");if(!actions)return;
    if(!form.querySelector('[data-qmes-sales-meta="customerItemCode"]'))actions.before(makeField("고객 품목코드","customerItemCode"));
    if(!form.querySelector('[data-qmes-sales-meta="deliveryPlace"]'))actions.before(makeField("납품처","deliveryPlace"));
    if(!form.querySelector('[data-qmes-sales-meta="orderType"]'))actions.before(makeField("수주구분","orderType"));
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
  function resolveMeta(id){
    const row=rowData(id),map=readMap(META_KEY),key=clean(row.workOrder)||id;
    return map[id]||map[key]||row.orderMeta||{
      customerItemCode:clean(row.customerItemCode),deliveryPlace:clean(row.deliveryPlace),orderType:clean(row.orderType),orderDate:clean(row.orderDate)
    };
  }
  function dueState(row){
    const shipping=clean(row?.shipping);
    if(/출하완료/.test(shipping))return {label:"완료",cls:"done"};
    const due=clean(row?.due);
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(due))return {label:"-",cls:"neutral"};
    const today=new Date(todayIso()+"T00:00:00").getTime();
    const dueTime=new Date(due+"T00:00:00").getTime();
    const days=Math.round((dueTime-today)/86400000);
    if(days<0)return {label:`지연 ${Math.abs(days)}일`,cls:"bad"};
    if(days<=7)return {label:`임박 D-${days}`,cls:"warn"};
    return {label:"정상",cls:"good"};
  }

  function insertHeader(head,label,attr,beforeLabel){
    let th=head.querySelector(`[${attr}="1"]`);if(th)return th;
    th=document.createElement("th");th.setAttribute(attr,"1");th.textContent=label;
    const before=beforeLabel?Array.from(head.children).find(el=>clean(el.textContent)===beforeLabel):null;
    if(before)head.insertBefore(th,before);else head.appendChild(th);
    return th;
  }
  function ensureCellAtHeader(tr,head,headerAttr,cellAttr){
    let td=tr.querySelector(`[${cellAttr}="1"]`);if(td)return td;
    const th=head.querySelector(`[${headerAttr}="1"]`);if(!th)return null;
    const index=Array.from(head.children).indexOf(th);
    td=document.createElement("td");td.setAttribute(cellAttr,"1");
    const target=tr.children[index]||null;
    if(target)tr.insertBefore(td,target);else tr.appendChild(td);
    return td;
  }
  function ensureProductSubtext(tr,id){
    const meta=resolveMeta(id),code=clean(meta.customerItemCode);
    const productCell=tr.children[3];if(!productCell)return;
    let sub=productCell.querySelector('[data-qmes-customer-item-code="1"]');
    if(!code){if(sub)sub.remove();return;}
    if(!sub){sub=document.createElement("span");sub.dataset.qmesCustomerItemCode="1";sub.className="qmes-sales-subtext";productCell.appendChild(sub);}
    const label=`고객품번 ${code}`;if(sub.textContent!==label)sub.textContent=label;
  }

  function ensureTableColumns(root){
    const table=tableFor(root);if(!table)return;
    const head=table.querySelector("thead tr");if(!head)return;
    insertHeader(head,"포장정보","data-qmes-sales-pack-head","납기일");
    insertHeader(head,"납기상태","data-qmes-sales-due-head","생산계획");
    insertHeader(head,"납품정보","data-qmes-sales-delivery-head",null);
    insertHeader(head,"비고","data-qmes-sales-remark-head",null);
    insertHeader(head,"관리","data-qmes-sales-manage-head",null);

    table.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;
      const row=rowData(id);

      const pack=ensureCellAtHeader(tr,head,"data-qmes-sales-pack-head","data-qmes-sales-pack-cell");
      if(pack){
        let span=pack.querySelector("span");if(!span){span=document.createElement("span");pack.appendChild(span);}
        const info=packagingText(resolvePackaging(id)),cls=info?"qmes-sales-packaging-text":"qmes-sales-packaging-empty",label=info||"포장정보 미입력";
        if(span.className!==cls)span.className=cls;if(span.textContent!==label)span.textContent=label;
      }

      const due=ensureCellAtHeader(tr,head,"data-qmes-sales-due-head","data-qmes-sales-due-cell");
      if(due){
        let badge=due.querySelector("span");if(!badge){badge=document.createElement("span");due.appendChild(badge);}
        const state=dueState(row),cls=`qmes-sales-due-badge ${state.cls}`;
        if(badge.className!==cls)badge.className=cls;if(badge.textContent!==state.label)badge.textContent=state.label;
      }

      const delivery=ensureCellAtHeader(tr,head,"data-qmes-sales-delivery-head","data-qmes-sales-delivery-cell");
      if(delivery){
        let span=delivery.querySelector("span");if(!span){span=document.createElement("span");span.className="qmes-sales-delivery-text";delivery.appendChild(span);}
        const meta=resolveMeta(id),parts=[clean(meta.orderType),clean(meta.deliveryPlace)].filter(Boolean),label=parts.join(" · ")||"-";
        if(span.textContent!==label)span.textContent=label;span.title=label==="-"?"":label;
      }

      const remark=ensureCellAtHeader(tr,head,"data-qmes-sales-remark-head","data-qmes-sales-remark-cell");
      if(remark){
        let remarkSpan=remark.querySelector("span");if(!remarkSpan){remarkSpan=document.createElement("span");remarkSpan.className="qmes-sales-remark-text";remark.appendChild(remarkSpan);}
        const remarkText=resolveRemark(id)||"-";if(remarkSpan.textContent!==remarkText)remarkSpan.textContent=remarkText;remarkSpan.title=remarkText==="-"?"":remarkText;
      }

      const manage=ensureCellAtHeader(tr,head,"data-qmes-sales-manage-head","data-qmes-sales-manage-cell");
      if(manage){
        let button=manage.querySelector(".qmes-sales-delete-btn");
        if(!button){button=document.createElement("button");button.type="button";button.className="qmes-sales-delete-btn";button.textContent="삭제";manage.appendChild(button);}
        if(button.dataset.salesId!==id)button.dataset.salesId=id;
      }

      ensureProductSubtext(tr,id);
    });
  }

  function formSnapshot(form){
    const get=label=>{const field=fieldByLabel(form,label),control=field?.querySelector("input,select");return clean(control?.value);};
    return {
      customer:get("고객사"),po:get("고객 PO 번호"),due:get("요청 납기일"),product:get("제품"),qty:num(get("수량 (kg)")),
      customerItemCode:clean(formState.customerItemCode),deliveryPlace:clean(formState.deliveryPlace),orderType:clean(formState.orderType)||"양산",remarks:clean(formState.remarks),
      packaging:{type:clean(formState.type),unitWeight:num(formState.unitWeight),packageQty:num(formState.packageQty)}
    };
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
      await window.qmesSyncUpsert(ERP_SYNC_TYPE,ERP_RECORD_KEY,{module:"erp",schema:3,kind:"sales",rows,source,updatedAt:new Date().toISOString(),updatedBy:currentUser()});
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

    const previousMeta=resolveMeta(id)||{};
    const meta={
      ...previousMeta,
      customerItemCode:snap.customerItemCode,
      deliveryPlace:snap.deliveryPlace,
      orderType:snap.orderType||"양산",
      orderDate:clean(previousMeta.orderDate)||todayIso(),
      savedAt:new Date().toISOString(),savedBy:currentUser()
    };
    const metaMap=readMap(META_KEY);metaMap[id]=meta;if(workOrder)metaMap[workOrder]=meta;writeJson(META_KEY,metaMap);

    const next=rows.map(item=>clean(item?.id)===id?{
      ...item,
      ...(pkg?{packaging:pkg,packagingType:pkg.type,unitPackQty:pkg.unitWeight,packageQty:pkg.packageQty,packagingTotal:pkg.total}:{}),
      remarks:snap.remarks||clean(item?.remarks),orderMeta:meta,customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderDate:meta.orderDate
    }:item);
    writeJson(SALES_KEY,next);syncRows(next);
    pendingSave=null;
    formState.customerItemCode="";formState.deliveryPlace="";formState.orderType="양산";formState.type="";formState.unitWeight="";formState.packageQty="";formState.remarks="";
    schedule();
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
      const workOrder=clean(row.workOrder),pack=readMap(PACK_KEY),remarks=readMap(REMARK_KEY),meta=readMap(META_KEY);
      delete pack[id];delete remarks[id];delete meta[id];
      if(workOrder){delete pack[workOrder];delete remarks[workOrder];delete meta[workOrder];}
      writeJson(PACK_KEY,pack);writeJson(REMARK_KEY,remarks);writeJson(META_KEY,meta);
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
    const snap=formSnapshot(form),hasMeta=Boolean(snap.customerItemCode||snap.deliveryPlace||snap.orderType||snap.remarks||snap.packaging.type||snap.packaging.unitWeight||snap.packaging.packageQty);
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
