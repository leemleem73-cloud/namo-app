(function(){
  "use strict";
  if(window.__QMES_SAFE_SIDEBAR_V1__) return;
  window.__QMES_SAFE_SIDEBAR_V1__=true;

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

  const aliases={
    "SPC":["SPC","SPC 대시보드"],
    "작업지시 발행":["작업지시 발행","작업지시"],
    "완제품 추적":["완제품 추적","LOT 추적"],
    "원료 역추적":["원료 역추적","역추적"],
    "부적합":["부적합","부적합 관리"]
  };

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const topLabels=Object.keys(groups);

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar","qmes-safe-sidebar"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style","qmes-safe-sidebar-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body.classList.remove("qmes-context-side-enabled","qmes-stable-sidebar-open","qmes-safe-sidebar-open");
  document.querySelectorAll("[data-qmes-native-dropdown-left],[data-qmes-sidebar-source],[data-qmes-legacy-dropdown-hidden]").forEach(node=>{
    node.removeAttribute("data-qmes-native-dropdown-left");
    node.removeAttribute("data-qmes-sidebar-source");
    node.removeAttribute("data-qmes-legacy-dropdown-hidden");
    node.removeAttribute("style");
  });

  const style=document.createElement("style");
  style.id="qmes-safe-sidebar-style";
  style.textContent=`
    #qmes-safe-sidebar{position:fixed!important;left:0!important;top:var(--qmes-safe-sidebar-top,88px)!important;bottom:0!important;width:218px!important;z-index:99990!important;display:none!important;padding:18px 14px 24px!important;overflow-y:auto!important;border-right:1px solid #dce3eb!important;background:#fff!important;box-sizing:border-box!important;box-shadow:3px 0 10px rgba(15,23,42,.04)!important}
    body.qmes-safe-sidebar-open #qmes-safe-sidebar{display:block!important}
    #qmes-safe-sidebar .qmes-safe-title{margin:0 3px 13px!important;padding:0 3px 12px!important;border-bottom:1px solid #e7ebf0!important;color:#172033!important;font-size:15px!important;font-weight:800!important;line-height:22px!important}
    #qmes-safe-sidebar .qmes-safe-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:42px!important;margin:3px 0!important;padding:10px 12px 10px 16px!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;box-sizing:border-box!important}
    #qmes-safe-sidebar .qmes-safe-item:hover{background:#f1f5f9!important;color:#172033!important}
    #qmes-safe-sidebar .qmes-safe-item.is-active{background:#edf4ff!important;color:#175cd3!important}
    #qmes-safe-sidebar .qmes-safe-item.is-active:before{content:""!important;position:absolute!important;left:0!important;top:9px!important;bottom:9px!important;width:3px!important;border-radius:3px!important;background:#2563eb!important}
    body.qmes-safe-sidebar-open #root>div>main,body.qmes-safe-sidebar-open #root main,body.qmes-safe-sidebar-open main,body.qmes-safe-sidebar-open .qmes-main-content,body.qmes-safe-sidebar-open .qmes-content{margin-left:218px!important;width:calc(100% - 218px)!important;box-sizing:border-box!important;transition:margin-left .15s ease,width .15s ease!important}
    [data-qmes-safe-native-menu='true']{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:900px){#qmes-safe-sidebar{width:184px!important}body.qmes-safe-sidebar-open #root>div>main,body.qmes-safe-sidebar-open #root main,body.qmes-safe-sidebar-open main,body.qmes-safe-sidebar-open .qmes-main-content,body.qmes-safe-sidebar-open .qmes-content{margin-left:184px!important;width:calc(100% - 184px)!important}}
  `;
  document.head.appendChild(style);

  const sidebar=document.createElement("aside");
  sidebar.id="qmes-safe-sidebar";
  sidebar.setAttribute("aria-label","하위 메뉴");
  sidebar.innerHTML='<div class="qmes-safe-title"></div><div class="qmes-safe-items"></div>';
  document.body.appendChild(sidebar);

  let currentGroup="";
  let activeItem="";

  function navBottom(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>topLabels.filter(label=>clean(node.textContent).includes(label)).length>=3);
    return nav?Math.max(0,Math.round(nav.getBoundingClientRect().bottom)):88;
  }

  function render(group){
    if(!groups[group])return;
    currentGroup=group;
    sidebar.querySelector(".qmes-safe-title").textContent=group;
    const wrap=sidebar.querySelector(".qmes-safe-items");
    wrap.replaceChildren();
    groups[group].forEach(label=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="qmes-safe-item"+(label===activeItem?" is-active":"");
      button.dataset.label=label;
      button.textContent=label;
      wrap.appendChild(button);
    });
    document.documentElement.style.setProperty("--qmes-safe-sidebar-top",`${navBottom()}px`);
    document.body.classList.add("qmes-safe-sidebar-open");
  }

  function allNativeControls(){
    return Array.from(document.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(node=>!sidebar.contains(node));
  }

  function topControl(label){
    return allNativeControls().find(node=>clean(node.textContent)===label)||null;
  }

  function labelCandidates(label){
    return aliases[label]||[label];
  }

  function findNativeItem(label){
    const controls=allNativeControls();
    for(const candidate of labelCandidates(label)){
      const matches=controls.filter(node=>clean(node.textContent)===candidate);
      const menuMatch=matches.find(node=>node.closest("[role='menu'],[class*='dropdown'],[class*='submenu'],[class*='sub-menu'],.absolute"));
      if(menuMatch)return menuMatch;
      if(matches.length)return matches[matches.length-1];
    }
    return null;
  }

  function openNativeMenu(group){
    const top=topControl(group);
    if(!top)return;
    top.dispatchEvent(new MouseEvent("mouseover",{bubbles:true,cancelable:true,view:window}));
    try{top.dispatchEvent(new PointerEvent("pointerover",{bubbles:true,cancelable:true,view:window}));}catch(_){ }
  }

  function markNativeDropdowns(){
    const labels=groups[currentGroup]||[];
    document.querySelectorAll("[data-qmes-safe-native-menu='true']").forEach(node=>node.removeAttribute("data-qmes-safe-native-menu"));
    Array.from(document.querySelectorAll("body *")).forEach(node=>{
      if(!(node instanceof HTMLElement)||sidebar.contains(node))return;
      const css=getComputedStyle(node);
      if(!["absolute","fixed"].includes(css.position))return;
      const text=clean(node.textContent);
      const count=labels.filter(label=>text.includes(label)).length;
      if(count>=2)node.dataset.qmesSafeNativeMenu="true";
    });
  }

  function activate(label,attempt=0){
    openNativeMenu(currentGroup);
    setTimeout(()=>{
      const target=findNativeItem(label);
      if(target){
        activeItem=label;
        render(currentGroup);
        target.click();
        return;
      }
      if(attempt<4)activate(label,attempt+1);
    },55);
  }

  sidebar.addEventListener("click",event=>{
    const button=event.target.closest(".qmes-safe-item");
    if(!button)return;
    activate(button.dataset.label,0);
  });

  function handleTop(control){
    const label=clean(control.textContent);
    if(!topLabels.includes(label))return;
    render(label);
    openNativeMenu(label);
    setTimeout(markNativeDropdowns,30);
    setTimeout(markNativeDropdowns,90);
  }

  document.addEventListener("mouseover",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(control&&!sidebar.contains(control))handleTop(control);
  },true);

  document.addEventListener("click",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(control&&!sidebar.contains(control))setTimeout(()=>handleTop(control),0);
  },false);

  window.addEventListener("resize",()=>document.documentElement.style.setProperty("--qmes-safe-sidebar-top",`${navBottom()}px`));
})();