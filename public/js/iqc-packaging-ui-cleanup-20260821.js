/* IQC packaging UI cleanup: keep packaging type/count, hide redundant weight/barcode quantity fields. */
(function(global){
  'use strict';
  if(global.__QMES_IQC_PACKAGING_UI_CLEANUP_20260821__) return;
  global.__QMES_IQC_PACKAGING_UI_CLEANUP_20260821__=true;

  const HIDDEN_LABELS=new Set(['용기당 중량','계산중량','바코드 발행수량']);
  let scheduled=false;

  function text(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim();}
  function setReactInputValue(input,value){
    if(!input) return;
    const next=String(value??'');
    if(String(input.value||'')===next) return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    if(descriptor?.set) descriptor.set.call(input,next); else input.value=next;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function fieldByLabel(section,label){
    return Array.from(section.querySelectorAll('.qmes-iqc-field')).find(field=>text(field.querySelector('span'))===label)||null;
  }
  function numericValue(input){
    const raw=String(input?.value||'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
    return raw?Number(raw[0]):0;
  }
  function formatNumber(value){
    if(!Number.isFinite(value)||value<=0) return '';
    return String(Number(value.toFixed(6)));
  }
  function syncHiddenUnitWeight(section){
    const modal=section.closest('.qmes-iqc-modal');
    if(!modal) return;
    const quantitySection=Array.from(modal.querySelectorAll('.qmes-iqc-modal-section')).find(sec=>text(sec.querySelector('h4'))==='수량');
    const qtyField=quantitySection?fieldByLabel(quantitySection,'입고수량'):null;
    const packageField=fieldByLabel(section,'입고 포장수량');
    const unitField=fieldByLabel(section,'용기당 중량');
    const qty=numericValue(qtyField?.querySelector('input'));
    const packages=Math.trunc(numericValue(packageField?.querySelector('input')));
    if(qty>0&&packages>0&&unitField){
      setReactInputValue(unitField.querySelector('input'),formatNumber(qty/packages));
    }
  }
  function cleanup(){
    document.querySelectorAll('.qmes-iqc-modal-section').forEach(section=>{
      if(text(section.querySelector('h4'))!=='포장·바코드 정보') return;
      syncHiddenUnitWeight(section);
      Array.from(section.querySelectorAll('.qmes-iqc-field')).forEach(field=>{
        if(HIDDEN_LABELS.has(text(field.querySelector('span')))) field.style.setProperty('display','none','important');
      });
      Array.from(section.children).forEach(child=>{
        if(child.classList?.contains('qmes-iqc-modal-grid')) return;
        if(text(child).includes('중량 확인 필요')) child.style.setProperty('display','none','important');
      });
    });
  }
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;cleanup();});
  }
  const observer=new MutationObserver(schedule);
  function start(){
    cleanup();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('input',event=>{
      const field=event.target?.closest?.('.qmes-iqc-field');
      const label=text(field?.querySelector('span'));
      if(label==='입고수량'||label==='입고 포장수량') schedule();
    },true);
    document.addEventListener('change',event=>{
      const field=event.target?.closest?.('.qmes-iqc-field');
      const label=text(field?.querySelector('span'));
      if(label==='입고수량'||label==='입고 포장수량') schedule();
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})(window);
