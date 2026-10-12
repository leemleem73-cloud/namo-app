/* NAMO QMES work-order read screen v2 -- isolated view only. Original registration and API preserved. */
(function(){
'use strict';
if(window.__namoWorkOrderReadV2)return;window.__namoWorkOrderReadV2=true;
const root=document.getElementById('work');if(!root)return;
let records=[],chosen='',tab='materials',busy=false,search='',status='';
const css=`
#work .wo2{background:#fff;color:#24364c;border:1px solid #d8e0e9;font-size:13px}
#work .wo2 *{box-sizing:border-box}
#work .wo2-bar{background:#1688eb;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:13px 18px;gap:12px}
#work .wo2-bar strong{font-size:17px}#work .wo2-toolbar{display:flex;gap:7px;flex-wrap:wrap}
#work .wo2 button{border:1px solid #cad6e3;border-radius:3px;background:#fff;color:#29405b;cursor:pointer;padding:7px 12px;font-size:12px}
#work .wo2 button.primary,#work .wo2 .wo2-active{background:#1688eb;color:#fff;border-color:#1688eb}
#work .wo2-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:15px;background:#f7f9fc;border-bottom:1px solid #d8e0e9}
#work .wo2-label{display:flex;align-items:center;gap:8px;font-weight:600;min-width:0}
#work .wo2-label span{flex:0 0 83px}
#work .wo2 input,#work .wo2 select{height:34px;width:100%;min-width:0;background:#fff;border:1px solid #cbd6e2;border-radius:3px;padding:5px 9px;color:#273a53}
#work .wo2-section{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:#f1f4f8;border-bottom:1px solid #d5dde6}
#work .wo2-scroller{overflow:auto;max-height:360px}
#work .wo2 table{width:100%;border-collapse:collapse;white-space:nowrap}
#work .wo2 th{background:#eaf0f6;color:#34465b;text-align:center;font-size:12px;padding:10px;border:1px solid #d8e0e9}
#work .wo2 td{padding:9px;border:1px solid #e0e7ef;text-align:center;font-size:12px}
#work .wo2 tbody tr:hover{background:#eef7ff}
#work .wo2 tbody tr.selected{background:#dceeff}
#work .wo2 .wo2-link{padding:0;border:0;background:none;color:#137bd0;font-weight:700;text-decoration:underline}
#work .wo2-detail{margin-top:14px;border-top:1px solid #d8e0e9}
#work .wo2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:12px;gap:0}
#work .wo2-pair{display:flex;border:1px solid #e0e6ed;min-width:0;margin:-.5px}
#work .wo2-pair b{background:#f0f4f8;padding:10px;flex:0 0 100px;font-size:12px}
#work .wo2-pair span{padding:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#work .wo2-tabs{display:flex;gap:5px;padding:0 12px;border-bottom:1px solid #d8e0e9}
#work .wo2-tabs button{border-radius:3px 3px 0 0}
#work .wo2-panel{padding:12px;min-height:120px}
#work .wo2-empty{padding:28px;text-align:center;color:#8491a3}
@media(max-width:1050px){#work .wo2-filters,#work .wo2-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){#work .wo2-filters,#work .wo2-grid{grid-template-columns:1fr}}
`;
const style=document.createElement('style');style.textContent=css;style.id='namo-work-read-v2-style';document.head.appendChild(style);
function E(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el}
function btn(label,fn,cls){const x=E('button',cls,label);x.type='button';x.addEventListener('click',fn);return x}
function cell(row,key){return String(row?.fields?.[key]??'-')}
function active(){return root.classList.contains('active')}
function create(){
const wrap=E('div','wo2');wrap.dataset.newWorkScreen='1';
const bar=E('div','wo2-bar'),name=E('strong','', '작업지시서 등록 및 조회'),actions=E('div','wo2-toolbar');
actions.append(btn('새로고침',load),btn('엑셀',exportCsv),btn('+ 작업지시서 등록',()=>{if(typeof openNewForm==='function')openNewForm('work');else alert('기존 등록 화면을 열 수 없습니다.');},'primary'));
bar.append(name,actions);wrap.append(bar);
const filters=E('div','wo2-filters');
function filter(label,placeholder,change,kind='text'){
 const box=E('label','wo2-label'),lab=E('span','',label),input=document.createElement('input');input.type=kind;input.placeholder=placeholder;input.addEventListener('input',()=>change(input.value));box.append(lab,input);filters.append(box);
}
filter('통합검색','작업지시번호, 고객사, 제품명',v=>{search=v;render()});
const selLabel=E('label','wo2-label'),sp=E('span','','진행상태'),sel=document.createElement('select');
for(const v of ['전체','대기','진행','완료']){const op=E('option','',v);op.value=v==='전체'?'':v;sel.append(op)}
sel.addEventListener('change',()=>{status=sel.value;render()});selLabel.append(sp,sel);filters.append(selLabel);
filter('생산 LOT','생산 LOT 검색',v=>{wrap.dataset.lotQuery=v;render()});
filter('작업기간','기간 검색',v=>{wrap.dataset.dateQuery=v;render()});
wrap.append(filters);
const heading=E('div','wo2-section'),h=E('b','','▸ 작업지시 현황'),count=E('span','', '조회 중');heading.append(h,count);wrap.append(heading);
const scroller=E('div','wo2-scroller'),table=E('table'),thead=E('thead'),tr=E('tr');
for(const head of ['NO','작업지시번호','고객사','제품명','생산 LOT NO','설비명','작업자','계획수량','작업기간','진행상태','관리'])tr.append(E('th','',head));
thead.append(tr);const tbody=E('tbody');table.append(thead,tbody);scroller.append(table);wrap.append(scroller);
const detail=E('section','wo2-detail'),dhead=E('div','wo2-section'),dtitle=E('b','','작업지시 상세내역'),daction=E('div','wo2-toolbar');
daction.append(btn('전체 문서 보기',()=>{const r=records.find(x=>x.id===chosen);if(!r)return;if(typeof showRowDetail!=='function')return;const fake=document.createElement('tr');const headers=['NO',...(pageInfo?.work?.[2]||[])];headers.forEach((h,i)=>fake.append(E('td','',i===0?'1':cell(r,h))));showRowDetail('work',fake);}));
dhead.append(dtitle,daction);detail.append(dhead);
const grid=E('div','wo2-grid');detail.append(grid);
const tabs=E('div','wo2-tabs');
for(const [id,text] of [['materials','원료 투입내역'],['process','생산공정'],['lot','LOT 추적정보']])tabs.append(btn(text,()=>{tab=id;renderDetail()},id===tab?'wo2-active':''));
detail.append(tabs);const panel=E('div','wo2-panel');detail.append(panel);wrap.append(detail);
root.replaceChildren(wrap);
wrap._parts={tbody,count,grid,panel,tabs,dtitle};render();
}
function render(){
const w=root.querySelector('.wo2');if(!w)return;const p=w._parts;
const rows=records.filter(r=>{const f=r.fields||{},all=(r.id+' '+Object.values(f).join(' ')).toLowerCase();return (!search||all.includes(search.toLowerCase()))&&(!status||f['진행상태']===status)&&(!w.dataset.lotQuery||cell(r,'생산 LOT NO').toLowerCase().includes(w.dataset.lotQuery.toLowerCase()))&&(!w.dataset.dateQuery||cell(r,'작업기간').includes(w.dataset.dateQuery));});
p.count.textContent='총 '+rows.length+'건';p.tbody.replaceChildren();
rows.forEach((r,i)=>{const tr=E('tr',r.id===chosen?'selected':'');const values=[i+1,r.id,cell(r,'고객사'),cell(r,'제품명'),cell(r,'생산 LOT NO'),cell(r,'설비명'),cell(r,'작업자'),cell(r,'계획수량'),cell(r,'작업기간'),cell(r,'진행상태')];values.forEach((v,j)=>{const td=E('td');if(j===1)td.append(btn(v,()=>{chosen=r.id;render()},'wo2-link'));else td.textContent=v;tr.append(td)});const act=E('td');act.append(btn('수정',()=>{if(typeof openNewForm==='function')openNewForm('work',r)}));tr.append(act);tr.addEventListener('click',e=>{if(e.target.closest('button'))return;chosen=r.id;render()});p.tbody.append(tr)});
if(!rows.length){const tr=E('tr'),td=E('td','wo2-empty','등록된 작업지시서가 없습니다.');td.colSpan=11;tr.append(td);p.tbody.append(tr)}
renderDetail();
}
function renderDetail(){
const w=root.querySelector('.wo2');if(!w)return;const {grid,panel,tabs,dtitle}=w._parts;
grid.replaceChildren();panel.replaceChildren();
tabs.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('wo2-active', ['materials','process','lot'][i]===tab));
const r=records.find(x=>x.id===chosen);dtitle.textContent=r?'작업지시 상세내역 · '+r.id:'작업지시 상세내역';
if(!r){panel.append(E('div','wo2-empty','상단에서 작업지시번호를 선택하세요.'));return}
for(const k of ['작업지시번호','고객사','제품명','생산 LOT NO','설비명','작업자','계획수량','작업기간','진행상태']){const pair=E('div','wo2-pair');pair.append(E('b','',k),E('span','',k==='작업지시번호'?r.id:cell(r,k)));grid.append(pair)}
if(tab==='materials'){const tbl=E('table'),h=E('tr');['NO','원료명','원료 LOT','계획투입량(kg)','실투입량(kg)'].forEach(v=>h.append(E('th','',v)));const head=E('thead');head.append(h);tbl.append(head);const body=E('tbody');(Array.isArray(r.materials)?r.materials:[]).forEach((m,i)=>{const tr=E('tr');[i+1,m.name||'-',m.lot||'-',m.plan||'-',m.actual||'-'].forEach(v=>tr.append(E('td','',v)));body.append(tr)});tbl.append(body);panel.append(tbl);if(!body.children.length)panel.append(E('div','wo2-empty','등록된 원료 투입내역이 없습니다.'))}
else if(tab==='process')panel.append(E('div','wo2-empty','생산공정 상세는 기존 작업지시서의 전체 문서 보기에서 확인할 수 있습니다.'));
else panel.append(E('div','wo2-empty','생산 LOT: '+cell(r,'생산 LOT NO')+' · 수입검사 및 출하 연계 내역은 기존 LOT 추적 메뉴에서 확인할 수 있습니다.'));
}
async function load(){if(busy)return;busy=true;try{const res=await fetch('/api/qmes/work-orders',{credentials:'same-origin',cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);const json=await res.json();if(!json.success||!Array.isArray(json.data))throw Error('조회 형식 오류');records=json.data;if(chosen&&!records.some(x=>x.id===chosen))chosen='';render()}catch(err){console.error('[Work read v2]',err);const w=root.querySelector('.wo2');if(w)w._parts.count.textContent='공용 DB 조회 실패'}finally{busy=false}}
function exportCsv(){const headers=['작업지시번호','고객사','제품명','생산 LOT NO','설비명','작업자','계획수량','작업기간','진행상태'];const data=[headers,...records.map(r=>headers.map(k=>k==='작업지시번호'?r.id:cell(r,k)))];const csv='\uFEFF'+data.map(a=>a.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='NAMO_작업지시서.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
let timer=null;
function ensure(){if(!active())return;if(!root.querySelector('.wo2')){create();load()}}
const obs=new MutationObserver(()=>{if(timer)clearTimeout(timer);timer=setTimeout(ensure,60)});
obs.observe(root,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{if(e.target.closest('.sidebar .menu[data-page="work"]'))setTimeout(ensure,80)});
window.addEventListener('focus',()=>{if(active())load()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active())load()});
ensure();
})();