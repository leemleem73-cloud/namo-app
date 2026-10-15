(()=>{
'use strict';
if(window.qmesCustomerSelectInstalled)return;window.qmesCustomerSelectInstalled=true;
const key='qmesCustomerList20261015';
let names;try{names=JSON.parse(localStorage.getItem(key))}catch(e){}
if(!Array.isArray(names))names=['현대자동차','삼성','LG'];
const checked=new Set();
const STORE='/api/qmes-sync/workorder';const STORE_KEY='master:customer-list:20261015';
async function loadShared(){try{const res=await fetch(STORE,{credentials:'include',cache:'no-store'});if(!res.ok)throw Error('조회 실패');const j=await res.json();const arr=Array.isArray(j.data)?j.data:[];const row=arr.find(x=>x.record_key===STORE_KEY);if(Array.isArray(row?.payload?.names)){names=row.payload.names;localStorage.setItem(key,JSON.stringify(names))}}catch(e){console.warn('QMES 고객사 공용 목록 조회 실패',e)}}
async function saveShared(){const res=await fetch(STORE,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:STORE_KEY,payload:{names}})});if(!res.ok)throw Error('중앙 DB 저장 실패');localStorage.setItem(key,JSON.stringify(names))}

function init(){
 const panel=document.querySelector('#work #namo-work-inquiry');
 const input=panel?.querySelector('[data-filter="0"]');
 if(!input||input.dataset.multiCustomer)return;
 input.dataset.multiCustomer='yes';input.readOnly=true;
 const holder=document.createElement('div');holder.className='qc-holder';
 const popup=document.createElement('div');popup.className='qc-popup';popup.hidden=true;holder.append(popup);input.parentNode.append(holder);
 let snapshot=[];
 function draw(){
  popup.replaceChildren();
  const search=document.createElement('input');search.placeholder='고객사 검색';search.className='qc-search';
  const list=document.createElement('div');list.className='qc-list';
  const buttons=document.createElement('div');buttons.className='qc-buttons';
  const action=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;buttons.append(b)};
  const render=()=>{
   list.replaceChildren();
   const item=(label,on,change)=>{const row=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=on;box.onchange=()=>change(box.checked);row.append(box,document.createTextNode(' '+label));list.append(row)};
   item('전체',names.length>0&&names.every(n=>checked.has(n)),v=>{checked.clear();if(v)names.forEach(n=>checked.add(n));render()});
   names.filter(n=>n.toLowerCase().includes(search.value.toLowerCase())).forEach(n=>item(n,checked.has(n),v=>{if(v)checked.add(n);else checked.delete(n);render()}));
  };
  search.oninput=render;popup.append(search,list,buttons);
  action('추가',()=>{const n=prompt('추가할 고객사명')?.trim();if(n&&!names.includes(n)){names.push(n);saveShared().catch(e=>alert(e.message));render()}});
  action('수정',()=>{if(checked.size!==1)return alert('수정할 고객사 1개만 선택하세요.');const old=[...checked][0],n=prompt('변경할 고객사명',old)?.trim();if(!n||(names.includes(n)&&n!==old))return;names=names.map(x=>x===old?n:x);checked.clear();checked.add(n);saveShared().catch(e=>alert(e.message));render()});
  action('삭제',()=>{if(checked.size!==1)return alert('삭제할 고객사 1개만 선택하세요.');const n=[...checked][0];if(!confirm(n+'을 선택 목록에서 삭제합니까? 기존 작업지시서는 유지됩니다.'))return;names=names.filter(x=>x!==n);checked.delete(n);saveShared().catch(e=>alert(e.message));render()});
  action('취소',()=>{checked.clear();snapshot.forEach(n=>checked.add(n));close()});
  action('확인',()=>{close();filter()});
  render();
 }
 function close(){popup.hidden=true;input.value=[...checked].join(', ')}
 function filter(){
  const rows=document.querySelectorAll('#work tr[data-work-saved]');let count=0;
  rows.forEach(row=>{
   const name=row.cells[2]?.textContent.trim()||'';
   const ok=checked.size===0||checked.has(name);
   if(!ok){row.hidden=true;row.style.display='none'}else if(row.style.display==='none'){row.hidden=false;row.style.display=''}
   if(row.style.display!=='none')count++;
  });
  const counter=panel.querySelector('.nwi-count'),total=document.querySelector('#work #nwi-list-total');
  if(counter)counter.textContent='조회 '+count+'건';if(total)total.textContent='총 '+count+'건';
 }
 input.onclick=()=>{if(!popup.hidden){close();return}snapshot=[...checked];draw();popup.hidden=false};
 panel.querySelector('#nwi-search')?.addEventListener('click',()=>setTimeout(filter,10));
 panel.querySelector('#nwi-clear')?.addEventListener('click',()=>{checked.clear();setTimeout(filter,10)});
 document.addEventListener('click',e=>{if(!popup.hidden&&e.target!==input&&!popup.contains(e.target))close()});
}
const style=document.createElement('style');style.textContent='.qc-holder{position:relative}.qc-popup{position:absolute;z-index:10000;top:2px;left:0;width:270px;padding:10px;background:white;box-shadow:0 8px 24px #15233933;border:1px solid #cbd5e1;border-radius:6px}.qc-popup[hidden]{display:none}.qc-search{width:100%;padding:6px}.qc-list{max-height:230px;overflow:auto}.qc-list label{display:flex!important;flex-direction:row!important;justify-content:flex-start!important;gap:9px!important;align-items:center!important;width:100%!important;min-height:30px!important;padding:5px 8px!important;white-space:nowrap!important;font-size:12px!important;line-height:18px!important;letter-spacing:normal!important}.qc-list input[type=checkbox]{appearance:auto!important;-webkit-appearance:checkbox!important;position:static!important;display:inline-block!important;flex:0 0 14px!important;width:14px!important;height:14px!important;min-width:14px!important;min-height:14px!important;margin:0!important;padding:0!important}.qc-popup .qc-search{box-sizing:border-box!important;min-width:0!important;height:34px!important}.qc-popup{box-sizing:border-box!important;width:270px!important}.qc-buttons button{font-size:12px!important;white-space:nowrap!important}.qc-buttons{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;margin-top:8px}.qc-buttons button{border:1px solid #ccd5e1;background:#f8fafc;padding:5px;border-radius:4px}';document.head.append(style);
new MutationObserver(init).observe(document.body,{childList:true,subtree:true});loadShared().then(init);
})();