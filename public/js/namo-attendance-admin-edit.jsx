/* NAMO Talk attendance, fieldwork and leave workflow */
const NAMO_FIELDWORK_KEY="qmes-namo-fieldwork-v1";
const NAMO_LEAVE_KEY="qmes-namo-leave-v1";

function namoLoad(key){try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[];}catch(e){return[];}}
function namoSave(key,value){localStorage.setItem(key,JSON.stringify(value));}
function namoIsDirector(user){const p=String(user?.position||user?.rank||"").replace(/\s/g,"");return p.includes("이사")||p.includes("상무")||p.includes("전무")||p.includes("대표")||user?.role==="admin"||user?.name==="관리자";}
function namoUserKey(user){return String(user?.uid||user?.id||user?.name||"");}
function namoSameUser(row,user){return String(row.userKey||row.uid||row.name)===namoUserKey(user)||row.name===user?.name;}
function namoDateTime(){return new Date().toLocaleString("ko-KR",{hour12:false});}
function namoEscape(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}

function AttendancePanel({currentUser,users}){
  const [tab,setTab]=useState("attendance");
  const [records,setRecords]=useState(loadAttendance);
  const [fieldworks,setFieldworks]=useState(()=>namoLoad(NAMO_FIELDWORK_KEY));
  const [leaves,setLeaves]=useState(()=>namoLoad(NAMO_LEAVE_KEY));
  const [now,setNow]=useState(new Date());
  const [notice,setNotice]=useState("");
  const [fieldForm,setFieldForm]=useState({place:"",purpose:"",returnPlan:"",companion:"",note:""});
  const [leaveForm,setLeaveForm]=useState({type:"연차",date:attendanceDate(),reason:"",handover:""});
  const [rejecting,setRejecting]=useState(null);
  const [rejectReason,setRejectReason]=useState("");
  const isAdmin=currentUser.role==="admin"||currentUser.name==="관리자";
  const isDirector=namoIsDirector(currentUser);
  const today=attendanceDate();
  const mine=records.find(r=>r.date===today&&namoSameUser(r,currentUser));
  const activeField=fieldworks.find(r=>namoSameUser(r,currentUser)&&r.status==="외근중");

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  const flash=text=>{setNotice(text);setTimeout(()=>setNotice(""),2200);};
  const commitAttendance=(next,message)=>{saveAttendance(next);setRecords(next);flash(message);};
  const commitFieldworks=(next,message)=>{namoSave(NAMO_FIELDWORK_KEY,next);setFieldworks(next);flash(message);};
  const commitLeaves=(next,message)=>{namoSave(NAMO_LEAVE_KEY,next);setLeaves(next);flash(message);};

  const clockIn=()=>{
    if(mine?.clockIn)return flash(`이미 ${mine.clockIn}에 출근 처리되었습니다.`);
    const row={date:today,userKey:namoUserKey(currentUser),uid:currentUser.uid||currentUser.id||"",name:currentUser.name||"관리자",dept:currentUser.dept||currentUser.department||"관리부",position:currentUser.position||currentUser.rank||"",clockIn:attendanceTime(),clockOut:"",workStatus:"근무",note:"",editHistory:[]};
    commitAttendance([...records,row],`${row.clockIn} 출근 처리되었습니다.`);
  };
  const clockOut=()=>{
    if(!mine?.clockIn)return flash("먼저 출근 처리를 해주세요.");
    if(mine.clockOut)return flash(`이미 ${mine.clockOut}에 퇴근 처리되었습니다.`);
    const out=attendanceTime();
    commitAttendance(records.map(r=>r===mine?{...r,clockOut:out}:r),`${out} 퇴근 처리되었습니다.`);
  };

  const startFieldwork=()=>{
    if(activeField)return flash("이미 외근 중입니다.");
    if(!fieldForm.place.trim()||!fieldForm.purpose.trim())return flash("방문처와 외근 목적을 입력해 주세요.");
    const row={id:`FW-${Date.now()}`,userKey:namoUserKey(currentUser),name:currentUser.name,dept:currentUser.dept||"",position:currentUser.position||"",date:today,startTime:attendanceTime(),returnTime:"",status:"외근중",...fieldForm,createdAt:namoDateTime()};
    commitFieldworks([row,...fieldworks],`${row.startTime} 외근을 시작했습니다.`);
    setFieldForm({place:"",purpose:"",returnPlan:"",companion:"",note:""});
  };
  const finishFieldwork=()=>{
    if(!activeField)return flash("진행 중인 외근이 없습니다.");
    const time=attendanceTime();
    commitFieldworks(fieldworks.map(r=>r.id===activeField.id?{...r,returnTime:time,status:"복귀완료"}:r),`${time} 외근 복귀 처리되었습니다.`);
  };

  const submitLeave=()=>{
    if(!leaveForm.date)return flash("휴가 사용일을 선택해 주세요.");
    if(!leaveForm.reason.trim())return flash("휴가 사유를 입력해 주세요.");
    const row={id:`LV-${Date.now()}`,userKey:namoUserKey(currentUser),name:currentUser.name,dept:currentUser.dept||"",position:currentUser.position||"",type:leaveForm.type,date:leaveForm.date,reason:leaveForm.reason.trim(),handover:leaveForm.handover.trim(),status:"검토대기",reviewer:"",reviewedAt:"",rejectReason:"",appliedAt:namoDateTime()};
    commitLeaves([row,...leaves],"휴가 신청이 완료되었습니다. 이사 검토 대기입니다.");
    setLeaveForm({type:"연차",date:attendanceDate(),reason:"",handover:""});
  };
  const approveLeave=row=>{
    if(!isDirector)return;
    const next=leaves.map(item=>item.id===row.id?{...item,status:"승인완료",reviewer:currentUser.name,reviewerPosition:currentUser.position||"이사",reviewedAt:namoDateTime(),rejectReason:""}:item);
    commitLeaves(next,"휴가 신청을 승인했습니다.");
  };
  const rejectLeave=()=>{
    if(!isDirector||!rejecting)return;
    if(!rejectReason.trim())return flash("반려 사유를 입력해 주세요.");
    const next=leaves.map(item=>item.id===rejecting.id?{...item,status:"반려",reviewer:currentUser.name,reviewerPosition:currentUser.position||"이사",reviewedAt:namoDateTime(),rejectReason:rejectReason.trim()}:item);
    commitLeaves(next,"휴가 신청을 반려했습니다.");
    setRejecting(null);setRejectReason("");
  };
  const cancelLeave=row=>{
    if(row.status==="승인완료")return flash("승인 완료된 휴가는 취소할 수 없습니다.");
    if(!window.confirm("이 휴가 신청을 취소하시겠습니까?"))return;
    commitLeaves(leaves.filter(item=>item.id!==row.id),"휴가 신청을 취소했습니다.");
  };

  const printLeave=row=>{
    const popup=window.open("","_blank","width=900,height=1050");
    if(!popup)return flash("팝업 차단을 해제해 주세요.");
    const status=row.status==="승인완료"?"승인완료":row.status;
    popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>휴가신청서_${namoEscape(row.name)}_${namoEscape(row.date)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,'Malgun Gothic',sans-serif;color:#111;margin:0}.sheet{border:2px solid #111;padding:26px}.title{text-align:center;font-size:28px;font-weight:800;margin:4px 0 28px}.company{text-align:right;font-weight:700;margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{border:1px solid #333;padding:11px;text-align:left}th{width:18%;background:#f2f2f2}.approval{margin-top:28px}.approval td{text-align:center;height:85px}.foot{margin-top:24px;font-size:12px;color:#555;text-align:right}@media print{button{display:none}}</style></head><body><div class="sheet"><div class="company">나모케미칼</div><div class="title">휴 가 신 청 서</div><table><tr><th>신청자</th><td>${namoEscape(row.name)}</td><th>부서/직급</th><td>${namoEscape(row.dept)} / ${namoEscape(row.position)}</td></tr><tr><th>휴가 구분</th><td>${namoEscape(row.type)}</td><th>사용일</th><td>${namoEscape(row.date)}</td></tr><tr><th>신청 사유</th><td colspan="3">${namoEscape(row.reason)}</td></tr><tr><th>업무 인계자</th><td colspan="3">${namoEscape(row.handover||"-")}</td></tr><tr><th>신청일시</th><td>${namoEscape(row.appliedAt)}</td><th>상태</th><td>${namoEscape(status)}</td></tr>${row.rejectReason?`<tr><th>반려 사유</th><td colspan="3">${namoEscape(row.rejectReason)}</td></tr>`:""}</table><table class="approval"><tr><th>신청</th><th>검토·승인</th></tr><tr><td>${namoEscape(row.name)}<br>${namoEscape(row.appliedAt)}</td><td>${row.reviewer?namoEscape(row.reviewer)+" "+namoEscape(row.reviewerPosition||"이사")+"<br>"+namoEscape(row.reviewedAt):"검토 대기"}</td></tr></table><div class="foot">문서번호: ${namoEscape(row.id)}</div></div><script>window.onload=function(){setTimeout(function(){window.print();},200)}<\/script></body></html>`);
    popup.document.close();
  };

  const visibleFieldworks=(isAdmin||isDirector)?fieldworks:fieldworks.filter(r=>namoSameUser(r,currentUser));
  const visibleLeaves=(isAdmin||isDirector)?leaves:leaves.filter(r=>namoSameUser(r,currentUser));
  const tabButton=(id,label)=><button onClick={()=>setTab(id)} style={{height:36,padding:"0 14px",border:0,borderRadius:9,background:tab===id?"#0f2740":"#e2e8f0",color:tab===id?"white":"#334155",fontWeight:900,cursor:"pointer"}}>{label}</button>;
  const inputStyle={width:"100%",height:40,border:"1px solid #cbd5e1",borderRadius:8,padding:"0 10px",boxSizing:"border-box",background:"white"};
  const cardStyle={background:"white",border:"1px solid #dbe3ea",borderRadius:12,padding:14};

  return <div style={{flex:1,minHeight:0,overflow:"auto",padding:14,background:"#f8fafc",position:"relative"}}>
    {notice&&<div style={{position:"sticky",top:0,zIndex:30,margin:"0 auto 10px",width:"fit-content",background:"#0f2740",color:"white",padding:"9px 14px",borderRadius:9,fontSize:12,fontWeight:800}}>{notice}</div>}
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><div><div style={{fontSize:18,fontWeight:950}}>근태·외근·휴가</div><div style={{fontSize:11,color:"#64748b",marginTop:3}}>{currentUser.name} · {currentUser.dept||"부서 미지정"}</div></div><div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>{tabButton("attendance","출퇴근")}{tabButton("fieldwork","외근")}{tabButton("leave","연차·반차")}</div></div>

    {tab==="attendance"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:14}}><button onClick={clockIn} disabled={!!mine?.clockIn} style={{height:54,border:0,borderRadius:12,background:mine?.clockIn?"#9bd8c4":"#059669",color:"white",fontSize:18,fontWeight:900}}>{mine?.clockIn?`출근 ${mine.clockIn}`:"출근하기"}</button><button onClick={clockOut} disabled={!mine?.clockIn||!!mine?.clockOut} style={{height:54,border:0,borderRadius:12,background:mine?.clockOut?"#ef9a9a":!mine?.clockIn?"#fecaca":"#dc2626",color:"white",fontSize:18,fontWeight:900}}>{mine?.clockOut?`퇴근 ${mine.clockOut}`:"퇴근하기"}</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:12}}>{[["현재시간",attendanceTime(now,true)],["출근시간",mine?.clockIn||"미등록"],["퇴근시간",mine?.clockOut||"미등록"]].map(([l,v])=><div key={l} style={cardStyle}><div style={{fontSize:10,color:"#64748b",textAlign:"center"}}>{l}</div><div style={{fontSize:16,fontWeight:900,textAlign:"center",marginTop:5}}>{v}</div></div>)}</div>
      <div style={{...cardStyle,marginTop:12,overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr>{["날짜","이름","부서","출근","퇴근","상태"].map(h=><th key={h} style={{padding:8,textAlign:"left",borderBottom:"1px solid #e2e8f0"}}>{h}</th>)}</tr></thead><tbody>{records.filter(r=>(isAdmin||isDirector)||namoSameUser(r,currentUser)).sort((a,b)=>b.date.localeCompare(a.date)).map((r,i)=><tr key={`${r.date}-${r.name}-${i}`}><td style={{padding:8}}>{r.date}</td><td>{r.name}</td><td>{r.dept||"-"}</td><td>{r.clockIn||"-"}</td><td>{r.clockOut||"-"}</td><td>{attendanceStatus(r)}</td></tr>)}</tbody></table></div>
    </div>}

    {tab==="fieldwork"&&<div>
      <div style={{...cardStyle,marginTop:14}}><div style={{fontSize:15,fontWeight:900}}>외근 등록</div>{activeField?<div style={{marginTop:12,padding:13,borderRadius:10,background:"#fff7ed"}}><strong>현재 외근 중</strong><div style={{fontSize:12,marginTop:6}}>{activeField.place} · {activeField.purpose} · {activeField.startTime}</div><button onClick={finishFieldwork} style={{marginTop:12,height:40,width:"100%",border:0,borderRadius:9,background:"#ea580c",color:"white",fontWeight:900}}>외근 복귀</button></div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}><input style={inputStyle} placeholder="방문처" value={fieldForm.place} onChange={e=>setFieldForm({...fieldForm,place:e.target.value})}/><input style={inputStyle} placeholder="외근 목적" value={fieldForm.purpose} onChange={e=>setFieldForm({...fieldForm,purpose:e.target.value})}/><input type="time" style={inputStyle} value={fieldForm.returnPlan} onChange={e=>setFieldForm({...fieldForm,returnPlan:e.target.value})}/><input style={inputStyle} placeholder="동행자" value={fieldForm.companion} onChange={e=>setFieldForm({...fieldForm,companion:e.target.value})}/><input style={{...inputStyle,gridColumn:"1 / -1"}} placeholder="비고" value={fieldForm.note} onChange={e=>setFieldForm({...fieldForm,note:e.target.value})}/><button onClick={startFieldwork} style={{gridColumn:"1 / -1",height:42,border:0,borderRadius:9,background:"#0284c7",color:"white",fontWeight:900}}>외근 시작</button></div>}</div>
      <div style={{...cardStyle,marginTop:12,overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:650}}><thead><tr>{["일자","이름","방문처","목적","출발","복귀","상태"].map(h=><th key={h} style={{padding:8,textAlign:"left",borderBottom:"1px solid #e2e8f0"}}>{h}</th>)}</tr></thead><tbody>{visibleFieldworks.map(r=><tr key={r.id}><td style={{padding:8}}>{r.date}</td><td>{r.name}</td><td>{r.place}</td><td>{r.purpose}</td><td>{r.startTime}</td><td>{r.returnTime||r.returnPlan||"-"}</td><td>{r.status}</td></tr>)}</tbody></table></div>
    </div>}

    {tab==="leave"&&<div>
      <div style={{...cardStyle,marginTop:14}}><div style={{fontSize:15,fontWeight:900}}>휴가 신청</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}><select style={inputStyle} value={leaveForm.type} onChange={e=>setLeaveForm({...leaveForm,type:e.target.value})}><option>연차</option><option>오전 반차</option><option>오후 반차</option></select><input type="date" style={inputStyle} value={leaveForm.date} onChange={e=>setLeaveForm({...leaveForm,date:e.target.value})}/><input style={{...inputStyle,gridColumn:"1 / -1"}} placeholder="신청 사유" value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm,reason:e.target.value})}/><input style={{...inputStyle,gridColumn:"1 / -1"}} placeholder="업무 인계자" value={leaveForm.handover} onChange={e=>setLeaveForm({...leaveForm,handover:e.target.value})}/><button onClick={submitLeave} style={{gridColumn:"1 / -1",height:42,border:0,borderRadius:9,background:"#7c3aed",color:"white",fontWeight:900}}>휴가 신청</button></div></div>
      {isDirector&&<div style={{marginTop:10,padding:10,borderRadius:10,background:"#ecfeff",color:"#155e75",fontSize:12,fontWeight:800}}>이사 검토 권한이 활성화되어 있습니다.</div>}
      <div style={{...cardStyle,marginTop:12,overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:820}}><thead><tr>{["신청자","부서","구분","사용일","사유","상태","검토자","처리"].map(h=><th key={h} style={{padding:8,textAlign:"left",borderBottom:"1px solid #e2e8f0"}}>{h}</th>)}</tr></thead><tbody>{visibleLeaves.map(r=><tr key={r.id}><td style={{padding:8}}>{r.name}</td><td>{r.dept||"-"}</td><td>{r.type}</td><td>{r.date}</td><td>{r.reason}</td><td><strong>{r.status}</strong>{r.rejectReason&&<div style={{color:"#b91c1c",marginTop:3}}>{r.rejectReason}</div>}</td><td>{r.reviewer||"-"}</td><td><div style={{display:"flex",gap:5,whiteSpace:"nowrap"}}>{isDirector&&r.status==="검토대기"&&<><button onClick={()=>approveLeave(r)} style={{height:29,border:0,borderRadius:7,background:"#059669",color:"white",fontWeight:800}}>승인</button><button onClick={()=>{setRejecting(r);setRejectReason("");}} style={{height:29,border:"1px solid #dc2626",borderRadius:7,background:"#fff1f2",color:"#b91c1c",fontWeight:800}}>반려</button></>}<button onClick={()=>printLeave(r)} style={{height:29,border:"1px solid #64748b",borderRadius:7,background:"white",fontWeight:800}}>PDF</button>{namoSameUser(r,currentUser)&&r.status!=="승인완료"&&<button onClick={()=>cancelLeave(r)} style={{height:29,border:"1px solid #94a3b8",borderRadius:7,background:"white"}}>취소</button>}</div></td></tr>)}</tbody></table></div>
    </div>}

    {rejecting&&<div style={{position:"fixed",inset:0,zIndex:90,background:"rgba(15,23,42,.48)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"min(420px,100%)",background:"white",borderRadius:14,padding:18}}><div style={{fontSize:17,fontWeight:900}}>휴가 신청 반려</div><div style={{fontSize:12,color:"#64748b",marginTop:5}}>{rejecting.name} · {rejecting.type} · {rejecting.date}</div><textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="반려 사유를 입력하세요" style={{width:"100%",height:90,boxSizing:"border-box",marginTop:14,border:"1px solid #cbd5e1",borderRadius:9,padding:10,resize:"none"}}/><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}><button onClick={()=>setRejecting(null)} style={{height:36,padding:"0 14px",border:"1px solid #cbd5e1",borderRadius:8,background:"white"}}>취소</button><button onClick={rejectLeave} style={{height:36,padding:"0 14px",border:0,borderRadius:8,background:"#dc2626",color:"white",fontWeight:900}}>반려 확정</button></div></div></div>}
  </div>;
}

(function installNamoTalkDragFix(){
  if(window.__NAMO_TALK_DRAG_FIX__)return;
  window.__NAMO_TALK_DRAG_FIX__=true;
  const STORAGE_KEY="qmes-namo-talk-visual-offset-v1";
  let drag=null;
  const readOffset=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||{x:0,y:0};}catch(e){return{x:0,y:0};}};
  const applyOffset=panel=>{if(!panel)return;const p=readOffset();panel.style.transform=`translate3d(${p.x}px,${p.y}px,0)`;};
  const observer=new MutationObserver(()=>applyOffset(document.querySelector('section[aria-label="NAMO Talk"]')));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("pointerdown",event=>{const header=event.target.closest&&event.target.closest('section[aria-label="NAMO Talk"] > header');if(!header||event.target.closest("button")||window.innerWidth<=768)return;const panel=header.parentElement;const saved=readOffset();drag={panel,startX:event.clientX,startY:event.clientY,baseX:Number(saved.x)||0,baseY:Number(saved.y)||0};document.body.style.userSelect="none";document.body.style.cursor="grabbing";header.style.cursor="grabbing";event.preventDefault();},true);
  window.addEventListener("pointermove",event=>{if(!drag)return;const nextX=drag.baseX+event.clientX-drag.startX;const nextY=drag.baseY+event.clientY-drag.startY;drag.panel.style.transform=`translate3d(${nextX}px,${nextY}px,0)`;drag.next={x:nextX,y:nextY};event.preventDefault();},{passive:false});
  const stop=()=>{if(!drag)return;if(drag.next){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(drag.next));}catch(e){}}const header=drag.panel.querySelector(":scope > header");if(header)header.style.cursor="grab";drag=null;document.body.style.userSelect="";document.body.style.cursor="";};
  window.addEventListener("pointerup",stop);window.addEventListener("pointercancel",stop);applyOffset(document.querySelector('section[aria-label="NAMO Talk"]'));
})();