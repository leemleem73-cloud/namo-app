/* NAMO Talk: enterprise messenger + integrated attendance */
const NAMO_TALK_KEY="qmes-namo-talk-v6";
const NAMO_TALK_READ_KEY="qmes-namo-talk-read-v1";
const NAMO_ATTENDANCE_KEY="qmes-namo-attendance-v1";
const NAMO_ATTENDANCE_SESSION_KEY="qmes-namo-attendance-session-v1";

function safeParse(v,fallback){try{return JSON.parse(v||"")||fallback;}catch(e){return fallback;}}
function loadNamoTalkMessages(){return safeParse(localStorage.getItem(NAMO_TALK_KEY),{});}
function saveNamoTalkMessages(data){try{localStorage.setItem(NAMO_TALK_KEY,JSON.stringify(data));}catch(e){}}
function loadNamoTalkReads(){return safeParse(localStorage.getItem(NAMO_TALK_READ_KEY),{});}
function saveNamoTalkReads(data){try{localStorage.setItem(NAMO_TALK_READ_KEY,JSON.stringify(data));}catch(e){}}
function getNamoTalkUsers(){try{const users=typeof loadUsers==="function"?loadUsers():[];return Array.isArray(users)?users.filter(u=>u&&u.name):[];}catch(e){return[];}}
function makeDirectRoomId(a,b){return `dm:${[a,b].sort((x,y)=>String(x).localeCompare(String(y),"ko")).join("|")}`;}

