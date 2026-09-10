'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-10.
// Production keeps the current QMES modules and applies the validated TEST UI fixes at startup.
const fs = require('fs');
const path = require('path');

require('./attendance-core-safe.js');
require('./attendance-correction-safe.js');
require('./attendance-leave-cancel-safe.js');
require('./attendance-admin-overview-safe.js');
require('./mobile-hard-entry-preload.js');
require('./mobile-static-preload.js');
require('./member-email-sync-preload.js');

const publicIndex = path.resolve(__dirname, 'public', 'index.html');
const publicRouter = path.resolve(__dirname, 'public', 'js', 'router.jsx');
const publicShellMenu = path.resolve(__dirname, 'public', 'js', 'qmes-collapsible-side-menu.js');
const productionUiPatch = path.resolve(__dirname, 'public', 'js', 'qmes-production-ui-20260910.js');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);
const retiredWorkorderUi = path.resolve(__dirname, 'public', 'js', 'workorder-ui-refinement.js');

const SHELL_BUILD = '20260910-prod-ui-final1';
const MEMBERS_ASSET_BUILD = '20260904-member-edit-native2';
const MEMBER_FALLBACK_BUILD = '20260904-pc-edit-hard5';
const MEMBER_LINK_BUILD = '20260904-native2';
const DASHBOARD_ASSET_BUILD = '20260904-enterprise-only12';
const MOBILE_URL = '/mobile.html?v=20260903-mobile-dedicated1';

