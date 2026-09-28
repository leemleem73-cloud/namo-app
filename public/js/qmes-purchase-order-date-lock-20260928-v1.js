/* QMES Purchase Order Date Lock V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Keeps 발주일 synchronized to the YYYY-MM-DD part of 발주번호.
 * Applies to local cache, authoritative in-memory rows, visible ledger cells,
 * and edit-button pre-open state.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_ORDER_DATE_LOCK_20260928_V1__) return;
  window.__QMES_PURCHASE_ORDER_DATE_LOCK_20260928_V1__=true;

  var STORE="qmes-erp-purchase-v1";
  var scheduled=false;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function rowNo(r){return clean(r&&(r.purchaseNo||r.purchase_no||r.no||r.id));}
  function dateFromNo(no){
    var m=clean(no).match(/^(20\d{2}-\d{2}-\d{2})-\d+$/);
    return m?m[1]:"";
  }
  function normalizeRow(r){
    if(!r||typeof r!=="object") return r;
    var d=dateFromNo(rowNo(r));
    if(!d) return r;
    var out=Object.assign({},r);
    out.orderDate=d;
    out.order_date=d;
    out.date=d;
    return out;
  }
  function normalizeArray(rows){
    if(!Array.isArray(rows)) return rows;
    var changed=false;
    var next=rows.map(function(r){
      var d=dateFromNo(rowNo(r));
      if(!d) return r;
      var current=clean(r&&(r.orderDate||r.order_date||r.date)).slice(0,10);
      if(current===d) return r;
      changed=true;
      return normalizeRow(r);
    });
    return changed?next:rows;
  }
  function normalizeMemory(){
    try{
      if(Array.isArray(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__)){
        var mem=normalizeArray(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__);
        if(mem!==window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__){
          window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=mem;
        }
      }
    }catch(_){}

    try{
      var raw=JSON.parse(localStorage.getItem(STORE)||"[]");
      var isObj=raw&&typeof raw==="object"&&!Array.isArray(raw);
      var rows=Array.isArray(raw)?raw:(isObj&&Array.isArray(raw.rows)?raw.rows:[]);
      var next=normalizeArray(rows);
      if(next!==rows){
        if(Array.isArray(raw)) localStorage.setItem(STORE,JSON.stringify(next));
        else{
          var obj=Object.assign({},raw,{rows:next});
          localStorage.setItem(STORE,JSON.stringify(obj));
        }
      }
    }catch(_){}
  }
  function normalizeLedgerDom(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll(".qmes-purchase-ledger-v1 .qpo-table tbody tr").forEach(function(tr){
      var cells=tr.children;
      if(!cells||cells.length<3) return;
      var no=clean(cells[2]&&cells[2].textContent);
      var d=dateFromNo(no);
      if(!d) return;
      if(clean(cells[1].textContent)!==d) cells[1].textContent=d;
    });
  }
  function run(){
    scheduled=false;
    normalizeMemory();
    normalizeLedgerDom(document);
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(run);
  }
  function buttonIsPurchaseEdit(btn){
    return btn && btn.tagName==="BUTTON" &&
      (btn.getAttribute("data-action")==="edit" || clean(btn.textContent)==="수정") &&
      Boolean(btn.closest(".qmes-purchase-ledger-v1"));
  }

  window.addEventListener("pointerdown",function(e){
    var t=e.target instanceof Element?e.target:null;
    var btn=t&&t.closest("button");
    if(buttonIsPurchaseEdit(btn)) normalizeMemory();
  },true);

  ["qmes:purchase-db-refresh","qmes:erp-data-changed","qmes:shared-sync-complete","focus"]
    .forEach(function(name){window.addEventListener(name,schedule);});

  window.addEventListener("storage",function(e){
    if(e.key===STORE) schedule();
  });

  var observer=new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var nodes=records[i].addedNodes||[];
      for(var j=0;j<nodes.length;j++){
        var n=nodes[j];
        if(!(n instanceof Element)) continue;
        if(n.matches(".qmes-purchase-ledger-v1,.qpo-table,tr") || n.querySelector(".qmes-purchase-ledger-v1,.qpo-table,tr")){
          schedule();
          return;
        }
      }
    }
  });

  function boot(){
    run();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    [100,350,900,1800].forEach(function(ms){setTimeout(schedule,ms);});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();

  window.qmesPurchaseOrderDateLockV1={run:run,normalizeMemory:normalizeMemory};
})();