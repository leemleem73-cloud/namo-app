/* QMES router — native shell rebuild 2026-09-02 */
function QMESProductionProcessRoute(){
  const [Component,setComponent]=useState(()=>typeof window.ProductionProcessTab==="function"?window.ProductionProcessTab:null);
  useEffect(()=>{
    const syncComponent=()=>{const next=window.ProductionProcessTab;if(typeof next==="function")setComponent(()=>next);};
    syncComponent();
    window.addEventListener("qmes:production-process-ready",syncComponent);
    const timer=setInterval(syncComponent,250);
    return()=>{window.removeEventListener("qmes:production-process-ready",syncComponent);clearInterval(timer);};
  },[]);
  return typeof Component==="function"?<Component/>:<div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">생산공정 관리 화면을 불러오는 중입니다.</div>;
}

function qmesSavedInventorySection(){
  const allowed=["overview","movement","lot","production","count"];
  try{const saved=sessionStorage.getItem("qmes_inventory_section")||"overview";return allowed.includes(saved)?saved:"overview";}catch(error){return "overview";}
}

function QMESInventoryRoute(){
  const [section,setSection]=useState(qmesSavedInventorySection);
  useEffect(()=>{
    const handleSection=event=>{
      const next=String(event?.detail?.section||"");
      if(!["overview","movement","lot","production","count"].includes(next))return;
      try{sessionStorage.setItem("qmes_inventory_section",next);}catch(error){}
      setSection(next);
    };
    window.addEventListener("qmes:inventory-section",handleSection);
    return()=>window.removeEventListener("qmes:inventory-section",handleSection);
  },[]);
  const Component=window.InventoryEnterpriseTab;
  return <div id="qmes-inventory-host" data-qmes-inventory-section={section}>{typeof Component==="function"?<Component section={section}/>:<div className="inv-loading">재고관리 화면을 불러오는 중입니다.</div>}</div>;
}

const TABS=[
  {id:"dash",label:"종합 대시보드",icon:LayoutDashboard,comp:DashboardTab},
  {id:"pop",label:"현장 입력 (iPad)",icon:Tablet,comp:FieldInputTab},
  {id:"iqc",label:"수입검사 (IQC)",icon:ArrowDownToLine,comp:IqcTab},
  {id:"prod",label:"생산 (배치)",icon:FlaskConical,comp:ProductionTab},
  {id:"wo",label:"",icon:ClipboardList,comp:WoDocTab},
  {id:"woIssue",label:"작업지시서",icon:Plus,comp:IssueWoTab},
  {id:"prodProcess",label:"생산공정 관리",icon:FlaskConical,comp:typeof window.ProductionProcessTab==="function"?window.ProductionProcessTab:QMESProductionProcessRoute},
  {id:"pqc",label:"공정검사 (PQC)",icon:ClipboardCheck,comp:PqcTab},
  {id:"oqc",label:"출하검사 (OQC)",icon:ArrowUpFromLine,comp:OqcTab},
  {id:"lock",label:"품질 인터락 (차단)",icon:Lock,comp:InterlockTab},
  {id:"partners",label:"거래처 현황",icon:Users,comp:PartnersTab},
  {id:"eq",label:"설비 모니터링",icon:Cpu,comp:EquipmentTab},
  {id:"inv",label:"재고관리",icon:Boxes,comp:QMESInventoryRoute},
  {id:"trace",label:"Lot 추적",icon:GitBranch,comp:TraceTab},
  {id:"spc",label:"SPC (Cpk)",icon:BarChart3,comp:SpcTab},
  {id:"4m",label:"4M 변경관리",icon:Repeat,comp:FourMTab},
  {id:"ncr",label:"부적합 (8D)",icon:ShieldAlert,comp:NcrTab},
  {id:"cc",label:"고객불만 (GQMS)",icon:MessageSquareWarning,comp:ComplaintTab},
  {id:"coa",label:"출하성적서",icon:Printer,comp:CoaTab},
  {id:"members",label:"회원 관리",icon:Users,comp:MembersTab,adminOnly:true},
];

const TOP_MENUS=[
  {id:"dash",label:"대시보드",icon:LayoutDashboard},
  {id:"productionMenu",label:"생산관리",icon:FlaskConical,children:["prod","woIssue","prodProcess"]},
  {id:"qualityMenu",label:"품질검사",icon:ClipboardCheck,children:["iqc","pqc","oqc","spc","lock","coa"]},
  {id:"pop",label:"현장입력",icon:Tablet},
  {id:"inv",label:"재고관리",icon:Boxes},
  {id:"partners",label:"거래처 현황",icon:Users},
  {id:"eq",label:"설비관리",icon:Cpu},
  {id:"trace",label:"LOT 추적",icon:GitBranch},
  {id:"nonconformityMenu",label:"부적합관리",icon:ShieldAlert,children:["ncr","cc","4m"]},
];

