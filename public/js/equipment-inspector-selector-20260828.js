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
      .qmes-equipment-inspector-choice{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important;}
      .qmes-equipment-inspector-choice button{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:70px!important;height:34px!important;padding:0 12px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;font-weight:800!important;line-height:1!important;cursor:pointer!important;box-shadow:none!important;}
      .qmes-equipment-inspector-choice button.is-selected{border-color:#38bdf8!important;background:#f0f9ff!important;color:#0369a1!important;box-shadow:0 0 0 2px rgba(56,189,248,.12)!important;}
    `;
  }
  function setNativeValue(el,value){
    if(!el)return;
    const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    const descriptor=Object.getOwnPropertyDescriptor(proto,'value');
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
    localStorage.setItem(STORAGE_KEY,name);
    document.dispatchEvent(new CustomEvent('qmes:equipment-inspector-change',{detail:{name}}));
    syncOwnerFields();
    apply();
  }
  function makeChoice(){
    const wrap=document.createElement('div');wrap.className='qmes-equipment-inspector-choice';
    NAMES.forEach(name=>{const button=document.createElement('button');button.type='button';button.textContent=name;button.classList.toggle('is-selected',selected===name);button.addEventListener('click',()=>choose(name));wrap.appendChild(button);});
    return wrap;
  }
  function replaceNameInput(){
    document.querySelectorAll('.qmes-ipad-equipment input').forEach(input=>{
      const placeholder=String(input.getAttribute('placeholder')||'').replace(/\s+/g,'').trim();
      if(placeholder!=='이름입력')return;
      if(input.parentElement&&input.parentElement.querySelector('.qmes-equipment-inspector-choice')){input.style.display='none';return;}
      input.style.display='none';input.setAttribute('aria-hidden','true');input.parentElement&&input.parentElement.appendChild(makeChoice());
    });
  }
  let queued=false;
  function apply(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureStyle();replaceNameInput();syncOwnerFields();document.querySelectorAll('.qmes-equipment-inspector-choice button').forEach(button=>button.classList.toggle('is-selected',button.textContent===selected));});}
  apply();new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',apply,{once:true});
})();