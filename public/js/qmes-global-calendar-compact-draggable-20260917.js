/* NAMO QMES - global compact draggable calendar manager
 * 2026-09-17
 * Applies to dynamically opened custom calendar/date picker popups across QMES.
 * - compact width/spacing
 * - movable by month/title header
 * - preserves existing date selection/business logic
 */
(function(){
  'use strict';
  if(window.__QMES_GLOBAL_CALENDAR_COMPACT_DRAGGABLE_20260917__) return;
  window.__QMES_GLOBAL_CALENDAR_COMPACT_DRAGGABLE_20260917__=true;

  const STYLE_ID='qmes-global-calendar-compact-draggable-20260917-style';
  const CAL='qmesCompactCalendar';
  const HANDLE='qmesCalendarDragHandle';
  const monthRe=/(?:19|20)\d{2}\s*년\s*(?:1[0-2]|[1-9])\s*월/;
  let queued=false;
  let drag=null;

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      [data-qmes-compact-calendar="1"]{
        width:310px!important;
        min-width:310px!important;
        max-width:calc(100vw - 16px)!important;
        padding:12px 14px!important;
        border-radius:14px!important;
        box-shadow:0 18px 48px rgba(15,23,42,.18),0 2px 8px rgba(15,23,42,.08)!important;
        font-size:12px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      [data-qmes-compact-calendar="1"] *{box-sizing:border-box!important;}
      [data-qmes-compact-calendar="1"] button{
        min-width:0!important;
        min-height:28px!important;
        height:auto!important;
        padding:5px 8px!important;
        font-size:12px!important;
        line-height:1.2!important;
        border-radius:8px!important;
      }
      [data-qmes-compact-calendar="1"] [data-qmes-calendar-drag-handle="1"]{
        cursor:move!important;
        user-select:none!important;
        -webkit-user-select:none!important;
      }
      [data-qmes-compact-calendar="1"] [data-qmes-calendar-drag-handle="1"] button,
      [data-qmes-compact-calendar="1"] [data-qmes-calendar-drag-handle="1"] input,
      [data-qmes-compact-calendar="1"] [data-qmes-calendar-drag-handle="1"] select{
        cursor:pointer!important;
      }
      [data-qmes-compact-calendar="1"] h1,
      [data-qmes-compact-calendar="1"] h2,
      [data-qmes-compact-calendar="1"] h3,
      [data-qmes-compact-calendar="1"] h4,
      [data-qmes-compact-calendar="1"] strong{
        font-size:16px!important;
        line-height:1.25!important;
      }
      [data-qmes-compact-calendar="1"] [class*="day"],
      [data-qmes-compact-calendar="1"] [class*="date"]{
        font-size:12px!important;
      }
      [data-qmes-compact-calendar="1"] [class*="footer"],
      [data-qmes-compact-calendar="1"] [class*="actions"]{
        gap:6px!important;
        padding-top:8px!important;
        margin-top:8px!important;
      }
      @media (max-width:640px){
        [data-qmes-compact-calendar="1"]{
          width:min(292px,calc(100vw - 12px))!important;
          min-width:0!important;
          padding:10px 12px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function visible(el){
    if(!(el instanceof Element)||!el.isConnected) return false;
    const s=getComputedStyle(el);
    if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0) return false;
    const r=el.getBoundingClientRect();
    return r.width>180&&r.height>160&&r.width<720&&r.height<760;
  }

  function hasCalendarText(el){
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!monthRe.test(text)) return false;
    const koreanWeek=['일','월','화','수','목','금','토'].filter(v=>text.includes(v)).length>=5;
    const actions=/오늘|닫기|지우기/.test(text);
    const manyButtons=el.querySelectorAll('button').length>=10;
    return koreanWeek||actions||manyButtons;
  }

  function candidateNodes(){
    return Array.from(document.querySelectorAll([
      '[role="dialog"]',
      '[class*="calendar"]','[class*="Calendar"]',
      '[class*="datepicker"]','[class*="date-picker"]','[class*="DatePicker"]',
      '[class*="picker"]','[class*="Picker"]',
      'body > div','body > section'
    ].join(',')));
  }

  function findCards(){
    const matches=candidateNodes().filter(el=>visible(el)&&hasCalendarText(el));
    matches.sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return (ar.width*ar.height)-(br.width*br.height);
    });
    const chosen=[];
    for(const el of matches){
      if(chosen.some(inner=>el.contains(inner))) continue;
      chosen.push(el);
    }
    return chosen;
  }

  function monthTitle(card){
    const all=Array.from(card.querySelectorAll('button,strong,h1,h2,h3,h4,span,div'));
    return all.find(el=>{
      const t=String(el.textContent||'').replace(/\s+/g,' ').trim();
      return monthRe.test(t)&&t.length<30;
    })||null;
  }

  function findHeader(card){
    const title=monthTitle(card);
    if(!title) return null;
    let node=title;
    for(let i=0;i<4&&node&&node!==card;i++,node=node.parentElement){
      const r=node.getBoundingClientRect();
      const cr=card.getBoundingClientRect();
      if(r.height>=28&&r.height<=84&&r.top<=cr.top+90&&node.querySelectorAll('button').length<=4) return node;
    }
    return title;
  }

  function compact(card){
    if(card.dataset[CAL]==='1') return;
    card.dataset[CAL]='1';
    const header=findHeader(card);
    if(header) header.dataset[HANDLE]='1';
  }

  function scan(){
    queued=false;
    findCards().forEach(compact);
  }

  function schedule(delay=0){
    if(delay){setTimeout(schedule,delay);return;}
    if(queued) return;
    queued=true;
    requestAnimationFrame(scan);
  }

  function interactive(target){
    return !!target.closest('button,input,select,textarea,a,[role="button"],[contenteditable="true"]');
  }

  function beginDrag(event){
    if(event.button!==0) return;
    const target=event.target instanceof Element?event.target:null;
    if(!target||interactive(target)) return;
    const header=target.closest('[data-qmes-calendar-drag-handle="1"]');
    if(!header) return;
    const card=header.closest('[data-qmes-compact-calendar="1"]');
    if(!card) return;

    const r=card.getBoundingClientRect();
    card.style.setProperty('position','fixed','important');
    card.style.setProperty('left',r.left+'px','important');
    card.style.setProperty('top',r.top+'px','important');
    card.style.setProperty('right','auto','important');
    card.style.setProperty('bottom','auto','important');
    card.style.setProperty('margin','0','important');
    card.style.setProperty('transform','none','important');
    card.style.setProperty('z-index','2147483600','important');
    drag={card,startX:event.clientX,startY:event.clientY,left:r.left,top:r.top,width:r.width,height:r.height,pointerId:event.pointerId};
    try{header.setPointerCapture(event.pointerId);}catch(_error){}
    event.preventDefault();
  }

  function moveDrag(event){
    if(!drag||event.pointerId!==drag.pointerId) return;
    const dx=event.clientX-drag.startX;
    const dy=event.clientY-drag.startY;
    const minVisible=70;
    const maxLeft=window.innerWidth-minVisible;
    const minLeft=-(drag.width-minVisible);
    const maxTop=Math.max(4,window.innerHeight-50);
    const left=Math.min(maxLeft,Math.max(minLeft,drag.left+dx));
    const top=Math.min(maxTop,Math.max(4,drag.top+dy));
    drag.card.style.setProperty('left',left+'px','important');
    drag.card.style.setProperty('top',top+'px','important');
  }

  function endDrag(event){
    if(!drag||event.pointerId!==drag.pointerId) return;
    drag=null;
  }

  function start(){
    addStyle();
    schedule();
    document.addEventListener('pointerdown',beginDrag,true);
    document.addEventListener('pointermove',moveDrag,true);
    document.addEventListener('pointerup',endDrag,true);
    document.addEventListener('pointercancel',endDrag,true);
    document.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target:null;
      if(target&&target.closest('input[type="date"],input[placeholder*="YYYY"],input[placeholder*="날짜"],[data-date],[data-datepicker]')){
        schedule(0);schedule(40);schedule(120);
      }
    },true);
    document.addEventListener('focusin',event=>{
      const target=event.target instanceof Element?event.target:null;
      if(target&&target.matches('input[type="date"],input[placeholder*="YYYY"],input[placeholder*="날짜"]')){
        schedule(0);schedule(50);schedule(140);
      }
    },true);
    new MutationObserver(mutations=>{
      if(mutations.some(m=>m.addedNodes&&m.addedNodes.length)) schedule();
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
