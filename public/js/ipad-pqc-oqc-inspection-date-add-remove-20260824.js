/* QMES IPAD PQC/OQC inspection basic-info cleanup — permanently remove stray '추가' control, 2026-08-24 v3 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_OQC_DATE_ADD_REMOVE_20260824_V3__) return;
  window.__QMES_IPAD_PQC_OQC_DATE_ADD_REMOVE_20260824_V3__ = true;

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const style = document.createElement('style');
  style.id = 'qmes-ipad-pqc-oqc-date-clean-v3-style';
  style.textContent = `
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-date-no-add::before,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-date-no-add::after,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-date-no-add input::before,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-date-no-add input::after{
      content:none!important;display:none!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-date-no-add{
      position:relative!important;min-width:0!important;width:100%!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-date-no-add input[type="date"]{
      width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function currentMode(root){
    const active = root?.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text = clean(active?.textContent).toUpperCase();
    if(text.includes('PQC')) return 'PQC';
    if(text.includes('OQC')) return 'OQC';
    const title = clean(root?.querySelector('.qmes-ipad-inspection-head h1')?.textContent);
    if(title.includes('공정검사')) return 'PQC';
    if(title.includes('출하검사')) return 'OQC';
    return '';
  }

  function isAdd(node){
    if(!node) return false;
    const text = node.tagName === 'INPUT' ? clean(node.value) : clean(node.textContent);
    const aria = clean(node.getAttribute?.('aria-label'));
    const title = clean(node.getAttribute?.('title'));
    return text === '추가' || aria === '추가' || title === '추가';
  }

  function removeStrayAdd(){
    const root = document.querySelector('.qmes-ipad-pop');
    if(!root) return;
    const mode = currentMode(root);
    if(mode !== 'PQC' && mode !== 'OQC') return;

    const sections = Array.from(root.querySelectorAll(':scope > .qmes-ipad-section'));
    const basicSection = sections.find((section) => clean(section.querySelector('.qmes-ipad-section-title h2')?.textContent) === '검사 기본정보') || sections[0];
    if(!basicSection) return;
    const grid = basicSection.querySelector('.qmes-ipad-form-grid');
    if(!grid) return;

    const dateLabel = Array.from(grid.querySelectorAll('label')).find((label) =>
      clean(label.querySelector(':scope > span')?.textContent || label.querySelector('span')?.textContent) === '검사일자'
    );
    if(!dateLabel) return;
    dateLabel.classList.add('qmes-date-no-add');

    /* 검사일자 라벨 안에 끼어든 추가 요소는 태그 종류와 상관없이 삭제 */
    Array.from(dateLabel.querySelectorAll('*')).forEach((node) => {
      if(isAdd(node)) node.remove();
    });

    /* 검사일자와 같은 행/바로 인접한 곳에 생긴 추가 요소 삭제 */
    const dateRect = dateLabel.getBoundingClientRect();
    Array.from(grid.children).forEach((node) => {
      if(node === dateLabel) return;
      if(!isAdd(node)) return;
      const rect = node.getBoundingClientRect();
      const sameRow = Math.abs(rect.top - dateRect.top) <= Math.max(18, dateRect.height * .75);
      const near = rect.left >= dateRect.left - 20 && rect.left <= dateRect.right + 180;
      if(sameRow && near) node.remove();
    });

    /* 중첩 wrapper 안에 있는 추가 컨트롤도 검사일자 주변이면 삭제 */
    grid.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],a,span,div').forEach((node) => {
      if(!isAdd(node) || dateLabel.contains(node)) return;
      const rect = node.getBoundingClientRect();
      const sameRow = Math.abs(rect.top - dateRect.top) <= Math.max(18, dateRect.height * .75);
      const near = rect.left >= dateRect.left - 20 && rect.left <= dateRect.right + 180;
      if(sameRow && near) node.remove();
    });
  }

  let queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      removeStrayAdd();
      [0,30,80,160,300].forEach((delay)=>setTimeout(removeStrayAdd,delay));
    });
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true});
  document.addEventListener('click', schedule, true);
  document.addEventListener('change', schedule, true);
  window.addEventListener('focus', schedule);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
})();