function safeStorageGet(key,fallback=null){try{const value=sessionStorage.getItem(key);return value==null?fallback:value;}catch(error){return fallback;}}
function safeStorageSet(key,value){try{sessionStorage.setItem(key,value);return true;}catch(error){return false;}}
function safeStorageRemove(key){try{sessionStorage.removeItem(key);}catch(error){}}
function qmesProcessCleanNavigation(value){return String(value==null?"":value).trim();}
function qmesMenuForTab(tab){return TOP_MENUS.find(menu=>menu.id===tab||(menu.children||[]).includes(tab))||TOP_MENUS[0];}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>{const saved=safeStorageGet("qmes_current_tab","dash");return saved==="namoTalk"?"dash":saved;});
  const [clock,setClock]=useState(new Date());
  const [openMenu,setOpenMenu]=useState(()=>safeStorageGet("qmes_open_menu",null));
  const [mobileSidebarOpen,setMobileSidebarOpen]=useState(false);
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
  useEffect(()=>{safeStorageSet("qmes_namo_talk_open",talkOpen?"1":"0");},[talkOpen]);
  useEffect(()=>{if(openMenu)safeStorageSet("qmes_open_menu",openMenu);else safeStorageRemove("qmes_open_menu");},[openMenu]);
  useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const updateUnread=event=>setNamoUnread(Math.max(0,Number(event.detail?.count||0)));
    window.addEventListener("namo-talk-unread",updateUnread);
    return()=>window.removeEventListener("namo-talk-unread",updateUnread);
  },[]);
  useEffect(()=>{
    const handleTabNavigation=event=>{
      const nextTab=qmesProcessCleanNavigation(event?.detail?.tab);
      if(!nextTab||!TABS.some(item=>item.id===nextTab))return;
      setTab(nextTab);
      const owner=qmesMenuForTab(nextTab);
      setOpenMenu(event?.detail?.openMenu||((owner.children||[]).length?owner.id:null));
      setMobileSidebarOpen(false);
    };
    window.addEventListener("qmes:navigate-tab",handleTabNavigation);
    return()=>window.removeEventListener("qmes:navigate-tab",handleTabNavigation);
  },[]);
  useEffect(()=>{
    const handleFieldShortcut=event=>{
      const mode=String(event?.detail?.mode||"").toUpperCase();
      if(!["IQC","PQC","OQC"].includes(mode))return;
      try{sessionStorage.setItem("qmes_field_shortcut_mode",mode);}catch(error){}
      setOpenMenu(null);setTab("pop");setMobileSidebarOpen(false);
    };
    window.__QMES_FIELD_NAVIGATION_READY__=true;
    window.addEventListener("qmes:open-field-inspection",handleFieldShortcut);
    return()=>{window.removeEventListener("qmes:open-field-inspection",handleFieldShortcut);window.__QMES_FIELD_NAVIGATION_READY__=false;};
  },[]);
  useEffect(()=>{
    const groupMap={"대시보드":"dash","생산관리":"productionMenu","품질검사":"qualityMenu","현장입력":"pop","재고관리":"inv","거래처 현황":"partners","설비관리":"eq","LOT 추적":"trace","부적합관리":"nonconformityMenu"};
    window.qmesSetGlobalSidebarGroup=group=>{const id=groupMap[String(group||"").trim()];if(!id)return;const menu=TOP_MENUS.find(item=>item.id===id);if(!menu)return;setOpenMenu(menu.children?.length?id:null);if(!menu.children?.length)setTab(menu.id);};
    return()=>{delete window.qmesSetGlobalSidebarGroup;};
  },[]);
  useEffect(()=>{
    const handleKeyDown=event=>{if(event.key!=="Escape")return;if(passwordOpen){setPasswordOpen(false);return;}if(profileOpen){setProfileOpen(false);return;}if(mobileSidebarOpen)setMobileSidebarOpen(false);};
    window.addEventListener("keydown",handleKeyDown);return()=>window.removeEventListener("keydown",handleKeyDown);
  },[profileOpen,passwordOpen,mobileSidebarOpen]);

  window.__QMES_CURRENT_USER__=user;
  window.__QMES_CLOSE_NAMO_TALK__=()=>setTalkOpen(false);
  const visibleTabs=TABS.filter(tabItem=>!tabItem.adminOnly||user.role==="admin");
  useEffect(()=>{if(!visibleTabs.some(tabItem=>tabItem.id===tab))setTab("dash");},[tab,visibleTabs.length]);

  const currentTab=TABS.find(tabItem=>tabItem.id===tab)||TABS[0];
  const Active=currentTab.comp;
  const currentMenu=qmesMenuForTab(tab);
  const closeAccountModal=()=>setProfileOpen(false);
  const openPasswordModal=()=>{setProfileOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");setPasswordOpen(true);};
  const closePasswordModal=()=>{setPasswordOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");};
  const handleLogout=()=>{setProfileOpen(false);if(typeof onLogout==="function")onLogout();};
  const navigateTab=(nextTab,menuId=null)=>{if(!visibleTabs.some(item=>item.id===nextTab))return;setTab(nextTab);setOpenMenu(menuId);setMobileSidebarOpen(false);};
  const activateMenu=menu=>{
    const children=(menu.children||[]).map(id=>visibleTabs.find(item=>item.id===id)).filter(Boolean);
    if(children.length){setOpenMenu(openMenu===menu.id?null:menu.id);if(!children.some(item=>item.id===tab))setTab(children[0].id);}
    else if(visibleTabs.some(item=>item.id===menu.id)){navigateTab(menu.id,null);}
  };
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
    <div className="qmes-app-shell">
      <header className="qmes-app-header">
        <div className="qmes-app-header-main">
          <button type="button" className="qmes-mobile-menu-button" onClick={()=>setMobileSidebarOpen(value=>!value)} aria-label="메뉴 열기"><span>☰</span></button>
          <button type="button" className="qmes-brand-button" onClick={()=>navigateTab("dash",null)}>
            <img src="https://namochemical.com/img/svg/img_logo.svg" alt="NAMO Chemical" onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src="/assets/namo-header-logo.svg?v=20260731-white2";}} />
          </button>
          <div className="qmes-app-header-spacer" />
          <div className="qmes-header-clock"><span className="qmes-online-dot"/><span>{clock.toLocaleTimeString("ko-KR",{hour12:false})}</span></div>
          <button type="button" onClick={()=>{setTalkTargetRoom("");setTalkOpen(true);}} className="qmes-header-icon-button" aria-label={`NAMO Talk 알림 ${namoUnread}건`}><Bell size={17}/>{namoUnread>0&&<span className="qmes-unread-badge">{namoUnread>99?"99+":namoUnread}</span>}</button>
          <button type="button" onClick={()=>setTalkOpen(value=>!value)} className={`qmes-talk-button ${talkOpen?"is-active":""}`} aria-label={talkOpen?"NAMO Talk 닫기":"NAMO Talk 열기"} aria-expanded={talkOpen}><span aria-hidden="true">💬</span><span>NAMO Talk</span></button>
          <div className="qmes-header-controls">
            <button type="button" onClick={()=>setProfileOpen(true)} className="qmes-account-button" aria-label="계정 설정 열기" aria-expanded={profileOpen}><span className="qmes-account-avatar">{user.name?.[0]||"사"}</span><span className="qmes-account-name">{user.name} ({user.dept})</span><span className="qmes-account-arrow">▼</span></button>
            <button type="button" onClick={downloadQmesBackup} className="qmes-header-action">백업</button>
            <button type="button" onClick={restoreQmesBackup} className="qmes-header-action">복원</button>
            {user.role==="admin"&&<button type="button" onClick={()=>navigateTab("members",null)} className={`qmes-header-action ${tab==="members"?"is-active":""}`}>회원관리</button>}
          </div>
        </div>
        <nav className="qmes-top-menu" aria-label="주 메뉴">
          {TOP_MENUS.map(menu=>{const MenuIcon=menu.icon;const children=(menu.children||[]).map(id=>visibleTabs.find(item=>item.id===id)).filter(Boolean);const active=menu.id===tab||children.some(item=>item.id===tab);return <button key={menu.id} type="button" onClick={()=>activateMenu(menu)} className={`qmes-top-menu-button ${active?"is-active":""}`}><MenuIcon size={15}/><span>{menu.label}</span>{children.length>0&&<ChevronRight size={12} className={`qmes-menu-arrow ${openMenu===menu.id?"is-open":""}`}/>}</button>;})}
        </nav>
      </header>

      <div className="qmes-app-workspace">
        {mobileSidebarOpen&&<button type="button" className="qmes-sidebar-backdrop" onClick={()=>setMobileSidebarOpen(false)} aria-label="메뉴 닫기"/>}
        <aside className={`qmes-app-sidebar ${mobileSidebarOpen?"is-open":""}`} aria-label="업무 메뉴">
          <div className="qmes-sidebar-title">업무 메뉴</div>
          <div className="qmes-sidebar-list">
            {TOP_MENUS.map(menu=>{
              const MenuIcon=menu.icon;
              const children=(menu.children||[]).map(id=>visibleTabs.find(item=>item.id===id)).filter(Boolean);
              const menuActive=menu.id===tab||children.some(item=>item.id===tab);
              const expanded=children.length>0&&(openMenu===menu.id||menuActive);
              return <div className="qmes-sidebar-group" key={menu.id}>
                <button type="button" className={`qmes-sidebar-group-button ${menuActive?"is-active":""}`} onClick={()=>activateMenu(menu)}><MenuIcon size={16}/><span>{menu.label}</span>{children.length>0&&<ChevronRight size={13} className={`qmes-sidebar-chevron ${expanded?"is-open":""}`}/>}</button>
                {expanded&&<div className="qmes-sidebar-children">{children.map(item=>{const ItemIcon=item.icon;return <button type="button" key={item.id} onClick={()=>navigateTab(item.id,menu.id)} className={`qmes-sidebar-child ${tab===item.id?"is-active":""}`}><ItemIcon size={14}/><span>{item.label}</span></button>;})}</div>}
              </div>;
            })}
          </div>
          <div className="qmes-sidebar-footer"><span>QMES</span><span>ERP · MES 통합운영</span></div>
        </aside>

        <section className="qmes-app-content">
          <div className="qmes-page-heading">
            <div>
              <div className="qmes-page-breadcrumb">{currentMenu.label} / {currentTab.label||currentMenu.label}</div>
              <h1>{currentTab.label||currentMenu.label}</h1>
            </div>
            <div className="qmes-page-status">실시간 운영</div>
          </div>
          <main className="qmes-page-main"><Active/></main>
        </section>
      </div>

      {talkOpen&&<NamoTalkTab initialRoom={talkTargetRoom} onClose={()=>setTalkOpen(false)}/>}      
      <NamoTalkNotifier talkOpen={talkOpen} onOpenRoom={roomId=>{setTalkTargetRoom(roomId);setTalkOpen(true);}}/>

      {profileOpen&&<div className="qmes-modal-backdrop" onClick={closeAccountModal} role="dialog" aria-modal="true" aria-label="계정 설정"><div className="qmes-account-modal" onClick={event=>event.stopPropagation()}><div className="qmes-modal-head"><h2>계정 설정</h2><button type="button" onClick={closeAccountModal} aria-label="닫기">×</button></div><button type="button" onClick={openPasswordModal} className="qmes-modal-primary">비밀번호 변경하기</button><button type="button" onClick={handleLogout} className="qmes-modal-danger">로그아웃</button><button type="button" onClick={closeAccountModal} className="qmes-modal-secondary">닫기</button></div></div>}
      {passwordOpen&&<div className="qmes-modal-backdrop" onClick={closePasswordModal} role="dialog" aria-modal="true" aria-label="비밀번호 변경"><form onSubmit={changePassword} className="qmes-password-modal" onClick={event=>event.stopPropagation()}><div className="qmes-modal-head"><h2>비밀번호 변경</h2><button type="button" onClick={closePasswordModal} aria-label="닫기">×</button></div><label>현재 비밀번호<input type="password" value={currentPw} onChange={event=>{setCurrentPw(event.target.value);setPasswordError("");}} autoComplete="current-password"/></label><label>새 비밀번호<input type="password" value={newPw} onChange={event=>{setNewPw(event.target.value);setPasswordError("");}} autoComplete="new-password"/></label><label>새 비밀번호 확인<input type="password" value={confirmPw} onChange={event=>{setConfirmPw(event.target.value);setPasswordError("");}} autoComplete="new-password"/></label>{passwordError&&<div className="qmes-modal-error">{passwordError}</div>}<button type="submit" className="qmes-modal-primary">변경 저장</button><button type="button" onClick={closePasswordModal} className="qmes-modal-secondary">취소</button></form></div>}
    </div>
  );
}
