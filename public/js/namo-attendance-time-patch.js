/* NAMO attendance time display and button action patch */
(function () {
  const STORAGE_KEY = 'qmes-namo-attendance-v1';
  const pad = (n) => String(n).padStart(2, '0');
  const dateText = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const timeText = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const clockText = (d = new Date()) => `${timeText(d)}:${pad(d.getSeconds())}`;

  function loadRecords(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveRecords(rows){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('namo-attendance-changed'));
  }
  function getUser(){
    const base = window.__QMES_CURRENT_USER__ || { name:'관리자', dept:'관리부', role:'admin', uid:'U-0001' };
    let found = null;
    try {
      if (typeof loadUsers === 'function') {
        found = loadUsers().find((u) => u.name === base.name || u.id === base.id || u.uid === base.uid);
      }
    } catch(e) {}
    return Object.assign({}, base, found || {});
  }
  function make(tag,text,css){
    const el=document.createElement(tag);
    if(text!=null) el.textContent=text;
    Object.assign(el.style,css||{});
    return el;
  }
  function toast(panel, message, ok){
    let el=panel.querySelector('#namo-attendance-toast');
    if(!el){
      el=make('div','',{position:'absolute',left:'50%',top:'130px',transform:'translateX(-50%)',zIndex:'99',padding:'10px 16px',borderRadius:'10px',fontSize:'12px',fontWeight:'900',boxShadow:'0 8px 24px rgba(15,23,42,.2)',transition:'opacity .2s'});
      el.id='namo-attendance-toast';
      panel.appendChild(el);
    }
    el.textContent=message;
    el.style.background=ok ? '#065f46' : '#991b1b';
    el.style.color='#fff';
    el.style.opacity='1';
    clearTimeout(el._timer);
    el._timer=setTimeout(()=>{ el.style.opacity='0'; },1800);
  }
  function findTodayRow(rows, user){
    const today=dateText();
    return rows.findIndex((r)=>r.date===today && (r.uid && user.uid ? r.uid===user.uid : r.name===user.name));
  }
  function doClockIn(panel){
    const rows=loadRecords();
    const user=getUser();
    const idx=findTodayRow(rows,user);
    if(idx>=0 && rows[idx].clockIn){
      toast(panel,`이미 ${rows[idx].clockIn}에 출근 처리되었습니다.`,false);
      return;
    }
    const row={
      date:dateText(), uid:user.uid||user.id||'', name:user.name||'관리자', dept:user.dept||user.department||'관리부', position:user.position||user.rank||'',
      clockIn:timeText(), clockOut:'', clockInGps:null, clockOutGps:null, workStatus:'근무', note:''
    };
    if(idx>=0) rows[idx]=Object.assign({},rows[idx],row); else rows.push(row);
    saveRecords(rows);
    toast(panel,`${row.clockIn} 출근 처리되었습니다.`,true);
    refreshPanel(panel);
  }
  function doClockOut(panel){
    const rows=loadRecords();
    const user=getUser();
    const idx=findTodayRow(rows,user);
    if(idx<0 || !rows[idx].clockIn){
      toast(panel,'먼저 출근 처리를 해주세요.',false);
      return;
    }
    if(rows[idx].clockOut){
      toast(panel,`이미 ${rows[idx].clockOut}에 퇴근 처리되었습니다.`,false);
      return;
    }
    rows[idx].clockOut=timeText();
    saveRecords(rows);
    toast(panel,`${rows[idx].clockOut} 퇴근 처리되었습니다.`,true);
    refreshPanel(panel);
  }
  function refreshPanel(panel){
    update(panel);
    const buttons=[...panel.querySelectorAll('button')];
    const inBtn=buttons.find((b)=>b.textContent.trim().startsWith('출근'));
    const outBtn=buttons.find((b)=>b.textContent.trim().startsWith('퇴근'));
    const rows=loadRecords();
    const user=getUser();
    const idx=findTodayRow(rows,user);
    const row=idx>=0?rows[idx]:null;
    if(inBtn){
      inBtn.disabled=!!row?.clockIn;
      inBtn.textContent=row?.clockIn?`출근 ${row.clockIn}`:'출근하기';
      inBtn.style.opacity=row?.clockIn?'0.65':'1';
    }
    if(outBtn){
      outBtn.disabled=!row?.clockIn || !!row?.clockOut;
      outBtn.textContent=row?.clockOut?`퇴근 ${row.clockOut}`:'퇴근하기';
      outBtn.style.opacity=(!row?.clockIn || row?.clockOut)?'0.45':'1';
      outBtn.style.cursor=(!row?.clockIn || row?.clockOut)?'not-allowed':'pointer';
    }
  }
  function update(panel){
    let box=panel.querySelector('#namo-attendance-time-box');
    if(!box){
      box=make('div',null,{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',margin:'12px 14px 0'});
      box.id='namo-attendance-time-box';
      const header=panel.firstElementChild;
      if(header&&header.nextSibling) panel.insertBefore(box,header.nextSibling);
      else panel.appendChild(box);
    }
    const rows=loadRecords();
    const user=getUser();
    const idx=findTodayRow(rows,user);
    const row=idx>=0?rows[idx]:null;
    box.innerHTML='';
    const cards=[
      ['현재시간',clockText(),'#eff6ff','#1d4ed8'],
      ['출근시간',row?.clockIn||'미등록','#ecfdf5','#047857'],
      ['퇴근시간',row?.clockOut||'미등록','#fff1f2','#be123c']
    ];
    cards.forEach(([label,value,bg,color])=>{
      const card=make('div',null,{background:bg,borderRadius:'10px',padding:'10px 8px',textAlign:'center',border:'1px solid rgba(148,163,184,.25)'});
      card.append(make('div',label,{fontSize:'10px',color:'#64748b',marginBottom:'4px'}),make('div',value,{fontSize:'15px',fontWeight:'900',color,whiteSpace:'nowrap'}));
      box.appendChild(card);
    });
  }

  document.addEventListener('click',(event)=>{
    const panel=event.target.closest('#namo-attendance-panel');
    const button=event.target.closest('button');
    if(!panel || !button) return;
    const text=button.textContent.trim();
    if(text==='출근하기'){
      event.preventDefault(); event.stopImmediatePropagation(); doClockIn(panel);
    } else if(text==='퇴근하기'){
      event.preventDefault(); event.stopImmediatePropagation(); doClockOut(panel);
    }
  },true);

  setInterval(()=>{
    const panel=document.querySelector('#namo-attendance-panel');
    if(panel){ update(panel); refreshPanel(panel); }
  },500);
  window.addEventListener('namo-attendance-changed',()=>{
    const panel=document.querySelector('#namo-attendance-panel');
    if(panel) refreshPanel(panel);
  });
})();