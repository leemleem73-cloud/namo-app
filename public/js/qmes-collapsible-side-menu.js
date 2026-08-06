(function(){
  "use strict";
  if(window.__QMES_NATIVE_DROPDOWN_LEFT_V2__) return;
  window.__QMES_NATIVE_DROPDOWN_LEFT_V2__=true;

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body.classList.remove("qmes-context-side-enabled");

  document.querySelectorAll("[data-qmes-legacy-dropdown-hidden]").forEach(node=>{
    node.removeAttribute("data-qmes-legacy-dropdown-hidden");
    ["display","visibility","opacity","pointer-events","width","height","min-width","min-height","overflow","margin","padding","border"].forEach(name=>node.style.removeProperty(name));
  });

  const style=document.createElement("style");
  style.id="qmes-native-dropdown-left-style";
  style.textContent=`
    [data-qmes-native-dropdown-left='true']{
      position:fixed!important;
      left:12px!important;
      right:auto!important;
      top:var(--qmes-menu-top,88px)!important;
      bottom:auto!important;
      transform:none!important;
      z-index:999999!important;
      max-height:calc(100vh - var(--qmes-menu-top,88px) - 16px)!important;
      overflow-y:auto!important;
      pointer-events:auto!important;
    }
  `;
  document.head.appendChild(style);

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const topLabels=["대시보드","생산관리","품질검사","현장입력","재고관리","거래처 현황","설비관리","LOT 추적","부적합관리"];
  let activeTop=null;
  let activeDropdown=null;
  let keepAliveTimer=0;
  let releaseTimer=0;
  let scanScheduled=false;

  function menuTop(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>topLabels.filter(label=>clean(node.textContent).includes(label)).length>=3);
    return nav?Math.max(0,Math.round(nav.getBoundingClientRect().bottom)+6):88;
  }

  function isNativeDropdown(node){
    if(!(node instanceof HTMLElement))return false;
    if(node.id==="qmes-context-side-menu"||node.closest("#qmes-context-side-menu"))return false;
    if(node.matches("dialog,[role='dialog']")||node.closest("dialog,[role='dialog']"))return false;

    const css=getComputedStyle(node);
    if(!["absolute","fixed"].includes(css.position))return false;
    if(css.display==="none"||css.visibility==="hidden")return false;

    const rect=node.getBoundingClientRect();
    if(rect.width<90||rect.width>700||rect.height<24||rect.height>700)return false;

    const controls=Array.from(node.querySelectorAll("button,a,[role='menuitem'],[role='button']"));
    if(controls.length<1)return false;

    const text=clean(node.textContent);
    if(/저장|취소|닫기|신규등록|수정|삭제/.test(text)&&controls.length<=3)return false;
    return true;
  }

  function pulseTop(){
    if(!activeTop||!document.contains(activeTop))return;
    activeTop.dispatchEvent(new MouseEvent("mouseover",{bubbles:true,cancelable:true,view:window}));
    activeTop.dispatchEvent(new PointerEvent("pointerover",{bubbles:true,cancelable:true,view:window}));
  }

  function startKeepAlive(duration=1200){
    clearInterval(keepAliveTimer);
    clearTimeout(releaseTimer);
    pulseTop();
    keepAliveTimer=window.setInterval(pulseTop,90);
    releaseTimer=window.setTimeout(()=>{
      if(activeDropdown?.matches(":hover"))return;
      clearInterval(keepAliveTimer);
      keepAliveTimer=0;
    },duration);
  }

  function bindDropdown(node){
    if(node.dataset.qmesDropdownHoldBound==="true")return;
    node.dataset.qmesDropdownHoldBound="true";
    node.addEventListener("mouseenter",()=>{
      activeDropdown=node;
      startKeepAlive(60000);
    });
    node.addEventListener("mouseleave",()=>{
      clearTimeout(releaseTimer);
      releaseTimer=window.setTimeout(()=>{
        clearInterval(keepAliveTimer);
        keepAliveTimer=0;
        activeDropdown=null;
      },220);
    });
    node.addEventListener("click",()=>{
      clearInterval(keepAliveTimer);
      clearTimeout(releaseTimer);
      keepAliveTimer=0;
      activeDropdown=null;
    });
  }

  function moveVisibleDropdowns(){
    scanScheduled=false;
    document.documentElement.style.setProperty("--qmes-menu-top",`${menuTop()}px`);
    document.querySelectorAll("body *").forEach(node=>{
      if(!isNativeDropdown(node))return;
      node.dataset.qmesNativeDropdownLeft="true";
      activeDropdown=node;
      bindDropdown(node);
    });
  }

  function scheduleScan(){
    if(scanScheduled)return;
    scanScheduled=true;
    requestAnimationFrame(moveVisibleDropdowns);
  }

  document.addEventListener("mouseover",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(!control)return;
    if(topLabels.includes(clean(control.textContent))){
      activeTop=control;
      startKeepAlive(1400);
      scheduleScan();
      setTimeout(scheduleScan,40);
    }
  },true);

  window.addEventListener("resize",scheduleScan);
  new MutationObserver(scheduleScan).observe(document.body,{childList:true,subtree:true});
})();