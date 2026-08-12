/* QMES inventory runtime bridge - 2026-08-12
 * Safe fix: never redefine DB with getters/accessors.
 * Before inventory code runs, point window.DB at the current lexical DB object.
 * This keeps IQC receipts and work-order consumption on the same live object.
 */
(function installInventoryRuntimeBridge(global){
  "use strict";
  if(global.__QMES_INVENTORY_RUNTIME_BRIDGE_20260812__) return;
  global.__QMES_INVENTORY_RUNTIME_BRIDGE_20260812__=true;

  function publishCurrentDb(){
    try{
      if(typeof DB!=="undefined" && DB){
        global.DB=DB;
        return DB;
      }
    }catch(_error){}
    return null;
  }

  function emit(source,lotNo){
    const detail={source:source||"inventory-runtime-bridge",lotNo:String(lotNo||"").trim()};
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
  }

  function purgeDeletedWorkOrder(lotNo){
    const db=publishCurrentDb();
    const key=String(lotNo||"").trim();
    if(!db || !key) return;
    if(db.woDocs) delete db.woDocs[key];
    if(Array.isArray(db.batches)) db.batches=db.batches.filter((row)=>String(row?.no||"").trim()!==key);
    if(db.lots) delete db.lots[key];
    if(db.intermediateLots) delete db.intermediateLots[key];
    if(db.materialRemainders && typeof db.materialRemainders==="object"){
      Object.keys(db.materialRemainders).forEach((remainderKey)=>{
        if(String(db.materialRemainders[remainderKey]?.workOrder||"").trim()===key) delete db.materialRemainders[remainderKey];
      });
    }
    try{if(typeof dbSave==="function") dbSave();}catch(_error){}
  }

  function wrapInventoryComponent(){
    const original=global.InventoryTab;
    if(typeof original!=="function" || original.__qmesLiveDbBridge) return false;
    const wrapped=function InventoryTabLiveDbBridge(props){
      publishCurrentDb();
      return original(props);
    };
    wrapped.__qmesLiveDbBridge=true;
    wrapped.__qmesOriginal=original;
    global.InventoryTab=wrapped;
    return true;
  }

  function wrapBuilder(name){
    const original=global[name];
    if(typeof original!=="function" || original.__qmesLiveDbBridge) return false;
    const wrapped=function(){
      publishCurrentDb();
      return original.apply(this,arguments);
    };
    wrapped.__qmesLiveDbBridge=true;
    wrapped.__qmesOriginal=original;
    global[name]=wrapped;
    return true;
  }

  function wrapDelete(){
    const original=global.qmesSyncDeleteWorkOrder;
    if(typeof original!=="function" || original.__qmesLiveDbBridge) return false;
    const wrapped=async function(lotNo){
      publishCurrentDb();
      try{return await original.apply(this,arguments);}
      finally{
        purgeDeletedWorkOrder(lotNo);
        emit("workorder-delete",lotNo);
        global.setTimeout(()=>{purgeDeletedWorkOrder(lotNo);emit("workorder-delete-delay",lotNo);},120);
      }
    };
    wrapped.__qmesLiveDbBridge=true;
    wrapped.__qmesOriginal=original;
    global.qmesSyncDeleteWorkOrder=wrapped;
    return true;
  }

  function wrapPullWorkOrders(){
    const original=global.qmesSyncPullWorkOrders;
    if(typeof original!=="function" || original.__qmesLiveDbBridge) return false;
    const wrapped=async function(){
      publishCurrentDb();
      try{return await original.apply(this,arguments);}
      finally{
        publishCurrentDb();
        emit("workorders-pulled","");
      }
    };
    wrapped.__qmesLiveDbBridge=true;
    wrapped.__qmesOriginal=original;
    global.qmesSyncPullWorkOrders=wrapped;
    return true;
  }

  function installAll(){
    publishCurrentDb();
    wrapInventoryComponent();
    wrapBuilder("qmesBuildInventoryRows");
    wrapBuilder("qmesBuildInventoryLotRows");
    wrapDelete();
    wrapPullWorkOrders();
  }

  installAll();
  const timer=global.setInterval(installAll,150);
  global.setTimeout(()=>global.clearInterval(timer),12000);

  ["focus","qmes:auth-ready","qmes:inventory-stage3-ready","qmes:workorders-updated","qmes:data-updated"].forEach((eventName)=>{
    global.addEventListener(eventName,()=>publishCurrentDb());
  });
  document.addEventListener("qmes:data-updated",publishCurrentDb);
})(window);
