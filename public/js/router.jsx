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
  return typeof Component==="function"?<Component/>:<div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">생산공정 관리 화면을 불러오는 중입니다.</div>;
}

function qmesSavedInventorySection(){
  const allowed=["overview","movement","lot","production","count"];
  try{
    const saved=sessionStorage.getItem("qmes_inventory_section")||"overview";
    return allowed.includes(saved)?saved:"overview";
  }catch(error){return "overview";}
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

const TABS = [
  { id:"dash", label:"종합 대시보드", icon:LayoutDashboard, comp:DashboardTab },
  { id:"pop", label:"현장 입력 (iPad)", icon:Tablet, comp:FieldInputTab },
  { id:"iqc", label:"수입검사 (IQC)", icon:ArrowDownToLine, comp:IqcTab },
  { id:"prod", label:"생산 (배치)", icon:FlaskConical, comp:ProductionTab },
  { id:"wo", label:"", icon:ClipboardList, comp:WoDocTab },
  { id:"woIssue", label:"작업지시서", icon:Plus, comp:IssueWoTab },
  { id:"prodProcess", label:"생산공정 관리", icon:FlaskConical, comp:typeof window.ProductionProcessTab==="function"?window.ProductionProcessTab:QMESProductionProcessRoute },
  { id:"pqc", label:"공정검사 (PQC)", icon:ClipboardCheck, comp:PqcTab },
  { id:"oqc", label:"출하검사 (OQC)", icon:ArrowUpFromLine, comp:OqcTab },
  { id:"lock", label:"품질 인터락 (차단)", icon:Lock, comp:InterlockTab },
  { id:"partners", label:"거래처 현황", icon:Users, comp:PartnersTab },
  { id:"eq", label:"설비 모니터링", icon:Cpu, comp:EquipmentTab },
  { id:"inv", label:"재고관리", icon:Boxes, comp:QMESInventoryRoute },
  { id:"trace", label:"LOT 추적", icon:GitBranch, comp:TraceTab },
  { id:"spc", label:"SPC (Cpk)", icon:BarChart3, comp:SpcTab },
  { id:"4m", label:"4M 변경관리", icon:Repeat, comp:FourMTab },
  { id:"ncr", label:"부적합 (8D)", icon:ShieldAlert, comp:NcrTab },
  { id:"cc", label:"고객불만 (GQMS)", icon:MessageSquareWarning, comp:ComplaintTab },
  { id:"coa", label:"출하성적서", icon:Printer, comp:CoaTab },
  { id:"members", label:"회원정보 관리", icon:Users, comp:MembersTab, adminOnly:true },
];

/* Kept only for compatibility with older modules that check this symbol.
   The native shell does not render a top business menu. */
const TOP_MENUS = [];

const QMES_NATIVE_GROUPS=[
  {id:"workspace",label:"WORKSPACE",items:["dash","pop"]},
  {id:"erp",label:"ERP",items:["erpSales","erpPlan","erpPurchase","erpShipping","inv","partners"]},
  {id:"mesqms",label:"MES · QMS",items:["woIssue","prod","prodProcess","iqc","pqc","oqc","coa","trace","eq","spc","lock","ncr","cc","4m"]},
  {id:"system",label:"SYSTEM",items:["members"],adminOnly:true},
];

function safeStorageGet(key, fallback=null){
  try{const value=sessionStorage.getItem(key);return value==null?fallback:value;}catch(error){return fallback;}
}
function safeStorageSet(key,value){try{sessionStorage.setItem(key,value);return true;}catch(error){return false;}}
function qmesProcessCleanNavigation(value){return String(value==null?"":value).trim();}
function qmesNativeDateText(date){
  const d=date instanceof Date?date:new Date(date);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}.${m}.${day}`;
}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>{
    const saved=safeStorageGet("qmes_current_tab","dash");
    return saved==="namoTalk"?"dash":saved;
  });
  const [clock,setClock]=useState(new Date());
  const [sidebarOpen,setSidebarOpen]=useState(()=>safeStorageGet("qmes_native_sidebar_open","1")!=="0");
  const [searchText,setSearchText]=useState("");
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
  useEffect(()=>{safeStorageSet("qmes_native_sidebar_open",sidebarOpen?"1":"0");},[sidebarOpen]);
  useEffect(()=>{safeStorageSet("qmes_namo_talk_open",talkOpen?"1":"0");},[talkOpen]);
  useEffect(()=>{
    const handleTabNavigation=event=>{
      const nextTab=qmesProcessCleanNavigation(event?.detail?.tab);
      if(!nextTab||!TABS.some(item=>item.id===nextTab))return;
      setTab(nextTab);
    };
    window.addEventListener("qmes:navigate-tab",handleTabNavigation);
    return()=>window.removeEventListener("qmes:navigate-tab",handleTabNavigation);
  },[]);
  useEffect(()=>{
    const updateUnread=event=>setNamoUnread(Math.max(0,Number(event.detail?.count||0)));
    window.addEventListener("namo-talk-unread",updateUnread);
    return()=>window.removeEventListener("namo-talk-unread",updateUnread);
  },[]);
  useEffect(()=>{
    const handleFieldShortcut=event=>{
      const mode=String(event?.detail?.mode||"").toUpperCase();
      if(!["IQC","PQC","OQC"].includes(mode))return;
      try{sessionStorage.setItem("qmes_field_shortcut_mode",mode);}catch(error){}
      setTab("pop");
    };
    window.__QMES_FIELD_NAVIGATION_READY__=true;
    window.addEventListener("qmes:open-field-inspection",handleFieldShortcut);
    return()=>{window.removeEventListener("qmes:open-field-inspection",handleFieldShortcut);window.__QMES_FIELD_NAVIGATION_READY__=false;};
  },[]);
  useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const handleKeyDown=event=>{
      if(event.key!=="Escape")return;
      if(passwordOpen){setPasswordOpen(false);return;}
      if(profileOpen){setProfileOpen(false);return;}
      if(window.innerWidth<=980&&sidebarOpen)setSidebarOpen(false);
    };
    window.addEventListener("keydown",handleKeyDown);
    return()=>window.removeEventListener("keydown",handleKeyDown);
  },[profileOpen,passwordOpen,sidebarOpen]);

  window.__QMES_CURRENT_USER__=user;
  window.__QMES_CLOSE_NAMO_TALK__=()=>setTalkOpen(false);
  const visibleTabs=TABS.filter(tabItem=>!tabItem.adminOnly||user.role==="admin");
  useEffect(()=>{if(!visibleTabs.some(tabItem=>tabItem.id===tab))setTab("dash");},[tab,visibleTabs.length]);

  const currentTab=visibleTabs.find(tabItem=>tabItem.id===tab)||visibleTabs[0]||TABS[0];
  const Active=currentTab.comp;
  const visibleGroups=QMES_NATIVE_GROUPS
    .filter(group=>!group.adminOnly||user.role==="admin")
    .map(group=>({...group,items:group.items.map(id=>visibleTabs.find(item=>item.id===id)).filter(Boolean)}))
    .filter(group=>group.items.length>0);
  const currentGroup=visibleGroups.find(group=>group.items.some(item=>item.id===currentTab.id));

  const navigate=next=>{
    if(!next||!visibleTabs.some(item=>item.id===next))return;
    setTab(next);
    if(window.innerWidth<=980)setSidebarOpen(false);
  };
  const submitSearch=event=>{
    event?.preventDefault?.();
    const query=String(searchText||"").trim().toLowerCase();
    if(!query)return;
    const match=visibleTabs.find(item=>String(item.label||"").toLowerCase().includes(query));
    if(match){navigate(match.id);setSearchText("");return;}
    alert("일치하는 메뉴를 찾지 못했습니다.");
  };
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
    <div className={`qmes-native-shell ${sidebarOpen?"":"is-sidebar-closed"}`}>
      <div className="qmes-native-header">
        <div className="qmes-native-brand">
          <button type="button" className="qmes-native-brand-button" onClick={()=>navigate("dash")} aria-label="종합 대시보드로 이동">
            <img src="https://namochemical.com/img/svg/img_logo.svg" alt="NAMO Chemical" onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src="/assets/namo-header-logo.svg?v=20260731-white2";}} />
          </button>
        </div>
        <div className="qmes-native-topbar">
          <button type="button" className="qmes-native-hamburger" onClick={()=>setSidebarOpen(value=>!value)} aria-label={sidebarOpen?"왼쪽 메뉴 닫기":"왼쪽 메뉴 열기"}>☰</button>
          <form className="qmes-native-search" onSubmit={submitSearch} role="search">
            <input value={searchText} onChange={event=>setSearchText(event.target.value)} placeholder="메뉴, 발주번호, LOT, 거래처 통합검색" aria-label="통합검색" />
            <span className="qmes-native-search-icon"><Search size={17}/></span>
          </form>
          <div className="qmes-native-top-spacer" />
          <div className="qmes-native-date">기준일&nbsp;&nbsp;{qmesNativeDateText(clock)}</div>
          <button type="button" className="qmes-native-bell" onClick={()=>{setTalkTargetRoom("");setTalkOpen(true);}} aria-label={`NAMO Talk 알림 ${namoUnread}건`}>
            <Bell size={18}/>{namoUnread>0&&<span className="qmes-native-badge">{namoUnread>99?"99+":namoUnread}</span>}
          </button>
          <button type="button" className="qmes-native-user" onClick={()=>setProfileOpen(true)} aria-label="계정 설정 열기" aria-expanded={profileOpen}>
            <span className="qmes-native-avatar">{user.name?.[0]||"사"}</span>
            <span className="qmes-native-user-copy"><strong>{user.name||"사용자"}</strong><small>{user.dept||user.position||""}</small></span>
            <span className="qmes-native-user-arrow">▼</span>
          </button>
        </div>
      </div>

      <div className="qmes-native-body">
        <aside className="qmes-native-sidebar" aria-label="업무 메뉴">
          <div className="qmes-native-company">
            <div className="qmes-native-company-row"><strong>(주)나모케미칼</strong><span className="qmes-native-company-status">정상운영</span></div>
            <small>ERP · MES 통합운영</small>
          </div>
          {visibleGroups.map((group,index)=><React.Fragment key={group.id}>
            {index>0&&<div className="qmes-native-divider"/>}
            <section className="qmes-native-group">
              <div className="qmes-native-group-title">{group.label}</div>
              {group.items.map(item=>{const ItemIcon=item.icon;return <button type="button" key={item.id} className={`qmes-native-item ${tab===item.id?"is-active":""}`} onClick={()=>navigate(item.id)} title={item.label}>
                <span className="qmes-native-item-icon"><ItemIcon size={16}/></span><span className="qmes-native-item-label">{item.label}</span>
              </button>;})}
            </section>
          </React.Fragment>)}
        </aside>
        <div className="qmes-native-shade" onClick={()=>setSidebarOpen(false)} aria-hidden="true" />
        <main className="qmes-native-content">
          <div className="qmes-native-pagehead">
            <div className="qmes-native-pagecopy">
              <div className="qmes-native-breadcrumb">NAMO ONE <span>›</span> {currentGroup?.label||"WORKSPACE"} <span>›</span> {currentTab.label}</div>
              <h1>{currentTab.label}</h1>
            </div>
            <div className="qmes-native-pageactions">
              <button type="button" onClick={()=>window.location.reload()}>새로고침</button>
              <button type="button" onClick={()=>window.print()}>화면 인쇄</button>
            </div>
          </div>
          <div className="qmes-native-view"><Active/></div>
        </main>
      </div>

      {talkOpen&&<NamoTalkTab initialRoom={talkTargetRoom} onClose={()=>setTalkOpen(false)}/>}      
      <NamoTalkNotifier talkOpen={talkOpen} onOpenRoom={roomId=>{setTalkTargetRoom(roomId);setTalkOpen(true);}}/>

      {profileOpen&&<div className="qmes-native-modal-backdrop" onClick={closeAccountModal} role="dialog" aria-modal="true" aria-label="계정 설정"><div className="qmes-native-modal" onClick={event=>event.stopPropagation()}><div className="qmes-native-modal-head"><h2>계정 설정</h2><button type="button" className="qmes-native-modal-close" onClick={closeAccountModal} aria-label="닫기">×</button></div><div className="qmes-native-modal-body"><button type="button" onClick={openPasswordModal} className="qmes-native-modal-primary">비밀번호 변경하기</button><button type="button" onClick={handleLogout} className="qmes-native-modal-danger">로그아웃</button><button type="button" onClick={closeAccountModal} className="qmes-native-modal-secondary">닫기</button></div></div></div>}
      {passwordOpen&&<div className="qmes-native-modal-backdrop" onClick={closePasswordModal} role="dialog" aria-modal="true" aria-label="비밀번호 변경"><form onSubmit={changePassword} className="qmes-native-modal" onClick={event=>event.stopPropagation()}><div className="qmes-native-modal-head"><h2>비밀번호 변경</h2><button type="button" className="qmes-native-modal-close" onClick={closePasswordModal} aria-label="닫기">×</button></div><div className="qmes-native-modal-body"><label className="qmes-native-field">현재 비밀번호<input type="password" value={currentPw} onChange={event=>{setCurrentPw(event.target.value);setPasswordError("");}} autoComplete="current-password"/></label><label className="qmes-native-field">새 비밀번호<input type="password" value={newPw} onChange={event=>{setNewPw(event.target.value);setPasswordError("");}} autoComplete="new-password"/></label><label className="qmes-native-field">새 비밀번호 확인<input type="password" value={confirmPw} onChange={event=>{setConfirmPw(event.target.value);setPasswordError("");}} autoComplete="new-password"/></label>{passwordError&&<div className="qmes-native-error">{passwordError}</div>}<button type="submit" className="qmes-native-modal-primary" style={{marginTop:18}}>변경 저장</button><button type="button" onClick={closePasswordModal} className="qmes-native-modal-secondary">취소</button></div></form></div>}
    </div>
  );
}
