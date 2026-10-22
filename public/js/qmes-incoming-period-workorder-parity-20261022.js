/* NAMO QMES IQC inspection period = Work Order period UI parity
 * 2026-10-22 / ADD-ONLY / #incoming scoped
 * Existing IQC rows, query handlers, approvals and reports are untouched.
 */
(()=>{'use strict';
if(window.__QMES_INCOMING_PERIOD_WORKORDER_PARITY_20261022__)return;
window.__QMES_INCOMING_PERIOD_WORKORDER_PARITY_20261022__=true;

const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const parse=v=>v?new Date(v+'T12:00:00'):null;
const weekMonday=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};

function install(){
  const root=document.querySelector('#incoming');
  const range=root?.querySelector('.iqc-date-range');
  const from=root?.querySelector('[data-incoming-period="start"]');
  const to=root?.querySelector('[data-incoming-period="end"]');
  const old=range?.querySelector('.qic-period-trigger');
  if(!root||!range||!from||!to||!old)return false;
  if(range.querySelector('.qic-work-period-trigger'))return true;

  old.classList.remove('qic-period-trigger');
  old.classList.add('qic-work-period-trigger');
  old.setAttribute('aria-label','검사기간 달력 열기');
  old.setAttribute('aria-haspopup','dialog');

  const value=old.querySelector('.qic-period-value');
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1);

  if(!from.value&&!to.value){
    from.value=fmt(monthStart);
    to.value=fmt(today);
  }
  value.textContent=from.value&&to.value?from.value+' ~ '+to.value:'기간 선택';

  let popup=null,base=null,a=null,b=null;

  function close(){
    popup?.remove();popup=null;
    old.setAttribute('aria-expanded','false');
  }
  function redraw(){
    if(!popup)return;
    const months=popup.querySelector('.qiw-period-months');
    months.innerHTML='';
    for(let k=0;k<2;k++){
      const d=new Date(base.getFullYear(),base.getMonth()+k,1);
      const y=d.getFullYear(),m=d.getMonth();
      const block=document.createElement('div');block.className='qiw-period-month';
      const head=document.createElement('div');head.className='qiw-period-month-head';
      const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label','이전 달');
      const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','다음 달');
      prev.onclick=()=>{base=new Date(base.getFullYear(),base.getMonth()-1,1);redraw();};
      next.onclick=()=>{base=new Date(base.getFullYear(),base.getMonth()+1,1);redraw();};
      const title=document.createElement('strong');title.textContent=y+'.'+String(m+1).padStart(2,'0');
      head.append(prev,title,next);block.append(head);

      const grid=document.createElement('div');grid.className='qiw-period-days';
      ['일','월','화','수','목','금','토'].forEach(w=>{const el=document.createElement('b');el.textContent=w;grid.append(el);});
      const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
      for(let i=0;i<first;i++)grid.append(document.createElement('i'));
      for(let n=1;n<=days;n++){
        const date=new Date(y,m,n),key=fmt(date),btn=document.createElement('button');
        btn.type='button';btn.textContent=n;
        if((a&&key===fmt(a))||(b&&key===fmt(b)))btn.classList.add('selected');
        else if(a&&b&&date>a&&date<b)btn.classList.add('between');
        btn.onclick=()=>{if(!a||b){a=date;b=null;}else if(date<a){b=a;a=date;}else b=date;redraw();};
        grid.append(btn);
      }
      block.append(grid);months.append(block);
    }
    popup.querySelector('.qiw-period-summary').textContent=a?(fmt(a)+(b?' ~ '+fmt(b):' ~ 종료일 선택')):'시작일과 종료일을 선택하세요';
  }
  function preset(name){
    const y=today.getFullYear(),m=today.getMonth(),day=today.getDate();
    if(name==='올해'){a=new Date(y,0,1);b=new Date(y,11,31);}
    else if(name==='오늘까지'){a=new Date(y,0,1);b=new Date(today);}
    else if(name==='오늘'){a=new Date(today);b=new Date(today);}
    else if(name==='전일'){a=new Date(y,m,day-1);b=new Date(a);}
    else if(name==='주간'){a=weekMonday(today);b=new Date(a);b.setDate(b.getDate()+6);}
    else if(name==='전주'){b=weekMonday(today);b.setDate(b.getDate()-1);a=new Date(b);a.setDate(a.getDate()-6);}
    else if(name==='당월'){a=new Date(y,m,1);b=new Date(y,m+1,0);}
    else if(name==='이전달'){a=new Date(y,m-1,1);b=new Date(y,m,0);}
    else return;
    base=new Date(a.getFullYear(),a.getMonth(),1);redraw();
  }
  function open(){
    if(popup){close();return;}
    a=parse(from.value)||new Date(monthStart);
    b=parse(to.value)||new Date(today);
    base=new Date(a.getFullYear(),a.getMonth(),1);
    popup=document.createElement('div');
    popup.className='qiw-period-popup';
    popup.setAttribute('role','dialog');
    popup.setAttribute('aria-label','검사기간 선택');
    popup.innerHTML='<div class="qiw-period-presets" role="group" aria-label="검사기간 빠른 선택">'+
      ['올해','오늘까지','오늘','전일','주간','전주','당월','이전달'].map(n=>'<button type="button" class="qiw-period-preset">'+n+'</button>').join('')+
      '</div><div class="qiw-period-months"></div><div class="qiw-period-footer"><span class="qiw-period-summary">기간을 선택하세요</span><div><button type="button" class="btn qiw-period-cancel">취소</button><button type="button" class="btn primary qiw-period-ok">확인</button></div></div>';
    range.append(popup);
    old.setAttribute('aria-expanded','true');
    popup.querySelectorAll('.qiw-period-preset').forEach(btn=>btn.onclick=()=>preset(btn.textContent.trim()));
    popup.querySelector('.qiw-period-cancel').onclick=close;
    popup.querySelector('.qiw-period-ok').onclick=()=>{
      if(!a||!b)return;
      from.value=fmt(a);to.value=fmt(b);
      value.textContent=from.value+' ~ '+to.value;
      close();
      root.querySelector('.iqc-query-search')?.click();
    };
    redraw();
  }

  old.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open();});
  document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&!old.contains(e.target))close();},true);
  window.addEventListener('keydown',e=>{if(popup&&e.key==='Escape'){e.preventDefault();close();}},true);
  return true;
}

function ensure(){if(!install())setTimeout(install,100);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
document.addEventListener('click',e=>{if(e.target.closest?.('.sidebar .menu[data-page="incoming"]'))setTimeout(install,80);});
[250,700,1500].forEach(ms=>setTimeout(install,ms));
})();