(()=>{'use strict';if(window.__qmesPurchaseUpgrade)return;window.__qmesPurchaseUpgrade=true;
function init(){const page=document.querySelector('#purchase');const shell=page?.querySelector('.module-shell');if(!shell||shell.dataset.purchaseUpgrade)return;shell.dataset.purchaseUpgrade='1';
const toolbar=shell.querySelector('.module-toolbar'),filters=toolbar?.querySelector('.filters');if(!filters)return;
const search=filters.querySelector('.search-input'),dates=[...filters.querySelectorAll('input[type=date]')];if(search)search.placeholder='발주번호 / 공급업체 / 품목명 검색';
const more=document.createElement('div');more.className='qpu-more';
more.innerHTML='<label>공급업체 <input class="qpu-supplier" placeholder="거래처 검색" readonly></label><label>발주상태 <select class="qpu-status"><option value="">전체</option><option>대기</option><option>진행</option><option>완료</option></select></label><button class="btn qpu-search" type="button">조회</button><button class="btn qpu-clear" type="button">초기화</button>';filters.append(more);
const detail=document.createElement('section');detail.className='qpu-detail';detail.innerHTML='<header>발주내역 <small>상단 발주현황에서 항목을 선택하세요.</small></header><div class="qpu-scroll"><table><thead><tr><th>NO</th><th>품목명</th><th>규격</th><th>단위</th><th>발주수량</th><th>단가</th><th>공급가</th><th>부가세</th><th>합계</th><th>입고예정일</th><th>IQC</th></tr></thead><tbody><tr><td colspan="11">발주 내역을 선택하면 표시됩니다.</td></tr></tbody></table></div>';shell.append(detail);
const supplier=more.querySelector('.qpu-supplier'),status=more.querySelector('.qpu-status'),body=shell.querySelector('.module-body tbody');
let chosen='';
async function vendors(){const out=new Set();document.querySelectorAll('#incoming tbody tr').forEach(tr=>{const v=tr.cells?.[2]?.textContent.trim();if(v&&v!=='-')out.add(v)});
try{const x=await fetch('/api/qmes-sync/iqc',{credentials:'include',cache:'no-store'});if(x.ok){const data=(await x.json()).data||[];data.forEach(r=>{const p=r.payload||{};[p.supplier,p.vendor,p.supplierName,p['공급업체']].forEach(v=>{if(typeof v==='string'&&v.trim())out.add(v.trim())})})}}catch(e){}
return [...out].sort((a,b)=>a.localeCompare(b,'ko'))}
const popup=document.createElement('div');popup.className='qpu-popup';popup.hidden=true;popup.innerHTML='<div class="qpu-head"><b>거래처 선택</b><button type="button" class="qpu-x">×</button></div><input class="qpu-find" placeholder="거래처명 검색"><div class="qpu-list"></div><footer><button class="qpu-cancel" type="button">취소</button><button class="qpu-ok" type="button">확인</button></footer>';document.body.append(popup);
let selected='';const list=popup.querySelector('.qpu-list'),find=popup.querySelector('.qpu-find');
function showVendors(){list.replaceChildren();(popup._vendors||[]).filter(x=>x.toLowerCase().includes(find.value.toLowerCase())).forEach(name=>{const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='qpu-vendor';radio.checked=name===selected;radio.onchange=()=>selected=name;label.append(radio,document.createTextNode(name));list.append(label)});if(!list.children.length)list.textContent='수입검사에 등록된 공급업체가 없습니다.'}
supplier.onclick=async()=>{const rect=supplier.getBoundingClientRect();popup.style.left=Math.max(8,Math.min(window.innerWidth-268,rect.left))+'px';popup.style.top=Math.max(8,Math.min(window.innerHeight-310,rect.bottom+4))+'px';popup.hidden=false;list.textContent='불러오는 중';popup._vendors=await vendors();find.value='';selected=chosen;showVendors()};
find.oninput=showVendors;popup.querySelector('.qpu-x').onclick=popup.querySelector('.qpu-cancel').onclick=()=>popup.hidden=true;popup.querySelector('.qpu-ok').onclick=()=>{chosen=selected;supplier.value=chosen;popup.hidden=true;filter()};
let drag=false,sx=0,sy=0,px=0,py=0;const head=popup.querySelector('.qpu-head');head.onpointerdown=e=>{if(e.target.closest('button'))return;drag=true;sx=e.clientX;sy=e.clientY;px=popup.offsetLeft;py=popup.offsetTop;head.setPointerCapture(e.pointerId)};head.onpointermove=e=>{if(!drag)return;popup.style.left=Math.max(0,Math.min(innerWidth-popup.offsetWidth,px+e.clientX-sx))+'px';popup.style.top=Math.max(0,Math.min(innerHeight-50,py+e.clientY-sy))+'px'};head.onpointerup=head.onpointercancel=()=>drag=false;
function filter(){[...body.querySelectorAll('tr')].forEach(tr=>{const cells=tr.cells;const name=cells?.[2]?.textContent||'';const st=cells?.[6]?.textContent||'';const match=(!chosen||name.includes(chosen))&&(!status.value||st.includes(status.value));tr.hidden=!match})}
more.querySelector('.qpu-search').onclick=filter;more.querySelector('.qpu-clear').onclick=()=>{chosen='';supplier.value='';status.value='';filter();if(search)search.value='';dates.forEach(d=>d.value='')};
const purchaseTable=shell.querySelector('.module-body table');
if(purchaseTable){
 const hdr=purchaseTable.querySelector('thead tr');
 if(hdr&&!hdr.querySelector('.qpu-order-number')){const th=document.createElement('th');th.className='qpu-order-number';th.textContent='발주번호';hdr.insertBefore(th,hdr.children[1]||null)}
 function decorateRows(){
  [...body.querySelectorAll('tr')].forEach(tr=>{
   if(tr.dataset.qpuDecorated)return;
   const cells=tr.cells;
   if(!cells||cells.length<8)return;
   const td=document.createElement('td');td.className='qpu-order-number';
   const key=tr.dataset.orderNumber||tr.dataset.purchaseNo||tr.dataset.orderId||'';
   td.textContent=key||'—';td.title=key?'발주번호':'발주번호 미등록';
   tr.insertBefore(td,tr.cells[1]||null);tr.dataset.qpuDecorated='1';
  });
 }
 const watch=new MutationObserver(decorateRows);watch.observe(body,{childList:true});decorateRows();
}
body.addEventListener('click',e=>{const tr=e.target.closest('tr');if(!tr||e.target.closest('button,input,a'))return;const c=[...tr.cells].filter(x=>!x.classList.contains('qpu-order-number'));if(c.length<7)return;const tbody=detail.querySelector('tbody');tbody.replaceChildren();const row=document.createElement('tr');[c[0]?.textContent||'',c[3]?.textContent||'','—','kg',c[4]?.textContent||'','—','—','—','—',c[5]?.textContent||'',c[7]?.textContent||''].forEach(v=>{const td=document.createElement('td');td.textContent=v;row.append(td)});tbody.append(row);detail.querySelector('small').textContent='선택한 발주 기본 정보 (금액 미등록 항목은 — 표시)'});
}
const css=document.createElement('style');css.textContent='#purchase .qpu-more{display:flex;align-items:end;flex-wrap:wrap;gap:10px;padding:12px 16px;background:#f4f8fc;border-bottom:1px solid #e2eaf2}#purchase .qpu-more label{font-size:12px;color:#36516d;display:flex;gap:6px;align-items:center}#purchase .qpu-more input,#purchase .qpu-more select{height:34px;padding:5px 10px;box-sizing:border-box;background:white;border:1px solid #d4e0ed;border-radius:5px}#purchase .qpu-detail{margin-top:14px;background:white;border:1px solid #e1e9f3;border-radius:8px;overflow:hidden}#purchase .qpu-detail header{padding:14px;background:#ecf3fa;color:#234767;font-weight:700}#purchase .qpu-detail small{color:#70849b;margin-left:10px;font-weight:400}#purchase .qpu-scroll{overflow:auto}#purchase .qpu-detail table{width:100%;border-collapse:collapse;white-space:nowrap;text-align:center;font-size:12px}#purchase .qpu-detail th{background:#f6f9fd;padding:12px;border:1px solid #e6edf5}#purchase .qpu-detail td{padding:14px;border:1px solid #e6edf5}.qpu-popup{position:fixed;z-index:100000;width:min(540px,95vw);height:min(430px,80vh);resize:both;overflow:auto;background:#fff;border:1px solid #b9cadd;border-radius:8px;box-shadow:0 14px 35px #21395555;display:flex;flex-direction:column}.qpu-popup[hidden]{display:none}.qpu-head{display:flex;justify-content:space-between;align-items:center;padding:12px;background:#eaf2fa;cursor:move;user-select:none}.qpu-head button,.qpu-popup footer button{padding:5px 12px;border:1px solid #c6d5e4;background:white;border-radius:4px}.qpu-find{margin:12px;padding:9px;border:1px solid #d2dfec;border-radius:4px}.qpu-list{flex:1;overflow:auto;margin:0 12px;border:1px solid #e5eaf1}.qpu-list label{display:flex;gap:10px;align-items:center;padding:10px;border-bottom:1px solid #e5eaf1}.qpu-popup footer{display:flex;justify-content:flex-end;gap:8px;padding:12px}';document.head.append(css);
const tidy=document.createElement('style');tidy.textContent='#purchase .module-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px}#purchase .module-toolbar .filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;min-width:0}#purchase .module-toolbar .filters>.input.search-input{width:240px;min-width:210px}#purchase .module-toolbar .filters>input[type=date]{width:150px;min-width:140px}#purchase .module-toolbar .table-tools{margin-left:auto;display:flex;gap:7px;flex-shrink:0}#purchase .qpu-more{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0;background:transparent;border:0}#purchase .qpu-more label{white-space:nowrap;font-weight:500}#purchase .qpu-more input{width:170px}#purchase .qpu-more select{width:100px}#purchase .qpu-detail{margin-top:8px;border-radius:0 0 8px 8px}#purchase .module-body{min-height:125px}#purchase .module-shell{overflow:visible}';document.head.append(tidy);
const extra=document.createElement('style');extra.textContent='#purchase .module-body tbody tr{cursor:pointer}#purchase .module-body tbody tr:hover{background:#f2f7fe!important}#purchase .module-body .qpu-order-number{min-width:110px;white-space:nowrap;color:#315b83}#purchase .qpu-detail header small{display:inline-block;margin-left:12px}#purchase .qpu-more .qpu-supplier{cursor:pointer}';document.head.append(extra);
const premium=document.createElement('style');premium.textContent=`
#purchase .page-head{padding-bottom:16px!important}
#purchase .module-shell{background:transparent!important;border:0!important;box-shadow:none!important;display:flex;flex-direction:column;gap:12px}
#purchase .module-toolbar{background:#fff!important;border:1px solid #dce6f1!important;border-radius:12px!important;padding:18px 20px!important;box-shadow:0 5px 18px rgba(25,48,83,.045)!important;gap:14px!important}
#purchase .module-toolbar .filters{row-gap:12px!important;column-gap:12px!important}
#purchase .module-toolbar .filters>.input,#purchase .qpu-more input,#purchase .qpu-more select{height:38px!important;border:1px solid #cedbeb!important;border-radius:7px!important;background:#fbfdff!important;font-size:12px!important}
#purchase .module-toolbar .filters>.search-input{min-width:230px!important;flex:1 1 230px!important;max-width:330px!important}
#purchase .module-toolbar .filters>input[type=date]{flex:0 1 160px!important}
#purchase .qpu-more{gap:10px!important}
#purchase .qpu-more label{font-size:12px!important;color:#344d67!important;gap:7px!important}
#purchase .qpu-more .btn{height:38px!important;padding:0 14px!important;border-radius:7px!important}
#purchase .module-toolbar .table-tools .btn{height:38px!important;border-radius:7px!important}
#purchase .module-body{min-height:160px!important;border:1px solid #dce6f1!important;border-radius:12px!important;overflow:auto!important;background:#fff!important;box-shadow:0 5px 18px rgba(25,48,83,.045)!important}
#purchase .module-body table{border-collapse:separate!important;border-spacing:0!important;width:100%!important}
#purchase .module-body th{background:#eaf2fb!important;color:#264566!important;font-weight:700!important;padding:13px 10px!important;white-space:nowrap!important;border-color:#dce6f1!important}
#purchase .module-body td{padding:12px 10px!important}
#purchase .qpu-detail{margin:0!important;background:#fff!important;border:1px solid #dce6f1!important;border-radius:12px!important;box-shadow:0 5px 18px rgba(25,48,83,.045)!important}
#purchase .qpu-detail header{background:#edf4fc!important;border-bottom:1px solid #dce6f1!important;padding:16px 20px!important;font-size:14px!important}
#purchase .qpu-detail th{background:#f1f6fc!important;color:#37536f!important}
#purchase .qpu-detail td{height:48px!important}
.qpu-popup{border-radius:12px!important;box-shadow:0 20px 50px rgba(19,45,83,.23)!important}
.qpu-popup .qpu-head{background:#eaf2fb!important;padding:14px 18px!important}
@media(max-width:1150px){#purchase .module-toolbar .filters>.search-input{max-width:none!important}#purchase .module-toolbar .table-tools{margin-left:0!important}}
`;document.head.append(premium);
const purchaseHeaderStyle=document.createElement('style');
purchaseHeaderStyle.textContent=`
#purchase .module-toolbar{position:relative!important;display:flex!important;align-items:center!important;gap:12px!important;padding:14px 16px!important}
#purchase .module-toolbar .filters{display:grid!important;grid-template-columns:minmax(170px,1.45fr) minmax(120px,1fr) minmax(120px,1fr) minmax(180px,1.25fr) minmax(115px,.8fr) auto auto!important;gap:9px!important;align-items:center!important;flex:1 1 auto!important;width:auto!important}
#purchase .module-toolbar .filters>.search-input{grid-column:1!important;width:100%!important;max-width:none!important;min-width:0!important}
#purchase .module-toolbar .filters>input[type=date]:nth-of-type(2){grid-column:2!important;width:100%!important;min-width:0!important}
#purchase .module-toolbar .filters>input[type=date]:nth-of-type(3){grid-column:3!important;width:100%!important;min-width:0!important}
#purchase .qpu-more{display:contents!important}
#purchase .qpu-more label{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important;white-space:nowrap!important;font-size:11px!important}
#purchase .qpu-more label:first-child{grid-column:4!important}
#purchase .qpu-more label:nth-child(2){grid-column:5!important}
#purchase .qpu-more label input{width:100%!important;min-width:0!important}
#purchase .qpu-more label select{width:100%!important;min-width:0!important}
#purchase .qpu-more .qpu-search{grid-column:6!important}
#purchase .qpu-more .qpu-clear{grid-column:7!important}
#purchase .module-toolbar .table-tools{display:flex!important;align-items:center!important;gap:7px!important;flex:0 0 auto!important;margin-left:auto!important}
@media(max-width:1450px){#purchase .module-toolbar .filters{grid-template-columns:repeat(3,minmax(125px,1fr))!important}#purchase .module-toolbar .filters>*{grid-column:auto!important}#purchase .qpu-more{display:contents!important}}
@media(max-width:900px){#purchase .module-toolbar{flex-wrap:wrap!important}#purchase .module-toolbar .filters{grid-template-columns:repeat(2,minmax(130px,1fr))!important}}
`;document.head.append(purchaseHeaderStyle);
const cleanLayout=document.createElement('style');cleanLayout.textContent=`
#purchase .module-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:start!important;gap:12px!important;padding:16px 18px!important}
#purchase .module-toolbar .filters{display:grid!important;grid-template-columns:minmax(190px,1fr) minmax(190px,1fr) minmax(190px,1fr) minmax(190px,1fr)!important;grid-template-rows:38px 38px!important;column-gap:18px!important;row-gap:11px!important;width:100%!important;max-width:none!important;align-items:center!important}
#purchase .module-toolbar .filters>.search-input{grid-column:1!important;grid-row:1!important;width:100%!important;max-width:none!important}
#purchase .module-toolbar .filters>.pcal-root{grid-column:1!important;grid-row:2!important;width:100%!important;max-width:none!important}
#purchase .module-toolbar .filters>input[type=date]{display:none!important}
#purchase .module-toolbar .qpu-more{display:contents!important}
#purchase .qpu-more label:first-child{grid-column:2!important;grid-row:1!important;display:flex!important;gap:8px!important}
#purchase .qpu-more label:nth-child(2){grid-column:3!important;grid-row:1!important;display:flex!important;gap:8px!important}
#purchase .qpu-more label input,#purchase .qpu-more label select{flex:1!important;min-width:0!important}
#purchase .qpu-more .qpu-clear{grid-column:3!important;grid-row:2!important;justify-self:end!important}
#purchase .qpu-more .qpu-search{grid-column:4!important;grid-row:2!important;justify-self:end!important;background:#2563eb!important;color:white!important}
#purchase .module-toolbar .table-tools{grid-column:2!important;grid-row:1!important;display:flex!important;align-self:start!important;gap:8px!important;margin:0!important}
@media(max-width:1100px){#purchase .module-toolbar{grid-template-columns:1fr!important}#purchase .module-toolbar .table-tools{grid-column:1!important;grid-row:2!important;justify-content:end!important}#purchase .module-toolbar .filters{grid-template-columns:repeat(2,minmax(150px,1fr))!important;grid-template-rows:auto!important}#purchase .module-toolbar .filters>.search-input,#purchase .module-toolbar .filters>.pcal-root,#purchase .qpu-more label:first-child,#purchase .qpu-more label:nth-child(2),#purchase .qpu-more .qpu-search,#purchase .qpu-more .qpu-clear{grid-column:auto!important;grid-row:auto!important}}
`;document.head.append(cleanLayout);
const alignmentFix=document.createElement('style');alignmentFix.textContent=`
#purchase .module-toolbar .filters{grid-template-columns:repeat(4,minmax(0,1fr))!important}
#purchase .qpu-more .qpu-clear{grid-column:3!important;grid-row:2!important;justify-self:end!important;margin-right:68px!important}
#purchase .qpu-more .qpu-search{grid-column:3!important;grid-row:2!important;justify-self:end!important}
#purchase .qpu-popup footer{flex-shrink:0!important;min-height:48px!important;align-items:center!important;gap:10px!important;padding:10px 16px!important}
#purchase .qpu-popup .qpu-list{min-height:80px!important}
.qpu-popup{box-sizing:border-box!important;min-width:420px!important;min-height:340px!important;overflow:hidden!important}
.qpu-popup .qpu-list{min-height:0!important}
.qpu-popup footer{box-sizing:border-box!important;flex-shrink:0!important;background:#f8fbff!important}
.qpu-popup .qpu-head button{cursor:pointer!important}
@media(max-width:1100px){#purchase .qpu-more .qpu-clear,#purchase .qpu-more .qpu-search{grid-column:auto!important;grid-row:auto!important;margin-right:0!important}}
`;document.head.append(alignmentFix);
const supplierDropdownStyle=document.createElement('style');supplierDropdownStyle.textContent='.qpu-popup{position:fixed!important;display:flex!important;flex-direction:column!important;width:260px!important;height:300px!important;min-width:0!important;min-height:0!important;max-width:calc(100vw - 16px)!important;max-height:calc(100vh - 16px)!important;resize:none!important;overflow:hidden!important;border-radius:5px!important}.qpu-popup[hidden]{display:none!important}.qpu-popup .qpu-head{min-height:34px!important;padding:7px 10px!important;cursor:default!important}.qpu-popup .qpu-find{box-sizing:border-box!important;width:calc(100% - 16px)!important;height:30px!important;margin:8px!important;padding:5px!important}.qpu-popup .qpu-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;margin:0 8px!important}.qpu-popup .qpu-list label{display:flex!important;align-items:center!important;gap:8px!important;padding:7px!important;font-size:12px!important;white-space:nowrap!important}.qpu-popup .qpu-list input{width:14px!important;height:14px!important;flex:0 0 14px!important}.qpu-popup footer{display:flex!important;justify-content:flex-end!important;gap:5px!important;min-height:36px!important;padding:5px 8px!important}.qpu-popup footer button{font-size:11px!important;padding:4px 9px!important}';document.head.append(supplierDropdownStyle);
const matchWorkStyle=document.createElement('style');matchWorkStyle.textContent=`
#purchase .page-head{background:#fff!important;border:1px solid #d2dfed!important;border-radius:10px 10px 0 0!important;margin-bottom:0!important;padding:17px 22px!important}
#purchase .page-head h1{color:#173b61!important;font-size:18px!important;font-weight:800!important}
#purchase .module-toolbar{background:#f3f7fb!important;border:1px solid #dae5ef!important;border-radius:0 0 10px 10px!important;box-shadow:none!important}
#purchase .module-toolbar .filters>.input,#purchase .module-toolbar input,#purchase .module-toolbar select,#purchase .pcal-trigger{background:#fff!important;border:1px solid #c7d6e5!important;color:#243e5d!important;border-radius:7px!important;font-size:12.5px!important}
#purchase .module-toolbar .btn{border-radius:7px!important;font-weight:700!important}
#purchase .module-toolbar .btn.primary,#purchase .qpu-more .qpu-search{background:#166fbb!important;border-color:#166fbb!important;color:#fff!important}
#purchase .module-body{border:1px solid #d0dcea!important;border-radius:8px!important;box-shadow:none!important}
#purchase .module-body thead th{background:#e6eff8!important;color:#254665!important;border-color:#d0dcea!important}
#purchase .qpu-detail{border:1px solid #d0dcea!important;border-radius:9px!important;box-shadow:none!important}
#purchase .qpu-detail header{background:#edf3f9!important;color:#1e3f64!important;border-color:#d0dcea!important}
#purchase .qpu-detail th{background:#e6eff8!important;color:#254665!important;border-color:#d0dcea!important}
.qpu-popup .qpu-head{background:#edf3f9!important;color:#173b61!important}
`;document.head.append(matchWorkStyle);
const singleRowLayout=document.createElement('style');singleRowLayout.textContent=`
#purchase .module-toolbar{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:nowrap!important;padding:13px 15px!important}
#purchase .module-toolbar .filters{display:grid!important;grid-template-columns:minmax(190px,1.35fr) minmax(180px,1.05fr) minmax(180px,1fr) minmax(145px,.85fr) auto auto!important;grid-template-rows:38px!important;gap:10px!important;align-items:center!important;flex:1 1 auto!important;min-width:0!important;width:auto!important}
#purchase .module-toolbar .filters>.search-input{grid-column:1!important;grid-row:1!important;width:100%!important}
#purchase .module-toolbar .filters>.pcal-root{grid-column:3!important;grid-row:1!important;width:100%!important;max-width:none!important;justify-self:stretch!important}
#purchase .qpu-more label:first-child{grid-column:2!important;grid-row:1!important;min-width:0!important}
#purchase .qpu-more label:nth-child(2){grid-column:4!important;grid-row:1!important;min-width:0!important}
#purchase .qpu-more .qpu-clear{grid-column:5!important;grid-row:1!important;margin:0!important;justify-self:auto!important}
#purchase .qpu-more .qpu-search{grid-column:6!important;grid-row:1!important;margin:0!important;justify-self:auto!important}
#purchase .module-toolbar .table-tools{display:flex!important;align-items:center!important;gap:7px!important;flex:0 0 auto!important;margin:0 0 0 auto!important}
#purchase .module-toolbar .filters>input[type=date]{display:none!important}
@media(max-width:1250px){#purchase .module-toolbar{flex-wrap:wrap!important}#purchase .module-toolbar .filters{flex-basis:100%!important}#purchase .module-toolbar .table-tools{margin-left:auto!important}}
@media(max-width:900px){#purchase .module-toolbar .filters{grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:auto!important}#purchase .module-toolbar .filters>.search-input,#purchase .module-toolbar .filters>.pcal-root,#purchase .qpu-more label:first-child,#purchase .qpu-more label:nth-child(2),#purchase .qpu-more .qpu-clear,#purchase .qpu-more .qpu-search{grid-column:auto!important;grid-row:auto!important}}
`;document.head.append(singleRowLayout);
const trimmedControls=document.createElement('style');trimmedControls.textContent='#purchase .page-head .date-badge,#purchase .qpu-more .qpu-clear,#purchase .qpu-more .qpu-search{display:none!important}#purchase .module-toolbar .filters{grid-template-columns:minmax(180px,1.35fr) minmax(170px,1.1fr) minmax(180px,1fr) minmax(145px,.85fr)!important}';document.head.append(trimmedControls);
new MutationObserver(init).observe(document.body,{childList:true,subtree:true});init();
})();