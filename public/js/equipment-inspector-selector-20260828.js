(function qmesEquipmentInspectorSelector(){
  'use strict';
  const NAMES=['박도훈','문지훈'];
  const STORAGE_KEY='qmes-equipment-inspector';
  const STYLE_ID='qmes-equipment-inspector-selector-style';
  let selected=String(localStorage.getItem(STORAGE_KEY)||'').trim();

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment-inspector-row{display:flex!important;align-items:center!important;gap:8px!important;}
      .qmes-equipment-inspector-select{height:36px!important;min-width:132px!important;padding:0 34px 0 12px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:13px!important;font-weight:700!important;line-height:36px!important;box-sizing:border-box!important;cursor:pointer!important;}
      .qmes-ipad-equipment-inspector-row>input[placeholder='이름 입력']{display:none!important;}
    `;
  }
  function setNativeValue(el,value){
    if(!el)return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    if(descriptor&&descriptor.set)descriptor.set.call(el,value);else el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function syncOwnerFields(){
    document.querySelectorAll('.qmes-equipment-schedule-form>label,.qmes-equipment-repair-form>label').forEach(label=>{
      const text=String(label.childNodes[0]&&label.childNodes[0].textContent||'').trim();
      if(text!=='담당')return;
      const field=label.querySelector('input');
      if(field&&field.value!==selected)setNativeValue(field,selected);
    });
  }
  function choose(name){
    selected=name;
    if(name)localStorage.setItem(STORAGE_KEY,name);else localStorage.removeItem(STORAGE_KEY);
    document.dispatchEvent(new CustomEvent('qmes:equipment-inspector-change',{detail:{name}}));
    syncOwnerFields();
  }
  function replaceNameInput(){
    document.querySelectorAll('.qmes-ipad-equipment-inspector-row').forEach(row=>{
      const input=row.querySelector('input[placeholder="이름 입력"]');
      if(!input)return;
      let select=row.querySelector('.qmes-equipment-inspector-select');
      if(!select){
        select=document.createElement('select');
        select.className='qmes-equipment-inspector-select';
        select.setAttribute('aria-label','설비 점검자 이름 선택');
        select.innerHTML='<option value="">이름 선택</option>'+NAMES.map(name=>'<option value="'+name+'">'+name+'</option>').join('');
        select.addEventListener('change',()=>choose(select.value));
        input.insertAdjacentElement('afterend',select);
      }
      if(select.value!==selected)select.value=selected;
      if(input.value!==selected)setNativeValue(input,selected);
    });
  }
  let queued=false;
  function apply(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;ensureStyle();replaceNameInput();syncOwnerFields();});
  }
  apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',apply,{once:true});
})();