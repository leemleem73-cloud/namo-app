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
 const popup=document.createElement('div');popup.className='qc-popup';popup.hidden=true;holder.append(popup);document.body.append(holder);
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
 function place(){const rect=input.getBoundingClientRect();popup.style.left=Math.round(rect.left)+'px';popup.style.top=Math.round(rect.bottom+2)+'px';popup.style.width='190px'}
 input.onclick=()=>{if(!popup.hidden){close();return}snapshot=[...checked];draw();place();popup.hidden=false};
 window.addEventListener('scroll',()=>{if(!popup.hidden)place()},true);
 window.addEventListener('resize',()=>{if(!popup.hidden)place()});
 panel.querySelector('#nwi-search')?.addEventListener('click',()=>setTimeout(filter,10));
 panel.querySelector('#nwi-clear')?.addEventListener('click',()=>{checked.clear();setTimeout(filter,10)});
 document.addEventListener('click',e=>{if(!popup.hidden&&e.target!==input&&!popup.contains(e.target))close()});
}
const style=document.createElement('style');style.textContent=".qc-holder{position:fixed;top:0;left:0;width:0;height:0;z-index:10000;pointer-events:none}.qc-popup{position:fixed;z-index:10000;top:0;left:0;pointer-events:auto;box-sizing:border-box;width:185px;padding:4px;background:#fff;border:1px solid #b9c0c8;box-shadow:0 4px 12px #0002;border-radius:2px}.qc-popup[hidden]{display:none}.qc-popup .qc-search{display:block;box-sizing:border-box;width:100%;height:27px;min-width:0;padding:3px 6px;border:1px solid #c9d2dd;font-size:12px}.qc-list{max-height:210px;overflow-y:auto;overflow-x:hidden;margin:4px 0;background:#f0f7ff}.qc-list label{display:flex!important;flex-direction:row!important;justify-content:flex-start!important;gap:6px!important;align-items:center!important;box-sizing:border-box!important;width:100%!important;height:25px!important;min-height:25px!important;padding:3px 6px!important;white-space:nowrap!important;font-size:12px!important;line-height:18px!important;letter-spacing:normal!important;cursor:pointer}.qc-list label:first-child{background:white;border-bottom:1px solid #e1e5e9}.qc-list input[type=checkbox]{appearance:auto!important;-webkit-appearance:checkbox!important;position:static!important;display:inline-block!important;flex:0 0 13px!important;width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;margin:0!important;padding:0!important}.qc-buttons{display:flex;gap:4px;justify-content:center;align-items:center;flex-wrap:wrap;padding-top:5px;border-top:1px solid #e2e6eb}.qc-buttons button{font-size:11px!important;white-space:nowrap!important;background:white;border:1px solid #cbd1d8;padding:3px 5px;border-radius:2px;cursor:pointer}.qc-buttons button:nth-last-child(-n+2){background:#f8fafc}";document.head.append(style);

