/* QMES router */
const TABS = [
  { id:"dash", label:"종합 대시보드", icon:LayoutDashboard, comp:DashboardTab },
  { id:"pop", label:"현장 입력 (iPad)", icon:Tablet, comp:FieldInputTab },
  { id:"iqc", label:"수입검사 (IQC)", icon:ArrowDownToLine, comp:IqcTab },
  { id:"prod", label:"생산 (배치)", icon:FlaskConical, comp:ProductionTab },
  { id:"wo", label:"", icon:ClipboardList, comp:WoDocTab },
  { id:"woIssue", label:"작업지시서", icon:Plus, comp:IssueWoTab },
  { id:"pqc", label:"공정검사 (PQC)", icon:ClipboardCheck, comp:PqcTab },
  { id:"oqc", label:"출하검사 (OQC)", icon:ArrowUpFromLine, comp:OqcTab },
  { id:"lock", label:"품질 인터락 (차단)", icon:Lock, comp:InterlockTab },
  { id:"inv", label:"원재료 재고", icon:Package, comp:InventoryTab },
  { id:"partners", label:"거래처 현황", icon:Users, comp:PartnersTab },
  { id:"eq", label:"설비 모니터링", icon:Cpu, comp:EquipmentTab },
  { id:"trace", label:"Lot 추적", icon:GitBranch, comp:TraceTab },
  { id:"spc", label:"SPC (Cpk)", icon:BarChart3, comp:SpcTab },
  { id:"4m", label:"4M 변경관리", icon:Repeat, comp:FourMTab },
  { id:"ncr", label:"부적합 (8D)", icon:ShieldAlert, comp:NcrTab },
  { id:"cc", label:"고객불만 (GQMS)", icon:MessageSquareWarning, comp:ComplaintTab },
  { id:"coa", label:"출하성적서", icon:Printer, comp:CoaTab },
  { id:"members", label:"회원 관리", icon:Users, comp:MembersTab, adminOnly:true },
];

const TOP_MENUS = [
  { id:"dash", label:"대시보드", icon:LayoutDashboard },
  { id:"productionMenu", label:"생산관리", icon:FlaskConical, children:["prod","woIssue"] },
  { id:"qualityMenu", label:"품질검사", icon:ClipboardCheck, children:["iqc","pqc","oqc","spc","lock","coa"] },
  { id:"pop", label:"현장입력", icon:Tablet },
  { id:"inv", label:"재고관리", icon:Package },
  { id:"partners", label:"거래처 현황", icon:Users },
  { id:"eq", label:"설비관리", icon:Cpu },
  { id:"trace", label:"LOT 추적", icon:GitBranch },
  { id:"nonconformityMenu", label:"부적합관리", icon:ShieldAlert, children:["ncr","cc","4m"] },
];

