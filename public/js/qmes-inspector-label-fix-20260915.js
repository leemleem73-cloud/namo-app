/* NAMO QMES - field inspection header inspector layout fix (2026-09-15)
 * Keeps one inspector label and aligns department/name controls cleanly.
 * Applies consistently to IQC/PQC/OQC field input headers.
 */
(function(){
  'use strict';
  if(window.__QMES_INSPECTOR_LABEL_FIX_20260915__) return;
  window.__QMES_INSPECTOR_LABEL_FIX_20260915__=true;

  const STYLE_ID='qmes-inspector-label-fix-style-20260915';
  if(document.getElementById(STYLE_ID)) return;

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .qmes-field-mode-unify .qmes-ipad-inspector::before,
    .qmes-field-redesign .qmes-ipad-inspector::before,
    .qmes-iqc-redesign .qmes-ipad-inspector::before{
      content:none!important;
      display:none!important;
    }

    .qmes-field-mode-unify .qmes-ipad-work-head,
    .qmes-field-redesign .qmes-ipad-work-head,
    .qmes-iqc-redesign .qmes-ipad-work-head{
      grid-template-columns:180px minmax(0,1fr) 320px!important;
      column-gap:18px!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector,
    .qmes-field-redesign .qmes-ipad-inspector,
    .qmes-iqc-redesign .qmes-ipad-inspector{
      justify-self:end!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      gap:8px!important;
      width:300px!important;
      min-width:300px!important;
      min-height:42px!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:#203b50!important;
      font-size:12px!important;
      font-weight:850!important;
      white-space:nowrap!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector>span:first-child,
    .qmes-field-mode-unify .qmes-ipad-inspector>label:first-child,
    .qmes-field-redesign .qmes-ipad-inspector>span:first-child,
    .qmes-field-redesign .qmes-ipad-inspector>label:first-child,
    .qmes-iqc-redesign .qmes-ipad-inspector>span:first-child,
    .qmes-iqc-redesign .qmes-ipad-inspector>label:first-child{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      flex:0 0 auto!important;
      margin:0 2px 0 0!important;
      padding:0!important;
      color:#203b50!important;
      -webkit-text-fill-color:#203b50!important;
      font-size:12px!important;
      font-weight:900!important;
      line-height:1!important;
      white-space:nowrap!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector strong,
    .qmes-field-redesign .qmes-ipad-inspector strong,
    .qmes-iqc-redesign .qmes-ipad-inspector strong{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      flex:0 0 82px!important;
      min-width:82px!important;
      width:82px!important;
      height:36px!important;
      margin:0!important;
      padding:0 10px!important;
      border:1px solid #d2dee7!important;
      border-radius:9px!important;
      background:#f6f9fb!important;
      color:#263f52!important;
      -webkit-text-fill-color:#263f52!important;
      font-size:12px!important;
      font-weight:850!important;
      box-sizing:border-box!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector input,
    .qmes-field-redesign .qmes-ipad-inspector input,
    .qmes-iqc-redesign .qmes-ipad-inspector input{
      flex:1 1 132px!important;
      width:132px!important;
      min-width:0!important;
      max-width:150px!important;
      height:36px!important;
      min-height:36px!important;
      margin:0!important;
      padding:0 12px!important;
      border:1px solid #cbd8e2!important;
      border-radius:9px!important;
      background:#fff!important;
      color:#263f52!important;
      -webkit-text-fill-color:#263f52!important;
      font-size:12px!important;
      font-weight:700!important;
      text-align:left!important;
      box-shadow:none!important;
      box-sizing:border-box!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector input::placeholder,
    .qmes-field-redesign .qmes-ipad-inspector input::placeholder,
    .qmes-iqc-redesign .qmes-ipad-inspector input::placeholder{
      color:#8ba0b2!important;
      opacity:1!important;
    }

    @media(max-width:900px){
      .qmes-field-mode-unify .qmes-ipad-work-head,
      .qmes-field-redesign .qmes-ipad-work-head,
      .qmes-iqc-redesign .qmes-ipad-work-head{
        grid-template-columns:150px minmax(0,1fr) 280px!important;
        column-gap:10px!important;
      }
      .qmes-field-mode-unify .qmes-ipad-inspector,
      .qmes-field-redesign .qmes-ipad-inspector,
      .qmes-iqc-redesign .qmes-ipad-inspector{
        width:270px!important;
        min-width:270px!important;
      }
    }

    @media(max-width:760px){
      .qmes-field-mode-unify .qmes-ipad-work-head,
      .qmes-field-redesign .qmes-ipad-work-head,
      .qmes-iqc-redesign .qmes-ipad-work-head{
        grid-template-columns:1fr!important;
      }
      .qmes-field-mode-unify .qmes-ipad-inspector,
      .qmes-field-redesign .qmes-ipad-inspector,
      .qmes-iqc-redesign .qmes-ipad-inspector{
        justify-self:stretch!important;
        justify-content:center!important;
        width:100%!important;
        min-width:0!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

/* IQC basic-information alignment: equal control heights, equal grid spacing and a clean material add button. */
(function(){
  'use strict';
  if(window.__QMES_IQC_BASIC_FORM_ALIGN_20260915__) return;
  window.__QMES_IQC_BASIC_FORM_ALIGN_20260915__=true;

  const STYLE_ID='qmes-iqc-basic-form-align-style-20260915';
  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
  let scheduled=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid{
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        column-gap:14px!important;
        row-gap:12px!important;
        align-items:end!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid>.wide{
        grid-column:1/-1!important;
        gap:14px!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid label{
        position:relative!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:flex-end!important;
        gap:5px!important;
        min-width:0!important;
        margin:0!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid label>span{
        display:block!important;
        min-height:16px!important;
        margin:0!important;
        color:#294459!important;
        font-size:11px!important;
        line-height:16px!important;
        font-weight:850!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid label :is(input,select){
        box-sizing:border-box!important;
        width:100%!important;
        height:44px!important;
        min-height:44px!important;
        max-height:44px!important;
        margin:0!important;
        padding:0 13px!important;
        border:1px solid #c7d5df!important;
        border-radius:9px!important;
        background:#fff!important;
        color:#294459!important;
        -webkit-text-fill-color:#294459!important;
        font-size:12px!important;
        line-height:1!important;
        font-weight:650!important;
        box-shadow:none!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid label input[readonly]{
        background:#f5f8fa!important;
        color:#6f8292!important;
        -webkit-text-fill-color:#6f8292!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid label input::placeholder{
        color:#91a4b4!important;
        -webkit-text-fill-color:#91a4b4!important;
        opacity:1!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid label.wide{
        grid-column:1/-1!important;
      }

      /* Material name: reserve a dedicated same-height button column instead of overlapping the input. */
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-material-field{
        padding-right:98px!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-material-field>input{
        width:100%!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-material-add{
        position:absolute!important;
        right:0!important;
        bottom:0!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:88px!important;
        min-width:88px!important;
        height:44px!important;
        min-height:44px!important;
        margin:0!important;
        padding:0 10px!important;
        border:1px solid #aebfcd!important;
        border-radius:9px!important;
        background:#f7fafc!important;
        color:#244c68!important;
        -webkit-text-fill-color:#244c68!important;
        font-size:12px!important;
        line-height:1!important;
        font-weight:850!important;
        box-shadow:none!important;
        white-space:nowrap!important;
        z-index:2!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-material-add:hover{
        background:#edf5f9!important;
        border-color:#7fa7bf!important;
        color:#174a6b!important;
        -webkit-text-fill-color:#174a6b!important;
      }

      /* Runtime quantity stepper wrappers are forced to the same 44px control height. */
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-stepper-wrap{
        position:relative!important;
        display:block!important;
        width:100%!important;
        height:44px!important;
        min-height:44px!important;
        max-height:44px!important;
        margin:0!important;
        padding:0!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-stepper-wrap>input{
        width:100%!important;
        height:44px!important;
        min-height:44px!important;
        max-height:44px!important;
        padding-right:42px!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-stepper-wrap>button{
        position:absolute!important;
        right:0!important;
        width:38px!important;
        min-width:38px!important;
        height:22px!important;
        min-height:22px!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-left:1px solid #c7d5df!important;
        border-radius:0!important;
        background:#f8fafb!important;
        color:#425e72!important;
        -webkit-text-fill-color:#425e72!important;
        font-size:10px!important;
        line-height:1!important;
        box-shadow:none!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-stepper-wrap>button:first-of-type{
        top:0!important;
        border-bottom:1px solid #c7d5df!important;
        border-top-right-radius:9px!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-stepper-wrap>button:last-of-type{
        bottom:0!important;
        border-bottom-right-radius:9px!important;
      }

      @media(max-width:900px){
        html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
      }
      @media(max-width:640px){
        html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid{
          grid-template-columns:1fr!important;
        }
        html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-iqc-basic-grid>.wide{
          grid-template-columns:1fr!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function apply(){
    scheduled=false;
    ensureStyle();
    const root=document.querySelector('.qmes-ipad-pop.qmes-field-mode-unify[data-qmes-mode="IQC"]');
    if(!root) return;
    const grid=root.querySelector('.qmes-ipad-section .qmes-ipad-form-grid');
    if(!grid) return;
    grid.classList.add('qmes-iqc-basic-grid');

    const labels=Array.from(grid.querySelectorAll('label'));
    labels.forEach(label=>{
      const title=clean(label.querySelector(':scope > span')?.textContent).replace(/\*/g,'').trim();
      label.dataset.qmesField=title;
      const input=label.querySelector('input');
      if(input&&input.parentElement&&input.parentElement!==label&&label.contains(input.parentElement)){
        const wrapper=input.parentElement;
        const buttons=Array.from(wrapper.children).filter(node=>node instanceof HTMLButtonElement);
        if(buttons.length===2) wrapper.classList.add('qmes-iqc-stepper-wrap');
      }
    });

    const materialLabel=labels.find(label=>clean(label.dataset.qmesField)==='원자재명');
    if(materialLabel){
      materialLabel.classList.add('qmes-iqc-material-field');
      const addButton=Array.from(materialLabel.querySelectorAll('button')).find(button=>/추가/.test(clean(button.textContent)))
        || Array.from(grid.querySelectorAll('button')).find(button=>/추가/.test(clean(button.textContent)));
      if(addButton){
        addButton.classList.add('qmes-iqc-material-add');
        if(!materialLabel.contains(addButton)){
          try{materialLabel.appendChild(addButton);}catch(_error){}
        }
      }
    }
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{apply();setTimeout(apply,30);});
  }

  const start=()=>{
    if(!document.body) return;
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('.qmes-ipad-pop'))setTimeout(schedule,0);},true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    schedule();
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
