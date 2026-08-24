/* QMES production worker normalization / delete helper, 2026-08-24
 * Safe event-driven version: no MutationObserver, so it does not interfere with React rendering.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_WORKER_NORMALIZE_DELETE_20260824_V2__) return;
  window.__QMES_PRODUCTION_WORKER_NORMALIZE_DELETE_20260824_V2__=true;

  const TARGET_DEPT="생산부";
  const clean=value=>String(value==null?"":value).trim();

  async function fetchSyncRows(){
    const response=await fetch("/api/qmes-sync/workorder",{credentials:"same-origin"});
    const data=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||!data.success) throw new Error(data.message||"작업자 정보를 불러오지 못했습니다.");
    return Array.isArray(data.data)?data.data:[];
  }

  async function saveWorker(recordKey,payload){
    const response=await fetch("/api/qmes-sync/workorder",{
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({key:recordKey,payload})
    });
    const data=await response.json().catch(()=>({success:false}));
    if(!response.ok||!data.success) throw new Error(data.message||"작업자 저장에 실패했습니다.");
    return data.data;
  }

  function findWorkerDialog(){
    return Array.from(document.querySelectorAll(".qpp-dialog")).find(dialog=>
      clean(dialog.querySelector(".qpp-dialog-head b")?.textContent)==="작업자 선택"
    )||null;
  }

  function decorateWorkerModal(){
    const dialog=findWorkerDialog();
    if(!dialog) return;
    const cards=Array.from(dialog.querySelectorAll(".qpp-worker-item"));
    const nameCount=new Map();
    cards.forEach(card=>{
      const name=clean(card.querySelector("b")?.textContent);
      if(name) nameCount.set(name,(nameCount.get(name)||0)+1);
    });

    cards.forEach(card=>{
      const name=clean(card.querySelector("b")?.textContent);
      const small=card.querySelector("small");
      if(!small) return;

      let raw=clean(card.dataset.qmesWorkerRaw||small.textContent);
      if(!raw.includes("·") && clean(card.dataset.qmesWorkerId)){
        raw=`${card.dataset.qmesWorkerId} · ${TARGET_DEPT}`;
      }
      const workerId=clean(raw.split("·")[0]);
      if(workerId){
        card.dataset.qmesWorkerId=workerId;
        card.dataset.qmesWorkerRaw=raw;
      }

      // 화면에는 성명 + 생산부만 표시한다. UUID/PW 번호/기타 부서 텍스트는 숨긴다.
      small.textContent=TARGET_DEPT;

      const existing=card.querySelector(".qpp-worker-delete");
      if(workerId.startsWith("PW-")){
        const button=existing||document.createElement("button");
        button.type="button";
        button.className="qpp-worker-delete";
        button.dataset.workerId=workerId;
        button.dataset.workerName=name;
        button.textContent=(nameCount.get(name)||0)>1?"중복 삭제":"삭제";
        button.title="추가 등록 작업자 삭제";
        button.style.cssText="margin-left:auto;padding:5px 8px;border:1px solid #7f3543;border-radius:6px;background:#3b2028;color:#fecdd3;font-size:10px;font-weight:800;cursor:pointer;flex:0 0 auto;";
        if(!existing) card.appendChild(button);
      }else if(existing){
        existing.remove();
      }
    });
  }

  async function deactivateManualWorker(workerId,workerName){
    if(!workerId||!workerId.startsWith("PW-")) return;
    const ok=window.confirm(`${workerName||"등록 작업자"} 작업자를 삭제할까요?\n회원 계정은 삭제되지 않고 생산공정 추가 작업자에서만 제외됩니다.`);
    if(!ok) return;
    try{
      const rows=await fetchSyncRows();
      const row=rows.find(item=>clean(item?.record_key)===`worker:${workerId}`);
      if(!row) throw new Error("삭제할 추가 작업자 기록을 찾지 못했습니다.");
      const payload=row.payload&&typeof row.payload==="object"?row.payload:{};
      await saveWorker(`worker:${workerId}`,{
        ...payload,
        dept:TARGET_DEPT,
        active:false,
        deletedAt:new Date().toISOString(),
        deletedBy:clean(window.__QMES_CURRENT_USER__?.name)||"사용자"
      });

      const refresh=Array.from(document.querySelectorAll(".qmes-prod-process button")).find(button=>clean(button.textContent)==="새로고침");
      if(refresh&&!refresh.disabled){
        refresh.click();
        setTimeout(decorateWorkerModal,120);
      }else{
        const card=findWorkerDialog()?.querySelector(`[data-qmes-worker-id="${CSS.escape(workerId)}"]`);
        card?.remove();
      }
    }catch(error){
      window.alert(error?.message||"작업자 삭제에 실패했습니다.");
    }
  }

  async function normalizeManualWorkerDepartments(){
    try{
      const rows=await fetchSyncRows();
      const targets=rows.filter(row=>{
        const key=clean(row?.record_key);
        const payload=row?.payload&&typeof row.payload==="object"?row.payload:{};
        return key.startsWith("worker:")&&payload.active!==false&&clean(payload.dept)!==TARGET_DEPT;
      });
      for(const row of targets){
        const payload=row.payload&&typeof row.payload==="object"?row.payload:{};
        await saveWorker(clean(row.record_key),{
          ...payload,
          dept:TARGET_DEPT,
          updatedAt:new Date().toISOString(),
          updatedBy:"PRODUCTION WORKER NORMALIZE"
        });
      }
    }catch(error){
      console.warn("[QMES 생산공정] 추가 작업자 부서 통일 실패",error?.message||error);
    }
  }

  document.addEventListener("click",event=>{
    const deleteButton=event.target.closest?.(".qpp-worker-delete");
    if(deleteButton){
      event.preventDefault();
      event.stopPropagation();
      deactivateManualWorker(clean(deleteButton.dataset.workerId),clean(deleteButton.dataset.workerName));
      return;
    }

    const button=event.target.closest?.("button");
    if(!button) return;
    const text=clean(button.textContent);
    if(text==="작업자 선택"||text==="선택 적용"||text==="전체해제"){
      setTimeout(decorateWorkerModal,0);
      setTimeout(decorateWorkerModal,80);
    }
  },true);

  document.addEventListener("change",event=>{
    if(event.target.closest?.(".qpp-worker-item")) setTimeout(decorateWorkerModal,0);
  },true);

  const start=()=>{
    normalizeManualWorkerDepartments();
    setTimeout(decorateWorkerModal,150);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
