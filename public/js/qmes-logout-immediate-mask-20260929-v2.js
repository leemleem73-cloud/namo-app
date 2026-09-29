/* QMES immediate logout mask - 2026-09-29
 * ADD-ONLY / NO OVERWRITE.
 * Covers the current dashboard immediately when logout is clicked,
 * then keeps the cover on ?_qmesLogout=... until the login form is ready.
 */
(function(){
  "use strict";
  if(window.__QMES_IMMEDIATE_LOGOUT_MASK_20260929_V2__)return;
  window.__QMES_IMMEDIATE_LOGOUT_MASK_20260929_V2__=true;

  function ensureMask(){
    document.documentElement.classList.add("qmes-logout-transition");
    var m=document.getElementById("qmes-logout-transition-mask");
    if(!m){
      m=document.createElement("div");
      m.id="qmes-logout-transition-mask";
      m.textContent="로그인 화면 준비 중...";
      (document.body||document.documentElement).appendChild(m);
    }
    return m;
  }

  document.addEventListener("click",function(e){
    var el=e.target instanceof Element?e.target:null;
    if(!el)return;
    var logout=el.closest('[data-qmes-v3-action="logout"],[data-qmes-persistent-action="logout"],[data-qmes-account-action="logout"],.qmes-dropdown-logout');
    if(logout)ensureMask();
  },true);

  var p=new URLSearchParams(location.search);
  if(p.has("_qmesLogout")){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensureMask,{once:true});
    else ensureMask();
  }
})();