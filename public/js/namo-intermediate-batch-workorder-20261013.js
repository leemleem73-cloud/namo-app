/* NAMO QMES: isolated intermediate batch / work-order connection (2026-10-13).
 * Preserves the existing seven-character lot number and all existing work-order data.
 * This does not alter warehouse inventory tables or mark incomplete links as verified.
 */
(function(){
  "use strict";
  if(window.__NAMO_MID_WORK_20261013__)return;
  window.__NAMO_MID_WORK_20261013__=true;
  const TYPES=["SBR","PVDF","SBS"];
  const API="/api/qmes/work-orders";
  const str=v=>String(v==null?"":v).trim();
  const up=v=>str(v).toUpperCase();
  // MB is the display prefix for intermediate material LOTs; legacy MB- values remain supported.
  const batchKey=v=>up(v).replace(/^MB-?/,"");
  const batchLabel=v=>batchKey(v)?"MB"+batchKey(v):"MB";
  const esc=v=>str(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:0;};
  const lot=r=>up(r?.fields?.["생산 LOT NO"]);
  const status=r=>str(r?.fields?.["진행상태"]);
  const mid=r=>str(r?.productionType)==="중간배치";
  const qty=r=>num(r?.intermediateBatch?.actualQty);
  let docs=[],loading=null,listSerial=0;
  function getDocs(){
    if(loading)return loading;
    loading=(async()=>{
      const res=await fetch(API,{credentials:"same-origin",cache:"no-store"});
      const data=await res.json();
      if(!res.ok||!data.success||!Array.isArray(data.data))throw Error(data.message||"작업지시서 DB 조회 실패");
      docs=data.data;
      return docs;
    })().finally(()=>{loading=null});
    return loading;
  }
  function consumed(d,midLot,excludeId){
    return d.filter(r=>!mid(r)&&status(r)==="완료"&&str(r.id)!==str(excludeId))
      .flatMap(r=>Array.isArray(r.materials)?r.materials:[])
      .filter(m=>str(m.name)==="중간배치"&&batchKey(m.lot)===batchKey(midLot))
      .reduce((sum,m)=>sum+num(m.actual),0);
  }
  function ready(d){
    return d.filter(r=>mid(r)&&status(r)==="완료"&&qty(r)>0&&lot(r));
  }
  function rows(form){return [...form.querySelectorAll("#workMaterialTable tbody tr")];}
  function refreshRow(tr){
    const choice=tr.querySelector(".material-name-select");
    const lotInput=tr.querySelector(".material-lot-manual");
    const type=tr.querySelector(".namo-mid-kind");
    const hint=tr.querySelector(".namo-mid-hint");
    const values=tr.querySelector(".namo-mid-list");
    if(!choice||!lotInput||!type||!hint||!values)return;
    const show=choice.value==="중간배치";
    type.style.display=show?"block":"none";
    hint.style.display=show?"block":"none";
    if(!show){lotInput.removeAttribute("list");return;}
    if(!str(lotInput.value)||up(lotInput.value)==="MB-")lotInput.value="MB";
    lotInput.setAttribute("list",values.id);
    values.replaceChildren();
    const kind=str(type.value);
    const candidates=ready(docs).filter(r=>r.intermediateBatch?.kind===kind && qty(r)-consumed(docs,lot(r))>0);
    candidates.forEach(r=>{
      const x=document.createElement("option");
      x.value=batchLabel(lot(r));
      x.label=kind+" / 잔량 "+(qty(r)-consumed(docs,lot(r))).toFixed(2)+"kg";
      values.appendChild(x);
    });
    const found=ready(docs).find(r=>lot(r)===batchKey(lotInput.value)&&r.intermediateBatch?.kind===kind);
    hint.textContent=found?
      "사용 가능 수량(완료 이력 기준): "+(qty(found)-consumed(docs,lot(found))).toFixed(2)+"kg":
      candidates.length?"중간배치 LOT 선택 또는 입력 (완료 시 등록 여부 검증)":"선택한 종류의 완료된 중간배치 LOT가 없습니다.";
  }
  function prepRow(tr){
    if(tr.dataset.namoMidRow==="1")return;
    const choice=tr.querySelector(".material-name-select");
    const lotInput=tr.querySelector(".material-lot-manual");
    if(!choice||!lotInput)return;
    tr.dataset.namoMidRow="1";
    const sel=document.createElement("select");
    sel.className="namo-mid-kind";
    sel.setAttribute("aria-label","중간배치 종류");
    sel.style.cssText="display:none;margin-top:5px;width:100%;min-height:30px";
    sel.innerHTML='<option value="">중간배치 종류 선택</option>'+TYPES.map(x=>'<option value="'+x+'">'+x+'</option>').join("");
    const help=document.createElement("small");
    help.className="namo-mid-hint";
    help.style.cssText="display:none;margin-top:5px;font-size:10px;color:#64748b;line-height:1.4;text-align:left";
    const list=document.createElement("datalist");
    list.className="namo-mid-list";list.id="namo-mid-list-"+(++listSerial);
    choice.parentNode.append(sel,help);
    lotInput.parentNode.appendChild(list);
    choice.addEventListener("change",()=>{
      if(choice.value==="중간배치")lotInput.value="MB";
      else if(/^MB-?/i.test(str(lotInput.value)))lotInput.value="";
      refreshRow(tr);
    });
    sel.addEventListener("change",()=>{lotInput.value="MB";refreshRow(tr);});
    lotInput.addEventListener("input",()=>refreshRow(tr));
    lotInput.addEventListener("change",()=>{
      if(choice.value==="중간배치"&&batchKey(lotInput.value)){
        lotInput.value=batchLabel(lotInput.value);
      }
      refreshRow(tr);
    });
    refreshRow(tr);
  }
  function prepForm(form){
    if(form.dataset.namoMidForm==="1"){rows(form).forEach(prepRow);return;}
    const field=[...form.querySelectorAll(".work-basic-grid .form-item")].find(el=>str(el.querySelector("label")?.textContent)==="생산구분");
    const production=field?.querySelector("select");
    const grid=field?.parentNode;
    if(!production||!grid)return;
    form.dataset.namoMidForm="1";
    if(![...production.options].some(x=>x.value==="중간배치")){
      const option=new Option("중간배치","중간배치");production.add(option);
    }
    const kind=document.createElement("div");kind.className="form-item namo-mid-info";
    kind.innerHTML='<label>중간배치 종류</label><select id="namoMidWorkKind"><option value="">선택</option><option>SBR</option><option>PVDF</option><option>SBS</option></select>';
    const produced=document.createElement("div");produced.className="form-item namo-mid-info";
    produced.innerHTML='<label>실제 제조량(kg)</label><input id="namoMidProduced" type="number" min="0" step="0.01" placeholder="제조 완료 시 입력">';
    const info=document.createElement("div");info.className="namo-mid-info";
    info.style.cssText="grid-column:1/-1;padding:9px 11px;background:#f1f7ff;border:1px solid #cfe0f7;color:#315c85;border-radius:5px;font-size:11px";
    info.textContent="기존 나모 LOT 번호를 그대로 사용합니다. 완료된 중간배치만 완제품 작업지시서의 투입 LOT로 선택할 수 있습니다.";
    grid.append(kind,produced,info);
    const toggle=()=>[kind,produced,info].forEach(el=>el.style.display=production.value==="중간배치"?"":"none");
    production.addEventListener("change",toggle);toggle();
    rows(form).forEach(prepRow);
    const editId=str(form.querySelector("#workOrderNo")?.value);
    getDocs().then(data=>{
      if(!form.isConnected)return;
      const current=data.find(x=>x.id===editId);
      if(current&&mid(current)){
        production.value="중간배치";
        kind.querySelector("select").value=TYPES.includes(str(current.intermediateBatch?.kind))?current.intermediateBatch.kind:"";
        produced.querySelector("input").value=current.intermediateBatch?.actualQty||"";
        toggle();
      }
      rows(form).forEach((tr,i)=>{
        prepRow(tr);
        const m=current?.materials?.[i];
        const t=tr.querySelector(".namo-mid-kind");
        if(t&&m&&m.name==="중간배치")t.value=TYPES.includes(str(m.batchType))?m.batchType:"";
        refreshRow(tr);
      });
    }).catch(e=>console.warn("[intermediate-batch] LOT list unavailable",e));
  }
  let queued=false;
  // openModal() renders the live work-order editor in #workspaceBody (not the legacy #modalBody).
  const target=document.getElementById("workspaceBody")||document.getElementById("modalBody");
  if(target){
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{
        queued=false;
        target.querySelectorAll(".work-form").forEach(prepForm);
      });
    });
    observer.observe(target,{childList:true,subtree:true});
    target.querySelectorAll(".work-form").forEach(prepForm);
  }
  window.namoValidateIntermediateWorkorder=async function({editId,rows:items,record}){
    const producer=mid(record);
    const measured=qty(record);
    if(producer&&(!TYPES.includes(str(record?.intermediateBatch?.kind))||status(record)==="완료"&&measured<=0))
      return {ok:false,message:"중간배치 종류를 선택하고 생산 완료 시 실제 제조량을 입력하세요."};
    if(!producer&&!items.some(r=>r.name==="중간배치"&&(batchKey(r.lot)||num(r.plan)||num(r.actual))))return {ok:true};
    let data;
    try{data=await getDocs();}catch(e){return {ok:false,message:"공용 DB에서 중간배치 LOT를 확인하지 못했습니다. 저장하지 않았습니다."};}
    if(producer){
      if(data.some(r=>lot(r)===lot(record)&&str(r.id)!==str(editId)))
        return {ok:false,message:"이미 사용 중인 생산 LOT 번호입니다. 중복 번호를 사용할 수 없습니다."};
      if(status(record)==="완료"&&measured<consumed(data,lot(record),editId))
        return {ok:false,message:"이미 투입된 중간배치 사용량보다 제조량이 적습니다."};
      return {ok:true};
    }
    const selected=items.filter(r=>r.name==="중간배치"&&(batchKey(r.lot)||num(r.plan)||num(r.actual)));
    for(const item of selected){
      if(!batchKey(item.lot))return {ok:false,message:"중간배치 LOT 번호를 입력하세요."};
      if(!TYPES.includes(str(item.batchType)))return {ok:false,message:"SBR / PVDF / SBS 중간배치 종류를 선택하세요."};
      const source=data.find(r=>mid(r)&&lot(r)===batchKey(item.lot)&&r.intermediateBatch?.kind===item.batchType);
      if(status(record)==="완료"){
        if(!source||status(source)!=="완료"||!qty(source))
          return {ok:false,message:"제조 완료가 확인된 중간배치 LOT만 실제 투입 처리할 수 있습니다."};
        if(!num(item.actual))return {ok:false,message:"완제품 생산 완료 시 중간배치 실투입량을 입력하세요."};
        const all=selected.filter(x=>batchKey(x.lot)===batchKey(item.lot)).reduce((sum,x)=>sum+num(x.actual),0);
        if(all>qty(source)-consumed(data,lot(source),editId)+0.0000001)
          return {ok:false,message:"중간배치 "+up(item.lot)+"의 실제 투입량이 사용 가능한 수량을 초과했습니다."};
      }
    }
    return {ok:true};
  };
  async function search(){
    const input=document.getElementById("lotQueryInput");
    const title=document.getElementById("lotResultTitle");
    const meta=document.getElementById("lotResultMeta");
    const body=document.getElementById("lotResultBody");
    const summary=document.getElementById("lotSummary");
    if(!input||!title||!meta||!body||!summary)return;
    const q=up(input.value);if(!batchKey(q)){input.focus();return;}
    title.textContent="중간배치 LOT 조회 중";meta.textContent="공용 작업지시서 조회";
    body.textContent="등록된 중간배치 LOT를 확인하고 있습니다.";summary.replaceChildren();
    try{
      const data=await getDocs();
      if(!document.getElementById("lotIntermediateMode")?.classList.contains("active")||q!==up(input.value))return;
      const matches=data.filter(r=>mid(r)&&lot(r).includes(batchKey(q)));
      title.textContent="중간배치 LOT 추적 결과";
      if(!matches.length){
        meta.textContent="일치하는 중간배치 LOT 없음";
        body.innerHTML='<div class="lot-empty"><b>조회 결과 없음</b><span>중간배치 제조 작업지시서가 등록되었는지 확인하세요.</span></div>';
        return;
      }
      meta.textContent=matches.length+"건 · 실제 작업지시서 기준";
      let linked=0;
      const result=matches.map(r=>{
        const batchLot=lot(r);
        const parents=Array.isArray(r.materials)?r.materials.filter(x=>str(x.name)||str(x.lot)):[];
        const children=data.filter(x=>!mid(x)&&Array.isArray(x.materials)&&x.materials.some(m=>m.name==="중간배치"&&batchKey(m.lot)===batchKey(batchLot)));
        linked+=children.length;
        const raw=parents.map(m=>'<tr><td>'+esc(m.name)+'</td><td>'+esc(m.lot)+'</td><td>'+esc(m.actual||m.plan||"-")+'</td></tr>').join("");
        const fg=children.map(x=>{
          const total=x.materials.filter(m=>m.name==="중간배치"&&batchKey(m.lot)===batchKey(batchLot)).reduce((sum,m)=>sum+num(m.actual),0);
          return '<tr><td>'+esc(x.id)+'</td><td>'+esc(lot(x))+'</td><td>'+esc(status(x))+'</td><td>'+esc(total?total+" kg":"미확정")+'</td></tr>';
        }).join("");
        const actual=qty(r);const taken=consumed(data,batchLot);
        return '<div class="lot-detail-box" style="margin:12px 0"><div class="lot-detail-title">'+esc(r.intermediateBatch?.kind)+" / "+esc(batchLabel(batchLot))+'</div>'+
          '<p style="margin:10px 12px;color:#345;font-size:12px">작업지시: '+esc(r.id)+' · 제조상태: '+esc(status(r)||"미확인")+
          ' · 실제 제조량: '+(actual?actual.toFixed(2)+" kg":"미확정")+
          ' · 완료 투입량: '+taken.toFixed(2)+' kg · 잔량: '+(actual?(actual-taken).toFixed(2)+" kg":"미확정")+'</p>'+
          '<div style="overflow:auto"><table class="lot-detail-table"><thead><tr><th>원재료명</th><th>원재료 LOT</th><th>투입량(kg)</th></tr></thead><tbody>'+(raw||'<tr><td colspan="3">등록된 원료 LOT 없음</td></tr>')+'</tbody></table></div>'+
          '<div style="overflow:auto;margin-top:8px"><table class="lot-detail-table"><thead><tr><th>완제품 작업지시서</th><th>완제품 LOT</th><th>진행상태</th><th>실투입량</th></tr></thead><tbody>'+(fg||'<tr><td colspan="4">연결된 완제품 LOT 없음</td></tr>')+'</tbody></table></div>'+
          '<p style="padding:10px;color:#64748b;font-size:11px">중간배치 잔량은 완료된 작업지시서의 제조량·사용량 기준입니다. 창고 재고 원장과는 별도로 검증해야 합니다.</p></div>';
      }).join("");
      summary.innerHTML='<div class="lot-stat"><div class="k">중간배치 LOT</div><div class="v">'+matches.length+'건</div></div>'+
        '<div class="lot-stat"><div class="k">연결 완제품 지시</div><div class="v">'+linked+'건</div></div>';
      body.innerHTML=result;
    }catch(e){
      title.textContent="중간배치 LOT 조회 실패";
      meta.textContent="공용 DB 연결 실패";
      body.textContent=e.message||"잠시 후 다시 조회해주세요.";
    }
  }
  document.addEventListener("click",e=>{
    const btn=e.target?.closest?.("#lotSearchBtn");
    if(!btn||!document.getElementById("lotIntermediateMode")?.classList.contains("active"))return;
    e.preventDefault();e.stopImmediatePropagation();search();
  },true);
  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter"||e.target?.id!=="lotQueryInput"||!document.getElementById("lotIntermediateMode")?.classList.contains("active"))return;
    e.preventDefault();e.stopImmediatePropagation();search();
  },true);
})();
