/* QMES module: router — extracted from index.html without logic changes. */

const TABS = [
  { id: "dash", label: "종합 대시보드", icon: LayoutDashboard, comp: DashboardTab },
  { id: "pop", label: "현장 입력 (iPad)", icon: Tablet, comp: FieldInputTab },
  { id: "iqc", label: "수입검사 (IQC)", icon: ArrowDownToLine, comp: IqcTab },
  { id: "prod", label: "생산 (배치)", icon: FlaskConical, comp: ProductionTab },
  { id: "wo", label: "", icon: ClipboardList, comp: WoDocTab },
  { id: "woIssue", label: "작업지시서", icon: Plus, comp: IssueWoTab },
  { id: "pqc", label: "공정검사 (PQC)", icon: ClipboardCheck, comp: PqcTab },
  { id: "oqc", label: "출하검사 (OQC)", icon: ArrowUpFromLine, comp: OqcTab },
  { id: "lock", label: "품질 인터락 (차단)", icon: Lock, comp: InterlockTab },
  { id: "inv", label: "원재료 재고", icon: Package, comp: InventoryTab },
  { id: "partners", label: "거래처 현황", icon: Users, comp: PartnersTab },
  { id: "eq", label: "설비 모니터링", icon: Cpu, comp: EquipmentTab },
  { id: "trace", label: "Lot 추적", icon: GitBranch, comp: TraceTab },
  { id: "spc", label: "SPC (Cpk)", icon: BarChart3, comp: SpcTab },
  { id: "4m", label: "4M 변경관리", icon: Repeat, comp: FourMTab },
  { id: "ncr", label: "부적합 (8D)", icon: ShieldAlert, comp: NcrTab },
  { id: "cc", label: "고객불만 (GQMS)", icon: MessageSquareWarning, comp: ComplaintTab },
  { id: "coa", label: "출하성적서", icon: Printer, comp: CoaTab },
  { id: "members", label: "회원 관리", icon: Users, comp: MembersTab, adminOnly: true },
];

const TOP_MENUS = [
  { id: "dash", label: "대시보드", icon: LayoutDashboard },
  {
    id: "productionMenu", label: "생산관리", icon: FlaskConical,
    children: ["prod", "woIssue"],
  },
  {
    id: "qualityMenu", label: "품질검사", icon: ClipboardCheck,
    children: ["iqc", "pqc", "oqc", "spc", "lock", "coa"],
  },
  { id: "pop", label: "현장입력", icon: Tablet },
  { id: "inv", label: "재고관리", icon: Package },
  { id: "partners", label: "거래처 현황", icon: Users },
  { id: "eq", label: "설비관리", icon: Cpu },
  { id: "trace", label: "LOT 추적", icon: GitBranch },
  {
    id: "nonconformityMenu", label: "부적합관리", icon: ShieldAlert,
    children: ["ncr", "cc", "4m"],
  },
];

function safeStorageGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch (error) {
    console.warn(`[QMES] localStorage 읽기 실패: ${key}`, error);
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[QMES] localStorage 저장 실패: ${key}`, error);
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[QMES] localStorage 삭제 실패: ${key}`, error);
  }
}

