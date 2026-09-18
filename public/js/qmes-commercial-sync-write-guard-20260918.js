/* NAMO QMES - commercial ERP background-write guard
 * 2026-09-18
 * ADD-ONLY.
 * Prevents unauthorized background seed/restore scripts from issuing restricted
 * erp:sales / erp:purchase POST sync calls. Server permissions remain unchanged.
 */
(function(){
  "use strict";
  if(window.__QMES_COMMERCIAL_SYNC_WRITE_GUARD_20260918__) return;
  window.__QMES_COMMERCIAL_SYNC_WRITE_GUARD_20260918__=true;

  const original=window.qmesSyncUpsert;
  if(typeof original!=="function") return;

  const clean=v=>String(v==null?"":v).replace(/\s+/g,"").trim();
  function currentUser(){
    return window.__QMES_CURRENT_USER__||window.__QMES_USER__||(()=>{try{return JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null")||{}}catch(_){return {}}})();
  }
  function canWriteCommercial(){
    const u=currentUser()||{};
    const role=clean(u.role).toLowerCase();
    const dept=clean(u.department||u.dept);
    const name=clean(u.name);
    return role==="admin"||dept==="영업부"||["김종혁","김세희","정영기"].includes(name);
  }

  window.qmesSyncUpsert=async function(type,key,payload){
    const t=clean(type).toLowerCase(),k=clean(key);
    if(t==="inventory"&&(k==="erp:sales"||k==="erp:purchase")&&!canWriteCommercial()){
      return {localOnly:true,skipped:true,type:t,key:k};
    }
    return original.apply(this,arguments);
  };
})();