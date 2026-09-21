/* QMES FIXED CALENDAR - REFERENCE MATCH V2 - 2026-09-21
 * Current-only calendar owner.
 * Fixed compact popup matching the approved reference:
 * [prev] [year select] [month select] [next]
 * weekday row, adjacent-month days, blue selected day, Today + orange dot.
 * No drag. No legacy calendar loader.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_REFERENCE_20260921_V2__) return;
  window.__QMES_FIXED_CALENDAR_REFERENCE_20260921_V2__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v2-pop";
  const STYLE_ID="qmes-fixed-calendar-reference-20260921-v2-style";
  let activeInput=null, viewYear=0, viewMonth=0;

  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));

  function isDateField(input){
    if(!(input instanceof HTMLInputElement)) return false;
    if(input.type==="date") return true;
    if(input.dataset.qmesFixedCalendar==="1") return true;
    if(input.closest(".qrl-date")) return true;
    if(input.matches('#qmes-sales-edit-force-v2 input[name="due"]')) return true;
    if(input.closest("#qmes-sales-new-order-integrated-v11")){
      return ["orderDate","due","plannedProductionDate","oqcDate"].includes(input.name);
    }
    if(input.dataset.qmesDateField==="1" || input.dataset.qmesDateStable==="1") return true;
    return false;
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      input[data-qmes-fixed-calendar="1"]{
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
      input[data-qmes-fixed-calendar="1"]::-webkit-calendar-picker-indicator{display:none!important;opacity:0!important}

      #${POP_ID}{
        position:fixed!important;
        z-index:2147483647!important;
        width:300px!important;
        padding:6px 7px 8px!important;
        border:1px solid #dfe5ea!important;
        border-radius:10px!important;
        background:#fff!important;
        color:#303b45!important;
        box-shadow:0 8px 24px rgba(25,45,65,.14)!important;
        box-sizing:border-box!important;
        user-select:none!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
      }
      #${POP_ID} *{box-sizing:border-box!important}

      #${POP_ID} .qf-head{
        display:grid!important;
        grid-template-columns:22px 1fr 22px!important;
        align-items:center!important;
        gap:5px!important;
        min-height:24px!important;
        margin-bottom:4px!important;
      }
      #${POP_ID} .qf-nav{
        width:22px!important;height:20px!important;
        display:grid!important;place-items:center!important;
        padding:0!important;
        border:0!important;
        border-radius:5px!important;
        background:transparent!important;
        color:#475569!important;
        font-size:14px!important;
        font-weight:700!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qf-nav:hover{background:#f3f6f8!important}

      #${POP_ID} .qf-selects{
        display:flex!important;
        justify-content:center!important;
        align-items:center!important;
        gap:3px!important;
      }
      #${POP_ID} .qf-select-unit{
        display:flex!important;
        align-items:center!important;
        gap:2px!important;
        white-space:nowrap!important;
      }
      #${POP_ID} .qf-suffix{
        flex:0 0 auto!important;
        color:#334155!important;
        font-size:9px!important;
        font-weight:650!important;
        line-height:1!important;
      }
      #${POP_ID} .qf-select{
        height:24px!important;
        padding:0 18px 0 7px!important;
        border:1px solid #d5dde4!important;
        border-radius:5px!important;
        background:#fff!important;
        color:#334155!important;
        font-size:11px!important;
        font-weight:500!important;
        outline:none!important;
        cursor:pointer!important;
        flex:0 0 auto!important;
        max-width:none!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
      }
      #${POP_ID} .qf-year{width:120px!important;min-width:120px!important;max-width:120px!important}
      #${POP_ID} .qf-month{width:88px!important;min-width:88px!important;max-width:88px!important}

      #${POP_ID} .qf-week,
      #${POP_ID} .qf-grid{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        gap:0!important;
      }
      #${POP_ID} .qf-week{
        border-bottom:1px solid #eef1f4!important;
        margin-bottom:2px!important;
      }
      #${POP_ID} .qf-week span{
        height:22px!important;
        display:grid!important;
        place-items:center!important;
        color:#1f2937!important;
        font-size:9px!important;
        font-weight:600!important;
      }
      #${POP_ID} .qf-week span:first-child{color:#ef4444!important}
      #${POP_ID} .qf-week span:last-child{color:#1687d9!important}

      #${POP_ID} .qf-day{
        width:100%!important;
        height:24px!important;
        display:grid!important;
        place-items:center!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:6px!important;
        background:transparent!important;
        color:#5b6670!important;
        font-size:9.5px!important;
        font-weight:500!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qf-day:hover{background:#f1f5f8!important}
      #${POP_ID} .qf-day.sun{color:#ef4444!important}
      #${POP_ID} .qf-day.sat{color:#1492de!important}
      #${POP_ID} .qf-day.other{color:#d5dce2!important}
      #${POP_ID} .qf-day.selected{
        background:#3158d7!important;
        color:#fff!important;
        font-weight:700!important;
      }
      #${POP_ID} .qf-day:disabled{opacity:.25!important;cursor:not-allowed!important}

      #${POP_ID} .qf-foot{
        height:22px!important;
        display:flex!important;
        align-items:flex-end!important;
        justify-content:flex-start!important;
        padding:3px 2px 0!important;
        border-top:1px solid #f1f3f5!important;
        margin-top:1px!important;
      }
      #${POP_ID} .qf-today{
        position:relative!important;
        border:0!important;
        background:transparent!important;
        color:#8b96a0!important;
        font-size:9px!important;
        padding:0 14px 0 0!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qf-today:after{
        content:""!important;
        position:absolute!important;
        right:4px!important;
        top:2px!important;
        width:5px!important;
        height:5px!important;
        border-radius:50%!important;
        background:#ff8a00!important;
      }
    `;
    document.head.appendChild(s);
  }

  function patch(input){
    if(!isDateField(input)) return false;
    if(!input.dataset.qmesDateMin) input.dataset.qmesDateMin=input.min||"";
    if(!input.dataset.qmesDateMax) input.dataset.qmesDateMax=input.max||"";
    input.dataset.qmesFixedCalendar="1";
    delete input.dataset.qmesDateStable;
    if(input.type!=="text"){
      try{input.type="text";}catch(_){input.setAttribute("type","text");}
    }
    input.inputMode="numeric";
    if(!input.placeholder) input.placeholder="YYYY-MM-DD";
    input.setAttribute("autocomplete","off");
    input.setAttribute("aria-haspopup","dialog");
    return true;
  }

  function scan(root=document){
    if(root instanceof HTMLInputElement) patch(root);
    root.querySelectorAll?.(
      'input[type="date"],input[data-qmes-date-field="1"],input[data-qmes-date-stable="1"],input[data-qmes-fixed-calendar="1"],.qrl-date input,#qmes-sales-edit-force-v2 input[name="due"],#qmes-sales-new-order-integrated-v11 input[name="orderDate"],#qmes-sales-new-order-integrated-v11 input[name="due"],#qmes-sales-new-order-integrated-v11 input[name="plannedProductionDate"],#qmes-sales-new-order-integrated-v11 input[name="oqcDate"]'
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
    const min=clean(activeInput.dataset.qmesDateMin), max=clean(activeInput.dataset.qmesDateMax);
    if(min&&valid(min)&&value<min) return false;
    if(max&&valid(max)&&value>max) return false;
    return true;
  }

  function close(){
    document.getElementById(POP_ID)?.remove();
    activeInput=null;
  }

  function setValue(value){
    if(!activeInput) return;
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
    const w=300, h=230, gap=5;
    let left=r.left;
    if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
    if(left<8) left=8;
    let top=r.bottom+gap;
    if(top+h>window.innerHeight-8) top=r.top-h-gap;
    if(top<8) top=8;
    pop.style.left=Math.round(left)+"px";
    pop.style.top=Math.round(top)+"px";
  }

  function yearOptions(){
    let out="";
    for(let y=2000;y<=2100;y++) out+='<option value="'+y+'"'+(y===viewYear?' selected':'')+'>'+y+'년</option>';
    return out;
  }

  function monthOptions(){
    let out="";
    for(let m=1;m<=12;m++) out+='<option value="'+m+'"'+(m===viewMonth+1?' selected':'')+'>'+m+'월</option>';
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
        "qf-day",
        dow===0?"sun":"",
        dow===6?"sat":"",
        d.getMonth()!==viewMonth?"other":"",
        value===selected?"selected":""
      ].filter(Boolean).join(" ");
      days.push('<button type="button" class="'+classes+'" data-qf-date="'+value+'"'+(!inRange(value)?' disabled':'')+'>'+d.getDate()+'</button>');
    }

    pop.innerHTML=
      '<div class="qf-head">'+
        '<button type="button" class="qf-nav" data-qf-prev aria-label="이전 달">‹</button>'+
        '<div class="qf-selects">'+
          '<span class="qf-select-unit"><select class="qf-select qf-year" data-qf-year aria-label="연도">'+yearOptions()+'</select></span>'+
          '<span class="qf-select-unit"><select class="qf-select qf-month" data-qf-month aria-label="월">'+monthOptions()+'</select></span>'+
        '</div>'+
        '<button type="button" class="qf-nav" data-qf-next aria-label="다음 달">›</button>'+
      '</div>'+
      '<div class="qf-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qf-grid">'+days.join("")+'</div>'+
      '<div class="qf-foot"><button type="button" class="qf-today" data-qf-today>오늘</button></div>';

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

  document.addEventListener("pointerdown",e=>{
    const t=e.target;
    if(t instanceof HTMLInputElement&&isDateField(t)){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      try{t.focus({preventScroll:true});}catch(_){t.focus();}
      open(t);
      return;
    }
    if(!(t instanceof Element&&t.closest("#"+POP_ID))&&activeInput) close();
  },true);

  document.addEventListener("click",e=>{
    const t=e.target instanceof Element?e.target:null;
    if(!t) return;

    if(t instanceof HTMLInputElement&&isDateField(t)){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      open(t);
      return;
    }

    if(!t.closest("#"+POP_ID)) return;
    e.preventDefault();
    e.stopPropagation();

    const date=t.closest("[data-qf-date]");
    if(date){setValue(date.getAttribute("data-qf-date")||"");return;}

    if(t.closest("[data-qf-prev]")){
      viewMonth--;
      if(viewMonth<0){viewMonth=11;viewYear--;}
      render();
      return;
    }
    if(t.closest("[data-qf-next]")){
      viewMonth++;
      if(viewMonth>11){viewMonth=0;viewYear++;}
      render();
      return;
    }
    if(t.closest("[data-qf-today]")){
      const d=new Date(),v=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      if(inRange(v)) setValue(v);
    }
  },true);

  document.addEventListener("change",e=>{
    const t=e.target;
    if(!(t instanceof HTMLSelectElement)||!t.closest("#"+POP_ID)) return;
    if(t.matches("[data-qf-year]")) viewYear=Number(t.value)||viewYear;
    if(t.matches("[data-qf-month]")) viewMonth=(Number(t.value)||1)-1;
    render();
  },true);

  document.addEventListener("focusin",e=>{
    const t=e.target;
    if(t instanceof HTMLInputElement&&isDateField(t)) open(t);
  },true);

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&activeInput){e.preventDefault();close();}
  },true);

  window.addEventListener("resize",()=>{if(activeInput)position();});
  window.addEventListener("scroll",()=>{if(activeInput)position();},true);

  ensureStyle();
  scan();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==="attributes"&&record.target instanceof HTMLInputElement){
        patch(record.target);
        continue;
      }
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        scan(node);
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["type"]});

  const api={scan,open,close,patch};
  window.qmesFixedCalendar=api;
  window.qmesDatePickerStable=api;
})();