function QMESChemical({ user, onLogout }) {
  const [tab, setTab] = useState(() => safeStorageGet("qmes_current_tab", "dash"));
  useEffect(() => {
    safeStorageSet("qmes_current_tab", tab);
  }, [tab]);

  const [clock, setClock] = useState(new Date());
  const [openMenu, setOpenMenu] = useState(() => safeStorageGet("qmes_open_menu", null));
  useEffect(() => {
    if (openMenu) safeStorageSet("qmes_open_menu", openMenu);
    else safeStorageRemove("qmes_open_menu");
  }, [openMenu]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const visibleTabs = TABS.filter((t) => !t.adminOnly || user.role === "admin");
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab("dash");
  }, [tab, visibleTabs.length]);

  const currentTab = TABS.find((t) => t.id === tab) || TABS[0];
  const Active = currentTab.comp;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" style={{ fontFamily: "'Pretendard', 'Noto Sans KR', system-ui, sans-serif" }}>
      {/* 상단 헤더 + 전체 가로 메뉴 */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 backdrop-blur">
        <div className="w-full px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            type="button"
            className="flex items-center shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="대시보드 메인으로 이동"
            title="대시보드 메인"
            onClick={() => {
              setTab("dash");
              setOpenMenu(null);
            }}
          >
            <img
              src="https://namochemical.com/img/svg/img_logo.svg"
              alt="NAMO Chemical"
              className="h-[22px] md:h-[26px] w-auto max-w-[220px] md:max-w-[262px] object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.filter = "none";
                e.currentTarget.src = "/assets/namo-header-logo.svg?v=20260727-3";
              }}
            />
          </button>

          <div className="flex-1" />

          <div className="qmes-header-clock hidden sm:flex items-center gap-2 font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{clock.toLocaleTimeString("ko-KR", { hour12: false })}</span>
          </div>
          <button className="relative p-2 rounded hover:bg-slate-800 transition-colors" aria-label="알림">
            <Bell size={16} className="text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />
          </button>
          <div className="qmes-header-controls flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">{user.name[0]}</div>
            <div className="hidden md:block leading-tight">
              <div className="qmes-header-user-name">{user.name}</div>
              <div className="qmes-header-user-meta">{user.dept} · <span className="font-mono">{user.uid || "U-0000"}</span></div>
            </div>
            <button onClick={downloadQmesBackup}
              className="qmes-header-action px-2 py-1 rounded border border-slate-700 hover:border-sky-500/60 transition-colors"
              title="전체 데이터 백업">백업</button>
            <button onClick={restoreQmesBackup}
              className="qmes-header-action px-2 py-1 rounded border border-slate-700 hover:border-emerald-500/60 transition-colors"
              title="백업 파일 복원">복원</button>
            {user.role === "admin" && (
              <button
                onClick={() => { setTab("members"); setOpenMenu(null); }}
                className={`qmes-header-action px-2 py-1 rounded border transition-colors ${
                  tab === "members"
                    ? "border-sky-500/60 text-sky-300 bg-sky-500/10"
                    : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                }`}
              >
                회원관리
              </button>
            )}
            {onLogout && (
              <button onClick={onLogout}
                className="qmes-header-action px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors">
                로그아웃
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 qmes-top-menu-bar">
          <nav className="qmes-top-menu">
            {TOP_MENUS.map((menu) => {
              const MenuIcon = menu.icon;
              const children = (menu.children || [])
                .map((id) => visibleTabs.find((t) => t.id === id))
                .filter(Boolean);
              const isDirect = !menu.children;
              const isActive = isDirect
                ? tab === menu.id
                : children.some((item) => item.id === tab);
              const isOpen = openMenu === menu.id;

              return (
                <div key={menu.id} className="qmes-top-menu-item">
                  <button
                    onClick={() => {
                      if (isDirect) {
                        setTab(menu.id);
                        setOpenMenu(null);
                      } else {
                        const nextOpen = isOpen ? null : menu.id;
                        setOpenMenu(nextOpen);
                        if (!isActive && children.length > 0) {
                          setTab(children[0].id);
                        }
                      }
                    }}
                    className={`qmes-top-menu-button ${isActive ? "is-active" : ""}`}
                    aria-haspopup={isDirect ? undefined : "menu"}
                    aria-expanded={isDirect ? undefined : isOpen}
                  >
                    <MenuIcon size={15} />
                    <span>{menu.label}</span>
                    {!isDirect && (
                      <ChevronRight
                        size={12}
                        className="qmes-menu-arrow"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>

          {openMenu && (() => {
            const selectedMenu = TOP_MENUS.find((menu) => menu.id === openMenu);
            const submenuItems = (selectedMenu?.children || [])
              .map((id) => visibleTabs.find((item) => item.id === id))
              .filter(Boolean);

            if (!submenuItems.length) return null;

            return (
              <div className="qmes-submenu-row" role="menu">
                <div className="qmes-submenu-title">{selectedMenu.label}</div>
                {submenuItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setOpenMenu(openMenu);
                      }}
                      className={`qmes-submenu-button ${tab === item.id ? "is-active" : ""}`}
                      role="menuitem"
                    >
                      <ItemIcon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </header>

      <main className="w-full px-4 lg:px-6 py-5 flex-1">
        <Active />
      </main>
    </div>
  );
}

/* ──────────────────────────── 회원가입 · 로그인 ──────────────────────────── */
/* 가입: 이름·부서·비밀번호만 입력, 사번 없음. 가입 즉시 자동 승인되어 바로 시스템에 입장합니다.
   로그인: 이름 + 비밀번호. 관리자 권한은 [회원 관리]에서 지정. 비밀번호는 SHA-256 해시로만 저장. */