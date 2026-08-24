/* QMES production downtime history view - 2026-08-24
 * Adds a read-only downtime history button beside downtime registration.
 * Reads process:<LOT> shared records only when the user opens the history view.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_DOWNTIME_HISTORY_20260824__) return;
  window.__QMES_PRODUCTION_DOWNTIME_HISTORY_20260824__=true;

  const clean=value=>String(value==null?"":value).trim();
  const esc=value=>clean(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));

  function durationLabel(value){
    const minutes=Math.max(0,Number(value)||0);
    const whole=Math.round(minutes);
    if(whole<60) return `${whole}분`;
    const hours=Math.floor(whole/60);
    const rest=whole%60;
    return rest?`${hours}시간 ${rest}분 (${whole}분)`: `${hours}시간 (${whole}분)`;
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

  function installStyle(){
    if(document.getElementById("qmes-production-downtime-history-style")) return;
    const style=document.createElement("style");
    style.id="qmes-production-downtime-history-style";
    style.textContent=`
      .qpp-actionbar.qmes-downtime-history-enabled{grid-template-columns:repeat(6,minmax(110px,1fr))!important}
      .qmes-downtime-history-btn{border-color:#8a6a28!important;background:#2a281d!important;color:#fde68a!important}
      .qmes-downtime-history-modal{position:fixed;inset:0;z-index:16050;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,18,.82)}
      .qmes-downtime-history-dialog{width:min(1320px,97vw);max-height:90vh;overflow:hidden;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.55);color:#e2e8f0}
      .qmes-downtime-history-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #28445e}
      .qmes-downtime-history-head b{font-size:17px}.qmes-downtime-history-head p{margin:4px 0 0;color:#8da4b9;font-size:11px}
      .qmes-downtime-history-close{min-width:58px;height:36px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:800;cursor:pointer}
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
      @media(max-width:1100px){.qpp-actionbar.qmes-downtime-history-enabled{grid-template-columns:repeat(3,1fr)!important}.qmes-downtime-history-summary{grid-template-columns:1fr}.qmes-downtime-history-dialog{width:98vw}.qmes-downtime-history-table{min-width:1050px}}
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

  function buildHistory(rows){
    const result=[];
    rows.filter(row=>clean(row?.record_key).startsWith("process:")).forEach(row=>{
      const payload=row?.payload&&typeof row.payload==="object"?row.payload:{};
      const lot=clean(payload.lot)||clean(row.record_key).slice("process:".length);
      const steps=Array.isArray(payload.steps)?payload.steps:[];
      const downtime=Array.isArray(payload.downtime)?payload.downtime:[];
      downtime.forEach((item,index)=>{
        const stepNo=Number(item?.stepNo)||0;
        const step=steps.find(entry=>Number(entry?.no)===stepNo)||steps[stepNo-1]||{};
        result.push({
          id:`${lot}:${clean(item?.at)||index}:${index}`,
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

  function renderModal(history){
    closeModal();
    const selected=currentLot();
    const totalMinutes=history.reduce((sum,row)=>sum+row.minutes,0);
    const lotCount=new Set(history.map(row=>row.lot).filter(Boolean)).size;
    const overlay=document.createElement("div");
    overlay.id="qmes-production-downtime-history-modal";
    overlay.className="qmes-downtime-history-modal";
    const bodyRows=history.length?history.map(row=>`<tr class="${row.lot===selected?"current-lot":""}"><td>${esc(formatDateTime(row.at))}</td><td>${esc(row.lot)}</td><td>${esc(row.stepName)}</td><td>${esc(row.equipment)}</td><td class="qmes-downtime-history-reason">${esc(row.reason)}</td><td>${esc(durationLabel(row.minutes))}</td><td>${esc(row.workers||"-")}</td><td class="qmes-downtime-history-note">${esc(row.note||"-")}</td></tr>`).join(""):`<tr><td colspan="8" class="qmes-downtime-history-empty">등록된 비가동 이력이 없습니다.</td></tr>`;
    overlay.innerHTML=`<div class="qmes-downtime-history-dialog"><div class="qmes-downtime-history-head"><div><b>비가동 현황</b><p>전체 생산 LOT의 비가동 등록 이력을 최신순으로 조회합니다.${selected?` · 현재 LOT ${esc(selected)}`:""}</p></div><button type="button" class="qmes-downtime-history-close">닫기</button></div><div class="qmes-downtime-history-body"><div class="qmes-downtime-history-summary"><div><small>총 비가동 건수</small><strong>${history.length}건</strong></div><div><small>총 비가동 시간</small><strong>${esc(durationLabel(totalMinutes))}</strong></div><div><small>비가동 발생 LOT</small><strong>${lotCount} LOT</strong></div></div><div style="overflow:auto"><table class="qmes-downtime-history-table"><colgroup><col style="width:140px"><col style="width:100px"><col style="width:155px"><col style="width:145px"><col style="width:165px"><col style="width:135px"><col style="width:145px"><col></colgroup><thead><tr><th>등록일시</th><th>LOT</th><th>공정</th><th>설비</th><th>사유</th><th>비가동 시간</th><th>작업자</th><th>비고</th></tr></thead><tbody>${bodyRows}</tbody></table></div></div></div>`;
    overlay.addEventListener("click",event=>{if(event.target===overlay||event.target.closest(".qmes-downtime-history-close"))closeModal();});
    document.body.appendChild(overlay);
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
