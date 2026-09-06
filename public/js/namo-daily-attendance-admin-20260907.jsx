/* NAMO Chemical · PC administrator daily attendance management */
function NamoDailyAttendanceAdminTab(){
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [date,setDate]=useState(today);
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [dept,setDept]=useState('');
  const [keyword,setKeyword]=useState('');
  const [status,setStatus]=useState('');
  const [editing,setEditing]=useState(null);
  const [editIn,setEditIn]=useState('');
  const [editOut,setEditOut]=useState('');
  const [reason,setReason]=useState('');
  const [history,setHistory]=useState([]);
  const [saving,setSaving]=useState(false);

  const request=async(url,opt={})=>{
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...opt});
    const payload=await response.json().catch(()=>({success:false,message:'서버 응답 오류'}));
    if(!response.ok||payload?.success===false)throw new Error(payload?.message||'요청 처리에 실패했습니다.');
    return payload?.data??payload;
  };
  const timeText=value=>value?new Date(value).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}):'-';
  const timeInput=value=>value?new Date(value).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}):'';
  const leaveName=v=>({annual:'연차',am_half:'오전반차',pm_half:'오후반차'}[v]||v||'');
  const workMinutes=row=>{
    if(!row.clockIn||!row.clockOut)return null;
    const mins=Math.max(0,Math.round((new Date(row.clockOut)-new Date(row.clockIn))/60000));
    return Math.max(0,mins-(mins>=360?60:0));
  };
  const workText=row=>{const m=workMinutes(row);if(m==null)return '-';return `${Math.floor(m/60)}시간 ${m%60}분`;};
  const stateOf=row=>{
    if(row.leaveType)return '휴가';
    if(row.clockIn&&row.clockOut)return '정상';
    if(row.clockIn&&!row.clockOut)return '근무중';
    return '미출근';
  };
  const statusStyle=value=>({
    '정상':{background:'#eaf8f1',color:'#137a4b',border:'#bfe8d1'},
    '근무중':{background:'#eaf2ff',color:'#245bc2',border:'#bfd2f7'},
    '휴가':{background:'#fff7e8',color:'#9a6500',border:'#f0d9a5'},
    '미출근':{background:'#fff0f0',color:'#b42318',border:'#f0c1bd'}
  }[value]||{background:'#f3f4f6',color:'#4b5563',border:'#d1d5db'});
  const load=async()=>{
    setLoading(true);setError('');
    try{const data=await request(`/api/attendance/admin/daily?date=${encodeURIComponent(date)}`);setRows(Array.isArray(data?.rows)?data.rows:[]);}catch(e){setError(e.message);setRows([]);}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[date]);

  const departments=Array.from(new Set(rows.map(r=>r.department).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ko'));
  const filtered=rows.filter(r=>(!dept||r.department===dept)&&(!status||stateOf(r)===status)&&(!keyword||`${r.name} ${r.department} ${r.title}`.toLowerCase().includes(keyword.toLowerCase())));
  const summary={
    total:rows.length,
    normal:rows.filter(r=>stateOf(r)==='정상').length,
    working:rows.filter(r=>stateOf(r)==='근무중').length,
    leave:rows.filter(r=>stateOf(r)==='휴가').length,
    absent:rows.filter(r=>stateOf(r)==='미출근').length,
    pending:rows.reduce((sum,r)=>sum+Number(r.correctionPending||0),0)
  };
  const openEdit=async row=>{
    setEditing(row);setEditIn(timeInput(row.clockIn));setEditOut(timeInput(row.clockOut));setReason('');setHistory([]);
    try{setHistory(await request(`/api/attendance/admin/daily/${encodeURIComponent(row.id)}/${encodeURIComponent(date)}/history`));}catch(_e){setHistory([]);}
  };
  const saveEdit=async()=>{
    if(!reason.trim()){alert('수정 사유를 입력해주세요.');return;}
    setSaving(true);
    try{
      await request(`/api/attendance/admin/daily/${encodeURIComponent(editing.id)}/${encodeURIComponent(date)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({clockIn:editIn,clockOut:editOut,reason:reason.trim()})});
      setEditing(null);await load();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const exportCsv=()=>{
    const header=['No','성명','부서','직급','근무일','상태','출근','퇴근','실근무','휴가','수정대기'];
    const csv=[header,...filtered.map((r,i)=>[i+1,r.name,r.department,r.title,date,stateOf(r),timeText(r.clockIn),timeText(r.clockOut),workText(r),leaveName(r.leaveType),r.correctionPending||0])]
      .map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`NAMO_일근무관리_${date}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  };

  const card=(label,value,accent)=> <div style={{background:'#fff',border:'1px solid #dce5ec',borderRadius:12,padding:'14px 16px',minWidth:0}}><div style={{fontSize:11,fontWeight:800,color:'#7b8b98'}}>{label}</div><div style={{marginTop:5,fontSize:24,fontWeight:950,color:accent||'#1f3447'}}>{value}</div></div>;

  return <div style={{maxWidth:1560,margin:'0 auto',fontFamily:"'Pretendard','Noto Sans KR',sans-serif"}}>
    <div style={{display:'flex',alignItems:'flex-end',gap:16,flexWrap:'wrap',marginBottom:16}}><div><div style={{fontSize:22,fontWeight:950,color:'#182b3a'}}>일 근무관리</div><div style={{marginTop:5,fontSize:12,color:'#6f8291'}}>모바일 출퇴근 · 연차 · 근태 수정 데이터를 일자별로 통합 관리합니다.</div></div><div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{height:38,border:'1px solid #c8d5df',borderRadius:8,padding:'0 10px',background:'#fff',fontWeight:800}}/><button onClick={load} style={{height:38,padding:'0 14px',border:'1px solid #9eb8ca',borderRadius:8,background:'#eef5fa',color:'#294f6b',fontWeight:900}}>조회</button><button onClick={exportCsv} style={{height:38,padding:'0 14px',border:'1px solid #9eb8ca',borderRadius:8,background:'#fff',color:'#294f6b',fontWeight:900}}>Excel</button></div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,minmax(110px,1fr))',gap:9,marginBottom:14}}>{card('근태 대상',summary.total)}{card('정상',summary.normal,'#137a4b')}{card('근무중',summary.working,'#245bc2')}{card('휴가',summary.leave,'#9a6500')}{card('미출근',summary.absent,'#b42318')}{card('수정대기',summary.pending,'#8b4bc1')}</div>
    <div style={{background:'#fff',border:'1px solid #dce5ec',borderRadius:12,overflow:'hidden'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',padding:12,borderBottom:'1px solid #e6edf2',background:'#fbfcfd',flexWrap:'wrap'}}><select value={dept} onChange={e=>setDept(e.target.value)} style={{height:36,border:'1px solid #ccd8e1',borderRadius:7,padding:'0 10px',background:'#fff'}}><option value="">전체 부서</option>{departments.map(v=><option key={v}>{v}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)} style={{height:36,border:'1px solid #ccd8e1',borderRadius:7,padding:'0 10px',background:'#fff'}}><option value="">전체 상태</option>{['정상','근무중','휴가','미출근'].map(v=><option key={v}>{v}</option>)}</select><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="성명 · 부서 · 직급 검색" style={{height:36,width:250,border:'1px solid #ccd8e1',borderRadius:7,padding:'0 10px'}}/><div style={{marginLeft:'auto',fontSize:12,fontWeight:800,color:'#708392'}}>{filtered.length}명 표시 · 대표이사 제외</div></div>
      <div style={{overflow:'auto'}}><table style={{width:'100%',minWidth:1120,borderCollapse:'collapse',fontSize:12.5}}><thead><tr>{['No','성명','부서','직급','근무일','상태','출근','퇴근','실근무','휴가','월 출근','수정대기','관리'].map(label=><th key={label} style={{padding:'11px 9px',background:'#f2f6f9',borderBottom:'1px solid #d8e2ea',color:'#42596a',fontWeight:900,textAlign:'center',whiteSpace:'nowrap'}}>{label}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={13} style={{padding:36,textAlign:'center',color:'#7d8d99'}}>근태 데이터를 불러오는 중입니다.</td></tr>:error?<tr><td colSpan={13} style={{padding:36,textAlign:'center',color:'#b42318'}}>{error}</td></tr>:filtered.length?filtered.map((r,i)=>{const state=stateOf(r),s=statusStyle(state);return <tr key={r.id} style={{borderBottom:'1px solid #edf1f4'}}><td style={{padding:10,textAlign:'center'}}>{i+1}</td><td style={{padding:10,fontWeight:900,color:'#223746'}}>{r.name}</td><td style={{padding:10,textAlign:'center'}}>{r.department||'-'}</td><td style={{padding:10,textAlign:'center'}}>{r.title||'-'}</td><td style={{padding:10,textAlign:'center'}}>{date}</td><td style={{padding:10,textAlign:'center'}}><span style={{display:'inline-flex',padding:'4px 8px',borderRadius:999,border:`1px solid ${s.border}`,background:s.background,color:s.color,fontSize:11,fontWeight:900}}>{state}</span></td><td style={{padding:10,textAlign:'center',fontWeight:800}}>{timeText(r.clockIn)}</td><td style={{padding:10,textAlign:'center',fontWeight:800}}>{timeText(r.clockOut)}</td><td style={{padding:10,textAlign:'center'}}>{workText(r)}</td><td style={{padding:10,textAlign:'center'}}>{leaveName(r.leaveType)||'-'}</td><td style={{padding:10,textAlign:'center'}}>{r.monthDays||0}일</td><td style={{padding:10,textAlign:'center',fontWeight:r.correctionPending?'900':'600',color:r.correctionPending?'#8b4bc1':'#7c8b96'}}>{r.correctionPending||0}</td><td style={{padding:8,textAlign:'center'}}><button onClick={()=>openEdit(r)} style={{height:30,padding:'0 10px',border:'1px solid #a9bdcc',borderRadius:7,background:'#fff',color:'#315b78',fontWeight:900}}>상세/수정</button></td></tr>}):<tr><td colSpan={13} style={{padding:36,textAlign:'center',color:'#8a99a5'}}>조건에 맞는 근태 데이터가 없습니다.</td></tr>}</tbody></table></div>
    </div>
    {editing&&<div style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(15,31,45,.42)'}} onClick={()=>setEditing(null)}><div style={{width:'min(760px,96vw)',maxHeight:'90vh',overflow:'auto',background:'#fff',borderRadius:16,boxShadow:'0 30px 90px rgba(15,31,45,.28)'}} onClick={e=>e.stopPropagation()}><div style={{display:'flex',alignItems:'center',padding:'18px 20px',borderBottom:'1px solid #e3e9ee'}}><div><div style={{fontSize:18,fontWeight:950,color:'#1c3140'}}>{editing.name} · {date}</div><div style={{marginTop:4,fontSize:11,color:'#7a8b98'}}>{editing.department||'-'} · {editing.title||'-'} · 원본 및 수정 이력 추적</div></div><button onClick={()=>setEditing(null)} style={{marginLeft:'auto',width:34,height:34,border:0,borderRadius:8,background:'#eef2f5',fontSize:20}}>×</button></div><div style={{padding:20}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><label style={{display:'block',fontSize:11,fontWeight:900,color:'#647785',marginBottom:6}}>출근시간</label><input type="time" value={editIn} onChange={e=>setEditIn(e.target.value)} style={{width:'100%',height:42,border:'1px solid #c8d4dd',borderRadius:8,padding:'0 10px'}}/></div><div><label style={{display:'block',fontSize:11,fontWeight:900,color:'#647785',marginBottom:6}}>퇴근시간</label><input type="time" value={editOut} onChange={e=>setEditOut(e.target.value)} style={{width:'100%',height:42,border:'1px solid #c8d4dd',borderRadius:8,padding:'0 10px'}}/></div></div><label style={{display:'block',fontSize:11,fontWeight:900,color:'#647785',margin:'14px 0 6px'}}>수정 사유 *</label><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="예: 모바일 출근 누락 확인 후 관리자 보정" style={{width:'100%',minHeight:82,border:'1px solid #c8d4dd',borderRadius:8,padding:10,resize:'vertical'}}/><button disabled={saving} onClick={saveEdit} style={{marginTop:12,width:'100%',height:42,border:0,borderRadius:8,background:'#244f6d',color:'#fff',fontWeight:950}}>{saving?'저장 중...':'수정 저장'}</button><div style={{marginTop:20,fontSize:13,fontWeight:950,color:'#263d4d'}}>수정 이력</div><div style={{marginTop:8,border:'1px solid #e0e6eb',borderRadius:9,overflow:'hidden'}}>{history.length?history.map(h=><div key={h.id} style={{padding:11,borderBottom:'1px solid #edf1f4',fontSize:11.5,lineHeight:1.55}}><div style={{fontWeight:900,color:'#304d62'}}>{h.editor_name||'관리자'} · {new Date(h.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</div><div style={{color:'#5c7080'}}>출근 {timeText(h.original_clock_in)} → {timeText(h.new_clock_in)} / 퇴근 {timeText(h.original_clock_out)} → {timeText(h.new_clock_out)}</div><div style={{color:'#7b5b28'}}>사유: {h.reason}</div></div>):<div style={{padding:18,textAlign:'center',fontSize:11.5,color:'#8b99a4'}}>관리자 수정 이력이 없습니다.</div>}</div></div></div></div>}
  </div>;
}
window.NamoDailyAttendanceAdminTab=NamoDailyAttendanceAdminTab;
