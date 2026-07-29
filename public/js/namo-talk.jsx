/* NAMO Talk: compact enterprise-style right dock panel */
const NAMO_TALK_KEY = "qmes-namo-talk-v6";
const NAMO_TALK_READ_KEY = "qmes-namo-talk-read-v1";

function loadNamoTalkMessages(){
  try { return JSON.parse(localStorage.getItem(NAMO_TALK_KEY)||"{}"); } catch(e){ return {}; }
}
function saveNamoTalkMessages(data){
  try { localStorage.setItem(NAMO_TALK_KEY,JSON.stringify(data)); } catch(e) { /* 무시 */ }
}
function loadNamoTalkReads(){
  try { return JSON.parse(localStorage.getItem(NAMO_TALK_READ_KEY)||"{}"); } catch(e){ return {}; }
}
function saveNamoTalkReads(data){
  try { localStorage.setItem(NAMO_TALK_READ_KEY,JSON.stringify(data)); } catch(e) { /* 무시 */ }
}
function getNamoTalkUsers(){
  try {
    const users=typeof loadUsers==="function"?loadUsers():[];
    return Array.isArray(users)?users.filter(u=>u&&u.name):[];
  } catch(e){ return []; }
}
function makeDirectRoomId(a,b){ return `dm:${[a,b].sort((x,y)=>String(x).localeCompare(String(y),"ko")).join("|")}`; }

