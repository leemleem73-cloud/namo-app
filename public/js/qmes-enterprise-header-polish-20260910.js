(function(){
  'use strict';

  const STYLE_ID='qmes-enterprise-header-polish-20260910';
  const ensureStyle=()=>{
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #qmes-erp-header{
        gap:7px!important;
        padding-right:14px!important;
        overflow:visible!important;
      }
      html body #qmes-erp-header .qmes-erp-header-spacer{
        min-width:10px!important;
      }
      html body #qmes-erp-header .qmes-erp-header-clock{
        width:92px!important;
        flex:0 0 92px!important;
        font-size:11.5px!important;
        font-weight:800!important;
        letter-spacing:.1px!important;
      }
      html body #qmes-erp-header .qmes-erp-header-mobile{
        width:92px!important;
        flex:0 0 92px!important;
        height:36px!important;
        padding:0 10px!important;
        gap:6px!important;
        border:1px solid #c6d5df!important;
        border-radius:6px!important;
        background:#fff!important;
        color:#2d5f82!important;
        box-shadow:0 1px 2px rgba(34,70,95,.08)!important;
        font-size:11.5px!important;
        font-weight:800!important;
      }
      html body #qmes-erp-header .qmes-erp-header-mobile svg{
        width:16px!important;
        height:16px!important;
      }
      html body #qmes-erp-header .qmes-visible-notice-button{
        width:76px!important;
        min-width:76px!important;
        flex:0 0 76px!important;
        height:36px!important;
        padding:0 10px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:6px!important;
        border:1px solid #c6d5df!important;
        border-radius:6px!important;
        background:#fff!important;
        color:#2d5f82!important;
        box-shadow:0 1px 2px rgba(34,70,95,.08)!important;
        font-size:11.5px!important;
        font-weight:800!important;
        line-height:1!important;
        white-space:nowrap!important;
      }
      html body #qmes-erp-header .qmes-visible-notice-button svg{
        width:16px!important;
        height:16px!important;
        flex:none!important;
      }
      html body #qmes-erp-header .qmes-visible-notice-button span{
        display:inline-block!important;
        line-height:1!important;
        white-space:nowrap!important;
      }
      html body #qmes-erp-header .qmes-erp-account-wrap{
        position:relative!important;
        width:150px!important;
        min-width:150px!important;
        flex:0 0 150px!important;
        height:36px!important;
        overflow:visible!important;
        z-index:13120!important;
      }
      html body #qmes-erp-header .qmes-erp-header-account{
        width:150px!important;
        max-width:150px!important;
        min-width:150px!important;
        height:36px!important;
        padding:0 12px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        border:1px solid #c6d5df!important;
        border-radius:6px!important;
        background:#fff!important;
        color:#29485f!important;
        box-shadow:0 1px 2px rgba(34,70,95,.08)!important;
        font-size:12px!important;
        font-weight:850!important;
        letter-spacing:-.15px!important;
        line-height:1!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      html body #qmes-erp-header .qmes-erp-header-account svg,
      html body #qmes-erp-header .qmes-erp-account-caret{
        display:none!important;
      }
      html body #qmes-erp-header .qmes-erp-account-text{
        display:block!important;
        width:100%!important;
        min-width:0!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        text-align:center!important;
      }
      html body #qmes-erp-header .qmes-erp-account-menu{
        display:none!important;
        position:absolute!important;
        top:41px!important;
        right:0!important;
        width:184px!important;
        min-width:184px!important;
        padding:6px!important;
        margin:0!important;
        border:1px solid #cbd8e2!important;
        border-radius:8px!important;
        background:#fff!important;
        box-shadow:0 10px 26px rgba(37,76,105,.20)!important;
        z-index:13150!important;
        overflow:hidden!important;
      }
      html body #qmes-erp-header .qmes-erp-account-wrap.is-open .qmes-erp-account-menu{
        display:block!important;
      }
      html body #qmes-erp-header .qmes-erp-account-menu button{
        width:100%!important;
        height:40px!important;
        min-height:40px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        padding:0 12px!important;
        margin:0!important;
        border:0!important;
        border-radius:6px!important;
        background:#fff!important;
        color:#334e62!important;
        box-shadow:none!important;
        font-size:12px!important;
        font-weight:750!important;
        line-height:1!important;
        text-align:left!important;
        white-space:nowrap!important;
        cursor:pointer!important;
      }
      html body #qmes-erp-header .qmes-erp-account-menu button:hover{
        background:#edf6fb!important;
        color:#1e5d88!important;
      }
      html body #qmes-erp-header .qmes-erp-account-menu button+button{
        margin-top:3px!important;
        border-top:1px solid #edf1f4!important;
        color:#a53a34!important;
      }
      html body #qmes-erp-header .qmes-erp-header-backup,
      html body #qmes-erp-header .qmes-erp-header-restore{
        width:56px!important;
        flex:0 0 56px!important;
        height:36px!important;
        padding:0 10px!important;
        border:1px solid #c6d5df!important;
        border-radius:6px!important;
        background:#fff!important;
        color:#29485f!important;
        box-shadow:0 1px 2px rgba(34,70,95,.08)!important;
        font-size:11.5px!important;
        font-weight:800!important;
      }
      html body #qmes-erp-header :is(.qmes-erp-header-mobile,.qmes-visible-notice-button,.qmes-erp-header-account,.qmes-erp-header-backup,.qmes-erp-header-restore):hover{
        background:#eef6fb!important;
        border-color:#9fbfd4!important;
      }
      @media (max-width:1280px){
        html body #qmes-erp-header .qmes-erp-header-search{
          flex:0 1 260px!important;
          width:260px!important;
          min-width:180px!important;
          max-width:260px!important;
        }
        html body #qmes-erp-header .qmes-erp-header-clock{
          width:82px!important;
          flex-basis:82px!important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const refineHeader=()=>{
    ensureStyle();
    const header=document.getElementById('qmes-erp-header');
    if(!header)return false;

    const mobile=header.querySelector('.qmes-erp-header-mobile');
    if(mobile){
      const span=mobile.querySelector('span');
      if(span)span.textContent='모바일 전용';
      mobile.setAttribute('aria-label','모바일 전용');
      mobile.removeAttribute('title');
    }

    const notice=header.querySelector('.qmes-visible-notice-button');
    if(notice){
      let span=notice.querySelector('span');
      if(!span){span=document.createElement('span');notice.appendChild(span);}
      span.textContent='알림';
      notice.setAttribute('aria-label','알림');
      notice.removeAttribute('title');
    }

    const account=header.querySelector('.qmes-erp-header-account');
    if(account){
      account.setAttribute('aria-label','사용자 메뉴');
      account.removeAttribute('title');
      account.querySelectorAll('[title]').forEach(node=>node.removeAttribute('title'));
      const label=account.querySelector('.qmes-erp-account-text');
      const current=window.__QMES_CURRENT_USER__||(()=>{try{return JSON.parse(sessionStorage.getItem('qmes-current-user-v1')||'null');}catch(_){return null;}})();
      const rawName=String(current?.name||'').replace(/\s+/g,'').trim();
      if(label&&/^임+흥배$/.test(rawName))label.textContent='임흥배(품질부)';
    }

    const menu=header.querySelector('.qmes-erp-account-menu');
    if(menu){
      const items=menu.querySelectorAll('button');
      if(items[0])items[0].textContent='비밀번호 변경';
      if(items[1])items[1].textContent='로그아웃';
    }
    return true;
  };

  if(!refineHeader()){
    const observer=new MutationObserver(()=>{if(refineHeader())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }
  setTimeout(refineHeader,250);
  setTimeout(refineHeader,900);
})();