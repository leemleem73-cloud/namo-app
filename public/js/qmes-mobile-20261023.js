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
function nativeWriteButton(){
 const page=workPage();if(!page)return null;
 const root=document.getElementById(page);if(!root)return null;
 const words=["등록","작성","신규","추가","새로 만들기","새 작업","검사등록","성적서 등록"];
 return Array.from(root.querySelectorAll("button,a,[role=button]")).find(el=>{
   if(el.disabled||el.hidden||el.getAttribute("aria-hidden")==="true")return false;
   const text=String(el.textContent||el.getAttribute("aria-label")||"").replace(/\s+/g," ").trim();
   if(!text)return false;
   if(/조회|검색|초기화|삭제|인쇄|메일|접기|펼침|목록|닫기|취소/.test(text))return false;
   return words.some(w=>text.includes(w));
 })||null;
}
function syncWriteAction(){
 const btn=document.querySelector("#qmes-mobile-workbar .qmw-write");if(!btn)return;
 const native=nativeWriteButton();
 btn.hidden=!native;
 btn.onclick=native?()=>{native.click();setTimeout(()=>document.body.classList.add("qmes-mobile-editing"),60);}:null;
}
function ensureWorkBar(){
 const page=workPage();if(!page)return;
 document.body.classList.add("qmes-mobile-work-view");
 ["qmes-mobile-attendance","qmes-mobile-menu-toggle","qmes-mobile-menu-backdrop"].forEach(id=>document.getElementById(id)?.remove());
 if(!document.getElementById("qmes-mobile-workbar")){
   const bar=document.createElement("div");bar.id="qmes-mobile-workbar";
   bar.innerHTML='<button type="button" class="qmw-back" aria-label="모바일 메인으로">‹</button><strong class="qmw-title"></strong><div class="qmw-actions"><button type="button" class="qmw-write" hidden>작성</button><button type="button" class="qmw-home">메인</button></div>';
   bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
   bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
   document.body.appendChild(bar);
 }
 const title=document.querySelector("#qmes-mobile-workbar .qmw-title");if(title)title.textContent=titles[page]||"QMES";
 syncWriteAction();
 if(!window.__QMES_MOBILE_PAGE_OPENED__){
   window.__QMES_MOBILE_PAGE_OPENED__=true;
   [0,120,350,700,1200].forEach(ms=>setTimeout(()=>{if(openSelectedPage())window.__QMES_MOBILE_PAGE_READY__=true;},ms));
 }
}
function ensure(){
 if(!mobile())return;
 if(workPage()){ensureWorkBar();return;}
}
new MutationObserver(()=>{ensure();if(workPage())syncWriteAction();}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
window.addEventListener("pageshow",ensure);
})();