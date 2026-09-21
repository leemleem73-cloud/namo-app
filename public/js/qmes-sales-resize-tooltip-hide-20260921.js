/* QMES resize tooltip hide - 2026-09-21
 * ADD-ONLY patch.
 * Removes browser hover tooltip text from table/sidebar resize handles.
 * Drag behavior and accessibility labels remain unchanged.
 */
(function(){
  "use strict";
  if(window.__QMES_RESIZE_TOOLTIP_HIDE_20260921__) return;
  window.__QMES_RESIZE_TOOLTIP_HIDE_20260921__=true;

  const selector=[
    ".qmes-sales-fullheight-resizer",
    ".qmes-sales-col-resizer",
    "#qmes-sidebar-resizer-20260921"
  ].join(",");

  function clearTitles(root){
    const base=root&&root.querySelectorAll?root:document;
    if(base.matches&&base.matches(selector)) base.removeAttribute("title");
    base.querySelectorAll(selector).forEach(el=>el.removeAttribute("title"));
  }

  function boot(){
    clearTitles(document);

    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        mutation.addedNodes.forEach(node=>{
          if(node&&node.nodeType===1) clearTitles(node);
        });
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    [200,700,1500,3000,6000].forEach(ms=>setTimeout(()=>clearTitles(document),ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();