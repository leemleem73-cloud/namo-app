(function(){
  "use strict";
  if(window.__QMES_LOT_IQC_NAV_FIX__) return;
  window.__QMES_LOT_IQC_NAV_FIX__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const store=(key,value)=>{try{sessionStorage.setItem(key,String(value||""))}catch(_){}};
  const allButtons=()=>Array.from(document.querySelectorAll("button"));
  const exact=text=>allButtons().find(button=>clean(button.textContent)===text);

  function moveToIqc(button){
    const lot=button.dataset.lot||"";
    const name=button.dataset.name||"";
    const supplier=button.dataset.supplier||"";
    store("qmes_lot_link_pending","1");
    store("qmes_lot_link_material_lot",lot);
    store("qmes_lot_link_material_name",name);
    store("qmes_lot_link_supplier",supplier);

    const quality=exact("품질검사");
    if(quality) quality.click();

    let attempts=0;
    const timer=setInterval(()=>{
      attempts+=1;
      const iqc=allButtons().find(item=>{
        const text=clean(item.textContent);
        return text==="수입검사 (IQC)"||text==="수입검사";
      });
      if(iqc){
        clearInterval(timer);
        iqc.click();
        return;
      }
      if(attempts>=15){
        clearInterval(timer);
        store("qmes_current_tab","iqc");
        window.location.reload();
      }
    },40);
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.(".qmes-lot-iqc-link-btn");
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    moveToIqc(button);
  },true);
})();
