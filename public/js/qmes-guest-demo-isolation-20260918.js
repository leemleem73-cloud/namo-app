/* NAMO QMES - Guest client isolation (add-only, 2026-09-18)
 * Guest only:
 * - isolates all localStorage reads/writes
 * - resets in-memory DB to empty
 * - hides IQC/PQC/OQC inspection item/spec entry areas
 */
(function(){
  'use strict';
  if(window.__QMES_GUEST_CLIENT_ISOLATION_20260918__) return;
  window.__QMES_GUEST_CLIENT_ISOLATION_20260918__=true;

  const LOGIN_KEY='qmes-current-user-v1';
  const nativeGet=Storage.prototype.getItem;
  const nativeSet=Storage.prototype.setItem;
  const nativeRemove=Storage.prototype.removeItem;
  const nativeClear=Storage.prototype.clear;
  let guest=false;

  function parse(v){try{return JSON.parse(v||'null')}catch(_){return null}}
  function isGuestUser(u){
    if(!u)return false;
    const vals=[u.role,u.uid,u.name,u.email].map(v=>String(v||'').trim().toLowerCase());
    return vals.includes('guest')||vals.includes('guest@namochemical.local');
  }

  function emptyDb(){
    return {
      batches:[],woDocs:{},iqc:[],iqcMaterials:[],insp:{PQC:[],OQC:[]},
      holds:[],gateEvents:[],intermediateLots:{},intermediateContainers:{},materialRemainders:{},
      eqReadings:{},eqLogs:[],eqAlarms:[],complaints:[],lots:{},coa:{},
      popEntries:[],auditLogs:[],seqs:{}
    };
  }

  function installStyle(){
    if(document.getElementById('qmes-guest-demo-style-20260918'))return;
    const s=document.createElement('style');
    s.id='qmes-guest-demo-style-20260918';
    s.textContent=[
      'html.qmes-guest-demo .qmes-iqc-modal-grid-inspection{display:none!important}',
      'html.qmes-guest-demo .qmes-pqc-item-table-wrap{display:none!important}',
      'html.qmes-guest-demo .qmes-pqc-item-table{display:none!important}',
      'html.qmes-guest-demo .qmes-pqc-measure-line{display:none!important}',
      'html.qmes-guest-demo .qmes-pqc-value-preview-btn{display:none!important}',
      'html.qmes-guest-demo [data-qmes-spec],html.qmes-guest-demo .qmes-spec,html.qmes-guest-demo .spec{display:none!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function resetRuntime(){
    try{
      if(typeof dbDefault==='function' && typeof DB!=='undefined') DB=dbDefault();
      else if(typeof DB!=='undefined') DB=emptyDb();
    }catch(_){}
    try{
      if(window.qmesSalesFinalOwnerV3&&typeof window.qmesSalesFinalOwnerV3.render==='function') window.qmesSalesFinalOwnerV3.render();
      if(window.qmesSalesPurchaseStableOwner20260918&&typeof window.qmesSalesPurchaseStableOwner20260918.render==='function') window.qmesSalesPurchaseStableOwner20260918.render();
    }catch(_){}
    try{
      window.dispatchEvent(new CustomEvent('qmes:guest-demo-activated'));
      window.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{guestDemo:true}}));
      window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{guestDemo:true}}));
    }catch(_){}
  }

  function activate(){
    if(guest)return;
    guest=true;
    window.__QMES_GUEST_DEMO__=true;
    document.documentElement.classList.add('qmes-guest-demo');
    installStyle();
    resetRuntime();
  }

  function deactivate(){
    guest=false;
    delete window.__QMES_GUEST_DEMO__;
    document.documentElement.classList.remove('qmes-guest-demo');
  }

  Storage.prototype.getItem=function(key){
    if(this===window.localStorage && guest) return null;
    return nativeGet.call(this,key);
  };

  Storage.prototype.setItem=function(key,value){
    if(this===window.sessionStorage && String(key)===LOGIN_KEY){
      const user=parse(value);
      const nextGuest=isGuestUser(user);
      const result=nativeSet.call(this,key,value);
      if(nextGuest) activate(); else if(guest) deactivate();
      return result;
    }
    if(this===window.localStorage && guest) return;
    return nativeSet.call(this,key,value);
  };

  Storage.prototype.removeItem=function(key){
    if(this===window.sessionStorage && String(key)===LOGIN_KEY){
      const result=nativeRemove.call(this,key);
      if(guest) deactivate();
      return result;
    }
    if(this===window.localStorage && guest) return;
    return nativeRemove.call(this,key);
  };

  Storage.prototype.clear=function(){
    if(this===window.localStorage && guest) return;
    return nativeClear.call(this);
  };

  try{
    const saved=parse(nativeGet.call(window.sessionStorage,LOGIN_KEY));
    if(isGuestUser(saved))activate();
  }catch(_){}
})();