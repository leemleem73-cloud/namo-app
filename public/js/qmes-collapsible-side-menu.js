(function(){
  "use strict";
  if(window.__QMES_TOP_SUBMENU_FIX_V1__) return;
  window.__QMES_TOP_SUBMENU_FIX_V1__=true;

  // 이전 왼쪽 흰색 메뉴/스타일 완전 제거
  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar","qmes-safe-sidebar","qmes-left-native-menu","qmes-left-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style","qmes-safe-sidebar-style","qmes-left-native-menu-style","qmes-left-menu-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove("qmes-context-side-enabled","qmes-stable-sidebar-open","qmes-safe-sidebar-open");
  document.querySelectorAll("[data-qmes-left-native-source],[data-qmes-left-menu-source],[data-qmes-native-dropdown-hidden],[data-qmes-native-dropdown-left],[data-qmes-sidebar-source],[data-qmes-safe-native-menu],[data-qmes-legacy-dropdown-hidden],[data-qmes-dropdown-hold-bound]").forEach(node=>{
    ["data-qmes-left-native-source","data-qmes-left-menu-source","data-qmes-native-dropdown-hidden","data-qmes-native-dropdown-left","data-qmes-sidebar-source","data-qmes-safe-native-menu","data-qmes-legacy-dropdown-hidden","data-qmes-dropdown-hold-bound"].forEach(name=>node.removeAttribute(name));
    ["display","visibility","opacity","pointer-events","position","left","right","top","bottom","transform","width","height","min-width","min-height","max-height","overflow","overflow-y","margin","padding","border","z-index"].forEach(name=>node.style.removeProperty(name));
  });

  // index.html의 숨김 규칙보다 나중에 적용해서 React 하위 메뉴를 다시 표시한다.
  const style=document.createElement("style");
  style.id="qmes-top-submenu-fix-style";
  style.textContent=`
    .qmes-submenu-row{
      display:flex!important;
      align-items:center!important;
      gap:6px!important;
      width:100%!important;
      min-height:44px!important;
      padding:6px 18px!important;
      box-sizing:border-box!important;
      border-top:1px solid rgba(255,255,255,.08)!important;
      background:#132238!important;
      position:relative!important;
      z-index:11950!important;
    }
    .qmes-submenu-row .qmes-submenu-title{display:none!important}
    .qmes-submenu-row .qmes-submenu-button{
      display:inline-flex!important;
      align-items:center!important;
      gap:6px!important;
      min-height:32px!important;
      padding:6px 10px!important;
      border:0!important;
      border-radius:6px!important;
      background:transparent!important;
      color:#cbd5e1!important;
      font-size:13px!important;
      font-weight:700!important;
      cursor:pointer!important;
    }
    .qmes-submenu-row .qmes-submenu-button:hover{background:#243a57!important;color:#fff!important}
    .qmes-submenu-row .qmes-submenu-button.is-active{background:#1d4ed8!important;color:#fff!important}
    .qmes-top-menu-button span{visibility:visible!important;opacity:1!important;display:inline!important}
  `;
  document.head.appendChild(style);

  // 기존 hover용 별도 드롭다운이 남아 있으면 숨겨서 중복 표시 방지
  const hideLegacyHover=()=>{
    const legacy=document.getElementById("qmes-all-menu-dropdown");
    if(legacy){
      legacy.classList.remove("is-open");
      legacy.style.setProperty("display","none","important");
      legacy.style.setProperty("visibility","hidden","important");
      legacy.style.setProperty("opacity","0","important");
      legacy.style.setProperty("pointer-events","none","important");
    }
  };

  // 현장입력/재고관리 등 단일 메뉴의 글자가 다른 스크립트에 의해 사라지지 않도록 복구
  const restoreTopLabels=()=>{
    document.querySelectorAll(".qmes-top-menu-button span").forEach(span=>{
      span.style.removeProperty("display");
      span.style.removeProperty("visibility");
      span.style.removeProperty("opacity");
    });
    hideLegacyHover();
  };

  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      restoreTopLabels();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
  document.addEventListener("click",schedule,true);
  document.addEventListener("mouseover",schedule,true);
  window.addEventListener("load",schedule);
  schedule();
})();