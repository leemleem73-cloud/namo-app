/* NAMO QMES mobile shell controller - legacy PC page bridge - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;
const mq=window.matchMedia("(max-width:768px)");
const params=()=>new URLSearchParams(location.search);
const mobile=()=>mq.matches||params().get("mobile")==="1";
const workPage=()=>params().get("mobilePage")||"";
const titles={dashboard:"종합 대시보드",orders:"수주납기 관리",purchase:"구매발주 관리",work:"작업지시서",incoming:"수입검사 IQC",process:"공정검사 PQC",outgoing:"출하검사 OQC",ncr:"부적합 NCR",spcTrend:"SPC / Trend",changeControl:"변경관리",lotTrace:"LOT 추적",equipment:"설비관리",instrumentMgmt:"계측기관리",calibrationMgmt:"검교정관리",standard:"기준서 / 문서관리",approval:"전자결재",adminEmployees:"직원등록현황"};
function openSelectedPage(){
 const page=workPage();if(!page)return false;
 const menu=document.querySelector('.sidebar .menu[data-page="'+CSS.escape(page)+'"]');
 if(!menu)return false;
 if(!menu.classList.contains("active"))menu.click();
 return true;
}
function ensureWorkBar(){
 const page=workPage();if(!page)return;
 document.body.classList.add("qmes-mobile-work-view");
 ["qmes-mobile-attendance","qmes-mobile-menu-toggle","qmes-mobile-menu-backdrop"].forEach(id=>document.getElementById(id)?.remove());
 if(!document.getElementById("qmes-mobile-workbar")){
   const bar=document.createElement("div");bar.id="qmes-mobile-workbar";
   bar.innerHTML='<button type="button" class="qmw-back" aria-label="모바일 메인으로">‹</button><strong class="qmw-title"></strong><button type="button" class="qmw-home">메인</button>';
   bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
   bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
   document.body.appendChild(bar);
 }
 const title=document.querySelector("#qmes-mobile-workbar .qmw-title");if(title)title.textContent=titles[page]||"QMES";
 if(!window.__QMES_MOBILE_PAGE_OPENED__){
   window.__QMES_MOBILE_PAGE_OPENED__=true;
   [0,120,350,700,1200].forEach(ms=>setTimeout(()=>{if(openSelectedPage())window.__QMES_MOBILE_PAGE_READY__=true;},ms));
 }
}
function ensure(){
 if(!mobile())return;
 if(workPage()){ensureWorkBar();return;}
}
new MutationObserver(ensure).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
window.addEventListener("pageshow",ensure);
})();