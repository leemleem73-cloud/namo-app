/* Temporarily disabled: the previous business-extension runtime used a MutationObserver
   that re-appended menu nodes on every observed mutation, creating a self-triggering
   DOM mutation loop and freezing clicks across the entire QMES UI.
   Keep this file inert until the extension menus are rebuilt inside the native React router. */
(function(){
  window.__QMES_BUSINESS_EXTENSION_RUNTIME_V3__ = true;
})();
