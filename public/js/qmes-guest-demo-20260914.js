/* NAMO QMES guest demo mode - 2026-09-14
 * Guest uses the normal login form (guest / 1234).
 * The production UI remains available, while browser-stored production data is hidden.
 * Existing local/session data is never deleted.
 */
(function installQmesGuestDemo(global){
  "use strict";
  if(global.__QMES_GUEST_DEMO_20260914__)return;
  global.__QMES_GUEST_DEMO_20260914__=true;

  const USER_KEY="qmes-current-user-v1";
  const SESSION_ALLOW=new Set([
    USER_KEY,
    "qmes_current_tab",
    "qmes_open_menu",
    "qmes_inventory_section",
    "qmes_field_shortcut_mode"
  ]);
  const storageProto=global.Storage&&global.Storage.prototype;
  if(!storageProto)return;

  const rawGet=storageProto.getItem;
  const rawSet=storageProto.setItem;
  const rawRemove=storageProto.removeItem;
  const rawClear=storageProto.clear;
  let reloadQueued=false;

  function parse(value){
    try{return JSON.parse(String(value||""));}catch(_error){return null;}
  }
  function rawCurrentUser(){
    try{return parse(rawGet.call(global.sessionStorage,USER_KEY));}catch(_error){return null;}
  }
  function isGuestUser(user){
    return Boolean(user&&(
      String(user.role||"").toLowerCase()==="guest"||
      String(user.id||"").toLowerCase()==="guest"||
      String(user.uid||"").toUpperCase()==="GUEST"
    ));
  }
  function guestActive(){return isGuestUser(rawCurrentUser());}
  function queueReload(){
    if(reloadQueued)return;
    reloadQueued=true;
    setTimeout(function(){global.location.reload();},100);
  }

  storageProto.getItem=function(key){
    const name=String(key==null?"":key);
    if(guestActive()){
      if(this===global.localStorage)return null;
      if(this===global.sessionStorage&&!SESSION_ALLOW.has(name))return null;
    }
    return rawGet.call(this,key);
  };

  storageProto.setItem=function(key,value){
    const name=String(key==null?"":key);
    const wasGuest=guestActive();
    if(wasGuest){
      if(this===global.localStorage)return;
      if(this===global.sessionStorage&&!SESSION_ALLOW.has(name))return;
    }
    const result=rawSet.call(this,key,value);
    if(this===global.sessionStorage&&name===USER_KEY&&!wasGuest&&isGuestUser(parse(value)))queueReload();
    return result;
  };

  storageProto.removeItem=function(key){
    const name=String(key==null?"":key);
    if(guestActive()){
      if(this===global.localStorage)return;
      if(this===global.sessionStorage&&!SESSION_ALLOW.has(name))return;
    }
    return rawRemove.call(this,key);
  };

  storageProto.clear=function(){
    if(guestActive()&&this===global.localStorage)return;
    return rawClear.call(this);
  };

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function ensureStyle(){
    if(document.getElementById("qmes-guest-demo-style-20260914"))return;
    const style=document.createElement("style");
    style.id="qmes-guest-demo-style-20260914";
    style.textContent=`
      #qmes-guest-demo-badge{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #b9cfdd;border-radius:999px;background:rgba(248,252,254,.97);box-shadow:0 8px 24px rgba(24,58,82,.14);color:#36566d;font:850 11px Pretendard,'Noto Sans KR',sans-serif;pointer-events:none}
      #qmes-guest-demo-badge b{color:#087ca8}
      html[data-qmes-demo="true"] .qmes-header-action{display:none!important}
    `;
    document.head.appendChild(style);
  }
  function syncDemoUi(){
    ensureStyle();
    const active=guestActive();
    document.documentElement.toggleAttribute("data-qmes-demo",active);
    global.__QMES_DEMO_MODE__=active;
    const existing=document.getElementById("qmes-guest-demo-badge");
    if(!active){existing?.remove();return;}
    if(existing)return;
    const badge=document.createElement("div");
    badge.id="qmes-guest-demo-badge";
    badge.innerHTML="<b>DEMO</b><span>게스트 · 데이터 없음 · 열람 전용</span>";
    document.body.appendChild(badge);
  }

  document.addEventListener("click",function(event){
    if(!guestActive())return;
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const control=target.closest('button,input[type="button"],input[type="submit"],a');
    if(!control)return;
    const text=clean(control.textContent||control.value||control.getAttribute("aria-label")||control.getAttribute("title"));
    if(!/(저장|등록|추가|수정|삭제|승인|반려|발행|차단|해제|초기화|백업|복원|신규|확정|완료처리|비밀번호 변경)/.test(text))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    alert("데모 버전은 화면 열람만 가능하며 데이터 저장·수정·삭제는 할 수 없습니다.");
  },true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncDemoUi,{once:true});
  else syncDemoUi();
  global.addEventListener("load",syncDemoUi,{once:true});
})(window);
