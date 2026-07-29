/* NAMO Talk: compact enterprise-style right dock panel */
const NAMO_TALK_KEY = "qmes-namo-talk-v5";

const NAMO_TALK_ROOMS = [
  { id:"전체공지", name:"전체공지", icon:"공", subtitle:"전 직원" },
  { id:"품질부", name:"품질부", icon:"품", subtitle:"품질 업무" },
  { id:"생산부", name:"생산부", icon:"생", subtitle:"생산 업무" },
  { id:"연구소", name:"연구소", icon:"연", subtitle:"연구 업무" },
];

function loadNamoTalkMessages(){
  try {
    const raw=localStorage.getItem(NAMO_TALK_KEY);
    return raw?JSON.parse(raw):{};
  } catch(e){ return {}; }
}

function saveNamoTalkMessages(data){
  try { localStorage.setItem(NAMO_TALK_KEY,JSON.stringify(data)); } catch(e) { /* 무시 */ }
}

function NamoTalkTab({onClose}){
  const currentUser=window.__QMES_CURRENT_USER__||{name:"사용자",dept:""};
  const [activeRoom,setActiveRoom]=useState("전체공지");
  const [messages,setMessages]=useState(loadNamoTalkMessages);
  const [text,setText]=useState("");
  const [search,setSearch]=useState("");

  const room=NAMO_TALK_ROOMS.find(item=>item.id===activeRoom)||NAMO_TALK_ROOMS[0];
  const visibleRooms=NAMO_TALK_ROOMS.filter(item=>!search.trim()||item.name.includes(search.trim()));

  const sendMessage=()=>{
    const value=text.trim();
    if(!value)return;
    const next={
      ...messages,
      [activeRoom]:[
        ...(messages[activeRoom]||[]),
        {id:Date.now(),sender:currentUser.name,dept:currentUser.dept||"",text:value,time:new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",hour12:false})}
      ]
    };
    setMessages(next);
    saveNamoTalkMessages(next);
    setText("");
  };

  return (
    <section aria-label="NAMO Talk" style={{position:"fixed",top:112,right:0,bottom:0,width:"min(480px, 100vw)",zIndex:40,display:"flex",flexDirection:"column",background:"#f4f7fa",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"-10px 0 30px rgba(15,23,42,.22)",borderLeft:"1px solid #cbd5e1"}}>
      <header style={{height:58,flex:"0 0 auto",display:"flex",alignItems:"center",padding:"0 14px 0 16px",background:"#0f2740",color:"white"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900}}>NAMO Talk</div>
          <div style={{fontSize:11,color:"#a9bfd2",marginTop:2}}>사내 업무 메신저</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:12,color:"#c5d5e1",marginRight:10}}>{currentUser.name}</div>
        <button type="button" onClick={onClose} aria-label="NAMO Talk 닫기" style={{width:34,height:34,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",fontSize:23,cursor:"pointer",lineHeight:1}}>×</button>
      </header>

      <div style={{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"150px minmax(0,1fr)"}}>
        <aside style={{background:"white",borderRight:"1px solid #dbe3ea",display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:10,borderBottom:"1px solid #e5eaf0"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색" style={{width:"100%",height:34,boxSizing:"border-box",border:"1px solid #d7e0e8",borderRadius:9,padding:"0 10px",fontSize:13,outline:"none",background:"#f8fafc"}} />
          </div>
          <div style={{padding:"9px 8px",overflowY:"auto"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#94a3b8",padding:"2px 7px 7px"}}>업무 채널</div>
            {visibleRooms.map(item=><button key={item.id} type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:9,background:activeRoom===item.id?"#e0f2fe":"transparent",display:"flex",alignItems:"center",gap:8,padding:"9px 7px",cursor:"pointer",textAlign:"left",marginBottom:3}}>
              <span style={{width:30,height:30,borderRadius:9,background:activeRoom===item.id?"#0284c7":"#e8eef3",color:activeRoom===item.id?"white":"#41576a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flex:"0 0 auto"}}>{item.icon}</span>
              <span style={{minWidth:0}}><strong style={{display:"block",fontSize:13,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",fontSize:10,color:"#94a3b8",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.subtitle}</span></span>
            </button>)}
          </div>
        </aside>

        <main style={{display:"flex",flexDirection:"column",minWidth:0,background:"#edf3f7"}}>
          <div style={{height:54,flex:"0 0 auto",display:"flex",alignItems:"center",padding:"0 14px",background:"white",borderBottom:"1px solid #dbe3ea"}}>
            <div><div style={{fontSize:16,fontWeight:900}}>{room.name}</div><div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{room.id==="전체공지"?"전 직원 공지 채널":"부서 업무 채널"}</div></div>
          </div>

          <div style={{flex:1,minHeight:0,overflowY:"auto",padding:"14px 12px"}}>
            {(messages[activeRoom]||[]).length===0?<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"#94a3b8",fontSize:12,lineHeight:1.6,padding:20}}>대화가 없습니다.<br/>새 메시지를 입력해 주세요.</div>:(messages[activeRoom]||[]).map(msg=>{
              const mine=msg.sender===currentUser.name;
              return <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:12}}>
                <div style={{maxWidth:"82%"}}>
                  <div style={{fontSize:10,color:"#64748b",marginBottom:4,textAlign:mine?"right":"left"}}>{msg.sender}{msg.dept?` · ${msg.dept}`:""}</div>
                  <div style={{background:mine?"#0284c7":"white",color:mine?"white":"#1e293b",borderRadius:14,padding:"9px 11px",fontSize:13,lineHeight:1.45,boxShadow:"0 1px 2px rgba(15,23,42,.08)",border:mine?"none":"1px solid #dbe3ea",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.text}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:3,textAlign:mine?"right":"left"}}>{msg.time}</div>
                </div>
              </div>;
            })}
          </div>

          <div style={{flex:"0 0 auto",background:"white",borderTop:"1px solid #dbe3ea",padding:10}}>
            <div style={{display:"flex",gap:7,alignItems:"stretch"}}>
              <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지 입력" style={{flex:1,minHeight:48,maxHeight:90,resize:"none",boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:10,padding:"10px 11px",fontSize:13,lineHeight:1.4,color:"#111827",outline:"none"}} />
              <button type="button" onClick={sendMessage} style={{width:56,border:0,borderRadius:10,background:"#0284c7",color:"white",fontSize:13,fontWeight:900,cursor:"pointer"}}>전송</button>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}