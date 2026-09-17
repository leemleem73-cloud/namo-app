/* NAMO QMES - compact global date picker
 * 2026-09-17
 * Chrome's native <input type="date"> popup cannot be resized with page CSS.
 * Keep the same date value/change behavior, but use one compact QMES calendar UI.
 * Applies dynamically to every enabled input[type="date"] across QMES.
 */
(function(){
  'use strict';
  if(window.__QMES_COMPACT_GLOBAL_DATE_PICKER_20260917_V3__) return;
  window.__QMES_COMPACT_GLOBAL_DATE_PICKER_20260917_V3__=true;

  const STYLE_ID='qmes-compact-global-date-picker-20260917-style';
  const POP_ID='qmes-compact-global-date-picker';
  const TARGET_WIDTH=248;
  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;
  let popup=null;

  const pad=n=>String(n).padStart(2,'0');
  const iso=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
  const parse=value=>{
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m) return null;
    return {y:Number(m[1]),m:Number(m[2])-1,d:Number(m[3])};
  };

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${POP_ID}{
        position:fixed!important;
        width:${TARGET_WIDTH}px!important;
        min-width:${TARGET_WIDTH}px!important;
        max-width:calc(100vw - 12px)!important;
        background:#fff!important;
        border:1px solid #dbe4ef!important;
        border-radius:12px!important;
        box-shadow:0 12px 34px rgba(15,23,42,.18)!important;
        padding:9px 10px 8px!important;
        z-index:2147483640!important;
        color:#26354a!important;
        font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
        box-sizing:border-box!important;
        user-select:none!important;
      }
      #${POP_ID} *{box-sizing:border-box!important;}
      #${POP_ID} .qdp-head{
        height:32px!important;
        display:grid!important;
        grid-template-columns:30px 1fr 30px!important;
        align-items:center!important;
        gap:6px!important;
        margin-bottom:5px!important;
      }
      #${POP_ID} .qdp-title{
        text-align:center!important;
        font-size:13px!important;
        line-height:1!important;
        font-weight:800!important;
        color:#1f2d42!important;
        white-space:nowrap!important;
      }
      #${POP_ID} .qdp-nav{
        width:30px!important;
        height:30px!important;
        min-width:30px!important;
        border:1px solid #d8e2ed!important;
        border-radius:8px!important;
        background:#fff!important;
        color:#314158!important;
        font-size:16px!important;
        font-weight:800!important;
        line-height:28px!important;
        padding:0!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qdp-week,
      #${POP_ID} .qdp-grid{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        gap:2px!important;
      }
      #${POP_ID} .qdp-week{
        margin:1px 0 3px!important;
      }
      #${POP_ID} .qdp-week span{
        height:21px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:10px!important;
        font-weight:700!important;
        color:#8090a4!important;
      }
      #${POP_ID} .qdp-week span:first-child{color:#e53935!important;}
      #${POP_ID} .qdp-week span:last-child{color:#2468df!important;}
      #${POP_ID} .qdp-cell{
        width:100%!important;
        height:27px!important;
        min-width:0!important;
        border:0!important;
        border-radius:7px!important;
        padding:0!important;
        background:transparent!important;
        color:#304057!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:10.5px!important;
        font-weight:700!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qdp-cell:hover{background:#edf5ff!important;color:#1269c7!important;}
      #${POP_ID} .qdp-cell.is-selected{background:#2468df!important;color:#fff!important;}
      #${POP_ID} .qdp-cell.is-today:not(.is-selected){outline:1px solid #9ec5f3!important;color:#1269c7!important;}
      #${POP_ID} .qdp-cell:disabled{opacity:.28!important;cursor:not-allowed!important;background:transparent!important;}
      #${POP_ID} .qdp-empty{height:27px!important;}
      #${POP_ID} .qdp-foot{
        border-top:1px solid #e6edf5!important;
        margin-top:6px!important;
        padding-top:7px!important;
        display:flex!important;
        align-items:center!important;
        gap:5px!important;
      }
      #${POP_ID} .qdp-foot button{
        height:28px!important;
        min-width:0!important;
        border:1px solid #d8e2ed!important;
        border-radius:7px!important;
        background:#fff!important;
        color:#40516a!important;
        padding:0 9px!important;
        font-size:10.5px!important;
        font-weight:700!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qdp-foot .qdp-today{
        margin-left:auto!important;
        border-color:#2468df!important;
        background:#2468df!important;
        color:#fff!important;
      }
      @media(max-width:480px){
        #${POP_ID}{width:236px!important;min-width:236px!important;padding:8px 9px 7px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePopup(){
    if(popup&&popup.isConnected) return popup;
    popup=document.createElement('div');
    popup.id=POP_ID;
    popup.setAttribute('role','dialog');
    popup.setAttribute('aria-label','날짜 선택');
    popup.addEventListener('pointerdown',e=>e.stopPropagation());
    popup.addEventListener('click',e=>e.stopPropagation());
    document.body.appendChild(popup);
    return popup;
  }

  function inputSetter(input,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter) setter.call(input,value); else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function allowed(input,value){
    if(input.min&&value<input.min) return false;
    if(input.max&&value>input.max) return false;
    return true;
  }

  function sameDay(value,date){
    return value===iso(date.getFullYear(),date.getMonth(),date.getDate());
  }

  function render(){
    if(!activeInput||!activeInput.isConnected) return closePicker();
    const pop=ensurePopup();
    const current=activeInput.value;
    const today=new Date();
    const firstDay=new Date(viewYear,viewMonth,1).getDay();
    const days=new Date(viewYear,viewMonth+1,0).getDate();
    const cells=[];
    for(let i=0;i<firstDay;i++) cells.push('<span class="qdp-empty"></span>');
    for(let d=1;d<=days;d++){
      const value=iso(viewYear,viewMonth,d);
      const selected=value===current;
      const isToday=sameDay(value,today);
      const disabled=!allowed(activeInput,value);
      cells.push(`<button type="button" class="qdp-cell${selected?' is-selected':''}${isToday?' is-today':''}" data-day="${d}"${disabled?' disabled':''}>${d}</button>`);
    }
    pop.innerHTML=`
      <div class="qdp-head">
        <button type="button" class="qdp-nav" data-prev aria-label="이전 달">‹</button>
        <div class="qdp-title">${viewYear}년 ${viewMonth+1}월</div>
        <button type="button" class="qdp-nav" data-next aria-label="다음 달">›</button>
      </div>
      <div class="qdp-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
      <div class="qdp-grid">${cells.join('')}</div>
      <div class="qdp-foot">
        <button type="button" data-clear>지우기</button>
        <button type="button" data-close>닫기</button>
        <button type="button" class="qdp-today" data-today>오늘</button>
      </div>`;

    pop.querySelector('[data-prev]').onclick=()=>{viewMonth-=1;if(viewMonth<0){viewMonth=11;viewYear-=1;}render();};
    pop.querySelector('[data-next]').onclick=()=>{viewMonth+=1;if(viewMonth>11){viewMonth=0;viewYear+=1;}render();};
    pop.querySelector('[data-clear]').onclick=()=>{inputSetter(activeInput,'');closePicker();};
    pop.querySelector('[data-close]').onclick=()=>closePicker();
    pop.querySelector('[data-today]').onclick=()=>{
      const value=iso(today.getFullYear(),today.getMonth(),today.getDate());
      if(allowed(activeInput,value)){inputSetter(activeInput,value);closePicker();}
    };
    pop.querySelectorAll('[data-day]').forEach(btn=>{
      btn.onclick=()=>{
        const value=iso(viewYear,viewMonth,Number(btn.dataset.day));
        if(allowed(activeInput,value)){inputSetter(activeInput,value);closePicker();}
      };
    });
    position();
  }

  function position(){
    if(!activeInput||!popup) return;
    const r=activeInput.getBoundingClientRect();
    const pr=popup.getBoundingClientRect();
    const margin=6;
    let left=Math.max(margin,Math.min(r.left,window.innerWidth-pr.width-margin));
    let top=r.bottom+5;
    if(top+pr.height>window.innerHeight-margin) top=Math.max(margin,r.top-pr.height-5);
    popup.style.left=Math.round(left)+'px';
    popup.style.top=Math.round(top)+'px';
  }

  function openPicker(input){
    if(!input||input.disabled||input.readOnly) return;
    activeInput=input;
    const parsed=parse(input.value);
    const base=parsed?new Date(parsed.y,parsed.m,parsed.d):new Date();
    viewYear=base.getFullYear();
    viewMonth=base.getMonth();
    input.focus({preventScroll:true});
    render();
  }

  function closePicker(){
    if(popup&&popup.isConnected) popup.remove();
    popup=null;
    activeInput=null;
  }

  function dateInputFromEvent(event){
    const target=event.target instanceof Element?event.target:null;
    return target&&target.closest('input[type="date"]');
  }

  function start(){
    addStyle();

    document.addEventListener('pointerdown',event=>{
      const input=dateInputFromEvent(event);
      if(!input||input.disabled||input.readOnly) return;
      event.preventDefault();
      openPicker(input);
    },true);

    document.addEventListener('click',event=>{
      const input=dateInputFromEvent(event);
      if(input){
        event.preventDefault();
        openPicker(input);
        return;
      }
      if(popup&&!popup.contains(event.target)) closePicker();
    },true);

    document.addEventListener('keydown',event=>{
      const input=event.target instanceof Element&&event.target.matches('input[type="date"]')?event.target:null;
      if(input&&(event.key==='Enter'||event.key===' '||event.key==='ArrowDown')){
        event.preventDefault();openPicker(input);return;
      }
      if(event.key==='Escape'&&popup){event.preventDefault();closePicker();}
    },true);

    window.addEventListener('resize',()=>{if(popup)position();});
    document.addEventListener('scroll',()=>{if(popup)position();},true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
