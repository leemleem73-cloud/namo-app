/* QMES Workorder New Modal Owner V2 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Replaces ONLY the new-workorder registration modal to match the approved screenshot.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_NEW_MODAL_OWNER_V2__) return;
  window.__QMES_WORKORDER_NEW_MODAL_OWNER_V2__=true;

  const ROOT_ID="qmes-workorder-new-modal-v2";
  const STYLE_ID=ROOT_ID+"-style";

  function clean(v){return String(v==null?"":v).trim();}
  function toNum(v){const x=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(x)?x:0;}
  function today(){return new Date().toISOString().slice(0,10);}
  function currentUser(){
    const u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    const name=clean(typeof u==="string"?u:(u.name||u.userName||u.username||""));
    return name||"임흥배 부장";
  }
  function getDb(){try{return typeof DB!=="undefined"?DB:null;}catch(_){return null;}}

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${ROOT_ID}{position:fixed;inset:0;z-index:2147483500;background:rgba(35,48,58,.48);display:flex;align-items:center;justify-content:center;padding:26px;font-family:Arial,"Malgun Gothic","Noto Sans KR",sans-serif;color:#24384a}
      #${ROOT_ID} *{box-sizing:border-box}
      #${ROOT_ID} .wo2-modal{width:min(1515px,96vw);max-height:92vh;background:#fff;border-radius:12px;box-shadow:0 28px 75px rgba(0,0,0,.28);overflow:auto}
      #${ROOT_ID} .wo2-head{height:82px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid #d7e1ea;position:sticky;top:0;background:#fff;z-index:3}
      #${ROOT_ID} .wo2-head h3{margin:0;font-size:28px;font-weight:900;color:#1e3851}
      #${ROOT_ID} .wo2-close{border:0;background:transparent;font-size:34px;line-height:1;color:#5c6977;cursor:pointer}
      #${ROOT_ID} .wo2-body{padding:24px}
      #${ROOT_ID} .wo2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 12px}
      #${ROOT_ID} .wo2-field label{display:block;margin:0 0 6px;font-size:12px;font-weight:800;color:#607589}
      #${ROOT_ID} .wo2-field input,#${ROOT_ID} .wo2-field select,#${ROOT_ID} .wo2-field textarea{width:100%;height:42px;border:1px solid #cbd8e3;border-radius:6px;padding:0 12px;background:#fff;color:#26384a;font-size:14px}
      #${ROOT_ID} .wo2-field textarea{height:95px;padding:12px;resize:vertical}
      #${ROOT_ID} .wo2-field.full{grid-column:1/-1}
      #${ROOT_ID} .wo2-field input[readonly]{background:#fafbfc}
      #${ROOT_ID} .wo2-material-box{margin-top:20px;border:1px solid #d5e0e8;border-radius:10px;padding:16px}
      #${ROOT_ID} .wo2-material-box h4{margin:0 0 12px;font-size:18px}
      #${ROOT_ID} .wo2-table-wrap{overflow:auto}
      #${ROOT_ID} table{width:100%;min-width:1040px;border-collapse:collapse;font-size:13px}
      #${ROOT_ID} th,#${ROOT_ID} td{height:38px;border:1px solid #d6e1e9;text-align:center}
      #${ROOT_ID} th{background:#edf5fa;color:#496175;font-weight:900}
      #${ROOT_ID} td input,#${ROOT_ID} td select{width:100%;height:36px;border:0;background:transparent;text-align:center;padding:0 8px;font-size:13px;outline:none}
      #${ROOT_ID} .wo2-total th,#${ROOT_ID} .wo2-total td{background:#edf5fa;font-weight:900}
      #${ROOT_ID} .wo2-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
      #${ROOT_ID} .wo2-btn{height:46px;padding:0 22px;border-radius:7px;border:1px solid #c8d6e2;background:#fff;color:#40566a;font-weight:800;cursor:pointer}
      #${ROOT_ID} .wo2-btn.primary{background:#0f91d0;border-color:#0f91d0;color:#fff}
      @media(max-width:1100px){#${ROOT_ID} .wo2-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  function row(i,name,lot,plan,actual,unit,note){
    return `<tr data-i="${i}">
      <td>${i+1}</td>
      <td><input name="m_name_${i}" value="${name}"></td>
      <td><input name="m_lot_${i}" value="${lot}"></td>
      <td><input name="m_plan_${i}" type="number" step="0.001" value="${plan}"></td>
      <td><input name="m_actual_${i}" type="number" step="0.001" value="${actual}"></td>
      <td><select name="m_unit_${i}"><option selected>kg</option><option>EA</option></select></td>
      <td><input name="m_note_${i}" value="${note}"></td>
    </tr>`;
  }

  function openModal(){
    document.getElementById(ROOT_ID)?.remove();
    ensureStyle();

    const root=document.createElement("div");
    root.id=ROOT_ID;
    root.innerHTML=`
      <div class="wo2-modal">
        <div class="wo2-head">
          <h3>신규 작업지시 등록</h3>
          <button type="button" class="wo2-close">×</button>
        </div>
        <div class="wo2-body">
          <div class="wo2-grid">
            <div class="wo2-field"><label>지시일</label><input name="issueDate" type="date" value="${today()}"></div>
            <div class="wo2-field"><label>고객사</label><select name="customer"><option>현대자동차</option><option>알파라인</option></select></div>
            <div class="wo2-field"><label>제품명</label><input name="product" placeholder="제품명 입력"></div>

            <div class="wo2-field"><label>생산LOT</label><input name="lot" placeholder="생산LOT 수기 입력"></div>
            <div class="wo2-field"><label>계획수량</label><input name="plan" type="number" step="0.001" value="0"></div>
            <div class="wo2-field"><label>단위</label><select name="unit"><option>kg</option><option>EA</option></select></div>

            <div class="wo2-field"><label>생산예정일</label><input name="due" type="date"></div>
            <div class="wo2-field"><label>설비</label><select name="equipment"><option>MIX-01</option><option>MIX-02</option></select></div>
            <div class="wo2-field"><label>작성자</label><input name="writer" value="${currentUser()}" readonly></div>

            <div class="wo2-field full"><label>비고</label><textarea name="notes" placeholder="작업지시 특이사항"></textarea></div>
          </div>

          <div class="wo2-material-box">
            <h4>투입원료</h4>
            <div class="wo2-table-wrap">
              <table>
                <thead><tr><th>No</th><th>원재료명</th><th>원재료 LOT</th><th>투입량</th><th>실투입량</th><th>단위</th><th>비고</th></tr></thead>
                <tbody>
                  ${row(0,"NMP","RM260920-N01",420,420,"kg","-")}
                  ${row(1,"Binder","RM260918-B03",210,209,"kg","-1kg")}
                  ${row(2,"Boehmite","RM260919-A02",350,350,"kg","-")}
                  ${row(3,"Additive","RM260921-C05",40,40,"kg","-")}
                  <tr class="wo2-total"><th colspan="3">계</th><th data-plan-total>1,020</th><th data-actual-total>1,019</th><th>kg</th><th></th></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="wo2-actions">
            <button type="button" class="wo2-btn" data-cancel>취소</button>
            <button type="button" class="wo2-btn primary" data-save>저장</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(root);

    const close=()=>root.remove();
    root.querySelector(".wo2-close").onclick=close;
    root.querySelector("[data-cancel]").onclick=close;
    root.addEventListener("mousedown",e=>{if(e.target===root)close();});

    function recalc(){
      let p=0,a=0;
      for(let i=0;i<4;i++){
        p+=toNum(root.querySelector(`[name="m_plan_${i}"]`)?.value);
        a+=toNum(root.querySelector(`[name="m_actual_${i}"]`)?.value);
      }
      root.querySelector("[data-plan-total]").textContent=p.toLocaleString("ko-KR",{maximumFractionDigits:3});
      root.querySelector("[data-actual-total]").textContent=a.toLocaleString("ko-KR",{maximumFractionDigits:3});
    }
    root.addEventListener("input",e=>{if(e.target.matches('[name^="m_plan_"],[name^="m_actual_"]'))recalc();});

    root.querySelector("[data-save]").onclick=async()=>{
      const D=getDb(); if(!D){alert("작업지시 DB를 찾을 수 없습니다.");return;}
      const issueDate=clean(root.querySelector('[name="issueDate"]').value);
      const customer=clean(root.querySelector('[name="customer"]').value);
      const product=clean(root.querySelector('[name="product"]').value);
      const lot=clean(root.querySelector('[name="lot"]').value).toUpperCase();
      const plan=toNum(root.querySelector('[name="plan"]').value);
      const unit=clean(root.querySelector('[name="unit"]').value)||"kg";
      const due=clean(root.querySelector('[name="due"]').value);
      const equipment=clean(root.querySelector('[name="equipment"]').value);
      const writer=clean(root.querySelector('[name="writer"]').value);
      const notes=clean(root.querySelector('[name="notes"]').value);

      if(!product||!lot||!due){alert("제품명, 생산LOT, 생산예정일을 입력하세요.");return;}
      if((D.batches||[]).some(b=>clean(b.no).toUpperCase()===lot)){alert("이미 사용 중인 생산LOT입니다.");return;}

      const materials=[];
      for(let i=0;i<4;i++){
        const name=clean(root.querySelector(`[name="m_name_${i}"]`).value);
        const mlot=clean(root.querySelector(`[name="m_lot_${i}"]`).value).toUpperCase();
        const mplan=toNum(root.querySelector(`[name="m_plan_${i}"]`).value);
        const actual=toNum(root.querySelector(`[name="m_actual_${i}"]`).value);
        const munit=clean(root.querySelector(`[name="m_unit_${i}"]`).value)||"kg";
        const note=clean(root.querySelector(`[name="m_note_${i}"]`).value);
        materials.push({seq:i+1,name,lot:mlot,materialLot:mlot,inputStatus:"신규",plan:mplan,std:mplan,act:actual,unit:munit,note,materialType:(typeof qmesMaterialType==="function"?qmesMaterialType(name):"원재료")});
      }

      const woNo="WO-"+issueDate.replace(/-/g,"").slice(2)+"-"+String((D.batches||[]).length+1).padStart(3,"0");
      D.woDocs=D.woDocs||{}; D.lots=D.lots||{};
      D.batches=[{no:lot,item:product,tank:equipment,plan,done:0,unit,due,status:"발행",worker:writer,time:new Date().toLocaleTimeString("ko-KR",{hour12:false})},...(D.batches||[])];
      D.woDocs[lot]={item:product,workOrderNo:woNo,customer,issueDate,date:due,tank:equipment,plan,workers:writer,writer,notes,inputs:materials,status:"발행"};
      D.lots[lot]={...(D.lots[lot]||{}),item:product,itemName:product,wo:woNo,status:"발행 — 생산 대기",stage:"생산",materials:materials.filter(x=>x.materialLot).map(x=>({lot:x.materialLot,name:x.name,materialType:x.materialType,inputStatus:"신규",qty:`${x.act??x.plan} ${x.unit}`}))};

      try{if(typeof auditLog==="function")auditLog("작업지시","발행",lot,`${product} / ${plan}${unit} / ${due}`);}catch(_){}
      try{if(typeof dbSave==="function")dbSave();}catch(_){}
      try{
        if(typeof qmesSyncWorkOrder==="function")await qmesSyncWorkOrder(lot);
        if(typeof qmesCreatePqcDraftForIssuedWorkOrder==="function"){
          const draft=qmesCreatePqcDraftForIssuedWorkOrder(lot);
          if(draft&&typeof qmesSyncUpsert==="function")await qmesSyncUpsert(draft.type,draft.key,draft.payload);
        }
      }catch(err){alert("공용 DB 저장 실패: "+(err?.message||err));return;}

      close();
      location.reload();
    };
  }

  document.addEventListener("click",function(e){
    const btn=e.target instanceof Element?e.target.closest("button"):null;
    if(!btn||!btn.closest(".qwo1"))return;
    if(clean(btn.textContent)!=="+ 신규 작업지시")return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openModal();
  },true);
})();