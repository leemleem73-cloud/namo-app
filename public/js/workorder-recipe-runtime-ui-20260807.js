/* QMES Stage 13 - conflict-safe work-order recipe runtime UI
 * Purpose: finish recipe -> work-order UI connection WITHOUT editing production.jsx.
 * This module only enhances the rendered work-order form and drives existing React inputs.
 */
(function installWorkOrderRecipeRuntimeUi(global){
  "use strict";

  const PATCH_ID="qmes-stage13-recipe-runtime";
  const text=(v)=>String(v??"").trim();
  const num=(v)=>{const n=Number(text(v).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));

  function nativeSet(el,value,eventName){
    if(!el)return;
    const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
    if(setter)setter.call(el,String(value)); else el.value=String(value);
    el.dispatchEvent(new Event(eventName||"input",{bubbles:true}));
    el.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function findField(shell,labelText){
    return Array.from(shell.querySelectorAll(".qmes-wo-form-field")).find((field)=>
      Array.from(field.querySelectorAll("span")).some((s)=>text(s.textContent)===labelText)
    )||null;
  }

  function productSelect(shell){
    return findField(shell,"공정 / 품목 (Grd.)")?.querySelector("select")||null;
  }

  function materialTable(shell){
    return shell.querySelector("table.qmes-wo-material-compact")||null;
  }

  function materialRows(shell){
    const table=materialTable(shell);
    if(!table)return [];
    return Array.from(table.querySelectorAll("tbody tr")).filter((row)=>row.querySelector("select")&&row.querySelector("input.qmes-qty-input"));
  }

  function addRowButton(shell){
    return Array.from(shell.querySelectorAll("button")).find((b)=>text(b.textContent).includes("행 추가"))||null;
  }

  async function ensureRowCount(shell,count){
    let rows=materialRows(shell);
    const add=addRowButton(shell);
    while(rows.length<count&&add){
      add.click();
      await wait(40);
      rows=materialRows(shell);
    }
    return rows;
  }

  function availableOption(select,name,code){
    const target=text(name).toUpperCase();
    const codeTarget=text(code).toUpperCase();
    return Array.from(select?.options||[]).find((opt)=>{
      const value=text(opt.value).toUpperCase();
      const label=text(opt.textContent).toUpperCase();
      return value===target||label===target||(codeTarget&&(value===codeTarget||label.includes(codeTarget)));
    })||null;
  }

  async function applyRecipe(shell,qty,statusEl){
    const api=global.qmesWorkOrderRecipeUi;
    const product=productSelect(shell)?.value;
    if(!api||typeof api.toPlanItems!=="function"){
      statusEl.textContent="레시피 UI 모듈이 아직 준비되지 않았습니다.";
      statusEl.dataset.tone="error";
      return false;
    }
    if(!product){
      statusEl.textContent="제품을 먼저 선택하세요.";
      statusEl.dataset.tone="warn";
      return false;
    }
    if(!(qty>0)){
      statusEl.textContent="목표 생산량을 입력하세요.";
      statusEl.dataset.tone="warn";
      return false;
    }

    const result=api.toPlanItems(product,qty,[]);
    if(!result?.ok){
      statusEl.textContent=result?.reason||"활성 레시피가 없습니다. 기존 BOM을 유지합니다.";
      statusEl.dataset.tone="warn";
      return false;
    }

    let rows=await ensureRowCount(shell,result.items.length);
    const missing=[];
    for(let i=0;i<result.items.length;i+=1){
      rows=materialRows(shell);
      const row=rows[i];
      const item=result.items[i];
      if(!row)break;
      const materialSelect=row.querySelector("select");
      const option=availableOption(materialSelect,item.name,item.code);
      if(!option){missing.push(item.name);continue;}
      if(materialSelect.value!==option.value){
        nativeSet(materialSelect,option.value,"change");
        await wait(25);
      }
      const refreshed=materialRows(shell)[i]||row;
      const planInput=refreshed.querySelector("input.qmes-qty-input");
      nativeSet(planInput,Number(item.plan??item.std??0).toFixed(3),"input");
      await wait(15);
    }

    /* Extra legacy rows are kept for safety, but their plan quantity is cleared.
       This avoids deleting a row that may already contain LOT/actual data on another PC. */
    rows=materialRows(shell);
    for(let i=result.items.length;i<rows.length;i+=1){
      const row=rows[i];
      const hasLot=text(row.querySelector('input[placeholder="원재료 LOT"]')?.value);
      const qtyInputs=row.querySelectorAll("input.qmes-qty-input");
      const hasActual=text(qtyInputs[1]?.value);
      if(!hasLot&&!hasActual&&qtyInputs[0])nativeSet(qtyInputs[0],"","input");
    }

    if(missing.length){
      statusEl.textContent=`레시피 ${result.recipeVersion} 일부 적용 · 선택목록 없음: ${missing.join(", ")}`;
      statusEl.dataset.tone="warn";
    }else{
      statusEl.textContent=`레시피 ${result.recipeVersion} 적용 완료 · ${result.items.length}개 원료 · ${qty.toFixed(3)} kg 기준`;
      statusEl.dataset.tone="ok";
    }
    global.dispatchEvent(new CustomEvent("qmes:workorder-recipe-ui-applied",{detail:{product,qty,recipeId:result.recipeId,recipeVersion:result.recipeVersion,missing}}));
    return missing.length===0;
  }

  function plannedTotal(shell){
    return materialRows(shell).reduce((sum,row)=>sum+num(row.querySelector("input.qmes-qty-input")?.value),0);
  }

  function enhance(shell){
    if(!shell||shell.querySelector(`#${PATCH_ID}`))return;
    const tableWrap=materialTable(shell)?.closest(".mt-4");
    if(!tableWrap)return;

    const box=document.createElement("div");
    box.id=PATCH_ID;
    box.className="mb-3 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-3";
    box.innerHTML=`
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
        <div style="min-width:180px;flex:0 0 210px">
          <div style="font-size:10px;color:#64748b;margin-bottom:5px">레시피 기준 목표 생산량 (kg)</div>
          <input data-qmes-recipe-qty inputmode="decimal" placeholder="예: 1000" style="width:100%;height:34px;border:1px solid #334155;border-radius:6px;background:#1e293b;color:#e2e8f0;padding:0 9px;box-sizing:border-box" />
        </div>
        <button type="button" data-qmes-recipe-apply style="height:34px;border:1px solid rgba(56,189,248,.45);border-radius:6px;background:rgba(14,165,233,.12);color:#7dd3fc;padding:0 13px;font-size:12px;font-weight:700;cursor:pointer">레시피 자동적용</button>
        <div data-qmes-recipe-status data-tone="idle" style="font-size:11px;color:#94a3b8;padding-bottom:7px">제품 선택 후 목표 생산량을 입력하면 원료 계획량을 자동 계산합니다.</div>
      </div>`;
    tableWrap.insertBefore(box,tableWrap.firstChild);

    const qtyInput=box.querySelector("[data-qmes-recipe-qty]");
    const applyButton=box.querySelector("[data-qmes-recipe-apply]");
    const statusEl=box.querySelector("[data-qmes-recipe-status]");
    const current=plannedTotal(shell);
    if(current>0)qtyInput.value=current.toFixed(3);

    const paint=()=>{
      statusEl.style.color=statusEl.dataset.tone==="ok"?"#86efac":statusEl.dataset.tone==="error"?"#fca5a5":statusEl.dataset.tone==="warn"?"#fde68a":"#94a3b8";
    };
    const run=async()=>{
      applyButton.disabled=true;
      statusEl.textContent="레시피 계산 중...";
      statusEl.dataset.tone="idle";
      paint();
      try{await applyRecipe(shell,num(qtyInput.value),statusEl);}catch(error){statusEl.textContent=`레시피 적용 실패: ${error.message}`;statusEl.dataset.tone="error";}
      finally{applyButton.disabled=false;paint();}
    };
    applyButton.addEventListener("click",run);
    qtyInput.addEventListener("keydown",(event)=>{if(event.key==="Enter"){event.preventDefault();run();}});

    const prod=productSelect(shell);
    if(prod){
      prod.addEventListener("change",()=>{
        const api=global.qmesWorkOrderRecipeUi;
        const target=num(qtyInput.value)||plannedTotal(shell);
        const state=api?.status?api.status(prod.value,target):null;
        statusEl.textContent=state?.label||"제품이 변경되었습니다. 목표 생산량 입력 후 레시피를 적용하세요.";
        statusEl.dataset.tone=state?.tone==="ok"?"ok":"warn";
        paint();
      });
    }
  }

  function scan(){document.querySelectorAll(".qmes-wo-issue-shell").forEach(enhance);}
  const observer=new MutationObserver(scan);
  const start=()=>{scan();observer.observe(document.documentElement,{childList:true,subtree:true});console.info("[QMES] Stage 13 작업지시 레시피 런타임 연결 활성화");};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window);
