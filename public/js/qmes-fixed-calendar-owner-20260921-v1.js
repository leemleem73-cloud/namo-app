/* QMES FIXED CALENDAR OWNER - CURRENT UI - 2026-09-21
 * One fixed calendar for every QMES date field.
 * Current Sales period, Sales edit due date, and New Sales date fields included.
 * Does not load any retired/legacy calendar file.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_OWNER_20260921_V1__) return;
  window.__QMES_FIXED_CALENDAR_OWNER_20260921_V1__=true;

  const STYLE_ID="qmes-fixed-calendar-owner-20260921-v1-style";
  const POP_ID="qmes-fixed-calendar-owner-20260921-v1-pop";
  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));
  let activeInput=null, viewYear=0, viewMonth=0;

  function isCurrentDateField(input){
    if(!(input instanceof HTMLInputElement)) return false;
    if(input.type==="date") return true;
    if(input.dataset.qmesFixedDate==="1") return true;
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
      input[data-qmes-fixed-date="1"]{
        color-scheme:light!important;
        appearance:none!important;
        -webkit-appearance:none!important;
        background-color:#fff!important;
        color:#172033!important;
        -webkit-text-fill-color:#172033!important;
        cursor:pointer!important;
        padding-right:38px!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='17' rx='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E")!important;
        background-position:calc(100% - 11px) 50%!important;
        background-size:18px 18px!important;
        background-repeat:no-repeat!important;
      }
      input[data-qmes-fixed-date="1"]::-webkit-calendar-picker-indicator{display:none!important}
      #${POP_ID}{
        position:fixed!important;
        z-index:2147483647!important;
        width:304px!important;
        padding:13px!important;
        border:1px solid #d7dee8!important;
        border-radius:13px!important;
        background:#fff!important;
        color:#172033!important;
        box-shadow:0 20px 60px rgba(15,23,42,.30)!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        box-sizing:border-box!important;
        user-select:none!important;
      }
      #${POP_ID} *{box-sizing:border-box!important}
      #${POP_ID} .qdp-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-bottom:10px!important}
      #${POP_ID} .qdp-title{flex:1!important;text-align:center!important;font-size:14px!important;font-weight:900!important;color:#1e293b!important}
      #${POP_ID} .qdp-nav{width:34px!important;height:34px!important;border:1px solid #dbe2ea!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:19px!important;font-weight:900!important;cursor:pointer!important}
      #${POP_ID} .qdp-nav:hover{background:#f3f6fb!important}
      #${POP_ID} .qdp-week,#${POP_ID} .qdp-grid{display:grid!important;grid-template-columns:repeat(7,1fr)!important;gap:3px!important}
      #${POP_ID} .qdp-week span{height:25px!important;display:grid!important;place-items:center!important;color:#8491a3!important;font-size:10px!important;font-weight:850!important}
      #${POP_ID} .qdp-week span:first-child{color:#dc2626!important}
      #${POP_ID} .qdp-week span:last-child{color:#2563eb!important}
      #${POP_ID} .qdp-day{height:34px!important;border:0!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important}
      #${POP_ID} .qdp-day:hover{background:#eef4ff!important;color:#2457d6!important}
      #${POP_ID} .qdp-day.is-today{outline:1px solid #8eacf6!important;color:#2457d6!important}
      #${POP_ID} .qdp-day.is-selected{background:#2864df!important;color:#fff!important;outline:0!important}
      #${POP_ID} .qdp-day:disabled{opacity:.28!important;cursor:not-allowed!important}
      #${POP_ID} .qdp-empty{height:34px!important}
      #${POP_ID} .qdp-actions{display:flex!important;justify-content:space-between!important;gap:7px!important;margin-top:11px!important;padding-top:10px!important;border-top:1px solid #edf1f5!important}
      #${POP_ID} .qdp-action{height:32px!important;padding:0 11px!important;border:1px solid #dbe2ea!important;border-radius:7px!important;background:#fff!important;color:#475569!important;font-size:10px!important;font-weight:850!important;cursor:pointer!important}
      #${POP_ID} .qdp-action.primary{margin-left:auto!important;background:#2864df!important;border-color:#2864df!important;color:#fff!important}
    `;
    document.head.appendChild(s);
  }

  function patch(input){
    if(!isCurrentDateField(input)) return false;
    if(!input.dataset.qmesDateMin) input.dataset.qmesDateMin=input.min||"";
    if(!input.dataset.qmesDateMax) input.dataset.qmesDateMax=input.max||"";
    input.dataset.qmesFixedDate="1";
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
    root.querySelectorAll?.('input[type="date"],.qrl-date input,#qmes-sales-edit-force-v2 input[name="due"],#qmes-sales-new-order-integrated-v11 input[name="orderDate"],#qmes-sales-new-order-integrated-v11 input[name="due"],#qmes-sales-new-order-integrated-v11 input[name="plannedProductionDate"],#qmes-sales-new-order-integrated-v11 input[name="oqcDate"],input[data-qmes-fixed-date="1"]').forEach(patch);
  }

  function parseDate(value){
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

  function position(){
    const pop=document.getElementById(POP_ID);
    if(!pop||!activeInput) return;
    const r=activeInput.getBoundingClientRect(),w=304,h=390;
    let left=Math.min(Math.max(8,r.left),Math.max(8,window.innerWidth-w-8));
    let top=r.bottom+7;
    if(top+h>window.innerHeight-8) top=Math.max(8,r.top-h-7);
    pop.style.left=left+"px";
    pop.style.top=top+"px";
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

    const first=new Date(viewYear,viewMonth,1);
    const days=new Date(viewYear,viewMonth+1,0).getDate();
    const offset=first.getDay();
    const now=new Date();
    const today=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
    const selected=valid(activeInput.value)?activeInput.value:"";
    const cells=[];
    for(let i=0;i<offset;i++) cells.push('<span class="qdp-empty"></span>');
    for(let d=1;d<=days;d++){
      const value=iso(viewYear,viewMonth+1,d);
      cells.push('<button type="button" class="qdp-day'+(value===today?' is-today':'')+(value===selected?' is-selected':'')+'" data-qdp-date="'+value+'"'+(!inRange(value)?' disabled':'')+'>'+d+'</button>');
    }

    pop.innerHTML=
      '<div class="qdp-head">'+
        '<button type="button" class="qdp-nav" data-qdp-prev aria-label="이전 달">‹</button>'+
        '<div class="qdp-title">'+viewYear+'년 '+(viewMonth+1)+'월</div>'+
        '<button type="button" class="qdp-nav" data-qdp-next aria-label="다음 달">›</button>'+
      '</div>'+
      '<div class="qdp-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qdp-grid">'+cells.join("")+'</div>'+
      '<div class="qdp-actions">'+
        '<button type="button" class="qdp-action" data-qdp-clear>지우기</button>'+
        '<button type="button" class="qdp-action" data-qdp-close>닫기</button>'+
        '<button type="button" class="qdp-action primary" data-qdp-today>오늘</button>'+
      '</div>';
    position();
  }

  function open(input){
    if(!patch(input)) return;
    activeInput=input;
    const dt=parseDate(input.value);
    viewYear=dt.getFullYear();
    viewMonth=dt.getMonth();
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

  document.addEventListener("pointerdown",event=>{
    const t=event.target;
    if(t instanceof HTMLInputElement&&isCurrentDateField(t)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      try{t.focus({preventScroll:true});}catch(_){t.focus();}
      open(t);
      return;
    }
    if(!(t instanceof Element&&t.closest("#"+POP_ID))&&activeInput) close();
  },true);

  document.addEventListener("click",event=>{
    const t=event.target instanceof Element?event.target:null;
    if(!t) return;
    if(t instanceof HTMLInputElement&&isCurrentDateField(t)){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();open(t);return;
    }
    if(!t.closest("#"+POP_ID)) return;
    event.preventDefault();event.stopPropagation();
    const day=t.closest("[data-qdp-date]");
    if(day){setValue(day.getAttribute("data-qdp-date")||"");return;}
    if(t.closest("[data-qdp-prev]")){viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--;}render();return;}
    if(t.closest("[data-qdp-next]")){viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++;}render();return;}
    if(t.closest("[data-qdp-clear]")){setValue("");return;}
    if(t.closest("[data-qdp-close]")){close();return;}
    if(t.closest("[data-qdp-today]")){
      const d=new Date(),v=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      if(inRange(v)) setValue(v);
    }
  },true);

  document.addEventListener("focusin",event=>{
    const t=event.target;
    if(t instanceof HTMLInputElement&&isCurrentDateField(t)) open(t);
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeInput){event.preventDefault();close();}
  },true);

  window.addEventListener("resize",()=>{if(activeInput)position();});
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

  window.qmesFixedCalendar={open,close,scan,patch};
})();