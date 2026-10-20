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
function render(){
 if(view==='list')return renderList();
 var edit=view==='edit',r=edit?(selected||{}):{},status=edit?(r.status||'OPEN'):'OPEN';
 root.innerHTML='<div class="ncr-head"><div><h1>부적합보고서 등록 및 조회</h1><p>부적합 발생 · 원인분석 · 시정조치 · 효과 확인</p></div><button class="ncr-btn" id="ncr-back" type="button">목록으로</button></div>'+
 '<form class="ncr-form" id="ncr-form"><h3 style="margin:0 0 18px;font-size:17px">'+(edit?'부적합보고서 상세 / 조치관리':'신규 NCR 발행')+(edit?' · '+esc(r.report_no):'')+'</h3><div class="ncr-grid">'+
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
 if(edit){['occurred_on','source','product','lot','customer','description'].forEach(function(k){var el=root.querySelector('[name="'+k+'"]');if(el)el.disabled=true;});}
 root.querySelector('#ncr-back').onclick=root.querySelector('#ncr-cancel').onclick=function(){view='list';render();};
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
async function save(event){
 event.preventDefault();
 var form=event.currentTarget,button=form.querySelector('#ncr-save');
 var data={};new FormData(form).forEach(function(v,k){data[k]=String(v);});
 if(!data.description&&!selected){notice('부적합 내용을 입력하세요.');return;}
 button.disabled=true;
 try{
  var edit=view==='edit',url='/api/qmes-ncr/reports'+(edit?'/'+selected.id:'');
  var result=await request(url,{method:edit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  selected=result;view='list';render();await load();
 }catch(e){notice(e.message);}finally{button.disabled=false;}
}
function printReport(r){
 var fields=[['NCR 번호',r.report_no],['발생일자',dateOnly(r.occurred_on)],['발생구분',r.source],['제품명',r.product],['LOT',r.lot],['고객사 / 협력사',r.customer],['부적합 내용',r.description],['긴급조치 / 격리',r.containment],['원인분석',r.root_cause],['시정조치 / 재발방지',r.corrective_action],['효과 확인',r.effectiveness],['담당자',r.owner],['처리상태',stateName(r.status)]];
 var w=window.open('','_blank');if(!w){notice('팝업 허용 후 다시 인쇄해 주세요.');return;}
 w.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+esc(r.report_no)+'</title><style>body{font:14px Arial,sans-serif;margin:35px;color:#172b44}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #94a3b8;padding:12px;text-align:left;white-space:pre-wrap}th{width:170px;background:#f1f5f9}@page{size:A4;margin:15mm}</style></head><body><h1>부적합보고서 (NCR)</h1><table>'+fields.map(function(p){return '<tr><th>'+esc(p[0])+'</th><td>'+esc(p[1]||'-')+'</td></tr>';}).join('')+'</table><script>window.onload=function(){window.print()};<\/script></body></html>');
 w.document.close();
}
render();if(root.classList.contains('active'))load();nav.addEventListener('click',function(){if(view!=='list'){view='list';render();}load();});
})();