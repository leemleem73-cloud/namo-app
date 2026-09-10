(function(){
  'use strict';
  if(window.__QMES_ACCESS_PERMISSIONS_20260910__)return;
  window.__QMES_ACCESS_PERMISSIONS_20260910__=true;

  const LABEL_TO_KEY={
    '통합 대시보드':'dashboard','SPC 대시보드':'spcDashboard',
    '수주 · 납기관리':'erpSales','수주·납기관리':'erpSales','생산계획 · MRP':'erpPlan','생산계획·MRP':'erpPlan','구매 · 발주관리':'erpPurchase','구매·발주관리':'erpPurchase','재고현황':'inventoryOverview','입출고 관리':'inventoryMovement','LOT별 재고':'inventoryLot','생산투입/완료':'inventoryProduction','재고실사':'inventoryCount','거래처 현황':'partners',
    '생산 진행':'production','작업지시서':'workorder','생산공정 관리':'prodProcess','수입검사 (IQC)':'iqc','수입검사':'iqc','공정검사 (PQC)':'pqc','공정검사':'pqc','출하검사 (OQC)':'oqc','출하검사':'oqc','SPC (Cpk)':'spc','SPC':'spc','품질 인터락':'qualityLock','출하성적서':'coa','LOT 통합추적':'trace','출하 · 납품관리':'erpShipping','출하·납품관리':'erpShipping','부적합 (8D)':'ncr','부적합':'ncr','고객불만 (GQMS)':'complaints','고객불만':'complaints','4M 변경관리':'change4m','현장 입력 (iPad)':'fieldInput','현장 입력':'fieldInput','설비 모니터링':'equipment'
  };
  const MENU_GROUPS=[
    {title:'ERP',items:[['erpSales','수주·납기관리'],['erpPlan','생산계획·MRP'],['erpPurchase','구매·발주관리'],['inventoryOverview','재고현황'],['inventoryMovement','입출고 관리'],['inventoryLot','LOT별 재고'],['inventoryProduction','생산투입/완료'],['inventoryCount','재고실사'],['partners','거래처 현황']]},
    {title:'MES · QMS',items:[['production','생산 진행'],['workorder','작업지시서'],['prodProcess','생산공정 관리'],['iqc','수입검사'],['pqc','공정검사'],['oqc','출하검사'],['spc','SPC'],['qualityLock','품질 인터락'],['coa','출하성적서'],['trace','LOT 통합추적'],['erpShipping','출하·납품관리'],['ncr','부적합'],['complaints','고객불만'],['change4m','4M 변경관리'],['fieldInput','현장 입력'],['equipment','설비 모니터링']]}
  ];

  let accessState=null;
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=async(url,options={})=>{
    const headers={...(options.headers||{})};
    if(options.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,headers});
    const payload=await response.json().catch(()=>({success:false,message:`HTTP ${response.status}`}));
    if(!response.ok||!payload?.success)throw new Error(payload?.message||'요청 처리에 실패했습니다.');
    return payload.data;
  };

  function keyForButton(button){
    const label=clean(button?.querySelector('.qmes-erp-text')?.textContent||button?.textContent);
    return LABEL_TO_KEY[label]||null;
  }
  function canUseKey(key){
    if(!key)return true;
    if(accessState?.systemAdmin)return true;
    const effective=new Set(accessState?.effective||[]);
    return effective.has('*')||effective.has(key);
  }
  function enforceSidebar(){
    const side=document.getElementById('qmes-erp-sidebar');
    if(!side||!accessState)return;
    side.querySelectorAll('.qmes-erp-item').forEach(button=>{
      const key=keyForButton(button);
      if(!key)return;
      const allowed=canUseKey(key);
      button.hidden=!allowed;
      button.style.display=allowed?'':'none';
      button.setAttribute('aria-hidden',allowed?'false':'true');
    });
    side.querySelectorAll('.qmes-erp-section').forEach(section=>{
      let next=section.nextElementSibling,any=false;
      while(next&&!next.classList.contains('qmes-erp-section')){
        if(next.classList.contains('qmes-erp-item')&&next.style.display!=='none'&&!next.hidden)any=true;
        next=next.nextElementSibling;
      }
      section.style.display=any?'':'none';
    });
  }
  function guardNavigation(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('#qmes-erp-sidebar .qmes-erp-item');
      if(!button)return;
      const key=keyForButton(button);
      if(key&&!canUseKey(key)){
        event.preventDefault();event.stopImmediatePropagation();
        alert('이 메뉴에 대한 접근 권한이 없습니다.');
      }
    },true);
  }
  async function loadMine(){
    try{accessState=await api('/api/access/me');enforceSidebar();}
    catch(error){console.warn('[QMES access] current access unavailable',error.message);}
  }

  function ensureStyle(){
    if(document.getElementById('qmes-access-style-20260910'))return;
    const style=document.createElement('style');
    style.id='qmes-access-style-20260910';
    style.textContent=`
      #qmes-erp-sidebar .qmes-erp-nav{overscroll-behavior:contain!important;scrollbar-width:auto!important}
      #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:8px!important}
      #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:#b9c8d3!important;border-radius:8px!important}
      html,body{overscroll-behavior-y:auto!important}
      #qmes-access-modal{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.45);font-family:Pretendard,'Noto Sans KR','Malgun Gothic',sans-serif}
      #qmes-access-modal *{box-sizing:border-box}
      #qmes-access-modal .qa-card{width:min(920px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #ced9e2;border-radius:14px;background:#fff;box-shadow:0 24px 80px rgba(15,23,42,.3)}
      #qmes-access-modal .qa-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid #dfe7ed;background:#f8fafc}
      #qmes-access-modal .qa-title{margin:0;font-size:18px;font-weight:900;color:#203746}.qa-sub{margin-top:4px;color:#5f7180;font-size:12px;font-weight:650}
      #qmes-access-modal .qa-close{margin-left:auto;width:34px;height:34px;border:0;border-radius:7px;background:#edf2f6;color:#40586a;font-size:22px;cursor:pointer}
      #qmes-access-modal .qa-body{overflow:auto;padding:16px 18px}.qa-section{margin-bottom:14px;border:1px solid #dbe4ea;border-radius:9px;overflow:hidden}.qa-section h3{margin:0;padding:10px 12px;background:#f7f9fb;border-bottom:1px solid #e2e8ed;color:#29485f;font-size:13px;font-weight:900}.qa-section-body{padding:12px}.qa-check{display:flex;align-items:center;gap:8px;min-height:32px;color:#304858;font-size:13px;font-weight:700}.qa-check input{width:16px;height:16px}.qa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px 12px}.qa-system{padding:10px 12px;border-radius:7px;background:#fff6e8;color:#875a12;font-size:12px;font-weight:750;line-height:1.5}.qa-foot{display:flex;align-items:center;gap:8px;padding:13px 18px;border-top:1px solid #e2e8ed;background:#fff}.qa-foot .spacer{flex:1}.qa-btn{height:36px;padding:0 13px;border-radius:7px;border:1px solid #b9c7d1;background:#fff;color:#344d5e;font-size:12px;font-weight:850;cursor:pointer}.qa-btn.primary{border-color:#0b8fc7;background:#0b8fc7;color:#fff}.qa-btn:disabled{opacity:.5;cursor:not-allowed}
      .qmes-db-member-row-actions .qmes-access-trigger{display:inline-flex!important;align-items:center!important;justify-content:center!important;visibility:visible!important;opacity:1!important;border:1px solid #8dbbd0!important;background:#f0f9fd!important;color:#12698d!important}
      @media(max-width:720px){#qmes-access-modal{padding:8px;align-items:flex-start}.qa-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:480px){.qa-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function closeModal(){document.getElementById('qmes-access-modal')?.remove();}
  async function openPermission(user){
    ensureStyle();
    let data;
    try{data=await api('/api/access/users/by-name?name='+encodeURIComponent(user.name));}
    catch(error){alert(error.message);return;}
    if(data.systemAdmin){alert('시스템 관리자는 모든 메뉴와 SYSTEM 기능이 자동 허용됩니다.');return;}
    closeModal();
    const modal=document.createElement('div');modal.id='qmes-access-modal';
    const extras=new Set(data.permissions||[]),defaults=new Set(data.departmentDefaults||[]);
    modal.innerHTML=`<div class="qa-card" role="dialog" aria-modal="true" aria-label="접근권한 설정">
      <div class="qa-head"><div><h2 class="qa-title">접근권한 설정</h2><div class="qa-sub">${esc(data.user.name)} / ${esc(data.user.department||'-')} / ${esc(data.user.title||'-')}</div></div><button class="qa-close" type="button" aria-label="닫기">×</button></div>
      <div class="qa-body">
        <section class="qa-section"><h3>기본 권한</h3><div class="qa-section-body"><label class="qa-check"><input type="checkbox" data-dept-default ${data.departmentDefault?'checked':''}> ${esc(data.user.department||'부서')} 기본권한 적용</label><div class="qa-system">부서 기본권한은 자동 적용됩니다. 아래 체크박스는 추가 접근 권한입니다.</div></div></section>
        ${MENU_GROUPS.map(group=>`<section class="qa-section"><h3>${esc(group.title)}</h3><div class="qa-section-body qa-grid">${group.items.map(([key,label])=>`<label class="qa-check" title="${defaults.has(key)?'부서 기본권한 포함':''}"><input type="checkbox" data-perm="${key}" ${extras.has(key)?'checked':''}> ${esc(label)}${defaults.has(key)?' <small style="color:#7a8b98">(기본)</small>':''}</label>`).join('')}</div></section>`).join('')}
        <section class="qa-section"><h3>SYSTEM</h3><div class="qa-section-body"><div class="qa-system">회원등록 현황 · 권한관리 · 비밀번호 초기화는 <b>시스템 관리자 전용</b>입니다. 일반 직원에게 메뉴 권한을 추가해도 열리지 않습니다.</div></div></section>
      </div>
      <div class="qa-foot"><button type="button" class="qa-btn" data-all>전체 선택</button><button type="button" class="qa-btn" data-none>전체 해제</button><div class="spacer"></div><button type="button" class="qa-btn" data-cancel>취소</button><button type="button" class="qa-btn primary" data-save>저장</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.qa-close').onclick=closeModal;modal.querySelector('[data-cancel]').onclick=closeModal;
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    modal.querySelector('[data-all]').onclick=()=>modal.querySelectorAll('[data-perm]').forEach(input=>input.checked=true);
    modal.querySelector('[data-none]').onclick=()=>modal.querySelectorAll('[data-perm]').forEach(input=>input.checked=false);
    modal.querySelector('[data-save]').onclick=async()=>{
      const save=modal.querySelector('[data-save]');save.disabled=true;save.textContent='저장 중...';
      try{
        const permissions=Array.from(modal.querySelectorAll('[data-perm]:checked')).map(input=>input.dataset.perm);
        await api('/api/access/users/by-name?name='+encodeURIComponent(user.name),{method:'PUT',body:JSON.stringify({departmentDefault:modal.querySelector('[data-dept-default]').checked,permissions})});
        closeModal();alert(`${user.name}님의 접근권한이 저장되었습니다.`);
      }catch(error){alert(error.message);save.disabled=false;save.textContent='저장';}
    };
  }
  window.qmesOpenAccessPermission=openPermission;

  function patchMemberRows(){
    const table=document.querySelector('.qmes-db-member-table');
    if(table){
      table.querySelectorAll('thead th').forEach(th=>{if(clean(th.textContent)==='권한')th.textContent='계정등급';});
    }
    const rows=document.querySelectorAll('.qmes-db-member-table tbody tr');
    rows.forEach(row=>{
      const actions=row.querySelector('.qmes-db-member-row-actions');
      if(!actions)return;
      const cells=row.querySelectorAll('td');
      const name=clean(cells[1]?.textContent);if(!name)return;
      const badge=cells[6]?.querySelector('.qmes-db-member-badge');
      const isAdmin=!!badge?.classList.contains('admin')||/^(관리자|시스템 관리자)$/.test(clean(badge?.textContent||cells[6]?.textContent));
      if(badge)badge.textContent=isAdmin?'시스템 관리자':'일반 직원';
      const existing=actions.querySelector('.qmes-access-trigger');
      if(isAdmin){if(existing)existing.remove();return;}
      if(existing)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='qmes-db-member-btn qmes-access-trigger';
      btn.textContent='접근권한 설정';
      btn.setAttribute('data-qmes-access-name',name);
      btn.onclick=()=>openPermission({name});
      const reset=Array.from(actions.querySelectorAll('button')).find(b=>clean(b.textContent)==='비밀번호 초기화');
      if(reset)reset.insertAdjacentElement('afterend',btn);else actions.appendChild(btn);
    });
    document.querySelectorAll('.qmes-db-member-grid select').forEach(select=>{
      if(Array.from(select.options||[]).some(o=>o.value==='admin')){
        const field=select.closest('.qmes-db-member-field');if(field)field.style.display='none';
      }
    });
  }

  function isolateWheel(){
    const bind=()=>{
      const nav=document.querySelector('#qmes-erp-sidebar .qmes-erp-nav');
      if(!nav||nav.dataset.qmesWheelIsolated)return;
      nav.dataset.qmesWheelIsolated='1';
      nav.addEventListener('wheel',event=>{
        const before=nav.scrollTop;nav.scrollTop+=event.deltaY;
        if(nav.scrollTop!==before){event.preventDefault();event.stopPropagation();}
      },{passive:false});
    };bind();setInterval(bind,1200);
  }

  ensureStyle();guardNavigation();loadMine();isolateWheel();patchMemberRows();
  setInterval(()=>{enforceSidebar();patchMemberRows();},1000);
  window.addEventListener('qmes:login',loadMine);window.addEventListener('storage',loadMine);
})();
