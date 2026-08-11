/* QMES inspection UI shortcut — replace only IQC/PQC/OQC 신규등록 with 현장검사 바로가기. */
(function installInspectionFieldShortcut(global){
  const TARGET_KEY = 'qmes_field_shortcut_mode';

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

  function openTargetMode(mode){
    const target = String(mode || '').toUpperCase();
    if (!['IQC','PQC','OQC'].includes(target)) return;
    try { sessionStorage.setItem(TARGET_KEY, target); } catch (error) {}

    if (global.__QMES_FIELD_NAVIGATION_READY__) {
      global.dispatchEvent(new CustomEvent('qmes:open-field-inspection', { detail:{ mode:target } }));
    } else {
      const topButton = topFieldInputButton();
      if (topButton) topButton.click();
    }

    activatePendingMode();
    setTimeout(activatePendingMode, 50);
    setTimeout(activatePendingMode, 150);
    setTimeout(activatePendingMode, 300);
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

    const modeButton = Array.from(document.querySelectorAll('.qmes-ipad-mode-tabs button'))
      .find((button) => buttonText(button).includes(mode));
    if (modeButton) {
      try { sessionStorage.removeItem(TARGET_KEY); } catch (error) {}
      modeButton.click();
    }
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

  function installInspectorStyle(){
    if (document.getElementById('qmes-inspector-header-input-style')) return;
    const style = document.createElement('style');
    style.id = 'qmes-inspector-header-input-style';
    style.textContent = `
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-ipad-inspector-label,
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-dept{display:inline-flex!important;align-items:center!important;height:38px!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:16px!important;line-height:1!important;font-weight:850!important;white-space:nowrap!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-name{width:132px!important;min-width:132px!important;max-width:132px!important;height:38px!important;min-height:38px!important;padding:0 10px!important;box-sizing:border-box!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:14px!important;line-height:1!important;font-weight:700!important;text-align:center!important;outline:none!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-name::placeholder{color:#94a3b8!important;-webkit-text-fill-color:#94a3b8!important;opacity:1!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-name:focus{border-color:#60a5fa!important;box-shadow:0 0 0 2px rgba(96,165,250,.14)!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector > strong:not(.qmes-field-inspector-dept){display:none!important;}
      .qmes-ipad-form-grid label.qmes-field-inspector-duplicate{display:none!important;}
      .qmes-equipment-tour-screen .qmes-equipment-tour-inspector{display:none!important;}

      /* 설비 점검 기록: 일시~관리까지 화면 안에 균형 있게 배치 */
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table-wrap{width:100%!important;max-width:100%!important;overflow-x:hidden!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th,
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td{box-sizing:border-box!important;padding:8px 5px!important;text-align:center!important;vertical-align:middle!important;letter-spacing:0!important;word-spacing:0!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th{font-size:13px!important;line-height:1.2!important;white-space:nowrap!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td{font-size:12px!important;line-height:1.3!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(1),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(1){width:14%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(2),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(2){width:11%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(3),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(3){width:15%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(4),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(4){width:10%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(5),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(5){width:8%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(6),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(6){width:11%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(7),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(7){width:17%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table th:nth-child(8),.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-table td:nth-child(8){width:14%!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-time-head,.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-time-cell,.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-head,.qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-cell{min-width:0!important;max-width:none!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-manage-cell>div{display:flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;flex-wrap:nowrap!important;white-space:nowrap!important;}
      .qmes-ipad-equipment .qmes-equipment-mode-history .qmes-equipment-history-row-action{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:30px!important;min-height:30px!important;padding:0 3px!important;box-sizing:border-box!important;font-size:11px!important;line-height:1!important;letter-spacing:0!important;white-space:nowrap!important;overflow:visible!important;}
    `;
    document.head.appendChild(style);
  }

  function setReactInputValue(input, value){
    if (!input) return;
    const next = String(value ?? '');
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(input, next); else input.value = next;
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
  }

  function getInspectionMode(){
    const active = document.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text = buttonText(active).toUpperCase();
    if (text.includes('IQC')) return 'IQC'; if (text.includes('PQC')) return 'PQC'; if (text.includes('OQC')) return 'OQC';
    const title = String(document.querySelector('.qmes-ipad-inspection-head h1')?.textContent || '').trim();
    if (title.includes('수입검사')) return 'IQC'; if (title.includes('공정검사')) return 'PQC'; if (title.includes('출하검사')) return 'OQC'; return '';
  }

  function inspectorDetailInputs(){
    return Array.from(document.querySelectorAll('.qmes-ipad-pop .qmes-ipad-form-grid label')).filter((label) => {
      const caption = String(label.querySelector('span')?.textContent || '').replace(/\s+/g, ' ').trim();
      return caption === '검사자' && label.querySelector('input');
    });
  }

  function ensureInspectionHeaderInspector(){
    const header = document.querySelector('.qmes-ipad-inspection-head'); const box = header?.querySelector('.qmes-ipad-field-inspector'); if (!header || !box) return;
    const mode = getInspectionMode(); if (!mode) return;
    const detailLabels = inspectorDetailInputs(); detailLabels.forEach((label) => label.classList.add('qmes-field-inspector-duplicate'));
    const sourceInput = detailLabels.map((label) => label.querySelector('input')).find(Boolean) || null;
    let dept = box.querySelector('.qmes-field-inspector-dept');
    if (!dept) { dept = document.createElement('strong'); dept.className = 'qmes-field-inspector-dept'; dept.textContent = '품질부'; const oldStrong = box.querySelector('strong'); if (oldStrong) box.insertBefore(dept, oldStrong); else box.appendChild(dept); } else dept.textContent = '품질부';
    let headerInput = box.querySelector('.qmes-field-inspector-name');
    if (!headerInput) { headerInput = document.createElement('input'); headerInput.type='text'; headerInput.className='qmes-field-inspector-name'; headerInput.placeholder='이름 입력'; headerInput.autocomplete='off'; headerInput.setAttribute('aria-label', `${mode} 검사자 이름`); box.appendChild(headerInput); headerInput.addEventListener('input',()=>{ const currentSource=inspectorDetailInputs().map((label)=>label.querySelector('input')).find(Boolean); if(currentSource)setReactInputValue(currentSource,headerInput.value); }); }
    const previousMode=header.dataset.qmesInspectorMode||''; if(previousMode!==mode){header.dataset.qmesInspectorMode=mode;headerInput.value='';}
    if(sourceInput&&sourceInput.value!==headerInput.value)setReactInputValue(sourceInput,headerInput.value);
    const oldStrong=Array.from(box.querySelectorAll(':scope > strong')).find((node)=>!node.classList.contains('qmes-field-inspector-dept')); if(oldStrong)oldStrong.style.display='none';
  }

  function syncHiddenTourInspector(){
    const tour=document.querySelector('.qmes-equipment-tour-screen .qmes-equipment-tour-inspector'); const hiddenInput=tour?.querySelector('input'); if(!tour||!hiddenInput)return; tour.style.display='none';
    const equipmentNameInput=document.querySelector('.qmes-ipad-equipment-inspector input'); const desired=String(equipmentNameInput?.value||'').trim(); if(desired&&hiddenInput.value!==desired)setReactInputValue(hiddenInput,desired);
  }

  function replaceButtons(){
    document.querySelectorAll('.qmes-iqc-page .qmes-iqc-new-btn:not([data-qmes-field-shortcut="true"])').forEach((button)=>makeShortcutButton(button,'IQC'));
    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut="true"])').forEach((button)=>makeShortcutButton(button,'PQC'));
    document.querySelectorAll('.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut="true"])').forEach((button)=>makeShortcutButton(button,'OQC'));
    installInspectorStyle(); ensureInspectionHeaderInspector(); syncHiddenTourInspector(); activatePendingMode();
  }

  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;replaceButtons();});}
  const observer=new MutationObserver(schedule);
  function start(){replaceButtons();observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('input',(event)=>{if(event.target?.matches?.('.qmes-ipad-equipment-inspector input'))schedule();},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  global.qmesOpenFieldInputShortcut=openTargetMode;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__=true;
})(window);
