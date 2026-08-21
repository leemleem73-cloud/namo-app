/* QMES partner registration modals - 2026-08-21 */
(function(global){
  'use strict';
  if(global.__QMES_PARTNER_REGISTER_MODAL_V2__) return;
  global.__QMES_PARTNER_REGISTER_MODAL_V2__=true;

  const text=v=>String(v??'').replace(/\s+/g,' ').trim();
  const nextCode=(prefix,rows)=>`${prefix}${String(Math.max(0,...(rows||[]).map(r=>Number(String(r?.code||'').replace(/\D/g,''))||0))+1).padStart(3,'0')}`;
  const typeOf=button=>{const label=text(button?.textContent);if(label.includes('고객사 등록'))return'customer';if(label.includes('공급업체 등록'))return'supplier';return'';};
  const normalizeMaterial=name=>{const value=text(name).toUpperCase().replace(/\s+/g,'');if(value.includes('BYK180')||value.includes('BYK-180')||value.includes('분산제'))return'BYK180 (분산제)';return text(name);};
  const close=()=>document.getElementById('qmes-partner-register-modal-v2')?.remove();
  const defaultCustomers=[{code:'CUS001',name:'현대자동차',status:'거래중'},{code:'CUS002',name:'삼성SDI',status:'거래중'},{code:'CUS003',name:'LG에너지솔루션',status:'거래중'},{code:'CUS004',name:'SK온',status:'거래중'}];
  const defaultSuppliers=[{code:'SUP001',company:'코오롱',material:'PAI',lot:'PAI#27-2(2)',status:'거래중'},{code:'SUP002',company:'푸양광명화학',material:'NMP',lot:'20251031063',status:'거래중'},{code:'SUP003',company:'모리로쿠케미칼즈',material:'NMP',lot:'2026011101',status:'거래중'},{code:'SUP004',company:'강신산업',material:'Boehmite',lot:'006-8-25',status:'거래중'},{code:'SUP005',company:'LG화학',material:'SBR',lot:'C3026B26A(1)',status:'거래중'},{code:'SUP006',company:'SOLVAY',material:'PVDF',lot:'CSE23202TA',status:'거래중'},{code:'SUP007',company:'금호석유화학',material:'SBS',lot:'W251016',status:'거래중'},{code:'SUP008',company:'유니소재',material:'BYK180 (분산제)',lot:'2708935',status:'거래중'}];

  const style=document.createElement('style');
  style.textContent=`#qmes-partner-register-modal-v2{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(2,6,23,.78);backdrop-filter:blur(3px)}#qmes-partner-register-modal-v2 .box{width:min(650px,96vw);max-height:90vh;overflow:auto;border:1px solid #475569;border-radius:16px;background:#111f33;box-shadow:0 24px 70px rgba(0,0,0,.58);font-family:Pretendard,sans-serif}#qmes-partner-register-modal-v2 .head{display:flex;align-items:center;padding:17px 19px;border-bottom:1px solid #334155}.title{color:#f8fafc;font-size:18px;font-weight:900}#qmes-partner-register-modal-v2 .body{display:grid;grid-template-columns:1fr 1fr;gap:13px;padding:19px}.field{display:grid;gap:6px;color:#cbd5e1;font-size:13px;font-weight:800}.full{grid-column:1/-1}#qmes-partner-register-modal-v2 input,#qmes-partner-register-modal-v2 select,#qmes-partner-register-modal-v2 textarea{width:100%;box-sizing:border-box;border:1px solid #475569;border-radius:8px;background:#0f172a;color:#f8fafc;padding:0 10px;font:700 13px Pretendard,sans-serif;outline:none}#qmes-partner-register-modal-v2 input,#qmes-partner-register-modal-v2 select{height:40px}#qmes-partner-register-modal-v2 textarea{min-height:78px;padding:10px;resize:vertical}.code{background:#18263a!important;color:#94a3b8!important}#qmes-partner-register-modal-v2 .foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 19px;border-top:1px solid #334155}#qmes-partner-register-modal-v2 button{height:38px;padding:0 16px;border-radius:8px;font-weight:900;cursor:pointer}.cancel{border:1px solid #64748b;background:#17263b;color:#e2e8f0}.save{border:0;background:#0e7490;color:#fff}.x{margin-left:auto;width:34px;padding:0!important;border:1px solid #475569;background:#17263b;color:#e2e8f0;font-size:22px}@media(max-width:620px){#qmes-partner-register-modal-v2 .body{grid-template-columns:1fr}}`;document.head.appendChild(style);

  const input=(placeholder,value='')=>{const el=document.createElement('input');el.placeholder=placeholder;el.value=value;return el;};
  const select=()=>{const el=document.createElement('select');['거래중','거래중지'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o);});return el;};
  const field=(label,control,full=false)=>{const wrap=document.createElement('label');wrap.className='field'+(full?' full':'');const cap=document.createElement('span');cap.textContent=label;wrap.append(cap,control);return wrap;};
  const saveDb=()=>{try{if(typeof global.dbSave==='function')global.dbSave();}catch(e){console.warn(e);}};
  const baseModal=titleText=>{close();const overlay=document.createElement('div');overlay.id='qmes-partner-register-modal-v2';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');const box=document.createElement('div');box.className='box';const head=document.createElement('div');head.className='head';const title=document.createElement('strong');title.className='title';title.textContent=titleText;const x=document.createElement('button');x.type='button';x.className='x';x.textContent='×';x.onclick=close;head.append(title,x);const body=document.createElement('div');body.className='body';const foot=document.createElement('div');foot.className='foot';const cancel=document.createElement('button');cancel.type='button';cancel.className='cancel';cancel.textContent='취소';cancel.onclick=close;const save=document.createElement('button');save.type='button';save.className='save';save.textContent='등록';foot.append(cancel,save);box.append(head,body,foot);overlay.append(box);overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close();});document.body.appendChild(overlay);return{body,save};};

  function openCustomer(){
    if(!global.DB){alert('데이터 저장소를 불러오지 못했습니다.');return;}
    const rows=Array.isArray(global.DB.partnerCustomers)&&global.DB.partnerCustomers.length?global.DB.partnerCustomers.slice():defaultCustomers.map(r=>({...r}));
    const code=nextCode('CUS',rows),m=baseModal('고객사 등록');
    const codeEl=input('',code);codeEl.readOnly=true;codeEl.className='code';const name=input('고객사명');const manager=input('담당자명');const phone=input('연락처');const status=select();const note=document.createElement('textarea');note.placeholder='비고 (선택)';
    m.body.append(field('고객사 코드',codeEl),field('고객사명',name),field('담당자',manager),field('연락처',phone),field('거래상태',status),field('비고',note,true));
    m.save.onclick=()=>{const customer=text(name.value);if(!customer){alert('고객사명을 입력하세요.');name.focus();return;}if(rows.some(r=>text(r.name).toLowerCase()===customer.toLowerCase())){alert('이미 등록된 고객사입니다.');return;}rows.push({code,name:customer,manager:text(manager.value),phone:text(phone.value),status:status.value||'거래중',note:text(note.value)});global.DB.partnerCustomers=rows;saveDb();close();setTimeout(()=>location.reload(),80);};requestAnimationFrame(()=>name.focus());
  }

  function openSupplier(){
    if(!global.DB){alert('데이터 저장소를 불러오지 못했습니다.');return;}
    const rows=Array.isArray(global.DB.partnerSuppliers)&&global.DB.partnerSuppliers.length?global.DB.partnerSuppliers.slice():defaultSuppliers.map(r=>({...r}));
    const code=nextCode('SUP',rows),m=baseModal('공급업체 등록');
    const codeEl=input('',code);codeEl.readOnly=true;codeEl.className='code';const company=input('공급업체명');const material=input('원료명');const lot=input('최근 원료 LOT No.');const manager=input('담당자명');const phone=input('연락처');const status=select();const note=document.createElement('textarea');note.placeholder='비고 (선택)';
    m.body.append(field('공급업체 코드',codeEl),field('공급업체명',company),field('원료명',material),field('최근 원료 LOT No.',lot),field('담당자',manager),field('연락처',phone),field('거래상태',status),field('비고',note,true));
    m.save.onclick=()=>{const c=text(company.value),mat=normalizeMaterial(material.value);if(!c||!mat){alert('공급업체명과 원료명을 입력하세요.');return;}rows.push({code,company:c,material:mat,lot:text(lot.value).toUpperCase(),manager:text(manager.value),phone:text(phone.value),status:status.value||'거래중',note:text(note.value)});global.DB.partnerSuppliers=rows;saveDb();close();setTimeout(()=>location.reload(),80);};requestAnimationFrame(()=>company.focus());
  }

  document.addEventListener('click',event=>{const button=event.target.closest?.('button');const type=typeOf(button);if(!type)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();type==='customer'?openCustomer():openSupplier();},true);
})(window);
