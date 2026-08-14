/* QMES partner registration hard recovery — 2026-08-14
 * Always opens a native modal from the visible register button.
 * Does NOT block the original React click handler.
 */
(function(global){
  'use strict';
  if(global.__QMES_PARTNER_REGISTER_HARD_RECOVERY__) return;
  global.__QMES_PARTNER_REGISTER_HARD_RECOVERY__=true;

  const text=value=>String(value??'').trim();
  const normalizeMaterial=name=>{
    const value=text(name).toUpperCase().replace(/\s+/g,'');
    if(value.includes('BYK180')||value.includes('BYK-180')||value.includes('분산제')) return 'BYK180 (분산제)';
    return text(name);
  };
  const nextCode=(prefix,rows)=>`${prefix}${String(Math.max(0,...(rows||[]).map(row=>Number(String(row?.code||'').replace(/\D/g,''))||0))+1).padStart(3,'0')}`;
  const saveDb=()=>{try{if(typeof global.dbSave==='function')global.dbSave();}catch(error){console.warn('[QMES] 거래처 저장 실패',error);}};
  const closeModal=()=>document.getElementById('qmes-partner-register-hard-modal')?.remove();

  function makeInput(placeholder){const el=document.createElement('input');el.placeholder=placeholder;el.style.cssText='width:100%;height:38px;box-sizing:border-box;border:1px solid #475569;border-radius:8px;background:#0f172a;color:#f8fafc;padding:0 10px;font:700 13px Pretendard,sans-serif;outline:none';return el;}
  function makeSelect(){const el=document.createElement('select');['거래중','거래중지'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o);});el.style.cssText='width:100%;height:38px;box-sizing:border-box;border:1px solid #475569;border-radius:8px;background:#0f172a;color:#f8fafc;padding:0 10px;font:700 13px Pretendard,sans-serif;outline:none';return el;}
  function field(label,control){const wrap=document.createElement('label');wrap.style.cssText='display:grid;gap:6px;color:#cbd5e1;font-size:13px;font-weight:800';const cap=document.createElement('span');cap.textContent=label;wrap.append(cap,control);return wrap;}

  function openModal(type){
    closeModal();
    const supplier=type==='supplier';
    const overlay=document.createElement('div');overlay.id='qmes-partner-register-hard-modal';overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.82);backdrop-filter:blur(3px)';
    const box=document.createElement('div');box.style.cssText=`width:min(${supplier?'760':'520'}px,96vw);max-height:90vh;overflow:auto;border:1px solid #475569;border-radius:14px;background:#111f33;box-shadow:0 24px 70px rgba(0,0,0,.58);font-family:Pretendard,sans-serif`;
    const head=document.createElement('div');head.style.cssText='display:flex;align-items:center;padding:16px 18px;border-bottom:1px solid #334155';
    const title=document.createElement('strong');title.textContent=supplier?'신규 공급업체 등록':'신규 고객사 등록';title.style.cssText='color:#f8fafc;font-size:17px;font-weight:900';
    const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','닫기');x.style.cssText='margin-left:auto;width:34px;height:34px;border:1px solid #475569;border-radius:8px;background:#17263b;color:#e2e8f0;font-size:22px;cursor:pointer';x.onclick=closeModal;head.append(title,x);

    const body=document.createElement('div');body.style.cssText=`display:grid;grid-template-columns:${supplier?'1fr 1fr':'1fr 150px'};gap:12px;padding:18px`;
    const name=makeInput(supplier?'공급업체명':'고객사명');const status=makeSelect();let material=null,lot=null;
    body.append(field(supplier?'공급업체명':'고객사명',name));
    if(supplier){material=makeInput('원료명');lot=makeInput('최근 원료 LOT No.');body.append(field('원료명',material),field('최근 원료 LOT No.',lot));}
    body.append(field('거래상태',status));

    const foot=document.createElement('div');foot.style.cssText='display:flex;justify-content:flex-end;gap:8px;padding:14px 18px;border-top:1px solid #334155';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='닫기';cancel.style.cssText='height:38px;padding:0 16px;border:1px solid #64748b;border-radius:8px;background:#17263b;color:#e2e8f0;font-weight:800;cursor:pointer';cancel.onclick=closeModal;
    const save=document.createElement('button');save.type='button';save.textContent='등록';save.style.cssText='height:38px;padding:0 18px;border:0;border-radius:8px;background:#0e7490;color:#fff;font-weight:900;cursor:pointer';
    save.onclick=()=>{
      if(!global.DB){alert('데이터 저장소를 불러오지 못했습니다.');return;}
      if(supplier){
        const company=text(name.value),materialName=normalizeMaterial(material.value);if(!company||!materialName){alert('공급업체명과 원료명을 입력하세요.');return;}
        const rows=Array.isArray(global.DB.partnerSuppliers)?global.DB.partnerSuppliers:[];
        global.DB.partnerSuppliers=[...rows,{code:nextCode('SUP',rows),company,material:materialName,lot:text(lot.value).toUpperCase(),status:status.value||'거래중'}];
      }else{
        const customer=text(name.value);if(!customer){alert('고객사명을 입력하세요.');return;}
        const rows=Array.isArray(global.DB.partnerCustomers)?global.DB.partnerCustomers:[];
        if(rows.some(row=>text(row.name).toLowerCase()===customer.toLowerCase())){alert('이미 등록된 고객사입니다.');return;}
        global.DB.partnerCustomers=[...rows,{code:nextCode('CUS',rows),name:customer,status:status.value||'거래중'}];
      }
      saveDb();closeModal();
      try{global.dispatchEvent(new CustomEvent('qmes:partners-updated'));}catch(error){}
      setTimeout(()=>location.reload(),50);
    };
    foot.append(cancel,save);box.append(head,body,foot);overlay.append(box);overlay.addEventListener('mousedown',event=>{if(event.target===overlay)closeModal();});document.body.append(overlay);requestAnimationFrame(()=>name.focus());
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-qmes-partner-register="true"]');
    if(!button)return;
    const label=text(button.textContent);
    openModal(label.includes('공급업체')?'supplier':'customer');
    /* Important: do not preventDefault/stopPropagation. React keeps working too. */
  },true);
})(window);