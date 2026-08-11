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
      const normalized = {
        ...user,
        id: normalizedName,
        name: normalizedName,
        role: normalizedName === "관리자" ? "admin" : "user",
      };
      if (!byName.has(normalizedName)) byName.set(normalizedName, normalized);
    });

    seedUsers.forEach((seed) => {
      const current = byName.get(seed.name);
      byName.set(seed.name, current ? {
        ...seed,
        ...current,
        id: seed.name,
        name: seed.name,
        uid: seed.uid,
        dept: current.dept || seed.dept,
        position: current.position || seed.position,
        role: seed.role,
      } : { ...seed });
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

  try {
    saveUsers(normalizeAndSeed(originalLoadUsers()));
  } catch (error) {
    console.warn("[QMES] 초기 회원 등록 실패", error);
  }
})();

/* 설비관리 최종 컴포넌트 고정 — 뒤쪽 구형 스크립트가 EquipmentTab을 다시 덮어쓰는 문제 방지 */
(function finalizeEquipmentManagementTab(){
  if (typeof EquipmentTab !== "function") return;
  const latestEquipmentTab = EquipmentTab;
  window.__QMES_FINAL_EQUIPMENT_TAB__ = latestEquipmentTab;

  const restoreLatestEquipmentTab = () => {
    if (typeof window.__QMES_FINAL_EQUIPMENT_TAB__ === "function") {
      EquipmentTab = window.__QMES_FINAL_EQUIPMENT_TAB__;
    }
  };

  window.setTimeout(restoreLatestEquipmentTab, 0);
  window.addEventListener("load", restoreLatestEquipmentTab, { once:true });
})();

/* 현장입력 > 설비 좌측 메뉴 최종 정리
   - 일일점검 바로 위 '설비점검' 제목 추가
   - 구형 런타임 선택 스타일의 흰색 버튼 박스 제거 */
(function refineEquipmentSidebar(){
  const STYLE_ID = "qmes-equipment-sidebar-flat-final";
  const TITLE_CLASS = "qmes-equipment-sidebar-check-title";

  function ensureStyle(){
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block{
        background:#fff!important;
        box-shadow:none!important;
      }
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar .${TITLE_CLASS}{
        display:block!important;
        margin:0 0 8px!important;
        padding:2px 8px 12px!important;
        border:0!important;
        border-bottom:1px solid #e2e8f0!important;
        background:transparent!important;
        box-shadow:none!important;
        color:#0f172a!important;
        font-size:18px!important;
        line-height:1.2!important;
        font-weight:900!important;
        text-align:left!important;
      }
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button:hover,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button:focus,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button:focus-visible,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.is-active,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button[aria-selected="true"],
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.qmes-equipment-nav-selected{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        width:100%!important;
        min-height:48px!important;
        margin:0!important;
        padding:0 8px!important;
        border:0!important;
        border-width:0!important;
        border-style:none!important;
        border-color:transparent!important;
        border-radius:0!important;
        outline:0!important;
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        filter:none!important;
        appearance:none!important;
        -webkit-appearance:none!important;
      }
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button::before,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button::after{
        content:none!important;
        display:none!important;
      }
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button{color:#334155!important;-webkit-text-fill-color:#334155!important;}
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.is-active,
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button[aria-selected="true"],
      html body .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.qmes-equipment-nav-selected{
        color:#1265d8!important;
        -webkit-text-fill-color:#1265d8!important;
      }
    `;
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll(".qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block").forEach((sidebar) => {
      let title = sidebar.querySelector(`.${TITLE_CLASS}`);
      if (!title) {
        title = document.createElement("div");
        title.className = TITLE_CLASS;
        title.textContent = "설비점검";
        sidebar.insertBefore(title, sidebar.firstChild);
      }

      sidebar.querySelectorAll(":scope > button").forEach((button) => {
        ["background","background-color","background-image","border","border-radius","box-shadow","outline","filter"].forEach((property) => {
          button.style.setProperty(property, property === "border-radius" ? "0" : property === "border" ? "0" : property === "background" || property === "background-color" ? "transparent" : "none", "important");
        });
      });
    });
  }

  let scheduled = false;
  const scheduleApply = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  };

  apply();
  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener("load", scheduleApply, { once:true });
})();