/* QMES inspection UI shortcut — replace only IQC/PQC/OQC 신규등록 with 현장검사 바로가기. */
(function installInspectionFieldShortcut(global){
  const TARGET_KEY = 'qmes_field_shortcut_mode';
  let retryTimer = 0;
  let retryUntil = 0;

  function buttonText(button){
    return String(button?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isNewRegistrationButton(button){
    const text = buttonText(button);
    return text === '신규등록' || text.endsWith(' 신규등록') || text.includes('신규등록');
  }

  function topFieldInputButton(){
    return Array.from(document.querySelectorAll('.qmes-top-menu-button')).find((button) => buttonText(button).includes('현장입력')) || null;
  }

  function pendingMode(){
    try { return sessionStorage.getItem(TARGET_KEY) || ''; } catch (error) { return ''; }
  }

  function clearPendingMode(){
    try { sessionStorage.removeItem(TARGET_KEY); } catch (error) {}
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = 0;
    }
    retryUntil = 0;
  }

  function schedulePendingModeRetry(){
    if (retryTimer || !pendingMode()) return;
    if (!retryUntil) retryUntil = Date.now() + 3000;
    if (Date.now() > retryUntil) {
      clearPendingMode();
      return;
    }
    retryTimer = setTimeout(() => {
      retryTimer = 0;
      if (!activatePendingMode()) schedulePendingModeRetry();
    }, 60);
  }

  function openTargetMode(mode){
    try { sessionStorage.setItem(TARGET_KEY, mode); } catch (error) {}
    retryUntil = Date.now() + 3000;

    const topButton = topFieldInputButton();
    if (topButton) {
      topButton.click();
    } else {
      const directHome = document.querySelector('.qmes-ipad-home-card, .qmes-ipad-mode-tabs');
      if (!directHome) schedulePendingModeRetry();
    }

    if (!activatePendingMode()) schedulePendingModeRetry();
  }

  function activatePendingMode(){
    const mode = pendingMode();
    if (!['IQC','PQC','OQC'].includes(mode)) return false;

    const homeCard = document.querySelector(`.qmes-ipad-home-card.is-${mode.toLowerCase()}`);
    if (homeCard) {
      clearPendingMode();
      homeCard.click();
      return true;
    }

    const modeButton = Array.from(document.querySelectorAll('.qmes-ipad-mode-tabs button'))
      .find((button) => buttonText(button).includes(mode));
    if (modeButton) {
      clearPendingMode();
      modeButton.click();
      return true;
    }

    return false;
  }

  function makeShortcutButton(sourceButton, mode){
    if (!sourceButton || sourceButton.dataset.qmesFieldShortcut === 'true' || !isNewRegistrationButton(sourceButton)) return sourceButton;

    const button = sourceButton.cloneNode(false);
    button.type = 'button';
    button.className = sourceButton.className;
    button.dataset.qmesFieldShortcut = 'true';
    button.dataset.qmesFieldMode = mode;
    button.title = `${mode === 'IQC' ? '수입검사' : mode === 'PQC' ? '공정검사' : '출하검사'} 현장검사로 이동`;
    button.textContent = '현장검사 바로가기';
    button.addEventListener('click', () => openTargetMode(mode));
    sourceButton.replaceWith(button);
    return button;
  }

  function replaceButtons(){
    document.querySelectorAll('.qmes-iqc-page .qmes-iqc-new-btn:not([data-qmes-field-shortcut="true"])')
      .forEach((button) => makeShortcutButton(button, 'IQC'));

    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut="true"])')
      .forEach((button) => makeShortcutButton(button, 'PQC'));

    document.querySelectorAll('.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut="true"])')
      .forEach((button) => makeShortcutButton(button, 'OQC'));

    if (!activatePendingMode()) schedulePendingModeRetry();
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  global.qmesOpenFieldInputShortcut = openTargetMode;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__ = true;
})(window);
