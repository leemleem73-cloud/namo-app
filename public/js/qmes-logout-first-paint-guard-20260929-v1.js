/* QMES logout first-paint guard - 2026-09-29
 * ADD-ONLY / NO OVERWRITE.
 * Prevents the authenticated dashboard from flashing after logout while the login shell is mounting.
 */
(function(){
  "use strict";
  if(window.__QMES_LOGOUT_FIRST_PAINT_GUARD_20260929_V1__)return;
  window.__QMES_LOGOUT_FIRST_PAINT_GUARD_20260929_V1__=true;

  let isLogoutEntry=false;
  try{isLogoutEntry=new URL(location.href).searchParams.has("_qmesLogout");}catch(_){}
  if(!isLogoutEntry)return;

  const STYLE_ID="qmes-logout-first-paint-style-20260929-v1";
  const CLASS_NAME="qmes-logout-first-paint";

  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
    html.${CLASS_NAME} body>*{visibility:hidden!important}
    html.${CLASS_NAME} body::before{
      content:"로그인 화면 준비 중...";
      visibility:visible!important;
      position:fixed!important;inset:0!important;z-index:2147483647!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      background:linear-gradient(135deg,#07162b,#0c3156)!important;
      color:#fff!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
      font-size:15px!important;font-weight:850!important;letter-spacing:-.2px!important;
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add(CLASS_NAME);

  function loginReady(){
    const pw=document.querySelector('input[type="password"][autocomplete="current-password"]');
    if(!pw)return false;
    const form=pw.closest("form");
    if(!form)return false;
    const text=(form.textContent||"").replace(/\s+/g," ");
    return text.includes("나모케미칼 QMES")&&text.includes("로그인");
  }

  function release(){
    if(!document.documentElement.classList.contains(CLASS_NAME))return;
    if(!loginReady())return;
    requestAnimationFrame(()=>{
      document.documentElement.classList.remove(CLASS_NAME);
      document.getElementById(STYLE_ID)?.remove();
      try{
        const u=new URL(location.href);
        u.searchParams.delete("_qmesLogout");
        history.replaceState(null,"",u.pathname+(u.search?"?"+u.searchParams.toString():"")+u.hash);
      }catch(_){}
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",release,{once:true});
  }else release();

  const obs=new MutationObserver(release);
  obs.observe(document.documentElement,{childList:true,subtree:true});

  // Safety release only if the login form appears later; do not expose the old dashboard while auth is unresolved.
  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;release();
    if(!document.documentElement.classList.contains(CLASS_NAME)||tries>=120){
      clearInterval(timer);
      if(!document.documentElement.classList.contains(CLASS_NAME))obs.disconnect();
    }
  },100);
})();