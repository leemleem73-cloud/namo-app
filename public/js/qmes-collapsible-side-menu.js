(function(){
  "use strict";
  if(window.__QMES_LEFT_MENU_V3__) return;
  window.__QMES_LEFT_MENU_V3__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();

  const GROUPS={
    "대시보드":[
      {label:"종합 대시보드",mode:"direct",top:"대시보드"},
      {label:"SPC 대시보드",mode:"submenu",top:"품질검사",target:"SPC (Cpk)"}
    ],
    "생산관리":[
      {label:"생산실적",mode:"submenu",top:"생산관리",target:"생산 (배치)"},
      {label:"작업지시서",mode:"submenu",top:"생산관리",target:"작업지시서"}
    ],
    "품질검사":[
      {label:"수입검사",mode:"submenu",top:"품질검사",target:"수입검사 (IQC)"},
      {label:"공정검사",mode:"submenu",top:"품질검사",target:"공정검사 (PQC)"},
      {label:"출하검사",mode:"submenu",top:"품질검사",target:"출하검사 (OQC)"},
      {label:"SPC",mode:"submenu",top:"품질검사",target:"SPC (Cpk)"},
      {label:"품질 인터락",mode:"submenu",top:"품질검사",target:"품질 인터락 (차단)"},
      {label:"출하성적서",mode:"submenu",top:"품질검사",target:"출하성적서"}
    ],
    "현장입력":[{label:"현장입력",mode:"direct",top:"현장입력"}],
    "재고관리":[{label:"재고관리",mode:"direct",top:"재고관리"}],
    "거래처 현황":[{label:"거래처 현황",mode:"direct",top:"거래처 현황"}],
    "설비관리":[{label:"설비관리",mode:"direct",top:"설비관리"}],
    "LOT 추적":[{label:"LOT 추적",mode:"direct",top:"LOT 추적"}],
    "부적합관리":[
      {label:"부적합",mode:"submenu",top:"부적합관리",target:"부적합 (8D)"},
      {label:"고객불만",mode:"submenu",top:"부적합관리",target:"고객불만 (GQMS)"},
      {label:"4M 변경관리",mode:"submenu",top:"부적합관리",target:"4M 변경관리"}
    ]
  };
  const TOP_LABELS=Object.keys(GROUPS);

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
    .qmes-submenu-row{display:none!important}
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
  let internalClick=false;

  function navBottom(){
    const nav=document.querySelector(".qmes-top-menu");
    return nav?Math.max(0,Math.round(nav.getBoundingClientRect().bottom)+10):92;
  }

  function topButtons(){return Array.from(document.querySelectorAll(".qmes-top-menu .qmes-top-menu-button"));}
  function findTop(label){return topButtons().find(node=>clean(node.textContent).includes(label))||null;}

  function render(group){
    const items=GROUPS[group];
    if(!items)return;
    currentTop=group;
    side.querySelector(".qmes-left-title").textContent=group;
    const wrap=side.querySelector(".qmes-left-items");
    wrap.replaceChildren();
    items.forEach((item,index)=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="qmes-left-item"+(item.label===activeItem?" is-active":"");
      btn.dataset.index=String(index);
      btn.textContent=item.label;
      wrap.appendChild(btn);
    });
    document.documentElement.style.setProperty("--qmes-left-top",`${navBottom()}px`);
    side.classList.add("is-open");
  }

  function nativeTopClick(label){
    const top=findTop(label);
    if(!top)return false;
    internalClick=true;
    top.click();
    setTimeout(()=>{internalClick=false;},0);
    return true;
  }

  function findSubButton(label){
    return Array.from(document.querySelectorAll(".qmes-submenu-row button.qmes-submenu-button,.qmes-submenu-row button"))
      .find(node=>clean(node.textContent)===label)||null;
  }

  function activate(item,attempt=0){
    if(!item)return;

    if(item.mode==="direct"){
      if(nativeTopClick(item.top)){
        activeItem=item.label;
        render(currentTop);
      }
      return;
    }

    const existing=findSubButton(item.target);
    if(existing){
      activeItem=item.label;
      render(currentTop);
      existing.click();
      return;
    }

    const top=findTop(item.top);
    if(!top)return;
    internalClick=true;
    top.click();
    setTimeout(()=>{internalClick=false;},0);

    setTimeout(()=>{
      const target=findSubButton(item.target);
      if(target){
        activeItem=item.label;
        render(currentTop);
        target.click();
      }else if(attempt<5){
        activate(item,attempt+1);
      }
    },45);
  }

  side.addEventListener("click",event=>{
    const btn=event.target.closest(".qmes-left-item");
    if(!btn)return;
    event.preventDefault();
    const item=GROUPS[currentTop]?.[Number(btn.dataset.index)||0];
    activate(item,0);
  });

  document.addEventListener("mouseover",event=>{
    if(locked)return;
    const control=event.target.closest(".qmes-top-menu-button");
    if(!control)return;
    const label=TOP_LABELS.find(name=>clean(control.textContent).includes(name));
    if(label)render(label);
  },true);

  document.addEventListener("click",event=>{
    if(internalClick)return;
    const control=event.target.closest(".qmes-top-menu-button");
    if(!control)return;
    const label=TOP_LABELS.find(name=>clean(control.textContent).includes(name));
    if(!label)return;
    locked=true;
    render(label);
  },false);

  window.addEventListener("resize",()=>document.documentElement.style.setProperty("--qmes-left-top",`${navBottom()}px`));
})();