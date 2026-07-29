/* NAMO Talk: enterprise messenger + integrated attendance */
window.__NAMO_TALK_DRAG_FIX__=true;
const NAMO_TALK_KEY="qmes-namo-talk-v6";
const NAMO_TALK_READ_KEY="qmes-namo-talk-read-v1";
const NAMO_ATTENDANCE_KEY="qmes-namo-attendance-v1";
const NAMO_ATTENDANCE_SESSION_KEY="qmes-namo-attendance-session-v1";
const NAMO_TALK_POSITION_KEY="qmes-namo-talk-position-v1";
const NAMO_TALK_NOTIFY_KEY="qmes-namo-talk-notify-v1";
const NAMO_TALK_MINIMIZED_KEY="qmes-namo-talk-minimized-v1";

function safeParse(v,fallback){try{return JSON.parse(v||"")||fallback;}catch(e){return fallback;}}
function loadNamoTalkMessages(){return safeParse(localStorage.getItem(NAMO_TALK_KEY),{});}
function saveNamoTalkMessages(data){try{localStorage.setItem(NAMO_TALK_KEY,JSON.stringify(data));}catch(e){}}
function loadNamoTalkReads(){return safeParse(localStorage.getItem(NAMO_TALK_READ_KEY),{});}
function saveNamoTalkReads(data){try{localStorage.setItem(NAMO_TALK_READ_KEY,JSON.stringify(data));}catch(e){}}
function getNamoTalkUsers(){try{const users=typeof loadUsers==="function"?loadUsers():[];return Array.isArray(users)?users.filter(u=>u&&u.name):[];}catch(e){return[];}}
function makeDirectRoomId(a,b){return `dm:${[a,b].sort((x,y)=>String(x).localeCompare(String(y),"ko")).join("|")}`;}
function loadNamoTalkPosition(){const saved=safeParse(localStorage.getItem(NAMO_TALK_POSITION_KEY),null);if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))return saved;return {x:Math.max(16,window.innerWidth-640),y:128};}
function saveNamoTalkPosition(position){try{localStorage.setItem(NAMO_TALK_POSITION_KEY,JSON.stringify(position));}catch(e){}}

