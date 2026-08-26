/* QMES field input quantity steppers — single 54px UI for IQC/OQC.
 * Legacy steppers from ipad-iqc-material-add are removed instead of hidden,
 * so each quantity field has only one rendered control.
 */
(function () {
  const STYLE_ID = 'qmes-ipad-quantity-stepper-unified-style';
  const CLASS = 'qmes-ipad-unified-stepper';
  const LEGACY_NUMBER = 'qmes-ipad-number-stepper';
  const LEGACY_SHIP = 'qmes-ipad-ship-stepper';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .qmes-ipad-form-grid label.qmes-ipad-unified-step-field{position:relative!important;}
      .qmes-ipad-form-grid label.qmes-ipad-unified-step-field>input{
        position:absolute!important;width:1px!important;height:1px!important;min-height:1px!important;
        opacity:0!important;pointer-events:none!important;padding:0!important;border:0!important;
      }
      .${CLASS}{
        width:100%!important;height:54px!important;min-height:54px!important;box-sizing:border-box!important;
        display:grid!important;grid-template-columns:minmax(0,1fr) 42px!important;overflow:hidden!important;
        border:1px solid #b8c4d0!important;border-radius:10px!important;background:#fff!important;
        box-shadow:none!important;color:#111827!important;
      }
      .${CLASS}>strong{
        display:flex!important;align-items:center!important;min-width:0!important;padding:0 14px!important;
        color:#111827!important;font-size:16px!important;font-weight:700!important;line-height:1!important;
        font-variant-numeric:tabular-nums!important;
      }
      .${CLASS}>span{display:grid!important;grid-template-rows:1fr 1fr!important;border-left:1px solid #cbd5e1!important;}
      .${CLASS} button{
        min-width:0!important;width:100%!important;height:27px!important;min-height:0!important;
        padding:0!important;margin:0!important;border:0!important;border-radius:0!important;
        background:#f8fafc!important;color:#475569!important;font-size:10px!important;font-weight:800!important;
        line-height:26px!important;cursor:pointer!important;box-shadow:none!important;
      }
      .${CLASS} button:first-child{border-bottom:1px solid #cbd5e1!important;}
      .${CLASS} button:hover,.${CLASS} button:focus-visible{background:#e2e8f0!important;color:#0f172a!important;outline:none!important;}
      .${CLASS}:focus-within{border-color:#2bc3ec!important;box-shadow:0 0 0 3px rgba(43,195,236,.12)!important;}
    `;
    document.head.appendChild(style);
  }

  function setReactInputValue(input,value){
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    if(descriptor?.set) descriptor.set.call(input,value); else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function unitFor(title){
    if(/입고중량|출하량|출하수량/.test(title)) return ' kg';
    if(/검사수량|불량수량/.test(title)) return ' EA';
    return '';
  }
  function minFor(title){return /검사수량/.test(title)?1:0;}
  function numericOnly(value){
    const match=String(value??'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
    return match?match[0]:'0';
  }
  function step(input,delta,title){
    const current=Number(numericOnly(input.value));
    const min=minFor(title);
    const next=Math.max(min,(Number.isFinite(current)?current:min)+delta);
    setReactInputValue(input,String(next));
  }

  function removeLegacyStepper(label){
    label.querySelectorAll(`:scope>.${LEGACY_NUMBER},:scope>.${LEGACY_SHIP}`).forEach(node=>node.remove());
    label.classList.remove('qmes-ipad-number-field','qmes-ipad-ship-step-field');
  }

  function enhanceLabel(label){
    const title=String(label.querySelector(':scope > span')?.textContent||'').replace(/\s+/g,' ').trim();
    if(!/입고중량|검사수량|불량수량|출하량|출하수량/.test(title)) return;
    const input=label.querySelector(':scope > input');
    if(!input||input.type==='date') return;

    removeLegacyStepper(label);
    label.classList.add('qmes-ipad-unified-step-field');
    let box=label.querySelector(`:scope>.${CLASS}`);
    if(!box){
      box=document.createElement('div');
      box.className=CLASS;
      const value=document.createElement('strong');
      const buttons=document.createElement('span');
      const up=document.createElement('button');
      const down=document.createElement('button');
      up.type=down.type='button';
      up.textContent='▲'; down.textContent='▼';
      up.setAttribute('aria-label',`${title} 증가`);
      down.setAttribute('aria-label',`${title} 감소`);
      const sync=()=>{
        const raw=/출하량|출하수량/.test(title)?numericOnly(input.value):String(input.value||minFor(title));
        value.textContent=`${raw}${unitFor(title)}`;
      };
      up.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();step(input,1,title);sync();});
      down.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();step(input,-1,title);sync();});
      buttons.append(up,down);
      box.append(value,buttons);
      label.appendChild(box);
      input.addEventListener('input',sync);
      input.addEventListener('change',sync);
      box.__qmesSyncValue=sync;
      sync();
    }else if(typeof box.__qmesSyncValue==='function') box.__qmesSyncValue();
  }

  function enhance(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-form-grid label').forEach(enhanceLabel);
  }

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;enhance();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance,{once:true}); else enhance();
})();