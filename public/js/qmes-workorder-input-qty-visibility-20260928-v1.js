/* QMES Workorder sensitive input quantity visibility V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * 투입량(계획량)·실투입량은 관리자/생산부/임원만 표시.
 * Server-side workorder sync payload is also redacted for unauthorized users.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_INPUT_QTY_VISIBILITY_V1__) return;
  window.__QMES_WORKORDER_INPUT_QTY_VISIBILITY_V1__=true;

  function clean(v){return String(v==null?"":v).trim();}
  function user(){
    var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    if(typeof u==="string") u={name:u};
    try{
      var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");
      if(s&&typeof s==="object")u=Object.assign({},u,s);
    }catch(_){}
    return u||{};
  }
  function canView(){
    var u=user();
    var role=clean(u.role).toLowerCase();
    var dept=clean(u.department);
    var title=clean(u.title||u.position||u.rank||u.jobTitle||u.job_title);
    return role==="admin"||role==="administrator"||role==="관리자"||
      dept==="생산부"||
      /^(이사|상무|전무|부사장|사장|대표|대표이사|회장|임원)$/.test(title);
  }
  function isWorkorderPage(){
    var txt=clean(document.body&&document.body.innerText);
    return /작업지시 관리|작업지시서|신규 작업지시|발행 내역/.test(txt);
  }
  function targetHeader(txt){
    txt=clean(txt).replace(/\s+/g,"");
    return txt==="계획량"||txt==="투입량"||txt==="실투입량";
  }
  function hideTableColumns(table){
    var ths=[...table.querySelectorAll("thead th")];
    if(!ths.length)return;
    var indexes=[];
    ths.forEach(function(th,i){if(targetHeader(th.textContent))indexes.push(i);});
    if(!indexes.length)return;
    [...table.rows].forEach(function(row){
      indexes.slice().sort((a,b)=>b-a).forEach(function(i){
        var cell=row.cells&&row.cells[i];
        if(cell)cell.style.setProperty("display","none","important");
      });
    });
  }
  function hideLooseLabels(root){
    root.querySelectorAll("label,span,div").forEach(function(el){
      var t=clean(el.textContent).replace(/\s+/g,"");
      if(t==="생산계획량(kg)"||t==="계획량"||t==="투입량"||t==="실투입량"){
        var field=el.closest("label")||el.parentElement;
        if(field&&field.querySelector("input,select"))field.style.setProperty("display","none","important");
      }
    });
  }
  function apply(){
    if(canView())return;
    if(!isWorkorderPage())return;
    document.querySelectorAll("table").forEach(hideTableColumns);
    hideLooseLabels(document);
  }
  let frame=0;
  function schedule(){
    if(frame)return;
    frame=requestAnimationFrame(function(){frame=0;apply();});
  }
  function boot(){
    apply();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",function(){setTimeout(schedule,0);});
    window.addEventListener("qmes:erp-data-changed",schedule);
    window.addEventListener("qmes:purchase-db-refresh",schedule);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();