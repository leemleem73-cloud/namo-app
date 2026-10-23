/* NAMO QMES mobile shell controller - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;
const mq=window.matchMedia("(max-width:768px)");
const mobile=()=>mq.matches||new URLSearchParams(location.search).get("mobile")==="1";
function close(){document.body.classList.remove("qmes-mobile-menu-open");}
function ensure(){
 if(!mobile()){close();return;}
 if(!document.getElementById("qmes-mobile-menu-toggle")){
   const b=document.createElement("button");b.id="qmes-mobile-menu-toggle";b.type="button";b.textContent="☰";b.setAttribute("aria-label","업무 메뉴 열기");
   b.onclick=()=>document.body.classList.toggle("qmes-mobile-menu-open");document.body.appendChild(b);
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
