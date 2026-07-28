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
