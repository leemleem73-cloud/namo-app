/* QMES router */
function QMESProductionProcessRoute(){
  const [Component,setComponent]=useState(()=>typeof window.ProductionProcessTab==="function"?window.ProductionProcessTab:null);
  useEffect(()=>{
    const syncComponent=()=>{
      const next=window.ProductionProcessTab;
      if(typeof next==="function")setComponent(()=>next);
    };
    syncComponent();
    window.addEventListener("qmes:production-process-ready",syncComponent);
    const timer=setInterval(syncComponent,250);
    return()=>{window.removeEventListener("qmes:production-process-ready",syncComponent);clearInterval(timer);};
  },[]);
  return typeof Component==="function"?<Component/>:<div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-sm font-bold text-slate-200">생산공정 관리 화면을 불러오는 중입니다.</div>;
}

const TABS = [
  { id:"dash", label:"종합 대시보드", icon:LayoutDashboard, comp:DashboardTab },
  { id:"pop", label:"현장 입력 (iPad)", icon:Tablet, comp:FieldInputTab },
  { id:"iqc", label:"수입검사 (IQC)", icon:ArrowDownToLine, comp:IqcTab },
  { id:"prod", label:"생산 (배치)", icon:FlaskConical, comp:ProductionTab },
  { id:"wo", label:"", icon:ClipboardList, comp:WoDocTab },
  { id:"woIssue", label:"작업지시서", icon:Plus, comp:IssueWoTab },
  { id:"prodProcess", label:"생산공정 관리", icon:FlaskConical, comp:QMESProductionProcessRoute },
  { id:"pqc", label:"공정검사 (PQC)", icon:ClipboardCheck, comp:PqcTab },
  { id:"oqc", label:"출하검사 (OQC)", icon:ArrowUpFromLine, comp:OqcTab },
  { id:"lock", label:"품질 인터락 (차단)", icon:Lock, comp:InterlockTab },
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
  { id:"productionMenu", label:"생산관리", icon:FlaskConical, children:["prod","woIssue","prodProcess"] },
  { id:"qualityMenu", label:"품질검사", icon:ClipboardCheck, children:["iqc","pqc","oqc","spc","lock","coa"] },
  { id:"pop", label:"현장입력", icon:Tablet },
  { id:"partners", label:"거래처 현황", icon:Users },
  { id:"eq", label:"설비관리", icon:Cpu },
  { id:"trace", label:"LOT 추적", icon:GitBranch },
  { id:"nonconformityMenu", label:"부적합관리", icon:ShieldAlert, children:["ncr","cc","4m"] },
];

