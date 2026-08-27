/* NAMO QMES - Work Order material list <-> IQC sync - 2026-08-27
 * 1) Makes PAI available in Work Order material selection.
 * 2) Pulls material names already used/registered in IQC into Work Order material options.
 * 3) Adds a visible '+ 원료 추가' button to the Work Order material-plan header.
 *    The button delegates to the existing React '행 추가' action so the new row
 *    is part of planItems and is saved normally with the Work Order.
 */
(function(){
  "use strict";
  if(window.__QMES_WO_MATERIAL_IQC_SYNC_20260827__) return;
  window.__QMES_WO_MATERIAL_IQC_SYNC_20260827__=true;

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const same=(a,b)=>clean(a).toLowerCase()===clean(b).toLowerCase();
  const ALIAS={
    "boehmite":"AOH30 (Boehmite)",
    "분산제":"BYK180 (분산제)"
  };

  function canonicalMaterial(name){
    const value=clean(name);
    if(!value) return "";
    return ALIAS[value.toLowerCase()]||value;
  }

  function pushUnique(list,name){
    if(!Array.isArray(list)) return false;
    const value=canonicalMaterial(name);
    if(!value||list.some(item=>same(item,value))) return false;
    list.push(value);
    return true;
  }

  function iqcMaterialNames(){
    const values=["PAI"];
    try{
      if(typeof IQC_MATERIALS!=="undefined"&&Array.isArray(IQC_MATERIALS)) values.push(...IQC_MATERIALS);
    }catch(_error){}
    try{
      if(window.DB){
        if(Array.isArray(DB.iqcMaterials)) values.push(...DB.iqcMaterials);
        if(Array.isArray(DB.iqc)) values.push(...DB.iqc.map(row=>row?.name));
      }
    }catch(_error){}
    return values.map(canonicalMaterial).filter(Boolean).filter((value,index,array)=>array.findIndex(item=>same(item,value))===index);
  }

  function syncGlobalOptions(){
    const names=iqcMaterialNames();
    try{
      if(typeof MATERIAL_OPTIONS!=="undefined"&&Array.isArray(MATERIAL_OPTIONS)){
        names.forEach(name=>pushUnique(MATERIAL_OPTIONS,name));
      }
    }catch(error){console.warn("[QMES] Work Order material option sync skipped",error);}

    /* Keep PAI in IQC master as well, without duplicating existing dynamic entries. */
    try{
      if(typeof IQC_MATERIALS!=="undefined"&&Array.isArray(IQC_MATERIALS)) pushUnique(IQC_MATERIALS,"PAI");
    }catch(_error){}
    try{
      if(window.DB){
        DB.iqcMaterials=Array.isArray(DB.iqcMaterials)?DB.iqcMaterials:[];
        if(!DB.iqcMaterials.some(item=>same(item,"PAI"))) DB.iqcMaterials.push("PAI");
      }
    }catch(_error){}
    return names;
  }

  function materialSelects(table){
    if(!table) return [];
    return Array.from(table.querySelectorAll("tbody tr")).map(tr=>tr.querySelector("td:nth-child(2) select")).filter(Boolean);
  }

  function appendMissingOptions(select,names){
    if(!select) return;
    const existing=Array.from(select.options).map(option=>clean(option.value||option.textContent));
    names.forEach(name=>{
      if(existing.some(value=>same(value,name))) return;
      const option=document.createElement("option");
      option.value=name;
      option.textContent=name;
      select.appendChild(option);
      existing.push(name);
    });
  }

  function replaceAddRowLabel(button){
    if(!button||!clean(button.textContent).includes("행 추가")) return;
    const textNode=Array.from(button.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&clean(node.nodeValue).includes("행 추가"));
    if(textNode) textNode.nodeValue=" 원료 추가";
    else button.textContent="+ 원료 추가";
    button.setAttribute("data-qmes-wo-material-add-owner","1");
    button.title="원재료 투입 계획에 새 원료 행 추가";
  }

  function findNativeAddButton(table){
    return Array.from(table?.querySelectorAll("button")||[]).find(button=>{
      const label=clean(button.textContent);
      return label.includes("행 추가")||label.includes("원료 추가");
    })||null;
  }

  function ensureHeaderButton(table){
    if(!table) return;
    const section=table.parentElement?.parentElement;
    if(!section) return;
    let header=section.firstElementChild;
    if(!header||!clean(header.textContent).includes("원재료 투입 계획")){
      header=Array.from(section.children).find(node=>clean(node.textContent).includes("원재료 투입 계획"));
    }
    if(!header) return;

    let button=header.querySelector("#qmes-wo-material-add-top-20260827");
    if(button) return;
    button=document.createElement("button");
    button.id="qmes-wo-material-add-top-20260827";
    button.type="button";
    button.textContent="+ 원료 추가";
    button.title="원재료 투입 계획에 새 원료 행을 추가합니다";
    Object.assign(button.style,{
      marginLeft:"12px",
      padding:"5px 10px",
      border:"1px solid rgba(14,165,233,.55)",
      borderRadius:"7px",
      background:"rgba(14,165,233,.10)",
      color:"#38bdf8",
      fontSize:"11px",
      fontWeight:"800",
      cursor:"pointer",
      verticalAlign:"middle"
    });
    button.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      syncGlobalOptions();
      const nativeButton=findNativeAddButton(table);
      if(nativeButton){
        nativeButton.click();
        setTimeout(syncWorkOrderMaterialUi,0);
        setTimeout(syncWorkOrderMaterialUi,80);
      }else{
        window.alert("원료 행 추가 기능을 찾지 못했습니다. 화면을 새로고침 후 다시 시도해 주세요.");
      }
    });
    header.appendChild(button);
  }

  function forceCurrentSelectRefresh(select){
    if(!select||select.dataset.qmesIqcMaterialRefreshed==="1") return;
    select.dataset.qmesIqcMaterialRefreshed="1";
    /* Do not change the selected value. A real user change will update React state. */
  }

  function syncWorkOrderMaterialUi(){
    const names=syncGlobalOptions();
    const tables=Array.from(document.querySelectorAll(".qmes-material-table"));
    tables.forEach(table=>{
      const heading=clean(table.parentElement?.parentElement?.firstElementChild?.textContent);
      if(heading&&!heading.includes("원재료 투입 계획")) return;
      const selects=materialSelects(table);
      selects.forEach(select=>{appendMissingOptions(select,names);forceCurrentSelectRefresh(select);});
      const nativeButton=findNativeAddButton(table);
      if(nativeButton) replaceAddRowLabel(nativeButton);
      ensureHeaderButton(table);
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;syncWorkOrderMaterialUi();});
  }

  const start=()=>{
    syncGlobalOptions();
    syncWorkOrderMaterialUi();
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("qmes:iqc-data-changed",schedule);
    window.addEventListener("qmes:data-updated",schedule);
    window.addEventListener("qmes:workorder-saved",schedule);
    setTimeout(schedule,300);
    setTimeout(schedule,1000);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
