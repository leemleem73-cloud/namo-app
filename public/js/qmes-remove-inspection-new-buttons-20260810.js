/* QMES inspection UI shortcut — one click opens the requested field-inspection mode. */
(function installInspectionFieldShortcut(global){
  'use strict';
  const TARGET_KEY = 'qmes_field_shortcut_mode';
  const TAB_KEY = 'qmes_current_tab';

  function buttonText(button){
    return String(button?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isNewRegistrationButton(button){
    const text = buttonText(button);
    return text === '신규등록' || text.endsWith(' 신규등록') || text.includes('신규등록');
  }

  function readTarget(){
    try { return String(sessionStorage.getItem(TARGET_KEY) || '').toUpperCase(); }
    catch(error) { return ''; }
  }

  function clearTarget(){
    try { sessionStorage.removeItem(TARGET_KEY); } catch(error) {}
  }

  function activateTargetMode(){
    const mode = readTarget();
    if (!['IQC','PQC','OQC'].includes(mode)) return false;

    const card = document.querySelector(`.qmes-ipad-home-card.is-${mode.toLowerCase()}`);
    if (!card) return false;

    clearTarget();
    card.click();
    return true;
  }

  function openTargetMode(mode){
    const target = String(mode || '').toUpperCase();
    if (!['IQC','PQC','OQC'].includes(target)) return;

    try {
      sessionStorage.setItem(TARGET_KEY, target);
      sessionStorage.setItem(TAB_KEY, 'pop');
    } catch(error) {}

    /*
     * Do not simulate clicks on React top-menu buttons here.
     * That caused the intermediate production/quality screens and required
     * multiple user clicks. Reloading with qmes_current_tab=pop lets the
     * router mount FieldInputTab directly; the observer below then selects
     * the requested IQC/PQC/OQC card as soon as it exists.
     */
    global.location.reload();
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
      activateTargetMode();
    });
  }

  const observer = new MutationObserver(schedule);
  function start(){
    replaceButtons();
    activateTargetMode();
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();

  global.qmesOpenFieldInputShortcut = openTargetMode;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__ = true;
})(window);
