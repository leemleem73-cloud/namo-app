/* NAMO QMES - Sales/Due React inline-style prelock
 * 2026-09-18
 * ADD-ONLY.
 *
 * The React ledger owner injects an older, larger inline style after mount.
 * That late style caused the screen to appear compact first, then jump larger.
 * Pre-create the owner's style id so its legacy style injection is skipped.
 * Final appearance is owned by qmes-sales-final-pretty-20260918.css.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_REACT_STYLE_PRELOCK_20260918__) return;
  window.__QMES_SALES_REACT_STYLE_PRELOCK_20260918__ = true;

  const id='qmes-sales-react-ledger-owner-style';
  if(document.getElementById(id)) return;

  const style=document.createElement('style');
  style.id=id;
  style.dataset.qmesSalesStyleOwner='final-pretty-css';
  style.textContent='/* locked: final Sales/Due styling is provided by external final-pretty CSS */';
  document.head.appendChild(style);
})();