/* NAMO QMES mobile detail controller - simplified stable bridge - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;

const p=new URLSearchParams(location.search);
const tab=p.get("mobileTab")||"";
const isMobile=p.get("mobile")==="1"||window.matchMedia("(max-width:768px)").matches;
if(!isMobile||!tab)return;

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
const openMenu=tab==="woIssue"?"productionMenu":(["iqc","pqc","oqc","standards"].includes(tab)?"qualityMenu":null);

try{
  sessionStorage.setItem("qmes_current_tab",tab);
  if(openMenu)sessionStorage.setItem("qmes_open_menu",openMenu);
  else sessionStorage.removeItem("qmes_open_menu");
}catch(_){}

function addMobileShell(){
  document.body.classList.add("qmes-mobile-work-view");
  ["qmes-mobile-attendance","qmes-mobile-menu-toggle","qmes-mobile-menu-backdrop"].forEach(id=>document.getElementById(id)?.remove());

  if(document.getElementById("qmes-mobile-workbar"))return;
  const bar=document.createElement("div");
  bar.id="qmes-mobile-workbar";
  bar.innerHTML='<button type="button" class="qmw-back">‹</button><strong class="qmw-title"></strong><button type="button" class="qmw-home">메인</button>';
  bar.querySelector(".qmw-title").textContent=titles[tab]||"QMES";
  bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
  bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
  document.body.appendChild(bar);
}

function applyTabOnce(){
  window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,openMenu}}));
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",()=>{
    addMobileShell();
    setTimeout(applyTabOnce,250);
  },{once:true});
}else{
  addMobileShell();
  setTimeout(applyTabOnce,250);
}
})();