/* QMES module: 거래처 현황 */

function PartnersTab() {
  const [activeType, setActiveType] = React.useState("customer");
  const [searchText, setSearchText] = React.useState("");

  const customers = [
    { code: "CUS001", name: "현대자동차", status: "거래중" },
    { code: "CUS002", name: "삼성SDI", status: "거래중" },
    { code: "CUS003", name: "LG에너지솔루션", status: "거래중" },
    { code: "CUS004", name: "SK온", status: "거래중" },
  ];

  const suppliers = [
    { code: "SUP001", company: "코오롱", material: "PAI", lot: "-", status: "거래중" },
    { code: "SUP002", company: "푸양광명화학", material: "NMP", lot: "-", status: "거래중" },
    { code: "SUP003", company: "모리로쿠케미칼즈", material: "NMP", lot: "-", status: "거래중" },
    { code: "SUP004", company: "강신산업", material: "Boehmite", lot: "-", status: "거래중" },
    { code: "SUP005", company: "LG화학", material: "SBR", lot: "-", status: "거래중" },
    { code: "SUP006", company: "SOLVAY", material: "PVDF", lot: "-", status: "거래중" },
    { code: "SUP007", company: "금호석유화학", material: "SBS", lot: "-", status: "거래중" },
  ];

  const keyword = searchText.trim().toLowerCase();

  const filteredCustomers = customers.filter((item) =>
    [item.code, item.name, item.status].some((value) =>
      String(value || "").toLowerCase().includes(keyword)
    )
  );

  const filteredSuppliers = suppliers
    .filter((item) =>
      [item.code, item.company, item.material, item.lot, item.status].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    )
    .sort((a, b) => {
      const aIsKorean = /^[가-힣]/.test(a.company);
      const bIsKorean = /^[가-힣]/.test(b.company);

      if (aIsKorean && !bIsKorean) return -1;
      if (!aIsKorean && bIsKorean) return 1;

      return a.company.localeCompare(b.company, aIsKorean ? "ko-KR" : "en", {
        sensitivity: "base",
        numeric: true,
      });
    });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">거래처 현황</h2>
        <p className="mt-1 text-sm text-slate-400">
          고객사 및 원료 공급업체 정보를 관리합니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveType("customer");
              setSearchText("");
            }}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              activeType === "customer"
                ? "bg-cyan-600 text-white"
                : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            고객사 <span className="ml-2">{customers.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType("supplier");
              setSearchText("");
            }}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              activeType === "supplier"
                ? "bg-cyan-600 text-white"
                : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            공급업체 <span className="ml-2">{suppliers.length}</span>
          </button>
        </div>

        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={
            activeType === "customer"
              ? "고객사명 또는 코드 검색"
              : "공급업체, 원료명 검색"
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 md:max-w-md"
        />
      </div>

      {activeType === "customer" ? (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div className="border-b border-slate-700 px-5 py-4">
            <h3 className="font-semibold text-cyan-300">고객사 목록</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="w-20 px-4 py-3 text-center">No</th>
                  <th className="px-4 py-3 text-left">고객사 코드</th>
                  <th className="px-4 py-3 text-left">고객사명</th>
                  <th className="px-4 py-3 text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((item, index) => (
                  <tr key={item.code} className="border-t border-slate-800 hover:bg-slate-800/70">
                    <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-sky-300">{item.code}</td>
                    <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-10 text-center text-slate-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
            <div className="border-b border-slate-700 px-5 py-4">
              <h3 className="font-semibold text-cyan-300">공급업체 목록</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="w-20 px-4 py-3 text-center">No</th>
                    <th className="px-4 py-3 text-left">공급업체 코드</th>
                    <th className="px-4 py-3 text-left">공급업체명</th>
                    <th className="px-4 py-3 text-left">원료명</th>
                    <th className="px-4 py-3 text-left">최근 LOT No.</th>
                    <th className="px-4 py-3 text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((item, index) => (
                    <tr key={item.code} className="border-t border-slate-800 hover:bg-slate-800/70">
                      <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-mono text-sky-300">{item.code}</td>
                      <td className="px-4 py-3 font-semibold text-white">{item.company}</td>
                      <td className="px-4 py-3 text-white">{item.material}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-cyan-300">{item.lot}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
            <strong>LOT No. 관리 기준</strong>
            <br />
            최근 LOT No.는 수입검사(IQC) 합격 이력에서 자동으로 가져오도록 연결합니다.
            작업지시서에서는 원료명에 맞는 사용 가능 LOT만 선택할 수 있도록 연동합니다.
          </div>
        </>
      )}
    </div>
  );
}