function initCreate(){
 const input=[...document.querySelectorAll('input[placeholder="고객사명 직접 입력"]')].find(el=>el.offsetParent!==null&&!el.dataset.qcCreate);
 if(!input)return;
 input.dataset.qcCreate='1';
 const box=document.createElement('div');box.className='qc-create-picker';box.hidden=true;document.body.appendChild(box);
 function place(){const rect=input.getBoundingClientRect();box.style.left=Math.round(rect.left)+'px';box.style.top=Math.round(rect.bottom+2)+'px';box.style.width=Math.max(190,Math.min(250,rect.width))+'px'}
 function close(){box.hidden=true}
 function render(searchTerm=''){
  box.replaceChildren();
  const search=document.createElement('input');search.type='search';search.placeholder='고객사 검색';search.className='qc-create-search';search.value=searchTerm;
  const list=document.createElement('div');list.className='qc-create-list';
  const footer=document.createElement('div');footer.className='qc-create-footer';
  box.append(search,list,footer);
  const row=(name)=>{
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=input.value.trim()===name;
   check.onchange=()=>{input.value=check.checked?name:'';input.dispatchEvent(new Event('input',{bubbles:true}));close()};
   label.append(check,document.createTextNode(' '+name));list.append(label);
  };
  row('전체');
  names.filter(x=>x.toLowerCase().includes(searchTerm.toLowerCase())).forEach(row);
  search.oninput=()=>render(search.value);
  const action=(title,fn)=>{const button=document.createElement('button');button.type='button';button.textContent=title;button.onclick=fn;footer.append(button)};
  action('추가',async()=>{const value=prompt('추가할 고객사명')?.trim();if(!value||names.includes(value))return;names.push(value);try{await saveShared();render()}catch(e){names=names.filter(n=>n!==value);alert('공용 DB 저장 실패')}});
  action('수정',async()=>{const old=input.value.trim();if(!names.includes(old))return alert('수정할 고객사를 먼저 선택하세요.');const value=prompt('고객사명 수정',old)?.trim();if(!value||names.includes(value)&&value!==old)return;names=names.map(x=>x===old?value:x);try{await saveShared();input.value=value;render()}catch(e){names=names.map(x=>x===value?old:x);alert('공용 DB 저장 실패')}});
  action('삭제',async()=>{const old=input.value.trim();if(!names.includes(old))return alert('삭제할 고객사를 먼저 선택하세요.');if(!confirm(old+' 고객사를 목록에서 삭제합니까? 기존 작업지시서는 유지됩니다.'))return;names=names.filter(x=>x!==old);try{await saveShared();input.value='';render()}catch(e){names.push(old);alert('공용 DB 저장 실패')}});
  action('취소',close);action('확인',close);
 }
 const open=()=>{render();place();box.hidden=false};
 input.addEventListener('focus',open);input.addEventListener('click',open);
 document.addEventListener('click',e=>{if(!box.hidden&&e.target!==input&&!box.contains(e.target))close()});
 window.addEventListener('resize',()=>{if(!box.hidden)place()});
 window.addEventListener('scroll',()=>{if(!box.hidden)place()},true);
}
document.addEventListener('click',function(event){
 const item=event.target.closest?.('.am-split[data-am-screen="work"] .am-list-item');
 if(!item)return;
 const number=item.querySelector('b')?.textContent.trim();
 const data=typeof window.qmesGetWorkOrders==='function'?window.qmesGetWorkOrders():[];
 const order=data.find(o=>String(o?.fields?.['작업지시번호']||o?.id||'').trim()===number);
 if(!order||typeof openNewForm!=='function')return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 openNewForm('work',order);
},true);
const createStyle=document.createElement('style');
createStyle.textContent='.qc-create-picker{position:fixed;z-index:200000;box-sizing:border-box;background:white;border:1px solid #bdc8d7;box-shadow:0 7px 20px #11223333;padding:5px;border-radius:4px}.qc-create-picker[hidden]{display:none}.qc-create-search{box-sizing:border-box;width:100%;height:30px;font-size:12px;padding:4px 7px}.qc-create-list{max-height:160px;overflow:auto}.qc-create-list label{display:flex!important;align-items:center!important;gap:7px!important;padding:5px!important;height:26px!important;min-height:26px!important;white-space:nowrap!important;font-size:12px!important}.qc-create-list input[type=checkbox]{appearance:auto!important;-webkit-appearance:checkbox!important;position:static!important;width:14px!important;height:14px!important;min-width:14px!important;margin:0!important;padding:0!important}.qc-create-footer{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;padding-top:5px;border-top:1px solid #eee}.qc-create-footer button{font-size:11px;padding:4px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:3px}';
document.head.append(createStyle);

new MutationObserver(()=>{init();initCreate()}).observe(document.body,{childList:true,subtree:true});loadShared().then(()=>{init();initCreate()});
})();