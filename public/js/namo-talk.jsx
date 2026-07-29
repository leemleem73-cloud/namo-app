/* NAMO Talk: enterprise messenger + integrated attendance */
const NAMO_TALK_KEY="qmes-namo-talk-v6";
const NAMO_TALK_READ_KEY="qmes-namo-talk-read-v1";
const NAMO_ATTENDANCE_KEY="qmes-namo-attendance-v1";
const NAMO_ATTENDANCE_SESSION_KEY="qmes-namo-attendance-session-v1";
const NAMO_TALK_POSITION_KEY="qmes-namo-talk-position-v1";

function safeParse(v,fallback){try{return JSON.parse(v||"")||fallback;}catch(e){return fallback;}}
function loadNamoTalkMessages(){return safeParse(localStorage.getItem(NAMO_TALK_KEY),{});}
function saveNamoTalkMessages(data){try{localStorage.setItem(NAMO_TALK_KEY,JSON.stringify(data));}catch(e){}}
function loadNamoTalkReads(){return safeParse(localStorage.getItem(NAMO_TALK_READ_KEY),{});}
function saveNamoTalkReads(data){try{localStorage.setItem(NAMO_TALK_READ_KEY,JSON.stringify(data));}catch(e){}}
function getNamoTalkUsers(){try{const users=typeof loadUsers==="function"?loadUsers():[];return Array.isArray(users)?users.filter(u=>u&&u.name):[];}catch(e){return[];}}
function makeDirectRoomId(a,b){return `dm:${[a,b].sort((x,y)=>String(x).localeCompare(String(y),"ko")).join("|")}`;}
function loadNamoTalkPosition(){
  const saved=safeParse(localStorage.getItem(NAMO_TALK_POSITION_KEY),null);
  if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))return saved;
  return {x:Math.max(16,window.innerWidth-640),y:128};
}
function saveNamoTalkPosition(position){try{localStorage.setItem(NAMO_TALK_POSITION_KEY,JSON.stringify(position));}catch(e){}}

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

