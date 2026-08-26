/* QMES sales/delivery compact UI + current NAMO sales defaults — 2026-08-26 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPACT_UI_20260826__) return;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;

  const style=document.createElement("style");
  style.id="qmes-sales-compact-ui-20260826-style";
  style.textContent=`
    .qerp-sales-compact-form{
      display:grid!important;
      grid-template-columns:minmax(140px,.9fr) minmax(150px,1fr) minmax(150px,1fr) minmax(170px,1.15fr) minmax(110px,.7fr) auto!important;
      gap:8px!important;
      align-items:end!important;
      margin-bottom:10px!important;
    }
    .qerp-sales-compact-form .qerp-field{min-width:0!important;}
    .qerp-sales-compact-form .qerp-field label{margin-bottom:3px!important;font-size:9px!important;line-height:1.15!important;}
    .qerp-sales-compact-form .qerp-field input,
    .qerp-sales-compact-form .qerp-field select{height:32px!important;padding:0 7px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-form-actions{grid-column:auto!important;align-self:end!important;display:flex!important;gap:6px!important;white-space:nowrap!important;}
    .qerp-sales-compact-form .qerp-form-actions .qerp-btn{height:32px!important;padding:0 10px!important;font-size:11px!important;}
    .qerp-sales-compact-form .qerp-error{grid-column:1/-1!important;padding:6px 8px!important;margin:0!important;}
    @media(max-width:1280px){
      .qerp-sales-compact-form{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
      .qerp-sales-compact-form .qerp-form-actions{grid-column:1/-1!important;justify-content:flex-end!important;}
    }
  `;
  document.head.appendChild(style);

  function clean(value){return String(value||"").replace(/\s+/g," ").trim();}
  function salesRoot(){
    return Array.from(document.querySelectorAll(".qerp")).find(root=>clean(root.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  }
  function ensureOption(select,value){
    if(!select)return;
    let option=Array.from(select.options||[]).find(opt=>clean(opt.value||opt.textContent)===value);
    if(!option){option=document.createElement("option");option.value=value;option.textContent=value;select.appendChild(option);}
    if(select.value!==value){
      select.value=value;
      select.dispatchEvent(new Event("change",{bubbles:true}));
    }
  }
  function normalizeRows(root){
    root.querySelectorAll(".qerp-table tbody tr").forEach(row=>{
      const cells=row.querySelectorAll("td");
      if(cells.length<8)return;
      const customer=clean(cells[1]?.textContent);
      if(!customer||customer==="-") cells[1].textContent="현대자동차";
      const product=clean(cells[3]?.textContent);
      if(!product||product==="-"||/전도 슬러리|Binder Solution/i.test(product)) cells[3].textContent="NBA20-HM01";
      const status=clean(cells[7]?.textContent);
      if(status==="생산완료"||status==="-"||status==="검사중"){
        const badge=cells[7].querySelector(".qerp-status");
        if(badge){badge.textContent="출하검사 대기";badge.className="qerp-status orange";}
        else cells[7].textContent="출하검사 대기";
      }
    });
  }
  function apply(){
    const root=salesRoot();
    if(!root)return;
    const form=root.querySelector("form.qerp-form");
    if(form){
      form.classList.add("qerp-sales-compact-form");
      const fields=Array.from(form.querySelectorAll(".qerp-field"));
      const customerField=fields.find(field=>clean(field.querySelector("label")?.textContent)==="고객사");
      const productField=fields.find(field=>clean(field.querySelector("label")?.textContent)==="제품");
      ensureOption(customerField?.querySelector("select"),"현대자동차");
      ensureOption(productField?.querySelector("select"),"NBA20-HM01");
    }
    normalizeRows(root);
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("qmes:erp-runtime-loaded",schedule);
  window.addEventListener("qmes:erp-data-changed",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
