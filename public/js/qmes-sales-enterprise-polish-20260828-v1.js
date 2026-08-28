/* NAMO QMES - Enterprise Sales polish V1.2 - 2026-08-28
 * Visual-only patch.
 * 1) Locks one shared column geometry for THEAD/TBODY.
 * 2) Centers every header/value on the same axis.
 * 3) Keeps production-plan text fully visible.
 * 4) Routes visible '신규 수주' action to the current NAMO new-order owner.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ENTERPRISE_POLISH_20260828_V1__)return;
  window.__QMES_SALES_ENTERPRISE_POLISH_20260828_V1__=true;

  const HOST="qmes-sales-enterprise-module-v2";
  const STYLE="qmes-sales-enterprise-polish-style-20260828-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  let observedHost=null;
  let queued=false;

  function installStyle(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement("style");
    s.id=STYLE;
    s.textContent=`
      #${HOST} .card{overflow:hidden!important}
      #${HOST} .wrap{overflow-x:auto!important;overflow-y:hidden!important}
      #${HOST} table{
        width:100%!important;
        min-width:1160px!important;
        table-layout:fixed!important;
        border-collapse:separate!important;
        border-spacing:0!important;
        margin:0!important;
      }
      #${HOST} thead{display:table-header-group!important}
      #${HOST} tbody{display:table-row-group!important}
      #${HOST} tr{display:table-row!important}
      #${HOST} thead tr{height:48px!important}
      #${HOST} tbody tr{height:56px!important}
      #${HOST} th,#${HOST} td{
        display:table-cell!important;
        box-sizing:border-box!important;
        height:inherit!important;
        padding:0 12px!important;
        border-bottom:1px solid #edf0f4!important;
        vertical-align:middle!important;
        line-height:1.25!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        text-align:center!important;
      }
      #${HOST} th{
        background:#fafbfd!important;
        color:#667085!important;
        font-size:10.5px!important;
        font-weight:900!important;
      }
      #${HOST} td{
        background:#fff!important;
        color:#253047!important;
        font-size:11.5px!important;
        font-weight:700!important;
      }
      #${HOST} tbody tr:last-child td{border-bottom:0!important}
      #${HOST} tbody tr:hover td{background:#fbfdff!important}
      #${HOST} th:nth-child(6),#${HOST} td:nth-child(6){
        padding-left:0!important;
        padding-right:0!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
        text-align:center!important;
      }
      #${HOST} td:nth-child(6){font-weight:800!important;color:#253047!important}
      #${HOST} .nse-prod-wrap{
        display:flex!important;
        width:100%!important;
        height:56px!important;
        align-items:center!important;
        justify-content:center!important;
        margin:0!important;
        padding:0!important;
        text-align:center!important;
        white-space:nowrap!important;
      }
      #${HOST} .order{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        min-height:28px!important;
        height:auto!important;
        line-height:1.2!important;
        border:0!important;
        background:transparent!important;
        padding:0!important;
        vertical-align:middle!important;
      }
      #${HOST} .st{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        min-width:62px!important;
        height:25px!important;
        padding:0 9px!important;
        line-height:1!important;
        vertical-align:middle!important;
      }
      #${HOST} .tb{margin-bottom:14px!important;align-items:center!important}
      #${HOST} .g{align-items:center!important}
      #${HOST} .g>input,#${HOST} .g>select,#${HOST} .g>button{margin:0!important;vertical-align:middle!important}
      @media(max-width:900px){#${HOST} th,#${HOST} td{padding-left:9px!important;padding-right:9px!important}#${HOST} th:nth-child(6),#${HOST} td:nth-child(6){padding-left:0!important;padding-right:0!important}}
    `;
    document.head.appendChild(s);
  }

  function normalizeTable(){
    const host=document.getElementById(HOST);
    const table=host?.querySelector("table");
    if(!host||!table)return;

    table.style.setProperty("table-layout","fixed","important");
    table.style.setProperty("width","100%","important");

    let cols=table.querySelector(":scope > colgroup[data-nse-column-lock]");
    if(!cols){
      cols=document.createElement("colgroup");
      cols.setAttribute("data-nse-column-lock","1");
      [15,15,17,10,12,14,10,7].forEach(width=>{
        const col=document.createElement("col");
        col.style.width=width+"%";
        cols.appendChild(col);
      });
      table.insertBefore(cols,table.firstChild);
    }

    table.querySelectorAll("th,td").forEach(cell=>{
      cell.style.setProperty("text-align","center","important");
      cell.style.setProperty("vertical-align","middle","important");
    });

    table.querySelectorAll("tbody tr").forEach(row=>{
      const cell=row.children[5];
      if(!(cell instanceof HTMLElement))return;
      cell.style.setProperty("padding-left","0","important");
      cell.style.setProperty("padding-right","0","important");
      let wrap=cell.querySelector(":scope > .nse-prod-wrap");
      if(!wrap){
        const text=clean(cell.textContent);
        cell.textContent="";
        wrap=document.createElement("span");
        wrap.className="nse-prod-wrap";
        wrap.textContent=text||"-";
        cell.appendChild(wrap);
      }
    });

    if(observedHost!==host){
      observedHost=host;
      const observer=new MutationObserver(()=>scheduleNormalize());
      observer.observe(host,{childList:true,subtree:true});
    }
  }

  function scheduleNormalize(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;normalizeTable();});
  }

  function openNewOrder(){
    if(window.qmesSalesNewOrderNamoV5?.open){window.qmesSalesNewOrderNamoV5.open();return true;}
    if(window.qmesSalesNewOrderNamoV4?.open){window.qmesSalesNewOrderNamoV4.open();return true;}
    return false;
  }

  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const salesRoot=target.closest(".qmes-sales-stable");
    if(!salesRoot)return;
    const button=target.closest("button");
    if(!button)return;
    const text=clean(button.textContent).replace(/^\+\s*/,"");
    if(text!=="신규 수주")return;
    if(!openNewOrder())return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  },true);

  function boot(){
    installStyle();
    normalizeTable();
    [80,200,500,1000,1800,3000].forEach(ms=>setTimeout(()=>{installStyle();normalizeTable();},ms));
    ["qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete","qmes:enterprise-ui-ready"].forEach(name=>window.addEventListener(name,scheduleNormalize));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesEnterprisePolish={installStyle,normalizeTable,openNewOrder};
})();
