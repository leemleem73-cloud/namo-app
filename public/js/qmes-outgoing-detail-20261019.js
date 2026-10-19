/* OQC edit UI: preserve original identities and values; save only on explicit user action. */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateValue=value=>{const m=String(value??'').trim().match(/(\d{4})[.\/년-]\s*(\d{1,2})[.\/월-]\s*(\d{1,2})/);if(!m)return '';const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return d.getFullYear()===Number(m[1])&&d.getMonth()+1===Number(m[2])&&d.getDate()===Number(m[3])?m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'):'';};
const items=[['외관','이물질 혼입 없을 것','육안'],['입도(Dmax)','<10 μm','입도분석기'],['점도','1,500±300 cP','점도계'],['수분율','<2,000 ppm','수분측정기'],['고형분','20.0±1.0 wt%','Drying Oven'],['접착력','≥400 gf/12.7mm','인장시험기'],['절연저항','≥200 MΩ (Overflow)','절연저항계'],['전해액 안정성','미탈리','육안']];
const canonical=name=>String(name||'').trim()==='수분'?'수분율':String(name||'').trim();
const original=row=>Object.fromEntries(Object.entries(row).filter(([k])=>!k.startsWith('__')));
function values(row){if(Array.isArray(row?.measurements)&&row.measurements.length)return row.measurements.map(v=>String(v??''));return row?.value?String(row.value).split(/\s*\/\s*/):[];}
const style=document.createElement('style');style.textContent='.oqc-detail-measure-wrap{overflow:auto;margin-top:18px;border:1px solid #d5dce5}.oqc-detail-items{width:100%;min-width:880px;border-collapse:separate;border-spacing:0;table-layout:fixed;font:12px Pretendard,"Noto Sans KR",Arial,sans-serif}.oqc-detail-items th,.oqc-detail-items td{padding:8px;border:0;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;vertical-align:middle;text-align:center;color:#344054}.oqc-detail-items thead th{background:#e8f0f8;color:#244260;font-weight:600}.oqc-detail-items :is(th,td):last-child{border-right:0}.oqc-detail-items tbody tr:last-child td{border-bottom:0}.oqc-detail-items :is(input,select){width:100%;min-width:0;box-sizing:border-box;height:30px;border:1px solid #c7d6e5;border-radius:4px;padding:4px 6px;background:#fff;font:12px Pretendard,"Noto Sans KR",Arial,sans-serif;color:#243e5d}.oqc-detail-note{font-size:12px;color:#61768b;margin:10px 0}.oqc-save-error{color:#a02040;background:#fff1f3;border:1px solid #efb8c4;padding:10px;margin-top:12px}.oqc-detail-items caption{text-align:left;font-size:14px;font-weight:700;padding:10px;background:#fff;color:#173b61}';document.head.append(style);

const tableScope='html body #mainWorkspace .am-split[data-am-screen="outgoing"] table.oqc-detail-items';
const polish=document.createElement('style');polish.textContent=tableScope+'{width:100%!important;min-width:760px!important;table-layout:fixed!important;border-collapse:separate!important;border-spacing:0!important;border:1px solid #dce3ec!important;background:#fff!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:13px!important}'+tableScope+' :is(th,td){padding:10px 8px!important;border:0!important;border-right:1px solid #dce3ec!important;border-bottom:1px solid #dce3ec!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:13px!important;line-height:1.45!important;font-weight:500!important;color:#35435b!important;background:#fff!important;text-align:center!important;vertical-align:middle!important}'+tableScope+' thead th{height:46px!important;background:#f4f6fa!important;font-weight:700!important}'+tableScope+' tbody th{font-weight:700!important}'+tableScope+' tbody td{height:auto!important}'+tableScope+' :is(th,td):last-child{border-right:0!important}'+tableScope+' tbody tr:last-child>*{border-bottom:0!important}'+tableScope+' :is(input,select){width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;height:38px!important;border:1px solid #dce3ed!important;border-radius:6px!important;padding:0 10px!important;font-family:Arial,sans-serif!important;font-size:13px!important;font-weight:500!important;color:#26364a!important;background:#fff!important;text-align:center!important}'+tableScope+' [data-oqc-judge]{font-weight:700!important;border:0!important;background:transparent!important;border-radius:0!important;cursor:pointer!important}'+tableScope+' [data-oqc-judge][data-result="합격"]{color:#15803d!important}'+tableScope+' [data-oqc-judge][data-result="불합격"]{color:#dc2626!important}'+'.am-split[data-am-screen="outgoing"] .oqc-detail-measure-section{margin-top:16px!important}.am-split[data-am-screen="outgoing"] .oqc-detail-measure-section>.am-section-body{overflow-x:auto}';document.head.append(polish);
function measurementCell(name,index,value,disabled){
const attributes=' data-oqc-value="'+index+'" aria-label="'+esc(name)+' '+(index+1)+'차 측정값"'+(disabled?' disabled':'');
if(name==='외관'||name==='전해액 안정성'){const options=[...new Set(['',...(name==='외관'?['이상없음','이상있음']:['미탈리','탈리']),...(value?[value]:[])])];return '<select'+attributes+'>'+options.map(v=>'<option value="'+esc(v)+'"'+(v===value?' selected':'')+'>'+esc(v||'선택')+'</option>').join('')+'</select>';}
return '<input type="text"'+attributes+' value="'+esc(value)+'">';
}
window.qmesOpenOutgoingDetail=function(row){
const section=document.getElementById('outgoing'),record=section?._oqcRecords?.get(String(row.dataset.sourceKey||'')+'|'+String(row.dataset.sourceId||''));
if(!record){alert('출하검사 기록을 새로 조회한 뒤 다시 열어 주세요.');return;}
const records=record.__groupChecks?.length?record.__groupChecks:[record];
const field=(label,key,type,value)=>'<div class="am-inline-cell"><label>'+label+'</label><input type="'+type+'" data-oqc-field="'+key+'" value="'+esc(value)+'"></div>';
const inspector=records.map(r=>String(r.inspector||'').trim()).find(v=>v&&v!=='-')||'박현아';
let html='<div class="am-inline-edit-grid">'+field('검사일자','date','date',dateValue(record.date||record.shipDate))+field('고객사','customer','text',record.customer||'')+field('제품명','product','text',record.product||'')+field('완제품 LOT','lot','text',record.lot||'')+field('검사자','inspector','text',inspector)+'<div class="am-inline-cell full"><label>비고</label><textarea data-oqc-field="remarks" placeholder="비고 입력">'+esc(record.remarks||'')+'</textarea></div>'+'</div><div class="am-section oqc-detail-measure-section"><div class="am-section-head"><b>검사항목</b><span>항목별 측정값 입력</span></div><div class="am-section-body"><table class="oqc-detail-items"><colgroup>'+[5,12,20,14,13,13,13,10].map(n=>'<col style="width:'+n+'%">').join('')+'</colgroup><thead><tr>'+['No.','검사항목','검사기준','검사방법 / 기기','1차','2차','3차','판정'].map(v=>'<th>'+v+'</th>').join('')+'</tr></thead><tbody>';
items.forEach(([name,spec,method],index)=>{const source=records.find(r=>canonical(r.check)===name),measurements=values(source),judge=String(source?.judge||source?.result||'검토필요'),options=[...new Set(['검토필요','대기','합격','불합격',judge])];
html+='<tr data-oqc-item="'+index+'"><td>'+(index+1)+'</td><th>'+esc(name)+'</th><td>'+esc(spec)+'</td><td>'+esc(method)+'</td>'+[0,1,2].map(i=>'<td>'+measurementCell(name,i,String(measurements[i]??''),!source)+'</td>').join('')+'<td><select data-oqc-judge data-result="'+esc(judge)+'" aria-label="'+esc(name)+' 판정"'+(!source?' disabled':'')+'>'+options.map(v=>'<option'+(v===judge?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></td></tr>';});
html+='</tbody></table></div></div><div class="oqc-save-error" role="alert" hidden></div>';
openModal('출하검사 상세',amaranthScreen('outgoing',html,'detail','출하검사 상세 / 수정',row),'<button class="btn" id="modalCancel" type="button">목록</button><button class="btn primary" id="modalSave" type="button">저장</button>');
const pane=document.querySelector('.am-split[data-am-screen="outgoing"]'),oldSave=document.getElementById('modalSave'),save=oldSave.cloneNode(true);oldSave.replaceWith(save);
const warning=pane.querySelector('.oqc-save-error');
const topActions=pane.querySelector('.am-detail-actions');if(topActions)topActions.style.setProperty('display','none','important');
pane.querySelectorAll('[data-oqc-judge]').forEach(el=>el.addEventListener('change',()=>{el.dataset.result=el.value;}));
const note=pane.querySelector('.am-detail-note');if(note)note.textContent='저장 버튼을 누르면 변경 내용이 출하검사 목록에 반영됩니다.';
save.addEventListener('click',async()=>{
const fields=Object.fromEntries([...pane.querySelectorAll('[data-oqc-field]')].map(el=>[el.dataset.oqcField,el.value.trim()]));
if(!dateValue(fields.date)||!fields.lot||!fields.inspector){warning.hidden=false;warning.textContent='검사일자, LOT, 검사자를 확인해 주세요.';return;}
const targets=records.map(source=>{
const index=items.findIndex(([name])=>canonical(source.check)===name),patch={};
if(index>=0){const tr=pane.querySelector('[data-oqc-item="'+index+'"]'),entered=[...tr.querySelectorAll('[data-oqc-value]')].map(el=>el.value.trim()),before=values(source),oldValues=[0,1,2].map(i=>String(before[i]??''));
if(JSON.stringify(entered)!==JSON.stringify(oldValues))patch.measurements=entered;
const judge=tr.querySelector('[data-oqc-judge]').value;
if(judge!==String(source.judge||source.result||'검토필요'))patch.judge=judge;
}
return{recordKey:source.__sourceRecordKey,rowId:source.__sourceRowId,expected:original(source),patch};
});
try{
save.disabled=true;warning.hidden=true;
const response=await fetch('/api/qmes-sync/oqc/save-detail',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields,targets})});
const result=await response.json().catch(()=>({}));
if(!response.ok||result.success===false)throw Error(result.message||'출하검사 저장에 실패했습니다.');
closeModal();await loadHistoricalInspectionRows(section,'outgoing');toast('출하검사 저장 완료');
}catch(error){warning.hidden=false;warning.textContent=error.message;}finally{save.disabled=false;}
});
};
})();
