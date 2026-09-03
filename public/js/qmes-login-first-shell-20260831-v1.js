/* QMES legacy login-first shell compatibility shim — intentionally inert.
 * Older cached pages may still request this path.
 * Current authentication is owned by the app/auth coordinator; this file must not
 * create DOM, inject styles, show overlays, reload the page, or alter shell layout.
 */
(function qmesLegacyLoginFirstShellShim(){
  "use strict";
  window.__QMES_LOGIN_FIRST_SHELL_DISABLED__ = true;
})();
