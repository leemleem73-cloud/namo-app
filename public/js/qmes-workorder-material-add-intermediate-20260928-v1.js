/* QMES Workorder material controls V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Keeps the existing workorder screen and adds/normalizes:
 * - "원료 추가" button label
 * - intermediate-batch choices in the material selector
 * - visible "투입상태" column/values
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_MATERIAL_ADD_INTERMEDIATE_20260928_V1__) return;
  window.__QMES_WORKORDER_MATERIAL_ADD_INTERMEDIATE_20260928_V1__=true;

  var INTERMEDIATE=[
    "중간배치(SBR 바인더)",
    "중간배치(PVDF 바인더)",
    "중간배치(SBS 바인더)"
  ];
  var scheduled=false;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}

  function isWorkorderMaterialTable(table){
    if(!table)return false;
    var text=clean(table.querySelector("thead")&&table.querySelector("thead").textContent);
    return /원재료명/.test(text)&&/LOT/.test(text)&&(/계획량/.test(text)||/투입량/.test(text));
  }

  function ensureIntermediateOptions(select){
    if(!select||select.tagName!=="SELECT")return;
    var values=Array.from(select.options).map(function(o){return clean(o.value||o.textContent);});
    if(!values.some(function(v){return /중간배치 선택/.test(v);})){
      var ph=document.createElement("option");
      ph.value="중간배치 선택";
      ph.textContent="중간배치 선택";
      ph.disabled=true;
      select.appendChild(ph);
    }
    INTERMEDIATE.forEach(function(name){
      if(values.indexOf(name)>=0)return;
      var opt=document.createElement("option");
      opt.value=name;
      opt.textContent=name;
      select.appendChild(opt);
    });
  }

  function ensureStatusColumn(table){
    var heads=Array.from(table.querySelectorAll("thead th"));
    if(!heads.length)return;
    var hasStatus=heads.some(function(th){return /투입상태/.test(clean(th.textContent));});
    if(!hasStatus){
      var lotIndex=heads.findIndex(function(th){return /LOT/.test(clean(th.textContent));});
      if(lotIndex<0)return;
      var th=document.createElement("th");
      th.textContent="투입상태";
      th.className="text-center py-1.5 px-2 font-medium";
      var headRow=heads[0].parentElement;
      headRow.insertBefore(th,headRow.children[lotIndex+1]||null);

      Array.from(table.querySelectorAll("tbody tr")).forEach(function(tr){
        if(tr.querySelector("th[colspan]"))return;
        var td=document.createElement("td");
        td.className="py-1.5 px-2";
        td.innerHTML='<select class="qmes-wo-input-status" style="width:100%;height:34px;border:1px solid #d9e2e8;border-radius:7px;padding:0 7px;background:#fff;color:#20394f;font-size:10px"><option value="신규">신규</option><option value="잔량">잔량</option></select>';
        tr.insertBefore(td,tr.children[lotIndex+1]||null);
      });
    }
  }

  function patch(){
    scheduled=false;
    var tables=Array.from(document.querySelectorAll("table")).filter(isWorkorderMaterialTable);
    tables.forEach(function(table){
      ensureStatusColumn(table);

      Array.from(table.querySelectorAll("tbody tr")).forEach(function(tr){
        var selects=Array.from(tr.querySelectorAll("select"));
        var materialSelect=selects.find(function(s){
          return Array.from(s.options).some(function(o){
            var t=clean(o.textContent);
            return /NMP|Binder|Boehmite|SBR|PVDF|SBS|중간배치/.test(t);
          });
        });
        if(materialSelect)ensureIntermediateOptions(materialSelect);
      });

      var scope=table.closest(".qmes-wo-issue-shell")||table.parentElement&&table.parentElement.parentElement||document;
      Array.from(scope.querySelectorAll("button")).forEach(function(btn){
        var t=clean(btn.textContent);
        if(t==="행 추가"||t==="＋ 행 추가"||t==="+ 행 추가"){
          btn.innerHTML=btn.innerHTML.replace(/행 추가/g,"원료 추가");
          btn.setAttribute("title","원재료 또는 중간배치 원료 추가");
        }
      });
    });
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(patch);
  }

  var observer=new MutationObserver(schedule);
  function boot(){
    patch();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",schedule);
    window.addEventListener("qmes:erp-data-changed",schedule);
    window.addEventListener("qmes:shared-sync-complete",schedule);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();