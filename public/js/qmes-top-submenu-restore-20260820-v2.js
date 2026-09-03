/* QMES legacy top-submenu compatibility shim — intentionally inert.
 * Older cached pages may still request this path.
 * The current desktop navigation is owned by qmes-collapsible-side-menu.js.
 * This file must not create menus, bind hover handlers, position overlays,
 * inject styles, or mutate navigation state.
 */
(function qmesLegacyTopSubmenuShim(){
  "use strict";
  window.__QMES_TOP_SUBMENU_RESTORE_DISABLED__ = true;
})();
