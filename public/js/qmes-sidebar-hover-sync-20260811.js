(function(){
  'use strict';
  if (window.__QMES_SIDEBAR_HOVER_SYNC_20260811__) return;
  window.__QMES_SIDEBAR_HOVER_SYNC_20260811__ = true;

  const clean = value => String(value || '')
    .replace(/[›〉]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const menuMap = {
    '대시보드': ['종합 대시보드', 'SPC 대시보드'],
    '생산관리': ['생산 진행', '작업지시서'],
    '품질검사': ['수입검사 (IQC)', '공정검사 (PQC)', '출하검사 (OQC)', 'SPC (Cpk)', '품질 인터락', '출하성적서'],
    '현장입력': ['현장 입력 (iPad)'],
    '재고관리': ['원재료 재고'],
    '거래처 현황': ['거래처 현황'],
    '설비관리': ['설비 모니터링'],
    'LOT 추적': ['LOT 추적'],
    '부적합관리': ['부적합 (8D)', '고객불만 (GQMS)', '4M 변경관리']
  };

  let hoverActive = false;
  let wasManuallyOpen = false;
  let closeTimer = 0;
  let lastHoveredItem = '';

  function getTopLabel(button) {
    return clean(button && (button.querySelector('span')?.textContent || button.textContent));
  }

  function sidebar() {
    return document.getElementById('qmes-sync-sidebar');
  }

  function showMatchingSidebar(group) {
    const side = sidebar();
    if (!side || !menuMap[group]) return;

    if (!hoverActive) {
      wasManuallyOpen = document.body.classList.contains('qmes-side-open');
      hoverActive = true;
    }

    const title = side.querySelector('.qmes-side-title');
    const head = side.querySelector('.qmes-side-head');
    const items = side.querySelector('.qmes-side-items');
    const search = side.querySelector('.qmes-side-search-input');

    if (search) search.value = '';
    if (title) title.textContent = group;
    if (head) head.classList.add('is-group-active');

    if (items) {
      items.replaceChildren();
      menuMap[group].forEach((label, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'qmes-side-item';
        button.dataset.group = group;
        button.dataset.index = String(index);
        button.textContent = label;
        items.appendChild(button);
      });
    }

    lastHoveredItem = '';
    document.body.classList.add('qmes-side-open');
    side.style.setProperty('display', 'block', 'important');
    side.style.setProperty('visibility', 'visible', 'important');
    side.style.setProperty('opacity', '1', 'important');
    side.style.setProperty('pointer-events', 'auto', 'important');
    side.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
  }

  function pointerIsInInteractiveArea() {
    const top = document.querySelector('.qmes-top-menu');
    const side = sidebar();
    return Boolean((top && top.matches(':hover')) || (side && side.matches(':hover')));
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (pointerIsInInteractiveArea()) return;

      const side = sidebar();
      hoverActive = false;
      lastHoveredItem = '';

      if (!wasManuallyOpen) {
        document.body.classList.remove('qmes-side-open');
        if (side) {
          ['display', 'visibility', 'opacity', 'pointer-events', 'transform'].forEach(prop => side.style.removeProperty(prop));
        }
      }

      wasManuallyOpen = false;
    }, 180);
  }

  document.addEventListener('mouseover', event => {
    const button = event.target.closest('.qmes-top-menu-button');
    if (!button) return;

    clearTimeout(closeTimer);
    const group = getTopLabel(button);
    if (!menuMap[group]) return;

    showMatchingSidebar(group);
  }, true);

  document.addEventListener('mouseover', event => {
    const item = event.target.closest?.('#qmes-sync-sidebar .qmes-side-item');
    if (!item) return;

    clearTimeout(closeTimer);
    const key = `${item.dataset.group || ''}:${item.dataset.index || ''}:${clean(item.textContent)}`;
    if (key === lastHoveredItem) return;
    lastHoveredItem = key;

    item.click();
  }, true);

  document.addEventListener('mouseout', event => {
    const item = event.target.closest?.('#qmes-sync-sidebar .qmes-side-item');
    if (item) {
      const next = event.relatedTarget;
      if (!next || !item.contains(next)) lastHoveredItem = '';
    }

    const fromTop = event.target.closest?.('.qmes-top-menu');
    const fromSide = event.target.closest?.('#qmes-sync-sidebar');
    if (!fromTop && !fromSide) return;

    const next = event.relatedTarget;
    if (next && (next.closest?.('.qmes-top-menu') || next.closest?.('#qmes-sync-sidebar'))) {
      clearTimeout(closeTimer);
      return;
    }

    scheduleClose();
  }, true);
})();
