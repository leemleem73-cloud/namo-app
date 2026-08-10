/* QMES PQC inspection-date edit/save patch, 2026-08-11 */
(function enablePqcInspectionDateEdit(global){
  "use strict";
  if(global.__QMES_PQC_DATE_EDIT_ENABLE_20260811__) return;
  global.__QMES_PQC_DATE_EDIT_ENABLE_20260811__=true;

  let pendingDate="";
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

  function getGroupId(modal){
    const basic=modal.querySelector('.qmes-pqc-basic-row');
    if(!basic) return "";
    const fields=basic.querySelectorAll('input');
    return fields.length ? String(fields[0].value||"").trim() : "";
  }

  function forceDateValue(input,date){
    if(!input || !date) return;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter) setter.call(input,date); else input.value=date;
  }

  function syncEditedDate(groupId, date){
    if(!groupId || !date || typeof DB === "undefined" || !DB.insp || !Array.isArray(DB.insp.PQC)) return Promise.resolve(false);
    const rows=DB.insp.PQC.filter((row)=>String(row.groupId||row.id||"").trim()===groupId || String(row.id||"").replace(/-\d+$/,"")===groupId);
    if(!rows.length) return Promise.resolve(false);

    rows.forEach((row)=>{ row.date=date; row.sharedSync=true; });
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

    if(typeof qmesSyncUpsert==="function") {
      return qmesSyncUpsert("pqc", groupId, payload).then(()=>true);
    }
    return Promise.resolve(true);
  }

  function bindModal(modal){
    if(!isEditModal(modal)) return;
    const input=getDateInput(modal);
    if(!input) return;

    input.readOnly=false;
    input.removeAttribute('readonly');
    input.removeAttribute('title');

    if(pendingDate && pendingGroupId===getGroupId(modal) && input.value!==pendingDate){
      forceDateValue(input,pendingDate);
    }

    if(!input.dataset.qmesPqcDateBound){
      input.dataset.qmesPqcDateBound="1";
      const remember=()=>{
        const chosen=String(input.value||"").trim();
        if(!chosen) return;
        pendingDate=chosen;
        pendingGroupId=getGroupId(modal);
        setTimeout(()=>forceDateValue(input,pendingDate),0);
        global.requestAnimationFrame(()=>forceDateValue(input,pendingDate));
      };
      input.addEventListener('input',remember,true);
      input.addEventListener('change',remember,true);
    }

    const saveBtn=modal.querySelector('.qmes-inspection-save-btn');
    if(saveBtn && !saveBtn.dataset.qmesPqcDateBound){
      saveBtn.dataset.qmesPqcDateBound="1";
      saveBtn.addEventListener('click',()=>{
        const chosenDate=String(pendingDate || input.value || "").trim();
        const groupId=String(pendingGroupId || getGroupId(modal) || "").trim();
        if(!chosenDate || !groupId) return;
        setTimeout(()=>{
          syncEditedDate(groupId,chosenDate)
            .then((ok)=>{
              if(ok) setTimeout(()=>global.location.reload(),100);
            })
            .catch((error)=>{
              console.error("PQC 검사일자 공용 DB 반영 실패:",error);
              global.alert(`검사일자는 이 PC에 반영됐지만 공용 DB 저장에 실패했습니다.\n${error.message||error}`);
            });
        },120);
      },true);
    }
  }

  function apply(){
    document.querySelectorAll('.qmes-inspection-modal.is-pqc').forEach(bindModal);
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
