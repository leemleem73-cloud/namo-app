/* NAMO QMES - Work Order material list <-> IQC sync - 2026-08-27
 * 1) Makes PAI available in Work Order material selection.
 * 2) Pulls material names already used/registered in IQC into Work Order material options.
 * 3) Adds a visible '+ 원료 추가' button to the Work Order material-plan header.
 * 4) When PAI is selected, automatically fills LOT No. from the latest usable PASSED IQC PAI record.
 *    A new arbitrary supplier LOT is never invented: work-order traceability remains tied to IQC.
 */
(function(){
  "use strict";
  if(window.__QMES_WO_MATERIAL_IQC_SYNC_20260827__) return;
  window.__QMES_WO_MATERIAL_IQC_SYNC_20260827__=true;

  const PASS=new Set(["OK","PASS","합격","적합"]);
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

  function normalizedMaterial(name){
    const value=clean(name).toUpperCase().replace(/\s+/g,"");
    if(value.includes("BYK180")||value.includes("BYK-180")||value.includes("분산제")) return "BYK180";
    if(value.includes("AOH30")||value.includes("BOEHMITE")) return "BOEHMITE";
    for(const key of ["PVDF","PAI","NMP","SBR","SBS"]) if(value.includes(key)) return key;
    return value;
  }

  function isoDate(value){
    const match=String(value||"").match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    return match?`${match[1]}-${String(match[2]).padStart(2,"0")}-${String(match[3]).padStart(2,"0")}`:"";
  }

  function first(row,keys){
    for(const key of keys){
      const value=row?.[key];
      if(value!==undefined&&value!==null&&clean(value)!=="") return value;
    }
    return "";
  }

  function pushUnique(list,name){
    if(!Array.isArray(list)) return false;
    const value=canonicalMaterial(name);
    if(!value||list.some(item=>same(item,value))) return false;
    list.push(value);
    return true;
  }

  function iqcRows(){
    try{
      const db=window.DB||{};
      return [db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].find(Array.isArray)||[];
    }catch(_error){return [];}
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

  function productionDateFromTable(table){
    const shell=table?.closest(".qmes-wo-issue-shell")||document.querySelector(".qmes-wo-issue-shell");
    if(!shell) return "";
    const fields=Array.from(shell.querySelectorAll('.qmes-wo-form-field input[type="date"]'));
    return fields.find(input=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(input.value)))?.value||"";
  }

  function usableIqcLots(material,prodDate){
    const key=normalizedMaterial(material);
    const cutoff=isoDate(prodDate);
    const list=[];
    iqcRows().forEach(row=>{
      const rowMaterial=first(row,["name","material","materialName","rawMaterial","item","product"]);
      if(normalizedMaterial(rowMaterial)!==key) return;
      const lot=clean(first(row,["lot","lotNo","lotNumber","materialLot"]));
      if(!lot) return;
      const judge=clean(first(row,["judge","judgment","result","inspectionResult","status"])).toUpperCase();
      if(!PASS.has(judge)) return;
      const received=isoDate(first(row,["inspectedAt","inspectDate","recv","receiveDate","receivedDate","inDate","date","inspectionDate"]));
      if(cutoff&&received&&received>cutoff) return;
      try{if(typeof qmesActiveHold==="function"&&qmesActiveHold(lot)) return;}catch(_error){}
      list.push({lot,date:received||"0000-00-00",inNo:clean(first(row,["inNo","inspectionNo","id"]))});
    });
    list.sort((a,b)=>b.date.localeCompare(a.date)||b.inNo.localeCompare(a.inNo));
    return list.filter((item,index,array)=>array.findIndex(other=>clean(other.lot).toUpperCase()===clean(item.lot).toUpperCase())===index);
  }

  function setNativeInputValue(input,value){
    if(!input) return false;
    const next=clean(value).toUpperCase();
    if(!next||clean(input.value).toUpperCase()===next) return false;
    const old=input.value;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    if(!setter) return false;
    setter.call(input,next);
    if(input._valueTracker) input._valueTracker.setValue(old);
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    return true;
  }

  function paiRowLotInput(row){
    return row?.querySelector('td:nth-child(3) input[placeholder="원재료 LOT"],td:nth-child(3) input[type="text"]')||null;
  }

  function autoFillPaiRow(row,notifyMissing){
    if(!row) return false;
    const select=row.querySelector("td:nth-child(2) select");
    if(!select||normalizedMaterial(select.value)!=="PAI") return false;
    const input=paiRowLotInput(row);
    if(!input) return false;
    const table=row.closest("table.qmes-material-table")||row.closest("table");
    const lots=usableIqcLots("PAI",productionDateFromTable(table));
    if(!lots.length){
      input.placeholder="PAI IQC 합격 LOT 없음";
      input.title="수입검사에서 합격 처리된 PAI LOT가 없습니다.";
      if(notifyMissing&&row.dataset.qmesPaiLotMissingAlert!=="1"){
        row.dataset.qmesPaiLotMissingAlert="1";
        window.alert("PAI 수입검사 합격 LOT가 없습니다. 수입검사에서 PAI LOT를 합격 처리한 후 작업지시를 작성하세요.");
      }
      return false;
    }
    delete row.dataset.qmesPaiLotMissingAlert;
    input.placeholder="원재료 LOT";
    input.title=`PAI 수입검사 합격 LOT 자동 선택 · ${lots[0].lot}${lots[0].date!=="0000-00-00"?` · ${lots[0].date}`:""}`;
    if(!clean(input.value)) setNativeInputValue(input,lots[0].lot);
    return true;
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
  }

  function syncWorkOrderMaterialUi(){
    const names=syncGlobalOptions();
    const tables=Array.from(document.querySelectorAll(".qmes-material-table"));
    tables.forEach(table=>{
      const heading=clean(table.parentElement?.parentElement?.firstElementChild?.textContent);
      if(heading&&!heading.includes("원재료 투입 계획")) return;
      const selects=materialSelects(table);
      selects.forEach(select=>{appendMissingOptions(select,names);forceCurrentSelectRefresh(select);});
      table.querySelectorAll("tbody tr").forEach(row=>autoFillPaiRow(row,false));
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

    /* React first clears materialLot on material change. Run PAI auto-fill just after that update. */
    document.addEventListener("change",event=>{
      const target=event.target;
      if(!(target instanceof Element)) return;
      const select=target.closest("table.qmes-material-table tbody tr td:nth-child(2) select");
      if(!select) return;
      const row=select.closest("tr");
      if(normalizedMaterial(select.value)==="PAI"){
        setTimeout(()=>autoFillPaiRow(row,true),0);
        setTimeout(()=>autoFillPaiRow(row,false),80);
      }
    },false);

    window.addEventListener("qmes:iqc-data-changed",schedule);
    window.addEventListener("qmes:data-updated",schedule);
    window.addEventListener("qmes:workorder-saved",schedule);
    setTimeout(schedule,300);
    setTimeout(schedule,1000);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
