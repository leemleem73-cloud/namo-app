/* QMES partner registration visibility fix — 2026-08-14
 * Do not intercept React click handlers. The native PartnersTab owns open/save state.
 * This file only makes the native registration form unmistakably visible as a modal.
 */
(function(){
  'use strict';
  if(window.__QMES_PARTNER_REGISTER_VISIBILITY_FIX__) return;
  window.__QMES_PARTNER_REGISTER_VISIBILITY_FIX__=true;
  const style=document.createElement('style');
  style.id='qmes-partner-register-visibility-fix';
  style.textContent=`
    .qmes-partners-page .qmes-partner-form-shell{
      position:fixed!important;
      left:50%!important;
      top:50%!important;
      transform:translate(-50%,-50%)!important;
      z-index:26001!important;
      width:min(92vw,1080px)!important;
      max-height:88vh!important;
      overflow:auto!important;
      margin:0!important;
      padding:20px!important;
      border:1px solid #475569!important;
      border-radius:14px!important;
      background:#0f1e32!important;
      box-shadow:0 24px 70px rgba(0,0,0,.55)!important;
    }
    .qmes-partners-page .qmes-partner-form-shell.is-customer{max-width:740px!important;}
    .qmes-partners-page .qmes-partner-form-shell.is-supplier{max-width:1080px!important;}
    body:has(.qmes-partners-page .qmes-partner-form-shell)::before{
      content:'';
      position:fixed;
      inset:0;
      z-index:26000;
      background:rgba(2,6,23,.78);
      backdrop-filter:blur(3px);
    }
    .qmes-partners-page .qmes-partner-form-shell,
    .qmes-partners-page .qmes-partner-form-shell *{position:relative;}
  `;
  document.head.appendChild(style);
})();