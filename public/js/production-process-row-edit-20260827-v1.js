/* NAMO QMES - Production process row edit v1 - 2026-08-27
 * ADD-ONLY patch. Existing production process / remark files are not replaced.
 * The per-row '수정' button now opens a full process-row editor instead of a remark-only editor.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_ROW_EDIT_20260827_V1__) return;
  window.__QMES_PROCESS_ROW_EDIT_20260827_V1__=true;

  const API="/api/qmes-sync/workorder";
  const MODAL_ID="qmes-process-row-edit-modal-20260827-v1";
  const REMARK_STORE="qmes-process-step-remarks-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function currentLot(){
    const root=document.querySelector(".qmes-prod-process");
    const info=root?.querySelector(".qpp-info");
    if(!info) return "";
    for(const box of Array.from(info.children||[])){
      const label=clean(box.querySelector("small")?.textContent).toUpperCase().replace(/[\s.]/g,"");
      if(label!=="LOTNO") continue;
      const lot=clean(box.querySelector("strong")?.textContent);
      if(lot&&lot!=="-") return lot;
    }
    return "";
  }

  function closeLegacyModals(){
    document.getElementById("qmes-process-remark-modal-v1")?.remove();
    document.getElementById("qmes-process-remark-modal-20260827")?.remove();
  }
  function closeModal(){document.getElementById(MODAL_ID)?.remove();}

  function ensureStyle(){
    if(document.getElementById("qmes-process-row-edit-style-20260827-v1")) return;
    const style=document.createElement("style");
    style.id="qmes-process-row-edit-style-20260827-v1";
    style.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.42)!important}
      #${MODAL_ID} .qpre-card{width:min(720px,96vw)!important;max-height:90vh!important;overflow:auto!important;border:0!important;border-radius:12px!important;background:#fff!important;box-shadow:0 28px 80px rgba(15,23,42,.30)!important;color:#0f172a!important}
      #${MODAL_ID} .qpre-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:16px 18px!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important}
      #${MODAL_ID} .qpre-head b{font-size:17px!important;font-weight:900!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
      #${MODAL_ID} .qpre-close{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #${MODAL_ID} .qpre-body{padding:18px!important}
      #${MODAL_ID} .qpre-meta{margin-bottom:14px!important;color:#475569!important;font-size:12px!important;font-weight:800!important}
      #${MODAL_ID} .qpre-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
      #${MODAL_ID} label{display:block!important;color:#334155!important;font-size:11px!important;font-weight:850!important}
      #${MODAL_ID} label.full{grid-column:1/-1!important}
      #${MODAL_ID} input,#${MODAL_ID} select,#${MODAL_ID} textarea{box-sizing:border-box!important;width:100%!important;margin-top:6px!important;padding:10px 11px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:13px!important;font-weight:700!important;outline:none!important;box-shadow:none!important}
      #${MODAL_ID} input[readonly]{background:#f8fafc!important;color:#64748b!important;-webkit-text-fill-color:#64748b!important}
      #${MODAL_ID} textarea{min-height:105px!important;resize:vertical!important;line-height:1.5!important}
      #${MODAL_ID} .qpre-error{display:none!important;margin-top:12px!important;color:#b91c1c!important;font-size:11px!important;font-weight:800!important}
      #${MODAL_ID} .qpre-error.show{display:block!important}
      #${MODAL_ID} .qpre-foot{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 18px!important;border-top:1px solid #e2e8f0!important;background:#f8fafc!important}
      #${MODAL_ID} .qpre-foot button{height:38px!important;min-width:82px!important;padding:0 16px!important;border-radius:8px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}
      #${MODAL_ID} .qpre-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      #${MODAL_ID} .qpre-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      @media(max-width:640px){#${MODAL_ID} .qpre-grid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function hhmm(value){
    const text=clean(value);
    if(!text) return "";
    const date=new Date(text);
    if(!Number.isNaN(date.getTime())){
      return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
    }
    const match=text.match(/(\d{1,2}):(\d{2})/);
    return match?`${String(match[1]).padStart(2,"0")}:${match[2]}`:"";
  }

  function datePart(value,fallback){
    const match=clean(value).match(/(20\d{2})-(\d{2})-(\d{2})/);
    if(match) return `${match[1]}-${match[2]}-${match[3]}`;
    const fb=clean(fallback).match(/(20\d{2})-(\d{2})-(\d{2})/);
    return fb?`${fb[1]}-${fb[2]}-${fb[3]}`:new Date().toISOString().slice(0,10);
  }

  function mergeTime(existing,timeText,fallbackDate){
    const t=clean(timeText);
    if(!t) return "";
    const d=datePart(existing,fallbackDate);
    const local=new Date(`${d}T${t}:00`);
    return Number.isNaN(local.getTime())?existing:local.toISOString();
  }

  async function fetchProcess(lot){
    const response=await fetch(API,{credentials:"same-origin"});
    const data=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||data.success===false) throw new Error(data.message||"생산공정 데이터를 불러오지 못했습니다.");
    const rows=Array.isArray(data.data)?data.data:[];
    const record=rows.find(row=>clean(row?.record_key)===`process:${lot}`);
    const payload=record?.payload&&typeof record.payload==="object"?record.payload:null;
    if(!payload||!Array.isArray(payload.steps)) throw new Error("저장된 생산공정 데이터를 찾지 못했습니다.");
    return payload;
  }

  function saveRemarkLocal(lot,stepNo,note){
    try{
      const store=JSON.parse(localStorage.getItem(REMARK_STORE)||"{}");
      store[lot]=store[lot]&&typeof store[lot]==="object"?store[lot]:{};
      store[lot][String(stepNo)]=clean(note);
      localStorage.setItem(REMARK_STORE,JSON.stringify(store));
    }catch(_error){}
  }

  async function saveRow(lot,rowIndex,form){
    const payload=await fetchProcess(lot);
    const domRow=Array.from(document.querySelectorAll(".qpp-card .qpp-table tbody tr"))[rowIndex];
    const domNo=Number(clean(domRow?.children?.[0]?.textContent));
    let index=payload.steps.findIndex(step=>Number(step?.no)===domNo);
    if(index<0) index=rowIndex;
    if(!payload.steps[index]) throw new Error("수정할 공정 행을 찾지 못했습니다.");

    const current=payload.steps[index];
    const productionDate=payload.productionDate||payload.date||"";
    const defect=Number(String(form.defectQty||"0").replace(/,/g,""));
    if(!Number.isFinite(defect)||defect<0) throw new Error("불량수량은 0 이상의 숫자로 입력하세요.");

    const nextStep={
      ...current,
      name:clean(form.name)||current.name,
      equipment:clean(form.equipment)||current.equipment,
      startAt:mergeTime(current.startAt,form.startAt,productionDate),
      endAt:mergeTime(current.endAt,form.endAt,productionDate),
      defectQty:String(defect),
      status:["대기","진행중","완료"].includes(form.status)?form.status:current.status,
      remark:clean(form.remark)
    };
    const steps=payload.steps.map((step,i)=>i===index?nextStep:step);
    const allDone=steps.every(step=>clean(step?.status)==="완료");
    const anyStarted=steps.some(step=>["진행중","완료"].includes(clean(step?.status)));
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    const next={
      ...payload,
      steps,
      status:allDone?"완료":(anyStarted?"진행중":"대기"),
      updatedAt:new Date().toISOString(),
      updatedBy:clean(user?.name||user?.uid)||"사용자"
    };

    const response=await fetch(API,{
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({key:`process:${lot}`,payload:next})
    });
    const data=await response.json().catch(()=>({success:false}));
    if(!response.ok||data.success===false) throw new Error(data.message||"공정 수정 저장에 실패했습니다.");

    saveRemarkLocal(lot,nextStep.no,nextStep.remark);
    try{
      if(window.DB){
        DB.productionProcesses=DB.productionProcesses||{};
        DB.productionProcesses[lot]=next;
      }
      if(typeof window.dbSave==="function") window.dbSave();
    }catch(_error){}
    return {next,nextStep,index};
  }

  function updateDom(row,step){
    if(!row||!step) return;
    if(row.children[1]) row.children[1].textContent=clean(step.name);
    if(row.children[2]) row.children[2].textContent=clean(step.equipment);
    if(row.children[3]) row.children[3].textContent=hhmm(step.startAt)||"-";
    if(row.children[4]) row.children[4].textContent=hhmm(step.endAt)||"-";
    if(row.children[5]) row.children[5].textContent=clean(step.defectQty)||"0";
    const status=row.children[6]?.querySelector(".qpp-status");
    if(status){
      status.textContent=clean(step.status)||"대기";
      status.classList.remove("done","run","wait");
      status.classList.add(step.status==="완료"?"done":step.status==="진행중"?"run":"wait");
    }
    const remarkCell=row.querySelector(".qmes-process-remark-cell-v1,.qmes-process-remark-cell");
    if(remarkCell){
      remarkCell.dataset.remark=clean(step.remark);
      const text=remarkCell.querySelector(".qmes-process-remark-text-v1,.qmes-process-remark-text");
      if(text) text.textContent=clean(step.remark);
    }
  }

  async function openEditor(button){
    ensureStyle();
    closeLegacyModals();
    closeModal();

    const row=button.closest("tbody tr");
    const table=button.closest("table.qpp-table")||button.closest("table");
    const rows=Array.from(table?.querySelectorAll("tbody tr")||[]);
    const rowIndex=rows.indexOf(row);
    const lot=clean(button.closest("td")?.dataset.qmesLot)||currentLot();
    if(rowIndex<0||!row){window.alert("수정할 공정 행을 찾지 못했습니다.");return;}
    if(!lot){window.alert("LOT No.를 확인하지 못했습니다.");return;}

    let payload;
    try{payload=await fetchProcess(lot);}catch(error){window.alert(error.message);return;}
    const no=Number(clean(row.children?.[0]?.textContent));
    let processIndex=payload.steps.findIndex(step=>Number(step?.no)===no);
    if(processIndex<0) processIndex=rowIndex;
    const step=payload.steps[processIndex]||{};

    const modal=document.createElement("div");
    modal.id=MODAL_ID;
    modal.innerHTML=`<div class="qpre-card" role="dialog" aria-modal="true" aria-label="공정 수정"><div class="qpre-head"><b>공정 수정</b><button type="button" class="qpre-close">닫기</button></div><div class="qpre-body"><div class="qpre-meta">${esc(lot)} · 공정 ${esc(step.no??no)}</div><div class="qpre-grid"><label>순번<input name="no" value="${esc(step.no??no)}" readonly></label><label>상태<select name="status"><option value="대기"${clean(step.status)==="대기"?" selected":""}>대기</option><option value="진행중"${clean(step.status)==="진행중"?" selected":""}>진행중</option><option value="완료"${clean(step.status)==="완료"?" selected":""}>완료</option></select></label><label class="full">공정명<input name="name" value="${esc(step.name)}"></label><label class="full">설비<input name="equipment" value="${esc(step.equipment)}"></label><label>시작<input type="time" name="startAt" value="${esc(hhmm(step.startAt))}"></label><label>종료<input type="time" name="endAt" value="${esc(hhmm(step.endAt))}"></label><label>불량수량<input type="number" min="0" step="1" name="defectQty" value="${esc(step.defectQty||"0")}"></label><label class="full">비고<textarea name="remark" maxlength="500" placeholder="공정 비고를 입력하세요.">${esc(step.remark||"")}</textarea></label></div><div class="qpre-error"></div></div><div class="qpre-foot"><button type="button" class="qpre-cancel">취소</button><button type="button" class="qpre-save">저장</button></div></div>`;

    modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest(".qpre-close,.qpre-cancel")) closeModal();});
    modal.querySelector(".qpre-save")?.addEventListener("click",async()=>{
      const save=modal.querySelector(".qpre-save"),error=modal.querySelector(".qpre-error");
      const form={
        name:modal.querySelector('[name="name"]')?.value,
        equipment:modal.querySelector('[name="equipment"]')?.value,
        startAt:modal.querySelector('[name="startAt"]')?.value,
        endAt:modal.querySelector('[name="endAt"]')?.value,
        defectQty:modal.querySelector('[name="defectQty"]')?.value,
        status:modal.querySelector('[name="status"]')?.value,
        remark:modal.querySelector('[name="remark"]')?.value
      };
      save.disabled=true;save.textContent="저장 중";error.classList.remove("show");
      try{
        const result=await saveRow(lot,rowIndex,form);
        updateDom(row,result.nextStep);
        closeModal();
        try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot,source:"row-edit",stepNo:result.nextStep.no}}));}catch(_error){}
      }catch(saveError){
        error.textContent=saveError?.message||"공정 수정 저장에 실패했습니다.";
        error.classList.add("show");
        save.disabled=false;save.textContent="저장";
      }
    });

    document.body.appendChild(modal);
  }

  /* Window capture runs before the older document-level remark-only click owner. */
  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const button=target.closest(".qmes-process-remark-btn-v1,.qmes-process-remark-inline-btn");
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openEditor(button);
  },true);

  ensureStyle();
})();
