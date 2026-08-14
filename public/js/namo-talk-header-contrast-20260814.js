/* NAMO Talk light header contrast — 2026-08-14 */
(function(){
  'use strict';
  if(window.__QMES_NAMO_TALK_HEADER_CONTRAST_20260814__) return;
  window.__QMES_NAMO_TALK_HEADER_CONTRAST_20260814__=true;
  const style=document.createElement('style');
  style.id='qmes-namo-talk-header-contrast';
  style.textContent=`
    section[aria-label="NAMO Talk"] > header {
      color:#172033!important;
    }
    section[aria-label="NAMO Talk"] > header > div:first-child,
    section[aria-label="NAMO Talk"] > header > div:first-child > div,
    section[aria-label="NAMO Talk"] > header > div:nth-of-type(2) {
      color:#172033!important;
      -webkit-text-fill-color:#172033!important;
      text-shadow:none!important;
      opacity:1!important;
    }
    section[aria-label="NAMO Talk"] > header > div:nth-of-type(2) {
      font-size:13px!important;
      font-weight:850!important;
    }
    section[aria-label="NAMO Talk"] > header button,
    section[aria-label="NAMO Talk"] > header button svg,
    section[aria-label="NAMO Talk"] > header button span {
      color:#334155!important;
      fill:currentColor!important;
      opacity:1!important;
    }
    section[aria-label="NAMO Talk"] > header img {
      opacity:1!important;
      filter:none!important;
    }
  `;
  document.head.appendChild(style);
})();