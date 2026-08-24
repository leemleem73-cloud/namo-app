/* QMES production worker normalization / delete helper, 2026-08-24 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_WORKER_NORMALIZE_DELETE_20260824__) return;
  window.__QMES_PRODUCTION_WORKER_NORMALIZE_DELETE_20260824__=true;

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

  async function normalizeManualWorkerDepartments(){
    try{
      const rows=await fetchSyncRows();
      for(const row of rows){
        const key=clean(row?.record_key);
        if(!key.startsWith("worker:")) continue;
        const payload=row?.payload&&typeof row.payload==="object"?row.payload:{};
        if(payload.active===false) continue;
        if(clean(payload.dept)===TARGET_DEPT) continue;
        await saveWorker(key,{...payload,dept:TARGET_DEPT,updatedAt:new Date().toISOString(),updatedBy:"PRODUCTION WORKER NORMALIZE"});
      }
    }catch(error){
      console.warn("[QMES 생산공정] 작업자 부서 통일 실패",error?.message||error);
    }
  }

  async function deactivateManualWorker(workerId,workerName,card){
    if(!workerId||!workerId.startsWith("PW-")) return;
    const ok=window.confirm(`${workerName||"등록 작업자"} 항목을 삭제할까요?\n회원 계정은 삭제되지 않고 생산공정 추가 작업자에서만 제외됩니다.`);
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
      card?.remove();
      const refresh=Array.from(document.querySelectorAll(".qmes-prod-process button")).find(button=>clean(button.textContent)==="새로고침");
      if(refresh&&!refresh.disabled) setTimeout(()=>refresh.click(),80);
    }catch(error){
      window.alert(error?.message||"작업자 삭제에 실패했습니다.");
    }
  }

  function setReactInputValue(input,value){
    if(!input||input.value===value) return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
    descriptor?.set?.call(input,value);
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function normalizeRegisterModal(){
    document.querySelectorAll(".qpp-dialog").forEach(dialog=>{
      const title=clean(dialog.querySelector(".qpp-dialog-head b")?.textContent);
      if(title!=="추가 작업자 등록") return;
      const labels=Array.from(dialog.querySelectorAll(".qpp-form label"));
      const deptLabel=labels.find(label=>clean(label.childNodes?.[0]?.textContent||label.textContent).startsWith("부서"));
      const input=deptLabel?.querySelector("input");
      if(input){
        input.placeholder=TARGET_DEPT;
        if(clean(input.value)!==TARGET_DEPT) setReactInputValue(input,TARGET_DEPT);
      }
    });
  }

  function enhanceWorkerCards(){
    const cards=Array.from(document.querySelectorAll(".qpp-worker-item"));
    const nameCount=new Map();
    cards.forEach(card=>{
      const name=clean(card.querySelector("b")?.textContent);
      if(name) nameCount.set(name,(nameCount.get(name)||0)+1);
    });

    cards.forEach(card=>{
      const name=clean(card.querySelector("b")?.textContent);
      const small=card.querySelector("small");
      if(!small) return;
      const raw=clean(small.dataset.qmesOriginal||small.textContent);
      if(!small.dataset.qmesOriginal) small.dataset.qmesOriginal=raw;
      const workerId=clean(raw.split("·")[0]);
      card.dataset.qmesWorkerId=workerId;

      // User request: hide UUID/PW identifier and display one department label only.
      small.textContent=TARGET_DEPT;

      if(workerId.startsWith("PW-")&&!card.querySelector(".qpp-worker-delete")){
        const button=document.createElement("button");
        button.type="button";
        button.className="qpp-worker-delete";
        button.textContent=(nameCount.get(name)||0)>1?"중복 삭제":"삭제";
        button.title="추가 등록 작업자 삭제";
        button.style.cssText="margin-left:auto;padding:5px 8px;border:1px solid #7f3543;border-radius:6px;background:#3b2028;color:#fecdd3;font-size:10px;font-weight:800;cursor:pointer;";
        button.addEventListener("click",event=>{
          event.preventDefault();
          event.stopPropagation();
          deactivateManualWorker(workerId,name,card);
        });
        card.appendChild(button);
      }
    });

    document.querySelectorAll(".qpp-chip").forEach(chip=>{
      const text=clean(chip.textContent);
      const name=text.split("·")[0].trim();
      chip.textContent=name?`${name} · ${TARGET_DEPT}`:TARGET_DEPT;
    });
  }

  function apply(){
    normalizeRegisterModal();
    enhanceWorkerCards();
  }

  const observer=new MutationObserver(()=>apply());
  const start=()=>{
    apply();
    observer.observe(document.body,{childList:true,subtree:true});
    normalizeManualWorkerDepartments();
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
