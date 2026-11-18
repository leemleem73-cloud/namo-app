(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.qmesOqcRevision=factory();})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const text=v=>String(v??''),esc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function revision(row){
 if(row?.revisionPolicyVersion!==2)return 1;
 const n=Number(row.revision);
 return Number.isSafeInteger(n)&&n>=1?n:1;
}
function koreanDay(value){const ms=Date.parse(value);return Number.isFinite(ms)?new Date(ms+9*60*60*1000).toISOString().slice(0,10):'';}
function initial(now){return {revision:1,revisionPolicyVersion:2,modifiedAt:null,modifiedBy:'',...(now?{revisionDay:koreanDay(now)}:{})};}
function metadata(rows=[]){const list=Array.isArray(rows)?rows:[rows],latest=list.filter(r=>r?.modifiedAt&&Number.isFinite(Date.parse(r.modifiedAt))).sort((a,b)=>Date.parse(b.modifiedAt)-Date.parse(a.modifiedAt))[0];return {revision:Math.max(1,...list.map(revision)),modifiedAt:latest?.modifiedAt||null,modifiedBy:text(latest?.modifiedBy)};}
function stable(value){return value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(stable).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';}
function business(row){const result={...row};for(const k of ['revision','modifiedAt','modifiedBy','revisionDay','revisionPolicyVersion','revisionReason'])delete result[k];for(const k of ['date','customer','product','lot','inspector','remarks','shippingStatus','shipQty','manufactureDate','actualShipDate'])result[k]=text(result[k]);result.inspectionDecision=result.inspectionDecision||'자동판정';return result;}
function inspectionContent(row){
 const fields=['check','measurements','value','average','judge','inspectionDecision','standardRevision','spec','standard','method'];
 return Object.fromEntries(fields.map(key=>[key,key==='inspectionDecision'?(row[key]||'자동판정'):row[key]]));
}
function applyGroup(before,after,user,now,options={}){
 if(!Array.isArray(before)||!before.length||before.length!==after.length)throw Error('출하검사 수정 대상이 일치하지 않습니다.');
 const current=metadata(before);
 const changed=before.some((row,index)=>stable(business(row))!==stable(business(after[index])));
 const inspectionChanged=before.some((row,index)=>stable(inspectionContent(row))!==stable(inspectionContent(after[index])));
 const publish=options.publishRevision===true;
 if(!changed&&!publish)return {...current,changed:false,revisionRaised:false,rows:before.map(row=>({...row}))};
 if(!Number.isFinite(Date.parse(now)))throw Error('수정 시각을 확인할 수 없습니다.');
 const raise=publish||inspectionChanged;
 if(raise&&current.revision>=Number.MAX_SAFE_INTEGER)throw Error('리비전 번호를 확인해주세요.');
 const next={revision:current.revision+(raise?1:0),revisionPolicyVersion:2,revisionDay:koreanDay(now),modifiedAt:new Date(now).toISOString(),modifiedBy:text(user)};
 return {...next,changed:true,revisionRaised:raise,revisionReason:publish?'manual':inspectionChanged?'inspection':'correction',rows:after.map(row=>({...row,...next}))};
}

function formatModifiedAt(value){if(!value||!Number.isFinite(Date.parse(value)))return '—';const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)),get=k=>parts.find(p=>p.type===k)?.value;return get('year')+'-'+get('month')+'-'+get('day')+' '+get('hour')+':'+get('minute');}
function formFields(rows=[]){const m=metadata(rows);return '<div class="am-inline-cell oqc-revision-cell"><label>최종 수정일</label><input type="text" data-oqc-revision-meta="modifiedAt" readonly aria-readonly="true" value="'+esc(formatModifiedAt(m.modifiedAt))+'" title="내용을 수정해 저장하면 자동으로 기록됩니다."></div><div class="am-inline-cell oqc-revision-cell"><label>리비전</label><input type="text" data-oqc-revision-meta="revision" readonly aria-readonly="true" value="Rev.'+m.revision+'" title="Rev.1 기준 · 검사항목·측정값·판정 변경 시 자동 증가 · 리비전 발행으로 수동 증가"></div>';}
function installStyle(){if(typeof document==='undefined'||document.getElementById('oqc-revision-style'))return;const style=document.createElement('style');style.id='oqc-revision-style';style.textContent='.am-split[data-am-screen="outgoing"] .oqc-revision-date-row{grid-column:1/-1!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;min-width:0;width:100%}.am-split[data-am-screen="outgoing"] .oqc-revision-date-row>.am-inline-cell{min-width:0!important}.am-split[data-am-screen="outgoing"] .oqc-revision-cell input[readonly]{background:#f6f9fc!important;color:#526d88!important;cursor:default;font-family:inherit!important;font-size:12px!important}#outgoing .oqc-revision-list-cell{white-space:normal!important;overflow-wrap:normal!important;text-align:center!important}#outgoing .oqc-revision-badge{display:inline-block;padding:2px 6px;border-radius:3px;background:#e8f0f8;color:#166fbb;font-size:12px;font-weight:600;white-space:nowrap}@media(max-width:1000px){.am-split[data-am-screen="outgoing"] .oqc-revision-date-row{grid-template-columns:1fr!important}}';document.head.append(style);}
return {revision,initial,metadata,applyGroup,formatModifiedAt,formFields,installStyle};
});
