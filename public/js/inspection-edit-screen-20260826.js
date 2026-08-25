/* QMES standalone PQC/OQC edit screen — 2026-08-26
 * Independent from the legacy React registration/edit modal.
 */
(function installStandaloneInspectionEdit(global){
  'use strict';
  if (global.__QMES_STANDALONE_INSPECTION_EDIT_20260826__) return;
  global.__QMES_STANDALONE_INSPECTION_EDIT_20260826__ = true;

  const OVERLAY_ID='qmes-inspection-standalone-edit-20260826';
  const PQC_ITEMS=['점도','고형분','입도(Dmax)','외관'];
  const OQC_ITEMS=['외관','입도(Dmax)','점도','고형분','접착력','절연저항','수분','전해액 안정성'];
  let current=null;

  const text=v=>String(v==null?'':v).trim();
  const esc=v=>text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const groupKey=row=>text(row?.groupId)||(text(row?.lot)||text(row?.date||row?.shipDate)?`${text(row?.lot)}|${text(row?.date||row?.shipDate)}`:text(row?.id).replace(/-\d+$/,''));
  const measurements=row=>Array.isArray(row?.measurements)?row.measurements.map(text):text(row?.value).split('/').map(text).filter(Boolean);
  const num=v=>{const m=text(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null;};

  function judgeItem(item,vals){
    const values=vals.map(text).filter(Boolean);
    if(!values.length) return '불합격';
    if(item==='외관') return values.every(v=>v==='이상없음'||v==='정상')?'합격':'불합격';
    if(item==='전해액 안정성') return values.every(v=>v==='미탈리')?'합격':'불합격';
    if(item==='절연저항'&&values.some(v=>v.toLowerCase().includes('overflow'))) return '합격';
    if(typeof global.autoJudge==='function') return values.every(v=>global.autoJudge(item,v)==='합격')?'합격':'불합격';
    return '합격';
  }

  function ensureStyle(){
    if(document.getElementById('qmes-inspection-standalone-edit-style')) return;
    const s=document.createElement('style');s.id='qmes-inspection-standalone-edit-style';s.textContent=`
#${OVERLAY_ID}{position:fixed!important;inset:0!important;z-index:31000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(2,8,20,.8)!important;box-sizing:border-box!important}
#${OVERLAY_ID} .sie-card{width:min(1080px,calc(100vw - 36px));max-height:calc(100vh - 36px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #304b6c;border-radius:14px;background:#0a1728;color:#e8f0f8;font-family:Pretendard,system-ui,sans-serif}
#${OVERLAY_ID} .sie-head,#${OVERLAY_ID} .sie-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:#0d2038;border-bottom:1px solid #263b54}
#${OVERLAY_ID} .sie-foot{border-top:1px solid #263b54;border-bottom:0;background:#0c1b2e}#${OVERLAY_ID} .sie-head span{display:block;font-size:10px;font-weight:900;color:#38bdf8;letter-spacing:.12em}#${OVERLAY_ID} .sie-head strong{font-size:19px}#${OVERLAY_ID} .sie-body{overflow:auto;padding:16px 18px}
#${OVERLAY_ID} .sie-section{padding:13px;border:1px solid #243a55;border-radius:10px;background:rgba(15,32,54,.65)}#${OVERLAY_ID} .sie-section+.sie-section{margin-top:11px}#${OVERLAY_ID} .sie-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}#${OVERLAY_ID} label{display:flex;flex-direction:column;gap:5px;font-size:10px;color:#8ca5c4;font-weight:700}#${OVERLAY_ID} input,#${OVERLAY_ID} textarea{width:100%;box-sizing:border-box;border:1px solid #2b405b;border-radius:7px;background:#102138;color:#edf4fb;outline:none;font:inherit;font-size:13px}#${OVERLAY_ID} input{height:38px;padding:0 9px}#${OVERLAY_ID} textarea{min-height:70px;padding:8px 9px;resize:vertical}#${OVERLAY_ID} input:focus,#${OVERLAY_ID} textarea:focus{border-color:#38bdf8}
#${OVERLAY_ID} .sie-measure-table{width:100%;border-collapse:collapse;font-size:12px}#${OVERLAY_ID} .sie-measure-table th,#${OVERLAY_ID} .sie-measure-table td{padding:7px;border-bottom:1px solid #263b54;text-align:center}#${OVERLAY_ID} .sie-measure-table th:first-child,#${OVERLAY_ID} .sie-measure-table td:first-child{text-align:left;width:18%}#${OVERLAY_ID} .sie-measure-table input{height:34px;text-align:center}#${OVERLAY_ID} button{height:36px;padding:0 15px;border-radius:7px;font-size:12px;font-weight:800}#${OVERLAY_ID} .sie-close,#${OVERLAY_ID} .sie-cancel{border:1px solid #3b526d;background:transparent;color:#cbd5e1}#${OVERLAY_ID} .sie-save{border:1px solid #0284c7;background:#0284c7;color:white}.sie-full{grid-column:1/-1}@media(max-width:760px){#${OVERLAY_ID} .sie-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.appendChild(s);
  }

  function locateFromButton(button,mode){
    const rows=global.DB?.insp?.[mode]; if(!Array.isArray(rows)) return null;
    const tr=button.closest('tr'); if(!tr) return null;
    const cellTexts=Array.from(tr.querySelectorAll('td')).map(td=>text(td.textContent));
    const candidates=rows.filter(r=>cellTexts.some(c=>c&&text(r.lot)===c));
    const rep=candidates.find(r=>cellTexts.some(c=>c&&[text(r.id),text(r.groupId),text(r.date),text(r.shipDate),text(r.inspector)].includes(c)))||candidates[0];
    if(!rep) return null;
    const key=groupKey(rep);
    return {mode,key,rows:rows.filter(r=>groupKey(r)===key),rep};
  }

  function field(label,name,value,type='text',extra=''){return `<label><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;}
  function close(){document.getElementById(OVERLAY_ID)?.remove();current=null;}

  function open(info){
    if(!info||!info.rows.length){alert('수정할 검사 기록을 찾지 못했습니다.');return;}
    ensureStyle(); current=info; document.getElementById(OVERLAY_ID)?.remove();
    const oqc=info.mode==='OQC', rep=info.rep, items=oqc?OQC_ITEMS:PQC_ITEMS;
    const byItem=Object.fromEntries(items.map(item=>[item,info.rows.find(r=>r.check===item)]));
    const measurementRows=items.map(item=>{
      let vals=measurements(byItem[item]);
      const count=oqc?3:(item==='외관'?1:3); while(vals.length<count) vals.push('');
      return `<tr><td><b>${esc(item==='입도(Dmax)'?'입도':item)}</b><div style="font-size:10px;color:#64748b">${esc(global.QC_ITEMS?.[item]?.spec||'')}</div></td>${Array.from({length:count},(_,i)=>`<td><input data-item="${esc(item)}" data-index="${i}" value="${esc(vals[i]||'')}"></td>`).join('')}${count===1?'<td colspan="2"></td>':''}<td class="sie-judge" data-judge-item="'+esc(item)+'">'+esc(byItem[item]?.judge||'')+'</td></tr>`;
    }).join('');
    const o=document.createElement('div');o.id=OVERLAY_ID;o.innerHTML=`<form class="sie-card"><div class="sie-head"><div><span>${oqc?'OUTGOING':'PROCESS'} INSPECTION EDIT</span><strong>${oqc?'출하검사':'공정검사'} 수정</strong></div><button type="button" class="sie-close">×</button></div><div class="sie-body">
      <section class="sie-section"><div class="sie-grid">${field(oqc?'출하번호':'공정번호','groupId',info.key,'text','readonly')}${field('검사일자','date',text(rep.date).slice(0,10),'date')}${field('LOT No.','lot',rep.lot,'text','readonly')}${!oqc?field('제품명','product',rep.product||rep.itemName||''):''}${field('검사자','inspector',rep.inspector||rep.by||'')}${oqc?field('출하일자','shipDate',text(rep.shipDate).slice(0,10),'date'):''}${oqc?field('고객사','customer',rep.customer||global.DB?.lots?.[rep.lot]?.ship?.customer||''):''}${oqc?field('출하수량 (kg)','shipQty',rep.shipQty??global.DB?.lots?.[rep.lot]?.ship?.shipQty??'','number','min="0" step="0.01"'):''}${oqc?field('납품처','destination',rep.destination||global.DB?.lots?.[rep.lot]?.ship?.destination||''):''}</div></section>
      <section class="sie-section"><table class="sie-measure-table"><thead><tr><th>검사항목</th><th>측정 1</th><th>측정 2</th><th>측정 3</th><th>판정</th></tr></thead><tbody>${measurementRows}</tbody></table></section>
      <section class="sie-section"><label class="sie-full"><span>비고</span><textarea name="remarks">${esc(rep.remarks||'')}</textarea></label></section></div><div class="sie-foot"><div class="sie-overall">종합판정</div><div><button type="button" class="sie-cancel">취소</button> <button type="submit" class="sie-save">수정 완료</button></div></div></form>`;
    document.body.appendChild(o); const form=o.querySelector('form');
    const refresh=()=>{items.forEach(item=>{const vals=Array.from(o.querySelectorAll(`input[data-item="${CSS.escape(item)}"]`)).map(i=>i.value);const j=judgeItem(item,vals);const t=o.querySelector(`[data-judge-item="${CSS.escape(item)}"]`);if(t)t.textContent=j;});const all=items.every(item=>o.querySelector(`[data-judge-item="${CSS.escape(item)}"]`)?.textContent==='합격');o.querySelector('.sie-overall').textContent=`종합판정: ${all?'합격':'불합격'}`;};
    o.addEventListener('input',refresh);refresh(); o.querySelector('.sie-close').onclick=close;o.querySelector('.sie-cancel').onclick=close;o.onmousedown=e=>{if(e.target===o)close()};form.onsubmit=e=>{e.preventDefault();save(form,o,items)};
  }

  function save(form,overlay,items){
    if(!current) return; const mode=current.mode, oqc=mode==='OQC', rep=current.rep, key=current.key, lot=text(rep.lot); const data=new FormData(form); const inspector=text(data.get('inspector')); const date=text(data.get('date')); if(!inspector||!date){alert('검사일자와 검사자를 입력하세요.');return;}
    const now=new Date().toTimeString().slice(0,5); const newRows=items.map((item,idx)=>{const vals=Array.from(overlay.querySelectorAll(`input[data-item="${CSS.escape(item)}"]`)).map(i=>text(i.value)).filter(Boolean);return {...(current.rows.find(r=>r.check===item)||rep),id:(current.rows.find(r=>r.check===item)?.id)||`${key}-${idx+1}`,groupId:key,date,lot,check:item,measurements:vals,value:vals.join(' / '),judge:judgeItem(item,vals),inspector,by:inspector,time:now,remarks:text(data.get('remarks')),product:oqc?(rep.product||''):text(data.get('product')),shipDate:oqc?text(data.get('shipDate')):undefined,customer:oqc?text(data.get('customer')):undefined,shipQty:oqc?Number(data.get('shipQty')||0):undefined,destination:oqc?text(data.get('destination')):undefined};});
    const all=global.DB.insp[mode]||[];global.DB.insp[mode]=[...all.filter(r=>groupKey(r)!==key),...newRows];
    const overall=newRows.every(r=>r.judge==='합격')?'합격':'불합격';const L=global.DB.lots?.[lot];
    if(L){L.steps=(L.steps||[]).filter(s=>s.groupId!==key&&s.shipNo!==key);newRows.forEach(r=>L.steps.push({stage:oqc?'출하':'공정',name:`${oqc?'출하검사':'공정검사'} — ${r.check}`,time:date,detail:`측정값 ${r.value} · 규격 ${global.QC_ITEMS?.[r.check]?.spec||'-'}`,result:r.judge,by:inspector,groupId:key}));
      if(oqc){if(overall==='합격'){const qty=Number(data.get('shipQty')||0);L.ship={customer:text(data.get('customer')),qty,shipQty:qty,shipDate:text(data.get('shipDate')),date:text(data.get('shipDate')),destination:text(data.get('destination')),shipNo:key,inspector,confirmedAt:new Date().toISOString()};L.stage='출하';L.status='출하완료';L.steps.push({stage:'출하',name:'제품 출하확정',time:text(data.get('shipDate')),detail:`고객사 ${text(data.get('customer'))} · 출하수량 ${qty.toLocaleString()} kg${text(data.get('destination'))?` · 납품처 ${text(data.get('destination'))}`:''}`,result:'완료',by:inspector,groupId:key,shipNo:key});global.DB.coa=global.DB.coa||{};const d=typeof global.decodeLot==='function'?global.decodeLot(lot):null;global.DB.coa[lot]={...(global.DB.coa[lot]||{}),no:`COA-${lot}`,customer:text(data.get('customer')),product:L.itemName,mfg:d?`${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`:'-',ship:text(data.get('shipDate'))||'-',shipNo:key,qty,destination:text(data.get('destination')),results:newRows.map(r=>({item:r.check,spec:global.QC_ITEMS?.[r.check]?.spec||'-',val:r.value,judge:r.judge}))};}else{L.status='홀드 — 부적합 발생 (출하 게이트 차단)';L.stage='생산';if(L.ship?.shipNo===key)L.ship=null;if(global.DB.coa?.[lot]?.shipNo===key)delete global.DB.coa[lot];}}
      else{L.status=overall==='합격'?(L.status||'공정검사 합격'):'홀드 — 부적합 발생 (게이트 차단)';}}
    try{newRows.forEach(r=>global.auditLog?.(mode,'수정',r.id,`${r.lot} / ${r.check} / ${r.value} / ${r.judge}`));}catch(_e){}try{global.dbSave?.();}catch(_e){}try{if(global.qmesSyncUpsert)global.qmesSyncUpsert(mode.toLowerCase(),key,{mode,lotNo:lot,rows:newRows,lotRecord:global.DB.lots?.[lot]||null,holds:(global.DB.holds||[]).filter(h=>text(h.target).includes(lot)),savedAt:new Date().toISOString(),savedBy:inspector}).catch(e=>console.warn(mode+' 수정 동기화 실패:',e.message));}catch(_e){}close();global.location.reload();
  }

  document.addEventListener('click',function(e){const b=e.target?.closest?.('.qmes-iqc-action-edit');if(!b)return;const page=b.closest('.qmes-pqc-page,.qmes-oqc-page');if(!page)return;const mode=page.classList.contains('qmes-oqc-page')?'OQC':'PQC';e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();open(locateFromButton(b,mode));},true);
})(window);
