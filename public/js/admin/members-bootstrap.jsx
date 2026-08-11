/* 나모케미칼 초기 회원 자동 등록 및 기존 계정 마이그레이션 */
(function bootstrapNamoMembers() {
  const seedUsers = [
    { id: "관리자", uid: "U-0001", pw: "1234", name: "관리자", dept: "경영지원부", position: "시스템관리자", role: "admin", passwordChanged: false },
    { id: "김종혁", uid: "U-0002", pw: "1234", name: "김종혁", dept: "대표", position: "대표이사", role: "user", passwordChanged: false },
    { id: "김세희", uid: "U-0003", pw: "1234", name: "김세희", dept: "연구소", position: "이사", role: "user", passwordChanged: false },
    { id: "정영기", uid: "U-0004", pw: "1234", name: "정영기", dept: "연구소", position: "이사", role: "user", passwordChanged: false },
    { id: "박지헌", uid: "U-0005", pw: "1234", name: "박지헌", dept: "연구소", position: "연구원", role: "user", passwordChanged: false },
    { id: "박도훈", uid: "U-0006", pw: "1234", name: "박도훈", dept: "생산부", position: "대리", role: "user", passwordChanged: false },
    { id: "문지훈", uid: "U-0007", pw: "1234", name: "문지훈", dept: "생산부", position: "주임", role: "user", passwordChanged: false },
    { id: "김현진", uid: "U-0008", pw: "1234", name: "김현진", dept: "영업부", position: "과장", role: "user", passwordChanged: false },
    { id: "임흥배", uid: "U-0009", pw: "1234", name: "임흥배", dept: "품질부", position: "부장", role: "user", passwordChanged: false },
    { id: "박현아", uid: "U-0010", pw: "1234", name: "박현아", dept: "품질부", position: "사원", role: "user", passwordChanged: false },
  ];

  const originalLoadUsers = loadUsers;

  function normalizeAndSeed(users) {
    const source = Array.isArray(users) ? users : [];
    const byName = new Map();
    source.forEach((user) => {
      const normalizedName = user.name === "admin" || user.id === "admin" ? "관리자" : (user.name || user.id || "").trim();
      if (!normalizedName) return;
      const normalized = { ...user, id: normalizedName, name: normalizedName, role: normalizedName === "관리자" ? "admin" : "user" };
      if (!byName.has(normalizedName)) byName.set(normalizedName, normalized);
    });
    seedUsers.forEach((seed) => {
      const current = byName.get(seed.name);
      byName.set(seed.name, current ? { ...seed, ...current, id: seed.name, name: seed.name, uid: seed.uid, dept: current.dept || seed.dept, position: current.position || seed.position, role: seed.role } : { ...seed });
    });
    const seededNames = new Set(seedUsers.map((u) => u.name));
    const seeded = seedUsers.map((seed) => byName.get(seed.name));
    const extras = Array.from(byName.values()).filter((u) => !seededNames.has(u.name)).map((u) => ({ ...u, role: "user" }));
    return [...seeded, ...extras];
  }

  loadUsers = function loadNamoUsers() {
    const next = normalizeAndSeed(originalLoadUsers());
    saveUsers(next);
    return next;
  };

  try { saveUsers(normalizeAndSeed(originalLoadUsers())); }
  catch (error) { console.warn("[QMES] 초기 회원 등록 실패", error); }
})();

(function finalizeEquipmentManagementTab(){
  if (typeof EquipmentTab !== "function") return;
  const latestEquipmentTab = EquipmentTab;
  window.__QMES_FINAL_EQUIPMENT_TAB__ = latestEquipmentTab;
  const restoreLatestEquipmentTab = () => {
    if (typeof window.__QMES_FINAL_EQUIPMENT_TAB__ === "function") EquipmentTab = window.__QMES_FINAL_EQUIPMENT_TAB__;
  };
  window.setTimeout(restoreLatestEquipmentTab, 0);
  window.addEventListener("load", restoreLatestEquipmentTab, { once:true });
})();

