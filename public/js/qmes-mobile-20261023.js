/* NAMO QMES mobile shell controller - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;
const mq=window.matchMedia("(max-width:768px)");
const params=()=>new URLSearchParams(location.search);
const mobile=()=>mq.matches||params().get("mobile")==="1";
const workTab=()=>params().get("mobileTab")||"";
const titles={woIssue:"작업지시서",iqc:"수입검사",prod:"생산 진행",pqc:"공정검사",oqc:"출하검사",trace:"LOT 추적",pop:"현장 입력",eq:"설비관리",standards:"기준서",members:"회원관리"};
function close(){document.body.classList.remove("qmes-mobile-menu-open");}
function forceSelectedTab(){
 const tab=workTab();
 if(!tab)return;
 const openMenu=tab==="woIssue"||tab==="prod"?"productionMenu":(tab==="iqc"||tab==="pqc"||tab==="oqc"||tab==="standards"?"qualityMenu":"");
 try{
   sessionStorage.setItem("qmes_current_tab",tab);
   if(openMenu)sessionStorage.setItem("qmes_open_menu",openMenu);else sessionStorage.removeItem("qmes_open_menu");
 }catch(_){}
 window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,openMenu:openMenu||null}}));
}
function ensureWorkBar(){
 const tab=workTab();
 if(!tab)return;
 document.body.classList.add("qmes-mobile-work-view");
 document.getElementById("qmes-mobile-attendance")?.remove();
 document.getElementById("qmes-mobile-menu-toggle")?.remove();
 document.getElementById("qmes-mobile-menu-backdrop")?.remove();
 if(!document.getElementById("qmes-mobile-workbar")){
   const bar=document.createElement("div");
   bar.id="qmes-mobile-workbar";
   bar.innerHTML='<button type="button" class="qmw-back" aria-label="모바일 메인으로">‹</button><strong class="qmw-title"></strong><button type="button" class="qmw-home">메인</button>';
   bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
   bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
   document.body.appendChild(bar);
 }
 const title=document.querySelector("#qmes-mobile-workbar .qmw-title");
 if(title)title.textContent=titles[tab]||"QMES";
 forceSelectedTab();
 if(!window.__QMES_MOBILE_FORCE_TAB_TIMERS__){
   window.__QMES_MOBILE_FORCE_TAB_TIMERS__=true;
   [120,450,1000,1800].forEach(ms=>setTimeout(forceSelectedTab,ms));
 }
}
function ensure(){
 if(!mobile()){close();return;}
 if(workTab()){ensureWorkBar();return;}
 document.body.classList.remove("qmes-mobile-work-view");
 document.getElementById("qmes-mobile-workbar")?.remove();
 if(!document.getElementById("qmes-mobile-menu-toggle")){
   const b=document.createElement("button");b.id="qmes-mobile-menu-toggle";b.type="button";b.textContent="☰";b.setAttribute("aria-label","업무 메뉴 열기");
   b.onclick=()=>document.body.classList.toggle("qmes-mobile-menu-open");document.body.appendChild(b);
 }
 if(!document.getElementById("qmes-mobile-attendance")){
   const a=document.createElement("button");
   a.id="qmes-mobile-attendance";a.type="button";
   a.innerHTML='<span class="qma-icon">◷</span><span class="qma-text"><strong>출퇴근</strong><small>출근 · 퇴근 · 연차 · 근태</small></span><span class="qma-go">›</span>';
   a.onclick=()=>location.assign("/attendance.html?mobile=1&source=qmes");
   document.body.appendChild(a);
 }
 if(!document.getElementById("qmes-mobile-menu-backdrop")){
   const d=document.createElement("div");d.id="qmes-mobile-menu-backdrop";d.onclick=close;document.body.appendChild(d);
 }
 const side=document.getElementById("qmes-erp-sidebar");
 if(side&&!side.dataset.mobileBound){side.dataset.mobileBound="1";side.addEventListener("click",e=>{if(e.target.closest(".qside-item"))setTimeout(close,30);});}
}
new MutationObserver(ensure).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
window.addEventListener("resize",ensure);
mq.addEventListener&&mq.addEventListener("change",ensure);
})();