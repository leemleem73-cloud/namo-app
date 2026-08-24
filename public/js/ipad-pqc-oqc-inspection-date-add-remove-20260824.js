/* QMES IPAD PQC/OQC inspection date field cleanup — remove only stray '추가' button, 2026-08-24 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_OQC_DATE_ADD_REMOVE_20260824__) return;
  window.__QMES_IPAD_PQC_OQC_DATE_ADD_REMOVE_20260824__ = true;

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

  function currentMode(){
    const root = document.querySelector('.qmes-ipad-pop');
    if(!root) return '';
    const active = root.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text = clean(active?.textContent).toUpperCase();
    if(text.includes('PQC')) return 'PQC';
    if(text.includes('OQC')) return 'OQC';
    const title = clean(root.querySelector('.qmes-ipad-inspection-head h1')?.textContent);
    if(title.includes('공정검사')) return 'PQC';
    if(title.includes('출하검사')) return 'OQC';
    return '';
  }

  function isAddButton(node){
    return node?.tagName === 'BUTTON' && clean(node.textContent) === '추가';
  }

  function removeDateAddButton(){
    const mode = currentMode();
    if(mode !== 'PQC' && mode !== 'OQC') return;
    const grid = document.querySelector('.qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid');
    if(!grid) return;

    const dateLabel = Array.from(grid.querySelectorAll('label')).find((label) => {
      const caption = clean(label.querySelector(':scope > span')?.textContent || label.querySelector('span')?.textContent);
      return caption === '검사일자';
    });
    if(!dateLabel) return;

    dateLabel.querySelectorAll('button').forEach((button) => {
      if(isAddButton(button)) button.remove();
    });

    let sibling = dateLabel.nextElementSibling;
    while(sibling && sibling.tagName === 'BUTTON'){
      const next = sibling.nextElementSibling;
      if(isAddButton(sibling)) sibling.remove();
      sibling = next;
    }

    const parent = dateLabel.parentElement;
    if(parent){
      Array.from(parent.children).forEach((child) => {
        if(child === dateLabel || !isAddButton(child)) return;
        const dateRect = dateLabel.getBoundingClientRect();
        const btnRect = child.getBoundingClientRect();
        const sameRow = Math.abs(btnRect.top - dateRect.top) < Math.max(12, dateRect.height * 0.6);
        const nearDate = btnRect.left >= dateRect.left && btnRect.left <= dateRect.right + 120;
        if(sameRow && nearDate) child.remove();
      });
    }
  }

  let queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      removeDateAddButton();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click', schedule, true);
  window.addEventListener('focus', schedule);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
})();
