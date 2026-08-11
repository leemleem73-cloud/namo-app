/* QMES inventory/work-order delete link - 2026-08-12
 * Safe narrow fix: do not redefine window.DB or install accessors.
 * On work-order delete, copy the current lexical DB reference to window.DB
 * so the inventory runtime reads the same object, then trigger a refresh.
 */
(function installInventoryWorkOrderDeleteLink(global){
  "use strict";
  if(global.__QMES_INVENTORY_WO_DELETE_LINK_20260812__) return;
  global.__QMES_INVENTORY_WO_DELETE_LINK_20260812__=true;

  function publishCurrentDb(){
    try{
      if(typeof DB !== "undefined" && DB){
        global.DB=DB;
        return true;
      }
    }catch(_error){}
    return false;
  }

  function emit(lotNo){
    const detail={source:"inventory-workorder-delete-link",lotNo:String(lotNo||"").trim()};
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
  }

  function install(){
    const original=global.qmesSyncDeleteWorkOrder;
    if(typeof original!=="function" || original.__qmesInventoryDeleteLink) return false;

    const wrapped=async function(lotNo){
      publishCurrentDb();
      try{
        return await original.apply(this,arguments);
      }finally{
        publishCurrentDb();
        emit(lotNo);
        global.setTimeout(()=>{publishCurrentDb();emit(lotNo);},100);
      }
    };
    wrapped.__qmesInventoryDeleteLink=true;
    wrapped.__qmesOriginal=original;
    global.qmesSyncDeleteWorkOrder=wrapped;
    return true;
  }

  publishCurrentDb();
  if(!install()){
    const timer=global.setInterval(()=>{
      publishCurrentDb();
      if(install()) global.clearInterval(timer);
    },100);
    global.setTimeout(()=>global.clearInterval(timer),10000);
  }
})(window);
