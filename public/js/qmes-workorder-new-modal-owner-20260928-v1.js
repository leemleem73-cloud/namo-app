/* QMES Workorder New Modal Owner V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Replaces ONLY the "+ 신규 작업지시" modal.
 * All other workorder screens and logic remain untouched.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_NEW_MODAL_OWNER_V1__) return;
  window.__QMES_WORKORDER_NEW_MODAL_OWNER_V1__=true;

  const ID="qmes-workorder-new-modal-owner-v1";
  const STYLE_ID=ID+"-style";

  function clean(v){return String(v==null?"":v).trim();}
  function num(v){const n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
  function today(){return new Date().toISOString().slice(0,10);}
  function currentUser(){
    const u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    const name=clean(typeof u==="string"?u:(u.name||u.userName||u.username||""));
    return name||"임흥배 부장";
  }
  function db(){try{return typeof DB!=="undefined"?DB:null;}catch(_){return null;}}

  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${ID}{position:fixed;inset:0;z-index:2147483200;background:rgba(28,43,55,.45);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,"Malgun Gothic","Noto Sans KR",sans-serif;color:#26384a}
      #${ID} *{box-sizing:border-box}
      #${ID} .wm-box{width:min(1515px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:12px;box-shadow:0 26px 70px rgba(0,0,0,.28)}
      #${ID} .wm-head{height:82px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid #d7e1ea;position:sticky;top:0;background:#fff;z-index:4}
      #${ID} .wm-head h3{margin:0;font-size:28px;font-weight:900;color:#19344d}
      #${ID} .wm-close{border:0;background:transparent;font-size:34px;color:#5f6c7b;cursor:pointer}
      #${ID} .wm-body{padding:24px}
      #${ID} .wm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 12px}
      #${ID} .wm-field label{display:block;font-size:12px;font-weight:800;color:#607589;margin:0 0 6px}
      #${ID} .wm-field input,#${ID} .wm-field select,#${ID} .wm-field textarea{width:100%;height:42px;border:1px solid #cbd8e3;border-radius:6px;padding:0 12px;font-size:14px;background:#fff;color:#26384a}
      #${ID} .wm-field textarea{height:95px;padding:12px;resize:vertical}
      #${ID} .wm-field.full{grid-column:1/-1}
      #${ID} .wm-field input[readonly]{background:#fafbfc}
      #${ID} .wm-mat-box{margin-top:20px;border:1px solid #d5e0e8;border-radius:10px;padding:16px}
      #${ID} .wm-mat-box h4{margin:0 0 12px;font-size:18px}
      #${ID} .wm-scroll{overflow:auto}
      #${ID} table{width:100%;border-collapse:collapse;min-width:1040px;font-size:13px}
      #${ID} th,#${ID} td{border:1px solid #d6e1e9;text-align:center;padding:0;height:38px}
      #${ID} th{background:#edf5fa;color:#496175;font-weight:900}
      #${ID} td input,#${ID} td select{width:100%;height:36px;border:0;border-radius:0;background:transparent;padding:0 8px;text-align:center;font-size:13px;outline:none}
      #${ID} .wm-total th,#${ID} .wm-total td{background:#edf5fa;font-weight:900}
      #${ID} .wm-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
      #${ID} .wm-btn{height:46px;padding:0 22px;border-radius:7px;border:1px solid #c8d6e2;background:#fff;font-weight:800;color:#40566a;cursor:pointer}
      #${ID} .wm-btn.primary{background:#0f91d0;border-color:#0f91d0;color:#fff}
      @media(max-width:1050px){#${ID} .wm-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  function materialRow(i,name,lot,plan,actual,unit,note){
    return `<tr data-row="${i}">
      <td>${i+1}</td>
      <td><input name="m_name_${i}" value="${name||""}"></td>
      <td><input name="m_lot_${i}" value="${lot||""}"></td>
      <td><input name="m_plan_${i}" type="number" step="0.001" value="${plan||0}"></td>
      <td><input name="m_actual_${i}" type="number" step="0.001" value="${actual||0}"></td>
      <td><select name="m_unit_${i}"><option>kg</option><option>EA</option></select></td>
      <td><input name="m_note_${i}" value="${note||"-"}"></td>
    </tr>`;
  }

  function open(){
    document.getElementById(ID)?.remove();
    style();

    const el=document.createElement("div");
    el.id=ID;
    el.className="qmes-sales-ledger-v4";
    el.innerHTML=`
      <div class="wm-box">
        <div class="wm-head"><h3>신규 작업지시 등록</h3><button class="wm-close" type="button">×</button></div>
        <div class="wm-body">
          <div class="wm-grid">
            <div class="wm-field qrl-date"><label>지시일</label><input name="issueDate" type="date" value="${today()}"></div>
            <div class="wm-field"><label>고객사</label><select name="customer"><option>현대자동차</option><option>알파라인</option></select></div>
            <div class="wm-field"><label>제품명</label><input name="product" placeholder="제품명 입력"></div>

            <div class="wm-field"><label>생산LOT</label><input name="lot" placeholder="생산LOT 수기 입력"></div>
            <div class="wm-field"><label>계획수량</label><input name="plan" type="number" step="0.001" value="0"></div>
            <div class="wm-field"><label>단위</label><select name="unit"><option>kg</option><option>EA</option></select></div>

            <div class="wm-field qrl-date"><label>생산예정일</label><input name="due" type="date" placeholder="YYYY-MM-DD"></div>
            <div class="wm-field"><label>설비</label><select name="equipment"><option>MIX-01</option><option>MIX-02</option></select></div>
            <div class="wm-field"><label>작성자</label><input name="writer" value="${currentUser()}" readonly></div>

            <div class="wm-field full"><label>비고</label><textarea name="notes" placeholder="작업지시 특이사항"></textarea></div>
          </div>

          <div class="wm-mat-box">
            <h4>투입원료</h4>
            <div class="wm-scroll"><table>
              <thead><tr><th>No</th><th>원재료명</th><th>원재료 LOT</th><th>투입량</th><th>실투입량</th><th>단위</th><th>비고</th></tr></thead>
              <tbody>
                ${materialRow(0,"NMP","RM260920-N01",420,420,"kg","-")}
                ${materialRow(1,"Binder","RM260918-B03",210,209,"kg","-1kg")}
                ${materialRow(2,"Boehmite","RM260919-A02",350,350,"kg","-")}
                ${materialRow(3,"Additive","RM260921-C05",40,40,"kg","-")}
                <tr class="wm-total"><th colspan="3">계</th><th data-total-plan>1,020</th><th data-total-actual>1,019</th><th>kg</th><th></th></tr>
              </tbody>
            </table></div>
          </div>

          <div class="wm-actions"><button class="wm-btn" data-cancel type="button">취소</button><button class="wm-btn primary" data-save type="button">저장</button></div>
        </div>
      </div>`;

    document.body.appendChild(el);

    const recalc=()=>{
      let p=0,a=0;
      for(let i=0;i<4;i++){p+=num(el.querySelector(`[name="m_plan_${i}"]`)?.value);a+=num(el.querySelector(`[name="m_actual_${i}"]`)?.value);}
      el.querySelector("[data-total-plan]").textContent=p.toLocaleString("ko-KR",{maximumFractionDigits:3});
      el.querySelector("[data-total-actual]").textContent=a.toLocaleString("ko-KR",{maximumFractionDigits:3});
    };
    el.addEventListener("input",e=>{if(e.target.matches('[name^="m_plan_"],[name^="m_actual_"]'))recalc();});
    el.querySelector(".wm-close").onclick=()=>el.remove();
    el.querySelector("[data-cancel]").onclick=()=>el.remove();
    el.addEventListener("mousedown",e=>{if(e.target===el)el.remove();});

    el.querySelectorAll('input[type="date"]').forEach(input=>{
      try{if(window.qmesFixedCalendar?.patch)window.qmesFixedCalendar.patch(input);}catch(_){}
    });
    try{if(window.qmesFixedCalendar?.scan)window.qmesFixedCalendar.scan(el);}catch(_){}

    el.querySelector("[data-save]").onclick=async()=>{
      const D=db(); if(!D){alert("작업지시 DB를 찾을 수 없습니다.");return;}
      const issueDate=clean(el.querySelector('[name="issueDate"]').value);
      const customer=clean(el.querySelector('[name="customer"]').value);
      const product=clean(el.querySelector('[name="product"]').value);
      const lot=clean(el.querySelector('[name="lot"]').value).toUpperCase();
      const plan=num(el.querySelector('[name="plan"]').value);
      const unit=clean(el.querySelector('[name="unit"]').value)||"kg";
      const due=clean(el.querySelector('[name="due"]').value);
      const equipment=clean(el.querySelector('[name="equipment"]').value);
      const writer=clean(el.querySelector('[name="writer"]').value);
      const notes=clean(el.querySelector('[name="notes"]').value);

      if(!product||!lot||!due){alert("제품명, 생산LOT, 생산예정일을 입력하세요.");return;}
      if((D.batches||[]).some(b=>clean(b.no).toUpperCase()===lot)){alert("이미 사용 중인 생산LOT입니다.");return;}

      const materials=[];
      for(let i=0;i<4;i++){
        const name=clean(el.querySelector(`[name="m_name_${i}"]`).value);
        const mlot=clean(el.querySelector(`[name="m_lot_${i}"]`).value).toUpperCase();
        const mplan=num(el.querySelector(`[name="m_plan_${i}"]`).value);
        const actual=num(el.querySelector(`[name="m_actual_${i}"]`).value);
        const munit=clean(el.querySelector(`[name="m_unit_${i}"]`).value)||"kg";
        const note=clean(el.querySelector(`[name="m_note_${i}"]`).value);
        materials.push({seq:i+1,name,lot:mlot,materialLot:mlot,inputStatus:"신규",plan:mplan,std:mplan,act:actual,unit:munit,note,materialType:(typeof qmesMaterialType==="function"?qmesMaterialType(name):"원재료")});
      }

      const woNo="WO-"+issueDate.replace(/-/g,"").slice(2)+"-"+String((D.batches||[]).length+1).padStart(3,"0");
      D.woDocs=D.woDocs||{};D.lots=D.lots||{};
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

      el.remove();
      location.reload();
    };
  }

  document.addEventListener("click",function(e){
    const btn=e.target instanceof Element?e.target.closest("button"):null;
    if(!btn||!btn.closest(".qwo1"))return;
    if(clean(btn.textContent)!=="+ 신규 작업지시")return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    open();
  },true);
})();