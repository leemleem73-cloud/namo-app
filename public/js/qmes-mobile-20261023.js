/* NAMO QMES mobile detail controller - live DOM page bridge - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;

const p=new URLSearchParams(location.search);
const page=p.get("mobilePage")||"";
const isMobile=p.get("mobile")==="1"||window.matchMedia("(max-width:768px)").matches;
if(!isMobile||!page)return;

const titles={
  work:"작업지시서",
  incoming:"수입검사",
  process:"공정검사",
  outgoing:"출하검사",
  lotTrace:"LOT 추적",
  pop:"현장 입력",
  equipment:"설비관리",
  standard:"기준서",
  adminEmployees:"회원관리"
};

function openSelectedPage(){
  const menu=document.querySelector('.sidebar .menu[data-page="'+CSS.escape(page)+'"]');
  if(menu){ menu.click(); return true; }
  const target=document.getElementById(page);
  if(!target)return false;
  document.querySelectorAll(".module-page").forEach(el=>el.classList.remove("active"));
  target.classList.add("active");
  return true;
}

function addMobileShell(){
  document.body.classList.add("qmes-mobile-work-view");
  ["qmes-mobile-attendance","qmes-mobile-menu-toggle","qmes-mobile-menu-backdrop"].forEach(id=>document.getElementById(id)?.remove());
  if(document.getElementById("qmes-mobile-workbar"))return;
  const bar=document.createElement("div");
  bar.id="qmes-mobile-workbar";
  bar.innerHTML='<button type="button" class="qmw-back">‹</button><strong class="qmw-title"></strong><button type="button" class="qmw-home">메인</button>';
  bar.querySelector(".qmw-title").textContent=titles[page]||"QMES";
  bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
  bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
  document.body.appendChild(bar);
}

function boot(){
  addMobileShell();
  [0,120,350,700].forEach(ms=>setTimeout(openSelectedPage,ms));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();