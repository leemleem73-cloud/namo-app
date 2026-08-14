/* Inventory v2 material-master quick add — 2026-08-14 */
(function inventoryMaterialMasterAdd(global){
  "use strict";
  if(global.__QMES_INVENTORY_MATERIAL_MASTER_ADD__)return;
  global.__QMES_INVENTORY_MATERIAL_MASTER_ADD__=true;

  const text=value=>String(value??"").trim();
  const clean=value=>text(value).replace(/\s+/g," ");
  const upper=value=>text(value).toUpperCase();
  const num=value=>{const parsed=Number(String(value??0).replace(/,/g,""));return Number.isFinite(parsed)?parsed:0;};
  const currentUser=()=>{const user=global.__QMES_CURRENT_USER__||global.__QMES_USER__;return text(user?.name||user||"관리자");};
  const payloadOf=record=>{
    let payload=record?.payload;
    if(!payload||typeof payload!=="object"){
      try{payload=JSON.parse(payload||"{}");}catch(_error){payload={};}
    }
    return payload;
  };

  function normalizeMaster(data){
    const type=upper(data.type)==="PACK"?"PACK":"RAW";
    let code=upper(data.code).replace(/\s+/g,"-").replace(/[^A-Z0-9_-]/g,"");
    if(code&&!/^(RM|PM)-/.test(code))code=`${type==="PACK"?"PM":"RM"}-${code}`;
    return {
      kind:"inventory-v2-master",
      type,
      code,
      name:text(data.name),
      unit:upper(data.unit),
      safety:Math.max(num(data.safety),0),
      location:text(data.location),
      iqcRequired:String(data.iqcRequired)!=="false",
      inspection:text(data.inspection),
      note:text(data.note)
    };
  }

  function receiptModal(){
    return Array.from(document.querySelectorAll(".qmes-inv2-modal")).find(modal=>clean(modal.querySelector("header h3")?.textContent)==="입고등록")||null;
  }

  function fieldByLabel(modal,label){
    return Array.from(modal?.querySelectorAll(".qmes-inv2-field")||[]).find(field=>clean(field.querySelector(":scope > span")?.textContent).startsWith(label))||null;
  }

  function closeModal(){document.getElementById("qmes-material-master-add-backdrop")?.remove();}

  function selectNewMaterial(type,code){
    const apply=()=>{
      const modal=receiptModal();
      if(!modal)return false;
      const typeSelect=fieldByLabel(modal,"구분")?.querySelector("select");
      if(typeSelect&&typeSelect.value!==type){
        typeSelect.value=type;
        typeSelect.dispatchEvent(new Event("change",{bubbles:true}));
        return false;
      }
      const materialSelect=fieldByLabel(modal,"자재코드 / 품명")?.querySelector("select");
      if(!materialSelect||!Array.from(materialSelect.options).some(option=>option.value===code))return false;
      materialSelect.value=code;
      materialSelect.dispatchEvent(new Event("change",{bubbles:true}));
      return true;
    };
    [120,300,600,1000,1600].forEach(delay=>setTimeout(apply,delay));
  }

  async function duplicateCode(code){
    const modal=receiptModal();
    const optionDuplicate=Array.from(modal?.querySelectorAll(".qmes-inv2-field select option")||[]).some(option=>upper(option.value)===code);
    if(optionDuplicate)return true;
    if(typeof global.qmesSyncList!=="function")return false;
    const records=await global.qmesSyncList("inventory");
    return (records||[]).map(payloadOf).some(row=>!row.deleted&&upper(row.code)===code&&(row.kind==="inventory-v2-master"||row.kind==="inventory-v2-receipt"));
  }

  function openModal(){
    closeModal();
    const backdrop=document.createElement("div");
    backdrop.id="qmes-material-master-add-backdrop";
    backdrop.className="qmes-material-add-backdrop";
    backdrop.innerHTML=`
      <section class="qmes-material-add-modal" role="dialog" aria-modal="true" aria-label="자재 추가">
        <header>
          <div><h3>자재 추가</h3><p>원재료와 부자재를 공용 자재 마스터에 등록합니다.</p></div>
          <button type="button" class="qmes-material-add-close" aria-label="닫기">×</button>
        </header>
        <form class="qmes-material-add-form">
          <label><span>구분 <b>*</b></span><select name="type"><option value="RAW">원재료</option><option value="PACK">부자재</option></select></label>
          <label><span>자재코드 <b>*</b></span><input name="code" value="RM-" maxlength="40" autocomplete="off" placeholder="예: RM-NMP 또는 PM-BOX01"></label>
          <label class="is-wide"><span>품명 <b>*</b></span><input name="name" maxlength="100" autocomplete="off" placeholder="자재 품명"></label>
          <label><span>단위 <b>*</b></span><input name="unit" list="qmes-material-unit-list" value="kg" maxlength="12" autocomplete="off"><datalist id="qmes-material-unit-list"><option value="kg"><option value="EA"><option value="ROLL"><option value="BOX"><option value="L"><option value="SET"><option value="PCS"></datalist></label>
          <label><span>안전재고</span><input name="safety" type="number" min="0" step="0.001" value="0"></label>
          <label><span>기본 위치</span><input name="location" maxlength="40" placeholder="예: A-01 또는 B-03"></label>
          <label><span>IQC 대상 여부</span><select name="iqcRequired"><option value="true">대상</option><option value="false">생략</option></select></label>
          <label class="is-wide"><span>검사기준</span><input name="inspection" maxlength="160" placeholder="예: 외관검사, 인쇄내용/규격검사"></label>
          <label class="is-wide"><span>비고</span><textarea name="note" rows="3" maxlength="500" placeholder="관리 참고사항"></textarea></label>
          <div class="qmes-material-add-message" role="alert"></div>
          <footer><button type="button" class="qmes-material-add-cancel">취소</button><button type="submit" class="qmes-material-add-save">자재등록</button></footer>
        </form>
      </section>`;
    document.body.appendChild(backdrop);

    const form=backdrop.querySelector("form");
    const typeSelect=form.elements.type;
    const codeInput=form.elements.code;
    const unitInput=form.elements.unit;
    const message=backdrop.querySelector(".qmes-material-add-message");
    const saveButton=backdrop.querySelector(".qmes-material-add-save");
    const close=()=>closeModal();
    backdrop.querySelector(".qmes-material-add-close").addEventListener("click",close);
    backdrop.querySelector(".qmes-material-add-cancel").addEventListener("click",close);
    backdrop.addEventListener("mousedown",event=>{if(event.target===backdrop)close();});
    typeSelect.addEventListener("change",()=>{
      const prefix=typeSelect.value==="PACK"?"PM-":"RM-";
      if(!codeInput.value||/^(RM|PM)-?$/i.test(codeInput.value))codeInput.value=prefix;
      if(!unitInput.value||["KG","EA"].includes(upper(unitInput.value)))unitInput.value=typeSelect.value==="PACK"?"EA":"kg";
    });
    codeInput.addEventListener("blur",()=>{codeInput.value=normalizeMaster({type:typeSelect.value,code:codeInput.value}).code;});

    form.addEventListener("submit",async event=>{
      event.preventDefault();
      message.textContent="";
      const data=normalizeMaster(Object.fromEntries(new FormData(form).entries()));
      if(!data.code||!data.name||!data.unit){message.textContent="자재코드·품명·단위를 입력하세요.";return;}
      if(data.code.length<4){message.textContent="자재코드를 확인하세요.";return;}
      if(typeof global.qmesSyncUpsert!=="function"){message.textContent="공용 DB 저장 기능을 사용할 수 없습니다.";return;}
      saveButton.disabled=true;saveButton.textContent="등록 중…";
      try{
        if(await duplicateCode(data.code))throw new Error("이미 등록된 자재코드입니다.");
        const savedAt=new Date().toISOString();
        await global.qmesSyncUpsert("inventory",`v2:master:${data.code}`,{...data,savedAt,savedBy:currentUser()});
        global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"inventory-v2-master",code:data.code}}));
        closeModal();
        selectNewMaterial(data.type,data.code);
        alert(`${data.code} · ${data.name} 자재가 등록되었습니다.`);
      }catch(saveError){message.textContent=text(saveError?.message||saveError);saveButton.disabled=false;saveButton.textContent="자재등록";}
    });
    setTimeout(()=>codeInput.focus(),0);
  }

  function installButton(){
    const modal=receiptModal();
    if(!modal)return;
    const field=fieldByLabel(modal,"자재코드 / 품명");
    const label=field?.querySelector(":scope > span");
    if(!label||label.querySelector(".qmes-inv2-material-add-btn"))return;
    label.classList.add("qmes-inv2-label-with-action");
    const button=document.createElement("button");
    button.type="button";button.className="qmes-inv2-material-add-btn";button.textContent="+ 자재 추가";
    button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();openModal();});
    label.appendChild(button);
  }

  const style=document.createElement("style");
  style.id="qmes-inventory-material-master-add-style";
  style.textContent=`
    .qmes-inv2-label-with-action{display:flex!important;align-items:center!important;gap:7px!important}
    .qmes-inv2-material-add-btn{margin-left:auto!important;padding:3px 8px!important;border:1px solid #3b82f6!important;border-radius:6px!important;background:rgba(37,99,235,.13)!important;color:#7dd3fc!important;font:800 11px Pretendard,sans-serif!important;line-height:18px!important;cursor:pointer!important}
    .qmes-inv2-material-add-btn:hover{background:#2563eb!important;color:#fff!important}
    .qmes-material-add-backdrop{position:fixed;inset:0;z-index:23000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,23,.82);backdrop-filter:blur(3px)}
    .qmes-material-add-modal{width:min(720px,calc(100vw - 24px));max-height:calc(100vh - 30px);overflow:auto;border:1px solid #36536f;border-radius:13px;background:#0b2034;color:#dbe8f3;box-shadow:0 24px 70px rgba(0,0,0,.5);font-family:Pretendard,'Noto Sans KR',sans-serif}
    .qmes-material-add-modal>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #29445e}.qmes-material-add-modal h3{margin:0;font-size:19px}.qmes-material-add-modal p{margin:5px 0 0;color:#91a7bb;font-size:12px}.qmes-material-add-close{border:0;background:transparent;color:#b8cadb;font-size:25px;cursor:pointer}
    .qmes-material-add-form{display:grid;grid-template-columns:1fr 1fr;gap:13px;padding:18px 20px}.qmes-material-add-form label{display:grid;gap:6px;color:#9fb4c8;font-size:12px;font-weight:800}.qmes-material-add-form label.is-wide{grid-column:1/-1}.qmes-material-add-form b{color:#f87171}
    .qmes-material-add-form input,.qmes-material-add-form select,.qmes-material-add-form textarea{width:100%;box-sizing:border-box;border:1px solid #334b65;border-radius:7px;background:#12263c;color:#e2e8f0;padding:0 10px;font:700 12px Pretendard,sans-serif;outline:none}.qmes-material-add-form input,.qmes-material-add-form select{height:39px}.qmes-material-add-form textarea{padding-top:9px;resize:vertical}.qmes-material-add-form input:focus,.qmes-material-add-form select:focus,.qmes-material-add-form textarea:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.12)}
    .qmes-material-add-message{grid-column:1/-1;min-height:18px;color:#fca5a5;font-size:12px;font-weight:800}.qmes-material-add-form footer{grid-column:1/-1;display:flex;justify-content:flex-end;gap:9px;padding-top:3px}.qmes-material-add-form footer button{min-width:92px;height:38px;border-radius:7px;font-weight:800;cursor:pointer}.qmes-material-add-cancel{border:1px solid #465d74;background:#13283d;color:#cbd8e6}.qmes-material-add-save{border:1px solid #2563eb;background:#2563eb;color:#fff}.qmes-material-add-save:disabled{opacity:.6;cursor:wait}
    @media(max-width:620px){.qmes-material-add-form{grid-template-columns:1fr}.qmes-material-add-form label.is-wide{grid-column:auto}.qmes-material-add-message,.qmes-material-add-form footer{grid-column:auto}}
  `;
  document.head.appendChild(style);

  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeModal();});
  new MutationObserver(installButton).observe(document.documentElement,{childList:true,subtree:true});
  global.qmesOpenInventoryMaterialAdd=openModal;
  global.qmesNormalizeInventoryMaterialMaster=normalizeMaster;
  installButton();
  console.info("[QMES] 재고관리 자재 추가 기능 활성화");
})(window);
