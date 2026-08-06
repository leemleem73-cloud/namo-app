(function(){
  "use strict";
  if(window.__QMES_CONTEXT_SIDE_MENU_V8__) return;
  window.__QMES_CONTEXT_SIDE_MENU_V8__=true;

  const groups={
    "대시보드":["종합 대시보드","SPC 대시보드"],
    "생산관리":["생산실적","작업지시 발행","작업지시서","중간배치"],
    "품질검사":["수입검사","공정검사","출하검사","SPC","품질 인터락","출하성적서"],
    "현장입력":["현장입력"],
    "재고관리":["재고관리"],
    "거래처 현황":["고객사 목록","공급업체 목록"],
    "설비관리":["일일점검","설비대장","정기점검·교정","고장·수리 이력"],
    "LOT 추적":["완제품 추적","원료 역추적"],
    "부적합관리":["부적합","고객불만","4M 변경관리"]
  };

  const aliases={"SPC":"SPC 대시보드"};
  const topLabels=Object.keys(groups);
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style"].forEach(id=>document.getElementById(id)?.remove());

  const style=document.createElement("style");
  style.id="qmes-context-side-menu-style";
  style.textContent=`
    #qmes-context-side-menu{position:fixed!important;left:0!important;top:88px!important;bottom:0!important;z-index:999999!important;width:190px!important;display:block!important;padding:16px 12px 24px!important;overflow-y:auto!important;border-right:1px solid #2b4159!important;background:#0b1728!important;color:#e2e8f0!important;box-sizing:border-box!important}
    #qmes-context-side-menu .qmes-context-title{padding:2px 8px 13px!important;margin-bottom:8px!important;border-bottom:1px solid #2b4159!important;color:#fff!important;font-size:15px!important;font-weight:900!important}
    #qmes-context-side-menu .qmes-context-item{display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;margin:3px 0!important;padding:9px 11px!important;border:1px solid transparent!important;border-radius:8px!important;background:transparent!important;color:#aebfd1!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;box-sizing:border-box!important}
    #qmes-context-side-menu .qmes-context-item:hover{border-color:#334e68!important;background:#14263b!important;color:#fff!important}
    #qmes-context-side-menu .qmes-context-item.is-active{border-color:#2563eb!important;background:#1d4ed8!important;color:#fff!important}
    body.qmes-context-side-enabled #root>div>main,body.qmes-context-side-enabled #root main,body.qmes-context-side-enabled main,body.qmes-context-side-enabled .qmes-main-content,body.qmes-context-side-enabled .qmes-content{margin-left:190px!important;width:calc(100% - 190px)!important;box-sizing:border-box!important}
    .qmes-top-menu [role='menu'],.qmes-top-menu [class*='dropdown'],.qmes-top-menu [class*='submenu'],.qmes-top-menu [class*='sub-menu'],.qmes-top-menu .absolute,[data-qmes-legacy-dropdown-hidden='true']{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;min-width:0!important;min-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}
    @media(max-width:900px){#qmes-context-side-menu{width:160px!important}body.qmes-context-side-enabled #root>div>main,body.qmes-context-side-enabled #root main,body.qmes-context-side-enabled main,body.qmes-context-side-enabled .qmes-main-content,body.qmes-context-side-enabled .qmes-content{margin-left:160px!important;width:calc(100% - 160px)!important}}
  `;
  document.head.appendChild(style);

  const aside=document.createElement("aside");
  aside.id="qmes-context-side-menu";
  aside.innerHTML='<div class="qmes-context-title"></div><div class="qmes-context-items"></div>';
  document.body.appendChild(aside);
  document.body.classList.add("qmes-context-side-enabled");

  const nativeControls=()=>Array.from(document.querySelectorAll("button,a,[role='button']")).filter(node=>!aside.contains(node));
  const exactNative=label=>nativeControls().find(node=>clean(node.textContent)===label);

  let currentGroup=sessionStorage.getItem("qmes_context_group")||"대시보드";
  let currentItem=sessionStorage.getItem("qmes_context_item")||groups[currentGroup]?.[0]||"";
  let navigating=false;

  function render(){
    if(!groups[currentGroup]) currentGroup="대시보드";
    aside.querySelector(".qmes-context-title").textContent=currentGroup;
    const wrap=aside.querySelector(".qmes-context-items");
    wrap.replaceChildren();
    groups[currentGroup].forEach(label=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="qmes-context-item"+(label===currentItem?" is-active":"");
      button.textContent=label;
      button.dataset.label=label;
      wrap.appendChild(button);
    });
  }

  function clickNative(label){
    const target=exactNative(label)||exactNative(aliases[label]);
    if(!target)return false;
    target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));
    return true;
  }

  function navigate(label){
    if(navigating)return;
    navigating=true;
    currentItem=label;
    sessionStorage.setItem("qmes_context_group",currentGroup);
    sessionStorage.setItem("qmes_context_item",currentItem);
    render();

    const top=exactNative(currentGroup);
    if(top)top.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));

    setTimeout(()=>{
      clickNative(label);
      navigating=false;
    },180);
  }

  function hideLegacyDropdowns(){
    document.querySelectorAll("[role='menu'],[class*='dropdown'],[class*='submenu'],[class*='sub-menu']").forEach(node=>{
      if(node===aside||aside.contains(node))return;
      node.dataset.qmesLegacyDropdownHidden="true";
    });
  }

  aside.addEventListener("click",event=>{
    const button=event.target.closest(".qmes-context-item");
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    navigate(button.dataset.label);
  });

  document.addEventListener("click",event=>{
    if(navigating)return;
    const control=event.target.closest("button,a,[role='button']");
    if(!control||aside.contains(control))return;
    const label=clean(control.textContent);
    if(topLabels.includes(label)){
      currentGroup=label;
      currentItem=groups[label][0]||"";
      sessionStorage.setItem("qmes_context_group",currentGroup);
      sessionStorage.setItem("qmes_context_item",currentItem);
      render();
      setTimeout(hideLegacyDropdowns,0);
    }
  },true);

  function alignTop(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>topLabels.some(label=>clean(node.textContent).includes(label)));
    if(nav)aside.style.setProperty("top",`${Math.max(0,Math.round(nav.getBoundingClientRect().bottom))}px`,"important");
  }

  function keepMounted(){
    if(!document.body.contains(aside))document.body.appendChild(aside);
    alignTop();
    hideLegacyDropdowns();
  }

  render();
  keepMounted();
  window.addEventListener("resize",keepMounted);
  new MutationObserver(()=>requestAnimationFrame(keepMounted)).observe(document.documentElement,{childList:true,subtree:true});
})();