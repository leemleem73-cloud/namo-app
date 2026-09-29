/* QMES logout transition mask - 2026-09-29
 * ADD-ONLY / NO OVERWRITE.
 * Owns only the short transition after ?_qmesLogout=... navigation.
 */
(function(){
  "use strict";
  if(window.__QMES_LOGOUT_TRANSITION_MASK_20260929_V1__)return;
  window.__QMES_LOGOUT_TRANSITION_MASK_20260929_V1__=true;

  var params=new URLSearchParams(location.search);
  if(!params.has("_qmesLogout"))return;

  document.documentElement.classList.add("qmes-logout-transition");

  function ensureMask(){
    var m=document.getElementById("qmes-logout-transition-mask");
    if(m)return m;
    m=document.createElement("div");
    m.id="qmes-logout-transition-mask";
    m.textContent="로그인 화면 준비 중...";
    (document.body||document.documentElement).appendChild(m);
    return m;
  }

  function loginReady(){
    var root=document.getElementById("root");
    if(!root)return false;
    var user=root.querySelector('input[autocomplete="username"]');
    var pass=root.querySelector('input[autocomplete="current-password"]');
    var submit=[].slice.call(root.querySelectorAll("button")).find(function(b){return /로그인/.test(String(b.textContent||""))});
    return !!(user&&pass&&submit);
  }

  function release(){
    ensureMask();
    if(!loginReady())return false;
    document.documentElement.classList.remove("qmes-logout-transition");
    document.getElementById("qmes-logout-transition-mask")?.remove();
    try{
      var u=new URL(location.href);
      u.searchParams.delete("_qmesLogout");
      history.replaceState(null,"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")+u.hash);
    }catch(_){}
    return true;
  }

  function boot(){
    ensureMask();
    if(release())return;
    var obs=new MutationObserver(function(){if(release())obs.disconnect()});
    obs.observe(document.documentElement,{childList:true,subtree:true});
    var tries=0;
    var timer=setInterval(function(){
      tries+=1;
      if(release()||tries>200){
        clearInterval(timer);
        if(tries>200){
          document.documentElement.classList.remove("qmes-logout-transition");
          document.getElementById("qmes-logout-transition-mask")?.remove();
        }
      }
    },50);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();