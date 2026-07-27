/* QMES module: 거래처 현황 */

function PartnersTab() {
  const CUSTOMER_STORAGE_KEY = "qmes_partner_customers";
  const SUPPLIER_STORAGE_KEY = "qmes_partner_suppliers";

  const defaultCustomers = [
    {
      id: "CUS001",
      code: "CUS001",
      name: "현대자동차",
      status: "거래중",
      note: "",
    },
    {
      id: "CUS002",
      code: "CUS002",
      name: "삼성SDI",
      status: "거래중",
      note: "",
    },
    {
      id: "CUS003",
      code: "CUS003",
      name: "LG에너지솔루션",
      status: "거래중",
      note: "",
    },
    {
      id: "CUS004",
      code: "CUS004",
      name: "SK온",
      status: "거래중",
      note: "",
    },
  ];

  const defaultSuppliers = [
    {
      id: "SUP001",
      code: "SUP001",
      company: "코오롱",
      material: "PAI",
      grade: "Binder PAI",
      lot: "-",
      status: "거래중",
      note: "",
    },
    {
      id: "SUP002",
      code: "SUP002",
      company: "푸양광명화학",
      material: "NMP",
      grade: "NMP",
      lot: "-",
      status: "거래중",
      note: "",
    },
    {
      id: "SUP003",
      code: "SUP003",
      company: "모리로쿠케미칼즈",
      material: "NMP",
      grade: "NMP",
      lot: "-",
      status: "거래중",
      note: "",
    },
    {
      id: "SUP004",
      code: "SUP004",
      company: "강신산업",
      material: "Boehmite",
      grade: "AOH30",
      lot: "-",
      status: "거래중",
      note: "",
    },
    {
      id: "SUP005",
      code: "SUP005",
      company: "LG화학",
      material: "SBR",
      grade: "ADC30-G",
      lot: "-",
      status: "거래중",
      note: "",
    },
    {
      id: "SUP006",
      code: "SUP006",
      company: "SOLVAY",
      material: "PVDF",
      grade: "Solef5130 / Solef5140",
      lot: "-",
      status: "거래중",
      note: "",
    },
    {
      id: "SUP007",
      code: "SUP007",
      company: "금호석유화학",
      material: "SBS",
      grade: "KTR201",
      lot: "-",
      status: "거래중",
      note: "",
    },
  ];

  const loadStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      console.error(`${key} 불러오기 오류`, error);
      return fallback;
    }
  };

  const [customers, setCustomers] = useState(() =>
    loadStorage(CUSTOMER_STORAGE_KEY, defaultCustomers)
  );

  const [suppliers, setSuppliers] = useState(() =>
    loadStorage(SUPPLIER_STORAGE_KEY, defaultSuppliers)
  );

  const [activeType, setActiveType] = useState("customer");
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const emptyCustomerForm = {
    code: "",
    name: "",
    status: "거래중",
    note: "",
  };

  const emptySupplierForm = {
    code: "",
    company: "",
    material: "",
    grade: "",
    lot: "-",
    status: "거래중",
    note: "",
  };

  const [form, setForm] = useState(emptyCustomerForm);

  useEffect(() => {
    localStorage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify(customers)
    );
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(
      SUPPLIER_STORAGE_KEY,
      JSON.stringify(suppliers)
    );
  }, [suppliers]);

  useEffect(() => {
    setSelectedId(null);
    setSearchText("");
    setIsFormOpen(false);
    setEditMode(false);

    setForm(
      activeType === "customer"
        ? emptyCustomerForm
        : emptySupplierForm
    );
  }, [activeType]);

  const generateCode = (type) => {
    const list = type === "customer" ? customers : suppliers;
    const prefix = type === "customer" ? "CUS" : "SUP";

    const maxNumber = list.reduce((max, item) => {
      const number = Number(
        String(item.code || "").replace(prefix, "")
      );

      return Number.isFinite(number)
        ? Math.max(max, number)
        : max;
    }, 0);

    return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
  };

  const filteredCustomers = customers.filter((item) => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return true;

    return [
      item.code,
      item.name,
      item.status,
      item.note,
    ].some((value) =>
      String(value || "").toLowerCase().includes(keyword)
    );
  });

  const filteredSuppliers = suppliers.filter((item) => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return true;

    return [
      item.code,
      item.company,
      item.material,
      item.grade,
      item.lot,
      item.status,
      item.note,
    ].some((value) =>
      String(value || "").toLowerCase().includes(keyword)
    );
  });

  const handleAdd = () => {
    setSelectedId(null);
    setEditMode(false);
    setIsFormOpen(true);

    if (activeType === "customer") {
      setForm({
        ...emptyCustomerForm,
        code: generateCode("customer"),
      });
    } else {
      setForm({
        ...emptySupplierForm,
        code: generateCode("supplier"),
      });
    }
  };

  const handleEdit = () => {
    if (!selectedId) {
      alert("수정할 거래처를 먼저 선택해 주세요.");
      return;
    }

    if (activeType === "customer") {
      const selected = customers.find(
        (item) => item.id === selectedId
      );

      if (!selected) return;

      setForm({
        code: selected.code,
        name: selected.name,
        status: selected.status,
        note: selected.note || "",
      });
    } else {
      const selected = suppliers.find(
        (item) => item.id === selectedId
      );

      if (!selected) return;

      setForm({
        code: selected.code,
        company: selected.company,
        material: selected.material,
        grade: selected.grade,
        lot: selected.lot || "-",
        status: selected.status,
        note: selected.note || "",
      });
    }

    setEditMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (!selectedId) {
      alert("삭제할 거래처를 먼저 선택해 주세요.");
      return;
    }

    const selectedName =
      activeType === "customer"
        ? customers.find((item) => item.id === selectedId)?.name
        : suppliers.find((item) => item.id === selectedId)?.company;

    if (
      !window.confirm(
        `${selectedName || "선택한 거래처"}를 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    if (activeType === "customer") {
      setCustomers((prev) =>
        prev.filter((item) => item.id !== selectedId)
      );
    } else {
      setSuppliers((prev) =>
        prev.filter((item) => item.id !== selectedId)
      );
    }

    setSelectedId(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (activeType === "customer") {
      if (!form.code.trim()) {
        alert("고객사 코드를 입력해 주세요.");
        return;
      }

      if (!form.name.trim()) {
        alert("고객사명을 입력해 주세요.");
        return;
      }

      const duplicateCode = customers.some(
        (item) =>
          item.code === form.code.trim() &&
          (!editMode || item.id !== selectedId)
      );

      if (duplicateCode) {
        alert("이미 사용 중인 고객사 코드입니다.");
        return;
      }

      if (editMode) {
        setCustomers((prev) =>
          prev.map((item) =>
            item.id === selectedId
              ? {
                  ...item,
                  code: form.code.trim(),
                  name: form.name.trim(),
                  status: form.status,
                  note: form.note.trim(),
                }
              : item
          )
        );
      } else {
        const newCustomer = {
          id: `${form.code.trim()}-${Date.now()}`,
          code: form.code.trim(),
          name: form.name.trim(),
          status: form.status,
          note: form.note.trim(),
        };

        setCustomers((prev) => [...prev, newCustomer]);
      }
    } else {
      if (!form.code.trim()) {
        alert("공급업체 코드를 입력해 주세요.");
        return;
      }

      if (!form.company.trim()) {
        alert("공급업체명을 입력해 주세요.");
        return;
      }

      if (!form.material.trim()) {
        alert("원료명을 입력해 주세요.");
        return;
      }

      const duplicateCode = suppliers.some(
        (item) =>
          item.code === form.code.trim() &&
          (!editMode || item.id !== selectedId)
      );

      if (duplicateCode) {
        alert("이미 사용 중인 공급업체 코드입니다.");
        return;
      }

      if (editMode) {
        setSuppliers((prev) =>
          prev.map((item) =>
            item.id === selectedId
              ? {
                  ...item,
                  code: form.code.trim(),
                  company: form.company.trim(),
                  material: form.material.trim(),
                  grade: form.grade.trim(),
                  lot: form.lot.trim() || "-",
                  status: form.status,
                  note: form.note.trim(),
                }
              : item
          )
        );
      } else {
        const newSupplier = {
          id: `${form.code.trim()}-${Date.now()}`,
          code: form.code.trim(),
          company: form.company.trim(),
          material: form.material.trim(),
          grade: form.grade.trim(),
          lot: form.lot.trim() || "-",
          status: form.status,
          note: form.note.trim(),
        };

        setSuppliers((prev) => [...prev, newSupplier]);
      }
    }

    setIsFormOpen(false);
    setEditMode(false);
    setSelectedId(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditMode(false);
  };

  const handleReset = () => {
    const typeText =
      activeType === "customer" ? "고객사" : "공급업체";

    if (
      !window.confirm(
        `${typeText} 목록을 최초 등록값으로 복원하시겠습니까?`
      )
    ) {
      return;
    }

    if (activeType === "customer") {
      setCustomers(defaultCustomers);
    } else {
      setSuppliers(defaultSuppliers);
    }

    setSelectedId(null);
  };

  return (
    <div className="space-y-5">
      {/* 화면 제목 */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            거래처 현황
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            고객사 및 원료 공급업체 정보를 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            + 추가
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="rounded-lg border border-sky-500/60 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20"
          >
            수정
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            삭제
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            초기값 복원
          </button>
        </div>
      </div>

      {/* 고객사 / 공급업체 선택 */}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveType("customer")}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              activeType === "customer"
                ? "bg-cyan-600 text-white"
                : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            고객사
            <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-xs">
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType("supplier")}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              activeType === "supplier"
                ? "bg-cyan-600 text-white"
                : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            공급업체
            <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-xs">
              {suppliers.length}
            </span>
          </button>
        </div>

        <input
          type="search"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
          placeholder={
            activeType === "customer"
              ? "고객사명 또는 코드 검색"
              : "공급업체, 원료명, Grade, LOT 검색"
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 md:max-w-md"
        />
      </div>

      {/* 등록 및 수정 입력창 */}

      {isFormOpen && (
        <div className="rounded-xl border border-cyan-500/50 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-cyan-300">
              {editMode ? "거래처 수정" : "거래처 추가"}
            </h3>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded px-3 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              닫기
            </button>
          </div>

          {activeType === "customer" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  고객사 코드
                </span>

                <input
                  value={form.code || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "code",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  고객사명
                </span>

                <input
                  value={form.name || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "name",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  거래 상태
                </span>

                <select
                  value={form.status || "거래중"}
                  onChange={(event) =>
                    handleFormChange(
                      "status",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                >
                  <option value="거래중">거래중</option>
                  <option value="거래중지">거래중지</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  비고
                </span>

                <input
                  value={form.note || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "note",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  공급업체 코드
                </span>

                <input
                  value={form.code || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "code",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  공급업체명
                </span>

                <input
                  value={form.company || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "company",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  원료명
                </span>

                <input
                  value={form.material || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "material",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  규격(Grade)
                </span>

                <input
                  value={form.grade || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "grade",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  최근 LOT No.
                </span>

                <input
                  value={form.lot || "-"}
                  onChange={(event) =>
                    handleFormChange(
                      "lot",
                      event.target.value
                    )
                  }
                  placeholder="IQC 연동 전에는 -"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-400">
                  거래 상태
                </span>

                <select
                  value={form.status || "거래중"}
                  onChange={(event) =>
                    handleFormChange(
                      "status",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                >
                  <option value="거래중">거래중</option>
                  <option value="거래중지">거래중지</option>
                </select>
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-slate-400">
                  비고
                </span>

                <input
                  value={form.note || ""}
                  onChange={(event) =>
                    handleFormChange(
                      "note",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </label>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 고객사 목록 */}

      {activeType === "customer" && (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div className="border-b border-slate-700 px-5 py-4">
            <h3 className="font-semibold text-cyan-300">
              고객사 목록
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="w-16 px-4 py-3 text-center">
                    선택
                  </th>
                  <th className="w-16 px-4 py-3 text-center">
                    No
                  </th>
                  <th className="px-4 py-3 text-left">
                    고객사 코드
                  </th>
                  <th className="px-4 py-3 text-left">
                    고객사명
                  </th>
                  <th className="px-4 py-3 text-center">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left">
                    비고
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((item, index) => {
                  const isSelected =
                    selectedId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        setSelectedId(item.id)
                      }
                      className={`cursor-pointer border-t border-slate-800 transition ${
                        isSelected
                          ? "bg-cyan-500/15"
                          : "hover:bg-slate-800/70"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name="selectedCustomer"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedId(item.id)
                          }
                        />
                      </td>

                      <td className="px-4 py-3 text-center text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-mono text-sky-300">
                        {item.code}
                      </td>

                      <td className="px-4 py-3 font-semibold text-white">
                        {item.name}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "거래중"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {item.note || "-"}
                      </td>
                    </tr>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 공급업체 목록 */}

      {activeType === "supplier" && (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div className="border-b border-slate-700 px-5 py-4">
            <h3 className="font-semibold text-cyan-300">
              공급업체 목록
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="w-16 px-4 py-3 text-center">
                    선택
                  </th>
                  <th className="w-16 px-4 py-3 text-center">
                    No
                  </th>
                  <th className="px-4 py-3 text-left">
                    공급업체 코드
                  </th>
                  <th className="px-4 py-3 text-left">
                    공급업체명
                  </th>
                  <th className="px-4 py-3 text-left">
                    원료명
                  </th>
                  <th className="px-4 py-3 text-left">
                    규격(Grade)
                  </th>
                  <th className="px-4 py-3 text-left">
                    최근 LOT No.
                  </th>
                  <th className="px-4 py-3 text-center">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left">
                    비고
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((item, index) => {
                  const isSelected =
                    selectedId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        setSelectedId(item.id)
                      }
                      className={`cursor-pointer border-t border-slate-800 transition ${
                        isSelected
                          ? "bg-cyan-500/15"
                          : "hover:bg-slate-800/70"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name="selectedSupplier"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedId(item.id)
                          }
                        />
                      </td>

                      <td className="px-4 py-3 text-center text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-mono text-sky-300">
                        {item.code}
                      </td>

                      <td className="px-4 py-3 font-semibold text-white">
                        {item.company}
                      </td>

                      <td className="px-4 py-3">
                        {item.material}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {item.grade || "-"}
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-cyan-300">
                        {item.lot || "-"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "거래중"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {item.note || "-"}
                      </td>
                    </tr>
                  );
                })}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOT 연동 안내 */}

      {activeType === "supplier" && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          <strong>LOT No. 관리 기준</strong>
          <br />
          최근 LOT No.는 공급업체 고정정보가 아니라 수입검사
          (IQC) 합격 이력에서 자동으로 가져오도록 연결합니다.
          작업지시서에서는 원료명을 선택하면 사용 가능한 합격
          LOT만 표시하고, 선택한 LOT의 실투입량을 원재료 재고에서
          차감하도록 구성합니다.
        </div>
      )}
    </div>
  );
}
