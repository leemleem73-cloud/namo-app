/* NAMO QMES - stable date picker - 2026-08-31
 * ADD-ONLY patch.
 * Some Chrome/Windows clients render the native <input type="date"> popup as a
 * large blank white panel. Convert QMES date fields to a lightweight in-app
 * calendar while preserving YYYY-MM-DD values and input/change events.
 */
(function(){
  "use strict";
  if(window.__QMES_DATE_PICKER_STABLE_20260831_V1__) return;
  window.__QMES_DATE_PICKER_STABLE_20260831_V1__=true;

  const STYLE_ID="qmes-date-picker-stable-style-20260831-v1";
  const POP_ID="qmes-date-picker-stable-pop-20260831-v1";
  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
  const valid=v=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(v));
  let activeInput=null;
  let viewYear=0;
  let viewMonth=0;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      input[data-qmes-date-stable="1"]{color-scheme:light!important;appearance:none!important;-webkit-appearance:none!important;background:#fff!important;color:#172033!important;-webkit-text-fill-color:#172033!important;cursor:pointer!important;padding-right:36px!important;background-image:linear-gradient(45deg,transparent 50%,#64748b 50%),linear-gradient(135deg,#64748b 50%,transparent 50%)!important;background-position:calc(100% - 17px) 50%,calc(100% - 12px) 50%!important;background-size:5px 5px,5px 5px!important;background-repeat:no-repeat!important}
      #${POP_ID}{position:fixed!important;z-index:2147483600!important;width:286px!important;padding:12px!important;border:1px solid #d7dee8!important;border-radius:12px!important;background:#fff!important;color:#172033!important;box-shadow:0 18px 48px rgba(15,23,42,.24)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;box-sizing:border-box!important}
      #${POP_ID} *{box-sizing:border-box!important}#${POP_ID} .qdp-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-bottom:9px!important}#${POP_ID} .qdp-title{flex:1!important;text-align:center!important;font-size:13px!important;font-weight:900!important;color:#1e293b!important}#${POP_ID} .qdp-nav{width:31px!important;height:31px!important;border:1px solid #dbe2ea!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:16px!important;font-weight:900!important;cursor:pointer!important}#${POP_ID} .qdp-week,#${POP_ID} .qdp-grid{display:grid!important;grid-template-columns:repeat(7,1fr)!important;gap:3px!important}#${POP_ID} .qdp-week span{height:24px!important;display:grid!important;place-items:center!important;color:#94a3b8!important;font-size:9px!important;font-weight:850!important}#${POP_ID} .qdp-day{height:31px!important;border:0!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:10.5px!important;font-weight:750!important;cursor:pointer!important}#${POP_ID} .qdp-day:hover{background:#eef4ff!important;color:#2457d6!important}#${POP_ID} .qdp-day.is-today{outline:1px solid #9db7f6!important}#${POP_ID} .qdp-day.is-selected{background:#2864df!important;color:#fff!important}#${POP_ID} .qdp-day:disabled{opacity:.28!important;cursor:not-allowed!important}#${POP_ID} .qdp-empty{height:31px!important}#${POP_ID} .qdp-actions{display:flex!important;justify-content:flex-end!important;gap:6px!important;margin-top:10px!important;padding-top:9px!important;border-top:1px solid #edf1f5!important}#${POP_ID} .qdp-action{height:30px!important;padding:0 9px!important;border:1px solid #dbe2ea!important;border-radius:7px!important;background:#fff!important;color:#475569!important;font-size:9.5px!important;font-weight:850!important;cursor:pointer!important}#${POP_ID} .qdp-action.primary{background:#eef4ff!important;border-color:#d8e5ff!important;color:#2457d6!important}
    `;
    document.head.appendChild(s);
  }

  function parseDate(value){
    if(valid(value)){
      const [y,m,d]=value.split("-").map(Number);
      const dt=new Date(y,m-1,d);
      if(dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d) return dt;
    }
    return new Date();
  }
  function minMaxOk(value,input){
    const min=clean(input?.dataset?.qmesDateMin||"");
    const max=clean(input?.dataset?.qmesDateMax||"");
    if(min&&valid(min)&&value<min) return false;
    if(max&&valid(max)&&value>max) return false;
    return true;
  }
  function setValue(value){
    if(!activeInput) return;
    activeInput.value=value;
    activeInput.dispatchEvent(new Event("input",{bubbles:true}));
    activeInput.dispatchEvent(new Event("change",{bubbles:true}));
    close();
  }
  function close(){document.getElementById(POP_ID)?.remove();activeInput=null;}

  function render(){
    if(!activeInput) return;
    let pop=document.getElementById(POP_ID);
    if(!pop){pop=document.createElement("div");pop.id=POP_ID;document.body.appendChild(pop);}
    const first=new Date(viewYear,viewMonth,1),days=new Date(viewYear,viewMonth+1,0).getDate(),offset=first.getDay();
    const today=new Date(),todayIso=iso(today.getFullYear(),today.getMonth()+1,today.getDate()),selected=valid(activeInput.value)?activeInput.value:"";
    const cells=[];
    for(let i=0;i<offset;i++)cells.push('<span class="qdp-empty"></span>');
    for(let d=1;d<=days;d++){
      const value=iso(viewYear,viewMonth+1,d),disabled=!minMaxOk(value,activeInput);
      cells.push(`<button type="button" class="qdp-day${value===todayIso?' is-today':''}${value===selected?' is-selected':''}" data-qdp-date="${value}"${disabled?' disabled':''}>${d}</button>`);
    }
    pop.innerHTML=`<div class="qdp-head"><button type="button" class="qdp-nav" data-qdp-prev>‹</button><div class="qdp-title">${viewYear}년 ${viewMonth+1}월</div><button type="button" class="qdp-nav" data-qdp-next>›</button></div><div class="qdp-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="qdp-grid">${cells.join("")}</div><div class="qdp-actions"><button type="button" class="qdp-action" data-qdp-clear>지우기</button><button type="button" class="qdp-action primary" data-qdp-today>오늘</button></div>`;
    const r=activeInput.getBoundingClientRect(),w=286,h=360;
    let left=Math.min(Math.max(8,r.left),window.innerWidth-w-8),top=r.bottom+6;
    if(top+h>window.innerHeight-8) top=Math.max(8,r.top-h-6);
    pop.style.left=`${left}px`;pop.style.top=`${top}px`;
  }

  function open(input){
    activeInput=input;
    const d=parseDate(input.value);
    viewYear=d.getFullYear();viewMonth=d.getMonth();render();
  }
  function patch(input){
    if(!(input instanceof HTMLInputElement)||input.dataset.qmesDateStable==="1"||input.type!=="date") return;
    input.dataset.qmesDateStable="1";
    input.dataset.qmesDateMin=input.min||"";
    input.dataset.qmesDateMax=input.max||"";
    input.dataset.qmesDateOriginalType="date";
    input.type="text";
    input.inputMode="numeric";
    input.placeholder=input.placeholder||"YYYY-MM-DD";
    input.setAttribute("autocomplete","off");
  }
  function scan(root=document){root.querySelectorAll?.('input[type="date"]').forEach(patch);}

  document.addEventListener("click",e=>{
    const t=e.target;
    if(t instanceof HTMLInputElement&&t.dataset.qmesDateStable==="1"){
      e.preventDefault();e.stopPropagation();open(t);return;
    }
    const pop=t instanceof Element?t.closest(`#${POP_ID}`):null;
    if(!pop){if(activeInput)close();return;}
    const date=t.closest?.("[data-qdp-date]");if(date){setValue(date.dataset.qdpDate||"");return;}
    if(t.closest?.("[data-qdp-prev]")){viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--;}render();return;}
    if(t.closest?.("[data-qdp-next]")){viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++;}render();return;}
    if(t.closest?.("[data-qdp-clear]")){setValue("");return;}
    if(t.closest?.("[data-qdp-today]")){const d=new Date(),v=iso(d.getFullYear(),d.getMonth()+1,d.getDate());if(minMaxOk(v,activeInput))setValue(v);return;}
  },true);
  document.addEventListener("focusin",e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.dataset.qmesDateStable==="1")open(t);});
  window.addEventListener("resize",()=>{if(activeInput)render();});
  window.addEventListener("scroll",()=>{if(activeInput)render();},true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&activeInput){e.preventDefault();close();}});

  ensureStyle();scan();
  const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('input[type="date"]'))patch(n);scan(n);}})));
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
