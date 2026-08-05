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
    .qmes-lot-detail-centered td{word-break:keep-all!important;}
    .qmes-lot-detail-centered td > *,
    .qmes-lot-detail-centered th > *{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      justify-content:center!important;
    }

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
    .qmes-lot-detail-centered .qmes-lot-detail-row > div{width:100%!important;}

    /* LOT 생산실적: 작업지시 발행 → 생산내용 순서로 한 줄 배치 */
    .qmes-lot-production-horizontal .qmes-lot-detail-row{
      display:flex!important;
      flex-direction:row!important;
      flex-wrap:nowrap!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:18px!important;
      width:100%!important;
      padding:11px 12px!important;
      text-align:left!important;
    }
    .qmes-lot-production-horizontal .qmes-lot-detail-row > *{
      width:auto!important;
      min-width:0!important;
      flex:0 0 auto!important;
      justify-self:auto!important;
      margin:0!important;
      text-align:left!important;
      white-space:nowrap!important;
    }
    .qmes-lot-production-horizontal .qmes-lot-detail-row > *:last-child{
      flex:1 1 auto!important;
      white-space:normal!important;
    }
    .qmes-lot-production-horizontal .qmes-lot-detail-row button,
    .qmes-lot-production-horizontal .qmes-lot-detail-row [class*="rounded"]{
      width:max-content!important;
      min-width:0!important;
      flex:none!important;
    }
    .qmes-lot-production-hidden{display:none!important;}

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

  function arrangeProductionRow(row){
    const children=Array.from(row.children);
    if(!children.length) return;

    /* 시간만 표시하는 칸 제거: 09:00, 09:00:00, 2026-08-05 09:00 형태 포함 */
    children.forEach(child=>{
      const text=clean(child.textContent);
      const timeOnly=/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*)?\d{1,2}:\d{2}(?::\d{2})?$/;
      if(timeOnly.test(text)) child.classList.add("qmes-lot-production-hidden");
    });

    /* 작업지시 발행 항목을 보이는 항목 중 첫 번째 위치로 이동 */
    const issue=children.find(child=>{
      const text=clean(child.textContent);
      return /작업지시/.test(text)&&/발행/.test(text);
    });
    if(issue) row.insertBefore(issue,row.firstElementChild);

    /* 담당 라벨과 품질부 사용자 문구 전체 제거 */
    Array.from(row.querySelectorAll("div,span,p,small,strong"))
      .filter(node=>{
        const text=clean(node.textContent);
        return text.length<120&&(
          /^담당\s*:/.test(text)||
          /품질부\s*박현아\s*\(U-0010\)/.test(text)||
          /^담당\s*품질부/.test(text)
        );
      })
      .forEach(node=>node.classList.add("qmes-lot-production-hidden"));
  }

  function markLotDetails(){
    const headings=Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"));
    const titles=["투입원료","생산실적","공정검사(PQC) 결과","출하정보"];
    headings.forEach(element=>{
      const titleText=clean(element.textContent);
      if(!titles.includes(titleText)) return;
      const panel=panelOf(element);
      if(!panel) return;
      panel.classList.add("qmes-lot-detail-centered");

      if(titleText==="생산실적"||titleText==="공정검사(PQC) 결과"){
        Array.from(panel.querySelectorAll("div.grid")).forEach(row=>{
          if(row.children.length>=2){
            row.classList.add("qmes-lot-detail-row");
            if(titleText==="생산실적") arrangeProductionRow(row);
          }
        });
      }

      if(titleText==="생산실적"){
        panel.classList.add("qmes-lot-production-horizontal");
        Array.from(panel.querySelectorAll("div,span,p,small,strong"))
          .filter(node=>{
            const text=clean(node.textContent);
            return text.length<120&&(
              /^담당\s*:/.test(text)||
              /품질부\s*박현아\s*\(U-0010\)/.test(text)||
              /^담당\s*품질부/.test(text)
            );
          })
          .forEach(node=>node.classList.add("qmes-lot-production-hidden"));
      }

      if(titleText==="출하정보"){
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
