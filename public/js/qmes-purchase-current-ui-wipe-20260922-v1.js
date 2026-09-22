/* NAMO QMES - Purchase current UI wipe V1 - 2026-09-22
 * ADD-ONLY / NO OVERWRITE.
 * Scope: current purchase-order page visual layer only.
 * Existing purchase source files, DB data, save/edit logic, and other QMES screens stay untouched.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_CURRENT_UI_WIPE_20260922_V1__) return;
  window.__QMES_PURCHASE_CURRENT_UI_WIPE_20260922_V1__=true;

  const STYLE_ID="qmes-purchase-current-ui-wipe-20260922-v1-style";
  const MARK="data-qmes-purchase-current-ui-wiped";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      .qmes-purchase-live[${MARK}="1"] > *{
        display:none!important;
      }
      .qmes-purchase-live[${MARK}="1"]{
        min-height:0!important;
        height:0!important;
        overflow:hidden!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
      }
    `;
    document.head.appendChild(s);
  }

  function isPurchaseRoot(root){
    if(!root||!root.isConnected) return false;
    const text=clean(root.textContent).slice(0,3000);
    return /구매/.test(text)&&/발주/.test(text);
  }

  function apply(){
    ensureStyle();

    document.querySelectorAll("["+MARK+'="1"]').forEach(node=>{
      if(!(node.classList&&node.classList.contains("qmes-purchase-live")&&isPurchaseRoot(node))){
        node.removeAttribute(MARK);
      }
    });

    document.querySelectorAll(".qmes-purchase-live").forEach(root=>{
      if(isPurchaseRoot(root)) root.setAttribute(MARK,"1");
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  function start(){
    apply();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener("qmes:navigate-tab",()=>setTimeout(schedule,0));
    window.addEventListener("qmes:data-updated",()=>setTimeout(schedule,0));
    [100,350,800,1500].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();