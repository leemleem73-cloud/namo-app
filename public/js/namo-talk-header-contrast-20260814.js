/* NAMO Talk header contrast — 2026-08-14 */
(function(){
  'use strict';
  if(window.__QMES_NAMO_TALK_HEADER_CONTRAST_20260814__) return;
  window.__QMES_NAMO_TALK_HEADER_CONTRAST_20260814__=true;
  const style=document.createElement('style');
  style.id='qmes-namo-talk-header-contrast';
  style.textContent=`
    section[aria-label="NAMO Talk"] > header {
      color:#ffffff!important;
    }
    section[aria-label="NAMO Talk"] > header > div:first-child,
    section[aria-label="NAMO Talk"] > header > div:first-child > div {
      color:#ffffff!important;
      -webkit-text-fill-color:#ffffff!important;
      text-shadow:0 1px 2px rgba(0,0,0,.28)!important;
    }
    section[aria-label="NAMO Talk"] > header > div:nth-of-type(2) {
      color:#ffffff!important;
      -webkit-text-fill-color:#ffffff!important;
      font-size:13px!important;
      font-weight:850!important;
      text-shadow:0 1px 2px rgba(0,0,0,.32)!important;
      opacity:1!important;
    }
  `;
  document.head.appendChild(style);
})();