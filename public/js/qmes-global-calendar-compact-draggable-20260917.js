/* NAMO QMES - global compact calendar size patch
 * 2026-09-17
 * Size only: preserve every existing calendar/date-picker function and behavior.
 * Applies to dynamically opened custom calendar popups across QMES.
 */
(function(){
  'use strict';
  if(window.__QMES_GLOBAL_CALENDAR_SIZE_ONLY_20260917__) return;
  window.__QMES_GLOBAL_CALENDAR_SIZE_ONLY_20260917__=true;

  const STYLE_ID='qmes-global-calendar-size-only-20260917-style';
  const monthRe=/(?:19|20)\d{2}\s*년\s*(?:1[0-2]|[1-9])\s*월/;
  let queued=false;

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      [data-qmes-compact-calendar="1"]{
        width:280px!important;
        min-width:280px!important;
        max-width:calc(100vw - 16px)!important;
        padding:10px 12px!important;
        border-radius:12px!important;
        font-size:11.5px!important;
        box-sizing:border-box!important;
      }
      [data-qmes-compact-calendar="1"] *{box-sizing:border-box!important;}
      [data-qmes-compact-calendar="1"] h1,
      [data-qmes-compact-calendar="1"] h2,
      [data-qmes-compact-calendar="1"] h3,
      [data-qmes-compact-calendar="1"] h4,
      [data-qmes-compact-calendar="1"] strong{
        font-size:15px!important;
        line-height:1.2!important;
      }
      [data-qmes-compact-calendar="1"] button{
        min-width:0!important;
        min-height:26px!important;
        padding:4px 6px!important;
        font-size:11.5px!important;
        line-height:1.15!important;
        border-radius:7px!important;
      }
      [data-qmes-compact-calendar="1"] [class*="day"],
      [data-qmes-compact-calendar="1"] [class*="date"],
      [data-qmes-compact-calendar="1"] td,
      [data-qmes-compact-calendar="1"] th{
        font-size:11.5px!important;
      }
      [data-qmes-compact-calendar="1"] [class*="footer"],
      [data-qmes-compact-calendar="1"] [class*="actions"]{
        gap:6px!important;
        padding-top:7px!important;
        margin-top:7px!important;
      }
      @media (max-width:640px){
        [data-qmes-compact-calendar="1"]{
          width:min(272px,calc(100vw - 12px))!important;
          min-width:0!important;
          padding:9px 10px!important;
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
    return r.width>180&&r.height>150&&r.width<720&&r.height<760;
  }

  function isCalendar(el){
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!monthRe.test(text)) return false;
    const weekdayCount=['일','월','화','수','목','금','토'].filter(v=>text.includes(v)).length;
    const hasActions=/오늘|닫기|지우기/.test(text);
    const manyButtons=el.querySelectorAll('button').length>=10;
    return weekdayCount>=5||hasActions||manyButtons;
  }

  function candidates(){
    return Array.from(document.querySelectorAll([
      '[role="dialog"]',
      '[class*="calendar"]','[class*="Calendar"]',
      '[class*="datepicker"]','[class*="date-picker"]','[class*="DatePicker"]',
      '[class*="picker"]','[class*="Picker"]',
      'body > div','body > section'
    ].join(',')));
  }

  function scan(){
    queued=false;
    const matches=candidates().filter(el=>visible(el)&&isCalendar(el));
    matches.sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return (ar.width*ar.height)-(br.width*br.height);
    });
    const chosen=[];
    for(const el of matches){
      if(chosen.some(inner=>el.contains(inner))) continue;
      chosen.push(el);
    }
    chosen.forEach(el=>el.setAttribute('data-qmes-compact-calendar','1'));
  }

  function schedule(delay=0){
    if(delay){setTimeout(()=>schedule(),delay);return;}
    if(queued) return;
    queued=true;
    requestAnimationFrame(scan);
  }

  function start(){
    addStyle();
    schedule();
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

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
