/* QMES inventory/work-order link - 2026-08-12
 * Safe narrow fix: no window.DB accessor/redefinition.
 * Publish the current lexical DB object to inventory modules only when needed,
 * then refresh inventory after work-order changes/deletion.
 */
(function installInventoryWorkOrderLink(global){
  "use strict";
  if(global.__QMES_INVENTORY_WO_LINK_20260812__) return;
  global.__QMES_INVENTORY_WO_LINK_20260812__=true;

  function publishCurrentDb(){
    try{
      if(typeof DB!=="undefined" && DB){
        global.DB=DB;
        return true;
      }
    }catch(_error){}
    return false;
  }

  function emit(lotNo,source){
    const detail={source:source||"inventory-workorder-link",lotNo:String(lotNo||"").trim()};
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
  }

  function refresh(lotNo,source){
    publishCurrentDb();
    emit(lotNo,source);
  }

  function installDeleteWrapper(){
    const original=global.qmesSyncDeleteWorkOrder;
    if(typeof original!=="function" || original.__qmesInventoryLink) return false;

    const wrapped=async function(lotNo){
      refresh(lotNo,"workorder-delete-before");
      try{
        return await original.apply(this,arguments);
      }finally{
        refresh(lotNo,"workorder-delete-after");
        global.setTimeout(()=>refresh(lotNo,"workorder-delete-after-delay"),120);
      }
    };
    wrapped.__qmesInventoryLink=true;
    wrapped.__qmesOriginal=original;
    global.qmesSyncDeleteWorkOrder=wrapped;
    return true;
  }

  publishCurrentDb();

  ["qmes:workorders-updated","qmes:inventory-stage3-ready","focus"].forEach((eventName)=>{
    global.addEventListener(eventName,()=>refresh("",`workorder-link-${eventName}`));
  });
  document.addEventListener("qmes:workorders-updated",()=>refresh("","workorder-link-document"));

  if(!installDeleteWrapper()){
    const timer=global.setInterval(()=>{
      publishCurrentDb();
      if(installDeleteWrapper()) global.clearInterval(timer);
    },100);
    global.setTimeout(()=>global.clearInterval(timer),10000);
  }
})(window);
