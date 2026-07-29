/* Administrator attendance editor for NAMO Talk */
function AttendancePanel({currentUser,users}){
  const [records,setRecords]=useState(loadAttendance);
  const [now,setNow]=useState(new Date());
  const [start,setStart]=useState(`${attendanceDate().slice(0,7)}-01`);
  const [end,setEnd]=useState(attendanceDate());
  const [dept,setDept]=useState("");
  const [person,setPerson]=useState("");
  const [notice,setNotice]=useState("");
  const [editing,setEditing]=useState(null);
  const [editIn,setEditIn]=useState("");
  const [editOut,setEditOut]=useState("");
  const [editReason,setEditReason]=useState("");
  const isAdmin=currentUser.role==="admin"||currentUser.name==="관리자";

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  const today=attendanceDate();
  const mine=records.find(r=>r.date===today&&((r.uid&&currentUser.uid&&r.uid===currentUser.uid)||r.name===currentUser.name));
  const showNotice=(text)=>{setNotice(text);setTimeout(()=>setNotice(""),2200);};

  const commit=(next,message)=>{const fallback=saveAttendance(next);setRecords(next);showNotice(fallback?`${message} · 임시 저장`:message);};
  const clockIn=()=>{
    if(mine?.clockIn){showNotice(`이미 ${mine.clockIn}에 출근 처리되었습니다.`);return;}
    const row={date:today,uid:currentUser.uid||currentUser.id||"",name:currentUser.name||"관리자",dept:currentUser.dept||currentUser.department||"관리부",position:currentUser.position||currentUser.rank||"",clockIn:attendanceTime(),clockOut:"",workStatus:"근무",note:"",editHistory:[]};
    commit([...records,row],`${row.clockIn} 출근 처리되었습니다.`);
  };
  const clockOut=()=>{
    if(!mine?.clockIn){showNotice("먼저 출근 처리를 해주세요.");return;}
    if(mine.clockOut){showNotice(`이미 ${mine.clockOut}에 퇴근 처리되었습니다.`);return;}
    const out=attendanceTime();
    commit(records.map(r=>r===mine?{...r,clockOut:out}:r),`${out} 퇴근 처리되었습니다.`);
  };
  const openEdit=(row)=>{setEditing(row);setEditIn(row.clockIn||"");setEditOut(row.clockOut||"");setEditReason("");};
  const saveEdit=()=>{
    if(!isAdmin)return;
    if(!editReason.trim()){showNotice("수정 사유를 입력해 주세요.");return;}
    if(editIn&&editOut&&attendanceMinutes(editOut)<attendanceMinutes(editIn)){showNotice("퇴근시간은 출근시간보다 빠를 수 없습니다.");return;}
    const changedAt=new Date().toLocaleString("ko-KR");
    const next=records.map(r=>r===editing?{...r,clockIn:editIn,clockOut:editOut,edited:true,lastEditedBy:currentUser.name,lastEditedAt:changedAt,lastEditReason:editReason.trim(),editHistory:[...(r.editHistory||[]),{beforeIn:r.clockIn||"",beforeOut:r.clockOut||"",afterIn:editIn,afterOut:editOut,reason:editReason.trim(),editor:currentUser.name,editedAt:changedAt}]}:r);
    commit(next,"근태 시간이 수정되었습니다.");
    setEditing(null);
  };

  const filtered=records.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end)&&(!dept||r.dept===dept)&&(!person||r.name===person)&&(isAdmin||r.name===currentUser.name)).sort((a,b)=>b.date.localeCompare(a.date)||String(a.name).localeCompare(String(b.name),"ko"));
  const download=()=>{
    const header=["날짜","사번","이름","부서","직급","출근시간","퇴근시간","총 근무시간","근태상태","근무상태","수정여부","최종수정자","최종수정일시","수정사유","비고"];
    const lines=[header,...filtered.map(r=>[r.date,r.uid||"",r.name,r.dept||"",r.position||"",r.clockIn||"",r.clockOut||"",attendanceWork(r),attendanceStatus(r),r.workStatus||"근무",r.edited?"수정됨":"",r.lastEditedBy||"",r.lastEditedAt||"",r.lastEditReason||"",r.note||""])].map(row=>row.map(csvValue).join(","));
    const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`NAMO_근태관리_${today}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  };
  const depts=Array.from(new Set(users.map(u=>u.dept).filter(Boolean)));

  return <div style={{flex:1,minHeight:0,overflow:"auto",padding:14,background:"#f8fafc",position:"relative"}}>
    {notice&&<div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:20,background:"#0f2740",color:"white",padding:"9px 14px",borderRadius:9,fontSize:12,fontWeight:800,whiteSpace:"nowrap"}}>{notice}</div>}
    <div style={{fontSize:18,fontWeight:900}}>근태관리</div><div style={{fontSize:11,color:"#64748b",marginTop:3}}>{currentUser.name} · {currentUser.dept||"부서 미지정"}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:14}}><button onClick={clockIn} disabled={!!mine?.clockIn} style={{height:54,border:0,borderRadius:12,background:mine?.clockIn?"#9bd8c4":"#059669",color:"white",fontSize:18,fontWeight:900,cursor:mine?.clockIn?"default":"pointer"}}>{mine?.clockIn?`출근 ${mine.clockIn}`:"출근하기"}</button><button onClick={clockOut} disabled={!mine?.clockIn||!!mine?.clockOut} style={{height:54,border:0,borderRadius:12,background:mine?.clockOut?"#ef9a9a":!mine?.clockIn?"#fecaca":"#dc2626",color:"white",fontSize:18,fontWeight:900,cursor:!mine?.clockIn||mine?.clockOut?"default":"pointer"}}>{mine?.clockOut?`퇴근 ${mine.clockOut}`:"퇴근하기"}</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>{[["현재시간",attendanceTime(now,true),"#eff6ff","#1d4ed8"],["출근시간",mine?.clockIn||"미등록","#ecfdf5","#047857"],["퇴근시간",mine?.clockOut||"미등록","#fff1f2","#be123c"]].map(([l,v,b,c])=><div key={l} style={{background:b,border:"1px solid #dbe3ea",borderRadius:11,padding:"12px 8px",textAlign:"center"}}><div style={{fontSize:10,color:"#64748b"}}>{l}</div><div style={{fontSize:16,fontWeight:900,color:c,marginTop:5}}>{v}</div></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}><input type="date" value={start} onChange={e=>setStart(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px"}}/><input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px"}}/>{isAdmin&&<select value={dept} onChange={e=>setDept(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",background:"white"}}><option value="">전체 부서</option>{depts.map(d=><option key={d}>{d}</option>)}</select>}{isAdmin&&<select value={person} onChange={e=>setPerson(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",background:"white"}}><option value="">전체 직원</option>{users.map(u=><option key={u.id||u.name}>{u.name}</option>)}</select>}</div>
    <div style={{display:"flex",alignItems:"center",marginTop:12,marginBottom:10}}><span style={{fontSize:11,color:"#64748b"}}>조회 {filtered.length}건 · 등록 직원 {users.length}명</span><button onClick={download} style={{marginLeft:"auto",height:36,border:"1px solid #d4a017",borderRadius:9,background:"#fff8dc",color:"#7c5c00",fontSize:11,fontWeight:900,cursor:"pointer"}}>엑셀 다운로드</button></div>
    <div style={{overflowX:"auto",background:"white",border:"1px solid #dbe3ea",borderRadius:11}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:isAdmin?760:650,fontSize:10}}><thead><tr>{["날짜","이름","부서","출근","퇴근","근무시간","상태",...(isAdmin?["관리"]:[])].map(h=><th key={h} style={{padding:9,textAlign:"left",background:"#f1f5f9",borderBottom:"1px solid #dbe3ea",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{filtered.length?filtered.map((r,i)=><tr key={`${r.date}-${r.name}-${i}`}><td style={{padding:9,borderBottom:"1px solid #eef2f6"}}>{r.date}</td><td style={{padding:9,borderBottom:"1px solid #eef2f6",whiteSpace:"nowrap"}}>{r.name}{r.edited&&<span style={{marginLeft:5,color:"#b45309",fontWeight:900}}>수정됨</span>}</td><td style={{padding:9,borderBottom:"1px solid #eef2f6"}}>{r.dept||"-"}</td><td style={{padding:9,borderBottom:"1px solid #eef2f6"}}>{r.clockIn||"-"}</td><td style={{padding:9,borderBottom:"1px solid #eef2f6"}}>{r.clockOut||"-"}</td><td style={{padding:9,borderBottom:"1px solid #eef2f6",whiteSpace:"nowrap"}}>{attendanceWork(r)}</td><td style={{padding:9,borderBottom:"1px solid #eef2f6"}}>{attendanceStatus(r)}</td>{isAdmin&&<td style={{padding:6,borderBottom:"1px solid #eef2f6"}}><button onClick={()=>openEdit(r)} style={{height:28,padding:"0 9px",border:"1px solid #94a3b8",borderRadius:7,background:"white",fontSize:10,fontWeight:800,cursor:"pointer"}}>수정</button></td>}</tr>):<tr><td colSpan={isAdmin?8:7} style={{padding:24,textAlign:"center",color:"#94a3b8"}}>근태 기록이 없습니다.</td></tr>}</tbody></table></div>
    {editing&&<div style={{position:"fixed",inset:0,zIndex:80,background:"rgba(15,23,42,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(420px,100%)",background:"white",borderRadius:14,boxShadow:"0 20px 50px rgba(15,23,42,.28)",padding:18}}><div style={{fontSize:17,fontWeight:900}}>출퇴근 시간 수정</div><div style={{fontSize:11,color:"#64748b",marginTop:4}}>{editing.date} · {editing.name} · {editing.dept||"부서 미지정"}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16}}><label style={{fontSize:11,fontWeight:800}}>출근시간<input type="time" value={editIn} onChange={e=>setEditIn(e.target.value)} style={{width:"100%",height:38,boxSizing:"border-box",marginTop:5,border:"1px solid #cbd5e1",borderRadius:8,padding:"0 9px"}}/></label><label style={{fontSize:11,fontWeight:800}}>퇴근시간<input type="time" value={editOut} onChange={e=>setEditOut(e.target.value)} style={{width:"100%",height:38,boxSizing:"border-box",marginTop:5,border:"1px solid #cbd5e1",borderRadius:8,padding:"0 9px"}}/></label></div><label style={{display:"block",fontSize:11,fontWeight:800,marginTop:12}}>수정 사유<textarea value={editReason} onChange={e=>setEditReason(e.target.value)} placeholder="예: 현장 출근 기록 누락" style={{width:"100%",minHeight:74,boxSizing:"border-box",marginTop:5,border:"1px solid #cbd5e1",borderRadius:8,padding:9,resize:"vertical"}}/></label><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:14}}><button onClick={()=>setEditing(null)} style={{height:36,padding:"0 14px",border:"1px solid #cbd5e1",borderRadius:8,background:"white",fontWeight:800,cursor:"pointer"}}>취소</button><button onClick={saveEdit} style={{height:36,padding:"0 14px",border:0,borderRadius:8,background:"#0f2740",color:"white",fontWeight:900,cursor:"pointer"}}>수정 저장</button></div></div></div>}
  </div>;
}
