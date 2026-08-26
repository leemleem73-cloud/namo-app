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
      /* 수입·공정·출하 검사자 = 설비점검 점검자와 동일한 크기/간격 */
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector{
        display:grid!important;
        grid-template-columns:max-content max-content 100px!important;
        grid-template-rows:48px!important;
        align-items:center!important;
        align-content:center!important;
        justify-content:center!important;
        column-gap:6px!important;
        row-gap:0!important;
        flex:0 0 250px!important;
        width:250px!important;
        min-width:250px!important;
        max-width:250px!important;
        height:48px!important;
        min-height:48px!important;
        max-height:48px!important;
        padding:0 12px!important;
        box-sizing:border-box!important;
        text-align:center!important;
        white-space:nowrap!important;
        overflow:visible!important;
      }
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-ipad-inspector-label,
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-dept{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:auto!important;
        height:32px!important;
        margin:0!important;
        color:#111827!important;
        -webkit-text-fill-color:#111827!important;
        font-size:16px!important;
        line-height:32px!important;
        font-weight:850!important;
        letter-spacing:0!important;
        word-spacing:0!important;
        text-align:center!important;
        white-space:nowrap!important;
        align-self:center!important;
      }
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-ipad-inspector-label{grid-column:1!important;grid-row:1!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-dept{grid-column:2!important;grid-row:1!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-name{
        grid-column:3!important;
        grid-row:1!important;
        width:100px!important;
        min-width:100px!important;
        max-width:100px!important;
        height:32px!important;
        min-height:32px!important;
        max-height:32px!important;
        padding:0 9px!important;
        margin:0!important;
        align-self:center!important;
        box-sizing:border-box!important;
        border:1px solid #cbd5e1!important;
        border-radius:7px!important;
        background:#fff!important;
        color:#111827!important;
        -webkit-text-fill-color:#111827!important;
        font-family:Pretendard,"Pretendard Variable","Noto Sans KR",system-ui,sans-serif!important;
        font-size:16px!important;
        line-height:30px!important;
        font-weight:700!important;
        text-align:center!important;
        outline:none!important;
        position:static!important;
        transform:none!important;
      }
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-name::placeholder{
        color:#94a3b8!important;
        -webkit-text-fill-color:#94a3b8!important;
        font-size:16px!important;
        font-weight:600!important;
        opacity:1!important;
      }
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector .qmes-field-inspector-name:focus{border-color:#38bdf8!important;box-shadow:0 0 0 3px rgba(56,189,248,.16)!important;}
      .qmes-ipad-inspection-head .qmes-ipad-field-inspector > strong:not(.qmes-field-inspector-dept){display:none!important;}
      html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-field-inspector-duplicate{display:none!important;width:0!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}
      html body .qmes-ipad-pop .qmes-ipad-form-grid label.wide{grid-column:1/-1!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;}
      html body .qmes-ipad-pop .qmes-ipad-form-grid label.wide>input{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;}
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
    const mode = getInspectionMode(); if (!mode) return;
    const header = document.querySelector('.qmes-ipad-inspection-head') || document.querySelector('.qmes-ipad-pop .qmes-ipad-work-head:not(.qmes-ipad-equipment-head)');
    const box = header?.querySelector('.qmes-ipad-field-inspector') || header?.querySelector('.qmes-ipad-inspector');
    if (!header || !box) return;
    header.classList.add('qmes-ipad-inspection-head');
    box.classList.add('qmes-ipad-field-inspector');

    /* React 원본의 직접 텍스트 '검사자'가 남으면 새 라벨과 중복되므로 제거 */
    Array.from(box.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && String(node.textContent || '').trim()) node.remove();
    });
    const labels = Array.from(box.querySelectorAll(':scope > .qmes-ipad-inspector-label'));
    labels.slice(1).forEach((node) => node.remove());
    let label = labels[0] || null;
    if (!label) {
      label = document.createElement('span');
      label.className = 'qmes-ipad-inspector-label';
      box.insertBefore(label, box.firstChild);
    }
    label.textContent = '검사자 :';

    const detailLabels = inspectorDetailInputs();
    detailLabels.forEach((detailLabel) => {
      detailLabel.classList.add('qmes-field-inspector-duplicate');
      detailLabel.style.setProperty('display','none','important');
      detailLabel.setAttribute('aria-hidden','true');
    });
    const sourceInput = detailLabels.map((detailLabel) => detailLabel.querySelector('input')).find(Boolean) || null;

    let dept = box.querySelector('.qmes-field-inspector-dept');
    if (!dept) {
      dept = document.createElement('strong');
      dept.className = 'qmes-field-inspector-dept';
      const oldStrong = box.querySelector('strong');
      if (oldStrong) box.insertBefore(dept, oldStrong); else box.appendChild(dept);
    }
    dept.textContent = '품질부';

    let headerInput = box.querySelector('.qmes-field-inspector-name');
    if (!headerInput) {
      headerInput = document.createElement('input');
      headerInput.type='text';
      headerInput.className='qmes-field-inspector-name';
      headerInput.placeholder='이름 입력';
      headerInput.autocomplete='off';
      headerInput.setAttribute('aria-label', `${mode} 검사자 이름`);
      box.appendChild(headerInput);
      headerInput.addEventListener('input',()=>{
        const currentSource=inspectorDetailInputs().map((detailLabel)=>detailLabel.querySelector('input')).find(Boolean);
        if(currentSource)setReactInputValue(currentSource,headerInput.value);
      });
    }
    const previousMode=header.dataset.qmesInspectorMode||'';
    if(previousMode!==mode){header.dataset.qmesInspectorMode=mode;headerInput.value='';}
    if(sourceInput&&sourceInput.value!==headerInput.value)setReactInputValue(sourceInput,headerInput.value);

    Array.from(box.querySelectorAll(':scope > strong')).forEach((node)=>{
      if(!node.classList.contains('qmes-field-inspector-dept')) node.style.setProperty('display','none','important');
    });

    /* 비고는 검사자 숨김 여부와 무관하게 항상 전체 폭 유지 */
    document.querySelectorAll('.qmes-ipad-pop .qmes-ipad-form-grid label').forEach((formLabel)=>{
      const caption=String(formLabel.querySelector('span')?.textContent||'').replace(/\s+/g,' ').trim();
      if(caption==='비고'){
        formLabel.classList.add('wide');
        formLabel.style.setProperty('grid-column','1 / -1','important');
        formLabel.style.setProperty('width','100%','important');
        const input=formLabel.querySelector('input');
        if(input) input.style.setProperty('width','100%','important');
      }
    });
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