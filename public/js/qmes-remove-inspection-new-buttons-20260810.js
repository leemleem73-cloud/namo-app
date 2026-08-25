/* QMES inspection compatibility + standalone edit screen.
   The edit screen is intentionally independent from the legacy React modal. */
(function installInspectionEditScreen(){
  'use strict';
  if(window.__QMES_INSPECTION_EDIT_SCREEN_READY__) return;
  window.__QMES_INSPECTION_EDIT_SCREEN_READY__=true;

  const style=document.createElement('style');
  style.id='qmes-inspection-edit-screen-style';
  style.textContent=`
    body:has(.qmes-preview-dashboard),#root:has(.qmes-preview-dashboard),main:has(.qmes-preview-dashboard){background:#f5f7fb!important}.qmes-preview-dashboard{background:#f5f7fb!important}
    .qmes-iqc-page .qmes-iqc-new-btn{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
    .qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]),.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]){display:none!important;visibility:hidden!important}
    #qmes-standalone-edit{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
    #qmes-standalone-edit .qmes-edit-card{width:min(920px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.28);color:#172033}
    #qmes-standalone-edit .qmes-edit-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e5e7eb}#qmes-standalone-edit .qmes-edit-head strong{font-size:18px}#qmes-standalone-edit .qmes-edit-close{border:0;background:transparent;font-size:25px;cursor:pointer;color:#64748b}
    #qmes-standalone-edit .qmes-edit-body{padding:20px 22px}#qmes-standalone-edit .qmes-edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}#qmes-standalone-edit label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#475569}#qmes-standalone-edit input,#qmes-standalone-edit select,#qmes-standalone-edit textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#172033;padding:9px 10px;font-size:13px}#qmes-standalone-edit textarea{min-height:80px;resize:vertical}#qmes-standalone-edit .wide{grid-column:1/-1}#qmes-standalone-edit .qmes-edit-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid #e5e7eb}#qmes-standalone-edit button{min-height:36px;border-radius:7px;padding:0 15px;font-weight:700;cursor:pointer}#qmes-standalone-edit .cancel{border:1px solid #cbd5e1;background:#fff;color:#475569}#qmes-standalone-edit .save{border:1px solid #2563eb;background:#2563eb;color:#fff}@media(max-width:720px){#qmes-standalone-edit .qmes-edit-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const clean=v=>String(v==null?'':v).trim();
  function pageType(button){const page=button.closest('.qmes-iqc-page,.qmes-pqc-page,.qmes-oqc-page');if(!page)return null;if(page.classList.contains('qmes-iqc-page'))return'IQC';if(page.classList.contains('qmes-pqc-page'))return'PQC';return'OQC';}
  function rowFromButton(button){const tr=button.closest('tr');if(!tr)return null;const cells=Array.from(tr.querySelectorAll('td')).map(td=>clean(td.textContent));return{tr,cells};}
  function findRecord(type,cells){
    try{
      if(type==='IQC'){const no=cells[0];return (window.DB&&DB.iqc||[]).find(r=>clean(r.inNo)===no)||null;}
      const store=type==='PQC'?'PQC':'OQC',no=cells[0];const rows=window.DB&&DB.insp&&DB.insp[store]||[];return rows.find(r=>clean(r.groupId||r.id).replace(/-\d+$/,'')===no.replace(/-\d+$/,''))||null;
    }catch(e){return null;}
  }
  function field(label,name,value,type='text',wide=false){return `<label class="${wide?'wide':''}">${label}<input type="${type}" name="${name}" value="${String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}"></label>`;}
  function openEditor(type,record,cells){
    document.getElementById('qmes-standalone-edit')?.remove();
    const data=record||{};const isIqc=type==='IQC';
    const wrap=document.createElement('div');wrap.id='qmes-standalone-edit';
    const title=type==='IQC'?'수입검사 수정':type==='PQC'?'공정검사 수정':'출하검사 수정';
    let fields='';
    if(isIqc){
      fields+=field('입고번호','key',data.inNo||cells[0]);fields+=field('입고일자','recv',String(data.recv||cells[1]||'').slice(0,10),'date');fields+=field('검사일자','inspectedAt',String(data.inspectedAt||data.recv||'').slice(0,10),'date');fields+=field('LOT No.','lot',data.lot||cells[2]);fields+=field('원재료명','name',data.name||cells[3]);fields+=field('업체명','supplier',data.supplier||'');fields+=field('입고수량','qty',data.qty||'');fields+=field('검사수량','inspectQty',data.inspectQty||'');fields+=field('불량수량','defectQty',data.defectQty||'0');fields+=field('검사자','inspector',data.inspector||data.by||cells[6]||'');fields+=field('특이사항','remarks',data.remarks||data.note||'', 'text',true);
    }else{
      fields+=field(type==='PQC'?'공정번호':'출하번호','key',data.groupId||String(data.id||cells[0]).replace(/-\d+$/,''));fields+=field('검사일자','date',String(data.date||cells[1]||'').slice(0,10),'date');fields+=field('LOT No.','lot',data.lot||cells[2]);fields+=field('제품명','product',data.product||cells[3]);fields+=field('검사자','inspector',data.inspector||cells[6]||'');if(type==='OQC'){fields+=field('출하일자','shipDate',String(data.shipDate||cells[7]||'').slice(0,10),'date');fields+=field('고객사','customer',data.customer||'');fields+=field('출하수량','shipQty',data.shipQty||'');fields+=field('납품처','destination',data.destination||'');}fields+=field('특이사항','remarks',data.remarks||'', 'text',true);
    }
    wrap.innerHTML=`<div class="qmes-edit-card" role="dialog" aria-modal="true"><div class="qmes-edit-head"><strong>${title}</strong><button type="button" class="qmes-edit-close">×</button></div><form class="qmes-edit-body"><div class="qmes-edit-grid">${fields}</div><div class="qmes-edit-actions"><button type="button" class="cancel">취소</button><button type="submit" class="save">수정완료</button></div></form></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove();wrap.querySelector('.qmes-edit-close').onclick=close;wrap.querySelector('.cancel').onclick=close;wrap.addEventListener('mousedown',e=>{if(e.target===wrap)close();});
    wrap.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.currentTarget).entries());try{
      if(type==='IQC'){const list=DB.iqc||[];const idx=list.findIndex(r=>clean(r.inNo)===clean(data.inNo||cells[0]));if(idx<0)throw new Error('수정할 수입검사 기록을 찾지 못했습니다.');list[idx]={...list[idx],recv:fd.recv,inspectedAt:fd.inspectedAt,lot:fd.lot,name:fd.name,supplier:fd.supplier,qty:fd.qty,inspectQty:fd.inspectQty,defectQty:fd.defectQty,inspector:fd.inspector,by:fd.inspector,remarks:fd.remarks,note:fd.remarks};DB.iqc=list;
      }else{const store=type==='PQC'?'PQC':'OQC';const list=DB.insp[store]||[];const key=clean(data.groupId||data.id||cells[0]).replace(/-\d+$/,'');let count=0;DB.insp[store]=list.map(r=>{const rk=clean(r.groupId||r.id).replace(/-\d+$/,'');if(rk!==key)return r;count++;return{...r,date:fd.date,lot:fd.lot,product:fd.product,inspector:fd.inspector,remarks:fd.remarks,...(type==='OQC'?{shipDate:fd.shipDate,customer:fd.customer,shipQty:fd.shipQty,destination:fd.destination}:{})};});if(!count)throw new Error('수정할 검사 기록을 찾지 못했습니다.');}
      if(typeof window.dbSave==='function')window.dbSave();close();window.location.reload();
    }catch(err){window.alert(err.message||'수정 저장 중 오류가 발생했습니다.');}});
  }
  document.addEventListener('click',function(event){const button=event.target?.closest?.('button.qmes-iqc-action-edit');if(!button||!button.closest('.qmes-iqc-page,.qmes-pqc-page,.qmes-oqc-page'))return;event.preventDefault();event.stopImmediatePropagation();const type=pageType(button),row=rowFromButton(button);if(!type||!row)return;openEditor(type,findRecord(type,row.cells),row.cells);},true);
})(window);
