(function(){
  'use strict';
  if(window.__QMES_TEST_UI_RECOVERY_20260910__) return;
  window.__QMES_TEST_UI_RECOVERY_20260910__=true;

  const clean=value=>String(value||'').replace(/[›〉▣]/g,'').replace(/\s+/g,' ').trim();
  const routeMap={
    '통합 대시보드':{tab:'dash'},
    'SPC 대시보드':{tab:'spc'},
    '수주 · 납기관리':{tab:'erpSales'},
    '생산계획 · MRP':{tab:'erpPlan'},
    '구매 · 발주관리':{tab:'erpPurchase'},
    '재고현황':{tab:'inv',section:'overview'},
    '입출고 관리':{tab:'inv',section:'movement'},
    'LOT별 재고':{tab:'inv',section:'lot'},
    '생산투입/완료':{tab:'inv',section:'production'},
    '재고실사':{tab:'inv',section:'count'},
    '거래처 현황':{tab:'partners'},
    '생산 진행':{tab:'prod',openMenu:'productionMenu'},
    '작업지시서':{tab:'woIssue',openMenu:'productionMenu'},
    '생산공정 관리':{tab:'prodProcess',openMenu:'productionMenu'},
    '수입검사 (IQC)':{tab:'iqc',openMenu:'qualityMenu'},
    '공정검사 (PQC)':{tab:'pqc',openMenu:'qualityMenu'},
    '출하검사 (OQC)':{tab:'oqc',openMenu:'qualityMenu'},
    'SPC (Cpk)':{tab:'spc',openMenu:'qualityMenu'},
    '품질 인터락':{tab:'lock',openMenu:'qualityMenu'},
    '출하성적서':{tab:'coa',openMenu:'qualityMenu'},
    'LOT 통합추적':{tab:'trace'},
    '출하 · 납품관리':{tab:'erpShipping'},
    '부적합 (8D)':{tab:'ncr',openMenu:'nonconformityMenu'},
    '고객불만 (GQMS)':{tab:'cc',openMenu:'nonconformityMenu'},
    '4M 변경관리':{tab:'4m',openMenu:'nonconformityMenu'},
    '현장 입력 (iPad)':{tab:'pop'},
    '설비 모니터링':{tab:'eq'},
    '회원등록 현황':{tab:'members'}
  };

  function setActiveLabel(label){
    const side=document.getElementById('qmes-erp-sidebar');
    if(!side) return;
    side.querySelectorAll('.qmes-erp-item').forEach(button=>{
      const active=clean(button.querySelector('.qmes-erp-text')?.textContent||button.textContent)===label;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-current',active?'page':'false');
    });
  }

  function dispatchRoute(config,label){
    if(!config||!config.tab) return;
    try{
      sessionStorage.setItem('qmes_current_tab',config.tab);
      if(config.openMenu) sessionStorage.setItem('qmes_open_menu',config.openMenu);
      else sessionStorage.removeItem('qmes_open_menu');
      if(config.section) sessionStorage.setItem('qmes_inventory_section',config.section);
      sessionStorage.setItem('qmes_erp_active_label',label);
    }catch(_error){}

    setActiveLabel(label);
    const detail={tab:config.tab,openMenu:config.openMenu||null,source:'qmes-test-ui-recovery'};
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail}));

    if(config.section){
      const fireSection=()=>window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:config.section}}));
      requestAnimationFrame(fireSection);
      setTimeout(fireSection,80);
    }

    if(/^erp/.test(config.tab)){
      setTimeout(()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail})),120);
      setTimeout(()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail})),450);
    }
  }

  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('#qmes-erp-sidebar .qmes-erp-item'):null;
    if(!button) return;
    const label=clean(button.querySelector('.qmes-erp-text')?.textContent||button.textContent);
    const config=routeMap[label];
    if(!config) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    dispatchRoute(config,label);
  },true);

  function removeNode(id){document.getElementById(id)?.remove();}
  function closeAllPopups(){removeNode('qmes-test-alert-panel');removeNode('qmes-test-password-modal');}

  function createPasswordModal(){
    removeNode('qmes-test-password-modal');
    const overlay=document.createElement('div');
    overlay.id='qmes-test-password-modal';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','비밀번호 변경');
    overlay.innerHTML=`
      <div class="qmes-test-modal-card">
        <div class="qmes-test-modal-head">
          <div><b>비밀번호 변경</b><span>계정 보안을 위해 새 비밀번호를 설정합니다.</span></div>
          <button type="button" class="qmes-test-modal-close" aria-label="닫기">×</button>
        </div>
        <form class="qmes-test-password-form">
          <label>현재 비밀번호<input type="password" name="currentPassword" autocomplete="current-password" required></label>
          <label>새 비밀번호<input type="password" name="newPassword" autocomplete="new-password" minlength="4" required></label>
          <label>새 비밀번호 확인<input type="password" name="confirmPassword" autocomplete="new-password" minlength="4" required></label>
          <div class="qmes-test-password-note">TEST 보호모드에서는 운영 계정 비밀번호가 실제로 변경되지 않도록 저장 요청이 차단될 수 있습니다.</div>
          <div class="qmes-test-password-error" aria-live="polite"></div>
          <div class="qmes-test-modal-actions"><button type="button" class="qmes-test-cancel">취소</button><button type="submit" class="qmes-test-primary">변경 저장</button></div>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    const close=()=>overlay.remove();
    overlay.querySelector('.qmes-test-modal-close').addEventListener('click',close);
    overlay.querySelector('.qmes-test-cancel').addEventListener('click',close);
    overlay.addEventListener('mousedown',event=>{if(event.target===overlay)close();});
    const form=overlay.querySelector('.qmes-test-password-form');
    const errorBox=overlay.querySelector('.qmes-test-password-error');
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      errorBox.textContent='';
      const currentPassword=form.currentPassword.value;
      const newPassword=form.newPassword.value;
      const confirmPassword=form.confirmPassword.value;
      if(newPassword.length<4){errorBox.textContent='새 비밀번호는 4자 이상 입력하세요.';return;}
      if(newPassword!==confirmPassword){errorBox.textContent='새 비밀번호 확인이 일치하지 않습니다.';return;}
      const submit=form.querySelector('[type="submit"]');
      submit.disabled=true;submit.textContent='확인 중...';
      try{
        const response=await fetch('/api/auth/password',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok||!payload.success){
          if(payload.code==='QMES_TEST_LIVE_WRITE_BLOCKED') errorBox.textContent='화면 동작은 정상입니다. TEST 보호모드에서 운영 비밀번호 변경은 차단되어 있습니다.';
          else errorBox.textContent=payload.message||'비밀번호 변경을 완료하지 못했습니다.';
          return;
        }
        alert('비밀번호가 변경되었습니다.');
        close();
      }catch(error){errorBox.textContent='비밀번호 변경 요청 중 오류가 발생했습니다.';}
      finally{submit.disabled=false;submit.textContent='변경 저장';}
    });
    setTimeout(()=>form.currentPassword.focus(),0);
  }

  async function logoutNow(){
    try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});}catch(_error){}
    try{
      sessionStorage.removeItem('qmes-current-user-v1');
      sessionStorage.removeItem('qmes_current_tab');
      sessionStorage.removeItem('qmes_open_menu');
      sessionStorage.removeItem('qmes_erp_active_label');
    }catch(_error){}
    window.location.replace('/');
  }

  function alertRows(){
    try{
      if(typeof window.qmesDashAlerts==='function'){
        const rows=window.qmesDashAlerts();
        if(Array.isArray(rows)) return rows.slice(0,8);
      }
      if(typeof qmesDashAlerts==='function'){
        const rows=qmesDashAlerts();
        if(Array.isArray(rows)) return rows.slice(0,8);
      }
    }catch(_error){}
    return [];
  }

  function openAlertPanel(button){
    const existing=document.getElementById('qmes-test-alert-panel');
    if(existing){existing.remove();return;}
    const panel=document.createElement('div');
    panel.id='qmes-test-alert-panel';
    const rows=alertRows();
    panel.innerHTML=`<div class="qmes-test-alert-head"><b>알림</b><span>QMES 업무 알림</span></div><div class="qmes-test-alert-body"></div>`;
    const body=panel.querySelector('.qmes-test-alert-body');
    if(!rows.length){body.innerHTML='<div class="qmes-test-alert-empty">새로운 알림이 없습니다.</div>';}
    else rows.forEach(row=>{
      const item=document.createElement('div');
      item.className='qmes-test-alert-item';
      item.textContent=String(row?.text||row?.message||row?.action||'확인 필요');
      body.appendChild(item);
    });
    document.body.appendChild(panel);
    const rect=button.getBoundingClientRect();
    panel.style.top=Math.round(rect.bottom+8)+'px';
    panel.style.right=Math.max(12,Math.round(window.innerWidth-rect.right))+'px';
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    const password=target.closest('#qmes-erp-header [data-qmes-account-action="password"]');
    if(password){
      // Let the native QMES account handler open the real password dialog.
      // The custom recovery overlay previously swallowed the click and made the screen appear frozen.
      removeNode('qmes-test-password-modal');
      return;
    }
    const logout=target.closest('#qmes-erp-header [data-qmes-account-action="logout"]');
    if(logout){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();logoutNow();return;}
    const notice=target.closest('#qmes-erp-header .qmes-visible-notice-button');
    if(notice){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openAlertPanel(notice);return;}
    if(!target.closest('#qmes-test-alert-panel')&&!target.closest('#qmes-erp-header .qmes-visible-notice-button')) removeNode('qmes-test-alert-panel');
  },true);

  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAllPopups();});

  const style=document.createElement('style');
  style.id='qmes-test-ui-recovery-style-20260910';
  style.textContent=`
    #qmes-test-password-modal{position:fixed;inset:0;z-index:20050;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,35,52,.52);backdrop-filter:blur(2px);font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif}
    #qmes-test-password-modal .qmes-test-modal-card{width:min(440px,calc(100vw - 32px));background:#fff;border:1px solid #d7e1e8;border-radius:14px;box-shadow:0 24px 70px rgba(26,59,82,.28);overflow:hidden}
    #qmes-test-password-modal .qmes-test-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 16px;border-bottom:1px solid #e6edf2;background:#f8fbfd}
    #qmes-test-password-modal .qmes-test-modal-head b{display:block;color:#193b55;font-size:18px;font-weight:900}
    #qmes-test-password-modal .qmes-test-modal-head span{display:block;margin-top:5px;color:#738594;font-size:11px;font-weight:650}
    #qmes-test-password-modal .qmes-test-modal-close{width:32px;height:32px;border:1px solid #d4dfe7;border-radius:7px;background:#fff;color:#5d7485;font-size:20px;cursor:pointer}
    #qmes-test-password-modal form{padding:20px 22px 22px}
    #qmes-test-password-modal label{display:block;margin:0 0 14px;color:#40586b;font-size:12px;font-weight:800}
    #qmes-test-password-modal input{display:block;width:100%;height:42px;margin-top:6px;padding:0 11px;border:1px solid #bccbd6;border-radius:7px;background:#fff;color:#263d4f;font-size:13px;box-sizing:border-box;outline:none}
    #qmes-test-password-modal input:focus{border-color:#4b91bf;box-shadow:0 0 0 3px rgba(75,145,191,.12)}
    #qmes-test-password-modal .qmes-test-password-note{padding:9px 10px;border-radius:7px;background:#f4f8fb;color:#607789;font-size:10.5px;font-weight:650;line-height:1.5}
    #qmes-test-password-modal .qmes-test-password-error{min-height:18px;margin-top:8px;color:#b42318;font-size:11px;font-weight:750;line-height:1.45}
    #qmes-test-password-modal .qmes-test-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
    #qmes-test-password-modal .qmes-test-modal-actions button{height:38px;min-width:92px;padding:0 14px;border-radius:7px;font-size:12px;font-weight:850;cursor:pointer}
    #qmes-test-password-modal .qmes-test-cancel{border:1px solid #cbd8e2;background:#fff;color:#4a6274}
    #qmes-test-password-modal .qmes-test-primary{border:1px solid #2f78b7;background:#2f78b7;color:#fff}
    #qmes-test-password-modal .qmes-test-primary:disabled{opacity:.6;cursor:wait}
    #qmes-test-alert-panel{position:fixed;z-index:20040;width:330px;max-width:calc(100vw - 24px);border:1px solid #cbd8e2;border-radius:10px;background:#fff;box-shadow:0 18px 45px rgba(37,76,105,.22);overflow:hidden;font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif}
    #qmes-test-alert-panel .qmes-test-alert-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5edf2;background:#f8fbfd}
    #qmes-test-alert-panel .qmes-test-alert-head b{color:#24465f;font-size:13px;font-weight:900}
    #qmes-test-alert-panel .qmes-test-alert-head span{color:#80909c;font-size:9.5px;font-weight:700}
    #qmes-test-alert-panel .qmes-test-alert-body{max-height:330px;overflow:auto;padding:7px}
    #qmes-test-alert-panel .qmes-test-alert-item{padding:10px 11px;border-radius:7px;background:#f7fafc;color:#455e71;font-size:11px;font-weight:700;line-height:1.45}
    #qmes-test-alert-panel .qmes-test-alert-item+.qmes-test-alert-item{margin-top:5px}
    #qmes-test-alert-panel .qmes-test-alert-empty{padding:24px 12px;text-align:center;color:#8596a3;font-size:11px;font-weight:700}
  `;
  document.head.appendChild(style);

  window.__QMES_TEST_NAVIGATE__=(label)=>dispatchRoute(routeMap[label],label);
})();