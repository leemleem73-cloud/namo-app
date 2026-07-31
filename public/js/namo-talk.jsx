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
const NAMO_TALK_HIDDEN_ROOMS_KEY="qmes-namo-talk-hidden-rooms-v1";
const NAMO_TALK_VIEW_STATE_KEY="qmes-namo-talk-view-state-v1";
const NAMO_TALK_STATUS={
  online:{label:"온라인",color:"#22c55e"},
  away:{label:"자리 비움",color:"#eab308"},
  busy:{label:"다른 용무 중",color:"#ef4444"},
  meeting:{label:"회의 중",color:"#3b82f6"},
  offline:{label:"오프라인",color:"#94a3b8"}
};
const NAMO_PROFILE_PRESETS=[
  {id:"drop-blue",label:"오션 블루",color:"#3b82f6",color2:"#93c5fd",mood:"happy"},
  {id:"drop-purple",label:"라벤더",color:"#8b5cf6",color2:"#c4b5fd",mood:"soft"},
  {id:"drop-mint",label:"민트",color:"#10b981",color2:"#6ee7b7",mood:"happy"},
  {id:"drop-pink",label:"로즈",color:"#ec4899",color2:"#f9a8d4",mood:"soft"},
  {id:"drop-yellow",label:"레몬",color:"#f59e0b",color2:"#fde68a",mood:"laugh"},
  {id:"drop-sky",label:"아이스 스카이",color:"#06b6d4",color2:"#a5f3fc",mood:"happy"},
  {id:"drop-navy",label:"딥 네이비",color:"#1e3a5f",color2:"#64748b",mood:"focus"},
  {id:"drop-coral",label:"코랄",color:"#f97360",color2:"#fdbaaa",mood:"soft"},
  {id:"drop-angry",label:"레드 화남",color:"#dc2626",color2:"#fca5a5",mood:"angry"},
  {id:"drop-surprise",label:"아쿠아 놀람",color:"#0ea5e9",color2:"#7dd3fc",mood:"surprise"},
  {id:"drop-laugh",label:"망고 웃음",color:"#ea9b09",color2:"#fcd34d",mood:"laugh"},
  {id:"drop-sleepy",label:"인디고 졸림",color:"#6366f1",color2:"#a5b4fc",mood:"sleepy"},
  {id:"drop-curious",label:"터쿼이즈 궁금",color:"#0d9488",color2:"#5eead4",mood:"curious"},
  {id:"drop-cheer",label:"라임 응원",color:"#65a30d",color2:"#bef264",mood:"cheer"},
  {id:"drop-focus",label:"슬레이트 집중",color:"#334155",color2:"#94a3b8",mood:"focus"},
  {id:"drop-thanks",label:"피치 감사",color:"#f973a6",color2:"#fed7aa",mood:"thanks"}
];

function safeParse(v,fallback){try{return JSON.parse(v||"")||fallback;}catch(e){return fallback;}}
function safeNamoStorageGet(key,fallback=""){try{const value=localStorage.getItem(key);return value==null?fallback:value;}catch(error){return fallback;}}
function safeNamoStorageSet(key,value){try{localStorage.setItem(key,value);return true;}catch(error){return false;}}
function loadNamoTalkViewState(){try{return safeParse(sessionStorage.getItem(NAMO_TALK_VIEW_STATE_KEY),{});}catch(error){return{};}}
function saveNamoTalkViewState(value){try{sessionStorage.setItem(NAMO_TALK_VIEW_STATE_KEY,JSON.stringify(value));}catch(error){}}
function loadNamoTalkReads(){return safeParse(safeNamoStorageGet(NAMO_TALK_READ_KEY),{});}
function saveNamoTalkReads(data){try{localStorage.setItem(NAMO_TALK_READ_KEY,JSON.stringify(data));}catch(e){}}
function getNamoTalkUsers(){try{const users=typeof loadUsers==="function"?loadUsers():[];return Array.isArray(users)?users.filter(u=>u&&u.name):[];}catch(e){return[];}}
function makeDirectRoomId(a,b){return `dm:${[a,b].sort((x,y)=>String(x).localeCompare(String(y),"ko")).join("|")}`;}
function loadNamoTalkPosition(){const saved=safeParse(safeNamoStorageGet(NAMO_TALK_POSITION_KEY),null);if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))return saved;return {x:Math.max(16,window.innerWidth-640),y:128};}
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

async function fetchNamoTalkProfiles(){
  const response=await fetch("/api/namo-talk/profiles",{credentials:"same-origin"});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"프로필 정보를 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"프로필을 불러오지 못했습니다.");
  return Array.isArray(payload.data)?payload.data:[];
}

async function saveNamoTalkProfile(profile){
  const response=await fetch("/api/namo-talk/profiles",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});
  handleNamoTalkAuth(response);
  const payload=await response.json().catch(()=>({success:false,message:"프로필 저장 결과를 확인할 수 없습니다."}));
  if(!response.ok||!payload.success)throw new Error(payload.message||"프로필을 저장하지 못했습니다.");
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

const NAMO_STICKER_CATEGORIES=[
  {id:"emotion",number:1,title:"감정 표현",side:"left",vertical:"top",labels:["좋아요!","사랑해요","축하해요!","수고했어요!","최고예요!","재밌어요!","힘내세요!","졸려요!","궁금해요!","놀랐어요!","멋져요!","감사해요!","부탁해요!","괜찮아요!","아쉬워요!","슬퍼요!","화나요!","응원해요!"]},
  {id:"work",number:2,title:"업무·소통",side:"right",vertical:"top",labels:["Coffee Time","Lunch Time","확인 부탁","전화주세요","메일 확인","회의 시작","보고 완료","자료 공유","잠시 통화 가능?","공지 확인","작업 중","바쁩니다","확인했어요","완료!","다시 확인","작성 중","좋은 아이디어!","OK!"]},
  {id:"attendance",number:3,title:"출퇴근·근태",side:"left",vertical:"bottom",labels:["출근 완료","퇴근합니다","이동 중","외근 중","재택근무","사무실 도착","지각 예정","야근 중","식사 중","휴식 중","출장 중","먼저 퇴근합니다","연차 사용","오늘도 파이팅!","컨디션 별로","몸살 기운","병가 사용","회복 중"]},
  {id:"qmes",number:4,title:"생산·품질·안전",side:"right",vertical:"bottom",labels:["생산 시작","생산 중","생산 완료","포장 완료","출하 완료","검사 중","검사 완료","LOT 확인","이상 발생","격리 조치","설비 점검","설비 수리","안전 제일","안전 점검","보호구 착용","화재 주의","정리 정돈","목표 달성"]}
];
const NAMO_STICKERS=NAMO_STICKER_CATEGORIES.flatMap((category,categoryIndex)=>category.labels.map((label,index)=>{
  const atlasIndex=categoryIndex*18+index;
  return {id:`${category.id}-${String(index+1).padStart(2,"0")}`,category:category.id,label,x:(atlasIndex%6)*120,y:Math.floor(atlasIndex/6)*135,w:120,h:135};
}));
const NAMO_EMOJI_PAGE_SIZE=8;
const NAMO_STICKER_SHEET="/assets/namo-emoticons-transparent-20260731.webp";

