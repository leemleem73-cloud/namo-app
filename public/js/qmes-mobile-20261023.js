/* NAMO QMES mobile detail controller - current QMES tab bridge - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;

const mq=window.matchMedia("(max-width:768px)");
const params=()=>new URLSearchParams(location.search);
const mobile=()=>mq.matches||params().get("mobile")==="1";
const mobileTab=()=>params().get("mobileTab")||"";
const titles={
  woIssue:"작업지시서",
  iqc:"수입검사",
  pqc:"공정검사",
  oqc:"출하검사",
  trace:"LOT 추적",
  pop:"현장 입력",
  eq:"설비관리",
  standards:"기준서",
  members:"회원관리"
};

function openSelectedTab(){
  const tab=mobileTab();
  if(!tab)return false;
  const openMenu=tab==="woIssue"?"productionMenu":(["iqc","pqc","oqc","standards"].includes(tab)?"qualityMenu":null);
  try{
    sessionStorage.setItem("qmes_current_tab",tab);
    if(openMenu)sessionStorage.setItem("qmes_open_menu",openMenu);
    else sessionStorage.removeItem("qmes_open_menu");
  }catch(_){}
  window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,openMenu}}));
  return true;
}

function nativeWriteButton(){
  const words=["등록","작성","신규","추가","새로 만들기","검사등록","성적서 등록"];
  const main=document.querySelector("#root>div>main");
  if(!main)return null;
  return Array.from(main.querySelectorAll("button,a,[role=button]")).find(el=>{
    if(el.disabled||el.hidden||el.getAttribute("aria-hidden")==="true")return false;
    const text=String(el.textContent||el.getAttribute("aria-label")||"").replace(/\s+/g," ").trim();
    if(!text)return false;
    if(/조회|검색|초기화|삭제|인쇄|메일|접기|펼침|목록|닫기|취소/.test(text))return false;
    return words.some(w=>text.includes(w));
  })||null;
}

function syncWriteAction(){
  const btn=document.querySelector("#qmes-mobile-workbar .qmw-write");
  if(!btn)return;
  const native=nativeWriteButton();
  btn.hidden=!native;
  btn.onclick=native?()=>native.click():null;
}

function ensureWorkBar(){
  const tab=mobileTab();
  if(!tab)return;
  document.body.classList.add("qmes-mobile-work-view");
  ["qmes-mobile-attendance","qmes-mobile-menu-toggle","qmes-mobile-menu-backdrop"].forEach(id=>document.getElementById(id)?.remove());

  if(!document.getElementById("qmes-mobile-workbar")){
    const bar=document.createElement("div");
    bar.id="qmes-mobile-workbar";
    bar.innerHTML='<button type="button" class="qmw-back" aria-label="모바일 메인으로">‹</button><strong class="qmw-title"></strong><div class="qmw-actions"><button type="button" class="qmw-write" hidden>작성</button><button type="button" class="qmw-home">메인</button></div>';
    bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
    bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
    document.body.appendChild(bar);
  }

  const title=document.querySelector("#qmes-mobile-workbar .qmw-title");
  if(title)title.textContent=titles[tab]||"QMES";
  syncWriteAction();

  if(!window.__QMES_MOBILE_TAB_OPENED__){
    window.__QMES_MOBILE_TAB_OPENED__=true;
    [0,120,400,900].forEach(ms=>setTimeout(openSelectedTab,ms));
  }
}

function ensure(){
  if(!mobile())return;
  if(mobileTab())ensureWorkBar();
}

new MutationObserver(()=>{
  ensure();
  if(mobileTab())syncWriteAction();
}).observe(document.documentElement,{childList:true,subtree:true});

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
window.addEventListener("pageshow",ensure);
})();