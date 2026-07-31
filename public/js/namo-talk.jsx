/* NAMO Talk: enterprise messenger + integrated attendance */
window.__NAMO_TALK_DRAG_FIX__=true;
const NAMO_TALK_READ_KEY="qmes-namo-talk-read-v1";
const NAMO_ATTENDANCE_KEY="qmes-namo-attendance-v1";
const NAMO_ATTENDANCE_SESSION_KEY="qmes-namo-attendance-session-v1";
const NAMO_TALK_POSITION_KEY="qmes-namo-talk-position-v1";
const NAMO_TALK_NOTIFY_KEY="qmes-namo-talk-notify-v1";
const NAMO_TALK_MINIMIZED_KEY="qmes-namo-talk-minimized-v1";
const NAMO_TALK_STATUS_KEY="qmes-namo-talk-status-v1";
const NAMO_TALK_STATUS_MESSAGE_KEY="qmes-namo-talk-status-message-v1";
const NAMO_TALK_CHANNELS_OPEN_KEY="qmes-namo-talk-channels-open-v1";
const NAMO_TALK_DIRECTS_OPEN_KEY="qmes-namo-talk-directs-open-v1";
const NAMO_TALK_STATUS={
  online:{label:"온라인",color:"#22c55e"},
  away:{label:"자리 비움",color:"#eab308"},
  busy:{label:"다른 용무 중",color:"#ef4444"},
  meeting:{label:"회의 중",color:"#3b82f6"},
  offline:{label:"오프라인",color:"#94a3b8"}
};

function safeParse(v,fallback){try{return JSON.parse(v||"")||fallback;}catch(e){return fallback;}}
function loadNamoTalkReads(){return safeParse(localStorage.getItem(NAMO_TALK_READ_KEY),{});}
function saveNamoTalkReads(data){try{localStorage.setItem(NAMO_TALK_READ_KEY,JSON.stringify(data));}catch(e){}}
function getNamoTalkUsers(){try{const users=typeof loadUsers==="function"?loadUsers():[];return Array.isArray(users)?users.filter(u=>u&&u.name):[];}catch(e){return[];}}
function makeDirectRoomId(a,b){return `dm:${[a,b].sort((x,y)=>String(x).localeCompare(String(y),"ko")).join("|")}`;}
function loadNamoTalkPosition(){const saved=safeParse(localStorage.getItem(NAMO_TALK_POSITION_KEY),null);if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))return saved;return {x:Math.max(16,window.innerWidth-640),y:128};}
function saveNamoTalkPosition(position){try{localStorage.setItem(NAMO_TALK_POSITION_KEY,JSON.stringify(position));}catch(e){}}

let namoTalkAuthRedirecting=false;
function handleNamoTalkAuth(response){
  if(response.status!==401)return;
  if(!namoTalkAuthRedirecting){
    namoTalkAuthRedirecting=true;
    try{sessionStorage.removeItem("qmes-current-user-v1");}catch(e){}
    window.location.reload();
  }
  throw new Error("__NAMO_AUTH_REDIRECT__");
}

async function fetchNamoTalkRoom(roomId){
  const response=await fetch(`/api/namo-talk/messages?roomId=${encodeURIComponent(roomId)}`,{credentials:"same-origin"});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"메시지를 불러오지 못했습니다.");
  return Array.isArray(payload.data)?payload.data:[];
}

async function postNamoTalkMessage(roomId,message){
  const response=await fetch("/api/namo-talk/messages",{
    method:"POST",
    credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({roomId,...message})
  });
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"메시지를 전송하지 못했습니다.");
  return payload.data;
}

async function updateNamoTalkMessage(messageId,body){
  const response=await fetch(`/api/namo-talk/messages/${messageId}/action`,{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
  });
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"메시지 처리에 실패했습니다.");
  return payload.data;
}

async function deleteNamoTalkMessage(messageId){
  return updateNamoTalkMessage(messageId,{action:"delete"});
}

async function fetchNamoTalkReadReceipts(roomId){
  const response=await fetch(`/api/namo-talk/reads?roomId=${encodeURIComponent(roomId)}`,{credentials:"same-origin"});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"읽음 정보를 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"읽음 정보를 불러오지 못했습니다.");
  return Array.isArray(payload.data)?payload.data:[];
}

async function markNamoTalkRoomRead(roomId){
  const response=await fetch("/api/namo-talk/reads",{
    method:"POST",
    credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({roomId})
  });
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"읽음 처리를 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"읽음 처리에 실패했습니다.");
  return payload.data;
}

async function fetchNamoTalkNotifications(afterId){
  const query=afterId==null?"":`?afterId=${encodeURIComponent(afterId)}`;
  const response=await fetch(`/api/namo-talk/notifications${query}`,{credentials:"same-origin"});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"알림을 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"알림을 불러오지 못했습니다.");
  return {rows:Array.isArray(payload.data)?payload.data:[],cursor:Number(payload.cursor||afterId||0)};
}

async function fetchNamoTalkPresence(){
  const response=await fetch("/api/namo-talk/presence",{credentials:"same-origin"});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"상태 정보를 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"상태 정보를 불러오지 못했습니다.");
  return Array.isArray(payload.data)?payload.data:[];
}

async function updateNamoTalkPresence(status,statusMessage,keepalive=false){
  const response=await fetch("/api/namo-talk/presence",{method:"POST",credentials:"same-origin",keepalive,headers:{"Content-Type":"application/json"},body:JSON.stringify({status,statusMessage})});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"상태 변경 결과를 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"상태를 변경하지 못했습니다.");
  return payload.data;
}

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

