/* QMES inspection UI shortcut — one user click opens the requested field-inspection mode. */
(function installInspectionFieldShortcut(global){
  'use strict';

  function buttonText(button){
    return String(button?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isNewRegistrationButton(button){
    const text = buttonText(button);
    return text === '신규등록' || text.endsWith(' 신규등록') || text.includes('신규등록');
  }

  function topFieldInputButton(){
    return Array.from(document.querySelectorAll('.qmes-top-menu-button'))
      .find((button) => buttonText(button) === '현장입력') || null;
  }

  function waitAndOpenMode(mode){
    const selector = `.qmes-ipad-home-card.is-${String(mode).toLowerCase()}`;
    let finished = false;
    let observer = null;
    let timer = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (observer) observer.disconnect();
      if (timer) clearTimeout(timer);
    };

    const tryOpen = () => {
      if (finished) return true;
      const card = document.querySelector(selector);
      if (!card) return false;
      finish();
      card.click();
      return true;
    };

    if (tryOpen()) return;

    observer = new MutationObserver(() => { tryOpen(); });
    observer.observe(document.documentElement, {childList:true, subtree:true});
    timer = setTimeout(finish, 2500);
  }

  function openTargetMode(mode){
    const target = String(mode || '').toUpperCase();
    if (!['IQC','PQC','OQC'].includes(target)) return;

    /* Start waiting first, then let React navigate to the field-input tab. */
    waitAndOpenMode(target);

    const topButton = topFieldInputButton();
    if (topButton) {
      topButton.click();
      return;
    }

    /* If already on the field-input screen, waitAndOpenMode will handle it. */
    const currentCard = document.querySelector(`.qmes-ipad-home-card.is-${target.toLowerCase()}`);
    if (currentCard) currentCard.click();
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
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();

  global.qmesOpenFieldInputShortcut = openTargetMode;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__ = true;
})(window);
