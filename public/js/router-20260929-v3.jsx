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
  const allowed=[];
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
      return;
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
  { id:"eq", label:"설비 모니터링", icon:Cpu, comp:EquipmentTab },
  { id:"trace", label:"Lot 추적", icon:GitBranch, comp:TraceTab },
  { id:"spc", label:"SPC (Cpk)", icon:BarChart3, comp:SpcTab },
  { id:"4m", label:"4M 변경관리", icon:Repeat, comp:FourMTab },
  { id:"ncr", label:"부적합 (8D)", icon:ShieldAlert, comp:NcrTab },
  { id:"cc", label:"고객불만 (GQMS)", icon:MessageSquareWarning, comp:ComplaintTab },
  { id:"coa", label:"출하성적서", icon:Printer, comp:CoaTab },
  { id:"msa", label:"MSA / GRR 관리", icon:Gauge, comp:window.QMESMsaTab },
  { id:"calibration", label:"계측기 교정관리", icon:Wrench, comp:window.QMESCalibrationTab },
  { id:"standards", label:"기준서 / 매뉴얼", icon:FileText, comp:window.QMESStandardsTab },
  { id:"members", label:"회원 관리", icon:Users, comp:MembersTab, adminOnly:true },
];

const TOP_MENUS = [
  { id:"dash", label:"대시보드", icon:LayoutDashboard },
  { id:"productionMenu", label:"생산관리", icon:FlaskConical, children:["prod","woIssue","prodProcess"] },
  { id:"qualityMenu", label:"품질검사", icon:ClipboardCheck, children:["iqc","pqc","oqc","spc","lock","coa","msa","calibration","standards"] },
  { id:"pop", label:"현장입력", icon:Tablet },
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
  // Legacy department/name restriction removed. ERP access is controlled by the
  // administrator access-permission layer (qmes-access-permissions-20260910.js).
  return true;
}
function qmesIsCommercialRestrictedTab(tab){return tab==="erpSales"||tab==="erpPurchase";}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>{
    const saved=safeStorageGet("qmes_current_tab","dash");
    if(!TABS.some(item=>item.id===saved))return "dash";
    if(qmesIsCommercialRestrictedTab(saved)&&!qmesCanAccessCommercialErp(user))return "dash";
    return saved;
  });
  const [clock,setClock]=useState(new Date());
  const [openMenu,setOpenMenu]=useState(()=>safeStorageGet("qmes_open_menu",null));
  const [accountOpen,setAccountOpen]=useState(false);
  const [passwordOpen,setPasswordOpen]=useState(false);
  const [currentPw,setCurrentPw]=useState("");
  const [newPw,setNewPw]=useState("");
  const [confirmPw,setConfirmPw]=useState("");
  const [passwordError,setPasswordError]=useState("");
  const [passwordSaving,setPasswordSaving]=useState(false);
  const accountRef=React.useRef(null);
  const accountCloseTimer=React.useRef(null);

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
      if(!["IQC","PQC","OQC"].includes(mode))return;
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
    const keyHandler=event=>{
      if(event.key!=="Escape")return;
      setAccountOpen(false);
      if(passwordOpen)closePasswordModal();
    };
    const outsideHandler=event=>{
      if(accountRef.current&&!accountRef.current.contains(event.target))setAccountOpen(false);
    };
    window.addEventListener("keydown",keyHandler);
    document.addEventListener("mousedown",outsideHandler,true);
    return()=>{window.removeEventListener("keydown",keyHandler);document.removeEventListener("mousedown",outsideHandler,true);};
  },[passwordOpen]);

  window.__QMES_CURRENT_USER__=user;
  const visibleTabs=TABS.filter(tabItem=>!tabItem.adminOnly||user.role==="admin");
  useEffect(()=>{if(!visibleTabs.some(tabItem=>tabItem.id===tab))setTab("dash");},[tab,visibleTabs.length]);
  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:"auto"});const main=document.querySelector("#root>div>main");if(main)main.scrollTop=0;},[tab]);

  const currentTab=TABS.find(tabItem=>tabItem.id===tab)||TABS[0];
  const commercialDenied=qmesIsCommercialRestrictedTab(tab)&&!qmesCanAccessCommercialErp(user);
  const Active=currentTab.comp;
  const PermissionDenied=()=>(
    <div style={{minHeight:420,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"min(560px,100%)",background:"#fff",border:"1px solid #dbe3ec",borderRadius:14,padding:"36px 28px",textAlign:"center",boxShadow:"0 10px 30px rgba(15,23,42,.06)"}}>
        <div style={{fontSize:42,lineHeight:1,marginBottom:14}}>🔒</div>
        <div style={{fontSize:20,fontWeight:900,color:"#1f2937",marginBottom:8}}>접근 권한이 없습니다.</div>
        <div style={{fontSize:13,fontWeight:650,color:"#64748b",lineHeight:1.7}}>관리자가 설정한 접근권한에 따라 사용할 수 있습니다.</div>
      </div>
    </div>
  );

  const displayUserName=String(user?.name||"").trim()==="임임흥배"?"임흥배":String(user?.name||"").trim();
  const displayDept=String(user?.dept||user?.department||"").trim();

  function closePasswordModal(){
    setPasswordOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");setPasswordSaving(false);
  }
  function openPasswordModal(){
    setAccountOpen(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPasswordError("");setPasswordOpen(true);
  }
  async function changePassword(event){
    event.preventDefault();
    if(passwordSaving)return;
    if(!currentPw){setPasswordError("현재 비밀번호를 입력해 주세요.");return;}
    if(newPw.length<4){setPasswordError("새 비밀번호는 4자 이상 입력해 주세요.");return;}
    if(newPw!==confirmPw){setPasswordError("새 비밀번호 확인이 일치하지 않습니다.");return;}
    if(currentPw===newPw){setPasswordError("현재 비밀번호와 다른 비밀번호를 입력해 주세요.");return;}
    setPasswordSaving(true);setPasswordError("");
    try{
      const response=await fetch("/api/auth/password",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:currentPw,newPassword:newPw})});
      const payload=await response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
      if(!response.ok||!payload.success){setPasswordError(payload.message||"비밀번호 변경에 실패했습니다.");return;}
      closePasswordModal();
      alert("비밀번호가 변경되었습니다.");
    }catch(error){
      console.error("[QMES] 비밀번호 변경 실패",error);
      setPasswordError("비밀번호 변경 중 오류가 발생했습니다.");
    }finally{
      setPasswordSaving(false);
    }
  }
  const openAccountHover=()=>{if(accountCloseTimer.current){clearTimeout(accountCloseTimer.current);accountCloseTimer.current=null;}setAccountOpen(true);};
  const closeAccountHover=()=>{if(accountCloseTimer.current)clearTimeout(accountCloseTimer.current);accountCloseTimer.current=setTimeout(()=>setAccountOpen(false),220);};
  const runLogout=()=>{setAccountOpen(false);if(typeof onLogout==="function")onLogout();};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col" style={{fontFamily:"'Pretendard','Noto Sans KR',system-ui,sans-serif"}}>
      <header className="qmes-erp-topbar sticky top-0 z-50" style={{background:"linear-gradient(180deg,#f8fbfd 0%,#e8f1f7 100%)",borderBottom:"1px solid #bfd0dc",boxShadow:"0 2px 5px rgba(47,91,124,.09)"}}>
        <div className="w-full px-4 lg:px-6 flex items-center gap-3" style={{height:58}}>
          <button type="button" className="flex items-center shrink-0 rounded" onClick={()=>{setTab("dash");setOpenMenu(null);}} style={{width:236,height:58,marginLeft:-16,paddingLeft:14,borderRight:"1px solid #cbd8e2",background:"#f8fafb"}}>
            <img src="/assets/namo-header-logo.svg?v=20260903-color1" alt="NAMO Chemical" className="w-auto object-contain" style={{width:190,maxWidth:190,maxHeight:42,filter:"none"}} />
          </button>
          <div className="flex-1" />
          <div className="qmes-header-clock hidden sm:flex items-center gap-2 font-mono tabular-nums" style={{color:"#29485f",fontSize:11.5,fontWeight:700}}><span className="w-2 h-2 rounded-full bg-emerald-500"/><span>{clock.toLocaleTimeString("ko-KR",{hour12:false})}</span></div>
          <div className="qmes-header-controls flex items-center gap-2">
            <div className="qauth-account" ref={accountRef} onMouseEnter={openAccountHover} onMouseLeave={closeAccountHover}>
              <button type="button" className="qauth-account-button" onClick={()=>setAccountOpen(open=>!open)} aria-haspopup="menu" aria-expanded={accountOpen}>
                <span className="qauth-account-avatar">{(displayUserName||"U").slice(0,1)}</span>
                <span className="qauth-account-label">{displayUserName}{displayDept?" ("+displayDept+")":""}</span>
                <span className="qauth-account-caret">▾</span>
              </button>
              {accountOpen&&<div className="qauth-account-menu" role="menu">
                <div className="qauth-account-summary"><b>{displayUserName||"사용자"}</b><span>{[displayDept,user?.position||user?.title].filter(Boolean).join(" · ")||"QMES 사용자"}</span></div>
                <button type="button" role="menuitem" onClick={openPasswordModal}>비밀번호 변경</button>
                <button type="button" role="menuitem" className="danger" onClick={runLogout}>로그아웃</button>
              </div>}
            </div>
            <button type="button" onClick={downloadQmesBackup} className="qmes-header-action px-2 py-1 rounded border">백업</button>
            <button type="button" onClick={restoreQmesBackup} className="qmes-header-action px-2 py-1 rounded border">복원</button>
            {user.role==="admin"&&<button type="button" onClick={()=>{setTab("members");setOpenMenu(null);}} className="qmes-header-action px-2 py-1 rounded border">회원관리</button>}
          </div>
        </div>
        <div className="qmes-top-menu-bar">
          <nav className="qmes-top-menu">
            {TOP_MENUS.map(menu=>{const MenuIcon=menu.icon;const children=(menu.children||[]).map(id=>visibleTabs.find(tabItem=>tabItem.id===id)).filter(Boolean);const direct=!menu.children;const active=direct?tab===menu.id:children.some(item=>item.id===tab);const opened=openMenu===menu.id;return <div key={menu.id} className="qmes-top-menu-item"><button type="button" onClick={()=>{if(direct){setTab(menu.id);setOpenMenu(null);}else{setOpenMenu(opened?null:menu.id);if(!active&&children.length)setTab(children[0].id);}}} className={"qmes-top-menu-button "+(active?"is-active":"")}><MenuIcon size={15}/><span>{menu.label}</span>{!direct&&<ChevronRight size={12} className="qmes-menu-arrow" style={{transform:opened?"rotate(90deg)":"rotate(0deg)"}}/>}</button></div>;})}
          </nav>
          {openMenu&&(()=>{const selected=TOP_MENUS.find(menu=>menu.id===openMenu);const items=(selected?.children||[]).map(id=>visibleTabs.find(tabItem=>tabItem.id===id)).filter(Boolean);if(!items.length)return null;return <div className={"qmes-submenu-row qmes-submenu-"+selected.id} role="menu"><div className="qmes-submenu-title">{selected.label}</div>{items.map(item=>{const ItemIcon=item.icon;return <button type="button" key={item.id} onClick={()=>setTab(item.id)} className={"qmes-submenu-button "+(tab===item.id?"is-active":"")}><ItemIcon size={14}/><span>{item.label}</span></button>;})}</div>;})()}
        </div>
      </header>
      <main className="w-full px-4 lg:px-6 py-5 flex-1">{commercialDenied?<PermissionDenied/>:<Active/>}</main>

      {passwordOpen&&<div className="qauth-modal-backdrop" role="dialog" aria-modal="true" aria-label="비밀번호 변경 창" onMouseDown={event=>{if(event.target===event.currentTarget)closePasswordModal();}}>
        <form className="qauth-password-card" onSubmit={changePassword}>
          <div className="qauth-password-head"><div><b>비밀번호 변경</b><span>현재 비밀번호 확인 후 새 비밀번호를 설정합니다.</span></div><button type="button" aria-label="닫기" onClick={closePasswordModal}>×</button></div>
          <label>현재 비밀번호<input type="password" value={currentPw} onChange={event=>{setCurrentPw(event.target.value);setPasswordError("");}} autoComplete="current-password" autoFocus /></label>
          <label>새 비밀번호<input type="password" value={newPw} onChange={event=>{setNewPw(event.target.value);setPasswordError("");}} autoComplete="new-password" /></label>
          <label>새 비밀번호 확인<input type="password" value={confirmPw} onChange={event=>{setConfirmPw(event.target.value);setPasswordError("");}} autoComplete="new-password" /></label>
          {passwordError&&<div className="qauth-error">{passwordError}</div>}
          <div className="qauth-password-actions"><button type="button" className="secondary" onClick={closePasswordModal}>취소</button><button type="submit" className="primary" disabled={passwordSaving}>{passwordSaving?"변경 중...":"변경 저장"}</button></div>
        </form>
      </div>}
    </div>
  );
}
