/* Read-only document views for the existing LOT trace graph. */
(function(factory){
 'use strict';
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 if(typeof window!=='undefined'&&window.document)core.install(window);
})(function(){
 'use strict';
 const norm=value=>String(value??'').trim().toUpperCase();
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const parse=value=>{if(typeof value==='string'){try{return JSON.parse(value);}catch(_){return {};}}return value||{};};
 const list=value=>{value=parse(value);return Array.isArray(value)?value:Array.isArray(value.rows)?value.rows:[];};
 const date=value=>String(value||'').slice(0,10);
 const titles={work:'작업지시서',iqc:'수입검사',pqc:'공정검사',oqc:'출하검사',ncr:'부적합보고서'};
 const ncrStatus=value=>({OPEN:'발행',IN_PROGRESS:'조치중',CLOSED:'완료'}[value]||value||'미확인');
 // Legacy nonconform rows use a different ID namespace from report attachments.
 // Only use report attachment IDs when the list includes saved-report identity.
 const hasReportIdentity=row=>!!(row.id&&row.report_no&&String(row.created_by_id||'').trim());
 function documents(data){
  const docs=[],seen=new Set();
  const add=doc=>{const key=JSON.stringify([doc.type,doc.record.id||'',doc.lot,doc.date,doc.title,doc.record.check||'']);if(!seen.has(key)){seen.add(key);docs.push(doc);}};
  for(const row of data.orders||[]){const f=row.fields||{};add({type:'work',title:f['작업지시번호']||String(row.id||'작업지시서'),lot:f['생산 LOT NO']||'',date:date(row.workDate),status:f['진행상태']||'미확인',record:row});}
  for(const group of data.groups||[])for(const row of group.rows||[]){
   add({type:group.type,title:row.inspectionNo||row.documentNo||row.report_no||[titles[group.type],row.id].filter(Boolean).join(' '),lot:row.lot||'',date:date(row.date),status:row.judge||row.inspectionDecision||'검사내용 확인',record:row});
  }
  for(const row of data.ncr||[])add({type:'ncr',title:row.report_no||'부적합보고서 '+String(row.id||''),lot:row.lot||'',date:date(row.occurred_on),status:ncrStatus(row.status),record:row});
  return docs;
 }
 function text(value){
  if(value===undefined||value===null||value==='')return '-';
  if(Array.isArray(value))return value.map(text).join(' / ');
  if(typeof value==='object')return Object.entries(value).map(([key,v])=>key+': '+text(v)).join(' · ');
  return String(value);
 }
 const pairs=rows=>'<table class="ltd-meta"><tbody>'+rows.map(([key,value])=>'<tr><th>'+esc(key)+'</th><td>'+esc(text(value))+'</td></tr>').join('')+'</tbody></table>';
 const table=(headers,rows)=>rows.length?'<div class="ltd-table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(text(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="ltd-empty">저장된 세부 내용이 없습니다.</p>';
 function inspectionRows(record){
  const checks=list(record.__groupChecks);const records=checks.length?checks:[record],rows=[];
  for(const row of records){
   const items=list(row.items_json||row.items);
   if(items.length){for(const item of items)rows.push([item.name||item.check||item.item,item.spec||item.standard,item.value??item.values??item.measurements??item.result,item.judge||item.decision]);}
   else if(row.measurements&&typeof row.measurements==='object'&&!Array.isArray(row.measurements)){for(const [key,value] of Object.entries(row.measurements))rows.push([key,'',value,'']);}
   else rows.push([row.check||row.name||'검사 결과',row.spec||row.standard,row.measurements??row.value??row.result??row.overall,row.judge||row.inspectionDecision]);
  }
  return rows;
 }
 function preview(doc){
  const row=doc.record,f=row.fields||{};
  let html=pairs([['문서 구분',titles[doc.type]],['문서번호 / 제목',doc.title],['LOT 번호',doc.lot],['일자',doc.date],['진행상태 / 판정',doc.status]]);
  if(doc.type==='work'){
   html+='<h3>작업 기본정보</h3>'+pairs(Object.entries(f));
   html+='<h3>원료 투입내역</h3>'+table(['원료명','원료 LOT','계획투입량 (kg)','실투입량 (kg)'],(row.materials||[]).map(m=>[m.name,m.lot,m.plan,m.actual]));
   if(row.note)html+='<h3>비고</h3><p class="ltd-note">'+esc(row.note)+'</p>';
  }else if(doc.type==='ncr'){
   html+='<h3>발생 및 조치 내용</h3>'+pairs([['발생 구분',row.source],['고객사',row.customer],['제품명',row.product],['부적합 내용',row.description],['긴급조치',row.containment],['원인분석',row.root_cause],['시정조치',row.corrective_action],['효과 확인',row.effectiveness],['담당자',row.owner],['조치 기한',date(row.due_on)],['작성자',row.created_by],['검토자',row.reviewed_by],['승인자',row.approved_by]]);
   const detailNames={specification:'규격 / 기준',actual_result:'실제 결과',affected_qty:'영향 수량',before_condition:'개선 전 현황',after_condition:'개선 후 결과',improvement_comparison:'개선 효과 / 비교 결과'};
   const details=Object.entries(parse(row.details)).filter(([key])=>detailNames[key]);if(details.length)html+='<h3>추가 기록</h3>'+pairs(details.map(([key,value])=>[detailNames[key],value]));
   html+='<h3>첨부파일</h3><div class="ltd-attachments" role="status">'+(hasReportIdentity(row)?'첨부파일을 조회하고 있습니다.':'이전 이력에는 첨부파일 연결정보가 없어 자동 조회할 수 없습니다.')+'</div>';
  }else{
   html+='<h3>검사 기본정보</h3>'+pairs([['품목 / 제품명',row.item||row.product],['공급업체 / 고객사',row.supplier||row.customer],['검사자',row.inspector||row.worker],['검사항목',row.check],['비고',row.remark||row.note]]);
   html+='<h3>저장된 검사내용</h3>'+table(['검사항목','기준 / 규격','측정값 / 결과','판정'],inspectionRows(row));
   html+='<p class="ltd-footnote">저장된 검사기록 조회 화면입니다. 공식 성적서 발행은 해당 검사 메뉴에서 진행하세요.</p>';
  }
  return html;
 }
 function install(win){
  if(win.qmesLotDocuments)return;const doc=win.document;
  let current=[],sequence=0,viewer=null,attachmentsController=null;
  function clear(){sequence++;current=[];doc.querySelector('#lotTrace .ltd-panel')?.remove();const old=viewer;viewer=null;if(old){old.close();old.remove();}attachmentsController?.abort();}
  function render(data){
   clear();if(!data.seeds?.size)return;
   const body=doc.getElementById('lotResultBody');if(!body)return;
   current=documents(data);const panel=doc.createElement('section');panel.className='ltd-panel';panel.setAttribute('aria-label','LOT 관련 문서');
   panel.innerHTML='<div class="ltd-heading"><div><b>LOT 관련 문서</b><small>연결된 LOT의 저장 문서를 바로 확인합니다.</small></div><label>문서 구분 <select aria-label="관련 문서 구분"><option value="">전체</option>'+Object.entries(titles).map(([key,title])=>'<option value="'+key+'">'+title+'</option>').join('')+'</select></label></div><div class="ltd-list"></div>';
   body.before(panel);
   const draw=()=>{const type=panel.querySelector('select').value,rows=current.map((value,index)=>({value,index})).filter(x=>!type||x.value.type===type);panel.querySelector('.ltd-list').innerHTML=rows.length?'<div class="ltd-table-wrap"><table><thead><tr><th>번호</th><th>구분</th><th>문서번호 / 제목</th><th>LOT 번호</th><th>일자</th><th>상태</th><th>보기</th></tr></thead><tbody>'+rows.map(({value:d,index},i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(titles[d.type])+'</td><td><button type="button" class="ltd-link" data-ltd-document="'+index+'">'+esc(d.title)+'</button></td><td>'+esc(d.lot)+'</td><td>'+esc(d.date||'-')+'</td><td>'+esc(d.status)+'</td><td><button type="button" class="ltd-button" data-ltd-document="'+index+'">열기</button></td></tr>').join('')+'</tbody></table></div>':'<p class="ltd-empty">연결된 문서가 없습니다.</p>';};
   panel.querySelector('select').onchange=draw;panel.onclick=event=>{const button=event.target.closest('[data-ltd-document]');if(button)open(current[Number(button.dataset.ltdDocument)]);};draw();
  }
  async function open(item){
   if(!item)return;const version=sequence,previousFocus=doc.activeElement;
   const old=viewer;viewer=null;if(old){old.close();old.remove();}attachmentsController?.abort();
   const dialog=doc.createElement('dialog');viewer=dialog;dialog.className='ltd-dialog';dialog.setAttribute('aria-label',titles[item.type]+' 조회');
   dialog.innerHTML='<header><div><strong>'+esc(titles[item.type])+'</strong><span>'+esc(item.title)+'</span></div><button type="button" class="ltd-button" data-ltd-close>닫기</button></header><div class="ltd-document-body">'+preview(item)+'</div>';
   dialog.querySelector('[data-ltd-close]').onclick=()=>dialog.close();
   dialog.addEventListener('close',()=>{if(viewer===dialog){attachmentsController?.abort();viewer=null;}dialog.remove();if(previousFocus?.isConnected)previousFocus.focus();},{once:true});
   doc.body.append(dialog);dialog.showModal();dialog.querySelector('[data-ltd-close]').focus();
   if(item.type!=='ncr'||!hasReportIdentity(item.record))return;
   const target=dialog.querySelector('.ltd-attachments');if(!item.record.id){target.textContent='문서번호를 확인할 수 없어 첨부파일을 조회할 수 없습니다.';return;}
   const controller=new AbortController();attachmentsController=controller;
   const timer=win.setTimeout(()=>controller.abort(),15000);
   try{
    const response=await win.fetch('/api/qmes-ncr/reports/'+encodeURIComponent(item.record.id)+'/attachments',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    const result=await response.json();if(!response.ok||result.success===false)throw Error('첨부파일을 불러오지 못했습니다.');
    if(version!==sequence||viewer!==dialog||!dialog.open)return;
    const files=Array.isArray(result)?result:Array.isArray(result.data)?result.data:null;if(!files)throw Error('첨부파일 조회 응답을 확인할 수 없습니다.');
    target.replaceChildren();
    for(const file of files){if(file.id===undefined||file.id===null)continue;const link=doc.createElement('a');link.textContent=file.file_name||'첨부파일';link.href='/api/qmes-ncr/attachments/'+encodeURIComponent(file.id)+'/download';link.target='_blank';link.rel='noopener';target.append(link);}
    if(!target.children.length)target.textContent='첨부파일이 없습니다.';
   }catch(_){if(version===sequence&&viewer===dialog&&dialog.open)target.textContent='첨부파일 조회에 실패했습니다. 창을 닫고 다시 열어주세요.';}
   finally{win.clearTimeout(timer);}
  }
  doc.addEventListener('qmes-lot-result',event=>render(event.detail));doc.addEventListener('qmes-lot-reset',clear);win.addEventListener('qmes-authenticated',clear);doc.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))clear();},true);
  const style=doc.createElement('style');style.textContent=`
  #lotTrace .ltd-panel{margin:14px;border:1px solid #d5dce5;border-radius:5px;background:#fff;color:#244260;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px}
  .ltd-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #d5dce5;background:#f8fafc;flex-wrap:wrap}.ltd-heading b{font-size:13px;font-weight:700}.ltd-heading small{display:block;margin-top:3px;color:#718397;font-size:11px;font-weight:500}.ltd-heading label{display:flex;align-items:center;gap:8px;font-size:11px}.ltd-heading select{height:28px;border:1px solid #cfd9e5;border-radius:3px;background:#fff;color:#244260;font:inherit;padding:0 7px}
  .ltd-table-wrap{overflow:auto}.ltd-panel table,.ltd-dialog table{width:100%;border-collapse:collapse;font-size:12px}.ltd-panel table{min-width:700px}.ltd-panel th,.ltd-panel td,.ltd-dialog th,.ltd-dialog td{padding:9px 10px;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;text-align:center;vertical-align:middle;overflow-wrap:anywhere}.ltd-panel th,.ltd-dialog th{background:#edf3f9;color:#244260;font-weight:600}.ltd-panel th:last-child,.ltd-panel td:last-child{border-right:0}.ltd-panel tbody tr:last-child td{border-bottom:0}
  .ltd-button{height:28px;padding:0 11px;border:1px solid #cfd7e1;border-radius:3px;background:#fff;color:#415267;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer}.ltd-link{border:0;padding:0;background:transparent;color:#1768ad;font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}.ltd-empty{margin:0;padding:20px;text-align:center;color:#718397;font-size:12px}.ltd-button:focus-visible,.ltd-link:focus-visible{outline:2px solid #2f8de4;outline-offset:2px}
  .ltd-dialog{box-sizing:border-box;width:min(980px,calc(100vw - 32px));max-height:90dvh;margin:auto;padding:0;border:1px solid #d5dce5;border-radius:7px;background:#fff;color:#244260;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px}.ltd-dialog::backdrop{background:rgba(24,49,75,.4)}.ltd-dialog>header{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid #d5dce5;background:#fff}.ltd-dialog header strong{display:block;color:#173b61;font-size:17px;font-weight:800}.ltd-dialog header span{display:block;margin-top:4px;color:#64748b;font-size:12px}.ltd-document-body{padding:16px 18px}.ltd-document-body h3{margin:18px 0 8px;font-size:13px;font-weight:700}.ltd-dialog .ltd-meta{table-layout:fixed}.ltd-dialog .ltd-meta th{width:150px;text-align:center}.ltd-dialog .ltd-meta td{text-align:left;white-space:pre-wrap}.ltd-note{white-space:pre-wrap;line-height:1.7}.ltd-footnote{font-size:11px;color:#718397;line-height:1.6}.ltd-attachments{padding:10px 0;color:#64748b}.ltd-attachments a{display:block;padding:7px 0;color:#1768ad}
  @media(max-width:600px){.ltd-dialog .ltd-meta th{width:95px}.ltd-document-body{padding:12px}.ltd-dialog header{padding:12px}}
  `;doc.head.append(style);win.qmesLotDocuments={clear};
 }
 return {documents,preview,inspectionRows,install};
});
