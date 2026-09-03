/* NAMO QMES mobile native adapter — safe loader for native mobile-work screens. */
(() => {
  'use strict';

  if (window.__QMES_MOBILE_NATIVE_ADAPTER_V2__) return;
  window.__QMES_MOBILE_NATIVE_ADAPTER_V2__ = true;

  const params = new URLSearchParams(location.search);
  const tab = String(params.get('tab') || '');

  // Current mobile-work.html is native (no desktop iframe). Keep this adapter
  // intentionally small so it cannot interfere with mobile routing or the PC UI.
  if (tab === 'woIssue') {
    const src = '/js/qmes-mobile-workorder-pc-screen-20260903.js?v=20260903-wopc-screen2';
    if (!document.querySelector(`script[src^="/js/qmes-mobile-workorder-pc-screen-20260903.js"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.qmesMobilePcWorkorder = '1';
      script.addEventListener('error', () => {
        console.warn('[QMES mobile] PC-style work-order presentation failed to load.');
      });
      document.head.appendChild(script);
    }
  }
})();
