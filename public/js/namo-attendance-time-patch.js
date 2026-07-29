/* NAMO attendance time display patch */
(function () {
  const STORAGE_KEY = 'qmes-namo-attendance-v1';
  const pad = (n) => String(n).padStart(2, '0');
  const dateText = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const clockText = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  function loadRecords(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function currentUser(){
    const base = window.__QMES_CURRENT_USER__ || { name:'관리자' };
    return base.name || '관리자';
  }
  function make(tag,text,css){
    const el=document.createElement(tag);
    if(text!=null) el.textContent=text;
    Object.assign(el.style,css||{});
    return el;
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
    const today=dateText();
    const row=loadRecords().find(r=>r.date===today&&r.name===currentUser());
    box.innerHTML='';
    const cards=[
      ['현재시간',clockText(),'#eff6ff','#1d4ed8'],
      ['출근시간',row?.clockIn||'미등록','#ecfdf5','#047857'],
      ['퇴근시간',row?.clockOut||'미등록','#fff1f2','#be123c']
    ];
    cards.forEach(([label,value,bg,color])=>{
      const card=make('div',null,{background:bg,borderRadius:'10px',padding:'10px 8px',textAlign:'center',border:'1px solid rgba(148,163,184,.25)'});
      card.append(
        make('div',label,{fontSize:'10px',color:'#64748b',marginBottom:'4px'}),
        make('div',value,{fontSize:'15px',fontWeight:'900',color,whiteSpace:'nowrap'})
      );
      box.appendChild(card);
    });
  }
  setInterval(()=>{
    const panel=document.querySelector('#namo-attendance-panel');
    if(panel) update(panel);
  },500);
})();