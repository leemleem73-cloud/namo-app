(function(){
  "use strict";
  if(window.__QMES_LOT_DETAIL_ALIGNMENT_20260805__) return;
  window.__QMES_LOT_DETAIL_ALIGNMENT_20260805__=true;

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

  const style=document.createElement("style");
  style.id="qmes-lot-detail-alignment-20260805-style";
  style.textContent=`
    /* 생산실적의 발행 상태 배지는 글자 크기만큼만 표시 */
    .qmes-production-table tbody td:last-child{
      text-align:center!important;
      white-space:nowrap!important;
    }
    .qmes-production-table tbody td:last-child > *{
      display:inline-flex!important;
      width:fit-content!important;
      min-width:0!important;
      max-width:none!important;
      height:auto!important;
      min-height:24px!important;
      margin:0 auto!important;
      padding:3px 7px!important;
      align-items:center!important;
      justify-content:center!important;
      line-height:16px!important;
      white-space:nowrap!important;
      flex:none!important;
    }

    /* LOT 상세 공통: 제목과 내용의 좌우 간격 및 가운데 정렬 통일 */
    .qmes-lot-detail-centered table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-lot-detail-centered th,
    .qmes-lot-detail-centered td{
      box-sizing:border-box!important;
      padding:10px 8px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:20px!important;
    }
    .qmes-lot-detail-centered th{
      font-weight:700!important;
      white-space:nowrap!important;
    }
    .qmes-lot-detail-centered td{
      word-break:keep-all!important;
    }
    .qmes-lot-detail-centered td > *,
    .qmes-lot-detail-centered th > *{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      justify-content:center!important;
    }

    /* 생산실적·공정검사 행 */
    .qmes-lot-detail-centered .qmes-lot-detail-row{
      grid-template-columns:120px minmax(0,1fr) auto!important;
      align-items:center!important;
      gap:12px!important;
      padding:11px 8px!important;
      text-align:center!important;
    }
    .qmes-lot-detail-centered .qmes-lot-detail-row > *{
      text-align:center!important;
      justify-self:center!important;
    }
    .qmes-lot-detail-centered .qmes-lot-detail-row > div{
      width:100%!important;
    }

    /* 출하정보 카드 */
    .qmes-lot-detail-centered .qmes-lot-shipment-grid{
      align-items:stretch!important;
      gap:10px!important;
    }
    .qmes-lot-detail-centered .qmes-lot-shipment-grid > div{
      display:flex!important;
      min-height:68px!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      padding:9px 8px!important;
      text-align:center!important;
    }
    .qmes-lot-detail-centered .qmes-lot-shipment-grid > div > div{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
    }
  `;
  document.head.appendChild(style);

  function markLotDetails(){
    const headings=Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"));
    const titles=["투입원료","생산실적","공정검사(PQC) 결과","출하정보"];
    headings.forEach(element=>{
      if(!titles.includes(clean(element.textContent))) return;
      const panel=panelOf(element);
      if(!panel) return;
      panel.classList.add("qmes-lot-detail-centered");

      if(clean(element.textContent)==="생산실적"||clean(element.textContent)==="공정검사(PQC) 결과"){
        Array.from(panel.querySelectorAll("div.grid")).forEach(row=>{
          if(row.children.length===3) row.classList.add("qmes-lot-detail-row");
        });
      }
      if(clean(element.textContent)==="출하정보"){
        const grid=Array.from(panel.querySelectorAll("div.grid")).find(node=>node.children.length>=2&&node.children.length<=5);
        if(grid) grid.classList.add("qmes-lot-shipment-grid");
      }
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;markLotDetails();});
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
