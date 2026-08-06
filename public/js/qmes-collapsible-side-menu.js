(function(){
  "use strict";
  if(window.__QMES_LEFT_MENU_V2__) return;
  window.__QMES_LEFT_MENU_V2__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const GROUPS={
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
  const TOP_LABELS=Object.keys(GROUPS);
  const aliases={
    "작업지시 발행":["작업지시 발행","작업지시"],
    "완제품 추적":["완제품 추적","LOT 추적"],
    "원료 역추적":["원료 역추적","역추적"],
    "부적합":["부적합","부적합 관리"]
  };

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar","qmes-safe-sidebar","qmes-left-native-menu","qmes-left-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style","qmes-safe-sidebar-style","qmes-left-native-menu-style","qmes-left-menu-style"].forEach(id=>document.getElementById(id)?.remove());
  document.querySelectorAll("[data-qmes-left-native-source],[data-qmes-left-menu-source]").forEach(node=>{
    node.removeAttribute("data-qmes-left-native-source");
    node.removeAttribute("data-qmes-left-menu-source");
  });

  const style=document.createElement("style");
  style.id="qmes-left-menu-style";
  style.textContent=`
    #qmes-left-menu{position:fixed!important;left:18px!important;top:var(--qmes-left-top,92px)!important;width:190px!important;max-height:calc(100vh - var(--qmes-left-top,92px) - 18px)!important;overflow-y:auto!important;z-index:99980!important;padding:14px 10px 16px!important;box-sizing:border-box!important;border:1px solid #e1e6ec!important;border-radius:10px!important;background:#fff!important;box-shadow:0 3px 12px rgba(15,23,42,.06)!important;display:none!important}
    #qmes-left-menu.is-open{display:block!important}
    #qmes-left-menu .qmes-left-title{padding:2px 8px 11px!important;margin:0 0 6px!important;border-bottom:1px solid #e7ebf0!important;color:#172033!important;font-size:14px!important;font-weight:800!important;line-height:20px!important}
    #qmes-left-menu .qmes-left-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:39px!important;margin:2px 0!important;padding:9px 10px 9px 13px!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;box-sizing:border-box!important}
    #qmes-left-menu .qmes-left-item:hover{background:#f3f6f9!important;color:#172033!important}
    #qmes-left-menu .qmes-left-item.is-active{background:#edf4ff!important;color:#175cd3!important}
    #qmes-left-menu .qmes-left-item.is-active:before{content:""!important;position:absolute!important;left:0!important;top:8px!important;bottom:8px!important;width:3px!important;border-radius:3px!important;background:#2563eb!important}
    [data-qmes-left-menu-source='true']{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:1050px){#qmes-left-menu{left:8px!important;width:172px!important}}
  `;
  document.head.appendChild(style);

  const side=document.createElement("aside");
  side.id="qmes-left-menu";
  side.setAttribute("aria-label","하위 메뉴");
  side.innerHTML='<div class="qmes-left-title"></div><div class="qmes-left-items"></div>';
  document.body.appendChild(side);

  let currentTop="";
  let locked=false;
  let activeItem="";
  let syntheticHoverDepth=0;

  function navBottom(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>TOP_LABELS.filter(label=>clean(node.textContent).includes(label)).length>=3);
    return nav?Math.max(0,Math.round(nav.getBoundingClientRect().bottom)+10):92;
  }

  function allControls(){
    return Array.from(document.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(node=>!side.contains(node));
  }

  function findTop(label){
    return allControls().find(node=>clean(node.textContent)===label)||null;
  }

  function fireHover(node){
    if(!node)return;
    syntheticHoverDepth+=1;
    try{
      try{node.dispatchEvent(new PointerEvent("pointerover",{bubbles:true,cancelable:true,pointerType:"mouse"}));}catch(_){ }
      node.dispatchEvent(new MouseEvent("mouseover",{bubbles:true,cancelable:true,view:window}));
    }finally{
      syntheticHoverDepth=Math.max(0,syntheticHoverDepth-1);
    }
  }

  function render(group){
    if(!GROUPS[group])return;
    currentTop=group;
    side.querySelector(".qmes-left-title").textContent=group;
    const wrap=side.querySelector(".qmes-left-items");
    wrap.replaceChildren();
    GROUPS[group].forEach(label=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="qmes-left-item"+(label===activeItem?" is-active":"");
      btn.dataset.label=label;
      btn.textContent=label;
      wrap.appendChild(btn);
    });
    document.documentElement.style.setProperty("--qmes-left-top",`${navBottom()}px`);
    side.classList.add("is-open");
  }

  function floatingMenusFor(group){
    const labels=GROUPS[group]||[];
    return Array.from(document.querySelectorAll("body *")).filter(node=>{
      if(!(node instanceof HTMLElement)||side.contains(node))return false;
      if(node.matches("dialog,[role='dialog']")||node.closest("dialog,[role='dialog']"))return false;
      const css=getComputedStyle(node);
      if(css.display==="none"||css.visibility==="hidden")return false;
      const rect=node.getBoundingClientRect();
      if(rect.width<70||rect.height<20||rect.width>700||rect.height>750)return false;
      const text=clean(node.textContent);
      return labels.filter(label=>text.includes(label)).length>=Math.min(2,labels.length);
    });
  }

  function hideNativeDropdown(group){
    document.querySelectorAll("[data-qmes-left-menu-source='true']").forEach(node=>node.removeAttribute("data-qmes-left-menu-source"));
    floatingMenusFor(group).forEach(node=>node.dataset.qmesLeftMenuSource="true");
  }

  function showGroup(group,{lock=false,triggerNative=true}={}){
    if(lock)locked=true;
    if(!lock&&locked&&group!==currentTop)return;
    render(group);
    if(triggerNative){
      const top=findTop(group);
      fireHover(top);
      setTimeout(()=>hideNativeDropdown(group),25);
      setTimeout(()=>hideNativeDropdown(group),80);
    }
  }

  function findTarget(group,label){
    const names=aliases[label]||[label];
    const menus=floatingMenusFor(group);
    const scoped=menus.flatMap(menu=>Array.from(menu.querySelectorAll("button,a,[role='button'],[role='menuitem']")));
    for(const name of names){
      const found=scoped.find(node=>clean(node.textContent)===name);
      if(found)return found;
    }
    return null;
  }

  function activate(label,attempt=0){
    if(!currentTop)return;
    const top=findTop(currentTop);
    document.querySelectorAll("[data-qmes-left-menu-source='true']").forEach(node=>node.removeAttribute("data-qmes-left-menu-source"));
    fireHover(top);
    setTimeout(()=>{
      const target=findTarget(currentTop,label);
      if(target){
        activeItem=label;
        render(currentTop);
        target.click();
        setTimeout(()=>hideNativeDropdown(currentTop),0);
        return;
      }
      if(attempt<8){activate(label,attempt+1);return;}
    },45);
  }

  side.addEventListener("click",event=>{
    const btn=event.target.closest(".qmes-left-item");
    if(!btn)return;
    event.preventDefault();
    activate(btn.dataset.label,0);
  });

  document.addEventListener("mouseover",event=>{
    if(syntheticHoverDepth>0||event.isTrusted===false)return;
    const control=event.target.closest("button,a,[role='button']");
    if(!control||side.contains(control))return;
    const label=clean(control.textContent);
    if(TOP_LABELS.includes(label))showGroup(label,{lock:false,triggerNative:true});
  },true);

  document.addEventListener("click",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(!control||side.contains(control))return;
    const label=clean(control.textContent);
    if(TOP_LABELS.includes(label))setTimeout(()=>showGroup(label,{lock:true,triggerNative:true}),0);
  },false);

  window.addEventListener("resize",()=>document.documentElement.style.setProperty("--qmes-left-top",`${navBottom()}px`));
})();