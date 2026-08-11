/* QMES PQC inspection-date and process-number edit/save patch, 2026-08-11 */
(function enablePqcInspectionDateEdit(global){
  "use strict";
  if(global.__QMES_PQC_DATE_EDIT_ENABLE_20260811_V2__) return;
  global.__QMES_PQC_DATE_EDIT_ENABLE_20260811_V2__=true;

  let pendingDate="";
  let originalGroupId="";
  let pendingGroupId="";

  function isEditModal(modal){
    return !!modal && String(modal.textContent || "").includes("공정검사 수정");
  }

  function getDateInput(modal){
    return Array.from(modal.querySelectorAll('input[type="date"]')).find((input)=>{
      const wrapper=input.parentElement;
      const label=wrapper&&wrapper.querySelector('label');
      return label && String(label.textContent||'').trim()==="검사일자";
    }) || null;
  }

  function getProcessInput(modal){
    const basic=modal.querySelector('.qmes-pqc-basic-row');
    if(!basic) return null;
    const fields=basic.querySelectorAll('input');
    return fields.length ? fields[0] : null;
  }

  function forceInputValue(input,value){
    if(!input || !value) return;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter) setter.call(input,value); else input.value=value;
  }

  function makeDateGroupId(oldGroupId,date){
    const compact=String(date||"").replace(/-/g,"");
    if(!/^\d{8}$/.test(compact)) return oldGroupId;
    const yymmdd=compact.slice(2);
    const oldMatch=String(oldGroupId||"").match(/^PQC-\d{6}-(\d{4})$/);
    let seq=oldMatch ? oldMatch[1] : "0001";
    const prefix=`PQC-${yymmdd}-`;
    if(typeof DB!=="undefined" && Array.isArray(DB.insp?.PQC)){
      const used=new Set(DB.insp.PQC.map((row)=>String(row.groupId||row.id||"").replace(/-\d+$/,"")).filter((id)=>id!==oldGroupId));
      let candidate=`${prefix}${seq}`;
      if(used.has(candidate)){
        const maxSeq=Array.from(used).filter((id)=>id.startsWith(prefix)).reduce((max,id)=>{
          const m=id.match(/-(\d{4})$/); return m ? Math.max(max,Number(m[1])) : max;
        },0);
        seq=String(maxSeq+1).padStart(4,"0");
        candidate=`${prefix}${seq}`;
      }
      return candidate;
    }
    return `${prefix}${seq}`;
  }

  async function syncEditedRecord(oldGroupId,newGroupId,date){
    if(!oldGroupId || !newGroupId || !date || typeof DB === "undefined" || !DB.insp || !Array.isArray(DB.insp.PQC)) return false;
    const rows=DB.insp.PQC.filter((row)=>{
      const key=String(row.groupId||row.id||"").trim();
      return key===oldGroupId || String(row.id||"").replace(/-\d+$/,"")===oldGroupId;
    });
    if(!rows.length) return false;

    const oldRows=rows.map((row)=>({...row}));
    rows.forEach((row,index)=>{
      row.date=date;
      row.groupId=newGroupId;
      row.id=`${newGroupId}-${index+1}`;
      row.sharedSync=true;
    });
    if(typeof dbSave==="function") dbSave();

    const first=rows[0]||{};
    const lotNo=String(first.lot||"").trim();
    const payload={
      mode:"PQC",
      lotNo,
      rows,
      lotRecord:DB.lots?.[lotNo] || null,
      holds:(DB.holds||[]).filter((row)=>String(row.target||"").includes(lotNo)),
      savedAt:new Date().toISOString(),
      savedBy:String(first.inspector||global.__QMES_USER__?.name||global.__QMES_USER__||"")
    };

    if(typeof qmesSyncUpsert==="function") await qmesSyncUpsert("pqc",newGroupId,payload);
    if(oldGroupId!==newGroupId && typeof qmesSyncTombstoneInspection==="function") {
      await qmesSyncTombstoneInspection("pqc",oldGroupId,oldRows,"검사일자 변경에 따른 공정번호 변경");
    }
    return true;
  }

  function bindModal(modal){
    if(!isEditModal(modal)) return;
    const dateInput=getDateInput(modal);
    const processInput=getProcessInput(modal);
    if(!dateInput || !processInput) return;

    if(!originalGroupId) originalGroupId=String(processInput.value||"").trim();
    dateInput.readOnly=false;
    dateInput.removeAttribute('readonly');
    dateInput.removeAttribute('title');

    if(pendingDate){
      if(dateInput.value!==pendingDate) forceInputValue(dateInput,pendingDate);
      if(pendingGroupId && processInput.value!==pendingGroupId) forceInputValue(processInput,pendingGroupId);
    }

    if(!dateInput.dataset.qmesPqcDateBoundV2){
      dateInput.dataset.qmesPqcDateBoundV2="1";
      const remember=()=>{
        const chosen=String(dateInput.value||"").trim();
        if(!chosen) return;
        if(!originalGroupId) originalGroupId=String(processInput.value||"").trim();
        pendingDate=chosen;
        pendingGroupId=makeDateGroupId(originalGroupId,chosen);
        forceInputValue(dateInput,pendingDate);
        forceInputValue(processInput,pendingGroupId);
        setTimeout(()=>{forceInputValue(dateInput,pendingDate);forceInputValue(processInput,pendingGroupId);},0);
        global.requestAnimationFrame(()=>{forceInputValue(dateInput,pendingDate);forceInputValue(processInput,pendingGroupId);});
      };
      dateInput.addEventListener('input',remember,true);
      dateInput.addEventListener('change',remember,true);
    }

    const saveBtn=modal.querySelector('.qmes-inspection-save-btn');
    if(saveBtn && !saveBtn.dataset.qmesPqcDateBoundV2){
      saveBtn.dataset.qmesPqcDateBoundV2="1";
      saveBtn.addEventListener('click',()=>{
        const chosenDate=String(pendingDate || dateInput.value || "").trim();
        const oldId=String(originalGroupId || processInput.value || "").trim();
        const newId=String(pendingGroupId || makeDateGroupId(oldId,chosenDate) || oldId).trim();
        if(!chosenDate || !oldId || !newId) return;
        setTimeout(()=>{
          syncEditedRecord(oldId,newId,chosenDate)
            .then((ok)=>{ if(ok) setTimeout(()=>global.location.reload(),120); })
            .catch((error)=>{
              console.error("PQC 검사일자/공정번호 공용 DB 반영 실패:",error);
              global.alert(`검사일자와 공정번호 저장 중 오류가 발생했습니다.\n${error.message||error}`);
            });
        },150);
      },true);
    }
  }

  function apply(){
    const modals=document.querySelectorAll('.qmes-inspection-modal.is-pqc');
    if(!modals.length){ pendingDate=""; originalGroupId=""; pendingGroupId=""; return; }
    modals.forEach(bindModal);
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    global.requestAnimationFrame(()=>{queued=false;apply();});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})(window);
