/* QMES Global Fixed Calendar - 2026-09-21
 * ADD-ONLY common date-picker owner.
 * Applies one fixed enterprise calendar UI to every QMES date input.
 * Blocks mixed browser/native/legacy calendar popups without changing saved date values.
 */
(function(){
  "use strict";
  if(window.__QMES_GLOBAL_FIXED_CALENDAR_20260921__) return;
  window.__QMES_GLOBAL_FIXED_CALENDAR_20260921__=true;

  const ROOT_ID="qmes-global-fixed-calendar-20260921";
  const STYLE_ID="qmes-global-fixed-calendar-20260921-style";
  const MARK="qmesGlobalFixedDate";
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const clean=v=>String(v==null?"":v).trim();
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));

  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Hide the older mixed calendar owner if it is injected later. */
      [id^="qmes-date-picker-stable-pop"]{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }

      input[data-${MARK}="1"]{
        color-scheme:light!important;
        appearance:none!important;
        -webkit-appearance:none!important;
        cursor:pointer!important;
        background-color:#fff!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%235a7083' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='2'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E")!important;
        background-repeat:no-repeat!important;
        background-position:calc(100% - 10px) 50%!important;
        background-size:17px 17px!important;
        padding-right:36px!important;
        font-variant-numeric:tabular-nums!important;
        text-overflow:clip!important;
      }

      #${ROOT_ID}{
        position:fixed!important;
        z-index:2147483647!important;
        width:332px!important;
        padding:12px!important;
        border:1px solid #cbd9e5!important;
        border-radius:12px!important;
        background:#fff!important;
        box-shadow:0 18px 48px rgba(15,39,62,.24)!important;
        color:#23384d!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        box-sizing:border-box!important;
        user-select:none!important;
        isolation:isolate!important;
      }
      #${ROOT_ID},#${ROOT_ID} *{box-sizing:border-box!important}
      #${ROOT_ID} .qgfc-head{
        height:38px!important;
        display:grid!important;
        grid-template-columns:36px 1fr 36px!important;
        align-items:center!important;
        gap:7px!important;
        margin-bottom:7px!important;
      }
      #${ROOT_ID} .qgfc-nav{
        width:36px!important;
        height:34px!important;
        display:grid!important;
        place-items:center!important;
        padding:0!important;
        border:1px solid #d8e2eb!important;
        border-radius:7px!important;
        background:#f8fafc!important;
        color:#334e65!important;
        font-size:21px!important;
        line-height:1!important;
        font-weight:800!important;
        cursor:pointer!important;
      }
      #${ROOT_ID} .qgfc-nav:hover{background:#edf5fb!important;border-color:#aac6da!important}
      #${ROOT_ID} .qgfc-title{
        text-align:center!important;
        color:#1f3449!important;
        font-size:14px!important;
        line-height:34px!important;
        font-weight:900!important;
        white-space:nowrap!important;
      }
      #${ROOT_ID} .qgfc-week,
      #${ROOT_ID} .qgfc-grid{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        gap:3px!important;
      }
      #${ROOT_ID} .qgfc-week{
        padding:2px 0 4px!important;
        border-bottom:1px solid #edf2f6!important;
        margin-bottom:4px!important;
      }
      #${ROOT_ID} .qgfc-week span{
        height:25px!important;
        display:grid!important;
        place-items:center!important;
        color:#75889a!important;
        font-size:10px!important;
        font-weight:850!important;
      }
      #${ROOT_ID} .qgfc-week span:first-child{color:#cf3d45!important}
      #${ROOT_ID} .qgfc-week span:last-child{color:#2e6eb4!important}
      #${ROOT_ID} .qgfc-day{
        width:100%!important;
        height:35px!important;
        display:grid!important;
        place-items:center!important;
        padding:0!important;
        border:1px solid transparent!important;
        border-radius:7px!important;
        background:#fff!important;
        color:#31475b!important;
        font-size:11px!important;
        line-height:1!important;
        font-weight:750!important;
        cursor:pointer!important;
      }
      #${ROOT_ID} .qgfc-day:hover{
        background:#edf6fc!important;
        border-color:#c7dfef!important;
        color:#125f90!important;
      }
      #${ROOT_ID} .qgfc-day.other{color:#b0bcc6!important;font-weight:650!important}
      #${ROOT_ID} .qgfc-day.sun{color:#c9444d!important}
      #${ROOT_ID} .qgfc-day.sat{color:#2e6eb4!important}
      #${ROOT_ID} .qgfc-day.today{
        border-color:#7daed0!important;
        box-shadow:inset 0 0 0 1px rgba(74,133,174,.08)!important;
      }
      #${ROOT_ID} .qgfc-day.selected{
        border-color:#1687c6!important;
        background:#1687c6!important;
        color:#fff!important;
        font-weight:900!important;
      }
      #${ROOT_ID} .qgfc-day:disabled{
        opacity:.30!important;
        cursor:not-allowed!important;
        background:#fff!important;
      }
      #${ROOT_ID} .qgfc-foot{
        display:flex!important;
        align-items:center!important;
        gap:7px!important;
        margin-top:8px!important;
        padding-top:9px!important;
        border-top:1px solid #edf2f6!important;
      }
      #${ROOT_ID} .qgfc-btn{
        height:32px!important;
        padding:0 11px!important;
        border:1px solid #d6e0e8!important;
        border-radius:7px!important;
        background:#fff!important;
        color:#465d70!important;
        font-size:10px!important;
        font-weight:850!important;
        cursor:pointer!important;
      }
      #${ROOT_ID} .qgfc-btn:hover{background:#f5f8fa!important}
      #${ROOT_ID} .qgfc-btn.today-btn{
        margin-left:auto!important;
        border-color:#a9cfb6!important;
        background:#f0faf3!important;
        color:#1d7741!important;
      }
      @media(max-width:520px){
        #${ROOT_ID}{
          width:calc(100vw - 16px)!important;
          max-width:332px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isDateInput(input){
    if(!(input instanceof HTMLInputElement)) return false;
    return input.type==="date"
      || input.dataset.qmesDateStable==="1"
      || input.dataset.qmesDateField==="1"
      || input.dataset[MARK]==="1";
  }

  function patchInput(input){
    if(!(input instanceof HTMLInputElement)) return false;
    if(!isDateInput(input)) return false;

    if(!input.dataset.qmesGlobalDateMin) input.dataset.qmesGlobalDateMin=input.min||input.dataset.qmesDateMin||"";
    if(!input.dataset.qmesGlobalDateMax) input.dataset.qmesGlobalDateMax=input.max||input.dataset.qmesDateMax||"";

    input.dataset[MARK]="1";
    input.dataset.qmesDateStable="0";

    if(input.type!=="text"){
      try{input.type="text";}catch(_){input.setAttribute("type","text");}
    }

    input.setAttribute("autocomplete","off");
    input.setAttribute("inputmode","numeric");
    input.setAttribute("aria-haspopup","dialog");
    if(!input.placeholder) input.placeholder="YYYY-MM-DD";
    return true;
  }

  function scan(root=document){
    if(root instanceof HTMLInputElement) patchInput(root);
    root.querySelectorAll?.('input[type="date"],input[data-qmes-date-stable="1"],input[data-qmes-date-field="1"],input[data-qmes-global-fixed-date="1"]').forEach(patchInput);
  }

  function parse(value){
    if(valid(value)){
      const [y,m,d]=value.split("-").map(Number);
      const dt=new Date(y,m-1,d);
      if(dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d) return dt;
    }
    return new Date();
  }

  function inRange(value,input){
    const min=clean(input?.dataset?.qmesGlobalDateMin);
    const max=clean(input?.dataset?.qmesGlobalDateMax);
    if(min&&valid(min)&&value<min) return false;
    if(max&&valid(max)&&value>max) return false;
    return true;
  }

  function close(){
    document.getElementById(ROOT_ID)?.remove();
    activeInput=null;
  }

  function setValue(value){
    const input=activeInput;
    if(!input) return;

    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    try{
      if(setter) setter.call(input,value);
      else input.value=value;
    }catch(_){
      input.value=value;
    }

    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    close();

    setTimeout(()=>{
      try{input.focus({preventScroll:true});}catch(_){input.focus();}
    },0);
  }

  function position(){
    const root=document.getElementById(ROOT_ID);
    if(!root||!activeInput) return;

    const rect=activeInput.getBoundingClientRect();
    const w=root.offsetWidth||332;
    const h=root.offsetHeight||355;
    const gap=6;

    let left=rect.left;
    if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
    if(left<8) left=8;

    let top=rect.bottom+gap;
    if(top+h>window.innerHeight-8){
      top=rect.top-h-gap;
    }
    if(top<8) top=8;

    root.style.left=Math.round(left)+"px";
    root.style.top=Math.round(top)+"px";
  }

  function render(){
    if(!activeInput||!document.documentElement.contains(activeInput)){
      close();
      return;
    }

    let root=document.getElementById(ROOT_ID);
    if(!root){
      root=document.createElement("div");
      root.id=ROOT_ID;
      root.setAttribute("role","dialog");
      root.setAttribute("aria-label","날짜 선택");
      document.body.appendChild(root);
    }

    const selected=valid(activeInput.value)?activeInput.value:"";
    const today=new Date();
    const todayValue=iso(today.getFullYear(),today.getMonth()+1,today.getDate());

    const first=new Date(viewYear,viewMonth,1);
    const start=new Date(viewYear,viewMonth,1-first.getDay());

    const days=[];
    for(let i=0;i<42;i++){
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      const other=d.getMonth()!==viewMonth;
      const dow=d.getDay();
      const disabled=!inRange(value,activeInput);

      const classes=[
        "qgfc-day",
        other?"other":"",
        dow===0?"sun":"",
        dow===6?"sat":"",
        value===todayValue?"today":"",
        value===selected?"selected":""
      ].filter(Boolean).join(" ");

      days.push(
        '<button type="button" class="'+classes+'" data-qgfc-date="'+value+'"'+(disabled?' disabled':'')+'>'+d.getDate()+'</button>'
      );
    }

    root.innerHTML=
      '<div class="qgfc-head">'+
        '<button type="button" class="qgfc-nav" data-qgfc-prev aria-label="이전 달">‹</button>'+
        '<div class="qgfc-title">'+viewYear+'년 '+(viewMonth+1)+'월</div>'+
        '<button type="button" class="qgfc-nav" data-qgfc-next aria-label="다음 달">›</button>'+
      '</div>'+
      '<div class="qgfc-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qgfc-grid">'+days.join("")+'</div>'+
      '<div class="qgfc-foot">'+
        '<button type="button" class="qgfc-btn" data-qgfc-clear>지우기</button>'+
        '<button type="button" class="qgfc-btn" data-qgfc-close>닫기</button>'+
        '<button type="button" class="qgfc-btn today-btn" data-qgfc-today>오늘</button>'+
      '</div>';

    position();
  }

  function open(input){
    if(!(input instanceof HTMLInputElement)) return;
    ensureStyle();
    patchInput(input);
    activeInput=input;

    const current=parse(input.value);
    viewYear=current.getFullYear();
    viewMonth=current.getMonth();

    /* Remove any older popup that may already be present. */
    document.querySelectorAll('[id^="qmes-date-picker-stable-pop"]').forEach(el=>el.remove());
    render();
  }

  function targetInput(target){
    if(!(target instanceof HTMLInputElement)) return null;
    if(!isDateInput(target)) return null;
    patchInput(target);
    return target;
  }

  function handleDateInputEvent(event){
    const input=targetInput(event.target);
    if(!input) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if(event.type==="pointerdown"){
      try{input.focus({preventScroll:true});}catch(_){input.focus();}
      open(input);
    }
    return true;
  }

  /* Window capture owns date input clicks before older document-level handlers. */
  window.addEventListener("pointerdown",event=>{
    if(event.target instanceof Element&&event.target.closest("#"+ROOT_ID)) return;
    if(handleDateInputEvent(event)) return;
    if(activeInput) close();
  },true);

  window.addEventListener("mousedown",event=>{
    if(event.target instanceof Element&&event.target.closest("#"+ROOT_ID)) return;
    handleDateInputEvent(event);
  },true);

  window.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest("#"+ROOT_ID)) return;
    handleDateInputEvent(event);
  },true);

  document.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    const root=target?.closest("#"+ROOT_ID);
    if(!root) return;

    event.preventDefault();
    event.stopPropagation();

    const date=target.closest("[data-qgfc-date]");
    if(date){
      const value=clean(date.getAttribute("data-qgfc-date"));
      if(value&&inRange(value,activeInput)) setValue(value);
      return;
    }

    if(target.closest("[data-qgfc-prev]")){
      viewMonth--;
      if(viewMonth<0){viewMonth=11;viewYear--;}
      render();
      return;
    }

    if(target.closest("[data-qgfc-next]")){
      viewMonth++;
      if(viewMonth>11){viewMonth=0;viewYear++;}
      render();
      return;
    }

    if(target.closest("[data-qgfc-clear]")){
      setValue("");
      return;
    }

    if(target.closest("[data-qgfc-close]")){
      close();
      return;
    }

    if(target.closest("[data-qgfc-today]")){
      const now=new Date();
      const value=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
      if(inRange(value,activeInput)) setValue(value);
    }
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeInput){
      event.preventDefault();
      close();
      return;
    }

    const input=targetInput(event.target);
    if(input&&(event.key==="Enter"||event.key==="ArrowDown")){
      event.preventDefault();
      open(input);
    }
  },true);

  window.addEventListener("resize",()=>{if(activeInput) position();});
  window.addEventListener("scroll",()=>{if(activeInput) position();},true);

  ensureStyle();
  scan();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==="attributes"){
        if(record.target instanceof HTMLInputElement) patchInput(record.target);
        continue;
      }

      for(const node of record.addedNodes){
        if(node.nodeType!==1) continue;
        scan(node);
      }
    }

    /* Legacy date pickers may be injected after us. Remove them immediately. */
    document.querySelectorAll('[id^="qmes-date-picker-stable-pop"]').forEach(el=>{
      if(el.id!==ROOT_ID) el.remove();
    });
  });

  observer.observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:["type","data-qmes-date-stable","data-qmes-date-field"]
  });

  setInterval(()=>{
    scan();
    document.querySelectorAll('[id^="qmes-date-picker-stable-pop"]').forEach(el=>el.remove());
  },1200);

  window.qmesGlobalFixedCalendar={
    open,
    close,
    scan,
    patch:patchInput
  };
})();