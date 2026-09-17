(function(){
  'use strict';
  const SCHEDULE_KEY='namo-attendance-work-schedule-v1';
  const DEFAULT_SCHEDULE={start:'08:00',end:'17:00'};
  function $(s,r=document){return r.querySelector(s)}
  function $$(s,r=document){return Array.from(r.querySelectorAll(s))}
  function fmtDate(d){return d.toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'})}
  function fmtTime(v){if(!v)return '--:--';const d=new Date(v);return isNaN(d)?'--:--':d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})}
  function safeData(j){return j&&typeof j==='object'&&'data'in j?j.data:j}
  async function getJson(url){try{const r=await fetch(url,{credentials:'same-origin'});const t=await r.text();try{return JSON.parse(t)}catch(_e){return null}}catch(_e){return null}}
  async function putJson(url,body){try{const r=await fetch(url,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const t=await r.text();let j=null;try{j=JSON.parse(t)}catch(_e){}return{ok:r.ok&&j?.success!==false,json:j}}catch(_e){return{ok:false,json:null}}}
  function validTime(v){return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''))}
  function readLocalSchedule(){try{const v=JSON.parse(localStorage.getItem(SCHEDULE_KEY)||'null');if(v&&validTime(v.start)&&validTime(v.end)&&v.end>v.start)return v}catch(_e){}return null}
  function writeLocalSchedule(v){try{localStorage.setItem(SCHEDULE_KEY,JSON.stringify({start:v.start,end:v.end}))}catch(_e){}}
  async function loadWorkSchedule(){
    const local=readLocalSchedule();if(local)return local;
    const sch=safeData(await getJson('/api/attendance/work-schedule'))||{};
    let start=sch.startTime||sch.start_time||DEFAULT_SCHEDULE.start;
    let end=sch.endTime||sch.end_time||DEFAULT_SCHEDULE.end;
    if(!validTime(start)||!validTime(end)||end<=start){start=DEFAULT_SCHEDULE.start;end=DEFAULT_SCHEDULE.end}
    if(start==='09:00'&&end==='18:00'){start=DEFAULT_SCHEDULE.start;end=DEFAULT_SCHEDULE.end}
    const result={start,end};writeLocalSchedule(result);return result;
  }
  async function saveWorkSchedule(schedule){
    writeLocalSchedule(schedule);
    const result=await putJson('/api/attendance/work-schedule',{startTime:schedule.start,endTime:schedule.end});
    return result.ok;
  }

  function patchHeader(){
    const row=$('.topbar-row'); if(!row||$('#namoMenuBtn'))return;
    const menu=document.createElement('button'); menu.id='namoMenuBtn'; menu.type='button'; menu.setAttribute('aria-label','메뉴'); menu.textContent='☰';
    const refresh=document.createElement('button'); refresh.id='namoRefreshBtn'; refresh.type='button'; refresh.setAttribute('aria-label','새로고침'); refresh.textContent='↻';
    row.insertBefore(menu,row.firstChild); row.appendChild(refresh);
    menu.addEventListener('click',()=>{const more=$('.nav-btn[data-page-target="more"]'); if(more)more.click();});
    refresh.addEventListener('click',()=>location.reload());
  }

  function ensureClockCardLabels(schedule){
    const grid=$('.clock-grid');if(!grid)return;
    let buttons=$$('.clock-btn',grid);
    if(buttons.length<2)buttons=$$('button',grid);
    if(buttons.length<2)return;
    const values=[
      {label:'출근하기',time:schedule?.start||DEFAULT_SCHEDULE.start,type:'in'},
      {label:'퇴근하기',time:schedule?.end||DEFAULT_SCHEDULE.end,type:'out'}
    ];
    buttons.slice(0,2).forEach((btn,index)=>{
      const value=values[index];
      btn.style.position='relative';
      btn.style.overflow='hidden';
      let overlay=btn.querySelector('.namo-clock-card-label');
      if(!overlay){
        overlay=document.createElement('div');
        overlay.className='namo-clock-card-label namo-clock-card-label-'+value.type;
        Object.assign(overlay.style,{position:'absolute',left:'10px',top:'10px',zIndex:'30',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'2px',padding:'6px 8px',borderRadius:'9px',background:'rgba(20,48,78,.52)',color:'#fff',pointerEvents:'none',textAlign:'left',boxShadow:'0 2px 8px rgba(0,0,0,.10)',backdropFilter:'blur(1px)'});
        const label=document.createElement('strong');
        label.className='namo-clock-card-title';
        Object.assign(label.style,{display:'block',fontSize:'15px',lineHeight:'1.15',fontWeight:'900',color:'#fff',whiteSpace:'nowrap',textShadow:'0 1px 3px rgba(0,0,0,.28)'});
        const time=document.createElement('span');
        time.className='namo-clock-card-time';
        Object.assign(time.style,{display:'block',fontSize:'11px',lineHeight:'1.15',fontWeight:'900',color:'#fff',whiteSpace:'nowrap',textShadow:'0 1px 3px rgba(0,0,0,.28)'});
        overlay.append(label,time);btn.appendChild(overlay);
      }
      const label=overlay.querySelector('.namo-clock-card-title');
      const time=overlay.querySelector('.namo-clock-card-time');
      if(label)label.textContent=value.label;
      if(time)time.textContent=value.time;
    });
  }

  function openScheduleEditor(){
    if($('#namoScheduleEditor'))return;
    const current=readLocalSchedule()||DEFAULT_SCHEDULE;
    const overlay=document.createElement('div');overlay.id='namoScheduleEditor';
    Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'10000',background:'rgba(15,23,42,.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:'18px'});
    const card=document.createElement('div');
    Object.assign(card.style,{width:'min(360px,100%)',background:'#fff',borderRadius:'20px',boxShadow:'0 24px 70px rgba(15,23,42,.28)',padding:'20px',fontFamily:'inherit'});
    card.innerHTML='<div style="font-size:19px;font-weight:900;color:#162236;margin-bottom:4px">근무시간 수정</div><div style="font-size:11px;color:#7a8594;margin-bottom:18px">기본 근무시간을 직접 변경할 수 있습니다.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="font-size:11px;font-weight:800;color:#5f6f82">출근시간<input id="namoScheduleStart" type="time" value="'+current.start+'" style="display:block;width:100%;height:46px;margin-top:7px;padding:0 10px;border:1px solid #d7e0ea;border-radius:11px;font:800 16px inherit;color:#17233a;background:#f8fbfe;box-sizing:border-box"></label><label style="font-size:11px;font-weight:800;color:#5f6f82">퇴근시간<input id="namoScheduleEnd" type="time" value="'+current.end+'" style="display:block;width:100%;height:46px;margin-top:7px;padding:0 10px;border:1px solid #d7e0ea;border-radius:11px;font:800 16px inherit;color:#17233a;background:#f8fbfe;box-sizing:border-box"></label></div><div id="namoScheduleError" style="min-height:18px;margin-top:8px;font-size:11px;color:#d33"></div><div style="display:flex;gap:8px;margin-top:8px"><button id="namoScheduleCancel" type="button" style="flex:1;height:44px;border:1px solid #d8e1eb;border-radius:11px;background:#fff;color:#526174;font-weight:900">취소</button><button id="namoScheduleSave" type="button" style="flex:1;height:44px;border:0;border-radius:11px;background:#1879e7;color:#fff;font-weight:900">저장</button></div>';
    overlay.appendChild(card);document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    $('#namoScheduleCancel',overlay)?.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    $('#namoScheduleSave',overlay)?.addEventListener('click',async()=>{
      const start=$('#namoScheduleStart',overlay)?.value||'';const end=$('#namoScheduleEnd',overlay)?.value||'';const err=$('#namoScheduleError',overlay);
      if(!validTime(start)||!validTime(end)){if(err)err.textContent='출근·퇴근 시간을 확인해 주세요.';return}
      if(end<=start){if(err)err.textContent='퇴근시간은 출근시간보다 늦어야 합니다.';return}
      const save=$('#namoScheduleSave',overlay);if(save){save.disabled=true;save.textContent='저장 중...'}
      const serverSaved=await saveWorkSchedule({start,end});
      const sched=$('#namoTodaySchedule');if(sched)sched.textContent=start+' - '+end;
      ensureClockCardLabels({start,end});
      close();await refreshHome();
      if(!serverSaved)console.warn('[Attendance schedule] server save unavailable; browser schedule saved locally.');
    });
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
        ensureClockCardLabels(readLocalSchedule()||DEFAULT_SCHEDULE);
      }
      const meta=document.createElement('div'); meta.className='namo-today-meta'; meta.innerHTML='<div><div style="display:flex;align-items:center;gap:8px"><b id="namoTodaySchedule">08:00 - 17:00</b><button id="namoScheduleEdit" type="button" aria-label="근무시간 수정" style="height:26px;padding:0 9px;border:1px solid #cfe0f3;border-radius:8px;background:#f3f8ff;color:#176fd0;font-size:10px;font-weight:900;cursor:pointer">수정</button></div><div id="namoTodayPlace" style="font-size:11px;margin-top:3px;color:#7a8594">근무지 확인 중</div></div><span class="namo-availability">출근 가능</span>';
      firstCard.insertBefore(meta,firstCard.firstChild);
      $('#namoScheduleEdit')?.addEventListener('click',openScheduleEditor);
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
      c.innerHTML='<div class="dow">'+names[i]+'</div><div class="start">'+(l?.clockIn?fmtTime(l.clockIn):(i<5?(schedule.start||'08:00'):'-'))+'</div><div class="end">'+(l?.clockOut?fmtTime(l.clockOut):(i<5?(schedule.end||'17:00'):'-'))+'</div><div class="actual">'+(mins?Math.floor(mins/60)+'h '+Math.round(mins%60)+'m':(d>now?'예정':'-'))+'</div>';
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
    const me=safeData(await getJson('/api/attendance/me'))||{}; const today=safeData(await getJson('/api/attendance/today-v2'))||safeData(await getJson('/api/attendance/today'))||{}; const logsRaw=safeData(await getJson('/api/attendance/logs'))||[]; const logs=Array.isArray(logsRaw)?logsRaw:[]; const schedule=await loadWorkSchedule();
    const td=$('#namoTodayDate');if(td)td.textContent=fmtDate(new Date()); const sched=$('#namoTodaySchedule');if(sched)sched.textContent=schedule.start+' - '+schedule.end;
    ensureClockCardLabels(schedule);
    const place=$('#namoTodayPlace');if(place)place.textContent=(today.workplaceName||today.workplace_name||$('#workplaceName')?.textContent||'근무지 선택');
    const m=$('#namoMonthLabel');if(m){const d=new Date();m.textContent=(d.getMonth()+1)+'월 기준'}
    buildWeek(logs,schedule);
  }

  function init(){patchHeader();ensureHomeLayout();ensureRecordsCalendar();patchWizard();refreshHome();loadRecordsCalendar();
    document.addEventListener('click',e=>{const b=e.target.closest('.nav-btn[data-page-target="records"]');if(b)setTimeout(loadRecordsCalendar,50)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();