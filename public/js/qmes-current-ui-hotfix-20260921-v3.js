/* QMES CURRENT UI HOTFIX - 2026-09-21 V3
 * CURRENT-ONLY patch.
 * - Removes only WORKSPACE "SPC 대시보드" duplicate.
 * - Keeps MES · QMS "SPC (Cpk)".
 * - Provides one stable fixed calendar for every current QMES date input,
 *   including Sales edit "요청 납기일".
 */
(function(){
  "use strict";
  if(window.__QMES_CURRENT_UI_HOTFIX_20260921_V3__) return;
  window.__QMES_CURRENT_UI_HOTFIX_20260921_V3__=true;

  const PICKER_ID="qmes-current-date-picker-20260921-v3";
  const STYLE_ID="qmes-current-date-picker-20260921-v3-style";
  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const pad=n=>String(n).padStart(2,"0");
  const toIso=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
  const isIso=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));

  function removeWorkspaceSpc(){
    const sidebar=document.getElementById("qmes-erp-sidebar");
    if(!sidebar) return;

    const sections=[...sidebar.querySelectorAll(".qmes-erp-section")];
    const workspace=sections.find(el=>clean(el.textContent)==="WORKSPACE");

    if(workspace){
      let node=workspace.nextElementSibling;
      while(node && !node.classList.contains("qmes-erp-section")){
        const next=node.nextElementSibling;
        if(node.matches("button,.qmes-erp-item") && clean(node.textContent)==="SPC 대시보드"){
          node.remove();
        }
        node=next;
      }
    }

    sidebar.querySelectorAll(".qmes-erp-item,button").forEach(btn=>{
      if(clean(btn.textContent)==="SPC 대시보드") btn.remove();
    });
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      input[data-qmes-current-date="1"]{
        cursor:pointer!important;
        background-color:#fff!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23566f82' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='2'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E")!important;
        background-repeat:no-repeat!important;
        background-position:calc(100% - 10px) 50%!important;
        background-size:17px 17px!important;
        padding-right:36px!important;
        font-variant-numeric:tabular-nums!important;
      }

      #${PICKER_ID}{
        position:fixed!important;
        z-index:2147483647!important;
        width:330px!important;
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
      #${PICKER_ID},#${PICKER_ID} *{box-sizing:border-box!important}
      #${PICKER_ID} .qcdp-head{
        display:grid!important;
        grid-template-columns:36px 1fr 36px!important;
        align-items:center!important;
        gap:7px!important;
        height:38px!important;
        margin-bottom:6px!important;
      }
      #${PICKER_ID} .qcdp-nav{
        width:36px!important;height:34px!important;
        display:grid!important;place-items:center!important;
        padding:0!important;border:1px solid #d8e2eb!important;
        border-radius:7px!important;background:#f8fafc!important;
        color:#334e65!important;font-size:20px!important;font-weight:900!important;
        cursor:pointer!important;
      }
      #${PICKER_ID} .qcdp-title{
        text-align:center!important;
        color:#1f3449!important;
        font-size:14px!important;
        font-weight:900!important;
        white-space:nowrap!important;
      }
      #${PICKER_ID} .qcdp-week,
      #${PICKER_ID} .qcdp-grid{
        display:grid!important;
        grid-template-columns:repeat(7,1fr)!important;
        gap:3px!important;
      }
      #${PICKER_ID} .qcdp-week{
        padding-bottom:4px!important;
        border-bottom:1px solid #edf2f6!important;
        margin-bottom:4px!important;
      }
      #${PICKER_ID} .qcdp-week span{
        height:24px!important;
        display:grid!important;place-items:center!important;
        color:#75889a!important;font-size:10px!important;font-weight:850!important;
      }
      #${PICKER_ID} .qcdp-week span:first-child{color:#cf3d45!important}
      #${PICKER_ID} .qcdp-week span:last-child{color:#2e6eb4!important}
      #${PICKER_ID} .qcdp-day{
        width:100%!important;height:34px!important;
        display:grid!important;place-items:center!important;
        padding:0!important;border:1px solid transparent!important;
        border-radius:7px!important;background:#fff!important;
        color:#31475b!important;font-size:11px!important;font-weight:750!important;
        cursor:pointer!important;
      }
      #${PICKER_ID} .qcdp-day:hover{
        background:#edf6fc!important;border-color:#c7dfef!important;color:#125f90!important;
      }
      #${PICKER_ID} .qcdp-day.other{color:#b0bcc6!important}
      #${PICKER_ID} .qcdp-day.sun{color:#c9444d!important}
      #${PICKER_ID} .qcdp-day.sat{color:#2e6eb4!important}
      #${PICKER_ID} .qcdp-day.today{border-color:#7daed0!important}
      #${PICKER_ID} .qcdp-day.selected{
        background:#1687c6!important;border-color:#1687c6!important;color:#fff!important;font-weight:900!important;
      }
      #${PICKER_ID} .qcdp-day:disabled{opacity:.28!important;cursor:not-allowed!important}
      #${PICKER_ID} .qcdp-foot{
        display:flex!important;align-items:center!important;gap:7px!important;
        margin-top:8px!important;padding-top:9px!important;border-top:1px solid #edf2f6!important;
      }
      #${PICKER_ID} .qcdp-btn{
        height:32px!important;padding:0 11px!important;
        border:1px solid #d6e0e8!important;border-radius:7px!important;
        background:#fff!important;color:#465d70!important;
        font-size:10px!important;font-weight:850!important;cursor:pointer!important;
      }
      #${PICKER_ID} .qcdp-today{
        margin-left:auto!important;
        border-color:#a9cfb6!important;background:#f0faf3!important;color:#1d7741!important;
      }
      @media(max-width:520px){
        #${PICKER_ID}{width:calc(100vw - 16px)!important;max-width:330px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function shouldPatch(input){
    if(!(input instanceof HTMLInputElement)) return false;
    if(input.dataset.qmesCurrentDate==="1") return true;
    if(input.type==="date") return true;
    if(input.name==="due") return true;
    return false;
  }

  function patchInput(input){
    if(!(input instanceof HTMLInputElement) || !shouldPatch(input)) return;
    if(!input.dataset.qmesDateMin) input.dataset.qmesDateMin=input.min||"";
    if(!input.dataset.qmesDateMax) input.dataset.qmesDateMax=input.max||"";
    input.dataset.qmesCurrentDate="1";
    if(input.type!=="text"){
      try{input.type="text";}catch(_){input.setAttribute("type","text");}
    }
    input.setAttribute("autocomplete","off");
    input.setAttribute("inputmode","numeric");
    input.setAttribute("aria-haspopup","dialog");
    if(!input.placeholder) input.placeholder="YYYY-MM-DD";
  }

  function scan(root=document){
    if(root instanceof HTMLInputElement) patchInput(root);
    root.querySelectorAll?.('input[type="date"],input[name="due"],input[data-qmes-current-date="1"]').forEach(patchInput);
  }

  function parseValue(value){
    if(isIso(value)){
      const [y,m,d]=value.split("-").map(Number);
      const dt=new Date(y,m-1,d);
      if(dt.getFullYear()===y && dt.getMonth()===m-1 && dt.getDate()===d) return dt;
    }
    return new Date();
  }

  function inRange(value){
    if(!activeInput) return true;
    const min=clean(activeInput.dataset.qmesDateMin);
    const max=clean(activeInput.dataset.qmesDateMax);
    if(min && isIso(min) && value<min) return false;
    if(max && isIso(max) && value>max) return false;
    return true;
  }

  function close(){
    document.getElementById(PICKER_ID)?.remove();
    activeInput=null;
  }

  function position(){
    const picker=document.getElementById(PICKER_ID);
    if(!picker || !activeInput) return;
    const rect=activeInput.getBoundingClientRect();
    const w=picker.offsetWidth||330;
    const h=picker.offsetHeight||350;
    const gap=6;

    let left=rect.left;
    if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
    if(left<8) left=8;

    let top=rect.bottom+gap;
    if(top+h>window.innerHeight-8) top=rect.top-h-gap;
    if(top<8) top=8;

    picker.style.left=Math.round(left)+"px";
    picker.style.top=Math.round(top)+"px";
  }

  function render(){
    if(!activeInput || !document.documentElement.contains(activeInput)){close();return;}

    let picker=document.getElementById(PICKER_ID);
    if(!picker){
      picker=document.createElement("div");
      picker.id=PICKER_ID;
      picker.setAttribute("role","dialog");
      picker.setAttribute("aria-label","날짜 선택");
      document.body.appendChild(picker);
    }

    const selected=isIso(activeInput.value)?activeInput.value:"";
    const now=new Date();
    const today=toIso(now.getFullYear(),now.getMonth()+1,now.getDate());
    const first=new Date(viewYear,viewMonth,1);
    const start=new Date(viewYear,viewMonth,1-first.getDay());

    const cells=[];
    for(let i=0;i<42;i++){
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const value=toIso(d.getFullYear(),d.getMonth()+1,d.getDate());
      const dow=d.getDay();
      const other=d.getMonth()!==viewMonth;
      const disabled=!inRange(value);
      const classes=[
        "qcdp-day",
        other?"other":"",
        dow===0?"sun":"",
        dow===6?"sat":"",
        value===today?"today":"",
        value===selected?"selected":""
      ].filter(Boolean).join(" ");
      cells.push('<button type="button" class="'+classes+'" data-qcdp-date="'+value+'"'+(disabled?' disabled':'')+'>'+d.getDate()+'</button>');
    }

    picker.innerHTML=
      '<div class="qcdp-head">'+
        '<button type="button" class="qcdp-nav" data-qcdp-prev aria-label="이전 달">‹</button>'+
        '<div class="qcdp-title">'+viewYear+'년 '+(viewMonth+1)+'월</div>'+
        '<button type="button" class="qcdp-nav" data-qcdp-next aria-label="다음 달">›</button>'+
      '</div>'+
      '<div class="qcdp-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qcdp-grid">'+cells.join("")+'</div>'+
      '<div class="qcdp-foot">'+
        '<button type="button" class="qcdp-btn" data-qcdp-clear>지우기</button>'+
        '<button type="button" class="qcdp-btn" data-qcdp-close>닫기</button>'+
        '<button type="button" class="qcdp-btn qcdp-today" data-qcdp-today>오늘</button>'+
      '</div>';

    position();
  }

  function open(input){
    ensureStyle();
    patchInput(input);
    activeInput=input;
    const dt=parseValue(input.value);
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
    setTimeout(()=>{try{input.focus({preventScroll:true});}catch(_){input.focus();}},0);
  }

  window.addEventListener("pointerdown",event=>{
    const el=event.target;
    if(el instanceof Element && el.closest("#"+PICKER_ID)) return;

    if(el instanceof HTMLInputElement && shouldPatch(el)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      patchInput(el);
      open(el);
      return;
    }

    if(activeInput) close();
  },true);

  window.addEventListener("click",event=>{
    const el=event.target;
    if(el instanceof Element && el.closest("#"+PICKER_ID)) return;
    if(el instanceof HTMLInputElement && shouldPatch(el)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      open(el);
    }
  },true);

  document.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target?.closest("#"+PICKER_ID)) return;

    event.preventDefault();
    event.stopPropagation();

    const day=target.closest("[data-qcdp-date]");
    if(day){
      const value=clean(day.getAttribute("data-qcdp-date"));
      if(value && inRange(value)) setValue(value);
      return;
    }
    if(target.closest("[data-qcdp-prev]")){
      viewMonth--;
      if(viewMonth<0){viewMonth=11;viewYear--;}
      render();
      return;
    }
    if(target.closest("[data-qcdp-next]")){
      viewMonth++;
      if(viewMonth>11){viewMonth=0;viewYear++;}
      render();
      return;
    }
    if(target.closest("[data-qcdp-clear]")){setValue("");return;}
    if(target.closest("[data-qcdp-close]")){close();return;}
    if(target.closest("[data-qcdp-today]")){
      const d=new Date();
      const value=toIso(d.getFullYear(),d.getMonth()+1,d.getDate());
      if(inRange(value)) setValue(value);
    }
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && activeInput){event.preventDefault();close();}
  },true);

  window.addEventListener("resize",()=>{if(activeInput)position();});
  window.addEventListener("scroll",()=>{if(activeInput)position();},true);

  ensureStyle();
  removeWorkspaceSpc();
  scan();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        scan(node);
      }
    }
    removeWorkspaceSpc();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  [100,300,700,1500,3000].forEach(ms=>setTimeout(()=>{
    removeWorkspaceSpc();
    scan();
  },ms));

  window.qmesCurrentDatePicker={open,close,scan,patch:patchInput};
})();