try {
  fs.writeFileSync(retiredWorkorderUi, `/* Retired legacy workorder UI refinement — startup enforced. */
(function(){
  "use strict";
  window.__QMES_WORKORDER_UI_REFINEMENT__ = true;
})();
`, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to retire legacy workorder UI refinement:', error);
  process.exit(1);
}

const qmesProductionUiPatchSource = String.raw`(function(){
  'use strict';
  if(window.__QMES_PRODUCTION_UI_20260910__)return;
  window.__QMES_PRODUCTION_UI_20260910__=true;

  const MOBILE_URL='/mobile.html?v=20260903-mobile-dedicated1';
  const SESSION_KEY='qmes-current-user-v1';
  const clean=value=>String(value==null?'':value).replace(/[›〉▣]/g,'').replace(/\s+/g,' ').trim();
  const readUser=()=>{try{return window.__QMES_CURRENT_USER__||JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch(_error){return window.__QMES_CURRENT_USER__||null;}};
  const normalizedName=value=>/^임+흥배$/.test(String(value||'').replace(/\s+/g,''))?'임흥배':String(value||'').trim();
  const accountText=()=>{
    const user=readUser()||{};
    const name=normalizedName(user.name||user.uid||'사용자');
    const rawDept=String(user.department||user.dept||'').replace(/\s+/g,'').trim();
    const dept=name==='임흥배'?'품질부':rawDept;
    return dept?name+'('+dept+')':name;
  };
  const isLoggedIn=()=>Boolean(readUser());

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

  function ensureStyle(){
    if(document.getElementById('qmes-production-ui-style-20260910'))return;
    const style=document.createElement('style');
    style.id='qmes-production-ui-style-20260910';
    style.textContent=
      'html body #qmes-erp-header{gap:7px!important;padding-right:14px!important;overflow:visible!important}'+
      'html body #qmes-erp-header .qmes-erp-header-spacer{min-width:10px!important}'+
      'html body #qmes-erp-header .qmes-erp-header-clock{width:92px!important;flex:0 0 92px!important;font-size:11.5px!important;font-weight:800!important}'+
      'html body #qmes-erp-header .qmes-erp-header-mobile{width:96px!important;min-width:96px!important;flex:0 0 96px!important;height:36px!important;padding:0 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#2d5f82!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:11.5px!important;font-weight:800!important;white-space:nowrap!important}'+
      'html body #qmes-erp-header .qmes-visible-notice-button{width:76px!important;min-width:76px!important;flex:0 0 76px!important;height:36px!important;padding:0 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#2d5f82!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:11.5px!important;font-weight:800!important;white-space:nowrap!important}'+
      'html body #qmes-erp-header .qmes-visible-notice-button svg,html body #qmes-erp-header .qmes-erp-header-mobile svg{width:16px!important;height:16px!important;flex:none!important}'+
      'html body #qmes-erp-header .qmes-prod-account-wrap{position:relative!important;width:150px!important;min-width:150px!important;flex:0 0 150px!important;height:36px!important;overflow:visible!important;z-index:13120!important}'+
      'html body #qmes-erp-header .qmes-prod-account-wrap:after{content:"";position:absolute;left:0;right:0;top:34px;height:10px;background:transparent;pointer-events:auto}'+
      'html body #qmes-erp-header .qmes-erp-header-account{width:150px!important;min-width:150px!important;max-width:150px!important;height:36px!important;padding:0 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#29485f!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:12px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}'+
      'html body #qmes-erp-header .qmes-prod-account-menu{display:none;position:absolute;top:36px;right:0;width:184px;min-width:184px;padding:6px;border:1px solid #cbd8e2;border-radius:8px;background:#fff;box-shadow:0 10px 26px rgba(37,76,105,.2);z-index:13150}'+
      'html body #qmes-erp-header .qmes-prod-account-wrap.is-open .qmes-prod-account-menu{display:block!important}'+
      'html body #qmes-erp-header .qmes-prod-account-menu button{width:100%;height:40px;display:flex;align-items:center;justify-content:flex-start;padding:0 12px;margin:0;border:0;border-radius:6px;background:#fff;color:#334e62;font-size:12px;font-weight:800;text-align:left;white-space:nowrap;cursor:pointer}'+
      'html body #qmes-erp-header .qmes-prod-account-menu button:hover{background:#edf6fb;color:#1e5d88}'+
      'html body #qmes-erp-header .qmes-prod-account-menu button+button{margin-top:3px;border-top:1px solid #edf1f4;color:#a53a34}'+
      'html body #qmes-erp-header .qmes-erp-header-backup,html body #qmes-erp-header .qmes-erp-header-restore{width:56px!important;flex:0 0 56px!important;height:36px!important;padding:0 10px!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#29485f!important;font-size:11.5px!important;font-weight:800!important}'+
      '#qmes-prod-alert-panel{position:fixed;z-index:20040;width:330px;max-width:calc(100vw - 24px);border:1px solid #cbd8e2;border-radius:10px;background:#fff;box-shadow:0 18px 45px rgba(37,76,105,.22);overflow:hidden;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}'+
      '#qmes-prod-alert-panel .head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5edf2;background:#f8fbfd}'+
      '#qmes-prod-alert-panel .head b{color:#24465f;font-size:13px;font-weight:900}#qmes-prod-alert-panel .head span{color:#80909c;font-size:9.5px;font-weight:700}'+
      '#qmes-prod-alert-panel .body{max-height:330px;overflow:auto;padding:7px}#qmes-prod-alert-panel .item{padding:10px 11px;border-radius:7px;background:#f7fafc;color:#455e71;font-size:11px;font-weight:700;line-height:1.45}#qmes-prod-alert-panel .item+.item{margin-top:5px}#qmes-prod-alert-panel .empty{padding:24px 12px;text-align:center;color:#8596a3;font-size:11px;font-weight:700}'+
      '#qmes-prod-password-modal{position:fixed;inset:0;z-index:20050;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,35,52,.52);backdrop-filter:blur(2px);font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}'+
      '#qmes-prod-password-modal .card{width:min(440px,calc(100vw - 32px));background:#fff;border:1px solid #d7e1e8;border-radius:14px;box-shadow:0 24px 70px rgba(26,59,82,.28);overflow:hidden}'+
      '#qmes-prod-password-modal .modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 16px;border-bottom:1px solid #e6edf2;background:#f8fbfd}#qmes-prod-password-modal .modal-head b{display:block;color:#193b55;font-size:18px;font-weight:900}#qmes-prod-password-modal .modal-head span{display:block;margin-top:5px;color:#738594;font-size:11px;font-weight:650}'+
      '#qmes-prod-password-modal .close{width:32px;height:32px;border:1px solid #d4dfe7;border-radius:7px;background:#fff;color:#5d7485;font-size:20px;cursor:pointer}#qmes-prod-password-modal form{padding:20px 22px 22px}#qmes-prod-password-modal label{display:block;margin:0 0 14px;color:#40586b;font-size:12px;font-weight:800}#qmes-prod-password-modal input{display:block;width:100%;height:42px;margin-top:6px;padding:0 11px;border:1px solid #bccbd6;border-radius:7px;background:#fff;color:#263d4f;font-size:13px;box-sizing:border-box;outline:none}#qmes-prod-password-modal input:focus{border-color:#4b91bf;box-shadow:0 0 0 3px rgba(75,145,191,.12)}'+
      '#qmes-prod-password-modal .error{min-height:18px;margin-top:8px;color:#b42318;font-size:11px;font-weight:750;line-height:1.45}#qmes-prod-password-modal .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}#qmes-prod-password-modal .actions button{height:38px;min-width:92px;padding:0 14px;border-radius:7px;font-size:12px;font-weight:850;cursor:pointer}#qmes-prod-password-modal .cancel{border:1px solid #cbd8e2;background:#fff;color:#4a6274}#qmes-prod-password-modal .save{border:1px solid #2f78b7;background:#2f78b7;color:#fff}';
    document.head.appendChild(style);
  }

  function setShellVisibility(){
    const visible=isLoggedIn();
    const header=document.getElementById('qmes-erp-header');
    const side=document.getElementById('qmes-erp-sidebar');
    if(header)header.style.setProperty('display',visible?'flex':'none','important');
    if(side)side.style.setProperty('display',visible?'block':'none','important');
  }

  function ensureHeader(){
    ensureStyle();
    const header=document.getElementById('qmes-erp-header');
    if(!header)return false;

    header.querySelectorAll('.qmes-erp-header-talk').forEach(node=>node.remove());

    const mobile=header.querySelector('.qmes-erp-header-mobile');
    if(mobile){
      mobile.removeAttribute('title');
      mobile.setAttribute('aria-label','모바일 전용');
      let span=mobile.querySelector('span');
      if(!span){span=document.createElement('span');mobile.appendChild(span);}
      span.textContent='모바일 전용';
    }

    const notice=header.querySelector('.qmes-visible-notice-button');
    if(notice){
      notice.removeAttribute('title');
      notice.setAttribute('aria-label','알림');
      let span=notice.querySelector('span');
      if(!span){span=document.createElement('span');notice.appendChild(span);}
      span.textContent='알림';
    }

    let account=header.querySelector('.qmes-erp-header-account');
    if(account){
      account.removeAttribute('title');
      account.setAttribute('aria-label','사용자 메뉴');
      account.textContent=accountText();
      let wrap=account.closest('.qmes-prod-account-wrap');
      if(!wrap){
        wrap=document.createElement('div');
        wrap.className='qmes-prod-account-wrap';
        account.parentNode.insertBefore(wrap,account);
        wrap.appendChild(account);
        const menu=document.createElement('div');
        menu.className='qmes-prod-account-menu';
        menu.setAttribute('role','menu');
        menu.innerHTML='<button type="button" data-qmes-prod-account="password" role="menuitem">비밀번호 변경</button><button type="button" data-qmes-prod-account="logout" role="menuitem">로그아웃</button>';
        wrap.appendChild(menu);
        wrap.addEventListener('mouseenter',()=>wrap.classList.add('is-open'));
        wrap.addEventListener('mouseleave',()=>wrap.classList.remove('is-open'));
      }
    }
    setShellVisibility();
    return true;
  }

  function navigate(label,config){
    if(!config||!config.tab)return;
    try{
      sessionStorage.setItem('qmes_current_tab',config.tab);
      if(config.openMenu)sessionStorage.setItem('qmes_open_menu',config.openMenu);else sessionStorage.removeItem('qmes_open_menu');
      if(config.section)sessionStorage.setItem('qmes_inventory_section',config.section);
      sessionStorage.setItem('qmes_erp_active_label',label);
    }catch(_error){}
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:config.tab,openMenu:config.openMenu||null,source:'production-ui-20260910'}}));
    if(config.section){
      const fire=()=>window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:config.section}}));
      requestAnimationFrame(fire);setTimeout(fire,80);
    }
    if(/^erp/.test(config.tab))setTimeout(()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:config.tab,openMenu:config.openMenu||null,source:'production-ui-20260910-retry'}})),120);
  }

  function alertRows(){
    try{
      const fn=typeof window.qmesDashAlerts==='function'?window.qmesDashAlerts:(typeof qmesDashAlerts==='function'?qmesDashAlerts:null);
      const rows=fn?fn():[];
      return Array.isArray(rows)?rows.slice(0,8):[];
    }catch(_error){return [];}
  }

  function openAlerts(button){
    const current=document.getElementById('qmes-prod-alert-panel');
    if(current){current.remove();return;}
    const rows=alertRows();
    const panel=document.createElement('div');panel.id='qmes-prod-alert-panel';
    panel.innerHTML='<div class="head"><b>알림</b><span>QMES 업무 알림</span></div><div class="body"></div>';
    const body=panel.querySelector('.body');
    if(!rows.length)body.innerHTML='<div class="empty">새로운 알림이 없습니다.</div>';
    else rows.forEach(row=>{const item=document.createElement('div');item.className='item';item.textContent=String(row?.text||row?.message||row?.action||'확인 필요');body.appendChild(item);});
    document.body.appendChild(panel);
    const rect=button.getBoundingClientRect();panel.style.top=Math.round(rect.bottom+8)+'px';panel.style.right=Math.max(12,Math.round(innerWidth-rect.right))+'px';
  }

  function openPasswordModal(){
    document.getElementById('qmes-prod-password-modal')?.remove();
    const overlay=document.createElement('div');overlay.id='qmes-prod-password-modal';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','비밀번호 변경');
    overlay.innerHTML='<div class="card"><div class="modal-head"><div><b>비밀번호 변경</b><span>현재 비밀번호 확인 후 새 비밀번호를 저장합니다.</span></div><button type="button" class="close" aria-label="닫기">×</button></div><form><label>현재 비밀번호<input type="password" name="currentPassword" autocomplete="current-password" required></label><label>새 비밀번호<input type="password" name="newPassword" autocomplete="new-password" minlength="4" required></label><label>새 비밀번호 확인<input type="password" name="confirmPassword" autocomplete="new-password" minlength="4" required></label><div class="error" aria-live="polite"></div><div class="actions"><button type="button" class="cancel">취소</button><button type="submit" class="save">변경 저장</button></div></form></div>';
    document.body.appendChild(overlay);
    const form=overlay.querySelector('form');const errorBox=overlay.querySelector('.error');const close=()=>overlay.remove();
    overlay.querySelector('.close').addEventListener('click',close);overlay.querySelector('.cancel').addEventListener('click',close);overlay.addEventListener('mousedown',event=>{if(event.target===overlay)close();});
    form.addEventListener('submit',async event=>{
      event.preventDefault();errorBox.textContent='';
      const currentPassword=form.currentPassword.value;const newPassword=form.newPassword.value;const confirmPassword=form.confirmPassword.value;
      if(newPassword.length<4){errorBox.textContent='새 비밀번호는 4자 이상 입력하세요.';return;}
      if(newPassword!==confirmPassword){errorBox.textContent='새 비밀번호 확인이 일치하지 않습니다.';return;}
      const submit=form.querySelector('.save');submit.disabled=true;submit.textContent='변경 중...';
      try{
        const response=await fetch('/api/auth/password',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok||!payload.success){errorBox.textContent=payload.message||'비밀번호 변경에 실패했습니다.';return;}
        close();alert('비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
      }catch(_error){errorBox.textContent='비밀번호 변경 요청 중 오류가 발생했습니다.';}
      finally{submit.disabled=false;submit.textContent='변경 저장';}
    });
    setTimeout(()=>form.currentPassword.focus(),0);
  }

  async function logoutNow(){
    try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});}catch(_error){}
    try{sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem('qmes_current_tab');sessionStorage.removeItem('qmes_open_menu');sessionStorage.removeItem('qmes_erp_active_label');}catch(_error){}
    delete window.__QMES_CURRENT_USER__;delete window.__QMES_USER__;location.replace('/');
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;if(!target)return;
    const mobile=target.closest('#qmes-erp-header .qmes-erp-header-mobile');
    if(mobile){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();location.assign(MOBILE_URL);return;}
    const notice=target.closest('#qmes-erp-header .qmes-visible-notice-button');
    if(notice){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openAlerts(notice);return;}
    const account=target.closest('#qmes-erp-header .qmes-erp-header-account');
    if(account){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const wrap=account.closest('.qmes-prod-account-wrap');wrap?.classList.toggle('is-open');return;}
    const pw=target.closest('#qmes-erp-header [data-qmes-prod-account="password"]');
    if(pw){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();pw.closest('.qmes-prod-account-wrap')?.classList.remove('is-open');openPasswordModal();return;}
    const logout=target.closest('#qmes-erp-header [data-qmes-prod-account="logout"]');
    if(logout){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();logoutNow();return;}
    const item=target.closest('#qmes-erp-sidebar .qmes-erp-item');
    if(item){const label=clean(item.querySelector('.qmes-erp-text')?.textContent||item.textContent);const config=routeMap[label];if(config){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();navigate(label,config);return;}}
    if(!target.closest('#qmes-prod-alert-panel'))document.getElementById('qmes-prod-alert-panel')?.remove();
  },true);

  document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.getElementById('qmes-prod-alert-panel')?.remove();document.getElementById('qmes-prod-password-modal')?.remove();document.querySelector('.qmes-prod-account-wrap')?.classList.remove('is-open');}});

  ensureHeader();
  const observer=new MutationObserver(()=>ensureHeader());observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(ensureHeader,500);
})();`;

try {
  fs.writeFileSync(productionUiPatch, qmesProductionUiPatchSource, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to install production UI patch:', error);
  process.exit(1);
}

if (!fs.existsSync(enterpriseDashboard)) {
  console.error('[QMES] Enterprise dashboard module is missing:', enterpriseDashboard);
  process.exit(1);
}

try {
  const source = fs.readFileSync(publicIndex, 'utf8');
  let normalized = source
    .replace(/qmes-shell-layer-base-20260827\.css\?v=[^"']+/g, `qmes-shell-layer-base-20260827.css?v=${SHELL_BUILD}`)
    .replace(/router\.jsx\?v=[^"']+/g, `router.jsx?v=${SHELL_BUILD}`)
    .replace(/app\.jsx\?v=[^"']+/g, `app.jsx?v=${SHELL_BUILD}`)
    .replace(/dashboard\.jsx\?v=[^"']+/g, `dashboard.jsx?v=${DASHBOARD_ASSET_BUILD}`)
    .replace(/member-management-patch\.jsx\?v=[^"']+/g, `member-management-patch.jsx?v=${MEMBERS_ASSET_BUILD}`)
    .replace(/admin\/members-bootstrap\.jsx\?v=[^"']+/g, `admin/members-bootstrap.jsx?v=${MEMBERS_ASSET_BUILD}`)
    .replace(/admin\/members\.jsx\?v=[^"']+/g, `admin/members.jsx?v=${MEMBERS_ASSET_BUILD}`)
    .replace(/qmes-collapsible-side-menu\.js\?v=[^"']+/g, `qmes-collapsible-side-menu.js?v=${SHELL_BUILD}`);

  normalized = normalized.replace(/\n\s*<script type="text\/babel" data-presets="react" src="\.\/js\/qmes-members-edit-fix-20260904\.jsx\?v=[^"']+"><\/script>/g, '');
  normalized = normalized.replace(
    /(<script type="text\/babel" data-presets="react" src="\.\/js\/admin\/members\.jsx\?v=[^"']+"><\/script>)/,
    `$1\n  <script type="text/babel" data-presets="react" src="./js/qmes-members-edit-fix-20260904.jsx?v=${MEMBERS_ASSET_BUILD}"></script>`
  );

  normalized = normalized.replace(/\n\s*<script src="\.\/js\/qmes-members-pc-edit-fallback-20260904\.js\?v=[^"']+"><\/script>/g, '');
  normalized = normalized.replace(
    /(<script type="text\/babel" data-presets="react" src="\.\/js\/qmes-members-edit-fix-20260904\.jsx\?v=[^"']+"><\/script>)/,
    `$1\n  <script src="./js/qmes-members-pc-edit-fallback-20260904.js?v=${MEMBER_FALLBACK_BUILD}"></script>`
  );

  normalized = normalized.replace(/\n\s*<script src="\.\/js\/qmes-members-pc-edit-link-20260904\.js\?v=[^"']+"><\/script>/g, '');
  normalized = normalized.replace(
    /(<script src="\.\/js\/qmes-members-pc-edit-fallback-20260904\.js\?v=[^"']+"><\/script>)/,
    `$1\n  <script src="./js/qmes-members-pc-edit-link-20260904.js?v=${MEMBER_LINK_BUILD}"></script>`
  );

  normalized = normalized.replace(/\n\s*<script src="\.\/js\/qmes-production-ui-20260910\.js\?v=[^"']+"><\/script>/g, '');
  const productionPatchTag = `\n  <script src="./js/qmes-production-ui-20260910.js?v=${SHELL_BUILD}"></script>`;
  if (/qmes-collapsible-side-menu\.js\?v=[^"']+"><\/script>/.test(normalized)) {
    normalized = normalized.replace(/(<script src="\.\/js\/qmes-collapsible-side-menu\.js\?v=[^"']+"><\/script>)/, `$1${productionPatchTag}`);
  } else {
    normalized = normalized.replace(/<\/body>/, `${productionPatchTag}\n</body>`);
  }

  if (normalized !== source) fs.writeFileSync(publicIndex, normalized, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to normalize shell asset URLs:', error);
  process.exit(1);
}

try {
  const source = fs.readFileSync(publicShellMenu, 'utf8');
  let patched = source;
  patched = patched.replace(/<button[^>]*class="[^"]*qmes-erp-header-talk[^"]*"[^>]*>[\s\S]*?<\/button>/g, '');
  patched = patched.replace(/header\.querySelector\('\.qmes-erp-header-talk'\)\.onclick\s*=\s*[^;]+;/g, '');
  patched = patched.replace(/aria-label="모바일 화면"(?:\s+title="모바일 화면")?>\$\{mobileSvg\}<span>모바일<\/span>/g, 'aria-label="모바일 전용">${mobileSvg}<span>모바일 전용</span>');
  patched = patched.replace(/header\.querySelector\('\.qmes-erp-header-mobile'\)\.addEventListener\('click',[\s\S]*?\);/, `header.querySelector('.qmes-erp-header-mobile').addEventListener('click',()=>{window.location.assign('${MOBILE_URL}');});`);
  if (patched !== source) fs.writeFileSync(publicShellMenu, patched, 'utf8');
} catch (error) {
  console.warn('[QMES] Sidebar UI normalization skipped:', error.message);
}

try {
  const source = fs.readFileSync(publicRouter, 'utf8');
  const patched = source
    .replace(/\/mobile\.html\?v=20260903-mobile-(?:button1|button2|dedicated1)/g, MOBILE_URL)
    .replace(/임임흥배/g, '임흥배');
  if (patched !== source) fs.writeFileSync(publicRouter, patched, 'utf8');
} catch (error) {
  console.warn('[QMES] Router normalization skipped:', error.message);
}

fs.readFile = function qmesEnterpriseDashboardReadFile(file, ...args) {
  let target = file;
  try {
    if (path.resolve(String(file)) === legacyDashboard) target = enterpriseDashboard;
  } catch (_error) {}

  const callbackIndex = args.findIndex(arg => typeof arg === 'function');
  if (callbackIndex < 0 || target !== enterpriseDashboard) return originalReadFile(target, ...args);

  const callback = args[callbackIndex];
  const nextArgs = args.slice();
  nextArgs[callbackIndex] = (error, source) => {
    if (error) return callback(error);
    let patched = String(source);
    patched = patched.replace(
      '["INV","재고입고", data.inventoryLotCount + " LOT","inventory","inventoryMenu"]',
      '["INV","재고입고", data.inventoryLotCount + " LOT","inv",""]'
    );
    patched = patched.replace(
      '.namo-enterprise-dashboard *{box-sizing:border-box}',
      '.namo-enterprise-dashboard *{box-sizing:border-box}.qmes-ref-brand-mark{display:none!important}'
    );
    callback(null, patched);
  };
  return originalReadFile(target, ...nextArgs);
};

process.env.QMES_DASHBOARD_BUILD = process.env.QMES_DASHBOARD_BUILD || `20260903-enterprise-v5-${SHELL_BUILD}`;
require('./server-legacy-20260903.js');
