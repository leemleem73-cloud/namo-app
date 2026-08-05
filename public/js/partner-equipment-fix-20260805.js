(function(){
  "use strict";
  if(window.__QMES_PARTNER_EQUIPMENT_FIX_20260805__) return;
  window.__QMES_PARTNER_EQUIPMENT_FIX_20260805__=true;

  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const all=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"));

  const style=document.createElement("style");
  style.textContent=`
    .qmes-partner-title-card-separated{margin-bottom:20px!important;}
    .qmes-partner-search-row{position:relative!important;}
    .qmes-partner-search-row input{padding-right:40px!important;text-align:center!important;}
    .qmes-partner-search-row input::placeholder{text-align:center!important;}
    .qmes-partner-search-button{
      position:absolute!important;right:4px!important;top:50%!important;
      transform:translateY(-50%)!important;width:32px!important;min-width:32px!important;
      height:32px!important;padding:0!important;margin:0!important;border:0!important;
      background:transparent!important;box-shadow:none!important;z-index:3!important;
    }
    .qmes-partner-search-button svg{width:17px!important;height:17px!important;}

    .qmes-equipment-extra-line-hidden{
      border-top:0!important;border-bottom:0!important;box-shadow:none!important;
      min-height:0!important;height:0!important;padding-top:0!important;padding-bottom:0!important;
      margin-top:0!important;margin-bottom:0!important;overflow:hidden!important;
    }
    .qmes-equipment-extra-line-hidden::before,
    .qmes-equipment-extra-line-hidden::after{display:none!important;content:none!important;}
  `;
  document.head.appendChild(style);

  function fixPartners(){
    [
      ["고객사 목록","고객사 등록"],
      ["공급업체 목록","공급업체 등록"]
    ].forEach(([titleText,buttonText])=>{
      const title=all().find(el=>clean(el.textContent)===titleText);
      if(!title) return;
      let row=title.parentElement;
      while(row&&row!==document.body){
        const hasButton=Array.from(row.querySelectorAll("button")).some(btn=>clean(btn.textContent)===buttonText);
        if(hasButton){row.classList.add("qmes-partner-title-card-separated");break;}
        row=row.parentElement;
      }
    });
  }

  function fixEquipmentLine(){
    const title=all().find(el=>clean(el.textContent)==="설비대장 현황");
    if(!title) return;
    let panel=title;
    while(panel&&panel!==document.body){
      const cls=String(panel.className||"");
      if(/rounded/.test(cls)&&/border/.test(cls)) break;
      panel=panel.parentElement;
    }
    if(!panel||panel===document.body) return;
    const prev=panel.previousElementSibling;
    if(prev){
      const text=clean(prev.textContent);
      const rect=prev.getBoundingClientRect();
      if(!text||rect.height<=12) prev.classList.add("qmes-equipment-extra-line-hidden");
    }
  }

  let queued=false;
  const run=()=>{queued=false;fixPartners();fixEquipmentLine();};
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(run);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  schedule();
})();
