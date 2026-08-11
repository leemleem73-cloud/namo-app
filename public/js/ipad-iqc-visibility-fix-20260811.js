/* QMES iPad inspection UI visibility fix: stronger active mode only. */
(function(global){
  "use strict";
  if(global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811_V4__) return;
  global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811_V4__=true;

  const STYLE_ID="qmes-ipad-iqc-visibility-fix-style";
  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-ipad-mode-tabs button.is-active{
        border:3px solid #0284c7!important;
        background:#dff4ff!important;
        color:#0f172a!important;
        box-shadow:0 0 0 3px rgba(2,132,199,.16),0 6px 16px rgba(15,23,42,.14)!important;
        transform:translateY(-1px);
      }
      .qmes-ipad-mode-tabs button.is-active strong,
      .qmes-ipad-mode-tabs button.is-active small{
        color:#075985!important;
        font-weight:950!important;
      }
      .qmes-ipad-mode-tabs button.is-active::before{
        content:"✓";
        display:inline-grid;
        place-items:center;
        width:24px;
        height:24px;
        border-radius:999px;
        background:#0284c7;
        color:#fff;
        font-size:14px;
        font-weight:950;
      }
    `;
    document.head.appendChild(style);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureStyle,{once:true});
  else ensureStyle();
})(window);
