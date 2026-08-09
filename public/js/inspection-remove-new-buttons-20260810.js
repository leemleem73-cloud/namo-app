/* QMES quality inspection UI — remove 신규등록 buttons from IQC/PQC/OQC. */
(function installInspectionNewButtonRemoval(global){
  function removeNewButtons(){
    document.querySelectorAll([
      '.qmes-iqc-new-btn',
      '.qmes-pqc-page .qmes-inspection-new-btn',
      '.qmes-oqc-page .qmes-inspection-new-btn'
    ].join(',')).forEach((button) => button.remove());
  }

  const observer = new MutationObserver(removeNewButtons);
  function start(){
    removeNewButtons();
    observer.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  global.__QMES_INSPECTION_NEW_BUTTONS_REMOVED__ = true;
})(window);