(function refineEquipmentSidebar(){
  const STYLE_ID = "qmes-equipment-sidebar-flat-final";
  const TITLE_CLASS = "qmes-equipment-sidebar-check-title";

  function ensureStyle(){
    let style = document.getElementById(STYLE_ID);
    if (!style) { style = document.createElement("style"); style.id = STYLE_ID; document.head.appendChild(style); }
    style.textContent = `
      html body .qmes-ipad-equipment .qmes-equipment-management-layout{grid-template-columns:136px minmax(0,1fr)!important;gap:10px!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block{width:136px!important;min-width:136px!important;max-width:136px!important;padding:0 6px 20px 0!important;background:#fff!important;box-shadow:none!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar .${TITLE_CLASS}{display:flex!important;align-items:center!important;width:100%!important;min-height:42px!important;margin:0 0 8px!important;padding:0 10px!important;box-sizing:border-box!important;border:1px solid #d7eaf8!important;border-radius:6px!important;background:#eaf6ff!important;box-shadow:none!important;color:#0f5f9f!important;font-size:15px!important;line-height:1.2!important;font-weight:900!important;text-align:left!important;}

      html body .qmes-ipad-equipment .qmes-equipment-management-content>.qmes-equipment-management-summary>div{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-height:0!important;padding:9px 12px!important;box-shadow:0 2px 7px rgba(15,23,42,.08)!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-content>.qmes-equipment-management-summary>div>div:first-child{color:#111827!important;-webkit-text-fill-color:#111827!important;font-size:16px!important;line-height:1.2!important;font-weight:900!important;text-align:center!important;width:100%!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-content>.qmes-equipment-management-summary>div>div:nth-child(2){margin-top:4px!important;color:#000!important;-webkit-text-fill-color:#000!important;font-size:30px!important;line-height:1!important;font-weight:950!important;text-align:center!important;width:100%!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-content>.qmes-equipment-management-summary>div>div:nth-child(2)>span{color:#000!important;-webkit-text-fill-color:#000!important;font-size:15px!important;font-weight:800!important;}

      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button:focus,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button:focus-visible,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.is-active,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button[aria-selected="true"],
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.qmes-equipment-nav-selected{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-height:48px!important;margin:0!important;padding:0 8px!important;border:0!important;border-width:0!important;border-style:none!important;border-color:transparent!important;border-radius:0!important;outline:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;appearance:none!important;-webkit-appearance:none!important;transition:background-color .16s ease,color .16s ease,box-shadow .16s ease!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button:hover{background:#eef7ff!important;background-color:#eef7ff!important;color:#0f5f9f!important;-webkit-text-fill-color:#0f5f9f!important;box-shadow:inset 3px 0 0 #38bdf8!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button::before,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button::after{content:none!important;display:none!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button{color:#334155!important;-webkit-text-fill-color:#334155!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.is-active,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button[aria-selected="true"],
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.qmes-equipment-nav-selected{color:#1265d8!important;-webkit-text-fill-color:#1265d8!important;}
      @media(max-width:900px){html body .qmes-ipad-equipment .qmes-equipment-management-layout{grid-template-columns:1fr!important;gap:12px!important;}html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block{width:100%!important;min-width:0!important;max-width:none!important;padding:0!important;}html body .qmes-ipad-equipment .qmes-equipment-management-sidebar .${TITLE_CLASS}{grid-column:1/-1!important;}}
    `;
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll(".qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block").forEach((sidebar) => {
      let title = sidebar.querySelector(`.${TITLE_CLASS}`);
      if (!title) { title = document.createElement("div"); title.className = TITLE_CLASS; title.textContent = "설비점검"; sidebar.insertBefore(title, sidebar.firstChild); }
      sidebar.querySelectorAll(":scope > button").forEach((button) => {
        if (button.matches(":hover")) {
          button.style.setProperty("background", "#eef7ff", "important");
          button.style.setProperty("background-color", "#eef7ff", "important");
          button.style.setProperty("box-shadow", "inset 3px 0 0 #38bdf8", "important");
          button.style.setProperty("color", "#0f5f9f", "important");
          return;
        }
        ["background","background-color","background-image","border","border-radius","box-shadow","outline","filter"].forEach((property) => {
          button.style.setProperty(property, property === "border-radius" ? "0" : property === "border" ? "0" : property === "background" || property === "background-color" ? "transparent" : "none", "important");
        });
      });
    });
  }

  let scheduled = false;
  const scheduleApply = () => { if (scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; apply(); }); };
  apply();
  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener("load", scheduleApply, { once:true });
})();

