(function(){
  "use strict";

  // 사이드 메뉴 실험 기능을 정리하고 기존 상단 메뉴 동작을 완전히 복구한다.
  [
    "qmes-side-toggle",
    "qmes-side-overlay",
    "qmes-side-menu",
    "qmes-context-side-menu",
    "qmes-stable-sidebar"
  ].forEach(id=>document.getElementById(id)?.remove());

  [
    "qmes-side-menu-v4-style",
    "qmes-side-menu-v5-style",
    "qmes-context-side-menu-style",
    "qmes-native-dropdown-left-style",
    "qmes-stable-sidebar-style"
  ].forEach(id=>document.getElementById(id)?.remove());

  document.body?.classList.remove(
    "qmes-context-side-enabled",
    "qmes-stable-sidebar-open"
  );

  document.documentElement.style.removeProperty("--qmes-sidebar-top");
  document.documentElement.style.removeProperty("--qmes-menu-top");

  document.querySelectorAll(
    "[data-qmes-native-dropdown-left],"+
    "[data-qmes-sidebar-source],"+
    "[data-qmes-legacy-dropdown-hidden],"+
    "[data-qmes-dropdown-hold-bound]"
  ).forEach(node=>{
    node.removeAttribute("data-qmes-native-dropdown-left");
    node.removeAttribute("data-qmes-sidebar-source");
    node.removeAttribute("data-qmes-legacy-dropdown-hidden");
    node.removeAttribute("data-qmes-dropdown-hold-bound");

    [
      "display","visibility","opacity","pointer-events",
      "position","left","right","top","bottom","transform",
      "width","height","min-width","min-height","max-height",
      "overflow","overflow-y","margin","padding","border","z-index"
    ].forEach(name=>node.style.removeProperty(name));
  });
})();