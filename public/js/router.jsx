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
  { id:"talk", label:"NAMO Talk", icon:MessageSquareWarning, comp:NamoTalkTab },
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
  try { const v=localStorage.getItem(key); return v==null?fallback:v; }
  catch(e){ console.warn(`[QMES] localStorage 읽기 실패: ${key}`,e); return fallback; }
}
function safeStorageSet(key,value){
  try { localStorage.setItem(key,value); return true; }
  catch(e){ console.warn(`[QMES] localStorage 저장 실패: ${key}`,e); return false; }
}
function safeStorageRemove(key){
  try { localStorage.removeItem(key); }
  catch(e){ console.warn(`[QMES] localStorage 삭제 실패: ${key}`,e); }
}

function QMESChemical({user,onLogout}){
  const [tab,setTab]=useState(()=>safeStorageGet("qmes_current_tab","dash"));
  const [clock,setClock]=useState(new Date());
  const [openMenu,setOpenMenu]=useState(()=>safeStorageGet("qmes_open_menu",null));

  useEffect(()=>{
    safeStorageSet("qmes_current_tab",tab);
  },[tab]);
  useEffect(()=>{
    window.__QMES_CURRENT_USER__=user;
    window.__QMES_USER__=user?.name||"";
  },[user]);
  useEffect(()=>{
    if(openMenu) safeStorageSet("qmes_open_menu",openMenu);
    else safeStorageRemove("qmes_open_menu");
  },[openMenu]);
  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return()=>clearInterval(t); },[]);

  const visibleTabs=TABS.filter(t=>!t.adminOnly||user.role==="admin");
  useEffect(()=>{ if(!visibleTabs.some(t=>t.id===tab)) setTab("dash"); },[tab,visibleTabs.length]);
  const currentTab=TABS.find(t=>t.id===tab)||TABS[0];
  const Active=currentTab.comp;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" style={{fontFamily:"'Pretendard','Noto Sans KR',system-ui,sans-serif"}}>
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 backdrop-blur">
        <div className="w-full px-4 lg:px-6 py-3 flex items-center gap-4">
          <button type="button" className="flex items-center shrink-0 rounded" onClick={()=>{setTab("dash");setOpenMenu(null);}}>
            <img src="https://namochemical.com/img/svg/img_logo.svg" alt="NAMO Chemical" className="h-[22px] md:h-[26px] w-auto max-w-[262px] object-contain" style={{filter:"brightness(0) invert(1)"}} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.style.filter="none";e.currentTarget.src="/assets/namo-header-logo.svg?v=20260727-3";}} />
          </button>
          <div className="flex-1" />
          <div className="qmes-header-clock hidden sm:flex items-center gap-2 font-mono tabular-nums"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><span>{clock.toLocaleTimeString("ko-KR",{hour12:false})}</span></div>
          <button className="relative p-2 rounded hover:bg-slate-800" aria-label="알림"><Bell size={16}/><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400"/></button>
          <div className="qmes-header-controls flex items-center gap-2">
            <button onClick={()=>{setTab("talk");setOpenMenu(null);}} className={`qmes-header-action px-3 py-1.5 rounded border font-semibold flex items-center gap-1.5 ${tab==="talk"?"border-sky-500/60 text-sky-300 bg-sky-500/10":"border-sky-500/40 text-sky-300 hover:bg-sky-500/10"}`} title="NAMO Talk 열기"><MessageSquareWarning size={14}/><span>NAMO Talk</span></button>
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">{user.name[0]}</div>
            <div className="hidden md:block leading-tight"><div className="qmes-header-user-name">{user.name}</div><div className="qmes-header-user-meta">{user.dept} · <span className="font-mono">{user.uid||"U-0000"}</span></div></div>
            <button onClick={downloadQmesBackup} className="qmes-header-action px-2 py-1 rounded border border-slate-700">백업</button>
            <button onClick={restoreQmesBackup} className="qmes-header-action px-2 py-1 rounded border border-slate-700">복원</button>
            {user.role==="admin"&&<button onClick={()=>{setTab("members");setOpenMenu(null);}} className={`qmes-header-action px-2 py-1 rounded border ${tab==="members"?"border-sky-500/60 text-sky-300 bg-sky-500/10":"border-slate-700 text-slate-400"}`}>회원관리</button>}
            {onLogout&&<button onClick={onLogout} className="qmes-header-action px-2 py-1 rounded border border-slate-700">로그아웃</button>}
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
            return <div className="qmes-submenu-row" role="menu"><div className="qmes-submenu-title">{selected.label}</div>{items.map(item=>{const I=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={`qmes-submenu-button ${tab===item.id?"is-active":""}`}><I size={14}/><span>{item.label}</span></button>;})}</div>;
          })()}
        </div>
      </header>
      <main className="w-full px-4 lg:px-6 py-5 flex-1"><Active/></main>
    </div>
  );
}
