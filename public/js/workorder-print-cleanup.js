(function(){
  "use strict";
  if(window.__QMES_WORKORDER_PRINT_CLEANUP__) return;
  window.__QMES_WORKORDER_PRINT_CLEANUP__=true;

  /* 작업지시서 화면은 React 구조를 변경하지 않고 CSS로만 정리한다. */
  const style=document.createElement("style");
  style.id="qmes-workorder-list-alignment-style";
  style.textContent=`
    .qmes-issued-table-v2{
      width:100%!important;
      table-layout:fixed!important;
      border-collapse:collapse!important;
    }
    .qmes-issued-table-v2 th,
    .qmes-issued-table-v2 td{
      box-sizing:border-box!important;
      height:46px!important;
      padding:8px 6px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:20px!important;
      letter-spacing:0!important;
      white-space:nowrap!important;
      font-variant-numeric:tabular-nums!important;
    }
    .qmes-issued-table-v2 th{
      font-size:12px!important;
      font-weight:700!important;
    }
    .qmes-issued-table-v2 td{
      font-size:13px!important;
    }
    .qmes-issued-table-v2 td button,
    .qmes-issued-table-v2 td select{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
    }

    .qmes-wo-cert .qmes-wo-basic-info-table,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-cert .qmes-wo-basic-info-table th,
    .qmes-wo-cert .qmes-wo-basic-info-table td,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table th,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table td{
      box-sizing:border-box!important;
      width:25%!important;
      text-align:center!important;
      vertical-align:middle!important;
      padding-left:8px!important;
      padding-right:8px!important;
    }
    .qmes-wo-cert .qmes-wo-basic-info-table th:first-child,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table th:first-child{
      display:table-cell!important;
      font-size:15px!important;
      font-weight:700!important;
    }

    .qmes-wo-cert-material-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-cert-material-table th:first-child,
    .qmes-wo-cert-material-table td:first-child{
      box-sizing:border-box!important;
      width:4%!important;
      min-width:4%!important;
      max-width:4%!important;
      padding-left:2px!important;
      padding-right:2px!important;
      text-align:center!important;
      vertical-align:middle!important;
      white-space:nowrap!important;
      writing-mode:horizontal-tb!important;
      text-transform:uppercase!important;
      font-size:15px!important;
    }
    .qmes-wo-cert-material-table th:first-child{font-weight:700!important;}
    .qmes-wo-cert-material-table td:first-child{font-weight:400!important;}
    .qmes-wo-cert-material-table th:nth-child(2){width:17.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(3){width:17.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(4){width:7.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(5){width:10.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(6){width:10.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(7){width:12.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(8){width:8.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(9){width:14.125%!important;}

    .qmes-lot-compact-switches{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,220px))!important;
      justify-content:start!important;
      gap:8px!important;
      margin-bottom:10px!important;
    }
    .qmes-lot-compact-switches>button{
      min-height:36px!important;
      padding:7px 12px!important;
      font-size:12px!important;
      line-height:18px!important;
    }
    .qmes-lot-compact-search{
      width:min(100%,620px)!important;
      min-height:38px!important;
      padding:7px 12px!important;
      gap:9px!important;
      border-radius:9px!important;
    }
    .qmes-lot-compact-search input{
      font-size:12px!important;
      line-height:20px!important;
    }
    .qmes-lot-summary-grid{
      align-items:stretch!important;
      gap:10px!important;
    }
    .qmes-lot-summary-grid>div{
      display:flex!important;
      min-height:70px!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      padding:10px 8px!important;
      text-align:center!important;
    }
    .qmes-lot-summary-grid>div>div:first-child{
      min-height:18px!important;
      margin:0!important;
      font-size:12px!important;
      line-height:18px!important;
      font-weight:700!important;
      letter-spacing:0!important;
      text-align:center!important;
    }
    .qmes-lot-summary-grid>div>div:last-child{
      min-height:22px!important;
      margin-top:5px!important;
      font-size:14px!important;
      line-height:22px!important;
      font-weight:800!important;
      letter-spacing:0!important;
      text-align:center!important;
    }
    .qmes-lot-month-filter{
      display:flex!important;
      min-height:44px!important;
      flex-direction:row!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:12px!important;
      padding:8px 12px!important;
    }
    .qmes-lot-month-filter>div:first-child{
      min-width:72px!important;
      font-size:12px!important;
      text-align:center!important;
    }
    .qmes-lot-month-filter select{
      width:180px!important;
      min-height:34px!important;
      padding:6px 10px!important;
      text-align:center!important;
      text-align-last:center!important;
    }
    @media(max-width:640px){
      .qmes-lot-compact-switches{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
      .qmes-lot-compact-search{width:100%!important;}
      .qmes-lot-month-filter{align-items:stretch!important;flex-direction:column!important;}
      .qmes-lot-month-filter select{width:100%!important;}
    }

    @media print{
      body.print-doc #qmes-print-root > .qmes-screen-print-copy.qmes-wo-cert{
        position:absolute!important;
        top:50%!important;
        left:50%!important;
        margin:0!important;
        transform:translate(-50%,-50%) scale(.82)!important;
        transform-origin:center center!important;
      }
      .qmes-wo-cert-material-table th:first-child,
      .qmes-wo-cert-material-table td:first-child{
        width:4%!important;
        min-width:4%!important;
        max-width:4%!important;
        padding-left:2px!important;
        padding-right:2px!important;
        text-align:center!important;
        white-space:nowrap!important;
        writing-mode:horizontal-tb!important;
        text-transform:uppercase!important;
        font-size:15px!important;
      }
    }
  `;
  document.head.appendChild(style);

  if(!document.querySelector('script[data-qmes-lot-shipment-status-sync]')){
    const script=document.createElement("script");
    script.src="./js/lot-shipment-status-sync.js?v=20260805-1";
    script.async=false;
    script.dataset.qmesLotShipmentStatusSync="true";
    document.head.appendChild(script);
  }

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const classes=String(node.className||"");
      if(/rounded/.test(classes)&&/border/.test(classes)) return node;
      node=node.parentElement;
    }
    return null;
  };
  function refineLotTrace(){
    const all=Array.from(document.querySelectorAll("div,h1,h2,h3,h4,span"));
    const integratedTitle=all.find(element=>clean(element.textContent)==="LOT 통합 추적");
    const integratedPanel=panelOf(integratedTitle);
    if(integratedPanel){
      const switchButtons=Array.from(integratedPanel.querySelectorAll("button")).filter(button=>{
        const text=clean(button.textContent);
        return text==="완제품 LOT 조회"||text==="원료 LOT 역추적"||text==="완료 LOT 역추적";
      });
      if(switchButtons.length){
        const wrapper=switchButtons[0].parentElement;
        if(wrapper) wrapper.classList.add("qmes-lot-compact-switches");
      }
      const searchInput=integratedPanel.querySelector('input[placeholder*="LOT"]');
      const searchWrap=searchInput?.parentElement;
      if(searchWrap) searchWrap.classList.add("qmes-lot-compact-search");
    }

    const finishedTitle=all.find(element=>/^완제품 LOT\s*[—–-]/.test(clean(element.textContent))&&clean(element.textContent).length<80);
    const finishedPanel=panelOf(finishedTitle);
    if(finishedPanel){
      const labels=["품명","작업지시","생산수량","출하상태"];
      const summary=Array.from(finishedPanel.querySelectorAll("div")).find(element=>{
        const direct=Array.from(element.children||[]);
        return direct.length===4&&labels.every(label=>clean(element.textContent).includes(label));
      });
      if(summary) summary.classList.add("qmes-lot-summary-grid");
    }

    const monthLabel=all.find(element=>clean(element.textContent)==="월별 데이터");
    const monthWrap=monthLabel?.parentElement;
    if(monthWrap&&monthWrap.querySelector("select")) monthWrap.classList.add("qmes-lot-month-filter");
  }
  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refineLotTrace();});
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
