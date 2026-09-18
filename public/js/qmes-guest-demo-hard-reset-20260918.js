/* NAMO QMES - Guest demo hard reset boot
 * 2026-09-18
 * ADD-ONLY.
 *
 * Purpose:
 * - When guest signs in, reload the QMES once so every module starts with
 *   guest-isolated empty API/localStorage data from first paint.
 * - When guest signs out, reload once so normal users get the real data again.
 * - Does NOT delete or alter operational data.
 */
(function(){
  'use strict';
  if(window.__QMES_GUEST_HARD_RESET_20260918__) return;
  window.__QMES_GUEST_HARD_RESET_20260918__ = true;

  const LOGIN_KEY = 'qmes-current-user-v1';
  let reloading = false;

  function safeReload(){
    if(reloading) return;
    reloading = true;
    try{
      sessionStorage.setItem('qmes_current_tab','dash');
      sessionStorage.removeItem('qmes_open_menu');
    }catch(_){}
    setTimeout(function(){ window.location.reload(); }, 0);
  }

  /* Fired by qmes-guest-demo-isolation when guest is activated after login. */
  window.addEventListener('qmes:guest-demo-activated', safeReload, { once:true });

  /* Restore a clean real-data boot after leaving guest mode. */
  const previousRemove = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function(key){
    const wasGuest = this === window.sessionStorage
      && String(key) === LOGIN_KEY
      && window.__QMES_GUEST_DEMO__ === true;

    const result = previousRemove.call(this, key);

    if(wasGuest) safeReload();
    return result;
  };
})();