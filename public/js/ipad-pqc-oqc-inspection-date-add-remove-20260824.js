/* QMES IPAD PQC/OQC inspection basic-info cleanup — permanently remove stray '추가' control, 2026-08-24 v2 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_OQC_DATE_ADD_REMOVE_20260824_V2__) return;
  window.__QMES_IPAD_PQC_OQC_DATE_ADD_REMOVE_20260824_V2__ = true;

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

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

  function removeStrayAdd(){
    const root = document.querySelector('.qmes-ipad-pop');
    if(!root) return;
    const mode = currentMode(root);
    if(mode !== 'PQC' && mode !== 'OQC') return;

    /* 첫 번째 섹션 = 검사 기본정보. 검사 항목 영역은 절대 건드리지 않는다. */
    const sections = Array.from(root.querySelectorAll(':scope > .qmes-ipad-section'));
    const basicSection = sections.find((section) => clean(section.querySelector('.qmes-ipad-section-title h2')?.textContent) === '검사 기본정보') || sections[0];
    if(!basicSection) return;
    const grid = basicSection.querySelector('.qmes-ipad-form-grid');
    if(!grid) return;

    /* 검사 기본정보 안의 '추가' 컨트롤 자체를 DOM에서 삭제 */
    grid.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach((node) => {
      const text = node.tagName === 'INPUT' ? clean(node.value) : clean(node.textContent);
      const aria = clean(node.getAttribute?.('aria-label'));
      const title = clean(node.getAttribute?.('title'));
      if(text === '추가' || aria === '추가' || title === '추가') node.remove();
    });

    /* 특히 검사일자 필드 내부/인접 요소에 남은 추가 요소까지 제거 */
    const dateLabel = Array.from(grid.querySelectorAll('label')).find((label) =>
      clean(label.querySelector(':scope > span')?.textContent || label.querySelector('span')?.textContent) === '검사일자'
    );
    if(dateLabel){
      dateLabel.querySelectorAll('*').forEach((node) => {
        if(clean(node.textContent) === '추가' && node.children.length === 0) node.remove();
      });
      const siblings = [dateLabel.previousElementSibling, dateLabel.nextElementSibling].filter(Boolean);
      siblings.forEach((node) => {
        const text = node.tagName === 'INPUT' ? clean(node.value) : clean(node.textContent);
        if(text === '추가') node.remove();
      });
    }
  }

  let queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      removeStrayAdd();
      setTimeout(removeStrayAdd, 0);
      setTimeout(removeStrayAdd, 50);
      setTimeout(removeStrayAdd, 150);
    });
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click', schedule, true);
  document.addEventListener('change', schedule, true);
  window.addEventListener('focus', schedule);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
})();
