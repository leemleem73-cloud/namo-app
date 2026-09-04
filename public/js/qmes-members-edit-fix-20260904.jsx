/* QMES 회원등록 수정 버튼 호환 패치 - 2026-09-04
 * 실제 회원관리 화면은 admin/members.jsx의 PostgreSQL 연동 컴포넌트를 사용한다.
 * 과거 localStorage 전용 MembersTab을 다시 덮어쓰지 않는다.
 */
(function installMembersEditCompatibilityFix(){
  if (typeof MembersManagementTab !== "function") {
    console.error("[QMES] MembersManagementTab을 찾을 수 없습니다.");
    return;
  }

  MembersTab = function MembersTabDatabaseBacked(){
    return <MembersManagementTab />;
  };

  window.__QMES_MEMBERS_DB_EDIT_FIX__ = "20260904-db2";
})();
