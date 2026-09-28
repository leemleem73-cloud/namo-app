/* NAMO QMES - Workorder attached form owner V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Applies the attached work-instruction visual layout to the native screen.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_ATTACHED_FORM_V1__) return;
  window.__QMES_WORKORDER_ATTACHED_FORM_V1__=true;
  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function findRoot(){
    var title=[].slice.call(document.querySelectorAll("h1,h2,h3")).find(function(el){return clean(el.textContent)==="작업지시 관리"||clean(el.textContent)==="작업지시서";});
    if(!title) return null;
    var root=title.parentElement;
    while(root&&root!==document.body){
      if(root.querySelector&&root.querySelector(".qmes-wo-issue-shell,.qmes-issued-table-v2")) return root;
      root=root.parentElement;
    }
    return null;
  }
  function insertSection(before,text,key){
    if(!before||!before.parentNode) return;
    var id="qmes-wo-section-"+key;
    if(before.parentNode.querySelector("#"+id)) return;
    var d=document.createElement("div");
    d.id=id;
    d.className="qmes-wo-section-title";
    d.textContent=text;
    before.parentNode.insertBefore(d,before);
  }
  function approval(shell){
    if(!shell||shell.querySelector(".qmes-wo-approval-box")) return;
    var panel=shell.firstElementChild||shell;
    var box=document.createElement("div");
    box.className="qmes-wo-approval-box";
    box.innerHTML='<div class="label">결재</div><div class="head">작성</div><div class="head">검토</div><div class="head">승인</div><div class="sign">성명/서명</div><div class="sign">성명/서명</div><div class="sign">성명/서명</div>';
    panel.insertBefore(box,panel.firstChild);
  }
  function relabel(root){
    root.querySelectorAll(".qmes-wo-form-field").forEach(function(field){
      var label=field.querySelector(":scope > span:first-child");
      if(!label) return;
      var t=clean(label.textContent);
      if(t==="공정 / 품목 (Grd.)") label.textContent="품명";
      else if(t==="생산일자") label.textContent="작업일자";
      else if(t==="LOT No.") label.textContent="생산 LOT";
      else if(t==="작업시간") label.textContent="작업시간";
      if(t==="작업구분"||t==="생산구분"||t==="근무유형"||t==="생산계획량 (kg)") field.setAttribute("data-wo-hidden","1");
      else field.removeAttribute("data-wo-hidden");
    });
  }
  function apply(){
    var root=findRoot();
    if(!root) return;
    root.classList.add("qmes-workorder-attached-form");
    var title=[].slice.call(root.querySelectorAll("h1,h2,h3")).find(function(el){return /작업지시/.test(clean(el.textContent));});
    if(title) title.textContent="작업지시서";
    var newBtn=root.querySelector(".qmes-iqc-new-btn");
    if(newBtn&&/신규/.test(clean(newBtn.textContent))) {
      var icon=newBtn.querySelector("svg");
      newBtn.textContent="신규 작업지시";
      if(icon) newBtn.insertBefore(icon,newBtn.firstChild);
    }
    var shell=root.querySelector(".qmes-wo-issue-shell");
    if(shell){
      approval(shell);
      relabel(shell);
      var grid=shell.querySelector(".qmes-wo-form-grid");
      if(grid) insertSection(grid,"기본 정보","basic");
      var material=shell.querySelector(".qmes-material-table")?.closest(".mt-4");
      if(material){
        material.classList.add("qmes-wo-material-section");
        insertSection(material,"1. 원료 투입","material");
      }
      var binder=[].slice.call(shell.querySelectorAll(".mt-4")).find(function(el){return /바인더 솔루션 포장정보/.test(clean(el.textContent));});
      if(binder) insertSection(binder,"2. 제품 LOT / 포장","pack");
    }
  }
  var queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply();});}
  function boot(){
    apply();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",schedule);
    window.addEventListener("qmes:data-updated",schedule);
    window.addEventListener("focus",schedule);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();