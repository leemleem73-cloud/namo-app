/* NAMO QMES Workorder Owner V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Replaces the visible workorder route without editing production.jsx.
 * UI basis: approved uploaded workorder HTML layout.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_OWNER_20260928_V1__) return;
  window.__QMES_WORKORDER_OWNER_20260928_V1__=true;

  const R=window.React;
  if(!R) return;
  const {useMemo,useState}=R;

  function clean(v){return String(v==null?"":v).trim();}
  function n(v){const x=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(x)?x:0;}
  function fmt(v){return Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:3});}
  function today(){return new Date().toISOString().slice(0,10);}
  function userName(){
    const u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return clean(typeof u==="string"?u:(u.name||u.userName||u.username||""));
  }
  function safeDb(){return typeof DB!=="undefined"&&DB?DB:null;}
  function workRows(){
    const db=safeDb(); if(!db) return [];
    return (db.batches||[]).map((b,i)=>{
      const d=db.woDocs?.[b.no]||{};
      const inputs=Array.isArray(d.inputs)?d.inputs:[];
      const planInputs=inputs.reduce((s,x)=>s+n(x.plan??x.std),0);
      const actualInputs=inputs.reduce((s,x)=>s+n(x.act),0);
      const done=n(b.done);
      const plan=n(b.plan)||planInputs;
      const yieldPct=plan>0&&done>0?(done/plan*100):null;
      return {
        key:b.no,
        no:i+1,
        issueDate:clean(d.issueDate||d.date||b.due||""),
        workOrderNo:clean(d.workOrderNo||b.workOrderNo||""),
        customer:clean(d.customer||b.customer||"-"),
        product:clean(b.item||d.item||"-"),
        lot:clean(b.no||d.lotNo||"-"),
        plan,
        unit:clean(b.unit||"kg"),
        due:clean(b.due||d.date||""),
        equipment:clean(b.tank||d.tank||"-"),
        materialCount:inputs.length,
        inputPlan:planInputs,
        inputActual:actualInputs,
        productionQty:done,
        yieldPct,
        pqc:clean(d.pqcStatus||"미착수"),
        status:clean(d.status||b.status||"대기"),
        writer:clean(d.writer||d.workers||b.worker||userName()||"-"),
        review:clean(d.reviewStatus||"대기"),
        approval:clean(d.approvalStatus||"대기"),
        notes:clean(d.notes||""),
        doc:d,
        batch:b
      };
    });
  }
  function normalizeStatus(v){
    const s=clean(v);
    if(/완료/.test(s))return"완료";
    if(/생산|진행/.test(s))return"생산중";
    if(/보류|이상|홀드/.test(s))return"보류";
    return"대기";
  }
  function pqcTone(v){return /합격/.test(v)?"ok":/재확인|부적합|불합격/.test(v)?"bad":/진행/.test(v)?"warn":"gray";}
  function statTone(v){return v==="완료"?"ok":v==="생산중"?"blue":v==="보류"?"bad":"gray";}

  function ensureStyle(){
    if(document.getElementById("qmes-workorder-owner-v1-style"))return;
    const s=document.createElement("style");
    s.id="qmes-workorder-owner-v1-style";
    s.textContent=`
      .qwo1{color:#26384a;font-family:Arial,"Malgun Gothic","Noto Sans KR",sans-serif}
      .qwo1 *{box-sizing:border-box}.qwo1-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
      .qwo1-head h2{margin:0;font-size:21px;font-weight:900}.qwo1-actions{display:flex;gap:7px;flex-wrap:wrap}
      .qwo1-btn{height:34px;border:1px solid #c7d5e1;background:#fff;border-radius:6px;padding:0 13px;font-size:10px;font-weight:800;color:#40566a;cursor:pointer}
      .qwo1-btn.blue{background:#138dcc;color:#fff;border-color:#138dcc}.qwo1-btn.green{background:#f2fff6;color:#178a43;border-color:#b9e2c7}.qwo1-btn.red{background:#fff5f4;color:#be3f36;border-color:#efc7c3}
      .qwo1-filter{background:#fff;border:1px solid #d6e0e8;border-radius:8px;padding:10px;display:grid;grid-template-columns:235px 190px 230px 170px 170px 1fr 64px;gap:7px;align-items:end;margin-bottom:12px}
      .qwo1-field label{display:block;font-size:9px;font-weight:800;color:#607589;margin:0 0 4px 2px}.qwo1-control{height:38px;border:1px solid #cbd8e3;border-radius:5px;padding:0 10px;background:#fff;width:100%;font-size:10px}
      .qwo1-period{display:flex;gap:6px;align-items:center}.qwo1-period input{width:calc(50% - 8px)}
      .qwo1-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin-bottom:12px}.qwo1-kpi{background:#fff;border:1px solid #d6e0e8;border-radius:8px;padding:11px 13px}
      .qwo1-kpi .l{font-size:10px;color:#677b8e;font-weight:800}.qwo1-kpi .v{font-size:22px;font-weight:900;margin-top:6px}.qwo1-kpi .s{font-size:9px;color:#8b99a7;margin-top:5px}
      .qwo1-kpi.good .v{color:#1f9d55}.qwo1-kpi.warn .v{color:#bd6b0b}.qwo1-kpi.bad .v{color:#cf3f35}.qwo1-kpi.info .v{color:#207bad}
      .qwo1-panel{background:#fff;border:1px solid #d6e0e8;border-radius:8px;overflow:hidden}.qwo1-panel-hd{padding:11px 14px;border-bottom:1px solid #d6e0e8;display:flex;justify-content:space-between;align-items:center}
      .qwo1-panel-hd h3{font-size:13px;margin:0}.qwo1-panel-hd span{font-size:9px;color:#7f8e9b}.qwo1-scroll{overflow:auto;max-height:520px}
      .qwo1-table{width:100%;border-collapse:separate;border-spacing:0;min-width:2100px;font-size:10px}.qwo1-table th{position:sticky;top:0;background:linear-gradient(#61abd2,#4c9bc5);color:#fff;padding:9px 8px;text-align:center;border-right:1px solid rgba(255,255,255,.55);white-space:nowrap;z-index:2}
      .qwo1-table td{padding:8px;text-align:center;border-right:1px solid #dce5ec;border-bottom:1px solid #dce5ec;white-space:nowrap}.qwo1-table tr:nth-child(even){background:#f8fafc}
      .qwo1-link{color:#0878b9;font-weight:900;background:none;border:0;cursor:pointer}.qwo1-status{display:inline-flex;align-items:center;justify-content:center;min-width:50px;padding:4px 8px;border-radius:11px;font-size:9px;font-weight:900}
      .qwo1-status.ok{background:#eaf8ef;color:#1f9d55}.qwo1-status.warn{background:#fff3e1;color:#bd6b0b}.qwo1-status.bad{background:#fff0ee;color:#cf3f35}.qwo1-status.gray{background:#eef2f6;color:#65778a}.qwo1-status.blue{background:#e7f4fb;color:#1477ad}
      .qwo1-manage{display:flex;gap:5px;justify-content:center}.qwo1-mini{height:24px;padding:0 8px;border:1px solid #c3d4e2;background:#fff;border-radius:4px;font-size:9px;font-weight:800;cursor:pointer}
      .qwo1-mini.blue{background:#138dcc;color:#fff;border-color:#138dcc}.qwo1-empty{padding:35px!important;text-align:center;color:#7e8d9a}
      .qwo1-modal-bg{position:fixed;inset:0;background:rgba(17,35,49,.42);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px}
      .qwo1-modal{width:min(1160px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:10px;box-shadow:0 24px 65px rgba(0,0,0,.28)}
      .qwo1-modal-head{position:sticky;top:0;z-index:3;background:#fff;border-bottom:1px solid #d6e0e8;padding:15px 18px;display:flex;justify-content:space-between;align-items:center}
      .qwo1-modal-head h3{margin:0;font-size:17px}.qwo1-x{border:0;background:none;font-size:25px;cursor:pointer}.qwo1-body{padding:17px}
      .qwo1-form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.qwo1-form-field label{display:block;font-size:9px;font-weight:800;color:#64788a;margin-bottom:4px}
      .qwo1-form-field input,.qwo1-form-field select,.qwo1-form-field textarea{width:100%;border:1px solid #cad8e4;border-radius:5px;padding:8px;font-size:10px;background:#fff}.qwo1-form-field textarea{min-height:70px}
      .qwo1-box{border:1px solid #d6e0e8;border-radius:8px;padding:11px;margin-top:10px}.qwo1-box-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.qwo1-box h4{font-size:11px;margin:0}
      .qwo1-inner{width:100%;min-width:1000px;border-collapse:collapse;font-size:9px}.qwo1-inner th,.qwo1-inner td{border:1px solid #dbe4eb;padding:7px;text-align:center}.qwo1-inner th{background:#edf5fa;color:#4b6477}
      .qwo1-inner input,.qwo1-inner select{width:100%;height:32px;border:1px solid #cad8e4;border-radius:4px;padding:0 6px;font-size:9px}
      .qwo1-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:13px}
      .qwo1-summary{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.qwo1-sum{border:1px solid #d6e0e8;border-radius:7px;padding:9px}.qwo1-sum .l{font-size:9px;color:#788999}.qwo1-sum .v{font-size:12px;font-weight:900;margin-top:4px}
      @media(max-width:1100px){.qwo1-filter{grid-template-columns:1fr 1fr}.qwo1-kpis{grid-template-columns:repeat(3,1fr)}.qwo1-form-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  IssueWoTab=function QMESWorkorderOwnerV1(){
    ensureStyle();
    const [version,setVersion]=useState(0);
    const [modal,setModal]=useState(null);
    const [filters,setFilters]=useState({from:"",to:"",customer:"",product:"",status:"",approval:"",q:""});
    const rows=useMemo(()=>workRows(),[version]);
    const customers=useMemo(()=>Array.from(new Set(rows.map(r=>r.customer).filter(x=>x&&x!=="-"))),[rows]);

    const filtered=rows.filter(r=>{
      const q=clean(filters.q).toLowerCase();
      if(filters.from&&r.issueDate&&r.issueDate<filters.from)return false;
      if(filters.to&&r.issueDate&&r.issueDate>filters.to)return false;
      if(filters.customer&&r.customer!==filters.customer)return false;
      if(filters.product&&!r.product.toLowerCase().includes(filters.product.toLowerCase()))return false;
      if(filters.status&&normalizeStatus(r.status)!==filters.status)return false;
      if(filters.approval&&r.approval!==filters.approval)return false;
      if(q&&!([r.workOrderNo,r.lot,r.product,r.customer].join(" ").toLowerCase().includes(q)))return false;
      return true;
    });

    const counts={
      all:filtered.length,
      wait:filtered.filter(r=>normalizeStatus(r.status)==="대기").length,
      run:filtered.filter(r=>normalizeStatus(r.status)==="생산중").length,
      done:filtered.filter(r=>normalizeStatus(r.status)==="완료").length,
      hold:filtered.filter(r=>normalizeStatus(r.status)==="보류").length,
      approved:filtered.filter(r=>r.approval==="승인완료").length
    };

    function materialOptions(){
      const base=(typeof MATERIAL_OPTIONS!=="undefined"&&Array.isArray(MATERIAL_OPTIONS)?MATERIAL_OPTIONS:[])
        .filter(x=>!String(x).includes("중간배치"));
      const mids=(typeof INTERMEDIATE_MATERIAL_OPTIONS!=="undefined"&&Array.isArray(INTERMEDIATE_MATERIAL_OPTIONS)?INTERMEDIATE_MATERIAL_OPTIONS:[
        "중간배치(SBR 바인더)","중간배치(PVDF 바인더)","중간배치(SBS 바인더)"
      ]);
      return Array.from(new Set([...base,...mids]));
    }
    function blankMaterial(){
      const opts=materialOptions();
      return {name:opts[0]||"",lot:"",inputStatus:"신규",plan:"",act:"",unit:"kg",note:""};
    }
    function openNew(){
      setModal({mode:"edit",key:"",form:{issueDate:today(),customer:"",product:"",lot:"",plan:"",unit:"kg",due:"",equipment:"",writer:userName(),notes:"",materials:[blankMaterial()]}});
    }
    function openEdit(row){
      const d=row.doc||{};
      setModal({mode:"edit",key:row.key,form:{
        issueDate:row.issueDate||today(),customer:row.customer==="-"?"":row.customer,product:row.product==="-"?"":row.product,
        lot:row.lot,plan:String(row.plan||""),unit:row.unit||"kg",due:row.due||"",equipment:row.equipment==="-"?"":row.equipment,
        writer:row.writer==="-"?userName():row.writer,notes:row.notes||"",
        materials:(Array.isArray(d.inputs)&&d.inputs.length?d.inputs.map(x=>({name:x.name||"",lot:x.materialLot||x.lot||"",inputStatus:x.inputStatus||"신규",plan:x.plan??x.std??"",act:x.act??"",unit:x.unit||"kg",note:x.note||""})):[blankMaterial()])
      }});
    }
    function openDetail(row){setModal({mode:"detail",row});}
    function fset(key,val){setModal(m=>({...m,form:{...m.form,[key]:val}}));}
    function mset(i,key,val){setModal(m=>({...m,form:{...m.form,materials:m.form.materials.map((x,idx)=>idx===i?{...x,[key]:val}:x)}}));}
    function addMaterial(){setModal(m=>({...m,form:{...m.form,materials:[...m.form.materials,blankMaterial()]}}));}
    function removeMaterial(i){setModal(m=>({...m,form:{...m.form,materials:m.form.materials.filter((_,idx)=>idx!==i)}}));}

    async function save(){
      const db=safeDb(); if(!db){alert("작업지시 DB를 찾을 수 없습니다.");return;}
      const f=modal.form;
      if(!clean(f.product)||!clean(f.lot)||!clean(f.due)){alert("제품명, 생산LOT, 생산예정일을 입력하세요.");return;}
      const key=clean(f.lot).toUpperCase();
      if(!modal.key&&(db.batches||[]).some(b=>clean(b.no).toUpperCase()===key)){alert("이미 사용 중인 생산LOT입니다.");return;}
      const oldKey=modal.key;
      const oldBatch=(db.batches||[]).find(b=>b.no===oldKey)||{};
      const oldDoc=db.woDocs?.[oldKey]||{};
      const totalPlan=f.materials.reduce((s,x)=>s+n(x.plan),0);
      const plan=n(f.plan)||totalPlan;
      const workOrderNo=clean(oldDoc.workOrderNo)||("WO-"+clean(f.issueDate||today()).replace(/-/g,"").slice(2)+"-"+String((db.batches||[]).length+1).padStart(3,"0"));
      const batch={...oldBatch,no:key,item:clean(f.product),tank:clean(f.equipment),plan,done:n(oldBatch.done),unit:clean(f.unit)||"kg",due:clean(f.due),status:clean(oldBatch.status||"발행"),worker:clean(f.writer),time:oldBatch.time||new Date().toLocaleTimeString("ko-KR",{hour12:false})};
      const inputs=f.materials.map((x,i)=>({seq:i+1,name:clean(x.name),lot:clean(x.lot),materialLot:clean(x.lot),inputStatus:clean(x.inputStatus)||"신규",plan:n(x.plan),std:n(x.plan),act:clean(x.act)===""?null:n(x.act),unit:clean(x.unit)||"kg",note:clean(x.note),materialType:(typeof qmesMaterialType==="function"?qmesMaterialType(x.name):(String(x.name).includes("중간배치")?"중간재":"원재료"))}));
      const doc={...oldDoc,item:clean(f.product),workOrderNo,customer:clean(f.customer),issueDate:clean(f.issueDate),date:clean(f.due),tank:clean(f.equipment),plan,workers:clean(f.writer),writer:clean(f.writer),notes:clean(f.notes),inputs,status:clean(oldDoc.status||"발행")};

      db.woDocs=db.woDocs||{}; db.lots=db.lots||{};
      if(oldKey&&oldKey!==key){
        delete db.woDocs[oldKey]; delete db.lots[oldKey];
        db.batches=(db.batches||[]).filter(b=>b.no!==oldKey);
      }
      db.woDocs[key]=doc;
      db.batches=modal.key?(db.batches||[]).map(b=>b.no===oldKey?batch:b):[batch,...(db.batches||[])];
      db.lots[key]={...(db.lots[key]||{}),item:clean(f.product),itemName:clean(f.product),wo:workOrderNo,status:"발행 — 생산 대기",stage:"생산",materials:inputs.filter(x=>x.materialLot).map(x=>({lot:x.materialLot,name:x.name,materialType:x.materialType,inputStatus:x.inputStatus,qty:`${x.act??x.plan} ${x.unit}`}))};

      try{if(typeof auditLog==="function")auditLog("작업지시",modal.key?"수정":"발행",key,`${f.product} / ${plan}kg / ${f.due}`);}catch(_){}
      try{if(typeof dbSave==="function")dbSave();}catch(_){}
      try{
        if(typeof qmesSyncWorkOrder==="function")await qmesSyncWorkOrder(key);
        if(!modal.key&&typeof qmesCreatePqcDraftForIssuedWorkOrder==="function"){
          const draft=qmesCreatePqcDraftForIssuedWorkOrder(key);
          if(draft&&typeof qmesSyncUpsert==="function")await qmesSyncUpsert(draft.type,draft.key,draft.payload);
        }
      }catch(e){alert("공용 DB 저장 실패: "+(e.message||e));return;}
      setModal(null);setVersion(v=>v+1);
    }

    return <div className="qwo1">
      <div className="qwo1-head">
        <h2>작업지시서 관리</h2>
        <div className="qwo1-actions">
          <button className="qwo1-btn green" onClick={()=>alert("엑셀 원료 불러오기 기능 연결 예정")}>엑셀 원료 불러오기</button>
          <button className="qwo1-btn" onClick={()=>window.print()}>작업지시서 인쇄</button>
          <button className="qwo1-btn green" onClick={()=>alert("엑셀 다운로드 기능 연결 예정")}>엑셀 다운로드</button>
          <button className="qwo1-btn blue" onClick={openNew}>+ 신규 작업지시</button>
        </div>
      </div>

      <div className="qwo1-filter">
        <div className="qwo1-field"><label>지시기간</label><div className="qwo1-period"><input className="qwo1-control" type="date" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/><span>~</span><input className="qwo1-control" type="date" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/></div></div>
        <div className="qwo1-field"><label>고객사</label><select className="qwo1-control" value={filters.customer} onChange={e=>setFilters({...filters,customer:e.target.value})}><option value="">전체</option>{customers.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="qwo1-field"><label>제품명</label><input className="qwo1-control" placeholder="제품명 검색" value={filters.product} onChange={e=>setFilters({...filters,product:e.target.value})}/></div>
        <div className="qwo1-field"><label>진행상태</label><select className="qwo1-control" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">전체</option><option>대기</option><option>생산중</option><option>완료</option><option>보류</option></select></div>
        <div className="qwo1-field"><label>결재상태</label><select className="qwo1-control" value={filters.approval} onChange={e=>setFilters({...filters,approval:e.target.value})}><option value="">전체</option><option>작성</option><option>검토완료</option><option>승인완료</option></select></div>
        <div className="qwo1-field"><label>통합검색</label><input className="qwo1-control" placeholder="작업지시번호, 생산LOT, 제품명, 고객사 검색" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/></div>
        <button className="qwo1-btn blue">조회</button>
      </div>

      <div className="qwo1-kpis">
        <div className="qwo1-kpi info"><div className="l">전체 작업지시</div><div className="v">{counts.all}</div><div className="s">조회기간 기준</div></div>
        <div className="qwo1-kpi warn"><div className="l">생산 대기</div><div className="v">{counts.wait}</div><div className="s">작업 시작 전</div></div>
        <div className="qwo1-kpi info"><div className="l">생산 진행</div><div className="v">{counts.run}</div><div className="s">현재 생산중</div></div>
        <div className="qwo1-kpi good"><div className="l">생산 완료</div><div className="v">{counts.done}</div><div className="s">실적 등록 완료</div></div>
        <div className="qwo1-kpi bad"><div className="l">보류 / 이상</div><div className="v">{counts.hold}</div><div className="s">확인 필요</div></div>
        <div className="qwo1-kpi good"><div className="l">승인 완료</div><div className="v">{counts.approved}</div><div className="s">결재 완료</div></div>
      </div>

      <div className="qwo1-panel">
        <div className="qwo1-panel-hd"><h3>작업지시 현황</h3><span>수주 → 작업지시 → 원료투입 → 생산 → PQC → 완료</span></div>
        <div className="qwo1-scroll"><table className="qwo1-table"><thead><tr>
          <th>No</th><th>지시일</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산LOT</th><th>계획수량</th><th>단위</th><th>생산예정일</th><th>설비</th><th>원료수</th><th>투입계획량</th><th>실투입량</th><th>생산수량</th><th>수율</th><th>PQC</th><th>진행상태</th><th>작성자</th><th>검토</th><th>승인</th><th>비고</th><th>관리</th>
        </tr></thead><tbody>
          {filtered.length?filtered.map((r,i)=><tr key={r.key}>
            <td>{i+1}</td><td>{r.issueDate||"-"}</td><td><button className="qwo1-link" onClick={()=>openDetail(r)}>{r.workOrderNo||r.key}</button></td><td>{r.customer}</td><td style={{textAlign:"left"}}>{r.product}</td><td>{r.lot}</td><td>{fmt(r.plan)}</td><td>{r.unit}</td><td>{r.due||"-"}</td><td>{r.equipment}</td><td>{r.materialCount}</td><td>{fmt(r.inputPlan)}</td><td>{fmt(r.inputActual)}</td><td>{fmt(r.productionQty)}</td><td>{r.yieldPct==null?"-":r.yieldPct.toFixed(1)+"%"}</td><td><span className={"qwo1-status "+pqcTone(r.pqc)}>{r.pqc}</span></td><td><span className={"qwo1-status "+statTone(normalizeStatus(r.status))}>{normalizeStatus(r.status)}</span></td><td>{r.writer}</td><td>{r.review}</td><td>{r.approval}</td><td>{r.notes||"-"}</td><td><div className="qwo1-manage"><button className="qwo1-mini blue" onClick={()=>openDetail(r)}>상세</button><button className="qwo1-mini" onClick={()=>openEdit(r)}>수정</button></div></td>
          </tr>):<tr><td colSpan="22" className="qwo1-empty">검색 조건에 맞는 작업지시가 없습니다.</td></tr>}
        </tbody></table></div>
      </div>

      {modal&&modal.mode==="detail"&&<div className="qwo1-modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}>
        <div className="qwo1-modal"><div className="qwo1-modal-head"><h3>{modal.row.workOrderNo||modal.row.key} · 작업지시 상세</h3><button className="qwo1-x" onClick={()=>setModal(null)}>×</button></div>
        <div className="qwo1-body"><div className="qwo1-summary">
          <div className="qwo1-sum"><div className="l">작업지시번호</div><div className="v">{modal.row.workOrderNo||modal.row.key}</div></div>
          <div className="qwo1-sum"><div className="l">생산LOT</div><div className="v">{modal.row.lot}</div></div>
          <div className="qwo1-sum"><div className="l">계획수량</div><div className="v">{fmt(modal.row.plan)} {modal.row.unit}</div></div>
          <div className="qwo1-sum"><div className="l">생산수량</div><div className="v">{fmt(modal.row.productionQty)} {modal.row.unit}</div></div>
          <div className="qwo1-sum"><div className="l">수율</div><div className="v">{modal.row.yieldPct==null?"-":modal.row.yieldPct.toFixed(1)+"%"}</div></div>
          <div className="qwo1-sum"><div className="l">진행상태</div><div className="v">{normalizeStatus(modal.row.status)}</div></div>
        </div>
        <div className="qwo1-box"><div className="qwo1-box-title"><h4>투입원료</h4></div><div style={{overflow:"auto"}}><table className="qwo1-inner"><thead><tr><th>No</th><th>원재료명</th><th>원재료 LOT</th><th>투입상태</th><th>투입량</th><th>실투입량</th><th>단위</th><th>비고</th></tr></thead><tbody>
          {(modal.row.doc.inputs||[]).map((x,i)=><tr key={i}><td>{i+1}</td><td>{x.name}</td><td>{x.materialLot||x.lot||"-"}</td><td>{x.inputStatus||"신규"}</td><td>{fmt(x.plan??x.std)}</td><td>{x.act==null?"-":fmt(x.act)}</td><td>{x.unit||"kg"}</td><td>{x.note||"-"}</td></tr>)}
        </tbody></table></div></div>
        <div className="qwo1-modal-actions"><button className="qwo1-btn" onClick={()=>setModal(null)}>닫기</button><button className="qwo1-btn blue" onClick={()=>openEdit(modal.row)}>수정</button></div>
        </div></div></div>}

      {modal&&modal.mode==="edit"&&<div className="qwo1-modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}>
        <div className="qwo1-modal"><div className="qwo1-modal-head"><h3>{modal.key?"작업지시 수정":"신규 작업지시 등록"}</h3><button className="qwo1-x" onClick={()=>setModal(null)}>×</button></div>
        <div className="qwo1-body">
          <div className="qwo1-form-grid">
            <div className="qwo1-form-field"><label>지시일</label><input type="date" value={modal.form.issueDate} onChange={e=>fset("issueDate",e.target.value)}/></div>
            <div className="qwo1-form-field"><label>고객사</label><input value={modal.form.customer} onChange={e=>fset("customer",e.target.value)} placeholder="고객사 입력"/></div>
            <div className="qwo1-form-field"><label>제품명</label><input value={modal.form.product} onChange={e=>fset("product",e.target.value)} placeholder="제품명 입력"/></div>
            <div className="qwo1-form-field"><label>생산LOT</label><input value={modal.form.lot} onChange={e=>fset("lot",e.target.value.toUpperCase())} readOnly={!!modal.key} placeholder="생산LOT 수기 입력"/></div>
            <div className="qwo1-form-field"><label>계획수량</label><input type="number" value={modal.form.plan} onChange={e=>fset("plan",e.target.value)} placeholder="0"/></div>
            <div className="qwo1-form-field"><label>단위</label><select value={modal.form.unit} onChange={e=>fset("unit",e.target.value)}><option>kg</option><option>EA</option></select></div>
            <div className="qwo1-form-field"><label>생산예정일</label><input type="date" value={modal.form.due} onChange={e=>fset("due",e.target.value)}/></div>
            <div className="qwo1-form-field"><label>설비</label><input value={modal.form.equipment} onChange={e=>fset("equipment",e.target.value)} placeholder="예: MIX-01"/></div>
            <div className="qwo1-form-field"><label>작성자</label><input value={modal.form.writer} readOnly/></div>
            <div className="qwo1-form-field" style={{gridColumn:"1/-1"}}><label>비고</label><textarea value={modal.form.notes} onChange={e=>fset("notes",e.target.value)} placeholder="작업지시 특이사항"/></div>
          </div>

          <div className="qwo1-box"><div className="qwo1-box-title"><h4>투입원료</h4><button className="qwo1-btn green" onClick={addMaterial}>+ 원료 추가</button></div>
            <div style={{overflow:"auto"}}><table className="qwo1-inner"><thead><tr><th>No</th><th>원재료명</th><th>원재료 LOT</th><th>투입상태</th><th>투입량</th><th>실투입량</th><th>단위</th><th>비고</th><th>관리</th></tr></thead><tbody>
              {modal.form.materials.map((x,i)=><tr key={i}>
                <td>{i+1}</td><td><select value={x.name} onChange={e=>mset(i,"name",e.target.value)}>{materialOptions().map(o=><option key={o}>{o}</option>)}</select></td>
                <td><input value={x.lot} onChange={e=>mset(i,"lot",e.target.value.toUpperCase())}/></td>
                <td><select value={x.inputStatus} onChange={e=>mset(i,"inputStatus",e.target.value)}><option>신규</option><option>잔량</option></select></td>
                <td><input type="number" value={x.plan} onChange={e=>mset(i,"plan",e.target.value)}/></td>
                <td><input type="number" value={x.act} onChange={e=>mset(i,"act",e.target.value)}/></td>
                <td><select value={x.unit} onChange={e=>mset(i,"unit",e.target.value)}><option>kg</option><option>EA</option></select></td>
                <td><input value={x.note} onChange={e=>mset(i,"note",e.target.value)}/></td>
                <td><button className="qwo1-mini" onClick={()=>removeMaterial(i)}>삭제</button></td>
              </tr>)}
              <tr><th colSpan="4">계</th><th>{fmt(modal.form.materials.reduce((s,x)=>s+n(x.plan),0))}</th><th>{fmt(modal.form.materials.reduce((s,x)=>s+n(x.act),0))}</th><th>{modal.form.unit}</th><th colSpan="2"></th></tr>
            </tbody></table></div>
          </div>

          <div className="qwo1-modal-actions"><button className="qwo1-btn" onClick={()=>setModal(null)}>취소</button><button className="qwo1-btn blue" onClick={save}>저장</button></div>
        </div></div></div>}
    </div>;
  };

  window.dispatchEvent(new CustomEvent("qmes:workorder-owner-ready",{detail:{version:"20260928-v1"}}));
})();