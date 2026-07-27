/* QMES module: 거래처 현황 */

function PartnersTab() {
  const [activeType, setActiveType] = React.useState("customer");
  const [searchText, setSearchText] = React.useState("");
  const [saveMessage, setSaveMessage] = React.useState("");

  const customers = [
    { code: "CUS001", name: "현대자동차", status: "거래중" },
    { code: "CUS002", name: "삼성SDI", status: "거래중" },
    { code: "CUS003", name: "LG에너지솔루션", status: "거래중" },
    { code: "CUS004", name: "SK온", status: "거래중" },
  ];

  const defaultSuppliers = [
    { code: "SUP001", company: "코오롱", material: "PAI", lot: "PAI#27-2(2)", status: "거래중" },
    { code: "SUP002", company: "푸양광명화학", material: "NMP", lot: "20251031063", status: "거래중" },
    { code: "SUP003", company: "모리로쿠케미칼즈", material: "NMP", lot: "2026011101", status: "거래중" },
    { code: "SUP004", company: "강신산업", material: "Boehmite", lot: "006-8-25", status: "거래중" },
    { code: "SUP005", company: "LG화학", material: "SBR", lot: "C3026B26A(1)", status: "거래중" },
    { code: "SUP006", company: "SOLVAY", material: "PVDF", lot: "CSE23202TA", status: "거래중" },
    { code: "SUP007", company: "금호석유화학", material: "SBS", lot: "W251016", status: "거래중" },
    { code: "SUP008", company: "유니소재", material: "BYK-180", lot: "2708935", status: "거래중" },
  ];

  const normalizeMaterial = (name) => {
    const value = String(name || "").toUpperCase().replace(/\s+/g, "");
    if (value.includes("BYK180") || value.includes("BYK-180") || value.includes("분산제")) return "BYK180";
    if (value.includes("AOH30") || value.includes("BOEHMITE")) return "BOEHMITE";
    if (value.includes("PVDF")) return "PVDF";
    if (value.includes("PAI")) return "PAI";
    if (value.includes("NMP")) return "NMP";
    if (value.includes("SBR")) return "SBR";
    if (value.includes("SBS")) return "SBS";
    return value;
  };

  const loadSuppliers = () => {
    const saved = Array.isArray(DB?.partnerSuppliers) ? DB.partnerSuppliers : [];
    return defaultSuppliers.map((item) => {
      const old = saved.find((row) => row.code === item.code);
      return old ? { ...item, ...old } : item;
    });
  };

  const [suppliers, setSuppliers] = React.useState(loadSuppliers);

  const syncLotsToWorkOrders = (supplierRows) => {
    let linkedCount = 0;
    const latestByMaterial = {};

    supplierRows.forEach((row) => {
      const materialKey = normalizeMaterial(row.material);
      const lot = String(row.lot || "").trim();
      if (!lot) return;
      if (!latestByMaterial[materialKey]) latestByMaterial[materialKey] = row;
    });

    Object.entries(DB?.woDocs || {}).forEach(([woNo, doc]) => {
      if (!Array.isArray(doc.inputs)) return;
      let changed = false;

      const nextInputs = doc.inputs.map((input) => {
        const materialKey = normalizeMaterial(input.name);
        const master = latestByMaterial[materialKey];
        const currentLot = String(input.materialLot || input.lot || "").trim();

        if (!master || currentLot) return input;

        changed = true;
        linkedCount += 1;
        return {
          ...input,
          lot: master.lot,
          materialLot: master.lot,
          supplier: master.company,
          lotSource: "거래처 현황",
        };
      });

      if (changed) {
        DB.woDocs[woNo] = { ...doc, inputs: nextInputs };
      }
    });

    return linkedCount;
  };

  const saveSupplierLots = () => {
    DB.partnerSuppliers = suppliers.map((row) => ({ ...row }));
    DB.rawMaterialLots = suppliers.reduce((acc, row) => {
      const key = `${normalizeMaterial(row.material)}|${row.company}`;
      acc[key] = {
        material: row.material,
        supplier: row.company,
        lot: String(row.lot || "").trim(),
        status: row.status,
        updatedAt: new Date().toISOString(),
        by: window.__QMES_USER__ || "-",
      };
      return acc;
    }, {});

    const linkedCount = syncLotsToWorkOrders(suppliers);

    try {
      dbSave();
      setSaveMessage(`원료 LOT 저장 완료 · 빈 작업지시서 원료 LOT ${linkedCount}건 자동 반영`);
    } catch (error) {
      console.warn("거래처 LOT 저장 실패", error);
      setSaveMessage("화면에는 반영됐지만 브라우저 저장공간 문제로 영구 저장하지 못했습니다.");
    }
  };

  React.useEffect(() => {
    DB.partnerSuppliers = suppliers.map((row) => ({ ...row }));
  }, []);

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

  const updateSupplierLot = (code, lot) => {
    setSuppliers((prev) =>
      prev.map((row) => (row.code === code ? { ...row, lot } : row))
    );
    setSaveMessage("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">거래처 현황</h2>
          <p className="mt-1 text-sm text-slate-400">
            고객사 및 원료 공급업체 정보를 관리합니다.
          </p>
        </div>

        {activeType === "supplier" && (
          <button
            type="button"
            onClick={saveSupplierLots}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            LOT 저장 · 작업지시서 반영
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveType("customer");
              setSearchText("");
              setSaveMessage("");
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
              setSaveMessage("");
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
              : "공급업체, 원료명, LOT 검색"
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 md:max-w-md"
        />
      </div>

      {saveMessage && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {saveMessage}
        </div>
      )}

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
                    <th className="px-4 py-3 text-left">최근 원료 LOT No.</th>
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
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.lot}
                          onChange={(event) => updateSupplierLot(item.code, event.target.value)}
                          placeholder="원료 LOT 수기 입력"
                          className="w-full min-w-[180px] rounded-md border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-sm text-cyan-300 outline-none focus:border-cyan-400"
                        />
                      </td>
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
            <strong>원료 LOT 관리 기준</strong>
            <br />
            LOT는 직접 수정할 수 있습니다. 저장 시 LOT가 비어 있는 기존 작업지시서의 동일 원료에 자동 반영됩니다.
            작업지시서에서 이미 수기로 입력한 LOT는 덮어쓰지 않습니다.
          </div>
        </>
      )}
    </div>
  );
}
