/* QMES centered raw-inventory layout and definitive status colors - additive patch, 2026-08-10 */
(function installCenteredInventoryLayout(global){
  "use strict";
  if(global.__QMES_CENTERED_INVENTORY_LAYOUT_20260810__) return;
  global.__QMES_CENTERED_INVENTORY_LAYOUT_20260810__=true;

  function text(value){return String(value??"").trim();}

  const style=document.createElement("style");
  style.id="qmes-centered-inventory-layout-v4";
  style.textContent=`
    table.qmes-raw-inventory-balanced{
      width:100%!important;
      min-width:1120px!important;
      table-layout:fixed!important;
    }
    table.qmes-raw-inventory-balanced col:nth-child(1){width:8%!important}
    table.qmes-raw-inventory-balanced col:nth-child(2){width:17%!important}
    table.qmes-raw-inventory-balanced col:nth-child(3){width:10%!important}
    table.qmes-raw-inventory-balanced col:nth-child(4){width:10%!important}
    table.qmes-raw-inventory-balanced col:nth-child(5){width:15%!important}
    table.qmes-raw-inventory-balanced col:nth-child(6){width:16%!important}
    table.qmes-raw-inventory-balanced col:nth-child(7){width:16%!important}
    table.qmes-raw-inventory-balanced col:nth-child(8){width:8%!important}
    table.qmes-raw-inventory-balanced thead th,
    table.qmes-raw-inventory-balanced tbody td,
    table.qmes-raw-inventory-balanced tfoot td{
      text-align:center!important;
      vertical-align:middle!important;
      padding-left:10px!important;
      padding-right:10px!important;
    }
    table.qmes-raw-inventory-balanced .qmes-safety-stock-input-v2{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
    }
    table.qmes-raw-inventory-balanced td.qmes-status-normal,
    table.qmes-raw-inventory-balanced td.qmes-status-shortage{
      text-align:center!important;
    }
    table.qmes-raw-inventory-balanced .qmes-inventory-total-foot .qmes-total-label,
    table.qmes-raw-inventory-balanced .qmes-inventory-total-foot .qmes-total-value{
      text-align:center!important;
    }
  `;
  document.head.appendChild(style);

  function findTable(){
    return Array.from(document.querySelectorAll("table")).find((table)=>{
      const labels=Array.from(table.querySelectorAll("thead th")).map((th)=>text(th.textContent));
      return labels.includes("자재코드")&&labels.includes("현재고")&&labels.includes("안전재고")&&labels.includes("상태");
    })||null;
  }

  function paintBadge(cell,status){
    const badge=cell?.firstElementChild||cell;
    if(!badge) return;
    const normal=status==="정상";
    const shortage=status==="부족";
    if(!normal&&!shortage) return;
    const color=normal?"#6ee7b7":"#fda4af";
    const background=normal?"rgba(16,185,129,.18)":"rgba(225,29,72,.2)";
    const border=normal?"rgba(52,211,153,.72)":"rgba(251,113,133,.76)";
    badge.style.setProperty("color",color,"important");
    badge.style.setProperty("background",background,"important");
    badge.style.setProperty("border-color",border,"important");
    badge.style.setProperty("box-shadow",normal?"0 0 14px rgba(16,185,129,.12)":"0 0 14px rgba(225,29,72,.13)","important");
  }

  function apply(){
    const table=findTable();
    if(!table) return;
    table.classList.add("qmes-raw-inventory-balanced");
    const labels=Array.from(table.querySelectorAll("thead th")).map((th)=>text(th.textContent));
    const statusIndex=labels.indexOf("상태");
    table.querySelectorAll("thead th,tbody td,tfoot td").forEach((cell)=>{
      cell.style.setProperty("text-align","center","important");
      cell.style.setProperty("vertical-align","middle","important");
    });
    if(statusIndex>=0){
      table.querySelectorAll("tbody tr").forEach((row)=>{
        const cell=row.cells?.[statusIndex];
        if(!cell) return;
        const status=text(cell.textContent);
        cell.classList.toggle("qmes-status-normal",status==="정상");
        cell.classList.toggle("qmes-status-shortage",status==="부족");
        paintBadge(cell,status);
      });
    }
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    global.requestAnimationFrame(()=>{queued=false;apply();});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  ["qmes:data-updated","qmes:inventory-stage3-ready","focus"].forEach((eventName)=>global.addEventListener(eventName,schedule));
})(window);
