/* NAMO attendance time display, actions, list and export sync patch */
(function () {
  const STORAGE_KEY = 'qmes-namo-attendance-v1';
  const SESSION_KEY = 'qmes-namo-attendance-session-v1';
  const pad = (n) => String(n).padStart(2, '0');
  const dateText = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const timeText = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const clockText = (d = new Date()) => `${timeText(d)}:${pad(d.getSeconds())}`;

  function parseRows(value){ try { return JSON.parse(value || '[]'); } catch(e){ return []; } }
  function loadRecords(){
    const localRows = parseRows(localStorage.getItem(STORAGE_KEY));
    const sessionRows = parseRows(sessionStorage.getItem(SESSION_KEY));
    const merged = [...localRows];
    sessionRows.forEach((row) => {
      const idx = merged.findIndex((r) => r.date === row.date && ((r.uid && row.uid && r.uid === row.uid) || r.name === row.name));
      if (idx >= 0) merged[idx] = Object.assign({}, merged[idx], row); else merged.push(row);
    });
    return merged;
  }
  function saveRecords(rows){
    const data = JSON.stringify(rows);
    try { localStorage.setItem(STORAGE_KEY, data); sessionStorage.removeItem(SESSION_KEY); window.__NAMO_ATTENDANCE_STORAGE_FALLBACK__ = false; }
    catch(e) { sessionStorage.setItem(SESSION_KEY, data); window.__NAMO_ATTENDANCE_STORAGE_FALLBACK__ = true; }
    window.dispatchEvent(new CustomEvent('namo-attendance-changed'));
  }
  function getUser(){
    const base = window.__QMES_CURRENT_USER__ || { name:'관리자', dept:'관리부', role:'admin', uid:'U-0001' };
    let found = null;
    try { if (typeof loadUsers === 'function') found = loadUsers().find((u) => u.name === base.name || u.id === base.id || u.uid === base.uid); } catch(e) {}
    return Object.assign({}, base, found || {});
  }
  function make(tag,text,css){ const el=document.createElement(tag); if(text!=null) el.textContent=text; Object.assign(el.style,css||{}); return el; }
  function mins(t){ if(!t) return null; const p=t.split(':').map(Number); return p[0]*60+p[1]; }
  function workHours(row){ if(!row.clockIn || !row.clockOut) return '-'; const v=Math.max(0,mins(row.clockOut)-mins(row.clockIn)); return `${Math.floor(v/60)}시간 ${v%60}분`; }
  function status(row){ if(!row.clockIn) return '미출근'; if(mins(row.clockIn)>540) return '지각'; if(row.clockOut && mins(row.clockOut)<1080) return '조퇴'; return '정상'; }
  function gpsText(pos){ return pos ? `${Number(pos.latitude).toFixed(5)}, ${Number(pos.longitude).toFixed(5)}` : '미확인'; }
  function escapeCsv(v){ return `"${String(v==null?'':v).replace(/"/g,'""')}"`; }

  function toast(panel, message, ok){
    let el=panel.querySelector('#namo-attendance-toast');
    if(!el){ el=make('div','',{position:'absolute',left:'50%',top:'130px',transform:'translateX(-50%)',zIndex:'99',padding:'10px 16px',borderRadius:'10px',fontSize:'12px',fontWeight:'900',boxShadow:'0 8px 24px rgba(15,23,42,.2)',transition:'opacity .2s',whiteSpace:'nowrap'}); el.id='namo-attendance-toast'; panel.appendChild(el); }
    el.textContent=message; el.style.background=ok?'#065f46':'#991b1b'; el.style.color='#fff'; el.style.opacity='1'; clearTimeout(el._timer); el._timer=setTimeout(()=>{el.style.opacity='0';},2200);
  }
  function findTodayRow(rows,user){ const today=dateText(); return rows.findIndex((r)=>r.date===today && (r.uid&&user.uid?r.uid===user.uid:r.name===user.name)); }

  function doClockIn(panel){
    const rows=loadRecords(), user=getUser(), idx=findTodayRow(rows,user);
    if(idx>=0 && rows[idx].clockIn){ toast(panel,`이미 ${rows[idx].clockIn}에 출근 처리되었습니다.`,false); return; }
    const row={date:dateText(),uid:user.uid||user.id||'',name:user.name||'관리자',dept:user.dept||user.department||'관리부',position:user.position||user.rank||'',clockIn:timeText(),clockOut:'',clockInGps:null,clockOutGps:null,workStatus:'근무',note:''};
    if(idx>=0) rows[idx]=Object.assign({},rows[idx],row); else rows.push(row);
    saveRecords(rows); toast(panel,window.__NAMO_ATTENDANCE_STORAGE_FALLBACK__?`${row.clockIn} 출근 처리됨 · 임시 저장`:`${row.clockIn} 출근 처리되었습니다.`,true); refreshPanel(panel);
  }
  function doClockOut(panel){
    const rows=loadRecords(), user=getUser(), idx=findTodayRow(rows,user);
    if(idx<0 || !rows[idx].clockIn){ toast(panel,'먼저 출근 처리를 해주세요.',false); return; }
    if(rows[idx].clockOut){ toast(panel,`이미 ${rows[idx].clockOut}에 퇴근 처리되었습니다.`,false); return; }
    rows[idx].clockOut=timeText(); saveRecords(rows); toast(panel,window.__NAMO_ATTENDANCE_STORAGE_FALLBACK__?`${rows[idx].clockOut} 퇴근 처리됨 · 임시 저장`:`${rows[idx].clockOut} 퇴근 처리되었습니다.`,true); refreshPanel(panel);
  }

  function filteredRows(panel){
    const inputs=[...panel.querySelectorAll('input[type="date"]')];
    const selects=[...panel.querySelectorAll('select')];
    const start=inputs[0]?.value||'', end=inputs[1]?.value||'', dept=selects[0]?.value||'', person=selects[1]?.value||'';
    return loadRecords().filter((r)=>(!start||r.date>=start)&&(!end||r.date<=end)&&(!dept||r.dept===dept)&&(!person||r.name===person)).sort((a,b)=>b.date.localeCompare(a.date)||String(a.name).localeCompare(String(b.name),'ko'));
  }
  function syncTable(panel){
    const table=panel.querySelector('table'); if(!table) return;
    const rows=filteredRows(panel);
    let tbody=table.querySelector('tbody'); if(!tbody){ tbody=document.createElement('tbody'); table.appendChild(tbody); }
    tbody.innerHTML='';
    if(!rows.length){ const tr=document.createElement('tr'); const td=make('td','근태 기록이 없습니다.',{padding:'18px',textAlign:'center',color:'#94a3b8'}); td.colSpan=8; tr.appendChild(td); tbody.appendChild(tr); }
    else rows.forEach((r)=>{ const tr=document.createElement('tr'); [r.date,r.name||'-',r.dept||'-',r.clockIn||'-',r.clockOut||'-',workHours(r),status(r),r.clockInGps?'GPS 확인':'미확인'].forEach((v)=>tr.appendChild(make('td',v,{padding:'8px',borderBottom:'1px solid #eef2f6',whiteSpace:'nowrap'}))); tbody.appendChild(tr); });
    const count=[...panel.querySelectorAll('div')].find((el)=>el.textContent.includes('조회')&&el.textContent.includes('등록 직원'));
    if(count){ let userCount=0; try{ userCount=typeof loadUsers==='function'?loadUsers().length:0; }catch(e){} count.textContent=`조회 ${rows.length}건 · 등록 직원 ${userCount}명`; }
  }
  function downloadCsv(panel){
    const rows=filteredRows(panel);
    const header=['날짜','사번','이름','부서','직급','출근시간','퇴근시간','총 근무시간','근태상태','근무상태','출근 위치','퇴근 위치','비고'];
    const lines=[header,...rows.map((r)=>[r.date,r.uid||'',r.name||'',r.dept||'',r.position||'',r.clockIn||'',r.clockOut||'',workHours(r),status(r),r.workStatus||'근무',gpsText(r.clockInGps),gpsText(r.clockOutGps),r.note||''])].map((row)=>row.map(escapeCsv).join(','));
    const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`NAMO_근태관리_${dateText()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  function refreshPanel(panel){
    update(panel); syncTable(panel);
    const buttons=[...panel.querySelectorAll('button')], inBtn=buttons.find((b)=>b.textContent.trim().startsWith('출근')), outBtn=buttons.find((b)=>b.textContent.trim().startsWith('퇴근'));
    const rows=loadRecords(), user=getUser(), idx=findTodayRow(rows,user), row=idx>=0?rows[idx]:null;
    if(inBtn){ inBtn.disabled=!!row?.clockIn; inBtn.textContent=row?.clockIn?`출근 ${row.clockIn}`:'출근하기'; inBtn.style.opacity=row?.clockIn?'0.65':'1'; }
    if(outBtn){ outBtn.disabled=!row?.clockIn||!!row?.clockOut; outBtn.textContent=row?.clockOut?`퇴근 ${row.clockOut}`:'퇴근하기'; outBtn.style.opacity=(!row?.clockIn||row?.clockOut)?'0.45':'1'; outBtn.style.cursor=(!row?.clockIn||row?.clockOut)?'not-allowed':'pointer'; }
  }
  function update(panel){
    let box=panel.querySelector('#namo-attendance-time-box');
    if(!box){ box=make('div',null,{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',margin:'12px 14px 0'}); box.id='namo-attendance-time-box'; const header=panel.firstElementChild; if(header&&header.nextSibling) panel.insertBefore(box,header.nextSibling); else panel.appendChild(box); }
    const rows=loadRecords(), user=getUser(), idx=findTodayRow(rows,user), row=idx>=0?rows[idx]:null;
    box.innerHTML=''; [['현재시간',clockText(),'#eff6ff','#1d4ed8'],['출근시간',row?.clockIn||'미등록','#ecfdf5','#047857'],['퇴근시간',row?.clockOut||'미등록','#fff1f2','#be123c']].forEach(([label,value,bg,color])=>{ const card=make('div',null,{background:bg,borderRadius:'10px',padding:'10px 8px',textAlign:'center',border:'1px solid rgba(148,163,184,.25)'}); card.append(make('div',label,{fontSize:'10px',color:'#64748b',marginBottom:'4px'}),make('div',value,{fontSize:'15px',fontWeight:'900',color,whiteSpace:'nowrap'})); box.appendChild(card); });
  }

  document.addEventListener('click',(event)=>{
    const panel=event.target.closest('#namo-attendance-panel'), button=event.target.closest('button'); if(!panel||!button) return;
    const text=button.textContent.trim();
    if(text==='출근하기'){ event.preventDefault(); event.stopImmediatePropagation(); doClockIn(panel); }
    else if(text==='퇴근하기'){ event.preventDefault(); event.stopImmediatePropagation(); doClockOut(panel); }
    else if(text==='엑셀 다운로드'){ event.preventDefault(); event.stopImmediatePropagation(); downloadCsv(panel); }
  },true);
  document.addEventListener('change',(event)=>{ const panel=event.target.closest('#namo-attendance-panel'); if(panel&&(event.target.matches('input[type="date"]')||event.target.matches('select'))) setTimeout(()=>syncTable(panel),0); },true);
  setInterval(()=>{ const panel=document.querySelector('#namo-attendance-panel'); if(panel){ update(panel); refreshPanel(panel); } },500);
  window.addEventListener('namo-attendance-changed',()=>{ const panel=document.querySelector('#namo-attendance-panel'); if(panel) refreshPanel(panel); });
})();