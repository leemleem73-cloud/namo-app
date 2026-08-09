/* QMES sidebar outside-click close
 * Closes the left navigation when the user clicks the page outside navigation controls.
 */
(function installSidebarOutsideClickClose(){
  "use strict";
  if(window.__QMES_SIDEBAR_OUTSIDE_CLICK_CLOSE__) return;
  window.__QMES_SIDEBAR_OUTSIDE_CLICK_CLOSE__ = true;

  function isMenuInteraction(target){
    if(!target || !target.closest) return false;
    return Boolean(
      target.closest("#qmes-sync-sidebar") ||
      target.closest("#qmes-sync-hamburger") ||
      target.closest(".qmes-top-menu-button") ||
      target.closest("#qmes-all-menu-dropdown") ||
      target.closest("#qmes-user-dropdown") ||
      target.closest(".qmes-submenu-button")
    );
  }

  function closeSidebar(){
    if(!document.body.classList.contains("qmes-side-open")) return;
    const closeButton = document.querySelector("#qmes-sync-sidebar .qmes-side-close");
    if(closeButton){
      closeButton.click();
      return;
    }
    document.body.classList.remove("qmes-side-open");
    const side = document.getElementById("qmes-sync-sidebar");
    if(side){
      ["display","visibility","opacity","pointer-events","transform"].forEach(property => side.style.removeProperty(property));
    }
  }

  document.addEventListener("pointerdown", event => {
    if(!document.body.classList.contains("qmes-side-open")) return;
    if(isMenuInteraction(event.target)) return;
    closeSidebar();
  }, true);

  document.addEventListener("keydown", event => {
    if(event.key === "Escape") closeSidebar();
  });
})();