(function refineEquipmentAlarmHeader(){
  const STYLE_ID = "qmes-equipment-alarm-header-align";
  function ensureStyle(){
    let style = document.getElementById(STYLE_ID);
    if(!style){ style = document.createElement("style"); style.id = STYLE_ID; document.head.appendChild(style); }
    style.textContent = `
      html body .qmes-ipad-equipment .qmes-equipment-alarm-header-row{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:46px!important;margin:0 14px!important;padding:0 26px!important;box-sizing:border-box!important;}
      html body .qmes-ipad-equipment .qmes-equipment-alarm-title{margin:0!important;padding:0!important;font-size:16px!important;line-height:1.2!important;font-weight:850!important;color:#0f2f63!important;}
      html body .qmes-ipad-equipment .qmes-equipment-alarm-count{margin:0!important;padding:0!important;font-size:14px!important;line-height:1.2!important;font-weight:800!important;color:#334155!important;white-space:nowrap!important;}
    `;
  }
  function apply(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-equipment .qmes-equipment-alarm-title').forEach((title) => {
      const row = title.parentElement;
      if(!row) return;
      row.classList.add('qmes-equipment-alarm-header-row');
      Array.from(row.querySelectorAll('span,div,strong,p,small')).forEach((el) => {
        if(el === title || el.children.length) return;
        if(/^\s*\d+\s*건\s*$/.test(el.textContent || '')) el.classList.add('qmes-equipment-alarm-count');
      });
    });
  }
  let scheduled = false;
  const schedule = () => { if(scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; apply(); }); };
  apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('load',schedule,{once:true});
})();

(function refineDailyTourStartButton(){
  const STYLE_ID = 'qmes-equipment-tour-start-safe-style';
  function ensureStyle(){
    let style = document.getElementById(STYLE_ID);
    if(!style){ style = document.createElement('style'); style.id = STYLE_ID; document.head.appendChild(style); }
    style.textContent = `
      html body .qmes-ipad-equipment button.qmes-equipment-tour-start-safe{display:flex!important;align-items:center!important;justify-content:center!important;width:168px!important;min-width:168px!important;max-width:168px!important;height:40px!important;min-height:40px!important;margin-left:auto!important;margin-right:auto!important;padding:0 14px!important;background:#ecfdf5!important;background-color:#ecfdf5!important;border:1.5px solid #86efac!important;border-radius:8px!important;color:#15803d!important;-webkit-text-fill-color:#15803d!important;font-size:13px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important;box-shadow:0 2px 7px rgba(22,163,74,.10)!important;transition:background-color .16s ease,border-color .16s ease,box-shadow .16s ease,color .16s ease!important;}
      html body .qmes-ipad-equipment button.qmes-equipment-tour-start-safe:hover{background:#dcfce7!important;background-color:#dcfce7!important;border-color:#4ade80!important;color:#166534!important;-webkit-text-fill-color:#166534!important;box-shadow:0 3px 9px rgba(22,163,74,.16)!important;}
    `;
  }
  function apply(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-equipment').forEach((panel) => {
      const buttons = Array.from(panel.querySelectorAll('button'));
      const upper = buttons.find((button) => (button.textContent || '').replace(/\s+/g,' ').trim() === '순회점검 시작' && !button.classList.contains('qmes-equipment-tour-start-safe'));
      const lower = buttons.find((button) => (button.textContent || '').replace(/\s+/g,' ').trim() === '오늘 순회점검 시작');
      if(upper) upper.style.setProperty('display','none','important');
      if(lower){
        lower.textContent = '↻ 순회점검 시작';
        lower.classList.add('qmes-equipment-tour-start-safe');
      }
    });
  }
  let scheduled = false;
  const schedule = () => { if(scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; apply(); }); };
  apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('load',schedule,{once:true});
})();