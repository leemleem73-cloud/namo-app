(function(){
  "use strict";

  [
    "qmes-side-toggle",
    "qmes-side-overlay",
    "qmes-side-menu",
    "qmes-context-side-menu",
    "qmes-stable-sidebar",
    "qmes-safe-sidebar"
  ].forEach(id=>document.getElementById(id)?.remove());

  [
    "qmes-side-menu-v4-style",
    "qmes-side-menu-v5-style",
    "qmes-context-side-menu-style",
    "qmes-native-dropdown-left-style",
    "qmes-stable-sidebar-style",
    "qmes-safe-sidebar-style"
  ].forEach(id=>document.getElementById(id)?.remove());

  document.body?.classList.remove(
    "qmes-context-side-enabled",
    "qmes-stable-sidebar-open",
    "qmes-safe-sidebar-open"
  );

  document.documentElement.style.removeProperty("--qmes-safe-sidebar-top");
  document.documentElement.style.removeProperty("--qmes-sidebar-top");
  document.documentElement.style.removeProperty("--qmes-menu-top");

  document.querySelectorAll(
    "[data-qmes-native-dropdown-hidden],"+
    "[data-qmes-native-dropdown-left],"+
    "[data-qmes-sidebar-source],"+
    "[data-qmes-safe-native-menu],"+
    "[data-qmes-legacy-dropdown-hidden],"+
    "[data-qmes-dropdown-hold-bound]"
  ).forEach(node=>{
    node.removeAttribute("data-qmes-native-dropdown-hidden");
    node.removeAttribute("data-qmes-native-dropdown-left");
    node.removeAttribute("data-qmes-sidebar-source");
    node.removeAttribute("data-qmes-safe-native-menu");
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