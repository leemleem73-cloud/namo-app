/* QMES inspection UI cleanup — remove 신규등록 buttons from IQC/PQC/OQC. */
(function removeInspectionNewButtons(global){
  function removeButtons(){
    const selectors = [
      '.qmes-iqc-page .qmes-iqc-new-btn',
      '.qmes-iqc-new-btn',
      '.qmes-pqc-page .qmes-inspection-new-btn',
      '.qmes-oqc-page .qmes-inspection-new-btn'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((button) => button.remove());
    });

    document.querySelectorAll('button').forEach((button) => {
      const text = String(button.textContent || '').replace(/\s+/g, ' ').trim();
      if (text !== '신규등록') return;
      if (button.closest('.qmes-iqc-quickbar, .qmes-pqc-quickbar, .qmes-oqc-quickbar, .qmes-iqc-page, .qmes-pqc-page, .qmes-oqc-page')) {
        button.remove();
      }
    });
  }

  let scheduled = false;
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      removeButtons();
    });
  }

  const observer = new MutationObserver(schedule);
  function start(){
    removeButtons();
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }

  global.__QMES_INSPECTION_NEW_BUTTONS_REMOVED__ = true;
})(window);
