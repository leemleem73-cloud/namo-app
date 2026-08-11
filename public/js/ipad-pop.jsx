/* QMES IPAD POP — touch-first IQC/PQC/OQC field inspection input */

function qmesIpadCurrentUser() {
  const raw = window.__QMES_USER__ || window.__QMES_CURRENT_USER__;
  const value = raw && typeof raw === "object"
    ? String(raw.name || raw.uid || "관리자")
    : String(raw || "관리자");
  return value.replace(/\s*\(U-\d+\)\s*$/i, "").trim();
}

function qmesIpadNowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function qmesIpadLotInfo(lotNo) {
  const key = String(lotNo || "").trim();
  const batch = (DB.batches || []).find((row) => String(row.no || "").trim() === key);
  const lot = DB.lots?.[key] || null;
  return {
    batch,
    lot,
    product: batch?.itemName || batch?.item || lot?.itemName || lot?.item || lot?.product || ""
  };
}

function qmesIpadEmptyValues(mode) {
  if (mode === "IQC") {
    return { visual:"", label:"", weight:"", coa:"" };
  }
  if (mode === "PQC") {
    return {
      "점도":["","",""],
      "고형분":["","",""],
      "입도(Dmax)":["","",""],
      "외관":[""]
    };
  }
  return {
    "외관":["","",""],
    "입도(Dmax)":["","",""],
    "점도":["","",""],
    "수분":["","",""],
    "고형분":["","",""],
    "접착력":["","",""],
    "절연저항":["","",""],
    "전해액 안정성":["","",""]
  };
}

function qmesIpadItems(mode) {
  if (mode === "IQC") {
    return [
      { key:"visual", label:"외관", spec:"이상 없을 것", type:"choice", choices:["합격","불합격"] },
      { key:"label", label:"라벨", spec:"표기사항 일치", type:"choice", choices:["합격","불합격"] },
      { key:"weight", label:"중량", spec:"입고표기와 일치", type:"choice", choices:["합격","불합격"] },
      { key:"coa", label:"COA 확인", spec:"성적서 확인", type:"choice", choices:["합격","불합격"] }
    ];
  }
  if (mode === "PQC") {
    return [
      { key:"외관", label:"외관", type:"choice", choices:["이상없음","이상있음"] },
      { key:"입도(Dmax)", label:"입도(Dmax)", type:"triple" },
      { key:"점도", label:"점도", type:"triple" },
      { key:"고형분", label:"고형분", type:"triple" }
    ];
  }
  return [
    { key:"외관", label:"외관", type:"choice3", choices:["이상없음","이상있음"] },
    { key:"입도(Dmax)", label:"입도(Dmax)", type:"triple" },
    { key:"점도", label:"점도", type:"triple" },
    { key:"수분", label:"수분율", type:"triple" },
    { key:"고형분", label:"고형분", type:"triple" },
    { key:"접착력", label:"접착력", type:"triple" },
    { key:"절연저항", label:"절연저항", type:"resistance3", choices:["Overflow","직접입력"] },
    { key:"전해액 안정성", label:"전해액 안정성", type:"choice3", choices:["미탈리","탈리"] }
  ];
}

function qmesIpadChoicePass(itemKey, value) {
  const normalized = String(value || "").trim();
  if (itemKey === "외관") return normalized === "이상없음" || normalized === "정상";
  if (itemKey === "전해액 안정성") return normalized === "미탈리";
  if (itemKey === "절연저항") {
    if (normalized.toLowerCase().includes("overflow")) return true;
    return autoJudge(itemKey, normalized) === "합격";
  }
  return normalized === "합격";
}

function qmesIpadItemStatus(mode, item, values) {
  const raw = values[item.key];
  const expected = item.type === "triple" || item.type === "choice3" || item.type === "resistance3" ? 3 : 1;
  const list = Array.isArray(raw) ? raw.slice(0, expected) : [raw];
  if (list.length < expected || list.some((value) => String(value ?? "").trim() === "")) return "대기";

  if (item.type === "choice" || item.type === "choice3" || item.type === "resistance3") {
    return list.every((value) => qmesIpadChoicePass(item.key, value)) ? "합격" : "불합격";
  }

  return list.every((value) => autoJudge(item.key, value) === "합격") ? "합격" : "불합격";
}

function qmesIpadSpec(item) {
  if (item.spec) return item.spec;
  return QC_ITEMS[item.key]?.spec || "-";
}

