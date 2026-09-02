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

    /* QMES top-right account button contrast — 2026-09-02
       Namo One server theme uses four #root IDs and forces header-control text light.
       Use a more specific account-only rule so the white profile button remains readable. */
    html body #root#root#root#root#root > div > header button[aria-label^="계정 설정"] {
      background:#ffffff!important;
      color:#0f2038!important;
      -webkit-text-fill-color:#0f2038!important;
      border:1px solid #cfd6df!important;
      opacity:1!important;
      text-shadow:none!important;
    }
    html body #root#root#root#root#root > div > header button[aria-label^="계정 설정"] div,
    html body #root#root#root#root#root > div > header button[aria-label^="계정 설정"] span {
      color:#0f2038!important;
      -webkit-text-fill-color:#0f2038!important;
      opacity:1!important;
      text-shadow:none!important;
    }
    html body #root#root#root#root#root > div > header button[aria-label^="계정 설정"] > div:first-of-type {
      background:#f1f3f6!important;
      color:#0f2038!important;
      -webkit-text-fill-color:#0f2038!important;
      border-color:#d8e0ea!important;
    }
    html body #root#root#root#root#root > div > header button[aria-label^="계정 설정"]:hover,
    html body #root#root#root#root#root > div > header button[aria-label^="계정 설정"]:focus-visible {
      background:#f8fafc!important;
      color:#0f2038!important;
      -webkit-text-fill-color:#0f2038!important;
      border-color:#b9c5d3!important;
    }
  `;
  document.head.appendChild(style);
})();