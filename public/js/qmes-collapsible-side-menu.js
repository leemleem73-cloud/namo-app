(function(){
  "use strict";
  if(window.__QMES_CONTEXT_SIDE_MENU_V3__) return;
  window.__QMES_CONTEXT_SIDE_MENU_V3__=true;

  const groups={
    "대시보드":["종합 대시보드","SPC 대시보드"],
    "생산관리":["생산계획","생산실적","작업지시서","중간배치"],
    "품질검사":["수입검사","공정검사","출하검사","출하성적서","품질 인터락","SPC"],
    "재고관리":["재고 현황","입출고 관리","재고관리"],
    "거래처 현황":["고객사 목록","공급업체 목록","거래처 현황"],
    "설비관리":["일일점검","설비대장","정기점검·교정","고장·수리 이력","설비관리"],
    "LOT 추적":["LOT 추적"],
    "부적합관리":["부적합","고객불만","4M 변경관리"]
  };

  const aliases={
    "SPC":"SPC 대시보드",
    "품질 인터락":"품질 인터락",
    "재고 현황":"재고관리",
    "입출고 관리":"재고관리",
    "고객사 목록":"거래처 현황",
    "공급업체 목록":"거래처 현황",
    "일일점검":"설비관리",
    "설비대장":"설비관리",
    "정기점검·교정":"설비관리",
    "고장·수리 이력":"설비관리"
  };

  const topLabels=Object.keys(groups);
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const controls=()=>Array.from(document.querySelectorAll("button,a,[role='button']"));
  const exactButton=label=>controls().find(node=>clean(node.textContent)===label);
  const hasControl=label=>Boolean(exactButton(label)||exactButton(aliases[label]));

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style"].forEach(id=>document.getElementById(id)?.remove());

  const style=document.createElement("style");
  style.id="qmes-context-side-menu-style";
  style.textContent=`
    #qmes-context-side-menu{position:fixed!important;left:0!important;top:88px!important;bottom:0!important;z-index:999999!important;width:190px!important;display:block!important;visibility:visible!important;opacity:1!important;padding:16px 12px 24px!important;overflow-y:auto!important;border-right:1px solid #2b4159!important;background:#0b1728!important;color:#e2e8f0!important;box-sizing:border-box!important;transform:none!important}
    #qmes-context-side-menu .qmes-context-title{padding:2px 8px 13px!important;margin-bottom:8px!important;border-bottom:1px solid #2b4159!important;color:#fff!important;font-size:15px!important;font-weight:900!important;line-height:22px!important}
    #qmes-context-side-menu .qmes-context-item{display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;margin:3px 0!important;padding:9px 11px!important;border:1px solid transparent!important;border-radius:8px!important;background:transparent!important;color:#aebfd1!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;box-sizing:border-box!important}
    #qmes-context-side-menu .qmes-context-item:hover{border-color:#334e68!important;background:#14263b!important;color:#fff!important}
    #qmes-context-side-menu .qmes-context-item.is-active{border-color:#2563eb!important;background:#1d4ed8!important;color:#fff!important}
    body.qmes-context-side-enabled #root>div>main,
    body.qmes-context-side-enabled #root main,
    body.qmes-context-side-enabled main,
    body.qmes-context-side-enabled .qmes-main-content,
    body.qmes-context-side-enabled .qmes-content{margin-left:190px!important;width:calc(100% - 190px)!important;box-sizing:border-box!important}

    /* 상단 메뉴 마우스 오버 드롭다운 숨김 */
    .qmes-top-menu [role='menu'],
    .qmes-top-menu [class*='dropdown'],
    .qmes-top-menu [class*='submenu'],
    .qmes-top-menu [class*='sub-menu'],
    .qmes-top-menu .absolute{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}

    @media(max-width:900px){#qmes-context-side-menu{width:160px!important}body.qmes-context-side-enabled #root>div>main,body.qmes-context-side-enabled #root main,body.qmes-context-side-enabled main,body.qmes-context-side-enabled .qmes-main-content,body.qmes-context-side-enabled .qmes-content{margin-left:160px!important;width:calc(100% - 160px)!important}}
  `;
  document.head.appendChild(style);

  const aside=document.createElement("aside");
  aside.id="qmes-context-side-menu";
  aside.setAttribute("aria-label","현재 메뉴의 하위 메뉴");
  aside.innerHTML='<div class="qmes-context-title"></div><div class="qmes-context-items"></div>';
  document.body.appendChild(aside);
  document.body.classList.add("qmes-context-side-enabled");

  let currentGroup=sessionStorage.getItem("qmes_context_group")||"대시보드";
  let currentItem=sessionStorage.getItem("qmes_context_item")||groups[currentGroup]?.[0]||"";
  let navigating=false;

  function itemsFor(group){
    const configured=groups[group]||[];
    const available=configured.filter(label=>hasControl(label));
    return available.length?available:configured;
  }

  function render(){
    if(!groups[currentGroup]) currentGroup="대시보드";
    const title=aside.querySelector(".qmes-context-title");
    const items=aside.querySelector(".qmes-context-items");
    title.textContent=currentGroup;
    items.replaceChildren();
    itemsFor(currentGroup).forEach(label=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="qmes-context-item"+(label===currentItem?" is-active":"");
      button.textContent=label;
      button.dataset.label=label;
      items.appendChild(button);
    });
  }

  function navigate(label){
    if(navigating)return;
    navigating=true;
    currentItem=label;
    sessionStorage.setItem("qmes_context_group",currentGroup);
    sessionStorage.setItem("qmes_context_item",currentItem);
    render();
    const top=exactButton(currentGroup);
    if(top)top.click();
    setTimeout(()=>{
      const target=exactButton(label)||exactButton(aliases[label]);
      if(target&&target!==top)target.click();
      navigating=false;
    },120);
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
      currentItem=itemsFor(label)[0]||"";
      sessionStorage.setItem("qmes_context_group",currentGroup);
      sessionStorage.setItem("qmes_context_item",currentItem);
      setTimeout(render,0);
      return;
    }
    for(const [group,items] of Object.entries(groups)){
      if(items.includes(label)){
        currentGroup=group;
        currentItem=label;
        sessionStorage.setItem("qmes_context_group",currentGroup);
        sessionStorage.setItem("qmes_context_item",currentItem);
        setTimeout(render,0);
        break;
      }
    }
  },true);

  function alignTop(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>topLabels.some(label=>clean(node.textContent).includes(label)));
    if(!nav)return;
    const rect=nav.getBoundingClientRect();
    aside.style.setProperty("top",`${Math.max(0,Math.round(rect.bottom))}px`,"important");
  }

  function keepMounted(){
    if(!document.body.contains(aside))document.body.appendChild(aside);
    aside.style.setProperty("display","block","important");
    aside.style.setProperty("visibility","visible","important");
    aside.style.setProperty("opacity","1","important");
    alignTop();
    render();
  }

  render();
  keepMounted();
  window.addEventListener("resize",keepMounted);
  new MutationObserver(()=>requestAnimationFrame(keepMounted)).observe(document.documentElement,{childList:true,subtree:true});
})();