function NamoDrop({size=34}){
  return <span aria-hidden="true" style={{width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center",flex:"0 0 auto",borderRadius:"55% 55% 60% 60% / 68% 68% 42% 42%",transform:"rotate(45deg)",background:"linear-gradient(145deg,#d8d4ff,#8b7cf4)",border:"1px solid rgba(255,255,255,.75)",boxShadow:"inset 0 2px 5px rgba(255,255,255,.7),0 2px 6px rgba(15,39,64,.25)",position:"relative"}}><span style={{transform:"rotate(-45deg)",fontSize:Math.max(13,size*.42),lineHeight:1}}>•ᴗ•</span></span>;
}

function NamoProfileAvatar({profile,size=36,name=""}){
  if(profile?.type==="image"&&profile.value)return <img src={profile.value} alt={`${name||"사용자"} 프로필`} style={{width:size,height:size,flex:`0 0 ${size}px`,display:"block",objectFit:"cover",borderRadius:"50%",border:"2px solid white",boxShadow:"0 1px 5px rgba(15,39,64,.2)"}}/>;
  const preset=NAMO_PROFILE_PRESETS.find(item=>item.id===(profile?.value||"drop-blue"))||NAMO_PROFILE_PRESETS[0];
  return <span aria-label={`${name||"사용자"} ${preset.label} 물방울 프로필`} style={{width:size,height:size,flex:`0 0 ${size}px`,display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:`linear-gradient(145deg,#ffffff,${preset.color2}33)`,border:`1px solid ${preset.color2}88`,boxShadow:"inset 0 1px 2px white,0 2px 6px rgba(15,39,64,.14)",overflow:"hidden"}}><span style={{width:size*.72,height:size*.72,position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:"55% 55% 60% 60% / 68% 68% 42% 42%",transform:"rotate(45deg)",background:`linear-gradient(145deg,#f8fdff 3%,${preset.color2} 42%,${preset.color} 88%)`,border:"1px solid rgba(255,255,255,.85)",boxShadow:"inset 2px 2px 5px rgba(255,255,255,.88),inset -2px -2px 4px rgba(15,39,64,.15),0 2px 4px rgba(15,39,64,.22)"}}><span style={{position:"absolute",top:"15%",left:"18%",width:"22%",height:"13%",borderRadius:"50%",background:"rgba(255,255,255,.78)",filter:"blur(.2px)"}}/><NamoAvatarFace mood={preset.mood} size={size}/></span></span>;
}

function NamoAvatarFace({mood="happy",size=36}){
  const ink="#17324d",isClosed=["laugh","sleepy","thanks"].includes(mood),isAngry=mood==="angry",isFocus=mood==="focus",isSurprise=mood==="surprise",isCurious=mood==="curious";
  const eyeWidth=Math.max(3.2,size*.09),eyeHeight=Math.max(4.5,size*.135);
  const eye=(side,extra={})=><i style={{position:"absolute",top:isAngry||isFocus?"25%":isCurious&&side==="right"?"12%":"17%",[side]:"14%",width:isCurious&&side==="right"?eyeWidth*1.18:eyeWidth,height:isCurious&&side==="right"?eyeHeight*1.15:eyeHeight,borderRadius:"50%",background:`linear-gradient(180deg,#294d70,${ink})`,boxShadow:"0 1px 1px rgba(255,255,255,.45)",...extra}}><i style={{position:"absolute",left:"17%",top:"12%",width:"35%",height:"31%",borderRadius:"50%",background:"white",boxShadow:"0 0 2px rgba(255,255,255,.9)"}}/></i>;
  const closedEye=side=><i style={{position:"absolute",top:mood==="sleepy"?"24%":"20%",[side]:"12%",width:size*.13,height:size*.07,borderTop:`${Math.max(2,size*.04)}px solid ${ink}`,borderRadius:"50%",transform:`rotate(${side==="left"?(mood==="laugh"?-13:8):(mood==="laugh"?13:-8)}deg)`}}/>;
  const mouthStyle=isSurprise?{width:size*.11,height:size*.13,background:"#7f2947",border:`1px solid ${ink}`,borderRadius:"50%",boxShadow:"inset 0 2px 0 #ffb8cb"}:isAngry?{width:size*.2,height:size*.09,borderTop:`${Math.max(2,size*.04)}px solid ${ink}`,borderRadius:"50%"}:mood==="soft"?{width:size*.13,height:size*.075,borderBottom:`${Math.max(2,size*.04)}px solid ${ink}`,borderRadius:"0 0 50% 50%"}:{width:size*.22,height:size*.12,background:"#8f3152",border:`1px solid ${ink}`,borderRadius:"25% 25% 55% 55%",boxShadow:"inset 0 -3px 0 #ff91ad"};
  return <span style={{position:"relative",width:size*.48,height:size*.39,transform:"rotate(-45deg) translateY(7%)",display:"block"}}>
    {(isAngry||isFocus)&&<><i style={{position:"absolute",top:"3%",left:"7%",width:"30%",height:Math.max(2,size*.04),background:ink,borderRadius:3,transform:`rotate(${isAngry?18:7}deg)`}}/><i style={{position:"absolute",top:"3%",right:"7%",width:"30%",height:Math.max(2,size*.04),background:ink,borderRadius:3,transform:`rotate(${isAngry?-18:-7}deg)`}}/></>}
    {isClosed?closedEye("left"):eye("left")}{isClosed?closedEye("right"):eye("right")}
    <i style={{position:"absolute",left:"50%",bottom:"2%",transform:"translateX(-50%)",...mouthStyle}}/>
    <i style={{position:"absolute",left:"-3%",bottom:"12%",width:size*.12,height:size*.065,borderRadius:"50%",background:"rgba(255,126,164,.58)",filter:"blur(.3px)"}}/><i style={{position:"absolute",right:"-3%",bottom:"12%",width:size*.12,height:size*.065,borderRadius:"50%",background:"rgba(255,126,164,.58)",filter:"blur(.3px)"}}/>
    {mood==="cheer"&&<i style={{position:"absolute",right:"-24%",top:"-24%",fontSize:Math.max(8,size*.19),fontStyle:"normal",color:"#fff7a8",textShadow:"0 1px 2px rgba(15,39,64,.25)"}}>✦</i>}
    {isCurious&&<i style={{position:"absolute",right:"-20%",top:"-26%",fontSize:Math.max(8,size*.2),fontStyle:"normal",fontWeight:950,color:"#fff",textShadow:"0 1px 2px rgba(15,39,64,.3)"}}>?</i>}
  </span>;
}

function NamoSticker({sticker,width=70,withLabel=true}){
  if(!sticker)return null;
  const scale=width/sticker.w,sourceHeight=withLabel?sticker.h:102,height=Math.round(sourceHeight*scale);
  return <span role="img" aria-label={sticker.label} style={{width,height,display:"inline-block",flex:`0 0 ${width}px`,backgroundImage:`url(${NAMO_STICKER_SHEET})`,backgroundRepeat:"no-repeat",backgroundSize:`${720*scale}px ${1620*scale}px`,backgroundPosition:`${-sticker.x*scale}px ${-sticker.y*scale}px`}}/>;
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
          const count=Number(safeNamoStorageGet("qmes-namo-talk-unread-v1","0"))+rows.length;
          safeNamoStorageSet("qmes-namo-talk-unread-v1",String(count));
          window.dispatchEvent(new CustomEvent("namo-talk-unread",{detail:{count}}));
        }
        if(stopped||talkOpen||safeNamoStorageGet(NAMO_TALK_NOTIFY_KEY)==="0"||!rows.length)return;
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
      <span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:14,lineHeight:1.3}}>{message.sender}</strong><span style={{display:"block",marginTop:4,color:"#d7e3ec",fontSize:13,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{message.deleted?"삭제된 메시지입니다.":message.kind==="sticker"?`나모 이모티콘 · ${message.text}`:message.kind==="file"||message.kind==="image"?`📎 ${message.fileName||message.text}`:message.text}</span></span>
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
  const savedView=loadNamoTalkViewState();
  const [activeRoom,setActiveRoom]=useState(()=>initialRoom||savedView.activeRoom||directRooms[0]?.id||channelRooms[0]?.id||"전체공지");
  const [messages,setMessages]=useState({});
  const [readReceipts,setReadReceipts]=useState({});
  const [reads,setReads]=useState(loadNamoTalkReads);
  const [text,setText]=useState("");
  const [search,setSearch]=useState("");
  const [messageSearch,setMessageSearch]=useState("");
  const [replyingTo,setReplyingTo]=useState(null);
  const [mode,setMode]=useState(()=>savedView.mode||"employees");
  const [chatReturnMode,setChatReturnMode]=useState(()=>savedView.chatReturnMode||"employees");
  const [chatRoomOpen,setChatRoomOpen]=useState(()=>Boolean(initialRoom)||Boolean(savedView.chatRoomOpen));
  const [messageListOpen,setMessageListOpen]=useState(false);
  const [compact,setCompact]=useState(()=>window.innerWidth<=480);
  const [position,setPosition]=useState(loadNamoTalkPosition);
  const [panelSize,setPanelSize]=useState(null);
  const [minimized,setMinimized]=useState(()=>safeNamoStorageGet(NAMO_TALK_MINIMIZED_KEY)==="1");
  const [maximized,setMaximized]=useState(false);
  const [notifyOn,setNotifyOn]=useState(()=>safeNamoStorageGet(NAMO_TALK_NOTIFY_KEY)!=="0");
  const [presence,setPresence]=useState({});
  const [profiles,setProfiles]=useState({});
  const [profileOpen,setProfileOpen]=useState(false);
  const [profileDraft,setProfileDraft]=useState(null);
  const [savingProfile,setSavingProfile]=useState(false);
  const [myStatus,setMyStatus]=useState(()=>safeNamoStorageGet(NAMO_TALK_STATUS_KEY,"online"));
  const [statusMessage,setStatusMessage]=useState(()=>safeNamoStorageGet(NAMO_TALK_STATUS_MESSAGE_KEY));
  const [savedStatusMessage,setSavedStatusMessage]=useState(()=>safeNamoStorageGet(NAMO_TALK_STATUS_MESSAGE_KEY));
  const [channelsOpen,setChannelsOpen]=useState(()=>safeNamoStorageGet(NAMO_TALK_CHANNELS_OPEN_KEY)!=="0");
  const [directsOpen,setDirectsOpen]=useState(()=>safeNamoStorageGet(NAMO_TALK_DIRECTS_OPEN_KEY)!=="0");
  const [hiddenRooms,setHiddenRooms]=useState(()=>safeParse(safeNamoStorageGet(NAMO_TALK_HIDDEN_ROOMS_KEY),{}));
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [emojiPage,setEmojiPage]=useState(0);
  const [stickerCategory,setStickerCategory]=useState("emotion");
  const [selectedSticker,setSelectedSticker]=useState(null);
  const [imagePreview,setImagePreview]=useState(null);
  const [toast,setToast]=useState("");
  const [sending,setSending]=useState(false);
  const fileRef=useRef(null),profileFileRef=useRef(null),composerRef=useRef(null),scrollRef=useRef(null),stickToBottomRef=useRef(true),panelRef=useRef(null),dragRef=useRef(null),resizeRef=useRef(null),markedRef=useRef({}),lastActivityRef=useRef(Date.now()),statusRef=useRef(myStatus),statusMessageRef=useRef(statusMessage);
  const room=allRooms.find(item=>item.id===activeRoom)||allRooms[0];
  const activeMessageRows=messages[activeRoom]||[];
  const activeMessageVersion=activeMessageRows.reduce((latest,message)=>Math.max(latest,Number(message.createdAt||message.id)||0),0);

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
  useEffect(()=>{statusMessageRef.current=savedStatusMessage;},[savedStatusMessage]);
  useEffect(()=>{
    let stopped=false;
    const refresh=async()=>{try{const rows=await fetchNamoTalkPresence();if(!stopped)setPresence(Object.fromEntries(rows.map(row=>[row.name,row])));}catch(error){console.warn("NAMO Talk presence refresh failed:",error.message);}};
    refresh();const t=setInterval(refresh,15000);return()=>{stopped=true;clearInterval(t);};
  },[]);
  useEffect(()=>{
    let stopped=false;
    const refresh=async()=>{try{const rows=await fetchNamoTalkProfiles();if(!stopped)setProfiles(Object.fromEntries(rows.map(row=>[row.name,row])));}catch(error){console.warn("NAMO Talk profile refresh failed:",error.message);}};
    refresh();const t=setInterval(refresh,20000);return()=>{stopped=true;clearInterval(t);};
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
  useEffect(()=>{
    stickToBottomRef.current=true;
    window.requestAnimationFrame(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;});
  },[activeRoom,chatRoomOpen]);
  useEffect(()=>{
    if(!chatRoomOpen||!stickToBottomRef.current)return;
    window.requestAnimationFrame(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;});
  },[activeMessageRows.length,activeMessageVersion,chatRoomOpen]);
  useEffect(()=>{if(!allRooms.some(item=>item.id===activeRoom)&&allRooms[0])setActiveRoom(allRooms[0].id);},[users.length]);
  useEffect(()=>{if(initialRoom){setActiveRoom(initialRoom);setMessageListOpen(false);setEmojiOpen(false);setChatRoomOpen(true);}},[initialRoom]);
  useEffect(()=>{if(!chatRoomOpen)setEmojiOpen(false);},[chatRoomOpen]);
  useEffect(()=>{saveNamoTalkViewState({activeRoom,mode,chatReturnMode,chatRoomOpen});},[activeRoom,mode,chatReturnMode,chatRoomOpen]);
  useEffect(()=>{if(!profileOpen&&!imagePreview)return;const bodyOverflow=document.body.style.overflow,htmlOverflow=document.documentElement.style.overflow;document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden";return()=>{document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=htmlOverflow;};},[profileOpen,Boolean(imagePreview)]);
  useEffect(()=>{const onResize=()=>{const nextCompact=window.innerWidth<=480;setCompact(nextCompact);if(nextCompact)return;const panel=panelRef.current;const width=panel?.offsetWidth||620;const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);setPosition(previous=>{const next={x:Math.max(8,Math.min(previous.x,window.innerWidth-width-8)),y:Math.max(8,Math.min(previous.y,window.innerHeight-height-8))};saveNamoTalkPosition(next);return next;});};window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
  useEffect(()=>{const onPointerMove=event=>{const drag=dragRef.current;if(!drag||compact)return;event.preventDefault();const panel=panelRef.current;const width=panel?.offsetWidth||620;const height=panel?.offsetHeight||Math.min(720,window.innerHeight-140);setPosition({x:Math.max(8,Math.min(event.clientX-drag.offsetX,window.innerWidth-width-8)),y:Math.max(8,Math.min(event.clientY-drag.offsetY,window.innerHeight-height-8))});};const onPointerUp=()=>{if(!dragRef.current)return;dragRef.current=null;saveNamoTalkPosition(position);document.body.style.userSelect="";document.body.style.cursor="";};window.addEventListener("pointermove",onPointerMove,{passive:false});window.addEventListener("pointerup",onPointerUp);window.addEventListener("pointercancel",onPointerUp);return()=>{window.removeEventListener("pointermove",onPointerMove);window.removeEventListener("pointerup",onPointerUp);window.removeEventListener("pointercancel",onPointerUp);};},[compact,position]);
  useEffect(()=>{const onPointerMove=event=>{const resize=resizeRef.current;if(!resize||compact||maximized)return;event.preventDefault();const dx=event.clientX-resize.startX,dy=event.clientY-resize.startY;let x=resize.x,y=resize.y,width=resize.width,height=resize.height;if(resize.edges.includes("r"))width=Math.min(window.innerWidth-x-8,Math.max(340,resize.width+dx));if(resize.edges.includes("b"))height=Math.min(window.innerHeight-y-8,Math.max(480,resize.height+dy));if(resize.edges.includes("l")){const nextX=Math.max(8,Math.min(resize.x+dx,resize.x+resize.width-340));width=resize.width+(resize.x-nextX);x=nextX;}if(resize.edges.includes("t")){const nextY=Math.max(8,Math.min(resize.y+dy,resize.y+resize.height-480));height=resize.height+(resize.y-nextY);y=nextY;}setPosition({x,y});setPanelSize({width,height});};const onPointerUp=()=>{if(!resizeRef.current)return;resizeRef.current=null;saveNamoTalkPosition(position);document.body.style.userSelect="";document.body.style.cursor="";};window.addEventListener("pointermove",onPointerMove,{passive:false});window.addEventListener("pointerup",onPointerUp);window.addEventListener("pointercancel",onPointerUp);return()=>{window.removeEventListener("pointermove",onPointerMove);window.removeEventListener("pointerup",onPointerUp);window.removeEventListener("pointercancel",onPointerUp);};},[compact,maximized,position]);

  const startDrag=event=>{if(compact||maximized||event.button!==0||event.target.closest("button"))return;const rect=panelRef.current?.getBoundingClientRect();if(!rect)return;dragRef.current={offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};document.body.style.userSelect="none";document.body.style.cursor="grabbing";event.preventDefault();};
  const startResize=(event,edges)=>{if(compact||maximized||event.button!==0)return;const rect=panelRef.current?.getBoundingClientRect();if(!rect)return;resizeRef.current={edges,startX:event.clientX,startY:event.clientY,x:rect.left,y:rect.top,width:rect.width,height:rect.height};document.body.style.userSelect="none";document.body.style.cursor=getComputedStyle(event.currentTarget).cursor;event.stopPropagation();event.preventDefault();};
  const setMinimize=value=>{setMinimized(value);safeNamoStorageSet(NAMO_TALK_MINIMIZED_KEY,value?"1":"0");};
  const toggleNotify=async()=>{const next=!notifyOn;if(next&&"Notification" in window&&Notification.permission==="default")await Notification.requestPermission();setNotifyOn(next);safeNamoStorageSet(NAMO_TALK_NOTIFY_KEY,next?"1":"0");setToast(next?"채팅 알림을 켰습니다.":"채팅 알림을 껐습니다.");setTimeout(()=>setToast(""),1800);};
  const openChatRoom=(roomId=activeRoom,returnMode=mode)=>{setActiveRoom(roomId);setChatReturnMode(returnMode==="conversations"?"conversations":"employees");setMessageListOpen(false);setEmojiOpen(false);setChatRoomOpen(true);};
  const changeStatus=async next=>{setMyStatus(next);safeNamoStorageSet(NAMO_TALK_STATUS_KEY,next);try{await updateNamoTalkPresence(next,savedStatusMessage);}catch(error){setToast(error.message);}setTimeout(()=>setToast(""),1800);};
  const saveStatusMessage=async()=>{safeNamoStorageSet(NAMO_TALK_STATUS_MESSAGE_KEY,statusMessage);setSavedStatusMessage(statusMessage);try{await updateNamoTalkPresence(myStatus,statusMessage);setPresence(previous=>({...previous,[currentUser.name]:{...(previous[currentUser.name]||{}),name:currentUser.name,status:myStatus,statusMessage,lastSeen:Date.now()}}));setToast("상태 메시지를 저장했습니다.");}catch(error){setToast(error.message);}setTimeout(()=>setToast(""),1800);};
  const toggleChannels=()=>setChannelsOpen(previous=>{const next=!previous;safeNamoStorageSet(NAMO_TALK_CHANNELS_OPEN_KEY,next?"1":"0");return next;});
  const toggleDirects=()=>setDirectsOpen(previous=>{const next=!previous;safeNamoStorageSet(NAMO_TALK_DIRECTS_OPEN_KEY,next?"1":"0");return next;});
  const openProfileEditor=()=>{setProfileDraft(profiles[currentUser.name]||{type:"preset",value:"drop-blue"});setProfileOpen(true);};
  const uploadProfileImage=event=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;if(!file.type.startsWith("image/")){alert("그림 파일만 선택할 수 있습니다.");return;}if(file.size>5*1024*1024){alert("원본 이미지는 5MB 이하만 선택해 주세요.");return;}const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const size=320,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;const context=canvas.getContext("2d");const source=Math.min(image.width,image.height),sx=(image.width-source)/2,sy=(image.height-source)/2;context.drawImage(image,sx,sy,source,source,0,0,size,size);setProfileDraft({type:"image",value:canvas.toDataURL("image/jpeg",.82)});};image.src=reader.result;};reader.readAsDataURL(file);};
  const submitProfile=async()=>{if(!profileDraft||savingProfile)return;setSavingProfile(true);try{const saved=await saveNamoTalkProfile(profileDraft);setProfiles(previous=>({...previous,[saved.name]:saved}));setProfileOpen(false);setToast("프로필을 저장했습니다.");setTimeout(()=>setToast(""),1800);}catch(error){alert(error.message);}finally{setSavingProfile(false);}};
  const appendMessage=async payload=>{if(!activeRoom||sending)return;setSending(true);try{const saved=await postNamoTalkMessage(activeRoom,payload);stickToBottomRef.current=true;setMessages(previous=>({...previous,[activeRoom]:[...(previous[activeRoom]||[]),saved]}));return true;}catch(error){if(error.message!=="__NAMO_AUTH_REDIRECT__")alert(`메시지 전송 실패: ${error.message}`);return false;}finally{setSending(false);}};
  const replaceRoomMessage=updated=>setMessages(previous=>({...previous,[activeRoom]:(previous[activeRoom]||[]).map(message=>message.id===updated.id?updated:message)}));
  const sendMessage=async()=>{const v=text.trim();if((!v&&!selectedSticker)||!room||sending)return;const ok=await appendMessage({text:v||selectedSticker.label,kind:selectedSticker?"sticker":room.type==="notice"?"notice":"text",fileName:selectedSticker?.id||"",replyToId:replyingTo?.id||null,replySender:replyingTo?.sender||"",replyText:String(replyingTo?.text||replyingTo?.fileName||"").slice(0,300)});if(ok){setText("");setSelectedSticker(null);setReplyingTo(null);setEmojiOpen(false);}};
  const selectSticker=sticker=>{setSelectedSticker(sticker);setEmojiOpen(false);window.requestAnimationFrame(()=>composerRef.current?.focus());};
  const handleFile=async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>3*1024*1024){alert("첨부파일은 3MB 이하만 가능합니다.");return;}const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});await appendMessage({text:file.name,kind:file.type.startsWith("image/")?"image":"file",fileName:file.name,fileData:dataUrl});};
  const copyImageToClipboard=async source=>{try{if(!navigator.clipboard?.write||typeof ClipboardItem==="undefined")throw new Error("이 브라우저에서는 이미지 복사를 지원하지 않습니다.");const blob=await fetch(source).then(response=>response.blob());const type=blob.type||"image/png";await navigator.clipboard.write([new ClipboardItem({[type]:blob})]);setToast("이미지를 복사했습니다.");setTimeout(()=>setToast(""),1800);}catch(error){alert(error.message||"이미지를 복사하지 못했습니다.");}};
  const pasteComposerImage=async event=>{const item=Array.from(event.clipboardData?.items||[]).find(entry=>entry.type.startsWith("image/"));if(!item)return;event.preventDefault();const file=item.getAsFile();if(!file)return;if(file.size>3*1024*1024){alert("붙여넣을 이미지는 3MB 이하만 가능합니다.");return;}const fileData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const stamp=new Date().toISOString().replace(/[:.]/g,"-");await appendMessage({text:"붙여넣은 이미지",kind:"image",fileName:`붙여넣은_이미지_${stamp}.png`,fileType:file.type||"image/png",fileData});};
  const editMessage=async message=>{if(message.deleted)return;const next=window.prompt("수정할 메시지를 입력하세요.",message.text||"");if(next==null||!next.trim()||next.trim()===message.text)return;try{replaceRoomMessage(await updateNamoTalkMessage(message.id,{action:"edit",text:next.trim()}));}catch(error){alert(error.message);}};
  const togglePinMessage=async message=>{try{replaceRoomMessage(await updateNamoTalkMessage(message.id,{action:"pin",pinned:!message.pinned}));}catch(error){alert(error.message);}};
  const removeMessage=async message=>{if(!window.confirm("이 메시지를 완전히 삭제할까요?\n삭제 후에는 복구할 수 없습니다."))return;try{await deleteNamoTalkMessage(message.id);setMessages(previous=>({...previous,[activeRoom]:(previous[activeRoom]||[]).filter(item=>item.id!==message.id)}));}catch(error){alert(error.message);}};
  const roomMessageVersion=roomId=>(messages[roomId]||[]).reduce((latest,message)=>Math.max(latest,Number(message.createdAt||message.id)||0),0);
  const hideConversation=item=>{
    if(!window.confirm(`'${item.name}' 대화방을 내 대화목록에서 삭제할까요?\n새 메시지가 오면 다시 표시됩니다.`))return;
    const nextHidden={...hiddenRooms,[item.id]:roomMessageVersion(item.id)};
    setHiddenRooms(nextHidden);
    safeNamoStorageSet(NAMO_TALK_HIDDEN_ROOMS_KEY,JSON.stringify(nextHidden));
    const nextReads={...reads,[item.id]:Date.now()};
    setReads(nextReads);
    saveNamoTalkReads(nextReads);
  };

  const filteredChannels=channelRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const noticeRooms=filteredChannels.filter(r=>r.type==="notice");
  const departmentRooms=filteredChannels.filter(r=>r.type==="dept");
  const filteredDirects=directRooms.filter(r=>!search||`${r.name} ${r.subtitle}`.includes(search));
  const conversationRooms=allRooms.filter(item=>(messages[item.id]||[]).length>0&&roomMessageVersion(item.id)>Number(hiddenRooms[item.id]||0)).sort((a,b)=>roomMessageVersion(b.id)-roomMessageVersion(a.id));
  const roomMessages=messages[activeRoom]||[];
  const categoryStickers=NAMO_STICKERS.filter(sticker=>sticker.category===stickerCategory);
  const pinnedPreview=[...roomMessages].filter(message=>message.pinned&&!message.deleted).sort((a,b)=>Number(b.createdAt)-Number(a.createdAt))[0];
  const visibleMessages=roomMessages.filter(message=>!messageSearch.trim()||`${message.sender} ${message.text} ${message.fileName}`.toLowerCase().includes(messageSearch.trim().toLowerCase())).sort((a,b)=>Number(a.createdAt)-Number(b.createdAt));
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
  const unreadCount=allRooms.reduce((sum,r)=>{
    if(chatRoomOpen&&r.id===activeRoom)return sum;
    if(roomMessageVersion(r.id)<=Number(hiddenRooms[r.id]||0))return sum;
    return sum+(messages[r.id]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id)>(reads[r.id]||0)).length;
  },0);
  useEffect(()=>{safeNamoStorageSet("qmes-namo-talk-unread-v1",String(unreadCount));window.dispatchEvent(new CustomEvent("namo-talk-unread",{detail:{count:unreadCount}}));},[unreadCount]);
  const panelStyle=compact?{position:"fixed",top:112,right:0,bottom:0,left:0,width:"100vw",height:"auto"}:maximized?{position:"fixed",left:8,top:8,width:"calc(100vw - 16px)",height:"calc(100vh - 16px)"}:{position:"fixed",left:position.x,top:position.y,width:panelSize?.width||(chatRoomOpen?"min(650px,calc(100vw - 16px))":"min(430px,calc(100vw - 16px))"),height:panelSize?.height||"min(720px,calc(100vh - 16px))"};

  if(minimized)return <button type="button" onClick={()=>setMinimize(false)} aria-label="NAMO Talk 복원" style={{position:"fixed",right:18,bottom:18,zIndex:12000,height:48,padding:"0 16px",display:"flex",alignItems:"center",gap:9,border:"2px solid #d4a017",borderRadius:16,background:"#0f2740",color:"white",boxShadow:"0 12px 28px rgba(15,23,42,.35)",fontSize:15,fontWeight:900,cursor:"pointer"}}><NamoDrop size={28}/> NAMO Talk {unreadCount>0&&<span style={{minWidth:22,height:22,padding:"0 6px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:11,background:"#ef4444",fontSize:12}}>{unreadCount}</span>}</button>;

  return <section ref={panelRef} aria-label="NAMO Talk" onWheel={event=>event.stopPropagation()} style={{...panelStyle,zIndex:12000,display:"flex",flexDirection:"column",minWidth:compact?0:340,minHeight:compact?0:480,maxWidth:compact?"none":"calc(100vw - 8px)",maxHeight:compact?"none":"calc(100vh - 8px)",background:"#ffffff",color:"#172033",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",boxShadow:"0 18px 50px rgba(15,23,42,.32)",border:"2px solid #d4a017",borderRadius:compact||maximized?0:14,overflow:"hidden",overscrollBehavior:"contain"}}>
    {imagePreview&&<div role="dialog" aria-modal="true" aria-label="그림 크게 보기" onClick={()=>setImagePreview(null)} style={{position:"fixed",inset:0,zIndex:2147483001,display:"flex",alignItems:"center",justifyContent:"center",padding:compact?12:28,background:"rgba(7,18,31,.88)"}}><div onClick={event=>event.stopPropagation()} style={{position:"relative",maxWidth:"96vw",maxHeight:"94vh",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><img src={imagePreview.src} alt={imagePreview.name||"확대 이미지"} style={{display:"block",maxWidth:"96vw",maxHeight:"calc(94vh - 54px)",objectFit:"contain",borderRadius:10,background:"white",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}/><div style={{display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:8}}><button type="button" onClick={()=>copyImageToClipboard(imagePreview.src)} style={{height:38,padding:"0 15px",border:"1px solid rgba(255,255,255,.45)",borderRadius:9,background:"white",color:"#172033",fontSize:13,fontWeight:900,cursor:"pointer"}}>📋 이미지 복사</button><a href={imagePreview.src} download={imagePreview.name||"NAMO_Talk_이미지.jpg"} style={{height:38,padding:"0 15px",display:"inline-flex",alignItems:"center",border:"1px solid rgba(255,255,255,.45)",borderRadius:9,background:"white",color:"#172033",fontSize:13,fontWeight:900,textDecoration:"none"}}>⬇ 저장·다운로드</a><button type="button" onClick={()=>setImagePreview(null)} style={{height:38,padding:"0 16px",border:"1px solid rgba(255,255,255,.45)",borderRadius:9,background:"#0f2740",color:"white",fontSize:13,fontWeight:900,cursor:"pointer"}}>닫기</button></div></div></div>}
    {profileOpen&&<div role="dialog" aria-modal="true" aria-label="프로필 수정" onClick={()=>setProfileOpen(false)} onWheel={event=>event.stopPropagation()} style={{position:"fixed",inset:0,zIndex:2147483000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(15,23,42,.52)",overscrollBehavior:"contain"}}><div onClick={event=>event.stopPropagation()} style={{width:"min(450px,100%)",maxHeight:"90vh",overflowY:"auto",overscrollBehavior:"contain",padding:20,boxSizing:"border-box",borderRadius:16,background:"white",boxShadow:"0 22px 60px rgba(15,23,42,.35)"}}><div style={{display:"flex",alignItems:"center"}}><strong style={{fontSize:19,color:"#172033"}}>프로필 수정</strong><button type="button" onClick={()=>setProfileOpen(false)} aria-label="프로필 수정 닫기" style={{marginLeft:"auto",width:32,height:32,border:0,borderRadius:8,background:"#eef2f6",fontSize:20,cursor:"pointer"}}>×</button></div><div style={{display:"flex",alignItems:"center",gap:14,marginTop:16,padding:14,border:"1px solid #e2e8f0",borderRadius:13,background:"#f8fafc"}}><NamoProfileAvatar profile={profileDraft} size={68} name={currentUser.name}/><div><strong style={{display:"block",fontSize:15,color:"#172033"}}>{currentUser.name}</strong><span style={{display:"block",marginTop:4,fontSize:12,color:"#64748b"}}>{currentUser.dept||"부서 미지정"} · 나모 물방울 프로필</span></div></div><div style={{marginTop:16,fontSize:13,fontWeight:900,color:"#334155"}}>캐릭터·표정 선택</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginTop:9}}>{NAMO_PROFILE_PRESETS.map(preset=><button key={preset.id} type="button" onClick={()=>setProfileDraft({type:"preset",value:preset.id})} title={preset.label} style={{height:82,padding:"5px 2px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,border:`2px solid ${profileDraft?.type==="preset"&&profileDraft.value===preset.id?"#0284c7":"#e2e8f0"}`,borderRadius:12,background:profileDraft?.type==="preset"&&profileDraft.value===preset.id?"#f0f9ff":"white",cursor:"pointer"}}><NamoProfileAvatar profile={{type:"preset",value:preset.id}} size={52}/><span style={{fontSize:10,color:"#475569",fontWeight:850}}>{preset.label}</span></button>)}</div><input ref={profileFileRef} type="file" accept="image/*" onChange={uploadProfileImage} style={{display:"none"}}/><button type="button" onClick={()=>profileFileRef.current?.click()} style={{width:"100%",height:40,marginTop:13,border:"1px solid #94a3b8",borderRadius:9,background:"white",color:"#334155",fontSize:13,fontWeight:900,cursor:"pointer"}}>🖼 내 그림 업로드</button><div style={{display:"flex",gap:8,marginTop:16}}><button type="button" onClick={()=>setProfileDraft({type:"preset",value:"drop-blue"})} style={{height:39,padding:"0 13px",border:"1px solid #cbd5e1",borderRadius:9,background:"#f8fafc",color:"#475569",fontWeight:850,cursor:"pointer"}}>기본 이미지</button><button type="button" onClick={()=>setProfileOpen(false)} style={{height:39,marginLeft:"auto",padding:"0 15px",border:"1px solid #cbd5e1",borderRadius:9,background:"white",fontWeight:850,cursor:"pointer"}}>취소</button><button type="button" onClick={submitProfile} disabled={savingProfile} style={{height:39,padding:"0 17px",border:0,borderRadius:9,background:"#0f2740",color:"white",fontWeight:900,cursor:"pointer"}}>{savingProfile?"저장 중":"저장"}</button></div></div></div>}
    {!compact&&!maximized&&[
      ["t","n-resize",{top:0,left:10,right:10,height:7}],["b","s-resize",{bottom:0,left:10,right:10,height:7}],
      ["l","w-resize",{left:0,top:10,bottom:10,width:7}],["r","e-resize",{right:0,top:10,bottom:10,width:7}],
      ["tl","nw-resize",{top:0,left:0,width:12,height:12}],["tr","ne-resize",{top:0,right:0,width:12,height:12}],
      ["bl","sw-resize",{bottom:0,left:0,width:12,height:12}],["br","se-resize",{bottom:0,right:0,width:12,height:12}]
    ].map(([edges,cursor,style])=><div key={edges} onPointerDown={event=>startResize(event,edges)} style={{position:"absolute",zIndex:200,cursor,...style}}/>)}
    {toast&&<div style={{position:"absolute",right:12,top:66,zIndex:50,background:"#172033",color:"white",padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:800,boxShadow:"0 8px 20px rgba(15,23,42,.25)"}}>{toast}</div>}
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
      <input value={statusMessage} maxLength={60} onChange={event=>setStatusMessage(event.target.value)} onBlur={saveStatusMessage} onKeyDown={event=>{if(event.key==="Enter")event.currentTarget.blur();}} placeholder="상태 메시지 (Enter 또는 바깥 클릭 시 저장)" style={{height:32,flex:1,minWidth:0,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:8,padding:"0 9px",fontSize:12,color:"#172033"}}/>
      <button type="button" onClick={openProfileEditor} style={{height:32,padding:compact?"0 9px":"0 11px",border:"1px solid #94a3b8",borderRadius:8,background:"white",color:"#334155",fontSize:12,fontWeight:900,cursor:"pointer"}}>프로필</button>
    </div>}

    {mode==="attendance"&&!chatRoomOpen?<AttendancePanel currentUser={currentUser} users={users}/>:<div style={{flex:"1 1 auto",minHeight:0,display:"flex",width:"100%",overflow:"hidden",padding:compact?8:10,boxSizing:"border-box",background:"#ffffff"}}>
      <div style={{display:mode==="employees"&&!chatRoomOpen&&!messageListOpen?"block":"none",width:"100%",flex:"1 1 auto",background:"white",border:"1px solid #cbd5e1",borderRadius:compact?10:12,boxShadow:"0 2px 8px rgba(15,39,64,.08)",overflowY:"auto"}}>
        <div style={{padding:9}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="채널·직원 검색" style={{width:"100%",height:38,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:9,padding:"0 10px",fontSize:14,color:"#1e293b"}}/></div>
        <div style={{padding:7}}>
          <button type="button" onClick={()=>openChatRoom(selfRoom.id,"employees")} style={{width:"100%",display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"11px 10px",border:"1px solid #dbe3ea",borderRadius:11,background:"#f8fafc",textAlign:"left",cursor:"pointer"}}>
            <span style={{position:"relative",display:"inline-flex"}}><NamoProfileAvatar profile={profiles[currentUser.name]} size={compact?34:38} name={currentUser.name}/><i style={{position:"absolute",right:-1,bottom:-1,width:11,height:11,borderRadius:"50%",background:NAMO_TALK_STATUS[presence[currentUser.name]?.status||myStatus]?.color,border:"2px solid white"}}/></span>
            <span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:compact?13:14,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name} <small style={{color:"#64748b"}}>(나)</small></strong><span style={{display:"block",marginTop:3,fontSize:compact?10:11,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{presence[currentUser.name]?.statusMessage||savedStatusMessage||NAMO_TALK_STATUS[presence[currentUser.name]?.status||myStatus]?.label}</span></span><span style={{fontSize:16,color:"#94a3b8"}}>›</span>
          </button>
          {noticeRooms.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={roomId=>openChatRoom(roomId,"employees")} messages={messages} reads={reads} currentUser={currentUser}/>)}
          <button type="button" onClick={toggleChannels} aria-expanded={channelsOpen} style={{width:"100%",height:34,marginTop:9,padding:"0 7px",display:"flex",alignItems:"center",border:0,borderRadius:8,background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:900,cursor:"pointer",textAlign:"left"}}><span style={{width:18,fontSize:13}}>{channelsOpen?"▾":"▸"}</span>업무 채널<span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{departmentRooms.length}</span></button>
          {channelsOpen&&departmentRooms.map(item=><RoomButton key={item.id} item={item} activeRoom={activeRoom} setActiveRoom={roomId=>openChatRoom(roomId,"employees")} messages={messages} reads={reads} currentUser={currentUser}/>)}
          <button type="button" onClick={toggleDirects} aria-expanded={directsOpen} style={{width:"100%",height:34,marginTop:9,padding:"0 7px",display:"flex",alignItems:"center",border:0,borderRadius:8,background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:900,cursor:"pointer",textAlign:"left"}}><span style={{width:18,fontSize:13}}>{directsOpen?"▾":"▸"}</span>개인 대화<span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{filteredDirects.length}</span></button>
          {directsOpen&&filteredDirects.map(item=><RoomButton key={item.id} item={item} profile={profiles[item.presenceName||item.name]} presence={presence[item.presenceName||item.name]} activeRoom={activeRoom} setActiveRoom={roomId=>openChatRoom(roomId,"employees")} messages={messages} reads={reads} currentUser={currentUser}/>)}
        </div>
      </div>

      <div style={{display:mode==="conversations"&&!chatRoomOpen?"block":"none",width:"100%",flex:"1 1 auto",background:"white",border:"1px solid #cbd5e1",borderRadius:compact?10:12,overflowY:"auto",padding:8}}>
        {conversationRooms.length===0?<div style={{padding:50,textAlign:"center",color:"#64748b"}}><NamoDrop size={compact?46:52}/><strong style={{display:"block",marginTop:12,fontSize:compact?13:14,color:"#334155"}}>아직 대화방이 없습니다.</strong></div>:conversationRooms.map(item=>{const latest=[...(messages[item.id]||[])].sort((a,b)=>Number(b.createdAt)-Number(a.createdAt))[0];const unread=(messages[item.id]||[]).filter(message=>message.sender!==currentUser.name&&(message.createdAt||message.id)>(reads[item.id]||0)).length;return <div key={item.id} style={{display:"flex",alignItems:"center",borderBottom:"1px solid #e2e8f0",background:"white"}}><button type="button" onClick={()=>openChatRoom(item.id,"conversations")} style={{minWidth:0,flex:1,display:"flex",alignItems:"center",gap:compact?8:10,padding:compact?"11px 7px":"13px 9px",border:0,background:"transparent",textAlign:"left",cursor:"pointer"}}>{item.type==="direct"?<NamoProfileAvatar profile={profiles[item.presenceName||item.name]} size={compact?36:42} name={item.name}/>:<span style={{width:compact?36:42,height:compact?36:42,flex:`0 0 ${compact?36:42}px`,display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:11,background:"#e8eef3",color:"#334155",fontSize:compact?13:14,fontWeight:950}}>{item.name?.[0]||"?"}</span>}<span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:compact?13:14,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",marginTop:4,fontSize:compact?10:12,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{latest?.deleted?"삭제된 메시지입니다.":latest?.kind==="sticker"?`나모 이모티콘 · ${latest.text}`:latest?.fileName||latest?.text}</span></span><span style={{alignSelf:"flex-start",paddingTop:2,fontSize:9,color:"#94a3b8",whiteSpace:"nowrap"}}>{latest?.time||""}</span>{unread>0&&<span style={{minWidth:20,height:20,padding:"0 5px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:10,background:"#ef4444",color:"white",fontSize:10,fontWeight:950}}>{unread>99?"99+":unread}</span>}</button><button type="button" onClick={()=>hideConversation(item)} title="내 대화목록에서 삭제" aria-label={`${item.name} 대화방 삭제`} style={{width:compact?34:38,height:38,flex:`0 0 ${compact?34:38}px`,marginRight:4,border:0,borderRadius:8,background:"transparent",color:"#94a3b8",fontSize:16,cursor:"pointer"}}>×</button></div>;})}
      </div>

      <div style={{flex:"1 1 auto",minWidth:0,minHeight:0,display:chatRoomOpen?"flex":"none",flexDirection:"column",background:"#ffffff",border:"1px solid #cbd5e1",borderRadius:compact?10:12,boxShadow:"0 2px 8px rgba(15,39,64,.08)",overflow:"hidden",position:"relative"}}>
        <div style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"center",gap:10,padding:"0 14px",background:"white",borderBottom:"1px solid #cbd5e1"}}>
          <button type="button" onClick={()=>{setEmojiOpen(false);setChatRoomOpen(false);setMode(chatReturnMode);}} aria-label="대화목록으로 돌아가기" title="대화목록으로 돌아가기" style={{width:compact?56:66,height:34,flex:`0 0 ${compact?56:66}px`,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:3,border:"1px solid #284b6c",borderRadius:9,background:"#0f2740",color:"white",fontSize:compact?12:13,fontWeight:900,cursor:"pointer",boxShadow:"0 2px 5px rgba(15,39,64,.18)"}}><span aria-hidden="true" style={{fontSize:18,lineHeight:1}}>‹</span>뒤로</button>
          {room?.type==="direct"&&<NamoProfileAvatar profile={profiles[room.presenceName||room.name]} size={30} name={room.name}/>}<div style={{minWidth:0,flex:"1 1 auto"}}><div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}><strong style={{flex:"0 1 auto",minWidth:0,fontSize:compact?15:17,fontWeight:950,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{room?.name||"대화"}</strong>{pinnedPreview&&<button type="button" onClick={()=>document.getElementById(`namo-message-${pinnedPreview.id}`)?.scrollIntoView({behavior:"smooth",block:"center"})} title={pinnedPreview.fileName||pinnedPreview.text||"고정 메시지"} style={{maxWidth:compact?105:190,minWidth:0,height:25,padding:"0 8px",display:"inline-flex",alignItems:"center",border:"1px solid #f3d38a",borderRadius:8,background:"#fffdf7",color:"#8a5b00",fontSize:compact?10:11,fontWeight:850,cursor:"pointer",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📌 <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{pinnedPreview.fileName||pinnedPreview.text}</span></button>}</div><div style={{fontSize:compact?10:12,color:"#64748b",fontWeight:600,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{room?.subtitle||""}</div></div>
          <input value={messageSearch} onChange={event=>setMessageSearch(event.target.value)} placeholder="메시지 검색" style={{width:compact?82:145,height:32,flex:`0 0 ${compact?82:145}px`,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:8,padding:"0 8px",fontSize:compact?10:12,color:"#172033",outline:"none"}}/>
        </div>
        <div ref={scrollRef} onScroll={event=>{const element=event.currentTarget;stickToBottomRef.current=element.scrollHeight-element.scrollTop-element.clientHeight<=60;}} style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",overscrollBehavior:"contain",padding:15}}>
          {roomMessages.length===0&&<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"#64748b"}}><div><NamoDrop size={58}/><strong style={{display:"block",color:"#334155",fontSize:15,marginTop:14}}>아직 대화 내용이 없습니다.</strong></div></div>}
          {roomMessages.length>0&&visibleMessages.length===0&&<div style={{padding:30,textAlign:"center",color:"#64748b",fontSize:13,fontWeight:700}}>검색 결과가 없습니다.</div>}
          {visibleMessages.map(msg=>{const mine=msg.sender===currentUser.name,stickerMessage=msg.kind==="sticker";const info=mine?receiptInfoFor(msg):null;const label=info?.read.length?"읽음":"전송됨";return <div id={`namo-message-${msg.id}`} key={msg.id} style={{marginBottom:14,textAlign:mine?"right":"left"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:mine?"flex-end":"flex-start",gap:5,marginBottom:5,fontSize:compact?10:12,color:"#475569",fontWeight:700}}>{!mine&&<NamoProfileAvatar profile={profiles[msg.sender]} size={compact?21:23} name={msg.sender}/>}<span>{msg.pinned?"📌 ":""}{msg.sender} · {msg.time||""}{msg.edited?" · 수정됨":""}</span>{mine&&<NamoProfileAvatar profile={profiles[msg.sender]} size={compact?21:23} name={msg.sender}/>}</div>
            <div style={{display:"inline-block",maxWidth:compact?"90%":"84%",background:stickerMessage?"transparent":msg.pinned?"#fffdf7":mine?"#0284c7":"white",color:stickerMessage?"#172033":msg.pinned?"#3f3a2d":mine?"white":"#172033",border:stickerMessage?"none":msg.pinned?"1px solid #f3d38a":"1px solid transparent",borderRadius:14,padding:stickerMessage?0:msg.kind==="emoticon"?"10px 14px":"10px 12px",fontSize:msg.kind==="emoticon"?(compact?26:30):(compact?13:15),lineHeight:1.55,boxShadow:stickerMessage?"none":msg.pinned?"0 2px 7px rgba(180,130,20,.12)":"0 1px 3px rgba(15,23,42,.1)",wordBreak:"break-word",opacity:msg.deleted?.72:1}}>
              {msg.replyToId&&<div style={{marginBottom:7,padding:"6px 8px",borderRadius:7,background:stickerMessage?"#f8fcff":msg.pinned?"#fff7df":mine?"rgba(255,255,255,.16)":"#f1f5f9",border:`1px solid ${stickerMessage?"#bae6fd":"transparent"}`,borderLeft:`3px solid ${msg.pinned?"#e7b94f":mine?"#bae6fd":"#38bdf8"}`,fontSize:11,lineHeight:1.35}}><strong>{msg.replySender}</strong><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{msg.replyText}</div></div>}
              {msg.kind==="image"?<div><button type="button" onClick={()=>setImagePreview({src:msg.fileData,name:msg.fileName})} title="그림 크게 보기" style={{display:"block",maxWidth:"100%",padding:0,border:0,borderRadius:8,background:"transparent",cursor:"zoom-in"}}><img src={msg.fileData} alt={msg.fileName||"첨부 이미지"} style={{display:"block",maxWidth:"100%",maxHeight:220,borderRadius:8}}/></button><div style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",flexWrap:"wrap",gap:6,marginTop:8}}><button type="button" onClick={()=>setImagePreview({src:msg.fileData,name:msg.fileName})} style={{height:28,padding:"0 9px",display:"inline-flex",alignItems:"center",border:`1px solid ${msg.pinned?"#e7c76b":mine?"rgba(255,255,255,.55)":"#cbd5e1"}`,borderRadius:7,background:msg.pinned?"white":mine?"rgba(255,255,255,.14)":"#f8fafc",color:"inherit",fontSize:11,fontWeight:850,cursor:"pointer"}}>🔍 크게 보기</button><button type="button" onClick={()=>copyImageToClipboard(msg.fileData)} style={{height:28,padding:"0 9px",display:"inline-flex",alignItems:"center",border:`1px solid ${msg.pinned?"#e7c76b":mine?"rgba(255,255,255,.55)":"#cbd5e1"}`,borderRadius:7,background:msg.pinned?"white":mine?"rgba(255,255,255,.14)":"#f8fafc",color:"inherit",fontSize:11,fontWeight:850,cursor:"pointer"}}>📋 복사</button><a href={msg.fileData} download={msg.fileName||"NAMO_Talk_이미지.jpg"} style={{height:28,padding:"0 9px",display:"inline-flex",alignItems:"center",border:`1px solid ${msg.pinned?"#e7c76b":mine?"rgba(255,255,255,.55)":"#cbd5e1"}`,borderRadius:7,background:msg.pinned?"white":mine?"rgba(255,255,255,.14)":"#f8fafc",color:"inherit",fontSize:11,fontWeight:850,textDecoration:"none"}}>⬇ 저장·다운로드</a></div></div>:msg.kind==="file"?<div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}><a href={msg.fileData} download={msg.fileName||"NAMO_Talk_파일"} title="파일 저장" style={{minWidth:0,flex:1,color:"inherit",fontWeight:850,textDecoration:"underline",textUnderlineOffset:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {msg.fileName||msg.text}</a><a href={msg.fileData} download={msg.fileName||"NAMO_Talk_파일"} aria-label={`${msg.fileName||"파일"} 다운로드`} style={{height:29,padding:"0 9px",flex:"0 0 auto",display:"inline-flex",alignItems:"center",border:`1px solid ${msg.pinned?"#e7c76b":mine?"rgba(255,255,255,.55)":"#cbd5e1"}`,borderRadius:7,background:msg.pinned?"white":mine?"rgba(255,255,255,.14)":"#f8fafc",color:"inherit",fontSize:11,fontWeight:900,textDecoration:"none"}}>⬇ 다운로드</a></div>:msg.kind==="sticker"?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}><NamoSticker sticker={NAMO_STICKERS.find(sticker=>sticker.id===msg.fileName)} width={compact?125:145}/>{msg.text&&msg.text!==NAMO_STICKERS.find(sticker=>sticker.id===msg.fileName)?.label&&<span style={{fontSize:compact?12:14}}>{msg.text}</span>}</div>:msg.kind==="emoticon"&&String(msg.text||"").startsWith("💧")?<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:2,lineHeight:1}}><span style={{fontSize:compact?11:12,lineHeight:1}}>💧</span><span style={{fontSize:compact?26:30,lineHeight:1}}>{String(msg.text).replace(/^💧/,"")}</span></span>:msg.text}
            </div>
            {!msg.deleted&&<div style={{marginTop:3}}><button type="button" onClick={()=>setReplyingTo(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:"#64748b",fontSize:11,cursor:"pointer"}}>답장</button><button type="button" onClick={()=>togglePinMessage(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:msg.pinned?"#d97706":"#64748b",fontSize:11,cursor:"pointer"}}>{msg.pinned?"고정 해제":"고정"}</button>{mine&&<><button type="button" onClick={()=>editMessage(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:"#64748b",fontSize:11,cursor:"pointer"}}>수정</button><button type="button" onClick={()=>removeMessage(msg)} style={{border:0,background:"transparent",padding:"2px 4px",color:"#dc2626",fontSize:11,cursor:"pointer"}}>삭제</button></>}</div>}
            {mine&&<div><span style={{display:"inline-block",padding:"2px 2px 0",color:info.read.length?"#0284c7":"#64748b",fontSize:11,fontWeight:850}}>{label}</span></div>}
          </div>})}
        </div>

        {emojiOpen&&<div style={{position:"absolute",right:10,bottom:84,width:`min(${compact?"350px":"400px"},calc(100% - 20px))`,maxHeight:"calc(100% - 96px)",overflowY:"auto",boxSizing:"border-box",padding:compact?"16px 10px 12px":"20px 14px 14px",background:"white",border:"1px solid #cbd5e1",borderRadius:14,boxShadow:"0 14px 35px rgba(15,23,42,.2)",zIndex:20}}><div style={{display:"flex",alignItems:"center",minHeight:34,marginBottom:9,overflow:"visible"}}><strong style={{display:"block",fontSize:compact?15:17,lineHeight:1.7,padding:"3px 0 1px",color:"#172033",overflow:"visible"}}>나모 이모티콘</strong><button onClick={()=>setEmojiOpen(false)} style={{marginLeft:"auto",width:30,height:30,border:"1px solid #e2e8f0",borderRadius:8,background:"white",fontSize:20,lineHeight:1,cursor:"pointer"}}>×</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginBottom:10}}>{NAMO_STICKER_CATEGORIES.map(category=><button key={category.id} type="button" onClick={()=>{setStickerCategory(category.id);setEmojiPage(0);}} style={{height:34,minWidth:0,border:`1px solid ${stickerCategory===category.id?"#0284c7":"#dbe3ea"}`,borderRadius:8,background:stickerCategory===category.id?"#e0f2fe":"#f8fafc",color:stickerCategory===category.id?"#0369a1":"#334155",fontSize:compact?11:12,fontWeight:900,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{category.number} {category.title}</button>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:compact?5:8}}>{categoryStickers.slice(emojiPage*NAMO_EMOJI_PAGE_SIZE,emojiPage*NAMO_EMOJI_PAGE_SIZE+NAMO_EMOJI_PAGE_SIZE).map(sticker=><button key={sticker.id} onClick={()=>selectSticker(sticker)} title={sticker.label} style={{height:compact?94:108,minWidth:0,padding:"5px 2px 6px",display:"inline-flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:2,overflow:"hidden",border:`2px solid ${selectedSticker?.id===sticker.id?"#0284c7":"#e2e8f0"}`,borderRadius:10,background:"#ffffff",cursor:"pointer"}}><NamoSticker sticker={sticker} width={compact?57:70} withLabel={false}/><span style={{width:"100%",fontSize:compact?10:11,color:"#172033",fontWeight:900,lineHeight:1.15,textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sticker.label}</span></button>)}</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginTop:12}}><button type="button" onClick={()=>setEmojiPage(page=>Math.max(0,page-1))} disabled={emojiPage===0} aria-label="이전 이모티콘" style={{width:42,height:32,border:"1px solid #cbd5e1",borderRadius:8,background:"white",color:emojiPage===0?"#cbd5e1":"#334155",fontSize:14,cursor:emojiPage===0?"default":"pointer"}}>◀</button><span style={{fontSize:13,color:"#475569",fontWeight:900}}>{emojiPage+1} / {Math.ceil(categoryStickers.length/NAMO_EMOJI_PAGE_SIZE)}</span><button type="button" onClick={()=>setEmojiPage(page=>Math.min(Math.ceil(categoryStickers.length/NAMO_EMOJI_PAGE_SIZE)-1,page+1))} disabled={emojiPage>=Math.ceil(categoryStickers.length/NAMO_EMOJI_PAGE_SIZE)-1} aria-label="다음 이모티콘" style={{width:42,height:32,border:"1px solid #cbd5e1",borderRadius:8,background:"white",color:emojiPage>=Math.ceil(categoryStickers.length/NAMO_EMOJI_PAGE_SIZE)-1?"#cbd5e1":"#334155",fontSize:14,cursor:emojiPage>=Math.ceil(categoryStickers.length/NAMO_EMOJI_PAGE_SIZE)-1?"default":"pointer"}}>▶</button></div></div>}
        <div style={{flex:"0 0 auto",background:"white",padding:10,borderTop:"1px solid #cbd5e1"}}>
          {replyingTo&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"9px 10px",border:"1px solid #bae6fd",borderLeft:"4px solid #38bdf8",borderRadius:9,background:"#f8fcff",boxShadow:"0 2px 7px rgba(56,189,248,.1)",fontSize:compact?11:12,color:"#334155"}}><span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><strong style={{color:"#0369a1"}}>{replyingTo.sender}</strong>에게 답장 · {replyingTo.text||replyingTo.fileName}</span><button type="button" onClick={()=>setReplyingTo(null)} aria-label="답장 취소" style={{marginLeft:"auto",width:24,height:24,flex:"0 0 24px",border:"1px solid #dbeafe",borderRadius:7,background:"white",color:"#64748b",fontSize:16,lineHeight:1,cursor:"pointer"}}>×</button></div>}
          {selectedSticker&&<div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8,padding:"6px 9px",border:"1px solid #dbe3ea",borderRadius:9,background:"#f8fafc"}}><NamoSticker sticker={selectedSticker} width={48}/><strong style={{fontSize:12,color:"#334155"}}>{selectedSticker.label}</strong><button type="button" onClick={()=>setSelectedSticker(null)} aria-label="선택한 이모티콘 제거" style={{marginLeft:"auto",width:25,height:25,border:"1px solid #dbe3ea",borderRadius:7,background:"white",fontSize:16,cursor:"pointer"}}>×</button></div>}
          <input ref={fileRef} type="file" onChange={handleFile} style={{display:"none"}}/>
          <div style={{display:"flex",alignItems:"flex-end",gap:7}}>
            <textarea ref={composerRef} value={text} onChange={e=>setText(e.target.value)} onPaste={pasteComposerImage} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지 입력 · 그림은 Ctrl+V로 붙여넣기" style={{flex:"1 1 auto",minWidth:0,height:60,boxSizing:"border-box",resize:"none",border:"1px solid #94a3b8",borderRadius:10,padding:compact?"9px 8px":"10px 11px",fontFamily:"inherit",fontSize:compact?13:15,color:"#172033",outline:"none"}}/>
            <button type="button" title="파일 첨부" aria-label="파일 첨부" onClick={()=>fileRef.current?.click()} disabled={sending} style={{height:compact?42:46,width:compact?42:"auto",flex:"0 0 auto",padding:compact?0:"0 12px",border:"1px solid #94a3b8",borderRadius:9,background:"white",color:"#334155",fontSize:14,fontWeight:900,cursor:"pointer"}}>{compact?"📎":"📎 파일"}</button>
            <button type="button" title="이모티콘" aria-label="이모티콘" onClick={()=>setEmojiOpen(v=>!v)} disabled={sending} style={{height:compact?42:46,width:compact?42:"auto",flex:"0 0 auto",padding:compact?0:"0 11px",border:"1px solid #94a3b8",borderRadius:9,background:emojiOpen?"#ede9fe":"white",color:"#334155",fontSize:14,fontWeight:900,cursor:"pointer"}}>{compact?"😊":"😊 이모티콘"}</button>
            <button type="button" onClick={sendMessage} disabled={(!text.trim()&&!selectedSticker)||sending} style={{width:compact?52:64,height:60,flex:`0 0 ${compact?52:64}px`,background:(text.trim()||selectedSticker)&&!sending?"#0284c7":"#bae6fd",color:"white",border:0,borderRadius:10,fontSize:compact?13:15,fontWeight:950,cursor:(text.trim()||selectedSticker)&&!sending?"pointer":"default"}}>{sending?"…":"전송"}</button>
          </div>
        </div>
      </div>
    </div>}
    {!chatRoomOpen&&<nav aria-label="NAMO Talk 하단 메뉴" style={{height:58,flex:"0 0 58px",display:"flex",alignItems:"stretch",background:"#0f2740",borderTop:"1px solid #28435f"}}>
      {[["employees","♙","직원"],["conversations","▣","대화"],["attendance","◷","근태관리"]].map(([id,icon,label])=><button key={id} type="button" onClick={()=>{setMode(id);setMessageListOpen(false);}} style={{position:"relative",flex:1,border:0,borderTop:`3px solid ${mode===id?"#d4a017":"transparent"}`,background:mode===id?"rgba(212,160,23,.12)":"transparent",color:mode===id?"#ffe69a":"#cbd5e1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,fontSize:11,fontWeight:900,cursor:"pointer"}}><span aria-hidden="true" style={{fontSize:18,lineHeight:1}}>{icon}</span><span>{label}</span>{id==="conversations"&&unreadCount>0&&<span style={{position:"absolute",top:5,left:"calc(50% + 8px)",minWidth:18,height:18,padding:"0 5px",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:"#ef4444",color:"white",fontSize:10,border:"2px solid #0f2740"}}>{unreadCount>99?"99+":unreadCount}</span>}</button>)}
    </nav>}
  </section>;
}

function RoomButton({item,profile,presence,activeRoom,setActiveRoom,messages={},reads={},currentUser={}}){
  const compact=window.innerWidth<=480;
  const active=activeRoom===item.id;
  const unread=(messages[item.id]||[]).filter(m=>m.sender!==currentUser.name&&(m.createdAt||m.id)>(reads[item.id]||0)).length;
  const status=NAMO_TALK_STATUS[presence?.status||"offline"];
  const subtitle=item.type==="direct"?(presence?.statusMessage||`${item.subtitle} · ${status.label}`):item.subtitle;
  return <button type="button" onClick={()=>setActiveRoom(item.id)} style={{width:"100%",border:0,borderRadius:10,background:active?"#dbeafe":"transparent",display:"flex",alignItems:"center",gap:compact?7:8,padding:compact?"8px 7px":"9px 8px",cursor:"pointer",textAlign:"left",marginBottom:3}}>{item.type==="direct"?<span style={{position:"relative",display:"inline-flex"}}><NamoProfileAvatar profile={profile} size={compact?30:32} name={item.name}/><i title={status.label} style={{position:"absolute",right:-1,bottom:-1,width:9,height:9,borderRadius:"50%",background:status.color,border:"2px solid white"}}/></span>:<span style={{width:compact?30:32,height:compact?30:32,flex:`0 0 ${compact?30:32}px`,borderRadius:9,background:active?"#0284c7":"#e8eef3",color:active?"white":"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?13:15,fontWeight:950}}>{item.name?.[0]||"?"}</span>}<span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:compact?13:14,color:"#172033",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</strong><span style={{display:"block",fontSize:compact?10:11,color:"#64748b",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>{subtitle}</span></span>{unread>0&&<span style={{minWidth:20,height:20,padding:"0 5px",borderRadius:10,background:"#ef4444",color:"white",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>{unread>99?"99+":unread}</span>}</button>;
}