function qmesIpadMethod(item) {
  return QC_ITEMS[item.key]?.method || "육안";
}

function FieldInputTab() {
  const today = localISODate();
  const inspector = qmesIpadCurrentUser();
  const [sharedVersion, setSharedVersion] = useState(0);
  const [mode, setMode] = useState("");
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipmentInspector, setEquipmentInspector] = useState("");
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState({
    date:today, recvDate:today, inspectDate:today, shipDate:today,
    lot:"", product:"", material:"", supplier:"",
    qty:"", inspectQty:"1", defectQty:"0",
    customer:"", shipQty:"", destination:"",
    inspector:inspector, remarks:""
  });

  const modeMeta = {
    IQC:{ title:"수입검사", code:"IQC", subtitle:"원재료 입고검사" },
    PQC:{ title:"공정검사", code:"PQC", subtitle:"생산공정 품질검사" },
    OQC:{ title:"출하검사", code:"OQC", subtitle:"완제품 출하검사" }
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setStep(0);
    setValues(qmesIpadEmptyValues(nextMode));
    setTried(false);
    setSaving(false);
    setSaved(null);
    setForm({
      date:today, recvDate:today, inspectDate:today, shipDate:today,
      lot:"", product:"", material:"", supplier:"",
      qty:"", inspectQty:"1", defectQty:"0",
      customer:"", shipQty:"", destination:"",
      inspector:inspector, remarks:""
    });
    window.scrollTo({top:0, behavior:"smooth"});
  };

  const patchForm = (patch) => setForm((prev) => ({...prev, ...patch}));
  const items = mode ? qmesIpadItems(mode) : [];
  const item = items[step] || null;
  const statuses = items.map((row) => qmesIpadItemStatus(mode, row, values));
  const overall = statuses.includes("불합격") ? "불합격" : statuses.includes("대기") ? "대기" : "합격";
  const currentStatus = item ? statuses[step] : "대기";
  const lotNo = String(form.lot || "").trim().toUpperCase();
  const lotInfo = qmesIpadLotInfo(lotNo);
  const availableLots = Array.from(new Set((DB.batches || []).map((row) => row.no).filter(Boolean)));

  useEffect(() => {
    let active = true;
    if (typeof qmesSyncPullWorkOrders !== "function") return () => { active = false; };
    Promise.all([
      qmesSyncPullWorkOrders(),
      typeof qmesSyncPushPendingInspections === "function" ? qmesSyncPushPendingInspections() : Promise.resolve(0)
    ])
      .then(() => { if (active) setSharedVersion((value) => value + 1); })
      .catch((error) => console.warn("공용 데이터 동기화 실패:", error.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!mode || mode === "IQC" || !lotNo) return;
    const product = lotInfo.product;
    const qty = lotInfo.lot?.qty || lotInfo.batch?.qty || "";
    setForm((prev) => ({
      ...prev,
      product: product || prev.product,
      shipQty: mode === "OQC" && !prev.shipQty && qty !== "" ? String(qty) : prev.shipQty
    }));
  }, [mode, lotNo]);

  const setSingleValue = (key, value) => {
    setValues((prev) => ({...prev, [key]:value}));
    setTried(false);
  };

  const setArrayValue = (key, index, value) => {
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? [...prev[key]] : ["","",""];
      while (current.length < 3) current.push("");
      current[index] = value;
      return {...prev, [key]:current};
    });
    setTried(false);
  };

  const fillResistanceOverflow = () => {
    setValues((prev) => ({...prev, "절연저항":["Overflow","Overflow","Overflow"]}));
    setTried(false);
  };

  const validationErrors = () => {
    const errors = [];
    if (!lotNo || lotNo.length < 2) errors.push(mode === "IQC" ? "원재료 LOT를 입력하세요." : "생산 LOT를 입력하세요.");
    if (!String(form.inspector || "").trim()) errors.push("검사자를 입력하세요.");
    if (overall === "대기") errors.push("모든 검사 항목을 입력하세요.");

    if (mode === "IQC") {
      const qty = Number(form.qty);
      const inspectQty = Number(form.inspectQty);
      const defectQty = Number(form.defectQty);
      if (!String(form.material || "").trim()) errors.push("원자재명을 입력하세요.");
      if (!Number.isFinite(qty) || qty <= 0) errors.push("입고수량을 0보다 크게 입력하세요.");
      if (!Number.isFinite(inspectQty) || inspectQty <= 0) errors.push("검사수량을 0보다 크게 입력하세요.");
      if (!Number.isFinite(defectQty) || defectQty < 0) errors.push("불량수량을 확인하세요.");
      if (Number.isFinite(inspectQty) && Number.isFinite(defectQty) && defectQty > inspectQty) errors.push("불량수량은 검사수량보다 클 수 없습니다.");
    }

    if (mode === "PQC") {
      if (!String(form.product || "").trim()) errors.push("제품명을 입력하세요.");
      if (lotNo && !qmesProductionComplete(lotNo)) errors.push("생산실적 완료 전에는 공정검사를 저장할 수 없습니다.");
    }

    if (mode === "OQC") {
      const gate = lotNo ? qmesShipmentGate(lotNo) : {ok:false, reason:"생산 LOT를 입력하세요"};
      if (lotNo && !gate.ok) errors.push(`출하 게이트 차단 — ${gate.reason}`);
      if (!String(form.shipDate || "").trim()) errors.push("출하일자를 입력하세요.");
      if (overall === "합격" && !String(form.customer || "").trim()) errors.push("합격 출하건은 고객사를 입력하세요.");
      if (overall === "합격" && !(Number(form.shipQty) > 0)) errors.push("합격 출하건은 출하수량을 입력하세요.");
    }
    return errors;
  };

  const addPopSummary = (id, title, itemCount) => {
    DB.popEntries = DB.popEntries || [];
    DB.popEntries.unshift({
      id, date:form.date || form.inspectDate || today, time:qmesIpadNowTime(), lot:lotNo,
      check:`${title} 일괄입력`, value:`${itemCount}개 항목`, judge:overall,
      inspector:String(form.inspector || "").trim(), source:"IPAD POP",
      auto:[
        `${title} 자동판정 → ${overall}`,
        `${id} 기존 ${mode} 성적서에 저장`,
        `LOT ${lotNo} 추적이력 반영`
      ]
    });
  };

  const saveIqc = () => {
    DB.iqc = DB.iqc || [];
    const inNo = nextInspectionNo("IQC", form.recvDate, DB.iqc, "inNo");
    const row = {
      inNo,
      recv:form.recvDate,
      inspectedAt:form.inspectDate,
      lot:lotNo,
      code:"-",
      name:String(form.material || "").trim(),
      supplier:String(form.supplier || "").trim() || "-",
      qty:qmesQuantityWithUnit(form.qty, "kg"),
      inspectQty:qmesQuantityWithUnit(form.inspectQty, "EA"),
      defectQty:qmesQuantityWithUnit(form.defectQty, "EA"),
      visual:values.visual,
      label:values.label,
      weight:values.weight,
      coa:values.coa,
      remarks:String(form.remarks || "").trim(),
      judge:overall,
      note:overall === "불합격" ? "즉시 격리 → 사용차단 → 업체 통보" : "",
      inspector:String(form.inspector || "").trim(),
      by:String(form.inspector || "").trim(),
      source:"IPAD POP"
    };
    DB.iqc.unshift(row);
    if (overall === "불합격") {
      DB.holds = DB.holds || [];
      DB.holds.unshift({
        id:`HLD-${String(Date.now()).slice(-6)}`,
        target:`${lotNo} (${inNo})`,
        type:"원재료 Lot",
        gate:"IQC 게이트",
        reason:"수입검사 불합격 — 판정·승인 완료 전 생산 불출 차단",
        since:form.inspectDate,
        cond:"격리 후 불합격 처리 확정",
        status:"차단중",
        ncr:"-"
      });
    }
    addPopSummary(inNo, "수입검사", items.length);
    auditLog("IQC", "IPAD 등록", inNo, `${lotNo} / ${overall}`);
    return inNo;
  };

  const savePqc = () => {
    DB.insp = DB.insp || {PQC:[], OQC:[]};
    DB.insp.PQC = DB.insp.PQC || [];
    const baseNo = nextInspectionNo("PQC", form.date, DB.insp.PQC, "id");
    const time = qmesIpadNowTime();
    const product = String(form.product || "").trim();
    const inspectorName = String(form.inspector || "").trim();
    const pqcItems = qmesIpadItems("PQC");
    const judges = Object.fromEntries(pqcItems.map((row) => [row.key, qmesIpadItemStatus("PQC", row, values)]));
    const newRows = pqcItems.map((row, index) => {
      const list = (Array.isArray(values[row.key]) ? values[row.key] : [values[row.key]])
        .map((value) => String(value || "").trim()).filter(Boolean);
      const nums = list.map((value) => Number(value.replace(/,/g, ""))).filter(Number.isFinite);
      return {
        id:`${baseNo}-${index + 1}`,
        groupId:baseNo,
        date:form.date,
        shipDate:"",
        time,
        lot:lotNo,
        product,
        check:row.key,
        value:list.join(" / "),
        measurements:list,
        average:row.key === "외관" || nums.length !== list.length ? null : nums.reduce((sum, value) => sum + value, 0) / nums.length,
        judge:judges[row.key],
        note:QC_ITEMS[row.key]?.stage || "공정",
        remarks:String(form.remarks || "").trim(),
        inspector:inspectorName,
        source:"IPAD POP"
      };
    });
    DB.insp.PQC = [...newRows, ...DB.insp.PQC];
    newRows.forEach((row) => auditLog("PQC", "IPAD 등록", row.id, `${row.lot} / ${row.check} / ${row.value} / ${row.judge}`));

    const lotRecord = DB.lots?.[lotNo];
    if (lotRecord) {
      lotRecord.steps = lotRecord.steps || [];
      newRows.forEach((row) => lotRecord.steps.push({
        stage:"생산",
        name:`공정검사 — ${row.check}`,
        time,
        detail:`측정값 ${row.value} · 규격 ${QC_ITEMS[row.check]?.spec || "-"}`,
        result:row.judge,
        by:inspectorName,
        groupId:baseNo
      }));
      lotRecord.stage = "생산";
      if (overall === "불합격") lotRecord.status = "홀드 — 부적합 발생 (게이트 차단)";
      else if (!String(lotRecord.status || "").includes("홀드")) lotRecord.status = "PQC 합격 — OQC 대기";
      if (overall === "합격" && lotRecord.binderLot && DB.intermediateLots?.[lotRecord.binderLot]) {
        DB.intermediateLots[lotRecord.binderLot].status = "PQC 합격";
        DB.intermediateLots[lotRecord.binderLot].updatedAt = new Date().toISOString();
      }
    }
    if (overall === "불합격") {
      DB.holds = DB.holds || [];
      DB.holds.unshift({
        id:`HLD-${String(Date.now()).slice(-6)}`,
        target:lotNo,
        type:"제품 Lot",
        gate:"공정 게이트",
        reason:"공정검사 부적합 항목 발생",
        since:time,
        cond:"재검사 합격 + 품질부장 승인",
        status:"차단중",
        ncr:"-"
      });
    }
    addPopSummary(baseNo, "공정검사", newRows.length);
    return baseNo;
  };

  const saveOqc = () => {
    DB.insp = DB.insp || {PQC:[], OQC:[]};
    DB.insp.OQC = DB.insp.OQC || [];
    const baseNo = nextInspectionNo("OQC", form.date, DB.insp.OQC, "id");
    const time = qmesIpadNowTime();
    const inspectorName = String(form.inspector || "").trim();
    const product = String(form.product || "").trim();
    const customer = String(form.customer || "").trim();
    const shipQty = Number(form.shipQty);
    const oqcItems = qmesIpadItems("OQC");
    const judges = Object.fromEntries(oqcItems.map((row) => [row.key, qmesIpadItemStatus("OQC", row, values)]));
    const newRows = oqcItems.map((row, index) => {
      const list = (Array.isArray(values[row.key]) ? values[row.key] : [values[row.key]])
        .map((value) => String(value || "").trim()).filter(Boolean);
      const nums = list.map((value) => Number(value.replace(/,/g, ""))).filter(Number.isFinite);
      return {
        id:`${baseNo}-${index + 1}`,
        groupId:baseNo,
        date:form.date,
        shipDate:form.shipDate,
        time,
        lot:lotNo,
        product,
        check:row.key,
        customer,
        shipQty,
        destination:String(form.destination || "").trim(),
        value:list.join(" / "),
        measurements:list,
        average:nums.length === list.length && list.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : null,
        judge:judges[row.key],
        note:QC_ITEMS[row.key]?.stage || "출하",
        remarks:String(form.remarks || "").trim(),
        inspector:inspectorName,
        source:"IPAD POP"
      };
    });
    DB.insp.OQC = [...newRows, ...DB.insp.OQC];
    newRows.forEach((row) => auditLog("OQC", "IPAD 등록", row.id, `${row.lot} / ${row.check} / ${row.value} / ${row.judge}`));

    const lotRecord = DB.lots?.[lotNo];
    if (lotRecord) {
      lotRecord.steps = lotRecord.steps || [];
      newRows.forEach((row) => lotRecord.steps.push({
        stage:"출하",
        name:`출하검사 — ${row.check}`,
        time,
        detail:`측정값 ${row.value} · 규격 ${QC_ITEMS[row.check]?.spec || "-"}`,
        result:row.judge,
        by:inspectorName,
        groupId:baseNo
      }));
      if (overall === "불합격") {
        lotRecord.status = "홀드 — 부적합 발생 (출하 게이트 차단)";
        lotRecord.stage = "생산";
      } else {
        lotRecord.ship = {
          customer,
          qty:shipQty,
          shipQty,
          shipDate:form.shipDate,
          date:form.shipDate,
          destination:String(form.destination || "").trim(),
          shipNo:baseNo,
          inspector:inspectorName,
          confirmedAt:new Date().toISOString()
        };
        lotRecord.stage = "출하";
        lotRecord.status = "출하완료";
        lotRecord.steps.push({
          stage:"출하",
          name:"제품 출하확정",
          time:form.shipDate,
          detail:`고객사 ${customer} · 출하수량 ${shipQty.toLocaleString()} kg${form.destination ? ` · 납품처 ${form.destination}` : ""}`,
          result:"출하완료",
          by:inspectorName,
          shipNo:baseNo
        });
      }
    }
    if (overall === "불합격") {
      DB.holds = DB.holds || [];
      DB.holds.unshift({
        id:`HLD-${String(Date.now()).slice(-6)}`,
        target:lotNo,
        type:"제품 Lot",
        gate:"출하 게이트",
        reason:"출하검사 부적합 항목 발생",
        since:time,
        cond:"재검사 합격 + 품질부장 승인",
        status:"차단중",
        ncr:"-"
      });
    }
    addPopSummary(baseNo, "출하검사", newRows.length);
    return baseNo;
  };

  const makeSyncPayload = (id) => {
    const rows = mode === "IQC"
      ? (DB.iqc || []).filter((row) => row.inNo === id)
      : (DB.insp?.[mode] || []).filter((row) => row.groupId === id);
    const holds = (DB.holds || []).filter((row) => String(row.target || "").includes(lotNo));
    return {
      mode,
      lotNo,
      rows,
      lotRecord:DB.lots?.[lotNo] || null,
      holds,
      savedAt:new Date().toISOString(),
      savedBy:String(form.inspector || "").trim()
    };
  };

  const retrySavedSync = async () => {
    if (!saved?.syncPayload || typeof qmesSyncUpsert !== "function") return;
    setSaving(true);
    try {
      await qmesSyncUpsert(saved.syncType, saved.id, saved.syncPayload);
      saved.syncPayload.rows.forEach((row) => { row.sharedSync = true; });
      dbSave();
      setSaved((prev) => ({...prev, synced:true, syncError:""}));
    } catch (error) {
      setSaved((prev) => ({...prev, synced:false, syncError:error.message}));
    } finally {
      setSaving(false);
    }
  };

  const saveInspection = async () => {
    if (saving) return;
    const errors = validationErrors();
    if (errors.length) {
      if (mode === "PQC" && lotNo && !qmesProductionComplete(lotNo)) {
        qmesRecordGateBlock("공정 게이트", lotNo, "생산실적 완료 전 PQC 등록 금지");
        dbSave();
      }
      if (mode === "OQC" && lotNo) {
        const gate = qmesShipmentGate(lotNo);
        if (!gate.ok) {
          qmesRecordGateBlock("출하 게이트", lotNo, gate.reason);
          dbSave();
        }
      }
      setTried(true);
      return;
    }

    setSaving(true);
    let id = "";
    if (mode === "IQC") id = saveIqc();
    if (mode === "PQC") id = savePqc();
    if (mode === "OQC") id = saveOqc();
    dbSave();
    const syncPayload = makeSyncPayload(id);
    const syncType = mode.toLowerCase();
    try {
      if (typeof qmesSyncUpsert !== "function") throw new Error("공용 동기화 모듈을 불러오지 못했습니다.");
      await qmesSyncUpsert(syncType, id, syncPayload);
      syncPayload.rows.forEach((row) => { row.sharedSync = true; });
      dbSave();
      setSaved({id, title:modeMeta[mode].title, judge:overall, synced:true, syncType, syncPayload, syncError:""});
    } catch (error) {
      setSaved({id, title:modeMeta[mode].title, judge:overall, synced:false, syncType, syncPayload, syncError:error.message});
    }
    setSaving(false);
    window.scrollTo({top:0, behavior:"smooth"});
  };

  if (equipmentOpen) {
    return (
      <div className="qmes-ipad-pop">
        <header className="qmes-ipad-work-head">
          <button type="button" className="qmes-ipad-back" onClick={() => setEquipmentOpen(false)}>← 현장입력 선택</button>
          <div><span>EQ</span><h1>설비점검 현장입력</h1></div>
          <div className="qmes-ipad-inspector qmes-ipad-equipment-inspector">
            <span className="qmes-ipad-inspector-label">점검자</span>
            <div className="qmes-ipad-equipment-inspector-row">
              <strong>생산부</strong>
              <input
                value={equipmentInspector}
                onChange={(event) => setEquipmentInspector(event.target.value)}
                placeholder="이름 입력"
                aria-label="설비 점검자 이름"
              />
            </div>
          </div>
        </header>
        <div className="qmes-ipad-equipment">
          <EquipmentTab inspectorName={equipmentInspector} inspectorDept="생산부" />
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="qmes-ipad-pop">
        <header className="qmes-ipad-hero">
          <div>
            <span>IPAD FIELD INSPECTION</span>
            <h1>현장검사 POP</h1>
            <p>검사 종류를 선택하면 기존 성적서에 바로 저장됩니다.</p>
          </div>
          <div className="qmes-ipad-inspector qmes-ipad-home-inspector"><span className="qmes-ipad-inspector-label">검사자 :</span><strong>{inspector}</strong></div>
        </header>
        <div className="qmes-ipad-home-grid">
          {Object.entries(modeMeta).map(([key, meta]) => (
            <button key={key} type="button" className={`qmes-ipad-home-card is-${key.toLowerCase()}`} onClick={() => selectMode(key)}>
              <span className="qmes-ipad-home-code">{meta.code}</span>
              <strong>{meta.title}</strong>
              <small>{meta.subtitle}</small>
              <i>입력 시작 →</i>
            </button>
          ))}
          <button type="button" className="qmes-ipad-home-card is-equipment" onClick={() => setEquipmentOpen(true)}>
            <span className="qmes-ipad-home-code">EQ</span>
            <strong>설비점검</strong>
            <small>PLC·계측기 순회점검</small>
            <i>점검 시작 →</i>
          </button>
        </div>
        <div className="qmes-ipad-home-note">
          자동판정 · PC 공용 DB 동기화 · 기존 성적서 연동 · LOT 추적 · 부적합 자동 홀드
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="qmes-ipad-pop">
        <div className={`qmes-ipad-saved is-${saved.judge === "합격" ? "pass" : "fail"}`}>
          <div className="qmes-ipad-saved-icon">{saved.judge === "합격" ? "✓" : "!"}</div>
          <span>{saved.title} 저장 완료</span>
          <h2>{saved.id}</h2>
          <strong>{saved.judge}</strong>
          <p>{saved.synced ? `공용 DB와 기존 ${mode} 성적서에 반영되었습니다.` : "이 기기에는 저장됐지만 PC 공용 DB 저장에 실패했습니다."}</p>
          {!saved.synced && (
            <div className="qmes-ipad-sync-warning">
              <strong>{saved.syncError || "공용 DB 연결을 확인하세요."}</strong>
              <button type="button" onClick={retrySavedSync} disabled={saving}>{saving ? "재전송 중..." : "PC 공용 DB에 다시 전송"}</button>
            </div>
          )}
          <div>
            <button type="button" onClick={() => selectMode(mode)}>같은 검사 새로 입력</button>
            <button type="button" className="secondary" onClick={() => setMode("")}>검사 선택으로 이동</button>
          </div>
        </div>
      </div>
    );
  }

  const errors = tried ? validationErrors() : [];
  const progress = Math.round(((step + 1) / items.length) * 100);
  const meta = modeMeta[mode];

  return (
    <div className="qmes-ipad-pop">
      <header className="qmes-ipad-work-head">
        <button type="button" className="qmes-ipad-back" onClick={() => setMode("")}>← 검사 선택</button>
        <div><span>{meta.code}</span><h1>{meta.title} IPAD 입력</h1></div>
        <div className="qmes-ipad-inspector qmes-ipad-field-inspector"><span className="qmes-ipad-inspector-label">검사자 :</span><strong>{String(form.inspector || "").replace(/\s*\(U-\d+\)\s*$/i, "")}</strong></div>
      </header>

      <nav className="qmes-ipad-mode-tabs">
        {Object.entries(modeMeta).map(([key, row]) => (
          <button key={key} type="button" className={mode === key ? "is-active" : ""} onClick={() => selectMode(key)}>
            <small>{row.code}</small><strong>{row.title}</strong>
          </button>
        ))}
      </nav>

      <section className="qmes-ipad-section">
        <div className="qmes-ipad-section-title"><span>1</span><div><h2>검사 기본정보</h2><p>성적서에 저장될 정보를 입력하세요.</p></div></div>
        <div className="qmes-ipad-form-grid">
          {mode === "IQC" ? (
            <>
              <label><span>입고일자</span><input type="date" value={form.recvDate} onChange={(e) => patchForm({recvDate:e.target.value})} /></label>
              <label><span>원자재명 <b>*</b></span><input value={form.material} onChange={(e) => patchForm({material:e.target.value})} placeholder="원자재명 입력" list="qmes-ipad-materials" /></label>
              <datalist id="qmes-ipad-materials">
                {[...new Set([...(typeof IQC_MATERIALS !== "undefined" ? IQC_MATERIALS : []), ...(DB.iqcMaterials || [])])].map((name) => <option key={name} value={name} />)}
              </datalist>
              <label><span>업체명</span><input value={form.supplier} onChange={(e) => patchForm({supplier:e.target.value})} placeholder="업체명 입력" /></label>
              <label><span>원재료 LOT <b>*</b></span><input className="lot" value={form.lot} onChange={(e) => patchForm({lot:e.target.value.toUpperCase()})} placeholder="바코드 스캔 또는 LOT 직접 입력" /></label>
              <label><span>검사일자</span><input type="date" value={form.inspectDate} onChange={(e) => patchForm({inspectDate:e.target.value})} /></label>
              <label><span>입고중량 (kg) <b>*</b></span><input inputMode="decimal" value={form.qty} onChange={(e) => patchForm({qty:e.target.value})} placeholder="0" /></label>
              <label><span>검사수량 (EA) <b>*</b></span><input inputMode="numeric" value={form.inspectQty} onChange={(e) => patchForm({inspectQty:e.target.value})} /></label>
              <label><span>불량수량 (EA)</span><input inputMode="numeric" value={form.defectQty} onChange={(e) => patchForm({defectQty:e.target.value})} /></label>
              <label><span>검사자</span><input value={form.inspector} onChange={(e) => patchForm({inspector:e.target.value})} placeholder="검사자 입력" /></label>
            </>
          ) : (
            <>
              <label className="wide"><span>생산 LOT <b>*</b></span>
                <input className="lot" value={form.lot} onChange={(e) => patchForm({lot:e.target.value.toUpperCase()})} placeholder="바코드 스캔 또는 LOT 직접 입력" list="qmes-ipad-lots" />
                <datalist id="qmes-ipad-lots">{availableLots.map((lot) => <option key={lot} value={lot} />)}</datalist>
              </label>
              <label><span>제품명 <b>*</b></span><input value={form.product} onChange={(e) => patchForm({product:e.target.value})} placeholder="LOT 입력 시 자동 표시" /></label>
              <label><span>검사일자</span><input type="date" value={form.date} onChange={(e) => patchForm({date:e.target.value})} /></label>
              {mode === "OQC" && (
                <>
                  <label><span>출하일자 <b>*</b></span><input type="date" value={form.shipDate} onChange={(e) => patchForm({shipDate:e.target.value})} /></label>
                  <label><span>고객사 <b>*</b></span><input value={form.customer} onChange={(e) => patchForm({customer:e.target.value})} placeholder="고객사명" /></label>
                  <label><span>출하수량 (kg) <b>*</b></span><input inputMode="decimal" value={form.shipQty} onChange={(e) => patchForm({shipQty:e.target.value})} placeholder="0" /></label>
                  <label><span>납품처</span><input value={form.destination} onChange={(e) => patchForm({destination:e.target.value})} placeholder="납품처" /></label>
                </>
              )}
            </>
          )}
          {mode !== "IQC" && <label><span>검사자</span><input value={form.inspector} onChange={(e) => patchForm({inspector:e.target.value})} placeholder="검사자 입력" /></label>}
          <label className="wide"><span>비고</span><input value={form.remarks} onChange={(e) => patchForm({remarks:e.target.value})} placeholder="특이사항 입력" /></label>
        </div>
        {mode === "PQC" && lotNo && (
          <div className={`qmes-ipad-gate ${qmesProductionComplete(lotNo) ? "is-open" : "is-blocked"}`}>
            {qmesProductionComplete(lotNo) ? "생산실적 완료 — 공정검사 가능" : "생산실적 미완료 — 공정검사 저장 차단"}
          </div>
        )}
        {mode === "OQC" && lotNo && (() => {
          const gate = qmesShipmentGate(lotNo);
          return <div className={`qmes-ipad-gate ${gate.ok ? "is-open" : "is-blocked"}`}>{gate.reason}</div>;
        })()}
      </section>

      <section className="qmes-ipad-section">
        <div className="qmes-ipad-section-title">
          <span>2</span>
          <div><h2>검사 항목</h2><p>{step + 1}/{items.length} · {item.label}</p></div>
          <div className={`qmes-ipad-current-judge is-${currentStatus}`}>{currentStatus}</div>
        </div>
        <div className="qmes-ipad-progress"><i style={{width:`${progress}%`}} /></div>
        <div className="qmes-ipad-item-tabs">
          {items.map((row, index) => (
            <button type="button" key={row.key} className={`${step === index ? "is-active" : ""} is-${statuses[index]}`} onClick={() => setStep(index)}>
              <span>{index + 1}</span><strong>{row.label}</strong><small>{statuses[index]}</small>
            </button>
          ))}
        </div>

        <div className="qmes-ipad-measure-card">
          <div className="qmes-ipad-measure-head">
            <div><span>{item.label}</span><strong>{qmesIpadSpec(item)}</strong></div>
            <small>{qmesIpadMethod(item)}</small>
          </div>

          {item.type === "choice" && (
            <div className="qmes-ipad-choice">
              {item.choices.map((choice) => (
                <button type="button" key={choice} className={values[item.key] === choice ? "is-selected" : ""} onClick={() => setSingleValue(item.key, choice)}>{choice}</button>
              ))}
            </div>
          )}

          {(item.type === "choice3" || item.type === "resistance3") && (
            <div className="qmes-ipad-repeat-choice">
              {item.type === "resistance3" && (
                <button type="button" className="qmes-ipad-overflow-all" onClick={fillResistanceOverflow}>3회 모두 Overflow</button>
              )}
              {[0,1,2].map((index) => (
                <div key={index}>
                  <span>{index + 1}회</span>
                  <div>
                    {item.choices.filter((choice) => choice !== "직접입력").map((choice) => (
                      <button type="button" key={choice} className={(values[item.key] || [])[index] === choice ? "is-selected" : ""} onClick={() => setArrayValue(item.key, index, choice)}>{choice}</button>
                    ))}
                    {item.type === "resistance3" && (
                      <input inputMode="decimal" value={(values[item.key] || [])[index] === "Overflow" ? "" : (values[item.key] || [])[index] || ""} onChange={(e) => setArrayValue(item.key, index, e.target.value)} placeholder="측정값" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {item.type === "triple" && (
            <div className="qmes-ipad-triple">
              {[0,1,2].map((index) => (
                <label key={index}><span>{index + 1}회 측정</span><input inputMode="decimal" value={(values[item.key] || [])[index] || ""} onChange={(e) => setArrayValue(item.key, index, e.target.value)} placeholder="측정값" /></label>
              ))}
            </div>
          )}
        </div>

        <div className="qmes-ipad-step-actions">
          <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>이전</button>
          {step < items.length - 1 ? (
            <button type="button" className="primary" disabled={currentStatus === "대기"} onClick={() => setStep((value) => Math.min(items.length - 1, value + 1))}>다음 검사</button>
          ) : (
            <button type="button" className="save" disabled={saving} onClick={saveInspection}>{saving ? "저장 중..." : "검사 완료 · 성적서 저장"}</button>
          )}
        </div>
      </section>

      <div className={`qmes-ipad-overall is-${overall}`}>
        <span>전체 판정</span><strong>{overall}</strong><small>{statuses.filter((status) => status !== "대기").length}/{items.length} 항목 완료</small>
      </div>

      {errors.length > 0 && (
        <div className="qmes-ipad-errors">
          <strong>저장할 수 없습니다.</strong>
          {errors.map((error, index) => <p key={`${error}-${index}`}>• {error}</p>)}
        </div>
      )}
    </div>
  );
}