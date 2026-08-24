/* QMES production downtime history view - 2026-08-24 v4
 * Reliable downtime history/edit UI.
 * - Uses capture-phase edit/save handlers so the edit button works after any modal re-render.
 * - Re-fetches the latest process:<LOT> record immediately before edit save.
 * - Updates only the selected downtime row and refreshes history after save.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_DOWNTIME_HISTORY_20260824_V4__) return;
  window.__QMES_PRODUCTION_DOWNTIME_HISTORY_20260824_V4__=true;

  const clean=value=>String(value==null?"":value).trim();
  const esc=value=>clean(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const historyById=new Map();
  let editTarget=null;

  function durationLabel(value){
    const whole=Math.max(0,Math.round(Number(value)||0));
    if(whole<60) return `${whole}분`;
    const hours=Math.floor(whole/60);
    const rest=whole%60;
    return rest?`${hours}시간 ${rest}분 (${whole}분)`:`${hours}시간 (${whole}분)`;
  }

  function formatDateTime(value){
    if(!value) return "-";
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return clean(value)||"-";
    return date.toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
  }

  function currentLot(){
    const direct=document.querySelector(".qmes-prod-process .qpp-info > div:nth-child(5) strong");
    if(direct&&clean(direct.textContent)) return clean(direct.textContent);
    const select=document.querySelector(".qmes-prod-process .qpp-toolbar .qpp-select");
    return clean(select?.value);
  }

  function currentUserName(){
    const raw=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    if(typeof raw==="string") return clean(raw)||"사용자";
    return clean(raw?.name||raw?.uid||raw?.id)||"사용자";
  }

  function parsePayload(row){
    const value=row?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){
      try{return JSON.parse(value);}catch(_error){return {};}
    }
    return {};
  }

  function installStyle(){
    document.getElementById("qmes-production-downtime-history-style")?.remove();
    const style=document.createElement("style");
    style.id="qmes-production-downtime-history-style";
    style.textContent=`
      .qpp-actionbar.qmes-downtime-history-enabled{grid-template-columns:repeat(6,minmax(110px,1fr))!important}
      .qmes-downtime-history-btn{border-color:#8a6a28!important;background:#2a281d!important;color:#fde68a!important}
      .qmes-downtime-history-modal,.qmes-downtime-edit-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,18,.82)}
      .qmes-downtime-history-modal{z-index:16050}.qmes-downtime-edit-modal{z-index:16150;background:rgba(2,8,18,.90)}
      .qmes-downtime-history-dialog{width:min(1380px,97vw);max-height:90vh;overflow:hidden;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.55);color:#e2e8f0}
      .qmes-downtime-edit-dialog{width:min(780px,96vw);max-height:90vh;overflow:auto;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.65);color:#e2e8f0}
      .qmes-downtime-history-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #28445e}
      .qmes-downtime-history-head b{font-size:17px}.qmes-downtime-history-head p{margin:4px 0 0;color:#8da4b9;font-size:11px}
      .qmes-downtime-history-close,.qmes-downtime-edit-close{min-width:58px;height:36px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:800;cursor:pointer}
      .qmes-downtime-history-body{padding:14px 16px 16px;overflow:auto;max-height:calc(90vh - 68px)}
      .qmes-downtime-history-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
      .qmes-downtime-history-summary>div{padding:12px 14px;border:1px solid #294761;border-radius:9px;background:#122a44}
      .qmes-downtime-history-summary small{display:block;color:#7895af;font-size:10px;margin-bottom:5px}.qmes-downtime-history-summary strong{font-size:17px;color:#f8fafc}
      .qmes-downtime-history-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
      .qmes-downtime-history-table th{position:sticky;top:0;z-index:1;padding:10px 7px;border:1px solid #2a445f;background:#10263e;color:#8eb0cb;text-align:center!important;vertical-align:middle;white-space:nowrap}
      .qmes-downtime-history-table td{padding:10px 7px;border:1px solid #1e3852;color:#dbe7f2;text-align:center!important;vertical-align:middle;word-break:keep-all}
      .qmes-downtime-history-table tbody tr.current-lot{background:#122f47}.qmes-downtime-history-table tbody tr:hover{background:#163550}
      .qmes-downtime-history-empty{padding:30px 10px;text-align:center!important;color:#94a3b8}
      .qmes-downtime-history-reason{font-weight:800;color:#fde68a!important;text-align:center!important}.qmes-downtime-history-note{text-align:center!important;white-space:normal}
      .qmes-downtime-edit-btn{display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:30px;padding:0 9px;border:1px solid #0ea5e9;border-radius:6px;background:#075985;color:#e0f2fe;font-size:11px;font-weight:900;cursor:pointer;pointer-events:auto!important}
      .qmes-downtime-edit-btn:hover{background:#087ca8}
      .qmes-downtime-edit-body{padding:15px 16px}.qmes-downtime-edit-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin-bottom:14px;border:1px solid #294761;border-radius:9px;overflow:hidden;background:#294761}
      .qmes-downtime-edit-summary>div{min-width:0;padding:11px 12px;background:#122a44}.qmes-downtime-edit-summary small{display:block;margin-bottom:5px;color:#7895af;font-size:10px}.qmes-downtime-edit-summary strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1f5f9;font-size:12px}
      .qmes-downtime-edit-form{display:grid;grid-template-columns:1fr 150px 150px;gap:12px}.qmes-downtime-edit-form label{display:flex;min-width:0;flex-direction:column;gap:7px;color:#a9bfd2;font-size:12px;font-weight:800}.qmes-downtime-edit-form label.full{grid-column:1/-1}
      .qmes-downtime-edit-form input,.qmes-downtime-edit-form textarea{box-sizing:border-box;width:100%;border:1px solid #35516b;border-radius:8px;background:#142d49;color:#f1f5f9;font-size:13px;outline:none}.qmes-downtime-edit-form input{height:42px;padding:0 11px}.qmes-downtime-edit-form textarea{min-height:90px;padding:10px 11px;resize:vertical}.qmes-downtime-edit-form input:focus,.qmes-downtime-edit-form textarea:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.12)}
      .qmes-downtime-edit-foot{display:flex;justify-content:flex-end;gap:8px;padding:13px 16px;border-top:1px solid #28445e}.qmes-downtime-edit-foot button{min-width:78px;height:38px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:900;cursor:pointer}.qmes-downtime-edit-foot .qmes-downtime-edit-save{border-color:#0ea5e9;background:#087ca8;color:#fff}.qmes-downtime-edit-foot button:disabled{opacity:.55;cursor:wait}
      @media(max-width:1100px){.qpp-actionbar.qmes-downtime-history-enabled{grid-template-columns:repeat(3,1fr)!important}.qmes-downtime-history-summary{grid-template-columns:1fr}.qmes-downtime-history-dialog{width:98vw}.qmes-downtime-history-table{min-width:1120px}.qmes-downtime-edit-summary{grid-template-columns:repeat(2,1fr)}.qmes-downtime-edit-form{grid-template-columns:1fr 1fr}.qmes-downtime-edit-form label:first-child{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function ensureButton(){
    installStyle();
    const root=document.querySelector(".qmes-prod-process");
    if(!root) return false;
    const bar=root.querySelector(".qpp-actionbar");
    if(!bar) return false;
    bar.classList.add("qmes-downtime-history-enabled");
    if(bar.querySelector(".qmes-downtime-history-btn")) return true;
    const register=Array.from(bar.querySelectorAll("button")).find(button=>clean(button.textContent)==="비가동 등록");
    if(!register) return false;
    const button=document.createElement("button");
    button.type="button";
    button.className="qpp-btn qmes-downtime-history-btn";
    button.textContent="비가동 현황";
    button.title="전체 LOT 비가동 이력 조회";
    register.insertAdjacentElement("afterend",button);
    return true;
  }

  async function fetchRows(){
    const response=await fetch("/api/qmes-sync/workorder",{credentials:"same-origin"});
    const payload=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||!payload.success) throw new Error(payload.message||`비가동 현황 조회 실패 (${response.status})`);
    return Array.isArray(payload.data)?payload.data:[];
  }

  async function saveProcess(key,payload){
    if(typeof window.qmesSyncUpsert==="function"){
      return await window.qmesSyncUpsert("workorder",key,payload);
    }
    const response=await fetch("/api/qmes-sync/workorder",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,payload})
    });
    const data=await response.json().catch(()=>({success:false}));
    if(!response.ok||!data.success) throw new Error(data.message||`비가동 수정 저장 실패 (${response.status})`);
    return data.data;
  }

  function buildHistory(rows){
    const result=[];
    rows.filter(row=>clean(row?.record_key).startsWith("process:")).forEach(row=>{
      const payload=parsePayload(row);
      const lot=clean(payload.lot)||clean(row.record_key).slice("process:".length);
      const steps=Array.isArray(payload.steps)?payload.steps:[];
      const downtime=Array.isArray(payload.downtime)?payload.downtime:[];
      downtime.forEach((item,index)=>{
        const stepNo=Number(item?.stepNo)||0;
        const step=steps.find(entry=>Number(entry?.no)===stepNo)||steps[stepNo-1]||{};
        const id=`${clean(row.record_key)}|${index}|${clean(item?.at)}`;
        result.push({
          id,recordKey:clean(row.record_key),downtimeIndex:index,lot,at:clean(item?.at),stepNo,
          stepName:clean(step?.name)||`공정 ${stepNo||"-"}`,
          equipment:clean(step?.equipment)||clean(payload?.equipment)||"-",
          reason:clean(item?.reason)||"-",minutes:Math.max(0,Number(item?.minutes)||0),
          workers:Array.isArray(item?.workers)?item.workers.map(clean).filter(Boolean).join(", "):clean(item?.workers)||"-",
          note:clean(item?.note)||"-"
        });
      });
    });
    return result.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  }

  function closeHistory(){document.getElementById("qmes-production-downtime-history-modal")?.remove();}
  function closeEdit(){document.getElementById("qmes-production-downtime-edit-modal")?.remove();editTarget=null;}

  function renderHistory(history){
    closeHistory();
    historyById.clear();
    history.forEach(item=>historyById.set(item.id,item));
    const selected=currentLot();
    const totalMinutes=history.reduce((sum,row)=>sum+row.minutes,0);
    const lotCount=new Set(history.map(row=>row.lot).filter(Boolean)).size;
    const overlay=document.createElement("div");
    overlay.id="qmes-production-downtime-history-modal";
    overlay.className="qmes-downtime-history-modal";
    const bodyRows=history.length?history.map(row=>`<tr class="${row.lot===selected?"current-lot":""}"><td>${esc(formatDateTime(row.at))}</td><td>${esc(row.lot)}</td><td>${esc(row.stepName)}</td><td>${esc(row.equipment)}</td><td class="qmes-downtime-history-reason">${esc(row.reason)}</td><td>${esc(durationLabel(row.minutes))}</td><td>${esc(row.workers||"-")}</td><td class="qmes-downtime-history-note">${esc(row.note||"-")}</td><td><button type="button" class="qmes-downtime-edit-btn" data-edit-id="${esc(row.id)}">수정</button></td></tr>`).join(""):`<tr><td colspan="9" class="qmes-downtime-history-empty">등록된 비가동 이력이 없습니다.</td></tr>`;
    overlay.innerHTML=`<div class="qmes-downtime-history-dialog"><div class="qmes-downtime-history-head"><div><b>비가동 현황</b><p>전체 생산 LOT의 비가동 등록 이력을 최신순으로 조회합니다.${selected?` · 현재 LOT ${esc(selected)}`:""}</p></div><button type="button" class="qmes-downtime-history-close">닫기</button></div><div class="qmes-downtime-history-body"><div class="qmes-downtime-history-summary"><div><small>총 비가동 건수</small><strong>${history.length}건</strong></div><div><small>총 비가동 시간</small><strong>${esc(durationLabel(totalMinutes))}</strong></div><div><small>비가동 발생 LOT</small><strong>${lotCount} LOT</strong></div></div><div style="overflow:auto"><table class="qmes-downtime-history-table"><colgroup><col style="width:140px"><col style="width:100px"><col style="width:150px"><col style="width:140px"><col style="width:155px"><col style="width:130px"><col style="width:140px"><col><col style="width:70px"></colgroup><thead><tr><th>등록일시</th><th>LOT</th><th>공정</th><th>설비</th><th>사유</th><th>비가동 시간</th><th>작업자</th><th>비고</th><th>관리</th></tr></thead><tbody>${bodyRows}</tbody></table></div></div></div>`;
    document.body.appendChild(overlay);
  }

  function openEdit(item){
    closeEdit();
    editTarget=item;
    const hours=Math.floor((Number(item.minutes)||0)/60);
    const minutes=Math.round(Number(item.minutes)||0)%60;
    const overlay=document.createElement("div");
    overlay.id="qmes-production-downtime-edit-modal";
    overlay.className="qmes-downtime-edit-modal";
    overlay.innerHTML=`<div class="qmes-downtime-edit-dialog"><div class="qmes-downtime-history-head"><div><b>비가동 수정</b><p>사유·시간·비고를 수정한 뒤 수정 저장을 누르세요.</p></div><button type="button" class="qmes-downtime-edit-close">닫기</button></div><div class="qmes-downtime-edit-body"><div class="qmes-downtime-edit-summary"><div><small>LOT No.</small><strong>${esc(item.lot)}</strong></div><div><small>공정</small><strong>${esc(item.stepName)}</strong></div><div><small>설비</small><strong>${esc(item.equipment)}</strong></div><div><small>등록일시</small><strong>${esc(formatDateTime(item.at))}</strong></div></div><div class="qmes-downtime-edit-form"><label>비가동 사유 *<input id="qmes-downtime-edit-reason" value="${esc(item.reason==="-"?"":item.reason)}"></label><label>시간<input id="qmes-downtime-edit-hours" type="number" min="0" step="1" value="${hours}"></label><label>분 (0~59)<input id="qmes-downtime-edit-minutes" type="number" min="0" max="59" step="1" value="${minutes}"></label><label class="full">비고<textarea id="qmes-downtime-edit-note">${esc(item.note==="-"?"":item.note)}</textarea></label></div></div><div class="qmes-downtime-edit-foot"><button type="button" class="qmes-downtime-edit-cancel">취소</button><button type="button" class="qmes-downtime-edit-save">수정 저장</button></div></div>`;
    document.body.appendChild(overlay);
    setTimeout(()=>document.getElementById("qmes-downtime-edit-reason")?.focus(),0);
  }

  function locateDowntime(downtime,target){
    const direct=Number(target.downtimeIndex);
    if(Number.isInteger(direct)&&direct>=0&&direct<downtime.length) return direct;
    let index=downtime.findIndex(item=>clean(item?.at)===clean(target.at)&&Number(item?.stepNo||0)===Number(target.stepNo||0)&&clean(item?.reason)===clean(target.reason)&&Number(item?.minutes||0)===Number(target.minutes||0));
    if(index>=0) return index;
    return downtime.findIndex(item=>clean(item?.at)===clean(target.at)&&Number(item?.stepNo||0)===Number(target.stepNo||0));
  }

  async function saveEdit(button){
    const target=editTarget;
    if(!target) return;
    const reason=clean(document.getElementById("qmes-downtime-edit-reason")?.value);
    const hours=Number(document.getElementById("qmes-downtime-edit-hours")?.value||0);
    const minutes=Number(document.getElementById("qmes-downtime-edit-minutes")?.value||0);
    const note=clean(document.getElementById("qmes-downtime-edit-note")?.value);
    if(!reason){window.alert("비가동 사유를 입력하세요.");return;}
    if(!Number.isInteger(hours)||hours<0){window.alert("시간은 0 이상의 정수로 입력하세요.");return;}
    if(!Number.isInteger(minutes)||minutes<0||minutes>59){window.alert("분은 0~59 사이 정수로 입력하세요.");return;}
    button.disabled=true;
    button.textContent="저장중";
    try{
      const rows=await fetchRows();
      const row=rows.find(entry=>clean(entry?.record_key)===target.recordKey);
      if(!row) throw new Error(`${target.lot} 생산공정 기록을 찾지 못했습니다.`);
      const payload=parsePayload(row);
      const downtime=Array.isArray(payload.downtime)?payload.downtime.slice():[];
      const index=locateDowntime(downtime,target);
      if(index<0) throw new Error("수정할 비가동 기록을 찾지 못했습니다. 현황을 닫았다가 다시 열어 주세요.");
      const now=new Date().toISOString();
      downtime[index]={...downtime[index],reason,minutes:hours*60+minutes,note,editedAt:now,editedBy:currentUserName()};
      const nextPayload={...payload,downtime,updatedAt:now,updatedBy:currentUserName()};
      await saveProcess(target.recordKey,nextPayload);

      try{
        if(window.DB){
          DB.productionProcesses=DB.productionProcesses||{};
          DB.productionProcesses[target.lot]=nextPayload;
          if(typeof window.dbSave==="function") window.dbSave();
          else if(typeof dbSave==="function") dbSave();
        }
      }catch(_error){}

      closeEdit();
      renderHistory(buildHistory(await fetchRows()));
      try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot:target.lot,type:"downtime-edit"}}));}catch(_error){}
      try{window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{lot:target.lot,type:"downtime-edit"}}));}catch(_error){}
    }catch(error){
      console.error("[QMES 생산공정] 비가동 수정 실패",error);
      window.alert(error?.message||"비가동 수정 저장에 실패했습니다.");
      button.disabled=false;
      button.textContent="수정 저장";
    }
  }

  async function openHistory(button){
    const original=clean(button?.textContent)||"비가동 현황";
    if(button){button.disabled=true;button.textContent="조회중";}
    try{renderHistory(buildHistory(await fetchRows()));}
    catch(error){console.error("[QMES 생산공정] 비가동 현황 조회 실패",error);window.alert(error?.message||"비가동 현황을 불러오지 못했습니다.");}
    finally{if(button){button.disabled=false;button.textContent=original;}}
  }

  /* Capture phase is deliberate: it wins over old/direct handlers and remains valid
     even when the history table is recreated. */
  document.addEventListener("click",event=>{
    const editButton=event.target.closest?.(".qmes-downtime-edit-btn");
    if(editButton){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const item=historyById.get(clean(editButton.dataset.editId));
      if(item) openEdit(item);
      else window.alert("수정할 비가동 기록을 찾지 못했습니다. 비가동 현황을 다시 열어 주세요.");
      return;
    }
    const saveButton=event.target.closest?.(".qmes-downtime-edit-save");
    if(saveButton){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();saveEdit(saveButton);return;}
    if(event.target.closest?.(".qmes-downtime-edit-close")||event.target.closest?.(".qmes-downtime-edit-cancel")){
      event.preventDefault();event.stopPropagation();closeEdit();return;
    }
    const historyClose=event.target.closest?.(".qmes-downtime-history-close");
    if(historyClose){event.preventDefault();event.stopPropagation();closeHistory();return;}
    const historyButton=event.target.closest?.(".qmes-downtime-history-btn");
    if(historyButton){event.preventDefault();event.stopPropagation();openHistory(historyButton);return;}
    if(event.target===document.getElementById("qmes-production-downtime-edit-modal")){closeEdit();return;}
    if(event.target===document.getElementById("qmes-production-downtime-history-modal")){closeHistory();return;}
    if(event.target.closest?.(".qmes-prod-process")||clean(event.target.textContent)==="생산공정 관리") setTimeout(ensureButton,50);
  },true);

  window.addEventListener("focus",()=>setTimeout(ensureButton,50));
  window.addEventListener("qmes:production-process-ready",()=>setTimeout(ensureButton,30));
  window.addEventListener("qmes:production-process-updated",()=>setTimeout(ensureButton,30));

  const start=()=>{
    ensureButton();
    let tries=0;
    const timer=setInterval(()=>{tries+=1;if(ensureButton()||tries>=30)clearInterval(timer);},200);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
