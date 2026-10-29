(()=>{'use strict';
const mounted=new WeakSet();let history=[],pending=null,loadedAt=0;
const clean=v=>String(v??'').trim();
function unwrap(v){
 if(typeof v==='string'){try{return unwrap(JSON.parse(v));}catch{return [];}}
 if(Array.isArray(v))return v.flatMap(unwrap);
 if(!v||typeof v!=='object'||v.deleted)return [];
 if(v.payload)return unwrap(v.payload);if(v.data)return unwrap(v.data);if(Array.isArray(v.rows))return unwrap(v.rows);return [v];
}
function normalize(row){return {supplier:clean(row.supplier||row.supplierName||row.vendor||row['공급업체']),lot:clean(row.lot||row.materialLot||row.lotNo||row.material_lot||row['원료 LOT'])};}
async function load(){
 if(pending&&Date.now()-loadedAt<30000)return pending;loadedAt=Date.now();
 pending=(async()=>{await window.qmesAuthDataReady?.wait();const results=await Promise.allSettled(['/api/iqc','/api/qmes-sync/iqc'].map(async url=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'}),body=await r.json();if(!r.ok||body.success===false)throw Error('조회 실패');return unwrap(body.data??body).map(normalize);}));const done=results.filter(r=>r.status==='fulfilled');if(!done.length)throw Error('수입검사 내역을 불러오지 못했습니다.');history=done.flatMap(r=>r.value);return history;})().catch(e=>{pending=null;throw e;});return pending;
}
function install(control,kind){
 if(mounted.has(control))return;mounted.add(control);
 let select=control;
 if(control.tagName!=='SELECT'){
  select=document.createElement('select');select.id=control.id;select.className=control.className;
  if(control.value){const option=new Option(control.value,control.value,true,true);select.append(option);}
  control.replaceWith(select);mounted.add(select);
 }
 const manual=document.createElement('input');manual.type='text';manual.className='iqc-history-manual';manual.placeholder=kind==='supplier'?'공급업체 직접입력':'원료 LOT 직접입력';manual.hidden=true;manual.style.display='none';select.after(manual);
 function populate(){
  const current=select.value==='__manual__'?'':select.value;
  const values=[...new Set(history.map(row=>row[kind]).filter(Boolean))];if(current&&!values.includes(current))values.unshift(current);
  select.replaceChildren(new Option(kind==='supplier'?'공급업체 선택':'원료 LOT 선택',''));
  values.forEach(value=>select.append(new Option(value,value)));
  select.append(new Option('직접입력','__manual__'));select.value=current;
 }
 populate();
 const ready=()=>load().then(populate).catch(error=>{select.title=error.message;});
 ready();select.addEventListener('focus',()=>{if(!pending||Date.now()-loadedAt>=30000)ready();});
 select.addEventListener('change',()=>{
  if(select.value==='__manual__'){
   select.value='';manual.hidden=false;manual.style.display='block';manual.focus();return;
  }
  manual.hidden=true;manual.style.display='none';
 });
 manual.addEventListener('input',()=>{
  const value=manual.value;let option=[...select.options].find(option=>option.dataset.manualValue==='1');
  if(!option){option=new Option('','');option.dataset.manualValue='1';select.insertBefore(option,select.lastElementChild);}
  option.value=value;option.textContent=value;select.value=value;select.dispatchEvent(new Event('input',{bubbles:true}));
 });
 manual.addEventListener('blur',()=>select.dispatchEvent(new Event('input',{bubbles:true})));
}
function scan(){document.querySelectorAll('#mainWorkspace #incomingSupplier,#mainWorkspace #incomingMaterialLot').forEach(control=>install(control,control.id==='incomingSupplier'?'supplier':'lot'));}
const root=document.getElementById('mainWorkspace');if(root)new MutationObserver(scan).observe(root,{childList:true,subtree:true});scan();
const style=document.createElement('style');style.textContent=
'html body #mainWorkspace :is(#incomingSupplier,#incomingMaterialLot){appearance:auto!important;box-sizing:border-box!important;background:#fff!important;color:#273e59!important;padding-right:8px!important}html body #mainWorkspace .iqc-history-manual{box-sizing:border-box!important;width:calc(100% - 16px)!important;margin:4px 8px!important;height:30px!important;border:1px solid #cbd8e6!important;border-radius:2px!important;font:inherit!important;background:#fff!important}html body #mainWorkspace .iqc-history-manual[hidden]{display:none!important}html body #mainWorkspace .std-inspection[data-inspection-type=incoming] .am-inline-cell>label,html body #mainWorkspace .iqc-pqc-layout .std-info>.am-inline-cell>label{justify-content:flex-start!important;text-align:left!important;padding-left:12px!important;padding-right:6px!important}';
document.head.append(style);
})();
