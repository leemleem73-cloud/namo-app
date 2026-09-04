/* QMES 회원등록 수정 버튼 호환 패치 - 2026-09-04
 * 실제 회원관리 화면은 admin/members.jsx의 PostgreSQL 연동 컴포넌트를 사용한다.
 * 과거 localStorage 전용 MembersTab을 다시 덮어쓰지 않는다.
 * PC에서 React 클릭 이벤트가 다른 레이어/패치에 막히는 경우를 대비해
 * document capture 단계의 하드 폴백 스크립트를 함께 로드한다.
 */
(function installMembersEditCompatibilityFix(){
  if (typeof MembersManagementTab !== "function") {
    console.error("[QMES] MembersManagementTab을 찾을 수 없습니다.");
    return;
  }

  MembersTab = function MembersTabDatabaseBacked(){
    return <MembersManagementTab />;
  };

  const FALLBACK_ID = "qmes-members-pc-edit-fallback-loader";
  if (!document.getElementById(FALLBACK_ID)) {
    const script = document.createElement("script");
    script.id = FALLBACK_ID;
    script.src = "/js/qmes-members-pc-edit-fallback-20260904.js?v=20260904-pc-edit-hard1";
    script.async = false;
    script.onload = () => console.info("[QMES] PC 회원 수정 하드 폴백 로드 완료");
    script.onerror = () => console.error("[QMES] PC 회원 수정 하드 폴백 로드 실패");
    document.head.appendChild(script);
  }

  window.__QMES_MEMBERS_DB_EDIT_FIX__ = "20260904-db3-hard-fallback";
})();
