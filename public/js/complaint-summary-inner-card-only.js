(function(){
  "use strict";
  if(window.__QMES_COMPLAINT_INNER_CARD_ONLY_V2__) return;
  window.__QMES_COMPLAINT_INNER_CARD_ONLY_V2__=true;

  const STYLE_ID="qmes-complaint-inner-card-only-v2-style";
  const LABELS=["당월 접수","진행중 (Open)","진행중","완료 (Close)","완료","초동 회신 준수율"];
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-complaint-force-clean,
      .qmes-complaint-force-clean:hover,
      .qmes-complaint-force-clean:focus,
      .qmes-complaint-force-clean:active{
        border-color:#475569!important;
        outline:0!important;
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        clip-path:none!important;
        mask:none!important;
        -webkit-mask:none!important;
        transform:none!important;
        transition:none!important;
        animation:none!important;
      }
      .qmes-complaint-force-clean::before,
      .qmes-complaint-force-clean::after,
      .qmes-complaint-force-clean *::before,
      .qmes-complaint-force-clean *::after{
        content:none!important;
        display:none!important;
        border:0!important;
        background:none!important;
        box-shadow:none!important;
        animation:none!important;
      }
      .qmes-complaint-force-clean svg,
      .qmes-complaint-force-clean img,
      .qmes-complaint-force-clean [role="img"],
      .qmes-complaint-force-clean [class*="icon" i],
      .qmes-complaint-force-clean [class*="alert" i],
      .qmes-complaint-force-clean [class*="warning" i],
      .qmes-complaint-force-clean [class*="decoration" i]{display:none!important;}
      .qmes-complaint-force-clean *{
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        animation:none!important;
        transition:none!important;
      }
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
      .qmes-complaint-summary-outer-clean::after{content:none!important;display:none!important;}
      .qmes-complaint-summary-inner{width:100%!important;margin:0!important;position:relative!important;inset:auto!important;transform:none!important;}
    `;
    document.head.appendChild(style);
  }

  const isLabel=element=>LABELS.includes(clean(element.textContent));
  const cardLike=element=>{
    if(!element||element===document.body)return false;
    const cls=String(element.className||"");
    const css=getComputedStyle(element);
    return /rounded|border|card|panel/i.test(cls)||parseFloat(css.borderTopWidth)>0||parseFloat(css.borderRadius)>0;
  };
  function nearestCard(element){
    let node=element?.parentElement;
    while(node&&node!==document.body){
      const text=clean(node.textContent);
      if(text.length<180&&cardLike(node))return node;
      node=node.parentElement;
    }
    return null;
  }
  function outerCard(inner){
    let node=inner?.parentElement;
    while(node&&node!==document.body){
      const text=clean(node.textContent);
      if(text.length<280&&cardLike(node))return node;
      node=node.parentElement;
    }
    return null;
  }

  function stripVisuals(scope){
    if(!scope)return;
    scope.classList.add("qmes-complaint-force-clean");
    scope.querySelectorAll("svg,img,[role='img'],[class*='icon' i],[class*='alert' i],[class*='warning' i],[class*='decoration' i]").forEach(node=>{
      node.style.setProperty("display","none","important");
      node.setAttribute("aria-hidden","true");
    });
    scope.querySelectorAll("*").forEach(node=>{
      const css=getComputedStyle(node);
      if(css.backgroundImage&&css.backgroundImage!=="none")node.style.setProperty("background-image","none","important");
      if(css.animationName&&css.animationName!=="none")node.style.setProperty("animation","none","important");
    });
  }

  function refine(){
    installStyle();
    const labels=Array.from(document.querySelectorAll("div,span,p,h1,h2,h3,h4,h5")).filter(isLabel);
    labels.forEach(label=>{
      const inner=nearestCard(label);
      const outer=outerCard(inner);
      if(!inner)return;
      inner.classList.add("qmes-complaint-summary-inner");
      stripVisuals(inner);
      if(outer&&outer!==inner){
        outer.classList.add("qmes-complaint-summary-outer-clean");
        stripVisuals(outer);
        Array.from(outer.children).forEach(child=>{
          if(child===inner||child.contains(inner)||inner.contains(child))return;
          const text=clean(child.textContent);
          if(!text||child.querySelector?.("svg,img")||/^[!⚠❗]+$/.test(text)){
            child.style.setProperty("display","none","important");
            child.setAttribute("aria-hidden","true");
          }
        });
      }
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;refine();}));
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("load",schedule);
  schedule();
})();