/* QMES iPad inspection UI visibility fix: stronger active tab + mode-specific item 4 label. */
(function(global){
  "use strict";
  if(global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811__) return;
  global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811__=true;

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

  function activeMode(){
    const active=document.querySelector('.qmes-ipad-mode-tabs button.is-active');
    return String(active?.textContent||'').toUpperCase();
  }

  function normalizeFourthLabel(){
    const button=document.querySelectorAll('.qmes-ipad-item-tabs button')[3];
    if(!button) return;
    const strong=button.querySelector('strong');
    if(!strong) return;
    const mode=activeMode();
    if(mode.includes('PQC') || mode.includes('공정검사')) strong.textContent='외관';
    else if(mode.includes('IQC') || mode.includes('수입검사')) strong.textContent='CoA 확인';
  }

  function apply(){ ensureStyle(); normalizeFourthLabel(); }
  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }
  document.addEventListener('click',function(event){
    if(event.target.closest?.('.qmes-ipad-mode-tabs button')) setTimeout(schedule,0);
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})(window);
