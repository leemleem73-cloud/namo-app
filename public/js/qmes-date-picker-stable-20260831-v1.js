/* NAMO QMES - stable date picker - 2026-08-31
 * ADD-ONLY UI owner for date fields.
 * Converts every QMES <input type="date"> into a text-backed YYYY-MM-DD field
 * and always opens the same visible in-app calendar on click/focus.
 */
(function(){
  "use strict";
  if(window.__QMES_DATE_PICKER_STABLE_20260831_V2__) return;
  window.__QMES_DATE_PICKER_STABLE_20260831_V2__=true;
  window.__QMES_DATE_PICKER_STABLE_20260831_V1__=true;

  const STYLE_ID="qmes-date-picker-stable-style-20260831-v2";
  const POP_ID="qmes-date-picker-stable-pop-20260831-v2";
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
      input[data-qmes-date-stable="1"]{
        color-scheme:light!important;appearance:none!important;-webkit-appearance:none!important;
        background-color:#fff!important;color:#172033!important;-webkit-text-fill-color:#172033!important;
        cursor:pointer!important;padding-right:38px!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='17' rx='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E")!important;
        background-position:calc(100% - 11px) 50%!important;background-size:18px 18px!important;background-repeat:no-repeat!important;
      }
      input[data-qmes-date-stable="1"]:focus{outline:none!important}
      #${POP_ID}{position:fixed!important;z-index:2147483646!important;width:304px!important;padding:13px!important;border:1px solid #d7dee8!important;border-radius:13px!important;background:#fff!important;color:#172033!important;box-shadow:0 20px 60px rgba(15,23,42,.30)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;box-sizing:border-box!important;user-select:none!important}
      #${POP_ID} *{box-sizing:border-box!important}
      #${POP_ID} .qdp-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-bottom:10px!important}
      #${POP_ID} .qdp-title{flex:1!important;text-align:center!important;font-size:14px!important;font-weight:900!important;color:#1e293b!important}
      #${POP_ID} .qdp-nav{width:34px!important;height:34px!important;border:1px solid #dbe2ea!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:19px!important;font-weight:900!important;cursor:pointer!important}
      #${POP_ID} .qdp-nav:hover{background:#f3f6fb!important}
      #${POP_ID} .qdp-week,#${POP_ID} .qdp-grid{display:grid!important;grid-template-columns:repeat(7,1fr)!important;gap:3px!important}
      #${POP_ID} .qdp-week span{height:25px!important;display:grid!important;place-items:center!important;color:#8491a3!important;font-size:10px!important;font-weight:850!important}
      #${POP_ID} .qdp-week span:first-child{color:#dc2626!important}#${POP_ID} .qdp-week span:last-child{color:#2563eb!important}
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

  function parseDate(value){
    if(valid(value)){
      const [y,m,d]=value.split("-").map(Number),dt=new Date(y,m-1,d);
      if(dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d)return dt;
    }
    return new Date();
  }
  function minMaxOk(value,input){
    const min=clean(input?.dataset?.qmesDateMin||""),max=clean(input?.dataset?.qmesDateMax||"");
    if(min&&valid(min)&&value<min)return false;
    if(max&&valid(max)&&value>max)return false;
    return true;
  }
  function setValue(value){
    const input=activeInput;
    if(!input)return;
    input.value=value;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    close();
    setTimeout(()=>input.focus({preventScroll:true}),0);
  }
  function close(){document.getElementById(POP_ID)?.remove();activeInput=null;}

  function render(){
    if(!activeInput||!document.documentElement.contains(activeInput)){close();return;}
    let pop=document.getElementById(POP_ID);
    if(!pop){pop=document.createElement("div");pop.id=POP_ID;pop.setAttribute("role","dialog");pop.setAttribute("aria-label","날짜 선택");document.body.appendChild(pop);}
    const first=new Date(viewYear,viewMonth,1),days=new Date(viewYear,viewMonth+1,0).getDate(),offset=first.getDay();
    const now=new Date(),todayIso=iso(now.getFullYear(),now.getMonth()+1,now.getDate()),selected=valid(activeInput.value)?activeInput.value:"";
    const cells=[];
    for(let i=0;i<offset;i++)cells.push('<span class="qdp-empty"></span>');
    for(let d=1;d<=days;d++){
      const value=iso(viewYear,viewMonth+1,d),disabled=!minMaxOk(value,activeInput);
      cells.push(`<button type="button" class="qdp-day${value===todayIso?' is-today':''}${value===selected?' is-selected':''}" data-qdp-date="${value}"${disabled?' disabled':''}>${d}</button>`);
    }
    pop.innerHTML=`<div class="qdp-head"><button type="button" class="qdp-nav" data-qdp-prev aria-label="이전 달">‹</button><div class="qdp-title">${viewYear}년 ${viewMonth+1}월</div><button type="button" class="qdp-nav" data-qdp-next aria-label="다음 달">›</button></div><div class="qdp-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="qdp-grid">${cells.join("")}</div><div class="qdp-actions"><button type="button" class="qdp-action" data-qdp-clear>지우기</button><button type="button" class="qdp-action" data-qdp-close>닫기</button><button type="button" class="qdp-action primary" data-qdp-today>오늘</button></div>`;

    const r=activeInput.getBoundingClientRect(),w=304,h=390;
    let left=Math.min(Math.max(8,r.left),Math.max(8,window.innerWidth-w-8));
    let top=r.bottom+7;
    if(top+h>window.innerHeight-8)top=Math.max(8,r.top-h-7);
    pop.style.left=`${left}px`;pop.style.top=`${top}px`;
  }

  function open(input){
    if(!(input instanceof HTMLInputElement))return;
    activeInput=input;
    const d=parseDate(input.value);
    viewYear=d.getFullYear();viewMonth=d.getMonth();
    render();
  }

  function patch(input){
    if(!(input instanceof HTMLInputElement)||input.dataset.qmesDateStable==="1")return;
    if(input.type!=="date"&&!input.matches('[data-qmes-date-field="1"]'))return;
    input.dataset.qmesDateStable="1";
    input.dataset.qmesDateMin=input.min||"";
    input.dataset.qmesDateMax=input.max||"";
    input.dataset.qmesDateOriginalType=input.type;
    input.type="text";
    input.inputMode="numeric";
    input.placeholder="YYYY-MM-DD";
    input.setAttribute("autocomplete","off");
    input.setAttribute("aria-haspopup","dialog");
    input.setAttribute("aria-label",input.getAttribute("aria-label")||input.name||"날짜 선택");
  }
  function scan(root=document){
    root.querySelectorAll?.('input[type="date"],input[data-qmes-date-field="1"]').forEach(patch);
  }

  function dateInputFromTarget(target){
    return target instanceof HTMLInputElement&&target.dataset.qmesDateStable==="1"?target:null;
  }

  document.addEventListener("pointerdown",e=>{
    const input=dateInputFromTarget(e.target);
    if(input){
      e.preventDefault();e.stopPropagation();
      try{input.focus({preventScroll:true});}catch(_){input.focus();}
      open(input);
      return;
    }
    const inside=e.target instanceof Element&&e.target.closest(`#${POP_ID}`);
    if(!inside&&activeInput)close();
  },true);

  document.addEventListener("click",e=>{
    const input=dateInputFromTarget(e.target);
    if(input){e.preventDefault();e.stopPropagation();open(input);return;}
    const t=e.target instanceof Element?e.target:null;
    const pop=t?.closest(`#${POP_ID}`);
    if(!pop)return;
    e.preventDefault();e.stopPropagation();
    const date=t.closest("[data-qdp-date]");if(date){setValue(date.dataset.qdpDate||"");return;}
    if(t.closest("[data-qdp-prev]")){viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--;}render();return;}
    if(t.closest("[data-qdp-next]")){viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++;}render();return;}
    if(t.closest("[data-qdp-clear]")){setValue("");return;}
    if(t.closest("[data-qdp-close]")){close();return;}
    if(t.closest("[data-qdp-today]")){const d=new Date(),v=iso(d.getFullYear(),d.getMonth()+1,d.getDate());if(minMaxOk(v,activeInput))setValue(v);return;}
  },true);

  document.addEventListener("focusin",e=>{const input=dateInputFromTarget(e.target);if(input)open(input);});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&activeInput){e.preventDefault();close();return;}
    const input=dateInputFromTarget(e.target);
    if(input&&(e.key==="Enter"||e.key==="ArrowDown")){e.preventDefault();open(input);}
  });
  window.addEventListener("resize",()=>{if(activeInput)render();});
  window.addEventListener("scroll",()=>{if(activeInput)render();},true);

  ensureStyle();scan();
  const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{
    if(n.nodeType!==1)return;
    if(n.matches?.('input[type="date"],input[data-qmes-date-field="1"]'))patch(n);
    scan(n);
  })));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.qmesDatePickerStable={scan,open,close};
})();
