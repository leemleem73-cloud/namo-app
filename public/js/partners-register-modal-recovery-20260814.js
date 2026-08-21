/* QMES partner registration modal recovery */
(function(global){
  'use strict';
  if(global.__QMES_PARTNER_REGISTER_MODAL_20260821__) return;
  global.__QMES_PARTNER_REGISTER_MODAL_20260821__=true;

  const text=value=>String(value??'').replace(/\s+/g,' ').trim();
  const typeOf=button=>{
    const label=text(button?.textContent);
    if(label.includes('고객사 등록')) return 'customer';
    if(label.includes('공급업체 등록')) return 'supplier';
    return '';
  };
  const nextCode=(prefix,rows)=>`${prefix}${String(Math.max(0,...(rows||[]).map(row=>Number(String(row?.code||'').replace(/\D/g,''))||0))+1).padStart(3,'0')}`;
  const closeModal=()=>document.getElementById('qmes-partner-register-hard-modal')?.remove();
  const defaultCustomers=[
    {code:'CUS001',name:'현대자동차',status:'거래중'},
    {code:'CUS002',name:'삼성SDI',status:'거래중'},
    {code:'CUS003',name:'LG에너지솔루션',status:'거래중'},
    {code:'CUS004',name:'SK온',status:'거래중'}
  ];

  const style=document.createElement('style');
  style.textContent=`
    #qmes-partner-register-hard-modal{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(2,6,23,.76);backdrop-filter:blur(3px)}
    #qmes-partner-register-hard-modal .qpr-box{width:min(610px,96vw);max-height:90vh;overflow:auto;border:1px solid #475569;border-radius:16px;background:#111f33;box-shadow:0 24px 70px rgba(0,0,0,.55);font-family:Pretendard,sans-serif}
    #qmes-partner-register-hard-modal .qpr-head{display:flex;align-items:center;padding:17px 19px;border-bottom:1px solid #334155}
    #qmes-partner-register-hard-modal .qpr-title{color:#f8fafc;font-size:18px;font-weight:900}
    #qmes-partner-register-hard-modal .qpr-body{display:grid;grid-template-columns:1fr 1fr;gap:13px;padding:19px}
    #qmes-partner-register-hard-modal .qpr-field{display:grid;gap:6px;color:#cbd5e1;font-size:13px;font-weight:800}
    #qmes-partner-register-hard-modal .qpr-field.full{grid-column:1/-1}
    #qmes-partner-register-hard-modal input,#qmes-partner-register-hard-modal select,#qmes-partner-register-hard-modal textarea{width:100%;box-sizing:border-box;border:1px solid #475569;border-radius:8px;background:#0f172a;color:#f8fafc;padding:0 10px;font:700 13px Pretendard,sans-serif;outline:none}
    #qmes-partner-register-hard-modal input,#qmes-partner-register-hard-modal select{height:40px}
    #qmes-partner-register-hard-modal textarea{min-height:78px;padding:10px;resize:vertical}
    #qmes-partner-register-hard-modal .qpr-code{background:#18263a!important;color:#94a3b8!important}
    #qmes-partner-register-hard-modal .qpr-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 19px;border-top:1px solid #334155}
    #qmes-partner-register-hard-modal button{height:38px;padding:0 16px;border-radius:8px;font-weight:900;cursor:pointer}
    #qmes-partner-register-hard-modal .qpr-cancel{border:1px solid #64748b;background:#17263b;color:#e2e8f0}
    #qmes-partner-register-hard-modal .qpr-save{border:0;background:#0e7490;color:#fff}
    #qmes-partner-register-hard-modal .qpr-x{margin-left:auto;width:34px;padding:0;border:1px solid #475569;background:#17263b;color:#e2e8f0;font-size:22px}
    @media(max-width:620px){#qmes-partner-register-hard-modal .qpr-body{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const makeInput=(placeholder,value='')=>{const el=document.createElement('input');el.placeholder=placeholder;el.value=value;return el;};
  const makeSelect=()=>{const el=document.createElement('select');['거래중','거래중지'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o);});return el;};
  const field=(label,control,full=false)=>{const wrap=document.createElement('label');wrap.className='qpr-field'+(full?' full':'');const cap=document.createElement('span');cap.textContent=label;wrap.append(cap,control);return wrap;};
  const saveDb=()=>{try{if(typeof global.dbSave==='function') global.dbSave();}catch(error){console.warn('[QMES] 거래처 저장 실패',error);}};

  function openCustomerModal(){
    closeModal();
    if(!global.DB){alert('데이터 저장소를 불러오지 못했습니다.');return;}
    const existing=Array.isArray(global.DB.partnerCustomers)&&global.DB.partnerCustomers.length?global.DB.partnerCustomers:defaultCustomers;
    const code=nextCode('CUS',existing);
    const overlay=document.createElement('div');overlay.id='qmes-partner-register-hard-modal';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','고객사 등록');
    const box=document.createElement('div');box.className='qpr-box';
    const head=document.createElement('div');head.className='qpr-head';
    const title=document.createElement('strong');title.className='qpr-title';title.textContent='고객사 등록';
    const x=document.createElement('button');x.type='button';x.className='qpr-x';x.textContent='×';x.onclick=closeModal;head.append(title,x);
    const body=document.createElement('div');body.className='qpr-body';
    const codeInput=makeInput('',code);codeInput.readOnly=true;codeInput.className='qpr-code';
    const name=makeInput('고객사명');
    const manager=makeInput('담당자명');
    const phone=makeInput('연락처');
    const status=makeSelect();
    const note=document.createElement('textarea');note.placeholder='비고 (선택)';
    body.append(field('고객사 코드',codeInput),field('고객사명',name),field('담당자',manager),field('연락처',phone),field('거래상태',status),field('비고',note,true));
    const foot=document.createElement('div');foot.className='qpr-foot';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='qpr-cancel';cancel.textContent='취소';cancel.onclick=closeModal;
    const save=document.createElement('button');save.type='button';save.className='qpr-save';save.textContent='등록';
    save.onclick=()=>{
      const customer=text(name.value);if(!customer){alert('고객사명을 입력하세요.');name.focus();return;}
      const rows=Array.isArray(global.DB.partnerCustomers)&&global.DB.partnerCustomers.length?global.DB.partnerCustomers.slice():defaultCustomers.map(row=>({...row}));
      if(rows.some(row=>text(row.name).toLowerCase()===customer.toLowerCase())){alert('이미 등록된 고객사입니다.');return;}
      rows.push({code,name:customer,manager:text(manager.value),phone:text(phone.value),status:status.value||'거래중',note:text(note.value)});
      global.DB.partnerCustomers=rows;saveDb();closeModal();setTimeout(()=>location.reload(),60);
    };
    foot.append(cancel,save);box.append(head,body,foot);overlay.append(box);overlay.addEventListener('mousedown',e=>{if(e.target===overlay)closeModal();});document.body.appendChild(overlay);requestAnimationFrame(()=>name.focus());
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');
    if(typeOf(button)!=='customer') return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    openCustomerModal();
  },true);
})(window);
