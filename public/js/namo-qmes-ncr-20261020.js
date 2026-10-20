(function(){
'use strict';
var root=document.getElementById('ncr'),nav=document.querySelector('.menu[data-page="ncr"]');
if(!root||!nav)return;
var rows=[],selected=null,view='list';
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var dateOnly=function(v){return v?String(v).slice(0,10):'';};
var today=function(){var d=new Date(),p=function(n){return String(n).padStart(2,'0');};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());};
var stateName=function(v){return {OPEN:'발행',IN_PROGRESS:'조치중',CLOSED:'완료'}[v]||v||'-';};
var style=document.createElement('style');
style.id='qmes-ncr-style-20261020';
style.textContent='#ncr{padding:22px 24px 40px;color:#172b44}#ncr *{box-sizing:border-box}#ncr .ncr-head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:16px}#ncr .ncr-head h1{font-size:23px;margin:0 0 5px;font-weight:750}#ncr .ncr-head p{margin:0;color:#64748b;font-size:13px}#ncr button{cursor:pointer;font:inherit}#ncr .ncr-btn{border:1px solid #cbd5e1;border-radius:7px;background:#fff;padding:9px 14px;color:#1e293b;font-size:13px;font-weight:650}#ncr .ncr-btn.primary{background:#1768ad;border-color:#1768ad;color:#fff}#ncr .ncr-btn:disabled{opacity:.5;cursor:wait}#ncr .ncr-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 14px}#ncr .ncr-tools input,#ncr .ncr-tools select{height:36px;border:1px solid #d6e0e9;border-radius:6px;background:#fff;padding:0 11px;color:#1f2937;font-size:13px}#ncr .ncr-table-wrap{overflow:auto;border:1px solid #dbe3eb;border-radius:6px;background:#fff}#ncr table{border-collapse:collapse;width:100%;min-width:940px;font-size:13px}#ncr th{background:#f4f8fb;color:#334155;text-align:center;font-weight:700;white-space:nowrap}#ncr th,#ncr td{border-right:1px solid #e9eef4;border-bottom:1px solid #e9eef4;padding:11px 9px}#ncr td{text-align:center}#ncr tr:last-child td{border-bottom:0}#ncr td:last-child,#ncr th:last-child{border-right:0}#ncr .ncr-link{background:none;border:0;color:#0b62ad;font-weight:700;text-decoration:underline}#ncr .ncr-empty{padding:40px 10px;color:#64748b;text-align:center}#ncr .ncr-form{background:#fff;border:1px solid #dce5ee;border-radius:8px;padding:21px}#ncr .ncr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}#ncr label{display:flex;flex-direction:column;gap:6px;color:#334155;font-size:12px;font-weight:700}#ncr label input,#ncr label select,#ncr label textarea{width:100%;border:1px solid #cfdbe7;border-radius:6px;padding:10px;color:#0f172a;background:#fff;font-size:13px;font-weight:400}#ncr label textarea{min-height:78px;resize:vertical}#ncr .ncr-wide{grid-column:1/-1}#ncr .ncr-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}#ncr .ncr-message{color:#b42318;margin:12px 0;font-size:13px}#ncr .ncr-status{border-radius:10px;padding:3px 8px;background:#eff6ff;color:#1d4d83;font-weight:650;white-space:nowrap}@media(max-width:800px){#ncr{padding:12px}#ncr .ncr-grid{grid-template-columns:1fr}#ncr .ncr-head{align-items:flex-start;flex-direction:column}}';
document.head.appendChild(style);
function notice(msg){var el=root.querySelector('.ncr-message');if(el)el.textContent=msg||'';}
function field(label,name,type,value,required,wide){
 var id='ncr-'+name,attrs=required?' required':'',v=esc(value||'');
 var input=type==='textarea'?'<textarea id="'+id+'" name="'+name+'"'+attrs+'>'+v+'</textarea>':type==='select'?'<select id="'+id+'" name="'+name+'"'+attrs+'>'+value+'</select>':'<input id="'+id+'" name="'+name+'" type="'+type+'" value="'+v+'"'+attrs+'>';
 return '<label class="'+(wide?'ncr-wide':'')+'" for="'+id+'">'+label+input+'</label>';
}
function selectOptions(values,current){return values.map(function(p){return '<option value="'+esc(p[0])+'"'+(p[0]===current?' selected':'')+'>'+esc(p[1])+'</option>';}).join('');}

/* NCR registration layout mirrors the work-order editor while retaining NCR fields and save logic. */
function decorateNcrForm(edit,record){
 if(!document.getElementById('ncr-workorder-form-style')){
  var st=document.createElement('style');st.id='ncr-workorder-form-style';
  st.textContent='#ncr .ncr-editor-top{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border-bottom:1px solid #d9e3ed;font-weight:700;color:#163d60}#ncr .ncr-editor-top .ncr-btn{padding:6px 10px}#ncr .ncr-editor-shell{display:grid;grid-template-columns:245px minmax(0,1fr);min-height:550px;background:#fff}#ncr .ncr-editor-side{border-right:1px solid #d7e1eb;min-width:0}#ncr .ncr-editor-side-title{padding:12px;font-weight:750;font-size:12px;border-bottom:1px solid #e0e8f0}#ncr .ncr-editor-side input,#ncr .ncr-editor-side select{display:block;width:calc(100% - 16px);margin:7px 8px;height:32px;border:1px solid #cbd8e6;border-radius:4px;padding:0 9px;font-size:12px;background:#fff}#ncr .ncr-editor-side-items{max-height:660px;overflow:auto}#ncr .ncr-editor-item{display:block;width:100%;text-align:left;background:#fff;border:0;border-bottom:1px solid #e2e8f0;padding:12px 10px;color:#183b59;cursor:pointer}#ncr .ncr-editor-item:hover,#ncr .ncr-editor-item.active{background:#edf5ff}#ncr .ncr-editor-item strong{display:block;font-size:12px}#ncr .ncr-editor-item small{display:block;color:#708399;font-size:10px;margin-top:4px}#ncr .ncr-editor-main{min-width:0;padding:0 12px 20px}#ncr .ncr-editor-toolbar{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce5ee;padding:11px 0;margin-bottom:12px;gap:10px}#ncr .ncr-editor-toolbar strong{font-size:13px;color:#143b61}#ncr .ncr-editor-toolbar .ncr-btn{padding:6px 12px}#ncr .ncr-editor-main .ncr-form{margin:0!important;border:0!important;padding:0!important}#ncr .ncr-editor-main .ncr-form>h3,#ncr .ncr-editor-main .ncr-form>.ncr-grid{display:none!important}#ncr .ncr-section{margin:12px 0 16px;border:1px solid #d9e3ee;border-radius:5px;overflow:hidden}#ncr .ncr-section-title{background:#eaf2f9;padding:12px 14px;font-size:13px;font-weight:750;color:#1a476b}#ncr .ncr-section-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:15px}#ncr .ncr-section-grid label{min-width:0}#ncr .ncr-section-grid label.ncr-wide{grid-column:1/-1}#ncr .ncr-section-grid textarea{min-height:78px}#ncr .ncr-editor-main .ncr-actions{margin-top:10px!important}#ncr .ncr-editor-main .ncr-message{padding:0 12px}@media(max-width:850px){#ncr .ncr-editor-shell{grid-template-columns:1fr}#ncr .ncr-editor-side{display:none}#ncr .ncr-section-grid{grid-template-columns:1fr}}';
  document.head.appendChild(st);
 }
 var form=root.querySelector('#ncr-form'),oldHead=root.querySelector('.ncr-head'),oldGrid=form.querySelector('.ncr-grid');
 var top=document.createElement('div');top.className='ncr-editor-top';
 top.innerHTML='<button type="button" class="ncr-btn" id="ncr-editor-back">← 목록으로</button><strong>'+(edit?'부적합보고서 상세 / 조치관리':'신규 부적합보고서 등록')+'</strong>';
 var shell=document.createElement('div');shell.className='ncr-editor-shell';
 var side=document.createElement('aside');side.className='ncr-editor-side';
 side.innerHTML='<div class="ncr-editor-side-title">부적합보고서 목록 <span style="float:right;color:#8496aa">'+rows.length+'건</span></div><select id="ncr-editor-filter"><option value="">전체</option><option value="IQC">수입검사</option><option value="PQC">공정검사</option><option value="OQC">출하검사</option><option value="생산">생산</option><option value="고객">고객</option></select><input type="search" id="ncr-editor-search" placeholder="부적합보고서 검색"><div class="ncr-editor-side-items"></div>';
 var main=document.createElement('div');main.className='ncr-editor-main';
 var toolbar=document.createElement('div');toolbar.className='ncr-editor-toolbar';
 toolbar.innerHTML='<strong>'+(edit?'부적합보고서 수정':'신규 부적합보고서 등록')+' <small style="font-weight:400;color:#91a1b2">내용을 직접 입력합니다.</small></strong><span><button type="button" class="ncr-btn" id="ncr-editor-list">목록</button> <button type="button" class="ncr-btn primary" id="ncr-editor-save">저장</button></span>';
 main.appendChild(toolbar);main.appendChild(form);shell.append(side,main);
 root.replaceChildren(top,shell);
 var back=function(){view='list';render();};
 root.querySelector('#ncr-editor-back').onclick=back;
 root.querySelector('#ncr-editor-list').onclick=back;
 root.querySelector('#ncr-editor-save').onclick=function(){if(form.requestSubmit)form.requestSubmit();else form.querySelector('#ncr-save').click();};
 var groups=[
 ['부적합 기본정보',['occurred_on','source','owner','product','lot','customer','due_on','status']],
 ['부적합 발생 및 격리조치',['description','containment']],
 ['원인분석 및 시정조치',['root_cause','corrective_action']],
 ['효과 확인',['effectiveness']]
 ];
 groups.forEach(function(group){
  var section=document.createElement('section');section.className='ncr-section';
  var title=document.createElement('div');title.className='ncr-section-title';title.textContent=group[0];
  var grid=document.createElement('div');grid.className='ncr-section-grid';
  group[1].forEach(function(name){var el=oldGrid.querySelector('[name="'+name+'"]');if(el){var label=el.closest('label');if(label)grid.appendChild(label);}});
  section.append(title,grid);form.insertBefore(section,form.querySelector('.ncr-message'));
 });

 var extra=[
 ['검사 및 발생정보',[['발견자','reporter'],['발생부서','department'],['발생공정','process'],['작업지시번호','work_order'],['검사수량(kg)','inspected_qty'],['부적합수량(kg)','affected_qty'],['중요도','severity','select',['경미','중대','치명']],['규격 / 판정기준','specification','textarea'],['실측값 / 이탈내용','actual_result','textarea']]],
 ['격리 및 처리판정',[['격리장소','isolation_location'],['처리판정','disposition','select',['미결정','재작업','선별','특채','반품','폐기']],['판정 승인자','disposition_approved_by'],['관련 LOT','related_lots'],['고객사 통보 여부','customer_notified','select',['미통보','통보완료','해당없음']]]],
 ['시정조치 및 검증',[['원인분석 방법','cause_method','select',['5 Why','특성요인도','8D','기타']],['조치 담당자','action_owner'],['조치 완료일','action_completed_on','date'],['효과 검증방법','verification_method'],['효과 검증일','verification_date','date'],['검증 결과','verification_result','textarea'],['검증자','verified_by'],['종결 승인자','closure_approved_by'],['종결일','closed_on','date'],['재발 여부','repeat_issue','select',['미확인','재발 없음','재발']]]]
 ];
 extra.forEach(function(g){var sec=document.createElement('section');sec.className='ncr-section';sec.innerHTML='<div class="ncr-section-title">'+g[0]+'</div>';var grid=document.createElement('div');grid.className='ncr-section-grid';g[1].forEach(function(f){var label=document.createElement('label');label.textContent=f[0];var el;if(f[2]==='textarea'){el=document.createElement('textarea');}else if(f[2]==='select'){el=document.createElement('select');f[3].forEach(function(v){var opt=document.createElement('option');opt.value=v;opt.textContent=v;el.appendChild(opt);});}else{el=document.createElement('input');el.type=f[2]==='date'?'date':'text';}el.name='ncr_detail_'+f[1];el.value=(record&&record.details&&record.details[f[1]])||'';label.appendChild(el);grid.appendChild(label);});sec.appendChild(grid);form.insertBefore(sec,form.querySelector('.ncr-message'));});
 var attachmentSection=document.createElement('section');attachmentSection.className='ncr-section';
 attachmentSection.innerHTML='<div class="ncr-section-title">증빙자료 및 첨부파일</div><div style="padding:14px"><input type="file" id="ncr-attach-input" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.docx,.xls,.doc,.csv,.txt" style="max-width:100%"><p style="font-size:12px;color:#64748b">사진·검사성적서·원인분석 자료 첨부 (파일당 10MB, 최대 10개). 신규 등록 시 저장 버튼을 누르면 보고서와 함께 등록됩니다.</p><div id="ncr-attachment-list"></div></div>';
 form.insertBefore(attachmentSection,form.querySelector('.ncr-message'));
 if(edit&&record&&record.id)loadNcrAttachments(record.id);
 var list=side.querySelector('.ncr-editor-side-items'),search=side.querySelector('#ncr-editor-search'),filter=side.querySelector('#ncr-editor-filter');
 function refreshSide(){
  var q=search.value.toLowerCase(),source=filter.value;
  var items=rows.filter(function(item){return (!source||item.source===source)&&[item.report_no,item.product,item.lot,item.description].join(' ').toLowerCase().includes(q);});
  list.innerHTML=items.map(function(item){return '<button type="button" class="ncr-editor-item'+(record&&String(record.id)===String(item.id)?' active':'')+'" data-id="'+esc(item.id)+'"><strong>'+esc(dateOnly(item.occurred_on))+'</strong><small>'+esc(item.report_no||'')+' · '+esc(item.product||'-')+'</small></button>';}).join('')||'<div style="padding:12px;font-size:12px;color:#8496aa">등록된 부적합보고서가 없습니다.</div>';
  list.querySelectorAll('[data-id]').forEach(function(btn){btn.onclick=function(){selected=rows.find(function(item){return String(item.id)===btn.dataset.id;});view='edit';render();};});
 }
 search.oninput=refreshSide;filter.onchange=refreshSide;refreshSide();
}

function render(){
 if(view==='list')return renderList();
 var edit=view==='edit',r=edit?(selected||{}):{},status=edit?(r.status||'OPEN'):'OPEN';
 root.innerHTML='<div class="ncr-head"><div><h1>부적합보고서 등록 및 조회</h1><p>부적합 발생 · 원인분석 · 시정조치 · 효과 확인</p></div><button class="ncr-btn" id="ncr-back" type="button">목록으로</button></div>'+
 '<form class="ncr-form" id="ncr-form"><h3 style="margin:0 0 18px;font-size:17px">'+(edit?'부적합보고서 상세 / 조치관리':'신규 부적합보고서 등록')+(edit?' · '+esc(r.report_no):'')+'</h3><div class="ncr-grid">'+
 field('발생일자 *','occurred_on','date',dateOnly(r.occurred_on)||today(),true,false)+
 field('발생구분 *','source','select',selectOptions([['IQC','수입검사(IQC)'],['PQC','공정검사(PQC)'],['OQC','출하검사(OQC)'],['생산','생산'],['고객','고객'],['기타','기타']],r.source||'IQC'),true,false)+
 field('담당자','owner','text',r.owner,false,false)+
 field('제품명','product','text',r.product,false,false)+
 field('LOT 번호','lot','text',r.lot,false,false)+
 field('고객사 / 협력사','customer','text',r.customer,false,false)+
 field('부적합 내용 *','description','textarea',r.description,true,true)+
 field('긴급조치 / 격리','containment','textarea',r.containment,false,true)+
 field('원인분석','root_cause','textarea',r.root_cause,false,true)+
 field('시정조치 / 재발방지','corrective_action','textarea',r.corrective_action,false,true)+
 field('효과 확인','effectiveness','textarea',r.effectiveness,false,true)+
 field('완료예정일','due_on','date',dateOnly(r.due_on),false,false)+
 field('처리상태','status','select',selectOptions([['OPEN','발행'],['IN_PROGRESS','조치중'],['CLOSED','완료']],status),false,false)+
 '</div><div class="ncr-message" role="status"></div><div class="ncr-actions">'+(edit?'<button type="button" class="ncr-btn" id="ncr-print">인쇄</button>':'')+'<button type="button" class="ncr-btn" id="ncr-cancel">취소</button><button type="submit" class="ncr-btn primary" id="ncr-save">'+(edit?'조치사항 저장':'NCR 발행 및 저장')+'</button></div></form>';
 decorateNcrForm(edit,r);
 if(edit){['occurred_on','source','product','lot','customer','description'].forEach(function(k){var el=root.querySelector('[name="'+k+'"]');if(el)el.disabled=true;});}
 root.querySelector('#ncr-cancel').onclick=function(){view='list';render();};
 if(edit)root.querySelector('#ncr-print').onclick=function(){printReport(r);};
 root.querySelector('#ncr-form').onsubmit=save;
}
function renderList(){
 root.innerHTML='<div class="ncr-head"><div><h1>부적합보고서 등록 및 조회</h1><p>IQC · PQC · OQC · 생산 · 고객 부적합 통합관리</p></div><button class="ncr-btn primary" id="ncr-new">+ 신규 NCR 발행</button></div>'+
 '<div class="ncr-tools"><input id="ncr-search" type="search" placeholder="문서번호 / 제품명 / LOT 검색" aria-label="NCR 검색"><select id="ncr-filter"><option value="">전체 상태</option><option value="OPEN">발행</option><option value="IN_PROGRESS">조치중</option><option value="CLOSED">완료</option></select><button class="ncr-btn" id="ncr-refresh">조회</button><span id="ncr-count" style="margin-left:auto;font-size:13px;color:#64748b"></span></div>'+
 '<div class="ncr-table-wrap"><table><thead><tr><th>No.</th><th>NCR 번호</th><th>발생일자</th><th>구분</th><th>제품명</th><th>LOT 번호</th><th>부적합 내용</th><th>담당자</th><th>진행상태</th><th>비고</th></tr></thead><tbody id="ncr-rows"><tr><td colspan="10" class="ncr-empty">조회 중입니다.</td></tr></tbody></table></div><div class="ncr-message" role="status"></div>';
 root.querySelector('#ncr-new').onclick=function(){selected=null;view='new';render();};
 root.querySelector('#ncr-refresh').onclick=load;
 root.querySelector('#ncr-search').oninput=draw;
 root.querySelector('#ncr-filter').onchange=draw;
 draw();
}
function draw(){
 if(view!=='list')return;
 var query=(root.querySelector('#ncr-search').value||'').toLowerCase(),status=root.querySelector('#ncr-filter').value;
 var filtered=rows.filter(function(r){return (!status||r.status===status)&&[r.report_no,r.product,r.lot,r.description,r.customer].join(' ').toLowerCase().includes(query);});
 root.querySelector('#ncr-count').textContent='총 '+filtered.length+'건';
 root.querySelector('#ncr-rows').innerHTML=filtered.length?filtered.map(function(r,i){
  return '<tr><td>'+String(filtered.length-i)+'</td><td><button class="ncr-link" type="button" data-ncr-id="'+r.id+'">'+esc(r.report_no)+'</button></td><td>'+esc(dateOnly(r.occurred_on))+'</td><td>'+esc(r.source)+'</td><td>'+esc(r.product||'-')+'</td><td>'+esc(r.lot||'-')+'</td><td style="text-align:left;max-width:240px">'+esc((r.description||'').slice(0,65))+'</td><td>'+esc(r.owner||'-')+'</td><td><span class="ncr-status">'+esc(stateName(r.status))+'</span></td><td><button class="ncr-btn" type="button" data-ncr-id="'+r.id+'">조회</button></td></tr>';
 }).join(''):'<tr><td colspan="10" class="ncr-empty">등록된 부적합보고서가 없습니다.</td></tr>';
 root.querySelectorAll('[data-ncr-id]').forEach(function(btn){btn.onclick=function(){selected=rows.find(function(r){return String(r.id)===btn.dataset.ncrId;});view='edit';render();};});
}
async function request(path,options){
 var response=await fetch(path,Object.assign({credentials:'same-origin'},options||{}));
 var data=await response.json();
 if(!response.ok||!data.success)throw Error(data.message||'서버 요청에 실패했습니다.');
 return data.data;
}
async function load(){
 if(view!=='list')return;
 try{rows=await request('/api/qmes-ncr/reports');draw();notice('');}
 catch(e){notice(e.message);var tbody=root.querySelector('#ncr-rows');if(tbody)tbody.innerHTML='<tr><td colspan="10" class="ncr-empty">조회 실패: '+esc(e.message)+'</td></tr>';}
}
async function loadNcrAttachments(id){var target=root.querySelector('#ncr-attachment-list');if(!target)return;try{var files=await request('/api/qmes-ncr/reports/'+id+'/attachments');target.replaceChildren();files.forEach(function(f){var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #e2e8f0';var link=document.createElement('a');link.textContent=f.file_name+' ('+Math.ceil(f.file_size/1024)+'KB)';link.href='/api/qmes-ncr/attachments/'+f.id+'/download';link.style.color='#1768ad';row.appendChild(link);var del=document.createElement('button');del.type='button';del.className='ncr-btn';del.textContent='삭제';del.onclick=async function(){if(!confirm('첨부파일을 삭제하시겠습니까?'))return;try{await request('/api/qmes-ncr/attachments/'+f.id,{method:'DELETE'});loadNcrAttachments(id);}catch(e){notice(e.message);}};row.appendChild(del);target.appendChild(row);});}catch(e){target.textContent=e.message;}}
async function save(event){
 event.preventDefault();
 var form=event.currentTarget,button=form.querySelector('#ncr-save');
 var data={},details={};new FormData(form).forEach(function(v,k){if(k.indexOf('ncr_detail_')===0)details[k.slice(11)]=String(v);else if(k!=='file')data[k]=String(v);});data.details=details;var files=Array.from((form.querySelector('#ncr-attach-input')||{}).files||[]);
 if(!data.description&&!selected){notice('부적합 내용을 입력하세요.');return;}
 button.disabled=true;
 try{
  var edit=view==='edit',url='/api/qmes-ncr/reports'+(edit?'/'+selected.id:'');
  var result=await request(url,{method:edit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(files.length){if(files.length>10)throw Error('첨부파일은 최대 10개까지 등록할 수 있습니다.');for(var file of files){var upload=new FormData();upload.append('file',file);await request('/api/qmes-ncr/reports/'+result.id+'/attachments',{method:'POST',body:upload});}}selected=result;view='list';render();await load();
 }catch(e){notice(e.message);}finally{button.disabled=false;}
}
function printReport(r){
 var fields=[['NCR 번호',r.report_no],['발생일자',dateOnly(r.occurred_on)],['발생구분',r.source],['제품명',r.product],['LOT',r.lot],['고객사 / 협력사',r.customer],['부적합 내용',r.description],['긴급조치 / 격리',r.containment],['원인분석',r.root_cause],['시정조치 / 재발방지',r.corrective_action],['효과 확인',r.effectiveness],['담당자',r.owner],['처리상태',stateName(r.status)]];
 var w=window.open('','_blank');if(!w){notice('팝업 허용 후 다시 인쇄해 주세요.');return;}
 w.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+esc(r.report_no)+'</title><style>body{font:14px Arial,sans-serif;margin:35px;color:#172b44}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #94a3b8;padding:12px;text-align:left;white-space:pre-wrap}th{width:170px;background:#f1f5f9}@page{size:A4;margin:15mm}</style></head><body><h1>부적합보고서 (NCR)</h1><table>'+fields.map(function(p){return '<tr><th>'+esc(p[0])+'</th><td>'+esc(p[1]||'-')+'</td></tr>';}).join('')+'</table><script>window.onload=function(){window.print()};<\/script></body></html>');
 w.document.close();
}

/* Work-order parity enhancements, scoped only to NCR. */
(function(){
var parityStyle=document.createElement('style');
parityStyle.textContent='#ncr .ncr-head{background:#fff;border:1px solid #dce5ee;border-radius:8px;padding:17px 20px;margin-bottom:12px}#ncr .ncr-head h1{font-size:18px;color:#173b61;font-weight:800}#ncr .ncr-tools{background:#fff;border:1px solid #dce5ee;border-radius:7px;padding:12px}#ncr .ncr-table-wrap{border-radius:0}#ncr .ncr-table-wrap th{background:#eef7ff;border-color:#d8e8f5;color:#183b59}#ncr .ncr-table-wrap td{background:#fff}#ncr .ncr-pagination{display:flex;justify-content:center;gap:6px;padding:12px;background:#fff}#ncr .ncr-pagination button{padding:5px 11px;border:1px solid #d4dce5;border-radius:5px;background:#fff}#ncr .ncr-pagination button.active{background:#1d6eb2;color:#fff}#ncr .ncr-bulk{display:flex;gap:8px;margin:10px 0;align-items:center}#ncr .ncr-bulk[hidden]{display:none}#ncr .ncr-row-actions{display:flex;gap:5px;justify-content:center}#ncr .ncr-row-actions .ncr-btn{padding:5px 8px;font-size:12px}#ncr .ncr-select{width:16px;height:16px}';
document.head.appendChild(parityStyle);
var originalRenderList=renderList,originalDraw=draw,originalRender=render;
var page=1,selectedIds=new Set(),pageSize=10;
renderList=function(){
 originalRenderList();
 var th=root.querySelector('#ncr-rows')?.closest('table')?.querySelector('thead tr');
 if(!th)return;
 th.insertAdjacentHTML('afterbegin','<th><input type="checkbox" id="ncr-select-all" aria-label="전체 선택"></th>');
 var wrap=root.querySelector('.ncr-table-wrap');
 wrap.insertAdjacentHTML('afterend','<div class="ncr-pagination" id="ncr-pages"></div>');
 wrap.insertAdjacentHTML('beforebegin','<div class="ncr-bulk" id="ncr-bulk" hidden><button class="ncr-btn" id="ncr-bulk-print">선택 인쇄</button><button class="ncr-btn" id="ncr-bulk-delete">선택 삭제</button></div>');
 root.querySelector('#ncr-select-all').onchange=function(e){
  var checked=e.target.checked;
  root.querySelectorAll('.ncr-row-select').forEach(function(el){el.checked=checked;if(checked)selectedIds.add(el.value);else selectedIds.delete(el.value);});
  updateBulk();
 };
 root.querySelector('#ncr-bulk-print').onclick=function(){rows.filter(function(r){return selectedIds.has(String(r.id));}).forEach(printReport);};
 root.querySelector('#ncr-bulk-delete').onclick=async function(){
  if(!selectedIds.size||!window.confirm('선택한 부적합보고서 '+selectedIds.size+'건을 삭제하시겠습니까?'))return;
  var ids=Array.from(selectedIds),errors=[];
  for(var id of ids){try{await request('/api/qmes-ncr/reports/'+encodeURIComponent(id),{method:'DELETE'});selectedIds.delete(id);}catch(e){errors.push(id+': '+e.message);}}
  await load();if(errors.length)notice('일부 삭제 실패: '+errors.join(', '));
 };
 root.querySelector('#ncr-search').oninput=function(){page=1;draw();};
 root.querySelector('#ncr-filter').onchange=function(){page=1;draw();};
 draw();
};
function updateBulk(){
 var bar=root.querySelector('#ncr-bulk');if(!bar)return;
 bar.hidden=!selectedIds.size;
 bar.querySelector('#ncr-bulk-print').textContent='선택 인쇄 ('+selectedIds.size+')';
 bar.querySelector('#ncr-bulk-delete').textContent='선택 삭제 ('+selectedIds.size+')';
}
draw=function(){
 if(view!=='list')return;
 var q=(root.querySelector('#ncr-search')?.value||'').toLowerCase(),status=root.querySelector('#ncr-filter')?.value||'';
 var matched=rows.filter(function(r){return (!status||r.status===status)&&[r.report_no,r.product,r.lot,r.description,r.customer].join(' ').toLowerCase().includes(q);});
 var pages=Math.max(1,Math.ceil(matched.length/pageSize));page=Math.min(page,pages);
 var pageRows=matched.slice((page-1)*pageSize,page*pageSize);
 root.querySelector('#ncr-count').textContent='총 '+matched.length+'건';
 root.querySelector('#ncr-rows').innerHTML=pageRows.length?pageRows.map(function(r,i){
  return '<tr><td><input class="ncr-row-select" type="checkbox" value="'+esc(r.id)+'" '+(selectedIds.has(String(r.id))?'checked':'')+'></td><td>'+String(matched.length-((page-1)*pageSize+i))+'</td><td><button class="ncr-link" type="button" data-ncr-id="'+r.id+'">'+esc(r.report_no)+'</button></td><td>'+esc(dateOnly(r.occurred_on))+'</td><td>'+esc(r.source)+'</td><td>'+esc(r.product||'-')+'</td><td>'+esc(r.lot||'-')+'</td><td style="text-align:left">'+esc((r.description||'').slice(0,65))+'</td><td>'+esc(r.owner||'-')+'</td><td><span class="ncr-status">'+esc(stateName(r.status))+'</span></td><td><div class="ncr-row-actions"><button class="ncr-btn" data-ncr-print="'+r.id+'">인쇄</button><button class="ncr-btn" data-ncr-id="'+r.id+'">수정</button><button class="ncr-btn" data-ncr-delete="'+r.id+'">삭제</button></div></td></tr>';
 }).join(''):'<tr><td colspan="11" class="ncr-empty">등록된 부적합보고서가 없습니다.</td></tr>';
 root.querySelectorAll('[data-ncr-id]').forEach(function(btn){btn.onclick=function(){selected=rows.find(function(r){return String(r.id)===btn.dataset.ncrId;});view='edit';render();};});
 root.querySelectorAll('[data-ncr-print]').forEach(function(btn){btn.onclick=function(){var row=rows.find(function(r){return String(r.id)===btn.dataset.ncrPrint;});if(row)printReport(row);};});
 root.querySelectorAll('[data-ncr-delete]').forEach(function(btn){btn.onclick=async function(){
  if(!window.confirm('해당 NCR 보고서를 삭제하시겠습니까?'))return;
  try{await request('/api/qmes-ncr/reports/'+encodeURIComponent(btn.dataset.ncrDelete),{method:'DELETE'});selectedIds.delete(btn.dataset.ncrDelete);await load();}
  catch(e){notice(e.message);}
 };});
 root.querySelectorAll('.ncr-row-select').forEach(function(el){el.onchange=function(){if(el.checked)selectedIds.add(el.value);else selectedIds.delete(el.value);updateBulk();};});
 var pager=root.querySelector('#ncr-pages');if(pager){
  pager.innerHTML=Array.from({length:pages},function(_,i){return '<button type="button" data-ncr-page="'+(i+1)+'" class="'+(i+1===page?'active':'')+'">'+(i+1)+'</button>';}).join('');
  pager.querySelectorAll('button').forEach(function(b){b.onclick=function(){page=Number(b.dataset.ncrPage);draw();};});
 }
 var all=root.querySelector('#ncr-select-all');if(all)all.checked=pageRows.length>0&&pageRows.every(function(r){return selectedIds.has(String(r.id));});
 updateBulk();
};
render=function(){originalRender();};
})();

/* NCR-only layout parity with work order register. */
(function(){
var css=document.createElement('style');
css.textContent='#ncr .ncr-form{margin:0 14px 20px!important;border:1px solid #d6e1ee!important;border-radius:6px!important;background:#fff!important;padding:20px!important;box-shadow:none!important}#ncr .ncr-form h3{font-size:16px!important;color:#123c62!important;padding-left:10px!important;border-left:3px solid #1385d8!important;margin:0 0 18px!important}#ncr .ncr-grid{gap:12px 16px!important}#ncr .ncr-grid label{font-size:12px!important;color:#1c3956!important;font-weight:700!important}#ncr .ncr-grid input,#ncr .ncr-grid select,#ncr .ncr-grid textarea{border-radius:5px!important;border:1px solid #cbd8e6!important;background:#fff!important;padding:9px 10px!important;min-height:36px!important}#ncr .ncr-actions{padding-top:14px!important;border-top:1px solid #e2e8f0!important}#ncr .ncr-actions .ncr-btn{border-radius:5px!important}#ncr .ncr-head #ncr-back{border-radius:5px!important}#ncr .ncr-list-actions .ncr-icon-btn{width:33px!important;min-width:33px!important;height:33px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid #cbd8e6!important;border-radius:5px!important;background:#fff!important;color:#36516e!important;box-shadow:none!important}#ncr .ncr-list-actions .ncr-icon-btn:hover{background:#f0f6fc!important}#ncr .ncr-list-actions .ncr-icon-btn svg{display:block;flex-shrink:0}#ncr .ncr-period-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:210px;height:33px;border:1px solid #cbd5e1;border-radius:5px;background:#fff;padding:0 9px;color:#203b58;font-size:12px;font-weight:600;cursor:pointer}#ncr .ncr-period-trigger span:last-child{font-size:17px;color:#526e89}#ncr .ncr-tools input[type=hidden]{display:none}#ncr .ncr-list-actions{display:flex;align-items:center;gap:7px}#ncr .ncr-list-actions .ncr-btn{padding:6px 10px;font-size:12px}#ncr .ncr-list-actions #ncr-toggle{min-width:32px}#ncr{padding:0!important}#ncr .ncr-head{margin:0!important;padding:15px 20px!important;background:#fff;border-radius:7px 7px 0 0!important}#ncr .ncr-head h1{border-left:3px solid #1385d8;padding-left:11px;font-size:18px!important;color:#143b61}#ncr .ncr-head p{display:none}#ncr .ncr-tools{margin:0!important;padding:12px 15px!important;border-radius:0!important;background:#f2f7fc!important}#ncr .ncr-tools label{display:inline-flex;flex-direction:row;align-items:center;gap:6px;font-size:12px;white-space:nowrap}#ncr .ncr-tools input,#ncr .ncr-tools select{height:33px!important;min-width:105px;max-width:160px}#ncr .ncr-tools input[type=date]{min-width:140px}#ncr .ncr-table-wrap{margin:0 14px}#ncr .ncr-table-wrap th{background:#e8f0f8!important}#ncr .ncr-table-wrap tr:nth-child(odd) td{background:#f4f8fc}#ncr .ncr-list-head{display:flex;justify-content:space-between;align-items:center;background:#fff;padding:10px 15px;font-size:13px;font-weight:700;color:#173b61}#ncr .ncr-tools[hidden]{display:none!important}#ncr .ncr-row-actions button:first-child{background:#e9f3ff;border-color:#bad5f4;color:#135b9a}#ncr .ncr-row-actions button:last-child{background:#fff7f5;border-color:#f0c5b9;color:#b42318}#ncr .ncr-pagination{padding:18px!important}#ncr .ncr-bulk{padding:8px 15px;margin:0!important;background:#fff}#ncr .ncr-head-actions{display:flex;gap:7px}#ncr .ncr-form{margin:12px 14px}';
document.head.appendChild(css);
var baseList=renderList,baseDraw=draw,expanded=true,filters={customer:'',product:'',lot:'',status:'',start:'',end:'',number:''};
function filtered(){return rows.filter(function(r){
 var d=dateOnly(r.occurred_on),has=function(v,q){return !q||String(v||'').toLowerCase().includes(q.trim().toLowerCase());};
 return has(r.customer,filters.customer)&&has(r.product,filters.product)&&has(r.lot,filters.lot)&&
 (!filters.status||r.status===filters.status)&&(!filters.start||d>=filters.start)&&
 (!filters.end||d<=filters.end)&&has(r.report_no,filters.number);
});}
renderList=function(){
 baseList();
 var head=root.querySelector('.ncr-head'),newBtn=root.querySelector('#ncr-new'),actions=document.createElement('div');
 actions.className='ncr-head-actions';newBtn.parentNode.insertBefore(actions,newBtn);
 var csv=document.createElement('button');csv.type='button';csv.className='ncr-btn';csv.textContent='CSV 내보내기';actions.append(csv,newBtn);
 csv.onclick=function(){
  var data=[['NCR 번호','발생일자','구분','고객사','제품명','LOT 번호','부적합 내용','담당자','상태']].concat(filtered().map(function(r){return [r.report_no,dateOnly(r.occurred_on),r.source,r.customer,r.product,r.lot,r.description,r.owner,stateName(r.status)];}));
  var csvText='\uFEFF'+data.map(function(row){return row.map(function(v){return '"'+String(v||'').replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
  var url=URL.createObjectURL(new Blob([csvText],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download='NCR_reports.csv';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
 };
 var tools=root.querySelector('.ncr-tools');
 tools.innerHTML='<label>고객사 <input data-ncr-filter="customer" placeholder="전체"></label>'+
 '<label>제품명 <input data-ncr-filter="product" placeholder="전체"></label>'+
 '<label>생산 LOT <input data-ncr-filter="lot" placeholder="전체"></label>'+
 '<label>진행상태 <select data-ncr-filter="status"><option value="">전체</option><option value="OPEN">발행</option><option value="IN_PROGRESS">조치중</option><option value="CLOSED">완료</option></select></label>'+
 '<label>발생기간 <button type="button" class="ncr-period-trigger" aria-haspopup="dialog" aria-expanded="false"><span class="ncr-period-value">기간 선택</span><span aria-hidden="true">▦</span></button><input type="hidden" data-ncr-filter="start"><input type="hidden" data-ncr-filter="end"></label>'+
 '<label>NCR 번호 <input data-ncr-filter="number" placeholder="전체"></label>'+
 '<input id="ncr-search" type="hidden" value=""><select id="ncr-filter" hidden><option value="">전체</option></select><span id="ncr-count" hidden></span>';
 tools.hidden=false;
 var bar=document.createElement('div');bar.className='ncr-list-head';
 bar.innerHTML='<span>▸ 부적합보고서 현황</span><span class="ncr-list-actions"><button class="ncr-btn" id="ncr-clear" type="button">조건 지우기</button><button class="ncr-btn ncr-icon-btn" id="ncr-refresh" type="button" title="조회" aria-label="조회"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg></button><button class="ncr-btn ncr-icon-btn" id="ncr-toggle" type="button" title="부적합보고서 현황 접기" aria-label="부적합보고서 현황 접기"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 14 5-5 5 5"></path></svg></button><span id="ncr-total" hidden></span></span>';
 tools.insertAdjacentElement('afterend',bar);
 var toggle=root.querySelector('#ncr-toggle');
 function syncCollapse(){
  toggle.innerHTML=expanded?'<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 14 5-5 5 5"></path></svg>':'<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg>';toggle.title=expanded?'부적합보고서 현황 접기':'부적합보고서 현황 펼치기';toggle.setAttribute('aria-label',toggle.title);
  ['.ncr-table-wrap','#ncr-pages','#ncr-bulk'].forEach(function(q){var el=root.querySelector(q);if(el)el.style.display=expanded?'':'none';});
 }
 toggle.onclick=function(){expanded=!expanded;syncCollapse();};
 syncCollapse();
 Object.keys(filters).forEach(function(k){var el=root.querySelector('[data-ncr-filter="'+k+'"]');if(el)el.value=filters[k];});
 var periodValue=root.querySelector('.ncr-period-value');if(periodValue)periodValue.textContent=filters.start&&filters.end?filters.start+' ~ '+filters.end:'기간 선택';
 root.querySelector('#ncr-clear').onclick=function(){Object.keys(filters).forEach(function(k){filters[k]='';var el=root.querySelector('[data-ncr-filter="'+k+'"]');if(el)el.value='';});var pv=root.querySelector('.ncr-period-value');if(pv)pv.textContent='기간 선택';page=1;draw();};
 root.querySelector('#ncr-refresh').onclick=function(){page=1;draw();load();};
 tools.querySelectorAll('[data-ncr-filter]').forEach(function(el){el.onchange=function(){filters[el.dataset.ncrFilter]=el.value;page=1;draw();};});
 draw();
};
draw=function(){
 if(view!=='list')return;
 var all=rows;try{rows=filtered();baseDraw();}finally{rows=all;}
 var total=root.querySelector('#ncr-total');if(total)total.textContent='총 '+filtered().length+'건';
 var pager=root.querySelector('#ncr-pages');if(pager) pager.style.display=(!expanded||filtered().length===0)?'none':'';
};
})();

render();if(root.classList.contains('active'))load();nav.addEventListener('click',function(){if(view!=='list'){view='list';render();}load();});
})();
/* Work inquiry date popup only. Preserve native date filters, row data and query handlers. */
(()=>{'use strict';let popup=null,trigger=null,start='',end='',picking=false,month=null;
const root=()=>document.querySelector('#ncr');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function close(focus=false){popup?.remove();popup=null;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
function position(){if(!popup||!trigger)return;const r=trigger.getBoundingClientRect();popup.style.width=r.width+'px';const box=popup.getBoundingClientRect();popup.style.left=Math.max(6,Math.min(r.left,innerWidth-box.width-6))+'px';popup.style.top=(r.bottom+box.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-box.height-4))+'px';}
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells='';for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';for(let n=1;n<=days;n++){const value=fmt(new Date(y,m,n)),weekday=(first+n-1)%7;cells+='<button type="button" data-day="'+value+'" class="'+(weekday===0||weekday===6?'weekend ':'')+(value===start||value===end?'chosen ':start&&end&&value>start&&value<end?'between ':'')+'" aria-label="'+value+'" aria-pressed="'+(value===start||value===end)+'"'+(value===today()?' aria-current="date"':'')+'>'+n+'</button>';}
popup.innerHTML='<div class="nwm-head"><button type="button" data-month="-12" aria-label="이전 해">«</button><button type="button" data-month="-1" aria-label="이전 달">‹</button><strong>'+y+'.'+String(m+1).padStart(2,'0')+'</strong><button type="button" data-month="1" aria-label="다음 달">›</button><button type="button" data-month="12" aria-label="다음 해">»</button></div><div class="nwm-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="nwm-week">'+v+'</span>').join('')+cells+'</div><div class="nwm-hint" aria-live="polite">'+(picking?start+' ~ 종료일 선택':'시작일 → 종료일 순서로 선택')+'</div><div class="nwm-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';position();}
function apply(a,b){const panel=root();if(!panel)return;const from=panel.querySelector('[data-ncr-filter="start"]'),to=panel.querySelector('[data-ncr-filter="end"]'),value=panel.querySelector('.ncr-period-value');if(!from||!to||!value)return;from.value=a;to.value=b;value.textContent=a&&b?a+' ~ '+b:'기간 선택';from.dispatchEvent(new Event('change',{bubbles:true}));to.dispatchEvent(new Event('change',{bubbles:true}));close(true);}
function open(button){if(popup){close(true);return;}const panel=root();if(!panel)return;trigger=button;start=panel.querySelector('[data-ncr-filter="start"]')?.value||'';end=panel.querySelector('[data-ncr-filter="end"]')?.value||'';picking=false;month=new Date((start||today())+'T12:00:00');month=new Date(month.getFullYear(),month.getMonth(),1);popup=document.createElement('div');popup.className='namo-ncr-mini-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','발생기간 선택');document.body.append(popup);trigger.setAttribute('aria-expanded','true');draw();popup.querySelector('[data-day="'+(start||today())+'"]')?.focus();}
window.addEventListener('click',event=>{const button=event.target.closest?.('#ncr .ncr-period-trigger');if(button){event.preventDefault();event.stopImmediatePropagation();open(button);return;}const action=event.target.closest?.('.namo-ncr-mini-calendar button');if(!action||!popup)return;event.preventDefault();event.stopImmediatePropagation();if(action.hasAttribute('data-month')){month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();}else if(action.dataset.day){if(!picking){start=action.dataset.day;end='';picking=true;draw();}else{end=action.dataset.day;if(end<start)[start,end]=[end,start];apply(start,end);}}else if(action.hasAttribute('data-today'))apply(today(),today());else if(action.hasAttribute('data-clear'))apply('','');else close(true);},true);
document.addEventListener('pointerdown',event=>{if(popup&&!event.target.closest('.namo-ncr-mini-calendar,#ncr .ncr-period-trigger'))close();},true);
window.addEventListener('keydown',event=>{if(popup&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(popup)close();},true);
const style=document.createElement('style');style.textContent=`
.namo-ncr-mini-calendar{position:fixed;z-index:2147483000;box-sizing:border-box;width:220px;max-width:calc(100vw - 12px);padding:8px;background:#fff;border:1px solid #b8c4d0;border-radius:3px;box-shadow:0 4px 14px #0002;color:#344254;font:12px Arial,"Malgun Gothic",sans-serif}
.namo-ncr-mini-calendar *{box-sizing:border-box}
.namo-ncr-mini-calendar button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:2px;padding:0;min-width:0;box-shadow:none}
.namo-ncr-mini-calendar button:focus-visible{outline:2px solid #499cef;outline-offset:-2px}
.namo-ncr-mini-calendar .nwm-head{display:flex;align-items:center;justify-content:space-between;height:29px;margin-bottom:7px;border-bottom:1px solid #e1e6eb}
.namo-ncr-mini-calendar .nwm-head strong{font-size:13px;color:#172b40}
.namo-ncr-mini-calendar .nwm-head button{width:24px;height:25px;font-size:18px;color:#83909c}
.namo-ncr-mini-calendar .nwm-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}
.namo-ncr-mini-calendar .nwm-days>*{height:25px;line-height:25px;text-align:center;font-size:11px}
.namo-ncr-mini-calendar .nwm-week{color:#89939e;font-weight:400}
.namo-ncr-mini-calendar .weekend{color:#e14d4d}
.namo-ncr-mini-calendar .nwm-days button:hover{background:#e4f0ff}
.namo-ncr-mini-calendar .nwm-days .between{background:#edf5ff}
.namo-ncr-mini-calendar .nwm-days .chosen{background:#2689ef;color:#fff}
.namo-ncr-mini-calendar .nwm-days [aria-current="date"]:not(.chosen){font-weight:700;box-shadow:inset 0 0 0 1px #8cbcf0}
.namo-ncr-mini-calendar .nwm-hint{font-size:10px;min-height:24px;padding-top:7px;color:#61768b;text-align:center}
.namo-ncr-mini-calendar .nwm-foot{display:flex;gap:4px;margin-top:5px;padding-top:7px;border-top:1px solid #e1e6eb}
.namo-ncr-mini-calendar .nwm-foot button{border:1px solid #d3d9df;background:#fff;height:23px;padding:0 7px;font-size:11px}
.namo-ncr-mini-calendar .nwm-foot [data-close]{margin-left:auto}
`;document.head.append(style);
})();

