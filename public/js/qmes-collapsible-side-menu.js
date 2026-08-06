(function(){
  "use strict";
  if(window.__QMES_STABLE_CONTEXT_SIDEBAR_V1__) return;
  window.__QMES_STABLE_CONTEXT_SIDEBAR_V1__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const topLabels=["대시보드","생산관리","품질검사","현장입력","재고관리","거래처 현황","설비관리","LOT 추적","부적합관리"];

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body.classList.remove("qmes-context-side-enabled","qmes-stable-sidebar-open");
  document.querySelectorAll("[data-qmes-native-dropdown-left],[data-qmes-sidebar-source]").forEach(node=>{
    node.removeAttribute("data-qmes-native-dropdown-left");
    node.removeAttribute("data-qmes-sidebar-source");
    node.style.removeProperty("display");
    node.style.removeProperty("visibility");
    node.style.removeProperty("opacity");
    node.style.removeProperty("pointer-events");
  });

  const style=document.createElement("style");
  style.id="qmes-stable-sidebar-style";
  style.textContent=`
    #qmes-stable-sidebar{position:fixed!important;left:0!important;top:var(--qmes-sidebar-top,88px)!important;bottom:0!important;width:218px!important;z-index:999998!important;display:none!important;padding:18px 14px 24px!important;overflow-y:auto!important;border-right:1px solid #d9e1ea!important;background:#fff!important;box-sizing:border-box!important}
    body.qmes-stable-sidebar-open #qmes-stable-sidebar{display:block!important}
    #qmes-stable-sidebar .qmes-sidebar-title{margin:0 4px 14px!important;padding:0 2px 12px!important;border-bottom:1px solid #e5eaf0!important;color:#172033!important;font-size:15px!important;font-weight:800!important;line-height:22px!important}
    #qmes-stable-sidebar .qmes-sidebar-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:42px!important;margin:3px 0!important;padding:10px 12px 10px 15px!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#435064!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;box-sizing:border-box!important}
    #qmes-stable-sidebar .qmes-sidebar-item:hover{background:#f1f5f9!important;color:#172033!important}
    #qmes-stable-sidebar .qmes-sidebar-item.is-active{background:#edf4ff!important;color:#175cd3!important}
    #qmes-stable-sidebar .qmes-sidebar-item.is-active:before{content:""!important;position:absolute!important;left:0!important;top:9px!important;bottom:9px!important;width:3px!important;border-radius:3px!important;background:#2563eb!important}
    body.qmes-stable-sidebar-open #root>div>main,
    body.qmes-stable-sidebar-open #root main,
    body.qmes-stable-sidebar-open main,
    body.qmes-stable-sidebar-open .qmes-main-content,
    body.qmes-stable-sidebar-open .qmes-content{margin-left:218px!important;width:calc(100% - 218px)!important;box-sizing:border-box!important;transition:margin-left .15s ease,width .15s ease!important}
    [data-qmes-sidebar-source='true']{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:900px){#qmes-stable-sidebar{width:184px!important}body.qmes-stable-sidebar-open #root>div>main,body.qmes-stable-sidebar-open #root main,body.qmes-stable-sidebar-open main,body.qmes-stable-sidebar-open .qmes-main-content,body.qmes-stable-sidebar-open .qmes-content{margin-left:184px!important;width:calc(100% - 184px)!important}}
  `;
  document.head.appendChild(style);

  const sidebar=document.createElement("aside");
  sidebar.id="qmes-stable-sidebar";
  sidebar.setAttribute("aria-label","선택한 상단 메뉴의 하위 메뉴");
  sidebar.innerHTML='<div class="qmes-sidebar-title"></div><div class="qmes-sidebar-items"></div>';
  document.body.appendChild(sidebar);

  let activeTopLabel="";
  let sourceItems=[];
  let activeLabel="";
  let opening=false;

  function topOffset(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>topLabels.filter(label=>clean(node.textContent).includes(label)).length>=3);
    return nav?Math.max(0,Math.round(nav.getBoundingClientRect().bottom)):88;
  }

  function nativeControls(){
    return Array.from(document.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(node=>!sidebar.contains(node));
  }

  function findTop(label){
    return nativeControls().find(node=>clean(node.textContent)===label)||null;
  }

  function visibleDropdownCandidates(){
    return Array.from(document.querySelectorAll("body *")).filter(node=>{
      if(!(node instanceof HTMLElement)||sidebar.contains(node))return false;
      if(node.matches("dialog,[role='dialog']")||node.closest("dialog,[role='dialog']"))return false;
      const css=getComputedStyle(node);
      if(!["absolute","fixed"].includes(css.position)||css.display==="none"||css.visibility==="hidden")return false;
      const rect=node.getBoundingClientRect();
      if(rect.width<80||rect.width>800||rect.height<24||rect.height>750)return false;
      const items=Array.from(node.querySelectorAll("button,a,[role='button'],[role='menuitem']"));
      return items.length>0;
    });
  }

  function chooseDropdown(){
    const candidates=visibleDropdownCandidates();
    if(!candidates.length)return null;
    return candidates.sort((a,b)=>{
      const ai=a.querySelectorAll("button,a,[role='button'],[role='menuitem']").length;
      const bi=b.querySelectorAll("button,a,[role='button'],[role='menuitem']").length;
      return bi-ai;
    })[0]||null;
  }

  function extractItems(dropdown){
    const seen=new Set();
    return Array.from(dropdown.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(node=>{
      const label=clean(node.textContent);
      if(!label||topLabels.includes(label)||seen.has(label))return false;
      seen.add(label);
      return true;
    }).map(node=>({label:clean(node.textContent),source:node}));
  }

  function render(){
    sidebar.querySelector(".qmes-sidebar-title").textContent=activeTopLabel;
    const wrap=sidebar.querySelector(".qmes-sidebar-items");
    wrap.replaceChildren();
    sourceItems.forEach(item=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="qmes-sidebar-item"+(item.label===activeLabel?" is-active":"");
      button.textContent=item.label;
      button.dataset.label=item.label;
      wrap.appendChild(button);
    });
    document.documentElement.style.setProperty("--qmes-sidebar-top",`${topOffset()}px`);
    document.body.classList.add("qmes-stable-sidebar-open");
  }

  function openSidebar(label,topNode){
    if(opening)return;
    opening=true;
    activeTopLabel=label;
    const node=topNode||findTop(label);
    if(node){
      node.dispatchEvent(new MouseEvent("mouseover",{bubbles:true,cancelable:true,view:window}));
      node.dispatchEvent(new PointerEvent("pointerover",{bubbles:true,cancelable:true,view:window}));
    }
    const capture=attempt=>{
      const dropdown=chooseDropdown();
      if(dropdown){
        const items=extractItems(dropdown);
        if(items.length){
          sourceItems=items;
          dropdown.dataset.qmesSidebarSource="true";
          render();
          opening=false;
          return;
        }
      }
      if(attempt<8){setTimeout(()=>capture(attempt+1),45);return;}
      opening=false;
    };
    setTimeout(()=>capture(0),20);
  }

  sidebar.addEventListener("click",event=>{
    const button=event.target.closest(".qmes-sidebar-item");
    if(!button)return;
    const item=sourceItems.find(row=>row.label===button.dataset.label);
    if(!item||!item.source)return;
    activeLabel=item.label;
    render();
    item.source.removeAttribute("data-qmes-sidebar-source");
    item.source.click();
  });

  document.addEventListener("click",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(!control||sidebar.contains(control))return;
    const label=clean(control.textContent);
    if(!topLabels.includes(label))return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    openSidebar(label,control);
  },true);

  window.addEventListener("resize",()=>document.documentElement.style.setProperty("--qmes-sidebar-top",`${topOffset()}px`));
})();