/* NAMO QMES - Downtime audit / current LOT / save normalization - 2026-08-27
 * ADD-ONLY patch. Existing production and downtime source files are not replaced.
 * - Prevents new 0-minute downtime records.
 * - Saves the actual MES process number (30/40/50/60/70/80) for new downtime entries.
 * - Opens downtime history on the current LOT by default, with an All LOT toggle.
 * - Excludes 0-minute rows from operational counts and collapses exact duplicates in the view.
 * - Reuses the existing .qmes-downtime-edit-btn recovery editor for row edits.
 */
(function(){
  "use strict";
  if(window.__QMES_DOWNTIME_AUDIT_FIX_20260827_V1__) return;
  window.__QMES_DOWNTIME_AUDIT_FIX_20260827_V1__=true;

  const API="/api/qmes-sync/workorder";
  const MODAL_ID="qmes-downtime-audit-modal-20260827-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const nativeFetch=window.fetch.bind(window);

  function currentLot(){
    const direct=document.querySelector(".qmes-prod-process .qpp-info > div:nth-child(5) strong");
    const value=clean(direct?.textContent);
    if(value&&value!=="-") return value;
    return clean(document.querySelector(".qmes-prod-process .qpp-toolbar .qpp-select")?.value);
  }

  function activeStepNo(){
    const direct=clean(document.querySelector(".qmes-prod-process .qpp-table tbody tr.active td:first-child")?.textContent);
    const no=Number(direct);
    return [30,40,50,60,70,80].includes(no)?no:0;
  }

  function parsePayload(row){
    const value=row?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){
      try{return JSON.parse(value);}catch(_error){return {};}
    }
    return {};
  }

  /* Normalize future downtime saves without changing the original React source. */
  window.fetch=async function(input,init){
    try{
      const url=typeof input==="string"?input:String(input?.url||"");
      const method=String(init?.method||input?.method||"GET").toUpperCase();
      if(method==="POST"&&url.includes(API)&&typeof init?.body==="string"){
        const body=JSON.parse(init.body);
        const payload=body?.payload;
        if(clean(body?.key).startsWith("process:")&&payload&&Array.isArray(payload.downtime)&&payload.downtime.length){
          const downtime=payload.downtime.slice();
          const lastIndex=downtime.length-1;
          const last={...(downtime[lastIndex]||{})};
          const actualNo=activeStepNo();
          if(actualNo&&Number(last.stepNo)!==actualNo){
            last.stepNo=actualNo;
            last.stepNoMes=actualNo;
          }
          downtime[lastIndex]=last;
          body.payload={...payload,downtime};
          init={...init,body:JSON.stringify(body)};
        }
      }
    }catch(_error){}
    return nativeFetch(input,init);
  };

  /* Block 0-minute registration before the original React click handler runs. */
  window.addEventListener("click",event=>{
    const button=event.target instanceof Element?event.target.closest("button"):null;
    if(!button||clean(button.textContent)!=="비가동 저장") return;
    const dialog=button.closest(".qpp-action-dialog,.qpp-dialog");
    if(!dialog) return;
    const numberInputs=Array.from(dialog.querySelectorAll('input[type="number"]'));
    const minutes=Number(numberInputs[numberInputs.length-1]?.value||0);
    if(Number.isFinite(minutes)&&minutes>0) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.alert("비가동 시간은 1분 이상 입력하세요.");
  },true);

  function formatDateTime(value){
    if(!value) return "-";
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return clean(value)||"-";
    return date.toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
  }
  function durationLabel(value){
    const whole=Math.max(0,Math.round(Number(value)||0));
    if(whole<60) return `${whole}분`;
    const h=Math.floor(whole/60),m=whole%60;
    return m?`${h}시간 ${m}분 (${whole}분)`:`${h}시간 (${whole}분)`;
  }

  function resolveStep(steps,item){
    const mesNo=Number(item?.stepNoMes||item?.stepNo||0);
    let step=steps.find(entry=>Number(entry?.no)===mesNo);
    if(step) return step;
    const legacyIndex=Number(item?.stepNo||0)-1;
    if(legacyIndex>=0&&legacyIndex<steps.length) return steps[legacyIndex]||{};
    return {};
  }

  function buildHistory(rows){
    const raw=[];
    rows.filter(row=>clean(row?.record_key).startsWith("process:")).forEach(row=>{
      const payload=parsePayload(row);
      const lot=clean(payload.lot)||clean(row.record_key).slice("process:".length);
      const steps=Array.isArray(payload.steps)?payload.steps:[];
      const downtime=Array.isArray(payload.downtime)?payload.downtime:[];
      downtime.forEach((item,index)=>{
        const minutes=Math.max(0,Number(item?.minutes)||0);
        const step=resolveStep(steps,item);
        const stepNo=Number(step?.no)||Number(item?.stepNoMes)||Number(item?.stepNo)||0;
        raw.push({
          id:`${clean(row.record_key)}|${index}|${clean(item?.at)}`,
          recordKey:clean(row.record_key),downtimeIndex:index,lot,at:clean(item?.at),stepNo,
          stepName:clean(step?.name)||`공정 ${stepNo||"-"}`,
          equipment:clean(step?.equipment)||clean(payload?.equipment)||"-",
          reason:clean(item?.reason)||"-",minutes,
          workers:Array.isArray(item?.workers)?item.workers.map(clean).filter(Boolean).join(", "):clean(item?.workers)||"-",
          note:clean(item?.note)||"-"
        });
      });
    });

    const zeroCount=raw.filter(item=>item.minutes<=0).length;
    const operational=raw.filter(item=>item.minutes>0).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    const seen=new Set(),deduped=[];
    operational.forEach(item=>{
      const minuteKey=clean(item.at).slice(0,16);
      const key=[item.lot,item.stepNo,item.reason,item.minutes,item.workers,item.note,minuteKey].join("|");
      if(seen.has(key)) return;
      seen.add(key);deduped.push(item);
    });
    return {items:deduped,zeroCount,duplicateCount:operational.length-deduped.length};
  }

  async function fetchRows(){
    const response=await nativeFetch(API,{credentials:"same-origin"});
    const payload=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||payload.success===false) throw new Error(payload.message||`비가동 현황 조회 실패 (${response.status})`);
    return Array.isArray(payload.data)?payload.data:[];
  }

  function ensureStyle(){
    if(document.getElementById("qmes-downtime-audit-style-20260827-v1")) return;
    const style=document.createElement("style");
    style.id="qmes-downtime-audit-style-20260827-v1";
    style.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483500!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(2,8,18,.78)!important}
      #${MODAL_ID} .qda-dialog{width:min(1420px,97vw)!important;max-height:90vh!important;overflow:hidden!important;border:0!important;border-radius:12px!important;background:#0f2237!important;box-shadow:0 28px 90px rgba(0,0,0,.55)!important;color:#e2e8f0!important}
      #${MODAL_ID} .qda-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:14px 16px!important;border-bottom:1px solid #28445e!important}
      #${MODAL_ID} .qda-head b{font-size:17px!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important}#${MODAL_ID} .qda-head p{margin:4px 0 0!important;color:#8da4b9!important;font-size:11px!important}
      #${MODAL_ID} .qda-close{min-width:58px!important;height:36px!important;border:1px solid #334e68!important;border-radius:8px!important;background:#13283f!important;color:#dbeafe!important;font-weight:800!important;cursor:pointer!important}
      #${MODAL_ID} .qda-body{padding:14px 16px 16px!important;overflow:auto!important;max-height:calc(90vh - 68px)!important}
      #${MODAL_ID} .qda-tabs{display:flex!important;gap:7px!important;margin-bottom:11px!important}#${MODAL_ID} .qda-tab{height:34px!important;padding:0 13px!important;border:1px solid #35516b!important;border-radius:7px!important;background:#13283f!important;color:#cbd5e1!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important}#${MODAL_ID} .qda-tab.active{border-color:#0ea5e9!important;background:#087ca8!important;color:#fff!important}
      #${MODAL_ID} .qda-summary{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;margin-bottom:10px!important}#${MODAL_ID} .qda-summary>div{padding:12px 14px!important;border:1px solid #294761!important;border-radius:9px!important;background:#122a44!important}#${MODAL_ID} .qda-summary small{display:block!important;color:#7895af!important;font-size:10px!important;margin-bottom:5px!important}#${MODAL_ID} .qda-summary strong{font-size:17px!important;color:#f8fafc!important}
      #${MODAL_ID} .qda-note{margin:0 0 10px!important;color:#94a3b8!important;font-size:10px!important;font-weight:700!important}
      #${MODAL_ID} table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:12px!important}#${MODAL_ID} th{position:sticky!important;top:0!important;z-index:1!important;padding:10px 7px!important;border:1px solid #2a445f!important;background:#10263e!important;color:#8eb0cb!important;text-align:center!important;white-space:nowrap!important}#${MODAL_ID} td{padding:10px 7px!important;border:1px solid #1e3852!important;color:#dbe7f2!important;text-align:center!important;vertical-align:middle!important;word-break:keep-all!important}#${MODAL_ID} tbody tr.current-lot{background:#122f47!important}#${MODAL_ID} tbody tr:hover{background:#163550!important}
      #${MODAL_ID} .qda-reason{font-weight:850!important;color:#fde68a!important}#${MODAL_ID} .qda-empty{padding:30px 10px!important;color:#94a3b8!important;text-align:center!important}.qmes-downtime-edit-btn{pointer-events:auto!important}
      @media(max-width:1100px){#${MODAL_ID} .qda-summary{grid-template-columns:1fr!important}#${MODAL_ID} table{min-width:1120px!important}}
    `;
    document.head.appendChild(style);
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();}

  function renderModal(allData,selectedLot,initialScope){
    closeModal();ensureStyle();
    const modal=document.createElement("div");modal.id=MODAL_ID;
    let scope=initialScope;

    const build=()=>{
      const visible=scope==="current"&&selectedLot?allData.items.filter(item=>item.lot===selectedLot):allData.items;
      const totalMinutes=visible.reduce((sum,item)=>sum+item.minutes,0);
      const lotCount=new Set(visible.map(item=>item.lot).filter(Boolean)).size;
      const rows=visible.length?visible.map(item=>`<tr class="${item.lot===selectedLot?"current-lot":""}"><td>${esc(formatDateTime(item.at))}</td><td>${esc(item.lot)}</td><td>${esc(item.stepName)}</td><td>${esc(item.equipment)}</td><td class="qda-reason">${esc(item.reason)}</td><td>${esc(durationLabel(item.minutes))}</td><td>${esc(item.workers||"-")}</td><td>${esc(item.note||"-")}</td><td><button type="button" class="qmes-downtime-edit-btn" data-edit-id="${esc(item.id)}">수정</button></td></tr>`).join(""):`<tr><td colspan="9" class="qda-empty">${scope==="current"&&selectedLot?`${esc(selectedLot)}의 비가동 이력이 없습니다.`:"등록된 비가동 이력이 없습니다."}</td></tr>`;
      modal.innerHTML=`<div class="qda-dialog"><div class="qda-head"><div><b>비가동 현황</b><p>${scope==="current"&&selectedLot?`현재 LOT ${esc(selectedLot)}의 비가동 이력을 조회합니다.`:"전체 생산 LOT의 비가동 이력을 최신순으로 조회합니다."}</p></div><button type="button" class="qda-close">닫기</button></div><div class="qda-body"><div class="qda-tabs"><button type="button" class="qda-tab ${scope==="current"?"active":""}" data-scope="current" ${selectedLot?"":"disabled"}>현재 LOT</button><button type="button" class="qda-tab ${scope==="all"?"active":""}" data-scope="all">전체 LOT</button></div><div class="qda-summary"><div><small>비가동 건수</small><strong>${visible.length}건</strong></div><div><small>총 비가동 시간</small><strong>${esc(durationLabel(totalMinutes))}</strong></div><div><small>비가동 발생 LOT</small><strong>${lotCount} LOT</strong></div></div><p class="qda-note">운영 현황에서는 0분 기록 ${allData.zeroCount}건을 제외하고, 동일 시각·LOT·공정·사유의 중복 ${allData.duplicateCount}건을 한 건으로 표시합니다. 원본 기록은 삭제하지 않습니다.</p><div style="overflow:auto"><table><colgroup><col style="width:145px"><col style="width:105px"><col style="width:165px"><col style="width:150px"><col style="width:155px"><col style="width:125px"><col style="width:145px"><col><col style="width:72px"></colgroup><thead><tr><th>등록일시</th><th>LOT</th><th>공정</th><th>설비</th><th>사유</th><th>비가동 시간</th><th>작업자</th><th>비고</th><th>관리</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`;
      modal.querySelector(".qda-close")?.addEventListener("click",closeModal);
      modal.querySelectorAll(".qda-tab[data-scope]").forEach(button=>button.addEventListener("click",()=>{scope=button.dataset.scope;build();}));
    };
    build();
    modal.addEventListener("click",event=>{if(event.target===modal)closeModal();});
    document.body.appendChild(modal);
  }

  async function openHistory(){
    try{
      const lot=currentLot();
      const rows=await fetchRows();
      const data=buildHistory(rows);
      renderModal(data,lot,lot?"current":"all");
    }catch(error){
      console.error("[QMES] 비가동 현황 보정 조회 실패",error);
      window.alert(error?.message||"비가동 현황을 불러오지 못했습니다.");
    }
  }

  /* Own the history button before the older document handlers. */
  window.addEventListener("pointerdown",event=>{
    const button=event.target instanceof Element?event.target.closest(".qmes-downtime-history-btn"):null;
    if(!button) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    openHistory();
  },true);
  window.addEventListener("click",event=>{
    const button=event.target instanceof Element?event.target.closest(".qmes-downtime-history-btn"):null;
    if(!button) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(!document.getElementById(MODAL_ID)) openHistory();
  },true);
})();
