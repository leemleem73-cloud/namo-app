/* QMES module: pqc — extracted from index.html without logic changes. */

function InspectionTab({ docName, itemKeys, initial, lotOptions, idPrefix, idStart, notice, storeKey, traceStage }) {
  const today = new Date().toISOString().slice(0, 10);
  const isOqc = storeKey === "OQC";
  const [records, setRecords] = useState(DB.insp[storeKey] || initial);
  const [form, setForm] = useState({
    date: today,
    shipDate: today,
    lot: isOqc ? (DB.batches?.[0]?.no || lotOptions?.[0] || "") : "",
    product: "",
    check: itemKeys[0],
    value: "",
    value1: "",
    value2: "",
    value3: "",
    judge: "합격",
    inspector: "",
    customer: "",
    shipQty: isOqc ? String(DB.lots?.[DB.batches?.[0]?.no]?.qty || DB.batches?.[0]?.qty || "") : "",
    destination: "",
    remarks: ""
  });
  const [measurementRows, setMeasurementRows] = useState([]);
  const [measurementInput, setMeasurementInput] = useState("");
  const makeInitialPqcValues = () => ({ "점도":["","",""], "고형분":["","",""], "입도(Dmax)":["","",""], "외관":["이상없음"] });
  const makeInitialOqcValues = () => Object.fromEntries(itemKeys.map((k) => [k, k === "외관" ? ["이상없음","이상없음","이상없음"] : k === "전해액 안정성" ? ["미탈리","미탈리","미탈리"] : k === "절연저항" ? ["Overflow","Overflow","Overflow"] : ["","",""]]));
  const [pqcValues, setPqcValues] = useState(makeInitialPqcValues());
  const [oqcValues, setOqcValues] = useState(makeInitialOqcValues());
  const [tried, setTried] = useState(false);
  const [nextId, setNextId] = useState(DB.seqs[storeKey] || idStart);
  const [editingId, setEditingId] = useState(null);
  const [recordSearch, setRecordSearch] = useState("");
  const [recordYear, setRecordYear] = useState("ALL");
  const [recordMonth, setRecordMonth] = useState("ALL");
  const [recordPage, setRecordPage] = useState(1);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [measurementPreviewRows, setMeasurementPreviewRows] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const recordPageSize = 10;
  const availableLots = Array.from(new Set((DB.batches || []).map((b) => b.no).filter(Boolean)));
  const selectedBatch = (DB.batches || []).find((b) => b.no === form.lot);
  const selectedLot = DB.lots?.[form.lot];
  const rawSelectedProduct = selectedBatch?.itemName || selectedBatch?.item || selectedLot?.itemName || "";
  const selectedProduct = isOqc
    ? (rawSelectedProduct === "절연 슬러리" ? "" : rawSelectedProduct)
    : form.product;
  const shipmentCustomer = String(form.customer || "").trim();
  const shipmentQty = Number(String(form.shipQty || "").replace(/,/g, ""));
  const shipmentInfoComplete = shipmentCustomer !== "" && Number.isFinite(shipmentQty) && shipmentQty > 0;
  const numberLabel = isOqc ? "출하번호" : "공정번호";
  const previewNo = editingId || nextInspectionNo(storeKey, form.date, records, "id");

  const inspectionGroupKey = (row) => {
    const explicit = String(row?.groupId || "").trim();
    if (explicit) return explicit;
    const lot = String(row?.lot || "").trim();
    const date = String(row?.date || row?.shipDate || "").slice(0, 10);
    return lot || date ? `${lot}|${date}` : String(row?.id || "").replace(/-\d+$/, "");
  };
  const buildInspectionGroups = (sourceRows) => {
    const map = new Map();
    (sourceRows || []).forEach((row) => {
      const key = inspectionGroupKey(row);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries()).map(([key, rows]) => ({
      key, rows,
      representative: rows[0],
      judge: rows.length > 0 && rows.every((row) => row.judge === "합격") ? "합격" : "불합격"
    }));
  };
  const currentMonth = today.slice(0, 7);
  const monthGroups = buildInspectionGroups(records.filter((r) => String(r.date || r.shipDate || "").slice(0, 7) === currentMonth));
  const todayGroups = buildInspectionGroups(records.filter((r) => String(r.date || r.shipDate || "").slice(0, 10) === today));
  const pass = monthGroups.filter((g) => g.judge === "합격").length;
  const fail = monthGroups.filter((g) => g.judge === "불합격").length;
  const rate = monthGroups.length ? ((pass / monthGroups.length) * 100).toFixed(1) : "—";
  const spec = QC_ITEMS[form.check];
  const isNumericItem = spec.lo != null || spec.hi != null;
  const pendingMeasurement = String(measurementInput || "").trim();
  const measurementValues = [
    ...measurementRows.map((v) => String(v || "").trim()),
    ...(pendingMeasurement ? [pendingMeasurement] : [])
  ].filter((v) => v !== "");
  const measurementComplete = measurementValues.length > 0;
  const numericMeasurementValues = measurementValues
    .map((v) => v.replace(/,/g, ""))
    .filter((v) => /^[-+]?\d+(?:\.\d+)?$/.test(v));
  const measurementAverage = measurementComplete
    && numericMeasurementValues.length === measurementValues.length
    ? numericMeasurementValues.reduce((sum, v) => sum + Number(v), 0) / numericMeasurementValues.length
    : null;
  const trimmedVal = measurementComplete ? measurementValues.join(" / ") : "";
  const inputError = null;
  const autoJ = isNumericItem && measurementAverage != null && !inputError
    ? autoJudge(form.check, String(measurementAverage))
    : null;
  const oqcAutoJudge = (() => {
    const values = measurementValues.map((v) => String(v || "").trim().toLowerCase());
    if (!values.length) return "합격";
    if (form.check === "전해액 안정성") return values.every((v) => v === "미탈리") ? "합격" : "불합격";
    if (form.check === "외관") return values.every((v) => v === "이상없음" || v === "정상") ? "합격" : "불합격";
    if (form.check === "절연저항" && values.some((v) => v.includes("overflow"))) return "합격";
    return autoJ || "합격";
  })();
  const pqcItems = ["점도", "고형분", "입도(Dmax)", "외관"];
  const pqcComplete = pqcItems.every((k) => {
    const vals = Array.isArray(pqcValues[k]) ? pqcValues[k] : [pqcValues[k]];
    return vals.length > 0 && vals.every((v) => String(v || "").trim() !== "");
  });
  const pqcJudges = Object.fromEntries(pqcItems.map((k) => {
    const vals = (Array.isArray(pqcValues[k]) ? pqcValues[k] : [pqcValues[k]]).map((v)=>String(v||"").trim()).filter(Boolean);
    if (k === "외관") return [k, vals[0] === "이상없음" ? "합격" : "불합격"];
    const allPass = vals.length > 0 && vals.every((v) => autoJudge(k, v) === "합격");
    return [k, allPass ? "합격" : "불합격"];
  }));
  const pqcOverallJudge = pqcItems.every((k) => pqcJudges[k] === "합격") ? "합격" : "불합격";
  const oqcItems = itemKeys;
  const oqcComplete = oqcItems.every((k) => {
    const vals = Array.isArray(oqcValues[k]) ? oqcValues[k] : [oqcValues[k]];
    return vals.length >= 3 && vals.slice(0, 3).every((v) => String(v || "").trim() !== "");
  });
  const oqcJudges = Object.fromEntries(oqcItems.map((k) => {
    const vals = (Array.isArray(oqcValues[k]) ? oqcValues[k] : [oqcValues[k]]).map((v)=>String(v||"").trim()).filter(Boolean);
    let judge = "합격";
    if (k === "외관") judge = vals.length > 0 && vals.every((v)=>v === "이상없음" || v === "정상") ? "합격" : "불합격";
    else if (k === "전해액 안정성") judge = vals.length > 0 && vals.every((v)=>v === "미탈리") ? "합격" : "불합격";
    else if (k === "절연저항" && vals.some((v)=>v.toLowerCase().includes("overflow"))) judge = "합격";
    else judge = vals.length > 0 && vals.every((v)=>autoJudge(k, v) === "합격") ? "합격" : "불합격";
    return [k, judge];
  }));
  const oqcOverallJudge = oqcItems.every((k) => oqcJudges[k] === "합격") ? "합격" : "불합격";
  const singleValueJudge = (item, rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return null;
    if (item === "외관") return (value === "이상없음" || value === "정상") ? "합격" : "불합격";
    if (item === "전해액 안정성") return value === "미탈리" ? "합격" : "불합격";
    if (item === "절연저항") return value.toLowerCase().includes("overflow") ? "합격" : "불합격";
    return autoJudge(item, value);
  };
  const valueStateClass = (item, value) => singleValueJudge(item, value) === "불합격" ? "qmes-measure-out" : "";
  const lotErr = isOqc && form.lot.trim() !== "" && availableLots.length > 0 && !availableLots.includes(form.lot.trim())
    ? "작업지시에서 발행된 LOT를 선택하세요." : null;
  const processGate = !isOqc && form.lot.trim()
    ? (qmesProductionComplete(form.lot.trim())
        ? { ok:true, reason:"생산실적 완료" }
        : { ok:false, reason:"생산실적 완료 전 PQC 등록 금지" })
    : { ok:false, reason:"작업지시 LOT를 선택하세요" };
  const shipmentGate = isOqc && form.lot.trim()
    ? qmesShipmentGate(form.lot.trim())
    : { ok:false, reason:"작업지시 LOT를 선택하세요" };
  const triedErrors = [];
  if (tried && form.lot.trim() === "") triedErrors.push("작업지시 LOT를 선택하세요.");
  if (tried && form.date.trim() === "") triedErrors.push("검사일자를 입력하세요");
  if (isOqc && tried && form.shipDate.trim() === "") triedErrors.push("출하일자를 입력하세요");
  if (isOqc && tried && oqcOverallJudge === "합격" && shipmentCustomer === "") triedErrors.push("출하검사 합격 시 고객사를 입력하세요");
  if (isOqc && tried && oqcOverallJudge === "합격" && !(Number.isFinite(shipmentQty) && shipmentQty > 0)) triedErrors.push("출하검사 합격 시 출하수량을 0보다 크게 입력하세요");
  if (tried && String(form.inspector || "").trim() === "") triedErrors.push("검사자를 입력하세요");
  if (!isOqc && tried && form.product.trim() === "") triedErrors.push("제품명을 입력하세요");
  if (!isOqc && tried && !pqcComplete) triedErrors.push("점도, 고형분, 입도, 외관 측정값을 모두 입력하세요");
  if (isOqc && tried && !oqcComplete) triedErrors.push("출하검사 8개 항목의 측정값을 3회씩 모두 입력하세요");
  if (!isOqc && tried && !processGate.ok) triedErrors.push(processGate.reason);
  if (isOqc && tried && !shipmentGate.ok) triedErrors.push(`출하 게이트 차단 — ${shipmentGate.reason}`);
  const canAdd = isOqc
    ? (oqcComplete && !lotErr && shipmentGate.ok && form.date.trim() !== "" && form.lot.trim() !== "" && form.shipDate.trim() !== "" && String(form.inspector || "").trim() !== "" && (oqcOverallJudge !== "합격" || shipmentInfoComplete))
    : (pqcComplete && processGate.ok && form.date.trim() !== "" && form.lot.trim() !== "" && form.product.trim() !== "" && String(form.inspector || "").trim() !== "");

  const addRecord = () => {
    if (!canAdd) {
      const gate = isOqc ? shipmentGate : processGate;
      if (form.lot.trim() && !gate.ok) {
        qmesRecordGateBlock(isOqc ? "출하 게이트" : "공정 게이트", form.lot.trim(), gate.reason);
        dbSave();
      }
      setTried(true);
      return;
    }
    if (!isOqc) {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const date = form.date;
      const lotNo = form.lot.trim();
      const product = form.product.trim();
      const baseNo = editingId || nextInspectionNo(storeKey, date, records, "id");
      const inspector = String(form.inspector || "").trim();
      const newRows = pqcItems.map((check, idx) => {
        const values = (Array.isArray(pqcValues[check]) ? pqcValues[check] : [pqcValues[check]])
          .map((v)=>String(v||"").trim()).filter(Boolean);
        const nums = values.map((v)=>Number(v.replace(/,/g,""))).filter((v)=>Number.isFinite(v));
        return {
          id: editingId && idx === 0 ? editingId : `${baseNo}-${idx + 1}`,
          groupId: baseNo,
          date, shipDate:"", time, lot:lotNo, product, check,
          value:values.join(" / "),
          measurements:values,
          average:check === "외관" || nums.length !== values.length ? null : nums.reduce((a,b)=>a+b,0)/nums.length,
          judge:pqcJudges[check], note:`${QC_ITEMS[check]?.stage || "공정"}`, remarks:form.remarks || "", inspector
        };
      });
      const next = editingId
        ? [...records.filter((r)=>inspectionGroupKey(r) !== editingId), ...newRows]
        : [...newRows, ...records];
      setRecords(next); DB.insp[storeKey]=next;
      newRows.forEach((rec)=>auditLog(storeKey, editingId ? "수정" : "등록", rec.id, `${rec.lot} / ${rec.check} / ${rec.value} / ${rec.judge}`));
      const L=DB.lots[lotNo];
      if(L){
        newRows.forEach((rec)=>{L.steps=[...L.steps,{stage:traceStage,name:`${docName.replace(" 성적서","")} — ${rec.check}`,time,detail:`측정값 ${rec.value} · 규격 ${QC_ITEMS[rec.check]?.spec || "-"}`,result:rec.judge,by:inspector}]});
        if(pqcOverallJudge==="불합격") L.status="홀드 — 부적합 발생 (게이트 차단)";
        else {
          L.stage="생산";
          if(!L.status.includes("홀드")) L.status="PQC 합격 — OQC 대기";
          if (L.binderLot && DB.intermediateLots?.[L.binderLot]) {
            DB.intermediateLots[L.binderLot].status = "PQC 합격";
            DB.intermediateLots[L.binderLot].updatedAt = new Date().toISOString();
          }
        }
      }
      if(pqcOverallJudge==="불합격"){
        DB.holds=[{id:`HLD-${String(Date.now()).slice(-6)}`,target:lotNo,type:"제품 Lot",gate:"공정 게이트",reason:`공정검사 부적합 항목 발생`,since:time,cond:"재검사 합격 + 품질부장 승인",status:"차단중",ncr:"-"},...DB.holds];
      }
      dbSave();
      setEditingId(null); setPqcValues(makeInitialPqcValues()); setTried(false); setShowRegisterModal(false);
      setRecordSearch(""); setRecordYear("ALL"); setRecordMonth("ALL"); setRecordPage(1);
      return;
    }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const date = form.date;
    const lotNo = form.lot.trim();
    const baseNo = editingId || nextInspectionNo(storeKey, date, records, "id");
    const matchedBatch = (DB.batches || []).find((b) => b.no === lotNo);
    const matchedProduct = matchedBatch?.itemName || matchedBatch?.item || "";
    const product = matchedProduct === "절연 슬러리" ? "" : matchedProduct;
    const inspector = String(form.inspector || "").trim();
    const newRows = oqcItems.map((check, idx) => {
      const values = (Array.isArray(oqcValues[check]) ? oqcValues[check] : [oqcValues[check]])
        .map((v)=>String(v||"").trim()).filter(Boolean);
      const nums = values.map((v)=>Number(v.replace(/,/g,""))).filter((v)=>Number.isFinite(v));
      return {
        id: `${baseNo}-${idx + 1}`, groupId: baseNo, date, shipDate:form.shipDate, time, lot:lotNo, product, check,
        customer:shipmentCustomer, shipQty:shipmentQty, destination:String(form.destination || "").trim(),
        value:values.join(" / "), measurements:values,
        average:nums.length === values.length && values.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null,
        judge:oqcJudges[check], note:`${QC_ITEMS[check]?.stage || "출하"}`, remarks:form.remarks || "", inspector
      };
    });
    const next = editingId
      ? [...records.filter((r)=>inspectionGroupKey(r) !== editingId), ...newRows]
      : [...newRows, ...records];
    setRecords(next);
    DB.insp[storeKey] = next;
    newRows.forEach((rec)=>auditLog(storeKey, editingId ? "수정" : "등록", rec.id, `${rec.lot} / ${rec.check} / ${rec.value} / ${rec.judge}`));

    const L = DB.lots[lotNo];
    if (L) {
      // 수정 저장 시 같은 출하번호의 이전 OQC·출하확정 이력을 먼저 제거하여 중복 기록을 방지한다.
      L.steps = (L.steps || []).filter((step) => step.groupId !== baseNo && step.shipNo !== baseNo);
      newRows.forEach((rec)=>{
        L.steps=[...(L.steps || []),{stage:traceStage,name:`${docName.replace(" 성적서","")} — ${rec.check}`,time,detail:`측정값 ${rec.value} · 규격 ${QC_ITEMS[rec.check]?.spec || "-"}`,result:rec.judge,by:inspector,groupId:baseNo}];
      });
      if (oqcOverallJudge === "불합격") {
        L.status = "홀드 — 부적합 발생 (출하 게이트 차단)";
        L.stage = "생산";
        if (L.ship?.shipNo === baseNo) L.ship = null;
      } else {
        const shipDetail = {
          customer: shipmentCustomer,
          qty: shipmentQty,
          shipQty: shipmentQty,
          shipDate: form.shipDate,
          date: form.shipDate,
          destination: String(form.destination || "").trim(),
          shipNo: baseNo,
          inspector,
          confirmedAt: new Date().toISOString()
        };
        L.ship = shipDetail;
        L.stage = "출하";
        L.status = "출하완료";
        L.steps=[...(L.steps || []),{
          stage:"출하", name:"제품 출하확정", time:form.shipDate,
          detail:`고객사 ${shipmentCustomer} · 출하수량 ${shipmentQty.toLocaleString()} kg${shipDetail.destination ? ` · 납품처 ${shipDetail.destination}` : ""}`,
          result:"출하완료", by:inspector, shipNo:baseNo
        }];
        if (matchedBatch) {
          matchedBatch.status = "출하완료";
          matchedBatch.ship = shipDetail;
        }
      }
    }
    if (oqcOverallJudge === "불합격") {
      DB.holds=[{id:`HLD-${String(Date.now()).slice(-6)}`,target:lotNo,type:"제품 Lot",gate:"출하 게이트",reason:"출하검사 부적합 항목 발생",since:time,cond:"재검사 합격 + 품질부장 승인",status:"차단중",ncr:"-"},...DB.holds];
    }
    if (L && oqcOverallJudge === "합격") {
      const d = decodeLot(lotNo);
      DB.coa[lotNo] = {
        no:`COA-${lotNo}`,customer:shipmentCustomer,product:L.itemName,
        mfg:d ? `${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}` : "-",
        ship:form.shipDate || "-",shipNo:baseNo,qty:shipmentQty,destination:String(form.destination || "").trim(),
        results:newRows.map((r)=>({item:r.check,spec:QC_ITEMS[r.check]?.spec || "-",val:r.value,judge:r.judge}))
      };
    }
    dbSave();
    setEditingId(null);
    setOqcValues(makeInitialOqcValues());
    setForm({...form,customer:"",shipQty:"",destination:"",remarks:""});
    setTried(false);
    setShowRegisterModal(false);
    // 신규등록 직후 새 검사기록이 관리 목록 첫 페이지에 바로 보이도록 조회조건을 초기화한다.
    setRecordSearch("");
    setRecordYear("ALL");
    setRecordMonth("ALL");
    setRecordPage(1);
  };

  const editRecord = (r) => {
    const groupKey = inspectionGroupKey(r);
    const groupRows = records.filter((x) => inspectionGroupKey(x) === groupKey);
    setEditingId(groupKey);
    setForm({
      date: r.date || today,
      shipDate: r.shipDate || today,
      lot: r.lot || "",
      product: r.product || "",
      check: r.check || itemKeys[0],
      value: "", value1: "", value2: "", value3: "",
      judge: r.judge || "합격",
      inspector: r.inspector || groupRows.find((x)=>x.inspector)?.inspector || "",
      customer: r.customer || groupRows.find((x)=>x.customer)?.customer || DB.lots?.[r.lot]?.ship?.customer || "",
      shipQty: String(r.shipQty || groupRows.find((x)=>x.shipQty)?.shipQty || DB.lots?.[r.lot]?.ship?.qty || DB.lots?.[r.lot]?.qty || ""),
      destination: r.destination || groupRows.find((x)=>x.destination)?.destination || DB.lots?.[r.lot]?.ship?.destination || "",
      remarks: r.remarks || groupRows.find((x)=>x.remarks)?.remarks || ""
    });
    if (isOqc) {
      const nextValues = makeInitialOqcValues();
      groupRows.forEach((row) => {
        const vals = Array.isArray(row.measurements)
          ? row.measurements
          : String(row.value || "").split("/").map((v)=>v.trim()).filter(Boolean);
        nextValues[row.check] = vals.length ? vals : nextValues[row.check];
      });
      setOqcValues(nextValues);
    } else {
      const nextValues = makeInitialPqcValues();
      groupRows.forEach((row) => {
        const vals = Array.isArray(row.measurements)
          ? row.measurements
          : String(row.value || "").split("/").map((v)=>v.trim()).filter(Boolean);
        nextValues[row.check] = vals.length ? vals : nextValues[row.check];
      });
      setPqcValues(nextValues);
    }
    setMeasurementRows([]);
    setMeasurementInput("");
    setTried(false);
    setShowRegisterModal(true);
  };
  const deleteRecord = (r) => {
    const reason = askDeleteReason(`${docName} ${r.id}`);
    if (reason === null) return;
    const groupKey = inspectionGroupKey(r);
    const next = records.filter((x) => inspectionGroupKey(x) !== groupKey);
    setRecords(next); DB.insp[storeKey] = next;
    if (isOqc) {
      const lotData = DB.lots?.[r.lot];
      if (lotData) {
        lotData.steps = (lotData.steps || []).filter((step) => step.groupId !== groupKey && step.shipNo !== groupKey);
        if (lotData.ship?.shipNo === groupKey) {
          lotData.ship = null;
          lotData.stage = "생산";
          lotData.status = "OQC 기록 삭제 — 출하 재확인 필요";
          const batch = (DB.batches || []).find((b) => b.no === r.lot);
          if (batch) { batch.status = "검사중"; batch.ship = null; }
        }
      }
      if (DB.coa?.[r.lot]?.shipNo === groupKey) delete DB.coa[r.lot];
    }
    auditLog(storeKey, "삭제", r.id, reason); dbSave();
  };

  const recordYears = Array.from(new Set(
    records
      .map((r) => String(r.date || r.shipDate || "").slice(0, 4))
      .filter((v) => /^\d{4}$/.test(v))
  )).sort((a, b) => b.localeCompare(a));

  const filteredRecords = records.filter((r) => {
    const q = recordSearch.trim().toLowerCase();
    const dateText = String(r.date || r.shipDate || "");
    const year = dateText.slice(0, 4);
    const month = dateText.slice(5, 7);
    const searchOk = !q || [r.id, r.lot, r.product, r.check, r.inspector, r.judge]
      .some((v) => String(v || "").toLowerCase().includes(q));
    const yearOk = recordYear === "ALL" || year === recordYear;
    const monthOk = recordMonth === "ALL" || month === recordMonth;
    return searchOk && yearOk && monthOk;
  });
  const groupedFilteredRecords = filteredRecords.filter((r, idx, arr) => {
    const key = inspectionGroupKey(r);
    return arr.findIndex((x) => inspectionGroupKey(x) === key) === idx;
  });
  const recordPageCount = Math.max(1, Math.ceil(groupedFilteredRecords.length / recordPageSize));
  const safeRecordPage = Math.min(recordPage, recordPageCount);
  const displayRecords = groupedFilteredRecords.slice((safeRecordPage - 1) * recordPageSize, safeRecordPage * recordPageSize);
  const getInspectionGroupRows = (record) => {
    const key = inspectionGroupKey(record);
    return records.filter((x) => inspectionGroupKey(x) === key);
  };

  return (
    <div className={isOqc ? "qmes-oqc-page flex flex-col gap-4" : "qmes-pqc-page flex flex-col gap-4"}>
      <InspectionSummary
        items={[
          { label: "당월 검사", value: monthGroups.length, unit: "건", tone: "violet" },
          { label: "합격률", value: rate, unit: "%", tone: "green" },
          { label: "부적합", value: fail, unit: "건", tone: "red" }
        ]}
      />

      <div className={`qmes-inspection-quickbar ${isOqc ? "qmes-oqc-quickbar" : "qmes-pqc-quickbar"}`}>
        <div className="qmes-management-heading">
          <span>{isOqc ? "OUTGOING QUALITY CONTROL" : "PROCESS QUALITY CONTROL"}</span>
          <div className="qmes-management-title-row">
            <strong>{isOqc ? "출하검사 관리" : "공정검사 관리"}</strong>
            <button type="button" className="qmes-inspection-new-btn" onClick={()=>{
              setEditingId(null);
              const initialLot = isOqc ? (DB.batches?.[0]?.no || lotOptions?.[0] || "") : "";
              setForm({ date:today, shipDate:today, lot:initialLot, product:"", check:itemKeys[0], value:"", value1:"", value2:"", value3:"", judge:"합격", inspector:"", customer:"", shipQty:isOqc ? String(DB.lots?.[initialLot]?.qty || DB.batches?.[0]?.qty || "") : "", destination:"", remarks:"" });
              setMeasurementRows([]); setMeasurementInput(""); setPqcValues(makeInitialPqcValues()); setOqcValues(makeInitialOqcValues()); setTried(false); setShowRegisterModal(true);
            }}><Plus size={16}/> 신규등록</button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg px-4 py-3">
          <ClipboardCheck size={15} className="text-sky-400 shrink-0" />
          <p className="text-sm text-sky-200">{notice}</p>
        </div>
      )}

      {showRegisterModal && (
        <div className="qmes-modal-backdrop qmes-inspection-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget){setShowRegisterModal(false);setEditingId(null);setTried(false);}}}>
          <div className={`qmes-inspection-modal ${isOqc ? "is-oqc" : "is-pqc"}`} role="dialog" aria-modal="true">
            <div className="qmes-inspection-modal-head">
              <div><span>{isOqc ? "OUTGOING INSPECTION" : "PROCESS INSPECTION"}</span><strong>{editingId ? (isOqc ? "출하검사 수정" : "공정검사 수정") : (isOqc ? "출하검사 신규등록" : "공정검사 신규등록")}</strong></div>
              <button type="button" onClick={()=>{setShowRegisterModal(false);setEditingId(null);setTried(false);}} aria-label="닫기">×</button>
            </div>
            <div className="qmes-inspection-modal-body">
              <Panel title={isOqc ? "출하검사 등록" : "공정검사 등록"}>
        <div className="pb-1">
          {!isOqc ? (
            <div className="qmes-pqc-entry-form">
              <div className="qmes-pqc-basic-row">
                <div><label>공정번호</label><input value={previewNo} readOnly /></div>
                <div><label>검사일자</label><input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} /></div>
                <div><label>LOT No.</label><input value={form.lot} onChange={(e)=>setForm({...form,lot:e.target.value})} placeholder="LOT No. 입력" /></div>
                <div><label>제품명</label><input value={form.product} onChange={(e)=>setForm({...form,product:e.target.value})} placeholder="제품명 입력" /></div>
                <div><label>검사자</label><input value={form.inspector || ""} onChange={(e)=>setForm({...form,inspector:e.target.value})} placeholder="검사자 이름 입력" /></div>
              </div>
              <div className="qmes-pqc-item-table-wrap">
                <table className="qmes-pqc-item-table">
                  <thead><tr><th>검사항목</th><th>관리기준</th><th>측정값</th><th>판정</th></tr></thead>
                  <tbody>
                    {pqcItems.map((item)=><tr key={item}>
                      <td>{item === "입도(Dmax)" ? "입도" : item}</td>
                      <td>{QC_ITEMS[item]?.spec || "-"}</td>
                      <td>{item === "외관" ? (
                        <select className={valueStateClass(item, (pqcValues[item] || ["이상없음"])[0])} value={(pqcValues[item] || ["이상없음"])[0]} onChange={(e)=>setPqcValues({...pqcValues,[item]:[e.target.value]})}>
                          <option value="이상없음">이상없음</option><option value="이상있음">이상있음</option>
                        </select>
                      ) : (
                        <div className="qmes-pqc-measure-line">
                          {(pqcValues[item] || ["", "", ""]).map((value, idx)=><div className="qmes-pqc-measure-cell" key={idx}>
                            <input className={valueStateClass(item, value)} type="text" inputMode="decimal" value={value}
                              onChange={(e)=>{const next=[...(pqcValues[item]||[])];next[idx]=e.target.value;setPqcValues({...pqcValues,[item]:next});}}
                              placeholder={`${idx+1}회`} />
                            {idx >= 3 && <button type="button" className="qmes-pqc-remove-value" onClick={()=>{const next=(pqcValues[item]||[]).filter((_,i)=>i!==idx);setPqcValues({...pqcValues,[item]:next});}} title="측정값 삭제">×</button>}
                          </div>)}
                          <button type="button" className="qmes-pqc-add-value" onClick={()=>setPqcValues({...pqcValues,[item]:[...(pqcValues[item]||[]),""]})}><Plus size={13}/> 추가</button>
                        </div>
                      )}</td>
                      <td><span className={`qmes-live-judge ${pqcJudges[item] === "합격" ? "is-pass" : "is-fail"}`}>{pqcJudges[item]}</span></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`qmes-overall-live-judge ${pqcOverallJudge === "합격" ? "is-pass" : "is-fail"}`}>전체 판정: <strong>{pqcOverallJudge}</strong></div>
              <div className="qmes-inspection-remarks-field">
                <label>특이사항</label>
                <textarea value={form.remarks || ""} onChange={(e)=>setForm({...form,remarks:e.target.value})} placeholder="특이사항을 입력하세요" />
              </div>
              <div className="qmes-inspection-action-row">
                <button type="button" onClick={()=>{setEditingId(null);setForm({...form,value:"",value1:"",value2:"",value3:"",remarks:""});}} className="qmes-inspection-cancel-btn">취소</button>
                <button type="button" onClick={addRecord} className="qmes-inspection-save-btn">저장</button>
              </div>
            </div>
          ) : (
            <div className="qmes-pqc-entry-form qmes-oqc-entry-form">
              <div className="qmes-pqc-basic-row qmes-oqc-basic-row">
                <div><label>출하번호</label><input value={previewNo} readOnly /></div>
                <div><label>검사일자</label><input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} /></div>
                <div><label>출하일자</label><input type="date" value={form.shipDate} onChange={(e)=>setForm({...form,shipDate:e.target.value})} /></div>
                <div><label>LOT No.</label><select value={form.lot} onChange={(e)=>{const lot=e.target.value;const lotQty=DB.lots?.[lot]?.qty || (DB.batches||[]).find((b)=>b.no===lot)?.qty || "";setForm({...form,lot,shipQty:String(lotQty || form.shipQty || "")});}}><option value="">LOT 선택</option>{availableLots.map((lot)=><option key={lot} value={lot}>{lot}</option>)}</select></div>
                <div><label>제품명</label><input value={selectedProduct} readOnly placeholder="LOT 연동 제품명" /></div>
                <div><label>검사자</label><input value={form.inspector || ""} onChange={(e)=>setForm({...form,inspector:e.target.value})} placeholder="검사자 이름 입력" /></div>
                <div><label>고객사</label><input value={form.customer || ""} onChange={(e)=>setForm({...form,customer:e.target.value})} placeholder="고객사 입력" /></div>
                <div><label>출하수량 (kg)</label><input type="number" min="0" step="0.1" value={form.shipQty || ""} onChange={(e)=>setForm({...form,shipQty:e.target.value})} placeholder="출하수량" /></div>
                <div><label>납품처</label><input value={form.destination || ""} onChange={(e)=>setForm({...form,destination:e.target.value})} placeholder="납품처 입력 (선택)" /></div>
              </div>
              <div className="qmes-oqc-linkage-note"><Truck size={14}/><span>전체 합격으로 저장하면 고객사·출하수량·출하일자가 LOT 추적, 출하성적서, 종합 대시보드에 자동 반영됩니다.</span></div>
              <div className="qmes-pqc-item-table-wrap">
                <table className="qmes-pqc-item-table qmes-oqc-item-table">
                  <thead><tr><th>검사항목</th><th>관리기준</th><th>측정값</th><th>판정</th></tr></thead>
                  <tbody>
                    {oqcItems.map((item)=><tr key={item}>
                      <td>{item === "입도(Dmax)" ? "입도" : item}</td>
                      <td>{QC_ITEMS[item]?.spec || "-"}</td>
                      <td>
                        <div className="qmes-pqc-measure-line">
                          {(oqcValues[item] || ["","",""]).map((value, idx)=><div className="qmes-pqc-measure-cell" key={idx}>
                            {item === "외관" ? (
                              <select className={valueStateClass(item, value)} value={value} onChange={(e)=>{const next=[...(oqcValues[item]||[])];next[idx]=e.target.value;setOqcValues({...oqcValues,[item]:next});}}>
                                <option value="이상없음">이상없음</option><option value="이상있음">이상있음</option>
                              </select>
                            ) : item === "전해액 안정성" ? (
                              <select className={valueStateClass(item, value)} value={value} onChange={(e)=>{const next=[...(oqcValues[item]||[])];next[idx]=e.target.value;setOqcValues({...oqcValues,[item]:next});}}>
                                <option value="미탈리">미탈리</option><option value="탈리">탈리</option>
                              </select>
                            ) : item === "절연저항" ? (
                              <select className={valueStateClass(item, value)} value={value} onChange={(e)=>{const next=[...(oqcValues[item]||[])];next[idx]=e.target.value;setOqcValues({...oqcValues,[item]:next});}}>
                                <option value="Overflow">Overflow</option>
                              </select>
                            ) : (
                              <input className={valueStateClass(item, value)} type="text" inputMode={item === "절연저항" ? "text" : "decimal"} value={value}
                                onChange={(e)=>{const next=[...(oqcValues[item]||[])];next[idx]=e.target.value;setOqcValues({...oqcValues,[item]:next});}}
                                placeholder={`${idx+1}회`} />
                            )}
                            {idx >= 3 && <button type="button" className="qmes-pqc-remove-value" onClick={()=>{const next=(oqcValues[item]||[]).filter((_,i)=>i!==idx);setOqcValues({...oqcValues,[item]:next});}} title="측정값 삭제">×</button>}
                          </div>)}
                          <button type="button" className="qmes-pqc-add-value" onClick={()=>setOqcValues({...oqcValues,[item]:[...(oqcValues[item]||[]),""]})}><Plus size={13}/> 추가</button>
                        </div>
                      </td>
                      <td><span className={`qmes-live-judge ${oqcJudges[item] === "합격" ? "is-pass" : "is-fail"}`}>{oqcJudges[item]}</span></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`qmes-overall-live-judge ${oqcOverallJudge === "합격" ? "is-pass" : "is-fail"}`}>전체 판정: <strong>{oqcOverallJudge}</strong></div>
              <div className="qmes-inspection-remarks-field">
                <label>특이사항</label>
                <textarea value={form.remarks || ""} onChange={(e)=>setForm({...form,remarks:e.target.value})} placeholder="특이사항을 입력하세요" />
              </div>
              <div className="qmes-inspection-action-row">
                <button type="button" onClick={()=>{setEditingId(null);setOqcValues(makeInitialOqcValues());setForm({...form,customer:"",shipQty:"",destination:"",remarks:""});}} className="qmes-inspection-cancel-btn">취소</button>
                <button type="button" onClick={addRecord} className="qmes-inspection-save-btn">{oqcOverallJudge === "합격" ? "출하검사 저장 · 출하확정" : "출하검사 저장"}</button>
              </div>
            </div>
          )}
        </div>
        {(inputError || lotErr || triedErrors.length > 0) && (
          <div className="mt-2 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">
            {[inputError, lotErr, ...triedErrors].filter(Boolean).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-300"><XCircle size={13} className="shrink-0" /> {e}</div>
            ))}
          </div>
        )}
              </Panel>
            </div>
          </div>
        </div>
      )}

      <Panel title={`검사 기록 (${docName})`} right={<span className="text-xs text-slate-500">{groupedFilteredRecords.length}건</span>}>
        <div className={`qmes-inspection-record-filter ${isOqc ? "qmes-oqc-record-filter" : "qmes-pqc-record-filter"}`}>
          <div className="flex flex-col gap-1 w-72">
            <span className="text-[10px] text-slate-500">{numberLabel} / LOT / 제품명 / 항목 / 검사자 검색</span>
            <div className="qmes-inspection-search-box">
              <Search size={15} className="qmes-inspection-search-icon" />
              <input value={recordSearch}
                onChange={(e) => { setRecordSearch(e.target.value); setRecordPage(1); }}
                placeholder="검색어 입력"
                className="h-9 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              {recordSearch && (
                <button type="button" onClick={() => { setRecordSearch(""); setRecordPage(1); }} title="검색어 지우기">
                  <XCircle size={13} />
                </button>
              )}
            </div>
          </div>
          <>
            <div className="qmes-oqc-record-filter-field">
              <span>연도</span>
              <select value={recordYear} onChange={(e)=>{setRecordYear(e.target.value);setRecordPage(1);}}>
                <option value="ALL">전체 연도</option>
                {recordYears.map((year)=><option key={year} value={year}>{year}년</option>)}
              </select>
            </div>
            <div className="qmes-oqc-record-filter-field">
              <span>월</span>
              <select value={recordMonth} onChange={(e)=>{setRecordMonth(e.target.value);setRecordPage(1);}}>
                <option value="ALL">전체 월</option>
                {Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0")).map((month)=><option key={month} value={month}>{Number(month)}월</option>)}
              </select>
            </div>
          </>
          <button onClick={() => { setRecordSearch(""); setRecordYear("ALL"); setRecordMonth("ALL"); setRecordPage(1); }}
            className="h-9 px-3 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800">초기화</button>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className={`w-full text-sm table-fixed ${isOqc ? "min-w-[1120px] qmes-oqc-record-table" : "min-w-[1100px] qmes-pqc-record-table"}`}>
            <colgroup>
              {isOqc ? <>
                <col style={{ width: "145px" }} /><col style={{ width: "120px" }} /><col style={{ width: "135px" }} />
                <col style={{ width: "150px" }} /><col style={{ width: "150px" }} /><col style={{ width: "90px" }} />
                <col style={{ width: "120px" }} /><col style={{ width: "120px" }} /><col style={{ width: "200px" }} />
              </> : <>
                <col style={{ width: "14%" }} /><col style={{ width: "11%" }} /><col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} /><col style={{ width: "11%" }} /><col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} /><col style={{ width: "16%" }} />
              </>}
            </colgroup>
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="py-2 px-3 font-medium whitespace-nowrap">{numberLabel}</th>
                <th className="py-2 px-3 font-medium whitespace-nowrap">검사일자</th>
                <th className="py-2 px-3 font-medium whitespace-nowrap">LOT No.</th>
                <th className="py-2 px-3 font-medium whitespace-nowrap">제품명</th>
                <th className="py-2 px-3 font-medium whitespace-nowrap">측정값</th>
                <th className="py-2 px-3 font-medium whitespace-nowrap">판정</th>
                <th className="text-left py-2 px-3 font-medium whitespace-nowrap">검사자</th>
                {isOqc && <th className="text-left py-2 px-3 font-medium whitespace-nowrap">출하일자</th>}
                <th className="py-2 px-3 font-medium whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && (
                <tr><td colSpan={isOqc ? 9 : 8} className="py-6 text-center text-sm text-slate-500">{isOqc ? "출하검사 검사 기록이 없습니다." : "검사 기록이 없습니다."}</td></tr>
              )}
              {displayRecords.map((r) => {
                const groupRows = getInspectionGroupRows(r);
                const groupJudge = groupRows.length > 0 && groupRows.every((x)=>x.judge==="합격") ? "합격" : "불합격";
                return (
                <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono text-xs text-sky-300 truncate" title={r.groupId || r.id}>{r.groupId || String(r.id || "").replace(/-\d+$/, "")}</td>
                  <td className="py-2.5 px-3 text-xs font-mono text-slate-300 whitespace-nowrap">{r.date || "-"}</td>
                  <td className="py-2.5 px-3 text-xs font-mono text-slate-300 truncate" title={r.lot}>{r.lot}</td>
                  <td className="py-2.5 px-3 text-slate-300 truncate" title={r.product || "-"}>{r.product || (DB.batches || []).find((b) => b.no === r.lot)?.itemName || (DB.batches || []).find((b) => b.no === r.lot)?.item || "-"}</td>
                  <td className="py-2.5 px-3 text-slate-300 tabular-nums">
                    <button type="button" className="qmes-pqc-value-preview-btn" onClick={()=>setMeasurementPreviewRows(groupRows)}>측정값 보기</button>
                  </td>
                  <td className="py-2.5 px-3"><Badge tone={groupJudge === "합격" ? "green" : "red"}>{groupJudge}</Badge></td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs truncate" title={r.inspector || "-"}>{r.inspector || "-"}</td>
                  {isOqc && <td className="py-2.5 px-3 text-xs font-mono text-slate-300 whitespace-nowrap">{r.shipDate || "-"}</td>}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <button onClick={() => setViewingRecord(r)} title="성적서 미리보기 및 출력" className="qmes-iqc-action-btn qmes-iqc-action-print mr-1"><Printer size={12} /> 출력</button>
                    <button onClick={() => editRecord(r)} className="qmes-iqc-action-btn qmes-iqc-action-edit mr-1">수정</button>
                    <button onClick={() => deleteRecord(r)} className="qmes-iqc-action-btn qmes-iqc-action-delete">삭제</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {groupedFilteredRecords.length > recordPageSize && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button onClick={() => setRecordPage((p) => Math.max(1, p - 1))}
              disabled={safeRecordPage === 1}
              className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 disabled:opacity-40">이전</button>
            <span className="text-xs text-slate-400">{safeRecordPage} / {recordPageCount}</span>
            <button onClick={() => setRecordPage((p) => Math.min(recordPageCount, p + 1))}
              disabled={safeRecordPage === recordPageCount}
              className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 disabled:opacity-40">다음</button>
          </div>
        )}
      </Panel>
      {measurementPreviewRows && measurementPreviewRows.length > 0 && (
        <div className="qmes-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setMeasurementPreviewRows(null);}}>
          <div className="qmes-pqc-value-preview-modal">
            <div className="qmes-pqc-value-preview-head"><strong>{isOqc ? "출하검사 측정값" : "공정검사 측정값"}</strong><button onClick={()=>setMeasurementPreviewRows(null)}>×</button></div>
            <div className="qmes-pqc-preview-summary">
              <div><span>{isOqc ? "출하번호" : "공정번호"}</span><strong>{measurementPreviewRows[0].groupId || String(measurementPreviewRows[0].id || "").replace(/-\d+$/, "")}</strong></div>
              <div><span>LOT No.</span><strong>{measurementPreviewRows[0].lot || "-"}</strong></div>
              <div><span>제품명</span><strong>{measurementPreviewRows[0].product || "-"}</strong></div>
              <div><span>검사일자</span><strong>{measurementPreviewRows[0].date || "-"}</strong></div>
              <div><span>검사자</span><strong>{measurementPreviewRows[0].inspector || "-"}</strong></div>
              {isOqc && <div><span>고객사</span><strong>{measurementPreviewRows[0].customer || DB.lots?.[measurementPreviewRows[0].lot]?.ship?.customer || "-"}</strong></div>}
              {isOqc && <div><span>출하수량</span><strong>{Number(measurementPreviewRows[0].shipQty || DB.lots?.[measurementPreviewRows[0].lot]?.ship?.qty || 0).toLocaleString()} kg</strong></div>}
              <div><span>최종판정</span><strong>{measurementPreviewRows.every((row)=>row.judge === "합격") ? "합격" : "불합격"}</strong></div>
            </div>
            <table>
              <colgroup><col style={{width:"15%"}}/><col style={{width:"22%"}}/><col style={{width:"51%"}}/><col style={{width:"12%"}}/></colgroup>
              <thead><tr><th>검사항목</th><th>관리기준</th><th>측정값</th><th>판정</th></tr></thead>
              <tbody>{measurementPreviewRows.map((row)=>{
                const values=(row.measurements && row.measurements.length ? row.measurements : String(row.value || "").split("/")).map((v)=>String(v||"").trim()).filter(Boolean);
                return <tr key={row.id}><td>{row.check === "입도(Dmax)" ? "입도" : row.check}</td><td>{QC_ITEMS[row.check]?.spec || "-"}</td><td><div className="qmes-pqc-preview-values">{values.map((value,index)=><span className="qmes-pqc-preview-value" key={`${row.id}-${index}`}><b>{["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"][index] || `${index+1}.`}</b>{value}</span>)}</div></td><td><Badge tone={row.judge === "합격" ? "green" : "red"}>{row.judge}</Badge></td></tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}
      {viewingRecord && (
        <QualityInspectionViewer
          type={storeKey}
          record={viewingRecord}
          records={records}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  );
}

/* ──────────────────────────── 재고 관리 ──────────────────────────── */


const PQC_KEYS = ["점도", "고형분", "입도(Dmax)", "외관"];
const OQC_KEYS = ["외관", "점도", "고형분", "입도(Dmax)", "접착력", "절연저항", "수분", "전해액 안정성"];

const PQC_INIT = [];

const OQC_INIT = [];

function PqcTab() {
  return (
    <InspectionTab
      docName="공정검사 성적서"
      itemKeys={PQC_KEYS}
      initial={PQC_INIT}
      lotOptions={["CBG0803", "CBG0802", "CBG0801"]}
      idPrefix="PQC-" idStart={1} storeKey="PQC" traceStage="생산"
      notice=""
    />
  );
}

