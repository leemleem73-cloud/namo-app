/* NAMO QMES: work-order registration instruction period date-range selector.
   Only presentation is changed: original start/end inputs remain the save/edit source. */
(function(){
  'use strict';
  if(window.__NAMO_WORKORDER_PERIOD_20261014__)return;
  window.__NAMO_WORKORDER_PERIOD_20261014__=true;

  var css=[
    '#mainWorkspace .work-basic-grid .nwp-original-date{display:none!important}',
    '#mainWorkspace .work-basic-grid .nwp-range-field{grid-column:span 2;min-width:0}',
    '#mainWorkspace .nwp-range-button{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;height:36px;padding:0 11px;border:1px solid #c6d5e5;border-radius:6px;background:#fff;color:#233e5b;cursor:pointer;text-align:left;font-size:12px;font-weight:600}',
    '#mainWorkspace .nwp-range-button:focus-visible{outline:2px solid #8abef1;outline-offset:1px}',
    '#mainWorkspace .nwp-range-button .nwp-range-value{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#mainWorkspace .nwp-range-button .nwp-range-icon{font-size:19px;font-weight:400;color:#7087a0;flex-shrink:0}',
    '#nwp-period-popup-20261014{position:fixed;z-index:2147483000;box-sizing:border-box;width:min(650px,calc(100vw - 24px));max-height:calc(100vh - 16px);overflow:auto;padding:16px;background:#fff;border:1px solid #b6c8dc;border-radius:5px;box-shadow:0 12px 28px rgba(24,47,77,.2);color:#263d55;font:12px "Malgun Gothic",Arial,sans-serif}',
    '#nwp-period-popup-20261014[hidden]{display:none!important}',
    '#nwp-period-popup-20261014 button{box-sizing:border-box;font:inherit;cursor:pointer}',
    '#nwp-period-popup-20261014 button:focus-visible{outline:2px solid #4093e9;outline-offset:1px}',
    '#nwp-period-popup-20261014 .nwp-presets{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px;margin-bottom:13px}',
    '#nwp-period-popup-20261014 .nwp-preset{min-height:32px;padding:5px 2px;border:1px solid #d5dce5;border-radius:2px;background:#fff;color:#33465d;white-space:nowrap}',
    '#nwp-period-popup-20261014 .nwp-preset:hover{background:#eaf4ff;border-color:#1688ea}',
    '#nwp-period-popup-20261014 .nwp-months{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
    '#nwp-period-popup-20261014 .nwp-month+.nwp-month{border-left:1px solid #e0e7ef;padding-left:16px}',
    '#nwp-period-popup-20261014 .nwp-month-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:13px}',
    '#nwp-period-popup-20261014 .nwp-month-head button{border:1px solid #d4e0ec;border-radius:4px;width:27px;height:27px;background:#fff;font-size:18px}',
    '#nwp-period-popup-20261014 .nwp-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center}',
    '#nwp-period-popup-20261014 .nwp-days b{padding:7px 0;font-size:11px;color:#72849a}',
    '#nwp-period-popup-20261014 .nwp-days button{border:1px solid transparent;border-radius:3px;background:#fff;color:#30455c;min-height:29px;padding:3px 0}',
    '#nwp-period-popup-20261014 .nwp-days button:hover{border-color:#88bae8;background:#edf6ff}',
    '#nwp-period-popup-20261014 .nwp-days button.nwp-between{background:#e2f0fd}',
    '#nwp-period-popup-20261014 .nwp-days button.nwp-selected{background:#1678c5;color:#fff;font-weight:800}',
    '#nwp-period-popup-20261014 .nwp-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #e2e9f1;margin-top:13px;padding-top:12px}',
    '#nwp-period-popup-20261014 .nwp-summary{font-size:12px;color:#526981}',
    '#nwp-period-popup-20261014 .nwp-actions{display:flex;gap:7px}',
    '#nwp-period-popup-20261014 .nwp-actions button{border:1px solid #c4d5e5;border-radius:4px;background:#fff;padding:8px 13px}',
    '#nwp-period-popup-20261014 .nwp-actions button.nwp-confirm{background:#166fbb;color:#fff;border-color:#166fbb}',
    '#nwp-period-popup-20261014 .nwp-actions button:disabled{opacity:.5;cursor:not-allowed}',
    '@media(max-width:640px){#mainWorkspace .work-basic-grid .nwp-range-field{grid-column:span 2}#nwp-period-popup-20261014 .nwp-presets{grid-template-columns:repeat(4,minmax(0,1fr))}#nwp-period-popup-20261014 .nwp-months{grid-template-columns:1fr}#nwp-period-popup-20261014 .nwp-month+.nwp-month{border-left:0;border-top:1px solid #e0e7ef;padding:12px 0 0}}'
  ].join('\n');
  var style=document.createElement('style');
  style.id='namo-workorder-unified-period-style';
  style.textContent=css;
  document.head.appendChild(style);

  function fmt(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function parse(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    var d=new Date(value+'T12:00:00');
    return Number.isFinite(d.getTime())&&fmt(d)===value?d:null;
  }
  function mk(tag,className,text){
    var el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=String(text);
    return el;
  }
  var pop=null,active=null,a=null,b=null,base=null;
  function close(){
    if(pop)pop.hidden=true;
    if(active)active.trigger.setAttribute('aria-expanded','false');
    active=null;
  }
  function position(){
    if(!pop||!active)return;
    var r=active.trigger.getBoundingClientRect();
    var w=pop.offsetWidth,h=pop.offsetHeight;
    var left=Math.min(Math.max(8,r.left),Math.max(8,window.innerWidth-w-8));
    var below=window.innerHeight-r.bottom;
    var top=below>=h+8?r.bottom+5:(r.top>=h+8?r.top-h-5:Math.max(8,Math.min(r.bottom+5,window.innerHeight-h-8)));
    pop.style.left=Math.round(left)+'px';
    pop.style.top=Math.round(top)+'px';
  }
  function draw(){
    if(!pop)return;
    var months=pop.querySelector('.nwp-months');
    months.replaceChildren();
    for(var k=0;k<2;k++){
      (function(monthOffset){
        var d=new Date(base.getFullYear(),base.getMonth()+monthOffset,1);
        var year=d.getFullYear(),monthNo=d.getMonth();
        var block=mk('div','nwp-month');
        var head=mk('div','nwp-month-head'),prev=mk('button','','‹'),next=mk('button','','›');
        prev.type=next.type='button';
        prev.setAttribute('aria-label','이전 달');
        next.setAttribute('aria-label','다음 달');
        prev.onclick=function(){base=new Date(base.getFullYear(),base.getMonth()-1,1);draw();position();};
        next.onclick=function(){base=new Date(base.getFullYear(),base.getMonth()+1,1);draw();position();};
        head.append(prev,mk('strong','',year+'.'+String(monthNo+1).padStart(2,'0')),next);
        var days=mk('div','nwp-days');
        ['일','월','화','수','목','금','토'].forEach(function(w){days.appendChild(mk('b','',w));});
        for(var pad=0;pad<new Date(year,monthNo,1).getDay();pad++)days.appendChild(mk('i'));
        var count=new Date(year,monthNo+1,0).getDate();
        for(var i=1;i<=count;i++){
          (function(day){
            var selected=new Date(year,monthNo,day),key=fmt(selected);
            var button=mk('button','',day);button.type='button';
            if((a&&key===fmt(a))||(b&&key===fmt(b)))button.classList.add('nwp-selected');
            else if(a&&b&&selected>a&&selected<b)button.classList.add('nwp-between');
            button.onclick=function(){
              if(!a||b){a=selected;b=null;}
              else if(selected<a){b=a;a=selected;}
              else b=selected;
              draw();
            };
            days.appendChild(button);
          })(i);
        }
        block.append(head,days);months.appendChild(block);
      })(k);
    }
    pop.querySelector('.nwp-summary').textContent=a?(fmt(a)+(b?' ~ '+fmt(b):' ~ 종료일 선택')):'시작일과 종료일을 선택하세요';
    pop.querySelector('.nwp-confirm').disabled=!(a&&b);
  }
  function weekMonday(d){
    var out=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    out.setDate(out.getDate()-((out.getDay()+6)%7));
    return out;
  }
  function choosePreset(name){
    var today=new Date(),y=today.getFullYear(),m=today.getMonth(),day=today.getDate();
    if(name==='올해'){a=new Date(y,0,1);b=new Date(y,11,31);}
    else if(name==='오늘까지'){a=new Date(y,0,1);b=new Date(y,m,day);}
    else if(name==='오늘'){a=new Date(y,m,day);b=new Date(a);}
    else if(name==='전일'){a=new Date(y,m,day-1);b=new Date(a);}
    else if(name==='주간'){a=weekMonday(today);b=new Date(a);b.setDate(b.getDate()+6);}
    else if(name==='전주'){b=weekMonday(today);b.setDate(b.getDate()-1);a=new Date(b);a.setDate(a.getDate()-6);}
    else if(name==='당월'){a=new Date(y,m,1);b=new Date(y,m+1,0);}
    else if(name==='이전달'){a=new Date(y,m-1,1);b=new Date(y,m,0);}
    else return;
    base=new Date(a.getFullYear(),a.getMonth(),1);
    draw();position();
  }
  function ensurePopup(){
    if(pop)return;
    pop=mk('div');pop.id='nwp-period-popup-20261014';pop.hidden=true;
    var presets=mk('div','nwp-presets');
    ['올해','오늘까지','오늘','전일','주간','전주','당월','이전달'].forEach(function(name){
      var item=mk('button','nwp-preset',name);item.type='button';
      item.onclick=function(){choosePreset(name);};
      presets.appendChild(item);
    });
    var months=mk('div','nwp-months'),foot=mk('div','nwp-footer');
    var summary=mk('span','nwp-summary','기간을 선택하세요'),actions=mk('div','nwp-actions');
    var cancel=mk('button','','취소'),confirm=mk('button','nwp-confirm','확인');
    cancel.type=confirm.type='button';cancel.onclick=close;
    confirm.onclick=function(){
      if(!active||!a||!b)return;
      active.start.value=fmt(a);active.end.value=fmt(b);
      [active.start,active.end].forEach(function(input){
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
      });
      active.update();close();
    };
    actions.append(cancel,confirm);foot.append(summary,actions);pop.append(presets,months,foot);
    document.body.appendChild(pop);
    document.addEventListener('pointerdown',function(e){
      if(!pop.hidden&&active&&!pop.contains(e.target)&&!active.trigger.contains(e.target))close();
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pop.hidden)close();});
    window.addEventListener('resize',function(){if(!pop.hidden)position();});
  }
  function open(trigger,start,end,update){
    ensurePopup();
    if(active&&active.trigger===trigger&&!pop.hidden){close();return;}
    active={trigger:trigger,start:start,end:end,update:update};
    a=parse(start.value);b=parse(end.value);
    if(!a&&b){a=b;b=null;}
    if(a&&b&&b<a){var temp=a;a=b;b=temp;}
    var month=a||new Date();
    base=new Date(month.getFullYear(),month.getMonth(),1);
    draw();pop.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    position();
  }
  function install(form){
    if(form.dataset.nwpPeriodUnified==='1')return;
    var boxes=Array.from(form.querySelectorAll('.work-basic-grid .form-item'));
    var field=function(label){return boxes.find(function(box){return box.querySelector('label')?.textContent.trim()===label;});};
    var startBox=field('작업 시작일'),endBox=field('작업 종료일');
    if(!startBox||!endBox)return;
    var start=startBox.querySelector('input[type="date"]'),end=endBox.querySelector('input[type="date"]');
    if(!start||!end)return;
    var holder=mk('div','form-item nwp-range-field');
    var label=mk('label','','지시기간');
    var trigger=mk('button','nwp-range-button');
    trigger.type='button';trigger.setAttribute('aria-label','지시기간 달력 열기');
    trigger.setAttribute('aria-expanded','false');
    var value=mk('span','nwp-range-value','기간 선택'),icon=mk('span','nwp-range-icon','▦');
    trigger.append(value,icon);holder.append(label,trigger);
    startBox.before(holder);
    startBox.classList.add('nwp-original-date');
    endBox.classList.add('nwp-original-date');
    var update=function(){value.textContent=start.value&&end.value?start.value+' ~ '+end.value:(start.value?start.value+' ~ 종료일 선택':'기간 선택');};
    start.addEventListener('change',update);end.addEventListener('change',update);
    trigger.addEventListener('click',function(e){e.preventDefault();open(trigger,start,end,update);});
    form.dataset.nwpPeriodUnified='1';
    update();
  }
  function boot(){
    var root=document.getElementById('mainWorkspace');
    if(!root)return;
    var scan=function(){root.querySelectorAll('.work-form').forEach(install);};
    var obs=new MutationObserver(scan);
    obs.observe(root,{childList:true,subtree:true});
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();