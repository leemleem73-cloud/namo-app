/* QMES: refresh live inventory immediately after work-order deletion. */
(function installWorkOrderInventoryDeleteRefresh(global){
  "use strict";
  if(global.__QMES_WO_INVENTORY_DELETE_REFRESH_20260812__) return;
  global.__QMES_WO_INVENTORY_DELETE_REFRESH_20260812__=true;

  function text(value){return String(value??"").trim();}

  function purgeLocalWorkOrder(lotNo){
    const key=text(lotNo);
    if(!key || !global.DB) return;

    if(global.DB.woDocs) delete global.DB.woDocs[key];
    if(Array.isArray(global.DB.batches)) global.DB.batches=global.DB.batches.filter((row)=>text(row?.no)!==key);
    if(global.DB.lots) delete global.DB.lots[key];
    if(global.DB.intermediateLots) delete global.DB.intermediateLots[key];

    if(global.DB.materialRemainders && typeof global.DB.materialRemainders==="object"){
      Object.keys(global.DB.materialRemainders).forEach((remainderKey)=>{
        if(text(global.DB.materialRemainders[remainderKey]?.workOrder)===key) delete global.DB.materialRemainders[remainderKey];
      });
    }

    if(global.DB.intermediateContainers && typeof global.DB.intermediateContainers==="object"){
      Object.keys(global.DB.intermediateContainers).forEach((containerNo)=>{
        const row=global.DB.intermediateContainers[containerNo];
        if(!row) return;
        if(text(row.workOrder)===key) delete global.DB.intermediateContainers[containerNo];
        else if(text(row.lastWorkOrder)===key) global.DB.intermediateContainers[containerNo]={...row,lastWorkOrder:""};
      });
    }

    try{if(typeof global.dbSave==="function") global.dbSave();}catch(_error){}
  }

  function emit(lotNo){
    const detail={source:"workorder-delete-inventory-refresh",lotNo:text(lotNo)};
    try{global.dispatchEvent(new CustomEvent("qmes:workorders-updated",{detail}));}catch(_error){}
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
  }

  function installWrapper(){
    const original=global.qmesSyncDeleteWorkOrder;
    if(typeof original!=="function" || original.__qmesInventoryDeleteRefresh) return false;

    const wrapped=async function(lotNo){
      const key=text(lotNo);
      purgeLocalWorkOrder(key);
      emit(key);
      try{
        return await original.apply(this,arguments);
      }finally{
        purgeLocalWorkOrder(key);
        emit(key);
        if(typeof global.qmesSyncInventorySourceData==="function"){
          try{await global.qmesSyncInventorySourceData();}catch(_error){}
          purgeLocalWorkOrder(key);
          emit(key);
        }
      }
    };
    wrapped.__qmesInventoryDeleteRefresh=true;
    wrapped.__qmesOriginal=original;
    global.qmesSyncDeleteWorkOrder=wrapped;
    return true;
  }

  if(!installWrapper()){
    const timer=global.setInterval(()=>{if(installWrapper()) global.clearInterval(timer);},150);
    global.setTimeout(()=>global.clearInterval(timer),10000);
  }
})(window);
