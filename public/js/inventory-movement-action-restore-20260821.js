/* QMES inventory movement action restore - 2026-08-21 */
(function(global){
  'use strict';
  if(global.__QMES_INVENTORY_MOVEMENT_ACTION_RESTORE_20260821__) return;
  global.__QMES_INVENTORY_MOVEMENT_ACTION_RESTORE_20260821__=true;

  const STYLE_ID='qmes-inventory-movement-action-restore-style';
  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-inv-manual-action{margin-left:8px;background:#0ea5e9!important;color:#fff!important;border-color:#0284c7!important;font-weight:800!important;}
      .qmes-inv-manual-overlay{position:fixed;inset:0;z-index:15000;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:20px;}
      .qmes-inv-manual-modal{width:min(860px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.28);padding:20px;color:#0f172a;}
      .qmes-inv-manual-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;}.qmes-inv-manual-head h3{margin:0;font-size:21px}.qmes-inv-manual-head button{border:0;background:transparent;font-size:28px;cursor:pointer}
      .qmes-inv-manual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.qmes-inv-manual-grid label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:800}.qmes-inv-manual-grid input,.qmes-inv-manual-grid select{height:40px;border:1px solid #cbd5e1;border-radius:8px;padding:0 10px;font:inherit}.qmes-inv-manual-grid .wide{grid-column:1/-1}.qmes-inv-manual-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.qmes-inv-manual-actions button{height:40px;padding:0 16px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;font-weight:800;cursor:pointer}.qmes-inv-manual-actions .primary{background:#0ea5e9;color:#fff;border-color:#0284c7}.qmes-inv-manual-error{margin:0 0 12px;padding:10px 12px;border-radius:8px;background:#fee2e2;color:#991b1b;font-weight:700}.qmes-inv-manual-note{font-size:12px;color:#64748b;margin:2px 0 14px}
      @media(max-width:700px){.qmes-inv-manual-grid{grid-template-columns:1fr}.qmes-inv-manual-grid .wide{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  async function api(path,options={}){
    const response=await fetch('/api/inventory'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const payload=await response.json().catch(()=>({success:false,message:'서버 응답을 확인할 수 없습니다.'}));
    if(!response.ok||!payload.success) throw new Error(payload.message||'재고 서버 요청에 실패했습니다.');
    return payload.data;
  }

  function makeField(label,control,wide){const wrap=document.createElement('label');if(wide)wrap.className='wide';const span=document.createElement('span');span.textContent=label;wrap.append(span,control);return wrap;}
  function option(value,label){const el=document.createElement('option');el.value=value;el.textContent=label;return el;}
  function input(type='text'){const el=document.createElement('input');el.type=type;return el;}
  function select(entries){const el=document.createElement('select');entries.forEach(([v,l])=>el.appendChild(option(v,l)));return el;}

  async function openModal(){
    if(document.querySelector('.qmes-inv-manual-overlay')) return;
    ensureStyle();
    let locations=[];try{locations=await api('/locations');}catch(error){alert(error.message);return;}
    const overlay=document.createElement('div');overlay.className='qmes-inv-manual-overlay';
    const modal=document.createElement('form');modal.className='qmes-inv-manual-modal';
    const head=document.createElement('div');head.className='qmes-inv-manual-head';head.innerHTML='<h3>입출고 처리</h3>';
    const close=document.createElement('button');close.type='button';close.textContent='×';close.onclick=()=>overlay.remove();head.appendChild(close);
    const note=document.createElement('div');note.className='qmes-inv-manual-note';note.textContent='입고·출고·이동을 직접 등록하면 중앙 재고와 입출고 이력에 즉시 반영됩니다.';
    const error=document.createElement('div');error.className='qmes-inv-manual-error';error.style.display='none';
    const grid=document.createElement('div');grid.className='qmes-inv-manual-grid';

    const type=select([['RECEIPT','입고'],['ISSUE','출고'],['MOVE','이동'],['RETURN','반품']]);
    const itemCode=input(); const itemName=input(); const lotNo=input(); const quantity=input('number');quantity.min='0.001';quantity.step='0.001';
    const unit=input();unit.value='kg';
    const fromLocation=select([['','없음'],...locations.map(l=>[l.location_code,l.location_code])]);
    const toLocation=select([['','없음'],...locations.map(l=>[l.location_code,l.location_code])]);
    const statusEntries=[['AVAILABLE','사용가능'],['IQC_PENDING','IQC 대기'],['OQC_PENDING','OQC 대기'],['HOLD','HOLD'],['NONCONFORM','부적합'],['RESERVED','예약']];
    const fromStatus=select(statusEntries); const toStatus=select(statusEntries);
    const referenceNo=input(); const reason=input();
    function applyDefaults(){
      if(type.value==='RECEIPT'){fromLocation.value='';toLocation.value='IQC';fromStatus.value='AVAILABLE';toStatus.value='IQC_PENDING';}
      else if(type.value==='ISSUE'){if(!fromLocation.value)fromLocation.value='RM-WH';toLocation.value='';fromStatus.value='AVAILABLE';toStatus.value='AVAILABLE';}
      else if(type.value==='MOVE'){if(!fromLocation.value)fromLocation.value='RM-WH';if(!toLocation.value)toLocation.value='PROD';fromStatus.value='AVAILABLE';toStatus.value='AVAILABLE';}
      else if(type.value==='RETURN'){fromLocation.value='';if(!toLocation.value)toLocation.value='RM-WH';fromStatus.value='AVAILABLE';toStatus.value='AVAILABLE';}
    }
    type.onchange=applyDefaults;applyDefaults();

    grid.append(
      makeField('처리유형',type),makeField('품목코드',itemCode),makeField('품목명',itemName),makeField('LOT',lotNo),
      makeField('수량',quantity),makeField('단위',unit),makeField('From 위치',fromLocation),makeField('To 위치',toLocation),
      makeField('From 상태',fromStatus),makeField('To 상태',toStatus),makeField('참조번호',referenceNo),makeField('사유/비고',reason,true)
    );
    const actions=document.createElement('div');actions.className='qmes-inv-manual-actions';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='취소';cancel.onclick=()=>overlay.remove();
    const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='확정 저장';actions.append(cancel,save);
    modal.append(head,note,error,grid,actions);overlay.appendChild(modal);document.body.appendChild(overlay);
    overlay.addEventListener('mousedown',e=>{if(e.target===overlay)overlay.remove();});
    modal.addEventListener('submit',async e=>{
      e.preventDefault();error.style.display='none';save.disabled=true;save.textContent='저장 중...';
      try{
        await api('/transactions',{method:'POST',body:JSON.stringify({transactionType:type.value,itemCode:itemCode.value,itemName:itemName.value,category:'RM',lotNo:lotNo.value,quantity:quantity.value,unit:unit.value,fromLocation:fromLocation.value,toLocation:toLocation.value,fromStatus:fromStatus.value,toStatus:toStatus.value,referenceNo:referenceNo.value,reason:reason.value})});
        overlay.remove();
        document.dispatchEvent(new CustomEvent('qmes:inventory-auto-linked'));
        setTimeout(()=>location.reload(),120);
      }catch(err){error.textContent=err.message;error.style.display='block';save.disabled=false;save.textContent='확정 저장';}
    });
  }

  function install(){
    ensureStyle();
    const shell=Array.from(document.querySelectorAll('.inv-shell')).find(el=>String(el.textContent||'').includes('재고관리 · 입출고 관리'));
    if(!shell) return;
    const actions=shell.querySelector('.inv-title-row .inv-actions');
    if(!actions||actions.querySelector('.qmes-inv-manual-action')) return;
    const btn=document.createElement('button');btn.type='button';btn.className='primary qmes-inv-manual-action';btn.textContent='입출고 처리';btn.addEventListener('click',openModal);actions.appendChild(btn);
  }
  let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;install();});}
  const observer=new MutationObserver(schedule);
  function start(){install();observer.observe(document.documentElement,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
