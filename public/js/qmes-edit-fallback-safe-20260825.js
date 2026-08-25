/* QMES safe edit fallback.
   Native React click runs first. This opens only when no visible edit dialog appears. */
(function(global){
  'use strict';
  if(global.__QMES_SAFE_EDIT_FALLBACK_20260825__) return;
  global.__QMES_SAFE_EDIT_FALLBACK_20260825__=true;

  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

  const style=document.createElement('style');
  style.id='qmes-safe-edit-fallback-style';
  style.textContent=`
    #qmes-safe-edit-fallback{position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(15,23,42,.68);box-sizing:border-box}
    #qmes-safe-edit-fallback .qsef-card{width:min(900px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.35);color:#0f172a}
    #qmes-safe-edit-fallback .qsef-head{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;border-bottom:1px solid #e2e8f0}
    #qmes-safe-edit-fallback .qsef-head strong{font-size:18px;font-weight:900}
    #qmes-safe-edit-fallback .qsef-x{border:0;background:transparent;font-size:25px;color:#64748b;cursor:pointer}
    #qmes-safe-edit-fallback form{padding:18px 20px}
    #qmes-safe-edit-fallback .qsef-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
    #qmes-safe-edit-fallback label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800;color:#475569}
    #qmes-safe-edit-fallback input,#qmes-safe-edit-fallback select,#qmes-safe-edit-fallback textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;padding:9px 10px;font-size:13px}
    #qmes-safe-edit-fallback textarea{min-height:82px;resize:vertical}
    #qmes-safe-edit-fallback .wide{grid-column:1/-1}
    #qmes-safe-edit-fallback .qsef-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:15px;border-top:1px solid #e2e8f0}
    #qmes-safe-edit-fallback .qsef-actions button{height:38px;padding:0 16px;border-radius:8px;font-weight:900;cursor:pointer}
    #qmes-safe-edit-fallback .cancel{border:1px solid #cbd5e1;background:#fff;color:#475569}
    #qmes-safe-edit-fallback .save{border:0;background:#2563eb;color:#fff}
    @media(max-width:720px){#qmes-safe-edit-fallback .qsef-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function visibleDialogExists(){
    const nodes=document.querySelectorAll('[role="dialog"],.qmes-modal-backdrop,.qmes-iqc-modal-backdrop,.qmes-inspection-modal-backdrop,#qmes-partner-register-hard-modal');
    return Array.from(nodes).some(node=>{
      if(node.id==='qmes-safe-edit-fallback') return false;
      const css=getComputedStyle(node);
      if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0) return false;
      const rect=node.getBoundingClientRect();
      return rect.width>1&&rect.height>1;
    });
  }

  function field(label,name,value,type='text',wide=false,readonly=false){
    return `<label class="${wide?'wide':''}">${label}<input ${readonly?'readonly ':''}type="${type}" name="${name}" value="${esc(value)}"></label>`;
  }
  function area(label,name,value){return `<label class="wide">${label}<textarea name="${name}">${esc(value)}</textarea></label>`;}

  function close(){document.getElementById('qmes-safe-edit-fallback')?.remove();}
  function mount(title,fields,onSave){
    close();
    const overlay=document.createElement('div');
    overlay.id='qmes-safe-edit-fallback';
    overlay.innerHTML=`<div class="qsef-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="qsef-head"><strong>${esc(title)}</strong><button type="button" class="qsef-x">×</button></div><form><div class="qsef-grid">${fields}</div><div class="qsef-actions"><button type="button" class="cancel">취소</button><button type="submit" class="save">수정완료</button></div></form></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.qsef-x').onclick=close;
    overlay.querySelector('.cancel').onclick=close;
    overlay.addEventListener('mousedown',event=>{if(event.target===overlay)close();});
    overlay.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();
      try{
        const values=Object.fromEntries(new FormData(event.currentTarget).entries());
        onSave(values);
        if(typeof global.dbSave==='function') global.dbSave();
        close();
        global.dispatchEvent(new CustomEvent('qmes:data-updated'));
        setTimeout(()=>global.location.reload(),80);
      }catch(error){global.alert(error?.message||'수정 저장 중 오류가 발생했습니다.');}
    });
  }

  function rowCells(button){return Array.from(button.closest('tr')?.querySelectorAll('td')||[]).map(td=>clean(td.textContent));}
  function baseInspectionKey(row){return clean(row?.groupId||row?.id).replace(/-\d+$/,'');}

  function openIqc(button){
    const cells=rowCells(button),key=cells[0];
    const list=global.DB?.iqc||[];
    const record=list.find(row=>clean(row.inNo)===key);
    if(!record) return false;
    mount('수입검사 수정',[
      field('입고번호','inNo',record.inNo,'text',false,true),field('입고일자','recv',String(record.recv||'').slice(0,10),'date'),field('검사일자','inspectedAt',String(record.inspectedAt||record.recv||'').slice(0,10),'date'),
      field('LOT No.','lot',record.lot),field('원재료명','name',record.name),field('업체명','supplier',record.supplier==='-'?'':record.supplier),
      field('입고수량','qty',record.qty),field('검사수량','inspectQty',record.inspectQty),field('불량수량','defectQty',record.defectQty),field('검사자','inspector',record.inspector||record.by||''),area('특이사항','remarks',record.remarks||record.note||'')
    ].join(''),values=>{
      const index=list.findIndex(row=>clean(row.inNo)===key);if(index<0)throw new Error('수입검사 기록을 찾지 못했습니다.');
      list[index]={...list[index],recv:values.recv,inspectedAt:values.inspectedAt,lot:values.lot,name:values.name,supplier:values.supplier||'-',qty:values.qty,inspectQty:values.inspectQty,defectQty:values.defectQty,inspector:values.inspector,by:values.inspector,remarks:values.remarks,note:values.remarks};
      global.DB.iqc=list;
    });
    return true;
  }

  function openInspection(button,mode){
    const cells=rowCells(button),key=clean(cells[0]).replace(/-\d+$/,'');
    const list=global.DB?.insp?.[mode]||[];
    const group=list.filter(row=>baseInspectionKey(row)===key);
    if(!group.length) return false;
    const first=group[0];
    const oqc=mode==='OQC';
    let fields=[field(oqc?'출하번호':'공정번호','key',key,'text',false,true),field('검사일자','date',String(first.date||'').slice(0,10),'date'),field('LOT No.','lot',first.lot),field('제품명','product',first.product),field('검사자','inspector',first.inspector||'')];
    if(oqc) fields.push(field('출하일자','shipDate',String(first.shipDate||'').slice(0,10),'date'),field('고객사','customer',first.customer||''),field('출하수량','shipQty',first.shipQty||''),field('납품처','destination',first.destination||''));
    fields.push(area('특이사항','remarks',first.remarks||''));
    mount(oqc?'출하검사 수정':'공정검사 수정',fields.join(''),values=>{
      global.DB.insp[mode]=list.map(row=>baseInspectionKey(row)!==key?row:{...row,date:values.date,lot:values.lot,product:values.product,inspector:values.inspector,remarks:values.remarks,...(oqc?{shipDate:values.shipDate,customer:values.customer,shipQty:values.shipQty,destination:values.destination}:{})});
    });
    return true;
  }

  function openCoa(button){
    const cells=rowCells(button),lot=clean(cells[2]);
    const current=global.DB?.coa?.[lot];if(!current) return false;
    mount('출하성적서 수정',[field('LOT No.','lot',lot,'text',false,true),field('고객사','customer',current.customer||''),field('출하량 (kg)','qty',current.qty||''),field('발행일 / 출하일','ship',String(current.ship||'').slice(0,10),'date'),field('출하번호','shipNo',current.shipNo||'')].join(''),values=>{
      global.DB.coa[lot]={...current,customer:values.customer,qty:values.qty,ship:values.ship,shipNo:values.shipNo};
    });
    return true;
  }

  function openNcr(button){
    const cells=rowCells(button),no=clean(cells[0]);
    const list=global.DB?.ncrs||[];const record=list.find(row=>clean(row.no)===no);if(!record)return false;
    mount('부적합 수정',[field('번호','no',no,'text',false,true),field('발생구분','sourceType',record.sourceType||''),field('관련 LOT','lot',record.lot||record.sourceLot||''),field('담당자','owner',record.owner||''),field('격리위치','rack',record.rack||''),field('완료예정일','dueDate',record.dueDate||'','date'),area('발생 내용','item',record.item||record.issue||''),area('임시조치','temporaryAction',record.temporaryAction||record.action||''),area('근본원인','rootCause',record.rootCause||''),area('시정조치','correctiveAction',record.correctiveAction||'')].join(''),values=>{
      const index=list.findIndex(row=>clean(row.no)===no);if(index<0)throw new Error('부적합 기록을 찾지 못했습니다.');
      list[index]={...list[index],sourceType:values.sourceType,lot:values.lot,sourceLot:values.lot,owner:values.owner,rack:values.rack,dueDate:values.dueDate,item:values.item,issue:values.item,temporaryAction:values.temporaryAction,action:values.temporaryAction,rootCause:values.rootCause,correctiveAction:values.correctiveAction};
      global.DB.ncrs=list;
    });
    return true;
  }

  function tryFallback(button){
    if(visibleDialogExists()) return;
    if(button.closest('.qmes-iqc-page')) return openIqc(button);
    if(button.closest('.qmes-pqc-page')) return openInspection(button,'PQC');
    if(button.closest('.qmes-oqc-page')) return openInspection(button,'OQC');
    if(button.closest('.qmes-coa-issued-table')) return openCoa(button);
    const row=button.closest('tr');
    if(row&&global.DB?.ncrs?.some?.(record=>clean(record.no)===clean(row.querySelector('td')?.textContent))) return openNcr(button);
  }

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('button');
    if(!button) return;
    const label=clean(button.textContent);
    const isEdit=label==='수정'||label.endsWith(' 수정')||button.classList.contains('qmes-iqc-action-edit')||button.classList.contains('qmes-coa-edit-btn');
    if(!isEdit) return;
    setTimeout(()=>tryFallback(button),80);
  },false);
})(window);
