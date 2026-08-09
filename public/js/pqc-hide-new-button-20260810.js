/* QMES PQC UI patch — hide only the process-inspection 신규등록 button. */
(function installPqcNewButtonGuard(global){
  function apply(){
    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn').forEach((button) => {
      button.style.display = 'none';
      button.setAttribute('aria-hidden', 'true');
      button.tabIndex = -1;
    });
  }

  const observer = new MutationObserver(apply);
  function start(){
    apply();
    observer.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  global.__QMES_PQC_NEW_BUTTON_HIDDEN__ = true;
})(window);