function NamoTalkNotifier({talkOpen=false,onOpenRoom}){
  const [toasts,setToasts]=useState([]);
  const lastMessageIdRef=useRef(null);

  useEffect(()=>{
    let stopped=false;
    const check=async()=>{
      try{
        const {rows,cursor}=await fetchNamoTalkNotifications(lastMessageIdRef.current);
        lastMessageIdRef.current=Math.max(Number(lastMessageIdRef.current||0),Number(cursor||0),...rows.map(message=>Number(message.id||0)));
        if(!talkOpen&&rows.length){
          const count=Number(localStorage.getItem("qmes-namo-talk-unread-v1")||0)+rows.length;
          localStorage.setItem("qmes-namo-talk-unread-v1",String(count));
          window.dispatchEvent(new CustomEvent("namo-talk-unread",{detail:{count}}));
        }
        if(stopped||talkOpen||localStorage.getItem(NAMO_TALK_NOTIFY_KEY)==="0"||!rows.length)return;
        setToasts(previous=>[...previous,...rows.map(message=>({...message,toastId:`${message.id}-${Date.now()}`}))].slice(-4));
        rows.forEach(message=>window.setTimeout(()=>setToasts(previous=>previous.filter(item=>item.id!==message.id)),5000));
      }catch(error){
        if(error.message!=="__NAMO_AUTH_REDIRECT__")console.warn("NAMO Talk notification failed:",error.message);
      }
    };
    const timer=window.setInterval(check,4000);
    return()=>{stopped=true;window.clearInterval(timer);};
  },[talkOpen]);

  if(!toasts.length)return null;
  return <div aria-live="polite" style={{position:"fixed",right:18,bottom:18,zIndex:2147483000,width:"min(340px,calc(100vw - 36px))",display:"flex",flexDirection:"column-reverse",gap:9,pointerEvents:"none"}}>
    <style>{`@keyframes namoTalkToastIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`}</style>
    {toasts.map(message=><button key={message.toastId} type="button" onClick={()=>{setToasts(previous=>previous.filter(item=>item.toastId!==message.toastId));onOpenRoom?.(message.roomId);}} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:11,padding:"13px 14px",border:"1px solid #d4a017",borderRadius:13,background:"#0f2740",color:"white",boxShadow:"0 14px 36px rgba(15,23,42,.35)",textAlign:"left",cursor:"pointer",pointerEvents:"auto",animation:"namoTalkToastIn .28s ease-out"}}>
      <NamoDrop size={34}/>
      <span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:14,lineHeight:1.3}}>{message.sender}</strong><span style={{display:"block",marginTop:4,color:"#d7e3ec",fontSize:13,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{message.deleted?"삭제된 메시지입니다.":message.kind==="file"||message.kind==="image"?`📎 ${message.fileName||message.text}`:message.text}</span></span>
      <span style={{fontSize:11,color:"#93c5fd",whiteSpace:"nowrap"}}>NAMO Talk</span>
    </button>)}
  </div>;
}

