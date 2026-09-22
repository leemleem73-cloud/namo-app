/* QMES FIXED CALENDAR - NATIVE STYLE V5 PURCHASE REFERENCE - 2026-09-22
 * ADD-ONLY replacement owner.
 * UI follows the approved purchase-order style:
 * - one popup only
 * - combined "YYYY년 MM월" header with dropdown
 * - up/down month navigation
 * - Sunday/Saturday color
 * - selected date blue square
 * - year list view
 * - bottom actions: 삭제 / 오늘
 * Existing calendar source files are preserved but this V2 is the only loaded owner.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_NATIVE_STYLE_20260922_V5__) return;
  window.__QMES_FIXED_CALENDAR_NATIVE_STYLE_20260922_V5__=true;

  const POP_ID="qmes-fixed-calendar-native-style-20260922-v2-pop";
  const STYLE_ID="qmes-fixed-calendar-native-style-20260922-v2-style";
  const OLD_POP_IDS=[
    "qmes-fixed-calendar-clean-20260922-v1-pop",
    "qmes-date-picker-stable-pop-20260831-v3"
  ];

  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;
  let mode="days";
  let yearPageStart=0;

  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));

  function removeLegacyPopups(){
    OLD_POP_IDS.forEach(id=>document.getElementById(id)?.remove());
  }

  function isSalesDateField(input){
    if(!(input instanceof HTMLInputElement)) return false;
    if(input.closest(".qmes-sales-ledger-v4 .qrl-date")) return true;
    if(input.matches('#qmes-sales-edit-force-v2 input[name="due"]')) return true;
    if(input.closest("#qmes-sales-new-order-integrated-v11")){
      return ["orderDate","due","plannedProductionDate","oqcDate"].includes(input.name);
    }
    return false;
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      input[data-qmes-fixed-calendar-v2="1"]{
        appearance:none!important;
        -webkit-appearance:none!important;
        color-scheme:light!important;
        background-color:#fff!important;
        color:#243746!important;
        -webkit-text-fill-color:#243746!important;
        cursor:pointer!important;
        padding-right:34px!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234b5f6f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='2'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E")!important;
        background-repeat:no-repeat!important;
        background-position:calc(100% - 10px) 50%!important;
        background-size:16px 16px!important;
      }
      input[data-qmes-fixed-calendar-v2="1"]::-webkit-calendar-picker-indicator{
        display:none!important;
        opacity:0!important;
      }

      #${POP_ID}{
        position:fixed!important;
        z-index:2147483647!important;
        width:260px!important;
        min-width:260px!important;
        max-width:260px!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        border:1px solid #c8d1da!important;
        border-radius:2px!important;
        background:#fff!important;
        color:#243746!important;
        box-shadow:0 8px 22px rgba(20,42,58,.18)!important;
        box-sizing:border-box!important;
        user-select:none!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
      }
      #${POP_ID} *{box-sizing:border-box!important}

      #${POP_ID} .qnv-head{
        height:40px!important;
        display:grid!important;
        grid-template-columns:1fr 34px 34px!important;
        align-items:center!important;
        gap:0!important;
        padding:0 6px 0 10px!important;
        border-bottom:1px solid #e2e7eb!important;
        background:#fff!important;
      }
      #${POP_ID} .qnv-title{
        height:32px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
        color:#263746!important;
        font-size:10px!important;
        font-weight:800!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qnv-caret{
        display:inline-block!important;
        margin-left:5px!important;
        width:0!important;
        height:0!important;
        border-left:5px solid transparent!important;
        border-right:5px solid transparent!important;
        border-top:6px solid #364b5b!important;
      }
      #${POP_ID} .qnv-nav{
        width:32px!important;
        height:32px!important;
        display:grid!important;
        place-items:center!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        background:#fff!important;
        color:#233746!important;
        font-size:24px!important;
        line-height:1!important;
        font-weight:300!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qnv-nav:hover{background:#f3f6f8!important}

      #${POP_ID} .qnv-week{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        height:30px!important;
        padding:0 7px!important;
        background:#fff!important;
      }
      #${POP_ID} .qnv-week span{
        display:grid!important;
        place-items:center!important;
        color:#253746!important;
        font-size:13px!important;
        font-weight:700!important;
      }
      #${POP_ID} .qnv-week span:first-child{color:#d73838!important}
      #${POP_ID} .qnv-week span:last-child{color:#1384d1!important}

      #${POP_ID} .qnv-grid{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        grid-auto-rows:31px!important;
        padding:0 7px 4px!important;
        background:#fff!important;
      }
      #${POP_ID} .qnv-day{
        width:28px!important;
        height:28px!important;
        display:grid!important;
        place-items:center!important;
        justify-self:center!important;
        align-self:center!important;
        margin:0!important;
        padding:0!important;
        border:1px solid transparent!important;
        border-radius:0!important;
        background:#fff!important;
        color:#273a48!important;
        font-size:13px!important;
        font-weight:500!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qnv-day:hover{
        border-color:#8396a5!important;
        background:#f8fafb!important;
      }
      #${POP_ID} .qnv-day.sun{color:#d93d3d!important}
      #${POP_ID} .qnv-day.sat{color:#1284d0!important}
      #${POP_ID} .qnv-day.other{color:#aeb8bf!important}
      #${POP_ID} .qnv-day.selected{
        border:2px solid #253949!important;
        background:#1988e2!important;
        color:#fff!important;
        font-weight:800!important;
      }
      #${POP_ID} .qnv-day.today:not(.selected){
        border:1px solid #7d8c97!important;
      }
      #${POP_ID} .qnv-day:disabled{opacity:.30!important;cursor:not-allowed!important}

      #${POP_ID} .qnv-years{
        max-height:222px!important;
        overflow-y:auto!important;
        padding:0!important;
        background:#fff!important;
      }
      #${POP_ID} .qnv-year-current{
        height:34px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        padding:0 18px!important;
        border-bottom:1px solid #e6ebef!important;
        background:#fff!important;
        color:#263746!important;
        font-size:13px!important;
        font-weight:700!important;
      }
      #${POP_ID} .qnv-month-grid{
        display:grid!important;
        grid-template-columns:repeat(4,1fr)!important;
        gap:0!important;
        padding:5px 10px 7px!important;
        border-bottom:1px solid #e6ebef!important;
        background:#fff!important;
      }
      #${POP_ID} .qnv-month{
        height:32px!important;
        margin:1px!important;
        padding:0!important;
        border:1px solid transparent!important;
        border-radius:0!important;
        background:#fff!important;
        color:#273a48!important;
        font-size:12px!important;
        font-weight:500!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qnv-month:hover{
        border-color:#8c9ba7!important;
        background:#f6f8fa!important;
      }
      #${POP_ID} .qnv-month.selected{
        border:2px solid #253949!important;
        background:#1988e2!important;
        color:#fff!important;
        font-weight:800!important;
      }
      #${POP_ID} .qnv-year{
        width:100%!important;
        height:30px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        padding:0 18px!important;
        border:0!important;
        border-bottom:1px solid #edf0f2!important;
        background:#fff!important;
        color:#263746!important;
        font-size:12px!important;
        font-weight:500!important;
        text-align:left!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qnv-year:hover{background:#f4f7f9!important}

      #${POP_ID} .qnv-foot{
        height:40px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        padding:0 13px!important;
        border-top:1px solid #e2e7eb!important;
        background:#fff!important;
      }
      #${POP_ID} .qnv-action{
        height:34px!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
        color:#1682cb!important;
        font-size:13px!important;
        font-weight:700!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qnv-action:hover{text-decoration:underline!important}
    `;
    document.head.appendChild(s);
  }

  function patch(input){
    if(!isSalesDateField(input)) return false;

    if(!input.dataset.qmesCalendarV2Min) input.dataset.qmesCalendarV2Min=input.min||input.dataset.qmesCalendarMin||"";
    if(!input.dataset.qmesCalendarV2Max) input.dataset.qmesCalendarV2Max=input.max||input.dataset.qmesCalendarMax||"";

    delete input.dataset.qmesFixedCalendarClean;
    input.removeAttribute("data-qmes-fixed-calendar-clean");
    delete input.dataset.qmesDateStable;
    input.removeAttribute("data-qmes-date-stable");
    input.removeAttribute("data-qmes-date-field");

    input.dataset.qmesFixedCalendarV2="1";

    if(input.type!=="text"){
      try{input.type="text";}catch(_){input.setAttribute("type","text");}
    }
    input.inputMode="numeric";
    input.placeholder=input.placeholder||"YYYY-MM-DD";
    input.setAttribute("autocomplete","off");
    input.setAttribute("aria-haspopup","dialog");
    return true;
  }

  function scan(root=document){
    if(root instanceof HTMLInputElement) patch(root);
    root.querySelectorAll?.(
      '.qmes-sales-ledger-v4 .qrl-date input,'+
      '#qmes-sales-edit-force-v2 input[name="due"],'+
      '#qmes-sales-new-order-integrated-v11 input[name="orderDate"],'+
      '#qmes-sales-new-order-integrated-v11 input[name="due"],'+
      '#qmes-sales-new-order-integrated-v11 input[name="plannedProductionDate"],'+
      '#qmes-sales-new-order-integrated-v11 input[name="oqcDate"]'
    ).forEach(patch);
    removeLegacyPopups();
  }

  function parse(value){
    if(valid(value)){
      const [y,m,d]=value.split("-").map(Number);
      const dt=new Date(y,m-1,d);
      if(dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d) return dt;
    }
    return new Date();
  }

  function inRange(value){
    if(!activeInput) return true;
    const min=clean(activeInput.dataset.qmesCalendarV2Min);
    const max=clean(activeInput.dataset.qmesCalendarV2Max);
    if(min&&valid(min)&&value<min) return false;
    if(max&&valid(max)&&value>max) return false;
    return true;
  }

  function close(){
    document.getElementById(POP_ID)?.remove();
    removeLegacyPopups();
    activeInput=null;
    mode="days";
  }

  function setValue(value){
    if(!activeInput) return;
    if(value&& !inRange(value)) return;

    const input=activeInput;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    try{setter?setter.call(input,value):(input.value=value);}catch(_){input.value=value;}
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));

    close();
    setTimeout(()=>{try{input.focus({preventScroll:true});}catch(_){input.focus();}},0);
  }

  function position(){
    const pop=document.getElementById(POP_ID);
    if(!pop||!activeInput) return;

    const r=activeInput.getBoundingClientRect();
    const gap=4;
    const w=260;
    const h=mode==="years"?300:295;
    let left=r.left;
    let top=r.bottom+gap;

    if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
    if(left<8) left=8;
    if(top+h>window.innerHeight-8) top=Math.max(8,r.top-h-gap);

    pop.style.setProperty("left",Math.round(left)+"px","important");
    pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function shiftMonth(delta){
    viewMonth+=delta;
    if(viewMonth<0){viewMonth=11;viewYear--;}
    if(viewMonth>11){viewMonth=0;viewYear++;}
  }

  function renderDays(pop){
    const selected=valid(activeInput?.value)?activeInput.value:"";
    const now=new Date();
    const today=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
    const first=new Date(viewYear,viewMonth,1);
    const start=new Date(viewYear,viewMonth,1-first.getDay());
    const days=[];

    for(let i=0;i<42;i++){
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      const dow=d.getDay();
      const cls=[
        "qnv-day",
        dow===0?"sun":"",
        dow===6?"sat":"",
        d.getMonth()!==viewMonth?"other":"",
        value===selected?"selected":"",
        value===today?"today":""
      ].filter(Boolean).join(" ");

      days.push('<button type="button" class="'+cls+'" data-qnv-date="'+value+'"'+(!inRange(value)?' disabled':'')+'>'+d.getDate()+'</button>');
    }

    pop.innerHTML=
      '<div class="qnv-head">'+
        '<button type="button" class="qnv-title" data-qnv-toggle>'+viewYear+'년 '+pad(viewMonth+1)+'월<span class="qnv-caret"></span></button>'+
        '<button type="button" class="qnv-nav" data-qnv-prev aria-label="이전 달">↑</button>'+
        '<button type="button" class="qnv-nav" data-qnv-next aria-label="다음 달">↓</button>'+
      '</div>'+
      '<div class="qnv-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qnv-grid">'+days.join("")+'</div>'+
      '<div class="qnv-foot">'+
        '<button type="button" class="qnv-action" data-qnv-clear>삭제</button>'+
        '<button type="button" class="qnv-action" data-qnv-today>오늘</button>'+
      '</div>';
  }

  function renderYears(pop){
    if(!yearPageStart) yearPageStart=viewYear;
    const base=Math.max(2000,Math.min(2095,Number(yearPageStart)||viewYear));
    viewYear=base;

    const months=[];
    for(let m=1;m<=12;m++){
      months.push(
        '<button type="button" class="qnv-month'+(m===viewMonth+1?' selected':'')+'" data-qnv-month="'+m+'">'+m+'</button>'
      );
    }

    const years=[];
    for(let y=base+1;y<=Math.min(2099,base+4);y++){
      years.push('<button type="button" class="qnv-year" data-qnv-year="'+y+'">'+y+'</button>');
    }

    pop.innerHTML=
      '<div class="qnv-head">'+
        '<button type="button" class="qnv-title" data-qnv-toggle>'+viewYear+'년 '+pad(viewMonth+1)+'월<span class="qnv-caret"></span></button>'+
        '<button type="button" class="qnv-nav" data-qnv-year-prev aria-label="이전 연도">↑</button>'+
        '<button type="button" class="qnv-nav" data-qnv-year-next aria-label="다음 연도">↓</button>'+
      '</div>'+
      '<div class="qnv-years">'+
        '<div class="qnv-year-current">'+base+'</div>'+
        '<div class="qnv-month-grid">'+months.join("")+'</div>'+
        years.join("")+
      '</div>'+
      '<div class="qnv-foot">'+
        '<button type="button" class="qnv-action" data-qnv-clear>삭제</button>'+
        '<button type="button" class="qnv-action" data-qnv-today>오늘</button>'+
      '</div>';
  }

  function render(){
    if(!activeInput||!document.documentElement.contains(activeInput)){close();return;}
    removeLegacyPopups();

    let pop=document.getElementById(POP_ID);
    if(!pop){
      pop=document.createElement("div");
      pop.id=POP_ID;
      pop.setAttribute("role","dialog");
      pop.setAttribute("aria-label","날짜 선택");
      document.body.appendChild(pop);
    }

    if(mode==="years") renderYears(pop);
    else renderDays(pop);

    position();
  }

  function open(input){
    if(!patch(input)) return;
    removeLegacyPopups();
    activeInput=input;
    const d=parse(input.value);
    viewYear=d.getFullYear();
    viewMonth=d.getMonth();
    mode="days";
    yearPageStart=Math.max(2000,viewYear-2);
    render();
  }

  function targetInput(target){
    return target instanceof HTMLInputElement && isSalesDateField(target) ? target : null;
  }

  document.addEventListener("pointerdown",event=>{
    const input=targetInput(event.target);
    if(input){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      try{input.focus({preventScroll:true});}catch(_){input.focus();}
      open(input);
      return;
    }

    const inside=event.target instanceof Element && event.target.closest("#"+POP_ID);
    if(!inside&&activeInput) close();
  },true);

  document.addEventListener("click",event=>{
    const input=targetInput(event.target);
    if(input){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      open(input);
      return;
    }

    const t=event.target instanceof Element?event.target:null;
    if(!t||!t.closest("#"+POP_ID)) return;

    event.preventDefault();
    event.stopPropagation();

    const date=t.closest("[data-qnv-date]");
    if(date){setValue(date.getAttribute("data-qnv-date")||"");return;}

    const month=t.closest("[data-qnv-month]");
    if(month){
      const m=Number(month.getAttribute("data-qnv-month"))||1;
      viewMonth=Math.max(0,Math.min(11,m-1));
      mode="days";
      render();
      return;
    }

    const year=t.closest("[data-qnv-year]");
    if(year){
      const y=Number(year.getAttribute("data-qnv-year"))||viewYear;
      viewYear=y;
      yearPageStart=y;
      render();
      return;
    }

    if(t.closest("[data-qnv-toggle]")){
      mode=mode==="days"?"years":"days";
      yearPageStart=viewYear;
      render();
      return;
    }

    if(t.closest("[data-qnv-prev]")){shiftMonth(-1);render();return;}
    if(t.closest("[data-qnv-next]")){shiftMonth(1);render();return;}

    if(t.closest("[data-qnv-year-prev]")){
      yearPageStart=Math.max(2000,(Number(yearPageStart)||viewYear)-1);
      render();
      return;
    }
    if(t.closest("[data-qnv-year-next]")){
      yearPageStart=Math.min(2095,(Number(yearPageStart)||viewYear)+1);
      render();
      return;
    }

    if(t.closest("[data-qnv-clear]")){setValue("");return;}

    if(t.closest("[data-qnv-today]")){
      const d=new Date();
      const value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      if(inRange(value)) setValue(value);
    }
  },true);

  document.addEventListener("focusin",event=>{
    const input=targetInput(event.target);
    if(input) open(input);
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeInput){
      event.preventDefault();
      close();
    }
  },true);

  window.addEventListener("resize",()=>{if(activeInput)position();},{passive:true});
  window.addEventListener("scroll",()=>{if(activeInput)position();},true);

  ensureStyle();
  scan();
  removeLegacyPopups();

  // HOTFIX V3: do not scan every React DOM mutation.
  // The previous full-document MutationObserver repeatedly traversed large
  // subtrees while QMES was mounting and could leave the first screen stuck
  // on the loading indicator. Inputs are patched on actual interaction, and
  // only a few bounded scans run after navigation/render events.
  const scheduleScan=()=>{
    requestAnimationFrame(()=>{
      try{scan();}catch(_){}
    });
  };

  ["qmes:navigate-tab","qmes:erp-integrated-ready","qmes:data-updated"]
    .forEach(name=>window.addEventListener(name,scheduleScan));

  [120,500,1200].forEach(ms=>setTimeout(scheduleScan,ms));

  window.qmesFixedCalendar={scan,open,close,patch};
})();