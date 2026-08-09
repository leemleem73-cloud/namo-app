/* QMES inspection UI shortcut — replace 신규등록 with 현장입력 바로가기 for IQC/PQC/OQC. */
(function installInspectionFieldShortcut(global){
  const TARGET_KEY = 'qmes_field_shortcut_mode';

  function topFieldInputButton(){
    return Array.from(document.querySelectorAll('.qmes-top-menu-button')).find((button) => {
      const text = String(button.textContent || '').replace(/\s+/g, ' ').trim();
      return text.includes('현장입력');
    }) || null;
  }

  function openTargetMode(mode){
    try { sessionStorage.setItem(TARGET_KEY, mode); } catch (error) {}
    const topButton = topFieldInputButton();
    if (topButton) topButton.click();
    activatePendingMode();
  }

  function activatePendingMode(){
    let mode = '';
    try { mode = sessionStorage.getItem(TARGET_KEY) || ''; } catch (error) {}
    if (!['IQC','PQC','OQC'].includes(mode)) return;

    const homeCard = document.querySelector(`.qmes-ipad-home-card.is-${mode.toLowerCase()}`);
    if (homeCard) {
      try { sessionStorage.removeItem(TARGET_KEY); } catch (error) {}
      homeCard.click();
      return;
    }

    const modeButtons = Array.from(document.querySelectorAll('.qmes-ipad-mode-tabs button'));
    const modeButton = modeButtons.find((button) => {
      const text = String(button.textContent || '').replace(/\s+/g, ' ').trim();
      return text.includes(mode);
    });
    if (modeButton) {
      try { sessionStorage.removeItem(TARGET_KEY); } catch (error) {}
      modeButton.click();
    }
  }

  function makeShortcutButton(sourceButton, mode){
    if (sourceButton.dataset.qmesFieldShortcut === 'true') return sourceButton;

    const button = sourceButton.cloneNode(false);
    button.type = 'button';
    button.dataset.qmesFieldShortcut = 'true';
    button.dataset.qmesFieldMode = mode;
    button.removeAttribute('aria-hidden');
    button.removeAttribute('tabindex');
    button.title = `${mode === 'IQC' ? '수입검사' : mode === 'PQC' ? '공정검사' : '출하검사'} 현장입력으로 이동`;
    button.textContent = '현장입력 바로가기';
    button.addEventListener('click', () => openTargetMode(mode));
    sourceButton.replaceWith(button);
    return button;
  }

  function replaceButtons(){
    document.querySelectorAll('.qmes-iqc-new-btn:not([data-qmes-field-shortcut="true"])')
      .forEach((button) => makeShortcutButton(button, 'IQC'));

    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut="true"])')
      .forEach((button) => makeShortcutButton(button, 'PQC'));

    document.querySelectorAll('.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut="true"])')
      .forEach((button) => makeShortcutButton(button, 'OQC'));

    activatePendingMode();
  }

  let scheduled = false;
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      replaceButtons();
    });
  }

  const observer = new MutationObserver(schedule);
  function start(){
    replaceButtons();
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }

  global.qmesOpenFieldInputShortcut = openTargetMode;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__ = true;
})(window);
