/* QMES FIXED CALENDAR - REFERENCE MATCH V3 - 2026-09-21
 * Current-only calendar owner with integrated corner resize.
 * Fixed compact popup matching the approved reference:
 * [prev] [year select] [month select] [next]
 * weekday row, adjacent-month days, blue selected day, Today + orange dot.
 * Four-corner proportional resize. No legacy calendar loader.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_REFERENCE_20260921_V3__) return;
  window.__QMES_FIXED_CALENDAR_REFERENCE_20260921_V3__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v3-pop";
  const STYLE_ID="qmes-fixed-calendar-reference-20260921-v3-style";
  let activeInput=null, viewYear=0, viewMonth=0;
  let resizeState=null;
  let suppressResizeClickUntil=0;
  const RESIZE_KEY="qmes-fixed-calendar-reference-v3-scale";
  const MIN_SCALE=.78;
  const MAX_SCALE=1.35;

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
        width:282px!important;
        padding:8px 9px 10px!important;
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
        grid-template-columns:20px 1fr 20px!important;
        align-items:center!important;
        gap:2px!important;
        min-height:27px!important;
        margin-bottom:4px!important;
      }
      #${POP_ID} .qf-nav{
        width:20px!important;height:27px!important;
        display:grid!important;place-items:center!important;
        padding:0!important;
        border:0!important;
        border-radius:5px!important;
        background:transparent!important;
        color:#475569!important;
        font-size:15px!important;
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
        height:26px!important;
        padding:0 18px 0 7px!important;
        border:1px solid #d5dde4!important;
        border-radius:5px!important;
        background:#fff!important;
        color:#334155!important;
        font-size:11.5px!important;
        font-weight:500!important;
        outline:none!important;
        cursor:pointer!important;
        flex:0 0 auto!important;
        max-width:none!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
      }
      #${POP_ID} .qf-year{width:96px!important;min-width:96px!important;max-width:96px!important}
      #${POP_ID} .qf-month{width:96px!important;min-width:96px!important;max-width:96px!important}

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
        color:#394957!important;
        font-size:10px!important;
        font-weight:650!important;
        cursor:pointer!important;
      }
      #${POP_ID} .qf-day:hover{background:#f1f5f8!important}
      #${POP_ID} .qf-day.sun{color:#ef4444!important}
      #${POP_ID} .qf-day.sat{color:#1492de!important}
      #${POP_ID} .qf-day.other{color:#aeb8c1!important;font-weight:600!important}
      #${POP_ID} .qf-day.selected{
        background:#3158d7!important;
        color:#fff!important;
        font-weight:700!important;
      }
      #${POP_ID} .qf-day:disabled{opacity:.25!important;cursor:not-allowed!important}

      #${POP_ID} .qf-foot{
        height:24px!important;
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

      #${POP_ID}{
        transform-origin:top left!important;
        overflow:visible!important;
        will-change:transform,left,top!important;
      }
      #${POP_ID} .qf-resize-handle{
        position:absolute!important;
        width:20px!important;
        height:20px!important;
        z-index:2147483647!important;
        padding:0!important;
        margin:0!important;
        border:0!important;
        background:transparent!important;
        touch-action:none!important;
        user-select:none!important;
      }
      #${POP_ID} .qf-resize-handle[data-corner="nw"]{left:-5px!important;top:-5px!important;cursor:nwse-resize!important}
      #${POP_ID} .qf-resize-handle[data-corner="ne"]{right:-5px!important;top:-5px!important;cursor:nesw-resize!important}
      #${POP_ID} .qf-resize-handle[data-corner="sw"]{left:-5px!important;bottom:-5px!important;cursor:nesw-resize!important}
      #${POP_ID} .qf-resize-handle[data-corner="se"]{right:-5px!important;bottom:-5px!important;cursor:nwse-resize!important}
      #${POP_ID} .qf-resize-handle::before,
      #${POP_ID} .qf-resize-handle::after{
        content:""!important;
        position:absolute!important;
        background:#79a8c6!important;
        opacity:.95!important;
        pointer-events:none!important;
      }
      #${POP_ID} .qf-resize-handle::before{width:9px!important;height:2px!important}
      #${POP_ID} .qf-resize-handle::after{width:2px!important;height:9px!important}
      #${POP_ID} .qf-resize-handle[data-corner="nw"]::before,
      #${POP_ID} .qf-resize-handle[data-corner="nw"]::after{left:2px!important;top:2px!important}
      #${POP_ID} .qf-resize-handle[data-corner="ne"]::before,
      #${POP_ID} .qf-resize-handle[data-corner="ne"]::after{right:2px!important;top:2px!important}
      #${POP_ID} .qf-resize-handle[data-corner="sw"]::before,
      #${POP_ID} .qf-resize-handle[data-corner="sw"]::after{left:2px!important;bottom:2px!important}
      #${POP_ID} .qf-resize-handle[data-corner="se"]::before,
      #${POP_ID} .qf-resize-handle[data-corner="se"]::after{right:2px!important;bottom:2px!important}
      body.qmes-fixed-calendar-resizing,
      body.qmes-fixed-calendar-resizing *{user-select:none!important}
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
    if(resizeState) return;
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

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function readScale(){
    try{
      const n=Number(localStorage.getItem(RESIZE_KEY));
      return Number.isFinite(n)?clamp(n,MIN_SCALE,MAX_SCALE):1;
    }catch(_){return 1;}
  }

  function saveScale(n){
    try{localStorage.setItem(RESIZE_KEY,String(clamp(n,MIN_SCALE,MAX_SCALE)));}catch(_){}
  }

  function applyScale(pop,scale){
    if(!pop) return;
    const next=clamp(scale,MIN_SCALE,MAX_SCALE);
    pop.dataset.qmesCalendarScale=String(next);
    pop.style.setProperty("transform","scale("+next+")","important");
  }

  function currentScale(pop){
    const n=Number(pop?.dataset?.qmesCalendarScale);
    return Number.isFinite(n)?clamp(n,MIN_SCALE,MAX_SCALE):readScale();
  }

  function clampPopup(pop){
    if(!pop||resizeState) return;
    const r=pop.getBoundingClientRect();
    let left=parseFloat(pop.style.left);
    let top=parseFloat(pop.style.top);
    if(!Number.isFinite(left)) left=r.left;
    if(!Number.isFinite(top)) top=r.top;
    if(r.left<8) left+=8-r.left;
    if(r.top<8) top+=8-r.top;
    if(r.right>window.innerWidth-8) left-=r.right-(window.innerWidth-8);
    if(r.bottom>window.innerHeight-8) top-=r.bottom-(window.innerHeight-8);
    pop.style.setProperty("left",Math.round(left)+"px","important");
    pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function stopResize(event){
    if(!resizeState) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    const state=resizeState;
    const scale=currentScale(state.pop);
    try{state.handle.releasePointerCapture?.(state.pointerId);}catch(_){}

    resizeState=null;
    suppressResizeClickUntil=Date.now()+500;
    document.body.classList.remove("qmes-fixed-calendar-resizing");

    window.removeEventListener("pointermove",moveResize,true);
    window.removeEventListener("pointerup",stopResize,true);
    window.removeEventListener("pointercancel",stopResize,true);
    window.removeEventListener("blur",stopResize,true);

    saveScale(scale);
    requestAnimationFrame(()=>clampPopup(state.pop));
  }

  function moveResize(event){
    if(!resizeState) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const s=resizeState;
    const dx=event.clientX-s.startX;
    const dy=event.clientY-s.startY;
    const widthDelta=(s.corner==="nw"||s.corner==="sw")?-dx:dx;
    const heightDelta=(s.corner==="nw"||s.corner==="ne")?-dy:dy;
    const sx=(s.startRect.width+widthDelta)/s.baseW;
    const sy=(s.startRect.height+heightDelta)/s.baseH;
    const next=clamp(
      Math.abs(sx-s.startScale)>=Math.abs(sy-s.startScale)?sx:sy,
      MIN_SCALE,
      MAX_SCALE
    );

    const w=s.baseW*next;
    const h=s.baseH*next;
    let left=s.anchorLeft;
    let top=s.anchorTop;

    if(s.corner==="nw"||s.corner==="sw") left=s.anchorRight-w;
    if(s.corner==="nw"||s.corner==="ne") top=s.anchorBottom-h;

    left=clamp(left,8,Math.max(8,window.innerWidth-w-8));
    top=clamp(top,8,Math.max(8,window.innerHeight-h-8));

    applyScale(s.pop,next);
    s.pop.style.setProperty("left",Math.round(left)+"px","important");
    s.pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function startResize(event,handle,pop){
    if(event.pointerType!=="touch"&&event.button!==0) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const rect=pop.getBoundingClientRect();
    resizeState={
      handle,
      pop,
      pointerId:event.pointerId,
      corner:handle.dataset.corner||"se",
      startX:event.clientX,
      startY:event.clientY,
      startRect:rect,
      startScale:currentScale(pop),
      baseW:Math.max(1,pop.offsetWidth),
      baseH:Math.max(1,pop.offsetHeight),
      anchorLeft:rect.left,
      anchorTop:rect.top,
      anchorRight:rect.right,
      anchorBottom:rect.bottom
    };

    document.body.classList.add("qmes-fixed-calendar-resizing");
    try{handle.setPointerCapture?.(event.pointerId);}catch(_){}

    window.addEventListener("pointermove",moveResize,true);
    window.addEventListener("pointerup",stopResize,true);
    window.addEventListener("pointercancel",stopResize,true);
    window.addEventListener("blur",stopResize,true);
  }

  function installResizeHandles(pop){
    if(!pop) return;
    pop.querySelectorAll(".qf-resize-handle").forEach(el=>el.remove());

    ["nw","ne","sw","se"].forEach(corner=>{
      const handle=document.createElement("span");
      handle.className="qf-resize-handle";
      handle.dataset.corner=corner;
      handle.setAttribute("role","separator");
      handle.setAttribute("aria-label","달력 크기 조절");
      pop.appendChild(handle);
    });
  }

  function position(){
    const pop=document.getElementById(POP_ID);
    if(!pop||!activeInput) return;
    const r=activeInput.getBoundingClientRect();
    const w=282, h=248, gap=5;
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

    installResizeHandles(pop);
    applyScale(pop,readScale());
    position();
    requestAnimationFrame(()=>clampPopup(pop));
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

    const resizeHandle=t instanceof Element?t.closest("#"+POP_ID+" .qf-resize-handle"):null;
    if(resizeHandle){
      const pop=resizeHandle.closest("#"+POP_ID);
      if(pop) startResize(e,resizeHandle,pop);
      return;
    }

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

    if(t.closest("#"+POP_ID+" .qf-resize-handle") || (Date.now()<suppressResizeClickUntil&&t.closest("#"+POP_ID))){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    if(t instanceof HTMLInputElement&&isDateField(t)){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      open(t);
      return;
    }

    if(!t.closest("#"+POP_ID)) return;

    // Native year/month selects must receive their normal click behavior.
    // Preventing the default click here blocks opening/changing the selector.
    if(t.closest("[data-qf-year],[data-qf-month]")) return;

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

  window.addEventListener("resize",()=>{if(activeInput&&!resizeState){position();requestAnimationFrame(()=>clampPopup(document.getElementById(POP_ID)));}});
  window.addEventListener("scroll",()=>{if(activeInput&&!resizeState){position();requestAnimationFrame(()=>clampPopup(document.getElementById(POP_ID)));}},true);

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