function NamoTalkTab({onClose,initialRoom=""}){
  const currentUser=window.__QMES_CURRENT_USER__||{name:"관리자",dept:"관리부",role:"admin",uid:"U-0001"};
  const [users,setUsers]=useState(getNamoTalkUsers);
  const departments=Array.from(new Set(users.map(u=>u.dept).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ko"));
  const channelRooms=[{id:"전체공지",name:"전체공지",type:"notice",subtitle:"전 직원 공지"},...departments.map(d=>({id:`dept:${d}`,name:d,type:"dept",subtitle:`${d} 업무 채널`}))];
  const selfRoom={id:makeDirectRoomId(currentUser.name,currentUser.name),name:"나에게 보내기",presenceName:currentUser.name,type:"direct",subtitle:"메모·파일을 나에게 보관",user:currentUser,isSelf:true};
  const directRooms=users.filter(u=>u.name!==currentUser.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),"ko")).map(u=>({id:makeDirectRoomId(currentUser.name,u.name),name:u.name,presenceName:u.name,type:"direct",subtitle:`${u.dept||"부서 미지정"}${u.position?` · ${u.position}`:""}`,user:u}));
  const allRooms=[...channelRooms,selfRoom,...directRooms];
  const [activeRoom,setActiveRoom]=useState(()=>initialRoom||directRooms[0]?.id||channelRooms[0]?.id||"전체공지");
  const [messages,setMessages]=useState({});
  const [readReceipts,setReadReceipts]=useState({});
  const [readDetail,setReadDetail]=useState(null);
  const [reads,setReads]=useState(loadNamoTalkReads);
  const [text,setText]=useState("");
  const [search,setSearch]=useState("");
  const [messageSearch,setMessageSearch]=useState("");
  const [replyingTo,setReplyingTo]=useState(null);
  const [mode,setMode]=useState("employees");
  const [chatReturnMode,setChatReturnMode]=useState("employees");
  const [chatRoomOpen,setChatRoomOpen]=useState(()=>Boolean(initialRoom));
  const [messageListOpen,setMessageListOpen]=useState(false);
  const [compact,setCompact]=useState(()=>window.innerWidth<=480);
  const [position,setPosition]=useState(loadNamoTalkPosition);
  const [panelSize,setPanelSize]=useState(null);
  const [minimized,setMinimized]=useState(()=>localStorage.getItem(NAMO_TALK_MINIMIZED_KEY)==="1");
  const [maximized,setMaximized]=useState(false);
  const [notifyOn,setNotifyOn]=useState(()=>localStorage.getItem(NAMO_TALK_NOTIFY_KEY)!=="0");
  const [presence,setPresence]=useState({});
  const [myStatus,setMyStatus]=useState(()=>localStorage.getItem(NAMO_TALK_STATUS_KEY)||"online");
  const [statusMessage,setStatusMessage]=useState(()=>localStorage.getItem(NAMO_TALK_STATUS_MESSAGE_KEY)||"");
  const [channelsOpen,setChannelsOpen]=useState(()=>localStorage.getItem(NAMO_TALK_CHANNELS_OPEN_KEY)!=="0");
  const [directsOpen,setDirectsOpen]=useState(()=>localStorage.getItem(NAMO_TALK_DIRECTS_OPEN_KEY)!=="0");
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [toast,setToast]=useState("");
  const [sending,setSending]=useState(false);
  const fileRef=useRef(null),scrollRef=useRef(null),panelRef=useRef(null),dragRef=useRef(null),resizeRef=useRef(null),markedRef=useRef({}),lastActivityRef=useRef(Date.now()),statusRef=useRef(myStatus),statusMessageRef=useRef(statusMessage);
  const room=allRooms.find(item=>item.id===activeRoom)||allRooms[0];

  const refreshRoom=async (roomId,markRead=false)=>{
    if(!roomId)return;
    try{
      const [rows,receiptRows]=await Promise.all([fetchNamoTalkRoom(roomId),fetchNamoTalkReadReceipts(roomId)]);
      setMessages(previous=>({...previous,[roomId]:rows}));
      setReadReceipts(previous=>({...previous,[roomId]:receiptRows}));
      const newest=rows.reduce((max,row)=>Math.max(max,Number(row.createdAt)||0),0);
      if(markRead&&newest>Number(markedRef.current[roomId]||0)){
        markedRef.current[roomId]=newest;
        const mine=await markNamoTalkRoomRead(roomId);
        setReadReceipts(previous=>{
          const current=previous[roomId]||[];
          const next=current.filter(item=>String(item.userUid)!==String(mine.userUid)&&item.userName!==mine.userName);
          return {...previous,[roomId]:[...next,mine]};
        });
      }
    }catch(error){
      console.warn("NAMO Talk refresh failed:",error.message);
    }
  };

  useEffect(()=>{const t=setInterval(()=>setUsers(getNamoTalkUsers()),3000);return()=>clearInterval(t);},[]);
  useEffect(()=>{statusRef.current=myStatus;},[myStatus]);
  useEffect(()=>{statusMessageRef.current=statusMessage;},[statusMessage]);
  useEffect(()=>{
    let stopped=false;
    const refresh=async()=>{try{const rows=await fetchNamoTalkPresence();if(!stopped)setPresence(Object.fromEntries(rows.map(row=>[row.name,row])));}catch(error){console.warn("NAMO Talk presence refresh failed:",error.message);}};
    refresh();const t=setInterval(refresh,15000);return()=>{stopped=true;clearInterval(t);};
  },[]);
  useEffect(()=>{
    const activity=()=>{lastActivityRef.current=Date.now();};
    ["pointerdown","keydown","scroll"].forEach(name=>window.addEventListener(name,activity,{passive:true}));
    const heartbeat=async()=>{const selected=statusRef.current;const message=statusMessageRef.current;const actual=selected==="online"&&Date.now()-lastActivityRef.current>=300000?"away":selected;try{await updateNamoTalkPresence(actual,message);setPresence(previous=>({...previous,[currentUser.name]:{name:currentUser.name,status:actual,statusMessage:message,lastSeen:Date.now()}}));}catch(error){console.warn("NAMO Talk presence heartbeat failed:",error.message);}};
    heartbeat();const t=setInterval(heartbeat,30000);
    const offline=()=>{updateNamoTalkPresence("offline",statusMessageRef.current,true).catch(()=>{});};
    window.addEventListener("beforeunload",offline);
    return()=>{clearInterval(t);window.removeEventListener("beforeunload",offline);["pointerdown","keydown","scroll"].forEach(name=>window.removeEventListener(name,activity));};
  },[currentUser.name]);
  useEffect(()=>{if(!room)return;if(chatRoomOpen){const next={...reads,[room.id]:Date.now()};setReads(next);saveNamoTalkReads(next);}refreshRoom(room.id,chatRoomOpen);},[activeRoom,chatRoomOpen]);
  useEffect(()=>{if(!room||!chatRoomOpen)return;const t=setInterval(()=>refreshRoom(room.id,true),2000);return()=>clearInterval(t);},[activeRoom,room?.id,chatRoomOpen]);
  useEffect(()=>{let stopped=false;const refreshAll=async()=>{const entries=await Promise.all(allRooms.map(async item=>{try{return [item.id,await fetchNamoTalkRoom(item.id)];}catch(error){return [item.id,null];}}));if(stopped)return;setMessages(previous=>{const next={...previous};entries.forEach(([id,rows])=>{if(rows)next[id]=rows;});return next;});};refreshAll();const t=setInterval(refreshAll,5000);return()=>{stopped=true;clearInterval(t);};},[allRooms.map(item=>item.id).join("|")]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[activeRoom,messages]);
  useEffect(()=>{if(!allRooms.some(item=>item.id===activeRoom)&&allRooms[0])setActiveRoom(allRooms[0].id);},[users.length]);
  useEffect(()=>{if(initialRoom){setActiveRoom(initialRoom);setMessageListOpen(false);setChatRoomOpen(true);}},[initialRoom]);
  useEffect(()=>{const onResize=()=>{const nextCompact=window.innerWidth<=480;setCompact(nextCompact);if(nextCompact)return;const panel=panelRef.current;const width=panel?.offsetWidth||620;const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);setPosition(previous=>{const next={x:Math.max(8,Math.min(previous.x,window.innerWidth-width-8)),y:Math.max(8,Math.min(previous.y,window.innerHeight-height-8))};saveNamoTalkPosition(next);return next;});};window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
  useEffect(()=>{const onPointerMove=event=>{const drag=dragRef.current;if(!drag||compact)return;event.preventDefault();const panel=panelRef.current;const width=panel?.offsetWidth||620;const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);setPosition({x:Math.max(8,Math.min(event.clientX-drag.offsetX,window.innerWidth-width-8)),y:Math.max(8,Math.min(event.clientY-drag.offsetY,window.innerHeight-height-8))});};const onPointerUp=()=>{if(!dragRef.current)return;dragRef.current=null;saveNamoTalkPosition(position);document.body.style.userSelect="";document.body.style.cursor="";};window.addEventListener("pointermove",onPointerMove,{passive:false});window.addEventListener("pointerup",onPointerUp);window.addEventListener("pointercancel",onPointerUp);return()=>{window.removeEventListener("pointermove",onPointerMove);window.removeEventListener("pointerup",onPointerUp);window.removeEventListener("pointercancel",onPointerUp);};},[compact,position]);
  useEffect(()=>{const onPointerMove=event=>{const resize=resizeRef.current;if(!resize||compact||maximized)return;event.preventDefault();const dx=event.clientX-resize.startX,dy=event.clientY-resize.startY;let x=resize.x,y=resize.y,width=resize.width,height=resize.height;if(resize.edges.includes("r"))width=Math.min(window.innerWidth-x-8,Math.max(340,resize.width+dx));if(resize.edges.includes("b"))height=Math.min(window.innerHeight-y-8,Math.max(480,resize.height+dy));if(resize.edges.includes("l")){const nextX=Math.max(8,Math.min(resize.x+dx,resize.x+resize.width-340));width=resize.width+(resize.x-nextX);x=nextX;}if(resize.edges.includes("t")){const nextY=Math.max(8,Math.min(resize.y+dy,resize.y+resize.height-480));height=resize.height+(resize.y-nextY);y=nextY;}setPosition({x,y});setPanelSize({width,height});};const onPointerUp=()=>{if(!resizeRef.current)return;resizeRef.current=null;saveNamoTalkPosition(position);document.body.style.userSelect="";document.body.style.cursor="";};window.addEventListener("pointermove",onPointerMove,{passive:false});window.addEventListener("pointerup",onPointerUp);window.addEventListener("pointercancel",onPointerUp);return()=>{window.removeEventListener("pointermove",onPointerMove);window.removeEventListener("pointerup",onPointerUp);window.removeEventListener("pointercancel",onPointerUp);};},[compact,maximized,position]);

  const startDrag=event=>{if(compact||maximized||event.button!==0||event.target.closest("button"))return;const rect=panelRef.current?.getBoundingClientRect();if(!rect)return;dragRef.current={offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};document.body.style.userSelect="none";document.body.style.cursor="grabbing";event.preventDefault();};
  const startResize=(event,edges)=>{if(compact||maximized||event.button!==0)return;const rect=panelRef.current?.getBoundingClientRect();if(!rect)return;resizeRef.current={edges,startX:event.clientX,startY:event.clientY,x:rect.left,y:rect.top,width:rect.width,height:rect.height};document.body.style.userSelect="none";document.body.style.cursor=getComputedStyle(event.currentTarget).cursor;event.stopPropagation();event.preventDefault();};
  const setMinimize=value=>{setMinimized(value);localStorage.setItem(NAMO_TALK_MINIMIZED_KEY,value?"1":"0");};
  const toggleNotify=async()=>{const next=!notifyOn;if(next&&"Notification" in window&&Notification.permission==="default")await Notification.requestPermission();setNotifyOn(next);localStorage.setItem(NAMO_TALK_NOTIFY_KEY,next?"1":"0");setToast(next?"채팅 알림을 켰습니다.":"채팅 알림을 껐습니다.");setTimeout(()=>setToast(""),1800);};
  const openChatRoom=(roomId=activeRoom,returnMode=mode)=>{setActiveRoom(roomId);setChatReturnMode(returnMode==="conversations"?"conversations":"employees");setMessageListOpen(false);setChatRoomOpen(true);};
  const changeStatus=async next=>{setMyStatus(next);localStorage.setItem(NAMO_TALK_STATUS_KEY,next);try{await updateNamoTalkPresence(next,statusMessage);}catch(error){setToast(error.message);}setTimeout(()=>setToast(""),1800);};
  const saveStatusMessage=async()=>{localStorage.setItem(NAMO_TALK_STATUS_MESSAGE_KEY,statusMessage);try{await updateNamoTalkPresence(myStatus,statusMessage);setToast("상태 메시지를 저장했습니다.");}catch(error){setToast(error.message);}setTimeout(()=>setToast(""),1800);};
  const toggleChannels=()=>setChannelsOpen(previous=>{const next=!previous;localStorage.setItem(NAMO_TALK_CHANNELS_OPEN_KEY,next?"1":"0");return next;});
  const toggleDirects=()=>setDirectsOpen(previous=>{const next=!previous;localStorage.setItem(NAMO_TALK_DIRECTS_OPEN_KEY,next?"1":"0");return next;});
  const appendMessage=async payload=>{if(!activeRoom||sending)return;setSending(true);try{const saved=await postNamoTalkMessage(activeRoom,payload);setMessages(previous=>({...previous,[activeRoom]:[...(previous[activeRoom]||[]),saved]}));return true;}catch(error){if(error.message!=="__NAMO_AUTH_REDIRECT__")alert(`메시지 전송 실패: ${error.message}`);return false;}finally{setSending(false);}};
  const replaceRoomMessage=updated=>setMessages(previous=>({...previous,[activeRoom]:(previous[activeRoom]||[]).map(message=>message.id===updated.id?updated:message)}));
  const sendMessage=async()=>{const v=text.trim();if(!v||!room||sending)return;const ok=await appendMessage({text:v,kind:room.type==="notice"?"notice":"text",replyToId:replyingTo?.id||null,replySender:replyingTo?.sender||"",replyText:String(replyingTo?.text||replyingTo?.fileName||"").slice(0,300)});if(ok){setText("");setReplyingTo(null);setEmojiOpen(false);}};
  const sendEmoticon=async value=>{const ok=await appendMessage({text:value,kind:"emoticon"});if(ok)setEmojiOpen(false);};
  const handleFile=async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>3*1024*1024){alert("첨부파일은 3MB 이하만 가능합니다.");return;}const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});await appendMessage({text:file.name,kind:file.type.startsWith("image/")?"image":"file",fileName:file.name,fileData:dataUrl});};
  const editMessage=async message=>{if(message.deleted)return;const next=window.prompt("수정할 메시지를 입력하세요.",message.text||"");if(next==null||!next.trim()||next.trim()===message.text)return;try{replaceRoomMessage(await updateNamoTalkMessage(message.id,{action:"edit",text:next.trim()}));}catch(error){alert(error.message);}};
  const togglePinMessage=async message=>{try{replaceRoomMessage(await updateNamoTalkMessage(message.id,{action:"pin",pinned:!message.pinned}));}catch(error){alert(error.message);}};
  const removeMessage=async message=>{if(!window.confirm("이 메시지를 삭제할까요?"))return;try{replaceRoomMessage(await deleteNamoTalkMessage(message.id));}catch(error){alert(error.message);}};

  const filteredChannels=channelRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const noticeRooms=filteredChannels.filter(r=>r.type==="notice");
  const departmentRooms=filteredChannels.filter(r=>r.type==="dept");
  const filteredDirects=directRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const conversationRooms=allRooms.filter(item=>(messages[item.id]||[]).length>0).sort((a,b)=>Math.max(...(messages[b.id]||[]).map(row=>Number(row.createdAt)||0),0)-Math.max(...(messages[a.id]||[]).map(row=>Number(row.createdAt)||0),0));
  const roomMessages=messages[activeRoom]||[];
  const visibleMessages=roomMessages.filter(message=>!messageSearch.trim()||`${message.sender} ${message.text} ${message.fileName}`.toLowerCase().includes(messageSearch.trim().toLowerCase())).sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||Number(a.createdAt)-Number(b.createdAt));
  const receiptInfoFor=(msg,targetRoom=room)=>{
    if(!targetRoom)return {recipients:[],read:[],unread:[]};
    let recipients=[];
    if(targetRoom.type==="notice")recipients=users.filter(user=>user.name!==msg.sender);
    else if(targetRoom.type==="dept")recipients=users.filter(user=>user.dept===targetRoom.name&&user.name!==msg.sender);
    else recipients=users.filter(user=>[currentUser.name,targetRoom.name].includes(user.name)&&user.name!==msg.sender);
    const roomReceipts=readReceipts[targetRoom.id]||[];
    const read=[],unread=[];
    recipients.forEach(user=>{
      const receipt=roomReceipts.find(item=>(user.uid&&String(item.userUid)===String(user.uid))||item.userName===user.name);
      if(receipt&&Number(receipt.readAt)>=Number(msg.createdAt||0))read.push({user,receipt});
      else unread.push(user);
    });
    return {recipients,read,unread};
  };
  const detailInfo=readDetail?receiptInfoFor(readDetail,room):null;
  const unreadCount=allRooms.reduce((sum,r)=>sum+(messages[r.id]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id)>(reads[r.id]||0)).length,0);
  useEffect(()=>{localStorage.setItem("qmes-namo-talk-unread-v1",String(unreadCount));window.dispatchEvent(new CustomEvent("namo-talk-unread",{detail:{count:unreadCount}}));},[unreadCount]);
  const panelStyle=compact?{position:"fixed",top:112,right:0,bottom:0,left:0,width:"100vw",height:"auto"}:maximized?{position:"fixed",left:8,top:8,width:"calc(100vw - 16px)",height:"calc(100vh - 16px)"}:{position:"fixed",left:position.x,top:position.y,width:panelSize?.width||(chatRoomOpen?"min(650px,calc(100vw - 16px))":"min(430px,calc(100vw - 16px))"),height:panelSize?.height||"min(720px,calc(100vh - 16px))"};

  if(minimized)return <button type="button" onClick={()=>setMinimize(false)} aria-label="NAMO Talk 복원" style={{position:"fixed",right:18,bottom:18,zIndex:12000,height:48,padding:"0 16px",display:"flex",alignItems:"center",gap:9,border:"2px solid #d4a017",borderRadius:16,background:"#0f2740",color:"white",boxShadow:"0 12px 28px rgba(15,23,42,.35)",fontSize:15,fontWeight:900,cursor:"pointer"}}><NamoDrop size={28}/> NAMO Talk {unreadCount>0&&<span style={{minWidth:22,height:22,padding:"0 6px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:11,background:"#ef4444",fontSize:12}}>{unreadCount}</span>}</button>;

  return <section ref={panelRef} aria-label="NAMO Talk" style={{...panelStyle,zIndex:12000,display:"flex",flexDirection:"column",minWidth:compact?0:340,minHeight:compact?0:480,maxWidth:compact?"none":"calc(100vw - 8px)",maxHeight:compact?"none":"calc(100vh - 8px)",background:"#ffffff",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"0 18px 50px rgba(15,23,42,.32)",border:"2px solid #d4a017",borderRadius:compact||maximized?0:14,overflow:"hidden"}}>
    {!compact&&!maximized&&[
      ["t","n-resize",{top:0,left:10,right:10,height:7}],["b","s-resize",{bottom:0,left:10,right:10,height:7}],
      ["l","w-resize",{left:0,top:10,bottom:10,width:7}],["r","e-resize",{right:0,top:10,bottom:10,width:7}],
      ["tl","nw-resize",{top:0,left:0,width:12,height:12}],["tr","ne-resize",{top:0,right:0,width:12,height:12}],
      ["bl","sw-resize",{bottom:0,left:0,width:12,height:12}],["br","se-resize",{bottom:0,right:0,width:12,height:12}]
    ].map(([edges,cursor,style])=><div key={edges} onPointerDown={event=>startResize(event,edges)} style={{position:"absolute",zIndex:200,cursor,...style}}/>)}
    {toast&&<div style={{position:"absolute",right:12,top:66,zIndex:50,background:"#172033",color:"white",padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:800,boxShadow:"0 8px 20px rgba(15,23,42,.25)"}}>{toast}</div>}
    {readDetail&&<div onClick={()=>setReadDetail(null)} style={{position:"absolute",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",padding:18,background:"rgba(15,23,42,.48)"}}><div onClick={event=>event.stopPropagation()} style={{width:"min(390px,100%)",maxHeight:"75%",overflowY:"auto",background:"white",borderRadius:15,boxShadow:"0 20px 55px rgba(15,23,42,.35)",padding:18}}><div style={{display:"flex",alignItems:"center",gap:10}}><strong style={{fontSize:18,color:"#172033"}}>읽음 확인</strong><button onClick={()=>setReadDetail(null)} style={{marginLeft:"auto",width:32,height:32,border:0,borderRadius:8,background:"#eef2f6",fontSize:20,cursor:"pointer"}}>×</button></div><div style={{marginTop:7,fontSize:13,color:"#64748b",fontWeight:700}}>읽음 {detailInfo.read.length}/{detailInfo.recipients.length}명</div><div style={{marginTop:14}}>{detailInfo.recipients.length===0?<div style={{padding:14,textAlign:"center",color:"#64748b"}}>확인 대상자가 없습니다.</div>:detailInfo.read.map(({user,receipt})=><div key={`read-${user.uid||user.name}`} style={{display:"flex",alignItems:"center",padding:"10px 4px",borderBottom:"1px solid #e2e8f0"}}><span style={{width:31,height:31,borderRadius:"50%",background:"#dcfce7",color:"#15803d",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>✓</span><span style={{marginLeft:10,fontWeight:850,color:"#172033"}}>{user.name}</span><span style={{marginLeft:"auto",fontSize:11,color:"#64748b"}}>{new Date(receipt.readAt).toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false})}</span></div>)}</div>{detailInfo.unread.length>0&&<div style={{marginTop:15}}><div style={{fontSize:12,fontWeight:900,color:"#b45309",marginBottom:7}}>미확인 {detailInfo.unread.length}명</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{detailInfo.unread.map(user=><span key={`unread-${user.uid||user.name}`} style={{padding:"6px 9px",borderRadius:9,background:"#fff7ed",color:"#9a3412",fontSize:12,fontWeight:800}}>{user.name}</span>)}</div></div>}</div></div>}
    <header onPointerDown={startDrag} title={compact?"NAMO Talk":"제목줄을 잡고 이동"} style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"center",flexWrap:"nowrap",padding:"0 10px",background:"#0f2740",color:"white",cursor:compact?"default":"grab",touchAction:"none",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:compact?6:7,flex:"0 0 auto",whiteSpace:"nowrap"}}><NamoDrop size={compact?27:30}/><div style={{fontSize:compact?17:18,fontWeight:950,letterSpacing:"-.2px"}}>NAMO Talk</div></div>
      <div style={{display:compact?"none":"block",marginLeft:"auto",minWidth:0,fontSize:12,color:"#d7e3ec",marginRight:6,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name}</div>
      {compact&&<div style={{marginLeft:"auto"}}/>}
      <button onClick={toggleNotify} aria-label={notifyOn?"채팅 알림 끄기":"채팅 알림 켜기"} title={notifyOn?"채팅 알림 켜짐":"채팅 알림 꺼짐"} style={{position:"relative",width:34,height:32,border:"1px solid rgba(255,255,255,.15)",borderRadius:8,background:notifyOn?"rgba(250,204,21,.18)":"rgba(255,255,255,.07)",color:notifyOn?"#facc15":"#cbd5e1",fontSize:16,cursor:"pointer",marginRight:5}}>{notifyOn?"🔔":"🔕"}{unreadCount>0&&<span style={{position:"absolute",right:-4,top:-5,minWidth:17,height:17,padding:"0 4px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:"#ef4444",color:"white",fontSize:10,fontWeight:950,border:"2px solid #0f2740"}}>{unreadCount>99?"99+":unreadCount}</span>}</button>
      {!compact&&<button onClick={()=>setMinimize(true)} aria-label="최소화" title="최소화" style={{width:34,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.07)",color:"white",fontSize:20,cursor:"pointer",marginRight:5}}>−</button>}
      {!compact&&<button onClick={()=>setMaximized(value=>!value)} aria-label={maximized?"원래 크기로 복원":"최대화"} title={maximized?"원래 크기로 복원":"최대화"} style={{width:34,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.07)",color:"white",fontSize:17,cursor:"pointer",marginRight:5}}>{maximized?"❐":"□"}</button>}
      <button onClick={onClose} aria-label="닫기" style={{width:34,height:32,border:0,borderRadius:8,background:"rgba(255,255,255,.08)",color:"white",fontSize:22,cursor:"pointer"}}>×</button>
    </header>

    {mode==="employees"&&!chatRoomOpen&&!messageListOpen&&<div style={{minHeight:48,flex:"0 0 auto",display:"flex",alignItems:"center",flexWrap:compact?"wrap":"nowrap",gap:7,padding:compact?8:"0 10px",background:"#f8fafc",borderBottom:"1px solid #cbd5e1"}}>
      {!compact&&<strong style={{fontSize:12,color:"#475569",whiteSpace:"nowrap"}}>내 상태</strong>}
      <select value={myStatus} onChange={event=>changeStatus(event.target.value)} style={{height:32,width:compact?105:"auto",border:"1px solid #cbd5e1",borderRadius:8,padding:"0 7px",background:"white",color:"#172033",fontSize:12,fontWeight:800}}>{Object.entries(NAMO_TALK_STATUS).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}</select>
      <input value={statusMessage} maxLength={60} onChange={event=>setStatusMessage(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")saveStatusMessage();}} placeholder="상태 메시지 (예: 시험 진행 중)" style={{height:32,flex:1,minWidth:0,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:8,padding:"0 9px",fontSize:12,color:"#172033"}}/>
      <button type="button" onClick={saveStatusMessage} style={{height:32,padding:compact?"0 10px":"0 11px",border:0,borderRadius:8,background:"#0284c7",color:"white",fontSize:12,fontWeight:900,cursor:"pointer"}}>저장</button>
    </div>}

    {mode==="attendance"&&!chatRoomOpen?<AttendancePanel currentUser={currentUser} users={users}/>:<div style={{flex:"1 1 auto",minHeight:0,display:"flex",width:"100%",overflow:"hidden",padding:compact?8:10,boxSizing:"border-box",background:"#ffffff"}}>
      <div style={{display:mode==="employees"&&!chatRoomOpen&&!messageListOpen?"block":"none",width:"100%",flex:"1 1 auto",background:"white",border:"1px solid #cbd5e1",borderRadius:compact?10:12,boxShadow:"0 2px 8px rgba(15,39,64,.08)",overflowY:"auto"}}>
        <div style={{padding:9}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채널·직원 검색" style={{width:"100%",height:38,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",fontSize:14,color:"#1e293b"}}/></div>
        <div style={{padding:7}}>
          <button type="button" onClick={()=>openChatRoom(selfRoom.id,"employees")} style={{width:"100%",display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"11px 10px",border:"1px solid #dbe3ea",borderRadius:11,background:"#f8fafc",textAlign:"left",cursor:"pointer"}}>
            <span style={{width:38,height:38,position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:"#0f2740",color:"white",fontSize:15,fontWeight:950}}>{currentUser.name?.[0]||"나"}<i style={{position:"absolute",right:-1,bottom:-1,width:11,height:11,borderRadius:"50%",background:NAMO_TALK_STATUS[presence[currentUser.name]?.status||myStatus]?.color,border:"2px solid white"}}/></span>
            <span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:14,color:"#172033"}}>{currentUser.name} <small style={{color:"#64748b"}}>(나)</small></strong><span style={{display:"block",marginTop:3,fontSize:11,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{statusMessage||NAMO_TALK_STATUS[presence[currentUser.name]?.status||myStatus]?.label}</span></span><span style={{fontSize:16,color:"#94a3b8"}}>›</span>
          </button>
          {noticeRooms.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={roomId=>openChatRoom(roomId,"employees")} messages={messages} reads={reads} currentUser={currentUser}/>)}
          <button type="button" onClick={toggleChannels} aria-expanded={channelsOpen} style={{width:"100%",height:34,marginTop:9,padding:"0 7px",display:"flex",alignItems:"center",border:0,borderRadius:8,background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:900,cursor:"pointer",textAlign:"left"}}><span style={{width:18,fontSize:13}}>{channelsOpen?"▾":"▸"}</span>업무 채널<span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{departmentRooms.length}</span></button>
          {channelsOpen&&departmentRooms.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={roomId=>openChatRoom(roomId,"employees")} messages={messages} reads={reads} currentUser={currentUser}/>)}
          <button type="button" onClick={toggleDirects} aria-expanded={directsOpen} style={{width:"100%",height:34,marginTop:9,padding:"0 7px",display:"flex",alignItems:"center",border:0,borderRadius:8,background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:900,cursor:"pointer",textAlign:"left"}}><span style={{width:18,fontSize:13}}>{directsOpen?"▾":"▸"}</span>개인 대화<span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{filteredDirects.length}</span></button>
          {directsOpen&&filteredDirects.map(item=><RoomButton key={item.id} item={item} presence={presence[item.presenceName||item.name]} activeRoom={activeRoom} setActiveRoom={roomId=>openChatRoom(roomId,"employees")} messages={messages} reads={reads} currentUser={currentUser}/>)}
        </div>
      </div>

      <div style={{display:mode==="conversations"&&!chatRoomOpen?"block":"none",width:"100%",flex:"1 1 auto",background:"white",border:"1px solid #cbd5e1",borderRadius:compact?10:12,overflowY:"auto",padding:8}}>
        {conversationRooms.length===0?<div style={{padding:50,textAlign:"center",color:"#64748b"}}><NamoDrop size={52}/><strong style={{display:"block",marginTop:12,color:"#334155"}}>아직 대화방이 없습니다.</strong></div>:conversationRooms.map(item=>{const latest=[...(messages[item.id]||[])].sort((a,b)=>Number(b.createdAt)-Number(a.createdAt))[0];const unread=(messages[item.id]||[]).filter(message=>message.sender!==currentUser.name&&(message.createdAt||message.id)>(reads[item.id]||0)).length;return <button key={item.id} type="button" onClick={()=>openChatRoom(item.id,"conversations")} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 9px",border:0,borderBottom:"1px solid #e2e8f0",background:"white",textAlign:"left",cursor:"pointer"}}><span style={{width:42,height:42,flex:"0 0 42px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:item.type==="direct"?"50%":11,background:"#e8eef3",color:"#334155",fontWeight:950}}>{item.name?.[0]||"?"}</span><span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:14,color:"#172033"}}>{item.name}</strong><span style={{display:"block",marginTop:5,fontSize:12,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{latest?.deleted?"삭제된 메시지입니다.":latest?.fileName||latest?.text}</span></span><span style={{alignSelf:"flex-start",paddingTop:2,fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>{latest?.time||""}</span>{unread>0&&<span style={{minWidth:21,height:21,padding:"0 5px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:11,background:"#ef4444",color:"white",fontSize:11,fontWeight:950}}>{unread>99?"99+":unread}</span>}</button>;})}
      </div>

      <div style={{flex:"1 1 auto",minWidth:0,minHeight:0,display:chatRoomOpen?"flex":"none",flexDirection:"column",background:"#ffffff",border:"1px solid #cbd5e1",borderRadius:compact?10:12,boxShadow:"0 2px 8px rgba(15,39,64,.08)",overflow:"hidden",position:"relative"}}>
        <div style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"center",gap:10,padding:"0 14px",background:"white",borderBottom:"1px solid #cbd5e1"}}>
          <button type="button" onClick={()=>{setChatRoomOpen(false);setMode(chatReturnMode);}} aria-label="이전 화면으로 돌아가기" title="이전 화면" style={{width:34,height:34,flex:"0 0 34px",border:"1px solid #cbd5e1",borderRadius:9,background:"#f8fafc",color:"#334155",fontSize:20,fontWeight:900,cursor:"pointer"}}>‹</button>
          <div style={{minWidth:0}}><div style={{fontSize:17,fontWeight:950,color:"#172033"}}>{room?.name||"대화"}</div><div style={{fontSize:12,color:"#64748b",fontWeight:600,marginTop:3}}>{room?.subtitle||""}</div></div>
          <input value={messageSearch} onChange={event=>setMessageSearch(event.target.value)} placeholder="메시지 검색" style={{marginLeft:"auto",width:145,height:32,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:8,padding:"0 9px",fontSize:12,color:"#172033",outline:"none"}}/>
        </div>
        <div ref={scrollRef} style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:15}}>
          {roomMessages.length===0&&<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"#64748b"}}><div><NamoDrop size={58}/><strong style={{display:"block",color:"#334155",fontSize:15,marginTop:14}}>아직 대화 내용이 없습니다.</strong></div></div>}
          {roomMessages.length>0&&visibleMessages.length===0&&<div style={{padding:30,textAlign:"center",color:"#64748b",fontSize:13,fontWeight:700}}>검색 결과가 없습니다.</div>}
          {visibleMessages.map(msg=>{const mine=msg.sender===currentUser.name;const info=mine?receiptInfoFor(msg):null;const label=room?.type==="direct"?(info?.read.length?"읽음":"전송됨"):`읽음 ${info?.read.length||0}/${info?.recipients.length||0}명`;return <div key={msg.id} style={{marginBottom:14,textAlign:mine?"right":"left"}}>
            <div style={{fontSize:12,color:"#475569",fontWeight:700,marginBottom:4}}>{msg.pinned?"📌 ":""}{msg.sender} · {msg.time||""}{msg.edited?" · 수정됨":""}</div>
            <div style={{display:"inline-block",maxWidth:"84%",background:mine?"#0284c7":"white",color:mine?"white":"#172033",borderRadius:14,padding:msg.kind==="emoticon"?"10px 14px":"10px 12px",fontSize:msg.kind==="emoticon"?30:15,lineHeight:1.55,boxShadow:"0 1px 3px rgba(15,23,42,.1)",wordBreak:"break-word",opacity:msg.deleted?.72:1}}>
              {msg.replyToId&&<div style={{marginBottom:7,padding:"6px 8px",borderRadius:7,background:mine?"rgba(255,255,255,.16)":"#f1f5f9",borderLeft:`3px solid ${mine?"#bae6fd":"#38bdf8"}`,fontSize:11,lineHeight:1.35}}><strong>{msg.replySender}</strong><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{msg.replyText}</div></div>}
              {msg.kind==="image"?<img src={msg.fileData} alt={msg.fileName||"첨부 이미지"} style={{display:"block",maxWidth:"100%",maxHeight:220,borderRadius:8}}/>:msg.kind==="file"?<a href={msg.fileData} download={msg.fileName} style={{color:"inherit"}}>📎 {msg.fileName}</a>:msg.text}
            </div>
            {!msg.deleted&&<div style={{marginTop:3}}><button type="button" onClick={()=>setReplyingTo(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:"#64748b",fontSize:11,cursor:"pointer"}}>답장</button><button type="button" onClick={()=>togglePinMessage(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:msg.pinned?"#d97706":"#64748b",fontSize:11,cursor:"pointer"}}>{msg.pinned?"고정 해제":"고정"}</button>{mine&&<><button type="button" onClick={()=>editMessage(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:"#64748b",fontSize:11,cursor:"pointer"}}>수정</button><button type="button" onClick={()=>removeMessage(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:"#dc2626",fontSize:11,cursor:"pointer"}}>삭제</button></>}</div>}
            {mine&&<div><button type="button" onClick={()=>setReadDetail(msg)} style={{border:0,background:"transparent",padding:"2px 2px 0",color:info.read.length?"#0284c7":"#64748b",fontSize:11,fontWeight:850,cursor:"pointer"}}>{label}</button></div>}
          </div>})}
        </div>

        {emojiOpen&&<div style={{position:"absolute",right:10,bottom:84,width:280,padding:12,background:"white",border:"1px solid #cbd5e1",borderRadius:14,boxShadow:"0 14px 35px rgba(15,23,42,.2)",zIndex:20}}><div style={{display:"flex",alignItems:"center",marginBottom:9}}><strong style={{fontSize:14}}>나모 이모티콘</strong><button onClick={()=>setEmojiOpen(false)} style={{marginLeft:"auto",border:0,background:"transparent",fontSize:18,cursor:"pointer"}}>×</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>{NAMO_EMOTICONS.map((value,i)=><button key={`${value}-${i}`} onClick={()=>sendEmoticon(value)} title={value} style={{height:40,border:"1px solid #e2e8f0",borderRadius:9,background:"#f8fafc",fontSize:20,cursor:"pointer"}}>{value}</button>)}</div></div>}
        <div style={{flex:"0 0 auto",background:"white",padding:10,borderTop:"1px solid #cbd5e1"}}>
          {replyingTo&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,padding:"7px 9px",borderRadius:8,background:"#eff6ff",borderLeft:"3px solid #38bdf8",fontSize:11,color:"#334155"}}><span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><strong>{replyingTo.sender}</strong>에게 답장 · {replyingTo.text||replyingTo.fileName}</span><button type="button" onClick={()=>setReplyingTo(null)} style={{marginLeft:"auto",border:0,background:"transparent",fontSize:16,cursor:"pointer"}}>×</button></div>}
          <input ref={fileRef} type="file" onChange={handleFile} style={{display:"none"}}/>
          <div style={{display:"flex",alignItems:"flex-end",gap:7}}>
            <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지를 입력하세요" style={{flex:"1 1 auto",minWidth:0,height:60,boxSizing:"border-box",resize:"none",border:"1px solid #94a3b8",borderRadius:10,padding:"10px 11px",fontFamily:"inherit",fontSize:15,color:"#172033",outline:"none"}}/>
            <button type="button" title="파일 첨부" aria-label="파일 첨부" onClick={()=>fileRef.current?.click()} disabled={sending} style={{height:compact?42:46,width:compact?42:"auto",flex:"0 0 auto",padding:compact?0:"0 12px",border:"1px solid #94a3b8",borderRadius:9,background:"white",color:"#334155",fontSize:14,fontWeight:900,cursor:"pointer"}}>{compact?"📎":"📎 파일"}</button>
            <button type="button" title="이모티콘" aria-label="이모티콘" onClick={()=>setEmojiOpen(v=>!v)} disabled={sending} style={{height:compact?42:46,width:compact?42:"auto",flex:"0 0 auto",padding:compact?0:"0 11px",border:"1px solid #94a3b8",borderRadius:9,background:emojiOpen?"#ede9fe":"white",color:"#334155",fontSize:14,fontWeight:900,cursor:"pointer"}}>{compact?"😊":"😊 이모티콘"}</button>
            <button type="button" onClick={sendMessage} disabled={!text.trim()||sending} style={{width:compact?52:64,height:60,flex:`0 0 ${compact?52:64}px`,background:text.trim()&&!sending?"#0284c7":"#bae6fd",color:"white",border:0,borderRadius:10,fontSize:compact?13:15,fontWeight:950,cursor:text.trim()&&!sending?"pointer":"default"}}>{sending?"…":"전송"}</button>
          </div>
        </div>
      </div>
    </div>}
    {!chatRoomOpen&&<nav aria-label="NAMO Talk 하단 메뉴" style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"stretch",background:"#0f2740",borderTop:"1px solid #28435f"}}>
      {[["employees","♙","직원"],["conversations","▣","대화"],["attendance","◷","근태관리"]].map(([id,icon,label])=><button key={id} type="button" onClick={()=>{setMode(id);setMessageListOpen(false);}} style={{position:"relative",flex:1,border:0,borderTop:`3px solid ${mode===id?"#d4a017":"transparent"}`,background:mode===id?"rgba(212,160,23,.12)":"transparent",color:mode===id?"#ffe69a":"#cbd5e1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,fontSize:11,fontWeight:900,cursor:"pointer"}}><span aria-hidden="true" style={{fontSize:18,lineHeight:1}}>{icon}</span><span>{label}</span>{id==="conversations"&&unreadCount>0&&<span style={{position:"absolute",top:5,left:"calc(50% + 8px)",minWidth:18,height:18,padding:"0 5px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:"#ef4444",color:"white",fontSize:10,border:"2px solid #0f2740"}}>{unreadCount>99?"99+":unreadCount}</span>}</button>)}
    </nav>}
  </section>;
}

function RoomButton({item,presence,activeRoom,setActiveRoom,messages={},reads={},currentUser={}}){
  const active=activeRoom===item.id;
  const unread=(messages[item.id]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id)>(reads[item.id]||0)).length;
  const status=NAMO_TALK_STATUS[presence?.status||"offline"];
  const subtitle=item.type==="direct"?(presence?.statusMessage||`${item.subtitle} · ${status.label}`):item.subtitle;
  return <button type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:10,background:active?"#dbeafe":"transparent",display:"flex",alignItems:"center",gap:8,padding:"9px 8px",cursor:"pointer",textAlign:"left",marginBottom:3}}><span style={{width:32,height:32,flex:"0 0 32px",position:"relative",borderRadius:item.type==="direct"?"50%":9,background:active?"#0284c7":"#e8eef3",color:active?"white":"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:950}}>{item.name?.[0]||"?"}{item.type==="direct"&&<i title={status.label} style={{position:"absolute",right:-1,bottom:-1,width:10,height:10,borderRadius:"50%",background:status.color,border:"2px solid white"}}/>}</span><span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:14,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",fontSize:11,color:"#64748b",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>{subtitle}</span></span>{unread>0&&<span style={{minWidth:21,height:21,padding:"0 5px",borderRadius:11,background:"#ef4444",color:"white",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900}}>{unread>99?"99+":unread}</span>}</button>;
}
