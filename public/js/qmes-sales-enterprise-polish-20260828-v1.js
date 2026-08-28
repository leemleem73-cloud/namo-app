/* NAMO QMES - Enterprise Sales polish V1.1 - 2026-08-28
 * ADD-ONLY visual patch owner.
 * 1) Normalizes header/body row height, vertical alignment and column spacing.
 * 2) Keeps production-plan text fully visible instead of ellipsis.
 * 3) Forces every visible '신규 수주' action on the Sales page to the current NAMO new-order owner.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ENTERPRISE_POLISH_20260828_V1__)return;
  window.__QMES_SALES_ENTERPRISE_POLISH_20260828_V1__=true;

  const HOST="qmes-sales-enterprise-module-v2";
  const STYLE="qmes-sales-enterprise-polish-style-20260828-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

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
      #${HOST} thead tr{height:48px!important}
      #${HOST} tbody tr{height:56px!important}
      #${HOST} th,
      #${HOST} td{
        box-sizing:border-box!important;
        height:inherit!important;
        padding:0 14px!important;
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
      #${HOST} th:nth-child(1),#${HOST} td:nth-child(1){width:180px!important;text-align:left!important;padding-left:22px!important}
      #${HOST} th:nth-child(2),#${HOST} td:nth-child(2){width:170px!important;text-align:left!important}
      #${HOST} th:nth-child(3),#${HOST} td:nth-child(3){width:210px!important;text-align:left!important}
      #${HOST} th:nth-child(4),#${HOST} td:nth-child(4){width:130px!important}
      #${HOST} th:nth-child(5),#${HOST} td:nth-child(5){width:150px!important}
      #${HOST} th:nth-child(6),#${HOST} td:nth-child(6){
        width:210px!important;
        min-width:210px!important;
        max-width:none!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
        text-align:center!important;
      }
      #${HOST} td:nth-child(6){font-size:11.5px!important;font-weight:800!important;color:#253047!important}
      #${HOST} th:nth-child(7),#${HOST} td:nth-child(7){width:150px!important}
      #${HOST} th:nth-child(8),#${HOST} td:nth-child(8){width:130px!important}
      #${HOST} .order{
        display:inline-flex!important;
        align-items:center!important;
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
      @media(max-width:900px){
        #${HOST} th,#${HOST} td{padding-left:10px!important;padding-right:10px!important}
        #${HOST} th:nth-child(1),#${HOST} td:nth-child(1){padding-left:14px!important}
        #${HOST} th:nth-child(6),#${HOST} td:nth-child(6){min-width:180px!important;width:180px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function openNewOrder(){
    if(window.qmesSalesNewOrderNamoV5?.open){
      window.qmesSalesNewOrderNamoV5.open();
      return true;
    }
    if(window.qmesSalesNewOrderNamoV4?.open){
      window.qmesSalesNewOrderNamoV4.open();
      return true;
    }
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
    [80,200,500,1000].forEach(ms=>setTimeout(installStyle,ms));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesEnterprisePolish={installStyle,openNewOrder};
})();
