(function(){
  "use strict";
  if(window.__QMES_LOT_DETAIL_ALIGNMENT_20260806__) return;
  window.__QMES_LOT_DETAIL_ALIGNMENT_20260806__=true;

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
  style.id="qmes-lot-detail-alignment-20260806-style";
  style.textContent=`
    .qmes-production-table tbody td:last-child{text-align:center!important;white-space:nowrap!important;}
    .qmes-production-table tbody td:last-child > *{
      display:inline-flex!important;width:fit-content!important;min-width:0!important;max-width:100%!important;
      height:auto!important;min-height:24px!important;margin:0 auto!important;padding:3px 7px!important;
      align-items:center!important;justify-content:center!important;line-height:16px!important;white-space:nowrap!important;flex:none!important;
    }
    .qmes-lot-detail-centered{min-width:0!important;overflow:hidden!important;}
    .qmes-lot-detail-centered table{width:100%!important;table-layout:fixed!important;}
    .qmes-lot-detail-centered th,.qmes-lot-detail-centered td{
      box-sizing:border-box!important;padding:10px 8px!important;text-align:center!important;
      vertical-align:middle!important;line-height:20px!important;
    }
    .qmes-lot-detail-centered th{font-weight:700!important;white-space:nowrap!important;}
    .qmes-lot-detail-centered td{word-break:keep-all!important;}
    .qmes-lot-detail-centered td > *,.qmes-lot-detail-centered th > *{
      margin-left:auto!important;margin-right:auto!important;text-align:center!important;justify-content:center!important;
    }
    .qmes-lot-detail-centered .qmes-lot-detail-row{
      grid-template-columns:120px minmax(0,1fr) auto!important;align-items:center!important;
      gap:12px!important;padding:11px 8px!important;text-align:center!important;
    }
    .qmes-lot-detail-centered .qmes-lot-detail-row > *{text-align:center!important;justify-self:center!important;}
    .qmes-lot-detail-centered .qmes-lot-detail-row > div{width:100%!important;}

    .qmes-lot-production-horizontal{min-width:0!important;overflow:hidden!important;}
    .qmes-lot-production-horizontal .qmes-lot-detail-row{
      display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;
      justify-content:flex-start!important;gap:8px 14px!important;width:100%!important;max-width:100%!important;
      min-width:0!important;box-sizing:border-box!important;padding:11px 12px!important;text-align:left!important;
      overflow:hidden!important;
    }
    .qmes-lot-production-horizontal .qmes-lot-detail-row > *{
      width:auto!important;min-width:0!important;max-width:100%!important;flex:0 1 auto!important;
      justify-self:auto!important;margin:0!important;text-align:left!important;white-space:normal!important;
      overflow-wrap:anywhere!important;box-sizing:border-box!important;
    }
    .qmes-lot-production-horizontal .qmes-lot-detail-row > *:last-child{
      flex:1 1 240px!important;min-width:0!important;white-space:normal!important;
    }
    .qmes-lot-production-horizontal .qmes-lot-detail-row button,
    .qmes-lot-production-horizontal .qmes-lot-detail-row [class*="rounded"]{
      width:max-content!important;max-width:100%!important;min-width:0!important;flex:0 0 auto!important;
    }
    .qmes-lot-production-hidden{display:none!important;}

    .qmes-lot-detail-centered .qmes-lot-shipment-grid{align-items:stretch!important;gap:10px!important;}
    .qmes-lot-detail-centered .qmes-lot-shipment-grid > div{
      display:flex!important;min-height:68px!important;flex-direction:column!important;align-items:center!important;
      justify-content:center!important;padding:9px 8px!important;text-align:center!important;
    }
    .qmes-lot-detail-centered .qmes-lot-shipment-grid > div > div{
      margin-left:auto!important;margin-right:auto!important;text-align:center!important;
    }
  `;
  document.head.appendChild(style);

  function sanitizeOwner(scope){
    Array.from(scope.querySelectorAll("div,span,p,small,strong"))
      .filter(node=>!Array.from(node.children).some(child=>/품질부\s*박현아\s*\(U-0010\)/.test(clean(child.textContent))))
      .forEach(node=>{
        const text=clean(node.textContent);
        if(!/품질부\s*박현아\s*\(U-0010\)/.test(text)) return;
        if(/^담당\s*:/.test(text)||/^담당\s*품질부/.test(text)){
          node.textContent="담당:";
        }else{
          node.classList.add("qmes-lot-production-hidden");
        }
      });
  }

  function hideTime(scope){
    const timePattern=/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*)?\d{1,2}:\d{2}(?::\d{2})?$/;
    Array.from(scope.querySelectorAll("div,span,p,small,time,strong"))
      .filter(node=>!node.children.length&&timePattern.test(clean(node.textContent)))
      .forEach(node=>node.classList.add("qmes-lot-production-hidden"));
  }

  function arrangeProductionRow(row){
    hideTime(row);
    const children=Array.from(row.children);
    if(!children.length) return;

    const issue=children.find(child=>{
      const text=clean(child.textContent);
      return /작업지시/.test(text)&&/발행/.test(text);
    });
    if(issue) row.insertBefore(issue,row.firstElementChild);
    sanitizeOwner(row);
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
        hideTime(panel);
        sanitizeOwner(panel);
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
