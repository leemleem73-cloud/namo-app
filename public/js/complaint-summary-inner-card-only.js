(function(){
  "use strict";
  if(window.__QMES_COMPLAINT_INNER_CARD_ONLY__) return;
  window.__QMES_COMPLAINT_INNER_CARD_ONLY__=true;

  const STYLE_ID="qmes-complaint-inner-card-only-style";
  const LABELS=["당월 접수","진행중 (Open)","진행중","완료 (Close)","완료","초동 회신 준수율"];
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-complaint-summary-outer-clean{
        border:0!important;
        outline:0!important;
        background:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        clip-path:none!important;
        mask:none!important;
        -webkit-mask:none!important;
        padding:0!important;
        min-height:0!important;
      }
      .qmes-complaint-summary-outer-clean::before,
      .qmes-complaint-summary-outer-clean::after{
        content:none!important;
        display:none!important;
        border:0!important;
        background:none!important;
        box-shadow:none!important;
      }
      .qmes-complaint-summary-outer-clean > svg,
      .qmes-complaint-summary-outer-clean > img,
      .qmes-complaint-summary-outer-clean > [class*="icon" i],
      .qmes-complaint-summary-outer-clean > [class*="badge" i],
      .qmes-complaint-summary-outer-clean > div:has(> svg):not(.qmes-complaint-summary-inner),
      .qmes-complaint-summary-outer-clean > span:has(> svg):not(.qmes-complaint-summary-inner){
        display:none!important;
      }
      .qmes-complaint-summary-inner{
        width:100%!important;
        margin:0!important;
        position:relative!important;
        inset:auto!important;
        transform:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  const isLabel=element=>{
    const text=clean(element.textContent);
    return LABELS.some(label=>text===label);
  };

  const looksLikeCard=element=>{
    if(!element||element===document.body) return false;
    const cls=String(element.className||"");
    const css=getComputedStyle(element);
    return /rounded|border|card|panel/i.test(cls)||parseFloat(css.borderTopWidth)>0||parseFloat(css.borderRadius)>0;
  };

  function nearestCard(element){
    let node=element?.parentElement;
    while(node&&node!==document.body){
      const text=clean(node.textContent);
      if(text.length<140&&looksLikeCard(node)) return node;
      node=node.parentElement;
    }
    return null;
  }

  function outerCard(inner){
    let node=inner?.parentElement;
    while(node&&node!==document.body){
      const text=clean(node.textContent);
      if(text.length<220&&looksLikeCard(node)) return node;
      node=node.parentElement;
    }
    return null;
  }

  function refine(){
    installStyle();
    const candidates=Array.from(document.querySelectorAll("div,span,p,h1,h2,h3,h4,h5"))
      .filter(isLabel);

    candidates.forEach(label=>{
      const inner=nearestCard(label);
      const outer=outerCard(inner);
      if(!inner||!outer||inner===outer) return;

      inner.classList.add("qmes-complaint-summary-inner");
      outer.classList.add("qmes-complaint-summary-outer-clean");

      Array.from(outer.children).forEach(child=>{
        if(child===inner||child.contains(inner)||inner.contains(child)) return;
        const childText=clean(child.textContent);
        if(!childText||child.querySelector?.("svg,img")||/^[!⚠❗]+$/.test(childText)){
          child.style.setProperty("display","none","important");
          child.setAttribute("aria-hidden","true");
        }
      });
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refine();});
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