function attendanceDate(d=new Date()){const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
function attendanceTime(d=new Date(),seconds=false){const p=n=>String(n).padStart(2,"0");return `${p(d.getHours())}:${p(d.getMinutes())}${seconds?`:${p(d.getSeconds())}`:""}`;}
function loadAttendance(){
  const local=safeParse(localStorage.getItem(NAMO_ATTENDANCE_KEY),[]);
  const session=safeParse(sessionStorage.getItem(NAMO_ATTENDANCE_SESSION_KEY),[]);
  const merged=[...local];
  session.forEach(row=>{const i=merged.findIndex(r=>r.date===row.date&&((r.uid&&row.uid&&r.uid===row.uid)||r.name===row.name));if(i>=0)merged[i]={...merged[i],...row};else merged.push(row);});
  return merged;
}
function saveAttendance(rows){
  const data=JSON.stringify(rows);
  try{localStorage.setItem(NAMO_ATTENDANCE_KEY,data);sessionStorage.removeItem(NAMO_ATTENDANCE_SESSION_KEY);return false;}
  catch(e){sessionStorage.setItem(NAMO_ATTENDANCE_SESSION_KEY,data);return true;}
}
function attendanceMinutes(t){if(!t)return null;const [h,m]=t.split(":").map(Number);return h*60+m;}
function attendanceWork(row){if(!row.clockIn||!row.clockOut)return "-";const v=Math.max(0,attendanceMinutes(row.clockOut)-attendanceMinutes(row.clockIn));return `${Math.floor(v/60)}시간 ${v%60}분`;}
function attendanceStatus(row){if(!row.clockIn)return "미출근";if(attendanceMinutes(row.clockIn)>540)return "지각";if(row.clockOut&&attendanceMinutes(row.clockOut)<1080)return "조퇴";return "정상";}
function csvValue(v){return `"${String(v==null?"":v).replace(/"/g,'""')}"`;}

function AttendancePanel({currentUser,users}){
  const [records,setRecords]=useState(loadAttendance);
  const [now,setNow]=useState(new Date());
  const [start,setStart]=useState(`${attendanceDate().slice(0,7)}-01`);
  const [end,setEnd]=useState(attendanceDate());
  const [dept,setDept]=useState("");
  const [person,setPerson]=useState("");
  const [notice,setNotice]=useState("");
  const isAdmin=currentUser.role==="admin"||currentUser.name==="관리자";
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  const today=attendanceDate();
  const mine=records.find(r=>r.date===today&&((r.uid&&currentUser.uid&&r.uid===currentUser.uid)||r.name===currentUser.name));
  const showNotice=(text)=>{setNotice(text);setTimeout(()=>setNotice(""),2200);};
  const clockIn=()=>{
    if(mine?.clockIn){showNotice(`이미 ${mine.clockIn}에 출근 처리되었습니다.`);return;}
    const row={date:today,uid:currentUser.uid||currentUser.id||"",name:currentUser.name||"관리자",dept:currentUser.dept||currentUser.department||"관리부",position:currentUser.position||currentUser.rank||"",clockIn:attendanceTime(),clockOut:"",workStatus:"근무",note:""};
    const next=[...records,row];const fallback=saveAttendance(next);setRecords(next);showNotice(fallback?`${row.clockIn} 출근 처리됨 · 임시 저장`:`${row.clockIn} 출근 처리되었습니다.`);
  };
  const clockOut=()=>{
    if(!mine?.clockIn){showNotice("먼저 출근 처리를 해주세요.");return;}
    if(mine.clockOut){showNotice(`이미 ${mine.clockOut}에 퇴근 처리되었습니다.`);return;}
    const next=records.map(r=>r===mine?{...r,clockOut:attendanceTime()}:r);const fallback=saveAttendance(next);setRecords(next);showNotice(fallback?`${attendanceTime()} 퇴근 처리됨 · 임시 저장`:`${attendanceTime()} 퇴근 처리되었습니다.`);
  };
  const filtered=records.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end)&&(!dept||r.dept===dept)&&(!person||r.name===person)&& (isAdmin||r.name===currentUser.name)).sort((a,b)=>b.date.localeCompare(a.date)||String(a.name).localeCompare(String(b.name),"ko"));
  const download=()=>{
    const header=["날짜","사번","이름","부서","직급","출근시간","퇴근시간","총 근무시간","근태상태","근무상태","비고"];
    const lines=[header,...filtered.map(r=>[r.date,r.uid||"",r.name,r.dept||"",r.position||"",r.clockIn||"",r.clockOut||"",attendanceWork(r),attendanceStatus(r),r.workStatus||"근무",r.note||""])].map(row=>row.map(csvValue).join(","));
    const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`NAMO_근태관리_${today}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  };
  const depts=Array.from(new Set(users.map(u=>u.dept).filter(Boolean)));
  return <div style={{flex:1,minHeight:0,overflow:"auto",padding:14,background:"#f8fafc"}}>
    {notice&&<div style={{position:"absolute",top:70,left:"50%",transform:"translateX(-50%)",zIndex:9,background:"#0f2740",color:"white",padding:"9px 14px",borderRadius:9,fontSize:12,fontWeight:800}}>{notice}</div>}
    <div style={{fontSize:18,fontWeight:900}}>근태관리</div><div style={{fontSize:11,color:"#64748b",marginTop:3}}>{currentUser.name} · {currentUser.dept||"부서 미지정"}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:14}}><button onClick={clockIn} disabled={!!mine?.clockIn} style={{height:54,border:0,borderRadius:12,background:mine?.clockIn?"#9bd8c4":"#059669",color:"white",fontSize:18,fontWeight:900,cursor:mine?.clockIn?"default":"pointer"}}>{mine?.clockIn?`출근 ${mine.clockIn}`:"출근하기"}</button><button onClick={clockOut} disabled={!mine?.clockIn||!!mine?.clockOut} style={{height:54,border:0,borderRadius:12,background:mine?.clockOut?"#ef9a9a":!mine?.clockIn?"#fecaca":"#dc2626",color:"white",fontSize:18,fontWeight:900,cursor:!mine?.clockIn||mine?.clockOut?"default":"pointer"}}>{mine?.clockOut?`퇴근 ${mine.clockOut}`:"퇴근하기"}</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>{[["현재시간",attendanceTime(now,true),"#eff6ff","#1d4ed8"],["출근시간",mine?.clockIn||"미등록","#ecfdf5","#047857"],["퇴근시간",mine?.clockOut||"미등록","#fff1f2","#be123c"]].map(([l,v,b,c])=><div key={l} style={{background:b,border:"1px solid #dbe3ea",borderRadius:11,padding:"12px 8px",textAlign:"center"}}><div style={{fontSize:10,color:"#64748b"}}>{l}</div><div style={{fontSize:16,fontWeight:900,color:c,marginTop:5}}>{v}</div></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}><input type="date" value={start} onChange={e=>setStart(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px"}}/><input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px"}}/>{isAdmin&&<select value={dept} onChange={e=>setDept(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",background:"white"}}><option value="">전체 부서</option>{depts.map(d=><option key={d}>{d}</option>)}</select>}{isAdmin&&<select value={person} onChange={e=>setPerson(e.target.value)} style={{height:38,border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",background:"white"}}><option value="">전체 직원</option>{users.map(u=><option key={u.id||u.name}>{u.name}</option>)}</select>}</div>
    <div style={{display:"flex",alignItems:"center",marginTop:12,marginBottom:10}}><span style={{fontSize:11,color:"#64748b"}}>조회 {filtered.length}건 · 등록 직원 {users.length}명</span><button onClick={download} style={{marginLeft:"auto",height:36,border:"1px solid #d4a017",borderRadius:9,background:"#fff8dc",color:"#7c5c00",fontSize:11,fontWeight:900,cursor:"pointer"}}>엑셀 다운로드</button></div>
    <div style={{overflowX:"auto",background:"white",border:"1px solid #dbe3ea",borderRadius:11}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650,fontSize:10}}><thead><tr>{["날짜","이름","부서","출근","퇴근","근무시간","상태"].map(h=><th key={h} style={{padding:9,textAlign:"left",background:"#f1f5f9",borderBottom:"1px solid #dbe3ea",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{filtered.length?filtered.map((r,i)=><tr key={`${r.date}-${r.name}-${i}`}>{[r.date,r.name,r.dept||"-",r.clockIn||"-",r.clockOut||"-",attendanceWork(r),attendanceStatus(r)].map((v,j)=><td key={j} style={{padding:9,borderBottom:"1px solid #eef2f6",whiteSpace:"nowrap"}}>{v}</td>)}</tr>):<tr><td colSpan="7" style={{padding:24,textAlign:"center",color:"#94a3b8"}}>근태 기록이 없습니다.</td></tr>}</tbody></table></div>
  </div>;
}

function NamoTalkTab({onClose}){
  const currentUser=window.__QMES_CURRENT_USER__||{name:"관리자",dept:"관리부",role:"admin",uid:"U-0001"};
  const [users,setUsers]=useState(getNamoTalkUsers);
  const departments=Array.from(new Set(users.map(u=>u.dept).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ko"));
  const channelRooms=[{id:"전체공지",name:"전체공지",type:"notice",subtitle:"전 직원 공지"},...departments.map(d=>({id:`dept:${d}`,name:d,type:"dept",subtitle:`${d} 업무 채널`}))];
  const directRooms=users.filter(u=>u.name!==currentUser.name).map(u=>({id:makeDirectRoomId(currentUser.name,u.name),name:u.name,type:"direct",subtitle:`${u.dept||"부서 미지정"}${u.position?` · ${u.position}`:""}`,user:u}));
  const allRooms=[...channelRooms,...directRooms];
  const [activeRoom,setActiveRoom]=useState(channelRooms[0]?.id||"전체공지");const [messages,setMessages]=useState(loadNamoTalkMessages);const [reads,setReads]=useState(loadNamoTalkReads);const [text,setText]=useState("");const [search,setSearch]=useState("");const [mode,setMode]=useState("chat");const fileRef=useRef(null);const room=allRooms.find(item=>item.id===activeRoom)||allRooms[0];
  useEffect(()=>{const t=setInterval(()=>setUsers(getNamoTalkUsers()),3000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(!room)return;const next={...reads,[room.id]:Date.now()};setReads(next);saveNamoTalkReads(next);},[activeRoom]);
  const appendMessage=payload=>{const next={...messages,[activeRoom]:[...(messages[activeRoom]||[]),payload]};setMessages(next);saveNamoTalkMessages(next);};
  const sendMessage=()=>{const v=text.trim();if(!v||!room)return;appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:v,time:attendanceTime(),kind:room.type==="notice"?"notice":"text"});setText("");};
  const handleFile=async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>3*1024*1024){alert("첨부파일은 3MB 이하만 가능합니다.");return;}const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:file.name,time:attendanceTime(),kind:file.type.startsWith("image/")?"image":"file",fileName:file.name,fileData:dataUrl});};
  const filteredChannels=channelRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));const filteredDirects=directRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  return <section aria-label="NAMO Talk" style={{position:"fixed",top:112,right:0,bottom:0,width:"min(520px,100vw)",zIndex:40,display:"flex",flexDirection:"column",background:"#f4f7fa",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"-10px 0 30px rgba(15,23,42,.22)",borderLeft:"2px solid #d4a017"}}>
    <header style={{height:58,flex:"0 0 auto",display:"flex",alignItems:"center",padding:"0 12px 0 14px",background:"#0f2740",color:"white"}}><div><div style={{fontSize:18,fontWeight:900}}>NAMO Talk</div><div style={{fontSize:11,color:"#a9bfd2",marginTop:2}}>회원관리 연동 업무 메신저</div></div><div style={{marginLeft:"auto",fontSize:12,color:"#c5d5e1",marginRight:8}}>{currentUser.name}</div><button onClick={()=>setMode("attendance")} style={{height:32,padding:"0 10px",border:"1px solid #d4a017",borderRadius:8,background:mode==="attendance"?"#fff3b0":"rgba(212,160,23,.15)",color:mode==="attendance"?"#7c5c00":"#ffe69a",fontWeight:900,cursor:"pointer",marginRight:6}}>근태</button><button onClick={onClose} aria-label="닫기" style={{width:32,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",fontSize:22,cursor:"pointer"}}>×</button></header>
    <div style={{height:42,display:"flex",background:"white",borderBottom:"1px solid #dbe3ea",padding:"0 8px",alignItems:"center",gap:4}}>{[["chat","대화"],["org","조직도"],["attendance","근태관리"]].map(([id,label])=><button key={id} onClick={()=>setMode(id)} style={{height:30,padding:"0 12px",border:0,borderRadius:8,background:mode===id?"#e0f2fe":"transparent",color:mode===id?"#0369a1":"#64748b",fontSize:12,fontWeight:800,cursor:"pointer"}}>{label}</button>)}</div>
    {mode==="attendance"?<AttendancePanel currentUser={currentUser} users={users}/>:mode==="org"?<div style={{flex:1,overflowY:"auto",padding:14}}>{departments.map(dept=><div key={dept} style={{background:"white",border:"1px solid #dbe3ea",borderRadius:12,marginBottom:10,overflow:"hidden"}}><div style={{padding:"10px 12px",fontWeight:900,background:"#f1f5f9"}}>{dept}</div>{users.filter(u=>u.dept===dept).map(u=><button key={u.id||u.name} onClick={()=>{if(u.name!==currentUser.name){setActiveRoom(makeDirectRoomId(currentUser.name,u.name));setMode("chat");}}} style={{width:"100%",border:0,borderTop:"1px solid #eef2f6",background:"white",padding:"10px 12px",textAlign:"left"}}>{u.name} · {u.position||"직급 미지정"}</button>)}</div>)}</div>:<div style={{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"176px minmax(0,1fr)"}}><aside style={{background:"white",borderRight:"1px solid #dbe3ea",overflow:"auto"}}><div style={{padding:9}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채널·직원 검색" style={{width:"100%",height:34,boxSizing:"border-box",border:"1px solid #d7e0e8",borderRadius:9,padding:"0 9px"}}/></div><div style={{padding:7}}>{filteredChannels.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom}/>)}<div style={{fontSize:10,fontWeight:800,color:"#94a3b8",padding:"14px 7px 6px"}}>1:1 대화</div>{filteredDirects.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom}/>)}</div></aside><main style={{display:"flex",flexDirection:"column",minWidth:0,background:"#edf3f7"}}><div style={{height:54,display:"flex",alignItems:"center",padding:"0 13px",background:"white",borderBottom:"1px solid #dbe3ea",fontWeight:900}}>{room?.name||"대화"}</div><div style={{flex:1,overflowY:"auto",padding:12}}>{(messages[activeRoom]||[]).map(msg=><div key={msg.id} style={{marginBottom:10,textAlign:msg.sender===currentUser.name?"right":"left"}}><div style={{fontSize:10,color:"#64748b"}}>{msg.sender}</div><div style={{display:"inline-block",maxWidth:"84%",background:msg.sender===currentUser.name?"#0284c7":"white",color:msg.sender===currentUser.name?"white":"#1e293b",borderRadius:12,padding:"9px 11px"}}>{msg.kind==="image"?<img src={msg.fileData} style={{maxWidth:"100%",maxHeight:220}}/>:msg.kind==="file"?<a href={msg.fileData} download={msg.fileName}>📎 {msg.fileName}</a>:msg.text}</div></div>)}</div><div style={{background:"white",padding:9,borderTop:"1px solid #dbe3ea"}}><input ref={fileRef} type="file" onChange={handleFile} style={{display:"none"}}/><button onClick={()=>fileRef.current?.click()}>📎 파일</button><div style={{display:"flex",gap:7,marginTop:6}}><textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} style={{flex:1,minHeight:48}}/><button onClick={sendMessage} style={{width:56,background:"#0284c7",color:"white",border:0,borderRadius:9,fontWeight:900}}>전송</button></div></div></main></div>}
  </section>;
}

function RoomButton({item,activeRoom,setActiveRoom}){const active=activeRoom===item.id;return <button type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:9,background:active?"#e0f2fe":"transparent",display:"flex",alignItems:"center",gap:7,padding:"8px 7px",cursor:"pointer",textAlign:"left",marginBottom:2}}><span style={{width:29,height:29,borderRadius:item.type==="direct"?"50%":9,background:active?"#0284c7":"#e8eef3",color:active?"white":"#41576a",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{item.name?.[0]||"?"}</span><span><strong style={{display:"block",fontSize:12}}>{item.name}</strong><span style={{fontSize:9,color:"#94a3b8"}}>{item.subtitle}</span></span></button>;}