function safeStorageGet(key, fallback=null){
  try{const value=sessionStorage.getItem(key);return value==null?fallback:value;}catch(error){return fallback;}
}
function safeStorageSet(key,value){try{sessionStorage.setItem(key,value);return true;}catch(error){return false;}}
function safeStorageRemove(key){try{sessionStorage.removeItem(key);}catch(error){}}
function qmesProcessCleanNavigation(value){return String(value==null?"":value).trim();}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>{
    const saved=safeStorageGet("qmes_current_tab","dash");
    return saved==="namoTalk"||saved==="inv"?"dash":saved;
  });
  const [clock,setClock]=useState(new Date());
  const [openMenu,setOpenMenu]=useState(()=>safeStorageGet("qmes_open_menu",null));
  const [talkOpen,setTalkOpen]=useState(()=>safeStorageGet("qmes_namo_talk_open","0")==="1");
  const [talkTargetRoom,setTalkTargetRoom]=useState("");
  const [namoUnread,setNamoUnread]=useState(()=>{try{return Number(localStorage.getItem("qmes-namo-talk-unread-v1")||0);}catch(error){return 0;}});
  const [profileOpen,setProfileOpen]=useState(false);
  const [passwordOpen,setPasswordOpen]=useState(false);
  const [currentPw,setCurrentPw]=useState("");
  const [newPw,setNewPw]=useState("");
  const [confirmPw,setConfirmPw]=useState("");
  const [passwordError,setPasswordError]=useState("");

  useEffect(()=>{safeStorageSet("qmes_current_tab",tab);},[tab]);
  useEffect(()=>{
    const handleTabNavigation=event=>{
      const nextTab=qmesProcessCleanNavigation(event?.detail?.tab);
      if(!nextTab||!TABS.some(item=>item.id===nextTab))return;
      setTab(nextTab);
      if(event?.detail?.openMenu)setOpenMenu(event.detail.openMenu);
    };
    window.addEventListener("qmes:navigate-tab",handleTabNavigation);
    return()=>window.removeEventListener("qmes:navigate-tab",handleTabNavigation);
  },[]);
  useEffect(()=>{safeStorageSet("qmes_namo_talk_open",talkOpen?"1":"0");},[talkOpen]);
  useEffect(()=>{
    const updateUnread=event=>setNamoUnread(Math.max(0,Number(event.detail?.count||0)));
    window.addEventListener("namo-talk-unread",updateUnread);
    return()=>window.removeEventListener("namo-talk-unread",updateUnread);
  },[]);
  useEffect(()=>{if(openMenu)safeStorageSet("qmes_open_menu",openMenu);else safeStorageRemove("qmes_open_menu");},[openMenu]);
  useEffect(()=>{
    const handleFieldShortcut=event=>{
      const mode=String(event?.detail?.mode||"").toUpperCase();
      if(!["IQC","PQC","OQC"].includes(mode)) return;
      try{sessionStorage.setItem("qmes_field_shortcut_mode",mode);}catch(error){}
      setOpenMenu(null);setTab("pop");
      requestAnimationFrame(()=>window.qmesSetGlobalSidebarGroup?.("현장입력"));
    };
    window.__QMES_FIELD_NAVIGATION_READY__=true;
    window.addEventListener("qmes:open-field-inspection",handleFieldShortcut);
    return()=>{window.removeEventListener("qmes:open-field-inspection",handleFieldShortcut);window.__QMES_FIELD_NAVIGATION_READY__=false;};
  },[]);
  useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const handleKeyDown=event=>{if(event.key!=="Escape")return;if(passwordOpen){setPasswordOpen(false);return;}if(profileOpen)setProfileOpen(false);};
    window.addEventListener("keydown",handleKeyDown);return()=>window.removeEventListener("keydown",handleKeyDown);
  },[profileOpen,passwordOpen]);

  window.__QMES_CURRENT_USER__=user;
  window.__QMES_CLOSE_NAMO_TALK__=()=>setTalkOpen(false);
  const visibleTabs=TABS.filter(tabItem=>!tabItem.adminOnly||user.role==="admin");
  useEffect(()=>{if(!visibleTabs.some(tabItem=>tabItem.id===tab))setTab("dash");},[tab,visibleTabs.length]);

  const currentTab=TABS.find(tabItem=>tabItem.id===tab)||TABS[0];
  const Active=currentTab.comp;
  const closeAccountModal=()=>setProfileOpen(false);
  const openPasswordModal=()=>{setProfileOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");setPasswordOpen(true);};
  const closePasswordModal=()=>{setPasswordOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");};
  const handleLogout=()=>{setProfileOpen(false);if(typeof onLogout==="function")onLogout();};
  const changePassword=async event=>{
    event.preventDefault();
    if(newPw.length<4){setPasswordError("새 비밀번호는 4자 이상 입력하세요.");return;}
    if(newPw!==confirmPw){setPasswordError("새 비밀번호 확인이 일치하지 않습니다.");return;}
    try{
      const response=await fetch("/api/auth/password",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:currentPw,newPassword:newPw})});
      const payload=await response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
      if(!response.ok||!payload.success){setPasswordError(payload.message||"비밀번호 변경에 실패했습니다.");return;}
      const users=JSON.parse(localStorage.getItem("qmes-users-v3")||"[]");let changed=false;
      const nextUsers=Array.isArray(users)?users.map(item=>{const sameUser=String(item.id||item.name||"")===String(user.id||user.name||"")||String(item.uid||"")===String(user.uid||"")||String(item.name||"")===String(user.name||"");if(!sameUser)return item;changed=true;const {pw,password,...safeItem}=item;return {...safeItem,passwordChanged:true};}):[];
      if(changed)localStorage.setItem("qmes-users-v3",JSON.stringify(nextUsers));
      closePasswordModal();alert("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
    }catch(error){console.error("[QMES] 비밀번호 변경 실패",error);setPasswordError("비밀번호 저장 중 오류가 발생했습니다.");}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" style={{fontFamily:"'Pretendard','Noto Sans KR',system-ui,sans-serif"}}>
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-50 backdrop-blur">
        <div className="w-full px-4 lg:px-6 py-3 flex items-center gap-4">
          <button type="button" className="flex items-center shrink-0 rounded" onClick={()=>{setTab("dash");setOpenMenu(null);}}>
            <img src="https://namochemical.com/img/svg/img_logo.svg" alt="NAMO Chemical" className="h-[22px] md:h-[26px] w-auto max-w-[262px] object-contain" style={{filter:"brightness(0) invert(1)"}} onError={event=>{event.currentTarget.onerror=null;event.currentTarget.style.filter="none";event.currentTarget.src="/assets/namo-header-logo.svg?v=20260731-white2";}} />
          </button>
          <div className="flex-1" />
          <div className="qmes-header-clock hidden sm:flex items-center gap-2 font-mono tabular-nums"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><span>{clock.toLocaleTimeString("ko-KR",{hour12:false})}</span></div>
          <button type="button" onClick={()=>{setTalkTargetRoom("");setTalkOpen(true);}} className="relative p-2 rounded text-yellow-300 hover:bg-slate-800" aria-label={`NAMO Talk 알림 ${namoUnread}건`}>
            <Bell size={16}/>{namoUnread>0&&<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-slate-900">{namoUnread>99?"99+":namoUnread}</span>}
          </button>
          <button type="button" onClick={()=>setTalkOpen(value=>!value)} className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-bold transition-colors ${talkOpen?"bg-sky-500/20 border-sky-400 text-white":"bg-sky-600/15 border-sky-500/70 text-sky-100 hover:bg-sky-500/25"}`} aria-label={talkOpen?"NAMO Talk 닫기":"NAMO Talk 열기"} aria-expanded={talkOpen}><span aria-hidden="true">💬</span><span>NAMO Talk</span></button>
          <div className="qmes-header-controls flex items-center gap-2">
            <button type="button" onClick={()=>setProfileOpen(true)} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-800" aria-label="계정 설정 열기" aria-expanded={profileOpen}><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">{user.name?.[0]||"사"}</div><div className="hidden md:block whitespace-nowrap" style={{fontSize:18,fontWeight:800,lineHeight:1.2,color:"#ffffff"}}>{user.name} ({user.dept})</div><span className="hidden md:inline text-slate-400" style={{fontSize:12}}>▼</span></button>
            <button type="button" onClick={downloadQmesBackup} className="qmes-header-action px-2 py-1 rounded border border-slate-700">백업</button>
            <button type="button" onClick={restoreQmesBackup} className="qmes-header-action px-2 py-1 rounded border border-slate-700">복원</button>
            {user.role==="admin"&&<button type="button" onClick={()=>{setTab("members");setOpenMenu(null);}} className={`qmes-header-action px-2 py-1 rounded border ${tab==="members"?"border-sky-500/60 text-sky-300 bg-sky-500/10":"border-slate-700 text-slate-400"}`}>회원관리</button>}
          </div>
        </div>
        <div className="border-t border-white/10 qmes-top-menu-bar">
          <nav className="qmes-top-menu">
            {TOP_MENUS.map(menu=>{const MenuIcon=menu.icon;const children=(menu.children||[]).map(id=>visibleTabs.find(tabItem=>tabItem.id===id)).filter(Boolean);const direct=!menu.children;const active=direct?tab===menu.id:children.some(item=>item.id===tab);const opened=openMenu===menu.id;return <div key={menu.id} className="qmes-top-menu-item"><button type="button" onClick={()=>{if(direct){setTab(menu.id);setOpenMenu(null);}else{setOpenMenu(opened?null:menu.id);if(!active&&children.length)setTab(children[0].id);}}} className={`qmes-top-menu-button ${active?"is-active":""}`}><MenuIcon size={15}/><span>{menu.label}</span>{!direct&&<ChevronRight size={12} className="qmes-menu-arrow" style={{transform:opened?"rotate(90deg)":"rotate(0deg)"}}/>}</button></div>;})}
          </nav>
          {openMenu&&(()=>{const selected=TOP_MENUS.find(menu=>menu.id===openMenu);const items=(selected?.children||[]).map(id=>visibleTabs.find(tabItem=>tabItem.id===id)).filter(Boolean);if(!items.length)return null;return <div className={`qmes-submenu-row qmes-submenu-${selected.id}`} role="menu"><div className="qmes-submenu-title">{selected.label}</div>{items.map(item=>{const ItemIcon=item.icon;return <button type="button" key={item.id} onClick={()=>setTab(item.id)} className={`qmes-submenu-button ${tab===item.id?"is-active":""}`}><ItemIcon size={14}/><span>{item.label}</span></button>;})}</div>;})()}
        </div>
      </header>
      <main className="w-full px-4 lg:px-6 py-5 flex-1"><Active/></main>
      {talkOpen&&<NamoTalkTab initialRoom={talkTargetRoom} onClose={()=>setTalkOpen(false)}/>}      
      <NamoTalkNotifier talkOpen={talkOpen} onOpenRoom={roomId=>{setTalkTargetRoom(roomId);setTalkOpen(true);}}/>

      {profileOpen&&<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" onClick={closeAccountModal} role="dialog" aria-modal="true" aria-label="계정 설정"><div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between mb-6"><h2 className="text-xl font-black text-white">계정 설정</h2><button type="button" onClick={closeAccountModal} className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800" aria-label="닫기">×</button></div><button type="button" onClick={openPasswordModal} className="w-full h-12 rounded-xl bg-sky-600 px-4 text-left text-sm font-black text-white hover:bg-sky-500">비밀번호 변경하기</button><button type="button" onClick={handleLogout} className="mt-3 w-full h-12 rounded-xl border border-red-500/50 bg-red-500/10 px-4 text-left text-sm font-black text-red-300 hover:bg-red-500/20">로그아웃</button><button type="button" onClick={closeAccountModal} className="mt-5 w-full h-11 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-800">닫기</button></div></div>}
      {passwordOpen&&<div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 p-4" onClick={closePasswordModal} role="dialog" aria-modal="true" aria-label="비밀번호 변경"><form onSubmit={changePassword} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between mb-5"><h2 className="text-xl font-black text-white">비밀번호 변경</h2><button type="button" onClick={closePasswordModal} className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800" aria-label="닫기">×</button></div><label className="block text-sm font-bold mb-2">현재 비밀번호</label><input type="password" value={currentPw} onChange={event=>{setCurrentPw(event.target.value);setPasswordError("");}} autoComplete="current-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500"/><label className="block text-sm font-bold mt-4 mb-2">새 비밀번호</label><input type="password" value={newPw} onChange={event=>{setNewPw(event.target.value);setPasswordError("");}} autoComplete="new-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500"/><label className="block text-sm font-bold mt-4 mb-2">새 비밀번호 확인</label><input type="password" value={confirmPw} onChange={event=>{setConfirmPw(event.target.value);setPasswordError("");}} autoComplete="new-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500"/>{passwordError&&<div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400">{passwordError}</div>}<button type="submit" className="mt-6 w-full h-11 rounded-xl bg-sky-600 font-black text-white hover:bg-sky-500">변경 저장</button><button type="button" onClick={closePasswordModal} className="mt-3 w-full h-11 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800">취소</button></form></div>}
    </div>
  );
}
