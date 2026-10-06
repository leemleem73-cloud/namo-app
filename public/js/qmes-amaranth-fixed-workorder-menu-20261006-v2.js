(function(){
"use strict";
if(window.__QMES_AMARANTH_FIXED_PRODUCTION_MENU_20261006_V1__)return;
window.__QMES_AMARANTH_FIXED_PRODUCTION_MENU_20261006_V1__=true;

var PANEL_ID="qmes-erp-fixed-production-menu";
var STYLE_ID="qmes-amaranth-fixed-production-style-20261006-v1";
var productionTabs={woIssue:true};

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
function savedTab(){try{return sessionStorage.getItem("qmes_current_tab")||"dash"}catch(_){return "dash"}}
function navigate(tab,openMenu){
  window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab:tab,openMenu:openMenu||null}}));
}
function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  var st=document.createElement("style");st.id=STYLE_ID;st.textContent=
  'html body #'+PANEL_ID+'{position:fixed!important;left:54px!important;top:108px!important;bottom:0!important;width:214px!important;z-index:15080!important;display:none!important;overflow-y:auto!important;overflow-x:hidden!important;box-sizing:border-box!important;background:#fff!important;border-right:1px solid #d6dee7!important;box-shadow:3px 0 12px rgba(31,50,72,.08)!important;color:#27394b!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}'+
  'html body.qmes-fixed-production-menu #'+PANEL_ID+'{display:block!important}'+
  'html body.qmes-fixed-production-menu #qmes-erp-sidebar,html body.qmes-fixed-production-menu #qmes-erp-sidebar:hover{width:54px!important}'+
  'html body.qmes-fixed-production-menu #qmes-erp-sidebar:hover .qside-item{width:42px!important}'+
  'html body.qmes-fixed-production-menu #qmes-erp-sidebar:hover .qside-text{opacity:0!important}'+
  'html body #'+PANEL_ID+' .qfixed-head{height:54px!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0 15px!important;border-bottom:1px solid #dce4eb!important;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)!important}'+
  'html body #'+PANEL_ID+' .qfixed-head-icon{width:26px!important;height:26px!important;display:grid!important;place-items:center!important;border-radius:5px!important;background:#eef5fb!important;color:#2e78b4!important;font-size:13px!important;font-weight:900!important}'+
  'html body #'+PANEL_ID+' .qfixed-head strong{font-size:15px!important;font-weight:800!important;color:#25384b!important;letter-spacing:-.25px!important}'+
  'html body #'+PANEL_ID+' .qfixed-section{padding:9px 0 10px!important;border-bottom:1px solid #e4e9ef!important}'+
  'html body #'+PANEL_ID+' .qfixed-section-title{height:30px!important;padding:0 15px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;color:#30465b!important;font-size:11px!important;font-weight:850!important;background:#f6f8fa!important}'+
  'html body #'+PANEL_ID+' .qfixed-section-title span:last-child{font-size:11px!important;color:#7d8c9b!important}'+
  'html body #'+PANEL_ID+' .qfixed-btn{width:calc(100% - 12px)!important;height:34px!important;margin:2px 6px!important;padding:0 12px 0 18px!important;display:flex!important;align-items:center!important;gap:9px!important;border:0!important;border-radius:4px!important;background:transparent!important;color:#435568!important;font-family:inherit!important;font-size:11px!important;font-weight:650!important;text-align:left!important;cursor:pointer!important}'+
  'html body #'+PANEL_ID+' .qfixed-btn:hover{background:#f0f6fb!important;color:#1f679b!important}'+
  'html body #'+PANEL_ID+' .qfixed-btn.active{background:#dfeef9!important;color:#1978b7!important;font-weight:800!important}'+
  'html body #'+PANEL_ID+' .qfixed-dot{width:7px!important;height:7px!important;border:1px solid currentColor!important;border-radius:2px!important;flex:none!important;opacity:.75!important}'+
  'html body #'+PANEL_ID+' .qfixed-note{padding:11px 15px!important;color:#8a98a7!important;font-size:8.5px!important;line-height:1.45!important}'+
  'html body.qmes-fixed-production-menu #root>div>main{margin-left:268px!important;width:calc(100% - 268px)!important;max-width:none!important}'+
  '@media(max-width:900px){html body #'+PANEL_ID+'{width:188px!important}html body.qmes-fixed-production-menu #root>div>main{margin-left:242px!important;width:calc(100% - 242px)!important}}';
  document.head.appendChild(st);
}
function build(){
  ensureStyle();
  var old=document.getElementById(PANEL_ID);if(old)old.remove();
  var panel=document.createElement("aside");panel.id=PANEL_ID;panel.setAttribute("aria-label","생산관리 고정 메뉴");
  panel.innerHTML=
    '<div class="qfixed-head"><span class="qfixed-head-icon">▤</span><strong>생산관리</strong></div>'+
    '<section class="qfixed-section"><div class="qfixed-section-title"><span>작업지시 관리</span><span>⌃</span></div>'+
    '<button type="button" class="qfixed-btn" data-fixed-tab="woIssue"><span class="qfixed-dot"></span><span>작업지시 관리</span></button>'+
    '<button type="button" class="qfixed-btn" data-fixed-action="new-workorder"><span class="qfixed-dot"></span><span>신규 작업지시 등록</span></button></section>'+
    '<section class="qfixed-section"><div class="qfixed-section-title"><span>생산 운영</span><span>⌃</span></div>'+
    '<button type="button" class="qfixed-btn" data-fixed-tab="prod"><span class="qfixed-dot"></span><span>생산 진행</span></button>'+
    '<button type="button" class="qfixed-btn" data-fixed-tab="prodProcess"><span class="qfixed-dot"></span><span>생산공정 관리</span></button></section>'+
    '<div class="qfixed-note">Amaranth형 고정 메뉴 · 생산관리 기능만 표시</div>';
  panel.addEventListener("click",function(e){
    var tabBtn=e.target.closest("[data-fixed-tab]");
    if(tabBtn){navigate(tabBtn.getAttribute("data-fixed-tab"),"productionMenu");return}
    var action=e.target.closest("[data-fixed-action]");
    if(action&&action.getAttribute("data-fixed-action")==="new-workorder"){
      navigate("woIssue","productionMenu");
      setTimeout(function(){
        var btn=document.querySelector('#qmes-workorder-erp-list-v1 [data-top="new"]');
        if(btn)btn.click();
      },220);
    }
  });
  document.body.appendChild(panel);
  sync(savedTab());
}
function sync(tab){
  var current=clean(tab)||savedTab();
  document.body.classList.toggle("qmes-fixed-production-menu",!!productionTabs[current]);
  var panel=document.getElementById(PANEL_ID);
  if(panel)panel.querySelectorAll("[data-fixed-tab]").forEach(function(btn){
    btn.classList.toggle("active",btn.getAttribute("data-fixed-tab")===current);
  });
  var side=document.getElementById("qmes-erp-sidebar");
  if(side)side.querySelectorAll(".qside-item").forEach(function(btn){
    var label=clean(btn.textContent);
    var active=(current==="woIssue"&&label==="작업지시서")||(current==="prod"&&label==="생산 진행");
    if(current==="prodProcess")active=false;
    if(active){side.querySelectorAll(".qside-item").forEach(function(x){x.classList.remove("active")});btn.classList.add("active")}
  });
}
function boot(){
  build();
  window.addEventListener("qmes:navigate-tab",function(e){sync(e&&e.detail&&e.detail.tab)});
  window.addEventListener("pageshow",function(){sync(savedTab())});
  window.addEventListener("storage",function(e){if(e.key==="qmes_current_tab")sync(e.newValue)});
  setTimeout(function(){sync(savedTab())},300);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();