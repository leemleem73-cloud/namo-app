(()=>{'use strict';
const selector='#mainWorkspace .iqc-pqc-layout',installed=new WeakSet();let records=[],loading=null,popup=null,active=null;
const clean=value=>String(value??'').trim(),norm=value=>clean(value).toLowerCase().replace(/\s+/g,'');
function flatten(value){
 if(typeof value==='string'){try{return flatten(JSON.parse(value));}catch{return [];}}
 if(Array.isArray(value))return value.flatMap(flatten);
 if(!value||typeof value!=='object')return [];
 if(value.payload)return flatten(value.payload);
 if(Array.isArray(value.data))return flatten(value.data);
 if(Array.isArray(value.rows))return flatten(value.rows);
 return [value];
}
function normalize(row){return {supplier:clean(row.supplier||row.supplierName||row.vendor||row['공급업체']),lot:clean(row.lot||row.materialLot||row.lotNo||row.material_lot||row['원료 LOT']),material:clean(row.item||row.materialName||row.material||row['원료명'])};}
function close(){popup?.remove();popup=null;if(active)active.input.setAttribute('aria-expanded','false');active=null;}
async function load(){
 if(loading)return loading;
 loading=(async()=>{
  await window.qmesAuthDataReady?.wait();
  const settled=await Promise.allSettled(['/api/iqc','/api/qmes-sync/iqc'].map(async url=>{const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});const body=await response.json();if(!response.ok||body.success===false)throw Error('입고내역 조회 실패');return flatten(body.data??body).map(normalize);}));
  const valid=settled.filter(result=>result.status==='fulfilled');if(!valid.length)throw Error('입고내역을 불러오지 못했습니다. 직접입력은 사용할 수 있습니다.');
  records=valid.flatMap(result=>result.value);return records;
 })().catch(error=>{loading=null;throw error;});return loading;
}
function choices(root,kind){
 const material=root.querySelector('#incomingMaterialName')?.value,supplier=root.querySelector('#incomingSupplier')?.value;
 let relevant=records.filter(row=>!material||!row.material||norm(row.material)===norm(material));
 if(!relevant.length)relevant=records;
 if(kind==='lot'&&supplier){const matched=relevant.filter(row=>norm(row.supplier)===norm(supplier));if(matched.length)relevant=matched;}
 return [...new Set(relevant.map(row=>row[kind]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko',{numeric:true}));
}
function place(){
 if(!popup||!active?.input.isConnected){close();return;}
 const rect=active.wrap.getBoundingClientRect(),width=Math.min(rect.width,innerWidth-16);popup.style.width=width+'px';
 popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-width-8))+'px';const height=popup.offsetHeight;
 popup.style.top=(rect.bottom+height+4<=innerHeight?rect.bottom+3:Math.max(8,rect.top-height-3))+'px';
}
async function open(root,input,wrap,kind){
 if(active?.input===input&&popup){close();return;}
 close();input.readOnly=true;active={root,input,wrap,kind};input.setAttribute('aria-expanded','true');
 popup=document.createElement('div');popup.className='iqc-receipt-choice-popup';popup.setAttribute('role','listbox');popup.setAttribute('aria-label',kind==='supplier'?'공급업체 선택':'원료 LOT 선택');document.body.append(popup);
 const current=popup;popup.textContent='입고내역을 불러오는 중입니다.';place();
 let error='';try{await load();}catch(e){error=e.message;}
 if(popup!==current)return;popup.replaceChildren();
 const values=choices(root,kind);if(input.value&&!values.includes(input.value))values.unshift(input.value);
 if(error){const message=document.createElement('div');message.className='iqc-receipt-choice-empty';message.textContent=error;popup.append(message);}
 else if(!values.length){const message=document.createElement('div');message.className='iqc-receipt-choice-empty';message.textContent='등록된 입고내역이 없습니다.';popup.append(message);}
 values.forEach(value=>{
  const option=document.createElement('button');option.type='button';option.className='iqc-receipt-option';option.textContent=value;option.setAttribute('role','option');option.setAttribute('aria-selected',String(input.value===value));
  option.onclick=()=>{
   input.value=value;input.readOnly=true;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
   if(kind==='lot'){
    const supplier=root.querySelector('#incomingSupplier'),matches=records.filter(row=>row.lot===value),vendors=[...new Set(matches.map(row=>row.supplier).filter(Boolean))];
    if(supplier&&!supplier.value&&vendors.length===1){supplier.value=vendors[0];supplier.dispatchEvent(new Event('change',{bubbles:true}));}
   }close();input.focus();
  };popup.append(option);
 });
 const manual=document.createElement('button');manual.type='button';manual.className='iqc-receipt-option iqc-receipt-manual';manual.textContent='직접입력';manual.setAttribute('role','option');
 manual.onclick=()=>{close();input.readOnly=false;input.focus();input.select();};
 popup.append(manual);place();
 popup.addEventListener('keydown',event=>{
  const buttons=[...popup.querySelectorAll('button')],at=buttons.indexOf(document.activeElement);
  if(event.key==='Escape'){event.preventDefault();close();input.focus();}
  if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();buttons[(at+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}
 });
}
function install(root){
 [['incomingSupplier','supplier'],['incomingMaterialLot','lot']].forEach(([id,kind])=>{
  const input=root.querySelector('#'+id);if(!input||installed.has(input))return;installed.add(input);
  const wrap=document.createElement('div');wrap.className='iqc-receipt-choice';input.before(wrap);wrap.append(input);
  input.readOnly=true;input.setAttribute('role','combobox');input.setAttribute('aria-haspopup','listbox');input.setAttribute('aria-expanded','false');input.autocomplete='off';
  const arrow=document.createElement('button');arrow.type='button';arrow.className='iqc-receipt-arrow';arrow.textContent='⌄';arrow.setAttribute('aria-label',kind==='supplier'?'공급업체 선택':'원료 LOT 선택');wrap.append(arrow);
  input.addEventListener('click',()=>{if(input.readOnly)open(root,input,wrap,kind);});arrow.onclick=()=>open(root,input,wrap,kind);
  input.addEventListener('keydown',event=>{if(event.key==='F4'||event.altKey&&event.key==='ArrowDown'||input.readOnly&&['Enter',' ','ArrowDown'].includes(event.key)){event.preventDefault();open(root,input,wrap,kind);}});
 });
}
document.addEventListener('pointerdown',event=>{if(popup&&!popup.contains(event.target)&&!active?.wrap.contains(event.target))close();},true);
window.addEventListener('resize',place);document.addEventListener('scroll',()=>{if(popup)place();},true);
const scan=()=>document.querySelectorAll(selector).forEach(install);new MutationObserver(scan).observe(document.getElementById('mainWorkspace'),{childList:true,subtree:true});scan();
const style=document.createElement('style');style.textContent=
'html body #mainWorkspace .iqc-pqc-layout .std-info>.am-inline-cell>label{justify-content:flex-start!important;text-align:left!important;padding-left:12px!important;padding-right:6px!important;box-sizing:border-box!important}html body #mainWorkspace .iqc-pqc-layout .iqc-receipt-choice{position:relative;width:100%;min-width:0;box-sizing:border-box;padding:0!important;border:0!important}html body #mainWorkspace .iqc-pqc-layout .iqc-receipt-choice>input{box-sizing:border-box!important;width:100%!important;max-width:100%!important;margin:0!important;padding-right:30px!important;background:#fff!important;color:#273e59!important}html body #mainWorkspace .iqc-pqc-layout .iqc-receipt-choice>input[readonly]{cursor:pointer!important}html body #mainWorkspace .iqc-pqc-layout .iqc-receipt-arrow{position:absolute;right:1px;top:1px;bottom:1px;width:27px;border:0;background:transparent;color:#476889;cursor:pointer;padding:0;font:13px Arial,sans-serif}.iqc-receipt-choice-popup{position:fixed;z-index:2147483300;box-sizing:border-box;max-height:260px;overflow:auto;background:#fff;border:1px solid #b8c9dd;border-radius:4px;box-shadow:0 5px 16px #15314b22;padding:3px;color:#273e59}.iqc-receipt-option{display:block;width:100%;min-height:30px;box-sizing:border-box;border:0;background:#fff;color:#273e59;text-align:left;padding:6px 10px;font:12px Arial,"Malgun Gothic",sans-serif;cursor:pointer;overflow-wrap:anywhere}.iqc-receipt-option:hover,.iqc-receipt-option:focus-visible{background:#eaf4ff;outline:none}.iqc-receipt-option[aria-selected=true]{color:#1678c5;font-weight:700}.iqc-receipt-manual{border-top:1px solid #e0e7ef;margin-top:3px;color:#176fb5}.iqc-receipt-choice-empty{padding:9px;font-size:11px;color:#7b8b9b}';
document.head.append(style);
})();