function safeStorageGet(key, fallback=null){
  try { const value=sessionStorage.getItem(key); return value==null?fallback:value; } catch(e){ return fallback; }
}
function safeStorageSet(key,value){
  try { sessionStorage.setItem(key,value); return true; } catch(e){ return false; }
}
function safeStorageRemove(key){
  try { sessionStorage.removeItem(key); } catch(e) { /* 무시 */ }
}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>{
    const saved=safeStorageGet("qmes_current_tab","dash");
    return saved==="namoTalk"?"dash":saved;
  });
  const [clock,setClock]=useState(new Date());
  const [openMenu,setOpenMenu]=useState(()=>safeStorageGet("qmes_open_menu",null));
  const [talkOpen,setTalkOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [myInfoOpen,setMyInfoOpen]=useState(false);
  const [passwordOpen,setPasswordOpen]=useState(false);
  const [currentPw,setCurrentPw]=useState("");
  const [newPw,setNewPw]=useState("");
  const [confirmPw,setConfirmPw]=useState("");
  const [passwordError,setPasswordError]=useState("");

  useEffect(()=>{ safeStorageSet("qmes_current_tab",tab); },[tab]);
  useEffect(()=>{ if(openMenu) safeStorageSet("qmes_open_menu",openMenu); else safeStorageRemove("qmes_open_menu"); },[openMenu]);
  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return()=>clearInterval(t); },[]);

  window.__QMES_CURRENT_USER__=user;
  window.__QMES_CLOSE_NAMO_TALK__=()=>setTalkOpen(false);

  const visibleTabs=TABS.filter(t=>!t.adminOnly||user.role==="admin");
  useEffect(()=>{ if(!visibleTabs.some(t=>t.id===tab)) setTab("dash"); },[tab,visibleTabs.length]);
  const currentTab=TABS.find(t=>t.id===tab)||TABS[0];
  const Active=currentTab.comp;

  const openPasswordModal=()=>{
    setProfileOpen(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPasswordError("");
    setPasswordOpen(true);
  };

  const changePassword=(event)=>{
    event.preventDefault();
    const savedPassword=String(user.pw||user.password||"1234");
    if(currentPw!==savedPassword){ setPasswordError("현재 비밀번호가 일치하지 않습니다."); return; }
    if(newPw.length<4){ setPasswordError("새 비밀번호는 4자 이상 입력하세요."); return; }
    if(newPw!==confirmPw){ setPasswordError("새 비밀번호 확인이 일치하지 않습니다."); return; }
    try{
      const users=JSON.parse(localStorage.getItem("qmes-users-v3")||"[]");
      let changed=false;
      const next=Array.isArray(users)?users.map(item=>{
        const same=String(item.id||item.name||"")===String(user.id||user.name||"")||String(item.uid||"")===String(user.uid||"")||String(item.name||"")===String(user.name||"");
        if(!same)return item;
        changed=true;
        return {...item,pw:newPw,password:newPw};
      }):[];
      if(!changed){ setPasswordError("회원 정보를 찾지 못했습니다. 관리자에게 문의하세요."); return; }
      localStorage.setItem("qmes-users-v3",JSON.stringify(next));
      user.pw=newPw;
      user.password=newPw;
      sessionStorage.setItem("qmes-current-user-v1",JSON.stringify(user));
      setPasswordOpen(false);
      alert("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
    }catch(error){
      console.error("[QMES] 비밀번호 변경 실패",error);
      setPasswordError("비밀번호 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" style={{fontFamily:"'Pretendard','Noto Sans KR',system-ui,sans-serif"}}>
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-50 backdrop-blur">
        <div className="w-full px-4 lg:px-6 py-3 flex items-center gap-4">
          <button type="button" className="flex items-center shrink-0 rounded" onClick={()=>{setTab("dash");setOpenMenu(null);}}>
            <img src="https://namochemical.com/img/svg/img_logo.svg" alt="NAMO Chemical" className="h-[22px] md:h-[26px] w-auto max-w-[262px] object-contain" style={{filter:"brightness(0) invert(1)"}} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.style.filter="none";e.currentTarget.src="/assets/namo-header-logo.svg?v=20260727-3";}} />
          </button>
          <div className="flex-1" />
          <div className="qmes-header-clock hidden sm:flex items-center gap-2 font-mono tabular-nums"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><span>{clock.toLocaleTimeString("ko-KR",{hour12:false})}</span></div>
          <button className="relative p-2 rounded hover:bg-slate-800" aria-label="알림"><Bell size={16}/><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400"/></button>
          <button type="button" onClick={()=>setTalkOpen(v=>!v)} className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-bold transition-colors ${talkOpen?"bg-sky-500/20 border-sky-400 text-white":"bg-sky-600/15 border-sky-500/70 text-sky-100 hover:bg-sky-500/25"}`} aria-label={talkOpen?"NAMO Talk 닫기":"NAMO Talk 열기"} aria-expanded={talkOpen}>
            <span aria-hidden="true">💬</span><span>NAMO Talk</span>
          </button>
          <div className="qmes-header-controls flex items-center gap-2">
            <button type="button" onClick={()=>setProfileOpen(v=>!v)} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-800" aria-expanded={profileOpen}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">{user.name[0]}</div>
              <div className="hidden md:block whitespace-nowrap" style={{fontSize:18,fontWeight:800,lineHeight:1.2,color:"#ffffff"}}>{user.name} ({user.dept})</div>
              <span className="hidden md:inline text-slate-400" style={{fontSize:12}}>▼</span>
            </button>
            <button onClick={downloadQmesBackup} className="qmes-header-action px-2 py-1 rounded border border-slate-700">백업</button>
            <button onClick={restoreQmesBackup} className="qmes-header-action px-2 py-1 rounded border border-slate-700">복원</button>
            {user.role==="admin"&&<button onClick={()=>{setTab("members");setOpenMenu(null);}} className={`qmes-header-action px-2 py-1 rounded border ${tab==="members"?"border-sky-500/60 text-sky-300 bg-sky-500/10":"border-slate-700 text-slate-400"}`}>회원관리</button>}
          </div>
        </div>
        <div className="border-t border-white/10 qmes-top-menu-bar">
          <nav className="qmes-top-menu">
            {TOP_MENUS.map(menu=>{
              const MenuIcon=menu.icon;
              const children=(menu.children||[]).map(id=>visibleTabs.find(t=>t.id===id)).filter(Boolean);
              const direct=!menu.children;
              const active=direct?tab===menu.id:children.some(i=>i.id===tab);
              const opened=openMenu===menu.id;
              return <div key={menu.id} className="qmes-top-menu-item"><button onClick={()=>{if(direct){setTab(menu.id);setOpenMenu(null);}else{setOpenMenu(opened?null:menu.id);if(!active&&children.length)setTab(children[0].id);}}} className={`qmes-top-menu-button ${active?"is-active":""}`}><MenuIcon size={15}/><span>{menu.label}</span>{!direct&&<ChevronRight size={12} className="qmes-menu-arrow" style={{transform:opened?"rotate(90deg)":"rotate(0deg)"}}/>}</button></div>;
            })}
          </nav>
          {openMenu&&(()=>{
            const selected=TOP_MENUS.find(m=>m.id===openMenu);
            const items=(selected?.children||[]).map(id=>visibleTabs.find(t=>t.id===id)).filter(Boolean);
            if(!items.length)return null;
            return <div className="qmes-submenu-row" role="menu"><div className="qmes-submenu-title">{selected.label}</div>{items.map(item=>{const I=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={`qmes-submenu-button ${tab===item.id?"is-active":""}`}><I size={14}/><span>{item.label}</span></button>})}</div>;
          })()}
        </div>
      </header>
      <main className="w-full px-4 lg:px-6 py-5 flex-1"><Active/></main>
      {talkOpen&&<NamoTalkTab onClose={()=>setTalkOpen(false)}/>} 

      {profileOpen&&(
        <div className="fixed inset-0 z-[90]" onClick={()=>setProfileOpen(false)}>
          <div className="absolute right-4 top-[74px] w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="px-3 py-3 border-b border-slate-800">
              <div className="text-base font-black">{user.name} ({user.dept})</div>
              <div className="text-xs text-slate-400 mt-1">{user.position||"직급 미등록"}</div>
            </div>
            <button type="button" onClick={()=>{setMyInfoOpen(true);setProfileOpen(false);}} className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-slate-800">내 정보</button>
            <button type="button" onClick={openPasswordModal} className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-slate-800">비밀번호 변경</button>
            {onLogout&&<button type="button" onClick={onLogout} className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold text-red-300 hover:bg-slate-800">로그아웃</button>}
          </div>
        </div>
      )}

      {myInfoOpen&&(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={()=>setMyInfoOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-black">내 정보</h2><button type="button" onClick={()=>setMyInfoOpen(false)} className="w-8 h-8 rounded-lg border border-slate-700 hover:bg-slate-800">×</button></div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-400">이름</span><strong>{user.name}</strong></div>
              <div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-400">부서</span><strong>{user.dept||"-"}</strong></div>
              <div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-400">직급</span><strong>{user.position||"-"}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">권한</span><strong>{user.role==="admin"?"관리자":"사용자"}</strong></div>
            </div>
            <button type="button" onClick={()=>setMyInfoOpen(false)} className="mt-6 w-full h-11 rounded-xl bg-sky-600 font-black hover:bg-sky-500">확인</button>
          </div>
        </div>
      )}

      {passwordOpen&&(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={()=>setPasswordOpen(false)}>
          <form onSubmit={changePassword} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-black">비밀번호 변경</h2><button type="button" onClick={()=>setPasswordOpen(false)} className="w-8 h-8 rounded-lg border border-slate-700 hover:bg-slate-800">×</button></div>
            <label className="block text-sm font-bold mb-2">현재 비밀번호</label>
            <input type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)} autoComplete="current-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500" />
            <label className="block text-sm font-bold mt-4 mb-2">새 비밀번호</label>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} autoComplete="new-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500" />
            <label className="block text-sm font-bold mt-4 mb-2">새 비밀번호 확인</label>
            <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} autoComplete="new-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500" />
            {passwordError&&<div className="mt-3 text-sm font-bold text-red-400">{passwordError}</div>}
            <button type="submit" className="mt-6 w-full h-11 rounded-xl bg-sky-600 font-black hover:bg-sky-500">변경 저장</button>
          </form>
        </div>
      )}
    </div>
  );
}