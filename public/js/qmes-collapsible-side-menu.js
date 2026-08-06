(function(){
  "use strict";
  if(window.__QMES_NATIVE_DROPDOWN_LEFT_V1__) return;
  window.__QMES_NATIVE_DROPDOWN_LEFT_V1__=true;

  /* 이전에 추가했던 별도 왼쪽 메뉴와 화면 밀기 설정만 제거한다. */
  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style"].forEach(id=>document.getElementById(id)?.remove());
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
    }
  `;
  document.head.appendChild(style);

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const topLabels=["대시보드","생산관리","품질검사","현장입력","재고관리","거래처 현황","설비관리","LOT 추적","부적합관리"];

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
    const modalLike=/저장|취소|닫기|신규등록|수정|삭제/.test(text)&&controls.length<=3;
    if(modalLike)return false;

    return true;
  }

  function moveVisibleDropdowns(){
    const top=menuTop();
    document.documentElement.style.setProperty("--qmes-menu-top",`${top}px`);
    document.querySelectorAll("body *").forEach(node=>{
      if(isNativeDropdown(node)) node.dataset.qmesNativeDropdownLeft="true";
    });
  }

  document.addEventListener("mouseover",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(control&&topLabels.includes(clean(control.textContent))){
      requestAnimationFrame(moveVisibleDropdowns);
      setTimeout(moveVisibleDropdowns,30);
    }
  },true);

  window.addEventListener("resize",moveVisibleDropdowns);
  new MutationObserver(()=>requestAnimationFrame(moveVisibleDropdowns)).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden"]});
})();