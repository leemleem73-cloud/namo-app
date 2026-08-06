(function(){
  "use strict";
  if(window.__QMES_RESTORE_VERTICAL_TOP_DROPDOWN_V1__) return;
  window.__QMES_RESTORE_VERTICAL_TOP_DROPDOWN_V1__=true;

  // 왼쪽/가로형 메뉴 실험 요소 제거
  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar","qmes-safe-sidebar","qmes-left-native-menu","qmes-left-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style","qmes-safe-sidebar-style","qmes-left-native-menu-style","qmes-left-menu-style","qmes-top-submenu-fix-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove("qmes-context-side-enabled","qmes-stable-sidebar-open","qmes-safe-sidebar-open");

  // React 기본 가로 하위행은 예전처럼 숨김 유지
  const style=document.createElement("style");
  style.id="qmes-restore-vertical-dropdown-style";
  style.textContent=`
    .qmes-submenu-row{display:none!important}
    .qmes-top-menu-button span{display:inline!important;visibility:visible!important;opacity:1!important}
    #qmes-all-menu-dropdown{display:block!important}
    #qmes-all-menu-dropdown:not(.is-open){opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    #qmes-all-menu-dropdown.is-open{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
  `;
  document.head.appendChild(style);

  function restore(){
    document.querySelectorAll(".qmes-top-menu-button span").forEach(span=>{
      span.style.removeProperty("display");
      span.style.removeProperty("visibility");
      span.style.removeProperty("opacity");
    });
    const menu=document.getElementById("qmes-all-menu-dropdown");
    if(menu){
      menu.style.removeProperty("display");
      menu.style.removeProperty("visibility");
      menu.style.removeProperty("opacity");
      menu.style.removeProperty("pointer-events");
    }
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;restore();});
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",schedule);
  schedule();
})();