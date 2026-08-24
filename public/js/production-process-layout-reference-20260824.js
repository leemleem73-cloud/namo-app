/* QMES production process layout reference - 2026-08-24
 * Keeps existing process sequence numbers and process names unchanged.
 */
(function(){
  if(window.__QMES_PROD_PROCESS_LAYOUT_REFERENCE_20260824__) return;
  window.__QMES_PROD_PROCESS_LAYOUT_REFERENCE_20260824__=true;
  const clean=v=>String(v==null?"":v).trim();

  const style=document.createElement("style");
  style.id="qmes-prod-process-layout-reference-style";
  style.textContent=`
    .qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-card-head{display:none!important}
    .qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-info{grid-template-columns:repeat(6,minmax(0,1fr))!important}
    .qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-info>div{min-height:78px!important;padding:13px 15px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
    .qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-info small{font-size:10px!important;margin-bottom:6px!important}
    .qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-info strong{font-size:16px!important}
    .qmes-prod-process.qpp-ref-layout .qpp-ref-progress{height:6px;margin-top:7px;border-radius:999px;background:#263d54;overflow:hidden}
    .qmes-prod-process.qpp-ref-layout .qpp-ref-progress>i{display:block;height:100%;border-radius:999px;background:#0ea5e9}
    .qmes-prod-process.qpp-ref-layout .qpp-worker{padding:13px 15px!important}
    .qmes-prod-process.qpp-ref-layout .qpp-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 340px!important;gap:14px!important;align-items:stretch!important}
    .qmes-prod-process.qpp-ref-layout .qpp-grid>section.qpp-card{min-width:0!important}
    .qmes-prod-process.qpp-ref-layout .qpp-grid>aside.qpp-card{min-width:0!important;height:100%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-side{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;padding:14px!important}
    .qmes-prod-process.qpp-ref-layout .qpp-sidebox{min-height:112px!important;padding:14px!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table{table-layout:fixed!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th,.qmes-prod-process.qpp-ref-layout .qpp-table td{width:auto!important;text-align:center!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(1),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(1){width:8%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(2),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(2){width:27%!important;text-align:left!important;padding-left:16px!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(3),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(3){width:20%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(4),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(4){width:13%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(5),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(5){width:13%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(6),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(6){width:8%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-table th:nth-child(7),.qmes-prod-process.qpp-ref-layout .qpp-table td:nth-child(7){width:11%!important}
    .qmes-prod-process.qpp-ref-layout .qpp-actionbar{grid-template-columns:repeat(6,minmax(105px,1fr))!important}
    .qmes-prod-process.qpp-ref-layout .qpp-actionbar button{min-height:46px!important}
    @media(max-width:1200px){.qmes-prod-process.qpp-ref-layout .qpp-grid{grid-template-columns:1fr!important}.qmes-prod-process.qpp-ref-layout .qpp-side{grid-template-columns:repeat(3,minmax(0,1fr))!important}.qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-info{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
    @media(max-width:700px){.qmes-prod-process.qpp-ref-layout .qpp-side{grid-template-columns:1fr!important}.qmes-prod-process.qpp-ref-layout>.qpp-card:first-of-type>.qpp-info{grid-template-columns:repeat(2,minmax(0,1fr))!important}.qmes-prod-process.qpp-ref-layout .qpp-actionbar{grid-template-columns:repeat(2,1fr)!important}}
  `;
  document.head.appendChild(style);

  function apply(){
    const root=document.querySelector(".qmes-prod-process");
    if(!root) return;
    root.classList.add("qpp-ref-layout");

    const info=Array.from(root.querySelectorAll(":scope > .qpp-card:first-of-type .qpp-info > div"));
    if(info.length>=6){
      const values=info.map(cell=>clean(cell.querySelector("strong")?.textContent));
      if(!root.dataset.qppRefLot){
        root.dataset.qppRefWorkType=values[0]||"-";
        root.dataset.qppRefItem=values[1]||"-";
        root.dataset.qppRefEquipment=values[2]||"-";
        root.dataset.qppRefDate=values[3]||"-";
        root.dataset.qppRefLot=values[4]||"-";
        root.dataset.qppRefPlan=values[5]||"-";
      }
      const selected=root.querySelector(".qpp-table tbody tr.active");
      const currentProcess=clean(selected?.cells?.[1]?.textContent)||"-";
      const rows=Array.from(root.querySelectorAll(".qpp-table tbody tr"));
      const done=rows.filter(row=>clean(row.cells?.[6]?.textContent)==="완료").length;
      const progress=rows.length?Math.round(done/rows.length*100):0;
      const summary=[
        ["생산 LOT",root.dataset.qppRefLot],
        ["품목",root.dataset.qppRefItem],
        ["설비 / 탱크",root.dataset.qppRefEquipment],
        ["계획수량",root.dataset.qppRefPlan],
        ["현재 공정",currentProcess],
        ["진척률",`${progress}%`]
      ];
      info.forEach((cell,index)=>{
        const small=cell.querySelector("small"),strong=cell.querySelector("strong");
        if(small&&clean(small.textContent)!==summary[index][0]) small.textContent=summary[index][0];
        if(strong&&clean(strong.textContent)!==summary[index][1]) strong.textContent=summary[index][1];
        if(index===5){
          let bar=cell.querySelector(".qpp-ref-progress");
          if(!bar){bar=document.createElement("div");bar.className="qpp-ref-progress";bar.innerHTML="<i></i>";cell.appendChild(bar);}
          const fill=bar.querySelector("i");if(fill) fill.style.width=`${progress}%`;
        }
      });
    }

    const sideTitle=root.querySelector(".qpp-grid > aside.qpp-card .qpp-card-head b");
    if(sideTitle&&clean(sideTitle.textContent)!=="현재 선택 공정") sideTitle.textContent="현재 선택 공정";
    const workerLabel=root.querySelector(":scope > .qpp-card:first-of-type .qpp-worker > div:first-child > small");
    if(workerLabel&&clean(workerLabel.textContent)!=="현재 작업자 · 1명 이상 복수선택 가능") workerLabel.textContent="현재 작업자 · 1명 이상 복수선택 가능";
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  const observer=new MutationObserver(schedule);
  const start=()=>{apply();observer.observe(document.body,{childList:true,subtree:true});document.addEventListener("click",event=>{if(event.target.closest?.(".qmes-prod-process"))setTimeout(schedule,30);},true);document.addEventListener("change",event=>{if(event.target.closest?.(".qmes-prod-process")){const root=document.querySelector(".qmes-prod-process");if(root){delete root.dataset.qppRefLot;delete root.dataset.qppRefWorkType;delete root.dataset.qppRefItem;delete root.dataset.qppRefEquipment;delete root.dataset.qppRefDate;delete root.dataset.qppRefPlan;}setTimeout(schedule,40);}},true);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
