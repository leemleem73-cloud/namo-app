/* QMES inspection UI shortcut — replace only IQC/PQC/OQC 신규등록 with 현장검사 바로가기. */
(function installInspectionFieldShortcut(global){
  'use strict';
  const TARGET_KEY = 'qmes_field_shortcut_mode';

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

  function openTargetMode(mode){
    const target = String(mode || '').toUpperCase();
    if (!['IQC','PQC','OQC'].includes(target)) return;

    /*
     * Store only the requested inspection mode here.
     * The FieldInputTab bridge consumes it after React has mounted the POP screen.
     * This removes all 50/150/300ms DOM races and does not manipulate the sidebar.
     */
    try { sessionStorage.setItem(TARGET_KEY, target); } catch (error) {}

    const topButton = topFieldInputButton();
    if (topButton) topButton.click();
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
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  global.qmesOpenFieldInputShortcut = openTargetMode;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__ = true;
})(window);
