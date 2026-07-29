/* NAMO Talk: full-screen light messenger UI */
const NAMO_TALK_KEY = "qmes-namo-talk-v4";

const NAMO_TALK_ROOMS = [
  { id:"전체공지", name:"전체공지", group:"업무 채널", icon:"공", preview:"대화가 없습니다.", unread:0 },
  { id:"품질부", name:"품질부", group:"업무 채널", icon:"품", preview:"대화가 없습니다.", unread:0 },
  { id:"생산부", name:"생산부", group:"업무 채널", icon:"생", preview:"대화가 없습니다.", unread:0 },
  { id:"연구소", name:"연구소", group:"업무 채널", icon:"연", preview:"대화가 없습니다.", unread:0 },
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

function NamoTalkTab(){
  const currentUser=window.__QMES_CURRENT_USER__||{name:"사용자",dept:""};
  const [activeRoom,setActiveRoom]=useState("전체공지");
  const [messages,setMessages]=useState(loadNamoTalkMessages);
  const [text,setText]=useState("");
  const [search,setSearch]=useState("");
  const [section,setSection]=useState("대화");

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

  const closeTalk=()=>{
    if(typeof window.__QMES_CLOSE_NAMO_TALK__==="function") window.__QMES_CLOSE_NAMO_TALK__();
  };

  const styles={
    app:{position:"fixed",inset:0,zIndex:1000,display:"flex",flexDirection:"column",background:"#eef5f9",color:"#13263a",fontFamily:"'Pretendard','Noto Sans KR',sans-serif"},
    top:{height:68,background:"#0d253b",display:"flex",alignItems:"center",padding:"0 18px",color:"white",boxShadow:"0 2px 10px rgba(0,0,0,.15)"},
    body:{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"92px 350px minmax(0,1fr) 310px"},
    rail:{background:"#0f2c46",padding:"16px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:10,color:"#d8e7f2"},
    railBtn:{width:72,minHeight:66,border:0,borderRadius:14,background:"transparent",color:"inherit",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5},
    list:{background:"white",borderRight:"1px solid #d7e2ea",display:"flex",flexDirection:"column",minWidth:0},
    chat:{display:"flex",flexDirection:"column",minWidth:0,background:"#eaf2f7"},
    info:{background:"#f8fbfd",borderLeft:"1px solid #d7e2ea",padding:20,overflowY:"auto"},
  };

  return (
    <div style={styles.app}>
      <header style={styles.top}>
        <div style={{fontSize:26,fontWeight:900,letterSpacing:"-.5px"}}>NAMO Talk</div>
        <div style={{marginLeft:12,fontSize:15,color:"#a9c3d7"}}>사내 업무 메신저</div>
        <div style={{marginLeft:"auto",fontSize:13,color:"#b9d0df",marginRight:18}}>{currentUser.name} · {currentUser.dept||"부서 미지정"}</div>
        <button onClick={closeTalk} aria-label="닫기" style={{width:38,height:38,border:0,borderRadius:10,background:"transparent",color:"white",fontSize:28,cursor:"pointer",lineHeight:1}}>×</button>
      </header>

      <div style={styles.body}>
        <nav style={styles.rail}>
          {[['대화','💬'],['공지','📢'],['조직','👥'],['파일','📁'],['일정','🗓️']].map(([label,icon])=><button key={label} onClick={()=>setSection(label)} style={{...styles.railBtn,background:section===label?"#159bd3":"transparent",color:section===label?"white":"#d8e7f2"}}><span style={{fontSize:23}}>{icon}</span><span>{label}</span></button>)}
          <div style={{marginTop:"auto",width:48,height:48,borderRadius:"50%",background:"#159bd3",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white"}}>{currentUser.name?.[0]||"사"}</div>
        </nav>

        <aside style={styles.list}>
          <div style={{height:88,display:"flex",alignItems:"center",padding:"0 18px",borderBottom:"1px solid #dfe8ee"}}>
            <h2 style={{fontSize:24,margin:0,fontWeight:900}}>채팅</h2>
            <button style={{marginLeft:"auto",width:42,height:42,borderRadius:12,border:"1px solid #cfdce5",background:"white",fontSize:28,cursor:"pointer",color:"#142b3e"}}>+</button>
          </div>
          <div style={{padding:14,borderBottom:"1px solid #e1e9ef"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채팅방 또는 직원 검색" style={{width:"100%",boxSizing:"border-box",height:48,border:"1px solid #cfdce5",borderRadius:12,padding:"0 14px",fontSize:16,color:"#13263a",background:"#f8fafc",outline:"none"}} />
          </div>
          <div style={{padding:"16px 0",overflowY:"auto"}}>
            <div style={{padding:"0 18px 10px",fontSize:13,fontWeight:800,color:"#8394a3"}}>업무 채널</div>
            {visibleRooms.map(item=><button key={item.id} onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,background:activeRoom===item.id?"#dff1fa":"white",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",textAlign:"left"}}>
              <span style={{width:48,height:48,borderRadius:16,background:"#dff1fa",color:"#087ba9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,flex:"0 0 auto"}}>{item.icon}</span>
              <span style={{minWidth:0,flex:1}}>
                <strong style={{display:"block",fontSize:17,color:"#0e1f2e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong>
                <span style={{display:"block",marginTop:4,fontSize:13,color:"#8796a4",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.preview}</span>
              </span>
            </button>)}
            <div style={{padding:"22px 18px 10px",fontSize:13,fontWeight:800,color:"#8394a3"}}>1:1 대화</div>
            <div style={{padding:"14px 18px",color:"#9aa8b3",fontSize:14}}>회원등록현황 연동 예정</div>
          </div>
        </aside>

        <main style={styles.chat}>
          <div style={{height:88,background:"white",borderBottom:"1px solid #d7e2ea",display:"flex",alignItems:"center",padding:"0 24px"}}>
            <div>
              <h3 style={{fontSize:24,margin:0,fontWeight:900,color:"#102436"}}>{room.name}</h3>
              <div style={{marginTop:5,color:"#8a9aa7",fontSize:14}}>{room.id==="전체공지"?"전 직원 공지 채널":"부서 업무 채널"}</div>
            </div>
            <button style={{marginLeft:"auto",height:42,padding:"0 16px",border:"1px solid #cfdce5",borderRadius:12,background:"white",fontSize:15,color:"#142b3e",cursor:"pointer"}}>참여자</button>
          </div>

          <div style={{flex:1,minHeight:0,overflowY:"auto",padding:"26px 28px"}}>
            {(messages[activeRoom]||[]).length===0?<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#8a9aa7",fontSize:16}}>대화가 초기화되었습니다. 새 메시지를 입력해 주세요.</div>:(messages[activeRoom]||[]).map(msg=>{
              const mine=msg.sender===currentUser.name;
              return <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:18}}>
                <div style={{maxWidth:"68%"}}>
                  <div style={{fontSize:13,color:"#637788",marginBottom:6,textAlign:mine?"right":"left"}}>{msg.sender}{msg.dept?` · ${msg.dept}`:""}</div>
                  <div style={{background:mine?"#159bd3":"white",color:mine?"white":"#172b3b",borderRadius:18,padding:"13px 17px",fontSize:16,lineHeight:1.5,boxShadow:"0 1px 3px rgba(20,45,65,.12)",border:mine?"none":"1px solid #dce6ed",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.text}</div>
                  <div style={{fontSize:12,color:"#8ca0ae",marginTop:5,textAlign:mine?"right":"left"}}>{msg.time}</div>
                </div>
              </div>;
            })}
          </div>

          <div style={{background:"white",borderTop:"1px solid #d7e2ea",padding:"14px 16px"}}>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {['＋','▧','☺'].map(icon=><button key={icon} style={{width:44,height:42,border:"1px solid #cfdce5",borderRadius:10,background:"white",fontSize:21,color:"#173047",cursor:"pointer"}}>{icon}</button>)}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
              <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지를 입력하세요. Enter 전송 / Shift+Enter 줄바꿈" style={{flex:1,minHeight:68,maxHeight:130,resize:"vertical",boxSizing:"border-box",border:"1px solid #cfdce5",borderRadius:12,padding:"14px 16px",fontSize:17,lineHeight:1.5,color:"#111827",background:"#ffffff",caretColor:"#111827",outline:"none"}} />
              <button onClick={sendMessage} style={{width:92,border:0,borderRadius:12,background:"#159bd3",color:"white",fontSize:18,fontWeight:900,cursor:"pointer"}}>전송</button>
            </div>
          </div>
        </main>

        <aside style={styles.info}>
          <h3 style={{fontSize:20,margin:"2px 0 18px",fontWeight:900}}>채널 정보</h3>
          <div style={{background:"white",border:"1px solid #dce6ed",borderRadius:16,padding:18}}>
            <div style={{fontSize:13,color:"#8b9ba8"}}>현재 채널</div>
            <div style={{fontSize:18,fontWeight:900,marginTop:6}}>{room.name}</div>
            <div style={{height:1,background:"#e6edf2",margin:"18px 0"}} />
            <div style={{fontSize:13,color:"#8b9ba8"}}>참여자</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:6}}>0명</div>
          </div>
          <div style={{marginTop:16,background:"white",border:"1px solid #dce6ed",borderRadius:16,padding:18}}>
            <div style={{fontSize:15,fontWeight:900,marginBottom:10}}>회원등록현황 연동</div>
            <p style={{margin:0,color:"#718493",fontSize:14,lineHeight:1.6}}>회원관리의 이름, 부서, 직급을 참조해 부서 채널과 1:1 대화 목록을 자동 구성할 예정입니다.</p>
          </div>
          <div style={{marginTop:16,background:"white",border:"1px solid #dce6ed",borderRadius:16,padding:18}}>
            <div style={{fontSize:15,fontWeight:900,marginBottom:10}}>첨부파일</div>
            <div style={{color:"#9aa8b3",fontSize:14}}>첨부파일이 없습니다.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
