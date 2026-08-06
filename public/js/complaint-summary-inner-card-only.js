(function(){
  "use strict";
  if(window.__QMES_COMPLAINT_SIMPLE_FOUR_CARDS_V3__) return;
  window.__QMES_COMPLAINT_SIMPLE_FOUR_CARDS_V3__=true;

  const STYLE_ID="qmes-complaint-simple-four-cards-v3-style";
  const LABELS=["당월 접수","진행중 (Open)","진행중","완료 (Close)","완료","초동 회신 준수율"];
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();

  function installStyle(){
    document.getElementById("qmes-complaint-inner-card-only-style")?.remove();
    document.getElementById("qmes-complaint-inner-card-only-v2-style")?.remove();
    if(document.getElementById(STYLE_ID))return;

    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-complaint-summary-outer-clean{
        border:0!important;
        outline:0!important;
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        padding:0!important;
        min-height:0!important;
      }
      .qmes-complaint-summary-outer-clean::before,
      .qmes-complaint-summary-outer-clean::after{
        content:none!important;
        display:none!important;
      }
      .qmes-complaint-summary-inner,
      .qmes-complaint-summary-inner:hover,
      .qmes-complaint-summary-inner:focus,
      .qmes-complaint-summary-inner:active{
        width:100%!important;
        margin:0!important;
        position:relative!important;
        inset:auto!important;
        transform:none!important;
        border:1px solid #d7dee7!important;
        outline:0!important;
        background:#fff!important;
        background-color:#fff!important;
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        animation:none!important;
        transition:none!important;
      }
      .qmes-complaint-summary-inner::before,
      .qmes-complaint-summary-inner::after,
      .qmes-complaint-summary-inner *::before,
      .qmes-complaint-summary-inner *::after{
        content:none!important;
        display:none!important;
        background:none!important;
        background-image:none!important;
        box-shadow:none!important;
        animation:none!important;
      }
      .qmes-complaint-summary-inner svg,
      .qmes-complaint-summary-inner img,
      .qmes-complaint-summary-inner picture,
      .qmes-complaint-summary-inner [role="img"],
      .qmes-complaint-summary-inner [class*="icon" i],
      .qmes-complaint-summary-inner [class*="alert" i],
      .qmes-complaint-summary-inner [class*="warning" i],
      .qmes-complaint-summary-inner [class*="decoration" i],
      .qmes-complaint-summary-inner [class*="gradient" i]{
        display:none!important;
      }
      .qmes-complaint-summary-inner *{
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        animation:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  function cardLike(element){
    if(!element||element===document.body)return false;
    const cls=String(element.className||"");
    const css=getComputedStyle(element);
    return /rounded|border|card|panel/i.test(cls)||parseFloat(css.borderTopWidth)>0||parseFloat(css.borderRadius)>0;
  }

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

  function removeVisuals(scope){
    if(!scope)return;
    scope.querySelectorAll("svg,img,picture,[role='img'],[class*='icon' i],[class*='alert' i],[class*='warning' i],[class*='decoration' i],[class*='gradient' i]").forEach(node=>{
      node.style.setProperty("display","none","important");
      node.setAttribute("aria-hidden","true");
    });
    scope.querySelectorAll("*").forEach(node=>{
      node.style.setProperty("background-image","none","important");
      node.style.setProperty("box-shadow","none","important");
      node.style.setProperty("filter","none","important");
      node.style.setProperty("animation","none","important");
    });
  }

  function refine(){
    installStyle();
    const labels=Array.from(document.querySelectorAll("div,span,p,h1,h2,h3,h4,h5"))
      .filter(element=>LABELS.includes(clean(element.textContent)));

    labels.forEach(label=>{
      const inner=nearestCard(label);
      if(!inner)return;
      const outer=outerCard(inner);

      inner.classList.add("qmes-complaint-summary-inner");
      removeVisuals(inner);

      if(outer&&outer!==inner){
        outer.classList.add("qmes-complaint-summary-outer-clean");
        outer.style.setProperty("background-image","none","important");
        outer.style.setProperty("box-shadow","none","important");
        Array.from(outer.children).forEach(child=>{
          if(child===inner||child.contains(inner)||inner.contains(child))return;
          if(child.querySelector?.("svg,img,picture")||!clean(child.textContent)){
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
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      scheduled=false;
      refine();
    }));
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("load",schedule);
  schedule();
})();