/* QMES FIXED CALENDAR - CLEAN REBUILD V1 - 2026-09-22
 * New fixed calendar implementation.
 * - Fixed size only: no move, no resize, no corner handles.
 * - No horizontal/vertical scrollbar.
 * - Anchors to the active Sales date input.
 * - Old saved calendar size/position settings are cleared.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_CLEAN_20260922_V1__) return;
  window.__QMES_FIXED_CALENDAR_CLEAN_20260922_V1__=true;

  const POP_ID="qmes-fixed-calendar-clean-20260922-v1-pop";
  const STYLE_ID="qmes-fixed-calendar-clean-20260922-v1-style";
  const OLD_KEYS=[
    "qmes-fixed-calendar-reference-v3-scale",
    "qmes-fixed-calendar-reference-v3-position"
  ];

  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;

  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));

  try{OLD_KEYS.forEach(key=>localStorage.removeItem(key));}catch(_){}

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
      input[data-qmes-fixed-calendar-clean="1"]{
        appearance:none!important;
        -webkit-appearance:none!important;
        color-scheme:light!important;
        background-color:#fff!important;
        color:#23384b!important;
        -webkit-text-fill-color:#23384b!important;
        cursor:pointer!important;
        padding-right:34px!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7f90' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='2'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E")!important;
        background-repeat:no-repeat!important;
        background-position:calc(100% - 10px) 50%!important;
        background-size:16px 16px!important;
      }
      input[data-qmes-fixed-calendar-clean="1"]::-webkit-calendar-picker-indicator{
        display:none!important;
        opacity:0!important;
      }

      #${POP_ID}{
        position:fixed!important;
        z-index:2147483647!important;
        width:294px!important;
        min-width:294px!important;
        max-width:294px!important;
        height:auto!important;
        min-height:0!important;
        max-height:none!important;
        padding:10px!important;
        margin:0!important;
        overflow:hidden!important;
        border:1px solid #cfd9e1!important;
        border-radius:9px!important;
        background:#fff!important;
        color:#26384a!important;
        box-shadow:0 10px 28px rgba(32,59,79,.18)!important;
        box-sizing:border-box!important;
        transform:none!important;
        user-select:none!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
      }
      #${POP_ID} *{box-sizing:border-box!important}

      #${POP_ID} .qfc-head{
        display:grid!important;
        grid-template-columns:28px 1fr 28px!important;
        align-items:center!important;
        gap:5px!important;
        height:34px!important;
        margin:0 0 5px!important;
        padding:0!important;
      }
      #${POP_ID} .qfc-nav{
        width:28px!important;
        height:30px!important;
        display:grid!important;
        place-items:center!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:5px!important;
        background:transparent!important;
        color:#42576a!important;
        font-size:18px!important;
        font-weight:800!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qfc-nav:hover{background:#f1f5f8!important}
      #${POP_ID} .qfc-selects{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:5px!important;
        min-width:0!important;
      }
      #${POP_ID} .qfc-select{
        height:30px!important;
        margin:0!important;
        padding:0 24px 0 8px!important;
        border:1px solid #cbd6df!important;
        border-radius:5px!important;
        background-color:#fff!important;
        color:#26384a!important;
        font-size:11px!important;
        font-weight:700!important;
        outline:none!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qfc-year{width:108px!important}
      #${POP_ID} .qfc-month{width:76px!important}

      #${POP_ID} .qfc-week,
      #${POP_ID} .qfc-grid{
        display:grid!important;
        grid-template-columns:repeat(7,minmax(0,1fr))!important;
        width:100%!important;
        gap:0!important;
        overflow:hidden!important;
      }
      #${POP_ID} .qfc-week{
        height:25px!important;
        border-bottom:1px solid #edf1f4!important;
        margin:0 0 2px!important;
      }
      #${POP_ID} .qfc-week span{
        display:grid!important;
        place-items:center!important;
        height:25px!important;
        font-size:9px!important;
        font-weight:800!important;
        color:#425466!important;
      }
      #${POP_ID} .qfc-week span:first-child{color:#e54a4a!important}
      #${POP_ID} .qfc-week span:last-child{color:#198bd2!important}

      #${POP_ID} .qfc-day{
        width:100%!important;
        height:29px!important;
        display:grid!important;
        place-items:center!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:6px!important;
        background:transparent!important;
        color:#33485a!important;
        font-size:10px!important;
        font-weight:700!important;
        line-height:1!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qfc-day:hover{background:#edf5fa!important}
      #${POP_ID} .qfc-day.sun{color:#e54a4a!important}
      #${POP_ID} .qfc-day.sat{color:#198bd2!important}
      #${POP_ID} .qfc-day.other{color:#b0bbc4!important;font-weight:600!important}
      #${POP_ID} .qfc-day.selected{background:#2f67c7!important;color:#fff!important}
      #${POP_ID} .qfc-day:disabled{opacity:.25!important;cursor:not-allowed!important}

      #${POP_ID} .qfc-foot{
        height:29px!important;
        display:flex!important;
        align-items:flex-end!important;
        justify-content:flex-start!important;
        margin:3px 0 0!important;
        padding:5px 2px 0!important;
        border-top:1px solid #edf1f4!important;
      }
      #${POP_ID} .qfc-today{
        height:21px!important;
        margin:0!important;
        padding:0 7px!important;
        border:0!important;
        border-radius:4px!important;
        background:transparent!important;
        color:#687b8b!important;
        font-size:9px!important;
        font-weight:750!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qfc-today:hover{background:#f1f5f8!important}
    `;
    document.head.appendChild(s);
  }

  function patch(input){
    if(!isSalesDateField(input)) return false;
    if(!input.dataset.qmesCalendarMin) input.dataset.qmesCalendarMin=input.min||"";
    if(!input.dataset.qmesCalendarMax) input.dataset.qmesCalendarMax=input.max||"";
    input.dataset.qmesFixedCalendarClean="1";
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
    const min=clean(activeInput.dataset.qmesCalendarMin);
    const max=clean(activeInput.dataset.qmesCalendarMax);
    if(min&&valid(min)&&value<min) return false;
    if(max&&valid(max)&&value>max) return false;
    return true;
  }

  function close(){
    document.getElementById(POP_ID)?.remove();
    activeInput=null;
  }

  function setValue(value){
    if(!activeInput||!inRange(value)) return;
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
    const gap=5;
    const w=294;
    const h=278;
    let left=r.left;
    let top=r.bottom+gap;

    if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
    if(left<8) left=8;
    if(top+h>window.innerHeight-8) top=r.top-h-gap;
    if(top<8) top=8;

    pop.style.setProperty("left",Math.round(left)+"px","important");
    pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function yearOptions(){
    let out="";
    for(let y=2000;y<=2100;y++){
      out+='<option value="'+y+'"'+(y===viewYear?' selected':'')+'>'+y+'년</option>';
    }
    return out;
  }

  function monthOptions(){
    let out="";
    for(let m=1;m<=12;m++){
      out+='<option value="'+m+'"'+(m===viewMonth+1?' selected':'')+'>'+m+'월</option>';
    }
    return out;
  }

  function render(){
    if(!activeInput||!document.documentElement.contains(activeInput)){close();return;}

    let pop=document.getElementById(POP_ID);
    if(!pop){
      pop=document.createElement("div");
      pop.id=POP_ID;
      pop.setAttribute("role","dialog");
      pop.setAttribute("aria-label","날짜 선택");
      document.body.appendChild(pop);
    }

    const selected=valid(activeInput.value)?activeInput.value:"";
    const first=new Date(viewYear,viewMonth,1);
    const start=new Date(viewYear,viewMonth,1-first.getDay());
    const days=[];

    for(let i=0;i<42;i++){
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      const dow=d.getDay();
      const classes=[
        "qfc-day",
        dow===0?"sun":"",
        dow===6?"sat":"",
        d.getMonth()!==viewMonth?"other":"",
        value===selected?"selected":""
      ].filter(Boolean).join(" ");
      days.push('<button type="button" class="'+classes+'" data-qfc-date="'+value+'"'+(!inRange(value)?' disabled':'')+'>'+d.getDate()+'</button>');
    }

    pop.innerHTML=
      '<div class="qfc-head">'+
        '<button type="button" class="qfc-nav" data-qfc-prev aria-label="이전 달">‹</button>'+
        '<div class="qfc-selects">'+
          '<select class="qfc-select qfc-year" data-qfc-year aria-label="연도">'+yearOptions()+'</select>'+
          '<select class="qfc-select qfc-month" data-qfc-month aria-label="월">'+monthOptions()+'</select>'+
        '</div>'+
        '<button type="button" class="qfc-nav" data-qfc-next aria-label="다음 달">›</button>'+
      '</div>'+
      '<div class="qfc-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qfc-grid">'+days.join("")+'</div>'+
      '<div class="qfc-foot"><button type="button" class="qfc-today" data-qfc-today>오늘</button></div>';

    position();
  }

  function open(input){
    if(!patch(input)) return;
    activeInput=input;
    const d=parse(input.value);
    viewYear=d.getFullYear();
    viewMonth=d.getMonth();
    render();
  }

  document.addEventListener("pointerdown",event=>{
    const target=event.target;
    if(target instanceof HTMLInputElement&&isSalesDateField(target)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      try{target.focus({preventScroll:true});}catch(_){target.focus();}
      open(target);
      return;
    }
    if(target instanceof Element&&!target.closest("#"+POP_ID)&&activeInput) close();
  },true);

  document.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;

    if(target instanceof HTMLInputElement&&isSalesDateField(target)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      open(target);
      return;
    }

    const pop=target.closest("#"+POP_ID);
    if(!pop) return;

    if(target.matches("[data-qfc-year],[data-qfc-month]")) return;

    event.preventDefault();
    event.stopPropagation();

    const day=target.closest("[data-qfc-date]");
    if(day){setValue(day.getAttribute("data-qfc-date")||"");return;}

    if(target.closest("[data-qfc-prev]")){
      viewMonth--;
      if(viewMonth<0){viewMonth=11;viewYear--;}
      render();
      return;
    }
    if(target.closest("[data-qfc-next]")){
      viewMonth++;
      if(viewMonth>11){viewMonth=0;viewYear++;}
      render();
      return;
    }
    if(target.closest("[data-qfc-today]")){
      const d=new Date();
      setValue(iso(d.getFullYear(),d.getMonth()+1,d.getDate()));
    }
  },true);

  document.addEventListener("change",event=>{
    const target=event.target;
    if(!(target instanceof HTMLSelectElement)||!target.closest("#"+POP_ID)) return;
    if(target.matches("[data-qfc-year]")) viewYear=Number(target.value)||viewYear;
    if(target.matches("[data-qfc-month]")) viewMonth=(Number(target.value)||1)-1;
    render();
  },true);

  document.addEventListener("focusin",event=>{
    const target=event.target;
    if(target instanceof HTMLInputElement&&isSalesDateField(target)) open(target);
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeInput){event.preventDefault();close();}
  },true);

  window.addEventListener("resize",()=>{if(activeInput)position();},{passive:true});
  window.addEventListener("scroll",()=>{if(activeInput)position();},true);

  ensureStyle();
  scan();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        scan(node);
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.qmesFixedCalendar={scan,open,close,patch};
})();