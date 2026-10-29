/* Shared KST notification date rules and notification-panel controls. */
(function(){
'use strict';
function validDay(value){
 var s=String(value||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 var d=new Date(s+'T00:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function day(value){
 if(!value)return '';
 if(validDay(value))return String(value);
 var d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
 var parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),p={};
 parts.forEach(function(part){p[part.type]=part.value;});
 return p.year+'-'+p.month+'-'+p.day;
}
function range(kind,today){
 today=today||day(new Date());var date=new Date(today+'T00:00:00Z');
 if(kind==='week')date.setUTCDate(date.getUTCDate()-7);
 if(kind==='month'){
  var n=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()-1);
  var last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(n,last));
 }
 return {from:date.toISOString().slice(0,10),to:today};
}
function validateRange(query){
 var from=String(query?.from||''),to=String(query?.to||'');
 if((from&&!validDay(from))||(to&&!validDay(to))||(from&&to&&from>to))return null;
 return {from:from||null,to:to||null};
}
var utils={day:day,range:range,validateRange:validateRange};
if(typeof module!=='undefined'&&module.exports){module.exports=utils;return;}
if(typeof window==='undefined'||window.qmesNotificationDates)return;
var panel=document.getElementById('notifyPanel'),bar=document.getElementById('notifyDateLabel'),list=document.getElementById('notifyList');
if(!panel||!bar||!list)return;
var selected=range('month');
bar.classList.add('notify-date-search');
bar.innerHTML='<div class="notify-periods" role="group" aria-label="알림 조회 기간"><button type="button" data-notify-period="month" title="최근 한 달" aria-pressed="true">한달전</button><button type="button" data-notify-period="week" title="최근 일주일" aria-pressed="false">일주일전</button><button type="button" data-notify-period="today" aria-pressed="false">오늘</button></div><input type="date" class="notify-date-input" aria-label="알림 날짜별 찾기" title="날짜별 찾기">';
var input=bar.querySelector('input');
function query(){return '?from='+selected.from+'&to='+selected.to;}
function apply(){
 if(window.qmesNotificationHistory)return;
 var kind=document.querySelector('#notifyTabs .notify-tab.active')?.dataset.filter||'all',visible=0;
 list.querySelectorAll('.notify-item').forEach(function(item){
  var date=day(item.dataset.createdAt),kinds=String(item.dataset.kind||'').split(/\s+/);
  var show=!!date&&date>=selected.from&&date<=selected.to&&(kind==='all'||kinds.includes(kind));
  item.classList.toggle('hidden',!show);if(show)visible++;
 });
 var empty=document.getElementById('notifyEmpty');if(empty){empty.textContent='선택한 기간에 해당하는 알림이 없습니다.';empty.style.display=visible?'none':'block';}
 bar.title=selected.from+' ~ '+selected.to;
}
function reload(){
 if(window.qmesNotificationHistory){window.qmesNotificationHistory.refresh({reset:true});return;}
 apply();
 if(panel.classList.contains('open')){
  window.loadQualityNotifications?.();window.qmesReloadDispatchNotifications?.();
 }
}
bar.addEventListener('click',function(event){
 var button=event.target.closest('[data-notify-period]');if(!button)return;
 selected=range(button.dataset.notifyPeriod);input.value='';
 bar.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});reload();
});
input.addEventListener('change',function(){
 if(input.value&&!validDay(input.value))return;
 selected=input.value?{from:input.value,to:input.value}:range('month');
 bar.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(!input.value&&b.dataset.notifyPeriod==='month'));});reload();
});
window.qmesNotificationDates={query:query,apply:apply,range:function(){return Object.assign({},selected);}};
var style=document.createElement('style');style.textContent='#notifyDateLabel.notify-date-search{height:auto;min-height:44px;padding:7px 12px;gap:8px;justify-content:space-between;flex-wrap:wrap}#notifyDateLabel .notify-periods{display:flex;gap:4px}#notifyDateLabel button{border:1px solid #ced9e5;border-radius:4px;background:#fff;color:#344054;font:600 11px/26px Arial,sans-serif;padding:0 7px;cursor:pointer}#notifyDateLabel button[aria-pressed="true"]{color:#1565a8;background:#eaf3fd;border-color:#9dc4ec}#notifyDateLabel .notify-date-input{box-sizing:border-box;min-width:0;width:200px;max-width:100%;height:34px;border:1px solid #ced9e5;border-radius:4px;background:#fff;color:#344054;font:13px Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif;padding:5px 9px;margin-left:auto}#notifyDateLabel button:focus-visible,#notifyDateLabel input:focus-visible{outline:2px solid #2480cb;outline-offset:2px}';document.head.appendChild(style);
apply();
})();

