/* QMES production downtime edit hard-recovery - 2026-08-24
 * Runs at WINDOW capture phase, before any legacy document click handler.
 * This makes the existing '수정' button work even if an older downtime-history
 * modal/script is still present because of cache or mixed helper versions.
 */
(function(){
  "use strict";
  if(window.__QMES_DOWNTIME_EDIT_RECOVERY_20260824__) return;
  window.__QMES_DOWNTIME_EDIT_RECOVERY_20260824__=true;

  const clean=v=>String(v==null?"":v).trim();
  const esc=v=>clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  let targetRecord=null;
  let resolving=false;

  function parsePayload(row){
    const value=row?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){try{return JSON.parse(value);}catch(_e){return {};}}
    return {};
  }

  async function fetchRows(){
    const response=await fetch('/api/qmes-sync/workorder',{credentials:'same-origin'});
    const payload=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||!payload.success) throw new Error(payload.message||`비가동 현황 조회 실패 (${response.status})`);
    return Array.isArray(payload.data)?payload.data:[];
  }

  function buildHistory(rows){
    const result=[];
    rows.filter(row=>clean(row?.record_key).startsWith('process:')).forEach(row=>{
      const payload=parsePayload(row);
      const lot=clean(payload.lot)||clean(row.record_key).slice('process:'.length);
      const steps=Array.isArray(payload.steps)?payload.steps:[];
      const downtime=Array.isArray(payload.downtime)?payload.downtime:[];
      downtime.forEach((item,index)=>{
        const stepNo=Number(item?.stepNo)||0;
        const step=steps.find(s=>Number(s?.no)===stepNo)||steps[stepNo-1]||{};
        result.push({
          recordKey:clean(row.record_key),index,lot,at:clean(item?.at),stepNo,
          stepName:clean(step?.name),equipment:clean(step?.equipment),
          reason:clean(item?.reason),minutes:Math.max(0,Number(item?.minutes)||0),
          workers:Array.isArray(item?.workers)?item.workers.map(clean).filter(Boolean).join(', '):clean(item?.workers),
          note:clean(item?.note),payload
        });
      });
    });
    return result.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  }

  function minutesFromLabel(text){
    const value=clean(text);
    const bracket=value.match(/\((\d+)분\)/);
    if(bracket) return Number(bracket[1]);
    const h=value.match(/(\d+)시간/);
    const m=value.match(/(\d+)분/);
    return (h?Number(h[1])*60:0)+(m?Number(m[1]):0);
  }

  async function resolveTarget(button){
    const rows=await fetchRows();
    const history=buildHistory(rows);

    const editId=clean(button.dataset.editId);
    if(editId){
      const parts=editId.split('|');
      if(parts.length>=3){
        const recordKey=parts[0];
        const index=Number(parts[1]);
        const at=parts.slice(2).join('|');
        const exact=history.find(item=>item.recordKey===recordKey&&item.index===index&&(!at||item.at===at));
        if(exact) return exact;
        const sameIndex=history.find(item=>item.recordKey===recordKey&&item.index===index);
        if(sameIndex) return sameIndex;
      }
    }

    const rowIndex=Number(button.dataset.rowIndex);
    if(Number.isInteger(rowIndex)&&rowIndex>=0&&history[rowIndex]) return history[rowIndex];

    const tr=button.closest('tr');
    const cells=tr?Array.from(tr.cells||[]):[];
    const lot=clean(cells[1]?.textContent);
    const process=clean(cells[2]?.textContent);
    const reason=clean(cells[4]?.textContent);
    const minutes=minutesFromLabel(cells[5]?.textContent);
    const candidates=history.filter(item=>item.lot===lot);
    return candidates.find(item=>item.reason===reason&&item.minutes===minutes&&(!process||item.stepName===process))
      || candidates.find(item=>item.reason===reason&&item.minutes===minutes)
      || candidates.find(item=>item.reason===reason)
      || candidates[0]
      || null;
  }

  function installStyle(){
    if(document.getElementById('qmes-downtime-recovery-style')) return;
    const style=document.createElement('style');
    style.id='qmes-downtime-recovery-style';
    style.textContent=`
      #qmes-downtime-recovery-modal{position:fixed!important;inset:0!important;z-index:2147483600!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(2,8,18,.92)!important}
      #qmes-downtime-recovery-modal .box{width:min(780px,96vw);max-height:90vh;overflow:auto;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.7);color:#e2e8f0}
      #qmes-downtime-recovery-modal .head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #28445e}
      #qmes-downtime-recovery-modal .head b{font-size:17px}#qmes-downtime-recovery-modal .head p{margin:4px 0 0;color:#8da4b9;font-size:11px}
      #qmes-downtime-recovery-modal .close{min-width:58px;height:36px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:800;cursor:pointer}
      #qmes-downtime-recovery-modal .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin:14px 16px;border:1px solid #294761;border-radius:9px;overflow:hidden;background:#294761}
      #qmes-downtime-recovery-modal .summary>div{padding:11px 12px;background:#122a44;min-width:0}#qmes-downtime-recovery-modal small{display:block;margin-bottom:5px;color:#7895af;font-size:10px}#qmes-downtime-recovery-modal strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #qmes-downtime-recovery-modal .form{display:grid;grid-template-columns:1fr 150px 150px;gap:12px;padding:0 16px 16px}#qmes-downtime-recovery-modal label{display:flex;flex-direction:column;gap:7px;color:#a9bfd2;font-size:12px;font-weight:800}#qmes-downtime-recovery-modal label.full{grid-column:1/-1}
      #qmes-downtime-recovery-modal input,#qmes-downtime-recovery-modal textarea{box-sizing:border-box;width:100%;border:1px solid #35516b;border-radius:8px;background:#142d49;color:#f1f5f9;font-size:13px;outline:none}#qmes-downtime-recovery-modal input{height:42px;padding:0 11px}#qmes-downtime-recovery-modal textarea{min-height:90px;padding:10px 11px;resize:vertical}
      #qmes-downtime-recovery-modal .foot{display:flex;justify-content:flex-end;gap:8px;padding:13px 16px;border-top:1px solid #28445e}#qmes-downtime-recovery-modal .foot button{min-width:78px;height:38px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:900;cursor:pointer}#qmes-downtime-recovery-modal .foot .save{border-color:#0ea5e9;background:#087ca8;color:#fff}
      @media(max-width:800px){#qmes-downtime-recovery-modal .summary{grid-template-columns:repeat(2,1fr)}#qmes-downtime-recovery-modal .form{grid-template-columns:1fr 1fr}#qmes-downtime-recovery-modal .form label:first-child{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function closeModal(){document.getElementById('qmes-downtime-recovery-modal')?.remove();targetRecord=null;}

  function openModal(item){
    targetRecord=item;
    installStyle();
    document.getElementById('qmes-downtime-recovery-modal')?.remove();
    const hours=Math.floor(item.minutes/60);
    const mins=item.minutes%60;
    const modal=document.createElement('div');
    modal.id='qmes-downtime-recovery-modal';
    modal.innerHTML=`<div class="box"><div class="head"><div><b>비가동 수정</b><p>사유·시간·비고 수정 후 저장하세요.</p></div><button type="button" class="close">닫기</button></div><div class="summary"><div><small>LOT No.</small><strong>${esc(item.lot)}</strong></div><div><small>공정</small><strong>${esc(item.stepName||'-')}</strong></div><div><small>설비</small><strong>${esc(item.equipment||'-')}</strong></div><div><small>등록일시</small><strong>${esc(item.at||'-')}</strong></div></div><div class="form"><label>비가동 사유 *<input id="qmes-recovery-reason" value="${esc(item.reason)}"></label><label>시간<input id="qmes-recovery-hours" type="number" min="0" step="1" value="${hours}"></label><label>분 (0~59)<input id="qmes-recovery-minutes" type="number" min="0" max="59" step="1" value="${mins}"></label><label class="full">비고<textarea id="qmes-recovery-note">${esc(item.note)}</textarea></label></div><div class="foot"><button type="button" class="cancel">취소</button><button type="button" class="save qmes-downtime-recovery-save">수정 저장</button></div></div>`;
    modal.querySelector('.close')?.addEventListener('click',closeModal);
    modal.querySelector('.cancel')?.addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    modal.querySelector('.qmes-downtime-recovery-save')?.addEventListener('click',e=>saveEdit(e.currentTarget));
    document.body.appendChild(modal);
    setTimeout(()=>document.getElementById('qmes-recovery-reason')?.focus(),0);
  }

  function locateDowntime(items,target){
    if(Number.isInteger(target.index)&&target.index>=0&&target.index<items.length){
      const direct=items[target.index];
      if(clean(direct?.at)===target.at||!target.at) return target.index;
    }
    let i=items.findIndex(x=>clean(x?.at)===target.at&&Number(x?.stepNo||0)===Number(target.stepNo||0));
    if(i>=0) return i;
    i=items.findIndex(x=>clean(x?.reason)===target.reason&&Number(x?.minutes||0)===Number(target.minutes||0));
    return i;
  }

  async function saveEdit(button){
    const target=targetRecord;
    if(!target) return;
    const reason=clean(document.getElementById('qmes-recovery-reason')?.value);
    const hours=Number(document.getElementById('qmes-recovery-hours')?.value||0);
    const minutes=Number(document.getElementById('qmes-recovery-minutes')?.value||0);
    const note=clean(document.getElementById('qmes-recovery-note')?.value);
    if(!reason){alert('비가동 사유를 입력하세요.');return;}
    if(!Number.isInteger(hours)||hours<0){alert('시간은 0 이상의 정수로 입력하세요.');return;}
    if(!Number.isInteger(minutes)||minutes<0||minutes>59){alert('분은 0~59 사이 정수로 입력하세요.');return;}
    button.disabled=true;button.textContent='저장중';
    try{
      const rows=await fetchRows();
      const row=rows.find(r=>clean(r?.record_key)===target.recordKey);
      if(!row) throw new Error(`${target.lot} 생산공정 기록을 찾지 못했습니다.`);
      const payload=parsePayload(row);
      const downtime=Array.isArray(payload.downtime)?payload.downtime.slice():[];
      const index=locateDowntime(downtime,target);
      if(index<0) throw new Error('수정할 비가동 기록을 찾지 못했습니다.');
      const now=new Date().toISOString();
      downtime[index]={...downtime[index],reason,minutes:hours*60+minutes,note,editedAt:now,editedBy:clean(window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||'사용자')};
      const next={...payload,downtime,updatedAt:now};
      const response=await fetch('/api/qmes-sync/workorder',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:target.recordKey,payload:next})});
      const result=await response.json().catch(()=>({success:false}));
      if(!response.ok||!result.success) throw new Error(result.message||`비가동 수정 저장 실패 (${response.status})`);
      closeModal();
      document.getElementById('qmes-production-downtime-history-modal')?.remove();
      try{window.dispatchEvent(new CustomEvent('qmes:production-process-updated',{detail:{lot:target.lot,type:'downtime-edit'}}));}catch(_e){}
      const historyButton=document.querySelector('.qmes-downtime-history-btn');
      if(historyButton) setTimeout(()=>historyButton.click(),80);
    }catch(error){
      console.error('[QMES] 비가동 수정 복구 저장 실패',error);
      alert(error?.message||'비가동 수정 저장에 실패했습니다.');
      button.disabled=false;button.textContent='수정 저장';
    }
  }

  async function handleEdit(button){
    if(resolving) return;
    resolving=true;
    button.style.opacity='.7';
    try{
      const item=await resolveTarget(button);
      if(!item) throw new Error('수정할 비가동 기록을 찾지 못했습니다.');
      openModal(item);
    }catch(error){
      console.error('[QMES] 비가동 수정 대상 조회 실패',error);
      alert(error?.message||'수정할 비가동 기록을 찾지 못했습니다.');
    }finally{
      resolving=false;button.style.opacity='';
    }
  }

  /* WINDOW capture occurs before old DOCUMENT handlers. */
  window.addEventListener('pointerdown',event=>{
    const button=event.target?.closest?.('.qmes-downtime-edit-btn');
    if(!button) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    handleEdit(button);
  },true);

  window.addEventListener('click',event=>{
    const button=event.target?.closest?.('.qmes-downtime-edit-btn');
    if(!button) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(!document.getElementById('qmes-downtime-recovery-modal')&&!resolving) handleEdit(button);
  },true);
})();
