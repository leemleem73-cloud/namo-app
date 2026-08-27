/* NAMO QMES - Production process remarks inline edit - 2026-08-27
 * Patch-only module; preserves the existing ProductionProcessTab.
 * Adds a right-side '비고' column and puts a '수정' button in each row's remark cell.
 * Remarks are stored in the shared process:<LOT> workorder sync payload per step.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_REMARK_EDIT_20260827__) return;
  window.__QMES_PROCESS_REMARK_EDIT_20260827__=true;

  const STORE_KEY="qmes-process-step-remarks-v1";
  const API="/api/qmes-sync/workorder";
  const clean=value=>String(value==null?"":value).trim();
  const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const nativeFetch=window.fetch.bind(window);

  function readStore(){try{const value=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");return value&&typeof value==="object"?value:{};}catch(_error){return {};}}
  function writeStore(value){try{localStorage.setItem(STORE_KEY,JSON.stringify(value));}catch(_error){}}
  function notesForLot(lot){const store=readStore();return store[lot]&&typeof store[lot]==="object"?store[lot]:{};}
  function setNotesForLot(lot,notes){const store=readStore();store[lot]={...(store[lot]||{}),...notes};writeStore(store);}

  /* Preserve saved remarks when the original React screen later saves process state. */
  window.fetch=async function(input,init){
    try{
      const url=typeof input==="string"?input:String(input?.url||"");
      const method=String(init?.method||input?.method||"GET").toUpperCase();
      if(method==="POST"&&url.includes(API)&&typeof init?.body==="string"){
        const body=JSON.parse(init.body);
        const key=clean(body?.key),lot=key.startsWith("process:")?key.slice(8):"";
        if(lot&&Array.isArray(body?.payload?.steps)){
          const saved=notesForLot(lot);
          body.payload={...body.payload,steps:body.payload.steps.map((step,index)=>{
            const stepKey=String(step?.no??index+1);
            return Object.prototype.hasOwnProperty.call(saved,stepKey)?{...step,remark:clean(saved[stepKey])}:step;
          })};
          init={...init,body:JSON.stringify(body)};
        }
      }
    }catch(_error){}
    return nativeFetch(input,init);
  };

  function processCard(){
    return Array.from(document.querySelectorAll(".qpp-card")).find(card=>clean(card.querySelector(".qpp-card-head b")?.textContent)==="공정 진행 현황")||null;
  }

  function currentLot(){
    const info=document.querySelector(".qmes-prod-process .qpp-info")||document.querySelector(".qpp-info");
    const cell=Array.from(info?.children||[]).find(node=>/LOT\s*No\.?/i.test(clean(node.querySelector("small")?.textContent)));
    const value=clean(cell?.querySelector("strong")?.textContent);
    if(value&&value!=="-") return value;
    return "";
  }

  async function fetchProcess(lot){
    if(!lot) return null;
    const response=await nativeFetch(API,{credentials:"same-origin"});
    const data=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||data.success===false) throw new Error(data.message||"공정 비고를 불러오지 못했습니다.");
    const rows=Array.isArray(data.data)?data.data:[];
    const record=rows.find(row=>clean(row?.record_key)===`process:${lot}`);
    const payload=record?.payload&&typeof record.payload==="object"?record.payload:null;
    if(payload&&Array.isArray(payload.steps)){
      const notes={};
      payload.steps.forEach((step,index)=>{notes[String(step?.no??index+1)]=clean(step?.remark??step?.note);});
      setNotesForLot(lot,notes);
    }
    return payload;
  }

  async function saveRemark(lot,rowIndex,remark){
    const payload=await fetchProcess(lot);
    if(!payload||!Array.isArray(payload.steps)) throw new Error("저장된 생산공정 데이터를 찾지 못했습니다.");
    if(!payload.steps[rowIndex]) throw new Error("선택한 공정 행을 찾지 못했습니다.");
    const steps=payload.steps.map((step,index)=>index===rowIndex?{...step,remark:clean(remark)}:step);
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    const next={...payload,steps,updatedAt:new Date().toISOString(),updatedBy:clean(user?.name||user?.uid)||"사용자"};
    const stepKey=String(steps[rowIndex]?.no??rowIndex+1);
    setNotesForLot(lot,{[stepKey]:clean(remark)});
    const response=await nativeFetch(API,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:`process:${lot}`,payload:next})});
    const data=await response.json().catch(()=>({success:false}));
    if(!response.ok||data.success===false) throw new Error(data.message||"비고 저장에 실패했습니다.");
    try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot,type:"remark",stepNo:steps[rowIndex]?.no}}));}catch(_error){}
    return next;
  }

  function ensureStyle(){
    if(document.getElementById("qmes-process-remark-edit-style-20260827")) return;
    const style=document.createElement("style");
    style.id="qmes-process-remark-edit-style-20260827";
    style.textContent=`
      .qmes-process-remark-head,.qmes-process-remark-cell{width:15%!important;min-width:170px!important;max-width:260px!important}
      .qmes-process-remark-cell{color:#475569!important;font-size:12px!important}
      .qmes-process-remark-inline{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:0!important}
      .qmes-process-remark-text{min-width:20px!important;max-width:150px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#64748b!important}
      .qmes-process-remark-inline-btn{height:30px!important;min-width:54px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important;box-shadow:none!important;outline:none!important}
      .qmes-process-remark-inline-btn:hover{background:#f8fafc!important}
      .qmes-process-remark-actions{display:none!important}
      #qmes-process-remark-modal-20260827{position:fixed!important;inset:0!important;z-index:22000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.38)!important}
      #qmes-process-remark-modal-20260827 .qpr-card{width:min(560px,94vw)!important;border:0!important;outline:0!important;border-radius:12px!important;background:#fff!important;box-shadow:0 24px 70px rgba(15,23,42,.24)!important;overflow:hidden!important}
      #qmes-process-remark-modal-20260827 .qpr-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:15px 17px!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important}
      #qmes-process-remark-modal-20260827 .qpr-head b{color:#0f172a!important;font-size:16px!important;font-weight:900!important}
      #qmes-process-remark-modal-20260827 .qpr-head button{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #qmes-process-remark-modal-20260827 .qpr-body{padding:17px!important}
      #qmes-process-remark-modal-20260827 .qpr-meta{margin-bottom:9px!important;color:#475569!important;font-size:11px!important;font-weight:700!important}
      #qmes-process-remark-modal-20260827 textarea{box-sizing:border-box!important;width:100%!important;min-height:120px!important;padding:11px 12px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#0f172a!important;font-size:13px!important;line-height:1.5!important;resize:vertical!important;outline:none!important;box-shadow:none!important}
      #qmes-process-remark-modal-20260827 textarea:focus{border-color:#94a3b8!important;box-shadow:none!important;outline:none!important}
      #qmes-process-remark-modal-20260827 .qpr-error{display:none!important;margin-top:9px!important;color:#b91c1c!important;font-size:11px!important;font-weight:800!important}
      #qmes-process-remark-modal-20260827 .qpr-error.show{display:block!important}
      #qmes-process-remark-modal-20260827 .qpr-foot{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:12px 17px!important;border-top:1px solid #e2e8f0!important;background:#f8fafc!important}
      #qmes-process-remark-modal-20260827 .qpr-foot button{height:36px!important;min-width:76px!important;padding:0 14px!important;border-radius:7px!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #qmes-process-remark-modal-20260827 .qpr-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      #qmes-process-remark-modal-20260827 .qpr-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
    `;
    document.head.appendChild(style);
  }

  function closeModal(){document.getElementById("qmes-process-remark-modal-20260827")?.remove();}

  function openModalForRow(card,row){
    const table=card?.querySelector("table.qpp-table"),rows=Array.from(table?.querySelectorAll("tbody tr")||[]);
    const rowIndex=rows.indexOf(row),lot=currentLot();
    if(rowIndex<0){window.alert("수정할 공정 행을 찾지 못했습니다.");return;}
    if(!lot){window.alert("LOT No.를 확인할 수 없습니다.");return;}
    const stepNo=clean(row.children?.[0]?.textContent)||String(rowIndex+1),stepName=clean(row.children?.[1]?.textContent)||"공정";
    const current=clean(row.querySelector(".qmes-process-remark-cell")?.dataset.remark);
    closeModal();
    const modal=document.createElement("div");
    modal.id="qmes-process-remark-modal-20260827";
    modal.innerHTML=`<div class="qpr-card" role="dialog" aria-modal="true" aria-label="공정 비고 수정"><div class="qpr-head"><b>비고 수정</b><button type="button" class="qpr-close">닫기</button></div><div class="qpr-body"><div class="qpr-meta">${esc(lot)} · ${esc(stepNo)} · ${esc(stepName)}</div><textarea maxlength="500" placeholder="공정 비고를 입력하세요.">${esc(current)}</textarea><div class="qpr-error"></div></div><div class="qpr-foot"><button type="button" class="qpr-cancel">취소</button><button type="button" class="qpr-save">저장</button></div></div>`;
    modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest(".qpr-close,.qpr-cancel"))closeModal();});
    modal.querySelector(".qpr-save")?.addEventListener("click",async()=>{
      const button=modal.querySelector(".qpr-save"),textarea=modal.querySelector("textarea"),error=modal.querySelector(".qpr-error");
      button.disabled=true;button.textContent="저장 중";error.classList.remove("show");
      try{
        const next=clean(textarea.value);await saveRemark(lot,rowIndex,next);
        const cell=row.querySelector(".qmes-process-remark-cell"),text=cell?.querySelector(".qmes-process-remark-text");
        if(cell){cell.dataset.remark=next;cell.title=next;}if(text)text.textContent=next||"-";
        closeModal();
      }catch(saveError){error.textContent=saveError?.message||"비고 저장에 실패했습니다.";error.classList.add("show");button.disabled=false;button.textContent="저장";}
    });
    document.body.appendChild(modal);setTimeout(()=>modal.querySelector("textarea")?.focus(),0);
  }

  function renderRows(card,lot){
    const table=card?.querySelector("table.qpp-table");if(!table)return;
    const head=table.querySelector("thead tr");
    if(head&&!head.querySelector(".qmes-process-remark-head")){const th=document.createElement("th");th.className="qmes-process-remark-head";th.textContent="비고";head.appendChild(th);}
    card.querySelector(".qmes-process-remark-actions")?.remove();
    const notes=notesForLot(lot);
    Array.from(table.querySelectorAll("tbody tr")).forEach((row,index)=>{
      let cell=row.querySelector(".qmes-process-remark-cell");if(!cell){cell=document.createElement("td");cell.className="qmes-process-remark-cell";row.appendChild(cell);}
      const stepKey=clean(row.children?.[0]?.textContent)||String(index+1),note=Object.prototype.hasOwnProperty.call(notes,stepKey)?clean(notes[stepKey]):clean(cell.dataset.remark);
      cell.dataset.remark=note;cell.title=note;
      if(!cell.querySelector(".qmes-process-remark-inline")){
        cell.innerHTML='<div class="qmes-process-remark-inline"><span class="qmes-process-remark-text">-</span><button type="button" class="qmes-process-remark-inline-btn">수정</button></div>';
        cell.querySelector("button")?.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();openModalForRow(card,row);});
      }
      const text=cell.querySelector(".qmes-process-remark-text");if(text)text.textContent=note||"-";
    });
  }

  let lastLot="";
  async function refresh(card,lot){try{await fetchProcess(lot);}catch(_error){}renderRows(card,lot);}
  function apply(){ensureStyle();const card=processCard();if(!card)return;const lot=currentLot();if(!lot)return;renderRows(card,lot);if(lastLot!==lot){lastLot=lot;refresh(card,lot);}}

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  function start(){
    apply();
    const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes?.length||m.removedNodes?.length))schedule();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("qmes:production-process-updated",()=>setTimeout(schedule,30));
    window.addEventListener("qmes:data-updated",()=>setTimeout(schedule,30));
    setTimeout(schedule,300);setTimeout(schedule,900);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