function attendanceDate(d=new Date()){const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
function attendanceTime(d=new Date(),seconds=false){const p=n=>String(n).padStart(2,"0");return `${p(d.getHours())}:${p(d.getMinutes())}${seconds?`:${p(d.getSeconds())}`:""}`;}
function loadAttendance(){const local=safeParse(localStorage.getItem(NAMO_ATTENDANCE_KEY),[]);const session=safeParse(sessionStorage.getItem(NAMO_ATTENDANCE_SESSION_KEY),[]);const merged=[...local];session.forEach(row=>{const i=merged.findIndex(r=>r.date===row.date&&((r.uid&&row.uid&&r.uid===row.uid)||r.name===row.name));if(i>=0)merged[i]={...merged[i],...row};else merged.push(row);});return merged;}
function saveAttendance(rows){const data=JSON.stringify(rows);try{localStorage.setItem(NAMO_ATTENDANCE_KEY,data);sessionStorage.removeItem(NAMO_ATTENDANCE_SESSION_KEY);return false;}catch(e){sessionStorage.setItem(NAMO_ATTENDANCE_SESSION_KEY,data);return true;}}
function attendanceMinutes(t){if(!t)return null;const [h,m]=t.split(":").map(Number);return h*60+m;}
function attendanceWork(row){if(!row.clockIn||!row.clockOut)return "-";const v=Math.max(0,attendanceMinutes(row.clockOut)-attendanceMinutes(row.clockIn));return `${Math.floor(v/60)}시간 ${v%60}분`;}
function attendanceStatus(row){if(!row.clockIn)return "미출근";if(attendanceMinutes(row.clockIn)>540)return "지각";if(row.clockOut&&attendanceMinutes(row.clockOut)<1080)return "조퇴";return "정상";}
function csvValue(v){return `"${String(v==null?"":v).replace(/"/g,'""')}"`;}

const NAMO_EMOTICONS=[
  "💧😊","💧😍","💧😂","💧😭","💧👍","💧👏","💧🙏","💧💪",
  "💧❤️","💧🎉","💧😳","💧😴","💧😎","💧💻","💧☕","💧📦",
  "💧✅","💧❗","💧🤔","💧🥳","💧🙇","💧✨","💧📞","💧⏰"
];

function NamoDrop({size=34}){
  return <span aria-hidden="true" style={{width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center",flex:"0 0 auto",borderRadius:"55% 55% 60% 60% / 68% 68% 42% 42%",transform:"rotate(45deg)",background:"linear-gradient(145deg,#d8d4ff,#8b7cf4)",border:"1px solid rgba(255,255,255,.75)",boxShadow:"inset 0 2px 5px rgba(255,255,255,.7),0 2px 6px rgba(15,39,64,.25)",position:"relative"}}><span style={{transform:"rotate(-45deg)",fontSize:Math.max(13,size*.42),lineHeight:1}}>•ᴗ•</span></span>;
}

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
  const [compact,setCompact]=useState(()=>window.innerWidth<=480);
  const [position,setPosition]=useState(loadNamoTalkPosition);
  const [minimized,setMinimized]=useState(()=>localStorage.getItem(NAMO_TALK_MINIMIZED_KEY)==="1");
  const [notifyOn,setNotifyOn]=useState(()=>localStorage.getItem(NAMO_TALK_NOTIFY_KEY)!=="0");
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [toast,setToast]=useState("");
  const fileRef=useRef(null),scrollRef=useRef(null),panelRef=useRef(null),dragRef=useRef(null);
  const room=allRooms.find(item=>item.id===activeRoom)||allRooms[0];

  useEffect(()=>{const t=setInterval(()=>setUsers(getNamoTalkUsers()),3000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(!room)return;const next={...reads,[room.id]:Date.now()};setReads(next);saveNamoTalkReads(next);},[activeRoom]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[activeRoom,messages]);
  useEffect(()=>{if(!allRooms.some(item=>item.id===activeRoom)&&allRooms[0])setActiveRoom(allRooms[0].id);},[users.length]);
  useEffect(()=>{const onResize=()=>{const nextCompact=window.innerWidth<=480;setCompact(nextCompact);if(nextCompact)return;const panel=panelRef.current;const width=panel?.offsetWidth||620;const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);setPosition(previous=>{const next={x:Math.max(8,Math.min(previous.x,window.innerWidth-width-8)),y:Math.max(8,Math.min(previous.y,window.innerHeight-height-8))};saveNamoTalkPosition(next);return next;});};window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
  useEffect(()=>{const onPointerMove=event=>{const drag=dragRef.current;if(!drag||compact)return;event.preventDefault();const panel=panelRef.current;const width=panel?.offsetWidth||620;const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);setPosition({x:Math.max(8,Math.min(event.clientX-drag.offsetX,window.innerWidth-width-8)),y:Math.max(8,Math.min(event.clientY-drag.offsetY,window.innerHeight-height-8))});};const onPointerUp=()=>{if(!dragRef.current)return;dragRef.current=null;saveNamoTalkPosition(position);document.body.style.userSelect="";document.body.style.cursor="";};window.addEventListener("pointermove",onPointerMove,{passive:false});window.addEventListener("pointerup",onPointerUp);window.addEventListener("pointercancel",onPointerUp);return()=>{window.removeEventListener("pointermove",onPointerMove);window.removeEventListener("pointerup",onPointerUp);window.removeEventListener("pointercancel",onPointerUp);};},[compact,position]);

  const startDrag=event=>{if(compact||event.button!==0||event.target.closest("button"))return;const rect=panelRef.current?.getBoundingClientRect();if(!rect)return;dragRef.current={offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};document.body.style.userSelect="none";document.body.style.cursor="grabbing";event.preventDefault();};
  const setMinimize=value=>{setMinimized(value);localStorage.setItem(NAMO_TALK_MINIMIZED_KEY,value?"1":"0");};
  const toggleNotify=async()=>{const next=!notifyOn;if(next&&"Notification" in window&&Notification.permission==="default")await Notification.requestPermission();setNotifyOn(next);localStorage.setItem(NAMO_TALK_NOTIFY_KEY,next?"1":"0");setToast(next?"채팅 알림을 켰습니다.":"채팅 알림을 껐습니다.");setTimeout(()=>setToast(""),1800);};
  const appendMessage=payload=>{if(!activeRoom)return;const next={...messages,[activeRoom]:[...(messages[activeRoom]||[]),payload]};setMessages(next);saveNamoTalkMessages(next);};
  const sendMessage=()=>{const v=text.trim();if(!v||!room)return;appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:v,time:attendanceTime(),kind:room.type==="notice"?"notice":"text"});setText("");setEmojiOpen(false);};
  const sendEmoticon=value=>{appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:value,time:attendanceTime(),kind:"emoticon"});setEmojiOpen(false);};
  const handleFile=async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>3*1024*1024){alert("첨부파일은 3MB 이하만 가능합니다.");return;}const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:file.name,time:attendanceTime(),kind:file.type.startsWith("image/")?"image":"file",fileName:file.name,fileData:dataUrl});};

  const filteredChannels=channelRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const filteredDirects=directRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const roomMessages=messages[activeRoom]||[];
  const unreadCount=allRooms.reduce((sum,r)=>sum+(messages[r.id]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id)>(reads[r.id]||0)).length,0);
  const panelStyle=compact?{position:"fixed",top:112,right:0,bottom:0,left:0,width:"100vw",height:"auto"}:{position:"fixed",left:position.x,top:position.y,width:"min(650px,calc(100vw - 16px))",height:"min(720px,calc(100vh - 16px))"};

  if(minimized)return <button type="button" onClick={()=>setMinimize(false)} aria-label="NAMO Talk 복원" style={{position:"fixed",right:18,bottom:18,zIndex:12000,height:48,padding:"0 16px",display:"flex",alignItems:"center",gap:9,border:"2px solid #d4a017",borderRadius:16,background:"#0f2740",color:"white",boxShadow:"0 12px 28px rgba(15,23,42,.35)",fontSize:15,fontWeight:900,cursor:"pointer"}}><NamoDrop size={28}/> NAMO Talk {unreadCount>0&&<span style={{minWidth:22,height:22,padding:"0 6px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:11,background:"#ef4444",fontSize:12}}>{unreadCount}</span>}</button>;

  return <section ref={panelRef} aria-label="NAMO Talk" style={{...panelStyle,zIndex:12000,display:"flex",flexDirection:"column",background:"#f4f7fa",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"0 18px 50px rgba(15,23,42,.32)",border:"2px solid #d4a017",borderRadius:compact?0:14,overflow:"hidden"}}>
    {toast&&<div style={{position:"absolute",right:12,top:66,zIndex:50,background:"#172033",color:"white",padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:800,boxShadow:"0 8px 20px rgba(15,23,42,.25)"}}>{toast}</div>}
    <header onPointerDown={startDrag} title={compact?"NAMO Talk":"제목줄을 잡고 이동"} style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"center",padding:"0 12px",background:"#0f2740",color:"white",cursor:compact?"default":"grab",touchAction:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><NamoDrop size={34}/><div style={{fontSize:21,fontWeight:950,letterSpacing:"-.2px"}}>NAMO Talk</div></div>
      <div style={{marginLeft:"auto",fontSize:13,color:"#d7e3ec",marginRight:8,fontWeight:700}}>{currentUser.name}</div>
      <button onClick={toggleNotify} aria-label={notifyOn?"채팅 알림 끄기":"채팅 알림 켜기"} title={notifyOn?"채팅 알림 켜짐":"채팅 알림 꺼짐"} style={{width:34,height:32,border:"1px solid rgba(255,255,255,.15)",borderRadius:8,background:notifyOn?"rgba(56,189,248,.18)":"rgba(255,255,255,.07)",color:notifyOn?"#7dd3fc":"#cbd5e1",fontSize:16,cursor:"pointer",marginRight:5}}>{notifyOn?"🔔":"🔕"}</button>
      <button onClick={()=>setMinimize(true)} aria-label="최소화" title="최소화" style={{width:34,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.07)",color:"white",fontSize:20,cursor:"pointer",marginRight:5}}>−</button>
      <button onClick={()=>setMode("attendance")} style={{height:32,padding:"0 10px",border:"1px solid #d4a017",borderRadius:8,background:mode==="attendance"?"#fff3b0":"rgba(212,160,23,.15)",color:mode==="attendance"?"#7c5c00":"#ffe69a",fontSize:13,fontWeight:900,cursor:"pointer",marginRight:5}}>근태</button>
      <button onClick={onClose} aria-label="닫기" style={{width:34,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",fontSize:22,cursor:"pointer"}}>×</button>
    </header>

    <div style={{height:42,flex:"0 0 42px",display:"flex",background:"white",borderBottom:"1px solid #cbd5e1",padding:"0 8px",alignItems:"center",gap:4}}>
      {[["chat","대화"],["org","조직도"],["attendance","근태관리"]].map(([id,label])=><button key={id} onClick={()=>setMode(id)} style={{height:31,padding:"0 13px",border:0,borderRadius:8,background:mode===id?"#dbeafe":"transparent",color:mode===id?"#075985":"#475569",fontSize:13,fontWeight:900,cursor:"pointer"}}>{label}</button>)}
    </div>

    {mode==="attendance"?<AttendancePanel currentUser={currentUser} users={users}/>:mode==="org"?
      <div style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:14}}>{departments.map(dept=><div key={dept} style={{background:"white",border:"1px solid #cbd5e1",borderRadius:12,marginBottom:10,overflow:"hidden"}}><div style={{padding:"11px 13px",fontSize:15,fontWeight:900,background:"#f1f5f9"}}>{dept}</div>{users.filter(u=>u.dept===dept).map(u=><button key={u.id||u.name} onClick={()=>{if(u.name!==currentUser.name){setActiveRoom(makeDirectRoomId(currentUser.name,u.name));setMode("chat");}}} style={{width:"100%",border:0,borderTop:"1px solid #e2e8f0",background:"white",padding:"11px 13px",fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer"}}>{u.name} · {u.position||"직급 미지정"}</button>)}</div>)}</div>
      :<div style={{flex:"1 1 auto",minHeight:0,display:"flex",width:"100%",overflow:"hidden"}}>
        <div style={{width:205,flex:"0 0 205px",background:"white",borderRight:"1px solid #cbd5e1",overflowY:"auto"}}>
          <div style={{padding:9}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채널·직원 검색" style={{width:"100%",height:38,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",fontSize:14,color:"#1e293b"}}/></div>
          <div style={{padding:7}}>{filteredChannels.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom} messages={messages} reads={reads} currentUser={currentUser}/>)}<div style={{fontSize:12,fontWeight:900,color:"#64748b",padding:"15px 7px 7px"}}>1:1 대화</div>{filteredDirects.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom} messages={messages} reads={reads} currentUser={currentUser}/>)}</div>
        </div>

        <div style={{flex:"1 1 auto",minWidth:0,minHeight:0,display:"flex",flexDirection:"column",background:"#edf3f7",overflow:"hidden",position:"relative"}}>
          <div style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"center",padding:"0 14px",background:"white",borderBottom:"1px solid #cbd5e1"}}><div><div style={{fontSize:17,fontWeight:950,color:"#172033"}}>{room?.name||"대화"}</div><div style={{fontSize:12,color:"#64748b",fontWeight:600,marginTop:3}}>{room?.subtitle||""}</div></div></div>
          <div ref={scrollRef} style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:15}}>
            {roomMessages.length===0&&<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"#64748b"}}><div><NamoDrop size={58}/><strong style={{display:"block",color:"#334155",fontSize:15,marginTop:14}}>아직 대화 내용이 없습니다.</strong></div></div>}
            {roomMessages.map(msg=><div key={msg.id} style={{marginBottom:14,textAlign:msg.sender===currentUser.name?"right":"left"}}><div style={{fontSize:12,color:"#475569",fontWeight:700,marginBottom:4}}>{msg.sender} · {msg.time||""}</div><div style={{display:"inline-block",maxWidth:"84%",background:msg.sender===currentUser.name?"#0284c7":"white",color:msg.sender===currentUser.name?"white":"#172033",borderRadius:14,padding:msg.kind==="emoticon"?"10px 14px":"10px 12px",fontSize:msg.kind==="emoticon"?30:15,lineHeight:1.55,boxShadow:"0 1px 3px rgba(15,23,42,.1)",wordBreak:"break-word"}}>{msg.kind==="image"?<img src={msg.fileData} alt={msg.fileName||"첨부 이미지"} style={{display:"block",maxWidth:"100%",maxHeight:220,borderRadius:8}}/>:msg.kind==="file"?<a href={msg.fileData} download={msg.fileName} style={{color:"inherit"}}>📎 {msg.fileName}</a>:msg.text}</div></div>)}
          </div>

          {emojiOpen&&<div style={{position:"absolute",right:10,bottom:84,width:280,padding:12,background:"white",border:"1px solid #cbd5e1",borderRadius:14,boxShadow:"0 14px 35px rgba(15,23,42,.2)",zIndex:20}}><div style={{display:"flex",alignItems:"center",marginBottom:9}}><strong style={{fontSize:14}}>나모 이모티콘</strong><button onClick={()=>setEmojiOpen(false)} style={{marginLeft:"auto",border:0,background:"transparent",fontSize:18,cursor:"pointer"}}>×</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>{NAMO_EMOTICONS.map((value,i)=><button key={`${value}-${i}`} onClick={()=>sendEmoticon(value)} title={value} style={{height:40,border:"1px solid #e2e8f0",borderRadius:9,background:"#f8fafc",fontSize:20,cursor:"pointer"}}>{value}</button>)}</div></div>}
          <div style={{flex:"0 0 auto",background:"white",padding:10,borderTop:"1px solid #cbd5e1"}}>
            <input ref={fileRef} type="file" onChange={handleFile} style={{display:"none"}}/>
            <div style={{display:"flex",alignItems:"flex-end",gap:7}}>
              <button type="button" onClick={()=>fileRef.current?.click()} style={{height:46,flex:"0 0 auto",padding:"0 12px",border:"1px solid #94a3b8",borderRadius:9,background:"white",color:"#334155",fontSize:14,fontWeight:900,cursor:"pointer"}}>📎 파일</button>
              <button type="button" onClick={()=>setEmojiOpen(v=>!v)} style={{height:46,flex:"0 0 auto",padding:"0 11px",border:"1px solid #94a3b8",borderRadius:9,background:emojiOpen?"#ede9fe":"white",color:"#334155",fontSize:14,fontWeight:900,cursor:"pointer"}}>😊 이모티콘</button>
              <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지를 입력하세요" style={{flex:"1 1 auto",minWidth:0,height:60,boxSizing:"border-box",resize:"none",border:"1px solid #94a3b8",borderRadius:10,padding:"10px 11px",fontFamily:"inherit",fontSize:15,color:"#172033",outline:"none"}}/>
              <button type="button" onClick={sendMessage} disabled={!text.trim()} style={{width:64,height:60,flex:"0 0 64px",background:text.trim()?"#0284c7":"#bae6fd",color:"white",border:0,borderRadius:10,fontSize:15,fontWeight:950,cursor:text.trim()?"pointer":"default"}}>전송</button>
            </div>
          </div>
        </div>
      </div>}
  </section>;
}

function RoomButton({item,activeRoom,setActiveRoom,messages={},reads={},currentUser={}}){
  const active=activeRoom===item.id;
  const unread=(messages[item.id]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id)>(reads[item.id]||0)).length;
  return <button type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:10,background:active?"#dbeafe":"transparent",display:"flex",alignItems:"center",gap:8,padding:"9px 8px",cursor:"pointer",textAlign:"left",marginBottom:3}}><span style={{width:32,height:32,flex:"0 0 32px",borderRadius:item.type==="direct"?"50%":9,background:active?"#0284c7":"#e8eef3",color:active?"white":"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:950}}>{item.name?.[0]||"?"}</span><span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:14,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",fontSize:11,color:"#64748b",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>{item.subtitle}</span></span>{unread>0&&<span style={{minWidth:21,height:21,padding:"0 5px",borderRadius:11,background:"#ef4444",color:"white",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900}}>{unread>99?"99+":unread}</span>}</button>;
}