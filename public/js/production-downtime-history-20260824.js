/* QMES production downtime history view - 2026-08-24 v2
 * Adds downtime history and safe edit support beside downtime registration.
 * Reads/writes process:<LOT> shared records only when the user opens or edits history.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_DOWNTIME_HISTORY_20260824_V2__) return;
  window.__QMES_PRODUCTION_DOWNTIME_HISTORY_20260824_V2__=true;

  const clean=value=>String(value==null?"":value).trim();
  const esc=value=>clean(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  let historyById=new Map();
  let editTarget=null;

  function durationLabel(value){
    const minutes=Math.max(0,Number(value)||0);
    const whole=Math.round(minutes);
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
    const header=Array.from(document.querySelectorAll(".qmes-prod-process .qpp-card-head span")).map(node=>clean(node.textContent)).find(text=>text.includes("LOT"));
    const match=header?.match(/LOT\s+([^\s]+)/i);
    return match?.[1]||"";
  }

  function currentUserName(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return clean(user?.name||user?.uid)||"사용자";
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
    if(document.getElementById("qmes-production-downtime-history-style")) return;
    const style=document.createElement("style");
    style.id="qmes-production-downtime-history-style";
    style.textContent=`
      .qpp-actionbar.qmes-downtime-history-enabled{grid-template-columns:repeat(6,minmax(110px,1fr))!important}
      .qmes-downtime-history-btn{border-color:#8a6a28!important;background:#2a281d!important;color:#fde68a!important}
      .qmes-downtime-history-modal,.qmes-downtime-edit-modal{position:fixed;inset:0;z-index:16050;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,18,.82)}
      .qmes-downtime-edit-modal{z-index:16070;background:rgba(2,8,18,.88)}
      .qmes-downtime-history-dialog{width:min(1380px,97vw);max-height:90vh;overflow:hidden;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.55);color:#e2e8f0}
      .qmes-downtime-edit-dialog{width:min(780px,96vw);max-height:90vh;overflow:auto;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.6);color:#e2e8f0}
      .qmes-downtime-history-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #28445e}
      .qmes-downtime-history-head b{font-size:17px}.qmes-downtime-history-head p{margin:4px 0 0;color:#8da4b9;font-size:11px}
      .qmes-downtime-history-close,.qmes-downtime-edit-close{min-width:58px;height:36px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:800;cursor:pointer}
      .qmes-downtime-history-body{padding:14px 16px 16px;overflow:auto;max-height:calc(90vh - 68px)}
      .qmes-downtime-history-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
      .qmes-downtime-history-summary>div{padding:12px 14px;border:1px solid #294761;border-radius:9px;background:#122a44}
      .qmes-downtime-history-summary small{display:block;color:#7895af;font-size:10px;margin-bottom:5px}.qmes-downtime-history-summary strong{font-size:17px;color:#f8fafc}
      .qmes-downtime-history-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
      .qmes-downtime-history-table th{position:sticky;top:0;z-index:1;padding:10px 7px;border:1px solid #2a445f;background:#10263e;color:#8eb0cb;text-align:center;white-space:nowrap}
      .qmes-downtime-history-table td{padding:10px 7px;border:1px solid #1e3852;color:#dbe7f2;text-align:center;vertical-align:middle;word-break:keep-all}
      .qmes-downtime-history-table tbody tr.current-lot{background:#122f47}.qmes-downtime-history-table tbody tr:hover{background:#163550}
      .qmes-downtime-history-empty{padding:30px 10px;text-align:center;color:#94a3b8}
      .qmes-downtime-history-note{text-align:left!important;white-space:normal}.qmes-downtime-history-reason{text-align:left!important;font-weight:800;color:#fde68a!important}
      .qmes-downtime-edit-btn{min-width:48px;height:30px;padding:0 9px;border:1px solid #0ea5e9;border-radius:6px;background:#075985;color:#e0f2fe;font-size:11px;font-weight:900;cursor:pointer}
      .qmes-downtime-edit-body{padding:15px 16px}.qmes-downtime-edit-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin-bottom:14px;border:1px solid #294761;border-radius:9px;overflow:hidden;background:#294761}
      .qmes-downtime-edit-summary>div{min-width:0;padding:11px 12px;background:#122a44}.qmes-downtime-edit-summary small{display:block;margin-bottom:5px;color:#7895af;font-size:10px}.qmes-downtime-edit-summary strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1f5f9;font-size:12px}
      .qmes-downtime-edit-form{display:grid;grid-template-columns:1fr 150px 150px;gap:12px}.qmes-downtime-edit-form label{display:flex;min-width:0;flex-direction:column;gap:7px;color:#a9bfd2;font-size:12px;font-weight:800}.qmes-downtime-edit-form label.full{grid-column:1/-1}
      .qmes-downtime-edit-form input,.qmes-downtime-edit-form textarea{width:100%;border:1px solid #35516b;border-radius:8px;background:#142d49;color:#f1f5f9;font-size:13px;outline:none}.qmes-downtime-edit-form input{height:42px;padding:0 11px}.qmes-downtime-edit-form textarea{min-height:90px;padding:10px 11px;resize:vertical}.qmes-downtime-edit-form input:focus,.qmes-downtime-edit-form textarea:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.12)}
      .qmes-downtime-edit-foot{display:flex;justify-content:flex-end;gap:8px;padding:13px 16px;border-top:1px solid #28445e}.qmes-downtime-edit-foot button{min-width:70px;height:38px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:900;cursor:pointer}.qmes-downtime-edit-foot .save{border-color:#0ea5e9;background:#087ca8;color:#fff}.qmes-downtime-edit-foot button:disabled{opacity:.55;cursor:wait}
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
    const response=await fetch("/api/qmes-sync/workorder",{
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({key,payload})
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
        result.push({
          id:`${clean(row.record_key)}|${clean(item?.at)||index}|${index}`,
          recordKey:clean(row.record_key),
          downtimeIndex:index,
          lot,
          at:clean(item?.at),
          stepNo,
          stepName:clean(step?.name)||`공정 ${stepNo||"-"}`,
          equipment:clean(step?.equipment)||clean(payload?.equipment)||"-",
          reason:clean(item?.reason)||"-",
          minutes:Math.max(0,Number(item?.minutes)||0),
          workers:Array.isArray(item?.workers)?item.workers.map(clean).filter(Boolean).join(", "):clean(item?.workers)||"-",
          note:clean(item?.note)||"-",
        });
      });
    });
    return result.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  }

  function closeModal(){document.getElementById("qmes-production-downtime-history-modal")?.remove();}
  function closeEditModal(){document.getElementById("qmes-production-downtime-edit-modal")?.remove();editTarget=null;}

  function renderModal(history){
    closeModal();
    historyById=new Map(history.map(row=>[row.id,row]));
    const selected=currentLot();
    const totalMinutes=history.reduce((sum,row)=>sum+row.minutes,0);
    const lotCount=new Set(history.map(row=>row.lot).filter(Boolean)).size;
    const overlay=document.createElement("div");
    overlay.id="qmes-production-downtime-history-modal";
    overlay.className="qmes-downtime-history-modal";
    const bodyRows=history.length?history.map(row=>`<tr class="${row.lot===selected?"current-lot":""}"><td>${esc(formatDateTime(row.at))}</td><td>${esc(row.lot)}</td><td>${esc(row.stepName)}</td><td>${esc(row.equipment)}</td><td class="qmes-downtime-history-reason">${esc(row.reason)}</td><td>${esc(durationLabel(row.minutes))}</td><td>${esc(row.workers||"-")}</td><td class="qmes-downtime-history-note">${esc(row.note||"-")}</td><td><button type="button" class="qmes-downtime-edit-btn" data-edit-id="${esc(row.id)}">수정</button></td></tr>`).join(""):`<tr><td colspan="9" class="qmes-downtime-history-empty">등록된 비가동 이력이 없습니다.</td></tr>`;
    overlay.innerHTML=`<div class="qmes-downtime-history-dialog"><div class="qmes-downtime-history-head"><div><b>비가동 현황</b><p>전체 생산 LOT의 비가동 등록 이력을 최신순으로 조회합니다.${selected?` · 현재 LOT ${esc(selected)}`:""}</p></div><button type="button" class="qmes-downtime-history-close">닫기</button></div><div class="qmes-downtime-history-body"><div class="qmes-downtime-history-summary"><div><small>총 비가동 건수</small><strong>${history.length}건</strong></div><div><small>총 비가동 시간</small><strong>${esc(durationLabel(totalMinutes))}</strong></div><div><small>비가동 발생 LOT</small><strong>${lotCount} LOT</strong></div></div><div style="overflow:auto"><table class="qmes-downtime-history-table"><colgroup><col style="width:140px"><col style="width:100px"><col style="width:150px"><col style="width:140px"><col style="width:155px"><col style="width:130px"><col style="width:140px"><col><col style="width:70px"></colgroup><thead><tr><th>등록일시</th><th>LOT</th><th>공정</th><th>설비</th><th>사유</th><th>비가동 시간</th><th>작업자</th><th>비고</th><th>관리</th></tr></thead><tbody>${bodyRows}</tbody></table></div></div></div>`;
    overlay.addEventListener("click",event=>{if(event.target===overlay||event.target.closest(".qmes-downtime-history-close"))closeModal();});
    document.body.appendChild(overlay);
  }

  function openEditModal(item){
    editTarget=item;
    closeEditModal();
    editTarget=item;
    const hours=Math.floor((Number(item.minutes)||0)/60);
    const minutes=Math.round(Number(item.minutes)||0)%60;
    const overlay=document.createElement("div");
    overlay.id="qmes-production-downtime-edit-modal";
    overlay.className="qmes-downtime-edit-modal";
    overlay.innerHTML=`<div class="qmes-downtime-edit-dialog"><div class="qmes-downtime-history-head"><div><b>비가동 수정</b><p>등록된 비가동 사유·시간·비고를 수정합니다.</p></div><button type="button" class="qmes-downtime-edit-close">닫기</button></div><div class="qmes-downtime-edit-body"><div class="qmes-downtime-edit-summary"><div><small>LOT No.</small><strong>${esc(item.lot)}</strong></div><div><small>공정</small><strong>${esc(item.stepName)}</strong></div><div><small>설비</small><strong>${esc(item.equipment)}</strong></div><div><small>등록일시</small><strong>${esc(formatDateTime(item.at))}</strong></div></div><div class="qmes-downtime-edit-form"><label>비가동 사유 *<input id="qmes-downtime-edit-reason" value="${esc(item.reason==="-"?"":item.reason)}" placeholder="예: 설비점검, 원료대기"></label><label>시간<input id="qmes-downtime-edit-hours" type="number" min="0" step="1" value="${hours}"></label><label>분 (0~59)<input id="qmes-downtime-edit-minutes" type="number" min="0" max="59" step="1" value="${minutes}"></label><label class="full">비고<textarea id="qmes-downtime-edit-note" placeholder="조치 내용이나 참고사항">${esc(item.note==="-"?"":item.note)}</textarea></label></div></div><div class="qmes-downtime-edit-foot"><button type="button" class="qmes-downtime-edit-cancel">취소</button><button type="button" class="save qmes-downtime-edit-save">수정 저장</button></div></div>`;
    overlay.addEventListener("click",event=>{if(event.target===overlay||event.target.closest(".qmes-downtime-edit-close")||event.target.closest(".qmes-downtime-edit-cancel"))closeEditModal();});
    document.body.appendChild(overlay);
    setTimeout(()=>document.getElementById("qmes-downtime-edit-reason")?.focus(),0);
  }

  async function saveEdit(button){
    const target=editTarget;
    if(!target) return;
    const reason=clean(document.getElementById("qmes-downtime-edit-reason")?.value);
    const hours=Number(document.getElementById("qmes-downtime-edit-hours")?.value||0);
    const minutes=Number(document.getElementById("qmes-downtime-edit-minutes")?.value||0);
    const note=clean(document.getElementById("qmes-downtime-edit-note")?.value);
    if(!reason){window.alert("비가동 사유를 입력하세요.");return;}
    if(!Number.isFinite(hours)||hours<0||!Number.isInteger(hours)){window.alert("시간은 0 이상의 정수로 입력하세요.");return;}
    if(!Number.isFinite(minutes)||minutes<0||minutes>59||!Number.isInteger(minutes)){window.alert("분은 0~59 사이 정수로 입력하세요.");return;}
    const totalMinutes=hours*60+minutes;
    button.disabled=true;
    button.textContent="저장중";
    try{
      /* Re-fetch immediately before write so another PC's latest process changes are preserved. */
      const rows=await fetchRows();
      const row=rows.find(entry=>clean(entry?.record_key)===target.recordKey);
      if(!row) throw new Error(`${target.lot} 생산공정 기록을 찾지 못했습니다.`);
      const payload=parsePayload(row);
      const downtime=Array.isArray(payload.downtime)?payload.downtime.slice():[];
      let index=target.downtimeIndex;
      const sameAt=item=>clean(item?.at)===clean(target.at)&&Number(item?.stepNo||0)===Number(target.stepNo||0);
      if(!downtime[index]||!sameAt(downtime[index])) index=downtime.findIndex(sameAt);
      if(index<0) throw new Error("수정할 비가동 기록이 변경되었습니다. 현황을 다시 열어 확인하세요.");
      const now=new Date().toISOString();
      downtime[index]={
        ...downtime[index],
        reason,
        minutes:totalMinutes,
        note,
        editedAt:now,
        editedBy:currentUserName()
      };
      const nextPayload={...payload,downtime,updatedAt:now,updatedBy:currentUserName()};
      await saveProcess(target.recordKey,nextPayload);
      closeEditModal();
      const refreshed=await fetchRows();
      renderModal(buildHistory(refreshed));
      try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot:target.lot,type:"downtime-edit"}}));}catch(_error){}
      try{window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{type:"downtime-edit",lot:target.lot}}));}catch(_error){}
    }catch(error){
      console.error("[QMES 생산공정] 비가동 수정 실패",error);
      window.alert(error?.message||"비가동 수정 저장에 실패했습니다.");
      button.disabled=false;
      button.textContent="수정 저장";
    }
  }

  async function openHistory(button){
    const original=button.textContent;
    button.disabled=true;
    button.textContent="조회중";
    try{
      const rows=await fetchRows();
      renderModal(buildHistory(rows));
    }catch(error){
      console.error("[QMES 생산공정] 비가동 현황 조회 실패",error);
      window.alert(error?.message||"비가동 현황을 불러오지 못했습니다.");
    }finally{
      button.disabled=false;
      button.textContent=original;
    }
  }

  document.addEventListener("click",event=>{
    const editSave=event.target.closest?.(".qmes-downtime-edit-save");
    if(editSave){event.preventDefault();event.stopPropagation();saveEdit(editSave);return;}
    const editButton=event.target.closest?.(".qmes-downtime-edit-btn");
    if(editButton){
      event.preventDefault();event.stopPropagation();
      const item=historyById.get(clean(editButton.dataset.editId));
      if(item) openEditModal(item);
      return;
    }
    const historyButton=event.target.closest?.(".qmes-downtime-history-btn");
    if(historyButton){event.preventDefault();event.stopPropagation();openHistory(historyButton);return;}
    if(event.target.closest?.(".qmes-prod-process")||clean(event.target.textContent)==="생산공정 관리") setTimeout(ensureButton,80);
  },true);
  window.addEventListener("focus",()=>setTimeout(ensureButton,80));
  window.addEventListener("qmes:production-process-ready",()=>setTimeout(ensureButton,50));
  window.addEventListener("qmes:production-process-updated",()=>setTimeout(ensureButton,50));

  const start=()=>{
    ensureButton();
    let tries=0;
    const timer=setInterval(()=>{
      tries+=1;
      if(ensureButton()||tries>=20) clearInterval(timer);
    },500);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
