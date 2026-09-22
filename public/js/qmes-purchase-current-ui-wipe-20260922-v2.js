/* NAMO QMES - Purchase current UI wipe V2 - 2026-09-22
 * ADD-ONLY / NO OVERWRITE.
 * Fixes residual purchase row/table fragments left by V1.
 * Existing purchase source/data is preserved; only the visible purchase page is blanked.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_CURRENT_UI_WIPE_20260922_V2__) return;
  window.__QMES_PURCHASE_CURRENT_UI_WIPE_20260922_V2__=true;

  const STYLE_ID="qmes-purchase-current-ui-wipe-20260922-v2-style";
  const PAGE_MARK="data-qmes-purchase-page-wiped-v2";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      main[${PAGE_MARK}="1"] > *,
      [role="main"][${PAGE_MARK}="1"] > *,
      .main-content[${PAGE_MARK}="1"] > *,
      .content-area[${PAGE_MARK}="1"] > *,
      .page-content[${PAGE_MARK}="1"] > *{
        display:none!important;
      }

      body.qmes-purchase-page-wiped-v2 .qpx-detail-overlay,
      body.qmes-purchase-page-wiped-v2 .qpsf-detail-overlay,
      body.qmes-purchase-page-wiped-v2 .qpx-toast{
        display:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function visible(el){
    if(!el||!el.isConnected) return false;
    const s=getComputedStyle(el);
    return s.display!=="none"&&s.visibility!=="hidden";
  }

  function purchaseRoot(){
    return [...document.querySelectorAll(".qmes-purchase-live")].find(root=>{
      if(!visible(root)) return false;
      const t=clean(root.textContent).slice(0,3500);
      return /구매/.test(t)&&/발주/.test(t);
    })||null;
  }

  function mainOf(root){
    if(!root) return null;
    return root.closest("main,[role='main'],.main-content,.content-area,.page-content") ||
      [...document.querySelectorAll("main,[role='main'],.main-content,.content-area,.page-content")].find(visible) ||
      null;
  }

  function clearMarks(){
    document.querySelectorAll("["+PAGE_MARK+'="1"]').forEach(el=>el.removeAttribute(PAGE_MARK));
    document.body.classList.remove("qmes-purchase-page-wiped-v2");
  }

  function apply(){
    ensureStyle();

    const root=purchaseRoot();
    if(!root){
      clearMarks();
      return;
    }

    clearMarks();

    // Remove the old V1 marker to prevent partial/direct-child-only hiding conflicts.
    document.querySelectorAll('[data-qmes-purchase-current-ui-wiped="1"]').forEach(el=>{
      el.removeAttribute("data-qmes-purchase-current-ui-wiped");
    });

    const main=mainOf(root);
    if(main){
      main.setAttribute(PAGE_MARK,"1");
      document.body.classList.add("qmes-purchase-page-wiped-v2");
    }

    // Defensive cleanup for purchase-only floating fragments.
    document.querySelectorAll(".qpx-detail-overlay,.qpsf-detail-overlay,.qpx-toast").forEach(el=>el.remove());
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      apply();
    });
  }

  function start(){
    apply();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener("qmes:navigate-tab",()=>setTimeout(schedule,0));
    window.addEventListener("qmes:data-updated",()=>setTimeout(schedule,0));
    [80,250,600,1200,2000].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();