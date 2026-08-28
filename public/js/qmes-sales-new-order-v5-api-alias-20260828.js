/* NAMO QMES - Sales new-order V5 API alias - 2026-08-28 */
(function(){
  "use strict";
  function bind(){
    if(!window.qmesSalesNewOrderNamoV5?.open)return false;
    window.qmesSalesNewOrderNamoV4=window.qmesSalesNewOrderNamoV5;
    window.qmesSalesNewOrderNamoV3=window.qmesSalesNewOrderNamoV5;
    window.qmesSalesNewOrderNamo=window.qmesSalesNewOrderNamoV5;
    window.qmesSalesNewOrderEnterprise=window.qmesSalesNewOrderNamoV5;
    return true;
  }
  if(!bind()) [20,80,180,400,900].forEach(ms=>setTimeout(bind,ms));
})();
