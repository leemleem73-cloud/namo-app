/* QMES IPAD PQC/OQC inspection-date field sanitizer — fixes IQC->PQC/OQC stale DOM */
(function(){
  "use strict";
  if(window.__QMES_IPAD_DATE_FIELD_SANITIZE_20260824__) return;
  window.__QMES_IPAD_DATE_FIELD_SANITIZE_20260824__ = true;

  const clean = (value) => String(value == null ? "" : value).replace(/\s+/g," ").trim();

  function currentMode(root){
    const active = root?.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text = clean(active?.textContent).toUpperCase();
    if(text.includes('PQC')) return 'PQC';
    if(text.includes('OQC')) return 'OQC';
    return '';
  }

  function sanitize(){
    const root = document.querySelector('.qmes-ipad-pop');
    if(!root) return;
    const mode = currentMode(root);
    if(mode !== 'PQC' && mode !== 'OQC') return;

    const sections = Array.from(root.querySelectorAll('.qmes-ipad-section'));
    const basic = sections.find((section) => clean(section.querySelector('.qmes-ipad-section-title h2')?.textContent) === '검사 기본정보');
    const grid = basic?.querySelector('.qmes-ipad-form-grid');
    if(!grid) return;

    const dateLabel = Array.from(grid.querySelectorAll('label')).find((label) => {
      const caption = clean(label.querySelector(':scope > span')?.textContent || label.querySelector('span')?.textContent);
      return caption === '검사일자';
    });
    if(!dateLabel) return;

    const caption = dateLabel.querySelector(':scope > span');
    const dateInput = dateLabel.querySelector(':scope > input[type="date"]') || dateLabel.querySelector('input[type="date"]');
    if(!caption || !dateInput) return;

    /* 검사일자 label은 제목 span + date input만 허용. IQC에서 넘어온 추가 DOM은 전부 제거. */
    Array.from(dateLabel.children).forEach((child) => {
      if(child !== caption && child !== dateInput) child.remove();
    });

    /* label 내부에 중첩되어 남은 추가 요소도 제거 */
    Array.from(dateLabel.querySelectorAll('*')).forEach((node) => {
      if(node === caption || node === dateInput || caption.contains(node) || dateInput.contains?.(node)) return;
      node.remove();
    });

    /* React 외부 스크립트가 검사일자 바로 옆에 끼운 단독 컨트롤 제거 */
    const prev = dateLabel.previousElementSibling;
    const next = dateLabel.nextElementSibling;
    [prev,next].filter(Boolean).forEach((node) => {
      if(node.tagName === 'LABEL') return;
      if(node.matches?.('button,[role="button"],a,input[type="button"],input[type="submit"]')) node.remove();
    });
  }

  let queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sanitize();
      setTimeout(sanitize,0);
      setTimeout(sanitize,40);
      setTimeout(sanitize,120);
    });
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',schedule,true);
  document.addEventListener('change',schedule,true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
})();
