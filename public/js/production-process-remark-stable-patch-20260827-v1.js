/* NAMO QMES - Production process remark stable patch v1 - 2026-08-27
 * ADD-ONLY patch. Existing production/process source files are not replaced.
 * Owns the right-side remark column so React re-renders cannot leave it missing.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_REMARK_STABLE_PATCH_20260827_V1__) return;
  window.__QMES_PROCESS_REMARK_STABLE_PATCH_20260827_V1__=true;

  /* Stop the older DOM-patch owners from loading later through the MES master loader. */
  window.__QMES_PROCESS_REMARK_EDIT_20260827__=true;
  window.__QMES_PROCESS_REMARK_CLICK_HOTFIX_20260827__=true;

  const API="/api/qmes-sync/workorder";
  const STORE_KEY="qmes-process-step-remarks-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm=v=>clean(v).toUpperCase().replace(/[\s._-]+/g,"");
  const originalFetch=window.fetch.bind(window);

  function readStore(){try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");return v&&typeof v==="object"?v:{};}catch(_){return {};}}
  function writeStore(v){try{localStorage.setItem(STORE_KEY,JSON.stringify(v));}catch(_){}}
  function notesForLot(lot){const s=readStore();return lot&&s[lot]&&typeof s[lot]==="object"?s[lot]:{};}
  function saveLocal(lot,step,note){if(!lot)return;const s=readStore();s[lot]=s[lot]&&typeof s[lot]==="object"?s[lot]:{};s[lot][String(step)]=clean(note);writeStore(s);}

  /* Preserve saved remarks if the native process screen saves the same process afterwards. */
  window.fetch=async function(input,init){
    try{
      const url=typeof input==="string"?input:String(input?.url||"");
      const method=String(init?.method||input?.method||"GET").toUpperCase();
      if(method==="POST"&&url.includes(API)&&typeof init?.body==="string"){
        const body=JSON.parse(init.body),key=clean(body?.key),lot=key.startsWith("process:")?key.slice(8):"";
        if(lot&&Array.isArray(body?.payload?.steps)){
          const saved=notesForLot(lot);
          body.payload={...body.payload,steps:body.payload.steps.map((step,index)=>{
            const no=String(step?.no??index+1);
            return Object.prototype.hasOwnProperty.call(saved,no)?{...step,remark:clean(saved[no])}:step;
          })};
          init={...init,body:JSON.stringify(body)};
        }
      }
    }catch(_){ }
    return originalFetch(input,init);
  };

  function card(){
    return Array.from(document.querySelectorAll(".qpp-card")).find(el=>clean(el.querySelector(".qpp-card-head b")?.textContent)==="공정 진행 현황")||null;
  }
  function table(){return card()?.querySelector("table.qpp-table")||null;}

  function knownLots(){
    const out=[];
    try{Object.keys(window.DB?.woDocs||{}).forEach(v=>{v=clean(v);if(v)out.push(v);});}catch(_){ }
    try{Object.keys(window.DB?.lots||{}).forEach(v=>{v=clean(v);if(v)out.push(v);});}catch(_){ }
    try{(window.DB?.batches||[]).forEach(r=>{const v=clean(r?.no);if(v)out.push(v);});}catch(_){ }
    return Array.from(new Set(out));
  }

  function currentLot(){
    const scope=document.querySelector(".qmes-prod-process")||document;
    const info=scope.querySelector(".qpp-info")||document.querySelector(".qpp-info");
    if(info){
      for(const label of Array.from(info.querySelectorAll("small,label,span,div"))){
        const t=norm(label.textContent);
        if(t!=="LOTNO"&&!t.startsWith("LOTNO")) continue;
        const box=label.closest("div")||label.parentElement;
        const v=clean(box?.querySelector("strong")?.textContent);
        if(v&&v!=="-")return v;
      }
      const lots=knownLots();
      for(const s of Array.from(info.querySelectorAll("strong"))){const v=clean(s.textContent);if(v&&lots.includes(v))return v;}
    }
    const lots=knownLots(),txt=clean(scope.textContent),matches=lots.filter(l=>l&&txt.includes(l));
    return matches.length===1?matches[0]:"";
  }

  function installStyle(){
    if(document.getElementById("qmes-process-remark-stable-style-20260827-v1"))return;
    const style=document.createElement("style");
    style.id="qmes-process-remark-stable-style-20260827-v1";
    style.textContent=`
      .qmes-process-remark-head-v1,.qmes-process-remark-cell-v1{width:13%!important;min-width:128px!important;max-width:220px!important;text-align:center!important}
      .qmes-process-remark-cell-v1{color:#475569!important;font-size:12px!important}
      .qmes-process-remark-inline-v1{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-width:0!important}
      .qmes-process-remark-text-v1{max-width:112px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#64748b!important;font-size:11px!important;font-weight:700!important}
      .qmes-process-remark-text-v1:empty{display:none!important}
      .qmes-process-remark-btn-v1{height:32px!important;min-width:56px!important;padding:0 11px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important;box-shadow:none!important;outline:none!important}
      .qmes-process-remark-btn-v1:hover{background:#f8fafc!important}
      #qmes-process-remark-modal-v1{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.40)!important}
      #qmes-process-remark-modal-v1 .qprv1-card{width:min(560px,94vw)!important;border:0!important;outline:0!important;border-radius:12px!important;background:#fff!important;color:#0f172a!important;box-shadow:0 24px 70px rgba(15,23,42,.28)!important;overflow:hidden!important}
      #qmes-process-remark-modal-v1 .qprv1-head{display:flex!important;justify-content:space-between!important;align-items:center!important;padding:15px 17px!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important}
      #qmes-process-remark-modal-v1 .qprv1-head b{color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:16px!important;font-weight:900!important}
      #qmes-process-remark-modal-v1 .qprv1-close{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #qmes-process-remark-modal-v1 .qprv1-body{padding:17px!important}
      #qmes-process-remark-modal-v1 .qprv1-meta{margin-bottom:9px!important;color:#475569!important;font-size:11px!important;font-weight:800!important}
      #qmes-process-remark-modal-v1 textarea{box-sizing:border-box!important;width:100%!important;min-height:118px!important;padding:11px 12px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:13px!important;line-height:1.5!important;resize:vertical!important;outline:none!important;box-shadow:none!important}
      #qmes-process-remark-modal-v1 .qprv1-error{display:none!important;margin-top:9px!important;color:#b91c1c!important;font-size:11px!important;font-weight:800!important}
      #qmes-process-remark-modal-v1 .qprv1-error.show{display:block!important}
      #qmes-process-remark-modal-v1 .qprv1-foot{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:12px 17px!important;border-top:1px solid #e2e8f0!important;background:#f8fafc!important}
      #qmes-process-remark-modal-v1 .qprv1-foot button{height:36px!important;min-width:76px!important;padding:0 14px!important;border-radius:7px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}
      #qmes-process-remark-modal-v1 .qprv1-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      #qmes-process-remark-modal-v1 .qprv1-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
    `;
    document.head.appendChild(style);
  }

  function removeLegacy(){
    document.querySelectorAll(".qmes-process-remark-head,.qmes-process-remark-cell,.qmes-process-remark-actions").forEach(n=>n.remove());
    document.getElementById("qmes-process-remark-modal-20260827")?.remove();
  }

  let repairing=false;
  function repair(){
    if(repairing)return;
    repairing=true;
    try{
      installStyle();removeLegacy();
      const t=table();if(!t)return;
      const lot=currentLot();
      const head=t.querySelector("thead tr");
      if(head&&!head.querySelector(".qmes-process-remark-head-v1")){
        const th=document.createElement("th");th.className="qmes-process-remark-head-v1";th.textContent="비고";head.appendChild(th);
      }
      const notes=notesForLot(lot);
      Array.from(t.querySelectorAll("tbody tr")).forEach((row,index)=>{
        let cell=row.querySelector(".qmes-process-remark-cell-v1");
        if(!cell){cell=document.createElement("td");cell.className="qmes-process-remark-cell-v1";row.appendChild(cell);}
        const step=clean(row.children?.[0]?.textContent)||String(index+1);
        const note=Object.prototype.hasOwnProperty.call(notes,step)?clean(notes[step]):clean(cell.dataset.remark);
        cell.dataset.remark=note;if(lot)cell.dataset.qmesLot=lot;cell.dataset.stepKey=step;cell.dataset.rowIndex=String(index);cell.title=note;
        if(!cell.querySelector(".qmes-process-remark-inline-v1"))cell.innerHTML='<div class="qmes-process-remark-inline-v1"><span class="qmes-process-remark-text-v1"></span><button type="button" class="qmes-process-remark-btn-v1">수정</button></div>';
        const text=cell.querySelector(".qmes-process-remark-text-v1");if(text)text.textContent=note;
      });
    }finally{repairing=false;}
  }

  function missing(){
    const t=table();if(!t)return false;
    return !t.querySelector(".qmes-process-remark-head-v1")||t.querySelectorAll(".qmes-process-remark-cell-v1").length!==t.querySelectorAll("tbody tr").length;
  }

  async function refreshNotes(lot){
    if(!lot)return;
    try{
      const r=await originalFetch(API,{credentials:"same-origin"});
      const d=await r.json().catch(()=>({success:false,data:[]}));if(!r.ok||d.success===false)return;
      const rec=(Array.isArray(d.data)?d.data:[]).find(x=>clean(x?.record_key)===`process:${lot}`),p=rec?.payload;if(!p||!Array.isArray(p.steps))return;
      const s=readStore();s[lot]=s[lot]&&typeof s[lot]==="object"?s[lot]:{};
      p.steps.forEach((x,i)=>{s[lot][String(x?.no??i+1)]=clean(x?.remark??x?.note);});writeStore(s);repair();
    }catch(_){ }
  }

  async function saveRemark(lot,rowIndex,note){
    const r=await originalFetch(API,{credentials:"same-origin"});
    const d=await r.json().catch(()=>({success:false,data:[]}));
    if(!r.ok||d.success===false)throw new Error(d.message||"공정 데이터를 불러오지 못했습니다.");
    const rec=(Array.isArray(d.data)?d.data:[]).find(x=>clean(x?.record_key)===`process:${lot}`),p=rec?.payload;
    if(!p||!Array.isArray(p.steps)||!p.steps[rowIndex])throw new Error("저장된 생산공정 데이터를 찾지 못했습니다.");
    const steps=p.steps.map((x,i)=>i===rowIndex?{...x,remark:clean(note)}:x),step=String(steps[rowIndex]?.no??rowIndex+1);
    saveLocal(lot,step,note);
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    const next={...p,steps,updatedAt:new Date().toISOString(),updatedBy:clean(user?.name||user?.uid)||"사용자"};
    const wr=await originalFetch(API,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:`process:${lot}`,payload:next})});
    const wd=await wr.json().catch(()=>({success:false}));if(!wr.ok||wd.success===false)throw new Error(wd.message||"비고 저장에 실패했습니다.");
  }

  function closeModal(){document.getElementById("qmes-process-remark-modal-v1")?.remove();}
  function openModal(button){
    const cell=button.closest(".qmes-process-remark-cell-v1"),row=button.closest("tbody tr"),t=button.closest("table.qpp-table")||button.closest("table");
    const rows=Array.from(t?.querySelectorAll("tbody tr")||[]),rowIndex=rows.indexOf(row),lot=clean(cell?.dataset.qmesLot)||currentLot();
    if(rowIndex<0||!row){window.alert("수정할 공정 행을 찾지 못했습니다.");return;}
    const step=clean(row.children?.[0]?.textContent)||String(rowIndex+1),name=clean(row.children?.[1]?.textContent)||"공정",current=clean(cell?.dataset.remark);
    closeModal();const modal=document.createElement("div");modal.id="qmes-process-remark-modal-v1";
    modal.innerHTML=`<div class="qprv1-card" role="dialog" aria-modal="true" aria-label="공정 비고 수정"><div class="qprv1-head"><b>비고 수정</b><button type="button" class="qprv1-close">닫기</button></div><div class="qprv1-body"><div class="qprv1-meta">${esc(lot||"LOT 확인 필요")} · ${esc(step)} · ${esc(name)}</div><textarea maxlength="500" placeholder="공정 비고를 입력하세요.">${esc(current)}</textarea><div class="qprv1-error${lot?"":" show"}">${lot?"":"LOT No.를 확인하지 못했습니다."}</div></div><div class="qprv1-foot"><button type="button" class="qprv1-cancel">취소</button><button type="button" class="qprv1-save"${lot?"":" disabled"}>저장</button></div></div>`;
    modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest(".qprv1-close,.qprv1-cancel"))closeModal();});
    modal.querySelector(".qprv1-save")?.addEventListener("click",async()=>{
      const save=modal.querySelector(".qprv1-save"),ta=modal.querySelector("textarea"),err=modal.querySelector(".qprv1-error");if(!lot)return;
      save.disabled=true;save.textContent="저장 중";err.classList.remove("show");
      try{const note=clean(ta.value);await saveRemark(lot,rowIndex,note);cell.dataset.remark=note;cell.title=note;const text=cell.querySelector(".qmes-process-remark-text-v1");if(text)text.textContent=note;closeModal();window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot,type:"remark",stepNo:step}}));}
      catch(error){err.textContent=error?.message||"비고 저장에 실패했습니다.";err.classList.add("show");save.disabled=false;save.textContent="저장";}
    });
    document.body.appendChild(modal);setTimeout(()=>modal.querySelector("textarea")?.focus(),0);
  }

  document.addEventListener("click",e=>{const b=e.target instanceof Element?e.target.closest(".qmes-process-remark-btn-v1"):null;if(!b)return;e.preventDefault();e.stopImmediatePropagation();openModal(b);},true);

  let lastLot="";
  function burst(){repair();const lot=currentLot();if(lot&&lot!==lastLot){lastLot=lot;refreshNotes(lot);}}
  function start(){
    installStyle();burst();
    ["qmes:production-process-updated","qmes:data-updated","qmes:workorder-synced","qmes:mes-master-ready"].forEach(n=>window.addEventListener(n,burst));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
