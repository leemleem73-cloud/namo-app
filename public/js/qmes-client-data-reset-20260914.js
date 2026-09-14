/* NAMO QMES one-time browser data reset - 2026-09-14
 * Clears browser-side QMES/ERP data after server-side business data reset.
 * User accounts remain on the server; the browser may require login again.
 */
(function resetQmesBrowserDataOnce(){
  'use strict';
  var MARKER='qmes-client-full-reset-20260914-v1';
  try{
    if(window.localStorage&&window.localStorage.getItem(MARKER)==='1')return;
  }catch(_error){}

  try{
    if(window.localStorage){
      window.localStorage.clear();
      window.localStorage.setItem(MARKER,'1');
    }
  }catch(_error){}

  try{
    if(window.sessionStorage)window.sessionStorage.clear();
  }catch(_error){}

  try{
    if(window.caches&&typeof window.caches.keys==='function'){
      window.caches.keys().then(function(keys){
        return Promise.all(keys.map(function(key){return window.caches.delete(key);}));
      }).catch(function(){});
    }
  }catch(_error){}

  try{
    if(window.indexedDB&&typeof window.indexedDB.databases==='function'){
      window.indexedDB.databases().then(function(dbs){
        (dbs||[]).forEach(function(db){
          if(db&&db.name){try{window.indexedDB.deleteDatabase(db.name);}catch(_error){}}
        });
      }).catch(function(){});
    }
  }catch(_error){}

  try{
    if(navigator.serviceWorker&&typeof navigator.serviceWorker.getRegistrations==='function'){
      navigator.serviceWorker.getRegistrations().then(function(registrations){
        (registrations||[]).forEach(function(registration){
          try{registration.unregister();}catch(_error){}
        });
      }).catch(function(){});
    }
  }catch(_error){}

  window.__QMES_CLIENT_DATA_RESET_20260914__=true;
  console.log('[QMES RESET] browser data cleared once');
})();
