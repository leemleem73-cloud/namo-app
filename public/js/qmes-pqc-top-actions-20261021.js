/* Move the existing, wired PQC actions to the same top-right location as OQC. */
(function () {
  'use strict';
  const original = window.showRowDetail;
  if (typeof original !== 'function') return;
  window.showRowDetail = function (id) {
    const result = original.apply(this, arguments);
    if (id !== 'process') return result;
    const pane = document.querySelector('.am-split[data-am-screen="process"]');
    const top = pane?.querySelector('.am-detail-actions');
    const foot = document.getElementById('workspaceFoot');
    const back = foot?.querySelector('[data-am-back]');
    const save = foot?.querySelector('[data-am-save]');
    if (top && back && save) {
      back.textContent = '목록';
      save.textContent = '저장';
      top.replaceChildren(back, save);
    }
    return result;
  };
})();
