/* QMES iPad POP — IQC/PQC/OQC unified field input patch */
function FieldInputTab() {
  const today = localISODate();
  const currentUser = window.__QMES_USER__ || window.__QMES_CURRENT_USER__?.name || "관리자";
  const [mode, setMode] = useState("PQC");
  const [lot, setLot] = useState("");
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [message, setMessage] = useState("");

  const modeConfig = {
    IQC: {
      title: "수입검사",
      subtitle: "INCOMING INSPECTION",
      lotLabel: "원재료 LOT",
      items: [
        { key:"visual", label:"외관", type:"choice", choices:["합격","불합격"] },
        { key:"coa", label:"CoA 확인", type:"choice", choices:["합격","불합격"] },
        { key:"viscosity", label:"점도", type:"number", spec:"1,500±300 cP", lo:1200, hi:1800 },
        { key:"solid", label:"고형분", type:"number", spec:"20.0±1.0 wt%", lo:19, hi:21 }
      ]
    },
    PQC: {
      title: "공정검사",
      subtitle: "PROCESS INSPECTION",
      lotLabel: "생산 LOT",
      items: [
        { key:"viscosity", label:"점도", type:"triple", spec:"1,500±300 cP", lo:1200, hi:1800 },
        { key:"solid", label:"고형분", type:"triple", spec:"20.0±1.0 wt%", lo:19, hi:21 },
        { key:"particle", label:"입도", type:"triple", spec:"<10 μm", lo:0, hi:10 },
        { key:"visual", label:"외관", type:"choice", choices:["이상없음","이상있음"] }
      ]
    },
    OQC: {
      title: "출하검사",
      subtitle: "OUTGOING INSPECTION",
      lotLabel: "완제품 LOT",
      items: [
        { key:"visual", label:"외관", type:"choice", choices:["이상없음","이상있음"] },
        { key:"viscosity", label:"점도", type:"triple", spec:"1,500±300 cP", lo:1200, hi:1800 },
        { key:"solid", label:"고형분", type:"triple", spec:"20.0±1.0 wt%", lo:19, hi:21 },
        { key:"particle", label:"입도", type:"triple", spec:"<10 μm", lo:0, hi:10 },
        { key:"adhesion", label:"접착력", type:"triple", spec:"≥400 gf/12.7mm", lo:400, hi:null },
        { key:"resistance", label:"절연저항", type:"choice", choices:["Overflow","불합격"] },
        { key:"moisture", label:"수분", type:"triple", spec:"<2,000 ppm", lo:0, hi:2000 },
        { key:"electrolyte", label:"전해액 안정성", type:"choice", choices:["미탈리","탈리"] }
      ]
    }
  };

  const cfg = modeConfig[mode];
  const item = cfg.items[step];
  const lotKey = lot.trim().toUpperCase();
  const lotData = DB.lots?.[lotKey] || DB.batches?.find?.(x => String(x.no||"").toUpperCase()===lotKey) || null;
  const productName = lotData?.item || lotData?.product || lotData?.name || "LOT 연동 제품명";
  const progress = Math.round(((step + 1) / cfg.items.length) * 100);

  const reset = (nextMode=mode) => {
    setMode(nextMode); setLot(""); setStep(0); setValues({}); setMessage("");
  };

  const getItemValue = (key) => values[key];
  const setItemValue = (key, val) => setValues(prev => ({...prev, [key]:val}));

  const judgeItem = (it) => {
    const v = getItemValue(it.key);
    if (it.type === "choice") {
      if (!v) return "대기";
      return ["불합격","이상있음","탈리"].includes(v) ? "불합격" : "합격";
    }
    const arr = it.type === "triple" ? (Array.isArray(v)?v:[]) : [v];
    if (arr.some(x => x === "" || x == null) || arr.length < (it.type === "triple" ? 3 : 1)) return "대기";
    const nums = arr.map(Number);
    if (nums.some(n => !Number.isFinite(n))) return "대기";
    const ok = nums.every(n => (it.lo == null || n >= it.lo) && (it.hi == null || n <= it.hi));
    return ok ? "합격" : "불합격";
  };

  const currentJudge = judgeItem(item);
  const allJudges = cfg.items.map(judgeItem);
  const overall = allJudges.includes("불합격") ? "불합격" : allJudges.includes("대기") ? "대기" : "합격";
  const canNext = lotKey.length >= 2 && currentJudge !== "대기";

  const saveAll = () => {
    if (lotKey.length < 2 || overall === "대기") { setMessage("LOT와 모든 검사 항목을 입력하세요."); return; }
    const now = new Date();
    const time = now.toLocaleTimeString("ko-KR", {hour12:false, hour:"2-digit", minute:"2-digit"});
    const id = `${mode}-${String(Date.now()).slice(-8)}`;
    const common = { id, lot:lotKey, date:today, time, product:productName, inspector:currentUser, judge:overall, source:"iPad POP", values:{...values} };

    DB.insp = DB.insp || {PQC:[],OQC:[]};
    DB.popEntries = DB.popEntries || [];
    if (mode === "IQC") {
      DB.iqc = DB.iqc || [];
      DB.iqc.unshift({
        inNo:id, recv:today, inspectedAt:today, lot:lotKey, name:productName,
        supplier:lotData?.supplier || "-", qty:"0 kg", inspectQty:"1 EA", defectQty:overall==="합격"?"0 EA":"1 EA",
        visual:values.visual || "합격", label:"합격", weight:"합격", coa:values.coa || "합격",
        viscosity:values.viscosity, solid:values.solid, inspector:currentUser, by:currentUser,
        judge:overall, remarks:"iPad POP 자동등록", note:overall==="불합격"?"즉시 격리 및 사용차단":""
      });
    } else {
      const target = mode === "PQC" ? "PQC" : "OQC";
      DB.insp[target] = DB.insp[target] || [];
      DB.insp[target].unshift(common);
    }

    DB.popEntries.unshift({...common, check:`${cfg.title} 일괄입력`, value:`${cfg.items.length}개 항목`, auto:[`${cfg.title} 자동 연동`, `${mode} 성적서 데이터 저장`, `LOT ${lotKey} 추적이력 반영`]});
    if (DB.lots?.[lotKey]) {
      const L = DB.lots[lotKey];
      L.steps = L.steps || [];
      L.steps.push({stage:cfg.title, name:`iPad ${cfg.title}`, time, detail:`${cfg.items.length}개 항목 입력`, result:overall, by:currentUser});
      if (overall === "불합격") L.status = "홀드 — 검사 부적합";
    }
    if (overall === "불합격") {
      DB.holds = DB.holds || [];
      DB.holds.unshift({id:`HLD-${String(Date.now()).slice(-6)}`,target:lotKey,type:mode==="IQC"?"원재료 Lot":"제품 Lot",gate:`${cfg.title} 게이트`,reason:`iPad ${cfg.title} 부적합`,since:today,status:"차단중",cond:"재검사 합격 + 품질 승인",ncr:"-"});
    }
    auditLog("현장입력", "등록", id, `${cfg.title} / ${lotKey} / ${overall}`);
    dbSave();
    setMessage(`${cfg.title} 저장 완료 — ${mode} 검사 화면과 LOT 추적에 자동 연동되었습니다.`);
    setTimeout(() => { setLot(""); setStep(0); setValues({}); }, 700);
  };

  return (
    <div className="qmes-ipad-pop">
      <div className="qmes-ipad-mode-grid">
        {["IQC","PQC","OQC"].map(k => <button key={k} onClick={()=>reset(k)} className={`qmes-ipad-mode ${mode===k?"is-active":""}`}><small>{modeConfig[k].subtitle}</small><strong>{modeConfig[k].title}</strong></button>)}
      </div>

      <section className="qmes-ipad-card qmes-ipad-lot-card">
        <div><small>{cfg.subtitle}</small><h2>{cfg.title} iPad 입력</h2></div>
        <div className="qmes-ipad-user">검사자 <strong>{currentUser}</strong></div>
        <label>{cfg.lotLabel}</label>
        <input autoFocus value={lot} onChange={e=>setLot(e.target.value.toUpperCase())} placeholder="바코드 스캔 또는 LOT 직접 입력" />
        <div className="qmes-ipad-linked"><span>제품명</span><strong>{lotKey ? productName : "LOT 입력 시 자동 표시"}</strong><span>검사일</span><strong>{today}</strong></div>
      </section>

      <section className="qmes-ipad-card">
        <div className="qmes-ipad-progress-head"><div><small>{step+1} / {cfg.items.length}</small><h3>{item.label}</h3></div><div className={`qmes-ipad-judge ${currentJudge}`}>{currentJudge}</div></div>
        <div className="qmes-ipad-progress"><i style={{width:`${progress}%`}} /></div>
        {item.spec && <div className="qmes-ipad-spec">관리기준 <strong>{item.spec}</strong></div>}

        {item.type === "choice" ? (
          <div className="qmes-ipad-choice-grid">{item.choices.map(c => <button key={c} onClick={()=>setItemValue(item.key,c)} className={getItemValue(item.key)===c?"is-selected":""}>{c}</button>)}</div>
        ) : item.type === "triple" ? (
          <div className="qmes-ipad-triple">{[0,1,2].map(i => <label key={i}><span>{i+1}회</span><input inputMode="decimal" value={(getItemValue(item.key)||[])[i]||""} onChange={e=>{const next=[...(getItemValue(item.key)||["","",""])];next[i]=e.target.value;setItemValue(item.key,next);}} placeholder="측정값" /></label>)}</div>
        ) : (
          <input className="qmes-ipad-number" inputMode="decimal" value={getItemValue(item.key)||""} onChange={e=>setItemValue(item.key,e.target.value)} placeholder="측정값 입력" />
        )}

        <div className="qmes-ipad-actions">
          <button disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>이전</button>
          {step < cfg.items.length-1 ? <button className="primary" disabled={!canNext} onClick={()=>setStep(s=>s+1)}>다음 검사</button> : <button className="save" disabled={overall==="대기"||lotKey.length<2} onClick={saveAll}>검사 완료 · 자동 연동</button>}
        </div>
      </section>

      <div className={`qmes-ipad-overall ${overall}`}><span>전체 판정</span><strong>{overall}</strong></div>
      {message && <div className="qmes-ipad-message">{message}</div>}
    </div>
  );
}
