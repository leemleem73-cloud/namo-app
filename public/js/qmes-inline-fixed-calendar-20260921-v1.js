/* QMES INLINE FIXED CALENDAR - CURRENT UI ONLY - 2026-09-21
 * "고정 달력" owner:
 * - No floating popup / no viewport overlay / no dragging.
 * - Calendar is inserted into the page layout below the active date field area.
 * - Same calendar UI for Sales period, Sales edit due date, and New Sales dates.
 */
(function(){
  "use strict";
  if(window.__QMES_INLINE_FIXED_CALENDAR_20260921_V1__) return;
  window.__QMES_INLINE_FIXED_CALENDAR_20260921_V1__=true;

  const ROOT_ID="qmes-inline-fixed-calendar-20260921-v1";
  const STYLE_ID=ROOT_ID+"-style";
  const MARK="qmesInlineFixedDate";
  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));

  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;

  function isDateField(input){
    if(!(input instanceof HTMLInputElement)) return false;
    if(input.dataset[MARK]==="1") return true;
    if(input.type==="date") return true;
    if(input.closest(".qrl-date")) return true;
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
      input[data-qmes-inline-fixed-date="1"]{
        color-scheme:light!important;
        appearance:none!important;
        -webkit-appearance:none!important;
        background:#fff!important;
        color:#172033!important;
        -webkit-text-fill-color:#172033!important;
        cursor:pointer!important;
        padding-right:38px!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%235a7083' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='2'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E")!important;
        background-repeat:no-repeat!important;
        background-position:calc(100% - 10px) 50%!important;
        background-size:17px 17px!important;
        font-variant-numeric:tabular-nums!important;
      }
      input[data-qmes-inline-fixed-date="1"]::-webkit-calendar-picker-indicator{
        display:none!important;opacity:0!important;pointer-events:none!important;
      }

      #${ROOT_ID}{
        position:static!important;
        width:304px!important;
        min-width:304px!important;
        max-width:100%!important;
        margin:8px 0 10px 0!important;
        padding:12px!important;
        border:1px solid #cad8e4!important;
        border-radius:12px!important;
        background:#fff!important;
        box-shadow:0 8px 24px rgba(31,58,82,.12)!important;
        color:#243b53!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        box-sizing:border-box!important;
        user-select:none!important;
        z-index:auto!important;
      }
      #${ROOT_ID},#${ROOT_ID} *{box-sizing:border-box!important}
      #${ROOT_ID} .qifc-head{
        display:grid!important;
        grid-template-columns:34px 1fr 34px!important;
        align-items:center!important;
        gap:7px!important;
        min-height:34px!important;
        margin-bottom:7px!important;
      }
      #${ROOT_ID} .qifc-title{
        text-align:center!important;
        font-size:14px!important;
        line-height:34px!important;
        font-weight:900!important;
        color:#1f3449!important;
      }
      #${ROOT_ID} .qifc-nav{
        width:34px!important;height:34px!important;
        display:grid!important;place-items:center!important;
        padding:0!important;
        border:1px solid #d8e2eb!important;
        border-radius:8px!important;
        background:#f8fafc!important;
        color:#334e65!important;
        font-size:20px!important;
        line-height:1!important;
        font-weight:900!important;
        cursor:pointer!important;
      }
      #${ROOT_ID} .qifc-week,#${ROOT_ID} .qifc-grid{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        gap:3px!important;
      }
      #${ROOT_ID} .qifc-week{
        padding-bottom:4px!important;
        border-bottom:1px solid #edf2f6!important;
        margin-bottom:4px!important;
      }
      #${ROOT_ID} .qifc-week span{
        height:24px!important;
        display:grid!important;place-items:center!important;
        font-size:10px!important;font-weight:850!important;color:#75889a!important;
      }
      #${ROOT_ID} .qifc-week span:first-child{color:#d0444d!important}
      #${ROOT_ID} .qifc-week span:last-child{color:#2e6eb4!important}
      #${ROOT_ID} .qifc-day{
        width:100%!important;height:33px!important;
        display:grid!important;place-items:center!important;
        padding:0!important;
        border:1px solid transparent!important;
        border-radius:7px!important;
        background:#fff!important;
        color:#31475b!important;
        font-size:11px!important;font-weight:760!important;
        cursor:pointer!important;
      }
      #${ROOT_ID} .qifc-day:hover{background:#edf6fc!important;border-color:#c7dfef!important;color:#125f90!important}
      #${ROOT_ID} .qifc-day.other{color:#b0bcc6!important}
      #${ROOT_ID} .qifc-day.sun{color:#c9444d!important}
      #${ROOT_ID} .qifc-day.sat{color:#2e6eb4!important}
      #${ROOT_ID} .qifc-day.today{border-color:#7daed0!important}
      #${ROOT_ID} .qifc-day.selected{background:#1687c6!important;border-color:#1687c6!important;color:#fff!important;font-weight:900!important}
      #${ROOT_ID} .qifc-day:disabled{opacity:.28!important;cursor:not-allowed!important}
      #${ROOT_ID} .qifc-actions{
        display:flex!important;align-items:center!important;gap:7px!important;
        margin-top:8px!important;padding-top:9px!important;border-top:1px solid #edf2f6!important;
      }
      #${ROOT_ID} .qifc-btn{
        height:31px!important;padding:0 10px!important;
        border:1px solid #d6e0e8!important;border-radius:7px!important;
        background:#fff!important;color:#465d70!important;
        font-size:10px!important;font-weight:850!important;cursor:pointer!important;
      }
      #${ROOT_ID} .qifc-btn.today{margin-left:auto!important;border-color:#a9cfb6!important;background:#f0faf3!important;color:#1d7741!important}

      /* Sales ledger dock: fixed in document flow under the filter bar. */
      .qmes-inline-calendar-dock-ledger{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:flex-start!important;
        width:100%!important;
        padding:0 12px!important;
        background:transparent!important;
      }

      /* Edit / New Sales: calendar stays inside the form, directly below the date field. */
      #qmes-sales-edit-force-v2 .qmes-inline-calendar-dock-field,
      #qmes-sales-new-order-integrated-v11 .qmes-inline-calendar-dock-field{
        grid-column:1/-1!important;
        width:100%!important;
        display:flex!important;
        justify-content:flex-start!important;
      }

      @media(max-width:520px){
        #${ROOT_ID}{width:min(304px,100%)!important;min-width:0!important}
      }
    `;
    document.head.appendChild(s);
  }

  function patch(input){
    if(!isDateField(input)) return false;
    if(!input.dataset.qmesDateMin) input.dataset.qmesDateMin=input.min||"";
    if(!input.dataset.qmesDateMax) input.dataset.qmesDateMax=input.max||"";
    input.dataset[MARK]="1";
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
    root.querySelectorAll?.('input[type="date"],.qrl-date input,#qmes-sales-edit-force-v2 input[name="due"],#qmes-sales-new-order-integrated-v11 input[name="orderDate"],#qmes-sales-new-order-integrated-v11 input[name="due"],#qmes-sales-new-order-integrated-v11 input[name="plannedProductionDate"],#qmes-sales-new-order-integrated-v11 input[name="oqcDate"],input[data-qmes-inline-fixed-date="1"]').forEach(patch);
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
    const min=clean(activeInput.dataset.qmesDateMin);
    const max=clean(activeInput.dataset.qmesDateMax);
    if(min&&valid(min)&&value<min) return false;
    if(max&&valid(max)&&value>max) return false;
    return true;
  }

  function removeDock(){
    document.querySelectorAll(".qmes-inline-calendar-dock-ledger,.qmes-inline-calendar-dock-field").forEach(el=>el.remove());
  }

  function close(){
    document.getElementById(ROOT_ID)?.remove();
    removeDock();
    activeInput=null;
  }

  function ensureDock(input){
    removeDock();

    if(input.closest(".qrl-date")){
      const filter=input.closest(".qrl-filter");
      if(!filter) return document.body;
      const dock=document.createElement("div");
      dock.className="qmes-inline-calendar-dock-ledger";
      filter.insertAdjacentElement("afterend",dock);
      return dock;
    }

    const field=input.closest(".qsef-field,.field");
    if(field){
      const dock=document.createElement("div");
      dock.className="qmes-inline-calendar-dock-field";
      field.insertAdjacentElement("afterend",dock);
      return dock;
    }

    const dock=document.createElement("div");
    dock.className="qmes-inline-calendar-dock-field";
    input.insertAdjacentElement("afterend",dock);
    return dock;
  }

  function render(){
    if(!activeInput||!document.documentElement.contains(activeInput)){close();return;}

    const dock=ensureDock(activeInput);
    let root=document.getElementById(ROOT_ID);
    if(!root){
      root=document.createElement("div");
      root.id=ROOT_ID;
      root.setAttribute("role","dialog");
      root.setAttribute("aria-label","고정 달력");
    }
    dock.appendChild(root);

    const selected=valid(activeInput.value)?activeInput.value:"";
    const now=new Date();
    const today=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
    const first=new Date(viewYear,viewMonth,1);
    const start=new Date(viewYear,viewMonth,1-first.getDay());

    const cells=[];
    for(let i=0;i<42;i++){
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      const dow=d.getDay();
      const other=d.getMonth()!==viewMonth;
      const classes=[
        "qifc-day",
        other?"other":"",
        dow===0?"sun":"",
        dow===6?"sat":"",
        value===today?"today":"",
        value===selected?"selected":""
      ].filter(Boolean).join(" ");
      cells.push('<button type="button" class="'+classes+'" data-qifc-date="'+value+'"'+(!inRange(value)?' disabled':'')+'>'+d.getDate()+'</button>');
    }

    root.innerHTML=
      '<div class="qifc-head">'+
        '<button type="button" class="qifc-nav" data-qifc-prev aria-label="이전 달">‹</button>'+
        '<div class="qifc-title">'+viewYear+'년 '+(viewMonth+1)+'월</div>'+
        '<button type="button" class="qifc-nav" data-qifc-next aria-label="다음 달">›</button>'+
      '</div>'+
      '<div class="qifc-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qifc-grid">'+cells.join("")+'</div>'+
      '<div class="qifc-actions">'+
        '<button type="button" class="qifc-btn" data-qifc-clear>지우기</button>'+
        '<button type="button" class="qifc-btn" data-qifc-close>닫기</button>'+
        '<button type="button" class="qifc-btn today" data-qifc-today>오늘</button>'+
      '</div>';
  }

  function open(input){
    ensureStyle();
    if(!patch(input)) return;
    activeInput=input;
    const d=parse(input.value);
    viewYear=d.getFullYear();
    viewMonth=d.getMonth();
    render();
  }

  function setValue(value){
    if(!activeInput) return;
    const input=activeInput;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    try{setter?setter.call(input,value):(input.value=value);}catch(_){input.value=value;}
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    close();
  }

  // Capture before browser native date UI or older handlers.
  window.addEventListener("pointerdown",event=>{
    const target=event.target;
    if(target instanceof Element&&target.closest("#"+ROOT_ID)) return;

    if(target instanceof HTMLInputElement&&isDateField(target)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      try{target.focus({preventScroll:true});}catch(_){target.focus();}
      open(target);
    }
  },true);

  window.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    if(target.closest("#"+ROOT_ID)) return;
    if(target instanceof HTMLInputElement&&isDateField(target)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      open(target);
    }
  },true);

  document.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target?.closest("#"+ROOT_ID)) return;
    event.preventDefault();
    event.stopPropagation();

    const day=target.closest("[data-qifc-date]");
    if(day){setValue(day.getAttribute("data-qifc-date")||"");return;}
    if(target.closest("[data-qifc-prev]")){viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--;}render();return;}
    if(target.closest("[data-qifc-next]")){viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++;}render();return;}
    if(target.closest("[data-qifc-clear]")){setValue("");return;}
    if(target.closest("[data-qifc-close]")){close();return;}
    if(target.closest("[data-qifc-today]")){
      const d=new Date();
      const value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      if(inRange(value)) setValue(value);
    }
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeInput){event.preventDefault();close();}
  },true);

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

  window.qmesInlineFixedCalendar={open,close,scan,patch};
})();