function NamoTalkTab({onClose}){
  const currentUser=window.__QMES_CURRENT_USER__||{name:"사용자",dept:""};
  const [users,setUsers]=useState(getNamoTalkUsers);
  const departments=Array.from(new Set(users.map(u=>u.dept).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ko"));
  const channelRooms=[{id:"전체공지",name:"전체공지",type:"notice",subtitle:"전 직원 공지"},...departments.map(d=>({id:`dept:${d}`,name:d,type:"dept",subtitle:`${d} 업무 채널`}))];
  const directRooms=users.filter(u=>u.name!==currentUser.name).sort((a,b)=>(a.dept||"").localeCompare(b.dept||"","ko")||a.name.localeCompare(b.name,"ko")).map(u=>({id:makeDirectRoomId(currentUser.name,u.name),name:u.name,type:"direct",subtitle:`${u.dept||"부서 미지정"}${u.position?` · ${u.position}`:""}`,user:u}));
  const allRooms=[...channelRooms,...directRooms];

  const [activeRoom,setActiveRoom]=useState(channelRooms[0]?.id||"전체공지");
  const [messages,setMessages]=useState(loadNamoTalkMessages);
  const [reads,setReads]=useState(loadNamoTalkReads);
  const [text,setText]=useState("");
  const [search,setSearch]=useState("");
  const [mode,setMode]=useState("chat");
  const [menuOpen,setMenuOpen]=useState(false);
  const fileRef=useRef(null);
  const room=allRooms.find(item=>item.id===activeRoom)||allRooms[0];

  useEffect(()=>{
    const timer=setInterval(()=>setUsers(getNamoTalkUsers()),3000);
    return()=>clearInterval(timer);
  },[]);
  useEffect(()=>{
    if(!room)return;
    const next={...reads,[room.id]:Date.now()};
    setReads(next); saveNamoTalkReads(next);
  },[activeRoom]);

  const roomMessages=messages[activeRoom]||[];
  const unreadCount=(roomId)=>{
    const lastRead=reads[roomId]||0;
    return (messages[roomId]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id||0)>lastRead).length;
  };
  const filteredChannels=channelRooms.filter(r=>!search.trim()||`${r.name} ${r.subtitle}`.includes(search.trim()));
  const filteredDirects=directRooms.filter(r=>!search.trim()||`${r.name} ${r.subtitle}`.includes(search.trim()));

  const appendMessage=(payload)=>{
    const next={...messages,[activeRoom]:[...(messages[activeRoom]||[]),payload]};
    setMessages(next); saveNamoTalkMessages(next);
    const nextReads={...reads,[activeRoom]:Date.now()}; setReads(nextReads); saveNamoTalkReads(nextReads);
  };
  const sendMessage=()=>{
    const value=text.trim(); if(!value||!room)return;
    appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:value,time:new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",hour12:false}),kind:room.type==="notice"?"notice":"text"});
    setText("");
  };
  const handleFile=async(e)=>{
    const file=e.target.files?.[0]; e.target.value=""; if(!file)return;
    if(file.size>3*1024*1024){ alert("첨부파일은 3MB 이하만 가능합니다."); return; }
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
    appendMessage({id:Date.now(),createdAt:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:file.name,time:new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",hour12:false}),kind:file.type.startsWith("image/")?"image":"file",fileName:file.name,fileType:file.type,fileData:dataUrl});
  };

  return (
    <section aria-label="NAMO Talk" style={{position:"fixed",top:112,right:0,bottom:0,width:"min(520px,100vw)",zIndex:40,display:"flex",flexDirection:"column",background:"#f4f7fa",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"-10px 0 30px rgba(15,23,42,.22)",borderLeft:"1px solid #cbd5e1"}}>
      <header style={{height:58,flex:"0 0 auto",display:"flex",alignItems:"center",padding:"0 12px 0 14px",background:"#0f2740",color:"white"}}>
        <div><div style={{fontSize:18,fontWeight:900}}>NAMO Talk</div><div style={{fontSize:11,color:"#a9bfd2",marginTop:2}}>회원관리 연동 업무 메신저</div></div>
        <div style={{marginLeft:"auto",fontSize:12,color:"#c5d5e1",marginRight:8}}>{currentUser.name}</div>
        <button type="button" onClick={()=>setMenuOpen(v=>!v)} style={{width:32,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",cursor:"pointer",marginRight:6}}>⋮</button>
        <button type="button" onClick={onClose} aria-label="닫기" style={{width:32,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",fontSize:22,cursor:"pointer"}}>×</button>
      </header>
      {menuOpen&&<div style={{position:"absolute",top:50,right:50,zIndex:5,background:"white",border:"1px solid #dbe3ea",borderRadius:10,boxShadow:"0 8px 24px rgba(15,23,42,.18)",padding:6}}><button onClick={()=>{setMessages({});saveNamoTalkMessages({});setMenuOpen(false);}} style={{border:0,background:"white",padding:"9px 12px",fontSize:12,cursor:"pointer"}}>대화 전체 초기화</button></div>}

      <div style={{height:42,display:"flex",background:"white",borderBottom:"1px solid #dbe3ea",padding:"0 8px",alignItems:"center",gap:4}}>
        {[['chat','대화'],['org','조직도']].map(([id,label])=><button key={id} onClick={()=>setMode(id)} style={{height:30,padding:"0 12px",border:0,borderRadius:8,background:mode===id?"#e0f2fe":"transparent",color:mode===id?"#0369a1":"#64748b",fontSize:12,fontWeight:800,cursor:"pointer"}}>{label}</button>)}
      </div>

      {mode==="chat"?<div style={{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"176px minmax(0,1fr)"}}>
        <aside style={{background:"white",borderRight:"1px solid #dbe3ea",display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:9,borderBottom:"1px solid #e5eaf0"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채널·직원 검색" style={{width:"100%",height:34,boxSizing:"border-box",border:"1px solid #d7e0e8",borderRadius:9,padding:"0 9px",fontSize:12,outline:"none",background:"#f8fafc"}} /></div>
          <div style={{padding:"8px 7px",overflowY:"auto"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#94a3b8",padding:"3px 7px 6px"}}>업무 채널</div>
            {filteredChannels.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom} unread={unreadCount(item.id)} />)}
            <div style={{fontSize:10,fontWeight:800,color:"#94a3b8",padding:"14px 7px 6px"}}>1:1 대화</div>
            {filteredDirects.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={setActiveRoom} unread={unreadCount(item.id)} />)}
            {!filteredDirects.length&&<div style={{fontSize:11,color:"#94a3b8",padding:8}}>등록된 직원이 없습니다.</div>}
          </div>
        </aside>

        <main style={{display:"flex",flexDirection:"column",minWidth:0,background:"#edf3f7"}}>
          <div style={{height:54,flex:"0 0 auto",display:"flex",alignItems:"center",padding:"0 13px",background:"white",borderBottom:"1px solid #dbe3ea"}}><div><div style={{fontSize:15,fontWeight:900}}>{room?.name||"대화"}</div><div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{room?.subtitle||""}</div></div></div>
          <div style={{flex:1,minHeight:0,overflowY:"auto",padding:"14px 11px"}}>
            {!roomMessages.length?<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"#94a3b8",fontSize:12,lineHeight:1.6,padding:20}}>대화가 없습니다.<br/>새 메시지를 입력해 주세요.</div>:roomMessages.map(msg=>{
              const mine=msg.sender===currentUser.name;
              return <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:12}}><div style={{maxWidth:"84%"}}><div style={{fontSize:10,color:"#64748b",marginBottom:4,textAlign:mine?"right":"left"}}>{msg.sender}{msg.dept?` · ${msg.dept}`:""}</div><div style={{background:msg.kind==="notice"?"#fff7ed":mine?"#0284c7":"white",color:msg.kind==="notice"?"#9a3412":mine?"white":"#1e293b",borderRadius:14,padding:"9px 11px",fontSize:13,lineHeight:1.45,boxShadow:"0 1px 2px rgba(15,23,42,.08)",border:msg.kind==="notice"?"1px solid #fdba74":mine?"none":"1px solid #dbe3ea",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.kind==="image"?<img src={msg.fileData} alt={msg.fileName} style={{maxWidth:"100%",maxHeight:220,borderRadius:8,display:"block"}}/>:msg.kind==="file"?<a href={msg.fileData} download={msg.fileName} style={{color:mine?"white":"#0369a1",fontWeight:800,textDecoration:"none"}}>📎 {msg.fileName}</a>:msg.text}</div><div style={{fontSize:9,color:"#94a3b8",marginTop:3,textAlign:mine?"right":"left"}}>{msg.time}</div></div></div>;
            })}
          </div>
          <div style={{flex:"0 0 auto",background:"white",borderTop:"1px solid #dbe3ea",padding:9}}>
            <input ref={fileRef} type="file" onChange={handleFile} style={{display:"none"}} />
            <div style={{display:"flex",gap:6,marginBottom:6}}><button onClick={()=>fileRef.current?.click()} style={{height:28,padding:"0 9px",border:"1px solid #cbd5e1",borderRadius:8,background:"white",fontSize:11,cursor:"pointer"}}>📎 파일</button>{room?.type==="notice"&&<span style={{fontSize:10,color:"#c2410c",alignSelf:"center"}}>공지방 메시지는 강조 표시됩니다.</span>}</div>
            <div style={{display:"flex",gap:7,alignItems:"stretch"}}><textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지 입력" style={{flex:1,minHeight:48,maxHeight:90,resize:"none",boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:10,padding:"10px 11px",fontSize:13,lineHeight:1.4,color:"#111827",outline:"none"}} /><button type="button" onClick={sendMessage} style={{width:56,border:0,borderRadius:10,background:"#0284c7",color:"white",fontSize:13,fontWeight:900,cursor:"pointer"}}>전송</button></div>
          </div>
        </main>
      </div>:<div style={{flex:1,overflowY:"auto",padding:14,background:"#f8fafc"}}>{departments.map(dept=><div key={dept} style={{background:"white",border:"1px solid #dbe3ea",borderRadius:12,marginBottom:10,overflow:"hidden"}}><div style={{padding:"10px 12px",fontSize:13,fontWeight:900,background:"#f1f5f9"}}>{dept}</div>{users.filter(u=>u.dept===dept).map(u=><button key={u.id||u.name} onClick={()=>{if(u.name!==currentUser.name){setActiveRoom(makeDirectRoomId(currentUser.name,u.name));setMode("chat");}}} style={{width:"100%",border:0,borderTop:"1px solid #eef2f6",background:"white",display:"flex",alignItems:"center",padding:"10px 12px",cursor:u.name===currentUser.name?"default":"pointer",textAlign:"left"}}><span style={{width:30,height:30,borderRadius:"50%",background:"#dbeafe",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,marginRight:9}}>{u.name?.[0]}</span><span><strong style={{display:"block",fontSize:13}}>{u.name}{u.name===currentUser.name?" (나)":""}</strong><span style={{fontSize:10,color:"#94a3b8"}}>{u.position||"직급 미지정"}</span></span></button>)}</div>)}</div>}
    </section>
  );
}

function RoomButton({item,activeRoom,setActiveRoom,unread}){
  const active=activeRoom===item.id;
  return <button type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:9,background:active?"#e0f2fe":"transparent",display:"flex",alignItems:"center",gap:7,padding:"8px 7px",cursor:"pointer",textAlign:"left",marginBottom:2}}><span style={{width:29,height:29,borderRadius:item.type==="direct"?"50%":9,background:active?"#0284c7":"#e8eef3",color:active?"white":"#41576a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flex:"0 0 auto"}}>{item.name?.[0]||"?"}</span><span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:12,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",fontSize:9,color:"#94a3b8",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.subtitle}</span></span>{unread>0&&<span style={{minWidth:17,height:17,borderRadius:9,background:"#ef4444",color:"white",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{unread>99?"99+":unread}</span>}</button>;
}