function NamoTalkTab({onClose}){
  const currentUser=window.__QMES_CURRENT_USER__||{name:"관리자",dept:"관리부",role:"admin",uid:"U-0001"};
  const [users,setUsers]=useState(getNamoTalkUsers);
  const departments=Array.from(new Set(users.map(u=>u.dept).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ko"));
  const channelRooms=[{id:"전체공지",name:"전체공지",type:"notice",subtitle:"전 직원 공지"},...departments.map(d=>({id:`dept:${d}`,name:d,type:"dept",subtitle:`${d} 업무 채널`}))];
  const directRooms=users.filter(u=>u.name!==currentUser.name).map(u=>({id:makeDirectRoomId(currentUser.name,u.name),name:u.name,type:"direct",subtitle:`${u.dept||"부서 미지정"}${u.position?` · ${u.position}`:""}`,user:u}));
  const allRooms=[...channelRooms,...directRooms];
  const [activeRoom,setActiveRoom]=useState(()=>directRooms[0]?.id||channelRooms[0]?.id||"전체공지");
  const [messages,setMessages]=useState(loadNamoTalkMessages);
  const [reads,setReads]=useState(loadNamoTalkReads);
  const [text,setText]=useState("");
  const [search,setSearch]=useState("");
  const [mode,setMode]=useState("chat");
  const [compact,setCompact]=useState(()=>window.innerWidth<=768);
  const [position,setPosition]=useState(loadNamoTalkPosition);
  const fileRef=useRef(null);
  const scrollRef=useRef(null);
  const panelRef=useRef(null);
  const dragRef=useRef(null);
  const room=allRooms.find(item=>item.id===activeRoom)||allRooms[0];

  useEffect(()=>{const t=setInterval(()=>setUsers(getNamoTalkUsers()),3000);return()=>clearInterval(t);},[]);
  useEffect(()=>{
    if(!room)return;
    const next={...reads,[room.id]:Date.now()};
    setReads(next);
    saveNamoTalkReads(next);
  },[activeRoom]);
  useEffect(()=>{
    if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;
  },[activeRoom,messages]);
  useEffect(()=>{
    if(!allRooms.some(item=>item.id===activeRoom)&&allRooms[0])setActiveRoom(allRooms[0].id);
  },[users.length]);
  useEffect(()=>{
    const onResize=()=>{
      const nextCompact=window.innerWidth<=768;
      setCompact(nextCompact);
      if(nextCompact)return;
      const panel=panelRef.current;
      const width=panel?.offsetWidth||620;
      const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);
      setPosition(previous=>{
        const next={
          x:Math.max(8,Math.min(previous.x,window.innerWidth-width-8)),
          y:Math.max(8,Math.min(previous.y,window.innerHeight-height-8))
        };
        saveNamoTalkPosition(next);
        return next;
      });
    };
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  useEffect(()=>{
    const onPointerMove=event=>{
      const drag=dragRef.current;
      if(!drag||compact)return;
      event.preventDefault();
      const panel=panelRef.current;
      const width=panel?.offsetWidth||620;
      const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);
      const next={
        x:Math.max(8,Math.min(event.clientX-drag.offsetX,window.innerWidth-width-8)),
        y:Math.max(8,Math.min(event.clientY-drag.offsetY,window.innerHeight-height-8))
      };
      setPosition(next);
    };
    const onPointerUp=()=>{
      if(!dragRef.current)return;
      dragRef.current=null;
      saveNamoTalkPosition(position);
      document.body.style.userSelect="";
      document.body.style.cursor="";
    };
    window.addEventListener("pointermove",onPointerMove,{passive:false});
    window.addEventListener("pointerup",onPointerUp);
    window.addEventListener("pointercancel",onPointerUp);
    return()=>{
      window.removeEventListener("pointermove",onPointerMove);
      window.removeEventListener("pointerup",onPointerUp);
      window.removeEventListener("pointercancel",onPointerUp);
    };
  },[compact,position]);

  const startDrag=event=>{
    if(compact||event.button!==0||event.target.closest("button"))return;
    const rect=panelRef.current?.getBoundingClientRect();
    if(!rect)return;
    dragRef.current={offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};
    document.body.style.userSelect="none";
    document.body.style.cursor="grabbing";
    event.preventDefault();
  };

  const appendMessage=payload=>{
    if(!activeRoom)return;
    const next={...messages,[activeRoom]:[...(messages[activeRoom]||[]),payload]};
    setMessages(next);
    saveNamoTalkMessages(next);
  };
  const sendMessage=()=>{
    const v=text.trim();
    if(!v||!room)return;
    appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:v,time:attendanceTime(),kind:room.type==="notice"?"notice":"text"});
    setText("");
  };
  const handleFile=async e=>{
    const file=e.target.files?.[0];
    e.target.value="";
    if(!file)return;
    if(file.size>3*1024*1024){alert("첨부파일은 3MB 이하만 가능합니다.");return;}
    const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
    appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:file.name,time:attendanceTime(),kind:file.type.startsWith("image/")?"image":"file",fileName:file.name,fileData:dataUrl});
  };

  const filteredChannels=channelRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const filteredDirects=directRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const roomMessages=messages[activeRoom]||[];
  const panelStyle=compact
    ? {position:"fixed",top:112,right:0,bottom:0,left:0,width:"100vw",height:"auto"}
    : {position:"fixed",left:position.x,top:position.y,width:"min(620px,calc(100vw - 16px))",height:"min(720px,calc(100vh - 16px))"};

  return <section ref={panelRef} aria-label="NAMO Talk" style={{...panelStyle,zIndex:12000,display:"flex",flexDirection:"column",background:"#f4f7fa",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"0 18px 50px rgba(15,23,42,.32)",border:"2px solid #d4a017",borderRadius:compact?0:14,overflow:"hidden"}}>
    <header onPointerDown={startDrag} title={compact?"NAMO Talk":"제목줄을 잡고 이동하세요"} style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"center",padding:"0 12px 0 14px",background:"#0f2740",color:"white",cursor:compact?"default":"grab",touchAction:"none"}}>
      <div><div style={{fontSize:18,fontWeight:900}}>NAMO Talk <span style={{fontSize:11,color:"#ffe69a",marginLeft:5}}>{compact?"":"↔ 이동 가능"}</span></div><div style={{fontSize:11,color:"#a9bfd2",marginTop:2}}>회원관리 연동 업무 메신저</div></div>
      <div style={{marginLeft:"auto",fontSize:12,color:"#c5d5e1",marginRight:8}}>{currentUser.name}</div>
      <button onClick={()=>setMode("attendance")} style={{height:32,padding:"0 10px",border:"1px solid #d4a017",borderRadius:8,background:mode==="attendance"?"#fff3b0":"rgba(212,160,23,.15)",color:mode==="attendance"?"#7c5c00":"#ffe69a",fontWeight:900,cursor:"pointer",marginRight:6}}>근태</button>
      <button onClick={onClose} aria-label="닫기" style={{width:32,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",fontSize:22,cursor:"pointer"}}>×</button>
    </header>

    <div style={{height:42,flex:"0 0 42px",display:"flex",background:"white",borderBottom:"1px solid #dbe3ea",padding:"0 8px",alignItems:"center",gap:4}}>
      {[["chat","대화"],["org","조직도"],["attendance","근태관리"]].map(([id,label])=><button key={id} onClick={()=>setMode(id)} style={{height:30,padding:"0 12px",border:0,borderRadius:8,background:mode===id?"#e0f2fe":"transparent",color:mode===id?"#0369a1":"#64748b",fontSize:12,fontWeight:800,cursor:"pointer"}}>{label}</button>)}
    </div>

    {mode==="attendance"?<AttendancePanel currentUser={currentUser} users={users}/>:mode==="org"?
      <div style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:14}}>{departments.map(dept=><div key={dept} style={{background:"white",border:"1px solid #dbe3ea",borderRadius:12,marginBottom:10,overflow:"hidden"}}><div style={{padding:"10px 12px",fontWeight:900,background:"#f1f5f9"}}>{dept}</div>{users.filter(u=>u.dept===dept).map(u=><button key={u.id||u.name} onClick={()=>{if(u.name!==currentUser.name){setActiveRoom(makeDirectRoomId(currentUser.name,u.name));setMode("chat");}}} style={{width:"100%",border:0,borderTop:"1px solid #eef2f6",background:"white",padding:"10px 12px",textAlign:"left",cursor:"pointer"}}>{u.name} · {u.position||"직급 미지정"}</button>)}</div>)}</div>
      :
      <div style={{flex:"1 1 auto",minHeight:0,display:"flex",width:"100%",overflow:"hidden"}}>
        <div style={{width:190,flex:"0 0 190px",background:"white",borderRight:"1px solid #dbe3ea",overflowY:"auto"}}>
          <div style={{padding:9}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채널·직원 검색" style={{width:"100%",height:34,boxSizing:"border-box",border:"1px solid #d7e0e8",borderRadius:9,padding:"0 9px"}}/></div>
          <div style={{padding:7}}>{filteredChannels.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom}/>)}<div style={{fontSize:10,fontWeight:800,color:"#94a3b8",padding:"14px 7px 6px"}}>1:1 대화</div>{filteredDirects.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom}/>)}</div>
        </div>

        <div style={{flex:"1 1 auto",minWidth:0,minHeight:0,display:"flex",flexDirection:"column",background:"#edf3f7",overflow:"hidden"}}>
          <div style={{height:54,flex:"0 0 54px",display:"flex",alignItems:"center",padding:"0 14px",background:"white",borderBottom:"1px solid #dbe3ea"}}>
            <div><div style={{fontSize:15,fontWeight:900,color:"#172033"}}>{room?.name||"대화"}</div><div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{room?.subtitle||"메시지를 주고받을 수 있습니다."}</div></div>
          </div>

          <div ref={scrollRef} style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:14}}>
            {roomMessages.length===0&&<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"#94a3b8",fontSize:12,lineHeight:1.6}}><div><div style={{fontSize:28,marginBottom:8}}>💬</div><strong style={{color:"#64748b"}}>아직 대화 내용이 없습니다.</strong><br/>아래 입력창에서 첫 메시지를 보내세요.</div></div>}
            {roomMessages.map(msg=><div key={msg.id} style={{marginBottom:12,textAlign:msg.sender===currentUser.name?"right":"left"}}><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{msg.sender} · {msg.time||""}</div><div style={{display:"inline-block",maxWidth:"84%",background:msg.sender===currentUser.name?"#0284c7":"white",color:msg.sender===currentUser.name?"white":"#1e293b",borderRadius:12,padding:"9px 11px",boxShadow:"0 1px 2px rgba(15,23,42,.08)",wordBreak:"break-word"}}>{msg.kind==="image"?<img src={msg.fileData} alt={msg.fileName||"첨부 이미지"} style={{display:"block",maxWidth:"100%",maxHeight:220,borderRadius:8}}/>:msg.kind==="file"?<a href={msg.fileData} download={msg.fileName} style={{color:"inherit"}}>📎 {msg.fileName}</a>:msg.text}</div></div>)}
          </div>

          <div style={{flex:"0 0 auto",background:"white",padding:10,borderTop:"1px solid #dbe3ea"}}>
            <input ref={fileRef} type="file" onChange={handleFile} style={{display:"none"}}/>
            <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
              <button type="button" onClick={()=>fileRef.current?.click()} style={{height:42,flex:"0 0 auto",padding:"0 11px",border:"1px solid #cbd5e1",borderRadius:9,background:"white",color:"#475569",fontWeight:800,cursor:"pointer"}}>📎 파일</button>
              <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지를 입력하세요" style={{flex:"1 1 auto",minWidth:0,height:58,boxSizing:"border-box",resize:"none",border:"1px solid #cbd5e1",borderRadius:10,padding:"10px 11px",fontFamily:"inherit",fontSize:13,outline:"none"}}/>
              <button type="button" onClick={sendMessage} disabled={!text.trim()} style={{width:62,height:58,flex:"0 0 62px",background:text.trim()?"#0284c7":"#bae6fd",color:"white",border:0,borderRadius:10,fontWeight:900,cursor:text.trim()?"pointer":"default"}}>전송</button>
            </div>
          </div>
        </div>
      </div>}
  </section>;
}

function RoomButton({item,activeRoom,setActiveRoom}){
  const active=activeRoom===item.id;
  return <button type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:9,background:active?"#e0f2fe":"transparent",display:"flex",alignItems:"center",gap:7,padding:"8px 7px",cursor:"pointer",textAlign:"left",marginBottom:2}}><span style={{width:29,height:29,flex:"0 0 29px",borderRadius:item.type==="direct"?"50%":9,background:active?"#0284c7":"#e8eef3",color:active?"white":"#41576a",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{item.name?.[0]||"?"}</span><span style={{minWidth:0}}><strong style={{display:"block",fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",fontSize:9,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.subtitle}</span></span></button>;
}
