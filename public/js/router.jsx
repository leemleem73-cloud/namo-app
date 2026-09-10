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
  },[user]);
  return typeof Component==="function"?<Component/>:<div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-sm font-bold text-slate-200">생산공정 관리 화면을 불러오는 중입니다.</div>;
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
  { id:"inv", label:"재고관리", icon:Boxes },
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
function qmesCanAccessCommercialErp(user){
  const name=String(user?.name||"").replace(/\s+/g,"").trim();
  const dept=String(user?.department||user?.dept||"").replace(/\s+/g,"").trim();
  return dept==="영업부"||["김종혁","김세희","정영기"].includes(name);
}
function qmesIsCommercialRestrictedTab(tab){return tab==="erpSales"||tab==="erpPurchase";}
function qmesHeaderUserLabel(user){
  const rawName=String(user?.name||user?.uid||"사용자").replace(/\s+/g,"").trim();
  const name=/^임+흥배$/.test(rawName)?"임흥배":rawName;
  const rawDept=String(user?.department||user?.dept||"").replace(/\s+/g,"").trim();
  const dept=name==="임흥배"?"품질부":rawDept;
  return dept?`${name}(${dept})`:name;
}
function qmesHeaderGeneralAlerts(){
  try{
    if(typeof qmesDashAlerts!=="function")return [];
    const rows=qmesDashAlerts();
    return Array.isArray(rows)?rows.slice(0,6):[];
  }catch(error){return [];}
}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>{
    const saved=safeStorageGet("qmes_current_tab","dash");
    if(qmesIsCommercialRestrictedTab(saved)&&!qmesCanAccessCommercialErp(user))return "dash";
    return saved;
  });
  const [clock,setClock]=useState(new Date());
  const [openMenu,setOpenMenu]=useState(()=>safeStorageGet("qmes_open_menu",null));
  const [noticeOpen,setNoticeOpen]=useState(false);
  const [accountMenuOpen,setAccountMenuOpen]=useState(false);
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
  },[user]);
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
    const handleKeyDown=event=>{
      if(event.key!=="Escape")return;
      if(passwordOpen){setPasswordOpen(false);return;}
      if(accountMenuOpen){setAccountMenuOpen(false);return;}
      if(noticeOpen)setNoticeOpen(false);
    };
    window.addEventListener("keydown",handleKeyDown);return()=>window.removeEventListener("keydown",handleKeyDown);
  },[accountMenuOpen,noticeOpen,passwordOpen]);

  window.__QMES_CURRENT_USER__=user;
  const visibleTabs=TABS.filter(tabItem=>!tabItem.adminOnly||user.role==="admin");
  useEffect(()=>{if(!visibleTabs.some(tabItem=>tabItem.id===tab))setTab("dash");},[tab,visibleTabs.length]);
  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:"auto"});const main=document.querySelector("#root>div>main");if(main)main.scrollTop=0;},[tab]);

  const currentTab=TABS.find(tabItem=>tabItem.id===tab)||TABS[0];
  const commercialDenied=qmesIsCommercialRestrictedTab(tab)&&!qmesCanAccessCommercialErp(user);
  const Active=currentTab.comp;
  const headerUserLabel=qmesHeaderUserLabel(user);
  const headerAlerts=qmesHeaderGeneralAlerts();
  const PermissionDenied=()=>(
    <div style={{minHeight:420,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"min(560px,100%)",background:"#fff",border:"1px solid #dbe3ec",borderRadius:14,padding:"36px 28px",textAlign:"center",boxShadow:"0 10px 30px rgba(15,23,42,.06)"}}>
        <div style={{fontSize:42,lineHeight:1,marginBottom:14}}>🔒</div>
        <div style={{fontSize:20,fontWeight:900,color:"#1f2937",marginBottom:8}}>접근 권한이 없습니다.</div>
        <div style={{fontSize:13,fontWeight:650,color:"#64748b",lineHeight:1.7}}>이 메뉴는 영업부 및 지정된 경영진만 사용할 수 있습니다.</div>
      </div>
    </div>
  );
  const openPasswordModal=()=>{setAccountMenuOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");setPasswordOpen(true);};
  const closePasswordModal=()=>{setPasswordOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");};
  const handleLogout=()=>{setAccountMenuOpen(false);if(typeof onLogout==="function")onLogout();};
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col" style={{fontFamily:"'Pretendard','Noto Sans KR',system-ui,sans-serif"}}>
      <header className="qmes-erp-topbar sticky top-0 z-50" style={{background:"linear-gradient(180deg,#f8fbfd 0%,#e8f1f7 100%)",borderBottom:"1px solid #bfd0dc",boxShadow:"0 2px 5px rgba(47,91,124,.09)"}}>
        <div className="w-full px-4 lg:px-6 flex items-center gap-3" style={{height:58}}>
          <button type="button" className="flex items-center shrink-0 rounded" onClick={()=>{setTab("dash");setOpenMenu(null);}} style={{width:236,height:58,marginLeft:-16,paddingLeft:14,borderRight:"1px solid #cbd8e2",background:"#f8fafb"}}>
            <img src="/assets/namo-header-logo.svg?v=20260903-color1" alt="NAMO Chemical" className="w-auto object-contain" style={{width:190,maxWidth:190,maxHeight:42,filter:"none"}} />
          </button>
          <div className="flex-1" />
          <div className="qmes-header-clock hidden sm:flex items-center gap-2 font-mono tabular-nums" style={{color:"#29485f",fontSize:11.5,fontWeight:700}}><span className="w-2 h-2 rounded-full bg-emerald-500"/><span>{clock.toLocaleTimeString("ko-KR",{hour12:false})}</span></div>
          <div className="relative">
            <button type="button" onClick={()=>{setNoticeOpen(value=>!value);setAccountMenuOpen(false);}} className="relative p-2 rounded" style={{color:"#356f99",background:"#fff",border:"1px solid #bfd0dc"}} aria-label="알림" aria-expanded={noticeOpen}>
              <Bell size={16}/>{headerAlerts.length>0&&<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-white">{headerAlerts.length>99?"99+":headerAlerts.length}</span>}
            </button>
            {noticeOpen&&<div className="absolute right-0 top-[44px] w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl" style={{zIndex:12000}} role="dialog" aria-label="알림 목록">
              <div className="px-3 py-2 text-sm font-black text-slate-800 border-b border-slate-100">알림</div>
              {headerAlerts.length?headerAlerts.map((item,index)=><div key={index} className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{String(item?.text||item?.message||item?.action||"확인 필요")}</div>):<div className="px-3 py-5 text-center text-xs font-bold text-slate-400">새로운 알림이 없습니다.</div>}
            </div>}
          </div>
          <div className="qmes-header-controls flex items-center gap-2">
            <div className="relative" onMouseEnter={()=>setAccountMenuOpen(true)} onMouseLeave={()=>setAccountMenuOpen(false)}>
              <button type="button" onClick={()=>{setAccountMenuOpen(value=>!value);setNoticeOpen(false);}} className="namo-enterprise-user-button flex items-center gap-2 rounded px-3 py-1" style={{background:"#fff",border:"1px solid #bfd0dc",color:"#29485f",height:38,minWidth:150}} aria-label="사용자 메뉴" aria-haspopup="menu" aria-expanded={accountMenuOpen}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{background:"#dfeaf2",color:"#315f7f"}}>{headerUserLabel?.[0]||"사"}</div>
                <div className="hidden md:block whitespace-nowrap namo-enterprise-user-label" style={{fontSize:14,fontWeight:850,lineHeight:1.2,color:"#29485f"}}>{headerUserLabel}</div>
                <span className="hidden md:inline" style={{fontSize:10,color:"#708596"}}>▼</span>
              </button>
              {accountMenuOpen&&<div className="absolute right-0 top-[42px] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{zIndex:13000}} role="menu" aria-label="사용자 메뉴">
                <button type="button" onClick={openPasswordModal} className="w-full h-10 rounded-lg px-3 text-left text-sm font-extrabold text-slate-700 hover:bg-sky-50" role="menuitem">비밀번호 변경</button>
                <button type="button" onClick={handleLogout} className="w-full h-10 rounded-lg px-3 text-left text-sm font-extrabold text-red-600 hover:bg-red-50" role="menuitem">로그아웃</button>
              </div>}
            </div>
            <button type="button" onClick={downloadQmesBackup} className="qmes-header-action px-2 py-1 rounded border">백업</button>
            <button type="button" onClick={restoreQmesBackup} className="qmes-header-action px-2 py-1 rounded border">복원</button>
            {user.role==="admin"&&<button type="button" onClick={()=>{setTab("members");setOpenMenu(null);}} className="qmes-header-action px-2 py-1 rounded border">회원관리</button>}
          </div>
        </div>
        <div className="qmes-top-menu-bar">
          <nav className="qmes-top-menu">
            {TOP_MENUS.map(menu=>{const MenuIcon=menu.icon;const children=(menu.children||[]).map(id=>visibleTabs.find(tabItem=>tabItem.id===id)).filter(Boolean);const direct=!menu.children;const active=direct?tab===menu.id:children.some(item=>item.id===tab);const opened=openMenu===menu.id;return <div key={menu.id} className="qmes-top-menu-item"><button type="button" onClick={()=>{if(direct){setTab(menu.id);setOpenMenu(null);}else{setOpenMenu(opened?null:menu.id);if(!active&&children.length)setTab(children[0].id);}}} className={`qmes-top-menu-button ${active?"is-active":""}`}><MenuIcon size={15}/><span>{menu.label}</span>{!direct&&<ChevronRight size={12} className="qmes-menu-arrow" style={{transform:opened?"rotate(90deg)":"rotate(0deg)"}}/>}</button></div>;})}
          </nav>
          {openMenu&&(()=>{const selected=TOP_MENUS.find(menu=>menu.id===openMenu);const items=(selected?.children||[]).map(id=>visibleTabs.find(tabItem=>tabItem.id===id)).filter(Boolean);if(!items.length)return null;return <div className={`qmes-submenu-row qmes-submenu-${selected.id}`} role="menu"><div className="qmes-submenu-title">{selected.label}</div>{items.map(item=>{const ItemIcon=item.icon;return <button type="button" key={item.id} onClick={()=>setTab(item.id)} className={`qmes-submenu-button ${tab===item.id?"is-active":""}`}><ItemIcon size={14}/><span>{item.label}</span></button>;})}</div>;})()}
        </div>
      </header>
      <main className="w-full px-4 lg:px-6 py-5 flex-1">{commercialDenied?<PermissionDenied/>:<Active/>}</main>

      {passwordOpen&&<div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 p-4" onClick={closePasswordModal} role="dialog" aria-modal="true" aria-label="비밀번호 변경"><form onSubmit={changePassword} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between mb-5"><h2 className="text-xl font-black text-white">비밀번호 변경</h2><button type="button" onClick={closePasswordModal} className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800" aria-label="닫기">×</button></div><label className="block text-sm font-bold mb-2">현재 비밀번호</label><input type="password" value={currentPw} onChange={event=>{setCurrentPw(event.target.value);setPasswordError("");}} autoComplete="current-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500"/><label className="block text-sm font-bold mt-4 mb-2">새 비밀번호</label><input type="password" value={newPw} onChange={event=>{setNewPw(event.target.value);setPasswordError("");}} autoComplete="new-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500"/><label className="block text-sm font-bold mt-4 mb-2">새 비밀번호 확인</label><input type="password" value={confirmPw} onChange={event=>{setConfirmPw(event.target.value);setPasswordError("");}} autoComplete="new-password" className="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 outline-none focus:border-sky-500"/>{passwordError&&<div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400">{passwordError}</div>}<button type="submit" className="mt-6 w-full h-11 rounded-xl bg-sky-600 font-black text-white hover:bg-sky-500">변경 저장</button><button type="button" onClick={closePasswordModal} className="mt-3 w-full h-11 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800">취소</button></form></div>}
    </div>
  );
}