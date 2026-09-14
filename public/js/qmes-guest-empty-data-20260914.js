/* NAMO QMES guest client isolation - 2026-09-14
 * Guest mode never deletes existing browser data. It only hides it for the guest session.
 */
(function installGuestEmptyDataClient(global){
  "use strict";
  if(global.__QMES_GUEST_EMPTY_DATA_20260914__)return;
  global.__QMES_GUEST_EMPTY_DATA_20260914__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const KEEP_SESSION_KEYS=new Set([
    SESSION_KEY,
    "qmes_current_tab",
    "qmes_open_menu",
    "qmes_inventory_section",
    "qmes_field_shortcut_mode"
  ]);
  const proto=global.Storage&&global.Storage.prototype;
  if(!proto)return;

  const rawGet=proto.getItem;
  const rawSet=proto.setItem;
  const rawRemove=proto.removeItem;
  const rawClear=proto.clear;
  let reloadQueued=false;

  function parse(value){try{return JSON.parse(String(value||""));}catch(_error){return null;}}
  function rawUser(){try{return parse(rawGet.call(global.sessionStorage,SESSION_KEY));}catch(_error){return null;}}
  function isGuestUser(user){
    return Boolean(user&&(
      String(user.id||"").toLowerCase()==="guest"||
      String(user.uid||"").toUpperCase()==="GUEST"||
      String(user.role||"").toLowerCase()==="guest"
    ));
  }
  function guestActive(){return isGuestUser(rawUser());}
  function queueReload(){
    if(reloadQueued)return;
    reloadQueued=true;
    setTimeout(()=>global.location.reload(),120);
  }

  proto.getItem=function(key){
    const name=String(key==null?"":key);
    if(guestActive()){
      if(this===global.localStorage)return null;
      if(this===global.sessionStorage&&!KEEP_SESSION_KEYS.has(name))return null;
    }
    return rawGet.call(this,key);
  };

  proto.setItem=function(key,value){
    const name=String(key==null?"":key);
    const wasGuest=guestActive();
    if(wasGuest){
      if(this===global.localStorage)return;
      if(this===global.sessionStorage&&!KEEP_SESSION_KEYS.has(name))return;
    }
    const result=rawSet.call(this,key,value);
    if(this===global.sessionStorage&&name===SESSION_KEY&&!wasGuest&&isGuestUser(parse(value)))queueReload();
    return result;
  };

  proto.removeItem=function(key){
    const name=String(key==null?"":key);
    if(guestActive()){
      if(this===global.localStorage)return;
      if(this===global.sessionStorage&&!KEEP_SESSION_KEYS.has(name))return;
    }
    return rawRemove.call(this,key);
  };

  proto.clear=function(){
    if(guestActive()&&(this===global.localStorage||this===global.sessionStorage))return;
    return rawClear.call(this);
  };

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function ensureStyle(){
    if(document.getElementById("qmes-guest-empty-style-20260914"))return;
    const style=document.createElement("style");
    style.id="qmes-guest-empty-style-20260914";
    style.textContent=`
      #qmes-guest-empty-badge{position:fixed;right:18px;bottom:18px;z-index:2147483000;padding:8px 12px;border:1px solid #b8d0df;border-radius:999px;background:rgba(248,252,254,.97);box-shadow:0 8px 24px rgba(24,58,82,.14);color:#36566d;font:850 11px Pretendard,'Noto Sans KR',sans-serif;pointer-events:none}
      #qmes-guest-empty-badge b{color:#087ca8;margin-right:6px}
      html[data-qmes-guest="true"] .qmes-header-action{display:none!important}
    `;
    document.head.appendChild(style);
  }
  function syncGuestUi(){
    ensureStyle();
    const active=guestActive();
    document.documentElement.toggleAttribute("data-qmes-guest",active);
    const existing=document.getElementById("qmes-guest-empty-badge");
    if(!active){existing?.remove();return;}
    if(existing)return;
    const badge=document.createElement("div");
    badge.id="qmes-guest-empty-badge";
    badge.innerHTML="<b>GUEST</b> 데이터 없음 · 열람 전용";
    document.body.appendChild(badge);
  }

  document.addEventListener("click",event=>{
    if(!guestActive())return;
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const control=target.closest('button,input[type="button"],input[type="submit"],a');
    if(!control)return;
    const text=clean(control.textContent||control.value||control.getAttribute("aria-label")||control.getAttribute("title"));
    if(!/(저장|등록|추가|수정|삭제|승인|반려|발행|차단|해제|초기화|백업|복원|신규|확정|완료처리|비밀번호 변경)/.test(text))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    alert("게스트 계정은 화면 열람만 가능하며 데이터 저장·수정·삭제는 할 수 없습니다.");
  },true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncGuestUi,{once:true});
  else syncGuestUi();
  global.addEventListener("load",syncGuestUi,{once:true});
})(window);
