/* QMES legacy sidebar compatibility shim — 2026-09-03
 * Intentionally inert.
 * Older deployed/cached index pages may still request this historical asset.
 * Keep this file free of DOM, CSS, link/style injection, observers, timers,
 * sidebar sizing, menu rendering, or lifecycle behavior.
 *
 * Current sidebar owner:
 *   public/js/qmes-collapsible-side-menu.js
 * Current shell visual owner:
 *   public/css/qmes-shell-layer-base-20260827.css
 */
(function qmesLegacySidebarCompatibilityShim(){
  "use strict";
  window.__QMES_LEGACY_ERP_SIDEBAR_SYNC_DISABLED__ = true;
})();
