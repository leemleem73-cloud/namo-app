/* NAMO QMES - Production process editor owner v2 - 2026-08-27
 * ADD-ONLY owner patch. Existing source files are not replaced.
 * - Suppresses legacy remark-only/edit owners before they load.
 * - Owns the right-side 비고/수정 column through React re-renders.
 * - Opens the full 공정 수정 modal immediately from the visible row (no DB wait).
 * - Hydrates from shared DB in the background and saves only the selected process row.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_EDITOR_OWNER_20260827_V2__) return;
  window.__QMES_PROCESS_EDITOR_OWNER_20260827_V2__=true;

  /* Disable older competing owners before they execute later in index/master loader. */
  window.__QMES_PROCESS_ROW_EDIT_20260827_V1__=true;
  window.__QMES_PROCESS_REMARK_STABLE_PATCH_20260827_V1__=true;
  window.__QMES_PROCESS_REMARK_EDIT_20260827__=true;
  window.__QMES_PROCESS_REMARK_CLICK_HOTFIX_20260827__=true;

  const API="/api/qmes-sync/workorder";
  const MODAL_ID="qmes-process-editor-owner-modal-20260827-v2";
  const STORE_KEY="qmes-process-step-remarks-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function readStore(){try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");return v&&typeof v==="object"?v:{};}catch(_){return {};}}
  function writeStore(v){try{localStorage.setItem(STORE_KEY,JSON.stringify(v));}catch(_){}}
  function noteFor(lot,no){const s=readStore();return clean(s?.[lot]?.[String(no)]);}
  function saveNote(lot,no,note){const s=readStore();s[lot]=s[lot]&&typeof s[lot]==="object"?s[lot]:{};s[lot][String(no)]=clean(note);writeStore(s);}

  function processCard(){return Array.from(document.querySelectorAll(".qpp-card")).find(card=>clean(card.querySelector(".qpp-card-head b")?.textContent)==="공정 진행 현황")||null;}
  function processTable(){return processCard()?.querySelector("table.qpp-table")||null;}
  function currentLot(){
    const root=document.querySelector(".qmes-prod-process");
    const info=root?.querySelector(".qpp-info");
    if(info){
      for(const box of Array.from(info.children||[])){
        const label=clean(box.querySelector("small")?.textContent).toUpperCase().replace(/[\s.]/g,"");
        if(label!=="LOTNO") continue;
        const lot=clean(box.querySelector("strong")?.textContent);
        if(lot&&lot!=="-") return lot;
      }
    }
    return clean(root?.querySelector(".qpp-toolbar .qpp-select")?.value);
  }

  function ensureStyle(){
    if(document.getElementById("qmes-process-editor-owner-style-20260827-v2")) return;
    const style=document.createElement("style");style.id="qmes-process-editor-owner-style-20260827-v2";
    style.textContent=`
      .qmes-process-owner-head,.qmes-process-owner-cell{width:13%!important;min-width:128px!important;max-width:220px!important;text-align:center!important}
      .qmes-process-owner-inline{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important}.qmes-process-owner-note{max-width:110px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#64748b!important;font-size:11px!important;font-weight:700!important}.qmes-process-owner-note:empty{display:none!important}
      .qmes-process-owner-btn{height:32px!important;min-width:56px!important;padding:0 11px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important;box-shadow:none!important;outline:none!important}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.42)!important}
      #${MODAL_ID} .qpe-card{width:min(720px,96vw)!important;max-height:90vh!important;overflow:auto!important;border:0!important;border-radius:12px!important;background:#fff!important;box-shadow:0 28px 80px rgba(15,23,42,.30)!important;color:#0f172a!important}
      #${MODAL_ID} .qpe-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:16px 18px!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important}#${MODAL_ID} .qpe-head b{font-size:17px!important;font-weight:900!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}#${MODAL_ID} .qpe-close{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #${MODAL_ID} .qpe-body{padding:18px!important}#${MODAL_ID} .qpe-meta{margin-bottom:14px!important;color:#475569!important;font-size:12px!important;font-weight:800!important}#${MODAL_ID} .qpe-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}#${MODAL_ID} label{display:block!important;color:#334155!important;font-size:11px!important;font-weight:850!important}#${MODAL_ID} label.full{grid-column:1/-1!important}
      #${MODAL_ID} input,#${MODAL_ID} select,#${MODAL_ID} textarea{box-sizing:border-box!important;width:100%!important;margin-top:6px!important;padding:10px 11px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:13px!important;font-weight:700!important;outline:none!important;box-shadow:none!important}#${MODAL_ID} input[readonly]{background:#f8fafc!important;color:#64748b!important;-webkit-text-fill-color:#64748b!important}#${MODAL_ID} textarea{min-height:105px!important;resize:vertical!important;line-height:1.5!important}
      #${MODAL_ID} .qpe-loading{margin-top:10px!important;color:#64748b!important;font-size:10px!important;font-weight:700!important}#${MODAL_ID} .qpe-error{display:none!important;margin-top:10px!important;color:#b91c1c!important;font-size:11px!important;font-weight:800!important}#${MODAL_ID} .qpe-error.show{display:block!important}
      #${MODAL_ID} .qpe-foot{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 18px!important;border-top:1px solid #e2e8f0!important;background:#f8fafc!important}#${MODAL_ID} .qpe-foot button{height:38px!important;min-width:82px!important;padding:0 16px!important;border-radius:8px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}#${MODAL_ID} .qpe-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}#${MODAL_ID} .qpe-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      @media(max-width:640px){#${MODAL_ID} .qpe-grid{grid-template-columns:1fr!important}}
    `;document.head.appendChild(style);
  }

  function removeLegacy(){
    document.querySelectorAll(".qmes-process-remark-head,.qmes-process-remark-cell,.qmes-process-remark-actions,.qmes-process-remark-head-v1,.qmes-process-remark-cell-v1").forEach(n=>n.remove());
    document.getElementById("qmes-process-remark-modal-v1")?.remove();
    document.getElementById("qmes-process-remark-modal-20260827")?.remove();
    document.getElementById("qmes-process-row-edit-modal-20260827-v1")?.remove();
  }

  let repairing=false;
  function repair(){
    if(repairing) return;repairing=true;
    try{
      ensureStyle();removeLegacy();
      const table=processTable();if(!table)return;
      const lot=currentLot();
      const head=table.querySelector("thead tr");
      if(head&&!head.querySelector(".qmes-process-owner-head")){const th=document.createElement("th");th.className="qmes-process-owner-head";th.textContent="비고";head.appendChild(th);}
      Array.from(table.querySelectorAll("tbody tr")).forEach((row,index)=>{
        const no=Number(clean(row.children?.[0]?.textContent))||index+1;
        let cell=row.querySelector(".qmes-process-owner-cell");
        if(!cell){cell=document.createElement("td");cell.className="qmes-process-owner-cell";row.appendChild(cell);}
        cell.dataset.qmesLot=lot;cell.dataset.stepNo=String(no);cell.dataset.rowIndex=String(index);
        if(!cell.querySelector(".qmes-process-owner-inline"))cell.innerHTML='<div class="qmes-process-owner-inline"><span class="qmes-process-owner-note"></span><button type="button" class="qmes-process-owner-btn">수정</button></div>';
        const note=noteFor(lot,no)||clean(cell.dataset.remark);cell.dataset.remark=note;cell.querySelector(".qmes-process-owner-note").textContent=note;
      });
    }finally{repairing=false;}
  }

  function hhmm(v){const text=clean(v);if(!text)return"";const d=new Date(text);if(!Number.isNaN(d.getTime()))return`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;const m=text.match(/(\d{1,2}):(\d{2})/);return m?`${String(m[1]).padStart(2,"0")}:${m[2]}`:"";}
  function datePart(v,fallback){const m=clean(v).match(/(20\d{2})-(\d{2})-(\d{2})/);if(m)return`${m[1]}-${m[2]}-${m[3]}`;const f=clean(fallback).match(/(20\d{2})-(\d{2})-(\d{2})/);return f?`${f[1]}-${f[2]}-${f[3]}`:new Date().toISOString().slice(0,10);}
  function mergeTime(existing,time,fallbackDate){const t=clean(time);if(!t)return"";const d=datePart(existing,fallbackDate),local=new Date(`${d}T${t}:00`);return Number.isNaN(local.getTime())?existing:local.toISOString();}

  async function fetchProcess(lot){const r=await fetch(API,{credentials:"same-origin"});const d=await r.json().catch(()=>({success:false,data:[]}));if(!r.ok||d.success===false)throw new Error(d.message||"생산공정 데이터를 불러오지 못했습니다.");const rec=(Array.isArray(d.data)?d.data:[]).find(x=>clean(x?.record_key)===`process:${lot}`),p=rec?.payload&&typeof rec.payload==="object"?rec.payload:null;if(!p||!Array.isArray(p.steps))throw new Error("저장된 생산공정 데이터를 찾지 못했습니다.");return p;}

  function closeModal(){document.getElementById(MODAL_ID)?.remove();}
  function rowSnapshot(row,cell){
    return {no:Number(clean(row.children?.[0]?.textContent))||0,name:clean(row.children?.[1]?.textContent),equipment:clean(row.children?.[2]?.textContent),startAt:clean(row.children?.[3]?.textContent),endAt:clean(row.children?.[4]?.textContent),defectQty:clean(row.children?.[5]?.textContent)||"0",status:clean(row.children?.[6]?.textContent)||"대기",remark:clean(cell?.dataset.remark)};
  }

  function fillModal(modal,step){
    const set=(name,value)=>{const el=modal.querySelector(`[name="${name}"]`);if(el&&document.activeElement!==el)el.value=value??"";};
    set("name",step.name);set("equipment",step.equipment);set("startAt",hhmm(step.startAt)||step.startAt);set("endAt",hhmm(step.endAt)||step.endAt);set("defectQty",step.defectQty??"0");set("status",step.status||"대기");set("remark",step.remark||"");
  }

  async function hydrate(modal,lot,no){
    const loading=modal.querySelector(".qpe-loading");
    try{const payload=await fetchProcess(lot);const step=payload.steps.find(s=>Number(s?.no)===Number(no));if(!step)return;if(!document.body.contains(modal))return;fillModal(modal,step);modal.dataset.processDate=clean(payload.productionDate||payload.date);modal.dataset.stepIndex=String(payload.steps.indexOf(step));if(loading)loading.textContent="공용 DB 최신값 확인 완료";}
    catch(_error){if(loading)loading.textContent="현재 화면 값을 기준으로 수정합니다.";}
  }

  function openImmediate(button){
    ensureStyle();removeLegacy();closeModal();
    const cell=button.closest(".qmes-process-owner-cell"),row=button.closest("tbody tr"),lot=clean(cell?.dataset.qmesLot)||currentLot();
    if(!row||!lot){window.alert("수정할 공정 또는 LOT 정보를 확인하지 못했습니다.");return;}
    const snap=rowSnapshot(row,cell),no=snap.no;
    const modal=document.createElement("div");modal.id=MODAL_ID;modal.dataset.lot=lot;modal.dataset.no=String(no);
    modal.innerHTML=`<div class="qpe-card" role="dialog" aria-modal="true" aria-label="공정 수정"><div class="qpe-head"><b>공정 수정</b><button type="button" class="qpe-close">닫기</button></div><div class="qpe-body"><div class="qpe-meta">${esc(lot)} · 공정 ${esc(no)}</div><div class="qpe-grid"><label>순번<input name="no" value="${esc(no)}" readonly></label><label>상태<select name="status"><option value="대기"${snap.status.includes("대기")?" selected":""}>대기</option><option value="진행중"${snap.status.includes("진행")?" selected":""}>진행중</option><option value="완료"${snap.status.includes("완료")?" selected":""}>완료</option></select></label><label class="full">공정명<input name="name" value="${esc(snap.name)}"></label><label class="full">설비<input name="equipment" value="${esc(snap.equipment)}"></label><label>시작<input type="time" name="startAt" value="${esc(hhmm(snap.startAt)||snap.startAt)}"></label><label>종료<input type="time" name="endAt" value="${esc(hhmm(snap.endAt)||snap.endAt)}"></label><label>불량수량<input type="number" min="0" step="1" name="defectQty" value="${esc(snap.defectQty)}"></label><label class="full">비고<textarea name="remark" maxlength="500" placeholder="공정 비고를 입력하세요.">${esc(snap.remark)}</textarea></label></div><div class="qpe-loading">공용 DB 최신값 확인 중...</div><div class="qpe-error"></div></div><div class="qpe-foot"><button type="button" class="qpe-cancel">취소</button><button type="button" class="qpe-save">저장</button></div></div>`;
    modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest(".qpe-close,.qpe-cancel"))closeModal();});
    modal.querySelector(".qpe-save")?.addEventListener("click",async()=>{
      const save=modal.querySelector(".qpe-save"),error=modal.querySelector(".qpe-error");save.disabled=true;save.textContent="저장 중";error.classList.remove("show");
      try{
        const payload=await fetchProcess(lot);let index=payload.steps.findIndex(s=>Number(s?.no)===Number(no));if(index<0)throw new Error("수정할 공정 행을 찾지 못했습니다.");const current=payload.steps[index];
        const defect=Number(String(modal.querySelector('[name="defectQty"]')?.value||"0").replace(/,/g,""));if(!Number.isFinite(defect)||defect<0)throw new Error("불량수량은 0 이상의 숫자로 입력하세요.");
        const nextStep={...current,name:clean(modal.querySelector('[name="name"]')?.value)||current.name,equipment:clean(modal.querySelector('[name="equipment"]')?.value)||current.equipment,startAt:mergeTime(current.startAt,modal.querySelector('[name="startAt"]')?.value,payload.productionDate||payload.date),endAt:mergeTime(current.endAt,modal.querySelector('[name="endAt"]')?.value,payload.productionDate||payload.date),defectQty:String(defect),status:clean(modal.querySelector('[name="status"]')?.value)||current.status,remark:clean(modal.querySelector('[name="remark"]')?.value)};
        const steps=payload.steps.map((s,i)=>i===index?nextStep:s),allDone=steps.every(s=>clean(s?.status)==="완료"),anyStarted=steps.some(s=>["진행중","완료"].includes(clean(s?.status)));const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};const next={...payload,steps,status:allDone?"완료":(anyStarted?"진행중":"대기"),updatedAt:new Date().toISOString(),updatedBy:clean(user?.name||user?.uid)||"사용자"};
        const r=await fetch(API,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:`process:${lot}`,payload:next})});const d=await r.json().catch(()=>({success:false}));if(!r.ok||d.success===false)throw new Error(d.message||"공정 수정 저장에 실패했습니다.");
        saveNote(lot,no,nextStep.remark);if(row.children[1])row.children[1].textContent=clean(nextStep.name);if(row.children[2])row.children[2].textContent=clean(nextStep.equipment);if(row.children[3])row.children[3].textContent=hhmm(nextStep.startAt)||"-";if(row.children[4])row.children[4].textContent=hhmm(nextStep.endAt)||"-";if(row.children[5])row.children[5].textContent=clean(nextStep.defectQty)||"0";cell.dataset.remark=nextStep.remark;cell.querySelector(".qmes-process-owner-note").textContent=nextStep.remark;closeModal();try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot,stepNo:no,source:"editor-owner-v2"}}));}catch(_){ }
      }catch(err){error.textContent=err?.message||"공정 수정 저장에 실패했습니다.";error.classList.add("show");save.disabled=false;save.textContent="저장";}
    });
    document.body.appendChild(modal);hydrate(modal,lot,no);
  }

  /* Earliest capture owner: opens the correct modal synchronously before any legacy listener. */
  window.addEventListener("pointerdown",event=>{const b=event.target instanceof Element?event.target.closest(".qmes-process-owner-btn"):null;if(!b)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openImmediate(b);},true);
  window.addEventListener("click",event=>{const b=event.target instanceof Element?event.target.closest(".qmes-process-owner-btn"):null;if(!b)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();if(!document.getElementById(MODAL_ID))openImmediate(b);},true);

  let raf=0;
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;repair();});}
  function start(){repair();const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});["qmes:production-process-updated","qmes:data-updated","qmes:mes-master-ready","qmes:workorder-synced"].forEach(n=>window.addEventListener(n,schedule));[50,150,350,800,1600].forEach(t=>setTimeout(repair,t));}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
