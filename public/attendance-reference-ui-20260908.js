(function(){
  'use strict';
  function $(s,r=document){return r.querySelector(s)}
  function $$(s,r=document){return Array.from(r.querySelectorAll(s))}
  function fmtDate(d){return d.toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'})}
  function fmtTime(v){if(!v)return '--:--';const d=new Date(v);return isNaN(d)?'--:--':d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}
  function safeData(j){return j&&typeof j==='object'&&'data'in j?j.data:j}
  async function getJson(url){try{const r=await fetch(url,{credentials:'same-origin'});const t=await r.text();try{return JSON.parse(t)}catch(_e){return null}}catch(_e){return null}}

  function patchHeader(){
    const row=$('.topbar-row'); if(!row||$('#namoMenuBtn'))return;
    const menu=document.createElement('button'); menu.id='namoMenuBtn'; menu.type='button'; menu.setAttribute('aria-label','메뉴'); menu.textContent='☰';
    const refresh=document.createElement('button'); refresh.id='namoRefreshBtn'; refresh.type='button'; refresh.setAttribute('aria-label','새로고침'); refresh.textContent='↻';
    row.insertBefore(menu,row.firstChild); row.appendChild(refresh);
    menu.addEventListener('click',()=>{const more=$('.nav-btn[data-page-target="more"]'); if(more)more.click();});
    refresh.addEventListener('click',()=>location.reload());
  }

  function ensureHomeLayout(){
    const page=$('.page[data-page="home"]'); if(!page||page.dataset.refReady)return; page.dataset.refReady='1';
    const firstCard=page.querySelector('.card'); const secondCard=firstCard&&firstCard.nextElementSibling;
    const report=document.createElement('button'); report.type='button'; report.className='namo-report-row'; report.innerHTML='<span class="left"><span class="icon">▥</span><span>리포트</span></span><span class="arrow">›</span>';
    report.addEventListener('click',()=>{const b=$('.nav-btn[data-page-target="records"]');if(b)b.click();});
    page.insertBefore(report,firstCard||page.firstChild);
    const title=document.createElement('div'); title.className='namo-panel-title'; title.innerHTML='<strong>오늘 근무</strong><span id="namoTodayDate"></span>';
    page.insertBefore(title,firstCard||page.firstChild);
    if(firstCard){
      firstCard.classList.add('namo-today-card');
      const clockGrid=firstCard.querySelector('.clock-grid');
      if(clockGrid){
        const wrap=document.createElement('div'); wrap.className='namo-clock-actions';
        const req=document.createElement('button'); req.type='button'; req.className='namo-request-mini'; req.textContent='요청'; req.addEventListener('click',()=>{const b=$('.nav-btn[data-page-target="requests"]');if(b)b.click();});
        clockGrid.parentNode.insertBefore(wrap,clockGrid); wrap.appendChild(req); wrap.appendChild(clockGrid);
      }
      const meta=document.createElement('div'); meta.className='namo-today-meta'; meta.innerHTML='<div><b id="namoTodaySchedule">09:00 - 18:00</b><div id="namoTodayPlace" style="font-size:11px;margin-top:3px;color:#7a8594">근무지 확인 중</div></div><span class="namo-availability">출근 가능</span>';
      firstCard.insertBefore(meta,firstCard.firstChild);
    }
    if(secondCard){
      secondCard.classList.add('namo-week-card'); secondCard.innerHTML='<div class="namo-week-head"><strong>이번 주 근무</strong><button class="icon-btn" id="namoCalendarOpen" type="button">▣</button></div><div class="namo-week-table" id="namoWeekTable"></div><div class="namo-week-total"><span>주간 근무 현황</span><strong id="namoWeekTotal">-</strong></div>';
      $('#namoCalendarOpen')?.addEventListener('click',()=>{const b=$('.nav-btn[data-page-target="records"]');if(b)b.click();});
      const avg=document.createElement('div'); avg.className='card namo-average-card'; avg.innerHTML='<div class="namo-average-head"><strong>1주 평균 근로시간</strong><span id="namoMonthLabel" style="font-size:11px;color:#7a8594"></span></div><div class="namo-average-body"><div class="namo-average-value" id="namoAvgValue">계산 중</div><div class="namo-average-track"><span id="namoAvgBar"></span></div><div class="namo-average-scale"><span>0</span><span>40</span><span>52시간</span></div></div>';
      secondCard.after(avg);
    }
  }

  function ensureRecordsCalendar(){
    const page=$('.page[data-page="records"]'); if(!page||page.dataset.refReady)return; page.dataset.refReady='1';
    const old=page.querySelector('.card'); if(old)old.style.display='none';
    const card=document.createElement('div'); card.className='card namo-month-card'; card.innerHTML='<div class="namo-month-head"><button type="button" id="namoPrevMonth">‹</button><div class="namo-month-title" id="namoMonthTitle"></div><button type="button" id="namoNextMonth">›</button></div><div class="namo-cal-dows"><div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div></div><div class="namo-cal-grid" id="namoMonthGrid"></div><div class="namo-month-detail" id="namoMonthDetail"></div>';
    page.appendChild(card);
    let cursor=new Date(); cursor=new Date(cursor.getFullYear(),cursor.getMonth(),1); page._namoCursor=cursor;
    $('#namoPrevMonth')?.addEventListener('click',()=>{page._namoCursor=new Date(page._namoCursor.getFullYear(),page._namoCursor.getMonth()-1,1);loadRecordsCalendar();});
    $('#namoNextMonth')?.addEventListener('click',()=>{page._namoCursor=new Date(page._namoCursor.getFullYear(),page._namoCursor.getMonth()+1,1);loadRecordsCalendar();});
  }

  function patchWizard(){
    const body=$('#wizardOverlay .overlay-body'); if(!body||body.querySelector('.namo-request-status'))return;
    const s=document.createElement('div');s.className='namo-request-status';s.textContent='신청서 작성';body.insertBefore(s,body.firstChild);
  }

  function buildWeek(logs,schedule){
    const box=$('#namoWeekTable'); if(!box)return;
    const now=new Date(); const day=now.getDay(); const mon=new Date(now); mon.setDate(now.getDate()-((day+6)%7)); mon.setHours(0,0,0,0);
    const names=['월','화','수','목','금','토']; let totalMin=0; box.innerHTML='';
    for(let i=0;i<6;i++){
      const d=new Date(mon);d.setDate(mon.getDate()+i); const key=d.toISOString().slice(0,10); const l=logs.find(x=>String(x.workDate||'').slice(0,10)===key);
      let mins=0;if(l?.clockIn&&l?.clockOut){mins=Math.max(0,(new Date(l.clockOut)-new Date(l.clockIn))/60000);totalMin+=mins}
      const c=document.createElement('div');c.className='namo-week-cell'+(d.toDateString()===now.toDateString()?' today':'');
      c.innerHTML='<div class="dow">'+names[i]+'</div><div class="start">'+(l?.clockIn?fmtTime(l.clockIn):(i<5?(schedule.start||'09:00'):'-'))+'</div><div class="end">'+(l?.clockOut?fmtTime(l.clockOut):(i<5?(schedule.end||'18:00'):'-'))+'</div><div class="actual">'+(mins?Math.floor(mins/60)+'h '+Math.round(mins%60)+'m':(d>now?'예정':'-'))+'</div>';
      box.appendChild(c);
    }
    const h=Math.floor(totalMin/60),m=Math.round(totalMin%60); const t=$('#namoWeekTotal');if(t)t.textContent=(totalMin?h+'시간 '+m+'분':'기록 없음');
    const avg=totalMin/60; const av=$('#namoAvgValue');if(av)av.textContent=avg?avg.toFixed(1)+'시간':'기록 없음'; const bar=$('#namoAvgBar');if(bar)bar.style.width=Math.min(100,(avg/52)*100)+'%';
  }

  function renderCalendar(logs,cursor){
    const title=$('#namoMonthTitle'),grid=$('#namoMonthGrid'),detail=$('#namoMonthDetail'); if(!grid)return;
    title.textContent=(cursor.getMonth()+1)+'월 '+cursor.getFullYear();
    const firstDay=new Date(cursor.getFullYear(),cursor.getMonth(),1).getDay(); const last=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate(); grid.innerHTML='';
    for(let i=0;i<firstDay;i++){const e=document.createElement('div');e.className='namo-cal-day empty';grid.appendChild(e)}
    let selectedKey=new Date().toISOString().slice(0,10);
    function showDetail(key){const l=logs.find(x=>String(x.workDate||'').slice(0,10)===key); const d=new Date(key+'T00:00:00'); detail.innerHTML='<div class="namo-month-detail-title">'+fmtDate(d)+'</div>'+(l?'<div class="namo-detail-row"><b>'+fmtTime(l.clockIn)+' - '+fmtTime(l.clockOut)+'</b><span>출퇴근 기록</span></div>':'<div class="namo-detail-row"><b>등록된 근태 기록 없음</b><span>해당 날짜에 저장된 출퇴근 기록이 없습니다.</span></div>');}
    for(let n=1;n<=last;n++){
      const d=new Date(cursor.getFullYear(),cursor.getMonth(),n); const key=d.toISOString().slice(0,10); const l=logs.find(x=>String(x.workDate||'').slice(0,10)===key); const el=document.createElement('button');el.type='button';el.className='namo-cal-day'+(d.getDay()===0?' sun':'')+(key===selectedKey?' selected':'');
      el.innerHTML='<div class="num">'+n+'</div>'+(l?.clockIn?'<span class="namo-cal-chip">'+fmtTime(l.clockIn)+' 출근</span>':'')+(l?.clockOut?'<span class="namo-cal-chip out">'+fmtTime(l.clockOut)+' 퇴근</span>':'');
      el.addEventListener('click',()=>{$$('.namo-cal-day.selected',grid).forEach(x=>x.classList.remove('selected'));el.classList.add('selected');showDetail(key)}); grid.appendChild(el);
    }
    showDetail(selectedKey.slice(0,7)===[cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,'0')].join('-')?selectedKey:new Date(cursor.getFullYear(),cursor.getMonth(),1).toISOString().slice(0,10));
  }

  async function loadRecordsCalendar(){
    const page=$('.page[data-page="records"]'); if(!page||!page._namoCursor)return; const c=page._namoCursor; const month=c.getFullYear()+'-'+String(c.getMonth()+1).padStart(2,'0'); const j=await getJson('/api/attendance/logs?month='+month); const logs=safeData(j)||[]; renderCalendar(Array.isArray(logs)?logs:[],c);
  }

  async function refreshHome(){
    const me=safeData(await getJson('/api/attendance/me'))||{}; const today=safeData(await getJson('/api/attendance/today-v2'))||safeData(await getJson('/api/attendance/today'))||{}; const logsRaw=safeData(await getJson('/api/attendance/logs'))||[]; const logs=Array.isArray(logsRaw)?logsRaw:[]; const sch=safeData(await getJson('/api/attendance/work-schedule'))||{}; const schedule={start:sch.startTime||sch.start_time||'09:00',end:sch.endTime||sch.end_time||'18:00'};
    const td=$('#namoTodayDate');if(td)td.textContent=fmtDate(new Date()); const sched=$('#namoTodaySchedule');if(sched)sched.textContent=schedule.start+' - '+schedule.end;
    const place=$('#namoTodayPlace');if(place)place.textContent=(today.workplaceName||today.workplace_name||$('#workplaceName')?.textContent||'근무지 선택');
    const m=$('#namoMonthLabel');if(m){const d=new Date();m.textContent=(d.getMonth()+1)+'월 기준'}
    buildWeek(logs,schedule);
  }

  function init(){patchHeader();ensureHomeLayout();ensureRecordsCalendar();patchWizard();refreshHome();loadRecordsCalendar();
    document.addEventListener('click',e=>{const b=e.target.closest('.nav-btn[data-page-target="records"]');if(b)setTimeout(loadRecordsCalendar,50)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();