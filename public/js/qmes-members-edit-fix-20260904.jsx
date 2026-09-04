/* QMES 회원등록 수정 호환 패치 - 2026-09-04
 * 회원관리 본체는 admin/members.jsx의 PostgreSQL 연동 컴포넌트만 사용한다.
 * PC 클릭 하드 폴백은 server.js가 별도 일반 JS로 직접 로드한다.
 */
(function installMembersEditCompatibilityFix(){
  if (typeof MembersManagementTab !== "function") {
    console.error("[QMES] MembersManagementTab을 찾을 수 없습니다.");
    return;
  }

  MembersTab = function MembersTabDatabaseBacked(){
    return <MembersManagementTab />;
  };

  window.__QMES_MEMBERS_DB_EDIT_FIX__ = "20260904-db4-single-editor";
})();
